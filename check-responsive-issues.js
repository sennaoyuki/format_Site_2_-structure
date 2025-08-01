const { chromium } = require('playwright');
const fs = require('fs').promises;

async function checkViewport(page, width, sectionName) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(1000);
    
    const screenshot = await page.screenshot({ fullPage: true });
    await fs.writeFile(`responsive-${width}px-${sectionName}.png`, screenshot);
    
    const issues = await page.evaluate(() => {
        const issues = [];
        
        // 各セクションをチェック
        const sections = [
            { selector: '.hero-section', name: 'ヒーローセクション' },
            { selector: '.ranking-section', name: 'ランキングセクション' },
            { selector: '.comparison-section', name: '比較表セクション' },
            { selector: '.clinic-details-section', name: '詳細セクション' },
            { selector: '.tips-section', name: 'Tipsセクション' },
            { selector: '.footer', name: 'フッター' }
        ];
        
        sections.forEach(section => {
            const element = document.querySelector(section.selector);
            if (element) {
                const rect = element.getBoundingClientRect();
                const styles = window.getComputedStyle(element);
                
                // 横スクロールのチェック
                const hasHorizontalScroll = element.scrollWidth > element.clientWidth;
                const overflowsViewport = rect.width > window.innerWidth;
                
                // 要素の重なりをチェック
                const children = element.querySelectorAll('*');
                const overlapping = [];
                
                for (let i = 0; i < children.length - 1; i++) {
                    const rect1 = children[i].getBoundingClientRect();
                    const rect2 = children[i + 1].getBoundingClientRect();
                    
                    if (rect1.right > rect2.left && rect1.bottom > rect2.top) {
                        overlapping.push({
                            element1: children[i].className || children[i].tagName,
                            element2: children[i + 1].className || children[i + 1].tagName
                        });
                    }
                }
                
                if (hasHorizontalScroll || overflowsViewport || overlapping.length > 0) {
                    issues.push({
                        section: section.name,
                        problems: {
                            hasHorizontalScroll,
                            overflowsViewport,
                            width: rect.width,
                            viewportWidth: window.innerWidth,
                            overflow: styles.overflow,
                            overflowX: styles.overflowX,
                            overlapping: overlapping.length > 0 ? overlapping : null
                        }
                    });
                }
                
                // 特定の問題をチェック
                if (section.selector === '.ranking-section') {
                    const rankingItems = element.querySelectorAll('.ranking-item');
                    const itemsPerRow = [];
                    let currentY = null;
                    let currentRowCount = 0;
                    
                    rankingItems.forEach(item => {
                        const itemRect = item.getBoundingClientRect();
                        if (currentY === null || Math.abs(itemRect.top - currentY) < 5) {
                            currentRowCount++;
                        } else {
                            if (currentRowCount > 0) itemsPerRow.push(currentRowCount);
                            currentY = itemRect.top;
                            currentRowCount = 1;
                        }
                    });
                    if (currentRowCount > 0) itemsPerRow.push(currentRowCount);
                    
                    issues.push({
                        section: 'ランキングレイアウト',
                        itemsPerRow,
                        totalItems: rankingItems.length
                    });
                }
                
                // 比較表の問題をチェック
                if (section.selector === '.comparison-section') {
                    const table = element.querySelector('table');
                    if (table) {
                        const tableRect = table.getBoundingClientRect();
                        issues.push({
                            section: '比較表',
                            tableWidth: tableRect.width,
                            viewportWidth: window.innerWidth,
                            hasScroll: table.parentElement.scrollWidth > table.parentElement.clientWidth
                        });
                    }
                }
            }
        });
        
        // メディアクエリの状態を確認
        const mediaQueries = [
            { query: '(max-width: 480px)', name: 'mobile' },
            { query: '(max-width: 768px)', name: 'tablet' },
            { query: '(min-width: 481px) and (max-width: 768px)', name: 'tablet-range' }
        ];
        
        const activeQueries = mediaQueries
            .filter(mq => window.matchMedia(mq.query).matches)
            .map(mq => mq.name);
        
        return {
            issues,
            activeMediaQueries: activeQueries,
            viewportWidth: window.innerWidth
        };
    });
    
    return issues;
}

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔍 480〜768pxでの表示崩れを調査中...\n');
    
    await page.goto('http://localhost:8090/draft/', {
        waitUntil: 'networkidle'
    });
    
    // テストする画面幅
    const viewports = [480, 550, 600, 650, 700, 768];
    const allIssues = {};
    
    for (const width of viewports) {
        console.log(`\n📱 ${width}px での表示をチェック...`);
        const result = await checkViewport(page, width, 'all');
        allIssues[width] = result;
        
        console.log(`  アクティブなメディアクエリ: ${result.activeMediaQueries.join(', ')}`);
        
        if (result.issues.length > 0) {
            console.log(`  ⚠️  問題が見つかりました:`);
            result.issues.forEach(issue => {
                console.log(`    - ${issue.section}:`);
                if (issue.problems) {
                    if (issue.problems.hasHorizontalScroll) {
                        console.log(`      横スクロールが発生`);
                    }
                    if (issue.problems.overflowsViewport) {
                        console.log(`      ビューポートを超えている (幅: ${issue.problems.width}px)`);
                    }
                    if (issue.problems.overlapping) {
                        console.log(`      要素の重なりが発生`);
                    }
                }
                if (issue.itemsPerRow) {
                    console.log(`      行ごとのアイテム数: ${issue.itemsPerRow.join(', ')}`);
                }
                if (issue.tableWidth) {
                    console.log(`      テーブル幅: ${issue.tableWidth}px (ビューポート: ${issue.viewportWidth}px)`);
                }
            });
        }
    }
    
    // CSSファイルの分析
    console.log('\n📋 CSSファイルを分析中...');
    
    const cssContent = await page.evaluate(() => {
        const styles = [];
        const stylesheets = document.styleSheets;
        
        for (let sheet of stylesheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                for (let rule of rules) {
                    if (rule.media && rule.media.mediaText.includes('768')) {
                        styles.push({
                            media: rule.media.mediaText,
                            rules: rule.cssRules ? Array.from(rule.cssRules).map(r => r.cssText).slice(0, 5) : []
                        });
                    }
                }
            } catch (e) {
                // クロスオリジンのスタイルシートはスキップ
            }
        }
        
        return styles;
    });
    
    console.log('\n🎨 480〜768px に関連するメディアクエリ:');
    cssContent.forEach(media => {
        console.log(`  ${media.media}`);
        media.rules.forEach(rule => {
            console.log(`    ${rule.substring(0, 100)}...`);
        });
    });
    
    // 具体的な問題箇所の特定
    const specificIssues = await page.evaluate(() => {
        const issues = [];
        
        // ランキングセクションの問題
        const rankingSection = document.querySelector('.ranking-section');
        if (rankingSection) {
            const container = rankingSection.querySelector('.ranking-container');
            if (container) {
                const containerStyles = window.getComputedStyle(container);
                issues.push({
                    element: '.ranking-container',
                    display: containerStyles.display,
                    flexDirection: containerStyles.flexDirection,
                    gridTemplateColumns: containerStyles.gridTemplateColumns,
                    width: container.offsetWidth,
                    padding: containerStyles.padding
                });
            }
        }
        
        // 比較表の問題
        const comparisonTable = document.querySelector('.comparison-section table');
        if (comparisonTable) {
            const wrapper = comparisonTable.closest('.table-wrapper');
            if (wrapper) {
                const wrapperStyles = window.getComputedStyle(wrapper);
                issues.push({
                    element: '.table-wrapper',
                    overflow: wrapperStyles.overflow,
                    overflowX: wrapperStyles.overflowX,
                    width: wrapper.offsetWidth,
                    scrollWidth: wrapper.scrollWidth
                });
            }
        }
        
        return issues;
    });
    
    console.log('\n🔍 具体的な問題箇所:');
    specificIssues.forEach(issue => {
        console.log(`\n${issue.element}:`);
        Object.entries(issue).forEach(([key, value]) => {
            if (key !== 'element') {
                console.log(`  ${key}: ${value}`);
            }
        });
    });
    
    console.log('\n💡 推奨される修正案:');
    console.log('1. ランキングセクション: グリッドレイアウトの調整');
    console.log('2. 比較表: レスポンシブテーブルの実装');
    console.log('3. 全体: 480〜768px用の専用メディアクエリを追加');
    
    await browser.close();
})();