/**
 * Translation Service - 使用 MyMemory API 实现翻译功能
 * 支持缓存、错误处理和批量翻译
 */

import { CacheManager } from './cache';
import { fetchWithProxy } from '$lib/config/api';

export interface TranslationOptions {
	sourceLang?: string;
	targetLang?: string;
	useCache?: boolean;
}

export interface TranslationResult {
	translatedText: string;
	fromCache: boolean;
}

export interface BatchTranslationResult {
	results: Map<string, TranslationResult>;
	failed: string[];
}

export interface TranslationCacheEntry {
	originalText: string;
	translatedText: string;
	timestamp: number;
}

const DEFAULT_OPTIONS: Required<TranslationOptions> = {
	sourceLang: 'en',
	targetLang: 'zh',
	useCache: true
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 100;

/**
 * 生成文本的哈希值（用于缓存键）
 */
function generateHash(text: string): string {
	let hash = 0;
	for (let i = 0; i < text.length; i++) {
		const char = text.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(36);
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 翻译服务类
 */
export class TranslationService {
	private cache: CacheManager;
	private pendingRequests: Map<string, Promise<string>>;
	private batchQueue: Array<{
		text: string;
		resolve: (value: string) => void;
		reject: (reason: unknown) => void;
	}>;
	private batchTimer: ReturnType<typeof setTimeout> | null;

	constructor() {
		this.cache = new CacheManager({ prefix: 'sm_translation_' });
		this.pendingRequests = new Map();
		this.batchQueue = [];
		this.batchTimer = null;
	}

	/**
	 * 翻译单个文本
	 */
	async translate(text: string, options: TranslationOptions = {}): Promise<string> {
		if (!text || text.trim() === '') {
			return text;
		}

		// 检查是否已经是目标语言（简单检测中文字符）
		const opts = { ...DEFAULT_OPTIONS, ...options };
		if (opts.targetLang === 'zh' && this.containsChinese(text)) {
			return text;
		}

		// 检查缓存
		if (opts.useCache) {
			const cached = this.getFromCache(text, opts);
			if (cached) {
				return cached;
			}
		}

		// 使用请求去重
		const cacheKey = this.getCacheKey(text, opts);
		if (this.pendingRequests.has(cacheKey)) {
			return this.pendingRequests.get(cacheKey)!;
		}

		const requestPromise = this.fetchTranslation(text, opts);
		this.pendingRequests.set(cacheKey, requestPromise);

		try {
			const result = await requestPromise;
			return result;
		} finally {
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * 批量翻译
	 */
	async translateBatch(texts: string[], options: TranslationOptions = {}): Promise<BatchTranslationResult> {
		const results = new Map<string, TranslationResult>();
		const failed: string[] = [];

		// 去重并过滤空文本
		const uniqueTexts = [...new Set(texts.filter((t) => t && t.trim() !== ''))];

		// 分批处理，避免请求过多
		for (let i = 0; i < uniqueTexts.length; i += BATCH_SIZE) {
			const batch = uniqueTexts.slice(i, i + BATCH_SIZE);
			const batchPromises = batch.map(async (text) => {
				try {
					const translated = await this.translate(text, options);
					results.set(text, {
						translatedText: translated,
						fromCache: this.getFromCache(text, { ...DEFAULT_OPTIONS, ...options }) !== null
					});
				} catch {
					failed.push(text);
					results.set(text, {
						translatedText: text,
						fromCache: false
					});
				}
			});

			await Promise.all(batchPromises);

			// 批次间延迟，避免触发 API 限制
			if (i + BATCH_SIZE < uniqueTexts.length) {
				await delay(BATCH_DELAY_MS);
			}
		}

		return { results, failed };
	}

	/**
	 * 队列批量翻译（自动合并请求）
	 */
	async translateQueued(text: string, options: TranslationOptions = {}): Promise<string> {
		return new Promise((resolve, reject) => {
			this.batchQueue.push({ text, resolve, reject });

			if (this.batchTimer) {
				clearTimeout(this.batchTimer);
			}

			this.batchTimer = setTimeout(() => {
				this.processBatchQueue(options);
			}, 50);
		});
	}

	/**
	 * 处理批量队列
	 */
	private async processBatchQueue(options: TranslationOptions): Promise<void> {
		const queue = [...this.batchQueue];
		this.batchQueue = [];

		if (queue.length === 0) return;

		const texts = queue.map((item) => item.text);
		const { results, failed } = await this.translateBatch(texts, options);

		queue.forEach(({ text, resolve, reject }) => {
			if (failed.includes(text)) {
				reject(new Error(`Translation failed for: ${text}`));
			} else {
				const result = results.get(text);
				resolve(result?.translatedText || text);
			}
		});
	}

	/**
	 * 获取缓存中的翻译
	 */
	private getFromCache(text: string, options: Required<TranslationOptions>): string | null {
		const cacheKey = this.getCacheKey(text, options);
		const cached = this.cache.get<TranslationCacheEntry>(cacheKey);

		if (cached && cached.data.translatedText) {
			return cached.data.translatedText;
		}
		return null;
	}

	/**
	 * 保存翻译到缓存
	 */
	private saveToCache(
		text: string,
		translatedText: string,
		options: Required<TranslationOptions>
	): void {
		const cacheKey = this.getCacheKey(text, options);
		const entry: TranslationCacheEntry = {
			originalText: text,
			translatedText,
			timestamp: Date.now()
		};
		this.cache.set(cacheKey, entry, CACHE_TTL_MS);
	}

	/**
	 * 生成缓存键
	 */
	private getCacheKey(text: string, options: Required<TranslationOptions>): string {
		const hash = generateHash(text);
		return `${options.sourceLang}_${options.targetLang}_${hash}`;
	}

	/**
	 * 检测文本是否包含中文字符
	 */
	private containsChinese(text: string): boolean {
		return /[\u4e00-\u9fa5]/.test(text);
	}

	/**
	 * 从 MyMemory API 获取翻译（带重试）
	 */
	private async fetchTranslation(text: string, options: Required<TranslationOptions>): Promise<string> {
		let lastError: Error | null = null;

		for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
			try {
				const result = await this.callMyMemoryAPI(text, options);

				// 保存到缓存
				if (options.useCache) {
					this.saveToCache(text, result, options);
				}

				return result;
			} catch (error) {
				lastError = error as Error;

				// 最后一次尝试，不再重试
				if (attempt === MAX_RETRIES - 1) {
					break;
				}

				// 指数退避延迟
				const backoffDelay = RETRY_DELAY_MS * Math.pow(2, attempt);
				await delay(backoffDelay);
			}
		}

		// 所有重试失败，返回原文
		console.warn(`[TranslationService] Translation failed after ${MAX_RETRIES} attempts:`, lastError);
		return text;
	}

	/**
	 * 调用 MyMemory API (通过 CORS 代理)
	 */
	private async callMyMemoryAPI(text: string, options: Required<TranslationOptions>): Promise<string> {
		const encodedText = encodeURIComponent(text);
		const langPair = `${options.sourceLang}|${options.targetLang}`;
		const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${langPair}`;

		// 使用 CORS 代理访问翻译 API
		const response = await fetchWithProxy(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		// 检查 API 响应状态
		if (data.responseStatus && data.responseStatus !== 200) {
			throw new Error(`API error: ${data.responseDetails || 'Unknown error'}`);
		}

		if (!data.responseData || !data.responseData.translatedText) {
			throw new Error('Invalid API response format');
		}

		return data.responseData.translatedText;
	}

	/**
	 * 清除所有翻译缓存
	 */
	clearCache(): void {
		this.cache.clear();
	}

	/**
	 * 获取缓存统计信息
	 */
	getCacheStats() {
		return this.cache.getStats();
	}
}

// 导出单例实例
export const translationService = new TranslationService();

// 便捷函数
export async function translate(text: string, options?: TranslationOptions): Promise<string> {
	return translationService.translate(text, options);
}

export async function translateBatch(
	texts: string[],
	options?: TranslationOptions
): Promise<BatchTranslationResult> {
	return translationService.translateBatch(texts, options);
}
