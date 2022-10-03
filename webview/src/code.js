import { $, $$, setVar, calcTextWidth } from './util.js';
import fixedWidth from './fixedWidth.js';

const snippetNode = $('#snippet');

const setupLines = (node, config) => {
  $$(':scope > br', node).forEach((row) => (row.outerHTML = '<div>&nbsp;</div>'));

  const rows = $$(':scope > div', node);
  setVar('line-number-width', calcTextWidth(rows.length + config.startLine));

  rows.forEach((row, idx) => {
    const newRow = document.createElement('div');
    newRow.classList.add('line');
    row.replaceWith(newRow);

    if (config.showLineNumbers) {
      const lineNum = document.createElement('div');
      lineNum.classList.add('line-number');
      // 增加行号点击事件
      lineNum.onclick = function (e) {
        // 获取默认行高
        // var defaultLineHeight = $('#snippet').style.lineHeight;
        // if (defaultLineHeight.indexOf("px") != -1) {
        //   defaultLineHeight = defaultLineHeight.substring(0, defaultLineHeight.length - 2);
        // }
        var firstRowIsWhiteSpace = this.nextSibling.firstChild.firstChild.innerText.trim() === "";
        
        // original
        if(false) {
          // 判断是否已经加粗
          if (this.nextSibling.classList.contains("line-code-bold")) {
            // 取消添加的样式
            this.nextSibling.classList.remove("line-code-bold");
            this.nextSibling.classList.remove("line-code-size");
            lineNum.classList.remove('line-number-hover');
            if (firstRowIsWhiteSpace) {
              this.nextSibling.classList.remove("line-code-size-nofirst");
            }
            this.nextSibling.classList.remove("line-code-size");
            // 取消增加的行高
            // this.nextSibling.style.lineHeight = defaultLineHeight + "px";
          } else {
            // 添加样式
            this.nextSibling.classList.add("line-code-bold");
            this.nextSibling.classList.add("underline");
            this.nextSibling.classList.add("line-code-size");
            lineNum.classList.add('line-number-hover');
            if (firstRowIsWhiteSpace) {
              this.nextSibling.classList.add("line-code-size-nofirst");
            }
            // 设置行高
            // this.nextSibling.style.lineHeight = (Number(defaultLineHeight) + 2) + "px";
          }
        }

        // if (firstRowIsWhiteSpace) {
        //   this.nextSibling.classList.toggle("line-code-size-nofirst");
        // }
        // this.nextSibling.classList.toggle("line-code-size");
        // this.nextSibling.classList.toggle("line-code-bold");

        // this.classList.toggle("git-add-for-linenubmer");
        // this.parentNode.classList.toggle("git-add");
        // this.classList.toggle("git-remove-for-linenubmer");
        // this.parentNode.classList.toggle("git-remove");
        // this.classList.toggle("line-focus-for-linenubmer");
        // this.parentNode.classList.toggle("line-focus");

        if(this.parentNode.classList.contains("line-focus")) {
          
          this.classList.remove("line-focus-for-linenubmer");
          this.parentNode.classList.remove("line-focus");

          this.classList.add("git-add-for-linenubmer");
          this.parentNode.classList.add("git-add");

        } else if (this.parentNode.classList.contains("git-add")) {

          this.classList.remove("git-add-for-linenubmer");
          this.parentNode.classList.remove("git-add");

          this.classList.add("git-remove-for-linenubmer");
          this.parentNode.classList.add("git-remove");

        } else if (this.parentNode.classList.contains("git-remove")) {
          
          this.classList.remove("line-focus-for-linenubmer");
          this.parentNode.classList.remove("line-focus");
          this.classList.remove("git-add-for-linenubmer");
          this.parentNode.classList.remove("git-add");
          this.classList.remove("git-remove-for-linenubmer");
          this.parentNode.classList.remove("git-remove");

        } else {
          this.classList.add("line-focus-for-linenubmer");
          this.parentNode.classList.add("line-focus");
          this.classList.remove("git-add-for-linenubmer");
          this.parentNode.classList.remove("git-add");
          this.classList.remove("git-remove-for-linenubmer");
          this.parentNode.classList.remove("git-remove");
        }
      };
      lineNum.textContent = idx + 1 + config.startLine;
      newRow.appendChild(lineNum);
    }

    const span = document.createElement('span');
    span.textContent = ' ';
    row.appendChild(span);

    const lineCodeDiv = document.createElement('div');
    lineCodeDiv.classList.add('line-code');

    if (row.innerText.trim().length === 1 && row.childNodes.length === 2) {
      var char = row.innerText.trim();

      const lineCode = document.createElement('span');
      lineCode.innerHTML = row.innerHTML.split(char).join("");
      lineCodeDiv.appendChild(lineCode);

      const lineCode1 = document.createElement('span');
      lineCode1.innerHTML = row.innerHTML.replace(/&nbsp;/ig, "");
      lineCodeDiv.appendChild(lineCode1);
    } else {
      const lineCode = document.createElement('span');
      lineCode.innerHTML = row.innerHTML;
      lineCodeDiv.appendChild(lineCode);
    }
    newRow.appendChild(lineCodeDiv);
  });
};

const stripInitialIndent = (node) => {
  const regIndent = /^\s+/u;
  const initialSpans = $$(':scope > div > span:first-child', node);
  if (initialSpans.some((span) => !regIndent.test(span.textContent))) return;
  const minIndent = Math.min(
    ...initialSpans.map((span) => span.textContent.match(regIndent)[0].length)
  );
  initialSpans.forEach((span) => (span.textContent = span.textContent.slice(minIndent)));
};

const getClipboardHtml = (clip) => {
  const html = clip.getData('text/html');
  if (html) return html;
  const text = clip
    .getData('text/plain')
    .split('\n')
    .map((line) => `<div>${line}</div>`)
    .join('');
  return `<div>${text}</div>`;
};

// fixedWidth();

export const pasteCode = (config, clipboard) => {
  snippetNode.innerHTML = getClipboardHtml(clipboard);
  const code = $('div', snippetNode);
  snippetNode.style.fontSize = code.style.fontSize;
  snippetNode.style.lineHeight = code.style.lineHeight;
  snippetNode.innerHTML = code.innerHTML;
  stripInitialIndent(snippetNode);
  setupLines(snippetNode, config);
};
