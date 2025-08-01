const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 CASEセクション画像問題の徹底調査\n');
    
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
    
    await page.waitForTimeout(3000);
    
    // 1. 画像とコンテナの詳細な分析
    const analysis = await page.evaluate(() => {
        const results = {
            slider: {},
            currentImage: {},
            allImages: [],
            cssRules: [],
            containerChain: []
        };
        
        // スライダー全体
        const slider = document.querySelector('.case-slider');
        if (slider) {
            const rect = slider.getBoundingClientRect();
            const styles = window.getComputedStyle(slider);
            results.slider = {
                width: rect.width,
                height: rect.height,
                display: styles.display,
                position: styles.position
            };
        }
        
        // 現在表示されている画像
        const currentImg = document.querySelector('.case-slider .slick-slide.slick-current img');
        if (currentImg) {
            const rect = currentImg.getBoundingClientRect();
            const styles = window.getComputedStyle(currentImg);
            results.currentImage = {
                src: currentImg.src,
                naturalSize: `${currentImg.naturalWidth}x${currentImg.naturalHeight}`,
                displaySize: `${rect.width}x${rect.height}`,
                computedStyles: {
                    width: styles.width,
                    height: styles.height,
                    maxWidth: styles.maxWidth,
                    maxHeight: styles.maxHeight,
                    padding: styles.padding,
                    margin: styles.margin,
                    objectFit: styles.objectFit,
                    display: styles.display
                }
            };
            
            // 親要素のチェーン
            let parent = currentImg.parentElement;
            while (parent && parent !== document.body) {
                const pRect = parent.getBoundingClientRect();
                const pStyles = window.getComputedStyle(parent);
                results.containerChain.push({
                    tag: parent.tagName,
                    class: parent.className,
                    width: pRect.width,
                    height: pRect.height,
                    display: pStyles.display,
                    overflow: pStyles.overflow
                });
                parent = parent.parentElement;
            }
        }
        
        // すべての画像
        const allImgs = document.querySelectorAll('.case-slider img');
        allImgs.forEach((img, index) => {
            results.allImages.push({
                index,
                src: img.src.split('/').pop(),
                width: img.getBoundingClientRect().width,
                height: img.getBoundingClientRect().height
            });
        });
        
        // 適用されているCSSルール（特に375px以下）
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.cssText.includes('.case-slider') && 
                        rule.cssText.includes('img') &&
                        (rule.cssText.includes('375px') || rule.cssText.includes('768px'))) {
                        results.cssRules.push({
                            rule: rule.cssText.substring(0, 200),
                            source: sheet.href || 'inline'
                        });
                    }
                }
            } catch (e) {}
        }
        
        return results;
    });
    
    console.log('📊 スライダー情報:');
    console.log(`  サイズ: ${analysis.slider.width}x${analysis.slider.height}px`);
    
    console.log('\n📸 現在の画像:');
    console.log(`  元のサイズ: ${analysis.currentImage.naturalSize}`);
    console.log(`  表示サイズ: ${analysis.currentImage.displaySize}`);
    console.log('  計算されたスタイル:');
    Object.entries(analysis.currentImage.computedStyles).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
    });
    
    console.log('\n📦 コンテナチェーン:');
    analysis.containerChain.forEach((container, index) => {
        console.log(`  ${index}. ${container.tag}.${container.class}: ${container.width}x${container.height}px`);
    });
    
    console.log('\n🎨 375px/768px関連のCSSルール:');
    analysis.cssRules.forEach(rule => {
        console.log(`  ${rule.rule}...`);
    });
    
    // 2. 問題の診断
    console.log('\n\n⚠️  問題の診断:');
    
    const imgWidth = parseFloat(analysis.currentImage.computedStyles.width);
    const containerWidth = analysis.slider.width;
    
    if (imgWidth < 100) {
        console.log('❌ 画像が非常に小さい（幅 < 100px）');
        
        // max-width: 85%の問題
        if (analysis.currentImage.computedStyles.maxWidth === '85%') {
            console.log('  原因: max-width: 85% が適用されている（375px以下の古いルール）');
        }
        
        // コンテナの高さ問題
        const smallContainers = analysis.containerChain.filter(c => c.height < 50);
        if (smallContainers.length > 0) {
            console.log('  原因: コンテナの高さが小さすぎる');
            smallContainers.forEach(c => {
                console.log(`    - ${c.tag}.${c.class}: ${c.height}px`);
            });
        }
    }
    
    // 3. 改修案
    console.log('\n💡 改修案:');
    console.log('1. 375px以下のmax-width: 85%ルールを上書き');
    console.log('2. !importantを使用して優先度を最高に');
    console.log('3. コンテナの最小高さを確保');
    console.log('4. object-fit: coverで画像を確実に表示');
    
    await page.screenshot({ 
        path: 'case-issue-investigation.png',
        clip: { x: 0, y: 200, width: 375, height: 400 }
    });
    
    await browser.close();
})();