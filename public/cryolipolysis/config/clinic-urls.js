// クリニックURLの一元管理
// このファイルを編集することで、すべての遷移先URLを一括で変更できます

const CLINIC_URLS = {
    // ディオクリニック
    dio: {
        name: 'ディオクリニック',
        baseUrl: 'https://sss.ac01.l-ad.net/cl/p1a64143O61e70f7/?bid=a6640dkh37648h88&param2=UTM_CREATIVE_PLACEHOLDER&param3=GCLID_PLACEHOLDER',
        // 必要に応じて追加のパラメータを設定可能
        defaultParams: {}
    },
    
    // エミナルクリニック
    eminal: {
        name: 'エミナルクリニック',
        baseUrl: 'https://eminal-clinic.jp/lp01/medicaldiet_03/?sokyucd=5003',
        defaultParams: {}
    },
    
    // ウララクリニック
    urara: {
        name: 'ウララクリニック',
        baseUrl: 'https://uraraclinic.jp/',
        defaultParams: {}
    },
    
    // リエートクリニック
    lieto: {
        name: 'リエートクリニック',
        baseUrl: 'https://lietoclinic.com/lpbot/lpbot07kana15',
        defaultParams: {}
    },
    
    // 湘南美容クリニック
    sbc: {
        name: '湘南美容クリニック',
        baseUrl: 'https://www.s-b-c.net/slimming/',
        defaultParams: {}
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.CLINIC_URLS = CLINIC_URLS;
}

// Node.js環境でも使えるようにエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CLINIC_URLS;
}