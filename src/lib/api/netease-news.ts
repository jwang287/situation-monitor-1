/**
 * NetEase (163.com) News API
 * 使用网易新闻移动端 API，国内访问速度快
 */

import type { NewsItem, NewsCategory } from '$lib/types';
import { containsAlertKeyword, detectRegion, detectTopics } from '$lib/config/keywords';
import { logger } from '$lib/config/api';

/**
 * Simple hash function to generate unique IDs from URLs
 */
function hashCode(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(36);
}

interface NeteaseNewsItem {
	title: string;
	docurl: string;
	ptime: string;
	source: string;
	imgsrc?: string;
	category?: string;
}

interface NeteaseResponse {
	data?: NeteaseNewsItem[];
}

/**
 * 网易新闻分类映射
 */
const NETEASE_CATEGORIES: Record<NewsCategory, string> = {
	politics: 'guonei',      // 国内新闻
	tech: 'tech',            // 科技
	finance: 'money',        // 财经
	gov: 'guonei',           // 政府相关 -> 国内
	ai: 'tech',              // AI -> 科技
	intel: 'war'             // 情报 -> 军事
};

/**
 * Transform NetEase article to NewsItem
 */
function transformNeteaseArticle(
	article: NeteaseNewsItem,
	category: NewsCategory,
	index: number
): NewsItem {
	const title = article.title || '';
	const alert = containsAlertKeyword(title);
	const urlHash = article.docurl ? hashCode(article.docurl) : Math.random().toString(36).slice(2);
	const uniqueId = `netease-${category}-${urlHash}-${index}`;

	// Parse NetEase date format (2025-03-02 10:30:00)
	const timestamp = article.ptime ? new Date(article.ptime).getTime() : Date.now();

	return {
		id: uniqueId,
		title,
		link: article.docurl,
		pubDate: article.ptime,
		timestamp,
		source: article.source || '网易新闻',
		category,
		isAlert: !!alert,
		alertKeyword: alert?.keyword || undefined,
		region: detectRegion(title) ?? undefined,
		topics: detectTopics(title)
	};
}

/**
 * Fetch news from NetEase for a specific category
 * 直接访问网易移动端 API，无需代理
 */
export async function fetchNeteaseCategoryNews(category: NewsCategory): Promise<NewsItem[]> {
	const neteaseCategory = NETEASE_CATEGORIES[category];
	
	try {
		// 网易新闻移动端 API
		const url = `https://c.m.163.com/nc/article/list/${neteaseCategory}/0-20.html`;
		
		logger.log('NetEase News', `Fetching ${category} from NetEase: ${url}`);
		
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
			}
		});
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const text = await response.text();
		
		// NetEase API returns JSONP format, need to extract JSON
		// Format: var category = {...};
		const jsonMatch = text.match(/var\s+\w+\s*=\s*({[\s\S]*});?$/);
		if (!jsonMatch) {
			logger.warn('NetEase News', `No JSON found in response for ${category}`);
			return [];
		}
		
		const data: NeteaseResponse = JSON.parse(jsonMatch[1]);
		
		if (!data?.data || !Array.isArray(data.data)) {
			logger.warn('NetEase News', `${category} no articles found`);
			return [];
		}
		
		logger.log('NetEase News', `${category} found ${data.data.length} articles`);

		return data.data.map((article, index) =>
			transformNeteaseArticle(article, category, index)
		);
	} catch (error) {
		logger.error('NetEase News', `Error fetching ${category}:`, error);
		return [];
	}
}

/** All news categories */
const NEWS_CATEGORIES: NewsCategory[] = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'];

/**
 * Create an empty news result object
 */
function createEmptyNewsResult(): Record<NewsCategory, NewsItem[]> {
	return { politics: [], tech: [], finance: [], gov: [], ai: [], intel: [] };
}

/**
 * Fetch all news from NetEase - all categories in parallel
 */
export async function fetchAllNeteaseNews(): Promise<Record<NewsCategory, NewsItem[]>> {
	const result = createEmptyNewsResult();
	
	try {
		// Fetch all categories in parallel
		const results = await Promise.allSettled(
			NEWS_CATEGORIES.map(cat => fetchNeteaseCategoryNews(cat))
		);
		
		// Assign results
		results.forEach((res, index) => {
			const category = NEWS_CATEGORIES[index];
			if (res.status === 'fulfilled') {
				result[category] = res.value;
			} else {
				logger.warn('NetEase News', `Failed to fetch ${category}:`, res.reason);
				result[category] = [];
			}
		});
	} catch (error) {
		logger.error('NetEase News', 'Error fetching all news:', error);
	}
	
	return result;
}
