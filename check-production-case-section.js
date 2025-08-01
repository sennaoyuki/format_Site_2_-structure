const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 本番環境でCASEセクションを確認\n');
    
    // モバイルサイズでテスト
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
    
    await page.waitForTimeout(2000);
    
    // CASEセクションの状態を確認
    const caseInfo = await page.evaluate(() => {
        const slider = document.querySelector('.case-slider');
        const img = document.querySelector('.case-slider .slick-slide.slick-current img');
        const dots = document.querySelector('.case-slider .slick-dots');
        const dotItems = document.querySelectorAll('.case-slider .slick-dots li');
        
        const results = {
            sliderFound: !!slider,
            imageFound: !!img,
            dotsFound: !!dots,
            dotCount: dotItems.length
        };
        
        if (slider) {
            const sliderStyles = window.getComputedStyle(slider);
            results.sliderTextAlign = sliderStyles.textAlign;
        }
        
        if (img) {
            const imgRect = img.getBoundingClientRect();
            const imgStyles = window.getComputedStyle(img);
            const parentRect = img.parentElement.getBoundingClientRect();
            
            results.image = {
                width: imgRect.width,
                height: imgRect.height,
                display: imgStyles.display,
                margin: imgStyles.margin,
                objectFit: imgStyles.objectFit,
                parentWidth: parentRect.width,
                centerOffset: Math.abs((parentRect.width / 2) - (imgRect.left + imgRect.width / 2 - parentRect.left))
            };
        }
        
        if (dots) {
            const dotsRect = dots.getBoundingClientRect();
            const firstDot = dotItems[0];
            
            if (firstDot) {
                const dotStyles = window.getComputedStyle(firstDot.querySelector('button:before') || firstDot);
                results.dots = {
                    width: dotsRect.width,
                    viewportWidth: window.innerWidth,
                    isOverflowing: dotsRect.width > window.innerWidth,
                    fontSize: dotStyles.fontSize || 'N/A'
                };
            }
        }
        
        return results;
    });
    
    console.log('📊 CASEセクションの状態:');
    console.log(`  スライダー: ${caseInfo.sliderFound ? '✅ 見つかりました' : '❌ 見つかりません'}`);
    console.log(`  画像: ${caseInfo.imageFound ? '✅ 見つかりました' : '❌ 見つかりません'}`);
    console.log(`  ドット: ${caseInfo.dotsFound ? '✅ 見つかりました' : '❌ 見つかりません'} (${caseInfo.dotCount}個)`);
    
    if (caseInfo.sliderTextAlign) {
        console.log(`\n📐 スライダーのtext-align: ${caseInfo.sliderTextAlign}`);
    }
    
    if (caseInfo.image) {
        console.log('\n📸 画像の状態:');
        console.log(`  サイズ: ${caseInfo.image.width.toFixed(0)}x${caseInfo.image.height.toFixed(0)}px`);
        console.log(`  display: ${caseInfo.image.display}`);
        console.log(`  margin: ${caseInfo.image.margin}`);
        console.log(`  object-fit: ${caseInfo.image.objectFit}`);
        console.log(`  中央からのズレ: ${caseInfo.image.centerOffset.toFixed(1)}px ${caseInfo.image.centerOffset < 5 ? '✅' : '⚠️'}`);
    }
    
    if (caseInfo.dots) {
        console.log('\n🔵 ドットインジケーター:');
        console.log(`  幅: ${caseInfo.dots.width.toFixed(0)}px / ${caseInfo.dots.viewportWidth}px`);
        console.log(`  オーバーフロー: ${caseInfo.dots.isOverflowing ? '⚠️ はい' : '✅ いいえ'}`);
    }
    
    // スクリーンショットを撮る
    await page.screenshot({ 
        path: 'production-case-section.png',
        clip: {
            x: 0,
            y: 200,
            width: 375,
            height: 500
        }
    });
    
    console.log('\n📸 スクリーンショット: production-case-section.png');
    
    // タブレットサイズでも確認
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
        path: 'production-case-section-tablet.png',
        clip: {
            x: 0,
            y: 200,
            width: 768,
            height: 500
        }
    });
    
    console.log('📸 タブレット版: production-case-section-tablet.png');
    
    await browser.close();
})();