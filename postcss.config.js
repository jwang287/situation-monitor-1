export default {
	plugins: {
		tailwindcss: {},
		autoprefixer: {},
		// 生产环境启用 CSSNano 压缩
		cssnano: process.env.NODE_ENV === 'production'
			? {
					preset: [
						'advanced',
						{
							discardComments: {
								removeAll: true
							},
							minifySelectors: true,
							mergeLonghand: true,
							normalizeWhitespace: true
						}
					]
			  }
			: false
	}
};
