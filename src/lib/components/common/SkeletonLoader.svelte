<script lang="ts">
	/**
	 * 骨架屏加载组件
	 * 用于数据加载时显示占位内容，提升用户体验
	 */
	
	interface Props {
		/** 行数 */
		rows?: number;
		/** 列数 */
		columns?: number;
		/** 高度 */
		height?: string;
		/** 是否显示动画 */
		animated?: boolean;
		/** 自定义样式类 */
		class?: string;
	}
	
	let { 
		rows = 5, 
		columns = 1, 
		height = '1rem',
		animated = true,
		class: className = ''
	}: Props = $props();
</script>

<div class="skeleton-loader {className}" class:animated>
	{#each Array(rows) as _, rowIndex}
		<div class="skeleton-row" style="animation-delay: {rowIndex * 0.1}s">
			{#each Array(columns) as _, colIndex}
				<div 
					class="skeleton-item" 
					style="height: {height}; animation-delay: {(rowIndex * columns + colIndex) * 0.05}s"
				></div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.skeleton-loader {
		padding: 0.5rem;
		width: 100%;
	}
	
	.skeleton-row {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		width: 100%;
	}
	
	.skeleton-row:last-child {
		margin-bottom: 0;
	}
	
	.skeleton-item {
		flex: 1;
		background: var(--surface, #2a2a2a);
		border-radius: 0.25rem;
		min-height: 1rem;
	}
	
	.skeleton-loader.animated .skeleton-item {
		animation: pulse 1.5s ease-in-out infinite;
		background: linear-gradient(
			90deg,
			var(--surface, #2a2a2a) 25%,
			var(--surface-light, #3a3a3a) 50%,
			var(--surface, #2a2a2a) 75%
		);
		background-size: 200% 100%;
	}
	
	@keyframes pulse {
		0% {
			opacity: 1;
			background-position: 200% 0;
		}
		50% {
			opacity: 0.7;
		}
		100% {
			opacity: 1;
			background-position: -200% 0;
		}
	}
	
	/* 不同尺寸的变体 */
	:global(.skeleton-compact) {
		padding: 0.25rem;
	}
	
	:global(.skeleton-compact .skeleton-row) {
		margin-bottom: 0.5rem;
	}
	
	:global(.skeleton-large .skeleton-item) {
		min-height: 2rem;
	}
	
	/* 卡片样式 */
	:global(.skeleton-card) {
		background: var(--panel-bg, #1a1a1a);
		border-radius: 0.5rem;
		border: 1px solid var(--border, #333);
	}
</style>
