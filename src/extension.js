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

	const theme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	const colors = theme && getColorsForTheme(theme);
	const lineNumberColor = colors && colors.get('editorLineNumber.foreground');

	return { fontFamily, enableLigatures, lineNumberColor };
};

const getColorsForTheme = themeName => {
	const colors = new Map();
	let currentThemePath;
	for (const extension of vscode.extensions.all) {
		const themes =
			extension.packageJSON.contributes && extension.packageJSON.contributes.themes;
		const currentTheme = themes && themes.find(theme => theme.label === themeName);
		if (currentTheme) {
			currentThemePath = path.join(extension.extensionPath, currentTheme.path);
			break;
		}
	}
	const themePaths = [];
	if (currentThemePath) {
		themePaths.push(currentThemePath);
	}
	while (themePaths.length > 0) {
		const themePath = themePaths.pop();
		const theme = require(themePath); // eslint-disable-line
		console.log(themePath, theme);
		if (theme) {
			if (theme.include) {
				themePaths.push(path.join(path.dirname(themePath), theme.include));
			}
			if (theme.colors) {
				Object.entries(theme.colors).forEach(
					([key, value]) => !colors.has(key) && colors.set(key, value)
				);
			}
		}
	}
	return colors;
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
