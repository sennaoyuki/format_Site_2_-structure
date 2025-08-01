const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    // キャッシュを無効化
    const context = await browser.newContext({
        bypassCSP: true,
        ignoreHTTPSErrors: true
    });
    
    const page = await context.newPage();
    
    // キャッシュを無効化
    await page.route('**/*.css', route => {
        route.continue({
            headers: {
                ...route.request().headers(),
                'cache-control': 'no-cache'
            }
        });
    });
    
    console.log('🔍 本番環境でCASEセクションを確認（キャッシュバスト）\n');
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    // タイムスタンプを追加してキャッシュをバイパス
    const timestamp = Date.now();
    await page.goto(`https://www.xn--ecki4eoz3204ct89aepry34c.com/draft/?t=${timestamp}`, {
        waitUntil: 'networkidle'
    });
    
    // CSSファイルの読み込み状況を確認
    const cssFiles = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        return links.map(link => ({
            href: link.href,
            loaded: link.sheet !== null
        }));
    });
    
    console.log('📄 読み込まれたCSSファイル:');
    cssFiles.forEach(css => {
        if (css.href.includes('styles.css') || css.href.includes('responsive-fix')) {
            console.log(`  ${css.loaded ? '✅' : '❌'} ${css.href}`);
        }
    });
    
    // CASEセクションまでスクロール
    await page.evaluate(() => {
        const caseSection = document.querySelector('.case-slider');
        if (caseSection) {
            caseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    
    await page.waitForTimeout(3000);
    
    // 画像とコンテナのサイズを確認
    const sizeInfo = await page.evaluate(() => {
        const img = document.querySelector('.case-slider .slick-slide.slick-current img');
        const slider = document.querySelector('.case-slider.slick-initialized');
        const slickList = document.querySelector('.case-slider .slick-list');
        
        const results = {};
        
        if (img) {
            const imgRect = img.getBoundingClientRect();
            const imgStyles = window.getComputedStyle(img);
            results.image = {
                displaySize: `${imgRect.width.toFixed(0)}x${imgRect.height.toFixed(0)}`,
                styles: {
                    width: imgStyles.width,
                    height: imgStyles.height,
                    maxWidth: imgStyles.maxWidth,
                    maxHeight: imgStyles.maxHeight
                }
            };
        }
        
        if (slider) {
            const sliderStyles = window.getComputedStyle(slider);
            results.slider = {
                height: sliderStyles.height,
                minHeight: sliderStyles.minHeight
            };
        }
        
        if (slickList) {
            const listStyles = window.getComputedStyle(slickList);
            results.slickList = {
                height: listStyles.height,
                minHeight: listStyles.minHeight
            };
        }
        
        // スタイルシートから直接ルールを確認
        const rules = [];
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.cssText.includes('.case-slider') && 
                        rule.cssText.includes('min-height')) {
                        rules.push(rule.cssText.substring(0, 200));
                    }
                }
            } catch (e) {}
        }
        results.cssRules = rules;
        
        return results;
    });
    
    console.log('\n📐 サイズ情報:');
    if (sizeInfo.image) {
        console.log('画像:');
        console.log(`  表示サイズ: ${sizeInfo.image.displaySize}px`);
        console.log(`  width: ${sizeInfo.image.styles.width}`);
        console.log(`  height: ${sizeInfo.image.styles.height}`);
        console.log(`  max-width: ${sizeInfo.image.styles.maxWidth}`);
        console.log(`  max-height: ${sizeInfo.image.styles.maxHeight}`);
    }
    
    if (sizeInfo.slider) {
        console.log('\nスライダー:');
        console.log(`  height: ${sizeInfo.slider.height}`);
        console.log(`  min-height: ${sizeInfo.slider.minHeight}`);
    }
    
    if (sizeInfo.slickList) {
        console.log('\nslick-list:');
        console.log(`  height: ${sizeInfo.slickList.height}`);
        console.log(`  min-height: ${sizeInfo.slickList.minHeight}`);
    }
    
    if (sizeInfo.cssRules.length > 0) {
        console.log('\n適用されているCSSルール:');
        sizeInfo.cssRules.forEach(rule => {
            console.log(`  ${rule}...`);
        });
    }
    
    // スクリーンショット
    await page.screenshot({ 
        path: 'production-case-after-fix.png',
        fullPage: false
    });
    
    console.log('\n📸 スクリーンショット: production-case-after-fix.png');
    
    await browser.close();
})();