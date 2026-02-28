/**
 * SmartCache - 智能缓存系统
 * 支持 stale-while-revalidate 策略，提升用户体验
 */

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	accessCount: number;
	lastAccessed: number;
}

interface CacheConfig {
	/** 缓存有效期 (ms) */
	ttl: number;
	/** 过期后仍可使用的时间 (stale-while-revalidate) */
	staleTtl: number;
	/** 最大重试次数 */
	maxRetries?: number;
	/** 重试延迟 (ms) */
	retryDelay?: number;
}

interface CacheStats {
	hits: number;
	misses: number;
	staleHits: number;
	errors: number;
	size: number;
	memoryUsage: number;
}

type CacheKey = string;

/**
 * 智能缓存管理器
 * 实现 stale-while-revalidate 模式，优先返回缓存数据，后台刷新
 */
export class SmartCache {
	private cache = new Map<CacheKey, CacheEntry<unknown>>();
	private pendingFetches = new Map<CacheKey, Promise<unknown>>();
	private stats: CacheStats = {
		hits: 0,
		misses: 0,
		staleHits: 0,
		errors: 0,
		size: 0,
		memoryUsage: 0
	};

	// 默认配置
	private defaultConfig: CacheConfig = {
		ttl: 5 * 60 * 1000, // 5分钟
		staleTtl: 10 * 60 * 1000, // 10分钟
		maxRetries: 2,
		retryDelay: 1000
	};

	/**
	 * 获取缓存数据，支持 stale-while-revalidate
	 * @param key 缓存键
	 * @param fetcher 数据获取函数
	 * @param config 缓存配置
	 */
	async get<T>(
		key: CacheKey,
		fetcher: () => Promise<T>,
		config: Partial<CacheConfig> = {}
	): Promise<T> {
		const mergedConfig = { ...this.defaultConfig, ...config };
		const now = Date.now();
		const entry = this.cache.get(key);

		// 1. 缓存有效，直接返回
		if (entry && now - entry.timestamp < mergedConfig.ttl) {
			this.updateAccessStats(entry);
			this.stats.hits++;
			console.log(`[SmartCache] Hit: ${key} (fresh)`);
			return entry.data as T;
		}

		// 2. 缓存过期但可用 (stale-while-revalidate)
		if (entry && now - entry.timestamp < mergedConfig.ttl + mergedConfig.staleTtl) {
			this.stats.staleHits++;
			console.log(`[SmartCache] Stale hit: ${key}, refreshing in background`);

			// 后台刷新，不阻塞返回
			this.refreshInBackground(key, fetcher, mergedConfig);

			// 立即返回过期数据
			this.updateAccessStats(entry);
			return entry.data as T;
		}

		// 3. 无缓存或完全过期，同步获取
		this.stats.misses++;
		console.log(`[SmartCache] Miss: ${key}, fetching...`);
		return this.fetchAndCache(key, fetcher, mergedConfig);
	}

	/**
	 * 强制刷新缓存
	 */
	async refresh<T>(key: CacheKey, fetcher: () => Promise<T>, config?: Partial<CacheConfig>): Promise<T> {
		console.log(`[SmartCache] Force refresh: ${key}`);
		return this.fetchAndCache(key, fetcher, { ...this.defaultConfig, ...config });
	}

	/**
	 * 后台刷新缓存
	 */
	private async refreshInBackground<T>(key: CacheKey, fetcher: () => Promise<T>, config: CacheConfig): Promise<void> {
		// 避免重复请求
		if (this.pendingFetches.has(key)) {
			console.log(`[SmartCache] Background refresh already in progress: ${key}`);
			return;
		}

		const fetchPromise = this.fetchWithRetry(key, fetcher, config)
			.then((data) => {
				this.cache.set(key, {
					data,
					timestamp: Date.now(),
					accessCount: 1,
					lastAccessed: Date.now()
				});
				console.log(`[SmartCache] Background refresh complete: ${key}`);
			})
			.catch((error) => {
				this.stats.errors++;
				console.error(`[SmartCache] Background refresh failed: ${key}`, error);
			})
			.finally(() => {
				this.pendingFetches.delete(key);
			});

		this.pendingFetches.set(key, fetchPromise);
	}

	/**
	 * 获取并缓存数据
	 */
	private async fetchAndCache<T>(key: CacheKey, fetcher: () => Promise<T>, config: CacheConfig): Promise<T> {
		// 检查是否有进行中的请求
		const pending = this.pendingFetches.get(key);
		if (pending) {
			console.log(`[SmartCache] Reusing pending fetch: ${key}`);
			return pending as Promise<T>;
		}

		const fetchPromise = this.fetchWithRetry(key, fetcher, config)
			.then((data) => {
				this.cache.set(key, {
					data,
					timestamp: Date.now(),
					accessCount: 1,
					lastAccessed: Date.now()
				});
				return data;
			})
			.catch((error) => {
				this.stats.errors++;
				throw error;
			})
			.finally(() => {
				this.pendingFetches.delete(key);
			});

		this.pendingFetches.set(key, fetchPromise);
		return fetchPromise;
	}

	/**
	 * 带重试的获取
	 */
	private async fetchWithRetry<T>(
		key: CacheKey,
		fetcher: () => Promise<T>,
		config: CacheConfig,
		attempt = 1
	): Promise<T> {
		try {
			return await fetcher();
		} catch (error) {
			if (attempt < (config.maxRetries || 1)) {
				console.log(`[SmartCache] Retry ${attempt}/${config.maxRetries} for ${key}`);
				await this.delay(config.retryDelay || 1000);
				return this.fetchWithRetry(key, fetcher, config, attempt + 1);
			}
			throw error;
		}
	}

	/**
	 * 更新访问统计
	 */
	private updateAccessStats(entry: CacheEntry<unknown>): void {
		entry.accessCount++;
		entry.lastAccessed = Date.now();
	}

	/**
	 * 设置缓存
	 */
	set<T>(key: CacheKey, data: T): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			accessCount: 1,
			lastAccessed: Date.now()
		});
		console.log(`[SmartCache] Set: ${key}`);
	}

	/**
	 * 获取缓存（不触发获取）
	 */
	peek<T>(key: CacheKey): T | undefined {
		const entry = this.cache.get(key);
		return entry?.data as T | undefined;
	}

	/**
	 * 检查缓存是否存在且有效
	 */
	isValid(key: CacheKey, ttl?: number): boolean {
		const entry = this.cache.get(key);
		if (!entry) return false;
		const validTtl = ttl || this.defaultConfig.ttl;
		return Date.now() - entry.timestamp < validTtl;
	}

	/**
	 * 删除缓存
	 */
	delete(key: CacheKey): boolean {
		const existed = this.cache.delete(key);
		if (existed) {
			console.log(`[SmartCache] Deleted: ${key}`);
		}
		return existed;
	}

	/**
	 * 清空缓存
	 */
	clear(): void {
		this.cache.clear();
		this.pendingFetches.clear();
		console.log('[SmartCache] Cleared all cache');
	}

	/**
	 * 获取缓存统计
	 */
	getStats(): CacheStats {
		// 估算内存使用
		let memoryUsage = 0;
		this.cache.forEach((entry) => {
			memoryUsage += JSON.stringify(entry.data).length * 2; // 粗略估算
		});

		return {
			...this.stats,
			size: this.cache.size,
			memoryUsage
		};
	}

	/**
	 * 清理过期缓存
	 */
	gc(maxAge: number = this.defaultConfig.ttl + this.defaultConfig.staleTtl): number {
		const now = Date.now();
		let cleaned = 0;

		this.cache.forEach((entry, key) => {
			if (now - entry.timestamp > maxAge) {
				this.cache.delete(key);
				cleaned++;
			}
		});

		console.log(`[SmartCache] GC cleaned ${cleaned} entries`);
		return cleaned;
	}

	/**
	 * 获取所有缓存键
	 */
	keys(): string[] {
		return Array.from(this.cache.keys());
	}

	/**
	 * 延迟辅助函数
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * 全局缓存实例
 */
export const globalCache = new SmartCache();

/**
 * 预定义的缓存配置
 */
export const CachePresets = {
	/** 新闻数据 - 2分钟新鲜，3分钟过期可用 */
	NEWS: { ttl: 2 * 60 * 1000, staleTtl: 3 * 60 * 1000 },
	/** 市场数据 - 30秒新鲜，1分钟过期可用 */
	MARKETS: { ttl: 30 * 1000, staleTtl: 60 * 1000 },
	/** 领导人数据 - 5分钟新鲜，10分钟过期可用 */
	LEADERS: { ttl: 5 * 60 * 1000, staleTtl: 10 * 60 * 1000 },
	/** Fed数据 - 1小时新鲜，2小时过期可用 */
	FED: { ttl: 60 * 60 * 1000, staleTtl: 2 * 60 * 60 * 1000 },
	/** 配置数据 - 长期缓存 */
	CONFIG: { ttl: 24 * 60 * 60 * 1000, staleTtl: 24 * 60 * 60 * 1000 }
} as const;

/**
 * 创建缓存键
 */
export function createCacheKey(prefix: string, ...parts: (string | number)[]): string {
	return `${prefix}:${parts.join(':')}`;
}
