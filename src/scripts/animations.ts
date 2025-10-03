// Scroll animations using Intersection Observer
export function initScrollAnimations() {
	const observerOptions = {
		threshold: 0.1,
		rootMargin: '0px 0px -100px 0px',
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add('animate-in');
				observer.unobserve(entry.target);
			}
		});
	}, observerOptions);

	// Observe all animatable elements
	const elements = document.querySelectorAll('.animate-on-scroll');
	elements.forEach((el) => observer.observe(el));
}

// Initialize on page load and after each view transition
if (typeof window !== 'undefined') {
	document.addEventListener('astro:page-load', initScrollAnimations);
}
