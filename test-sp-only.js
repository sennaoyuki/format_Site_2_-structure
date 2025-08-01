const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    
    const page = await context.newPage();
    
    console.log('📱 SP版（375px）でテスト開始...');
    
    // ページを開く
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    console.log('⏳ ページ読み込み完了、5秒待機...');
    await page.waitForTimeout(5000);
    
    // 強制的に再初期化
    console.log('🔧 スライダーを手動で初期化...');
    await page.evaluate(() => {
        // 既存のスライダーを破棄
        $('.case-slider').slick('unslick');
        
        // 再初期化
        $('.case-slider').slick({
            dots: true,
            infinite: true,
            speed: 500,
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: true,
            adaptiveHeight: false,
            variableWidth: false
        });
    });
    
    await page.waitForTimeout(2000);
    
    // CASEセクションの詳細情報を取得
    const caseInfo = await page.evaluate(() => {
        const caseH4 = Array.from(document.querySelectorAll('h4')).find(h4 => h4.textContent.includes('CASE'));
        const caseSection = caseH4?.closest('.clinic-points-section');
        if (!caseSection) return { found: false };
        
        const slider = caseSection.querySelector('.case-slider');
        const slickList = slider?.querySelector('.slick-list');
        const slickTrack = slider?.querySelector('.slick-track');
        const images = Array.from(slider?.querySelectorAll('img') || []);
        
        // 現在表示されている画像を特定
        const activeSlide = slider?.querySelector('.slick-slide.slick-current.slick-active');
        const activeImg = activeSlide?.querySelector('img');
        
        return {
            found: true,
            slider: {
                initialized: slider?.classList.contains('slick-initialized'),
                height: slider?.offsetHeight,
                computedStyle: window.getComputedStyle(slider).height
            },
            slickList: {
                height: slickList?.offsetHeight,
                computedStyle: slickList ? window.getComputedStyle(slickList).height : null
            },
            slickTrack: {
                height: slickTrack?.offsetHeight,
                computedStyle: slickTrack ? window.getComputedStyle(slickTrack).height : null
            },
            images: images.map((img, i) => ({
                index: i,
                src: img.src.split('/').pop(),
                naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
                displaySize: `${img.offsetWidth}x${img.offsetHeight}`,
                computedStyle: {
                    width: window.getComputedStyle(img).width,
                    height: window.getComputedStyle(img).height
                },
                visible: img.offsetWidth > 0 && img.offsetHeight > 0
            })),
            activeImage: activeImg ? {
                src: activeImg.src.split('/').pop(),
                displaySize: `${activeImg.offsetWidth}x${activeImg.offsetHeight}`
            } : null
        };
    });
    
    console.log('\n📊 CASEセクション詳細情報:');
    console.log(JSON.stringify(caseInfo, null, 2));
    
    if (caseInfo.found) {
        // CASEセクションまでスクロール
        await page.evaluate(() => {
            const caseH4 = Array.from(document.querySelectorAll('h4')).find(h4 => h4.textContent.includes('CASE'));
            caseH4?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        
        await page.waitForTimeout(1000);
        
        // スクリーンショット撮影
        const caseSection = await page.evaluateHandle(() => {
            const h4 = Array.from(document.querySelectorAll('h4')).find(h4 => h4.textContent.includes('CASE'));
            return h4?.closest('.clinic-points-section');
        });
        if (caseSection) {
            await caseSection.screenshot({ path: 'sp-case-latest.png' });
            console.log('\n📷 最新のスクリーンショット: sp-case-latest.png');
            
            // 次へボタンをクリック
            const nextButton = await page.$('.case-slider .slick-next');
            if (nextButton) {
                console.log('🖱️ 次へボタンをクリック...');
                await nextButton.click();
                await page.waitForTimeout(600);
                
                await caseSection.screenshot({ path: 'sp-case-latest-next.png' });
                console.log('📷 次のスライド: sp-case-latest-next.png');
            }
        }
    }
    
    // 10秒待機
    console.log('\n⏳ 10秒後にブラウザを閉じます...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();