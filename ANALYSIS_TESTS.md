# 分析模块单元测试用例

## 1. 相关性分析 (correlation.ts)

### 1.1 analyzeCorrelations 函数

**测试场景 1: 空新闻输入**
- **输入**: `[]` 或 `null`
- **预期输出**: `null`

**测试场景 2: 检测新兴模式**
- **输入**: 包含多个相关新闻的数组（例如3条关于乌克兰的新闻）
- **预期输出**: 
  - 非 null 结果
  - `emergingPatterns` 数组长度大于0
  - 包含 id 为 'russia-ukraine' 的模式
  - 该模式的 count 大于等于3
  - 该模式的 level 为 'emerging'

**测试场景 3: 正确分类模式级别**
- **输入**: 包含10条关于乌克兰的新闻的数组
- **预期输出**: 
  - 模式级别为 'high'

**测试场景 4: 跟踪跨源相关性**
- **输入**: 来自不同来源的关于关税的新闻
- **预期输出**: 
  - 包含 id 为 'tariffs' 的跨源相关性
  - sourceCount 等于来源数量
  - sources 数组包含所有来源

**测试场景 5: 为高分生成预测信号**
- **输入**: 8条关于关税的新闻
- **预期输出**: 
  - predictiveSignals 数组长度大于0
  - 包含 id 为 'tariffs' 的信号
  - 预测内容包含 'volatility'

**测试场景 6: 为模式收集标题**
- **输入**: 关于加沙冲突的新闻
- **预期输出**: 
  - 模式的 headlines 数组长度大于0
  - 每个标题包含 link 和 source

**测试场景 7: 边界情况 - 单条新闻**
- **输入**: 只包含一条新闻的数组
- **预期输出**: 
  - 不应检测到模式
  - emergingPatterns 数组为空

### 1.2 getCorrelationSummary 函数

**测试场景 1: 空结果输入**
- **输入**: `null`
- **预期输出**: `{ totalSignals: 0, status: 'NO DATA' }`

**测试场景 2: 有信号的结果**
- **输入**: 包含模式的相关性结果
- **预期输出**: 
  - totalSignals 大于0
  - status 包含 'SIGNALS'

### 1.3 clearCorrelationHistory 函数

**测试场景 1: 调用后历史被清除**
- **操作**: 先分析一些新闻，然后调用 clearCorrelationHistory
- **预期**: 历史被重置，后续分析重新开始计数

## 2. 主要人物分析 (main-character.ts)

### 2.1 calculateMainCharacter 函数

**测试场景 1: 空新闻输入**
- **输入**: `[]` 或 `null`
- **预期输出**: `{ characters: [], topCharacter: null }`

**测试场景 2: 计算主要人物**
- **输入**: 包含多次提到同一人物的新闻
- **预期输出**: 
  - characters 数组按提及次数排序
  - topCharacter 是提及次数最多的人物

**测试场景 3: 多人提及**
- **输入**: 包含多个不同人物的新闻
- **预期输出**: 
  - characters 数组按提及次数降序排列
  - 每个条目包含 name、count 和 rank

**测试场景 4: 无人物提及**
- **输入**: 不包含任何人物的新闻
- **预期输出**: `{ characters: [], topCharacter: null }`

### 2.2 getMainCharacterSummary 函数

**测试场景 1: 空结果输入**
- **输入**: `{ characters: [], topCharacter: null }`
- **预期输出**: `{ name: '', count: 0, status: 'NO DATA' }`

**测试场景 2: 有结果的输入**
- **输入**: 包含主要人物的结果
- **预期输出**: 
  - 包含 name、count 和 status
  - status 格式为 "人物名 (提及次数)"

### 2.3 calculateDominance 函数

**测试场景 1: 少于2个人物**
- **输入**: `{ characters: [{ name: 'A', count: 5, rank: 1 }] }`
- **预期输出**: `100`

**测试场景 2: 计算主导地位**
- **输入**: `{ characters: [{ name: 'A', count: 10, rank: 1 }, { name: 'B', count: 5, rank: 2 }] }`
- **预期输出**: `100` (因为 10/5 = 2，转换为100%)

**测试场景 3: 接近的提及次数**
- **输入**: `{ characters: [{ name: 'A', count: 6, rank: 1 }, { name: 'B', count: 5, rank: 2 }] }`
- **预期输出**: `20` (因为 (6/5 - 1) * 100 = 20)

**测试场景 4: 零提及**
- **输入**: `{ characters: [{ name: 'A', count: 0, rank: 1 }, { name: 'B', count: 0, rank: 2 }] }`
- **预期输出**: `0`

## 3. 叙事分析 (narrative.ts)

### 3.1 analyzeNarratives 函数

**测试场景 1: 空新闻输入**
- **输入**: `[]` 或 `null`
- **预期输出**: `null`

**测试场景 2: 检测边缘到主流的叙事**
- **输入**: 包含来自边缘和主流来源的相关新闻
- **预期输出**: 
  - fringeToMainstream 数组包含该叙事
  - status 为 'crossing'
  - crossoverLevel 计算正确

**测试场景 3: 检测新兴边缘叙事**
- **输入**: 包含来自边缘来源的新闻
- **预期输出**: 
  - emergingFringe 数组包含该叙事
  - status 根据数量正确设置为 'emerging'、'spreading' 或 'viral'

**测试场景 4: 检测虚假信息信号**
- **输入**: 包含已知虚假信息模式的新闻
- **预期输出**: 
  - disinfoSignals 数组包含该叙事

**测试场景 5: 一般叙事监控**
- **输入**: 包含主流来源的新闻
- **预期输出**: 
  - narrativeWatch 数组包含该叙事

**测试场景 6: 排序结果**
- **输入**: 包含多个叙事的新闻
- **预期输出**: 
  - emergingFringe 按 count 降序排序
  - fringeToMainstream 按 crossoverLevel 降序排序
  - narrativeWatch 按 count 降序排序
  - disinfoSignals 按 count 降序排序

### 3.2 getNarrativeSummary 函数

**测试场景 1: 空结果输入**
- **输入**: `null`
- **预期输出**: `{ total: 0, status: 'NO DATA' }`

**测试场景 2: 有结果的输入**
- **输入**: 包含叙事的结果
- **预期输出**: 
  - total 为所有叙事类型的总数
  - status 为 "总数 ACTIVE" 或 "MONITORING"

### 3.3 clearNarrativeHistory 函数

**测试场景 1: 调用后历史被清除**
- **操作**: 先分析一些新闻，然后调用 clearNarrativeHistory
- **预期**: 历史被重置，后续分析重新开始

### 3.4 辅助函数

**测试场景 1: formatNarrativeName 函数**
- **输入**: "test-narrative"
- **预期输出**: "Test Narrative"

**测试场景 2: classifySource 函数**
- **输入**: "Breitbart"
- **预期输出**: "fringe"
- **输入**: "CNN"
- **预期输出**: "mainstream"
- **输入**: "Unknown Source"
- **预期输出**: `null`
