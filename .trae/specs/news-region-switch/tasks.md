# Tasks

- [x] Task 1: 添加新闻地区设置到Settings store
  - [x] SubTask 1.1: 在settings.ts中添加newsRegion类型定义
  - [x] SubTask 1.2: 添加newsRegion到SettingsState接口
  - [x] SubTask 1.3: 添加newsRegion到localStorage存储

- [x] Task 2: 配置国内新闻源
  - [x] SubTask 2.1: 在feeds.ts中添加CHINA_FEEDS配置
  - [x] SubTask 2.2: 定义国内新闻API端点

- [x] Task 3: 修改News API支持地区切换
  - [x] SubTask 3.1: 在news.ts中添加fetchChinaNews函数
  - [x] SubTask 3.2: 修改fetchCategoryNews根据地区选择API
  - [x] SubTask 3.3: 添加地区参数到新闻获取函数

- [x] Task 4: 添加新闻地区切换UI
  - [x] SubTask 4.1: 在设置面板中添加新闻地区选择器
  - [ ] SubTask 4.2: 添加地区标签显示到新闻面板

- [x] Task 5: 更新新闻Store支持地区
  - [x] SubTask 5.1: 修改news store使用地区设置
  - [x] SubTask 5.2: 添加地区切换触发刷新

# Task Dependencies

- Task 1 必须在 Task 4 之前完成
- Task 2 必须在 Task 3 之前完成
- Task 3 必须在 Task 5 之前完成
- Task 5 必须在 Task 4 之前完成
