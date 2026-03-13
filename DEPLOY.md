# 部署指南

## 📦 阿里云函数计算部署

### 第一步：开通服务

1. 访问 https://fcnext.console.aliyun.com
2. 开通函数计算 FC 服务

### 第二步：创建服务

- 服务名称：`auto-content-factory`
- 地域：选择离你近的地域（如：华东 1-杭州）

### 第三步：创建函数

- 函数名称：`content-generator`
- 运行环境：Node.js 18
- 代码上传：在线编辑
- 内存：512 MB
- 超时：120 秒（视频生成需要较长时间）
- 触发器：HTTP 触发器（公开）

### 第四步：配置环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `LLM_API_KEY` | 你的 AI API Key | 用于生成脚本 |
| `LLM_BASE_URL` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 阿里云百炼 |
| `YOUTUBE_API_KEY` | 你的 YouTube API Key | YouTube 上传 |
| `YOUTUBE_CHANNEL_ID` | 你的频道 ID | YouTube 频道 |
| `VIDEO_API_KEY` | D-ID/HeyGen API Key | 视频生成 |
| `VIDEO_PROVIDER` | `d-id` 或 `heygen` | 视频生成服务商 |

### 第五步：部署代码

1. 复制 `index.js` 全部内容
2. 粘贴到阿里云函数代码编辑器
3. 点击"部署"

### 第六步：测试

**健康检查：**
```bash
curl -X POST https://你的函数 URL.apigateway.cn-hangzhou.aliyuncs.com \
  -H "Content-Type: application/json" \
  -d '{"action": "health"}'
```

**获取热点：**
```bash
curl -X POST https://你的函数 URL.apigateway.cn-hangzhou.aliyuncs.com \
  -H "Content-Type: application/json" \
  -d '{"action": "get_hotspots", "platform": "all", "limit": 10}'
```

**生成口播稿：**
```bash
curl -X POST https://你的函数 URL.apigateway.cn-hangzhou.aliyuncs.com \
  -H "Content-Type: application/json" \
  -d '{"action": "generate_script", "topic": "AI 会不会取代程序员", "duration": 60}'
```

**一键生成视频并上传：**
```bash
curl -X POST https://你的函数 URL.apigateway.cn-hangzhou.aliyuncs.com \
  -H "Content-Type: application/json" \
  -d '{"action": "auto_create", "topic": "AI 会不会取代程序员", "platform": "youtube"}'
```

---

## 🐳 Docker 本地部署

```bash
# 构建镜像
docker build -t auto-content-factory .

# 运行容器
docker run -d \
  --name acf \
  -p 8000:8000 \
  -e LLM_API_KEY=your-key \
  -e YOUTUBE_API_KEY=your-key \
  auto-content-factory
```

---

## 🔑 API Key 获取

### 阿里云百炼（AI）
1. 访问 https://dashscope.console.aliyun.com
2. 开通服务
3. 创建 API Key

### YouTube Data API
1. 访问 https://console.cloud.google.com
2. 创建项目
3. 启用 YouTube Data API v3
4. 创建 OAuth 2.0 凭证

### D-ID（数字人视频）
1. 访问 https://www.d-id.com
2. 注册账号
3. 在 Dashboard 获取 API Key

### HeyGen（备选视频生成）
1. 访问 https://www.heygen.com
2. 注册账号
3. 获取 API Key

---

## 📊 成本估算

| 服务 | 价格 | 说明 |
|------|------|------|
| 阿里云函数计算 | ¥0.0001125/GB-s | 按量付费 |
| 阿里云百炼 | ¥0.008/千tokens | 脚本生成 |
| D-ID | ¥30/月 | 基础版（15 个视频） |
| YouTube | 免费 | API 调用免费 |
| **总计** | **约¥50-100/月** | 个人使用 |

---

## ⚠️ 注意事项

1. **YouTube 上传需要 OAuth 2.0**，函数计算中需要特殊配置
2. **视频生成耗时较长**，建议设置超时为 120 秒以上
3. **API Key 妥善保管**，不要泄露
4. **首次部署建议先测试**，确保各服务正常

---

## 🆘 常见问题

### Q1: 函数返回 500 错误？
**A:** 检查环境变量是否正确配置，查看函数日志

### Q2: 视频生成失败？
**A:** 检查 VIDEO_API_KEY 是否正确，确认 D-ID 账号有额度

### Q3: YouTube 上传失败？
**A:** YouTube 需要 OAuth 2.0 认证，需要配置凭证文件
