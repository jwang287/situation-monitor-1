<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		// 性能监控 - Web Vitals (仅在浏览器环境执行)
		if (!browser || typeof window === 'undefined') return;
		
		if (import.meta.env.PROD && 'performance' in window) {
			// 监控 LCP (Largest Contentful Paint)
			try {
				const observer = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
					if (lastEntry) {
						console.log('[Performance] LCP:', lastEntry.startTime);
					}
				});
				observer.observe({ entryTypes: ['largest-contentful-paint'] });
			} catch (e) {
				// LCP 不支持
			}

			// 监控 FID (First Input Delay)
			try {
				const fidObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						const eventEntry = entry as PerformanceEntry & { processingStart: number; startTime: number };
						const delay = eventEntry.processingStart - eventEntry.startTime;
						console.log('[Performance] FID:', delay);
					}
				});
				fidObserver.observe({ entryTypes: ['first-input'] });
			} catch (e) {
				// FID 不支持
			}

			// 监控 CLS (Cumulative Layout Shift)
			try {
				let clsValue = 0;
				const clsObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						const layoutEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
						if (!layoutEntry.hadRecentInput) {
							clsValue += layoutEntry.value || 0;
						}
					}
					console.log('[Performance] CLS:', clsValue);
				});
				clsObserver.observe({ entryTypes: ['layout-shift'] });
			} catch (e) {
				// CLS 不支持
			}

			// 页面加载时间
			window.addEventListener('load', () => {
				setTimeout(() => {
					if (typeof performance !== 'undefined') {
						const entries = performance.getEntriesByType('navigation');
						if (entries.length > 0) {
							const timing = entries[0] as PerformanceEntry & { 
								loadEventEnd: number; 
								domContentLoadedEventEnd: number; 
								startTime: number 
							};
							console.log('[Performance] Page Load Time:', timing.loadEventEnd - timing.startTime);
							console.log('[Performance] DOM Ready:', timing.domContentLoadedEventEnd - timing.startTime);
						}
					}
				}, 0);
			});
		}
	});
</script>

<div class="min-h-screen bg-bg text-text-primary">
	{@render children()}
</div>
