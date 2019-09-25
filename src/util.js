'use strict';

const { readFile } = require('fs').promises;
const path = require('path');

const readHtml = async htmlPath => {
  const html = await readFile(htmlPath, 'utf-8');
  return html.replace(
    /script src="([^"]*)"/g,
    (_, src) => `script src="vscode-resource:${path.resolve(htmlPath, '..', src)}"`
  );
};

module.exports = { readHtml };
