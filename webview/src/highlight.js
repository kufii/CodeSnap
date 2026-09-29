import { $, $$ } from './util.js';

const snippetNode = $('#snippet');
const toolbarNode = $('#highlight-toolbar');
const countNode = $('#highlight-count');

export const HIGHLIGHT_STYLES = ['line-focus', 'git-add', 'git-remove'];
export const SELECTED = 'line-selected';
const KEYS = { f: 'line-focus', a: 'git-add', r: 'git-remove' };

let anchor = null;
let dragging = false;

const getLines = () => $$('.line', snippetNode);
const getSelected = () => $$(`.${SELECTED}`, snippetNode);

const updateToolbar = () => {
  const count = getSelected().length;
  toolbarNode.hidden = count === 0;
  countNode.textContent = count === 1 ? '1 line' : `${count} lines`;
};

const selectRange = (from, to) => {
  const lines = getLines();
  const [start, end] = [lines.indexOf(from), lines.indexOf(to)].sort((a, b) => a - b);
  lines.forEach((line, idx) => line.classList.toggle(SELECTED, idx >= start && idx <= end));
  updateToolbar();
};

export const clearSelection = () => {
  getSelected().forEach((line) => line.classList.remove(SELECTED));
  anchor = null;
  updateToolbar();
};

const applyStyle = (style) => {
  const selected = getSelected();
  // Applying the style every selected line already has toggles it off
  const toggleOff = style && selected.every((line) => line.classList.contains(style));
  selected.forEach((line) => {
    line.classList.remove(...HIGHLIGHT_STYLES);
    if (style && !toggleOff) line.classList.add(style);
  });
};

const onPointerDown = (e) => {
  const line = e.target.closest('.line');
  if (!line || e.button !== 0) return;
  e.preventDefault();

  if (e.shiftKey && anchor) {
    selectRange(anchor, line);
  } else if (e.ctrlKey || e.metaKey) {
    line.classList.toggle(SELECTED);
    anchor = line;
    updateToolbar();
  } else {
    dragging = true;
    anchor = line;
    selectRange(line, line);
  }
};

const onPointerOver = (e) => {
  const line = dragging && e.target.closest('.line');
  if (line) selectRange(anchor, line);
};

const onKeyDown = (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || !getSelected().length) return;
  const key = e.key.toLowerCase();
  if (KEYS[key]) applyStyle(KEYS[key]);
  else if (key === 'backspace' || key === 'delete') applyStyle(null);
  else if (key === 'escape') clearSelection();
  else return;
  e.preventDefault();
};

export const setupHighlight = () => {
  snippetNode.addEventListener('pointerdown', onPointerDown);
  snippetNode.addEventListener('pointerover', onPointerOver);
  document.addEventListener('pointerup', () => (dragging = false));
  document.addEventListener('keydown', onKeyDown);

  // Clicking anywhere outside the code and the toolbar drops the selection
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#snippet, #highlight-toolbar')) clearSelection();
  });

  $$('[data-style]', toolbarNode).forEach((btn) =>
    btn.addEventListener('click', () => applyStyle(btn.dataset.style || null))
  );
  $('#highlight-deselect').addEventListener('click', clearSelection);
};
