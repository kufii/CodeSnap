'use strict';

const { readFile, writeFile } = require('fs').promises;
const path = require('path');

const readHtml = async htmlPath => {
  const html = await readFile(htmlPath, 'utf-8');
  return html.replace(
    /<(script src|link rel="stylesheet" href)="([^"]*)"/g,
    (_, type, src) => `<${type}="vscode-resource:${path.resolve(htmlPath, '..', src)}"`
  );
};

module.exports = { readHtml, writeFile };
