/**
 * Translation Service - 支持多个翻译API（微软、谷歌、LibreTranslate）
 * 支持缓存、错误处理和批量翻译
 */

import { CacheManager } from './cache';
import { fetchWithProxy } from '$lib/config/api';

export interface TranslationOptions {
	sourceLang?: string;
	targetLang?: string;
	useCache?: boolean;
	provider?: 'microsoft' | 'google' | 'libretranslate' | 'auto';
}

export interface TranslationResult {
	translatedText: string;
	fromCache: boolean;
	provider: string;
}

export interface BatchTranslationResult {
	results: Map<string, TranslationResult>;
	failed: string[];
}

export interface TranslationCacheEntry {
	originalText: string;
	translatedText: string;
	timestamp: number;
	provider: string;
}

const DEFAULT_OPTIONS: Required<TranslationOptions> = {
	sourceLang: 'en',
	targetLang: 'zh',
	useCache: true,
	provider: 'auto'
};

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 200;

// 翻译API配置
const TRANSLATION_PROVIDERS = {
	// 微软翻译API (Azure Cognitive Services)
	microsoft: {
		name: 'Microsoft',
		url: 'https://api.cognitive.microsofttranslator.com/translate',
		requiresKey: true,
		priority: 1
	},
	// 谷歌翻译API (需要API Key)
	google: {
		name: 'Google',
		url: 'https://translation.googleapis.com/language/translate/v2',
		requiresKey: true,
		priority: 2
	},
	// LibreTranslate (免费开源翻译API)
	libretranslate: {
		name: 'LibreTranslate',
		url: 'https://libretranslate.de/translate',
		requiresKey: false,
		priority: 3
	}
};

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
	private providerPriority: string[];

	constructor() {
		this.cache = new CacheManager({ prefix: 'sm_translation_' });
		this.pendingRequests = new Map();
		this.batchQueue = [];
		this.batchTimer = null;
		// 按优先级排序的提供商列表
		this.providerPriority = Object.entries(TRANSLATION_PROVIDERS)
			.sort((a, b) => a[1].priority - b[1].priority)
			.map(([key]) => key);
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
				return cached.translatedText;
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
					const cached = this.getFromCache(text, { ...DEFAULT_OPTIONS, ...options });
					results.set(text, {
						translatedText: translated,
						fromCache: cached !== null,
						provider: cached?.provider || 'unknown'
					});
				} catch {
					failed.push(text);
					results.set(text, {
						translatedText: text,
						fromCache: false,
						provider: 'failed'
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
	private getFromCache(text: string, options: Required<TranslationOptions>): TranslationCacheEntry | null {
		const cacheKey = this.getCacheKey(text, options);
		const cached = this.cache.get<TranslationCacheEntry>(cacheKey);

		if (cached && cached.data.translatedText) {
			return cached.data;
		}
		return null;
	}

	/**
	 * 保存翻译到缓存
	 */
	private saveToCache(
		text: string,
		translatedText: string,
		provider: string,
		options: Required<TranslationOptions>
	): void {
		const cacheKey = this.getCacheKey(text, options);
		const entry: TranslationCacheEntry = {
			originalText: text,
			translatedText,
			timestamp: Date.now(),
			provider
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
	 * 获取要使用的翻译提供商列表
	 */
	private getProviderList(options: Required<TranslationOptions>): string[] {
		if (options.provider !== 'auto') {
			return [options.provider];
		}
		return this.providerPriority;
	}

	/**
	 * 从翻译API获取翻译（带重试和自动切换提供商）
	 */
	private async fetchTranslation(text: string, options: Required<TranslationOptions>): Promise<string> {
		const providers = this.getProviderList(options);
		let lastError: Error | null = null;

		for (const provider of providers) {
			for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
				try {
					let result: string;
					
					switch (provider) {
						case 'microsoft':
							result = await this.callMicrosoftAPI(text, options);
							break;
						case 'google':
							result = await this.callGoogleAPI(text, options);
							break;
						case 'libretranslate':
							result = await this.callLibreTranslateAPI(text, options);
							break;
						default:
							throw new Error(`Unknown provider: ${provider}`);
					}

					// 保存到缓存
					if (options.useCache) {
						this.saveToCache(text, result, provider, options);
					}

					return result;
				} catch (error) {
					lastError = error as Error;
					console.warn(`[TranslationService] ${provider} translation failed (attempt ${attempt + 1}):`, error);

					// 最后一次尝试，不再重试
					if (attempt === MAX_RETRIES - 1) {
						break;
					}

					// 指数退避延迟
					const backoffDelay = RETRY_DELAY_MS * Math.pow(2, attempt);
					await delay(backoffDelay);
				}
			}
		}

		// 所有提供商都失败，返回原文
		console.warn(`[TranslationService] All translation providers failed:`, lastError);
		return text;
	}

	/**
	 * 调用微软翻译API (Azure Cognitive Services)
	 * 注意：需要配置 VITE_MICROSOFT_TRANSLATOR_KEY 环境变量
	 */
	private async callMicrosoftAPI(text: string, options: Required<TranslationOptions>): Promise<string> {
		const apiKey = import.meta.env.VITE_MICROSOFT_TRANSLATOR_KEY;
		
		if (!apiKey) {
			throw new Error('Microsoft Translator API key not configured');
		}

		const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${options.sourceLang}&to=${options.targetLang}`;
		
		const response = await fetchWithProxy(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Ocp-Apim-Subscription-Key': apiKey,
				'Ocp-Apim-Subscription-Region': 'global'
			},
			body: JSON.stringify([{ Text: text }])
		});

		if (!response.ok) {
			throw new Error(`Microsoft API error: ${response.status}`);
		}

		const data = await response.json();
		
		if (!data || !data[0] || !data[0].translations || !data[0].translations[0]) {
			throw new Error('Invalid Microsoft API response format');
		}

		return data[0].translations[0].text;
	}

	/**
	 * 调用谷歌翻译API
	 * 注意：需要配置 VITE_GOOGLE_TRANSLATE_KEY 环境变量
	 */
	private async callGoogleAPI(text: string, options: Required<TranslationOptions>): Promise<string> {
		const apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_KEY;
		
		if (!apiKey) {
			throw new Error('Google Translate API key not configured');
		}

		const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
		
		const response = await fetchWithProxy(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				q: text,
				source: options.sourceLang,
				target: options.targetLang,
				format: 'text'
			})
		});

		if (!response.ok) {
			throw new Error(`Google API error: ${response.status}`);
		}

		const data = await response.json();
		
		if (!data.data || !data.data.translations || !data.data.translations[0]) {
			throw new Error('Invalid Google API response format');
		}

		return data.data.translations[0].translatedText;
	}

	/**
	 * 调用LibreTranslate API (免费开源)
	 */
	private async callLibreTranslateAPI(text: string, options: Required<TranslationOptions>): Promise<string> {
		// LibreTranslate 支持的语言代码映射
		const langMap: Record<string, string> = {
			'zh': 'zh',
			'en': 'en',
			'ja': 'ja',
			'ko': 'ko',
			'fr': 'fr',
			'de': 'de',
			'es': 'es',
			'ru': 'ru'
		};

		const sourceLang = langMap[options.sourceLang] || 'en';
		const targetLang = langMap[options.targetLang] || 'zh';

		const url = 'https://libretranslate.de/translate';
		
		const response = await fetchWithProxy(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({
				q: text,
				source: sourceLang,
				target: targetLang,
				format: 'text'
			})
		});

		if (!response.ok) {
			throw new Error(`LibreTranslate API error: ${response.status}`);
		}

		const data = await response.json();
		
		if (!data || !data.translatedText) {
			throw new Error('Invalid LibreTranslate API response format');
		}

		return data.translatedText;
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

	/**
	 * 获取可用的翻译提供商
	 */
	getAvailableProviders(): string[] {
		return this.providerPriority.filter(provider => {
			const config = TRANSLATION_PROVIDERS[provider as keyof typeof TRANSLATION_PROVIDERS];
			if (!config.requiresKey) return true;
			
			// 检查是否有API Key
			if (provider === 'microsoft') {
				return !!import.meta.env.VITE_MICROSOFT_TRANSLATOR_KEY;
			}
			if (provider === 'google') {
				return !!import.meta.env.VITE_GOOGLE_TRANSLATE_KEY;
			}
			return false;
		});
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

// 导出提供商配置
export { TRANSLATION_PROVIDERS };
