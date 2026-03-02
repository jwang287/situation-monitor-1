<script lang="ts">
	import { onMount } from 'svelte';
	import { Header, Dashboard } from '$lib/components/layout';
	import { SettingsModal, MonitorFormModal, OnboardingModal } from '$lib/components/modals';
	import { VersionBadge } from '$lib/components/common';
	import { browser } from '$app/environment';

	// 关键面板组件 - 首屏必需，静态导入
	import NewsPanel from '$lib/components/panels/NewsPanel.svelte';
	import MarketsPanel from '$lib/components/panels/MarketsPanel.svelte';

	// 动态导入其他面板组件（代码分割）
	const MapPanel = $derived(browser ? import('$lib/components/panels/MapPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const HeatmapPanel = $derived(browser ? import('$lib/components/panels/HeatmapPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const CommoditiesPanel = $derived(browser ? import('$lib/components/panels/CommoditiesPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const CryptoPanel = $derived(browser ? import('$lib/components/panels/CryptoPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const MainCharPanel = $derived(browser ? import('$lib/components/panels/MainCharPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const CorrelationPanel = $derived(browser ? import('$lib/components/panels/CorrelationPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const NarrativePanel = $derived(browser ? import('$lib/components/panels/NarrativePanel.svelte').then(m => m.default) : Promise.resolve(null));
	const MonitorsPanel = $derived(browser ? import('$lib/components/panels/MonitorsPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const WhalePanel = $derived(browser ? import('$lib/components/panels/WhalePanel.svelte').then(m => m.default) : Promise.resolve(null));
	const PolymarketPanel = $derived(browser ? import('$lib/components/panels/PolymarketPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const ContractsPanel = $derived(browser ? import('$lib/components/panels/ContractsPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const LayoffsPanel = $derived(browser ? import('$lib/components/panels/LayoffsPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const IntelPanel = $derived(browser ? import('$lib/components/panels/IntelPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const SituationPanel = $derived(browser ? import('$lib/components/panels/SituationPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const WorldLeadersPanel = $derived(browser ? import('$lib/components/panels/WorldLeadersPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const PrinterPanel = $derived(browser ? import('$lib/components/panels/PrinterPanel.svelte').then(m => m.default) : Promise.resolve(null));
	const FedPanel = $derived(browser ? import('$lib/components/panels/FedPanel.svelte').then(m => m.default) : Promise.resolve(null));

	import {
		news,
		markets,
		monitors,
		settings,
		refresh,
		allNewsItems,
		fedIndicators,
		fedNews
	} from '$lib/stores';
	import {
		fetchAllNews,
		fetchAllMarkets,
		fetchPolymarket,
		fetchWhaleTransactions,
		fetchGovContracts,
		fetchLayoffs,
		fetchWorldLeaders,
		fetchFedIndicators,
		fetchFedNews
	} from '$lib/api';
	import { LoadingStrategy, LoadTimeouts } from '$lib/services/loading-strategy';
	import { globalCache, CachePresets, createCacheKey } from '$lib/services/smart-cache';
	import type { Prediction, WhaleTransaction, Contract, Layoff } from '$lib/api';
	import type { CustomMonitor, WorldLeader } from '$lib/types';
	import type { PanelId } from '$lib/config';

	// Modal state
	let settingsOpen = $state(false);
	let monitorFormOpen = $state(false);
	let onboardingOpen = $state(false);
	let editingMonitor = $state<CustomMonitor | null>(null);

	// Misc panel data
	let predictions = $state<Prediction[]>([]);
	let whales = $state<WhaleTransaction[]>([]);
	let contracts = $state<Contract[]>([]);
	let layoffs = $state<Layoff[]>([]);
	let leaders = $state<WorldLeader[]>([]);
	let leadersLoading = $state(false);

	// Loading progress
	let loadingProgress = $state(0);
	let loadingPhase = $state<'critical' | 'important' | 'background' | 'complete'>('critical');

	// Loading strategy instance
	let loadingStrategy: LoadingStrategy;

	// Data fetching with cache
	async function loadNews() {
		console.log('[Page] Starting loadNews...');
		const categories = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'] as const;
		categories.forEach((cat) => news.setLoading(cat, true));

		try {
			// 使用缓存
			const data = await globalCache.get(
				createCacheKey('news', 'all'),
				fetchAllNews,
				CachePresets.NEWS
			);
			console.log('[Page] fetchAllNews returned:', data);
			Object.entries(data).forEach(([category, items]) => {
				console.log(`[Page] Setting ${category} items:`, items.length);
				news.setItems(category as keyof typeof data, items);
			});
		} catch (error) {
			console.error('[Page] loadNews error:', error);
			categories.forEach((cat) => news.setError(cat, String(error)));
		}
	}

	async function loadMarkets() {
		try {
			// 使用缓存
			const data = await globalCache.get(
				createCacheKey('markets', 'all'),
				fetchAllMarkets,
				CachePresets.MARKETS
			);
			markets.setIndices(data.indices);
			markets.setSectors(data.sectors);
			markets.setCommodities(data.commodities);
			markets.setCrypto(data.crypto);
		} catch (error) {
			console.error('Failed to load markets:', error);
		}
	}

	async function loadMiscData() {
		try {
			const [predictionsData, whalesData, contractsData, layoffsData] = await Promise.all([
				fetchPolymarket(),
				fetchWhaleTransactions(),
				fetchGovContracts(),
				fetchLayoffs()
			]);
			predictions = predictionsData;
			whales = whalesData;
			contracts = contractsData;
			layoffs = layoffsData;
		} catch (error) {
			console.error('Failed to load misc data:', error);
		}
	}

	async function loadWorldLeaders() {
		if (!isPanelVisible('leaders')) return;
		leadersLoading = true;
		try {
			// 使用缓存
			leaders = await globalCache.get(
				createCacheKey('leaders', 'all'),
				fetchWorldLeaders,
				CachePresets.LEADERS
			);
		} catch (error) {
			console.error('Failed to load world leaders:', error);
		} finally {
			leadersLoading = false;
		}
	}

	async function loadFedData() {
		if (!isPanelVisible('fed')) return;
		fedIndicators.setLoading(true);
		fedNews.setLoading(true);
		try {
			const [indicatorsData, newsData] = await Promise.all([
				globalCache.get(
					createCacheKey('fed', 'indicators'),
					fetchFedIndicators,
					CachePresets.FED
				),
				globalCache.get(
					createCacheKey('fed', 'news'),
					fetchFedNews,
					CachePresets.FED
				)
			]);
			fedIndicators.setData(indicatorsData);
			fedNews.setItems(newsData);
		} catch (error) {
			console.error('Failed to load Fed data:', error);
			fedIndicators.setError(String(error));
			fedNews.setError(String(error));
		}
	}

	// Refresh handlers - 强制刷新缓存
	async function handleRefresh() {
		refresh.startRefresh();
		try {
			// 清除相关缓存
			globalCache.delete(createCacheKey('news', 'all'));
			globalCache.delete(createCacheKey('markets', 'all'));

			await Promise.all([loadNews(), loadMarkets()]);
			refresh.endRefresh();
		} catch (error) {
			refresh.endRefresh([String(error)]);
		}
	}

	// Monitor handlers
	function handleCreateMonitor() {
		editingMonitor = null;
		monitorFormOpen = true;
	}

	function handleEditMonitor(monitor: CustomMonitor) {
		editingMonitor = monitor;
		monitorFormOpen = true;
	}

	function handleDeleteMonitor(id: string) {
		monitors.deleteMonitor(id);
	}

	function handleToggleMonitor(id: string) {
		monitors.toggleMonitor(id);
	}

	// Get panel visibility
	function isPanelVisible(id: PanelId): boolean {
		return $settings.enabled[id] !== false;
	}

	// Handle preset selection from onboarding
	function handleSelectPreset(presetId: string) {
		settings.applyPreset(presetId);
		onboardingOpen = false;
		handleRefresh();
	}

	// Show onboarding again (called from settings)
	function handleReconfigure() {
		settingsOpen = false;
		settings.resetOnboarding();
		onboardingOpen = true;
	}

	// 初始化性能监控和分阶段加载
	async function executePhasedLoading() {
		loadingStrategy = new LoadingStrategy();

		// 阶段 1: 关键数据 (首屏必需)
		loadingStrategy.addTask({
			name: 'loadNews',
			phase: 'critical',
			loader: loadNews,
			timeout: LoadTimeouts.CRITICAL,
			onError: (error) => console.error('Critical: News loading failed', error)
		});

		loadingStrategy.addTask({
			name: 'loadMarkets',
			phase: 'critical',
			loader: loadMarkets,
			timeout: LoadTimeouts.CRITICAL,
			onError: (error) => console.error('Critical: Markets loading failed', error)
		});

		// 阶段 2: 重要数据 (3 秒内加载)
		loadingStrategy.addTask({
			name: 'loadMiscData',
			phase: 'important',
			loader: loadMiscData,
			timeout: LoadTimeouts.IMPORTANT,
			onError: (error) => console.error('Important: Misc data loading failed', error)
		});

		// 阶段 3: 背景数据 (无时间限制)
		if (isPanelVisible('leaders')) {
			loadingStrategy.addTask({
				name: 'loadWorldLeaders',
				phase: 'background',
				loader: loadWorldLeaders,
				timeout: LoadTimeouts.BACKGROUND,
				onError: (error) => console.error('Background: Leaders loading failed', error)
			});
		}

		if (isPanelVisible('fed')) {
			loadingStrategy.addTask({
				name: 'loadFedData',
				phase: 'background',
				loader: loadFedData,
				timeout: LoadTimeouts.BACKGROUND,
				onError: (error) => console.error('Background: Fed data loading failed', error)
			});
		}

		// 执行分阶段加载
		await loadingStrategy.execute(
			(phase, results) => {
				console.log(`[Page] Phase ${phase} completed:`, results);
				loadingPhase = phase;
			},
			(completed, total) => {
				loadingProgress = Math.round((completed / total) * 100);
			}
		);

		loadingPhase = 'complete';

		// 输出加载统计
		const stats = loadingStrategy.getStats();
		console.log('[Page] Loading stats:', stats);
	}

	// Initial load
	onMount(() => {
		if (!settings.isOnboardingComplete()) {
			onboardingOpen = true;
		}

		refresh.startRefresh();

		// 执行分阶段加载
		executePhasedLoading()
			.then(() => {
				refresh.endRefresh();
			})
			.catch((error) => {
				console.error('[Page] Phased loading failed:', error);
				refresh.endRefresh([String(error)]);
			});

		refresh.setupAutoRefresh(handleRefresh);

		// 定期清理过期缓存
		const gcInterval = setInterval(() => {
			globalCache.gc();
		}, 5 * 60 * 1000); // 每 5 分钟

		return () => {
			refresh.stopAutoRefresh();
			loadingStrategy?.abortAll();
			clearInterval(gcInterval);
		};
	});
</script>

<svelte:head>
	<title>态势监控</title>
	<meta name="description" content="实时全球态势监控仪表板" />
</svelte:head>

<div class="app">
	<Header onSettingsClick={() => (settingsOpen = true)} />

	<main class="main-content">
		<Dashboard>
			<!-- Map Panel - Full width -->
			{#if isPanelVisible('map')}
				<div class="panel-slot map-slot">
					{#await MapPanel}
						<div class="panel-loading">加载地图...</div>
					{:then MapComponent}
						{#if MapComponent}
							<MapComponent monitors={$monitors.monitors} />
						{/if}
					{:catch error}
						<div class="panel-error">地图加载失败</div>
					{/await}
				</div>
			{/if}

			<!-- 新闻面板 -->
			{#if isPanelVisible('politics')}
				<div class="panel-slot">
					<NewsPanel category="politics" panelId="politics" title="政治" />
				</div>
			{/if}

			{#if isPanelVisible('tech')}
				<div class="panel-slot">
					<NewsPanel category="tech" panelId="tech" title="科技" />
				</div>
			{/if}

			{#if isPanelVisible('finance')}
				<div class="panel-slot">
					<NewsPanel category="finance" panelId="finance" title="财经" />
				</div>
			{/if}

			{#if isPanelVisible('gov')}
				<div class="panel-slot">
					<NewsPanel category="gov" panelId="gov" title="政府" />
				</div>
			{/if}

			{#if isPanelVisible('ai')}
				<div class="panel-slot">
					<NewsPanel category="ai" panelId="ai" title="人工智能" />
				</div>
			{/if}

			<!-- 市场面板 -->
			{#if isPanelVisible('markets')}
				<div class="panel-slot">
					<MarketsPanel />
				</div>
			{/if}

			{#if isPanelVisible('heatmap')}
				<div class="panel-slot">
					{#await HeatmapPanel}
						<div class="panel-loading">加载热力图...</div>
					{:then Component}
						{#if Component}
							<Component />
						{/if}
					{:catch error}
						<div class="panel-error">热力图加载失败</div>
					{/await}
				</div>
			{/if}

			{#if isPanelVisible('commodities')}
				<div class="panel-slot">
					{#await CommoditiesPanel}
						<div class="panel-loading">加载商品...</div>
					{:then Component}
						{#if Component}
							<Component />
						{/if}
					{:catch error}
						<div class="panel-error">商品面板加载失败</div>
					{/await}
				</div>
			{/if}

			{#if isPanelVisible('crypto')}
				<div class="panel-slot">
					{#await CryptoPanel}
						<div class="panel-loading">加载加密货币...</div>
					{:then Component}
						{#if Component}
							<Component />
						{/if}
					{:catch error}
						<div class="panel-error">加密货币面板加载失败</div>
					{/await}
				</div>
			{/if}

			<!-- 分析面板 -->
			{#if isPanelVisible('mainchar')}
				<div class="panel-slot">
					{#await MainCharPanel}
						<div class="panel-loading">加载主图...</div>
					{:then Component}
						{#if Component}
							<Component />
						{/if}
					{:catch error}
						<div class="panel-error">主图加载失败</div>
					{/await}
				</div>
			{/if}

			{#if isPanelVisible('correlation')}
				<div class="panel-slot">
					{#await CorrelationPanel}
						<div class="panel-loading">加载相关性分析...</div>
					{:then Component}
						{#if Component}
							<Component news={$allNewsItems} />
						{/if}
					{:catch error}
						<div class="panel-error">相关性分析加载失败</div>
					{/await}
				</div>
			{/if}

			{#if isPanelVisible('narrative')}
				<div class="panel-slot">
					{#await NarrativePanel}
						<div class="panel-loading">加载叙事分析...</div>
					{:then Component}
						{#if Component}
							<Component news={$allNewsItems} />
						{/if}
					{:catch error}
						<div class="panel-error">叙事分析加载失败</div>
					{/await}
				</div>
			{/if}

			<!-- 情报面板 -->
			{#if isPanelVisible('intel')}
				<div class="panel-slot">
					{#await IntelPanel}
						<div class="panel-loading">加载情报...</div>
					{:then Component}
						{#if Component}
							<Component />
						{/if}
					{:catch error}
						<div class="panel-error">情报面板加载失败</div>
					{/await}
				</div>
			{/if}

			<!-- 美联储面板 -->
			{#if isPanelVisible('fed')}
				<div class="panel-slot">
					{#await FedPanel}
						<div class="panel-loading">加载美联储数据...</div>
					{:then Component}
						{#if Component}
							<Component />
						{/if}
					{:catch error}
						<div class="panel-error">美联储面板加载失败</div>
					{/await}
				</div>
			{/if}

			<!-- 世界各国领导人面板 -->
			{#if isPanelVisible('leaders')}
				<div class="panel-slot">
					{#await WorldLeadersPanel}
						<div class="panel-loading">加载领导人数据...</div>
					{:then Component}
						{#if Component}
							<Component {leaders} loading={leadersLoading} />
						{/if}
					{:catch error}
						<div class="panel-error">领导人面板加载失败</div>
					{/await}
				</div>
			{/if}

			<!-- 态势监控面板 -->
			{#if isPanelVisible('venezuela')}
				<div class="panel-slot">
					{#await SituationPanel}
						<div class="panel-loading">加载委内瑞拉监控...</div>
					{:then Component}
						{#if Component}
							<Component
								panelId="venezuela"
								config={{
									title: '委内瑞拉监控',
									subtitle: '人道主义危机监控',
									criticalKeywords: ['maduro', 'caracas', 'venezuela', 'guaido']
								}}
								news={$allNewsItems.filter(
									(n) =>
										n.title.toLowerCase().includes('venezuela') ||
										n.title.toLowerCase().includes('maduro')
								)}
							/>
						{/if}
					{:catch error}
						<div class="panel-error">委内瑞拉监控加载失败</div>
					{/await}
				</div>
			{/if}

			{#if isPanelVisible('greenland')}
				<div class="panel-slot">
					{#await SituationPanel}
						<div class="panel-loading">加载格陵兰监控...</div>
					{:then Component}
						{#if Component}
							<Component
								panelId="greenland"
								config={{
									title: '格陵兰监控',
									subtitle: '北极地缘政治监控',
									criticalKeywords: ['greenland', 'arctic', 'nuuk', 'denmark']
								}}
								news={$allNewsItems.filter(
									(n) =>
										n.title.toLowerCase().includes('greenland') ||
										n.title.toLowerCase().includes('arctic')
								)}
							/>
						{/if}
					{:catch error}
						<div class="panel-error">格陵兰监控加载失败</div>
					{/await}
				</div>
			{/if}

			{#if isPanelVisible('iran')}
				<div class="panel-slot">
					{#await SituationPanel}
						<div class="panel-loading">加载伊朗危机监控...</div>
					{:then Component}
						{#if Component}
							<Component
								panelId="iran"
								config={{
									title: '伊朗危机',
									subtitle: '革命抗议、政权不稳定与核计划',
									criticalKeywords: [
										'protest',
										'uprising',
										'revolution',
										'crackdown',
										'killed',
										'nuclear',
										'strike',
										'attack',
										'irgc',
										'khamenei'
									]
								}}
								news={$allNewsItems.filter(
									(n) =>
										n.title.toLowerCase().includes('iran') ||
										n.title.toLowerCase().includes('tehran') ||
										n.title.toLowerCase().includes('irgc')
								)}
							/>
						{/if}
					{:catch error}
						<div class="panel-error">伊朗危机监控加载失败</div>
					{/await}
				</div>
			{/if}

			<!-- 其他数据源面板 -->
			{#if isPanelVisible('whales')}
				<div class="panel-slot">
					{#await WhalePanel}
						<div class="panel-loading">加载鲸鱼交易...</div>
					{:then Component}
						{#if Component}
							<Component {whales} />
						{/if}
					{:catch error}
						<div class="panel-error">鲸鱼交易面板加载失败</div>
					{/await}
				</div>
			{/if}

			{#if isPanelVisible('polymarket')}
				<div class="panel-slot">
					{#await PolymarketPanel}
						<div class="panel-loading">加载预测市场...</div>
					{:then Component}
						{#if Component}
							<Component {predictions} />
						{/if}
					{:catch error}
						<div class="panel-error">预测市场面板加载失败</div>
					{/await}
				</div>
			{/if}

			{#if isPanelVisible('contracts')}
				<div class="panel-slot">
					{#await ContractsPanel}
						<div class="panel-loading">加载政府合同...</div>
					{:then Component}
						{#if Component}
							<Component {contracts} />
						{/if}
					{:catch error}
						<div class="panel-error">政府合同面板加载失败</div>
					{/await}
				</div>
			{/if}

			{#if isPanelVisible('layoffs')}
				<div class="panel-slot">
					{#await LayoffsPanel}
						<div class="panel-loading">加载裁员数据...</div>
					{:then Component}
						{#if Component}
							<Component {layoffs} />
						{/if}
					{:catch error}
						<div class="panel-error">裁员面板加载失败</div>
					{/await}
				</div>
			{/if}

			<!-- 印钞机面板 -->
			{#if isPanelVisible('printer')}
				<div class="panel-slot">
					{#await PrinterPanel}
						<div class="panel-loading">加载印钞机数据...</div>
					{:then Component}
						{#if Component}
							<Component />
						{/if}
					{:catch error}
						<div class="panel-error">印钞机面板加载失败</div>
					{/await}
				</div>
			{/if}

			<!-- 自定义监控（始终在最后） -->
			{#if isPanelVisible('monitors')}
				<div class="panel-slot">
					{#await MonitorsPanel}
						<div class="panel-loading">加载监控器...</div>
					{:then Component}
						{#if Component}
							<Component
								monitors={$monitors.monitors}
								matches={$monitors.matches}
								onCreateMonitor={handleCreateMonitor}
								onEditMonitor={handleEditMonitor}
								onDeleteMonitor={handleDeleteMonitor}
								onToggleMonitor={handleToggleMonitor}
							/>
						{/if}
					{:catch error}
						<div class="panel-error">监控器面板加载失败</div>
					{/await}
				</div>
			{/if}
		</Dashboard>
	</main>

	<!-- Modals -->
	<SettingsModal
		open={settingsOpen}
		onClose={() => (settingsOpen = false)}
		onReconfigure={handleReconfigure}
	/>
	<MonitorFormModal
		open={monitorFormOpen}
		onClose={() => (monitorFormOpen = false)}
		editMonitor={editingMonitor}
	/>
	<OnboardingModal open={onboardingOpen} onSelectPreset={handleSelectPreset} />
	<VersionBadge />
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg);
	}

	.main-content {
		flex: 1;
		padding: 0.5rem;
		overflow-y: auto;
	}

	.map-slot {
		column-span: all;
		margin-bottom: 0.5rem;
	}

	.panel-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.panel-error {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		color: var(--danger);
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.main-content {
			padding: 0.25rem;
		}
	}
</style>
