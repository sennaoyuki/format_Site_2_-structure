const fs = require('fs');

// Coverageファイルを読み込む
const coverageData = JSON.parse(fs.readFileSync('/Users/hattaryoga/Library/CloudStorage/GoogleDrive-naoyuki.uebayashi@senjinholdings.com/マイドライブ/1_ダウンロード/Coverage-20250730T073512.json', 'utf8'));

console.log('=== Coverage Analysis Report ===\n');

coverageData.forEach(file => {
    if (!file.url.includes('medical-diet')) return;
    
    const fileName = file.url.split('/').pop();
    const totalSize = file.text ? file.text.length : 0;
    
    if (totalSize === 0) {
        console.log(`\n📄 File: ${fileName}`);
        console.log('   ❌ No text data available (external resource)');
        return;
    }
    
    // 使用されている範囲の合計を計算
    let usedBytes = 0;
    file.ranges.forEach(range => {
        usedBytes += range.end - range.start;
    });
    
    const unusedBytes = totalSize - usedBytes;
    const usagePercent = ((usedBytes / totalSize) * 100).toFixed(1);
    const unusedPercent = ((unusedBytes / totalSize) * 100).toFixed(1);
    
    console.log(`\n📄 File: ${fileName}`);
    console.log(`   Total Size: ${(totalSize / 1024).toFixed(1)} KB`);
    console.log(`   ✅ Used: ${(usedBytes / 1024).toFixed(1)} KB (${usagePercent}%)`);
    console.log(`   ❌ Unused: ${(unusedBytes / 1024).toFixed(1)} KB (${unusedPercent}%)`);
    
    // 大量の未使用コードがある場合は警告
    if (unusedPercent > 70) {
        console.log(`   ⚠️  WARNING: ${unusedPercent}% of this file is unused!`);
    }
    
    // CSSファイルの場合、未使用の主要なセレクタを表示
    if (fileName.endsWith('.css') && file.text) {
        const unusedSelectors = findUnusedSelectors(file.text, file.ranges);
        if (unusedSelectors.length > 0) {
            console.log(`   📋 Sample unused selectors:`);
            unusedSelectors.slice(0, 5).forEach(selector => {
                console.log(`      - ${selector}`);
            });
            if (unusedSelectors.length > 5) {
                console.log(`      ... and ${unusedSelectors.length - 5} more`);
            }
        }
    }
});

function findUnusedSelectors(cssText, usedRanges) {
    const unusedSelectors = [];
    const selectorRegex = /([^{]+)\s*{[^}]+}/g;
    let match;
    
    while ((match = selectorRegex.exec(cssText)) !== null) {
        const startPos = match.index;
        const endPos = match.index + match[0].length;
        
        // この範囲が使用されているかチェック
        const isUsed = usedRanges.some(range => 
            (startPos >= range.start && startPos < range.end) ||
            (endPos > range.start && endPos <= range.end)
        );
        
        if (!isUsed) {
            const selector = match[1].trim();
            // メディアクエリやアニメーションキーフレームを除外
            if (!selector.startsWith('@')) {
                unusedSelectors.push(selector);
            }
        }
    }
    
    return unusedSelectors;
}

// サマリー
console.log('\n=== Summary Recommendations ===');
console.log('1. Font Awesome CSS has very low usage - consider using only needed icons');
console.log('2. Remove unused font families (e.g., Figtree) if not used');
console.log('3. Split large CSS files and load only what\'s needed per page');
console.log('4. Use tree-shaking for JavaScript modules');
console.log('5. Consider using PurgeCSS or similar tools to remove unused styles');