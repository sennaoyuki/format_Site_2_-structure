// CATSリファラー認識テスト用の修正版リダイレクトページ
const alternativeRedirectMethods = {
    
    // 方法1: location.replace (履歴に残らない)
    method1_locationReplace: `
        setTimeout(() => {
            window.location.replace(finalUrl);
        }, 3000);
    `,
    
    // 方法2: 即座にリダイレクト（待機時間なし）
    method2_immediate: `
        // すぐにリダイレクト
        window.location.href = finalUrl;
    `,
    
    // 方法3: メタリフレッシュ + JavaScript
    method3_metaRefresh: `
        // メタタグを動的に追加
        const meta = document.createElement('meta');
        meta.httpEquiv = 'refresh';
        meta.content = '0;url=' + finalUrl;
        document.head.appendChild(meta);
        
        // フォールバック
        setTimeout(() => {
            window.location.href = finalUrl;
        }, 1000);
    `,
    
    // 方法4: フォーム送信
    method4_formSubmit: `
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = baseUrl;
        
        // パラメータを隠しフィールドとして追加
        for (const [key, value] of urlParams) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }
        
        document.body.appendChild(form);
        setTimeout(() => {
            form.submit();
        }, 3000);
    `,
    
    // 方法5: より自然なリファラー送信
    method5_naturalClick: `
        // リンクを動的に作成して自動クリック
        const link = document.createElement('a');
        link.href = finalUrl;
        link.target = '_self';
        link.rel = 'noopener';
        document.body.appendChild(link);
        
        setTimeout(() => {
            link.click();
        }, 3000);
    `
};

console.log('CATSリファラー認識のための代替手法:');
console.log(alternativeRedirectMethods);