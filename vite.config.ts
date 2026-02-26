import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		// 代码分割配置
		rollupOptions: {
			output: {
				manualChunks: {
					// 将大型依赖单独打包
					'vendor-d3': ['d3', 'topojson-client'],
					'vendor-charts': ['chart.js'],
					// 面板组件按需分割
					'panels-map': ['./src/lib/components/panels/MapPanel.svelte'],
					'panels-markets': ['./src/lib/components/panels/MarketsPanel.svelte'],
					'panels-fed': ['./src/lib/components/panels/FedPanel.svelte'],
					'panels-leaders': ['./src/lib/components/panels/WorldLeadersPanel.svelte']
				}
			}
		},
		// 启用代码压缩
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true, // 生产环境移除 console
				drop_debugger: true
			}
		},
		// 资源内联阈值 - 小于4KB的资源内联为base64
		assetsInlineLimit: 4096,
		// 生成source map用于调试
		sourcemap: false
	},
	// 开发服务器配置
	server: {
		// 预热常用文件
		preTransformRequests: true
	}
});
