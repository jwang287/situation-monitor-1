/**
 * Tests for format utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	timeAgo,
	getRelativeTime,
	formatCurrency,
	formatNumber,
	formatPercentChange,
	getChangeClass,
	escapeHtml,
	getDateDaysAgo,
	getToday,
	latLonToXY
} from './format';

describe('Format Utilities', () => {
	describe('timeAgo', () => {
		it('should return "just now" for recent dates', () => {
			const now = new Date();
			expect(timeAgo(now)).toBe('just now');
		});

		it('should return minutes for recent times', () => {
			const date = new Date(Date.now() - 5 * 60 * 1000);
			expect(timeAgo(date)).toBe('5m');
		});

		it('should return hours for recent times', () => {
			const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
			expect(timeAgo(date)).toBe('3h');
		});

		it('should return days for older times', () => {
			const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
			expect(timeAgo(date)).toBe('2d');
		});

		it('should handle string dates', () => {
			const date = new Date(Date.now() - 5 * 60 * 1000).toISOString();
			expect(timeAgo(date)).toBe('5m');
		});

		it('should handle timestamp numbers', () => {
			const timestamp = Date.now() - 5 * 60 * 1000;
			expect(timeAgo(timestamp)).toBe('5m');
		});
	});

	describe('getRelativeTime', () => {
		it('should return "Just now" for recent dates', () => {
			const now = new Date();
			expect(getRelativeTime(now)).toBe('Just now');
		});

		it('should return hours ago', () => {
			const date = new Date(Date.now() - 5 * 60 * 60 * 1000);
			expect(getRelativeTime(date)).toBe('5h ago');
		});

		it('should return days ago', () => {
			const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
			expect(getRelativeTime(date)).toBe('3d ago');
		});

		it('should return locale date for older times', () => {
			const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
			expect(getRelativeTime(date)).toBe(date.toLocaleDateString());
		});
	});

	describe('formatCurrency', () => {
		it('should format basic currency', () => {
			expect(formatCurrency(1000)).toBe('$1,000');
		});

		it('should format with decimals', () => {
			expect(formatCurrency(1000.50)).toBe('$1,000.5');
		});

		it('should format compact numbers', () => {
			expect(formatCurrency(1500, { compact: true })).toBe('$1.5K');
			expect(formatCurrency(1500000, { compact: true })).toBe('$1.5M');
			expect(formatCurrency(1500000000, { compact: true })).toBe('$1.5B');
			expect(formatCurrency(1500000000000, { compact: true })).toBe('$1.5T');
		});

		it('should use custom symbol', () => {
			expect(formatCurrency(1000, { symbol: '€' })).toBe('€1,000');
		});

		it('should handle negative values', () => {
			expect(formatCurrency(-1000)).toBe('-$1,000');
		});
	});

	describe('formatNumber', () => {
		it('should format basic numbers', () => {
			expect(formatNumber(1000)).toBe('1,000.00');
		});

		it('should format with custom decimals', () => {
			expect(formatNumber(1000.555, 1)).toBe('1,000.6');
		});

		it('should format compact numbers', () => {
			expect(formatNumber(1500)).toBe('1.5K');
			expect(formatNumber(1500000)).toBe('1.5M');
			expect(formatNumber(1500000000)).toBe('1.5B');
		});

		it('should handle negative values', () => {
			expect(formatNumber(-1500000)).toBe('-1.5M');
		});
	});

	describe('formatPercentChange', () => {
		it('should format positive change with + sign', () => {
			expect(formatPercentChange(5.5)).toBe('+5.50%');
		});

		it('should format negative change', () => {
			expect(formatPercentChange(-3.2)).toBe('-3.20%');
		});

		it('should format zero change', () => {
			expect(formatPercentChange(0)).toBe('+0.00%');
		});

		it('should format with custom decimals', () => {
			expect(formatPercentChange(5.555, 1)).toBe('+5.6%');
		});
	});

	describe('getChangeClass', () => {
		it('should return "up" for positive values', () => {
			expect(getChangeClass(5)).toBe('up');
			expect(getChangeClass(0.1)).toBe('up');
		});

		it('should return "down" for negative values', () => {
			expect(getChangeClass(-5)).toBe('down');
			expect(getChangeClass(-0.1)).toBe('down');
		});

		it('should return empty string for zero', () => {
			expect(getChangeClass(0)).toBe('');
		});
	});

	describe('escapeHtml', () => {
		it('should escape HTML entities', () => {
			// Note: This test requires a DOM environment
			// In jsdom, this should work
			if (typeof document !== 'undefined') {
				expect(escapeHtml('<script>alert("xss")</script>')).not.toContain('<script>');
				expect(escapeHtml('Test & Example')).not.toContain('&');
			}
		});

		it('should handle empty strings', () => {
			if (typeof document !== 'undefined') {
				expect(escapeHtml('')).toBe('');
			}
		});
	});

	describe('getDateDaysAgo', () => {
		it('should return date string for days ago', () => {
			const result = getDateDaysAgo(5);
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});

		it('should return today for 0 days', () => {
			const today = new Date().toISOString().split('T')[0];
			expect(getDateDaysAgo(0)).toBe(today);
		});
	});

	describe('getToday', () => {
		it('should return today\'s date', () => {
			const today = new Date().toISOString().split('T')[0];
			expect(getToday()).toBe(today);
		});

		it('should return in YYYY-MM-DD format', () => {
			expect(getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});
	});

	describe('latLonToXY', () => {
		it('should convert lat/lon to XY coordinates', () => {
			const result = latLonToXY(0, 0, 1000, 500);
			expect(result.x).toBe(500);
			expect(result.y).toBe(250);
		});

		it('should handle extreme coordinates', () => {
			const topLeft = latLonToXY(90, -180, 1000, 500);
			expect(topLeft.x).toBe(0);
			expect(topLeft.y).toBe(0);

			const bottomRight = latLonToXY(-90, 180, 1000, 500);
			expect(bottomRight.x).toBe(1000);
			expect(bottomRight.y).toBe(500);
		});

		it('should handle New York coordinates', () => {
			const ny = latLonToXY(40.7128, -74.006, 1000, 500);
			expect(ny.x).toBeGreaterThan(0);
			expect(ny.x).toBeLessThan(1000);
			expect(ny.y).toBeGreaterThan(0);
			expect(ny.y).toBeLessThan(500);
		});
	});
});
