/**
 * Tests for misc API
 */

import { describe, it, expect } from 'vitest';
import { fetchPolymarket, fetchWhaleTransactions, fetchGovContracts, fetchLayoffs } from './misc';

describe('Misc API', () => {
	describe('fetchPolymarket', () => {
		it('should return predictions array', async () => {
			const result = await fetchPolymarket();

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should have valid prediction structure', async () => {
			const result = await fetchPolymarket();

			result.forEach(prediction => {
				expect(prediction).toHaveProperty('id');
				expect(prediction).toHaveProperty('question');
				expect(prediction).toHaveProperty('yes');
				expect(prediction).toHaveProperty('volume');
				expect(typeof prediction.yes).toBe('number');
				expect(prediction.yes).toBeGreaterThanOrEqual(0);
				expect(prediction.yes).toBeLessThanOrEqual(100);
			});
		});
	});

	describe('fetchWhaleTransactions', () => {
		it('should return whale transactions array', async () => {
			const result = await fetchWhaleTransactions();

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should have valid transaction structure', async () => {
			const result = await fetchWhaleTransactions();

			result.forEach(tx => {
				expect(tx).toHaveProperty('coin');
				expect(tx).toHaveProperty('amount');
				expect(tx).toHaveProperty('usd');
				expect(tx).toHaveProperty('hash');
				expect(typeof tx.amount).toBe('number');
				expect(typeof tx.usd).toBe('number');
				expect(tx.usd).toBeGreaterThan(0);
			});
		});

		it('should include major cryptocurrencies', async () => {
			const result = await fetchWhaleTransactions();
			const coins = result.map(tx => tx.coin);

			expect(coins.some(c => c === 'BTC')).toBe(true);
			expect(coins.some(c => c === 'ETH')).toBe(true);
		});
	});

	describe('fetchGovContracts', () => {
		it('should return contracts array', async () => {
			const result = await fetchGovContracts();

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should have valid contract structure', async () => {
			const result = await fetchGovContracts();

			result.forEach(contract => {
				expect(contract).toHaveProperty('agency');
				expect(contract).toHaveProperty('description');
				expect(contract).toHaveProperty('vendor');
				expect(contract).toHaveProperty('amount');
				expect(typeof contract.amount).toBe('number');
				expect(contract.amount).toBeGreaterThan(0);
			});
		});

		it('should include major agencies', async () => {
			const result = await fetchGovContracts();
			const agencies = result.map(c => c.agency);

			expect(agencies.some(a => ['DOD', 'NASA', 'DHS', 'VA', 'DOE'].includes(a))).toBe(true);
		});
	});

	describe('fetchLayoffs', () => {
		it('should return layoffs array', async () => {
			const result = await fetchLayoffs();

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should have valid layoff structure', async () => {
			const result = await fetchLayoffs();

			result.forEach(layoff => {
				expect(layoff).toHaveProperty('company');
				expect(layoff).toHaveProperty('count');
				expect(layoff).toHaveProperty('title');
				expect(layoff).toHaveProperty('date');
				expect(typeof layoff.count).toBe('number');
				expect(layoff.count).toBeGreaterThan(0);
			});
		});

		it('should have valid ISO dates', async () => {
			const result = await fetchLayoffs();

			result.forEach(layoff => {
				expect(() => new Date(layoff.date)).not.toThrow();
				expect(new Date(layoff.date).getTime()).toBeLessThanOrEqual(Date.now());
			});
		});
	});
});
