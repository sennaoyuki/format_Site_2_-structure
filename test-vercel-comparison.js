const { chromium } = require('playwright');

(async () => {
    console.log('=== Vercel環境での比較表テスト ===\n');
    console.log('URL: https://format-site-2-structure.vercel.app/\n');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });
    const page = await context.newPage();
    
    try {
        // Vercel環境にアクセス
        await page.goto('https://format-site-2-structure.vercel.app/', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        // 比較表セクションまでスクロール
        await page.evaluate(() => {
            document.querySelector('.js-cbn-table')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await page.waitForTimeout(1000);
        
        console.log('📊 比較表の状態確認\n');
        
        // タブごとにテスト
        const tabs = [
            { id: 'tab1', name: '総合', expectedColumns: ['クリニック', '総合評価', '実績', '特典', '公式サイト'] },
            { id: 'tab2', name: '施術内容', expectedColumns: ['クリニック', '人気プラン', '医療機器', '注射治療', '公式サイト'] },
            { id: 'tab3', name: 'サービス', expectedColumns: ['クリニック', '食事指導', 'モニター割', '返金保証', '公式サイト'] }
        ];
        
        for (const tab of tabs) {
            console.log(`\n🔖 ${tab.name}タブ`);
            console.log('='.repeat(60));
            
            // タブをクリック
            if (tab.id !== 'tab1') {
                await page.click(`.tab-menu-item[data-tab="${tab.id}"]`);
                await page.waitForTimeout(1000);
            }
            
            // 表示されているヘッダーを取得
            const visibleHeaders = await page.$$eval(
                '.js-cbn-table th',
                elements => elements
                    .filter(el => {
                        const style = window.getComputedStyle(el);
                        return style.display !== 'none' && style.visibility !== 'hidden';
                    })
                    .map(el => el.textContent.trim())
            );
            
            console.log('表示列数:', visibleHeaders.length);
            console.log('表示列:', visibleHeaders.join(' | '));
            
            // 期待値との比較
            const isCorrect = JSON.stringify(visibleHeaders) === JSON.stringify(tab.expectedColumns);
            console.log('\n期待値:', tab.expectedColumns.join(' | '));
            console.log('結果:', isCorrect ? '✅ 正常' : '❌ エラー');
            
            // 列の幅を測定
            const columnInfo = await page.$$eval(
                '.js-cbn-table tbody tr:first-child td',
                elements => elements
                    .filter(el => {
                        const style = window.getComputedStyle(el);
                        return style.display !== 'none' && style.visibility !== 'hidden';
                    })
                    .map(el => ({
                        width: el.getBoundingClientRect().width,
                        text: el.textContent.trim().replace(/\s+/g, ' ').substring(0, 30)
                    }))
            );
            
            console.log('\n列幅の詳細:');
            columnInfo.forEach((col, index) => {
                console.log(`  ${index + 1}列目 (${col.text}...): ${col.width.toFixed(1)}px`);
            });
            
            // テーブルとコンテナの幅を確認
            const tableWidth = await page.$eval('.js-cbn-table table', el => el.getBoundingClientRect().width);
            const containerWidth = await page.$eval('.js-cbn-table', el => el.getBoundingClientRect().width);
            
            console.log(`\nテーブル幅: ${tableWidth.toFixed(1)}px`);
            console.log(`コンテナ幅: ${containerWidth.toFixed(1)}px`);
            console.log(`差分: ${(containerWidth - tableWidth).toFixed(1)}px`);
            
            if (Math.abs(containerWidth - tableWidth) > 5) {
                console.log('⚠️  テーブルとコンテナの幅に差があります！');
            }
            
            // スクリーンショットを撮影
            await page.screenshot({ 
                path: `vercel-tab-${tab.id}.png`,
                clip: {
                    x: 0,
                    y: await page.$eval('.js-cbn-table', el => el.getBoundingClientRect().top - 50),
                    width: 1200,
                    height: 600
                }
            });
            console.log(`📸 スクリーンショット保存: vercel-tab-${tab.id}.png`);
        }
        
        // モバイル表示もテスト
        console.log('\n\n📱 モバイル表示テスト (375px)');
        console.log('='.repeat(60));
        
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        
        const mobileHeaders = await page.$$eval(
            '.js-cbn-table th',
            elements => elements
                .filter(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden';
                })
                .map(el => el.textContent.trim())
        );
        
        console.log('モバイル表示列数:', mobileHeaders.length);
        console.log('モバイル表示列:', mobileHeaders.join(' | '));
        
        await page.screenshot({ 
            path: 'vercel-mobile.png',
            fullPage: false,
            clip: {
                x: 0,
                y: await page.$eval('.js-cbn-table', el => el.getBoundingClientRect().top - 20),
                width: 375,
                height: 400
            }
        });
        console.log('📸 モバイルスクリーンショット保存: vercel-mobile.png');
        
    } catch (error) {
        console.error('❌ エラーが発生しました:', error.message);
    } finally {
        await browser.close();
        console.log('\n=== テスト完了 ===');
    }
})();