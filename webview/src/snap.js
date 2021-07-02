import { $, $$, redraw, once, setVar } from './util.js';

const vscode = acquireVsCodeApi();
const windowNode = $('#window');
const snippetContainerNode = $('#snippet-container');

const flashFx = $('#flash-fx');

const SNAP_SCALE = 2;

export const cameraFlashAnimation = async () => {
  flashFx.style.display = 'block';
  redraw(flashFx);
  flashFx.style.opacity = '0';
  await once(flashFx, 'transitionend');
  flashFx.style.display = 'none';
  flashFx.style.opacity = '1';
};

export const takeSnap = async (config) => {
  windowNode.style.resize = 'none';
  if (config.transparentBackground || config.target === 'window') {
    setVar('container-background-color', 'transparent');
  }

  const target = config.target === 'container' ? snippetContainerNode : windowNode;

  const url = await domtoimage.toPng(target, {
    bgColor: 'transparent',
    scale: SNAP_SCALE,
    postProcess: (node) => {
      $$('#snippet-container, #snippet, .line, .line-code span', node).forEach(
        (span) => (span.style.width = 'unset')
      );
      $$('.line-code', node).forEach((span) => (span.style.width = '100%'));
    }
  });

  const data = url.slice(url.indexOf(',') + 1);
  if (config.shutterAction === 'copy') {
    const binary = atob(data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    const blob = new Blob([array], { type: 'image/png' });
    navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    cameraFlashAnimation();
  } else {
    vscode.postMessage({ type: config.shutterAction, data });
  }

  windowNode.style.resize = 'horizontal';
  setVar('container-background-color', config.backgroundColor);
};
