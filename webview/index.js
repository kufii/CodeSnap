const content = document.getElementById('content');
const contentContainer = document.getElementById('content-container');

let fontFamily;
let enableLigatures;

const stripInitialIndent = node => {
	const initialSpans = Array.from(node.querySelectorAll('div > span:first-child'));
	if (initialSpans.some(span => !span.textContent.match(/^\s+$/))) return;
	const minIndent = Math.min(...initialSpans.map(span => span.textContent.length));
	initialSpans.forEach(span => (span.textContent = span.textContent.slice(minIndent)));
};

document.addEventListener('paste', e => {
	content.innerHTML = e.clipboardData.getData('text/html');
	const div = content.querySelector('div');
	stripInitialIndent(div);
	div.style.fontFamily = fontFamily;
	div.style.fontVariantLigatures = enableLigatures ? 'normal' : 'none';
	content.style.backgroundColor = div.style.backgroundColor;
});

window.addEventListener('message', e => {
	if (e.data.type === 'update') {
		({ fontFamily, enableLigatures } = e.data);
		contentContainer.style.backgroundColor = '#f2f2f2';
		document.execCommand('paste');
	}
});
