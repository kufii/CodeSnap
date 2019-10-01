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
  return keys.reduce((acc, k) => ((acc[k] = settings.get(k)), acc), {});
};

const isWayland = () => process.env.XDG_SESSION_TYPE === 'wayland';

module.exports = { readHtml, writeFile, getSettings, isWayland };
