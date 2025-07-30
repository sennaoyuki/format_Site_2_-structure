// Google Analytics Event Tracking for TOP page
// This script tracks user interactions and page transitions

(function() {
    'use strict';

    // GTMが利用可能になるまで待機
    function waitForGTM(callback) {
        if (typeof window.dataLayer !== 'undefined') {
            callback();
        } else {
            setTimeout(() => waitForGTM(callback), 100);
        }
    }

    // イベントをGTMに送信
    function trackEvent(eventCategory, eventAction, eventLabel, eventValue) {
        if (typeof window.dataLayer !== 'undefined') {
            // GA4形式のイベント送信
            window.dataLayer.push({
                'event': eventAction.toLowerCase().replace(/\s+/g, '_'), // イベント名をGA4形式に変換
                'event_category': eventCategory,
                'event_label': eventLabel || undefined,
                'value': eventValue || undefined,
                // カスタムイベントも同時に送信（GTMトリガー用）
                'custom_event_trigger': 'customEvent'
            });
            
            // デバッグ用コンソール出力
            console.log('Event tracked:', {
                event: eventAction.toLowerCase().replace(/\s+/g, '_'),
                category: eventCategory,
                label: eventLabel,
                value: eventValue
            });
        }
    }

    // クリックトラッキングの設定
    function setupClickTracking() {
        // 1. 公式サイトリンクのトラッキング
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a.link_btn');
            if (target) {
                const clinicName = target.closest('tr')?.querySelector('.clinic-link')?.textContent || 'Unknown';
                trackEvent('Outbound Link', 'Click', `公式サイト - ${clinicName}`, 1);
            }
        });

        // 2. 詳細を見るボタンのトラッキング
        document.addEventListener('click', function(e) {
            const target = e.target.closest('a.detail_btn');
            if (target) {
                const clinicName = target.closest('tr')?.querySelector('.clinic-link')?.textContent || 'Unknown';
                trackEvent('Internal Navigation', 'Click', `詳細を見る - ${clinicName}`, 1);
            }
        });

        // 3. ランキングクリニックのトラッキング
        document.addEventListener('click', function(e) {
            const target = e.target.closest('.ranking-item');
            if (target) {
                const clinicId = target.getAttribute('data-clinic-id');
                const clinicName = target.querySelector('.clinic-name')?.textContent || 'Unknown';
                const rank = target.querySelector('.rank-badge')?.textContent?.replace(/[^\d]/g, '') || 'Unknown';
                trackEvent('Ranking', 'Click', `${rank}位 - ${clinicName}`, parseInt(rank));
            }
        });

        // 4. Tipsタブのトラッキング
        const tipsTabs = document.querySelectorAll('.tips-container .tab');
        tipsTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabText = this.querySelector('.tab-text')?.textContent || this.textContent;
                trackEvent('Tips Tab', 'Click', tabText, parseInt(this.getAttribute('data-tab')) + 1);
            });
        });

        // 5. 比較表タブのトラッキング
        const comparisonTabs = document.querySelectorAll('.comparison-tab-menu-item');
        comparisonTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabText = this.textContent;
                trackEvent('Comparison Tab', 'Click', tabText);
            });
        });

        // 6. ハンバーガーメニューのトラッキング
        const hamburgerMenu = document.getElementById('hamburger-menu');
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', function() {
                const isActive = document.getElementById('sidebar-menu')?.classList.contains('active');
                trackEvent('Navigation', 'Click', `ハンバーガーメニュー - ${isActive ? 'Close' : 'Open'}`);
            });
        }

        // 7. 地域選択のトラッキング
        const regionSelect = document.getElementById('sidebar-region-select');
        if (regionSelect) {
            regionSelect.addEventListener('change', function() {
                const selectedText = this.options[this.selectedIndex]?.text || 'Unknown';
                trackEvent('Filter', 'Change', `地域選択 - ${selectedText}`, this.value);
            });
        }

        // 8. フッターリンクのトラッキング
        const footerLinks = document.querySelectorAll('#footer a');
        footerLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const linkText = this.textContent;
                const href = this.getAttribute('href');
                
                if (href && href.startsWith('http')) {
                    trackEvent('Footer', 'External Link', linkText);
                } else if (href && href.startsWith('mailto:')) {
                    trackEvent('Footer', 'Email', linkText);
                } else {
                    trackEvent('Footer', 'Internal Link', linkText);
                }
            });
        });

        // 9. 検索機能のトラッキング
        const searchInput = document.getElementById('sidebar-clinic-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    if (this.value.trim()) {
                        trackEvent('Search', 'Input', `検索: ${this.value}`, this.value.length);
                    }
                }, 1000); // 1秒後に送信
            });
        }

        // 10. 詳細検索ページへのリンク
        const searchPageLink = document.querySelector('.sidebar-search-link');
        if (searchPageLink) {
            searchPageLink.addEventListener('click', function() {
                trackEvent('Navigation', 'Click', '詳細検索ページへ');
            });
        }
    }

    // スクロールトラッキングの設定
    function setupScrollTracking() {
        let scrollPercentages = [25, 50, 75, 90, 100];
        let trackedPercentages = new Set();
        
        function getScrollPercentage() {
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = window.pageYOffset;
            return Math.round((scrolled / docHeight) * 100);
        }
        
        window.addEventListener('scroll', function() {
            const currentPercentage = getScrollPercentage();
            
            scrollPercentages.forEach(percentage => {
                if (currentPercentage >= percentage && !trackedPercentages.has(percentage)) {
                    trackedPercentages.add(percentage);
                    trackEvent('Scroll Depth', 'Percentage', `${percentage}%`, percentage);
                }
            });
        });
    }

    // ページ滞在時間のトラッキング
    function setupTimeTracking() {
        const startTime = Date.now();
        const timeIntervals = [10, 30, 60, 120, 180]; // 秒単位
        const trackedIntervals = new Set();
        
        setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            
            timeIntervals.forEach(interval => {
                if (elapsedSeconds >= interval && !trackedIntervals.has(interval)) {
                    trackedIntervals.add(interval);
                    trackEvent('Engagement', 'Time on Page', `${interval}秒経過`, interval);
                }
            });
        }, 1000);
    }

    // 初期化
    function init() {
        waitForGTM(() => {
            console.log('Analytics tracking initialized');
            
            // ページビューイベント
            trackEvent('Page View', 'Load', window.location.pathname);
            
            // 各種トラッキングの設定
            setupClickTracking();
            setupScrollTracking();
            setupTimeTracking();
            
            // 地域パラメータの記録
            const urlParams = new URLSearchParams(window.location.search);
            const regionId = urlParams.get('region_id');
            if (regionId) {
                trackEvent('Page View', 'Region Parameter', regionId);
            }
        });
    }

    // DOMContentLoadedで初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();