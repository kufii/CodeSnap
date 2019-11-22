import { $, setVar } from './util.js';
import { pasteCode } from './code.js';
import { takeSnap, cameraFlashAnimation } from './snap.js';

const navbarNode = $('#navbar');
const windowTitleNode = $('#window-title');
const btnSave = $('#save');

let config;

btnSave.addEventListener('click', () => takeSnap(config));

document.addEventListener('copy', () => takeSnap(config, 'copy'));

document.addEventListener('paste', e => pasteCode(config, e.clipboardData));

window.addEventListener('message', ({ data: { type, ...cfg } }) => {
  if (type === 'update') {
    config = cfg;

    const {
      fontLigatures,
      tabSize,
      backgroundColor,
      boxShadow,
      containerPadding,
      roundedCorners,
      showWindowControls,
      windowTitle
    } = config;

    setVar('ligatures', fontLigatures ? 'normal' : 'none');
    setVar('tab-size', tabSize);
    setVar('container-background-color', backgroundColor);
    setVar('box-shadow', boxShadow);
    setVar('container-padding', containerPadding);
    setVar('window-border-radius', roundedCorners ? '4px' : 0);

    navbarNode.hidden = !showWindowControls;
    windowTitleNode.textContent = windowTitle;

    document.execCommand('paste');
  } else if (type === 'flash') {
    cameraFlashAnimation();
  }
});
