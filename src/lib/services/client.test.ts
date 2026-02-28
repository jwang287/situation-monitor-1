/**
 * Tests for ServiceClient
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ServiceClient, serviceClient } from './client';

// Mock dependencies
vi.mock('./cache', () => ({
	CacheManager: vi.fn().mockImplementation(() => ({
		get: vi.fn(),
		set: vi.fn(),
		generateKey: vi.fn((url: string) => `cache-${url}`),
		getStats: vi.fn(() => ({ hits: 0, misses: 0, size: 0 })),
		invalidate: vi.fn()
	}))
}));

vi.mock('./circuit-breaker', () => ({
	CircuitBreakerRegistry: vi.fn().mockImplementation(() => ({
		get: vi.fn().mockReturnValue({
			canRequest: vi.fn(() => true),
			recordSuccess: vi.fn(),
			recordFailure: vi.fn(),
			trackHalfOpenRequest: vi.fn(),
			getState: vi.fn(() => ({ state: 'CLOSED', failures: 0 }))
		}),
		getStatus: vi.fn(() => ({})),
		getOpenCount: vi.fn(() => 0),
		resetAll: vi.fn()
	}))
}));

vi.mock('./deduplicator', () => ({
	RequestDeduplicator: vi.fn().mockImplementation(() => ({
		dedupe: vi.fn((key: string, fn: () => Promise<unknown>) => fn()),
		getCount: vi.fn(() => 0)
	}))
}));

vi.mock('./registry', () => ({
	ServiceRegistry: {
		get: vi.fn((id: string) => {
			if (id === 'unknown') return null;
			return {
				name: id,
				baseUrl: 'https://api.example.com',
				timeout: 5000,
				retries: 2,
				cache: { ttl: 60000, staleWhileRevalidate: true },
				circuitBreaker: { failureThreshold: 3, resetTimeout: 30000 }
			};
		}),
		getCorsProxies: vi.fn(() => ['https://proxy1.com/?url=', 'https://proxy2.com/?url='])
	}
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ServiceClient', () => {
	let client: ServiceClient;

	beforeEach(() => {
		vi.clearAllMocks();
		client = new ServiceClient({ debug: true });
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('constructor', () => {
		it('should create client with default options', () => {
			const defaultClient = new ServiceClient();
			expect(defaultClient).toBeDefined();
		});

		it('should create client with debug option', () => {
			const debugClient = new ServiceClient({ debug: true });
			expect(debugClient).toBeDefined();
		});
	});

	describe('request', () => {
		it('should throw error for unknown service', async () => {
			await expect(client.request('unknown', '/test')).rejects.toThrow('Unknown service');
		});

		it('should make successful request', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				json: async () => ({ data: 'test' })
			});

			const result = await client.request('test-service', '/endpoint');

			expect(result.data).toEqual({ data: 'test' });
			expect(result.fromCache).toBe(false);
		});

		it('should include params in URL', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				headers: new Headers({ 'content-type': 'application/json' }),
				json: async () => ({})
			});

			await client.request('test-service', '/endpoint', {
				params: { foo: 'bar', num: 123 }
			});

			const calledUrl = mockFetch.mock.calls[0][0];
			expect(calledUrl).toContain('foo=bar');
			expect(calledUrl).toContain('num=123');
		});

		it('should handle HTTP error', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			});

			await expect(client.request('test-service', '/endpoint')).rejects.toThrow();
		});

		it('should handle 404 error', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: 'Not Found'
			});

			await expect(client.request('test-service', '/endpoint')).rejects.toThrow();
		});

		it('should handle timeout', async () => {
			mockFetch.mockImplementationOnce(() => {
				return new Promise((_, reject) => {
					const error = new Error('Aborted');
					error.name = 'AbortError';
					setTimeout(() => reject(error), 10);
				});
			});

			await expect(client.request('test-service', '/endpoint', { timeout: 5 })).rejects.toThrow();
		});
	});

	describe('fetchWithProxy', () => {
		it('should fetch through proxy', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				headers: new Headers({ 'content-type': 'text/xml' }),
				text: async () => '<?xml version="1.0"?><rss></rss>'
			});

			const result = await client.fetchWithProxy('https://example.com/feed.xml');

			expect(result).toContain('<?xml');
		});

		it('should try fallback proxy on failure', async () => {
			mockFetch
				.mockRejectedValueOnce(new Error('Proxy 1 failed'))
				.mockResolvedValueOnce({
					ok: true,
					headers: new Headers({ 'content-type': 'text/xml' }),
					text: async () => '<?xml version="1.0"?><rss></rss>'
				});

			const result = await client.fetchWithProxy('https://example.com/feed.xml');

			expect(result).toContain('<?xml');
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it('should throw when all proxies fail', async () => {
			mockFetch.mockRejectedValue(new Error('All proxies failed'));

			await expect(client.fetchWithProxy('https://example.com/feed.xml')).rejects.toThrow();
		});
	});

	describe('getHealthStatus', () => {
		it('should return health status', () => {
			const status = client.getHealthStatus();

			expect(status).toHaveProperty('circuitBreakers');
			expect(status).toHaveProperty('openCircuits');
			expect(status).toHaveProperty('inFlightRequests');
			expect(status).toHaveProperty('cacheStats');
		});
	});

	describe('clearServiceCache', () => {
		it('should clear cache for pattern', () => {
			expect(() => client.clearServiceCache('test')).not.toThrow();
		});
	});

	describe('resetCircuitBreakers', () => {
		it('should reset all circuit breakers', () => {
			expect(() => client.resetCircuitBreakers()).not.toThrow();
		});
	});
});

describe('serviceClient singleton', () => {
	it('should be a ServiceClient instance', () => {
		expect(serviceClient).toBeInstanceOf(ServiceClient);
	});
});
