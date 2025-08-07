const { chromium } = require('playwright');

async function testRedirect() {
    console.log('🚀 Playwright - リダイレクトテスト開始');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // キャッシュを無効にする
    await page.setExtraHTTPHeaders({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    // CDPでキャッシュをクリア
    const client = await context.newCDPSession(page);
    await client.send('Network.clearBrowserCache');
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });
    
    try {
        // コンソールログをキャプチャ
        page.on('console', msg => {
            if (msg.text().includes('🔄') || msg.text().includes('🔍') || msg.text().includes('✅')) {
                console.log(`📊 Browser Log: ${msg.text()}`);
            }
        });
        
        console.log('🌐 医療ダイエット001ページに移動中...');
        await page.goto('http://localhost:8090/medical-diet001/?region_id=013&gclid=555555&ad_id=test1234&utm_creative=12345&max_scroll=25&cache_bust=' + Date.now());
        
        console.log('⏳ ページ読み込み完了まで待機...');
        await page.waitForLoadState('networkidle');
        
        console.log('🔍 ディオクリニックリンクを探索...');
        
        // 複数の可能なセレクタを試す
        const selectors = [
            'a[href*="/go/dio"]',
            'a[href*="dio"]',
            '.ranking-item a',
            '.clinic-detail-card a',
            'a:has-text("ディオクリニック")',
            'a:has-text("詳細")',
            'button:has-text("詳細")'
        ];
        
        let clickableElement = null;
        for (const selector of selectors) {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
                console.log(`✅ 発見: ${selector} (${elements.length}個)`);
                clickableElement = elements[0];
                break;
            }
        }
        
        if (!clickableElement) {
            console.log('❌ クリック可能な要素が見つかりません');
            
            // ページの内容を確認
            console.log('📋 現在のページ内容:');
            const links = await page.$$eval('a', links => 
                links.map(link => ({ 
                    text: link.textContent?.trim(), 
                    href: link.getAttribute('href') 
                })).filter(link => link.text && link.href)
            );
            console.log('🔗 利用可能なリンク:', links.slice(0, 10));
            
            await browser.close();
            return;
        }
        
        console.log('🎯 クリック前のURL:', page.url());
        
        // 新しいタブを待機してクリック
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            clickableElement.click()
        ]);
        
        // 新しいページのコンソールログもキャプチャ
        newPage.on('console', msg => {
            if (msg.text().includes('🔍') || msg.text().includes('✅') || msg.text().includes('⚠️') || msg.text().includes('❌')) {
                console.log(`📊 Redirect Page Log: ${msg.text()}`);
            }
        });
        
        // 新しいページの読み込みを待つ（リダイレクトページの処理を待機）
        await newPage.waitForLoadState('networkidle');
        
        // リダイレクトページでの処理を少し待つ
        await newPage.waitForTimeout(2000);
        
        const finalUrl = newPage.url();
        console.log('🎯 新しいタブのURL:', finalUrl);
        
        // 期待されるパターンをチェック
        if (finalUrl.includes('/medical-diet001/go/dio/')) {
            console.log('✅ 成功: 相対パスリダイレクトが動作しています！');
            console.log('📊 最終URL:', finalUrl);
            
            // パラメータ確認
            const url = new URL(finalUrl);
            const params = Object.fromEntries(url.searchParams);
            console.log('📋 パラメータ:', params);
            
            // 新しいタブを閉じる
            await newPage.close();
            
        } else if (finalUrl.includes('/go/dio/')) {
            console.log('⚠️ 部分成功: リダイレクトは動作するが、まだ絶対パスを使用');
            console.log('📊 実際のURL:', finalUrl);
        } else {
            console.log('❌ 失敗: 期待されるリダイレクトが発生していません');
            console.log('📊 実際のURL:', finalUrl);
        }
        
    } catch (error) {
        console.log('❌ エラー:', error.message);
    } finally {
        await browser.close();
    }
}

// npm install playwright が必要かチェック
(async () => {
    try {
        await testRedirect();
    } catch (error) {
        if (error.message.includes('playwright')) {
            console.log('📦 Playwrightをインストール中...');
            const { exec } = require('child_process');
            exec('npm install playwright', (error, stdout, stderr) => {
                if (error) {
                    console.log('❌ Playwrightインストールエラー:', error.message);
                } else {
                    console.log('✅ Playwrightインストール完了');
                    console.log('🔄 テストを再実行してください: node test-redirect.js');
                }
            });
        } else {
            console.log('❌ 予期しないエラー:', error.message);
        }
    }
})();