const vscode = acquireVsCodeApi();

const $ = (q, c = document) => c.querySelector(q);
const $$ = (q, c = document) => Array.from(c.querySelectorAll(q));

const snippetContainerNode = $('#snippet-container');
const windowNode = $('#window');
const navbarNode = $('#navbar');
const snippetNode = $('#snippet');
const btnSave = $('#save');

let config;

const setVar = (key, value, node = document.body) => node.style.setProperty('--' + key, value);

const calcTextWidth = text => {
  const div = document.body.appendChild(document.createElement('div'));
  div.classList.add('size-test');
  div.textContent = text;
  const width = div.clientWidth;
  div.remove();
  return width + 1 + 'px';
};

const setupLines = node => {
  $$(':scope > br', node).forEach(row => (row.outerHTML = '<div>&nbsp;</div>'));

  const rows = $$(':scope > div', node);
  setVar('line-number-width', calcTextWidth(rows.length + config.startLine));

  rows.forEach((row, idx) => {
    const newRow = document.createElement('div');
    newRow.classList.add('line');
    row.replaceWith(newRow);

    if (config.showLineNumbers) {
      const lineNum = document.createElement('div');
      lineNum.classList.add('line-number');
      lineNum.textContent = idx + 1 + config.startLine;
      newRow.appendChild(lineNum);
    }

    row.classList.add('line-code');
    newRow.appendChild(row);
  });
};

const stripInitialIndent = node => {
  const regIndent = /^\s+/;
  const initialSpans = $$(':scope > div > span:first-child', node);
  if (initialSpans.some(span => !regIndent.test(span.textContent))) return;
  const minIndent = Math.min(
    ...initialSpans.map(span => span.textContent.match(regIndent)[0].length)
  );
  initialSpans.forEach(span => (span.textContent = span.textContent.slice(minIndent)));
};

const getClipboardHtml = clip => {
  const html = clip.getData('text/html');
  if (html) return html;
  const text = clip
    .getData('text/plain')
    .split('\n')
    .map(line => `<div>${line}</div>`)
    .join('');
  return `<div>${text}</div>`;
};

const pasteCode = clipboard => {
  snippetNode.innerHTML = getClipboardHtml(clipboard);
  const code = $('div', snippetNode);
  snippetNode.style.lineHeight = code.style.lineHeight;
  snippetNode.innerHTML = code.innerHTML;
  stripInitialIndent(snippetNode);
  setupLines(snippetNode);
};

const takeSnap = async (type = 'save') => {
  windowNode.style.resize = 'none';
  if (config.transparentBackground || config.target === 'window') {
    setVar('container-background-color', 'transparent');
  }

  const url = await domtoimage.toPng(
    config.target === 'container' ? snippetContainerNode : windowNode,
    { bgColor: 'transparent' }
  );
  vscode.postMessage({ type, data: url.slice(url.indexOf(',') + 1) });

  windowNode.style.resize = 'horizontal';
  setVar('container-background-color', config.backgroundColor);
};

btnSave.addEventListener('click', () => takeSnap());

document.addEventListener('copy', () => takeSnap('copy'));

document.addEventListener('paste', e => pasteCode(e.clipboardData));

window.addEventListener('message', e => {
  if (e.data.type === 'update') {
    config = e.data;

    const {
      enableLigatures,
      tabSize,
      backgroundColor,
      boxShadow,
      containerPadding,
      roundedCorners,
      showWindowControls
    } = config;

    setVar('ligatures', enableLigatures ? 'normal' : 'none');
    setVar('tab-size', tabSize);
    setVar('container-background-color', backgroundColor);
    setVar('box-shadow', boxShadow);
    setVar('container-padding', containerPadding);
    setVar('window-border-radius', roundedCorners ? '4px' : 0);

    navbarNode.hidden = !showWindowControls;

    document.execCommand('paste');
  }
});
