/**
 * Tests for news API
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchCategoryNews, fetchAllNews } from './news';

// Mock dependencies
vi.mock('$lib/config/feeds', () => ({
	FEEDS: {
		politics: [{ name: 'BBC', url: 'https://feeds.bbci.co.uk/news/politics/rss.xml' }],
		tech: [{ name: 'TechCrunch', url: 'https://techcrunch.com/feed/' }],
		finance: [{ name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' }],
		gov: [{ name: 'White House', url: 'https://www.whitehouse.gov/news/feed/' }],
		ai: [{ name: 'OpenAI', url: 'https://openai.com/news/rss.xml' }],
		intel: [{ name: 'CSIS', url: 'https://www.csis.org/analysis/feed' }]
	}
}));

vi.mock('$lib/config/keywords', () => ({
	containsAlertKeyword: vi.fn((text: string) => {
		if (text.toLowerCase().includes('war')) return { isAlert: true, keyword: 'war' };
		if (text.toLowerCase().includes('military')) return { isAlert: true, keyword: 'military' };
		return null;
	}),
	detectRegion: vi.fn(() => 'US'),
	detectTopics: vi.fn(() => ['politics'])
}));

vi.mock('$lib/config/api', () => ({
	fetchWithProxy: vi.fn(),
	API_DELAYS: { betweenCategories: 0 },
	logger: {
		log: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	},
	USE_MOCK_DATA: false
}));

vi.mock('$lib/data/mock', () => ({
	mockNewsData: {
		politics: [
			{
				id: 'mock-1',
				title: 'Mock Politics News',
				source: 'Mock',
				link: 'https://mock.com/1',
				timestamp: Date.now(),
				category: 'politics'
			}
		]
	}
}));

import { fetchWithProxy, USE_MOCK_DATA } from '$lib/config/api';

describe('News API', () => {
	const mockFetch = vi.mocked(fetchWithProxy);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('fetchCategoryNews', () => {
		it('should fetch and transform news articles', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({
					articles: [
						{
							title: 'Test Article',
							url: 'https://example.com/article',
							seendate: '20251202T120000Z',
							domain: 'example.com'
						}
					]
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('politics');

			expect(result).toHaveLength(1);
			expect(result[0].title).toBe('Test Article');
			expect(result[0].source).toBe('example.com');
			expect(result[0].category).toBe('politics');
		});

		it('should handle empty response', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({ articles: [] })
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('tech');

			expect(result).toEqual([]);
		});

		it('should handle non-JSON response', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'text/html' }),
				text: async () => '<html>Not JSON</html>'
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('finance');

			expect(result).toEqual([]);
		});

		it('should handle HTTP error', async () => {
			const mockResponse = {
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('gov');

			expect(result).toEqual([]);
		});

		it('should handle invalid JSON', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => 'invalid json {'
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('ai');

			expect(result).toEqual([]);
		});

		it('should detect alerts in headlines', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({
					articles: [
						{
							title: 'Military action reported',
							url: 'https://example.com/war',
							seendate: '20251202T120000Z',
							domain: 'example.com'
						}
					]
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('intel');

			expect(result[0].isAlert).toBe(true);
			expect(result[0].alertKeyword).toBe('military');
		});

		it('should parse GDELT date format correctly', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({
					articles: [
						{
							title: 'Test',
							url: 'https://example.com/test',
							seendate: '20251202T143000Z',
							domain: 'example.com'
						}
					]
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('politics');

			expect(result[0].timestamp).toBeGreaterThan(0);
			expect(new Date(result[0].timestamp).getFullYear()).toBe(2025);
		});

		it('should use default source when domain is missing', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({
					articles: [
						{
							title: 'Test',
							url: 'https://example.com/test',
							seendate: '20251202T120000Z',
							domain: ''
						}
					]
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('politics');

			expect(result[0].source).toBe('BBC');
		});
	});

	describe('fetchAllNews', () => {
		it('should fetch all categories', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({
					articles: [
						{
							title: 'Test Article',
							url: 'https://example.com/article',
							seendate: '20251202T120000Z',
							domain: 'example.com'
						}
					]
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchAllNews();

			expect(result.politics).toBeDefined();
			expect(result.tech).toBeDefined();
			expect(result.finance).toBeDefined();
			expect(result.gov).toBeDefined();
			expect(result.ai).toBeDefined();
			expect(result.intel).toBeDefined();
		});
	});

	describe('edge cases', () => {
		it('should handle network timeout', async () => {
			mockFetch.mockRejectedValue(new Error('Network timeout'));

			const result = await fetchCategoryNews('politics');
			expect(result).toEqual([]);
		});

		it('should handle malformed GDELT date', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({
					articles: [
						{
							title: 'Test',
							url: 'https://example.com/test',
							seendate: 'invalid-date',
							domain: 'example.com'
						}
					]
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('politics');
			expect(result[0].timestamp).toBeDefined();
		});

		it('should handle articles with missing fields', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({
					articles: [
						{
							// Missing title
							url: 'https://example.com/test',
							seendate: '20251202T120000Z'
						}
					]
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('politics');
			expect(result[0].title).toBe('');
		});

		it('should handle 429 rate limit error', async () => {
			const mockResponse = {
				ok: false,
				status: 429,
				statusText: 'Too Many Requests'
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('politics');
			expect(result).toEqual([]);
		});

		it('should handle 403 forbidden error', async () => {
			const mockResponse = {
				ok: false,
				status: 403,
				statusText: 'Forbidden'
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('politics');
			expect(result).toEqual([]);
		});

		it('should handle very large response', async () => {
			const largeArticles = Array.from({ length: 1000 }, (_, i) => ({
				title: `Article ${i}`,
				url: `https://example.com/${i}`,
				seendate: '20251202T120000Z',
				domain: 'example.com'
			}));

			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({ articles: largeArticles })
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('politics');
			expect(result.length).toBe(1000);
		});

		it('should handle special characters in title', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({
					articles: [
						{
							title: 'News with <script>alert("xss")</script> & "quotes"',
							url: 'https://example.com/test',
							seendate: '20251202T120000Z',
							domain: 'example.com'
						}
					]
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchCategoryNews('politics');
			expect(result[0].title).toContain('<script>');
		});
	});
});
