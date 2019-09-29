'use strict';

const vscode = require('vscode');
const path = require('path');
const { homedir } = require('os');
const { readHtml, writeFile } = require('./util');
const { copyImg } = require('./img-clipboard');

const getConfig = () => {
  const editorSettings = vscode.workspace.getConfiguration('editor', null);
  const extensionSettings = vscode.workspace.getConfiguration('codesnap', null);

  const enableLigatures = editorSettings.get('fontLigatures', false);
  const editor = vscode.window.activeTextEditor;
  const tabSize = editor ? editor.options.tabSize : editorSettings.get('tabSize', 4);

  const backgroundColor = extensionSettings.get('backgroundColor', '#abb8c3');
  const boxShadow = extensionSettings.get('boxShadow', 'rgba(0, 0, 0, 0.55) 0px 20px 68px');
  const containerPadding = extensionSettings.get('containerPadding', '3em');
  const roundedCorners = extensionSettings.get('roundedCorners', true);
  const showWindowControls = extensionSettings.get('showWindowControls', true);
  const showLineNumbers = extensionSettings.get('showLineNumbers', true);
  const realLineNumbers = extensionSettings.get('realLineNumbers', false);
  const selection = editor && editor.selection;
  const startLine = realLineNumbers ? (selection ? selection.start.line : 0) : 0;
  const transparentBackground = extensionSettings.get('transparentBackground', false);
  const target = extensionSettings.get('target', 'container');

  return {
    enableLigatures,
    tabSize,
    backgroundColor,
    boxShadow,
    containerPadding,
    roundedCorners,
    showWindowControls,
    showLineNumbers,
    startLine,
    transparentBackground,
    target
  };
};

const createPanel = async context => {
  const html = await readHtml(path.resolve(context.extensionPath, 'webview/index.html'));

  const panel = vscode.window.createWebviewPanel('codesnap', 'CodeSnap 📸', vscode.ViewColumn.Two, {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.file(context.extensionPath)]
  });
  panel.webview.html = html;

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
  if (err) {
    if (err.code === 127 && process.platform === 'linux')
      vscode.window.showErrorMessage('CodeSnap: xclip is not installed');
    else vscode.window.showErrorMessage('CodeSnap: ' + stdout + stderr);
  }
};

const hasOneSelection = selections =>
  selections && selections.length === 1 && !selections[0].isEmpty;

const runCommand = async context => {
  const panel = await createPanel(context);

  const update = () => {
    vscode.commands.executeCommand('editor.action.clipboardCopyAction');
    panel.postMessage({ type: 'update', ...getConfig() });
  };

  panel.webview.onDidReceiveMessage(({ type, data }) =>
    type === 'save' ? saveImage(data) : copyImage(data)
  );

  const selectionHandler = vscode.window.onDidChangeTextEditorSelection(
    e => hasOneSelection(e.selections) && update()
  );
  panel.onDidDispose(() => selectionHandler.dispose());

  const editor = vscode.window.activeTextEditor;
  const selections = editor && editor.selections;
  hasOneSelection(selections) && update();
};

module.exports.activate = context => {
  context.subscriptions.push(
    vscode.commands.registerCommand('codesnap.start', () => runCommand(context))
  );
};
