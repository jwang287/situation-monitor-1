<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		// 性能监控 - Web Vitals
		if (import.meta.env.PROD && 'performance' in window) {
			// 监控 LCP (Largest Contentful Paint)
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1];
				console.log('[Performance] LCP:', lastEntry.startTime);
			});
			observer.observe({ entryTypes: ['largest-contentful-paint'] });

			// 监控 FID (First Input Delay)
			const fidObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					const delay = (entry as PerformanceEventTiming).processingStart - entry.startTime;
					console.log('[Performance] FID:', delay);
				}
			});
			fidObserver.observe({ entryTypes: ['first-input'] });

			// 监控 CLS (Cumulative Layout Shift)
			let clsValue = 0;
			const clsObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (!(entry as any).hadRecentInput) {
						clsValue += (entry as any).value;
					}
				}
				console.log('[Performance] CLS:', clsValue);
			});
			clsObserver.observe({ entryTypes: ['layout-shift'] });

			// 页面加载时间
			window.addEventListener('load', () => {
				setTimeout(() => {
					const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
					if (timing) {
						console.log('[Performance] Page Load Time:', timing.loadEventEnd - timing.startTime);
						console.log('[Performance] DOM Ready:', timing.domContentLoadedEventEnd - timing.startTime);
					}
				}, 0);
			});
		}
	});
</script>

<div class="min-h-screen bg-bg text-text-primary">
	{@render children()}
</div>
