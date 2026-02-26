<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PanelId } from '$lib/config';
	import SkeletonPanel from './SkeletonPanel.svelte';

	interface Props {
		id: PanelId;
		title: string;
		count?: number | string | null;
		status?: string;
		statusClass?: string;
		loading?: boolean;
		error?: string | null;
		draggable?: boolean;
		collapsible?: boolean;
		collapsed?: boolean;
		onCollapse?: () => void;
		header?: Snippet;
		actions?: Snippet;
		children: Snippet;
		skeletonLines?: number;
	}

	let {
		id,
		title,
		count = null,
		status = '',
		statusClass = '',
		loading = false,
		error = null,
		draggable = true,
		collapsible = false,
		collapsed = false,
		onCollapse,
		header,
		actions,
		children,
		skeletonLines = 5
	}: Props = $props();

	function handleCollapse() {
		if (collapsible && onCollapse) {
			onCollapse();
		}
	}
</script>

<div class="panel" class:draggable class:collapsed data-panel-id={id}>
	<div class="panel-header">
		<div class="panel-title-row">
			<h3 class="panel-title">{title}</h3>
			{#if count !== null}
				<span class="panel-count">{count}</span>
			{/if}
			{#if status}
				<span class="panel-status {statusClass}">{status}</span>
			{/if}
			{#if loading}
				<span class="panel-loading"></span>
			{/if}
		</div>

		{#if header}
			{@render header()}
		{/if}

		<div class="panel-actions">
			{#if actions}
				{@render actions()}
			{/if}
			{#if collapsible}
				<button class="panel-collapse-btn" onclick={handleCollapse} aria-label="Toggle panel">
					{collapsed ? '▼' : '▲'}
				</button>
			{/if}
		</div>
	</div>

	<div class="panel-content" class:hidden={collapsed}>
		{#if error}
			<div class="error-msg">{error}</div>
		{:else if loading}
			<SkeletonPanel lines={skeletonLines} header={false} />
		{:else}
			{@render children()}
		{/if}
	</div>
</div>

<style>
	.panel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: all 0.15s ease;
	}

	.panel:hover {
		border-color: var(--border-light);
		box-shadow: 0 0 20px var(--accent-glow);
	}

	.panel.draggable {
		cursor: grab;
	}

	.panel.draggable:active {
		cursor: grabbing;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		min-height: 3rem;
	}

	.panel-title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.panel-title {
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-secondary);
		margin: 0;
	}

	.panel-count {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent);
		background: rgba(var(--accent-rgb), 0.15);
		padding: 0.2rem 0.6rem;
		border-radius: 6px;
	}

	.panel-status {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.2rem 0.6rem;
		border-radius: 6px;
		text-transform: uppercase;
	}

	.panel-status.monitoring {
		color: var(--text-secondary);
		background: rgba(255, 255, 255, 0.05);
	}

	.panel-status.elevated {
		color: var(--yellow);
		background: rgba(245, 158, 11, 0.15);
	}

	.panel-status.critical {
		color: var(--red);
		background: rgba(239, 68, 68, 0.15);
	}

	.panel-loading {
		width: 18px;
		height: 18px;
		border: 2px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.panel-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.panel-collapse-btn {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.35rem;
		font-size: 0.8rem;
		line-height: 1;
		transition: color 0.15s ease;
	}

	.panel-collapse-btn:hover {
		color: var(--accent);
	}

	.panel-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.panel-content.hidden {
		display: none;
	}

	.error-msg {
		color: var(--danger);
		text-align: center;
		padding: 1.5rem;
		font-size: 0.9rem;
	}
</style>
