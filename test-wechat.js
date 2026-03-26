// 测试微信公众号发布
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:8000';

async function testPublish() {
    console.log('📝 开始测试微信公众号发布...\n');
    
    // 1. 先测试一键生成并发布
    console.log('步骤 1: 生成并发布文章...');
    try {
        const response = await axios.post(BASE_URL, {
            action: 'auto_create_wechat',
            topic: 'AI 会不会取代程序员',
            style: 'informative'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('✅ 发布成功！');
        console.log('\n📄 文章信息:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.data && response.data.data.publish) {
            console.log('\n🔗 文章链接:', response.data.data.publish.article_url);
        }
        
    } catch (error) {
        console.error('❌ 发布失败:', error.message);
        if (error.response) {
            console.error('响应:', error.response.data);
        }
    }
    
    console.log('\n=== 测试完成 ===\n');
    process.exit(0);
}

// 先启动服务器
const { spawn } = require('child_process');

console.log('🚀 启动本地服务器...');
const server = spawn('node', ['index.js'], {
    env: { ...process.env, MOCK_MODE: 'true' },
    stdio: 'inherit'
});

// 等待 2 秒后执行测试
setTimeout(() => {
    testPublish().then(() => {
        server.kill();
    });
}, 2000);
