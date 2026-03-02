export default {
	plugins: {
		tailwindcss: {},
		autoprefixer: {},
		// 生产环境启用 CSSNano 压缩
		cssnano: process.env.NODE_ENV === 'production'
			? {
					preset: [
						'default',
						{
							discardComments: {
								removeAll: true
							}
						}
					]
			  }
			: false
	}
};
