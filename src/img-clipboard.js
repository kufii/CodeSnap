'use strict';

const tempWrite = require('temp-write');
const { exec } = require('child_process');

const { isWayland } = require('./util');

const run = cmd => new Promise(done => exec(cmd, { cwd: __dirname }, (...args) => done(args)));

const copyLinux = file =>
  run(isWayland() ? `wl-copy < "${file}"` : `xclip -sel clip -t image/png -i "${file}"`);

const copyOsx = file => run(`./scripts/osx-copy-image "${file}"`);

const copyWindows = file =>
  run(`powershell.exe -ExecutionPolicy Bypass ./scripts/copy-image.ps1 "${file}"`);

module.exports.copyImg = img => {
  const file = tempWrite.sync(img, 'code.png');
  return process.platform === 'win32'
    ? copyWindows(file)
    : process.platform === 'darwin'
    ? copyOsx(file)
    : copyLinux(file);
};
