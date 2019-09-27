'use strict';

const tempWrite = require('temp-write');
const { exec } = require('child_process');

const copyLinux = file => exec(`xclip -sel clip -t image/png -i "${file}"`);

const copyOsx = file => null; // eslint-disable-line

const copyWindows = file =>
  exec(`powershell.exe -ExecutionPolicy Bypass ./scripts/copy-image.ps1 "${file}"`, {
    cwd: __dirname
  });

module.exports.copyImg = img => {
  const file = tempWrite.sync(img, 'code.png');
  return process.platform === 'win32'
    ? copyWindows(file)
    : process.platform === 'darwin'
    ? copyOsx(file)
    : copyLinux(file);
};
