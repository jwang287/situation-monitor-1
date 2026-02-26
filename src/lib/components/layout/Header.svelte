<script lang="ts">
	import { isRefreshing, lastRefresh } from '$lib/stores';

	interface Props {
		onSettingsClick?: () => void;
	}

	let { onSettingsClick }: Props = $props();

	const lastRefreshText = $derived(
		$lastRefresh
			? `最后更新: ${new Date($lastRefresh).toLocaleTimeString('zh-CN', { hour: 'numeric', minute: '2-digit' })}`
			: '从未刷新'
	);
</script>

<header class="header">
	<div class="header-left">
		<h1 class="logo">态势监控</h1>
	</div>

	<div class="header-center">
		<div class="refresh-status">
			{#if $isRefreshing}
				<span class="status-text loading">
					<span class="loading-dot"></span>
					刷新中...
				</span>
			{:else}
				<span class="status-text">{lastRefreshText}</span>
			{/if}
		</div>
	</div>

	<div class="header-right">
		<button class="header-btn settings-btn" onclick={onSettingsClick} title="设置">
			<span class="btn-icon">⚙</span>
			<span class="btn-label">设置</span>
		</button>
	</div>
</header>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.875rem 1.5rem;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		z-index: 100;
		gap: 1.5rem;
	}

	.header-left {
		display: flex;
		align-items: baseline;
		flex-shrink: 0;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--text-primary);
		margin: 0;
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.header-center {
		display: flex;
		align-items: center;
		flex: 1;
		justify-content: center;
		min-width: 0;
	}

	.refresh-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-text {
		font-size: 0.875rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-text.loading {
		color: var(--accent);
	}

	.loading-dot {
		width: 8px;
		height: 8px;
		background: var(--accent);
		border-radius: 50%;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(0.8); }
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.header-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 2.75rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.header-btn:hover {
		background: var(--border);
		color: var(--text-primary);
		border-color: var(--border-light);
	}

	.btn-icon {
		font-size: 1rem;
	}

	.btn-label {
		display: none;
	}

	@media (min-width: 768px) {
		.btn-label {
			display: inline;
		}
	}
</style>
