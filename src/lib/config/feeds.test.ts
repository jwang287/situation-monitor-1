/**
 * Tests for feeds configuration
 */

import { describe, it, expect } from 'vitest';
import { FEEDS, INTEL_SOURCES, type FeedSource, type IntelSource } from './feeds';

describe('Feeds Configuration', () => {
	describe('FEEDS', () => {
		it('should have all required categories', () => {
			expect(FEEDS.politics).toBeDefined();
			expect(FEEDS.tech).toBeDefined();
			expect(FEEDS.finance).toBeDefined();
			expect(FEEDS.gov).toBeDefined();
			expect(FEEDS.ai).toBeDefined();
			expect(FEEDS.intel).toBeDefined();
		});

		it('should have valid feed structure', () => {
			Object.values(FEEDS).forEach((feeds) => {
				expect(Array.isArray(feeds)).toBe(true);
				feeds.forEach((feed: FeedSource) => {
					expect(feed).toHaveProperty('name');
					expect(feed).toHaveProperty('url');
					expect(typeof feed.name).toBe('string');
					expect(typeof feed.url).toBe('string');
					expect(feed.url).toMatch(/^https?:\/\//);
				});
			});
		});

		it('should have at least one feed per category', () => {
			Object.entries(FEEDS).forEach(([category, feeds]) => {
				expect(feeds.length).toBeGreaterThan(0);
			});
		});

		it('should have valid RSS/XML URLs', () => {
			const allFeeds = Object.values(FEEDS).flat();
			allFeeds.forEach((feed: FeedSource) => {
				expect(feed.url).toMatch(/^https?:\/\//);
			});
		});
	});

	describe('INTEL_SOURCES', () => {
		it('should be an array of intel sources', () => {
			expect(Array.isArray(INTEL_SOURCES)).toBe(true);
			expect(INTEL_SOURCES.length).toBeGreaterThan(0);
		});

		it('should have valid intel source structure', () => {
			INTEL_SOURCES.forEach((source: IntelSource) => {
				expect(source).toHaveProperty('name');
				expect(source).toHaveProperty('url');
				expect(source).toHaveProperty('type');
				expect(source).toHaveProperty('topics');
				expect(typeof source.name).toBe('string');
				expect(typeof source.url).toBe('string');
				expect(Array.isArray(source.topics)).toBe(true);
			});
		});

		it('should have valid types', () => {
			const validTypes = ['think-tank', 'defense', 'regional', 'osint', 'govt', 'cyber'];
			INTEL_SOURCES.forEach((source: IntelSource) => {
				expect(validTypes).toContain(source.type);
			});
		});

		it('should have think-tank sources', () => {
			const thinkTanks = INTEL_SOURCES.filter((s) => s.type === 'think-tank');
			expect(thinkTanks.length).toBeGreaterThan(0);
		});

		it('should have defense sources', () => {
			const defense = INTEL_SOURCES.filter((s) => s.type === 'defense');
			expect(defense.length).toBeGreaterThan(0);
		});

		it('should have cyber sources', () => {
			const cyber = INTEL_SOURCES.filter((s) => s.type === 'cyber');
			expect(cyber.length).toBeGreaterThan(0);
		});

		it('should have optional region for regional sources', () => {
			const regional = INTEL_SOURCES.filter((s) => s.type === 'regional');
			regional.forEach((source: IntelSource) => {
				expect(source.region).toBeDefined();
			});
		});
	});
});
