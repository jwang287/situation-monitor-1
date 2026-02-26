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
	let debugInfo = $state<string>('');

	$effect(() => {
		console.log('[BilingualText] enableTranslation:', enableTranslation, 'text:', text?.substring(0, 30));
		if (enableTranslation && text) {
			isLoading = true;
			hasError = false;
			translatedText = '';
			debugInfo = '翻译中...';

			translationService
				.translate(text)
				.then((result) => {
					console.log('[BilingualText] Translation result:', result?.substring(0, 30));
					translatedText = result;
					isLoading = false;
					debugInfo = '翻译完成';
				})
				.catch((err) => {
					console.error('[BilingualText] Translation error:', err);
					hasError = true;
					isLoading = false;
					debugInfo = '翻译失败: ' + err.message;
				});
		} else {
			translatedText = '';
			isLoading = false;
			hasError = false;
			debugInfo = enableTranslation ? '等待文本...' : '翻译已禁用';
		}
	});
</script>

<div class="bilingual-text">
	<div class="original-text">{text}</div>

	{#if enableTranslation}
		{#if isLoading}
			<div class="loading-indicator">
				<div class="spinner"></div>
				<span class="loading-text">翻译中...</span>
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

	.loading-text {
		font-size: 0.6rem;
		color: var(--text-muted);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
