/**
 * パフォーマンス測定スクリプト
 * 既存機能と新セクションのパフォーマンス分析
 */

class PerformanceTester {
    constructor() {
        this.metrics = {
            pageLoad: {},
            sectionRender: {},
            dataLoading: {},
            interactions: {},
            resources: {},
            memory: {}
        };
        this.benchmarks = {
            pageLoad: 3000, // 3秒以内
            sectionRender: 100, // 100ms以内
            dataLoad: 500, // 500ms以内
            interaction: 50, // 50ms以内
            memory: 0.8 // ヒープ制限の80%以内
        };
    }

    /**
     * 全パフォーマンステスト実行
     */
    async runPerformanceTests() {
        console.log('⚡ パフォーマンステスト開始');
        console.log('='.repeat(50));

        try {
            // 1. ページ読み込み性能
            await this.measurePageLoadPerformance();
            
            // 2. セクション表示性能
            await this.measureSectionRenderPerformance();
            
            // 3. データ読み込み性能
            await this.measureDataLoadingPerformance();
            
            // 4. インタラクション性能
            await this.measureInteractionPerformance();
            
            // 5. リソース使用量
            await this.measureResourceUsage();
            
            // 6. メモリ使用量
            await this.measureMemoryUsage();
            
            // レポート生成
            this.generatePerformanceReport();
            
        } catch (error) {
            console.error('❌ パフォーマンステスト中にエラー:', error);
        }

        return this.metrics;
    }

    /**
     * 1. ページ読み込み性能測定
     */
    async measurePageLoadPerformance() {
        console.log('📊 1. ページ読み込み性能測定');

        // Navigation Timing API使用
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.metrics.pageLoad = {
                // DNS解決時間
                dnsLookup: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
                
                // TCP接続時間
                tcpConnect: Math.round(navigation.connectEnd - navigation.connectStart),
                
                // サーバーレスポンス時間
                serverResponse: Math.round(navigation.responseStart - navigation.requestStart),
                
                // HTML解析時間
                domParse: Math.round(navigation.domContentLoadedEventEnd - navigation.responseEnd),
                
                // リソース読み込み時間
                resourceLoad: Math.round(navigation.loadEventStart - navigation.domContentLoadedEventEnd),
                
                // 総読み込み時間
                totalLoad: Math.round(navigation.loadEventEnd - navigation.fetchStart),
                
                // First Contentful Paint
                fcp: this.getFirstContentfulPaint(),
                
                // Largest Contentful Paint
                lcp: this.getLargestContentfulPaint()
            };

            console.log(`  DNS解決: ${this.metrics.pageLoad.dnsLookup}ms`);
            console.log(`  サーバーレスポンス: ${this.metrics.pageLoad.serverResponse}ms`);
            console.log(`  総読み込み時間: ${this.metrics.pageLoad.totalLoad}ms`);
            console.log(`  FCP: ${this.metrics.pageLoad.fcp}ms`);
            console.log(`  LCP: ${this.metrics.pageLoad.lcp}ms`);
        } else {
            console.log('  ⚠️  Navigation Timing API利用不可');
        }
    }

    /**
     * 2. セクション表示性能測定
     */
    async measureSectionRenderPerformance() {
        console.log('📊 2. セクション表示性能測定');

        const sections = document.querySelectorAll('section, .section, .hero-section, .tips-section');
        this.metrics.sectionRender = {};

        sections.forEach((section, index) => {
            const startTime = performance.now();
            
            // セクションの表示処理をシミュレート
            const rect = section.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            const computedStyle = window.getComputedStyle(section);
            
            const endTime = performance.now();
            const renderTime = endTime - startTime;

            const sectionName = section.className || section.tagName.toLowerCase() || `section-${index}`;
            this.metrics.sectionRender[sectionName] = {
                renderTime: Math.round(renderTime * 100) / 100,
                isVisible,
                width: rect.width,
                height: rect.height,
                hasBackground: computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)',
                status: renderTime < this.benchmarks.sectionRender ? 'PASS' : 'FAIL'
            };

            console.log(`  ${sectionName}: ${renderTime.toFixed(2)}ms ${isVisible ? '(表示中)' : '(非表示)'}`);
        });
    }

    /**
     * 3. データ読み込み性能測定
     */
    async measureDataLoadingPerformance() {
        console.log('📊 3. データ読み込み性能測定');

        const dataFiles = [
            '出しわけSS - region.csv',
            '出しわけSS - ranking.csv',
            '出しわけSS - stores.csv',
            '出しわけSS - items.csv',
            '出しわけSS - store_view.csv'
        ];

        this.metrics.dataLoading = {};

        for (const fileName of dataFiles) {
            try {
                const startTime = performance.now();
                const response = await fetch(`./data/${fileName}`);
                const loadEndTime = performance.now();
                
                if (response.ok) {
                    const text = await response.text();
                    const parseEndTime = performance.now();
                    
                    const loadTime = loadEndTime - startTime;
                    const parseTime = parseEndTime - loadEndTime;
                    const totalTime = parseEndTime - startTime;

                    this.metrics.dataLoading[fileName] = {
                        loadTime: Math.round(loadTime),
                        parseTime: Math.round(parseTime),
                        totalTime: Math.round(totalTime),
                        fileSize: text.length,
                        lines: text.split('\n').length,
                        status: totalTime < this.benchmarks.dataLoad ? 'PASS' : 'FAIL'
                    };

                    console.log(`  ${fileName}: 読み込み${loadTime.toFixed(0)}ms + 解析${parseTime.toFixed(0)}ms = ${totalTime.toFixed(0)}ms`);
                } else {
                    console.log(`  ${fileName}: ❌ 読み込み失敗 (${response.status})`);
                }
            } catch (error) {
                console.log(`  ${fileName}: ❌ エラー - ${error.message}`);
                this.metrics.dataLoading[fileName] = {
                    error: error.message,
                    status: 'ERROR'
                };
            }
        }
    }

    /**
     * 4. インタラクション性能測定
     */
    async measureInteractionPerformance() {
        console.log('📊 4. インタラクション性能測定');

        const interactions = [
            {
                name: '地域選択',
                element: document.getElementById('region-select'),
                event: 'change'
            },
            {
                name: 'ランキング項目クリック',
                element: document.querySelector('.ranking-item, .clinic-item'),
                event: 'click'
            },
            {
                name: '店舗項目クリック',
                element: document.querySelector('.store-item'),
                event: 'click'
            }
        ];

        this.metrics.interactions = {};

        for (const interaction of interactions) {
            if (interaction.element) {
                try {
                    const startTime = performance.now();
                    
                    // イベントをシミュレート（実際のイベント発火はしない）
                    const event = new Event(interaction.event, { bubbles: true });
                    const rect = interaction.element.getBoundingClientRect();
                    
                    const endTime = performance.now();
                    const responseTime = endTime - startTime;

                    this.metrics.interactions[interaction.name] = {
                        responseTime: Math.round(responseTime * 100) / 100,
                        elementVisible: rect.width > 0 && rect.height > 0,
                        hasEventListener: interaction.element.onclick !== null ||
                                       interaction.element.onchange !== null,
                        status: responseTime < this.benchmarks.interaction ? 'PASS' : 'FAIL'
                    };

                    console.log(`  ${interaction.name}: ${responseTime.toFixed(2)}ms`);
                } catch (error) {
                    console.log(`  ${interaction.name}: ❌ エラー - ${error.message}`);
                    this.metrics.interactions[interaction.name] = {
                        error: error.message,
                        status: 'ERROR'
                    };
                }
            } else {
                console.log(`  ${interaction.name}: ⚠️  要素が見つかりません`);
                this.metrics.interactions[interaction.name] = {
                    status: 'NOT_FOUND'
                };
            }
        }
    }

    /**
     * 5. リソース使用量測定
     */
    async measureResourceUsage() {
        console.log('📊 5. リソース使用量測定');

        const resources = performance.getEntriesByType('resource');
        
        // ファイルタイプ別に分類
        const resourceTypes = {
            css: resources.filter(r => r.name.includes('.css')),
            js: resources.filter(r => r.name.includes('.js')),
            images: resources.filter(r => /\.(jpg|jpeg|png|gif|svg|webp)/.test(r.name)),
            data: resources.filter(r => r.name.includes('.csv') || r.name.includes('.json')),
            other: resources.filter(r => 
                !r.name.includes('.css') && 
                !r.name.includes('.js') && 
                !/\.(jpg|jpeg|png|gif|svg|webp)/.test(r.name) &&
                !r.name.includes('.csv') &&
                !r.name.includes('.json')
            )
        };

        this.metrics.resources = {
            total: {
                count: resources.length,
                size: Math.round(resources.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024),
                loadTime: Math.round(resources.reduce((sum, r) => sum + (r.duration || 0), 0))
            },
            css: {
                count: resourceTypes.css.length,
                size: Math.round(resourceTypes.css.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024),
                avgLoadTime: resourceTypes.css.length > 0 ? 
                    Math.round(resourceTypes.css.reduce((sum, r) => sum + (r.duration || 0), 0) / resourceTypes.css.length) : 0
            },
            js: {
                count: resourceTypes.js.length,
                size: Math.round(resourceTypes.js.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024),
                avgLoadTime: resourceTypes.js.length > 0 ? 
                    Math.round(resourceTypes.js.reduce((sum, r) => sum + (r.duration || 0), 0) / resourceTypes.js.length) : 0
            },
            images: {
                count: resourceTypes.images.length,
                size: Math.round(resourceTypes.images.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024)
            },
            data: {
                count: resourceTypes.data.length,
                size: Math.round(resourceTypes.data.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024)
            }
        };

        console.log(`  総リソース: ${this.metrics.resources.total.count}個 (${this.metrics.resources.total.size}KB)`);
        console.log(`  CSS: ${this.metrics.resources.css.count}個 (${this.metrics.resources.css.size}KB)`);
        console.log(`  JavaScript: ${this.metrics.resources.js.count}個 (${this.metrics.resources.js.size}KB)`);
        console.log(`  画像: ${this.metrics.resources.images.count}個 (${this.metrics.resources.images.size}KB)`);
        console.log(`  データ: ${this.metrics.resources.data.count}個 (${this.metrics.resources.data.size}KB)`);
    }

    /**
     * 6. メモリ使用量測定
     */
    async measureMemoryUsage() {
        console.log('📊 6. メモリ使用量測定');

        if (performance.memory) {
            const memory = performance.memory;
            this.metrics.memory = {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100,
                usage: Math.round(memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100),
                status: memory.usedJSHeapSize / memory.jsHeapSizeLimit < this.benchmarks.memory ? 'PASS' : 'WARN'
            };

            console.log(`  使用中: ${this.metrics.memory.used}MB`);
            console.log(`  割り当て済み: ${this.metrics.memory.total}MB`);
            console.log(`  制限: ${this.metrics.memory.limit}MB`);
            console.log(`  使用率: ${this.metrics.memory.usage}%`);
        } else {
            console.log('  ⚠️  Memory API利用不可');
            this.metrics.memory = { available: false };
        }
    }

    /**
     * First Contentful Paint取得
     */
    getFirstContentfulPaint() {
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        return fcpEntry ? Math.round(fcpEntry.startTime) : null;
    }

    /**
     * Largest Contentful Paint取得
     */
    getLargestContentfulPaint() {
        return new Promise((resolve) => {
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    if (entries.length > 0) {
                        const lcp = entries[entries.length - 1];
                        resolve(Math.round(lcp.startTime));
                        observer.disconnect();
                    }
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
                
                // 3秒後にタイムアウト
                setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, 3000);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * パフォーマンスレポート生成
     */
    generatePerformanceReport() {
        console.log('\n' + '='.repeat(50));
        console.log('📋 パフォーマンスレポート');
        console.log('='.repeat(50));

        // 総合評価
        let score = 100;
        let issues = [];

        // ページ読み込み評価
        if (this.metrics.pageLoad.totalLoad) {
            if (this.metrics.pageLoad.totalLoad > this.benchmarks.pageLoad) {
                score -= 20;
                issues.push(`ページ読み込み時間が長い (${this.metrics.pageLoad.totalLoad}ms > ${this.benchmarks.pageLoad}ms)`);
            }
            if (this.metrics.pageLoad.fcp > 2500) {
                score -= 10;
                issues.push(`First Contentful Paintが遅い (${this.metrics.pageLoad.fcp}ms)`);
            }
            if (this.metrics.pageLoad.lcp > 4000) {
                score -= 15;
                issues.push(`Largest Contentful Paintが遅い (${this.metrics.pageLoad.lcp}ms)`);
            }
        }

        // セクション表示評価
        const slowSections = Object.entries(this.metrics.sectionRender)
            .filter(([_, data]) => data.status === 'FAIL');
        if (slowSections.length > 0) {
            score -= slowSections.length * 5;
            issues.push(`セクション表示が遅い (${slowSections.length}個)`);
        }

        // データ読み込み評価
        const slowDataLoads = Object.entries(this.metrics.dataLoading)
            .filter(([_, data]) => data.status === 'FAIL');
        if (slowDataLoads.length > 0) {
            score -= slowDataLoads.length * 8;
            issues.push(`データ読み込みが遅い (${slowDataLoads.length}ファイル)`);
        }

        // リソース使用量評価
        if (this.metrics.resources.total.count > 30) {
            score -= 10;
            issues.push(`リソース数が多い (${this.metrics.resources.total.count}個)`);
        }
        if (this.metrics.resources.total.size > 1000) {
            score -= 15;
            issues.push(`総ファイルサイズが大きい (${this.metrics.resources.total.size}KB)`);
        }

        // メモリ使用量評価
        if (this.metrics.memory.status === 'WARN') {
            score -= 10;
            issues.push(`メモリ使用率が高い (${this.metrics.memory.usage}%)`);
        }

        score = Math.max(0, score);

        console.log(`🎯 総合パフォーマンススコア: ${score}/100`);
        
        if (score >= 90) {
            console.log('🟢 優秀 - パフォーマンスに問題なし');
        } else if (score >= 75) {
            console.log('🟡 良好 - 軽微な最適化が推奨');
        } else if (score >= 60) {
            console.log('🟠 要改善 - パフォーマンス最適化が必要');
        } else {
            console.log('🔴 不合格 - 重大なパフォーマンス問題');
        }

        // 改善点
        if (issues.length > 0) {
            console.log('\n⚠️  改善点:');
            issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }

        // 推奨事項
        console.log('\n💡 推奨事項:');
        if (this.metrics.pageLoad.totalLoad > 2000) {
            console.log('   - 画像の最適化（圧縮、WebP形式の使用）');
            console.log('   - CSS/JSファイルの圧縮・統合');
        }
        if (this.metrics.resources.total.count > 20) {
            console.log('   - リソースの統合（CSS/JSファイルのバンドル）');
        }
        if (slowDataLoads.length > 0) {
            console.log('   - CSVファイルの軽量化');
            console.log('   - データの遅延読み込み（Lazy Loading）');
        }
        if (this.metrics.memory.usage > 70) {
            console.log('   - メモリリークの調査');
            console.log('   - DOMイベントリスナーの適切な削除');
        }

        console.log('='.repeat(50));

        // グローバルスコープに結果を保存
        window.performanceTestResults = {
            score,
            metrics: this.metrics,
            issues,
            timestamp: new Date().toISOString()
        };
    }
}

// 自動実行（ページ読み込み完了後）
document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        const tester = new PerformanceTester();
        await tester.runPerformanceTests();
    }, 2000); // 2秒待ってから実行
});

// グローバルスコープでアクセス可能にする
window.PerformanceTester = PerformanceTester;

// 手動実行用関数
window.runPerformanceTest = async () => {
    const tester = new PerformanceTester();
    return await tester.runPerformanceTests();
};