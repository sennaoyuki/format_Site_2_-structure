const puppeteer = require('puppeteer');
const path = require('path');

async function captureCarouselImplementation() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    try {
        // テストページのキャプチャ
        const page1 = await browser.newPage();
        const testCarouselPath = `file://${path.join(__dirname, 'public/draft/test-carousel.html')}`;
        await page1.goto(testCarouselPath, { waitUntil: 'networkidle2' });
        await page1.waitForTimeout(1000);
        
        // PC版
        await page1.setViewport({ width: 1200, height: 800 });
        await page1.screenshot({ 
            path: 'carousel-test-pc.png',
            fullPage: true 
        });
        
        // タブレット版
        await page1.setViewport({ width: 768, height: 1024 });
        await page1.screenshot({ 
            path: 'carousel-test-tablet.png',
            fullPage: true 
        });
        
        // スマホ版（375px）
        await page1.setViewport({ width: 375, height: 667 });
        await page1.screenshot({ 
            path: 'carousel-test-iphone.png',
            fullPage: true 
        });
        
        // デバッグページのキャプチャ
        const page2 = await browser.newPage();
        const debugCarouselPath = `file://${path.join(__dirname, 'public/draft/debug-carousel.html')}`;
        await page2.goto(debugCarouselPath, { waitUntil: 'networkidle2' });
        await page2.waitForTimeout(1000);
        
        // 各画面サイズでキャプチャ
        const sizes = [
            { name: '320px', width: 320, height: 568 },
            { name: '375px', width: 375, height: 667 },
            { name: '414px', width: 414, height: 896 },
            { name: '768px', width: 768, height: 1024 }
        ];
        
        for (const size of sizes) {
            await page2.setViewport({ width: size.width, height: size.height });
            await page2.waitForTimeout(500);
            await page2.screenshot({ 
                path: `carousel-debug-${size.name}.png`,
                fullPage: true 
            });
        }
        
        console.log('キャプチャが完了しました！');
        
    } catch (error) {
        console.error('エラー:', error);
    } finally {
        await browser.close();
    }
}

// 実行
captureCarouselImplementation();