import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	TranslationService,
	translate,
	translateBatch,
	type TranslationOptions
} from './translation';

describe('TranslationService', () => {
	let service: TranslationService;
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		service = new TranslationService();
		service.clearCache();

		// Mock fetch
		fetchMock = vi.fn();
		global.fetch = fetchMock;

		// Mock localStorage
		const localStorageMock = {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
			key: vi.fn(),
			length: 0
		};
		Object.defineProperty(global, 'localStorage', {
			value: localStorageMock,
			writable: true
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('translate', () => {
		it('should return empty string for empty input', async () => {
			const result = await service.translate('');
			expect(result).toBe('');
		});

		it('should return original text for whitespace-only input', async () => {
			const result = await service.translate('   ');
			expect(result).toBe('   ');
		});

		it('should return original text if it contains Chinese characters', async () => {
			const chineseText = '你好世界';
			const result = await service.translate(chineseText);
			expect(result).toBe(chineseText);
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it('should translate English text using MyMemory API', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					responseStatus: 200,
					responseData: { translatedText: '你好' }
				})
			});

			const result = await service.translate('Hello');
			expect(result).toBe('你好');
			expect(fetchMock).toHaveBeenCalledTimes(1);
		});

		it('should use cache for repeated translations', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({
					responseStatus: 200,
					responseData: { translatedText: '你好' }
				})
			});

			// First call - should hit API
			await service.translate('Hello');
			expect(fetchMock).toHaveBeenCalledTimes(1);

			// Second call - should use cache
			const result = await service.translate('Hello');
			expect(result).toBe('你好');
			expect(fetchMock).toHaveBeenCalledTimes(1); // No additional API call
		});

		it('should return original text on API error', async () => {
			fetchMock.mockRejectedValue(new Error('Network error'));

			const originalText = 'Hello World';
			const result = await service.translate(originalText);
			expect(result).toBe(originalText);
		});

		it('should return original text on HTTP error', async () => {
			fetchMock.mockResolvedValue({
				ok: false,
				status: 500
			});

			const originalText = 'Hello World';
			const result = await service.translate(originalText);
			expect(result).toBe(originalText);
		});

		it('should return original text on API response error', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({
					responseStatus: 403,
					responseDetails: 'Rate limit exceeded'
				})
			});

			const originalText = 'Hello World';
			const result = await service.translate(originalText);
			expect(result).toBe(originalText);
		});

		it('should support custom language options', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({
					responseStatus: 200,
					responseData: { translatedText: 'Hola' }
				})
			});

			const options: TranslationOptions = {
				sourceLang: 'en',
				targetLang: 'es'
			};

			await service.translate('Hello', options);

			const fetchCall = fetchMock.mock.calls[0][0];
			expect(fetchCall).toContain('langpair=en|es');
		});

		it('should disable cache when useCache is false', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({
					responseStatus: 200,
					responseData: { translatedText: '你好' }
				})
			});

			// First call without cache
			await service.translate('Hello', { useCache: false });
			expect(fetchMock).toHaveBeenCalledTimes(1);

			// Second call without cache - should still hit API
			await service.translate('Hello', { useCache: false });
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		it('should deduplicate concurrent requests for same text', async () => {
			let resolveCount = 0;
			fetchMock.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolveCount++;
							resolve({
								ok: true,
								json: async () => ({
									responseStatus: 200,
									responseData: { translatedText: '你好' }
								})
							});
						}, 10);
					})
			);

			// Multiple concurrent requests for same text
			const promises = [
				service.translate('Hello'),
				service.translate('Hello'),
				service.translate('Hello')
			];

			const results = await Promise.all(promises);

			// All should return same result
			expect(results).toEqual(['你好', '你好', '你好']);
			// But only one API call should be made
			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(resolveCount).toBe(1);
		});
	});

	describe('translateBatch', () => {
		it('should translate multiple texts', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({
					responseStatus: 200,
					responseData: { translatedText: 'Translated' }
				})
			});

			const texts = ['Text 1', 'Text 2', 'Text 3'];
			const result = await service.translateBatch(texts);

			expect(result.results.size).toBe(3);
			expect(result.failed.length).toBe(0);
		});

		it('should handle empty array', async () => {
			const result = await service.translateBatch([]);
			expect(result.results.size).toBe(0);
			expect(result.failed.length).toBe(0);
		});

		it('should deduplicate texts', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({
					responseStatus: 200,
					responseData: { translatedText: '你好' }
				})
			});

			const texts = ['Hello', 'Hello', 'Hello'];
			const result = await service.translateBatch(texts);

			// Should only make one API call for deduplicated texts
			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(result.results.size).toBe(1);
		});

		it('should track failed translations', async () => {
			fetchMock.mockRejectedValue(new Error('Network error'));

			const texts = ['Text 1', 'Text 2'];
			const result = await service.translateBatch(texts);

			expect(result.failed.length).toBe(2);
			expect(result.failed).toContain('Text 1');
			expect(result.failed).toContain('Text 2');
		});

		it('should return original text for failed translations', async () => {
			fetchMock.mockRejectedValue(new Error('Network error'));

			const texts = ['Hello'];
			const result = await service.translateBatch(texts);

			const translationResult = result.results.get('Hello');
			expect(translationResult?.translatedText).toBe('Hello');
			expect(translationResult?.fromCache).toBe(false);
		});
	});

	describe('retry logic', () => {
		it('should retry on failure and succeed eventually', async () => {
			fetchMock
				.mockRejectedValueOnce(new Error('Network error'))
				.mockRejectedValueOnce(new Error('Network error'))
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						responseStatus: 200,
						responseData: { translatedText: '你好' }
					})
				});

			const result = await service.translate('Hello');
			expect(result).toBe('你好');
			expect(fetchMock).toHaveBeenCalledTimes(3);
		});

		it('should return original text after max retries exceeded', async () => {
			fetchMock.mockRejectedValue(new Error('Network error'));

			const originalText = 'Hello World';
			const result = await service.translate(originalText);

			expect(result).toBe(originalText);
			expect(fetchMock).toHaveBeenCalledTimes(3); // MAX_RETRIES
		});
	});

	describe('cache management', () => {
		it('should clear cache', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({
					responseStatus: 200,
					responseData: { translatedText: '你好' }
				})
			});

			await service.translate('Hello');
			service.clearCache();

			// After clearing cache, should hit API again
			await service.translate('Hello');
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		it('should return cache stats', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({
					responseStatus: 200,
					responseData: { translatedText: '你好' }
				})
			});

			await service.translate('Hello');

			const stats = service.getCacheStats();
			expect(stats.memoryEntries).toBeGreaterThanOrEqual(0);
		});
	});

	describe('convenience functions', () => {
		it('translate function should work with singleton', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({
					responseStatus: 200,
					responseData: { translatedText: '世界' }
				})
			});

			const result = await translate('World');
			expect(result).toBe('世界');
		});

		it('translateBatch function should work with singleton', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({
					responseStatus: 200,
					responseData: { translatedText: '你好' }
				})
			});

			const result = await translateBatch(['Hello', 'World']);
			expect(result.results.size).toBe(2);
		});
	});

	describe('API URL construction', () => {
		it('should construct correct MyMemory API URL', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({
					responseStatus: 200,
					responseData: { translatedText: '你好' }
				})
			});

			await service.translate('Hello World');

			const fetchCall = fetchMock.mock.calls[0][0];
			expect(fetchCall).toContain('https://api.mymemory.translated.net/get');
			expect(fetchCall).toContain('q=Hello%20World');
			expect(fetchCall).toContain('langpair=en|zh');
		});

		it('should handle special characters in text', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({
					responseStatus: 200,
					responseData: { translatedText: '你好' }
				})
			});

			await service.translate('Hello & World!');

			const fetchCall = fetchMock.mock.calls[0][0];
			expect(fetchCall).toContain(encodeURIComponent('Hello & World!'));
		});
	});
});
