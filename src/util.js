'use strict';

const vscode = require('vscode');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const JSON5 = require('json5');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const memo = (fn, cache = {}) => x => cache[x] || (cache[x] = fn(x));

const readHtml = async htmlPath => {
	const html = await readFile(htmlPath, 'utf-8');
	return html.replace(/script src="([^"]*)"/g, (_, src) => {
		const realSource = 'vscode-resource:' + path.resolve(htmlPath, '..', src);
		return `script src="${realSource}"`;
	});
};

const getColorsForTheme = memo(async themeName => {
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
		let theme = await readFile(themePath, 'utf-8');
		if (theme) {
			theme = JSON5.parse(theme);
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
});

module.exports = {
	readFile,
	writeFile,
	memo,
	readHtml,
	getColorsForTheme
};
