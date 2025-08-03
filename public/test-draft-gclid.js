const { chromium } = require('playwright');

async function testDraftGclid() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // コンソールログを監視
        page.on('console', msg => {
            console.log(`[ブラウザ] ${msg.text()}`);
        });
        
        // テストGCLIDでアクセス
        const testGclid = 'TEST_DRAFT_' + Date.now();
        const url = `https://www.xn--ecki4eoz3204ct89aepry34c.com/draft/go/dio/?gclid=${testGclid}`;
        
        console.log('🧪 Draft環境のGCLID置換テスト');
        console.log('📝 テストGCLID:', testGclid);
        console.log('🌐 アクセスURL:', url);
        
        // ページを開く前にリクエストを監視
        page.on('request', request => {
            const url = request.url();
            if (url.includes('sss.ac01.l-ad.net')) {
                console.log('🎯 アフィリエイトURL:', url);
                
                // param3を確認
                if (url.includes('param3=')) {
                    const param3Match = url.match(/param3=([^&]*)/);
                    if (param3Match) {
                        console.log('✅ param3検出:', param3Match[1]);
                        if (param3Match[1] === testGclid) {
                            console.log('✅ GCLID置換成功！');
                        } else if (param3Match[1] === '[GCLID_PLACEHOLDER]') {
                            console.log('❌ GCLID置換失敗：プレースホルダーのまま');
                        } else if (param3Match[1] === '') {
                            console.log('⚠️ param3は空');
                        }
                    }
                } else {
                    console.log('❌ param3が見つかりません');
                }
            }
        });
        
        await page.goto(url);
        await page.waitForTimeout(5000);
        
    } catch (error) {
        console.error('❌ エラー:', error.message);
    } finally {
        await browser.close();
    }
}

testDraftGclid();