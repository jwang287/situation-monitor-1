<script lang="ts">
	interface Props {
		lines?: number;
		header?: boolean;
	}

	let { lines = 5, header = true }: Props = $props();
</script>

<div class="skeleton-panel">
	{#if header}
		<div class="skeleton-header">
			<div class="skeleton-title"></div>
			<div class="skeleton-badge"></div>
		</div>
	{/if}
	<div class="skeleton-content">
		{#each Array(lines) as _, i}
			<div class="skeleton-line" style="width: {85 + Math.random() * 15}%"></div>
		{/each}
	</div>
</div>

<style>
	.skeleton-panel {
		padding: 1rem;
	}

	.skeleton-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border);
	}

	.skeleton-title {
		width: 140px;
		height: 18px;
		background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 4px;
	}

	.skeleton-badge {
		width: 50px;
		height: 18px;
		background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 4px;
	}

	.skeleton-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.skeleton-line {
		height: 14px;
		background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 3px;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
