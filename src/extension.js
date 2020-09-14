'use strict';

const vscode = require('vscode');
const path = require('path');
const { homedir } = require('os');
const { readHtml, writeFile, getSettings } = require('./util');
const { copyImg, isWayland, ErrorCodes } = require('img-clipboard');

const getConfig = () => {
  const editorSettings = getSettings('editor', ['fontLigatures', 'tabSize']);
  const editor = vscode.window.activeTextEditor;
  if (editor) editorSettings.tabSize = editor.options.tabSize;

  const extensionSettings = getSettings('codesnap', [
    'backgroundColor',
    'boxShadow',
    'containerPadding',
    'roundedCorners',
    'showWindowControls',
    'showWindowTitle',
    'showLineNumbers',
    'realLineNumbers',
    'transparentBackground',
    'target'
  ]);

  const selection = editor && editor.selection;
  const startLine = extensionSettings.realLineNumbers ? (selection ? selection.start.line : 0) : 0;

  let windowTitle = '';
  if (editor && extensionSettings.showWindowTitle) {
    const activeFileName = editor.document.uri.path.split('/').pop();
    windowTitle = `${vscode.workspace.name} - ${activeFileName}`;
  }

  return {
    ...editorSettings,
    ...extensionSettings,
    startLine,
    windowTitle
  };
};

const createPanel = async context => {
  const panel = vscode.window.createWebviewPanel('codesnap', 'CodeSnap 📸', vscode.ViewColumn.Two, {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.file(context.extensionPath)]
  });
  panel.webview.html = await readHtml(
    path.resolve(context.extensionPath, 'webview/index.html'),
    panel
  );

  return panel;
};

let lastUsedImageUri = vscode.Uri.file(path.resolve(homedir(), 'Desktop/code.png'));
const saveImage = async data => {
  const uri = await vscode.window.showSaveDialog({
    filters: { Images: ['png'] },
    defaultUri: lastUsedImageUri
  });
  lastUsedImageUri = uri;
  uri && writeFile(uri.fsPath, Buffer.from(data, 'base64'));
};

const copyImage = async data => {
  const [err, stdout, stderr] = await copyImg(Buffer.from(data, 'base64'));
  if (!err) return;
  if (err.code === ErrorCodes.COMMAND_NOT_FOUND && process.platform === 'linux')
    vscode.window.showErrorMessage(
      `CodeSnap: ${isWayland() ? 'wl-clipboard' : 'xclip'} is not installed`
    );
  else vscode.window.showErrorMessage('CodeSnap: ' + stdout + stderr);
};

const hasOneSelection = selections =>
  selections && selections.length === 1 && !selections[0].isEmpty;

const runCommand = async context => {
  const panel = await createPanel(context);

  const update = () => {
    vscode.commands.executeCommand('editor.action.clipboardCopyAction');
    panel.webview.postMessage({ type: 'update', ...getConfig() });
  };

  const flash = () => panel.webview.postMessage({ type: 'flash' });

  panel.webview.onDidReceiveMessage(async ({ type, data }) => {
    if (type === 'save') {
      flash();
      await saveImage(data);
    } else if (type === 'copy') {
      await copyImage(data);
      flash();
    }
  });

  const selectionHandler = vscode.window.onDidChangeTextEditorSelection(
    e => hasOneSelection(e.selections) && update()
  );
  panel.onDidDispose(() => selectionHandler.dispose());

  const editor = vscode.window.activeTextEditor;
  if (editor && hasOneSelection(editor.selections)) update();
};

module.exports.activate = context =>
  context.subscriptions.push(
    vscode.commands.registerCommand('codesnap.start', () => runCommand(context))
  );
