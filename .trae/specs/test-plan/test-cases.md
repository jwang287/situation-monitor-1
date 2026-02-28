# 测试用例详情

## 1. 单元测试用例

### 1.1 TranslationService

#### TC-TRANS-001: 空文本处理
```typescript
describe('translate', () => {
  it('should return empty string for empty input', async () => {
    const result = await service.translate('');
    expect(result).toBe('');
  });

  it('should return original text for whitespace-only input', async () => {
    const result = await service.translate('   ');
    expect(result).toBe('   ');
  });
});
```

#### TC-TRANS-002: 中文文本跳过翻译
```typescript
it('should return original text if it contains Chinese characters', async () => {
  const chineseText = '你好世界';
  const result = await service.translate(chineseText);
  expect(result).toBe(chineseText);
  expect(fetchMock).not.toHaveBeenCalled();
});
```

#### TC-TRANS-003: 翻译API调用
```typescript
it('should translate English text using LibreTranslate API', async () => {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ translatedText: '你好' })
  });

  const result = await service.translate('Hello');
  expect(result).toBe('你好');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

#### TC-TRANS-004: 缓存机制
```typescript
it('should use cache for repeated translations', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ translatedText: '你好' })
  });

  // First call - should hit API
  await service.translate('Hello');
  expect(fetchMock).toHaveBeenCalledTimes(1);

  // Second call - should use cache
  const result = await service.translate('Hello');
  expect(result).toBe('你好');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

#### TC-TRANS-005: 错误处理
```typescript
it('should return original text on API error', async () => {
  fetchMock.mockRejectedValue(new Error('Network error'));

  const originalText = 'Hello World';
  const result = await service.translate(originalText);
  expect(result).toBe(originalText);
});
```

#### TC-TRANS-006: 批量翻译
```typescript
describe('translateBatch', () => {
  it('should translate multiple texts', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ translatedText: 'Translated' })
    });

    const texts = ['Text 1', 'Text 2', 'Text 3'];
    const result = await service.translateBatch(texts);

    expect(result.results.size).toBe(3);
    expect(result.failed.length).toBe(0);
  });

  it('should deduplicate texts', async () => {
    const texts = ['Hello', 'Hello', 'Hello'];
    const result = await service.translateBatch(texts);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.results.size).toBe(1);
  });
});
```

#### TC-TRANS-007: 并发去重
```typescript
it('should deduplicate concurrent requests for same text', async () => {
  fetchMock.mockImplementation(() => new Promise((resolve) => {
    setTimeout(() => resolve({
      ok: true,
      json: async () => ({ translatedText: '你好' })
    }), 10);
  }));

  const promises = [
    service.translate('Hello'),
    service.translate('Hello'),
    service.translate('Hello')
  ];

  const results = await Promise.all(promises);
  expect(results).toEqual(['你好', '你好', '你好']);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
```

### 1.2 CacheManager

#### TC-CACHE-001: 基本存取
```typescript
describe('set and get', () => {
  it('should store and retrieve data from memory cache', () => {
    cache.set('test-key', { value: 42 }, 60000);
    const result = cache.get('test-key');

    expect(result).not.toBeNull();
    expect(result?.data).toEqual({ value: 42 });
    expect(result?.fromCache).toBe('memory');
    expect(result?.isStale).toBe(false);
  });

  it('should return null for non-existent key', () => {
    const result = cache.get('non-existent');
    expect(result).toBeNull();
  });
});
```

#### TC-CACHE-002: TTL机制
```typescript
it('should mark data as stale after TTL', () => {
  vi.useFakeTimers();
  cache.set('stale-test', { value: 'test' }, 1000);

  vi.advanceTimersByTime(1500);
  const result = cache.get('stale-test');
  expect(result?.isStale).toBe(true);

  vi.useRealTimers();
});
```

#### TC-CACHE-003: LRU淘汰
```typescript
it('should evict oldest entry from memory when at capacity', () => {
  const memOnlyCache = new CacheManager({ prefix: 'mem_', maxMemorySize: 3 });

  for (let i = 0; i < 3; i++) {
    memOnlyCache.set(`key-${i}`, i, 60000);
  }

  memOnlyCache.set('key-new', 'new', 60000);

  expect(memOnlyCache.getStats().memoryEntries).toBe(3);
  expect(memOnlyCache.get('key-new')?.data).toBe('new');
});
```

### 1.3 Settings Store

#### TC-SETTINGS-001: 默认值
```typescript
it('should have default state with all panels enabled', async () => {
  const { settings } = await import('./settings');
  const state = get(settings);

  expect(state.initialized).toBe(false);
  expect(state.enabled['map']).toBe(true);
  expect(state.enabled['politics']).toBe(true);
  expect(state.enabled['tech']).toBe(true);
});
```

#### TC-SETTINGS-002: 面板开关
```typescript
it('should toggle panel visibility', async () => {
  const { settings } = await import('./settings');

  expect(get(settings).enabled['tech']).toBe(true);

  settings.togglePanel('tech');
  expect(get(settings).enabled['tech']).toBe(false);

  settings.togglePanel('tech');
  expect(get(settings).enabled['tech']).toBe(true);
});
```

#### TC-SETTINGS-003: 持久化
```typescript
it('should persist panel settings to localStorage', async () => {
  const { settings } = await import('./settings');

  settings.togglePanel('finance');

  expect(localStorageMock.setItem).toHaveBeenCalledWith(
    'situationMonitorPanels',
    expect.any(String)
  );
});
```

#### TC-SETTINGS-004: 新闻地区切换
```typescript
it('should set news region', async () => {
  const { settings } = await import('./settings');

  settings.setNewsRegion('china');
  expect(get(settings).newsRegion).toBe('china');

  settings.setNewsRegion('international');
  expect(get(settings).newsRegion).toBe('international');
});
```

### 1.4 News Store

#### TC-NEWS-001: 初始状态
```typescript
it('should start with empty categories', async () => {
  const { news } = await import('./news');
  const state = get(news);

  expect(state.categories.politics.items).toEqual([]);
  expect(state.categories.tech.items).toEqual([]);
});
```

#### TC-NEWS-002: 设置数据
```typescript
it('should set items for a category', async () => {
  const { news, politicsNews } = await import('./news');

  const items = [{
    id: '1',
    title: 'Test headline',
    source: 'BBC',
    link: 'https://bbc.com/1',
    timestamp: Date.now(),
    category: 'politics' as const
  }];

  news.setItems('politics', items);

  const politics = get(politicsNews);
  expect(politics.items.length).toBe(1);
  expect(politics.items[0].title).toBe('Test headline');
});
```

#### TC-NEWS-003: 警报检测
```typescript
it('should enrich items with alert detection', async () => {
  const { news } = await import('./news');

  const items = [
    { id: '1', title: 'Military strike in region', /* ... */ },
    { id: '2', title: 'New tech startup launches', /* ... */ }
  ];

  news.setItems('politics', [items[0]]);
  news.setItems('tech', [items[1]]);

  const state = get(news);
  expect(state.categories.politics.items[0].isAlert).toBe(true);
  expect(state.categories.tech.items[0].isAlert).toBe(false);
});
```

#### TC-NEWS-004: 去重追加
```typescript
it('should append items without duplicates', async () => {
  const { news, techNews } = await import('./news');

  const initial = [{ id: '1', title: 'First item', /* ... */ }];
  const more = [
    { id: '1', title: 'First item', /* ... */ },
    { id: '2', title: 'Second item', /* ... */ }
  ];

  news.setItems('tech', initial);
  news.appendItems('tech', more);

  const tech = get(techNews);
  expect(tech.items.length).toBe(2);
});
```

### 1.5 CircuitBreaker

#### TC-CB-001: 状态转换
```typescript
describe('CircuitBreaker', () => {
  it('should transition from CLOSED to OPEN after threshold', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 });
    const failingFn = vi.fn().mockRejectedValue(new Error('Fail'));

    // 3 failures should open the circuit
    for (let i = 0; i < 3; i++) {
      try { await cb.execute(failingFn); } catch {}
    }

    expect(cb.getState()).toBe('OPEN');
  });
});
```

### 1.6 分析引擎

#### TC-ANALYSIS-001: 关联分析
```typescript
describe('correlation', () => {
  it('should detect correlations across news items', () => {
    const newsItems = [
      { title: 'AI breakthrough in healthcare', /* ... */ },
      { title: 'Healthcare industry adopts AI', /* ... */ }
    ];

    const correlations = analyzeCorrelations(newsItems);

    expect(correlations.length).toBeGreaterThan(0);
    expect(correlations[0].topic).toContain('AI');
  });
});
```

#### TC-ANALYSIS-002: 主角识别
```typescript
describe('mainCharacter', () => {
  it('should identify most mentioned entities', () => {
    const newsItems = [
      { title: 'Elon Musk announces new product', /* ... */ },
      { title: 'Musk visits factory', /* ... */ },
      { title: 'Tesla stock rises', /* ... */ }
    ];

    const characters = detectMainCharacters(newsItems);

    expect(characters[0].name).toBe('Elon Musk');
    expect(characters[0].mentions).toBe(2);
  });
});
```

---

## 2. 集成测试用例

### 2.1 组件集成

#### TC-INT-001: NewsItem + BilingualText
```typescript
describe('NewsItem with BilingualText', () => {
  it('should display bilingual text when translation enabled', async () => {
    const item = createMockNewsItem({ title: 'Hello World' });
    settings.setTranslationEnabled(true);

    const { container } = render(NewsItem, { props: { item } });

    await waitFor(() => {
      expect(container.querySelector('.original-text')).toHaveTextContent('Hello World');
      expect(container.querySelector('.translated-text')).toBeInTheDocument();
    });
  });
});
```

#### TC-INT-002: SettingsModal + Settings Store
```typescript
describe('SettingsModal integration', () => {
  it('should update store when panel toggled', async () => {
    const { component } = render(SettingsModal, { props: { open: true } });

    const checkbox = screen.getByLabelText('Tech');
    await fireEvent.click(checkbox);

    expect(get(settings).enabled['tech']).toBe(false);
  });
});
```

### 2.2 数据流集成

#### TC-FLOW-001: 刷新流程
```typescript
describe('Refresh flow', () => {
  it('should update all stores after refresh', async () => {
    const mockNews = [createMockNewsItem()];
    vi.mocked(fetchCategoryNews).mockResolvedValue({ politics: mockNews });

    refreshStore.triggerRefresh();

    await waitFor(() => {
      expect(get(politicsNews).items).toHaveLength(1);
    });
  });
});
```

---

## 3. E2E测试用例

### 3.1 页面加载

#### TC-E2E-001: 首页加载
```typescript
test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check page title
  await expect(page).toHaveTitle('Situation Monitor');

  // Check header is visible
  await expect(page.locator('h1')).toHaveText('Situation Monitor');

  // Check core panels are rendered
  await expect(page.locator('text=世界/地缘政治')).toBeVisible();
  await expect(page.locator('text=科技/人工智能')).toBeVisible();
  await expect(page.locator('text=财经')).toBeVisible();
});
```

### 3.2 面板交互

#### TC-E2E-002: 面板开关
```typescript
test('toggle panel visibility', async ({ page }) => {
  await page.goto('/');

  // Open settings
  await page.click('[data-testid="settings-button"]');

  // Toggle off tech panel
  await page.click('[data-testid="panel-toggle-tech"]');

  // Close settings
  await page.click('[data-testid="close-settings"]');

  // Verify panel is hidden
  await expect(page.locator('text=科技/人工智能')).not.toBeVisible();
});
```

### 3.3 翻译功能

#### TC-E2E-003: 启用翻译
```typescript
test('enable translation', async ({ page }) => {
  await page.goto('/');

  // Open settings
  await page.click('[data-testid="settings-button"]');

  // Enable translation
  await page.click('[data-testid="translation-toggle"]');

  // Select provider
  await page.click('[data-testid="provider-microsoft"]');

  // Close settings
  await page.click('[data-testid="close-settings"]');

  // Wait for translation to appear
  await expect(page.locator('.translated-text').first()).toBeVisible({ timeout: 10000 });
});
```

### 3.4 新闻地区切换

#### TC-E2E-004: 切换到国内新闻
```typescript
test('switch to China news', async ({ page }) => {
  await page.goto('/');

  // Open settings
  await page.click('[data-testid="settings-button"]');

  // Select China news
  await page.click('[data-testid="region-china"]');

  // Close settings
  await page.click('[data-testid="close-settings"]');

  // Wait for news to load
  await page.waitForTimeout(3000);

  // Check for Chinese content
  const newsContent = await page.locator('.news-item').first().textContent();
  expect(newsContent).toMatch(/[\u4e00-\u9fa5]/);
});
```

### 3.5 自定义监控

#### TC-E2E-005: 创建监控
```typescript
test('create custom monitor', async ({ page }) => {
  await page.goto('/');

  // Open monitors panel
  await page.click('text=我的监控');

  // Click add button
  await page.click('[data-testid="add-monitor"]');

  // Fill form
  await page.fill('[data-testid="monitor-name"]', 'Test Monitor');
  await page.fill('[data-testid="monitor-keywords"]', 'test, keyword');

  // Submit
  await page.click('[data-testid="save-monitor"]');

  // Verify monitor created
  await expect(page.locator('text=Test Monitor')).toBeVisible();
});
```

---

## 4. 测试数据

### 4.1 Mock News Items
```typescript
export const mockNewsItems = {
  politics: [
    {
      id: 'pol-1',
      title: 'Congress passes new legislation',
      source: 'BBC',
      link: 'https://bbc.com/1',
      timestamp: Date.now(),
      category: 'politics',
      isAlert: false
    },
    {
      id: 'pol-2',
      title: 'Military action in border region',
      source: 'CNN',
      link: 'https://cnn.com/2',
      timestamp: Date.now(),
      category: 'politics',
      isAlert: true,
      alertKeyword: 'military'
    }
  ],
  tech: [
    {
      id: 'tech-1',
      title: 'New AI model released',
      source: 'TechCrunch',
      link: 'https://tc.com/1',
      timestamp: Date.now(),
      category: 'tech',
      isAlert: false
    }
  ]
};
```

### 4.2 Mock API Responses
```typescript
export const mockGdeltResponse = {
  articles: [
    {
      title: 'Test Article',
      url: 'https://example.com/article',
      seendate: '20241201T120000Z',
      domain: 'example.com'
    }
  ]
};

export const mockRssResponse = `
<?xml version="1.0"?>
<rss>
  <channel>
    <item>
      <title>Test RSS Item</title>
      <link>https://example.com/rss</link>
      <pubDate>Mon, 01 Dec 2024 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
`;
```

---

## 5. 测试执行矩阵

| 测试ID | 类型 | 优先级 | 自动化 | 执行频率 |
|--------|------|--------|--------|----------|
| TC-TRANS-001~007 | 单元 | P0 | 是 | 每次提交 |
| TC-CACHE-001~003 | 单元 | P0 | 是 | 每次提交 |
| TC-SETTINGS-001~004 | 单元 | P0 | 是 | 每次提交 |
| TC-NEWS-001~004 | 单元 | P0 | 是 | 每次提交 |
| TC-CB-001 | 单元 | P1 | 是 | 每次提交 |
| TC-ANALYSIS-001~002 | 单元 | P1 | 是 | 每次提交 |
| TC-INT-001~002 | 集成 | P0 | 是 | 每次提交 |
| TC-FLOW-001 | 集成 | P0 | 是 | 每次提交 |
| TC-E2E-001~005 | E2E | P0 | 是 | 每日/发布前 |
