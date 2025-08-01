const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 CASEセクションの画像を詳細確認\n');
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('https://www.xn--ecki4eoz3204ct89aepry34c.com/draft/', {
        waitUntil: 'networkidle'
    });
    
    // CASEセクションまでスクロール
    await page.evaluate(() => {
        const caseSection = document.querySelector('.case-slider');
        if (caseSection) {
            caseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    await page.waitForTimeout(3000); // 画像読み込みを待つ
    
    // すべての画像を確認
    const imageInfo = await page.evaluate(() => {
        const images = document.querySelectorAll('.case-slider img');
        const results = [];
        
        images.forEach((img, index) => {
            const rect = img.getBoundingClientRect();
            const styles = window.getComputedStyle(img);
            const parent = img.closest('.slick-slide');
            const isActive = parent && parent.classList.contains('slick-current');
            
            results.push({
                index,
                src: img.src,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                displayWidth: rect.width,
                displayHeight: rect.height,
                complete: img.complete,
                isActive,
                styles: {
                    width: styles.width,
                    height: styles.height,
                    maxWidth: styles.maxWidth,
                    maxHeight: styles.maxHeight,
                    objectFit: styles.objectFit
                }
            });
        });
        
        return results;
    });
    
    console.log('📸 画像の詳細情報:');
    imageInfo.forEach(img => {
        console.log(`\n画像 ${img.index + 1}${img.isActive ? ' (アクティブ)' : ''}:`);
        console.log(`  URL: ${img.src}`);
        console.log(`  元のサイズ: ${img.naturalWidth}x${img.naturalHeight}px`);
        console.log(`  表示サイズ: ${img.displayWidth.toFixed(0)}x${img.displayHeight.toFixed(0)}px`);
        console.log(`  読み込み完了: ${img.complete ? '✅' : '❌'}`);
        console.log(`  スタイル:`);
        console.log(`    width: ${img.styles.width}`);
        console.log(`    max-width: ${img.styles.maxWidth}`);
        console.log(`    height: ${img.styles.height}`);
        console.log(`    max-height: ${img.styles.maxHeight}`);
        console.log(`    object-fit: ${img.styles.objectFit}`);
    });
    
    // スライダー全体のサイズも確認
    const sliderInfo = await page.evaluate(() => {
        const slider = document.querySelector('.case-slider');
        const slickList = document.querySelector('.case-slider .slick-list');
        const slickTrack = document.querySelector('.case-slider .slick-track');
        
        const getSize = (elem) => {
            if (!elem) return null;
            const rect = elem.getBoundingClientRect();
            return {
                width: rect.width,
                height: rect.height
            };
        };
        
        return {
            slider: getSize(slider),
            slickList: getSize(slickList),
            slickTrack: getSize(slickTrack)
        };
    });
    
    console.log('\n📐 コンテナのサイズ:');
    console.log(`  スライダー: ${sliderInfo.slider ? `${sliderInfo.slider.width}x${sliderInfo.slider.height}px` : 'N/A'}`);
    console.log(`  slick-list: ${sliderInfo.slickList ? `${sliderInfo.slickList.width}x${sliderInfo.slickList.height}px` : 'N/A'}`);
    console.log(`  slick-track: ${sliderInfo.slickTrack ? `${sliderInfo.slickTrack.width}x${sliderInfo.slickTrack.height}px` : 'N/A'}`);
    
    await browser.close();
})();