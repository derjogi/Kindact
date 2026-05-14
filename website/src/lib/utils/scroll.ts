import gsap from 'gsap';
import type { Action } from 'svelte/action';

export interface ScrollRevealOptions {
	y?: number;
	opacity?: number;
	duration?: number;
	delay?: number;
	stagger?: number;
}

const defaults: Required<ScrollRevealOptions> = {
	y: 30,
	opacity: 0,
	duration: 0.6,
	delay: 0,
	stagger: 0
};

export const scrollReveal: Action<HTMLElement, ScrollRevealOptions | undefined> = (
	node,
	options
) => {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (prefersReducedMotion) {
		return;
	}

	const opts = { ...defaults, ...options };

	gsap.set(node, { y: opts.y, opacity: opts.opacity });

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					gsap.to(node, {
						y: 0,
						opacity: 1,
						duration: opts.duration,
						delay: opts.delay,
						stagger: opts.stagger,
						ease: 'power2.out'
					});
					observer.unobserve(node);
				}
			}
		},
		{ threshold: 0.1 }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
};
