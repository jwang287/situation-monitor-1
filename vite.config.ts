import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	build: {
		// 代码分割优化
		rollupOptions: {
			output: {
				manualChunks: {
					// 分离 D3 库 (用于图表和地图)
					'd3-vendor': ['d3', 'topojson-client']
				}
			}
		},
		// 启用压缩
		minify: 'esbuild',
		// 生成 sourcemap 用于分析
		sourcemap: true,
		// 限制 chunk 大小
		chunkSizeWarningLimit: 500,
		// 目标现代浏览器
		target: 'es2020'
	},
	
	// 优化依赖预构建
	optimizeDeps: {
		include: ['d3', 'topojson-client']
	}
});
