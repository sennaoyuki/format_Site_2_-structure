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
    
    // ページを開く
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    console.log('⏳ ページ読み込み完了、5秒待機...');
    await page.waitForTimeout(5000);
    
    // CASEスライダーの手動初期化
    console.log('🔧 スライダーを手動で初期化...');
    await page.evaluate(() => {
        if (typeof initCaseSlider === 'function') {
            initCaseSlider();
        }
    });
    
    await page.waitForTimeout(2000);
    
    // CASEセクションを直接検索
    console.log('🔍 CASEセクションを検索中...');
    
    // すべてのh4要素を確認
    const h4Texts = await page.$$eval('h4', elements => 
        elements.map(el => ({ text: el.textContent, className: el.className }))
    );
    console.log('📋 h4要素:', h4Texts);
    
    // CASEセクションのHTML構造を確認
    const caseHtml = await page.evaluate(() => {
        const caseH4 = Array.from(document.querySelectorAll('h4')).find(h4 => h4.textContent.includes('CASE'));
        if (caseH4) {
            return {
                found: true,
                parentHTML: caseH4.parentElement ? caseH4.parentElement.outerHTML.substring(0, 500) : null,
                sliderExists: !!caseH4.parentElement?.querySelector('.case-slider'),
                initialized: !!caseH4.parentElement?.querySelector('.case-slider.slick-initialized')
            };
        }
        return { found: false };
    });
    
    console.log('📊 CASEセクション情報:', caseHtml);
    
    if (caseHtml.found && caseHtml.sliderExists) {
        // CASEセクションまでスクロール
        await page.evaluate(() => {
            const caseH4 = Array.from(document.querySelectorAll('h4')).find(h4 => h4.textContent.includes('CASE'));
            if (caseH4) {
                caseH4.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
        
        await page.waitForTimeout(1000);
        
        // スクリーンショットを撮影
        const caseSection = await page.$('.clinic-points-section:has(h4:has-text("CASE"))');
        if (caseSection) {
            await caseSection.screenshot({ path: 'sp-case-debug.png' });
            console.log('📷 スクリーンショット保存: sp-case-debug.png');
        }
    }
    
    // 10秒待機
    console.log('⏳ 10秒後にブラウザを閉じます...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();