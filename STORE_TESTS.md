# 存储模块单元测试用例

## 1. 市场存储 (markets.ts)

### 1.1 markets 存储

**测试场景 1: 初始化**
- **操作**: 创建 markets 存储实例
- **预期**: 存储状态正确初始化，所有类别为空，initialized 为 false

**测试场景 2: init 方法**
- **操作**: 调用 init() 方法
- **预期**: initialized 变为 true

**测试场景 3: setLoading 方法**
- **操作**: 调用 setLoading('indices', true)
- **预期**: indices.loading 变为 true，error 变为 null

**测试场景 4: setError 方法**
- **操作**: 调用 setError('indices', 'Test error')
- **预期**: indices.error 变为 'Test error'，loading 变为 false

**测试场景 5: setIndices 方法**
- **操作**: 调用 setIndices() 方法，传入市场项目数组
- **预期**: 
  - indices.items 被设置为传入的数组
  - loading 变为 false
  - error 变为 null
  - lastUpdated 被设置为当前时间

**测试场景 6: setSectors 方法**
- **操作**: 调用 setSectors() 方法，传入行业表现数组
- **预期**: 
  - sectors.items 被设置为传入的数组
  - loading 变为 false
  - error 变为 null
  - lastUpdated 被设置为当前时间

**测试场景 7: setCommodities 方法**
- **操作**: 调用 setCommodities() 方法，传入商品项目数组
- **预期**: 
  - commodities.items 被设置为传入的数组
  - loading 变为 false
  - error 变为 null
  - lastUpdated 被设置为当前时间

**测试场景 8: setCrypto 方法**
- **操作**: 调用 setCrypto() 方法，传入加密货币项目数组
- **预期**: 
  - crypto.items 被设置为传入的数组
  - loading 变为 false
  - error 变为 null
  - lastUpdated 被设置为当前时间

**测试场景 9: updateItem 方法**
- **操作**: 
  1. 先设置 indices 数据
  2. 调用 updateItem('indices', 'AAPL', { price: 150 })
- **预期**: 
  - 对应 symbol 的项目被更新
  - 其他项目保持不变

**测试场景 10: updateCrypto 方法**
- **操作**: 
  1. 先设置 crypto 数据
  2. 调用 updateCrypto('bitcoin', { price: 50000 })
- **预期**: 
  - 对应 id 的项目被更新
  - 其他项目保持不变

**测试场景 11: getSummary 方法**
- **操作**: 
  1. 设置各种市场数据
  2. 调用 getSummary() 方法
- **预期**: 
  - 返回正确的市场趋势
  - 返回正确的涨幅最大和跌幅最大的项目

**测试场景 12: isAnyLoading 方法**
- **操作**: 
  1. 调用 setLoading() 方法设置某个类别为 loading
  2. 调用 isAnyLoading() 方法
- **预期**: 
  - 返回 true

**测试场景 13: clearAll 方法**
- **操作**: 
  1. 设置各种市场数据
  2. 调用 clearAll() 方法
- **预期**: 
  - 所有类别数据被清空
  - 状态重置为初始状态

### 1.2 派生存储

**测试场景 1: indices 派生存储**
- **操作**: 设置 indices 数据
- **预期**: indices 派生存储返回正确的 indices 数据

**测试场景 2: sectors 派生存储**
- **操作**: 设置 sectors 数据
- **预期**: sectors 派生存储返回正确的 sectors 数据

**测试场景 3: commodities 派生存储**
- **操作**: 设置 commodities 数据
- **预期**: commodities 派生存储返回正确的 commodities 数据

**测试场景 4: crypto 派生存储**
- **操作**: 设置 crypto 数据
- **预期**: crypto 派生存储返回正确的 crypto 数据

**测试场景 5: isMarketsLoading 派生存储**
- **操作**: 设置某个类别为 loading
- **预期**: isMarketsLoading 派生存储返回 true

**测试场景 6: marketsLastUpdated 派生存储**
- **操作**: 设置多个类别的数据
- **预期**: marketsLastUpdated 派生存储返回最新的更新时间

**测试场景 7: vix 派生存储**
- **操作**: 设置包含 VIX 的 commodities 数据
- **预期**: vix 派生存储返回 VIX 数据

## 2. 新闻存储 (news.ts)

### 2.1 news 存储

**测试场景 1: 初始化**
- **操作**: 创建 news 存储实例
- **预期**: 存储状态正确初始化，所有类别为空，initialized 为 false

**测试场景 2: init 方法**
- **操作**: 调用 init() 方法
- **预期**: initialized 变为 true

**测试场景 3: setLoading 方法**
- **操作**: 调用 setLoading('politics', true)
- **预期**: politics.loading 变为 true，error 变为 null

**测试场景 4: setError 方法**
- **操作**: 调用 setError('politics', 'Test error')
- **预期**: politics.error 变为 'Test error'，loading 变为 false

**测试场景 5: setItems 方法**
- **操作**: 调用 setItems('politics', newsItems)
- **预期**: 
  - politics.items 被设置为传入的数组（经过丰富处理）
  - loading 变为 false
  - error 变为 null
  - lastUpdated 被设置为当前时间

**测试场景 6: appendItems 方法**
- **操作**: 
  1. 先设置 politics 数据
  2. 调用 appendItems('politics', newNewsItems)
- **预期**: 
  - 新的新闻项目被添加到现有项目中
  - 重复的项目被过滤掉
  - lastUpdated 被更新

**测试场景 7: getItems 方法**
- **操作**: 
  1. 设置 politics 数据
  2. 调用 getItems('politics')
- **预期**: 返回 politics 类别的新闻项目

**测试场景 8: getAllItems 方法**
- **操作**: 
  1. 设置多个类别的新闻数据
  2. 调用 getAllItems()
- **预期**: 返回所有类别的新闻项目

**测试场景 9: getAlertItems 方法**
- **操作**: 
  1. 设置包含警报关键词的新闻数据
  2. 调用 getAlertItems()
- **预期**: 返回所有包含警报关键词的新闻项目，按时间戳降序排序

**测试场景 10: clearCategory 方法**
- **操作**: 
  1. 设置 politics 数据
  2. 调用 clearCategory('politics')
- **预期**: politics 类别数据被清空

**测试场景 11: clearAll 方法**
- **操作**: 
  1. 设置多个类别的新闻数据
  2. 调用 clearAll()
- **预期**: 所有类别数据被清空，状态重置为初始状态

**测试场景 12: isAnyLoading 方法**
- **操作**: 
  1. 调用 setLoading() 方法设置某个类别为 loading
  2. 调用 isAnyLoading() 方法
- **预期**: 返回 true

### 2.2 派生存储

**测试场景 1: politicsNews 派生存储**
- **操作**: 设置 politics 数据
- **预期**: politicsNews 派生存储返回正确的 politics 数据

**测试场景 2: techNews 派生存储**
- **操作**: 设置 tech 数据
- **预期**: techNews 派生存储返回正确的 tech 数据

**测试场景 3: financeNews 派生存储**
- **操作**: 设置 finance 数据
- **预期**: financeNews 派生存储返回正确的 finance 数据

**测试场景 4: govNews 派生存储**
- **操作**: 设置 gov 数据
- **预期**: govNews 派生存储返回正确的 gov 数据

**测试场景 5: aiNews 派生存储**
- **操作**: 设置 ai 数据
- **预期**: aiNews 派生存储返回正确的 ai 数据

**测试场景 6: intelNews 派生存储**
- **操作**: 设置 intel 数据
- **预期**: intelNews 派生存储返回正确的 intel 数据

**测试场景 7: allNewsItems 派生存储**
- **操作**: 设置多个类别的新闻数据
- **预期**: allNewsItems 派生存储返回所有类别的新闻项目

**测试场景 8: alerts 派生存储**
- **操作**: 设置包含警报关键词的新闻数据
- **预期**: alerts 派生存储返回所有包含警报关键词的新闻项目，按时间戳降序排序

**测试场景 9: isLoading 派生存储**
- **操作**: 设置某个类别为 loading
- **预期**: isLoading 派生存储返回 true

**测试场景 10: hasErrors 派生存储**
- **操作**: 设置某个类别为 error
- **预期**: hasErrors 派生存储返回 true

## 3. 监控存储 (monitors.ts)

### 3.1 monitors 存储

**测试场景 1: 初始化**
- **操作**: 创建 monitors 存储实例
- **预期**: 存储状态正确初始化，monitors 为空数组

**测试场景 2: addMonitor 方法**
- **操作**: 调用 addMonitor() 方法，传入监控配置
- **预期**: 监控被添加到 monitors 数组中

**测试场景 3: updateMonitor 方法**
- **操作**: 
  1. 先添加监控
  2. 调用 updateMonitor() 方法更新监控
- **预期**: 监控被正确更新

**测试场景 4: deleteMonitor 方法**
- **操作**: 
  1. 先添加监控
  2. 调用 deleteMonitor() 方法删除监控
- **预期**: 监控被从 monitors 数组中删除

**测试场景 5: toggleMonitor 方法**
- **操作**: 
  1. 先添加监控
  2. 调用 toggleMonitor() 方法切换监控状态
- **预期**: 监控的 enabled 状态被切换

**测试场景 6: checkMatches 方法**
- **操作**: 
  1. 添加监控
  2. 调用 checkMatches() 方法，传入新闻项目
- **预期**: 匹配的监控被正确识别

**测试场景 7: clearMatches 方法**
- **操作**: 
  1. 先生成匹配
  2. 调用 clearMatches() 方法
- **预期**: matches 被清空

**测试场景 8: exportMonitors 方法**
- **操作**: 调用 exportMonitors() 方法
- **预期**: 返回监控配置的 JSON 字符串

**测试场景 9: importMonitors 方法**
- **操作**: 调用 importMonitors() 方法，传入监控配置的 JSON 字符串
- **预期**: 监控被正确导入

## 4. 设置存储 (settings.ts)

### 4.1 settings 存储

**测试场景 1: 初始化**
- **操作**: 创建 settings 存储实例
- **预期**: 存储状态正确初始化，使用默认设置

**测试场景 2: updateSetting 方法**
- **操作**: 调用 updateSetting() 方法更新设置
- **预期**: 设置被正确更新

**测试场景 3: updateMultiple 方法**
- **操作**: 调用 updateMultiple() 方法同时更新多个设置
- **预期**: 所有设置被正确更新

**测试场景 4: resetToDefaults 方法**
- **操作**: 调用 resetToDefaults() 方法
- **预期**: 设置被重置为默认值

**测试场景 5: applyPreset 方法**
- **操作**: 调用 applyPreset() 方法，传入预设 ID
- **预期**: 预设设置被应用

**测试场景 6: isOnboardingComplete 方法**
- **操作**: 调用 isOnboardingComplete() 方法
- **预期**: 返回正确的引导完成状态

**测试场景 7: completeOnboarding 方法**
- **操作**: 调用 completeOnboarding() 方法
- **预期**: 引导状态被标记为完成

**测试场景 8: resetOnboarding 方法**
- **操作**: 调用 resetOnboarding() 方法
- **预期**: 引导状态被重置

## 5. 刷新存储 (refresh.ts)

### 5.1 refresh 存储

**测试场景 1: 初始化**
- **操作**: 创建 refresh 存储实例
- **预期**: 存储状态正确初始化，isRefreshing 为 false

**测试场景 2: startRefresh 方法**
- **操作**: 调用 startRefresh() 方法
- **预期**: isRefreshing 变为 true

**测试场景 3: endRefresh 方法**
- **操作**: 调用 endRefresh() 方法
- **预期**: 
  - isRefreshing 变为 false
  - lastRefresh 被设置为当前时间
  - errors 被设置为传入的错误（如果有）

**测试场景 4: setupAutoRefresh 方法**
- **操作**: 调用 setupAutoRefresh() 方法，传入刷新函数
- **预期**: 自动刷新被设置

**测试场景 5: stopAutoRefresh 方法**
- **操作**: 
  1. 先设置自动刷新
  2. 调用 stopAutoRefresh() 方法
- **预期**: 自动刷新被停止

**测试场景 6: getTimeSinceLastRefresh 方法**
- **操作**: 
  1. 先执行刷新
  2. 调用 getTimeSinceLastRefresh() 方法
- **预期**: 返回自上次刷新以来的时间
