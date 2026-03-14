// 测试实时热点搜索功能
const { handler } = require('./index.js');

async function testRealtimeHotspots() {
    console.log('🔍 测试实时热点搜索功能\n');
    console.log('='.repeat(60));
    
    // 1. 获取微博热搜
    console.log('\n📊 1. 获取微博热搜（实时）...');
    const weiboResult = await handler({
        body: JSON.stringify({
            action: 'get_weibo_hot',
            limit: 5
        })
    }, {});
    
    const weiboData = JSON.parse(weiboResult.body);
    if (weiboData.success && weiboData.data.length > 0) {
        console.log(`✅ 获取到 ${weiboData.data.length} 条微博热搜`);
        weiboData.data.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.title} (热度：${item.hot_value})`);
        });
    } else {
        console.log('❌ 微博热搜获取失败');
    }
    
    // 2. 获取知乎热榜
    console.log('\n📚 2. 获取知乎热榜（实时）...');
    const zhihuResult = await handler({
        body: JSON.stringify({
            action: 'get_zhihu_hot',
            limit: 5
        })
    }, {});
    
    const zhihuData = JSON.parse(zhihuResult.body);
    if (zhihuData.success && zhihuData.data.length > 0) {
        console.log(`✅ 获取到 ${zhihuData.data.length} 条知乎热榜`);
        zhihuData.data.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.title}`);
        });
    } else {
        console.log('❌ 知乎热榜获取失败');
    }
    
    // 3. 获取百度热搜
    console.log('\n🔍 3. 获取百度热搜（实时）...');
    const baiduResult = await handler({
        body: JSON.stringify({
            action: 'get_baidu_hot',
            limit: 5
        })
    }, {});
    
    const baiduData = JSON.parse(baiduResult.body);
    if (baiduData.success && baiduData.data.length > 0) {
        console.log(`✅ 获取到 ${baiduData.data.length} 条百度热搜`);
        baiduData.data.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.title} (热度：${item.hot_value})`);
        });
    } else {
        console.log('❌ 百度热搜获取失败');
    }
    
    // 4. 聚合搜索
    console.log('\n🌐 4. 聚合搜索 "AI 技术" ...');
    const searchResult = await handler({
        body: JSON.stringify({
            action: 'search_hotspots',
            keyword: 'AI 技术',
            platforms: ['weibo', 'zhihu', 'baidu'],
            limit: 3
        })
    }, {});
    
    const searchData = JSON.parse(searchResult.body);
    if (searchData.success) {
        console.log('✅ 聚合搜索结果:');
        for (const [platform, results] of Object.entries(searchData.data)) {
            if (results && results.length > 0) {
                console.log(`\n   ${platform.toUpperCase()}:`);
                results.forEach((item, i) => {
                    console.log(`      ${i + 1}. ${item.title}`);
                });
            }
        }
    }
    
    // 5. 获取全网热点
    console.log('\n\n📈 5. 获取全网热点（聚合）...');
    const allResult = await handler({
        body: JSON.stringify({
            action: 'get_hotspots',
            platform: 'all',
            limit: 3
        })
    }, {});
    
    const allData = JSON.parse(allResult.body);
    if (allData.success) {
        console.log('✅ 全网热点概览:');
        for (const [platform, results] of Object.entries(allData.data)) {
            if (results && results.length > 0) {
                console.log(`\n   ${platform.toUpperCase()}: ${results.length} 条`);
                console.log(`      🔥 ${results[0].title}`);
            }
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✨ 实时热点搜索测试完成！\n');
    console.log('💡 提示：MOCK_MODE 下返回模拟数据，关闭后获取真实数据\n');
    
    process.exit(0);
}

testRealtimeHotspots().catch(err => {
    console.error('❌ 测试失败:', err);
    process.exit(1);
});
