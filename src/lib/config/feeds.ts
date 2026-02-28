/**
 * RSS feed and news source configuration
 */

import type { NewsCategory } from '$lib/types';

export interface FeedSource {
	name: string;
	url: string;
}

export interface IntelSource extends FeedSource {
	type: 'think-tank' | 'defense' | 'regional' | 'osint' | 'govt' | 'cyber';
	topics: string[];
	region?: string;
}

export const FEEDS: Record<NewsCategory, FeedSource[]> = {
	politics: [
		{ name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
		{ name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml' },
		{ name: 'Guardian World', url: 'https://www.theguardian.com/world/rss' },
		{ name: 'NYT World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' }
	],
	tech: [
		{ name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
		{ name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
		{ name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
		{ name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
		{ name: 'ArXiv AI', url: 'https://rss.arxiv.org/rss/cs.AI' },
		{ name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml' }
	],
	finance: [
		{ name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
		{ name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories' },
		{ name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex' },
		{ name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
		{ name: 'FT', url: 'https://www.ft.com/rss/home' }
	],
	gov: [
		{ name: 'White House', url: 'https://www.whitehouse.gov/news/feed/' },
		{ name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml' },
		{ name: 'SEC Announcements', url: 'https://www.sec.gov/news/pressreleases.rss' },
		{
			name: 'DoD News',
			url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?max=10&ContentType=1&Site=945'
		}
	],
	ai: [
		{ name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml' },
		{ name: 'ArXiv AI', url: 'https://rss.arxiv.org/rss/cs.AI' }
	],
	intel: [
		{ name: 'CSIS', url: 'https://www.csis.org/analysis/feed' },
		{ name: 'Brookings', url: 'https://www.brookings.edu/feed/' }
	]
};

export const CHINA_FEEDS: Record<NewsCategory, FeedSource[]> = {
	politics: [
		{ name: '环球军事', url: 'https://mil.huanqiu.com/rss/www.xml' },
		{ name: '新浪军事', url: 'https://mil.news.sina.com.cn/rss/index.xml' },
		{ name: '凤凰军事', url: 'http://www.phoenixmilitary.com.cn/rss' }
	],
	tech: [
		{ name: '36氪', url: 'https://www.36kr.com/feed/' },
		{ name: '科技日报', url: 'http://www.stdaily.com/kjrb/www/08/1008/index.xml' },
		{ name: '极客公园', url: 'https://www.geekpark.net/feed' }
	],
	finance: [
		{ name: '新浪财经', url: 'https://finance.sina.com.cn/stock/roll/03.xml' },
		{ name: '东方财富', url: 'https://news.eastmoney.com/kzzs.xml' },
		{ name: '凤凰财经', url: 'https://finance.ifeng.com/rss/index.xml' }
	],
	gov: [
		{ name: '新华网', url: 'https://www.xinhuanet.com/politics/news_politics.xml' },
		{ name: '人民网', url: 'http://politics.people.com.cn/rss/7363.xml' },
		{ name: '中国政府网', url: 'http://www.gov.cn/rss/gov focus.xml' }
	],
	ai: [
		{ name: '人工智能网', url: 'https://www.cnaiplus.com/feed/' },
		{ name: '新智元', url: 'https://www.xinzhiyuan.cn/feed' }
	],
	intel: [
		{ name: '参考消息', url: 'https://www.cankaoxiaoxi.com/feed/' },
		{ name: '环球时报', url: 'https://www.huanqiu.com/rss/www.xml' }
	]
};

export const INTEL_SOURCES: IntelSource[] = [
	{
		name: 'CSIS',
		url: 'https://www.csis.org/analysis/feed',
		type: 'think-tank',
		topics: ['defense', 'geopolitics']
	},
	{
		name: 'Brookings',
		url: 'https://www.brookings.edu/feed/',
		type: 'think-tank',
		topics: ['policy', 'geopolitics']
	},
	{
		name: 'CFR',
		url: 'https://www.cfr.org/rss.xml',
		type: 'think-tank',
		topics: ['foreign-policy']
	},
	{
		name: 'Defense One',
		url: 'https://www.defenseone.com/rss/all/',
		type: 'defense',
		topics: ['military', 'defense']
	},
	{
		name: 'War on Rocks',
		url: 'https://warontherocks.com/feed/',
		type: 'defense',
		topics: ['military', 'strategy']
	},
	{
		name: 'Breaking Defense',
		url: 'https://breakingdefense.com/feed/',
		type: 'defense',
		topics: ['military', 'defense']
	},
	{
		name: 'The Drive War Zone',
		url: 'https://www.thedrive.com/the-war-zone/feed',
		type: 'defense',
		topics: ['military']
	},
	{
		name: 'The Diplomat',
		url: 'https://thediplomat.com/feed/',
		type: 'regional',
		topics: ['asia-pacific'],
		region: 'APAC'
	},
	{
		name: 'Al-Monitor',
		url: 'https://www.al-monitor.com/rss',
		type: 'regional',
		topics: ['middle-east'],
		region: 'MENA'
	},
	{
		name: 'Bellingcat',
		url: 'https://www.bellingcat.com/feed/',
		type: 'osint',
		topics: ['investigation', 'osint']
	},
	{
		name: 'CISA Alerts',
		url: 'https://www.cisa.gov/uscert/ncas/alerts.xml',
		type: 'cyber',
		topics: ['cyber', 'security']
	},
	{
		name: 'Krebs Security',
		url: 'https://krebsonsecurity.com/feed/',
		type: 'cyber',
		topics: ['cyber', 'security']
	}
];
