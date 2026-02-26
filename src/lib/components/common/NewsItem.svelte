<script lang="ts">
	import type { NewsItem } from '$lib/types';
	import { timeAgo } from '$lib/utils';
	import BilingualText from './BilingualText.svelte';
	import { settings } from '$lib/stores/settings';

	interface Props {
		item: NewsItem;
		showSource?: boolean;
		showAlert?: boolean;
		showDescription?: boolean;
		compact?: boolean;
	}

	let {
		item,
		showSource = true,
		showAlert = true,
		showDescription = false,
		compact = false
	}: Props = $props();

	// 根据重要性获取左边框颜色
	function getImportanceColor(): string {
		if (item.isAlert) return 'var(--red)';
		return 'transparent';
	}
</script>

<div 
	class="news-item" 
	class:alert={showAlert && item.isAlert} 
	class:compact
	style="border-left-color: {getImportanceColor()}"
>
	{#if showSource}
		<div class="item-source">
			{item.source}
			{#if showAlert && item.isAlert}
				<span class="alert-tag">ALERT</span>
			{/if}
		</div>
	{/if}

	<a class="item-title" href={item.link} target="_blank" rel="noopener noreferrer">
		<BilingualText text={item.title} enableTranslation={$settings.enableTranslation} />
	</a>

	{#if showDescription && item.description}
		<p class="item-description">
			<BilingualText text={item.description} enableTranslation={$settings.enableTranslation} />
		</p>
	{/if}

	<div class="item-meta">
		<span class="item-time">{timeAgo(item.timestamp)}</span>
		{#if item.region}
			<span class="item-region">{item.region}</span>
		{/if}
	</div>
</div>

<style>
	.news-item {
		padding: 0.875rem 1rem;
		border-bottom: 1px solid var(--border);
		border-left: 4px solid transparent;
		transition: all 0.15s ease;
	}

	.news-item:hover {
		background: var(--surface-hover);
		transform: translateX(3px);
	}

	.news-item:last-child {
		border-bottom: none;
	}

	.news-item.compact {
		padding: 0.625rem 1rem;
	}

	.news-item.alert {
		background: rgba(239, 68, 68, 0.08);
		border-left-color: var(--red);
		border-radius: 0 10px 10px 0;
	}

	.news-item.alert:hover {
		background: rgba(239, 68, 68, 0.12);
	}

	.item-source {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.375rem;
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-weight: 500;
	}

	.alert-tag {
		background: var(--red);
		color: white;
		font-size: 0.7rem;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		font-weight: 700;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.item-title {
		display: block;
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--text-primary);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.15s ease;
	}

	.item-title:hover {
		color: var(--accent);
	}

	.compact .item-title {
		font-size: 0.875rem;
		line-height: 1.4;
	}

	.item-description {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin: 0.5rem 0 0;
		line-height: 1.6;
	}

	.item-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.item-time {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.item-region {
		font-size: 0.75rem;
		color: var(--accent);
		background: rgba(var(--accent-rgb), 0.15);
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		text-transform: uppercase;
		font-weight: 600;
	}
</style>
