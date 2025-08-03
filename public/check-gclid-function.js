const { chromium } = require('playwright');

async function checkGclidFunction() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // テストするGCLID
    const testGclid = 'TEST_GCLID_' + Date.now();
    
    try {
        console.log('🧪 GCLID置換機能テスト開始');
        console.log('📝 テストGCLID:', testGclid);
        
        // medical-diet001にGCLID付きでアクセス
        const testUrl = `https://www.xn--ecki4eoz3204ct89aepry34c.com/medical-diet001/?gclid=${testGclid}`;
        console.log('🌐 アクセスURL:', testUrl);
        
        await page.goto(testUrl, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // ディオクリニックのリンクを取得
        const dioLinks = await page.$$eval('a[href*="/go/dio/"]', links => 
            links.map(link => ({
                text: link.textContent.trim(),
                href: link.href
            }))
        );
        
        console.log('🔍 見つかったディオクリニックリンク数:', dioLinks.length);
        
        if (dioLinks.length > 0) {
            // 最初のリンクをクリック
            const firstLink = await page.$('a[href*="/go/dio/"]');
            console.log('🖱️ リンクをクリック:', dioLinks[0].text);
            
            // 新しいページを待機
            const [newPage] = await Promise.all([
                context.waitForEvent('page'),
                firstLink.click()
            ]);
            
            await newPage.waitForLoadState('domcontentloaded');
            await newPage.waitForTimeout(3000);
            
            // 最終的なURLを取得
            const finalUrl = newPage.url();
            console.log('🎯 最終遷移先URL:', finalUrl);
            
            // param3にGCLIDが含まれているか確認
            if (finalUrl.includes(`param3=${testGclid}`)) {
                console.log('✅ 成功: GCLIDが正しく置換されました！');
                console.log('   param3=' + testGclid + ' が確認できました');
            } else if (finalUrl.includes('param3=')) {
                console.log('⚠️  警告: param3は存在しますが、GCLIDが正しく置換されていません');
                const param3Match = finalUrl.match(/param3=([^&]*)/);
                if (param3Match) {
                    console.log('   実際のparam3値:', param3Match[1]);
                }
            } else {
                console.log('❌ エラー: param3が見つかりません');
            }
            
            await newPage.close();
        } else {
            console.log('❌ エラー: ディオクリニックのリンクが見つかりません');
        }
        
    } catch (error) {
        console.error('❌ テスト中にエラー:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 テスト完了');
    }
}

checkGclidFunction();