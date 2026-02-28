<script lang="ts">
	import Modal from './Modal.svelte';
	import { settings, type TranslationProvider, type NewsRegion } from '$lib/stores';
	import { PANELS, type PanelId } from '$lib/config';

	interface Props {
		open: boolean;
		onClose: () => void;
		onReconfigure?: () => void;
	}

	let { open = false, onClose, onReconfigure }: Props = $props();

	function handleTogglePanel(panelId: PanelId) {
		settings.togglePanel(panelId);
	}

	function handleToggleTranslation() {
		settings.toggleTranslation();
	}

	function handleProviderChange(provider: TranslationProvider) {
		settings.setTranslationProvider(provider);
	}

	function handleMicrosoftKeyChange(event: Event) {
		const target = event.target as HTMLInputElement;
		settings.setMicrosoftApiKey(target.value);
	}

	function handleGoogleKeyChange(event: Event) {
		const target = event.target as HTMLInputElement;
		settings.setGoogleApiKey(target.value);
	}

	function handleNewsRegionChange(region: NewsRegion) {
		settings.setNewsRegion(region);
	}

	function handleResetPanels() {
		settings.reset();
	}

	const providerOptions: { value: TranslationProvider; label: string; desc: string }[] = [
		{ value: 'auto', label: '自动选择', desc: '优先使用微软/谷歌，失败时自动切换到免费翻译' },
		{ value: 'microsoft', label: '微软翻译', desc: '需要API Key，质量高，每月200万字符免费' },
		{ value: 'google', label: '谷歌翻译', desc: '需要API Key，质量最高' },
		{ value: 'libretranslate', label: 'LibreTranslate', desc: '免费开源，无需API Key，质量一般' }
	];

	const regionOptions: { value: NewsRegion; label: string; desc: string }[] = [
		{ value: 'international', label: '国际新闻', desc: '使用GDELT获取全球英文新闻' },
		{ value: 'china', label: '中国新闻', desc: '使用国内新闻源获取中文新闻' }
	];
</script>

<Modal {open} title="设置" {onClose}>
	<div class="settings-sections">
		<section class="settings-section">
			<h3 class="section-title">翻译设置</h3>
			<p class="section-desc">配置翻译功能和API</p>

			<div class="feature-toggles">
				<label class="feature-toggle" class:enabled={$settings.enableTranslation}>
					<input
						type="checkbox"
						checked={$settings.enableTranslation}
						onchange={() => handleToggleTranslation()}
					/>
					<span class="feature-name">启用翻译</span>
					<span class="feature-desc">自动翻译英文内容为中文</span>
				</label>
			</div>

			{#if $settings.enableTranslation}
				<div class="translation-settings">
					<div class="provider-selection">
						<span class="setting-label">翻译服务</span>
						<div class="provider-options">
							{#each providerOptions as option}
								<label class="provider-option" class:selected={$settings.translationProvider === option.value}>
									<input
										type="radio"
										name="provider"
										value={option.value}
										checked={$settings.translationProvider === option.value}
										onchange={() => handleProviderChange(option.value)}
									/>
									<div class="provider-info">
										<span class="provider-name">{option.label}</span>
										<span class="provider-desc">{option.desc}</span>
									</div>
								</label>
							{/each}
						</div>
					</div>

					{#if $settings.translationProvider === 'microsoft' || $settings.translationProvider === 'auto'}
						<div class="api-key-input">
							<label class="setting-label" for="microsoft-key">
								微软翻译 API Key
								<span class="key-hint">(Azure Cognitive Services)</span>
							</label>
							<input
								id="microsoft-key"
								type="password"
								value={$settings.microsoftApiKey}
								oninput={handleMicrosoftKeyChange}
								placeholder="输入微软翻译API Key"
								class="key-input"
							/>
							<a 
								href="https://azure.microsoft.com/services/cognitive-services/translator/" 
								target="_blank" 
								rel="noopener noreferrer"
								class="help-link"
							>
								如何获取?
							</a>
						</div>
					{/if}

					{#if $settings.translationProvider === 'google' || $settings.translationProvider === 'auto'}
						<div class="api-key-input">
							<label class="setting-label" for="google-key">
								谷歌翻译 API Key
								<span class="key-hint">(Google Cloud Translation)</span>
							</label>
							<input
								id="google-key"
								type="password"
								value={$settings.googleApiKey}
								oninput={handleGoogleKeyChange}
								placeholder="输入谷歌翻译API Key"
								class="key-input"
							/>
							<a 
								href="https://cloud.google.com/translate" 
								target="_blank" 
								rel="noopener noreferrer"
								class="help-link"
							>
								如何获取?
							</a>
						</div>
					{/if}
				</div>
			{/if}
		</section>

		<section class="settings-section">
			<h3 class="section-title">新闻地区</h3>
			<p class="section-desc">选择新闻来源地区</p>

			<div class="region-selection">
				{#each regionOptions as option}
					<label class="region-option" class:selected={$settings.newsRegion === option.value}>
						<input
							type="radio"
							name="newsRegion"
							value={option.value}
							checked={$settings.newsRegion === option.value}
							onchange={() => handleNewsRegionChange(option.value)}
						/>
						<div class="region-info">
							<span class="region-name">{option.label}</span>
							<span class="region-desc">{option.desc}</span>
						</div>
					</label>
				{/each}
			</div>
		</section>

		<section class="settings-section">
			<h3 class="section-title">启用的面板</h3>
			<p class="section-desc">开关面板以自定义您的仪表板</p>

			<div class="panels-grid">
				{#each Object.entries(PANELS) as [id, config]}
					{@const panelId = id as PanelId}
					{@const isEnabled = $settings.enabled[panelId]}
					<label class="panel-toggle" class:enabled={isEnabled}>
						<input
							type="checkbox"
							checked={isEnabled}
							onchange={() => handleTogglePanel(panelId)}
						/>
						<span class="panel-name">{config.name}</span>
						<span class="panel-priority">P{config.priority}</span>
					</label>
				{/each}
			</div>
		</section>

		<section class="settings-section">
			<h3 class="section-title">仪表板</h3>
			{#if onReconfigure}
				<button class="reconfigure-btn" onclick={onReconfigure}> 重新配置仪表板 </button>
				<p class="btn-hint">为您的面板选择预设配置</p>
			{/if}
			<button class="reset-btn" onclick={handleResetPanels}> 重置所有设置 </button>
		</section>
	</div>
</Modal>

<style>
	.settings-sections {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		margin: 0;
	}

	.section-desc {
		font-size: 0.65rem;
		color: var(--text-muted);
		margin: 0;
	}

	.feature-toggles {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.feature-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.feature-toggle:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.feature-toggle.enabled {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.1);
	}

	.feature-toggle input {
		accent-color: var(--accent);
	}

	.feature-name {
		font-size: 0.7rem;
		color: var(--text-primary);
	}

	.feature-desc {
		flex: 1;
		font-size: 0.6rem;
		color: var(--text-muted);
		text-align: right;
	}

	.translation-settings {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 8px;
		margin-top: 0.5rem;
	}

	.setting-label {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
		display: block;
	}

	.key-hint {
		font-weight: 400;
		color: var(--text-muted);
		font-size: 0.6rem;
	}

	.provider-selection {
		display: flex;
		flex-direction: column;
	}

	.provider-options {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.provider-option {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.provider-option:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.provider-option.selected {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.1);
	}

	.provider-option input {
		margin-top: 0.1rem;
		accent-color: var(--accent);
	}

	.provider-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.provider-name {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.provider-desc {
		font-size: 0.6rem;
		color: var(--text-muted);
	}

	.region-selection {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.region-option {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.region-option:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.region-option.selected {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.1);
	}

	.region-option input {
		margin-top: 0.1rem;
		accent-color: var(--accent);
	}

	.region-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.region-name {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.region-desc {
		font-size: 0.6rem;
		color: var(--text-muted);
	}

	.api-key-input {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.key-input {
		padding: 0.5rem 0.75rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 0.7rem;
		transition: all 0.15s ease;
	}

	.key-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.key-input::placeholder {
		color: var(--text-muted);
	}

	.help-link {
		font-size: 0.6rem;
		color: var(--accent);
		text-decoration: none;
		margin-top: 0.25rem;
	}

	.help-link:hover {
		text-decoration: underline;
	}

	.panels-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.panel-toggle {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.6rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.panel-toggle:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.panel-toggle.enabled {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.1);
	}

	.panel-toggle input {
		accent-color: var(--accent);
	}

	.panel-name {
		flex: 1;
		font-size: 0.65rem;
		color: var(--text-primary);
	}

	.panel-priority {
		font-size: 0.5rem;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.05);
		padding: 0.1rem 0.25rem;
		border-radius: 2px;
	}

	.reconfigure-btn {
		padding: 0.5rem 1rem;
		background: rgba(0, 255, 136, 0.1);
		border: 1px solid rgba(0, 255, 136, 0.3);
		border-radius: 4px;
		color: var(--accent);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s ease;
		margin-bottom: 0.25rem;
	}

	.reconfigure-btn:hover {
		background: rgba(0, 255, 136, 0.2);
	}

	.btn-hint {
		font-size: 0.6rem;
		color: var(--text-muted);
		margin: 0 0 0.75rem;
	}

	.reset-btn {
		padding: 0.5rem 1rem;
		background: rgba(255, 68, 68, 0.1);
		border: 1px solid rgba(255, 68, 68, 0.3);
		border-radius: 4px;
		color: var(--danger);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.reset-btn:hover {
		background: rgba(255, 68, 68, 0.2);
	}
</style>
