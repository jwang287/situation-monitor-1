/**
 * Tests for type definitions
 */

import { describe, it, expect } from 'vitest';
import type {
	NewsCategory,
	NewsItem,
	MarketItem,
	SectorPerformance,
	CryptoItem,
	SectorData,
	CommodityData,
	FedBalanceData,
	EarthquakeData,
	PredictionData,
	WhaleTransaction,
	GovContract,
	LayoffData,
	Hotspot,
	CustomMonitor,
	PanelConfig,
	CorrelationResult,
	NarrativeResult,
	MainCharacterResult,
	ServiceConfig,
	CacheEntry,
	CircuitBreakerState,
	ApiResponse,
	RefreshState,
	SettingsState,
	LeaderNews,
	WorldLeader
} from './index';

describe('Type Definitions', () => {
	describe('NewsCategory', () => {
		it('should accept valid categories', () => {
			const categories: NewsCategory[] = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'];
			expect(categories.length).toBe(6);
		});
	});

	describe('NewsItem', () => {
		it('should have required fields', () => {
			const item: NewsItem = {
				id: 'test-1',
				title: 'Test News',
				link: 'https://example.com',
				timestamp: Date.now(),
				source: 'Test Source',
				category: 'politics'
			};
			expect(item.id).toBe('test-1');
			expect(item.category).toBe('politics');
		});

		it('should have optional fields', () => {
			const item: NewsItem = {
				id: 'test-2',
				title: 'Test News',
				link: 'https://example.com',
				timestamp: Date.now(),
				source: 'Test Source',
				category: 'tech',
				isAlert: true,
				alertKeyword: 'war',
				region: 'EUROPE',
				topics: ['CYBER']
			};
			expect(item.isAlert).toBe(true);
			expect(item.region).toBe('EUROPE');
		});
	});

	describe('MarketItem', () => {
		it('should have required fields', () => {
			const item: MarketItem = {
				symbol: 'AAPL',
				name: 'Apple',
				price: 150,
				change: 5,
				changePercent: 3.5
			};
			expect(item.symbol).toBe('AAPL');
			expect(item.price).toBe(150);
		});
	});

	describe('CryptoItem', () => {
		it('should have required fields', () => {
			const item: CryptoItem = {
				id: 'bitcoin',
				symbol: 'BTC',
				name: 'Bitcoin',
				current_price: 50000,
				price_change_24h: 1000,
				price_change_percentage_24h: 2.5
			};
			expect(item.id).toBe('bitcoin');
			expect(item.current_price).toBe(50000);
		});
	});

	describe('CustomMonitor', () => {
		it('should have required fields', () => {
			const monitor: CustomMonitor = {
				id: 'monitor-1',
				name: 'Test Monitor',
				keywords: ['test', 'keyword'],
				enabled: true,
				createdAt: Date.now(),
				matchCount: 0
			};
			expect(monitor.id).toBe('monitor-1');
			expect(monitor.keywords).toHaveLength(2);
		});
	});

	describe('CorrelationResult', () => {
		it('should have required fields', () => {
			const result: CorrelationResult = {
				topic: 'AI',
				count: 10,
				sources: ['BBC', 'CNN'],
				momentum: 'rising'
			};
			expect(result.momentum).toBe('rising');
		});
	});

	describe('NarrativeResult', () => {
		it('should have required fields', () => {
			const result: NarrativeResult = {
				narrative: 'Test narrative',
				mentions: 5,
				firstSeen: Date.now() - 1000,
				lastSeen: Date.now(),
				trend: 'emerging',
				relatedTopics: ['AI', 'Tech']
			};
			expect(result.trend).toBe('emerging');
		});
	});

	describe('MainCharacterResult', () => {
		it('should have required fields', () => {
			const result: MainCharacterResult = {
				name: 'Test Person',
				mentions: 20,
				sources: ['BBC', 'CNN', 'Reuters'],
				sentiment: 'positive'
			};
			expect(result.sentiment).toBe('positive');
		});
	});

	describe('CircuitBreakerState', () => {
		it('should accept valid states', () => {
			const states: CircuitBreakerState[] = ['CLOSED', 'OPEN', 'HALF_OPEN'];
			expect(states.length).toBe(3);
		});
	});

	describe('RefreshState', () => {
		it('should have required fields', () => {
			const state: RefreshState = {
				isRefreshing: false,
				stage: 0,
				lastUpdated: null,
				error: null
			};
			expect(state.isRefreshing).toBe(false);
			expect(state.stage).toBe(0);
		});
	});

	describe('SettingsState', () => {
		it('should have required fields', () => {
			const state: SettingsState = {
				panels: { politics: true, tech: true },
				panelOrder: ['politics', 'tech'],
				theme: 'dark'
			};
			expect(state.theme).toBe('dark');
		});
	});

	describe('WorldLeader', () => {
		it('should have required fields', () => {
			const leader: WorldLeader = {
				id: 'test',
				name: 'Test Leader',
				title: 'President',
				country: 'Test Country',
				flag: '🇺🇸',
				keywords: ['test', 'leader'],
				since: '2020',
				party: 'Test Party'
			};
			expect(leader.id).toBe('test');
			expect(leader.flag).toBe('🇺🇸');
		});
	});

	describe('Hotspot', () => {
		it('should have required fields', () => {
			const hotspot: Hotspot = {
				id: 'hotspot-1',
				name: 'Test Location',
				location: 'Test City',
				lat: 40.7,
				lon: -74.0,
				level: 'high',
				category: 'conflict'
			};
			expect(hotspot.level).toBe('high');
		});
	});

	describe('ApiResponse', () => {
		it('should have required fields', () => {
			const response: ApiResponse<string> = {
				data: 'test',
				status: 'ok',
				timestamp: Date.now()
			};
			expect(response.status).toBe('ok');
		});

		it('should have optional error field', () => {
			const response: ApiResponse<null> = {
				data: null,
				status: 'error',
				error: 'Something went wrong',
				timestamp: Date.now()
			};
			expect(response.status).toBe('error');
			expect(response.error).toBe('Something went wrong');
		});
	});
});
