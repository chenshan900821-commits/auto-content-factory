# OpenClaw 架构解析：自动化内容工厂是如何工作的

## 🎯 系统概述

OpenClaw 是一个**自动化内容工厂系统**，实现从热点获取到视频上传的全流程自动化。

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenClaw 系统架构                             │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │  热点获取   │───▶│  脚本生成   │───▶│  视频生成   │        │
│  │  (Crawler)  │    │   (AI)      │    │   (AI)      │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│         │                                      │                │
│         │                                      ▼                │
│         │                              ┌─────────────┐        │
│         │                              │  自动上传   │        │
│         │                              │   (API)     │        │
│         │                              └─────────────┘        │
│         │                                      │                │
│         ▼                                      ▼                │
│  ┌─────────────┐                        ┌─────────────┐        │
│  │  数据存储   │                        │  YouTube    │        │
│  │  (MySQL)    │                        │  TikTok     │        │
│  └─────────────┘                        │  视频号     │        │
│                                         └─────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 核心模块

### 1. 热点获取模块

**功能：** 获取全网热点话题

**数据源：**
- 微博热搜
- 抖音热点
- YouTube 趋势
- Twitter 趋势

**API 端点：**
```javascript
POST /
{
    "action": "get_hotspots",
    "platform": "all",
    "limit": 10
}
```

---

### 2. AI 分析模块

**功能：** 分析热点话题，提炼核心观点

**处理流程：**
1. 接收热点话题
2. 调用 LLM 分析
3. 输出分析报告

**API 端点：**
```javascript
POST /
{
    "action": "analyze_hotspot",
    "topic": "AI 会不会取代程序员",
    "platform": "youtube"
}
```

---

### 3. 脚本生成模块

**功能：** 自动生成口播稿

**特点：**
- 支持多种风格（知识科普/娱乐搞笑/励志鸡汤）
- 可自定义时长（30 秒/60 秒/90 秒）
- 口语化输出，避免 AI 味

**API 端点：**
```javascript
POST /
{
    "action": "generate_script",
    "topic": "AI 会不会取代程序员",
    "style": "informative",
    "duration": 60
}
```

---

### 4. 视频生成模块

**功能：** 将脚本转换为视频

**支持类型：**
- 数字人视频（D-ID/HeyGen）
- 图文视频（幻灯片）

**API 端点：**
```javascript
POST /
{
    "action": "generate_video",
    "script": "口播稿内容",
    "video_type": "talking_head"
}
```

---

### 5. 自动上传模块

**功能：** 自动上传视频到各大平台

**支持平台：**
- YouTube
- TikTok
- 微信视频号

**API 端点：**
```javascript
POST /
{
    "action": "upload_to_youtube",
    "video_url": "https://...",
    "title": "视频标题",
    "description": "视频描述",
    "tags": ["标签 1", "标签 2"],
    "privacy": "public"
}
```

---

### 6. 一键自动化流程

**功能：** 全流程自动化

**处理流程：**
```
热点获取 → AI 分析 → 脚本生成 → 视频生成 → 自动上传
```

**API 端点：**
```javascript
POST /
{
    "action": "auto_create",
    "topic": "AI 会不会取代程序员",
    "platform": "youtube"
}
```

---

## 🔧 技术栈

| 模块 | 技术 |
|------|------|
| 运行环境 | Node.js 18 |
| 部署平台 | 阿里云函数计算 |
| AI 服务 | 阿里云百炼（通义千问） |
| 视频生成 | D-ID / HeyGen |
| 数据存储 | MySQL / Redis |

---

## 📊 部署架构

```
┌─────────────────┐
│   用户请求      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │ ← 固定 IP 白名单
│  (阿里云)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  函数计算 FC    │
│  (Node.js 18)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  外部 API       │
│  - 阿里云百炼   │
│  - D-ID         │
│  - YouTube API  │
└─────────────────┘
```

---

## 🔐 IP 白名单配置

### 为什么需要 IP 白名单？

部分 API 服务（如微信公众号、某些数据平台）要求配置**IP 白名单**，只有白名单内的 IP 才能调用 API。

### 阿里云函数计算的出口 IP

**重要：** 阿里云函数计算的出口 IP 是**固定的**，按地域分配。

**各地域出口 IP 段：**

| 地域 | 出口 IP 段 |
|------|-----------|
| 华东 1（杭州） | 47.103.0.0/16 |
| 华东 2（上海） | 47.98.0.0/16 |
| 华北 1（青岛） | 47.100.0.0/16 |
| 华北 2（北京） | 47.96.0.0/16 |
| 华南 1（深圳） | 47.106.0.0/16 |

**你的函数在哪个地域，就用对应的 IP 段！**

### 配置方法

**微信公众号后台：**
1. 登录 https://mp.weixin.qq.com
2. 进入"开发" → "基本配置"
3. 找到"IP 白名单"
4. 点击"修改"
5. 添加 IP 段（如：`47.103.0.0/16`）
6. 点击"保存"

**新榜 API：**
1. 登录 https://www.newrank.cn
2. 进入"开放平台"
3. 找到"IP 白名单"配置
4. 添加阿里云函数计算出口 IP
5. 保存

---

## 🚀 快速开始

### 1. 克隆代码

```bash
git clone https://github.com/chenshan900821-commits/auto-content-factory.git
cd auto-content-factory
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
# 阿里云函数计算控制台 → 函数配置 → 环境变量

LLM_API_KEY=你的阿里云百炼 API Key
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
YOUTUBE_API_KEY=你的 YouTube API Key
VIDEO_API_KEY=你的 D-ID API Key
```

### 4. 部署到阿里云

1. 访问 https://fcnext.console.aliyun.com
2. 创建服务：`auto-content-factory`
3. 创建函数：`content-generator`
4. 运行环境：Node.js 18
5. 复制 `index.js` 代码
6. 配置环境变量
7. 部署

### 5. 测试接口

```bash
# 健康检查
curl -X POST https://你的函数 URL.apigateway.cn-hangzhou.aliyuncs.com \
  -H "Content-Type: application/json" \
  -d '{"action": "health"}'

# 生成口播稿
curl -X POST https://你的函数 URL.apigateway.cn-hangzhou.aliyuncs.com \
  -H "Content-Type: application/json" \
  -d '{"action": "generate_script", "topic": "AI 会不会取代程序员"}'
```

---

## 📈 成本估算

| 服务 | 价格 | 说明 |
|------|------|------|
| 阿里云函数计算 | ¥0.0001125/GB-s | 按量付费 |
| 阿里云百炼 | ¥0.008/千 tokens | 脚本生成 |
| D-ID | ¥30/月 | 基础版（15 个视频） |
| YouTube | 免费 | API 调用免费 |
| **总计** | **约¥50-100/月** | 个人使用 |

---

## 🆘 常见问题

### Q1: 函数返回 500 错误？
**A:** 检查环境变量是否正确配置，查看函数日志

### Q2: 视频生成失败？
**A:** 检查 VIDEO_API_KEY 是否正确，确认 D-ID 账号有额度

### Q3: IP 白名单配置后仍然报错？
**A:** 
- 确认 IP 段是否正确（根据函数所在地域）
- 等待 5-10 分钟让配置生效
- 检查 API 服务商是否有其他限制

---

## 📚 相关资源

- **GitHub 仓库：** https://github.com/chenshan900821-commits/auto-content-factory
- **阿里云百炼：** https://dashscope.console.aliyun.com
- **D-ID：** https://www.d-id.com
- **YouTube API：** https://developers.google.com/youtube/v3

---

**完**
