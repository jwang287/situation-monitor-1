# 服务模块单元测试用例

## 1. 缓存管理器 (cache.ts)

### 1.1 CacheManager 类

**测试场景 1: 初始化**
- **操作**: 创建 CacheManager 实例
- **预期**: 实例创建成功，默认配置正确

**测试场景 2: generateKey 方法**
- **输入**: URL 和参数对象
- **预期输出**: 生成的缓存键包含 URL 和排序后的参数

**测试场景 3: set 和 get 方法 - 内存缓存**
- **操作**: 
  1. 设置缓存项
  2. 立即获取
- **预期**: 
  - 从内存缓存中获取数据
  - isStale 为 false

**测试场景 4: set 和 get 方法 - 存储缓存**
- **操作**: 
  1. 设置缓存项
  2. 清除内存缓存
  3. 获取缓存
- **预期**: 
  - 从存储缓存中获取数据
  - 数据被提升到内存缓存

**测试场景 5: 缓存过期**
- **操作**: 
  1. 设置缓存项，TTL 为 1ms
  2. 等待 2ms
  3. 获取缓存
- **预期**: 
  - 缓存项被视为无效
  - 返回 null

**测试场景 6: 缓存陈旧但有效**
- **操作**: 
  1. 设置缓存项，TTL 为 1ms，staleWhileRevalidate 为 true
  2. 等待 2ms
  3. 获取缓存
- **预期**: 
  - 缓存项被视为陈旧但有效
  - isStale 为 true

**测试场景 7: 内存缓存 LRU 驱逐**
- **操作**: 
  1. 设置 maxMemorySize 为 2
  2. 添加 3 个缓存项
- **预期**: 
  - 第一个添加的缓存项被驱逐
  - 内存缓存中只有最后两个项

**测试场景 8: 存储配额管理**
- **操作**: 
  1. 模拟 localStorage 配额超出
  2. 设置缓存项
- **预期**: 
  - 旧缓存项被清理
  - 新缓存项成功存储

**测试场景 9: invalidate 方法**
- **操作**: 
  1. 设置多个缓存项
  2. 调用 invalidate 方法，传入匹配模式
- **预期**: 
  - 匹配模式的缓存项被清除
  - 不匹配的缓存项保持不变

**测试场景 10: clear 方法**
- **操作**: 
  1. 设置多个缓存项
  2. 调用 clear 方法
- **预期**: 
  - 内存缓存被清空
  - 存储缓存被清空

**测试场景 11: getStats 方法**
- **操作**: 
  1. 设置多个缓存项
  2. 调用 getStats 方法
- **预期**: 
  - 返回正确的统计信息
  - 包含内存项数量、存储项数量和存储大小

## 2. 断路器 (circuit-breaker.ts)

### 2.1 CircuitBreaker 类

**测试场景 1: 初始化**
- **操作**: 创建 CircuitBreaker 实例
- **预期**: 实例创建成功，状态为 CLOSED

**测试场景 2: 正常操作 (CLOSED 状态)**
- **操作**: 
  1. 检查 canRequest()
  2. 记录成功
- **预期**: 
  - canRequest() 返回 true
  - 状态保持 CLOSED

**测试场景 3: 故障阈值触发 (CLOSED -> OPEN)**
- **操作**: 
  1. 记录多次失败（超过 failureThreshold）
  2. 检查状态
- **预期**: 
  - 状态变为 OPEN
  - canRequest() 返回 false

**测试场景 4: 重置超时 (OPEN -> HALF_OPEN)**
- **操作**: 
  1. 触发 OPEN 状态
  2. 等待 resetTimeout 时间
  3. 检查 canRequest()
- **预期**: 
  - 状态变为 HALF_OPEN
  - canRequest() 返回 true

**测试场景 5: 恢复成功 (HALF_OPEN -> CLOSED)**
- **操作**: 
  1. 进入 HALF_OPEN 状态
  2. 记录成功
  3. 检查状态
- **预期**: 
  - 状态变为 CLOSED
  - 故障计数重置

**测试场景 6: 恢复失败 (HALF_OPEN -> OPEN)**
- **操作**: 
  1. 进入 HALF_OPEN 状态
  2. 记录失败
  3. 检查状态
- **预期**: 
  - 状态变为 OPEN
  - 故障计数增加

**测试场景 7: halfOpenMaxRequests 限制**
- **操作**: 
  1. 进入 HALF_OPEN 状态
  2. 多次调用 canRequest()
- **预期**: 
  - 前 halfOpenMaxRequests 次返回 true
  - 后续调用返回 false

**测试场景 8: getState 方法**
- **操作**: 
  1. 执行各种操作
  2. 调用 getState()
- **预期**: 
  - 返回正确的状态信息
  - 包含当前状态、故障数、成功数等

**测试场景 9: reset 方法**
- **操作**: 
  1. 触发 OPEN 状态
  2. 调用 reset()
  3. 检查状态
- **预期**: 
  - 状态变为 CLOSED
  - 所有计数器重置

### 2.2 CircuitBreakerRegistry 类

**测试场景 1: get 方法 - 创建新断路器**
- **操作**: 
  1. 调用 get() 方法获取不存在的服务断路器
- **预期**: 
  - 创建并返回新的断路器实例

**测试场景 2: get 方法 - 返回现有断路器**
- **操作**: 
  1. 调用 get() 方法获取已存在的服务断路器
- **预期**: 
  - 返回现有的断路器实例

**测试场景 3: getStatus 方法**
- **操作**: 
  1. 创建多个断路器
  2. 调用 getStatus() 方法
- **预期**: 
  - 返回所有断路器的状态

**测试场景 4: resetAll 方法**
- **操作**: 
  1. 触发多个断路器到 OPEN 状态
  2. 调用 resetAll() 方法
  3. 检查状态
- **预期**: 
  - 所有断路器状态变为 CLOSED

**测试场景 5: getOpenCount 方法**
- **操作**: 
  1. 触发部分断路器到 OPEN 状态
  2. 调用 getOpenCount() 方法
- **预期**: 
  - 返回正确的 OPEN 状态断路器数量

## 3. 请求去重器 (deduplicator.ts)

### 3.1 RequestDeduplicator 类

**测试场景 1: 初始化**
- **操作**: 创建 RequestDeduplicator 实例
- **预期**: 实例创建成功，inFlight 映射为空

**测试场景 2: dedupe 方法 - 新请求**
- **操作**: 
  1. 调用 dedupe() 方法，传入新的键和请求函数
- **预期**: 
  - 执行请求函数
  - 返回请求函数的 Promise

**测试场景 3: dedupe 方法 - 重复请求**
- **操作**: 
  1. 第一次调用 dedupe() 方法
  2. 第二次调用 dedupe() 方法，使用相同的键
- **预期**: 
  - 第二次调用返回第一次的 Promise
  - 只执行一次请求函数

**测试场景 4: isInFlight 方法**
- **操作**: 
  1. 调用 dedupe() 方法
  2. 立即调用 isInFlight() 方法
  3. 等待 Promise 完成
  4. 再次调用 isInFlight() 方法
- **预期**: 
  - Promise 完成前返回 true
  - Promise 完成后返回 false

**测试场景 5: getCount 方法**
- **操作**: 
  1. 调用 dedupe() 方法多次
  2. 调用 getCount() 方法
- **预期**: 
  - 返回当前飞行中请求的数量

**测试场景 6: getInFlightKeys 方法**
- **操作**: 
  1. 调用 dedupe() 方法多次，使用不同的键
  2. 调用 getInFlightKeys() 方法
- **预期**: 
  - 返回所有飞行中请求的键

**测试场景 7: clear 方法**
- **操作**: 
  1. 调用 dedupe() 方法
  2. 调用 clear() 方法
  3. 调用 isInFlight() 方法
- **预期**: 
  - isInFlight() 返回 false
  - getCount() 返回 0

**测试场景 8: 异常处理**
- **操作**: 
  1. 调用 dedupe() 方法，传入返回拒绝 Promise 的请求函数
  2. 捕获异常
- **预期**: 
  - Promise 被拒绝
  - 不会产生未处理的拒绝
  - 键从 inFlight 映射中移除
