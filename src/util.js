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

const isEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return a == null && b == null;
  const ak = Object.keys(a);
  if (ak.length !== Object.keys(b).length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
};

module.exports = { readHtml, isEqual, writeFile };
