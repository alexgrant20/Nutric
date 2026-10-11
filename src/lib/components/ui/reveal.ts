export function reveal(node: HTMLElement) {
	if (typeof IntersectionObserver === 'undefined') return;
	if (node.getBoundingClientRect().top < window.innerHeight * 0.9) return;
	node.classList.add('reveal');
	const io = new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting) {
				node.classList.add('is-visible');
				io.disconnect();
			}
		},
		{ threshold: 0.15 }
	);
	io.observe(node);
	return { destroy: () => io.disconnect() };
}
