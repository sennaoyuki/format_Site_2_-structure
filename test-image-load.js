const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    
    const page = await context.newPage();
    
    // ネットワークリクエストを監視
    const imageRequests = [];
    page.on('request', request => {
        if (request.resourceType() === 'image') {
            imageRequests.push({
                url: request.url(),
                method: request.method()
            });
        }
    });
    
    page.on('requestfailed', request => {
        if (request.resourceType() === 'image') {
            console.log('❌ 画像読み込み失敗:', request.url(), request.failure().errorText);
        }
    });
    
    page.on('response', response => {
        if (response.request().resourceType() === 'image') {
            console.log(`📸 画像レスポンス: ${response.url()} - Status: ${response.status()}`);
        }
    });
    
    // ページを開く
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    console.log('⏳ ページ読み込み完了、5秒待機...');
    await page.waitForTimeout(5000);
    
    // 画像リクエストを表示
    console.log('\n📋 画像リクエスト一覧:');
    imageRequests.forEach((req, i) => {
        console.log(`${i + 1}. ${req.url}`);
    });
    
    // CASEセクションの画像要素を確認
    const caseImages = await page.evaluate(() => {
        const images = document.querySelectorAll('.case-slider img');
        return Array.from(images).map(img => ({
            src: img.src,
            alt: img.alt,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            offsetWidth: img.offsetWidth,
            offsetHeight: img.offsetHeight,
            display: window.getComputedStyle(img).display,
            visibility: window.getComputedStyle(img).visibility
        }));
    });
    
    console.log('\n📊 CASEセクション画像の状態:');
    caseImages.forEach((img, i) => {
        console.log(`\n画像 ${i + 1}:`);
        console.log(`  src: ${img.src}`);
        console.log(`  alt: ${img.alt}`);
        console.log(`  読み込み完了: ${img.complete}`);
        console.log(`  実サイズ: ${img.naturalWidth}x${img.naturalHeight}`);
        console.log(`  表示サイズ: ${img.offsetWidth}x${img.offsetHeight}`);
        console.log(`  display: ${img.display}`);
        console.log(`  visibility: ${img.visibility}`);
    });
    
    // 画像が読み込まれていない場合、手動で再読み込み
    if (caseImages.some(img => !img.complete || img.naturalWidth === 0)) {
        console.log('\n🔄 画像を再読み込み中...');
        await page.evaluate(() => {
            document.querySelectorAll('.case-slider img').forEach(img => {
                const src = img.src;
                img.src = '';
                img.src = src;
            });
        });
        await page.waitForTimeout(2000);
    }
    
    // 再度スクリーンショット
    const caseSection = await page.$('.clinic-points-section:has(h4:has-text("CASE"))');
    if (caseSection) {
        await caseSection.screenshot({ path: 'sp-case-with-images.png' });
        console.log('\n📷 スクリーンショット保存: sp-case-with-images.png');
    }
    
    // 10秒待機
    console.log('\n⏳ 10秒後にブラウザを閉じます...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();