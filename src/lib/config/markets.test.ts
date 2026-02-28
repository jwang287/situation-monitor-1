/**
 * Tests for markets configuration
 */

import { describe, it, expect } from 'vitest';
import { SECTORS, COMMODITIES, INDICES, CRYPTO, type SectorConfig, type CommodityConfig } from './markets';

describe('Markets Configuration', () => {
	describe('SECTORS', () => {
		it('should be an array of sector configs', () => {
			expect(Array.isArray(SECTORS)).toBe(true);
			expect(SECTORS.length).toBeGreaterThan(0);
		});

		it('should have valid sector structure', () => {
			SECTORS.forEach((sector: SectorConfig) => {
				expect(sector).toHaveProperty('symbol');
				expect(sector).toHaveProperty('name');
				expect(typeof sector.symbol).toBe('string');
				expect(typeof sector.name).toBe('string');
			});
		});

		it('should have major sectors', () => {
			const symbols = SECTORS.map((s) => s.symbol);
			expect(symbols).toContain('XLK'); // Tech
			expect(symbols).toContain('XLF'); // Finance
			expect(symbols).toContain('XLE'); // Energy
			expect(symbols).toContain('XLV'); // Health
		});

		it('should have ETF symbols starting with X', () => {
			SECTORS.forEach((sector: SectorConfig) => {
				expect(sector.symbol).toMatch(/^X[A-Z]{2}$/);
			});
		});
	});

	describe('COMMODITIES', () => {
		it('should be an array of commodity configs', () => {
			expect(Array.isArray(COMMODITIES)).toBe(true);
			expect(COMMODITIES.length).toBeGreaterThan(0);
		});

		it('should have valid commodity structure', () => {
			COMMODITIES.forEach((commodity: CommodityConfig) => {
				expect(commodity).toHaveProperty('symbol');
				expect(commodity).toHaveProperty('name');
				expect(commodity).toHaveProperty('display');
				expect(typeof commodity.symbol).toBe('string');
				expect(typeof commodity.name).toBe('string');
				expect(typeof commodity.display).toBe('string');
			});
		});

		it('should have VIX', () => {
			const vix = COMMODITIES.find((c) => c.symbol === '^VIX');
			expect(vix).toBeDefined();
			expect(vix?.name).toBe('VIX');
		});

		it('should have precious metals', () => {
			const symbols = COMMODITIES.map((c) => c.symbol);
			expect(symbols).toContain('GC=F'); // Gold
			expect(symbols).toContain('SI=F'); // Silver
		});

		it('should have energy commodities', () => {
			const symbols = COMMODITIES.map((c) => c.symbol);
			expect(symbols).toContain('CL=F'); // Crude Oil
			expect(symbols).toContain('NG=F'); // Natural Gas
		});
	});

	describe('INDICES', () => {
		it('should be an array of index configs', () => {
			expect(Array.isArray(INDICES)).toBe(true);
			expect(INDICES.length).toBeGreaterThan(0);
		});

		it('should have major US indices', () => {
			const symbols = INDICES.map((i) => i.symbol);
			expect(symbols).toContain('^DJI'); // Dow Jones
			expect(symbols).toContain('^GSPC'); // S&P 500
			expect(symbols).toContain('^IXIC'); // NASDAQ
			expect(symbols).toContain('^RUT'); // Russell 2000
		});

		it('should have display names', () => {
			INDICES.forEach((index) => {
				expect(index.display).toBeDefined();
				expect(index.display.length).toBeLessThanOrEqual(4);
			});
		});
	});

	describe('CRYPTO', () => {
		it('should be an array of crypto configs', () => {
			expect(Array.isArray(CRYPTO)).toBe(true);
			expect(CRYPTO.length).toBeGreaterThan(0);
		});

		it('should have major cryptocurrencies', () => {
			const ids = CRYPTO.map((c) => c.id);
			expect(ids).toContain('bitcoin');
			expect(ids).toContain('ethereum');
			expect(ids).toContain('solana');
		});

		it('should have valid structure', () => {
			CRYPTO.forEach((crypto) => {
				expect(crypto).toHaveProperty('id');
				expect(crypto).toHaveProperty('symbol');
				expect(crypto).toHaveProperty('name');
				expect(crypto.symbol).toBe(crypto.symbol.toUpperCase());
			});
		});
	});
});
