'use strict';

const fs = require('fs');
const { promisify } = require('util');
const path = require('path');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const readHtml = async htmlPath => {
  const html = await readFile(htmlPath, 'utf-8');
  return html.replace(/script src="([^"]*)"/g, (_, src) => {
    const realSource = 'vscode-resource:' + path.resolve(htmlPath, '..', src);
    return `script src="${realSource}"`;
  });
};

module.exports = {
  readFile,
  writeFile,
  readHtml
};
