const { chromium } = require('playwright');

(async () => {
    // ブラウザを起動
    const browser = await chromium.launch({ 
        headless: false,  // ブラウザを表示
        devtools: true    // 開発者ツールを開く
    });
    
    // iPhone SEサイズのページを作成
    const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
    
    const page = await context.newPage();
    
    // コンソールログを取得
    page.on('console', msg => {
        console.log(`[Console ${msg.type()}]:`, msg.text());
    });
    
    // ページエラーを取得
    page.on('pageerror', error => {
        console.error('[Page Error]:', error.message);
    });
    
    console.log('📱 iPhone SE (375px) でページを開いています...');
    
    // ページを開く
    await page.goto('http://localhost:8090/draft/?region_id=013', {
        waitUntil: 'networkidle'
    });
    
    console.log('⏳ ページ読み込み完了、3秒待機...');
    await page.waitForTimeout(3000);
    
    // DIOクリニックのセクションまでスクロール
    console.log('📍 DIOクリニックのセクションを探しています...');
    
    // 案件詳細セクションを探す
    const clinicSection = await page.$('#clinic-details-section');
    if (clinicSection) {
        await clinicSection.scrollIntoViewIfNeeded();
        console.log('✅ 案件詳細セクションが見つかりました');
        
        // CASEセクションの存在確認
        const caseSection = await page.$('.clinic-points-section:has(h4:has-text("CASE"))');
        if (caseSection) {
            console.log('✅ CASEセクションが見つかりました');
            
            // スライダーの初期化状態を確認
            const sliderInitialized = await page.$('.case-slider.slick-initialized');
            if (sliderInitialized) {
                console.log('✅ スライダーが初期化されています');
                
                // スライダーの画像数を確認
                const slideCount = await page.$$eval('.case-slider .slick-slide:not(.slick-cloned)', slides => slides.length);
                console.log(`📸 スライド数: ${slideCount}`);
                
                // ドットの数を確認
                const dotsCount = await page.$$eval('.case-slider .slick-dots li', dots => dots.length);
                console.log(`🔵 ドット数: ${dotsCount}`);
                
                // 矢印ボタンの存在確認
                const prevButton = await page.$('.case-slider .slick-prev');
                const nextButton = await page.$('.case-slider .slick-next');
                console.log(`⬅️ 前へボタン: ${prevButton ? '有' : '無'}`);
                console.log(`➡️ 次へボタン: ${nextButton ? '有' : '無'}`);
                
                // スクリーンショットを撮影
                await caseSection.screenshot({ path: 'sp-case-section.png' });
                console.log('📷 スクリーンショット保存: sp-case-section.png');
                
                // 次へボタンをクリック
                if (nextButton) {
                    console.log('🖱️ 次へボタンをクリック...');
                    await nextButton.click();
                    await page.waitForTimeout(600);
                    await caseSection.screenshot({ path: 'sp-case-section-next.png' });
                    console.log('📷 次のスライド: sp-case-section-next.png');
                }
                
            } else {
                console.log('❌ スライダーが初期化されていません');
                
                // 手動で初期化を試みる
                console.log('🔧 手動で初期化を試みています...');
                await page.evaluate(() => {
                    if (typeof initCaseSlider === 'function') {
                        initCaseSlider();
                    }
                });
                await page.waitForTimeout(1000);
                
                // 再確認
                const sliderInitializedAfter = await page.$('.case-slider.slick-initialized');
                if (sliderInitializedAfter) {
                    console.log('✅ 手動初期化成功');
                } else {
                    console.log('❌ 手動初期化失敗');
                }
            }
            
        } else {
            console.log('❌ CASEセクションが見つかりません');
        }
    } else {
        console.log('❌ 案件詳細セクションが見つかりません');
    }
    
    // 5秒待機してからブラウザを閉じる
    console.log('⏳ 5秒後にブラウザを閉じます...');
    await page.waitForTimeout(5000);
    
    await browser.close();
    console.log('✅ テスト完了');
})();