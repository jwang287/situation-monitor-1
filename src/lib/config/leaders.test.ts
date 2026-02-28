/**
 * Tests for leaders configuration
 */

import { describe, it, expect } from 'vitest';
import { WORLD_LEADERS } from './leaders';
import type { WorldLeader } from '$lib/types';

describe('Leaders Configuration', () => {
	describe('WORLD_LEADERS', () => {
		it('should be an array of world leaders', () => {
			expect(Array.isArray(WORLD_LEADERS)).toBe(true);
			expect(WORLD_LEADERS.length).toBeGreaterThan(0);
		});

		it('should have valid leader structure', () => {
			WORLD_LEADERS.forEach((leader: WorldLeader) => {
				expect(leader).toHaveProperty('id');
				expect(leader).toHaveProperty('name');
				expect(leader).toHaveProperty('title');
				expect(leader).toHaveProperty('country');
				expect(leader).toHaveProperty('flag');
				expect(leader).toHaveProperty('keywords');
				expect(leader).toHaveProperty('since');
				expect(leader).toHaveProperty('party');
				expect(typeof leader.id).toBe('string');
				expect(typeof leader.name).toBe('string');
				expect(Array.isArray(leader.keywords)).toBe(true);
			});
		});

		it('should have unique IDs', () => {
			const ids = WORLD_LEADERS.map((l) => l.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		it('should have US leaders', () => {
			const usLeaders = WORLD_LEADERS.filter((l) => l.country === 'United States');
			expect(usLeaders.length).toBeGreaterThan(0);
		});

		it('should have Chinese leader', () => {
			const chinaLeader = WORLD_LEADERS.find((l) => l.country === 'China');
			expect(chinaLeader).toBeDefined();
		});

		it('should have Russian leader', () => {
			const russiaLeader = WORLD_LEADERS.find((l) => l.country === 'Russia');
			expect(russiaLeader).toBeDefined();
		});

		it('should have European leaders', () => {
			const euCountries = ['United Kingdom', 'France', 'Germany', 'Italy'];
			const euLeaders = WORLD_LEADERS.filter((l) => euCountries.includes(l.country));
			expect(euLeaders.length).toBeGreaterThan(0);
		});

		it('should have Middle East leaders', () => {
			const menaCountries = ['Israel', 'Saudi Arabia', 'Iran'];
			const menaLeaders = WORLD_LEADERS.filter((l) => menaCountries.includes(l.country));
			expect(menaLeaders.length).toBeGreaterThan(0);
		});

		it('should have Asia-Pacific leaders', () => {
			const apacCountries = ['Japan', 'India', 'North Korea', 'Taiwan'];
			const apacLeaders = WORLD_LEADERS.filter((l) => apacCountries.includes(l.country));
			expect(apacLeaders.length).toBeGreaterThan(0);
		});

		it('should have Ukraine leader', () => {
			const ukraineLeader = WORLD_LEADERS.find((l) => l.country === 'Ukraine');
			expect(ukraineLeader).toBeDefined();
		});

		it('should have at least one keyword per leader', () => {
			WORLD_LEADERS.forEach((leader: WorldLeader) => {
				expect(leader.keywords.length).toBeGreaterThan(0);
			});
		});

		it('should have optional focus areas', () => {
			const leadersWithFocus = WORLD_LEADERS.filter((l) => l.focus);
			expect(leadersWithFocus.length).toBeGreaterThan(0);
		});

		it('should have emoji flags', () => {
			WORLD_LEADERS.forEach((leader: WorldLeader) => {
				expect(leader.flag).toMatch(/[\u{1F1E0}-\u{1F1FF}]/u);
			});
		});
	});
});
