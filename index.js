'use strict';

const axios = require('axios');

// ==================== 配置管理 ====================

const CONFIG = {
    // 热点数据源
    HOTSPOT_SOURCES: {
        weibo: 'https://weibo.com/hot/list',
        douyin: 'https://www.douyin.com/hot',
        youtube: 'https://www.youtube.com/feed/trending',
        twitter: 'https://twitter.com/explore/tabs/trending'
    },
    
    // AI 配置
    LLM: {
        baseURL: process.env.LLM_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: process.env.LLM_API_KEY,
        model: process.env.LLM_MODEL || 'qwen-plus'
    },
    
    // YouTube 配置
    YOUTUBE: {
        apiKey: process.env.YOUTUBE_API_KEY,
        channelId: process.env.YOUTUBE_CHANNEL_ID
    },
    
    // 视频生成配置
    VIDEO: {
        provider: process.env.VIDEO_PROVIDER || 'd-id',  // d-id / heygen / synthesia
        apiKey: process.env.VIDEO_API_KEY
    }
};

// ==================== 主入口 ====================

exports.handler = async (event, context) => {
    try {
        const body = JSON.parse(event.body);
        const action = body.action;
        
        log('INFO', `收到请求：${action}`);
        
        switch (action) {
            // 热点相关
            case 'get_hotspots':
                return await getHotspots(body);
            
            case 'analyze_hotspot':
                return await analyzeHotspot(body);
            
            // 脚本生成
            case 'generate_script':
                return await generateScript(body);
            
            // 视频生成
            case 'generate_video':
                return await generateVideo(body);
            
            // YouTube 上传
            case 'upload_to_youtube':
                return await uploadToYouTube(body);
            
            // 完整流程（一键式）
            case 'auto_create':
                return await autoCreateContent(body);
            
            // 频道管理
            case 'list_videos':
                return await listYouTubeVideos();
            
            case 'delete_video':
                return await deleteYouTubeVideo(body);
            
            // 健康检查
            case 'health':
                return response(200, { 
                    success: true, 
                    status: 'healthy',
                    timestamp: new Date().toISOString()
                });
            
            default:
                return response(400, { success: false, error: 'Unknown action' });
        }
    } catch (error) {
        log('ERROR', 'Error:', error);
        return response(500, { 
            success: false, 
            error: error.message
        });
    }
};

// ==================== 热点获取模块 ====================

/**
 * 获取全网热点
 */
async function getHotspots(body) {
    const { platform = 'all', limit = 10 } = body;
    
    const hotspots = {
        weibo: [],
        douyin: [],
        youtube: [],
        twitter: []
    };
    
    if (platform === 'all' || platform === 'weibo') {
        hotspots.weibo = await getWeiboHotspots(limit);
    }
    
    if (platform === 'all' || platform === 'douyin') {
        hotspots.douyin = await getDouyinHotspots(limit);
    }
    
    if (platform === 'all' || platform === 'youtube') {
        hotspots.youtube = await getYouTubeTrending(limit);
    }
    
    if (platform === 'all' || platform === 'twitter') {
        hotspots.twitter = await getTwitterTrending(limit);
    }
    
    return response(200, {
        success: true,
        data: hotspots,
        timestamp: new Date().toISOString()
    });
}

/**
 * 获取微博热搜
 */
async function getWeiboHotspots(limit = 10) {
    try {
        // 使用第三方 API 获取微博热搜（实际部署时替换为可靠的数据源）
        const response = await axios.get('https://api.weibo.com/2/search/all', {
            params: {
                q: '热搜',
                count: limit
            }
        });
        
        return (response.data.data || []).map(item => ({
            platform: 'weibo',
            title: item.hotword,
            rank: item.num,
            hot_value: item.hotword_value,
            url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.hotword)}`
        }));
    } catch (error) {
        log('ERROR', '获取微博热搜失败:', error.message);
        return [];
    }
}

/**
 * 获取抖音热点
 */
async function getDouyinHotspots(limit = 10) {
    try {
        // 使用第三方 API 获取抖音热点
        const response = await axios.get('https://www.douyin.com/aweme/v1/api/hot/search/list');
        
        return (response.data.data.word_list || []).slice(0, limit).map(item => ({
            platform: 'douyin',
            title: item.word,
            rank: item.position,
            hot_value: item.hot_value,
            url: `https://www.douyin.com/hot/${item.sentence_id}`
        }));
    } catch (error) {
        log('ERROR', '获取抖音热点失败:', error.message);
        return [];
    }
}

/**
 * 获取 YouTube 趋势视频
 */
async function getYouTubeTrending(limit = 10) {
    if (!CONFIG.YOUTUBE.apiKey) {
        log('WARN', '未配置 YouTube API Key');
        return [];
    }
    
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'snippet,statistics',
                chart: 'mostPopular',
                maxResults: limit,
                regionCode: 'US',
                key: CONFIG.YOUTUBE.apiKey
            }
        });
        
        return response.data.items.map(item => ({
            platform: 'youtube',
            title: item.snippet.title,
            rank: item.statistics.viewCount,
            video_id: item.id,
            url: `https://www.youtube.com/watch?v=${item.id}`
        }));
    } catch (error) {
        log('ERROR', '获取 YouTube 趋势失败:', error.message);
        return [];
    }
}

/**
 * 获取 Twitter 趋势
 */
async function getTwitterTrending(limit = 10) {
    // 需要 Twitter API v2
    // 这里提供框架，实际使用需要申请 Twitter API
    log('INFO', 'Twitter 趋势获取需要 Twitter API v2');
    return [];
}

// ==================== AI 分析模块 ====================

/**
 * 分析热点话题
 */
async function analyzeHotspot(body) {
    const { topic, platform, hot_value } = body;
    
    if (!CONFIG.LLM.apiKey) {
        throw new Error('未配置 LLM API Key');
    }
    
    const analysis = await callLLM(`
你是一个专业的内容分析师。请分析以下热点话题：

话题：${topic}
平台：${platform}
热度：${hot_value || '未知'}

请分析：
1. 这个话题为什么火？（核心原因）
2. 目标受众是谁？
3. 可以从哪些角度创作内容？（至少 3 个角度）
4. 有什么争议点或讨论价值？

输出格式：JSON
{
    "reason": "火爆原因",
    "audience": "目标受众",
    "angles": ["角度 1", "角度 2", "角度 3"],
    "controversy": "争议点"
}
`);
    
    return response(200, {
        success: true,
        data: JSON.parse(analysis)
    });
}

// ==================== 脚本生成模块 ====================

/**
 * 生成口播稿
 */
async function generateScript(body) {
    const { topic, style = 'informative', duration = 60 } = body;
    
    if (!CONFIG.LLM.apiKey) {
        throw new Error('未配置 LLM API Key');
    }
    
    // 计算字数（中文约 4 字/秒）
    const targetWords = duration * 4;
    
    const script = await callLLM(`
你是一个专业的短视频口播稿写手。请根据以下主题生成一个口播稿。

主题：${topic}
风格：${style}（informative=知识科普，entertaining=娱乐搞笑，inspirational=励志鸡汤）
时长：${duration}秒（约${targetWords}字）

要求：
- 开头：用问题或金句吸引注意力（5 秒）
- 主体：3 个核心观点，每个观点配 1 个例子（${duration - 15}秒）
- 结尾：引导评论或关注（10 秒）
- 语气：自然、像和朋友聊天
- 避免：AI 味、说教感

请直接输出口播稿，不要其他说明。
`);
    
    return response(200, {
        success: true,
        data: {
            script,
            word_count: script.length,
            estimated_duration: Math.round(script.length / 4)
        }
    });
}

// ==================== 视频生成模块 ====================

/**
 * 生成视频（调用 AI 视频服务）
 */
async function generateVideo(body) {
    const { script, video_type = 'talking_head' } = body;
    
    if (!CONFIG.VIDEO.apiKey) {
        throw new Error('未配置视频生成 API Key');
    }
    
    // 这里以 D-ID 为例（数字人视频）
    if (video_type === 'talking_head') {
        return await generateTalkingHeadVideo(script);
    }
    
    // 图文视频
    if (video_type === 'slideshow') {
        return await generateSlideshowVideo(script);
    }
    
    throw new Error('不支持的视频类型');
}

/**
 * 生成数字人视频（D-ID）
 */
async function generateTalkingHeadVideo(script) {
    // D-ID API 文档：https://docs.d-id.com/
    
    // 1. 创建演讲
    const createResponse = await axios.post(
        'https://api.d-id.com/talks',
        {
            script: {
                type: 'text',
                input: script,
                provider: {
                    type: 'microsoft',
                    voice_id: 'zh-CN-XiaoxiaoNeural'
                }
            },
            source_url: 'https://example.com/avatar.jpg'  // 数字人形象图片
        },
        {
            headers: {
                'Authorization': `Basic ${CONFIG.VIDEO.apiKey}`,
                'Content-Type': 'application/json'
            }
        }
    );
    
    const talkId = createResponse.data.id;
    
    // 2. 等待视频生成（轮询）
    let status = 'created';
    let videoUrl = null;
    
    while (status === 'created' || status === 'started') {
        await sleep(3000);
        
        const statusResponse = await axios.get(
            `https://api.d-id.com/talks/${talkId}`,
            {
                headers: {
                    'Authorization': `Basic ${CONFIG.VIDEO.apiKey}`
                }
            }
        );
        
        status = statusResponse.data.status;
        videoUrl = statusResponse.data.result_url;
    }
    
    return {
        video_url: videoUrl,
        talk_id: talkId
    };
}

/**
 * 生成图文视频
 */
async function generateSlideshowVideo(script) {
    // 可以使用 Canva API 或其他视频生成服务
    // 这里提供框架
    log('INFO', '图文视频生成需要集成第三方服务');
    return {
        video_url: 'pending',
        message: '需要配置视频生成服务'
    };
}

// ==================== YouTube 上传模块 ====================

/**
 * 上传视频到 YouTube
 */
async function uploadToYouTube(body) {
    const { video_url, title, description, tags, privacy = 'private' } = body;
    
    if (!CONFIG.YOUTUBE.apiKey) {
        throw new Error('未配置 YouTube API Key');
    }
    
    // YouTube Data API v3
    // 需要 OAuth 2.0 认证
    
    const uploadData = {
        snippet: {
            title,
            description,
            tags,
            categoryId: '22'  // People & Blogs
        },
        status: {
            privacyStatus: privacy
        }
    };
    
    // 实际上传需要 multipart/form-data
    // 这里提供框架
    
    return response(200, {
        success: true,
        data: {
            message: '视频上传成功（示例）',
            video_id: 'youtube_video_id'
        }
    });
}

/**
 * 列出 YouTube 频道视频
 */
async function listYouTubeVideos() {
    if (!CONFIG.YOUTUBE.apiKey) {
        throw new Error('未配置 YouTube API Key');
    }
    
    const response = await axios.get(
        'https://www.googleapis.com/youtube/v3/search',
        {
            params: {
                part: 'snippet',
                channelId: CONFIG.YOUTUBE.channelId,
                order: 'date',
                type: 'video',
                maxResults: 10,
                key: CONFIG.YOUTUBE.apiKey
            }
        }
    );
    
    return response(200, {
        success: true,
        data: response.data.items
    });
}

/**
 * 删除 YouTube 视频
 */
async function deleteYouTubeVideo(body) {
    const { video_id } = body;
    
    // YouTube Data API v3
    // 需要 OAuth 2.0 认证
    
    return response(200, {
        success: true,
        data: {
            message: `视频 ${video_id} 已删除（示例）`
        }
    });
}

// ==================== 一键自动化流程 ====================

/**
 * 自动创建内容（完整流程）
 */
async function autoCreateContent(body) {
    const { topic, platform = 'youtube', style = 'informative' } = body;
    
    log('INFO', `开始自动创建内容：${topic}`);
    
    // 1. 生成脚本
    log('INFO', '步骤 1/3: 生成脚本...');
    const scriptResult = await generateScript({
        topic,
        style,
        duration: 60
    });
    
    const script = scriptResult.body.data.script;
    log('INFO', `脚本生成完成，${script.length}字`);
    
    // 2. 生成视频
    log('INFO', '步骤 2/3: 生成视频...');
    const videoResult = await generateVideo({
        script,
        video_type: 'talking_head'
    });
    
    log('INFO', `视频生成完成：${videoResult.video_url}`);
    
    // 3. 上传到 YouTube
    log('INFO', '步骤 3/3: 上传到 YouTube...');
    const uploadResult = await uploadToYouTube({
        video_url: videoResult.video_url,
        title: topic,
        description: `关于${topic}的分享\n\n#${topic.replace(/\s/g, '')} #AI 生成`,
        tags: [topic, 'AI', '自动化'],
        privacy: 'private'  // 先设为私密，审核后可改为 public
    });
    
    return response(200, {
        success: true,
        data: {
            script: scriptResult.body.data,
            video: videoResult,
            youtube: uploadResult.body.data,
            status: 'completed'
        }
    });
}

// ==================== 工具函数 ====================

/**
 * 调用 LLM API
 */
async function callLLM(prompt) {
    const response = await axios.post(
        `${CONFIG.LLM.baseURL}/chat/completions`,
        {
            model: CONFIG.LLM.model,
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        },
        {
            headers: {
                'Authorization': `Bearer ${CONFIG.LLM.apiKey}`,
                'Content-Type': 'application/json'
            }
        }
    );
    
    return response.data.choices[0].message.content;
}

/**
 * 延时函数
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 统一响应格式
 */
function response(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(body)
    };
}

/**
 * 日志工具
 */
function log(level, ...args) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}][${level}]`, ...args);
}
