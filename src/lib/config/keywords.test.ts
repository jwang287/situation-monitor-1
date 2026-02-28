/**
 * Tests for keywords configuration
 */

import { describe, it, expect } from 'vitest';
import {
	ALERT_KEYWORDS,
	REGION_KEYWORDS,
	TOPIC_KEYWORDS,
	containsAlertKeyword,
	detectRegion,
	detectTopics
} from './keywords';

describe('Keywords Configuration', () => {
	describe('ALERT_KEYWORDS', () => {
		it('should be an array of strings', () => {
			expect(Array.isArray(ALERT_KEYWORDS)).toBe(true);
			expect(ALERT_KEYWORDS.length).toBeGreaterThan(0);
			ALERT_KEYWORDS.forEach((keyword) => {
				expect(typeof keyword).toBe('string');
			});
		});

		it('should contain expected keywords', () => {
			expect(ALERT_KEYWORDS).toContain('war');
			expect(ALERT_KEYWORDS).toContain('nuclear');
			expect(ALERT_KEYWORDS).toContain('military');
			expect(ALERT_KEYWORDS).toContain('attack');
		});
	});

	describe('REGION_KEYWORDS', () => {
		it('should be an object with region arrays', () => {
			expect(typeof REGION_KEYWORDS).toBe('object');
			expect(REGION_KEYWORDS.EUROPE).toBeDefined();
			expect(REGION_KEYWORDS.MENA).toBeDefined();
			expect(REGION_KEYWORDS.APAC).toBeDefined();
			expect(REGION_KEYWORDS.AMERICAS).toBeDefined();
			expect(REGION_KEYWORDS.AFRICA).toBeDefined();
		});

		it('should have keywords for each region', () => {
			Object.values(REGION_KEYWORDS).forEach((keywords) => {
				expect(Array.isArray(keywords)).toBe(true);
				expect(keywords.length).toBeGreaterThan(0);
			});
		});
	});

	describe('TOPIC_KEYWORDS', () => {
		it('should be an object with topic arrays', () => {
			expect(typeof TOPIC_KEYWORDS).toBe('object');
			expect(TOPIC_KEYWORDS.CYBER).toBeDefined();
			expect(TOPIC_KEYWORDS.NUCLEAR).toBeDefined();
			expect(TOPIC_KEYWORDS.CONFLICT).toBeDefined();
			expect(TOPIC_KEYWORDS.INTEL).toBeDefined();
			expect(TOPIC_KEYWORDS.DEFENSE).toBeDefined();
			expect(TOPIC_KEYWORDS.DIPLO).toBeDefined();
		});
	});

	describe('containsAlertKeyword', () => {
		it('should detect alert keywords in text', () => {
			const result = containsAlertKeyword('War breaks out in region');
			expect(result.isAlert).toBe(true);
			expect(result.keyword).toBe('war');
		});

		it('should be case insensitive', () => {
			const result = containsAlertKeyword('MILITARY operation announced');
			expect(result.isAlert).toBe(true);
			expect(result.keyword).toBe('military');
		});

		it('should return false for no keywords', () => {
			const result = containsAlertKeyword('Peaceful weather today');
			expect(result.isAlert).toBe(false);
			expect(result.keyword).toBeUndefined();
		});

		it('should detect partial matches', () => {
			const result = containsAlertKeyword('Nuclear weapons program');
			expect(result.isAlert).toBe(true);
		});

		it('should handle empty text', () => {
			const result = containsAlertKeyword('');
			expect(result.isAlert).toBe(false);
		});
	});

	describe('detectRegion', () => {
		it('should detect EUROPE region', () => {
			const result = detectRegion('NATO summit in Brussels');
			expect(result).toBe('EUROPE');
		});

		it('should detect MENA region', () => {
			const result = detectRegion('Iran nuclear talks continue');
			expect(result).toBe('MENA');
		});

		it('should detect APAC region', () => {
			const result = detectRegion('China Taiwan tensions rise');
			expect(result).toBe('APAC');
		});

		it('should detect AMERICAS region', () => {
			const result = detectRegion('US Canada trade deal');
			expect(result).toBe('AMERICAS');
		});

		it('should detect AFRICA region', () => {
			const result = detectRegion('Sahel region conflict');
			expect(result).toBe('AFRICA');
		});

		it('should return null for no region match', () => {
			const result = detectRegion('Generic news story');
			expect(result).toBeNull();
		});

		it('should be case insensitive', () => {
			const result = detectRegion('RUSSIA UKRAINE CONFLICT');
			expect(result).toBe('EUROPE');
		});
	});

	describe('detectTopics', () => {
		it('should detect CYBER topic', () => {
			const result = detectTopics('Major cyber attack discovered');
			expect(result).toContain('CYBER');
		});

		it('should detect NUCLEAR topic', () => {
			const result = detectTopics('Nuclear program expansion');
			expect(result).toContain('NUCLEAR');
		});

		it('should detect CONFLICT topic', () => {
			const result = detectTopics('Military troops deployed');
			expect(result).toContain('CONFLICT');
		});

		it('should detect multiple topics', () => {
			const result = detectTopics('Cyber attack on nuclear facility');
			expect(result).toContain('CYBER');
			expect(result).toContain('NUCLEAR');
		});

		it('should return empty array for no topics', () => {
			const result = detectTopics('Weather forecast today');
			expect(result).toEqual([]);
		});

		it('should be case insensitive', () => {
			const result = detectTopics('DEFENSE DEPARTMENT ANNOUNCEMENT');
			expect(result).toContain('DEFENSE');
		});
	});
});
