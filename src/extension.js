'use strict';

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stripJsonComments = require('strip-json-comments');

const readFile = promisify(fs.readFile);

const readHtml = async htmlPath => {
	const html = await readFile(htmlPath, 'utf-8');
	return html.replace(/script src="([^"]*)"/g, (_, src) => {
		const realSource = 'vscode-resource:' + path.resolve(htmlPath, '..', src);
		return `script src="${realSource}"`;
	});
};

const getConfig = async () => {
	const editorSettings = vscode.workspace.getConfiguration('editor', null);
	const fontFamily = editorSettings.get('fontFamily', 'monospace');
	const enableLigatures = editorSettings.get('fontLigatures', false);

	const theme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	const colors = theme && (await getColorsForTheme(theme));
	const lineNumberColor =
		colors &&
		(colors.get('editorLineNumber.foreground') ||
			colors.get('editorLineNumber.activeForeground'));

	console.log(theme, lineNumberColor);

	return { fontFamily, enableLigatures, lineNumberColor };
};

const getColorsForTheme = async themeName => {
	const colors = new Map();

	if (
		[
			'Visual Studio Dark',
			'Default Dark+',
			'Visual Studio Light',
			'Default Light+',
			'Default High Contrast'
		].includes(themeName)
	) {
		// Can't get default theme colors programmatically
		colors.set(
			'editorLineNumber.foreground',
			themeName.includes('Dark')
				? '#858585'
				: themeName.includes('Light')
				? '#237893'
				: '#FFFFFF'
		);
		return colors;
	}

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
		let theme = await readFile(themePath, 'utf-8');
		if (theme) {
			theme = JSON.parse(stripJsonComments(theme));
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
