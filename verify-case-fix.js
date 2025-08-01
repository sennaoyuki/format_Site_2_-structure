const { chromium } = require('playwright');

async function verifyFix() {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 修正後のCASEセクションを確認\n');
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    // キャッシュバスト付きでアクセス
    await page.goto(`https://www.xn--ecki4eoz3204ct89aepry34c.com/draft/?cb=${Date.now()}`, {
        waitUntil: 'networkidle'
    });
    
    // CSSファイルの確認
    const cssFiles = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        return links.filter(link => 
            link.href.includes('case-slider-fix') || 
            link.href.includes('styles.css')
        ).map(link => link.href);
    });
    
    console.log('📄 読み込まれたCSS:');
    cssFiles.forEach(css => console.log(`  - ${css}`));
    
    // CASEセクションへ
    await page.evaluate(() => {
        const caseSection = document.querySelector('.case-slider');
        if (caseSection) {
            caseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    await page.waitForTimeout(3000);
    
    // 画像サイズを確認
    const imageInfo = await page.evaluate(() => {
        const img = document.querySelector('.case-slider .slick-slide.slick-current img');
        if (!img) return { found: false };
        
        const rect = img.getBoundingClientRect();
        const styles = window.getComputedStyle(img);
        const slide = img.closest('.slick-slide');
        const slideRect = slide ? slide.getBoundingClientRect() : null;
        
        return {
            found: true,
            displaySize: `${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`,
            naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
            styles: {
                width: styles.width,
                maxWidth: styles.maxWidth,
                height: styles.height,
                maxHeight: styles.maxHeight,
                objectFit: styles.objectFit
            },
            slideWidth: slideRect ? slideRect.width : 0,
            isVisible: rect.width > 100 && rect.height > 50
        };
    });
    
    console.log('\n📸 画像の状態:');
    if (!imageInfo.found) {
        console.log('  ❌ 画像が見つかりません');
    } else {
        console.log(`  表示サイズ: ${imageInfo.displaySize}px`);
        console.log(`  元のサイズ: ${imageInfo.naturalSize}px`);
        console.log(`  width: ${imageInfo.styles.width}`);
        console.log(`  max-width: ${imageInfo.styles.maxWidth}`);
        console.log(`  スライド幅: ${imageInfo.slideWidth}px`);
        console.log(`  表示状態: ${imageInfo.isVisible ? '✅ 正常' : '❌ 小さすぎる'}`);
    }
    
    await page.screenshot({ 
        path: 'case-fix-result.png',
        clip: { x: 0, y: 200, width: 375, height: 400 }
    });
    
    console.log('\n📸 スクリーンショット: case-fix-result.png');
    
    if (!imageInfo.isVisible) {
        console.log('\n⚠️  まだ問題があります。追加の調査が必要です。');
        return false;
    } else {
        console.log('\n✅ 画像が正常に表示されています！');
        return true;
    }
}

// メイン処理
(async () => {
    let attempts = 0;
    let success = false;
    
    while (attempts < 3 && !success) {
        attempts++;
        console.log(`\n========== 試行 ${attempts}/3 ==========`);
        
        success = await verifyFix();
        
        if (!success && attempts < 3) {
            console.log('\n⏳ 30秒待機してから再試行...');
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
    
    process.exit(success ? 0 : 1);
})();