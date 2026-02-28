# 测试方案检查清单

## 测试架构

- [x] Vitest 配置完成
- [x] Playwright 配置完成
- [x] jsdom 环境配置
- [x] 测试命令配置

## 单元测试覆盖

### 服务层
- [x] TranslationService 测试
- [x] CacheManager 测试
- [ ] CircuitBreaker 测试
- [ ] RequestDeduplicator 测试
- [ ] ServiceClient 测试

### Store
- [x] Settings Store 测试
- [x] News Store 测试
- [ ] Markets Store 测试
- [ ] Monitors Store 测试
- [ ] Refresh Store 测试

### 分析引擎
- [x] Correlation Analysis 测试
- [x] Narrative Tracking 测试
- [x] Main Character Detection 测试

### API 模块
- [ ] News API 测试
- [ ] Markets API 测试
- [ ] Leaders API 测试

## 集成测试覆盖

### 组件集成
- [ ] NewsItem + BilingualText
- [ ] NewsPanel + News Store
- [ ] SettingsModal + Settings Store
- [ ] Dashboard + Panel System

### 数据流集成
- [ ] 刷新流程
- [ ] 翻译流程
- [ ] 设置变更流程

## E2E 测试覆盖

### 核心流程
- [ ] 页面加载
- [ ] 面板交互
- [ ] 设置功能

### 功能测试
- [ ] 翻译功能
- [ ] 新闻地区切换
- [ ] 自定义监控

### 错误处理
- [ ] 网络错误
- [ ] API 错误
- [ ] 数据错误

## 测试数据

- [ ] Mock 数据创建
- [ ] 测试夹具创建
- [ ] API Mock 配置

## 测试覆盖率目标

| 模块 | 当前 | 目标 | 状态 |
|------|------|------|------|
| 服务层 | 70% | 90%+ | 🟡 |
| Store | 75% | 85%+ | 🟡 |
| 分析引擎 | 80% | 80%+ | 🟢 |
| API 模块 | 50% | 75%+ | 🔴 |
| 组件 | 40% | 70%+ | 🔴 |

## 测试执行

- [x] 本地测试命令可用
- [x] CI/CD 集成
- [ ] 覆盖率报告
- [ ] 测试报告生成

## 文档

- [x] 测试方案文档
- [x] 测试用例文档
- [x] 任务清单
- [ ] 测试指南
- [ ] 测试最佳实践
