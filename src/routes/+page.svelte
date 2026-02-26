<script lang="ts">
	import { onMount } from 'svelte';
	import { Header, Dashboard } from '$lib/components/layout';
	import { SettingsModal, MonitorFormModal, OnboardingModal } from '$lib/components/modals';
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
	import type { Prediction, WhaleTransaction, Contract, Layoff } from '$lib/api';
	import type { CustomMonitor, WorldLeader } from '$lib/types';
	import type { PanelId } from '$lib/config';
	import { SkeletonPanel } from '$lib/components/common';

	// 动态导入面板组件 - 懒加载
	const panelImports: Record<string, () => Promise<any>> = {
		map: () => import('$lib/components/panels/MapPanel.svelte'),
		politics: () => import('$lib/components/panels/NewsPanel.svelte'),
		tech: () => import('$lib/components/panels/NewsPanel.svelte'),
		finance: () => import('$lib/components/panels/NewsPanel.svelte'),
		gov: () => import('$lib/components/panels/NewsPanel.svelte'),
		ai: () => import('$lib/components/panels/NewsPanel.svelte'),
		intel: () => import('$lib/components/panels/NewsPanel.svelte'),
		markets: () => import('$lib/components/panels/MarketsPanel.svelte'),
		heatmap: () => import('$lib/components/panels/HeatmapPanel.svelte'),
		commodities: () => import('$lib/components/panels/CommoditiesPanel.svelte'),
		crypto: () => import('$lib/components/panels/CryptoPanel.svelte'),
		mainchar: () => import('$lib/components/panels/MainCharPanel.svelte'),
		correlation: () => import('$lib/components/panels/CorrelationPanel.svelte'),
		narrative: () => import('$lib/components/panels/NarrativePanel.svelte'),
		fed: () => import('$lib/components/panels/FedPanel.svelte'),
		leaders: () => import('$lib/components/panels/WorldLeadersPanel.svelte'),
		venezuela: () => import('$lib/components/panels/SituationPanel.svelte'),
		greenland: () => import('$lib/components/panels/SituationPanel.svelte'),
		iran: () => import('$lib/components/panels/SituationPanel.svelte'),
		whales: () => import('$lib/components/panels/WhalePanel.svelte'),
		polymarket: () => import('$lib/components/panels/PolymarketPanel.svelte'),
		contracts: () => import('$lib/components/panels/ContractsPanel.svelte'),
		layoffs: () => import('$lib/components/panels/LayoffsPanel.svelte'),
		printer: () => import('$lib/components/panels/PrinterPanel.svelte'),
		monitors: () => import('$lib/components/panels/MonitorsPanel.svelte')
	};

	// 已加载的组件缓存
	let loadedComponents = $state<Record<string, any>>({});
	// 组件加载状态
	let loadingComponents = $state<Set<string>>(new Set());

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

	// 加载面板组件
	async function loadPanelComponent(id: string) {
		if (loadedComponents[id] || loadingComponents.has(id)) return;
		
		const importer = panelImports[id];
		if (!importer) return;

		loadingComponents.add(id);
		try {
			const module = await importer();
			loadedComponents[id] = module.default;
		} catch (error) {
			console.error(`Failed to load panel ${id}:`, error);
		} finally {
			loadingComponents.delete(id);
		}
	}

	// Data fetching
	async function loadNews() {
		console.log('[Page] Starting loadNews...');
		const categories = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'] as const;
		categories.forEach((cat) => news.setLoading(cat, true));

		try {
			const data = await fetchAllNews();
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
			const data = await fetchAllMarkets();
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
			leaders = await fetchWorldLeaders();
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
			const [indicatorsData, newsData] = await Promise.all([fetchFedIndicators(), fetchFedNews()]);
			fedIndicators.setData(indicatorsData);
			fedNews.setItems(newsData);
		} catch (error) {
			console.error('Failed to load Fed data:', error);
			fedIndicators.setError(String(error));
			fedNews.setError(String(error));
		}
	}

	// Refresh handlers
	async function handleRefresh() {
		refresh.startRefresh();
		try {
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

	// 加载可见面板组件
	function loadVisiblePanels() {
		const visiblePanels = Object.entries($settings.enabled)
			.filter(([, enabled]) => enabled)
			.map(([id]) => id);
		
		visiblePanels.forEach(id => loadPanelComponent(id));
	}

	// Initial load
	onMount(() => {
		if (!settings.isOnboardingComplete()) {
			onboardingOpen = true;
		}

		// 加载可见面板组件
		loadVisiblePanels();

		async function initialLoad() {
			refresh.startRefresh();
			try {
				await Promise.all([
					loadNews(),
					loadMarkets(),
					loadMiscData(),
					loadWorldLeaders(),
					loadFedData()
				]);
				refresh.endRefresh();
			} catch (error) {
				refresh.endRefresh([String(error)]);
			}
		}
		initialLoad();
		refresh.setupAutoRefresh(handleRefresh);

		return () => {
			refresh.stopAutoRefresh();
		};
	});

	// 监听设置变化，加载新启用的面板
	$effect(() => {
		if ($settings.initialized) {
			loadVisiblePanels();
		}
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
					{#if loadedComponents['map']}
						<svelte:component this={loadedComponents['map']} monitors={$monitors.monitors} />
					{:else}
						<SkeletonPanel lines={8} />
					{/if}
				</div>
			{/if}

			<!-- 新闻面板 -->
			{#if isPanelVisible('politics')}
				<div class="panel-slot">
					{#if loadedComponents['politics']}
						<svelte:component this={loadedComponents['politics']} category="politics" panelId="politics" title="政治" />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('tech')}
				<div class="panel-slot">
					{#if loadedComponents['tech']}
						<svelte:component this={loadedComponents['tech']} category="tech" panelId="tech" title="科技" />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('finance')}
				<div class="panel-slot">
					{#if loadedComponents['finance']}
						<svelte:component this={loadedComponents['finance']} category="finance" panelId="finance" title="财经" />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('gov')}
				<div class="panel-slot">
					{#if loadedComponents['gov']}
						<svelte:component this={loadedComponents['gov']} category="gov" panelId="gov" title="政府" />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('ai')}
				<div class="panel-slot">
					{#if loadedComponents['ai']}
						<svelte:component this={loadedComponents['ai']} category="ai" panelId="ai" title="人工智能" />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			<!-- 市场面板 -->
			{#if isPanelVisible('markets')}
				<div class="panel-slot">
					{#if loadedComponents['markets']}
						<svelte:component this={loadedComponents['markets']} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('heatmap')}
				<div class="panel-slot">
					{#if loadedComponents['heatmap']}
						<svelte:component this={loadedComponents['heatmap']} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('commodities')}
				<div class="panel-slot">
					{#if loadedComponents['commodities']}
						<svelte:component this={loadedComponents['commodities']} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('crypto')}
				<div class="panel-slot">
					{#if loadedComponents['crypto']}
						<svelte:component this={loadedComponents['crypto']} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			<!-- 分析面板 -->
			{#if isPanelVisible('mainchar')}
				<div class="panel-slot">
					{#if loadedComponents['mainchar']}
						<svelte:component this={loadedComponents['mainchar']} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('correlation')}
				<div class="panel-slot">
					{#if loadedComponents['correlation']}
						<svelte:component this={loadedComponents['correlation']} news={$allNewsItems} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('narrative')}
				<div class="panel-slot">
					{#if loadedComponents['narrative']}
						<svelte:component this={loadedComponents['narrative']} news={$allNewsItems} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			<!-- 情报面板 -->
			{#if isPanelVisible('intel')}
				<div class="panel-slot">
					{#if loadedComponents['intel']}
						<svelte:component this={loadedComponents['intel']} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			<!-- 美联储面板 -->
			{#if isPanelVisible('fed')}
				<div class="panel-slot">
					{#if loadedComponents['fed']}
						<svelte:component this={loadedComponents['fed']} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			<!-- 世界各国领导人面板 -->
			{#if isPanelVisible('leaders')}
				<div class="panel-slot">
					{#if loadedComponents['leaders']}
						<svelte:component this={loadedComponents['leaders']} {leaders} loading={leadersLoading} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			<!-- 态势监控面板 -->
			{#if isPanelVisible('venezuela')}
				<div class="panel-slot">
					{#if loadedComponents['venezuela']}
						<svelte:component this={loadedComponents['venezuela']}
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
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('greenland')}
				<div class="panel-slot">
					{#if loadedComponents['greenland']}
						<svelte:component this={loadedComponents['greenland']}
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
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('iran')}
				<div class="panel-slot">
					{#if loadedComponents['iran']}
						<svelte:component this={loadedComponents['iran']}
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
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			<!-- 其他数据源面板 -->
			{#if isPanelVisible('whales')}
				<div class="panel-slot">
					{#if loadedComponents['whales']}
						<svelte:component this={loadedComponents['whales']} {whales} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('polymarket')}
				<div class="panel-slot">
					{#if loadedComponents['polymarket']}
						<svelte:component this={loadedComponents['polymarket']} {predictions} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('contracts')}
				<div class="panel-slot">
					{#if loadedComponents['contracts']}
						<svelte:component this={loadedComponents['contracts']} {contracts} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			{#if isPanelVisible('layoffs')}
				<div class="panel-slot">
					{#if loadedComponents['layoffs']}
						<svelte:component this={loadedComponents['layoffs']} {layoffs} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			<!-- 印钞机面板 -->
			{#if isPanelVisible('printer')}
				<div class="panel-slot">
					{#if loadedComponents['printer']}
						<svelte:component this={loadedComponents['printer']} />
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
				</div>
			{/if}

			<!-- 自定义监控（始终在最后） -->
			{#if isPanelVisible('monitors')}
				<div class="panel-slot">
					{#if loadedComponents['monitors']}
						<svelte:component this={loadedComponents['monitors']}
							monitors={$monitors.monitors}
							matches={$monitors.matches}
							onCreateMonitor={handleCreateMonitor}
							onEditMonitor={handleEditMonitor}
							onDeleteMonitor={handleDeleteMonitor}
							onToggleMonitor={handleToggleMonitor}
						/>
					{:else}
						<SkeletonPanel lines={6} />
					{/if}
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

	@media (max-width: 768px) {
		.main-content {
			padding: 0.25rem;
		}
	}
</style>
