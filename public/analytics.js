// Analytics Configuration
// このファイルでGoogle AnalyticsとMicrosoft Clarityのタグを一元管理します

(function() {
    // ===== 設定エリア =====
    // Google Analytics測定ID（GA4）
    const GA_MEASUREMENT_ID = 'G-8SB7HZWDT9'; // ここにGA4の測定IDを入力してください
    
    // Microsoft Clarity Project ID
    const CLARITY_PROJECT_ID = 'slrv9lq41p'; // ここにClarityのProject IDを入力してください
    
    // 本番環境でのみ動作させる場合は true に設定
    const PRODUCTION_ONLY = false;
    
    // ===== 設定エリア終了 =====

    // 本番環境チェック
    const isProduction = window.location.hostname !== 'localhost' && 
                        !window.location.hostname.includes('127.0.0.1') &&
                        !window.location.hostname.includes('staging');

    if (PRODUCTION_ONLY && !isProduction) {
        console.log('Analytics: Skipped loading (not production environment)');
        return;
    }

    // Google Analytics (GA4) の初期化
    if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
        // gtag.jsを動的に読み込み
        const gtagScript = document.createElement('script');
        gtagScript.async = true;
        gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(gtagScript);

        // gtag設定
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
            // 追加の設定オプション
            'anonymize_ip': true, // IPアドレスの匿名化
            'cookie_flags': 'SameSite=None;Secure', // クロスサイトクッキー対応
            'send_page_view': true // ページビューの自動送信
        });

        console.log('Analytics: Google Analytics loaded');
    } else {
        console.warn('Analytics: Google Analytics ID not configured');
    }

    // Microsoft Clarity の初期化
    if (CLARITY_PROJECT_ID && CLARITY_PROJECT_ID !== 'XXXXXXXXXX') {
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", CLARITY_PROJECT_ID);

        console.log('Analytics: Microsoft Clarity loaded');
    } else {
        console.warn('Analytics: Microsoft Clarity ID not configured');
    }

    // カスタムイベント送信用のヘルパー関数
    window.trackEvent = function(eventName, eventParams) {
        // Google Analyticsにイベント送信
        if (window.gtag && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
            gtag('event', eventName, eventParams);
        }
        
        // Clarityにカスタムタグを送信（オプション）
        if (window.clarity && CLARITY_PROJECT_ID !== 'XXXXXXXXXX') {
            clarity('set', eventName, eventParams);
        }
    };

    // ページ遷移時のトラッキング（SPAサポート）
    let lastUrl = window.location.href;
    const observer = new MutationObserver(function() {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            
            // Google Analyticsにページビューを送信
            if (window.gtag && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
                gtag('event', 'page_view', {
                    page_location: currentUrl,
                    page_path: window.location.pathname
                });
            }
        }
    });

    // body要素の変更を監視
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();