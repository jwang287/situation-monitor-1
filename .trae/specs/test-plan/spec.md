# 态势监控平台测试方案

## 1. 测试概述

### 1.1 测试目标
- 确保所有功能模块按预期工作
- 验证数据流的正确性
- 保证UI/UX的一致性
- 确保代码质量和可维护性

### 1.2 测试范围
| 类型 | 范围 | 工具 |
|------|------|------|
| 单元测试 | 服务层、Store、工具函数、分析引擎 | Vitest |
| 集成测试 | API模块、组件交互 | Vitest + jsdom |
| E2E测试 | 完整用户流程 | Playwright |

### 1.3 测试环境
- **Node.js**: 18+
- **浏览器**: Chromium (Playwright)
- **环境**: jsdom (单元测试)

---

## 2. 单元测试方案

### 2.1 服务层测试

#### 2.1.1 CacheManager
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 基本操作 | set/get 数据存取 | P0 |
| TTL机制 | 数据过期、stale状态 | P0 |
| LRU淘汰 | 内存容量限制、自动淘汰 | P1 |
| 批量操作 | invalidate、clear | P1 |
| 统计信息 | getStats 正确性 | P2 |

#### 2.1.2 TranslationService
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 基础翻译 | 英文→中文翻译 | P0 |
| 缓存机制 | 重复翻译使用缓存 | P0 |
| 错误处理 | API失败返回原文 | P0 |
| 重试机制 | 失败重试3次 | P1 |
| 批量翻译 | translateBatch | P1 |
| 并发去重 | 相同文本并发请求只调用一次API | P1 |
| 语言检测 | 中文文本跳过翻译 | P1 |
| 特殊字符 | URL编码正确处理 | P2 |

#### 2.1.3 CircuitBreaker
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 状态转换 | CLOSED → OPEN → HALF_OPEN | P0 |
| 失败阈值 | 达到阈值后熔断 | P0 |
| 恢复机制 | 超时后自动恢复 | P1 |
| 成功重置 | 成功调用后重置计数 | P1 |

#### 2.1.4 RequestDeduplicator
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 请求去重 | 相同并发请求合并 | P0 |
| 不同请求 | 不同请求正常处理 | P0 |
| 清理机制 | 完成后清理pending请求 | P1 |

### 2.2 Store测试

#### 2.2.1 Settings Store
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 默认值 | 所有面板默认启用 | P0 |
| 面板开关 | togglePanel 正确性 | P0 |
| 持久化 | localStorage 读写 | P0 |
| 排序 | updateOrder、movePanel | P1 |
| 尺寸 | updateSize | P1 |
| 重置 | reset 恢复默认 | P1 |
| 翻译设置 | 开关、提供商、API Key | P1 |
| 新闻地区 | china/international 切换 | P1 |
| 派生状态 | enabledPanels、disabledPanels | P2 |

#### 2.2.2 News Store
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 初始状态 | 所有分类为空数组 | P0 |
| 设置数据 | setItems 更新数据 | P0 |
| 追加数据 | appendItems 去重追加 | P0 |
| 警报检测 | isAlert、alertKeyword | P0 |
| 加载状态 | setLoading | P1 |
| 错误状态 | setError | P1 |
| 获取全部 | getAllItems | P1 |
| 派生警报 | alerts 派生store | P1 |
| 清空 | clearAll | P2 |

#### 2.2.3 Markets Store
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 初始状态 | 空数组 | P0 |
| 设置数据 | setMarkets | P0 |
| 加载状态 | setLoading | P1 |
| 错误状态 | setError | P1 |

#### 2.2.4 Monitors Store
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| CRUD | 增删改查监控项 | P0 |
| 持久化 | localStorage 存储 | P0 |
| 匹配计数 | matchCount 更新 | P1 |
| 关键词匹配 | 新闻匹配逻辑 | P1 |

#### 2.2.5 Refresh Store
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 刷新触发 | triggerRefresh | P0 |
| 阶段管理 | 3阶段刷新流程 | P0 |
| 状态跟踪 | isRefreshing、stage | P1 |
| 错误处理 | 单阶段失败不影响其他 | P1 |

### 2.3 分析引擎测试

#### 2.3.1 Correlation Analysis
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 主题检测 | 从新闻中提取主题 | P0 |
| 关联识别 | 跨新闻关联检测 | P0 |
| 动量计算 | rising/stable/falling | P1 |
| 情感分析 | positive/neutral/negative | P1 |

#### 2.3.2 Narrative Tracking
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 叙事提取 | 从新闻识别叙事 | P0 |
| 演进追踪 | emerging/established/fading | P0 |
| 时间统计 | firstSeen、lastSeen | P1 |

#### 2.3.3 Main Character Detection
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 实体提取 | 识别人名、组织名 | P0 |
| 提及统计 | mentions 计数 | P0 |
| 多源统计 | sources 聚合 | P1 |
| 情感分析 | sentiment 计算 | P1 |

### 2.4 API模块测试

#### 2.4.1 News API
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| GDELT获取 | fetchInternationalNews | P0 |
| RSS获取 | fetchChinaNews | P0 |
| 地区切换 | 根据settings选择API | P0 |
| RSS解析 | parseRssItems | P1 |
| 错误处理 | 网络错误、解析错误 | P1 |
| 数据转换 | transformGdeltArticle | P1 |

#### 2.4.2 Markets API
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 股票数据 | fetchMarketData | P0 |
| 加密货币 | fetchCryptoData | P0 |
| 大宗商品 | fetchCommodities | P1 |
| 错误处理 | API失败处理 | P1 |

---

## 3. 集成测试方案

### 3.1 组件集成测试

#### 3.1.1 NewsItem + BilingualText
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 渲染 | 正确显示新闻标题 | P0 |
| 翻译集成 | 启用翻译时显示双语 | P0 |
| 警报样式 | isAlert时显示红色边框 | P0 |
| 元信息 | 时间、地区显示 | P1 |

#### 3.1.2 NewsPanel + News Store
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 数据绑定 | store更新时UI更新 | P0 |
| 加载状态 | loading时显示loading | P0 |
| 错误状态 | error时显示错误信息 | P0 |
| 空状态 | 无数据时显示空提示 | P1 |

#### 3.1.3 SettingsModal + Settings Store
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 面板开关 | 切换后store更新 | P0 |
| 翻译设置 | 修改后持久化 | P0 |
| 新闻地区 | 切换后触发刷新 | P0 |
| API Key | 输入后加密存储 | P1 |

### 3.2 数据流集成测试

#### 3.2.1 刷新流程
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 触发刷新 | refreshStore触发 | P0 |
| 阶段执行 | 3阶段顺序执行 | P0 |
| 数据更新 | 各store数据更新 | P0 |
| 错误隔离 | 单阶段失败不影响其他 | P1 |

#### 3.2.2 翻译流程
| 测试场景 | 测试点 | 优先级 |
|----------|--------|--------|
| 启用翻译 | settings.enableTranslation变化 | P0 |
| 翻译触发 | 新闻渲染时触发翻译 | P0 |
| 缓存使用 | 重复内容使用缓存 | P1 |
| 降级处理 | API失败显示原文 | P1 |

---

## 4. E2E测试方案

### 4.1 核心用户流程

#### 4.1.1 页面加载
| 测试场景 | 测试步骤 | 预期结果 |
|----------|----------|----------|
| 首页加载 | 1. 访问首页 | 页面标题正确 |
| | 2. 等待加载完成 | 核心面板可见 |
| | 3. 检查Phase指示器 | Phase 0 Complete显示 |

#### 4.1.2 面板交互
| 测试场景 | 测试步骤 | 预期结果 |
|----------|----------|----------|
| 打开设置 | 1. 点击设置按钮 | 设置弹窗打开 |
| 开关面板 | 2. 关闭某个面板 | 面板从页面消失 |
| | 3. 重新打开 | 面板重新显示 |
| 拖拽排序 | 4. 拖拽面板 | 面板顺序改变 |

#### 4.1.3 翻译功能
| 测试场景 | 测试步骤 | 预期结果 |
|----------|----------|----------|
| 启用翻译 | 1. 打开设置 | 设置弹窗显示 |
| | 2. 启用翻译开关 | 开关变为开启状态 |
| | 3. 关闭设置 | 新闻显示双语 |
| 切换提供商 | 4. 选择不同提供商 | 提供商切换成功 |

#### 4.1.4 新闻地区切换
| 测试场景 | 测试步骤 | 预期结果 |
|----------|----------|----------|
| 切换到国内 | 1. 打开设置 | 设置弹窗显示 |
| | 2. 选择"中国新闻" | 地区切换成功 |
| | 3. 关闭设置 | 新闻内容变为中文 |
| 切换回国际 | 4. 选择"国际新闻" | 恢复英文新闻 |

#### 4.1.5 自定义监控
| 测试场景 | 测试步骤 | 预期结果 |
|----------|----------|----------|
| 创建监控 | 1. 打开监控面板 | 监控面板显示 |
| | 2. 点击添加 | 创建弹窗打开 |
| | 3. 输入关键词 | 监控创建成功 |
| | 4. 查看匹配 | 匹配新闻高亮 |

### 4.2 错误处理测试

#### 4.2.1 网络错误
| 测试场景 | 测试步骤 | 预期结果 |
|----------|----------|----------|
| API失败 | 1. 模拟网络错误 | 显示错误提示 |
| | 2. 检查UI | 不崩溃，可继续操作 |

#### 4.2.2 数据错误
| 测试场景 | 测试步骤 | 预期结果 |
|----------|----------|----------|
| 无效数据 | 1. API返回无效数据 | 优雅处理 |
| | 2. 检查UI | 显示空状态或错误 |

---

## 5. 测试数据管理

### 5.1 Mock数据
```typescript
// src/lib/data/mock.ts
export const mockNewsData = {
  politics: [/* ... */],
  tech: [/* ... */],
  // ...
};

export const mockMarketsData = [/* ... */];
export const mockCryptoData = [/* ... */];
```

### 5.2 测试夹具 (Fixtures)
```typescript
// tests/fixtures/news.ts
export const createMockNewsItem = (overrides = {}) => ({
  id: 'test-1',
  title: 'Test News',
  source: 'Test Source',
  link: 'https://test.com',
  timestamp: Date.now(),
  category: 'politics',
  ...overrides
});
```

---

## 6. 测试执行策略

### 6.1 本地开发
```bash
# 单元测试（watch模式）
npm run test

# 单元测试（单次）
npm run test:unit

# E2E测试
npm run test:e2e
```

### 6.2 CI/CD
```bash
# 类型检查
npm run check

# 单元测试
npm run test:unit

# 构建
npm run build

# E2E测试（在预览服务器上）
npm run preview &
npm run test:e2e
```

### 6.3 测试覆盖率目标
| 模块 | 目标覆盖率 |
|------|------------|
| 服务层 | 90%+ |
| Store | 85%+ |
| 分析引擎 | 80%+ |
| API模块 | 75%+ |
| 组件 | 70%+ |

---

## 7. 测试维护

### 7.1 测试命名规范
- 单元测试: `*.test.ts`
- E2E测试: `*.spec.ts`
- 描述格式: `should [expected behavior] when [condition]`

### 7.2 测试组织
```
tests/
├── unit/                    # 单元测试（可选，也可放src目录）
├── integration/             # 集成测试
├── e2e/
│   ├── app.spec.ts         # 核心流程
│   ├── settings.spec.ts    # 设置功能
│   ├── news.spec.ts        # 新闻功能
│   └── translation.spec.ts # 翻译功能
└── fixtures/               # 测试数据
```

### 7.3 测试更新策略
- 功能变更时同步更新测试
- 新增功能必须包含测试
- 定期审查测试有效性
