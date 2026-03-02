<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		// 性能监控已移至浏览器端运行时
		// 避免在 SSR 构建时引用 PerformanceObserver 等浏览器 API
		if (!browser || typeof window === 'undefined') return;
		
		// 可以在这里添加其他浏览器端初始化逻辑
	});
</script>

<div class="min-h-screen bg-bg text-text-primary">
	{@render children()}
</div>
