/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => self.skipWaiting())
	);
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
			)
			.then(() => self.clients.claim())
	);
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	// 跳过非同源请求（API调用）
	const url = new URL(event.request.url);
	if (url.origin !== self.location.origin) {
		// 对于API请求使用网络优先策略
		if (isAPIRequest(url)) {
			event.respondWith(networkFirst(event.request));
		}
		return;
	}

	// 静态资源使用缓存优先策略	event.respondWith(cacheFirst(event.request));
});

// 判断是否为API请求
function isAPIRequest(url: URL): boolean {
	const apiHosts = [
		'api.gdeltproject.org',
		'api.coingecko.com',
		'api.stlouisfed.org',
		'earthquake.usgs.gov',
		'api.open-meteo.com',
		'situation-03.jwang287.workers.dev'
	];
	return apiHosts.some((host) => url.hostname.includes(host));
}

// 缓存优先策略 - 适用于静态资源
async function cacheFirst(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);
	const cached = await cache.match(request);

	if (cached) {
		return cached;
	}

	try {
		const response = await fetch(request);
		if (response.status === 200) {
			cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		// 网络失败时返回缓存（如果有）
		return cached || new Response('Network error', { status: 408 });
	}
}

// 网络优先策略 - 适用于API请求
async function networkFirst(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);

	try {
		const networkResponse = await fetch(request);
		if (networkResponse.status === 200) {
			cache.put(request, networkResponse.clone());
		}
		return networkResponse;
	} catch (error) {
		// 网络失败时返回缓存
		const cached = await cache.match(request);
		if (cached) {
			return cached;
		}
		throw error;
	}
}
