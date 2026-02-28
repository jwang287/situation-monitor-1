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

	describe('edge cases', () => {
		it('should handle null indicator values', async () => {
			const { fedIndicators } = await import('./fed');

			const mockDataWithNull = {
				fedFundsRate: {
					seriesId: 'FEDFUNDS',
					name: 'Fed Funds Rate',
					value: null,
					previousValue: null,
					change: null,
					unit: '%',
					date: null
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

			fedIndicators.setData(mockDataWithNull);

			const state = get(fedIndicators);
			expect(state.data?.fedFundsRate.value).toBeNull();
			expect(state.data?.cpi.value).toBe(2.8);
		});

		it('should handle empty news array', async () => {
			const { fedNews } = await import('./fed');

			fedNews.setItems([]);

			const state = get(fedNews);
			expect(state.items).toEqual([]);
			expect(state.lastUpdated).not.toBeNull();
		});

		it('should handle duplicate news items', async () => {
			const { fedNews } = await import('./fed');

			const duplicateItems = [
				{
					id: 'fed-1',
					title: 'Same news',
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
					id: 'fed-1',
					title: 'Same news',
					link: 'https://fed.gov/1',
					description: 'Description',
					pubDate: 'Mon, 02 Dec 2025 14:00:00 GMT',
					timestamp: Date.now(),
					type: 'monetary' as const,
					typeLabel: 'Monetary Policy',
					isPowellRelated: false,
					hasVideo: false
				}
			];

			fedNews.setItems(duplicateItems);

			const state = get(fedNews);
			expect(state.items.length).toBe(2);
		});

		it('should handle very large news arrays', async () => {
			const { fedNews } = await import('./fed');

			const largeItems = Array.from({ length: 100 }, (_, i) => ({
				id: `fed-${i}`,
				title: `News item ${i}`,
				link: `https://fed.gov/${i}`,
				description: `Description ${i}`,
				pubDate: 'Mon, 02 Dec 2025 14:00:00 GMT',
				timestamp: Date.now(),
				type: 'monetary' as const,
				typeLabel: 'Monetary Policy',
				isPowellRelated: i % 2 === 0,
				hasVideo: i % 3 === 0
			}));

			fedNews.setItems(largeItems);

			const state = get(fedNews);
			expect(state.items.length).toBe(100);

			const videos = get((await import('./fed')).fedVideos);
			expect(videos.length).toBe(Math.floor(100 / 3));
		});

		it('should handle special characters in news titles', async () => {
			const { fedNews } = await import('./fed');

			const specialItems = [
				{
					id: 'fed-special',
					title: 'Fed & Powell: "Rate Decision" <script>alert(1)</script>',
					link: 'https://fed.gov/special',
					description: 'Description with <b>HTML</b>',
					pubDate: 'Mon, 02 Dec 2025 14:00:00 GMT',
					timestamp: Date.now(),
					type: 'monetary' as const,
					typeLabel: 'Monetary Policy',
					isPowellRelated: true,
					hasVideo: false
				}
			];

			fedNews.setItems(specialItems);

			const state = get(fedNews);
			expect(state.items[0].title).toContain('<script>');
		});
	});

	describe('data validation', () => {
		it('should handle negative indicator values', async () => {
			const { fedIndicators } = await import('./fed');

			const mockData = {
				fedFundsRate: {
					seriesId: 'FEDFUNDS',
					name: 'Fed Funds Rate',
					value: -0.5,
					previousValue: 0.25,
					change: -0.75,
					unit: '%',
					date: '2025-11-01'
				},
				cpi: {
					seriesId: 'CPIAUCSL',
					name: 'CPI Inflation',
					value: -0.5,
					previousValue: 0.1,
					change: -0.6,
					unit: '%',
					date: '2025-11-01'
				},
				treasury10Y: {
					seriesId: 'DGS10',
					name: '10Y Treasury',
					value: -0.5,
					previousValue: 1.0,
					change: -1.5,
					unit: '%',
					date: '2025-12-01'
				}
			};

			fedIndicators.setData(mockData);

			const state = get(fedIndicators);
			expect(state.data?.fedFundsRate.value).toBe(-0.5);
			expect(state.data?.fedFundsRate.change).toBe(-0.75);
		});

		it('should handle extremely large values', async () => {
			const { fedIndicators } = await import('./fed');

			const mockData = {
				fedFundsRate: {
					seriesId: 'FEDFUNDS',
					name: 'Fed Funds Rate',
					value: 999999.99,
					previousValue: 999998.99,
					change: 1.0,
					unit: '%',
					date: '2025-11-01'
				},
				cpi: {
					seriesId: 'CPIAUCSL',
					name: 'CPI Inflation',
					value: 999999.99,
					previousValue: 999998.99,
					change: 1.0,
					unit: '%',
					date: '2025-11-01'
				},
				treasury10Y: {
					seriesId: 'DGS10',
					name: '10Y Treasury',
					value: 999999.99,
					previousValue: 999998.99,
					change: 1.0,
					unit: '%',
					date: '2025-12-01'
				}
			};

			fedIndicators.setData(mockData);

			const state = get(fedIndicators);
			expect(state.data?.fedFundsRate.value).toBe(999999.99);
		});
	});
});
