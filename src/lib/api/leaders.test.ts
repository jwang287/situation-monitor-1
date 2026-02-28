/**
 * Tests for leaders API
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchWorldLeaders } from './leaders';

// Mock dependencies
vi.mock('$lib/config/leaders', () => ({
	WORLD_LEADERS: [
		{
			id: 'trump',
			name: 'Donald Trump',
			title: 'President',
			country: 'United States',
			flag: '🇺🇸',
			keywords: ['Trump', 'Donald Trump'],
			since: '2025-01-20',
			party: 'Republican'
		},
		{
			id: 'biden',
			name: 'Joe Biden',
			title: 'Former President',
			country: 'United States',
			flag: '🇺🇸',
			keywords: ['Biden', 'Joe Biden'],
			since: '2021-01-20',
			party: 'Democrat'
		},
		{
			id: 'putin',
			name: 'Vladimir Putin',
			title: 'President',
			country: 'Russia',
			flag: '🇷🇺',
			keywords: ['Putin', 'Vladimir Putin'],
			since: '2000-05-07',
			party: 'Independent'
		}
	]
}));

vi.mock('$lib/config/api', () => ({
	fetchWithProxy: vi.fn(),
	logger: {
		log: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

import { fetchWithProxy } from '$lib/config/api';

describe('Leaders API', () => {
	const mockFetch = vi.mocked(fetchWithProxy);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('fetchWorldLeaders', () => {
		it('should fetch news for all leaders', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({
					articles: [
						{
							title: 'Trump announces policy',
							url: 'https://example.com/1',
							seendate: '20251202T120000Z',
							domain: 'example.com'
						}
					]
				})
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchWorldLeaders();

			expect(result).toHaveLength(3);
			expect(result[0].news).toBeDefined();
			expect(result[0].news?.length).toBeGreaterThan(0);
		});

		it('should handle empty news response', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({ articles: [] })
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchWorldLeaders();

			expect(result).toHaveLength(3);
			result.forEach(leader => {
				expect(leader.news).toEqual([]);
			});
		});

		it('should handle non-JSON response', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'text/html' }),
				text: async () => '<html>Error</html>'
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			const result = await fetchWorldLeaders();

			expect(result).toHaveLength(3);
			result.forEach(leader => {
				expect(leader.news).toEqual([]);
			});
		});

		it('should handle HTTP error', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			const result = await fetchWorldLeaders();

			expect(result).toHaveLength(3);
			result.forEach(leader => {
				expect(leader.news).toEqual([]);
			});
		});

		it('should sort leaders by news activity', async () => {
			// First call returns 2 articles, second returns 1, third returns 0
			const mockResponses = [
				{
					ok: true,
					headers: new Headers({ 'content-type': 'application/json' }),
					text: async () => JSON.stringify({
						articles: [
							{ title: 'Article 1', url: 'https://a.com/1', seendate: '20251202T120000Z', domain: 'a.com' },
							{ title: 'Article 2', url: 'https://a.com/2', seendate: '20251202T120000Z', domain: 'a.com' }
						]
					})
				},
				{
					ok: true,
					headers: new Headers({ 'content-type': 'application/json' }),
					text: async () => JSON.stringify({
						articles: [
							{ title: 'Article 3', url: 'https://b.com/1', seendate: '20251202T120000Z', domain: 'b.com' }
						]
					})
				},
				{
					ok: true,
					headers: new Headers({ 'content-type': 'application/json' }),
					text: async () => JSON.stringify({ articles: [] })
				}
			];

			mockFetch
				.mockResolvedValueOnce(mockResponses[0] as Response)
				.mockResolvedValueOnce(mockResponses[1] as Response)
				.mockResolvedValueOnce(mockResponses[2] as Response);

			const result = await fetchWorldLeaders();

			// Should be sorted by news count (descending)
			expect(result[0].news?.length).toBe(2);
			expect(result[1].news?.length).toBe(1);
			expect(result[2].news?.length).toBe(0);
		});

		it('should use batch processing', async () => {
			const mockResponse = {
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({ articles: [] })
			};
			mockFetch.mockResolvedValue(mockResponse as Response);

			await fetchWorldLeaders();

			// Should make a request for each leader
			expect(mockFetch).toHaveBeenCalledTimes(3);
		});
	});
});
