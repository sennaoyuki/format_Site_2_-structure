const { chromium } = require('playwright');

(async () => {
    console.log('=== 比較表レスポンシブテスト開始 ===\n');
    
    const viewports = [
        { name: 'iPhone SE', width: 375, height: 667 },
        { name: 'iPad', width: 768, height: 1024 },
        { name: 'Desktop', width: 1024, height: 768 }
    ];
    
    const tabs = [
        { id: 'tab1', name: '総合', expectedColumns: ['クリニック', '総合評価', '実績', '特典', '公式サイト'] },
        { id: 'tab2', name: '施術内容', expectedColumns: ['クリニック', '人気プラン', '医療機器', '注射治療', '公式サイト'] },
        { id: 'tab3', name: 'サービス', expectedColumns: ['クリニック', '食事指導', 'モニター割', '返金保証', '公式サイト'] }
    ];
    
    const browser = await chromium.launch({ headless: false });
    
    for (const viewport of viewports) {
        console.log(`\n📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
        console.log('='.repeat(50));
        
        const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height }
        });
        const page = await context.newPage();
        
        // キャッシュバスターを追加してアクセス
        await page.goto('http://localhost:3000?t=' + Date.now());
        await page.waitForLoadState('networkidle');
        
        for (const tab of tabs) {
            console.log(`\n🔖 ${tab.name}タブのテスト`);
            
            // タブをクリック
            if (tab.id !== 'tab1') {
                await page.click(`.tab-menu-item[data-tab="${tab.id}"]`);
                await page.waitForTimeout(500);
            }
            
            // 表示されている列を取得
            const visibleHeaders = await page.$$eval(
                '.js-cbn-table th:not([style*="display: none"])',
                elements => elements.map(el => el.textContent.trim())
            );
            
            console.log('表示列数:', visibleHeaders.length);
            console.log('表示列:', visibleHeaders.join(' | '));
            
            // 期待される列と比較
            const isCorrect = JSON.stringify(visibleHeaders) === JSON.stringify(tab.expectedColumns);
            console.log('結果:', isCorrect ? '✅ 正常' : '❌ エラー');
            
            if (!isCorrect) {
                console.log('期待値:', tab.expectedColumns.join(' | '));
            }
            
            // 列の実際の幅を測定
            const columnWidths = await page.$$eval(
                '.js-cbn-table tbody tr:first-child td:not([style*="display: none"])',
                elements => elements.map(el => ({
                    width: el.getBoundingClientRect().width,
                    content: el.textContent.trim().substring(0, 20)
                }))
            );
            
            console.log('\n列幅の詳細:');
            columnWidths.forEach((col, index) => {
                console.log(`  ${index + 1}列目: ${col.width.toFixed(1)}px`);
            });
            
            // テーブル全体の幅
            const tableWidth = await page.$eval('.js-cbn-table table', el => el.getBoundingClientRect().width);
            const containerWidth = await page.$eval('.js-cbn-table', el => el.getBoundingClientRect().width);
            console.log(`\nテーブル幅: ${tableWidth.toFixed(1)}px / コンテナ幅: ${containerWidth.toFixed(1)}px`);
            
            // 右側の余白チェック
            const hasExtraSpace = tableWidth < containerWidth - 5;
            if (hasExtraSpace) {
                console.log('⚠️  右側に余白があります');
            }
        }
        
        await context.close();
    }
    
    await browser.close();
    console.log('\n=== テスト完了 ===');
})();