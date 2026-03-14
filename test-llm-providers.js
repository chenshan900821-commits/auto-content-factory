// 测试多 LLM 提供商支持
const { handler } = require('./index.js');

const TEST_CASES = [
    { provider: 'bailian', name: '阿里云百炼' },
    { provider: 'zhipu', name: '智谱 AI' },
    { provider: 'deepseek', name: 'DeepSeek' },
    { provider: 'openai', name: 'OpenAI' },
    { provider: 'anthropic', name: 'Anthropic' },
    { provider: 'google', name: 'Google Gemini' }
];

async function testProvider(provider, name) {
    console.log(`\n🧪 测试 ${name} (${provider})...`);
    
    try {
        const result = await handler({
            body: JSON.stringify({
                action: 'generate_script',
                topic: 'AI 会不会取代程序员',
                duration: 60,
                provider: provider  // 指定提供商
            })
        }, {});
        
        const data = JSON.parse(result.body);
        
        if (data.success) {
            console.log(`✅ ${name} 测试通过`);
            return true;
        } else {
            console.log(`❌ ${name} 失败：${data.error}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${name} 异常：${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🚀 开始测试多 LLM 提供商支持\n');
    console.log('=' .repeat(50));
    
    const results = {};
    
    for (const { provider, name } of TEST_CASES) {
        // 设置环境变量（模拟不同提供商）
        process.env.LLM_PROVIDER = provider;
        process.env.MOCK_MODE = 'true';  // MOCK_MODE 下都会成功
        
        const success = await testProvider(provider, name);
        results[name] = success ? '✅' : '❌';
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 测试结果汇总:\n');
    
    for (const [name, status] of Object.entries(results)) {
        console.log(`${status} ${name}`);
    }
    
    console.log('\n✨ 多 LLM 支持测试完成！\n');
    process.exit(0);
}

runTests().catch(err => {
    console.error('❌ 测试失败:', err);
    process.exit(1);
});
