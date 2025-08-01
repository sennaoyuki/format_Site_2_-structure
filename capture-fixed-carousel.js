const { chromium } = require('playwright');
const path = require('path');

async function captureFixedCarousel() {
    const browser = await chromium.launch();
    
    try {
        // 修正版のカルーセルページ
        const workingPath = `file://${path.join(__dirname, 'public/draft/working-carousel-fix.html')}`;
        
        // iPhone版（375px）
        const context375 = await browser.newContext({
            viewport: { width: 375, height: 667 }
        });
        const page375 = await context375.newPage();
        await page375.goto(workingPath);
        await page375.waitForTimeout(1000);
        await page375.screenshot({ 
            path: 'fixed-carousel-375px.png',
            fullPage: true 
        });
        await context375.close();
        
        // デバッグページの再撮影
        const debugPath = `file://${path.join(__dirname, 'public/draft/debug-carousel.html')}`;
        
        const debugContext = await browser.newContext({
            viewport: { width: 375, height: 667 }
        });
        const debugPage = await debugContext.newPage();
        await debugPage.goto(debugPath);
        await debugPage.waitForTimeout(1000);
        
        // スクロール位置を変更してカルーセルの動作を確認
        await debugPage.evaluate(() => {
            const carousel = document.querySelector('.case-carousel-container');
            if (carousel) {
                // 2番目のスライドに移動
                carousel.scrollTo({
                    left: carousel.clientWidth,
                    behavior: 'smooth'
                });
            }
        });
        
        await debugPage.waitForTimeout(1000);
        await debugPage.screenshot({ 
            path: 'fixed-carousel-debug-slide2.png',
            fullPage: true 
        });
        await debugContext.close();
        
        console.log('修正版のスクリーンショットが完了しました！');
        
    } catch (error) {
        console.error('エラー:', error);
    } finally {
        await browser.close();
    }
}

// 実行
captureFixedCarousel();