/**
 * Tests for Fed store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true
}));

describe('Fed Store', () => {
	beforeEach(async () => {
		vi.resetModules();
	});

	it('should start with empty indicators', async () => {
		const { fedIndicators } = await import('./fed');

		const state = get(fedIndicators);
		expect(state.data).toBeNull();
		expect(state.loading).toBe(false);
		expect(state.error).toBeNull();
	});

	it('should start with empty news', async () => {
		const { fedNews } = await import('./fed');

		const state = get(fedNews);
		expect(state.items).toEqual([]);
		expect(state.loading).toBe(false);
		expect(state.error).toBeNull();
	});

	it('should set indicators data', async () => {
		const { fedIndicators } = await import('./fed');

		const mockData = {
			fedFundsRate: {
				seriesId: 'FEDFUNDS',
				name: 'Fed Funds Rate',
				value: 5.50,
				previousValue: 5.50,
				change: 0,
				unit: '%',
				date: '2025-11-01'
			},
			cpi: {
				seriesId: 'CPIAUCSL',
				name: 'CPI Inflation',
				value: 2.8,
				previousValue: 2.7,
				change: 0.1,
				unit: '%',
				date: '2025-11-01'
			},
			treasury10Y: {
				seriesId: 'DGS10',
				name: '10Y Treasury',
				value: 4.25,
				previousValue: 4.30,
				change: -0.05,
				unit: '%',
				date: '2025-12-01'
			}
		};

		fedIndicators.setData(mockData);

		const state = get(fedIndicators);
		expect(state.data).toEqual(mockData);
		expect(state.loading).toBe(false);
		expect(state.lastUpdated).not.toBeNull();
	});

	it('should set news items', async () => {
		const { fedNews } = await import('./fed');

		const mockItems = [
			{
				id: 'fed-1',
				title: 'Fed announces rate decision',
				link: 'https://fed.gov/1',
				description: 'Federal Reserve announcement',
				pubDate: 'Mon, 02 Dec 2025 14:00:00 GMT',
				timestamp: Date.now(),
				type: 'monetary' as const,
				typeLabel: 'Monetary Policy',
				isPowellRelated: true,
				hasVideo: false
			}
		];

		fedNews.setItems(mockItems);

		const state = get(fedNews);
		expect(state.items).toEqual(mockItems);
		expect(state.loading).toBe(false);
		expect(state.lastUpdated).not.toBeNull();
	});

	it('should set loading state', async () => {
		const { fedIndicators, fedNews } = await import('./fed');

		fedIndicators.setLoading(true);
		expect(get(fedIndicators).loading).toBe(true);

		fedIndicators.setLoading(false);
		expect(get(fedIndicators).loading).toBe(false);

		fedNews.setLoading(true);
		expect(get(fedNews).loading).toBe(true);

		fedNews.setLoading(false);
		expect(get(fedNews).loading).toBe(false);
	});

	it('should set error state', async () => {
		const { fedIndicators, fedNews, isFedLoading } = await import('./fed');

		fedIndicators.setError('Failed to fetch indicators');
		const indicatorState = get(fedIndicators);
		expect(indicatorState.error).toBe('Failed to fetch indicators');
		expect(indicatorState.loading).toBe(false);

		fedNews.setError('Failed to fetch news');
		const newsState = get(fedNews);
		expect(newsState.error).toBe('Failed to fetch news');
		expect(newsState.loading).toBe(false);

		// isFedLoading should be false when both are not loading
		expect(get(isFedLoading)).toBe(false);
	});

	it('should derive isFedLoading correctly', async () => {
		const { fedIndicators, fedNews, isFedLoading } = await import('./fed');

		expect(get(isFedLoading)).toBe(false);

		fedIndicators.setLoading(true);
		expect(get(isFedLoading)).toBe(true);

		fedIndicators.setLoading(false);
		fedNews.setLoading(true);
		expect(get(isFedLoading)).toBe(true);

		fedNews.setLoading(false);
		expect(get(isFedLoading)).toBe(false);
	});

	it('should derive fedVideos correctly', async () => {
		const { fedNews, fedVideos } = await import('./fed');

		const mockItems = [
			{
				id: 'fed-1',
				title: 'Regular news',
				link: 'https://fed.gov/1',
				description: 'Description',
				pubDate: 'Mon, 02 Dec 2025 14:00:00 GMT',
				timestamp: Date.now(),
				type: 'monetary' as const,
				typeLabel: 'Monetary Policy',
				isPowellRelated: false,
				hasVideo: false
			},
			{
				id: 'fed-2',
				title: 'Video announcement',
				link: 'https://fed.gov/2',
				description: 'Watch live',
				pubDate: 'Mon, 02 Dec 2025 14:00:00 GMT',
				timestamp: Date.now(),
				type: 'speech' as const,
				typeLabel: 'Speech',
				isPowellRelated: true,
				hasVideo: true
			}
		];

		fedNews.setItems(mockItems);

		const videos = get(fedVideos);
		expect(videos).toHaveLength(1);
		expect(videos[0].id).toBe('fed-2');
		expect(videos[0].hasVideo).toBe(true);
	});

	it('should clear error when setting loading', async () => {
		const { fedIndicators } = await import('./fed');

		fedIndicators.setError('Previous error');
		expect(get(fedIndicators).error).toBe('Previous error');

		fedIndicators.setLoading(true);
		expect(get(fedIndicators).error).toBeNull();
	});
});
