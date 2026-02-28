/**
 * Tests for panels configuration
 */

import { describe, it, expect } from 'vitest';
import { PANELS, NON_DRAGGABLE_PANELS, MAP_ZOOM_MIN, MAP_ZOOM_MAX, MAP_ZOOM_STEP, type PanelId, type PanelConfig } from './panels';

describe('Panels Configuration', () => {
	describe('PANELS', () => {
		it('should be an object with panel configs', () => {
			expect(typeof PANELS).toBe('object');
			expect(Object.keys(PANELS).length).toBeGreaterThan(0);
		});

		it('should have valid panel structure', () => {
			Object.entries(PANELS).forEach(([id, config]: [string, PanelConfig]) => {
				expect(config).toHaveProperty('name');
				expect(config).toHaveProperty('priority');
				expect(typeof config.name).toBe('string');
				expect([1, 2, 3]).toContain(config.priority);
			});
		});

		it('should have required panels', () => {
			const requiredPanels = ['map', 'politics', 'tech', 'finance', 'markets', 'leaders'];
			requiredPanels.forEach((panel) => {
				expect(PANELS[panel as PanelId]).toBeDefined();
			});
		});

		it('should have priority 1 panels', () => {
			const priority1 = Object.entries(PANELS).filter(([, config]) => config.priority === 1);
			expect(priority1.length).toBeGreaterThan(0);
		});

		it('should have Chinese names', () => {
			Object.values(PANELS).forEach((config: PanelConfig) => {
				expect(config.name).toMatch(/[\u4e00-\u9fff]/);
			});
		});
	});

	describe('NON_DRAGGABLE_PANELS', () => {
		it('should be an array', () => {
			expect(Array.isArray(NON_DRAGGABLE_PANELS)).toBe(true);
		});

		it('should contain map', () => {
			expect(NON_DRAGGABLE_PANELS).toContain('map');
		});

		it('should have valid panel IDs', () => {
			NON_DRAGGABLE_PANELS.forEach((id) => {
				expect(PANELS[id]).toBeDefined();
			});
		});
	});

	describe('Map zoom constants', () => {
		it('should have valid zoom range', () => {
			expect(MAP_ZOOM_MIN).toBeLessThan(MAP_ZOOM_MAX);
			expect(MAP_ZOOM_MIN).toBeGreaterThan(0);
			expect(MAP_ZOOM_MAX).toBeGreaterThan(0);
		});

		it('should have valid zoom step', () => {
			expect(MAP_ZOOM_STEP).toBeGreaterThan(0);
			expect(MAP_ZOOM_STEP).toBeLessThan(MAP_ZOOM_MAX - MAP_ZOOM_MIN);
		});
	});
});
