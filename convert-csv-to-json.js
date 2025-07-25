const fs = require('fs');
const path = require('path');

// CSVパーサー
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        data.push(obj);
    }

    return data;
}

// 対応部位のマッピング（ハードコードされていた部分）
const bodyPartsMap = {
    'ディオクリニック': ['face', 'upperarm', 'stomach', 'buttocks', 'thigh'],
    'エミナルクリニック': ['upperarm', 'stomach', 'buttocks', 'thigh'],
    'ウララクリニック': ['face', 'stomach', 'buttocks', 'thigh'],
    'リエートクリニック': ['face', 'upperarm', 'stomach', 'buttocks', 'thigh'],
    '湘南美容クリニック': ['face', 'upperarm', 'stomach', 'buttocks', 'thigh', 'other']
};

// クリニックの特徴
const clinicFeatures = {
    'ディオクリニック': '419万通りのメニューから選べるオーダーメイド医療ダイエット',
    'エミナルクリニック': '注射が苦手な方も安心！医療機器メインの痩身プログラム',
    'ウララクリニック': '次世代医療テクノロジーで健康的に美しく痩せる',
    'リエートクリニック': '非侵襲的な施術でダウンタイムなし！即日常生活に戻れます',
    '湘南美容クリニック': '豊富な脂肪溶解注射メニューで理想のボディデザインを実現'
};

// メイン処理
async function convertCSVtoJSON() {
    console.log('📍 CSV → JSON変換開始...\n');

    // CSVファイルを読み込み
    const dataDir = path.join(__dirname, 'public/data');
    
    // 1. 地域データ
    console.log('1️⃣ 地域データを読み込み中...');
    const regionCSV = fs.readFileSync(path.join(dataDir, '出しわけSS - region.csv'), 'utf8');
    const regions = parseCSV(regionCSV).map(row => ({
        id: row.parameter_no,
        name: row.region
    }));
    console.log(`   ✅ ${regions.length}件の地域データ`);

    // 2. クリニックデータ
    console.log('\n2️⃣ クリニックデータを読み込み中...');
    const clinicCSV = fs.readFileSync(path.join(dataDir, '出しわけSS - items.csv'), 'utf8');
    const clinics = parseCSV(clinicCSV);
    console.log(`   ✅ ${clinics.length}件のクリニックデータ`);

    // 3. 店舗データ
    console.log('\n3️⃣ 店舗データを読み込み中...');
    const storeCSV = fs.readFileSync(path.join(dataDir, '出しわけSS - stores.csv'), 'utf8');
    const stores = parseCSV(storeCSV);
    console.log(`   ✅ ${stores.length}件の店舗データ`);

    // 4. ランキングデータ
    console.log('\n4️⃣ ランキングデータを読み込み中...');
    const rankingCSV = fs.readFileSync(path.join(dataDir, '出しわけSS - ranking.csv'), 'utf8');
    const rankings = parseCSV(rankingCSV);
    console.log(`   ✅ ${rankings.length}件のランキングデータ`);

    // 5. 店舗ビューデータ
    console.log('\n5️⃣ 店舗ビューデータを読み込み中...');
    const storeViewCSV = fs.readFileSync(path.join(dataDir, '出しわけSS - store_view.csv'), 'utf8');
    const storeViews = parseCSV(storeViewCSV);
    console.log(`   ✅ ${storeViews.length}件の店舗ビューデータ`);

    // 6. キャンペーンデータ
    console.log('\n6️⃣ キャンペーンデータを読み込み中...');
    const campaignCSV = fs.readFileSync(path.join(dataDir, '出しわけSS - campaigns.csv'), 'utf8');
    const campaigns = parseCSV(campaignCSV);
    console.log(`   ✅ ${campaigns.length}件のキャンペーンデータ`);

    // データを統合して構造化
    console.log('\n📊 データを統合中...');
    
    // クリニック名のマッピング（CSV間の不一致を解決）
    const clinicNameMapping = {
        'ディオクリニック': 'DIO',
        'エミナルクリニック': 'エミナルクリニック',
        'ウララクリニック': 'ウララクリニック', 
        'リエートクリニック': 'リエートクリニック',
        '湘南美容クリニック': '湘南美容クリニック'
    };
    
    // クリニックごとにデータを集約
    const compiledClinics = clinics.map(clinic => {
        const clinicName = clinic.clinic_name;
        const storeClinicName = clinicNameMapping[clinicName] || clinicName;
        
        // 該当クリニックの全店舗を取得
        const clinicStores = stores.filter(store => 
            store.clinic_name === storeClinicName || 
            store.clinic_name === clinicName || 
            store.clinic_name === clinic.code
        );
        
        // 店舗が存在する地域IDを取得
        const clinicRegions = new Set();
        clinicStores.forEach(store => {
            // 住所から地域を判断
            regions.forEach(region => {
                if (store.adress && store.adress.includes(region.name)) {
                    clinicRegions.add(region.id);
                }
            });
        });
        
        return {
            id: clinic.clinic_id,
            code: clinic.code,
            name: clinicName,
            regions: Array.from(clinicRegions).sort(),
            storeCount: clinicStores.length,
            bodyParts: bodyPartsMap[clinicName] || ['stomach', 'thigh'],
            features: clinicFeatures[clinicName] || '医療ダイエット専門クリニック',
            stores: clinicStores.map(store => ({
                id: store.store_id,
                name: store.store_name,
                address: store.adress,
                zipcode: store.Zipcode,
                access: store.access
            }))
        };
    });

    // ランキングデータを地域ごとに整理
    const rankingsByRegion = {};
    rankings.forEach(ranking => {
        const regionId = ranking.parameter_no;
        rankingsByRegion[regionId] = {
            no1: ranking.no1,
            no2: ranking.no2,
            no3: ranking.no3,
            no4: ranking.no4,
            no5: ranking.no5
        };
    });

    // 店舗ビューデータを地域ごとに整理
    const storeViewsByRegion = {};
    storeViews.forEach(view => {
        const regionId = view.parameter_no;
        storeViewsByRegion[regionId] = {
            clinic_1: view.clinic_1 ? view.clinic_1.split('/') : [],
            clinic_2: view.clinic_2 ? view.clinic_2.split('/') : [],
            clinic_3: view.clinic_3 ? view.clinic_3.split('/') : [],
            clinic_4: view.clinic_4 ? view.clinic_4.split('/') : [],
            clinic_5: view.clinic_5 ? view.clinic_5.split('/') : []
        };
    });

    // 統合データ
    const compiledData = {
        regions: regions,
        clinics: compiledClinics,
        rankings: rankingsByRegion,
        storeViews: storeViewsByRegion,
        campaigns: campaigns.map(campaign => ({
            id: campaign.campaign_id,
            regionId: campaign.region_id,
            clinicId: campaign.clinic_id,
            title: campaign.title,
            headerText: campaign.header_text,
            logoSrc: campaign.logo_src,
            logoAlt: campaign.logo_alt,
            description: campaign.description,
            ctaText: campaign.cta_text,
            ctaUrl: campaign.cta_url,
            footerText: campaign.footer_text
        })),
        metadata: {
            lastUpdated: new Date().toISOString(),
            totalClinics: clinics.length,
            totalStores: stores.length,
            totalRegions: regions.length
        }
    };

    // JSONファイルとして保存
    const outputPath = path.join(dataDir, 'compiled-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(compiledData, null, 2), 'utf8');
    
    console.log('\n✅ 変換完了！');
    console.log(`📁 出力先: ${outputPath}`);
    console.log(`📊 ファイルサイズ: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    
    // 統計情報
    console.log('\n📈 統計情報:');
    compiledClinics.forEach(clinic => {
        console.log(`   ${clinic.name}: ${clinic.storeCount}店舗, ${clinic.regions.length}地域`);
    });
}

// 実行
convertCSVtoJSON().catch(console.error);