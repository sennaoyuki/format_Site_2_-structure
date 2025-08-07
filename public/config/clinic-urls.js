// Centralized Clinic URLs Configuration  
// バージョン: v2.2.0 - 2025-08-07 15:45 JST
// 変更: param2をADIDからUTM_CREATIVEに変更 + キャッシュバスティング
window.CLINIC_URLS = {
    dio: {
        name: 'ディオクリニック',
        baseUrl: 'https://sss.ac01.l-ad.net/cl/p1a64143O61e70f7/?bid=a6640dkh37648h88&param2=UTM_CREATIVE_PLACEHOLDER&param3=GCLID_PLACEHOLDER',
        defaultParams: {}
    },
    eminal: {
        name: 'エミナルクリニック',
        baseUrl: 'https://track.affiliate-b.com/visit.php?guid=ON&a=J13276Y-A404681S&p=08812180&param3=GCLID_PLACEHOLDER',
        defaultParams: {}
    },
    lieto: {
        name: 'リエートクリニック',
        baseUrl: 'https://www.tcs-asp.net/alink?AC=C113028&LC=LETMM1&SQ=0&isq=100&param3=GCLID_PLACEHOLDER',
        defaultParams: {
            TRFLG: '1'
        }
    },
    sbc: {
        name: '湘南美容クリニック',
        baseUrl: 'https://www.tcs-asp.net/alink?AC=C113028&LC=SBC16&SQ=1&isq=100&param3=GCLID_PLACEHOLDER',
        defaultParams: {
            TRFLG: '1'
        }
    },
    urara: {
        name: 'うららクリニック',
        baseUrl: 'https://track.affiliate-b.com/visit.php?guid=ON&a=r12659B-E392430h&p=08812180&param3=GCLID_PLACEHOLDER',
        defaultParams: {}
    }
};