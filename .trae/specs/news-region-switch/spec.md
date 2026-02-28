# 国内/国际新闻切换功能 Spec

## Why
用户需要查看不同地区的新闻内容，目前系统仅支持国际新闻（通过GDELT API获取英文新闻）。需要增加国内新闻支持，让用户可以在国内新闻和国际新闻之间切换。

## What Changes
- 在设置中添加"新闻地区"选项（中国/国际）
- 国内新闻使用国内新闻API源（如新浪、腾讯RSS）
- 国际新闻继续使用GDELT API
- 新闻面板显示当前地区标签

## Impact
- Affected specs: web-content-bilingual-translation
- Affected code:
  - `src/lib/stores/settings.ts` - 添加新闻地区设置
  - `src/lib/api/news.ts` - 根据地区使用不同API
  - `src/lib/config/feeds.ts` - 添加国内新闻源配置

## ADDED Requirements

### Requirement: 新闻地区切换功能
系统应提供国内/国际新闻源切换功能，用户可以选择获取国内新闻或国际新闻。

#### Scenario: 切换到国内新闻
- **WHEN** 用户在设置中选择"中国新闻"
- **THEN** 系统使用国内新闻API源获取新闻
- **AND** 新闻面板显示"中国新闻"标签

#### Scenario: 切换到国际新闻
- **WHEN** 用户在设置中选择"国际新闻"
- **THEN** 系统使用GDELT API获取国际新闻
- **AND** 新闻面板显示"国际新闻"标签

### Requirement: 国内新闻源配置
系统应配置国内新闻源，支持以下类别：
- 政治新闻：新浪军事、环球军事
- 科技新闻：科技日报、36氪
- 财经新闻：新浪财经、东方财富
- AI新闻：人工智能实验室

#### Scenario: 获取国内财经新闻
- **WHEN** 用户选择国内新闻且查看财经类别
- **THEN** 系统从新浪财经RSS获取新闻
- **AND** 返回中文新闻标题和链接

## REMOVED Requirements

### Requirement: 无
当前无需要移除的需求。
