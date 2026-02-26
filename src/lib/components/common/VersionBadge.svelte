<script lang="ts">
	// 版本号 - 每次部署时更新
	const VERSION = '1.0.0';
	const BUILD_DATE = new Date().toLocaleDateString('zh-CN');
</script>

<div class="version-badge" title="构建时间: {BUILD_DATE}">
	v{VERSION}
</div>

<style>
	.version-badge {
		position: fixed;
		bottom: 8px;
		right: 8px;
		background: var(--surface);
		border: 1px solid var(--border);
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.65rem;
		color: var(--text-muted);
		z-index: 1000;
		opacity: 0.7;
		transition: opacity 0.15s ease;
		font-family: 'SF Mono', Monaco, monospace;
	}

	.version-badge:hover {
		opacity: 1;
		border-color: var(--accent);
		color: var(--accent);
	}
</style>
