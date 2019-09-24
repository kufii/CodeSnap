const snippetNode = document.getElementById('snippet');
const snippetContainerNode = document.getElementById('snippet-container');
const windowNode = document.getElementById('window');

let fontFamily;
let enableLigatures;

const stripInitialIndent = node => {
	const initialSpans = Array.from(node.querySelectorAll('div > span:first-child'));
	if (initialSpans.some(span => !span.textContent.match(/^\s+$/))) return;
	const minIndent = Math.min(...initialSpans.map(span => span.textContent.length));
	initialSpans.forEach(span => (span.textContent = span.textContent.slice(minIndent)));
};

document.addEventListener('paste', e => {
	snippetNode.innerHTML = e.clipboardData.getData('text/html');
	const div = snippetNode.querySelector('div');
	stripInitialIndent(div);
	div.style.fontFamily = fontFamily;
	div.style.fontVariantLigatures = enableLigatures ? 'normal' : 'none';
	windowNode.style.backgroundColor = div.style.backgroundColor;
});

window.addEventListener('message', e => {
	if (e.data.type === 'update') {
		({ fontFamily, enableLigatures } = e.data);
		snippetContainerNode.style.backgroundColor = '#f2f2f2';
		document.execCommand('paste');
	}
});
