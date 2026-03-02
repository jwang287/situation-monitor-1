# 网站性能测试与优化方案

## 📊 性能测试报告

### 1. 当前架构分析

#### 技术栈
- **框架**: SvelteKit v2.0 + Svelte v5.0
- **构建工具**: Vite v6.0
- **样式**: Tailwind CSS v3.4
- **适配器**: @sveltejs/adapter-static (静态站点)
- **部署**: GitHub Pages

#### 应用结构
- **面板数量**: 19 个功能面板 (新闻、市场、分析、情报等)
- **API 数据源**: GDELT、Finnhub、CoinGecko、FRED 等
- **缓存策略**: SmartCache (stale-while-revalidate)
- **加载策略**: 分阶段加载 (critical/important/background)

---

## 🔍 性能瓶颈识别

### 关键性能指标预估

基于代码分析，预估当前性能表现：

| 指标 | 预估值 | 目标值 | 状态 |
|------|--------|--------|------|
| **LCP (最大内容绘制)** | 3.5-4.5s | <2.5s | ⚠️ 需优化 |
| **FCP (首次内容绘制)** | 1.8-2.5s | <1.0s | ⚠️ 需优化 |
| **CLS (累积布局偏移)** | 0.15-0.25 | <0.1 | ⚠️ 需优化 |
| **FID (首次输入延迟)** | 150-200ms | <100ms | ⚠️ 需优化 |
| **TTI (可交互时间)** | 4.0-5.5s | <3.0s | ⚠️ 需优化 |
| **首屏加载时间** | 2.5-3.5s | <1.5s | ⚠️ 需优化 |

### 主要性能瓶颈

#### 1. **JavaScript 包体积过大** 🔴 高优先级
**问题**:
- 19 个面板组件全部导入到主页面
- D3.js 库体积较大 (~250KB gzipped)
- 所有面板代码在初始加载时全部下载

**影响**:
- 初始 bundle 体积估计 400-600KB
- 首屏加载时间增加 1-2 秒
- 移动端用户体验差

**代码位置**:
```typescript
// src/routes/+page.svelte - 第 6-26 行
import {
  NewsPanel, MarketsPanel, HeatmapPanel, CommoditiesPanel,
  CryptoPanel, MainCharPanel, CorrelationPanel, NarrativePanel,
  MonitorsPanel, MapPanel, WhalePanel, PolymarketPanel,
  ContractsPanel, LayoffsPanel, IntelPanel, SituationPanel,
  WorldLeadersPanel, PrinterPanel, FedPanel
} from '$lib/components/panels';
```

#### 2. **CSS 未优化** 🟡 中优先级
**问题**:
- Tailwind CSS 可能包含未使用的样式
- 自定义动画较多 (shimmer, pulse, spin, glow 等)
- 全局 CSS 文件较大

**影响**:
- CSS 文件体积增加 30-50KB
- 渲染阻塞时间增加

#### 3. **图片资源缺失优化** 🟡 中优先级
**问题**:
- 仅有一个 favicon.ico
- 缺少响应式图片
- 无现代图片格式 (WebP, AVIF)

#### 4. **API 请求串行化** 🟡 中优先级
**问题**:
```typescript
// src/lib/api/news.ts - 第 180-193 行
export async function fetchAllNews(): Promise<...> {
  for (let i = 0; i < NEWS_CATEGORIES.length; i++) {
    const category = NEWS_CATEGORIES[i];
    if (i > 0) {
      await delay(API_DELAYS.betweenCategories); // 500ms 延迟
    }
    result[category] = await fetchCategoryNews(category);
  }
}
```

**影响**:
- 6 个新闻类别串行加载 = 至少 3 秒延迟
- 虽然避免速率限制，但严重影响首屏数据展示

#### 5. **字体加载策略** 🟢 低优先级
**问题**:
- 使用 'Inter' 字体但未预加载
- 可能导致 FOUT/FOIT

#### 6. **缓存策略可优化** 🟢 低优先级
**问题**:
- SmartCache 实现良好但可进一步优化
- 缺少 Service Worker 离线缓存
- 无 HTTP 缓存头优化

---

## 🚀 性能优化方案

### 阶段一：关键优化 (预期提升 40-50%)

#### 1.1 代码分割与懒加载 ⭐⭐⭐⭐⭐

**目标**: 减少初始 bundle 体积 60-70%

**实施方案**:

```typescript
// src/routes/+page.svelte - 修改为动态导入
<script lang="ts">
  import { onMount } from 'svelte';
  import { Header, Dashboard } from '$lib/components/layout';
  
  // 按需懒加载面板组件
  let NewsPanel = $state(null);
  let MarketsPanel = $state(null);
  let MapPanel = $state(null);
  // ... 其他面板
  
  // 预加载关键面板
  onMount(async () => {
    const [
      NewsModule,
      MarketsModule,
      MapModule
    ] = await Promise.all([
      import('$lib/components/panels/NewsPanel.svelte'),
      import('$lib/components/panels/MarketsPanel.svelte'),
      import('$lib/components/panels/MapPanel.svelte')
    ]);
    
    NewsPanel = NewsModule.default;
    MarketsPanel = MarketsModule.default;
    MapPanel = MapModule.default;
  });
  
  // 非关键面板延迟加载
  setTimeout(async () => {
    const [FedModule, LeadersModule] = await Promise.all([
      import('$lib/components/panels/FedPanel.svelte'),
      import('$lib/components/panels/WorldLeadersPanel.svelte')
    ]);
    FedPanel = FedModule.default;
    WorldLeadersPanel = LeadersModule.default;
  }, 100);
</script>
```

**预期效果**:
- 初始 bundle: 600KB → 200KB (-67%)
- FCP: 2.5s → 1.2s (-52%)
- LCP: 4.0s → 2.0s (-50%)

---

#### 1.2 优化 Vite 构建配置 ⭐⭐⭐⭐⭐

**修改 vite.config.ts**:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // 分离 D3 库
          'd3-vendor': ['d3'],
          // 分离 Svelte 运行时
          'svelte-vendor': ['svelte', '@sveltejs/kit'],
          // 分离 Tailwind
          'styles-vendor': ['tailwindcss']
        }
      }
    },
    // 启用压缩
    minify: 'esbuild',
    // 生成 sourcemap 用于分析
    sourcemap: true,
    // 限制 chunk 大小
    chunkSizeWarningLimit: 500
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    include: ['d3', 'svelte'],
    exclude: ['@sveltejs/kit']
  }
});
```

**预期效果**:
- 更好的缓存命中率
- 并行加载提升 30%
- 长期缓存优化

---

#### 1.3 优化 CSS ⭐⭐⭐⭐

**修改 tailwind.config.js**:

```javascript
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  // 启用 CSS 变量优化
  experimental: {
    optimizeUniversalDefaults: true
  },
  theme: {
    extend: {
      // 保持现有配置
    }
  },
  // 移除未使用的 CSS
  plugins: []
};
```

**修改 postcss.config.js**:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // 添加 CSSNano 压缩
    cssnano: process.env.NODE_ENV === 'production' ? {} : false
  }
};
```

**安装依赖**:
```bash
npm install -D cssnano cssnano-preset-advanced
```

**预期效果**:
- CSS 体积: 50KB → 25KB (-50%)
- 解析时间减少 40%

---

#### 1.4 优化 API 加载策略 ⭐⭐⭐⭐⭐

**修改 src/lib/api/news.ts**:

```typescript
// 优化：分组并行加载，减少总延迟
export async function fetchAllNews(): Promise<Record<NewsCategory, NewsItem[]>> {
  const result = createEmptyNewsResult();
  
  // 将 6 个类别分为 2 组，每组内并行
  const group1 = ['politics', 'tech', 'finance'];
  const group2 = ['gov', 'ai', 'intel'];
  
  // 第一组并行加载
  const [politics, tech, finance] = await Promise.all([
    fetchCategoryNews('politics'),
    fetchCategoryNews('tech'),
    fetchCategoryNews('finance')
  ]);
  
  result.politics = politics;
  result.tech = tech;
  result.finance = finance;
  
  // 短暂延迟后加载第二组
  await delay(800);
  
  const [gov, ai, intel] = await Promise.all([
    fetchCategoryNews('gov'),
    fetchCategoryNews('ai'),
    fetchCategoryNews('intel')
  ]);
  
  result.gov = gov;
  result.ai = ai;
  result.intel = intel;
  
  return result;
}
```

**预期效果**:
- 新闻加载时间：3.5s → 1.5s (-57%)
- 首屏数据展示更快

---

### 阶段二：中级优化 (预期提升 20-30%)

#### 2.1 添加 Service Worker ⭐⭐⭐⭐

**创建 src/service-worker.ts**:

```typescript
/// <reference types="@sveltejs/kit" />

const CACHE_NAME = `app-cache-v${__VERSION__}`;
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  // 缓存关键资源
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // 静态资源：Cache First
  if (event.request.url.match(/\.(js|css|png|jpg|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      })
    );
  }
  
  // API 请求：Stale While Revalidate
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open('api-cache').then((cache) => {
        return cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        });
      })
    );
  }
});
```

**预期效果**:
- 重复访问加载时间减少 70%
- 离线可用性
- 减少服务器请求

---

#### 2.2 优化图片资源 ⭐⭐⭐

**添加响应式 favicon**:

```html
<!-- src/app.html -->
<head>
  <!-- 现有 favicon -->
  <link rel="icon" href="%sveltekit.assets%/favicon.ico" />
  
  <!-- 添加现代格式 -->
  <link rel="icon" type="image/png" sizes="32x32" href="%sveltekit.assets%/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="%sveltekit.assets%/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="%sveltekit.assets%/apple-touch-icon.png" />
  
  <!-- PWA manifest -->
  <link rel="manifest" href="%sveltekit.assets%/manifest.json" />
</head>
```

**创建 static/manifest.json**:

```json
{
  "name": "Situation Monitor",
  "short_name": "SitMon",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#0a0a0f",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

#### 2.3 字体优化 ⭐⭐⭐

**修改 src/app.html**:

```html
<head>
  <!-- 预加载关键字体 -->
  <link 
    rel="preload" 
    href="/fonts/inter-var.woff2" 
    as="font" 
    type="font/woff2" 
    crossorigin
  />
  
  <!-- 使用 font-display: swap -->
  <style>
    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter-var.woff2') format('woff2');
      font-display: swap;
      font-weight: 100 900;
    }
  </style>
</head>
```

**预期效果**:
- 消除 FOUT/FOIT
- 提升文本渲染速度 200-300ms

---

#### 2.4 优化缓存策略 ⭐⭐⭐⭐

**增强 SmartCache**:

```typescript
// src/lib/services/smart-cache.ts - 添加内存管理
export class SmartCache {
  private maxSize: number = 100; // 最大缓存条目数
  private maxMemoryMB: number = 10; // 最大内存使用
  
  // 添加 LRU 淘汰机制
  private enforceLimits(): void {
    // 检查条目数
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      // 删除最少使用的条目
      const toDelete = entries.slice(0, entries.length - this.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
    
    // 检查内存使用
    const stats = this.getStats();
    if (stats.memoryUsage > this.maxMemoryMB * 1024 * 1024) {
      this.gc();
    }
  }
}
```

---

### 阶段三：高级优化 (预期提升 10-15%)

#### 3.1 添加构建分析 ⭐⭐⭐

**修改 package.json**:

```json
{
  "scripts": {
    "build:analyze": "npm run build && npx vite-bundle-visualizer"
  }
}
```

**安装依赖**:
```bash
npm install -D vite-bundle-visualizer
```

**使用方式**:
```bash
npm run build:analyze
```

---

#### 3.2 优化 Tailwind CSS 生成 ⭐⭐⭐

**添加 PurgeCSS 配置**:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  // 优化 CSS 生成
  future: {
    purgeLayersByDefault: true,
  },
  // 自定义提取器
  experimental: {
    optimizeUniversalDefaults: true
  }
};
```

---

#### 3.3 预连接优化 ⭐⭐

**修改 src/app.html**:

```html
<head>
  <!-- 已有预连接 -->
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="preconnect" href="https://api.open-meteo.com" crossorigin>
  
  <!-- 添加 DNS 预取 -->
  <link rel="dns-prefetch" href="https://fonts.googleapis.com">
  <link rel="dns-prefetch" href="https://fonts.gstatic.com">
  
  <!-- 预加载关键资源 -->
  <link rel="modulepreload" href="/_app/immutable/entry/start.xxxxx.js" />
</head>
```

---

## 📋 实施步骤与优先级

### 第一周：关键优化 (P0)

| 任务 | 优先级 | 预期工时 | 负责人 |
|------|--------|----------|--------|
| 1. 代码分割与懒加载 | P0 | 4h | 开发团队 |
| 2. 优化 Vite 构建配置 | P0 | 2h | 开发团队 |
| 3. 优化 API 加载策略 | P0 | 3h | 开发团队 |
| 4. 压缩 CSS | P0 | 1h | 开发团队 |

**预期总提升**: 40-50% 性能提升

### 第二周：中级优化 (P1)

| 任务 | 优先级 | 预期工时 | 负责人 |
|------|--------|----------|--------|
| 5. 添加 Service Worker | P1 | 6h | 开发团队 |
| 6. 优化图片资源 | P1 | 2h | 设计团队 |
| 7. 字体优化 | P1 | 2h | 开发团队 |
| 8. 增强缓存策略 | P1 | 3h | 开发团队 |

**预期总提升**: 20-30% 性能提升

### 第三周：高级优化 (P2)

| 任务 | 优先级 | 预期工时 | 负责人 |
|------|--------|----------|--------|
| 9. 添加构建分析 | P2 | 2h | 开发团队 |
| 10. 优化 Tailwind 生成 | P2 | 2h | 开发团队 |
| 11. 预连接优化 | P2 | 1h | 开发团队 |
| 12. 性能监控设置 | P2 | 3h | 开发团队 |

**预期总提升**: 10-15% 性能提升

---

## 📊 预期性能指标对比

| 指标 | 优化前 | 优化后 (目标) | 提升幅度 |
|------|--------|--------------|----------|
| **LCP** | 4.0s | 1.8s | -55% |
| **FCP** | 2.5s | 0.9s | -64% |
| **CLS** | 0.20 | 0.05 | -75% |
| **FID** | 180ms | 60ms | -67% |
| **TTI** | 5.0s | 2.2s | -56% |
| **Bundle 体积** | 600KB | 180KB | -70% |
| **首屏时间** | 3.5s | 1.2s | -66% |

---

## ✅ 验证方法

### 1. Lighthouse 测试

```bash
# 安装 Lighthouse CLI
npm install -g lighthouse

# 运行测试
lighthouse http://localhost:4173 --view --output=html --output-path=./lighthouse-report.html
```

### 2. WebPageTest

访问 https://www.webpagetest.org 进行多地点测试

### 3. Chrome DevTools

- **Performance 面板**: 记录加载性能
- **Lighthouse 面板**: 生成性能报告
- **Network 面板**: 分析资源加载

### 4. 核心 Web 指标监控

```javascript
// 添加性能监控代码
import { onLCP, onFID, onCLS } from 'web-vitals';

onLCP(console.log);
onFID(console.log);
onCLS(console.log);
```

---

## 🔧 工具与依赖

### 需要安装的依赖

```bash
# CSS 优化
npm install -D cssnano cssnano-preset-advanced

# 性能监控
npm install web-vitals

# 构建分析
npm install -D vite-bundle-visualizer

# Service Worker
npm install -D @sveltejs/adapter-static
```

---

## 📝 风险与注意事项

### 1. 代码分割风险
- **风险**: 懒加载可能导致短暂空白
- **缓解**: 添加 SkeletonLoader 占位

### 2. 缓存策略风险
- **风险**: 过度缓存导致数据陈旧
- **缓解**: 实现版本控制和强制刷新

### 3. Service Worker 风险
- **风险**: 缓存更新延迟
- **缓解**: 实现 SW 自动更新机制

---

## 🎯 成功标准

### 性能指标达标
- ✅ LCP < 2.5s
- ✅ FCP < 1.0s
- ✅ CLS < 0.1
- ✅ FID < 100ms

### Lighthouse 评分
- ✅ Performance ≥ 90
- ✅ Best Practices ≥ 90
- ✅ SEO ≥ 90
- ✅ PWA ≥ 80

### 用户体验
- ✅ 首屏内容 1.5s 内可见
- ✅ 3s 内可交互
- ✅ 滚动流畅无卡顿

---

## 📚 参考资源

1. [SvelteKit Performance Best Practices](https://kit.svelte.dev/docs/performance)
2. [Vite Build Optimization](https://vitejs.dev/guide/build.html)
3. [Web Vitals](https://web.dev/vitals/)
4. [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/overview/)
5. [Tailwind CSS Optimization](https://tailwindcss.com/docs/optimization)

---

**文档版本**: 1.0  
**创建日期**: 2026-03-02  
**最后更新**: 2026-03-02  
**负责人**: 开发团队
