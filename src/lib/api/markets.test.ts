/**
 * Tests for markets API
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchCryptoPrices, fetchIndices, fetchSectorPerformance, fetchCommodities, fetchAllMarkets } from './markets';

// Mock dependencies
vi.mock('$lib/config/markets', () => ({
	INDICES: [
		{ symbol: '^DJI', name: 'Dow Jones' },
		{ symbol: '^GSPC', name: 'S&P 500' },
		{ symbol: '^IXIC', name: 'NASDAQ' },
		{ symbol: '^RUT', name: 'Russell 2000' }
	],
	SECTORS: [
		{ symbol: 'XLK', name: 'Technology' },
		{ symbol: 'XLF', name: 'Financials' }
	],
	COMMODITIES: [
		{ symbol: '^VIX', name: 'VIX' },
		{ symbol: 'GC=F', name: 'Gold' },
		{ symbol: 'CL=F', name: 'Crude Oil' }
	],
	CRYPTO: [
		{ id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
		{ id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
		{ id: 'solana', symbol: 'SOL', name: 'Solana' }
	]
}));

vi.mock('$lib/config/api', () => ({
	fetchWithProxy: vi.fn(),
	logger: {
		log: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	},
	FINNHUB_API_KEY: 'test-api-key',
	FINNHUB_BASE_URL: 'https://finnhub.io/api/v1'
}));

import { fetchWithProxy, FINNHUB_API_KEY } from '$lib/config/api';

describe('Markets API', () => {
	const mockFetch = vi.mocked(fetchWithProxy);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('fetchCryptoPrices', () => {
		it('should fetch crypto prices from CoinGecko', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({
					bitcoin: { usd: 95000, usd_24h_change: 2.5 },
					ethereum: { usd: 3500, usd_24h_change: -1.2 },
					solana: { usd: 150, usd_24h_change: 5.0 }
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCryptoPrices();

			expect(result).toHaveLength(3);
			expect(result[0].id).toBe('bitcoin');
			expect(result[0].current_price).toBe(95000);
			expect(result[0].price_change_percentage_24h).toBe(2.5);
		});

		it('should handle missing price data', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({
					bitcoin: { usd: 95000 },
					ethereum: {},
					solana: null
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCryptoPrices();

			expect(result[0].current_price).toBe(95000);
			expect(result[1].current_price).toBe(0);
			expect(result[2].current_price).toBe(0);
		});

		it('should handle API error', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			const result = await fetchCryptoPrices();

			expect(result).toHaveLength(3);
			expect(result[0].current_price).toBe(0);
		});
	});

	describe('fetchIndices', () => {
		it('should fetch indices from Finnhub', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({
					c: 38000,
					d: 150,
					dp: 0.4
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchIndices();

			expect(result).toHaveLength(4);
			expect(result[0].symbol).toBe('^DJI');
			expect(result[0].price).toBe(38000);
			expect(result[0].change).toBe(150);
			expect(result[0].changePercent).toBe(0.4);
		});

		it('should handle symbol not found (zero values)', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({
					c: 0,
					d: 0,
					dp: 0,
					pc: 0
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchIndices();

			expect(result[0].price).toBeNaN();
		});

		it('should handle HTTP error', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			const result = await fetchIndices();

			expect(result).toHaveLength(4);
			expect(result[0].price).toBeNaN();
		});
	});

	describe('fetchSectorPerformance', () => {
		it('should fetch sector performance', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({
					c: 200,
					d: 2,
					dp: 1.0
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchSectorPerformance();

			expect(result).toHaveLength(2);
			expect(result[0].symbol).toBe('XLK');
			expect(result[0].price).toBe(200);
		});
	});

	describe('fetchCommodities', () => {
		it('should fetch commodities with ETF proxy mapping', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({
					c: 15,
					d: 0.5,
					dp: 3.4
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCommodities();

			expect(result).toHaveLength(3);
			expect(result[0].symbol).toBe('^VIX');
			expect(result[0].type).toBe('commodity');
		});
	});

	describe('fetchAllMarkets', () => {
		it('should fetch all market data', async () => {
			const mockCoinGeckoResponse = {
				ok: true,
				json: async () => ({
					bitcoin: { usd: 95000, usd_24h_change: 2.5 },
					ethereum: { usd: 3500, usd_24h_change: -1.2 },
					solana: { usd: 150, usd_24h_change: 5.0 }
				})
			};

			const mockFinnhubResponse = {
				ok: true,
				json: async () => ({
					c: 38000,
					d: 150,
					dp: 0.4
				})
			};

			mockFetch
				.mockResolvedValueOnce(mockCoinGeckoResponse as Response)
				.mockResolvedValue(mockFinnhubResponse as Response);

			const result = await fetchAllMarkets();

			expect(result.crypto).toHaveLength(3);
			expect(result.indices).toHaveLength(4);
			expect(result.sectors).toHaveLength(2);
			expect(result.commodities).toHaveLength(3);
		});
	});
});
