const { chromium } = require('playwright');
const path = require('path');

async function captureCarouselScreenshots() {
    const browser = await chromium.launch();
    
    try {
        // デバッグページのキャプチャ
        const debugPath = `file://${path.join(__dirname, 'public/draft/debug-carousel.html')}`;
        
        // PC版
        const contextPC = await browser.newContext({
            viewport: { width: 1200, height: 800 }
        });
        const pagePC = await contextPC.newPage();
        await pagePC.goto(debugPath);
        await pagePC.waitForTimeout(1000);
        await pagePC.screenshot({ 
            path: 'carousel-pc-1200px.png',
            fullPage: true 
        });
        await contextPC.close();
        
        // iPad
        const contextTablet = await browser.newContext({
            viewport: { width: 768, height: 1024 }
        });
        const pageTablet = await contextTablet.newPage();
        await pageTablet.goto(debugPath);
        await pageTablet.waitForTimeout(1000);
        await pageTablet.screenshot({ 
            path: 'carousel-tablet-768px.png',
            fullPage: true 
        });
        await contextTablet.close();
        
        // iPhone 14 Pro Max (430px)
        const context430 = await browser.newContext({
            viewport: { width: 430, height: 932 }
        });
        const page430 = await context430.newPage();
        await page430.goto(debugPath);
        await page430.waitForTimeout(1000);
        await page430.screenshot({ 
            path: 'carousel-iphone14promax-430px.png',
            fullPage: true 
        });
        await context430.close();
        
        // iPhone 14 Plus (414px)
        const context414 = await browser.newContext({
            viewport: { width: 414, height: 896 }
        });
        const page414 = await context414.newPage();
        await page414.goto(debugPath);
        await page414.waitForTimeout(1000);
        await page414.screenshot({ 
            path: 'carousel-iphone14plus-414px.png',
            fullPage: true 
        });
        await context414.close();
        
        // iPhone 13/12 (375px)
        const context375 = await browser.newContext({
            viewport: { width: 375, height: 667 }
        });
        const page375 = await context375.newPage();
        await page375.goto(debugPath);
        await page375.waitForTimeout(1000);
        await page375.screenshot({ 
            path: 'carousel-iphone-375px.png',
            fullPage: true 
        });
        await context375.close();
        
        // iPhone SE (320px)
        const context320 = await browser.newContext({
            viewport: { width: 320, height: 568 }
        });
        const page320 = await context320.newPage();
        await page320.goto(debugPath);
        await page320.waitForTimeout(1000);
        await page320.screenshot({ 
            path: 'carousel-iphoneSE-320px.png',
            fullPage: true 
        });
        await context320.close();
        
        // テストページのキャプチャ（複数サイズ）
        const testPath = `file://${path.join(__dirname, 'public/draft/test-carousel.html')}`;
        
        const testContext = await browser.newContext({
            viewport: { width: 375, height: 667 }
        });
        const testPage = await testContext.newPage();
        await testPage.goto(testPath);
        await testPage.waitForTimeout(1000);
        await testPage.screenshot({ 
            path: 'carousel-test-page.png',
            fullPage: true 
        });
        await testContext.close();
        
        // 実装サマリーページ
        const summaryPath = `file://${path.join(__dirname, 'carousel-implementation-summary.html')}`;
        const summaryContext = await browser.newContext({
            viewport: { width: 1200, height: 800 }
        });
        const summaryPage = await summaryContext.newPage();
        await summaryPage.goto(summaryPath);
        await summaryPage.waitForTimeout(1000);
        await summaryPage.screenshot({ 
            path: 'carousel-implementation-summary.png',
            fullPage: true 
        });
        await summaryContext.close();
        
        console.log('すべてのスクリーンショットが完了しました！');
        
    } catch (error) {
        console.error('エラー:', error);
    } finally {
        await browser.close();
    }
}

// 実行
captureCarouselScreenshots();