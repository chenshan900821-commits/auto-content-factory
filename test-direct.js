// 直接测试微信公众号发布功能
const { handler } = require('./index.js');

async function test() {
    console.log('📝 测试微信公众号发布功能\n');
    
    // 测试 auto_create_wechat
    console.log('步骤 1: 测试 auto_create_wechat...');
    const result = await handler({
        body: JSON.stringify({
            action: 'auto_create_wechat',
            topic: 'AI 会不会取代程序员',
            style: 'informative'
        })
    }, {});
    
    console.log('\n✅ 响应状态码:', result.statusCode);
    console.log('\n📄 响应内容:');
    const data = JSON.parse(result.body);
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
        console.log('\n🎉 发布成功！');
        if (data.data && data.data.publish) {
            console.log('🔗 文章链接:', data.data.publish.article_url);
        }
    }
    
    console.log('\n=== 测试完成 ===\n');
    process.exit(0);
}

test().catch(err => {
    console.error('❌ 测试失败:', err);
    process.exit(1);
});
