const $ = (q, c = document) => c.querySelector(q);
const $$ = (q, c = document) => Array.from(c.querySelectorAll(q));

const snippetNode = $('#snippet');

const regIndent = /^\s+/;

const calcTextWidth = text => {
  const div = document.body.appendChild(document.createElement('div'));
  div.classList.add('size-test');
  div.textContent = text;
  const width = div.clientWidth;
  div.remove();
  return width + 1 + 'px';
};

const addLineNumbers = node => {
  $$(':scope > br', node).forEach(row => (row.outerHTML = '<div>&nbsp;</div>'));
  const rows = $$(':scope > div', node);
  node.style.setProperty('--line-number-width', calcTextWidth(rows.length));
  rows.forEach(row => {
    const div = document.createElement('div');
    row.replaceWith(div);
    div.appendChild(row);
  });
};

const stripInitialIndent = node => {
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

document.addEventListener('paste', e => {
  snippetNode.innerHTML = getClipboardHtml(e.clipboardData);
  snippetNode.innerHTML = snippetNode.firstElementChild.innerHTML;
  stripInitialIndent(snippetNode);
  addLineNumbers(snippetNode);
});

window.addEventListener('message', e => {
  if (e.data.type === 'update') {
    const { enableLigatures, tabSize, enableLineNumbers = true } = e.data;
    snippetNode.style.fontVariantLigatures = enableLigatures ? 'normal' : 'none';
    snippetNode.style.tabSize = tabSize;
    snippetNode.classList[enableLineNumbers ? 'add' : 'remove']('has-line-numbers');
    document.execCommand('paste');
  }
});
