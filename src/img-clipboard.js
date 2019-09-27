'use strict';

const tempWrite = require('temp-write');
const { exec } = require('child_process');

const copyLinux = img => null; // eslint-disable-line

const copyOsx = img => null; // eslint-disable-line

const copyWindows = img => {
  const file = tempWrite.sync(img, 'code.png');
  exec(`powershell.exe -ExecutionPolicy Bypass ./scripts/copy-image.ps1 "${file}"`, {
    cwd: __dirname
  });
};

module.exports.copyImg = img =>
  process.platform === 'win32'
    ? copyWindows(img)
    : process.platform === 'darwin'
    ? copyOsx(img)
    : copyLinux(img);
