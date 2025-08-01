const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 CASEセクションの高さ設定を確認\n');
    
    // モバイルサイズでテスト
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:8090/draft/', {
        waitUntil: 'networkidle'
    });
    
    await page.waitForTimeout(2000);
    
    // CASEセクションまでスクロール
    await page.evaluate(() => {
        const caseSection = document.querySelector('.case-slider');
        if (caseSection) {
            caseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    await page.waitForTimeout(1000);
    
    const caseInfo = await page.evaluate(() => {
        const slider = document.querySelector('.case-slider');
        const slickList = document.querySelector('.case-slider.slick-initialized .slick-list');
        const slickTrack = document.querySelector('.case-slider.slick-initialized .slick-track');
        const slickSlide = document.querySelector('.case-slider.slick-initialized .slick-slide');
        const img = document.querySelector('.case-slider .slick-slide img');
        
        const getHeightInfo = (elem, name) => {
            if (!elem) return null;
            const styles = window.getComputedStyle(elem);
            const rect = elem.getBoundingClientRect();
            return {
                name,
                height: styles.height,
                maxHeight: styles.maxHeight,
                actualHeight: rect.height
            };
        };
        
        return {
            slider: getHeightInfo(slider, 'case-slider'),
            slickList: getHeightInfo(slickList, 'slick-list'),
            slickTrack: getHeightInfo(slickTrack, 'slick-track'),
            slickSlide: getHeightInfo(slickSlide, 'slick-slide'),
            image: getHeightInfo(img, 'image')
        };
    });
    
    console.log('📐 CASEセクションの高さ情報:');
    Object.entries(caseInfo).forEach(([key, info]) => {
        if (info) {
            console.log(`\n${info.name}:`);
            console.log(`  height: ${info.height}`);
            console.log(`  max-height: ${info.maxHeight}`);
            console.log(`  実際の高さ: ${info.actualHeight}px`);
        }
    });
    
    // スクリーンショットを撮る
    await page.screenshot({ 
        path: 'case-section-mobile.png',
        clip: {
            x: 0,
            y: 200,
            width: 375,
            height: 500
        }
    });
    
    // PCサイズでもテスト
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);
    
    const pcCaseInfo = await page.evaluate(() => {
        const img = document.querySelector('.case-slider .slick-slide img');
        if (!img) return null;
        
        const styles = window.getComputedStyle(img);
        const rect = img.getBoundingClientRect();
        return {
            height: styles.height,
            maxHeight: styles.maxHeight,
            actualHeight: rect.height
        };
    });
    
    console.log('\n\n📐 PC版での画像高さ:');
    if (pcCaseInfo) {
        console.log(`  height: ${pcCaseInfo.height}`);
        console.log(`  max-height: ${pcCaseInfo.maxHeight}`);
        console.log(`  実際の高さ: ${pcCaseInfo.actualHeight}px`);
    }
    
    console.log('\n💡 変更結果:');
    console.log('  モバイル版: 250px → 100% に変更済み');
    console.log('  PC版: height: auto, max-height: 400px（変更なし）');
    
    await browser.close();
})();