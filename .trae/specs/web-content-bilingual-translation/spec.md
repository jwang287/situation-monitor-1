# 网页内容双语翻译显示功能 Spec

## Why
用户在浏览网页抓取的内容时，需要同时查看英文原文和中文翻译，以便更好地理解内容。双语显示可以提高信息获取效率，特别是对于需要对照原文的场景。

## What Changes
- 新增双语翻译显示组件，支持英文在上、中文在下的布局
- 集成翻译 API（如 Google Translate、DeepL 或 Azure Translator）
- 在新闻面板、市场数据面板等显示抓取内容的区域应用双语显示
- 添加翻译开关，允许用户启用/禁用翻译功能
- 缓存翻译结果，避免重复请求

## Impact
- Affected specs: 新闻显示、市场数据显示、世界领导人新闻等面板
- Affected code: 
  - `src/lib/components/panels/NewsPanel.svelte`
  - `src/lib/components/panels/MarketsPanel.svelte`
  - `src/lib/components/panels/WorldLeadersPanel.svelte`
  - `src/lib/components/common/NewsItem.svelte`
  - 新增翻译服务和组件

## ADDED Requirements

### Requirement: 双语翻译显示组件
系统 SHALL 提供一个双语翻译显示组件，用于同时显示英文原文和中文翻译。

#### Scenario: 正常显示
- **GIVEN** 用户启用了翻译功能
- **WHEN** 系统显示抓取的新闻或数据内容
- **THEN** 内容应以双语形式呈现：
  - 上方显示英文原文
  - 下方显示中文翻译
  - 两种语言之间有明显的视觉分隔

#### Scenario: 翻译开关
- **GIVEN** 用户在设置面板中
- **WHEN** 用户切换翻译开关
- **THEN** 系统 SHALL 立即应用新的设置，无需刷新页面

### Requirement: 翻译服务集成
系统 SHALL 集成第三方翻译 API，将英文内容翻译成中文。

#### Scenario: 成功翻译
- **GIVEN** 用户查看包含英文内容的页面
- **WHEN** 内容需要翻译时
- **THEN** 系统 SHALL 调用翻译 API 获取中文翻译
- **AND** 将翻译结果缓存，避免重复请求

#### Scenario: 翻译失败处理
- **GIVEN** 翻译 API 调用失败
- **WHEN** 系统无法获取翻译结果
- **THEN** 系统 SHALL 仅显示英文原文
- **AND** 记录错误日志，不中断用户体验

#### Scenario: 翻译缓存
- **GIVEN** 用户多次查看相同内容
- **WHEN** 内容已被翻译过
- **THEN** 系统 SHALL 从缓存中获取翻译结果
- **AND** 不重复调用翻译 API

### Requirement: 翻译设置
系统 SHALL 提供用户设置，控制翻译功能的开关和偏好。

#### Scenario: 启用翻译
- **GIVEN** 用户在设置面板
- **WHEN** 用户启用翻译功能
- **THEN** 所有支持的内容区域 SHALL 显示双语

#### Scenario: 禁用翻译
- **GIVEN** 用户在设置面板
- **WHEN** 用户禁用翻译功能
- **THEN** 所有内容区域 SHALL 仅显示英文原文

## MODIFIED Requirements
无

## REMOVED Requirements
无
