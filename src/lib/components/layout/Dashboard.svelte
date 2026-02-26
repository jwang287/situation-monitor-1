<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Drag-drop state and handlers will be added in Phase 4
	// when panels are fully implemented
</script>

<main class="dashboard">
	<div class="dashboard-grid">
		{@render children()}
	</div>
</main>

<style>
	.dashboard {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
	}

	.dashboard-grid {
		column-count: 1;
		column-gap: 1rem;
		max-width: 2000px;
		margin: 0 auto;
	}

	.dashboard-grid > :global(*) {
		break-inside: avoid;
		margin-bottom: 1rem;
	}

	@media (min-width: 640px) {
		.dashboard-grid {
			column-count: 2;
		}
	}

	@media (min-width: 1024px) {
		.dashboard-grid {
			column-count: 3;
		}
	}

	@media (min-width: 1280px) {
		.dashboard-grid {
			column-count: 4;
		}
	}

	@media (min-width: 1536px) {
		.dashboard-grid {
			column-count: 5;
		}
	}

	@media (min-width: 1920px) {
		.dashboard-grid {
			column-count: 6;
		}
	}
</style>
