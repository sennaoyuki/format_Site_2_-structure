const { chromium } = require('playwright');

(async () => {
    console.log('=== Vercel環境の詳細診断 ===\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('https://format-site-2-structure.vercel.app/', {
        waitUntil: 'networkidle'
    });
    
    // 比較表までスクロール
    await page.evaluate(() => {
        document.querySelector('.js-cbn-table')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(1000);
    
    // CSSの診断
    console.log('📋 CSS診断\n');
    
    // data-active-tab属性の確認
    const activeTab = await page.$eval('.js-cbn-table', el => el.getAttribute('data-active-tab'));
    console.log(`data-active-tab属性: ${activeTab || 'なし'}`);
    
    // テーブルのスタイル確認
    const tableStyles = await page.$eval('.js-cbn-table table', el => {
        const computed = window.getComputedStyle(el);
        return {
            tableLayout: computed.tableLayout,
            width: computed.width,
            borderCollapse: computed.borderCollapse
        };
    });
    console.log('\nテーブルスタイル:', tableStyles);
    
    // 最初の行のすべてのセルを確認
    console.log('\n📊 セルの詳細分析（総合タブ）\n');
    
    const allCells = await page.$$eval('.js-cbn-table tbody tr:first-child td', elements => 
        elements.map((el, index) => {
            const computed = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
                index: index,
                text: el.textContent.trim().substring(0, 20),
                display: computed.display,
                visibility: computed.visibility,
                width: computed.width,
                actualWidth: rect.width,
                className: el.className,
                hasThNone: el.classList.contains('th-none'),
                hasTdNone: el.classList.contains('td-none')
            };
        })
    );
    
    console.log('全セル数:', allCells.length);
    allCells.forEach(cell => {
        console.log(`[${cell.index}] "${cell.text}"... | display: ${cell.display} | width: ${cell.width} | actual: ${cell.actualWidth}px | class: "${cell.className}"`);
    });
    
    // CSS ルールの確認
    console.log('\n🎨 適用されているCSSルール\n');
    
    const cssRules = await page.evaluate(() => {
        const rules = [];
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.selectorText && rule.selectorText.includes('data-active-tab')) {
                        rules.push({
                            selector: rule.selectorText,
                            style: rule.style.cssText
                        });
                    }
                }
            } catch (e) {
                // クロスオリジンのスタイルシートは読めない
            }
        }
        return rules;
    });
    
    console.log('data-active-tab関連のCSSルール数:', cssRules.length);
    if (cssRules.length === 0) {
        console.log('⚠️  data-active-tab関連のCSSルールが見つかりません！');
    } else {
        cssRules.forEach(rule => {
            console.log(`\nセレクタ: ${rule.selector}`);
            console.log(`スタイル: ${rule.style}`);
        });
    }
    
    // JavaScriptエラーの確認
    console.log('\n⚠️  コンソールエラー\n');
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('エラー:', msg.text());
        }
    });
    
    // タブ切り替えテスト
    console.log('\n🔄 タブ切り替え後の状態\n');
    
    await page.click('.tab-menu-item[data-tab="tab2"]');
    await page.waitForTimeout(1000);
    
    const activeTabAfter = await page.$eval('.js-cbn-table', el => el.getAttribute('data-active-tab'));
    console.log(`タブ切り替え後のdata-active-tab: ${activeTabAfter || 'なし'}`);
    
    await browser.close();
    console.log('\n=== 診断完了 ===');
})();