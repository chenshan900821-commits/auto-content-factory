// 测试脚本

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';  // 本地测试
// const BASE_URL = 'https://你的函数 URL.apigateway.cn-hangzhou.aliyuncs.com';  // 线上测试

async function test(action, data = {}) {
    try {
        console.log(`\n测试：${action}`);
        const response = await axios.post(BASE_URL, {
            action,
            ...data
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ 成功:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ 失败:', error.message);
        return null;
    }
}

// 运行测试
(async () => {
    console.log('=== AutoContent Factory 测试 ===\n');
    
    // 1. 健康检查
    await test('health');
    
    // 2. 获取热点
    await test('get_hotspots', { platform: 'all', limit: 5 });
    
    // 3. 生成口播稿
    const script = await test('generate_script', {
        topic: 'AI 会不会取代程序员',
        duration: 60
    });
    
    // 4. 分析热点
    await test('analyze_hotspot', {
        topic: 'AI 会不会取代程序员',
        platform: 'youtube'
    });
    
    // 5. 一键生成（需要配置视频生成 API）
    // await test('auto_create', {
    //     topic: 'AI 会不会取代程序员',
    //     platform: 'youtube'
    // });
    
    console.log('\n=== 测试完成 ===\n');
})();
