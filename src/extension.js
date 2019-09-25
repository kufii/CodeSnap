'use strict';

const vscode = require('vscode');
const path = require('path');
const { readHtml, getColorsForTheme } = require('./util');

const defaultThemeLineColors = {
	'Visual Studio Dark': '#858585',
	'Default Dark+': '#858585',
	'Visual Studio Light': '#237893',
	'Default Light+': '#237893',
	'Default High Contrast': '#FFFFFF'
};

const getConfig = async () => {
	const editorSettings = vscode.workspace.getConfiguration('editor', null);
	const fontFamily = editorSettings.get('fontFamily', 'monospace');
	const enableLigatures = editorSettings.get('fontLigatures', false);

	const theme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	const colors =
		theme && defaultThemeLineColors[theme]
			? new Map([['editorLineNumber.foreground', defaultThemeLineColors[theme]]])
			: await getColorsForTheme(theme);
	const lineNumberColor =
		colors &&
		(colors.get('editorLineNumber.foreground') ||
			colors.get('editorLineNumber.activeForeground'));

	return { fontFamily, enableLigatures, lineNumberColor };
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

			const update = async () => {
				vscode.commands.executeCommand('editor.action.clipboardCopyAction');
				panel.postMessage({ type: 'update', ...(await getConfig()) });
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
