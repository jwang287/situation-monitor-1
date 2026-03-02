/**
 * Web Vitals Performance Monitoring
 * 监控和报告核心性能指标
 */

import { browser } from '$app/environment';

interface WebVitalsReport {
	name: string;
	value: number;
	delta: number;
	rating: 'good' | 'needs-improvement' | 'poor';
	id: string;
	navEntry?: PerformanceNavigationTiming;
	attribution?: Record<string, unknown>;
}

/**
 * 性能指标阈值 (基于 Web Vitals 标准)
 */
export const THRESHOLDS = {
	// LCP: 最大内容绘制
	LCP: { good: 2500, needsImprovement: 4000 },
	// FID: 首次输入延迟
	FID: { good: 100, needsImprovement: 300 },
	// CLS: 累积布局偏移
	CLS: { good: 0.1, needsImprovement: 0.25 },
	// FCP: 首次内容绘制
	FCP: { good: 1000, needsImprovement: 3000 },
	// TTFB: 首字节时间
	TTFB: { good: 800, needsImprovement: 1800 },
	// INP: 交互到下次绘制
	INP: { good: 200, needsImprovement: 500 }
} as const;

/**
 * 性能指标存储
 */
let metrics = {
	LCP: 0,
	FID: 0,
	CLS: 0,
	FCP: 0,
	TTFB: 0,
	INP: 0
};

/**
 * 获取性能评级
 */
function getRating(value: number, metric: keyof typeof THRESHOLDS): 'good' | 'needs-improvement' | 'poor' {
	const thresholds = THRESHOLDS[metric];
	if (value <= thresholds.good) return 'good';
	if (value <= thresholds.needsImprovement) return 'needs-improvement';
	return 'poor';
}

/**
 * 报告性能指标
 */
function reportMetric({ name, value, rating }: WebVitalsReport): void {
	// 更新本地指标
	if (name in metrics) {
		metrics[name as keyof typeof metrics] = value;
	}

	// 生产环境发送到分析服务
	if (browser && typeof window !== 'undefined') {
		console.log(`[Web Vitals] ${name}:`, {
			value: value.toFixed(2),
			rating,
			thresholds: THRESHOLDS[name as keyof typeof THRESHOLDS]
		});
	}
}

/**
 * 初始化 Web Vitals 监控
 */
export function initWebVitals(): void {
	if (!browser) return;

	// 使用原生 Performance API 作为备选
	if (typeof window !== 'undefined' && 'performance' in window) {
		// 观察 LCP
		try {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
				if (lastEntry) {
					const value = lastEntry.renderTime || lastEntry.loadTime || 0;
					reportMetric({
						name: 'LCP',
						value,
						delta: value,
						rating: getRating(value, 'LCP'),
						id: lastEntry.name
					});
				}
			});
			observer.observe({ entryTypes: ['largest-contentful-paint'] as PerformanceEntryList });
		} catch (e) {
			// LCP 不支持
		}

		// 观察 FCP
		try {
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const firstEntry = entries[0] as PerformanceEntry & { renderTime?: number; loadTime?: number };
				if (firstEntry) {
					const value = firstEntry.renderTime || firstEntry.loadTime || 0;
					reportMetric({
						name: 'FCP',
						value,
						delta: value,
						rating: getRating(value, 'FCP'),
						id: firstEntry.name
					});
				}
			});
			observer.observe({ entryTypes: ['paint'] as PerformanceEntryList });
		} catch (e) {
			// Paint 不支持
		}

		// 观察 CLS
		try {
			let clsValue = 0;
			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					const layoutEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
					if (!layoutEntry.hadRecentInput) {
						clsValue += layoutEntry.value || 0;
					}
				}
				reportMetric({
					name: 'CLS',
					value: clsValue,
					delta: clsValue,
					rating: getRating(clsValue, 'CLS'),
					id: 'cls-metric'
				});
			});
			observer.observe({ entryTypes: ['layout-shift'] as PerformanceEntryList });
		} catch (e) {
			// Layout Shift 不支持
		}
	}

	// 尝试加载 web-vitals 库 (如果可用)
	if (browser && typeof window !== 'undefined') {
		import('web-vitals').then((webVitals) => {
			if (webVitals.onCLS) {
				webVitals.onCLS((metric: { value: number; delta: number; id: string; name: string }) => {
					reportMetric({
						name: 'CLS',
						value: metric.value,
						delta: metric.delta,
						rating: getRating(metric.value, 'CLS'),
						id: metric.id
					});
				});
			}
			if (webVitals.onFCP) {
				webVitals.onFCP((metric: { value: number; delta: number; id: string; name: string }) => {
					reportMetric({
						name: 'FCP',
						value: metric.value,
						delta: metric.delta,
						rating: getRating(metric.value, 'FCP'),
						id: metric.id
					});
				});
			}
			if (webVitals.onLCP) {
				webVitals.onLCP((metric: { value: number; delta: number; id: string; name: string }) => {
					reportMetric({
						name: 'LCP',
						value: metric.value,
						delta: metric.delta,
						rating: getRating(metric.value, 'LCP'),
						id: metric.id
					});
				});
			}
		}).catch(() => {
			// web-vitals 库加载失败，使用原生 API
			console.log('[Web Vitals] Using native Performance API');
		});
	}
}

/**
 * 获取当前性能指标
 */
export function getMetrics(): typeof metrics {
	return { ...metrics };
}

/**
 * 获取性能报告
 */
export function getPerformanceReport(): Record<string, { value: number; rating: string }> {
	const report: Record<string, { value: number; rating: string }> = {};

	Object.entries(metrics).forEach(([key, value]) => {
		if (value > 0) {
			report[key] = {
				value,
				rating: getRating(value, key as keyof typeof THRESHOLDS)
			};
		}
	});

	return report;
}

/**
 * 记录自定义性能标记
 */
export function markPerformance(markName: string): void {
	if (browser && typeof performance !== 'undefined') {
		performance.mark(markName);
		console.log(`[Performance Mark] ${markName}`);
	}
}

/**
 * 测量两个标记之间的时间
 */
export function measurePerformance(measureName: string, startMark: string, endMark: string): number | null {
	if (!browser || typeof performance === 'undefined') return null;

	try {
		performance.measure(measureName, startMark, endMark);
		const entries = performance.getEntriesByName(measureName);
		if (entries.length > 0) {
			const duration = (entries[0] as PerformanceMeasure).duration;
			console.log(`[Performance Measure] ${measureName}: ${duration.toFixed(2)}ms`);
			return duration;
		}
	} catch (error) {
		console.error('[Performance Measure] Error:', error);
	}

	return null;
}
