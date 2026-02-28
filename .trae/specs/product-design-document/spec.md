# 态势监控平台 (Situation Monitor) 产品设计文档

## 1. 产品概述

### 1.1 产品定位
态势监控平台是一个实时情报聚合与分析仪表板，专为关注全球政治、经济、科技动态的用户设计。平台通过聚合多源数据（新闻、市场、地缘政治等），提供一站式态势感知能力。

### 1.2 核心价值
- **实时性**: 多源数据实时聚合，第一时间掌握全球动态
- **全面性**: 覆盖政治、经济、科技、军事等多维度信息
- **智能分析**: 关联分析、舆情追踪、主角识别等AI辅助功能
- **可定制**: 用户可自定义面板、监控关键词、新闻来源

### 1.3 目标用户
- 金融从业者（需要全球宏观信息）
- 政策研究人员
- 国际事务关注者
- 科技行业从业者

---

## 2. 技术架构

### 2.1 技术栈
| 层级 | 技术 |
|------|------|
| 前端框架 | SvelteKit 2.0 + Svelte 5 (Runes) |
| 语言 | TypeScript (Strict Mode) |
| 样式 | Tailwind CSS + 自定义暗色主题 |
| 测试 | Vitest (单元) + Playwright (E2E) |
| 部署 | GitHub Pages (静态站点) |

### 2.2 核心架构模式

#### 2.2.1 服务层 (Service Layer)
所有HTTP请求通过 `ServiceClient` 统一管理，集成以下能力：
- **CacheManager**: 按服务缓存，支持TTL
- **CircuitBreaker**: 熔断机制，防止级联故障
- **RequestDeduplicator**: 请求去重，避免并发重复请求

#### 2.2.2 多级刷新机制 (Multi-Stage Refresh)
数据获取分3个阶段，错开延迟避免并发压力：
| 阶段 | 延迟 | 内容 |
|------|------|------|
| 1 (Critical) | 0ms | 新闻、市场、警报 |
| 2 (Secondary) | 2s | 加密货币、大宗商品、情报 |
| 3 (Tertiary) | 4s | 政府合同、巨鲸监控、裁员、Polymarket |

#### 2.2.3 配置驱动设计 (Configuration-Driven)
- `feeds.ts`: 30+ RSS源，6大类别
- `keywords.ts`: 警报关键词、地区检测、主题检测
- `analysis.ts`: 关联主题、舆情模式、严重级别
- `panels.ts`: 面板注册表
- `map.ts`: 地缘政治热点、冲突区域

---

## 3. 功能模块设计

### 3.1 面板系统 (Panel System)

#### 3.1.1 面板分类
| 优先级 | 面板 | 说明 |
|--------|------|------|
| P1 | 全球地图 | D3.js交互式地图，显示地缘政治热点 |
| P1 | 世界/地缘政治 | 国际政治新闻聚合 |
| P1 | 科技/人工智能 | 科技动态、AI发展 |
| P1 | 财经 | 财经新闻 |
| P1 | 市场 | 股票、指数实时行情 |
| P1 | 我的监控 | 用户自定义关键词监控 |
| P1 | 关联分析 | 跨新闻关联检测 |
| P1 | 舆情追踪 | 叙事演进追踪 |
| P1 | 美联储 | 美联储资产负债表数据 |
| P1 | 世界各国领导人 | 各国领导人动态 |
| P2 | 政府/政策 | 政府政策新闻 |
| P2 | 行业热力图 | 行业ETF表现热力图 |
| P2 | 大宗商品/VIX | 原油、黄金、VIX等 |
| P2 | 加密货币 | CoinGecko API数据 |
| P2 | Polymarket预测 | 预测市场数据 |
| P2 | 主角 | 实体提及频率分析 |
| P2 | 印钞机 | 美联储流动性数据 |
| P2 | 委内瑞拉态势 | 特定地区监控 |
| P2 | 格陵兰态势 | 特定地区监控 |
| P2 | 伊朗态势 | 特定地区监控 |
| P2 | 情报源 | 智库、研究机构报告 |
| P3 | 巨鲸监控 | 大额链上交易 |
| P3 | AI军备竞赛 | AI领域竞争动态 |
| P3 | 裁员追踪 | 企业裁员信息 |
| P3 | 政府合同 | 政府采购合同 |

#### 3.1.2 面板交互
- **拖拽排序**: 支持面板拖拽重新排序（地图面板固定）
- **显示/隐藏**: 设置面板中可开关任意面板
- **尺寸调整**: 支持面板尺寸调整（持久化）

### 3.2 新闻系统 (News System)

#### 3.2.1 新闻分类
- **politics**: 政治/地缘政治
- **tech**: 科技
- **finance**: 财经
- **gov**: 政府/政策
- **ai**: 人工智能
- **intel**: 情报/军事

#### 3.2.2 新闻地区切换
支持国内/国际新闻源切换：

| 地区 | 数据源 | 语言 |
|------|--------|------|
| 国际 | GDELT API | 英文 |
| 中国 | RSS聚合（新浪、腾讯、36氪等） | 中文 |

**国内新闻源配置**:
- 政治: 环球军事、新浪军事、凤凰军事
- 科技: 36氪、科技日报、极客公园
- 财经: 新浪财经、东方财富、凤凰财经
- 政府: 新华网、人民网、中国政府网
- AI: 人工智能网、新智元
- 情报: 参考消息、环球时报

#### 3.2.3 新闻项属性
```typescript
interface NewsItem {
  id: string;           // 唯一ID
  title: string;        // 标题
  link: string;         // 链接
  pubDate?: string;     // 发布时间
  timestamp: number;    // 时间戳
  description?: string; // 描述
  content?: string;     // 内容
  source: string;       // 来源
  category: NewsCategory; // 分类
  isAlert?: boolean;    // 是否警报
  alertKeyword?: string; // 触发警报的关键词
  region?: string;      // 地区
  topics?: string[];    // 主题标签
}
```

### 3.3 翻译系统 (Translation System)

#### 3.3.1 功能概述
支持英文内容自动翻译为中文，采用双语显示模式（英文在上、中文在下）。

#### 3.3.2 翻译提供商
| 提供商 | 需要API Key | 优先级 | 说明 |
|--------|-------------|--------|------|
| 微软翻译 | 是 | 1 | Azure Cognitive Services，每月200万字符免费 |
| 谷歌翻译 | 是 | 2 | Google Cloud Translation，质量最高 |
| LibreTranslate | 否 | 3 | 免费开源，无需API Key |

#### 3.3.3 翻译策略
- **自动选择**: 优先使用有API Key的提供商，失败时自动降级
- **缓存机制**: 7天TTL缓存，避免重复翻译
- **批量处理**: 每批3个请求，批次间200ms延迟
- **错误处理**: 翻译失败时显示原文，不影响用户体验

#### 3.3.4 双语显示组件
```svelte
<BilingualText 
  text={newsItem.title} 
  enableTranslation={$settings.enableTranslation} 
/>
```

显示效果：
- 原文在上（0.75rem，主文本色）
- 分隔线（1px，边框色）
- 译文在下（0.7rem，次要文本色）
- 加载状态显示旋转动画

### 3.4 分析引擎 (Analysis Engine)

#### 3.4.1 关联分析 (Correlation Analysis)
检测跨新闻项的关联模式：
- 基于可配置的正则表达式模式
- 识别同时出现在多个新闻源中的主题
- 动量分析（上升/稳定/下降）
- 情感分析（正面/中性/负面）

#### 3.4.2 舆情追踪 (Narrative Tracking)
追踪叙事的演进过程：
- 从边缘到主流的演进检测
- 提及次数统计
- 首次/最后出现时间
- 趋势判断（新兴/确立/衰退）

#### 3.4.3 主角识别 (Main Character Detection)
识别当前最受关注的实体：
- 实体提及频率计算
- 多源提及统计
- 情感倾向分析

### 3.5 设置系统 (Settings System)

#### 3.5.1 持久化设置
所有用户设置保存到localStorage：
- 面板显示状态
- 面板排序
- 面板尺寸
- 翻译开关
- 翻译提供商
- API Keys
- 新闻地区

#### 3.5.2 预设配置
支持快速应用预设面板配置：
- 标准模式（全部面板）
- 精简模式（核心面板）
- 专注模式（特定主题面板）

---

## 4. 数据流设计

### 4.1 新闻数据流
```
用户打开页面
    ↓
refreshStore 触发多阶段刷新
    ↓
newsStore 调用 fetchCategoryNews()
    ↓
根据 settings.newsRegion 选择数据源
    ↓
国际: GDELT API → 解析JSON → 转换NewsItem
中国: RSS Feeds → 解析XML → 转换NewsItem
    ↓
应用关键词检测（警报、地区、主题）
    ↓
更新 newsStore
    ↓
NewsPanel 自动更新显示
```

### 4.2 翻译数据流
```
NewsItem 渲染
    ↓
BilingualText 组件接收 text 和 enableTranslation
    ↓
检查 enableTranslation
    ↓
启用: 调用 translationService.translate()
    ↓
检查缓存 → 命中直接返回
    ↓
未命中: 调用翻译API（带重试和降级）
    ↓
保存到缓存
    ↓
返回翻译结果
    ↓
双语显示
```

---

## 5. UI/UX 设计

### 5.1 设计原则
- **暗色主题**: 长时间使用不疲劳
- **信息密度**: 单屏展示尽可能多的信息
- **视觉层次**: 通过颜色、大小、间距建立清晰层次
- **即时反馈**: 所有操作有即时的视觉反馈

### 5.2 色彩系统
```css
--accent: #00ff88;          /* 强调色（绿色） */
--accent-rgb: 0, 255, 136;
--danger: #ff4444;          /* 危险/警报（红色） */
--red: #ef4444;
--text-primary: #ffffff;    /* 主文本 */
--text-secondary: #a0a0a0;  /* 次要文本 */
--text-muted: #666666;      /* 辅助文本 */
--border: #333333;          /* 边框 */
--surface: #1a1a1a;         /* 面板背景 */
--surface-hover: #252525;   /* 悬停背景 */
```

### 5.3 布局结构
```
┌─────────────────────────────────────────────────────────────┐
│  Header (标题 + 刷新状态 + 设置按钮)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   全球地图   │  │  地缘政治   │  │   科技      │         │
│  │  (全宽固定)  │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   财经      │  │    市场     │  │  关联分析    │         │
│  │             │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  ...更多面板 ...                                          │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 响应式设计
- 桌面: 3列网格
- 平板: 2列网格
- 移动: 1列堆叠

---

## 6. API 设计

### 6.1 外部API依赖
| API | 用途 | 认证 |
|-----|------|------|
| GDELT | 国际新闻 | 无需 |
| CoinGecko | 加密货币 | 无需 |
| RSS Feeds | 国内新闻 | 无需 |
| 微软翻译 | 翻译 | API Key |
| 谷歌翻译 | 翻译 | API Key |
| LibreTranslate | 翻译 | 无需 |

### 6.2 CORS代理
由于RSS源存在CORS限制，使用Cloudflare Worker作为代理：
```javascript
// 请求通过代理转发
fetchWithProxy(url) → proxy-worker → target-api
```

---

## 7. 测试策略

### 7.1 单元测试
- 位置: 与源码同目录，命名 `*.test.ts`
- 框架: Vitest
- 覆盖: 服务层、工具函数、Store

### 7.2 E2E测试
- 位置: `tests/e2e/*.spec.ts`
- 框架: Playwright
- 场景: 核心用户流程

### 7.3 测试命令
```bash
npm run test:unit    # 单元测试
npm run test:e2e     # E2E测试
npm run test         # 单元测试（watch模式）
```

---

## 8. 部署方案

### 8.1 构建流程
```bash
npm run build        # 构建到 /build 目录
npm run check        # TypeScript类型检查
npm run lint         # ESLint + Prettier检查
```

### 8.2 GitHub Actions 工作流
```yaml
# .github/workflows/deploy.yml
- 触发: push到main分支
- 步骤:
  1. Checkout代码
  2. 安装依赖
  3. 类型检查
  4. 构建（BASE_PATH=/situation-monitor）
  5. 部署到GitHub Pages
```

### 8.3 部署地址
`https://hipcityreg.github.io/situation-monitor/`

---

## 9. 扩展性设计

### 9.1 添加新面板
1. 在 `src/lib/config/panels.ts` 注册面板
2. 创建面板组件 `src/lib/components/panels/NewPanel.svelte`
3. 在 `src/lib/components/panels/index.ts` 导出
4. 在 Dashboard 中添加条件渲染

### 9.2 添加新数据源
1. 在 `src/lib/config/feeds.ts` 添加Feed配置
2. 在 `src/lib/api/` 创建新的API模块
3. 在 `src/lib/stores/` 创建对应的Store
4. 更新刷新调度器

### 9.3 添加新分析功能
1. 在 `src/lib/config/analysis.ts` 添加分析模式
2. 在 `src/lib/analysis/` 实现分析逻辑
3. 创建对应的分析面板

---

## 10. 安全考虑

### 10.1 API Key管理
- 用户API Key仅存储在localStorage
- 从不提交到版本控制
- 输入框使用password类型隐藏

### 10.2 内容安全
- 所有外部链接使用 `rel="noopener noreferrer"`
- RSS内容使用纯文本显示，避免XSS
- 翻译API调用通过代理，不暴露用户IP

---

## 11. 性能优化

### 11.1 加载优化
- 静态站点部署，无需服务器渲染
- 多阶段数据加载，优先显示核心内容
- 图片懒加载（如有）

### 11.2 运行时优化
- 请求去重，避免并发重复请求
- 智能缓存，减少API调用
- 虚拟滚动（新闻列表）

### 11.3 缓存策略
| 数据类型 | 缓存位置 | TTL |
|----------|----------|-----|
| 翻译结果 | localStorage | 7天 |
| API响应 | Memory | 5分钟 |
| 用户设置 | localStorage | 持久 |

---

## 12. 路线图

### 已完成
- [x] 基础面板系统
- [x] 新闻聚合（国际）
- [x] 市场数据
- [x] 关联分析
- [x] 舆情追踪
- [x] 翻译功能
- [x] 国内新闻源

### 计划中
- [ ] 用户账户系统
- [ ] 历史数据存档
- [ ] 移动端App
- [ ] 推送通知
- [ ] 更多数据源集成

---

## 13. 附录

### 13.1 目录结构
```
src/
├── lib/
│   ├── analysis/       # 分析引擎
│   ├── api/            # API客户端
│   ├── components/     # Svelte组件
│   │   ├── common/     # 通用组件
│   │   ├── layout/     # 布局组件
│   │   ├── modals/     # 弹窗组件
│   │   └── panels/     # 面板组件
│   ├── config/         # 配置文件
│   ├── data/           # 模拟数据
│   ├── services/       # 服务层
│   ├── stores/         # Svelte stores
│   ├── types/          # TypeScript类型
│   └── utils/          # 工具函数
├── routes/             # SvelteKit路由
└── app.html            # HTML模板
```

### 13.2 命名规范
- 组件: PascalCase.svelte
- Store: camelCase.ts
- 工具函数: camelCase.ts
- 类型定义: PascalCase (接口/类型)
- 常量: UPPER_SNAKE_CASE

### 13.3 代码风格
- 使用单引号
- 2空格缩进
- 无分号
- 最大行宽100字符
