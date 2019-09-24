'use strict';

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

const readHtml = async htmlPath => {
	const html = await readFile(htmlPath, 'utf-8');
	return html.replace(/script src="([^"]*)"/g, (_, src) => {
		const realSource = 'vscode-resource:' + path.resolve(htmlPath, '..', src);
		return `script src="${realSource}"`;
	});
};

const getConfig = () => {
	const editorSettings = vscode.workspace.getConfiguration('editor', null);
	const fontFamily = editorSettings.get('fontFamily', 'monospace');
	const enableLigatures = editorSettings.get('fontLigatures', false);
	return { fontFamily, enableLigatures };
};

module.exports.activate = context => {
	context.subscriptions.push(
		vscode.commands.registerCommand('codesnap.start', async () => {
			const html = await readHtml(path.resolve(context.extensionPath, 'webview/index.html'));

			const panel = vscode.window.createWebviewPanel(
				'codesnap',
				'CodeSnap 📸',
				vscode.ViewColumn.Two,
				{ enableScripts: true }
			);
			panel.webview.html = html;

			const update = () => {
				vscode.commands.executeCommand('editor.action.clipboardCopyAction');
				panel.postMessage({ type: 'update', ...getConfig() });
			};
			update();

			const selectionHandler = vscode.window.onDidChangeTextEditorSelection(e => {
				if (!e.selections[0] || e.selections[0].isEmpty) return;
				update();
			});
			panel.onDidDispose(() => selectionHandler.dispose());
		})
	);
};
