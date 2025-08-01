const { chromium } = require('playwright');
const fs = require('fs');

async function compareSites() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 768, height: 1024 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    try {
        // Draft ページ
        const draftPage = await context.newPage();
        await draftPage.goto('http://localhost:8080/draft/', { waitUntil: 'networkidle' });
        await draftPage.waitForTimeout(2000);
        await draftPage.screenshot({ path: 'draft-screenshot.png', fullPage: true });
        console.log('Draft screenshot saved');

        // 002 ページ
        const page002 = await context.newPage();
        await page002.goto('http://localhost:8080/002/', { waitUntil: 'networkidle' });
        await page002.waitForTimeout(2000);
        await page002.screenshot({ path: '002-screenshot.png', fullPage: true });
        console.log('002 screenshot saved');

        // 500px viewport でも確認
        await draftPage.setViewportSize({ width: 500, height: 800 });
        await draftPage.waitForTimeout(1000);
        await draftPage.screenshot({ path: 'draft-500px.png', fullPage: true });
        
        await page002.setViewportSize({ width: 500, height: 800 });
        await page002.waitForTimeout(1000);
        await page002.screenshot({ path: '002-500px.png', fullPage: true });
        console.log('500px screenshots saved');

        // HTMLソースも比較
        const draftHTML = await draftPage.content();
        const html002 = await page002.content();
        
        fs.writeFileSync('draft-source.html', draftHTML);
        fs.writeFileSync('002-source.html', html002);
        console.log('HTML sources saved');

        // 簡単な比較
        if (draftHTML === html002) {
            console.log('✅ HTML sources are identical');
        } else {
            console.log('❌ HTML sources differ');
            console.log('Draft length:', draftHTML.length);
            console.log('002 length:', html002.length);
        }

    } finally {
        await browser.close();
    }
}

compareSites().catch(console.error);