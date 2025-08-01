const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 すべてのビューポートサイズでCASEセクションを確認\n');
    
    const viewports = [
        { width: 320, name: 'iPhone SE' },
        { width: 375, name: 'iPhone 12' },
        { width: 414, name: 'iPhone Plus' },
        { width: 768, name: 'iPad' },
        { width: 1024, name: 'iPad Pro' }
    ];
    
    await page.goto('https://www.xn--ecki4eoz3204ct89aepry34c.com/draft/', {
        waitUntil: 'networkidle'
    });
    
    for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: 800 });
        
        await page.evaluate(() => {
            const caseSection = document.querySelector('.case-slider');
            if (caseSection) {
                caseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
        
        await page.waitForTimeout(1500);
        
        const imageInfo = await page.evaluate(() => {
            const img = document.querySelector('.case-slider .slick-slide.slick-current img');
            if (!img) return null;
            
            const rect = img.getBoundingClientRect();
            const styles = window.getComputedStyle(img);
            
            return {
                width: rect.width.toFixed(0),
                height: rect.height.toFixed(0),
                maxWidth: styles.maxWidth,
                centered: Math.abs(rect.left + rect.width/2 - window.innerWidth/2) < 10
            };
        });
        
        console.log(`📱 ${viewport.name} (${viewport.width}px):`);
        if (imageInfo) {
            console.log(`  サイズ: ${imageInfo.width}x${imageInfo.height}px`);
            console.log(`  max-width: ${imageInfo.maxWidth}`);
            console.log(`  中央寄せ: ${imageInfo.centered ? '✅' : '⚠️'}`);
        } else {
            console.log('  ❌ 画像が見つかりません');
        }
        
        await page.screenshot({ 
            path: `case-${viewport.width}px.png`,
            clip: { x: 0, y: 200, width: viewport.width, height: 400 }
        });
    }
    
    console.log('\n✅ すべてのビューポートサイズで確認完了');
    
    await browser.close();
})();