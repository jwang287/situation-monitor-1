<script lang="ts">
	import { translationService } from '$lib/services/translation';

	interface Props {
		text: string;
		enableTranslation: boolean;
	}

	let { text, enableTranslation }: Props = $props();

	let translatedText = $state<string>('');
	let isLoading = $state(false);
	let hasError = $state(false);

	$effect(() => {
		if (enableTranslation && text) {
			isLoading = true;
			hasError = false;
			translatedText = '';

			translationService
				.translate(text)
				.then((result) => {
					translatedText = result;
					isLoading = false;
				})
				.catch(() => {
					hasError = true;
					isLoading = false;
				});
		} else {
			translatedText = '';
			isLoading = false;
			hasError = false;
		}
	});
</script>

<div class="bilingual-text">
	<div class="original-text">{text}</div>

	{#if enableTranslation}
		{#if isLoading}
			<div class="loading-indicator">
				<div class="spinner"></div>
			</div>
		{:else if translatedText && !hasError}
			<div class="divider"></div>
			<div class="translated-text">{translatedText}</div>
		{/if}
	{/if}
</div>

<style>
	.bilingual-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.original-text {
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--text-primary);
	}

	.divider {
		height: 1px;
		background: var(--border);
		margin: 0.15rem 0;
	}

	.translated-text {
		font-size: 0.7rem;
		line-height: 1.35;
		color: var(--text-secondary);
	}

	.loading-indicator {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.15rem 0;
	}

	.spinner {
		width: 12px;
		height: 12px;
		border: 1.5px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
