// パフォーマンステストスクリプト
const puppeteer = require('puppeteer-core');

async function performanceTest() {
    console.log('パフォーマンステストを開始します...');
    
    // ブラウザベースのタイミング測定
    const performanceMarks = `
        // ページ読み込み開始
        const startTime = performance.now();
        
        // DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded:', performance.now() - startTime, 'ms');
        });
        
        // 全リソース読み込み完了
        window.addEventListener('load', () => {
            console.log('Page Load Complete:', performance.now() - startTime, 'ms');
            
            // Navigation Timing API
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Performance Metrics:');
            console.log('- DNS Lookup:', perfData.domainLookupEnd - perfData.domainLookupStart, 'ms');
            console.log('- TCP Connection:', perfData.connectEnd - perfData.connectStart, 'ms');
            console.log('- Response Time:', perfData.responseEnd - perfData.responseStart, 'ms');
            console.log('- DOM Processing:', perfData.domComplete - perfData.domLoading, 'ms');
            console.log('- Total Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
        });
        
        // JavaScriptの実行速度測定
        setTimeout(() => {
            console.log('\\nJavaScript Performance Test:');
            
            // 地域切り替えのパフォーマンス測定
            const regionSelect = document.getElementById('region-select');
            if (regionSelect && regionSelect.options.length > 1) {
                const testStart = performance.now();
                
                // 10回地域切り替えを実行
                let switchCount = 0;
                const regions = ['013', '027', '001', '040', '031'];
                
                regions.forEach(regionId => {
                    const option = Array.from(regionSelect.options).find(opt => opt.value === regionId);
                    if (option) {
                        regionSelect.value = regionId;
                        regionSelect.dispatchEvent(new Event('change'));
                        switchCount++;
                    }
                });
                
                const testEnd = performance.now();
                console.log('Region Switch Performance:');
                console.log('- Total switches:', switchCount);
                console.log('- Total time:', testEnd - testStart, 'ms');
                console.log('- Average per switch:', (testEnd - testStart) / switchCount, 'ms');
            }
        }, 2000);
    `;
    
    console.log('\\nページパフォーマンステストを実行してください:');
    console.log('1. ブラウザで http://localhost:8000 を開く');
    console.log('2. 開発者ツールのコンソールを開く');
    console.log('3. 以下のコードをコンソールに貼り付けて実行:');
    console.log('\\n' + performanceMarks);
}

performanceTest();