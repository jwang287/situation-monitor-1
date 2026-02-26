import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
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
