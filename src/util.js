'use strict';

const vscode = require('vscode');

const { readFile, writeFile } = require('fs').promises;
const path = require('path');

const readHtml = async htmlPath => {
  const html = await readFile(htmlPath, 'utf-8');
  return html.replace(
    /<(script src|link rel="stylesheet" href)="([^"]*)"/g,
    (_, type, src) => `<${type}="vscode-resource:${path.resolve(htmlPath, '..', src)}"`
  );
};

const getSettings = (group, keys) => {
  const settings = vscode.workspace.getConfiguration(group, null);
  const editor = vscode.window.activeTextEditor;
  const language = editor && editor.document && editor.document.languageId;
  const languageSettings = language && vscode.workspace.getConfiguration().get(`[${language}]`);
  return keys.reduce((acc, k) => {
    acc[k] = languageSettings && languageSettings[`${group}.${k}`];
    if (acc[k] == null) acc[k] = settings.get(k);
    return acc;
  }, {});
};

module.exports = { readHtml, writeFile, getSettings };
