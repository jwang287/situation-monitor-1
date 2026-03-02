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

		// 发送到分析端点 (可选)
		// sendToAnalytics(name, value, rating);
	}
}

/**
 * 初始化 Web Vitals 监控
 */
export function initWebVitals(): void {
	if (!browser) return;

	// 动态导入 web-vitals 库
	import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
		// Cumulative Layout Shift (CLS)
		onCLS((metric) => {
			reportMetric({
				name: 'CLS',
				value: metric.value,
				delta: metric.delta,
				rating: getRating(metric.value, 'CLS'),
				id: metric.id,
				attribution: metric.attribution
			});
		});

		// First Input Delay (FID)
		onFID((metric) => {
			reportMetric({
				name: 'FID',
				value: metric.value,
				delta: metric.delta,
				rating: getRating(metric.value, 'FID'),
				id: metric.id,
				attribution: metric.attribution
			});
		});

		// First Contentful Paint (FCP)
		onFCP((metric) => {
			reportMetric({
				name: 'FCP',
				value: metric.value,
				delta: metric.delta,
				rating: getRating(metric.value, 'FCP'),
				id: metric.id,
				attribution: metric.attribution
			});
		});

		// Largest Contentful Paint (LCP)
		onLCP((metric) => {
			reportMetric({
				name: 'LCP',
				value: metric.value,
				delta: metric.delta,
				rating: getRating(metric.value, 'LCP'),
				id: metric.id,
				attribution: metric.attribution
			});
		});

		// Time to First Byte (TTFB)
		onTTFB((metric) => {
			reportMetric({
				name: 'TTFB',
				value: metric.value,
				delta: metric.delta,
				rating: getRating(metric.value, 'TTFB'),
				id: metric.id,
				attribution: metric.attribution
			});
		});

		// Interaction to Next Paint (INP)
		onINP((metric) => {
			reportMetric({
				name: 'INP',
				value: metric.value,
				delta: metric.delta,
				rating: getRating(metric.value, 'INP'),
				id: metric.id,
				attribution: metric.attribution
			});
		});
	}).catch((error) => {
		console.warn('[Web Vitals] Failed to load web-vitals library:', error);
	});
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
 * 发送性能数据到分析服务
 */
async function sendToAnalytics(
	name: string,
	value: number,
	rating: 'good' | 'needs-improvement' | 'poor'
): Promise<void> {
	// 实现分析数据发送逻辑
	// 例如：发送到 Google Analytics, Plausible, 或自定义端点
	try {
		await navigator.sendBeacon('/api/analytics/performance', JSON.stringify({
			name,
			value,
			rating,
			timestamp: Date.now(),
			url: window.location.href
		}));
	} catch (error) {
		console.error('[Web Vitals] Failed to send analytics:', error);
	}
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
