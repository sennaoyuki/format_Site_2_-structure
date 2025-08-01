const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    // PC版とSP版の両方をテスト
    const tests = [
        { name: 'PC版', viewport: { width: 1200, height: 800 }, userAgent: null },
        { name: 'SP版 (375px)', viewport: { width: 375, height: 667 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' }
    ];
    
    for (const test of tests) {
        console.log(`\n========== ${test.name}のテスト ==========`);
        
        const context = await browser.newContext({
            viewport: test.viewport,
            userAgent: test.userAgent || undefined
        });
        
        const page = await context.newPage();
        
        // ページを開く
        await page.goto('http://localhost:8090/draft/?region_id=013', {
            waitUntil: 'networkidle'
        });
        
        console.log('⏳ ページ読み込み完了、5秒待機...');
        await page.waitForTimeout(5000);
        
        // 手動初期化
        await page.evaluate(() => {
            if (typeof initCaseSlider === 'function') {
                initCaseSlider();
            }
        });
        
        await page.waitForTimeout(2000);
        
        // CASEセクションの状態確認
        const caseStatus = await page.evaluate(() => {
            const caseH4 = Array.from(document.querySelectorAll('h4')).find(h4 => h4.textContent.includes('CASE'));
            if (!caseH4) return { found: false };
            
            const section = caseH4.closest('.clinic-points-section');
            const slider = section?.querySelector('.case-slider');
            const images = slider?.querySelectorAll('img');
            
            return {
                found: true,
                sliderExists: !!slider,
                initialized: slider?.classList.contains('slick-initialized'),
                imageCount: images?.length || 0,
                firstImageSrc: images?.[0]?.src,
                firstImageDimensions: images?.[0] ? {
                    natural: `${images[0].naturalWidth}x${images[0].naturalHeight}`,
                    display: `${images[0].offsetWidth}x${images[0].offsetHeight}`
                } : null
            };
        });
        
        console.log('📊 CASEセクション状態:', caseStatus);
        
        if (caseStatus.found && caseStatus.sliderExists) {
            // CASEセクションまでスクロール
            await page.evaluate(() => {
                const caseH4 = Array.from(document.querySelectorAll('h4')).find(h4 => h4.textContent.includes('CASE'));
                caseH4?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            
            await page.waitForTimeout(1000);
            
            // スクリーンショット撮影
            const caseSection = await page.$('.clinic-points-section:has(h4:has-text("CASE"))');
            if (caseSection) {
                const filename = test.name === 'PC版' ? 'pc-case-final.png' : 'sp-case-final.png';
                await caseSection.screenshot({ path: filename });
                console.log(`📷 スクリーンショット保存: ${filename}`);
                
                // 次へボタンをクリック
                const nextButton = await page.$('.case-slider .slick-next');
                if (nextButton && caseStatus.initialized) {
                    console.log('🖱️ 次へボタンをクリック...');
                    await nextButton.click();
                    await page.waitForTimeout(600);
                    
                    const filename2 = test.name === 'PC版' ? 'pc-case-final-next.png' : 'sp-case-final-next.png';
                    await caseSection.screenshot({ path: filename2 });
                    console.log(`📷 次のスライド: ${filename2}`);
                }
            }
        }
        
        await context.close();
    }
    
    console.log('\n✅ すべてのテスト完了');
    
    // 5秒待機してからブラウザを閉じる
    await page.waitForTimeout(5000);
    await browser.close();
})();