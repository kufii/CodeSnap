'use strict';

const vscode = require('vscode');
const path = require('path');
const { readHtml, isEqual, writeFile } = require('./util');

const getConfig = () => {
  const editorSettings = vscode.workspace.getConfiguration('editor', null);
  const extensionSettings = vscode.workspace.getConfiguration('codesnap', null);

  const enableLigatures = editorSettings.get('fontLigatures', false);
  const editor = vscode.window.activeTextEditor;
  const tabSize = editor ? editor.options.tabSize : editorSettings.get('tabSize', 4);

  const backgroundColor = extensionSettings.get('backgroundColor', '#abb8c3');
  const boxShadow = extensionSettings.get('boxShadow', 'rgba(0, 0, 0, 0.3) 0px 15px 30px');
  const containerPadding = extensionSettings.get('containerPadding', '3em');
  const showWindowControls = extensionSettings.get('showWindowControls', true);
  const showLineNumbers = extensionSettings.get('showLineNumbers', true);
  const realLineNumbers = extensionSettings.get('realLineNumbers', false);
  const selection = editor && editor.selection;
  const startLine = realLineNumbers ? (selection ? selection.start.line : 0) : 0;

  return {
    enableLigatures,
    tabSize,
    backgroundColor,
    boxShadow,
    containerPadding,
    showWindowControls,
    showLineNumbers,
    startLine
  };
};

module.exports.activate = context => {
  context.subscriptions.push(
    vscode.commands.registerCommand('codesnap.start', async () => {
      const html = await readHtml(path.resolve(context.extensionPath, 'webview/index.html'));

      const panel = vscode.window.createWebviewPanel(
        'codesnap',
        'CodeSnap 📸',
        vscode.ViewColumn.Two,
        { enableScripts: true, localResourceRoots: [vscode.Uri.file(context.extensionPath)] }
      );
      panel.webview.onDidReceiveMessage(async ({ type, data }) => {
        if (type === 'save') {
          const uri = await vscode.window.showSaveDialog({ filters: { Images: ['png'] } });
          if (uri) writeFile(uri.fsPath, Buffer.from(data, 'base64'));
        }
      });
      panel.webview.html = html;

      const update = () => {
        vscode.commands.executeCommand('editor.action.clipboardCopyAction');
        panel.postMessage({ type: 'update', ...getConfig() });
      };

      const editor = vscode.window.activeTextEditor;
      const selection = editor && editor.selection;
      if (selection && !isEqual(selection.start, selection.end)) {
        update();
      }

      const selectionHandler = vscode.window.onDidChangeTextEditorSelection(e => {
        if (!e.selections[0] || e.selections[0].isEmpty) return;
        update();
      });
      panel.onDidDispose(() => selectionHandler.dispose());
    })
  );
};
