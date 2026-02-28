/**
 * Tests for error classes
 */

import { describe, it, expect } from 'vitest';
import { ServiceError, NetworkError, TimeoutError, CircuitOpenError } from './errors';

describe('Error Classes', () => {
	describe('ServiceError', () => {
		it('should create ServiceError with message', () => {
			const error = new ServiceError('Test error');
			expect(error.message).toBe('Test error');
			expect(error.name).toBe('ServiceError');
			expect(error.serviceId).toBeNull();
		});

		it('should create ServiceError with serviceId', () => {
			const error = new ServiceError('Test error', 'test-service');
			expect(error.message).toBe('Test error');
			expect(error.serviceId).toBe('test-service');
		});

		it('should be instanceof Error', () => {
			const error = new ServiceError('Test');
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(ServiceError);
		});
	});

	describe('NetworkError', () => {
		it('should create NetworkError with message', () => {
			const error = new NetworkError('Network failed');
			expect(error.message).toBe('Network failed');
			expect(error.name).toBe('NetworkError');
			expect(error.status).toBeNull();
		});

		it('should create NetworkError with status code', () => {
			const error = new NetworkError('Not found', 404);
			expect(error.message).toBe('Not found');
			expect(error.status).toBe(404);
		});

		it('should handle different HTTP status codes', () => {
			const error500 = new NetworkError('Server error', 500);
			const error401 = new NetworkError('Unauthorized', 401);
			const error403 = new NetworkError('Forbidden', 403);

			expect(error500.status).toBe(500);
			expect(error401.status).toBe(401);
			expect(error403.status).toBe(403);
		});
	});

	describe('TimeoutError', () => {
		it('should create TimeoutError with URL', () => {
			const error = new TimeoutError('https://api.example.com');
			expect(error.message).toBe('Request timed out: https://api.example.com');
			expect(error.name).toBe('TimeoutError');
			expect(error.url).toBe('https://api.example.com');
		});

		it('should create TimeoutError with timeout value', () => {
			const error = new TimeoutError('https://api.example.com', 5000);
			expect(error.url).toBe('https://api.example.com');
			expect(error.timeout).toBe(5000);
		});

		it('should handle null timeout', () => {
			const error = new TimeoutError('https://api.example.com', null);
			expect(error.timeout).toBeNull();
		});
	});

	describe('CircuitOpenError', () => {
		it('should create CircuitOpenError with serviceId', () => {
			const error = new CircuitOpenError('test-service');
			expect(error.message).toBe('Circuit breaker open for service: test-service');
			expect(error.name).toBe('CircuitOpenError');
			expect(error.serviceId).toBe('test-service');
		});

		it('should include serviceId in message', () => {
			const error = new CircuitOpenError('GDELT');
			expect(error.message).toContain('GDELT');
		});
	});

	describe('Error inheritance', () => {
		it('should all extend Error', () => {
			expect(new ServiceError('test')).toBeInstanceOf(Error);
			expect(new NetworkError('test')).toBeInstanceOf(Error);
			expect(new TimeoutError('test')).toBeInstanceOf(Error);
			expect(new CircuitOpenError('test')).toBeInstanceOf(Error);
		});

		it('should maintain stack trace', () => {
			const error = new ServiceError('Test error');
			expect(error.stack).toBeDefined();
		});
	});
});
