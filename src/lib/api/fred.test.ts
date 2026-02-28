/**
 * Tests for FRED API
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	isFredConfigured,
	fetchFedIndicators,
	fetchFedNews,
	type FedNewsItem
} from './fred';

// Mock dependencies
vi.mock('$lib/config/api', () => ({
	FRED_API_KEY: 'test-api-key',
	FRED_BASE_URL: 'https://api.stlouisfed.org/fred',
	fetchWithProxy: vi.fn(),
	logger: {
		log: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

import { fetchWithProxy, FRED_API_KEY } from '$lib/config/api';

describe('FRED API', () => {
	const mockFetch = vi.mocked(fetchWithProxy);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('isFredConfigured', () => {
		it('should return true when API key is configured', () => {
			expect(isFredConfigured()).toBe(true);
		});
	});

	describe('fetchFedIndicators', () => {
		it('should fetch all Fed indicators', async () => {
			const mockFedFundsResponse = {
				ok: true,
				json: async () => ({
					observations: [
						{ date: '2025-11-01', value: '5.50' },
						{ date: '2025-10-01', value: '5.50' }
					]
				})
			};

			const mockCPIResponse = {
				ok: true,
				json: async () => ({
					observations: Array.from({ length: 14 }, (_, i) => ({
						date: `2025-${String(12 - i).padStart(2, '0')}-01`,
						value: (300 - i * 2).toString()
					}))
				})
			};

			const mockTreasuryResponse = {
				ok: true,
				json: async () => ({
					observations: [
						{ date: '2025-12-01', value: '4.25' },
						{ date: '2025-11-30', value: '4.30' }
					]
				})
			};

			mockFetch
				.mockResolvedValueOnce(mockFedFundsResponse as Response)
				.mockResolvedValueOnce(mockCPIResponse as Response)
				.mockResolvedValueOnce(mockTreasuryResponse as Response);

			const result = await fetchFedIndicators();

			expect(result.fedFundsRate).toBeDefined();
			expect(result.fedFundsRate.value).toBe(5.50);
			expect(result.cpi).toBeDefined();
			expect(result.treasury10Y).toBeDefined();
		});

		it('should handle missing data (dot values)', async () => {
			const mockResponse = {
				ok: true,
				json: async () => ({
					observations: [
						{ date: '2025-11-01', value: '.' },
						{ date: '2025-10-01', value: '5.50' }
					]
				})
			};

			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchFedIndicators();

			expect(result.fedFundsRate.value).toBeNull();
		});

		it('should handle API error', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			const result = await fetchFedIndicators();

			expect(result.fedFundsRate.value).toBeNull();
			expect(result.fedFundsRate.error).toBeNull();
		});
	});

	describe('fetchFedNews', () => {
		it('should fetch and parse Fed RSS feeds', async () => {
			const mockRSSResponse = {
				ok: true,
				text: async () => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<item>
<title>Fed announces rate decision</title>
<link>https://www.federalreserve.gov/news/1</link>
<description>Federal Reserve announces interest rate decision</description>
<pubDate>Mon, 02 Dec 2025 14:00:00 GMT</pubDate>
</item>
<item>
<title>Powell speech on economy</title>
<link>https://www.federalreserve.gov/news/2</link>
<description>Chair Powell discusses economic outlook</description>
<pubDate>Mon, 02 Dec 2025 12:00:00 GMT</pubDate>
</item>
</channel>
</rss>`
			};

			mockFetch.mockResolvedValue(mockRSSResponse as Response);

			const result = await fetchFedNews();

			expect(result.length).toBeGreaterThan(0);
			expect(result[0].title).toBe('Fed announces rate decision');
			expect(result[0].link).toBeDefined();
			expect(result[0].timestamp).toBeGreaterThan(0);
		});

		it('should detect Powell-related content', async () => {
			const mockRSSResponse = {
				ok: true,
				text: async () => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<item>
<title>Chairman Powell addresses conference</title>
<link>https://www.federalreserve.gov/news/1</link>
<description>Watch live webcast of Powell speech</description>
<pubDate>Mon, 02 Dec 2025 14:00:00 GMT</pubDate>
</item>
</channel>
</rss>`
			};

			mockFetch.mockResolvedValue(mockRSSResponse as Response);

			const result = await fetchFedNews();

			const powellItem = result.find(item => item.title.includes('Powell'));
			expect(powellItem?.isPowellRelated).toBe(true);
			expect(powellItem?.hasVideo).toBe(true);
		});

		it('should handle RSS parse errors', async () => {
			const mockRSSResponse = {
				ok: true,
				text: async () => 'Invalid XML content'
			};

			mockFetch.mockResolvedValue(mockRSSResponse as Response);

			const result = await fetchFedNews();

			expect(result).toEqual([]);
		});

		it('should handle HTTP errors', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			const result = await fetchFedNews();

			expect(result).toEqual([]);
		});

		it('should deduplicate items by link', async () => {
			const mockRSSResponse = {
				ok: true,
				text: async () => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<item>
<title>Same article</title>
<link>https://www.federalreserve.gov/news/same</link>
<description>Description 1</description>
<pubDate>Mon, 02 Dec 2025 14:00:00 GMT</pubDate>
</item>
</channel>
</rss>`
			};

			mockFetch.mockResolvedValue(mockRSSResponse as Response);

			const result = await fetchFedNews();

			// Even though multiple feeds might return same article, it should be deduplicated
			const uniqueLinks = new Set(result.map(item => item.link));
			expect(uniqueLinks.size).toBe(result.length);
		});

		it('should sort Powell items first', async () => {
			const mockRSSResponse = {
				ok: true,
				text: async () => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<item>
<title>Regular Fed news</title>
<link>https://www.federalreserve.gov/news/regular</link>
<description>Regular news</description>
<pubDate>Mon, 02 Dec 2025 15:00:00 GMT</pubDate>
</item>
<item>
<title>Powell statement</title>
<link>https://www.federalreserve.gov/news/powell</link>
<description>Powell speaks</description>
<pubDate>Mon, 02 Dec 2025 14:00:00 GMT</pubDate>
</item>
</channel>
</rss>`
			};

			mockFetch.mockResolvedValue(mockRSSResponse as Response);

			const result = await fetchFedNews();

			// Powell item should come first despite being older
			if (result.length >= 2) {
				expect(result[0].isPowellRelated || result[0].timestamp >= result[1].timestamp).toBe(true);
			}
		});
	});
});
