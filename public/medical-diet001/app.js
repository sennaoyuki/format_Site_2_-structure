// クリニックURLを中央管理から取得
function getClinicUrlFromConfig(clinicId) {
    const clinicMap = {
        '1': 'dio',
        '2': 'eminal', 
        '3': 'urara',
        '4': 'lieto',
        '5': 'sbc'
    };
    
    const clinicSlug = clinicMap[clinicId];
    if (window.CLINIC_URLS && window.CLINIC_URLS[clinicSlug]) {
        return window.CLINIC_URLS[clinicSlug].baseUrl;
    }
    
    // フォールバック
    return 'https://sss.ac01.l-ad.net/cl/p1a64143O61e70f7/?bid=a6640dkh37648h88';
}

// URLパラメータ処理クラス
class UrlParamHandler {
    getParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    setParam(name, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(name, value);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    }

    getAllParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    }

    getRegionId() {
        return this.getParam('region_id') || '013'; // デフォルトは東京
    }

    updateRegionId(regionId) {
        this.setParam('region_id', regionId);
    }

    // クリニックURLにregion_idパラメータを付与するヘルパー関数（リダイレクトページ経由）
    getClinicUrlWithRegionId(clinicId) {
        const redirectUrls = {
            '1': '/draft/go/dio/',
            '2': '/draft/go/eminal/',
            '3': '/draft/go/urara/',
            '4': '/draft/go/lieto/',
            '5': '/draft/go/sbc/'
        };
        
        const redirectUrl = redirectUrls[clinicId];
        if (!redirectUrl) return '#';
        
        // 現在のURLパラメータを全て取得
        const currentParams = new URLSearchParams(window.location.search);
        
        // region_idがない場合は現在の地域IDを設定
        if (!currentParams.has('region_id')) {
            currentParams.set('region_id', this.getRegionId());
        }
        
        // リダイレクトURLにパラメータを付与
        const finalUrl = redirectUrl + (currentParams.toString() ? '?' + currentParams.toString() : '');
        return finalUrl;
    }

    // クリニック名からURLを生成してregion_idパラメータを付与するヘルパー関数（リダイレクトページ経由）
    getClinicUrlByNameWithRegionId(clinicName) {
        const redirectUrls = {
            'dio': '/draft/go/dio/',
            'eminal': '/draft/go/eminal/',
            'urara': '/draft/go/urara/',
            'lieto': '/draft/go/lieto/',
            'sbc': '/draft/go/sbc/'
        };
        
        const redirectUrl = redirectUrls[clinicName];
        if (!redirectUrl) return '#';
        
        // 現在のURLパラメータを全て取得
        const currentParams = new URLSearchParams(window.location.search);
        
        // region_idがない場合は現在の地域IDを設定
        if (!currentParams.has('region_id')) {
            currentParams.set('region_id', this.getRegionId());
        }
        
        // リダイレクトURLにパラメータを付与
        const finalUrl = redirectUrl + (currentParams.toString() ? '?' + currentParams.toString() : '');
        return finalUrl;
    }
}

// 表示管理クラス
class DisplayManager {
    constructor(urlHandler) {
        this.urlHandler = urlHandler;
        this.regionSelect = document.getElementById('sidebar-region-select');
        this.searchInput = document.getElementById('sidebar-clinic-search');
        this.selectedRegionName = document.getElementById('selected-region-name');
        this.rankingList = document.getElementById('ranking-list');
        this.storesList = document.getElementById('stores-list');
        this.errorMessage = document.getElementById('error-message');
        this.errorText = document.getElementById('error-text');
        this.heroRegionBadge = document.getElementById('hero-region-badge');
        
        // ハンバーガーメニュー要素
        this.hamburgerMenu = document.getElementById('hamburger-menu');
        this.sidebarMenu = document.getElementById('sidebar-menu');
        this.sidebarOverlay = document.getElementById('sidebar-overlay');
        this.closeSidebar = document.getElementById('close-sidebar');
    }

    // 地域セレクターを更新（検索用、現在の地域選択は反映しない）
    updateRegionSelector(regions, selectedRegionId) {
        if (!this.regionSelect) {
            console.warn('Region selector not found');
            return;
        }
        this.regionSelect.innerHTML = '';
        
        // 「全地域」オプションを追加
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = '全地域';
        allOption.selected = true; // デフォルトで「全地域」を選択
        this.regionSelect.appendChild(allOption);
        
        // 各地域を追加
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region.id;
            option.textContent = region.name;
            // 現在の地域選択は反映しない
            this.regionSelect.appendChild(option);
        });
    }

    // 選択された地域名を表示（アクセシビリティ対応）
    updateSelectedRegionName(regionName) {
        if (this.selectedRegionName) {
            this.selectedRegionName.textContent = regionName || '該当店舗なし';
        }
        // ヒーローバッジも更新
        if (this.heroRegionBadge) {
            this.heroRegionBadge.textContent = regionName ? `${regionName}版` : '東京版';
        }
    }

    updateRankingDisplay(clinics, ranking) {
        this.rankingList.innerHTML = '';

        if (!ranking || Object.keys(ranking.ranks).length === 0) {
            this.rankingList.innerHTML = '<div class="empty-state"><p>この地域のランキングデータはありません</p></div>';
            return;
        }

        // ランキング順に表示（no1, no2, no3...の順番でソート）
        const sortedRanks = Object.entries(ranking.ranks).sort((a, b) => {
            const numA = parseInt(a[0].replace('no', ''));
            const numB = parseInt(b[0].replace('no', ''));
            return numA - numB;
        });

        sortedRanks.forEach(([position, clinicId]) => {
            const clinic = clinics.find(c => c.id === clinicId);
            if (!clinic) return;

            const rankNum = parseInt(position.replace('no', ''));
            
            // 5位までに制限
            if (rankNum > 5) return;
            
            // ランキングアイテムのコンテナ
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item rank-${rankNum}`;

            // メダルクラスの設定
            let medalClass = '';
            let medalText = `No.${rankNum}`;
            if (rankNum === 1) medalClass = 'gold-medal';
            else if (rankNum === 2) medalClass = 'silver-medal';
            else if (rankNum === 3) medalClass = 'bronze-medal';

            // 評価スコアとスターの生成（仮のデータ）
            const ratings = {
                1: { score: 4.9, stars: 5 },
                2: { score: 4.5, stars: 4.5 },
                3: { score: 4.3, stars: 4.3 },
                4: { score: 4.1, stars: 4.1 },
                5: { score: 3.8, stars: 3.8 }
            };
            const rating = ratings[rankNum] || { score: 4.5, stars: 4 };

            // スターのHTML生成
            let starsHtml = '';
            const fullStars = Math.floor(rating.stars);
            const hasHalfStar = rating.stars % 1 !== 0;
            
            for (let i = 0; i < fullStars; i++) {
                starsHtml += '<i class="fas fa-star"></i>';
            }
            if (hasHalfStar) {
                starsHtml += '<i class="fas fa-star-half-alt"></i>';
            }
            for (let i = Math.ceil(rating.stars); i < 5; i++) {
                starsHtml += '<i class="far fa-star"></i>';
            }

            // バナー画像の設定（クリニックIDに基づく）
            const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
            const bannerImages = {
                1: `${imagesPath}/clinics/dio/dio-logo.webp`,
                2: `${imagesPath}/clinics/eminal/eminal-logo.webp`,
                3: `${imagesPath}/clinics/urara/urara-logo.webp`,
                4: `${imagesPath}/clinics/lieto/lieto-logo.webp`,
                5: `${imagesPath}/clinics/sbc/sbc-logo.webp`
            };
            const bannerImage = bannerImages[clinic.id] || `${imagesPath}/clinics/dio/dio-logo.webp`;

            // 押しメッセージの定義
            const pushMessages = {
                1: "2025年のイチ押し！\n業界屈指のコスパ",
                2: "次世代医療！\n成功率94%の実績",
                3: "厚労省承認マシン\n科学的に脂肪を減らす",
                4: "多店舗展開\nエミナル",
                5: "大手美容クリニック\nメニュー豊富"
            };
            const pushMessage = pushMessages[rankNum] || "人気のクリニック";

            rankingItem.innerHTML = `
                <div class="rank-medal ${medalClass}">
                    <img src="/images/badges/rank-${rankNum}.svg" alt="${medalText}" class="medal-image">
                </div>
                <div class="clinic-card">
                    <div class="satisfaction-badge">
                        <span class="satisfaction-label">満足度</span>
                    </div>
                    <div class="rating-section">
                        <div class="stars">
                            ${starsHtml}
                        </div>
                        <div class="rating-score">${rating.score}<span class="score-max">/5.0</span></div>
                    </div>
                    <div class="clinic-logo-section">
                        <h3>${clinic.name}</h3>
                    </div>
                    <div class="clinic-banner">
                        <img src="${bannerImage}" alt="${clinic.name}バナー" onerror="this.style.display='none'">
                    </div>
                    <div class="push-message" style="padding: 0px; text-align: center; font-size: clamp(10px, 2.3vw, 15px); line-height: 1.4; color: #333; font-weight: bold; margin: 4px 0; height: 15%;">
                        ${pushMessage}
                    </div>
                    <p class="btn btn_second_primary">
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id)}" target="_blank" rel="noopener">
                            <span class="bt_s">公式サイト</span>
                            <span class="btn-arrow">▶</span>
                        </a>
                    </p>
                </div>
            `;

            this.rankingList.appendChild(rankingItem);
        });
    }

    updateStoresDisplay(stores, clinicsWithStores) {
        // brand-section-wrapperを取得（複数の方法で試行）
        let brandSectionWrapper = document.querySelector('.brand-section-wrapper');
        
        if (!brandSectionWrapper) {
            // 要素が見つからない場合、bodyの最後に新しく作成
            console.log('Creating new brand-section-wrapper');
            brandSectionWrapper = document.createElement('section');
            brandSectionWrapper.className = 'brand-section-wrapper';
            
            // ランキングセクションの後に挿入
            const rankingSection = document.querySelector('.ranking-section');
            if (rankingSection && rankingSection.parentNode) {
                rankingSection.parentNode.insertBefore(brandSectionWrapper, rankingSection.nextSibling);
            } else {
                // rankingセクションが見つからない場合はbodyの最後に追加
                document.body.appendChild(brandSectionWrapper);
            }
        }
        
        // 店舗データがない場合は非表示にする
        if (!stores || stores.length === 0) {
            brandSectionWrapper.innerHTML = '';
            return;
        }
        
        // 店舗情報を表示
        let html = '<div class="brand-section">';
        
        // クリニックごとに店舗をグループ化して表示
        clinicsWithStores.forEach((clinicStores, clinic) => {
            if (clinicStores && clinicStores.length > 0) {
                html += `
                    <div class="clinic-stores-section">
                        <h4>${clinic.name}の店舗</h4>
                        <div class="stores-list">
                `;
                
                clinicStores.forEach(store => {
                    html += `
                        <div class="store-item">
                            <div class="store-name">${store.storeName || store.name || '店舗名不明'}</div>
                            <div class="store-address">${store.address || '住所不明'}</div>
                            <div class="store-access">${store.access || ''}</div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        brandSectionWrapper.innerHTML = html;
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'block';
        // 既存のタイマーをクリア
        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
        }
        // 新しいタイマーを設定
        this.errorTimeout = setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 5000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    updateFooterClinics(clinics, ranking) {
        // フッター内のすべてのulタグを取得
        const footerUls = document.querySelectorAll('#footer ul');
        let footerClinicsContainer = null;
        
        // "人気クリニック"を含むh5を持つulを探す
        for (const ul of footerUls) {
            const h5 = ul.querySelector('h5');
            if (h5 && h5.textContent === '人気クリニック') {
                footerClinicsContainer = ul;
                break;
            }
        }
        
        if (!footerClinicsContainer) return;

        // 既存のクリニックリンクを削除（h5タイトルは残す）
        const clinicLinks = footerClinicsContainer.querySelectorAll('li');
        clinicLinks.forEach(link => link.remove());

        if (!ranking || Object.keys(ranking.ranks).length === 0) {
            return;
        }

        // ランキング順にソート（最大5件）
        const sortedRanks = Object.entries(ranking.ranks).sort((a, b) => {
            const numA = parseInt(a[0].replace('no', ''));
            const numB = parseInt(b[0].replace('no', ''));
            return numA - numB;
        }).slice(0, 5);

        // フッターにクリニックリンクを追加
        sortedRanks.forEach(([position, clinicId]) => {
            const clinic = clinics.find(c => c.id === clinicId);
            if (!clinic) return;

            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = this.urlHandler.getClinicUrlWithRegionId(clinic.id);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = clinic.name;
            li.appendChild(link);
            footerClinicsContainer.appendChild(li);
        });
    }
}

// データ管理クラス
class DataManager {
    constructor() {
        this.regions = [];
        this.clinics = [];
        this.stores = [];
        this.rankings = [];
        this.storeViews = [];
        this.campaigns = [];
        // Handle subdirectory paths
        if (window.SITE_CONFIG) {
            this.dataPath = window.SITE_CONFIG.dataPath + '/';
        } else {
            this.dataPath = './data/';
        }
    }

    async init() {
        try {
            // JSONファイルの読み込み
            const response = await fetch(this.dataPath + 'compiled-data.json');
            if (!response.ok) {
                throw new Error('Failed to load compiled-data.json');
            }
            const data = await response.json();
            
            // データの設定
            this.regions = data.regions;
            this.clinics = data.clinics;
            
            // ランキングデータの変換
            this.rankings = Object.entries(data.rankings).map(([regionId, ranks]) => ({
                regionId: regionId,
                ranks: ranks
            }));
            
            // 店舗ビューデータの変換
            this.storeViews = Object.entries(data.storeViews).map(([regionId, clinicStores]) => ({
                regionId: regionId,
                clinicStores: clinicStores
            }));
            
            // キャンペーンデータの設定
            this.campaigns = data.campaigns;
            
            // 店舗データをクリニックから抽出
            this.stores = [];
            this.clinics.forEach(clinic => {
                clinic.stores.forEach(store => {
                    this.stores.push({
                        id: store.id,
                        clinicName: clinic.name,
                        storeName: store.name,
                        name: store.name,  // 両方のフィールドで互換性を保つ
                        address: store.address,
                        zipcode: store.zipcode,
                        access: store.access,
                        regionId: this.getRegionIdFromAddress(store.address)
                    });
                });
            });
            
        } catch (error) {
            console.error('データの初期化に失敗しました:', error);
            throw error;
        }
    }
    
    // 住所から地域IDを取得するヘルパーメソッド
    getRegionIdFromAddress(address) {
        if (!address) return null;
        for (const region of this.regions) {
            if (address.includes(region.name)) {
                return region.id;
            }
        }
        return null;
    }

    // CSVファイルを読み込む汎用関数（エラーハンドリング付き）
    async loadCsvFile(filename) {
        try {
            const response = await fetch(this.dataPath + filename);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}`);
            }
            const text = await response.text();
            return this.parseCsv(text);
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            throw error;
        }
    }

    // CSVパーサー（カンマ区切りのデータをオブジェクト配列に変換）
    parseCsv(csvText) {
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

    // 地域データの読み込み
    async loadRegions() {
        const data = await this.loadCsvFile('出しわけSS - region.csv');
        this.regions = data.map(row => ({
            id: row.parameter_no,
            name: row.region
        }));
    }

    // クリニックデータの読み込み
    async loadClinics() {
        const data = await this.loadCsvFile('出しわけSS - items.csv');
        this.clinics = data.map(row => ({
            id: row.clinic_id,
            name: row.clinic_name,
            code: row.code
        }));
    }

    // 店舗データの読み込み
    async loadStores() {
        const data = await this.loadCsvFile('出しわけSS - stores.csv');
        this.stores = data.map(row => ({
            id: row.store_id,
            clinicName: row.clinic_name,
            storeName: row.store_name,
            name: row.store_name,  // 両方のフィールドで互換性を保つ
            zipcode: row.Zipcode,
            address: row.adress,
            access: row.access,
            regionId: null // 後で関連付け
        }));
    }

    // ランキングデータの読み込み
    async loadRankings() {
        const data = await this.loadCsvFile('出しわけSS - ranking.csv');
        console.log('🔄 ランキングCSVデータ読み込み:', data.slice(0, 3)); // 最初の3行を表示
        
        // 地域ごとにランキングをグループ化
        const rankingMap = {};
        data.forEach(row => {
            const regionId = row.parameter_no;
            if (!rankingMap[regionId]) {
                rankingMap[regionId] = {
                    regionId: regionId,
                    ranks: {}
                };
            }
            
            // 各順位のクリニックIDを設定（"-"は除外）
            Object.keys(row).forEach(key => {
                if (key.startsWith('no') && row[key] && row[key] !== '-') {
                    rankingMap[regionId].ranks[key] = row[key];
                }
            });
        });

        this.rankings = Object.values(rankingMap);
    }

    // 店舗ビューデータの読み込み
    async loadStoreViews() {
        const data = await this.loadCsvFile('出しわけSS - store_view.csv');
        
        this.storeViews = data.map(row => {
            const view = {
                regionId: row.parameter_no,
                clinicStores: {}
            };
            
            // clinic_1からclinic_5までの店舗IDを取得
            for (let i = 1; i <= 5; i++) {
                const clinicKey = `clinic_${i}`;
                if (row[clinicKey] && row[clinicKey] !== '-') {
                    // 複数店舗は/で区切られている
                    view.clinicStores[clinicKey] = row[clinicKey].split('/');
                }
            }
            
            return view;
        });
    }

    // キャンペーンデータの読み込み
    async loadCampaigns() {
        const data = await this.loadCsvFile('出しわけSS - campaigns.csv');
        this.campaigns = data.map(row => ({
            id: row.campaign_id,
            regionId: row.region_id,
            clinicId: row.clinic_id,
            title: row.title,
            headerText: row.header_text,
            logoSrc: row.logo_src,
            logoAlt: row.logo_alt,
            description: row.description,
            ctaText: row.cta_text,
            ctaUrl: row.cta_url,
            footerText: row.footer_text
        }));
    }

    // 店舗と地域の関連付け
    associateStoresWithRegions() {
        this.stores.forEach(store => {
            // 住所から地域を判断
            for (const region of this.regions) {
                if (store.address.includes(region.name)) {
                    store.regionId = region.id;
                    break;
                }
            }
        });
    }

    // 全地域を取得
    getAllRegions() {
        return this.regions;
    }

    // 全クリニックを取得
    getAllClinics() {
        return this.clinics;
    }

    // 地域IDで地域を取得
    getRegionById(regionId) {
        return this.regions.find(r => r.id === regionId);
    }

    // 地域IDでランキングを取得
    getRankingByRegionId(regionId) {
        return this.rankings.find(r => r.regionId === regionId);
    }

    // 地域IDで店舗を取得（store_viewデータを使用してランキングに対応した店舗を取得）
    getStoresByRegionId(regionId) {
        // store_viewから該当地域のデータを取得
        const storeView = this.storeViews.find(sv => sv.regionId === regionId);
        if (!storeView) return [];
        
        // ランキングデータを取得して、表示されているクリニックを特定
        const ranking = this.getRankingByRegionId(regionId);
        console.log(`🏆 地域 ${regionId} のランキング:`, ranking);
        if (!ranking) return [];
        
        // 表示する店舗IDのリストを作成
        const storeIdsToShow = [];
        
        // ランキングに表示されているクリニックIDに対応する店舗IDを取得
        console.log('🎯 ランキングデータ:', ranking.ranks);
        Object.entries(ranking.ranks).forEach(([position, clinicId]) => {
            console.log(`📍 位置 ${position}: クリニックID ${clinicId}`);
            // clinic_1〜clinic_5はクリニックID（1〜5）に対応
            const clinicKey = `clinic_${clinicId}`;
            console.log(`🔑 検索キー: ${clinicKey}`);
            console.log(`🏪 該当店舗:`, storeView.clinicStores[clinicKey]);
            
            if (storeView.clinicStores[clinicKey]) {
                storeIdsToShow.push(...storeView.clinicStores[clinicKey]);
            }
        });
        
        // 店舗IDに基づいて実際の店舗情報を取得
        // アンダースコアで区切られた複数店舗IDを処理
        const allStoreIds = [];
        console.log('🔍 storeIdsToShow:', storeIdsToShow);
        
        storeIdsToShow.forEach(storeId => {
            if (storeId.includes('/')) {
                // dio_009/dio_010 のような形式を分割
                const ids = storeId.split('/');
                allStoreIds.push(...ids);
                console.log(`📦 分割: ${storeId} → ${ids.join(', ')}`);
            } else {
                allStoreIds.push(storeId);
            }
        });
        
        console.log('🏪 検索する店舗ID:', allStoreIds);
        console.log('🏬 利用可能な店舗:', this.stores.slice(0, 5).map(s => s.id));
        
        const result = this.stores.filter(store => 
            allStoreIds.includes(store.id)
        );
        
        console.log('✅ 見つかった店舗:', result.map(s => `${s.id}: ${s.name}`));
        return result;
    }

    // クリニック名で店舗を取得
    getStoresByClinicName(clinicName) {
        return this.stores.filter(s => s.clinicName === clinicName);
    }

    // 地域IDとクリニック名で店舗を取得
    getStoresByRegionAndClinic(regionId, clinicName) {
        return this.stores.filter(s => 
            s.regionId === regionId && s.clinicName === clinicName
        );
    }

    // 地域IDでキャンペーンを取得
    getCampaignsByRegionId(regionId) {
        return this.campaigns.filter(c => c.regionId === regionId);
    }

    // 地域IDとクリニックIDでキャンペーンを取得
    getCampaignByRegionAndClinic(regionId, clinicId) {
        return this.campaigns.find(c => 
            c.regionId === regionId && c.clinicId === clinicId
        );
    }
}

// アプリケーションクラス
class RankingApp {
    constructor() {
        this.urlHandler = new UrlParamHandler();
        this.displayManager = new DisplayManager(this.urlHandler);
        this.dataManager = null;
        this.currentRegionId = null;
    }

    async init() {
        try {
            // データマネージャーの初期化
            this.dataManager = new DataManager();
            await this.dataManager.init();
            
            // グローバルアクセス用にwindowオブジェクトに設定
            window.dataManager = this.dataManager;
            

            // 初期地域IDの取得（URLパラメータから取得、なければデフォルト）
            this.currentRegionId = this.urlHandler.getRegionId();

            // 地域セレクターの初期化
            const regions = this.dataManager.getAllRegions();
            this.displayManager.updateRegionSelector(regions, this.currentRegionId);

            // イベントリスナーの設定
            this.setupEventListeners();

            // 初期表示の更新
            this.updatePageContent(this.currentRegionId);
            
            // 地図モーダルの設定
            setTimeout(() => {
                this.setupMapAccordions();
            }, 100);
        } catch (error) {
            console.error('アプリケーションの初期化に失敗しました:', error);
            this.displayManager.showError('データの読み込みに失敗しました。ページを再読み込みしてください。');
        }
    }

    setupEventListeners() {
        // 地域選択の変更イベント（検索フィルター用）
        if (this.displayManager.regionSelect) {
            this.displayManager.regionSelect.addEventListener('change', () => {
                this.handleClinicSearch(this.displayManager.searchInput?.value || '');
            });
        }

        // クリニック名検索機能
        if (this.displayManager.searchInput) {
            this.displayManager.searchInput.addEventListener('input', (e) => {
                this.handleClinicSearch(e.target.value);
            });
        }
        
        // 対応部位フィルター
        const specialtyFilter = document.getElementById('sidebar-specialty-filter');
        if (specialtyFilter) {
            specialtyFilter.addEventListener('change', () => {
                this.handleClinicSearch(this.displayManager.searchInput?.value || '');
            });
        }
        
        // 店舗数フィルター
        const hoursFilter = document.getElementById('sidebar-hours-filter');
        if (hoursFilter) {
            hoursFilter.addEventListener('change', () => {
                this.handleClinicSearch(this.displayManager.searchInput?.value || '');
            });
        }

        // サイドバー検索ボタンのイベント
        const sidebarSearchButton = document.querySelector('.sidebar-search-link');
        if (sidebarSearchButton) {
            sidebarSearchButton.addEventListener('click', (e) => {
                e.preventDefault();
                
                // フィルター値を取得
                const params = new URLSearchParams();
                
                // 地域（検索フィルター用）
                const regionFilter = document.getElementById('sidebar-region-select');
                console.log('地域フィルター値:', regionFilter?.value);
                if (regionFilter && regionFilter.value) {
                    params.append('search-region', regionFilter.value);
                }
                
                // クリニック名
                const clinicSearch = document.getElementById('sidebar-clinic-search');
                if (clinicSearch && clinicSearch.value) {
                    params.append('clinic', clinicSearch.value);
                }
                
                // 対応部位
                const specialtyFilter = document.getElementById('sidebar-specialty-filter');
                if (specialtyFilter && specialtyFilter.value) {
                    params.append('bodyPart', specialtyFilter.value);
                }
                
                // 店舗数
                const hoursFilter = document.getElementById('sidebar-hours-filter');
                if (hoursFilter && hoursFilter.value) {
                    params.append('storeCount', hoursFilter.value);
                }
                
                // 現在のregion_idを追加
                params.append('region_id', this.currentRegionId);
                
                // 検索結果ページへ遷移
                const basePath = window.SITE_CONFIG ? window.SITE_CONFIG.basePath : '';
                const searchUrl = `${basePath}/search-results.html?${params.toString()}`;
                window.location.href = searchUrl;
            });
        }
        
        // ハンバーガーメニューのイベント
        console.log('ハンバーガーメニュー要素:', this.displayManager.hamburgerMenu);
        console.log('サイドバーメニュー要素:', this.displayManager.sidebarMenu);
        console.log('オーバーレイ要素:', this.displayManager.sidebarOverlay);
        
        if (this.displayManager.hamburgerMenu) {
            this.displayManager.hamburgerMenu.addEventListener('click', (e) => {
                console.log('ハンバーガーメニューがクリックされました');
                e.stopPropagation(); // イベントの伝播を停止
                
                this.displayManager.hamburgerMenu.classList.toggle('active');
                this.displayManager.sidebarMenu.classList.toggle('active');
                this.displayManager.sidebarOverlay.classList.toggle('active');
                
                console.log('ハンバーガーメニューactive:', this.displayManager.hamburgerMenu.classList.contains('active'));
                console.log('サイドバーメニューactive:', this.displayManager.sidebarMenu.classList.contains('active'));
            });
            console.log('ハンバーガーメニューのイベントリスナーを設定しました');
        } else {
            console.error('ハンバーガーメニュー要素が見つかりません');
        }

        // サイドバーを閉じる
        if (this.displayManager.closeSidebar) {
            this.displayManager.closeSidebar.addEventListener('click', () => {
                this.displayManager.hamburgerMenu.classList.remove('active');
                this.displayManager.sidebarMenu.classList.remove('active');
                this.displayManager.sidebarOverlay.classList.remove('active');
            });
        }

        // オーバーレイクリックで閉じる
        if (this.displayManager.sidebarOverlay) {
            this.displayManager.sidebarOverlay.addEventListener('click', () => {
                this.displayManager.hamburgerMenu.classList.remove('active');
                this.displayManager.sidebarMenu.classList.remove('active');
                this.displayManager.sidebarOverlay.classList.remove('active');
            });
        }

        // ブラウザの戻る/進むボタン対応（region_idは使用しない）
        /*
        window.addEventListener('popstate', () => {
            const regionId = this.urlHandler.getRegionId();
            if (regionId !== this.currentRegionId) {
                this.updatePageContent(regionId);
                this.displayManager.regionSelect.value = regionId;
            }
        });
        */
    }

    changeRegion(regionId) {
        // URLパラメータの更新はしない（region_idを付与しない）
        // this.urlHandler.updateRegionId(regionId);
        this.currentRegionId = regionId;

        // ページコンテンツの更新
        this.updatePageContent(regionId);
    }

    // 指定地域にクリニックの店舗があるかチェック
    getClinicStoresByRegion(clinicName, regionId) {
        // クリニック名を正規化
        const normalizedClinicName = clinicName.replace(/の\d+$/, '').trim(); // 「ディオクリニックの1」→「ディオクリニック」
        
        // 該当地域の店舗を取得
        const regionStores = this.dataManager.getStoresByRegionId(regionId);
        
        // クリニック名のマッピング
        const clinicNameMap = {
            'ディオクリニック': 'ディオクリニック',
            'エミナルクリニック': 'エミナルクリニック',
            'ウララクリニック': 'ウララクリニック',
            'リエートクリニック': 'リエートクリニック',
            '湘南美容クリニック': '湘南美容クリニック'
        };
        
        const storeClinicName = clinicNameMap[normalizedClinicName] || normalizedClinicName;
        
        // 該当するクリニックの店舗をフィルタリング
        return regionStores.filter(store => store.clinicName === storeClinicName);
    }

    // クリニック検索処理
    handleClinicSearch(searchTerm) {
        const searchTermLower = searchTerm.toLowerCase().trim();
        
        // フィルター条件を取得
        const regionFilter = document.getElementById('sidebar-region-select')?.value || '';
        const specialtyFilter = document.getElementById('sidebar-specialty-filter')?.value || '';
        const hoursFilter = document.getElementById('sidebar-hours-filter')?.value || '';

        // ランキングカードの検索
        const rankingItems = document.querySelectorAll('.ranking-item');
        let visibleRankingCount = 0;
        
        rankingItems.forEach(item => {
            const clinicNameElement = item.querySelector('.clinic-logo-section');
            const clinicName = clinicNameElement ? clinicNameElement.textContent.trim() : '';
            
            // クリニック名の条件
            const nameMatch = searchTermLower === '' || clinicName.toLowerCase().includes(searchTermLower);
            
            // 地域フィルタリングの条件
            let regionMatch = true;
            if (regionFilter) {
                // クリニックに対応する店舗が選択された地域にあるかチェック
                const clinicStores = this.getClinicStoresByRegion(clinicName, regionFilter);
                regionMatch = clinicStores.length > 0;
            }
            
            // フィルター条件の判定
            const specialtyMatch = specialtyFilter === '';
            const hoursMatch = hoursFilter === '';
            
            if (nameMatch && regionMatch && specialtyMatch && hoursMatch) {
                item.style.display = '';
                visibleRankingCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // テーブル内の行を検索（すべてのタブ）
        const allTableRows = document.querySelectorAll('#ranking-tbody tr, #treatment-tbody tr, #service-tbody tr');
        let visibleRowCount = 0;
        
        allTableRows.forEach(row => {
            const clinicName = row.querySelector('.clinic-main-name')?.textContent || '';
            
            // クリニック名の条件
            const nameMatch = searchTermLower === '' || clinicName.toLowerCase().includes(searchTermLower);
            
            // 地域フィルタリングの条件
            let regionMatch = true;
            if (regionFilter) {
                const clinicStores = this.getClinicStoresByRegion(clinicName, regionFilter);
                regionMatch = clinicStores.length > 0;
            }
            
            if (nameMatch && regionMatch) {
                row.style.display = '';
                visibleRowCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // 詳細セクションの検索
        const detailItems = document.querySelectorAll('.detail-item');
        detailItems.forEach(item => {
            const clinicName = item.querySelector('.clinic-name')?.textContent || '';
            
            // クリニック名の条件
            const nameMatch = searchTermLower === '' || clinicName.toLowerCase().includes(searchTermLower);
            
            // 地域フィルタリングの条件
            let regionMatch = true;
            if (regionFilter) {
                const clinicStores = this.getClinicStoresByRegion(clinicName, regionFilter);
                regionMatch = clinicStores.length > 0;
            }
            
            if (nameMatch && regionMatch) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });

        // ランキングカードセクションの検索結果メッセージ
        const rankingList = document.getElementById('ranking-list');
        const existingMsg = document.getElementById('no-search-results');
        
        if (visibleRankingCount === 0 && searchTermLower !== '') {
            if (!existingMsg) {
                const noResultsMsg = document.createElement('div');
                noResultsMsg.id = 'no-search-results';
                noResultsMsg.className = 'empty-state';
                noResultsMsg.innerHTML = '<p>「' + searchTerm + '」に一致するクリニックが見つかりませんでした</p>';
                rankingList.appendChild(noResultsMsg);
            }
        } else if (existingMsg) {
            existingMsg.remove();
        }

        // テーブルの検索結果メッセージ
        const activeTabContent = document.querySelector('.tab-content.active tbody');
        const existingTableMsg = document.getElementById('no-search-results-row');
        
        if (visibleRowCount === 0 && searchTermLower !== '' && activeTabContent) {
            if (!existingTableMsg) {
                const noResultsRow = document.createElement('tr');
                noResultsRow.id = 'no-search-results-row';
                noResultsRow.innerHTML = '<td colspan="5" class="empty-state"><p>検索結果が見つかりませんでした</p></td>';
                activeTabContent.appendChild(noResultsRow);
            }
        } else if (existingTableMsg) {
            existingTableMsg.remove();
        }

        console.log('検索実行:', searchTerm, 'ランキング:', visibleRankingCount, 'テーブル:', visibleRowCount);
    }

    updatePageContent(regionId) {
        try {
            // 地域情報の取得
            const region = this.dataManager.getRegionById(regionId);
            if (!region) {
                throw new Error('指定された地域が見つかりません');
            }

            // 地域名の更新
            this.displayManager.updateSelectedRegionName(region.name);
            
            // ページタイトルを更新
            document.title = `2025年${region.name}版｜医療ダイエット比較ランキング`;
            
            // 比較表の地域名も更新
            const comparisonRegionElement = document.getElementById('comparison-region-name');
            if (comparisonRegionElement) {
                comparisonRegionElement.textContent = region.name;
            }

            //MVの地域名も更新
            const mvRegionElement = document.getElementById('mv-region-name');
            if (mvRegionElement) {
                mvRegionElement.textContent = region.name;
            }

            //ランキングの地域名も更新
            const rankRegionElement = document.getElementById('rank-region-name');
            if (rankRegionElement) {
                rankRegionElement.textContent = region.name + 'で人気の医療ダイエットはここ！';
                
                // 地域名の文字数に応じてleftの位置を調整
                const regionNameLength = region.name.length;
                let leftPosition = '6%'; // デフォルト値
                
                if (regionNameLength === 2) {
                    leftPosition = '9%'; // 2文字（例：千葉）
                } else if (regionNameLength === 3) {
                    leftPosition = '7.5%'; // 3文字（例：神奈川）
                } else if (regionNameLength === 4) {
                    leftPosition = '6%'; // 4文字（例：神奈川）
                }
                
                rankRegionElement.style.left = leftPosition;
            }

            //詳細セクションの地域名も更新
            const detailRegionElement = document.getElementById('detail-region-name');
            if (detailRegionElement) {
                detailRegionElement.textContent = region.name + 'で人気のクリニック';
                
                // 地域名の文字数に応じてleftの位置を調整
                const regionNameLength = region.name.length;
                let leftPosition = '3%'; // デフォルト値（3文字以上）
                
                if (regionNameLength === 2) {
                    leftPosition = '4%'; // 2文字（例：千葉、東京）
                } else if (regionNameLength === 3) {
                    leftPosition = '1%'; // 3文字（例：神奈川、埼玉）
                }
                
                detailRegionElement.style.left = leftPosition;
            }

            // ランキングの取得と表示
            const ranking = this.dataManager.getRankingByRegionId(regionId);
            const allClinics = this.dataManager.getAllClinics();
            this.displayManager.updateRankingDisplay(allClinics, ranking);

            // フッターの人気クリニックを更新
            this.displayManager.updateFooterClinics(allClinics, ranking);

            // 店舗リストの取得と表示（クリニックごとにグループ化）
            // 店舗情報の表示を無効化
            // const stores = this.dataManager.getStoresByRegionId(regionId);
            // const clinicsWithStores = this.groupStoresByClinics(stores, ranking, allClinics);
            // this.displayManager.updateStoresDisplay(stores, clinicsWithStores);

            // 比較表の更新
            this.updateComparisonTable(allClinics, ranking);
            
            // 詳細コンテンツの更新
            this.updateClinicDetails(allClinics, ranking, regionId);

            // 地図モーダルの設定
            setTimeout(() => {
                this.setupMapAccordions();
            }, 100);

            // エラーメッセージを隠す
            this.displayManager.hideError();
        } catch (error) {
            console.error('ページコンテンツの更新に失敗しました:', error);
            this.displayManager.showError('データの表示に問題が発生しました。');
            
            // デフォルト地域にフォールバック
            if (regionId !== '013') {
                this.changeRegion('013');
            }
        }
    }

    // 店舗をクリニックごとにグループ化して表示順を管理
    groupStoresByClinics(stores, ranking, allClinics) {
        const clinicsWithStores = new Map();
        
        if (!ranking || !stores || stores.length === 0) {
            return clinicsWithStores;
        }

        // ランキング順にクリニックを処理
        const sortedRanks = Object.entries(ranking.ranks).sort((a, b) => {
            const numA = parseInt(a[0].replace('no', ''));
            const numB = parseInt(b[0].replace('no', ''));
            return numA - numB;
        });

        sortedRanks.forEach(([position, clinicId]) => {
            const clinic = allClinics.find(c => c.id === clinicId);
            if (clinic) {
                // クリニック名のマッピング（items.csvとstores.csvの名前の違いを解決）
                // 実際のstores.csvを確認した結果、すべて同じ名前で統一されていることが判明
                const clinicNameMap = {
                    'ディオクリニック': 'ディオクリニック',
                    'エミナルクリニック': 'エミナルクリニック',
                    'ウララクリニック': 'ウララクリニック',
                    'リエートクリニック': 'リエートクリニック',
                    '湘南美容クリニック': '湘南美容クリニック'
                };
                
                const storeClinicName = clinicNameMap[clinic.name] || clinic.name;
                
                // このクリニックに属する店舗をクリニック名でフィルタリング
                const clinicStores = stores.filter(store => 
                    store.clinicName === storeClinicName
                );
                
                // 店舗がない場合も空配列でMapに追加（全クリニックを表示するため）
                clinicsWithStores.set(clinic, clinicStores);
            }
        });

        return clinicsWithStores;
    }

    // 比較表の更新
    updateComparisonTable(clinics, ranking) {
        if (!ranking || Object.keys(ranking.ranks).length === 0) {
            return;
        }

        console.log('🔄 比較表を更新中... ランキング:', ranking.ranks);

        // ランキング順のクリニックデータを取得
        const rankedClinics = [];
        
        // no1からno5まで順番に処理（1位→2位→3位→4位→5位の順）
        ['no1', 'no2', 'no3', 'no4', 'no5'].forEach((position, index) => {
            const clinicId = ranking.ranks[position];
            if (clinicId && clinicId !== '-') {
                // クリニックIDが文字列の場合と数値の場合の両方に対応
                const numericClinicId = parseInt(clinicId);
                const clinic = clinics.find(c => c.id == clinicId || c.id === numericClinicId);
                if (clinic) {
                    rankedClinics.push({
                        ...clinic,
                        rank: index + 1  // 1位、2位、3位...
                    });
                    console.log(`${index + 1}位: ${clinic.name} (ID: ${clinicId})`);
                }
            }
        });

        console.log('🏆 最終ランキング順:', rankedClinics.map(c => `${c.rank}位: ${c.name}`));

        // 比較表の内容を生成
        this.generateComparisonTable(rankedClinics);
        
        // レビュータブ切り替え機能の設定
        this.setupReviewTabs();
        
        console.log('Comparison table update completed, setting up detail scroll links...');
        // 詳細を見るリンクのイベントリスナーを設定
        this.setupDetailScrollLinks();
    }

    // 比較表の生成
    generateComparisonTable(clinics) {
        const tbody = document.getElementById('comparison-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        clinics.forEach((clinic, index) => {
            const tr = document.createElement('tr');
            
            // 1位のクリニックには特別な背景色
            if (index === 0) {
                tr.style.backgroundColor = '#fffbdc';
            }
            
            // 実際のデータ設定
            const ratings = { 1: 4.9, 2: 4.5, 3: 4.3, 4: 4.1, 5: 3.8 };
            const achievements = {
                1: 'ダイエット成功率99％<br>平均13.7kg減',
                2: 'ダイエット成功率94%',
                3: 'ダイエット成功率94%',
                4: '3ヶ月で-10kg以上<br>モニター満足度95%',
                5: '症例実績30万件以上<br>リピート率90%以上'
            };
            const benefits = {
                1: '今なら<br>12ヶ月分0円！',
                2: '今なら<br>最大79%OFF！',
                3: '最大80%OFF<br>（モニター割引）',
                4: 'モニタープラン<br>大幅割引あり',
                5: '期間限定<br>キャンペーン実施中'
            };
            const popularPlans = {
                1: '脂肪冷却',
                2: '脂肪冷却',
                3: '脂肪冷却',
                4: '3ヶ月コース特別モニター',
                5: 'クールスカルプティング®エリート'
            };
            const machines = {
                1: '脂肪冷却<br>医療用EMS<br>医療ハイフ<br>医療ラジオ波',
                2: '脂肪冷却装置<br>医療用EMS<br>医療電磁場装置<br>医療ラジオ波',
                3: '脂肪冷却<br>医療用EMS<br>医療ハイフ',
                4: '医療ハイフ<br>EMS<br>脂肪冷却',
                5: 'クールスカルプティング®エリート<br>トゥルースカルプiD<br>脂肪溶解リニアハイフ<br>オンダリフト'
            };
            const injections = {
                1: '脂肪溶解注射<br>サンサム注射<br>ダイエット点滴<br>GLP-1<br>サクセンダ',
                2: '脂肪溶解注射<br>ダイエット点滴<br>GLP-1<br>オルリスタット<br>ビグアナイド系薬剤',
                3: '脂肪溶解注射<br>ダイエット美容点滴<br>エクソソーム点滴',
                4: '脂肪溶解注射<br>GLP-1',
                5: '脂肪溶解注射<br>（BNLSアルティメット）<br>サクセンダ<br>山参注射'
            };
            const dietSupport = {
                1: '栄養管理士<br>による指導',
                2: '管理栄養士<br>による指導',
                3: '医師監修のもと<br>管理栄養士の指導',
                4: '管理栄養士による<br>オンライン食事指導',
                5: '専門クリニックで<br>管理栄養士指導'
            };
            const monitorDiscount = {
                1: 'あり<br>75％OFF',
                2: 'あり<br>最大79%OFF',
                3: 'あり<br>最大80%OFF',
                4: 'あり<br>条件により大幅割引',
                5: 'あり<br>各施術でモニター募集'
            };
            const moneyBack = {
                1: '痩せなかったら返金',
                2: '痩せなかったら返金',
                3: 'あり（※条件付き）',
                4: 'あり（※条件あり）',
                5: '一部施術で<br>返金保証あり'
            };
            
            const rankNum = clinic.rank || index + 1;
            
            // クリニックのロゴ画像パスを設定
            const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
            const clinicLogos = {
                'ディオクリニック': `${imagesPath}/clinics/dio/dio-logo.webp`,
                'ディオクリニック': `${imagesPath}/clinics/dio/dio-logo.webp`,
                'ウララクリニック': `${imagesPath}/clinics/urara/urara-logo.webp`,
                'URARAクリニック': `${imagesPath}/clinics/urara/urara-logo.webp`,
                'リエートクリニック': `${imagesPath}/clinics/lieto/lieto-logo.webp`,
                'エミナルクリニック': `${imagesPath}/clinics/eminal/eminal-logo.webp`,
                'SBCクリニック': `${imagesPath}/clinics/sbc/sbc-logo.webp`,
                '湘南美容クリニック': `${imagesPath}/clinics/sbc/sbc-logo.webp`
            };
            const logoPath = clinicLogos[clinic.name] || `${imagesPath}/clinics/dio/dio-logo.webp`;
            
            tr.innerHTML = `
                <td class="ranking-table_td1">
                    <img src="${logoPath}" alt="${clinic.name}" width="80">
                    <a href="#clinic${rankNum}" class="clinic-link">${clinic.name}</a>
                </td>
                <td class="" style="">
                    <span class="ranking_evaluation">${ratings[rankNum] || '4.1'}</span><br>
                    <span class="star5_rating" data-rate="${ratings[rankNum] || '4.1'}"></span>
                </td>
                <td class="" style="">${achievements[rankNum] || '豊富な実績'}</td>
                <td class="" style="">${benefits[rankNum] || '特別キャンペーン'}</td>
                <td class="th-none" style="display: none;">${popularPlans[rankNum] || '人気プラン'}</td>
                <td class="th-none" style="display: none;">${machines[rankNum] || '医療機器'}</td>
                <td class="th-none" style="display: none;">${injections[rankNum] || '注射療法'}</td>
                <td class="th-none" style="display: none;">${dietSupport[rankNum] || '〇'}</td>
                <td class="th-none" style="display: none;">${monitorDiscount[rankNum] || '×'}</td>
                <td class="th-none" style="display: none;">${moneyBack[rankNum] || '×'}</td>
                <td>
                    <a class="link_btn" href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id)}" target="_blank">公式サイト &gt;</a>
                    <a class="detail_btn" href="#clinic${rankNum}">詳細をみる</a>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
    }

    // クリニック名の表示形式を取得
    getClinicDisplayName(clinic) {
        // CSVデータのクリニック名をそのまま使用
        return clinic.name;
    }

    // 総合タブの生成
    generateGeneralTab(clinics) {
        const tbody = document.getElementById('general-tbody');
        tbody.innerHTML = '';

        clinics.forEach((clinic, index) => {
            const row = document.createElement('tr');
            const rankClass = clinic.rank === 1 ? '' : clinic.rank === 2 ? 'silver' : 'bronze';
            
            // ダミーデータ（実際のデータに置き換え）
            const ratings = { 1: 4.9, 2: 4.5, 3: 4.3, 4: 4.1, 5: 3.8 };
            const achievements = { 
                1: '全国100院以上',
                2: '累計施術50万件',
                3: '開院15年の実績',
                4: '全国80院展開',
                5: '医療脱毛専門10年'
            };
            const benefits = {
                1: '初回限定50%OFF',
                2: '学割・ペア割あり',
                3: '全身脱毛20%割引',
                4: 'モニター割引30%',
                5: '平日限定プランあり'
            };

            row.innerHTML = `
                <td>
                    <div class="clinic-name-cell">
                        <div class="rank-badge ${rankClass}">${clinic.rank}位</div>
                        <div class="clinic-info">
                            <div class="clinic-main-name">${this.getClinicDisplayName(clinic)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="rating-cell">${ratings[clinic.rank] || 4.5}</div>
                    <div class="rating-stars">
                        ${'<i class="fas fa-star"></i>'.repeat(Math.floor(ratings[clinic.rank] || 4.5))}
                        ${(ratings[clinic.rank] || 4.5) % 1 ? '<i class="fas fa-star-half-alt"></i>' : ''}
                    </div>
                </td>
                <td class="achievement-text">${achievements[clinic.rank] || '豊富な実績'}</td>
                <td class="benefit-text">${benefits[clinic.rank] || '特典あり'}</td>
                <td>
                    <div class="cta-cell">
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id)}" class="cta-button" target="_blank" rel="noopener">公式サイト</a>
                        <a href="#clinic${clinic.rank}" class="cta-link detail-scroll-link" data-rank="${clinic.rank}">詳細を見る</a>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    // 施術内容タブの生成
    generateTreatmentTab(clinics) {
        const tbody = document.getElementById('treatment-tbody');
        tbody.innerHTML = '';

        clinics.forEach((clinic, index) => {
            const row = document.createElement('tr');
            const rankClass = clinic.rank === 1 ? '' : clinic.rank === 2 ? 'silver' : 'bronze';

            row.innerHTML = `
                <td>
                    <div class="clinic-name-cell">
                        <div class="rank-badge ${rankClass}">${clinic.rank}位</div>
                        <div class="clinic-info">
                            <div class="clinic-main-name">${this.getClinicDisplayName(clinic)}</div>
                        </div>
                    </div>
                </td>
                <td>全身＋VIO脱毛</td>
                <td>最新医療レーザー</td>
                <td><i class="fas fa-circle feature-icon"></i></td>
                <td>
                    <div class="cta-cell">
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id)}" class="cta-button" target="_blank" rel="noopener">公式サイト</a>
                        <a href="#clinic${clinic.rank}" class="cta-link detail-scroll-link" data-rank="${clinic.rank}">詳細を見る</a>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    // サービスタブの生成
    generateServiceTab(clinics) {
        const tbody = document.getElementById('service-tbody');
        tbody.innerHTML = '';

        clinics.forEach((clinic, index) => {
            const row = document.createElement('tr');
            const rankClass = clinic.rank === 1 ? '' : clinic.rank === 2 ? 'silver' : 'bronze';

            row.innerHTML = `
                <td>
                    <div class="clinic-name-cell">
                        <div class="rank-badge ${rankClass}">${clinic.rank}位</div>
                        <div class="clinic-info">
                            <div class="clinic-main-name">${this.getClinicDisplayName(clinic)}</div>
                        </div>
                    </div>
                </td>
                <td><i class="fas fa-circle feature-icon"></i></td>
                <td>${clinic.rank <= 3 ? '<i class="fas fa-circle feature-icon"></i>' : '<i class="fas fa-triangle feature-icon triangle"></i>'}</td>
                <td>${clinic.rank <= 2 ? '<i class="fas fa-circle feature-icon"></i>' : '-'}</td>
                <td>
                    <div class="cta-cell">
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id)}" class="cta-button" target="_blank" rel="noopener">公式サイト</a>
                        <a href="#clinic${clinic.rank}" class="cta-link detail-scroll-link" data-rank="${clinic.rank}">詳細を見る</a>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    // タブ切り替え機能の設定
    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');

                // すべてのタブボタンとコンテンツを非アクティブに
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // クリックされたタブをアクティブに
                button.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
            });
        });
    }
    
    // 詳細を見るリンクのイベントリスナーを設定
    setupDetailScrollLinks() {
        console.log('=== setupDetailScrollLinks START ===');
        console.log('Current DOM state:', document.readyState);
        console.log('Comparison table element exists:', !!document.getElementById('comparison-table'));
        
        // 少し遅延を入れてDOMが完全に生成されるのを待つ
        setTimeout(() => {
            console.log('=== After 100ms delay ===');
            console.log('Searching for detail links...');
            
            // すべてのaタグを確認
            const allLinks = document.querySelectorAll('a');
            console.log('Total <a> tags in document:', allLinks.length);
            
            // 詳細を見る・詳細をみるというテキストを含むリンクを探す
            const detailTextLinks = Array.from(allLinks).filter(link => 
                link.textContent.includes('詳細を見る') || link.textContent.includes('詳細をみる')
            );
            console.log('Links containing "詳細を見る/詳細をみる":', detailTextLinks.length);
            detailTextLinks.forEach((link, i) => {
                console.log(`Detail link ${i + 1}:`, {
                    text: link.textContent.trim(),
                    href: link.href,
                    className: link.className,
                    parentElement: link.parentElement?.tagName,
                    hasClickHandler: link.onclick !== null
                });
            });
            
            // 動的に生成される比較表のリンク
            const dynamicLinks = document.querySelectorAll('.detail-scroll-link');
            console.log('Found .detail-scroll-link elements:', dynamicLinks.length);
            
            // 各リンクの詳細情報を表示
            dynamicLinks.forEach((link, index) => {
                console.log(`=== Setting up link ${index + 1} ===`);
                console.log('Link details:', {
                    text: link.textContent,
                    href: link.getAttribute('href'),
                    dataRank: link.getAttribute('data-rank'),
                    classes: link.className,
                    isVisible: link.offsetParent !== null,
                    computedDisplay: window.getComputedStyle(link).display,
                    computedVisibility: window.getComputedStyle(link).visibility
                });
                
                // 既存のイベントリスナーを確認
                const hasExistingListener = link.hasAttribute('data-listener-attached');
                console.log('Has existing listener:', hasExistingListener);
                
                if (!hasExistingListener) {
                    link.setAttribute('data-listener-attached', 'true');
                    link.addEventListener('click', (e) => {
                        console.log('=== CLICK EVENT TRIGGERED ===');
                        console.log('Event details:', {
                            type: e.type,
                            target: e.target.tagName,
                            targetClass: e.target.className,
                            currentTarget: e.currentTarget.tagName
                        });
                        e.preventDefault();
                        e.stopPropagation();
                        const rank = parseInt(link.getAttribute('data-rank'));
                        console.log('Dynamic detail link clicked, rank:', rank);
                        this.scrollToClinicDetail(rank);
                    });
                    console.log('Event listener attached successfully');
                } else {
                    console.log('Skipping - listener already attached');
                }
            });
            
            // 静的な比較表のリンク
            const staticLinks = document.querySelectorAll('.detail-static-link');
            console.log('Found .detail-static-link elements:', staticLinks.length);
            
            staticLinks.forEach((link, index) => {
                console.log(`Static link ${index + 1} details:`, {
                    text: link.textContent,
                    href: link.getAttribute('href'),
                    dataRank: link.getAttribute('data-rank')
                });
                
                link.addEventListener('click', (e) => {
                    console.log('=== STATIC LINK CLICK EVENT ===');
                    e.preventDefault();
                    const rank = parseInt(link.getAttribute('data-rank'));
                    console.log('Static detail link clicked, rank:', rank);
                    this.scrollToClinicDetail(rank);
                });
            });
            
            // 比較表内のすべてのボタンやリンクを確認
            const comparisonTable = document.getElementById('comparison-table');
            if (comparisonTable) {
                const allTableLinks = comparisonTable.querySelectorAll('a');
                console.log('All links in comparison table:', allTableLinks.length);
                allTableLinks.forEach((link, i) => {
                    if (link.textContent.includes('詳細')) {
                        console.log(`Table detail link ${i}:`, {
                            text: link.textContent,
                            href: link.href,
                            className: link.className,
                            onclick: link.onclick
                        });
                    }
                });
            }
            
            console.log('=== setupDetailScrollLinks END ===');
        }, 100);
    }
    
    // クリニック詳細へスクロール
    scrollToClinicDetail(rank) {
        console.log('=== scrollToClinicDetail START ===');
        console.log('Rank parameter:', rank, typeof rank);
        
        // 直接IDで要素を取得（静的比較表と同じ形式）
        const targetId = `clinic${rank}`;
        console.log('Looking for element with ID:', targetId);
        
        const targetElement = document.getElementById(targetId);
        console.log('Target element found:', !!targetElement);
        
        // すべての詳細要素を確認
        const allDetailElements = document.querySelectorAll('[id^="clinic"]');
        console.log('All clinic elements found:', allDetailElements.length);
        allDetailElements.forEach(el => {
            if (el.id.match(/^clinic\d+$/)) {
                console.log(`- ${el.id}`, {
                    visible: el.offsetParent !== null,
                    position: el.getBoundingClientRect().top
                });
            }
        });
        
        // clinic-details-listセクションの存在確認
        const detailsList = document.getElementById('clinic-details-list');
        console.log('clinic-details-list exists:', !!detailsList);
        if (detailsList) {
            console.log('Details list children:', detailsList.children.length);
        }
        
        if (targetElement) {
            // 要素の位置を取得してスクロール
            const rect = targetElement.getBoundingClientRect();
            console.log('Element position:', {
                top: rect.top,
                currentScrollY: window.pageYOffset
            });
            
            const elementTop = rect.top + window.pageYOffset;
            const offset = 100; // ヘッダーの高さ分のオフセット
            const scrollTo = elementTop - offset;
            
            console.log('Scrolling to position:', scrollTo);
            window.scrollTo({
                top: scrollTo,
                behavior: 'smooth'
            });
            
            // スクロール後の確認
            setTimeout(() => {
                console.log('Scroll completed, current position:', window.pageYOffset);
            }, 1000);
        } else {
            // 詳細要素が見つからない場合は、セクション全体にスクロール
            const detailSection = document.getElementById('clinic-details-list');
            console.log('Target element not found, scrolling to section');
            if (detailSection) {
                const sectionTop = detailSection.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({
                    top: sectionTop - 100,
                    behavior: 'smooth'
                });
            } else {
                console.error('clinic-details-list not found');
            }
        }
    }
    
    // レビュータブ切り替え機能の設定
    setupReviewTabs() {
        // 各クリニック詳細セクションのレビュータブを設定
        document.addEventListener('click', (e) => {
            // 新しいタブ構造用のイベント処理
            const tabLi = e.target.closest('.review_tab2 li');
            if (tabLi) {
                const reviewSection = tabLi.closest('#review_tab_box');
                if (reviewSection) {
                    const tabIndex = Array.from(tabLi.parentElement.children).indexOf(tabLi);
                    
                    // タブのアクティブ状態を更新
                    reviewSection.querySelectorAll('.review_tab2 li').forEach((li, index) => {
                        li.classList.remove('select2');
                        if (index === tabIndex) {
                            li.classList.add('select2');
                        }
                    });
                    
                    // コンテンツの表示を切り替え
                    reviewSection.querySelectorAll('.wrap_long2').forEach((content, index) => {
                        content.classList.remove('active');
                        content.classList.add('disnon2');
                        if (index === tabIndex) {
                            content.classList.add('active');
                            content.classList.remove('disnon2');
                        }
                    });
                }
            }
        });
    }

    // クリニック詳細の更新
    updateClinicDetails(clinics, ranking, regionId) {
        console.log('updateClinicDetails called:', { clinics, ranking, regionId });
        const detailsList = document.getElementById('clinic-details-list');
        if (!detailsList) {
            console.error('clinic-details-list要素が見つかりません');
            return;
        }

        detailsList.innerHTML = '';
        
        // 比較表も更新
        this.updateComparisonTable(clinics, ranking);

        if (!ranking) {
            console.error('ランキングデータがnullです');
            return;
        }
        
        if (!ranking.ranks) {
            console.error('ranking.ranksが存在しません:', ranking);
            return;
        }
        
        if (Object.keys(ranking.ranks).length === 0) {
            console.error('ranking.ranksが空です:', ranking.ranks);
            return;
        }
        
        console.log('ランキングデータ:', ranking);

        // ランキング順のクリニックデータを取得（5位まで）
        const sortedRanks = Object.entries(ranking.ranks).sort((a, b) => {
            const numA = parseInt(a[0].replace('no', ''));
            const numB = parseInt(b[0].replace('no', ''));
            return numA - numB;
        }).slice(0, 5);

        console.log('sortedRanks:', sortedRanks);
        console.log('Available clinics:', clinics.map(c => ({ id: c.id, name: c.name })));
        
        sortedRanks.forEach(([position, clinicId]) => {
            // clinicIdを数値に変換して比較
            const numericClinicId = parseInt(clinicId);
            const clinic = clinics.find(c => c.id == clinicId || c.id === numericClinicId);
            console.log('Processing clinic:', { position, clinicId, numericClinicId, clinic });
            if (!clinic) {
                console.error('クリニックが見つかりません:', clinicId);
                return;
            }

            const rank = parseInt(position.replace('no', ''));
            const detailItem = document.createElement('div');
            detailItem.className = `detail-item ranking_box_inner ranking_box_${rank}`;
            detailItem.setAttribute('data-rank', rank);
            detailItem.setAttribute('data-clinic-id', clinicId);
            detailItem.id = `clinic${rank}`; // アンカーリンク用のIDを追加（静的比較表と一致）

            // ランクに応じたバッジクラス
            let badgeClass = '';
            if (rank === 2) badgeClass = 'silver';
            else if (rank === 3) badgeClass = 'bronze';
            else if (rank === 4) badgeClass = 'ranking4';
            else if (rank === 5) badgeClass = 'ranking5';

            // クリニック詳細データ（拡張版）
            const clinicDetailDataMap = {
                '1': { // DIO
                    title: '99%が実感した医療痩せ！<span class="info-icon" onclick="showDisclaimerInfo(\'dio-success-rate\')" title="詳細情報">ⓘ</span>',
                    subtitle: '我慢・失敗・リバウンド防止',
                    link: 'DIO ＞',
                    banner: '/images/clinics/dio/dio_detail_bnr.webp',
                    features: [
                        '医療ダイエット', '医療痩身', 'リバウンド防止',
                        '医師監修', '栄養士指導', '切らない痩身',
                        '19時以降OK', '駅チカ', '完全個室'
                    ],
                    priceMain: '医療痩身コース',
                    priceValue: '月々4,900円',
                    priceDetail: {
                        '料金': '通常価格24,800円<br>80%OFF 月々4,900円',
                        '施術機械': '脂肪冷却<br>医療用EMS<br>医療ハイフ<br>医療ラジオ波',
                        '目安期間': '-5〜10kg：約3ヶ月<br>-10kg以上：約5ヶ月',
                        '営業時間': '平日11:00〜20:00<br>土日祝日10:00〜19:00<br>休診日：年末年始',
                        '対応部位': '顔全体／二の腕／お腹／お尻／太もも／その他',
                        '店舗': '北海道／宮城／東京／埼玉／<br>神奈川／千葉／愛知／京都／<br>大阪／兵庫／広島／福岡',
                        '公式サイト': 'https://dioclinic.jp/'
                    },
                    vioPlans: {
                        vioOnly: {
                            title: 'VIOのみ',
                            price: '99,000円',
                            sessions: '5回',
                            monthly: '月々1,200円'
                        },
                        fullBody: {
                            title: '全身＋VIO',
                            price: '247,000円',
                            sessions: '5回',
                            monthly: '月々4,500円'
                        }
                    },
                    points: [
                        {
                            icon: 'lightbulb',
                            title: '専門家チームが徹底伴走！もう一人で悩まない',
                            description: 'ディオクリニックでは医師・看護師・管理栄養士がチームであなたを徹底サポート！自己流ダイエットで挫折した方にもおすすめです。専門的な食事指導や生活改善アドバイスも受けられるから、ダイエットの悩みも解決！'
                        },
                        {
                            icon: 'phone',
                            title: '医療マシンをオーダーメイド！リバウンドしにくい身体へ',
                            description: '脂肪冷却や医療EMSなど、複数の最新マシンをあなた専用に組み合わせ！寝ているだけで部分痩せや筋肉アップまで目指せるので、運動が苦手な方にもおすすめ。リバウンドしにくい体質づくりを目指せる！'
                        },
                        {
                            icon: 'coin',
                            title: '全額返金保証あり！効果が不安でも大丈夫',
                            description: 'ディオクリニックは効果に自信があるから、「全額返金保証制度」付き！もし効果を実感できなくても金銭的なリスクがないから、思い切ってチャレンジできます！'
                        }
                    ],
                    reviews: [
                        {
                            rating: 5,
                            date: '2024年1月',
                            text: 'スタッフの対応が丁寧で、痛みも少なく安心して通えています。'
                        },
                        {
                            rating: 4,
                            date: '2023年12月',
                            text: '予約が取りやすく、効果も実感できています。'
                        }
                    ],
                    // stores: [] // 店舗は動的に取得するため削除
                    campaigns: [
                        {
                            title: '全身＋VIO ＋顔',
                            subtitle: '5回コース',
                            originalPrice: '286,000円',
                            discountPrice: '143,000円',
                            monthlyPrice: '月額2,000円',
                            discount: '50%OFF'
                        }
                    ],
                    campaignInfo: {
                        header: 'INFORMATION!',
                        title: 'ディオクリニックの今月のお得な情報',
                        logoSrc: '/images/clinics/dio/dio-logo.webp',
                        logoAlt: 'ディオクリニック',
                        description: '今なら12ヶ月分が0円！<br>痩せなければ返金保証あり',
                        ctaUrl: getClinicUrlFromConfig('1'),
                        displayUrl: 'https://dioclinic.jp/',
                        ctaText: 'ディオクリニックの公式サイト',
                        microcopy: '＼症例数50万件以上の実績で安心／'
                    }
                },
                '2': { // ウララクリニック
                    title: '次世代医療！<span class="info-icon" onclick="showDisclaimerInfo(\'urara-success-rate\')" title="詳細情報">ⓘ</span>',
                    subtitle: '成功率94%の実績',
                    link: 'ウララクリニック ＞',
                    banner: '/images/clinics/urara/urara_detail_bnr.webp',
                    features: [
                        '医療ダイエット', '医療痩身', '美痩身',
                        'リバウンド防止', '医師監修', '管理栄養士指導',
                        '切らない痩身', '駅チカ', '健康的に美しく'
                    ],
                    priceMain: '医療痩身コース',
                    priceValue: '月々9,780円',
                    priceDetail: {
                        '料金': '通常価格45,591円<br>79%0FF<br>月々9,780円',
                        '施術機械': '脂肪冷却装置/医療用EMS/医療電磁場装置/医療ラジオ波',
                        '目安期間': '-5〜10kg：約3ヶ月',
                        '営業時間': '平日10:00〜20:00<br>土日祝日10:00〜20:00',
                        '対応部位': '顔全体／二の腕／お腹／お尻／太もも／その他 (全身)',
                        '店舗': '東京 (新宿, 銀座)',
                        '公式サイト': 'https://uraraclinic.jp/'
                    },
                    vioPlans: {
                        vioOnly: {
                            title: '部分痩身',
                            price: '30,000円',
                            sessions: '3回',
                            monthly: '月々3,000円'
                        },
                        fullBody: {
                            title: '全身痩身',
                            price: '49,600円',
                            sessions: '5回',
                            monthly: '月々9,600円'
                        }
                    },
                    points: [
                        {
                            icon: 'lightbulb',
                            title: '専門家チームが徹底伴走！',
                            description: '医師・管理栄養士・看護師がチームであなたを徹底サポート！医学的観点と栄養学に基づき、多角的なアプローチで課題を解決。LINEでの相談も可能で、通院日以外も安心です。'
                        },
                        {
                            icon: 'mobile-alt',
                            title: '医療マシンをオーダーメイド！',
                            description: '厚労省承認の脂肪冷却機器をはじめ、複数の医療機器を個人の体質や目標に合わせてオーダーメイドで組み合わせ。切らずに、科学的根拠に基づいた部分痩せとリバウンドしにくい体質改善を目指せます。'
                        },
                        {
                            icon: 'clock',
                            title: '安心のサポートと保証制度',
                            description: '無理な勧誘はなく、予算や目標を丁寧にヒアリングする姿勢が口コミでも高評価。万が一に備えた「全額返金保証制度」（※条件あり）も用意されており、安心してプログラムを開始できます。'
                        }
                    ],
                    reviews: [
                        {
                            rating: 5,
                            date: '2024年1月',
                            text: '料金が安くて効果もしっかり。コスパ最高です！'
                        },
                        {
                            rating: 5,
                            date: '2023年12月',
                            text: '予約も取りやすく、スタッフさんも親切です。'
                        }
                    ],
                    // stores: [] // 店舗は動的に取得するため削除
                    campaigns: [],
                    campaignInfo: {
                        header: 'INFORMATION!',
                        title: 'URARAクリニックの今月のお得な情報',
                        logoSrc: '/images/clinics/urara/urara-logo.webp',
                        logoAlt: 'URARAクリニック',
                        description: '痩せなければ返金保証<br>さらに脂肪買取制度あり',
                        ctaUrl: 'https://uraraclinic.jp/',
                        ctaText: 'URARAクリニックの公式サイト',
                        microcopy: '＼ダイエット成功率94％の実績／'
                    }
                },
                '3': { // リエートクリニック
                    title: '最新技術で安心痩身<span class="info-icon" onclick="showDisclaimerInfo(\'lieto-success-rate\')" title="詳細情報">ⓘ</span>',
                    subtitle: '個人に合わせたオーダーメイド施術',
                    link: 'リエートクリニック ＞',
                    banner: '/images/clinics/lieto/lieto_detail_bnr.webp',
                    features: [
                        '医療ダイエット', '医療痩身', 'リバウンド防止',
                        '医師監修', '管理栄養士指導', '切らない痩身',
                        'オーダーメイド治療', '駅チカ', '完全個室'
                    ],
                    priceMain: '医療痩身コース',
                    priceValue: '月々9,600円',
                    priceDetail: {
                        '料金': '通常価格49,600円<br>80%0FF 月々9,600円',
                        '施術機械': '脂肪冷却<br>医療用EMS<br>医療ハイフ',
                        '目安期間': '-5〜10kg：約6ヶ月',
                        '営業時間': '平日10:00〜20:00<br>土日祝日10:00〜20:00<br>休診日：年末年始',
                        '対応部位': '顔全体／二の腕／お腹／お尻／太もも／背中／ふくらはぎ／その他',
                        '店舗': '池袋／横浜／名古屋',
                        '公式サイト': 'https://lietoclinic.com/lpbot/lpbot07kana15'
                    },
                    vioPlans: {
                        vioOnly: {
                            title: '部分痩身',
                            price: '30,000円',
                            sessions: '3回',
                            monthly: '月々3,000円'
                        },
                        fullBody: {
                            title: '全身痩身',
                            price: '49,600円',
                            sessions: '5回',
                            monthly: '月々9,600円'
                        }
                    },
                    points: [
                        {
                            icon: 'lightbulb',
                            title: '専門家チームが徹底伴走！',
                            description: '医師・管理栄養士・看護師がチームであなたを徹底サポート！医学的観点と栄養学に基づき、多角的なアプローチで課題を解決。LINEでの相談も可能で、通院日以外も安心です。'
                        },
                        {
                            icon: 'phone',
                            title: '医療マシンをオーダーメイド！',
                            description: '厚労省承認の脂肪冷却機器をはじめ、複数の医療機器を個人の体質や目標に合わせてオーダーメイドで組み合わせ。切らずに、科学的根拠に基づいた部分痩せとリバウンドしにくい体質改善を目指せます。'
                        },
                        {
                            icon: 'coin',
                            title: '安心のサポートと保証制度',
                            description: '無理な勧誘はなく、予算や目標を丁寧にヒアリングする姿勢が口コミでも高評価。万が一に備えた「全額返金保証制度」（※条件あり）も用意されており、安心してプログラムを開始できます。'
                        }
                    ],
                    reviews: [
                        {
                            rating: 5,
                            date: '2024年1月',
                            text: '若い頃の体型に戻れました！6カ月間通い終わり、80kgあった体重が62kgに、体脂肪率は40%から27%に。'
                        },
                        {
                            rating: 5,
                            date: '2023年12月',
                            text: 'スタッフのみなさんお一人お一人がとてもご親切ご丁寧な対応で驚きました。リエートクリニックは本当におすすめ！'
                        }
                    ],
                    clinicInfo: {
                        name: 'リエートクリニック 池袋院',
                        address: '東京都豊島区南池袋1-25-1 池袋MYTビル4F',
                        access: 'JR池袋駅東口より徒歩3分',
                        tel: '0120-LLL-LLL',
                        hours: '10:00〜20:00',
                        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="200" y="150" text-anchor="middle" fill="%23666" font-size="18"%3E院内写真%3C/text%3E%3C/svg%3E'
                    },
                    campaignInfo: {
                        header: 'INFORMATION!',
                        title: 'リエートクリニックの今月のお得な情報',
                        logoSrc: '/images/clinics/lieto/lieto-logo.webp',
                        logoAlt: 'リエートクリニック',
                        description: 'モニター最大80％OFF<br>痩せなければ返金保証あり',
                        ctaUrl: 'https://lietoclinic.com/lpbot/lpbot07kana15',
                        ctaText: 'リエートクリニックの公式サイト',
                        microcopy: '＼リバウンドしない率99.8％／'
                    }
                },
                '4': { // エミナルクリニック
                    title: '医療の力で本気のボディメイク<span class="info-icon" onclick="showDisclaimerInfo(\'eminal-success-rate\')" title="詳細情報">ⓘ</span>',
                    subtitle: '医療と食事指導で理想の姿へ',
                    link: 'エミナルクリニック ＞',
                    banner: '/images/clinics/eminal/eminal_detail_bnr.webp',
                    features: [
                        'メディカルダイエット', 'ボディメイク', '痩身',
                        '部分痩せ', 'リバウンド防止', '医療ハイフ',
                        '脂肪冷却', 'エミナルクリニック', '全国展開'
                    ],
                    priceMain: '3ヶ月コース特別モニター',
                    priceValue: 'モニタープラン',
                    priceDetail: {
                        '料金': 'モニタープラン<br>月額制で負担軽減',
                        '施術機械': '医療ハイフ<br>EMS<br>脂肪冷却',
                        '目安期間': '3ヶ月コースが基本<br>個人の目標に合わせ調整可',
                        '営業時間': '多くの院で11:00〜21:00<br>店舗により異なる',
                        '対応部位': '全身対応<br>お腹・二の腕・太もも・顔',
                        '店舗': '全国60院以上<br>（北海道・東北・関東・中部・近畿・中国・四国・九州・沖縄）',
                        '公式サイト': 'https://eminal-clinic.jp/'
                    },
                    vioPlans: {
                        vioOnly: {
                            title: '部分痩身',
                            price: '30,000円',
                            sessions: '3回',
                            monthly: '月々3,000円'
                        },
                        fullBody: {
                            title: '全身痩身',
                            price: '49,600円',
                            sessions: '5回',
                            monthly: '月々9,600円'
                        }
                    },
                    points: [
                        {
                            icon: 'users',
                            title: '管理栄養士によるオンライン食事指導',
                            description: 'エミナルクリニックでは管理栄養士によるオンラインでの食事指導が受けられます。LINEなどを使って手軽に相談できるので、継続しやすいと評判です。'
                        },
                        {
                            icon: 'network-wired',
                            title: '全国60院以上の安心ネットワーク',
                            description: 'エミナルクリニックは全国60院以上を展開しており、どこに住んでいても同じ品質の医療ダイエットを受けられます。安心・安全なネットワークで、あなたのボディメイクをサポートします。'
                        },
                        {
                            icon: 'clock',
                            title: 'モニター満足度95%の実績',
                            description: 'エミナルクリニックはモニター満足度95%という高い実績を誇っています。多くの方が結果に満足しており、あなたも安心して治療を始めていただけます。'
                        }
                    ],
                    reviews: [
                        {
                            rating: 5,
                            date: '2024年1月',
                            text: '個室なので周りを気にせず施術を受けられて良かったです。'
                        },
                        {
                            rating: 4,
                            date: '2023年12月',
                            text: '痛みが少なく、スタッフの対応も丁寧でした。'
                        }
                    ],
                    // stores: [] // 店舗は動的に取得するため削除
                    campaignInfo: {
                        header: 'INFORMATION!',
                        title: 'エミナルクリニックの今月のお得な情報',
                        logoSrc: '/images/clinics/eminal/eminal-logo.webp',
                        logoAlt: 'エミナルクリニック',
                        description: 'モニタープランで<br>大幅割引実施中',
                        ctaUrl: 'https://eminal-clinic.jp/lp01/medicaldiet_03/',
                        displayUrl: 'https://eminal-clinic.jp/',
                        ctaText: 'エミナルクリニックの公式サイト',
                        microcopy: '＼全国60院以上の安心ネットワーク／'
                    }
                },
                '5': { // 湘南美容クリニック
                    title: '医療の力で楽して痩せる<span class="info-icon" onclick="showDisclaimerInfo(\'sbc-success-rate\')" title="詳細情報">ⓘ</span>',
                    subtitle: '豊富なメニューで最適な痩身治療',
                    link: '湘南美容クリニック ＞',
                    banner: '/images/clinics/sbc/sbc_detail_bnr.webp',
                    features: [
                        '医療ダイエット', '部分痩せ', 'クールスカルプティング',
                        '脂肪溶解注射', 'GLP1', 'サクセンダ',
                        'リバウンド防止', '食事指導', '湘南美容クリニック'
                    ],
                    priceMain: 'クールスカルプティング®エリート',
                    priceValue: '1エリア 29,800円～',
                    priceDetail: {
                        '料金': 'クールスカルプティング®<br>1エリア 29,800円～',
                        '施術機械': 'クールスカルプティング®エリート<br>トゥルースカルプiD<br>脂肪溶解リニアハイフ<br>オンダリフト',
                        '目安期間': '施術内容による<br>ダウンタイムほとんどなし',
                        '営業時間': '店舗により異なる<br>多くは10:00〜19:00',
                        '対応部位': 'お腹・二の腕・太もも・顔<br>全身の気になる部位',
                        '店舗': '日本全国および海外に展開',
                        '公式サイト': 'https://www.s-b-c.net/slimming/'
                    },
                    vioPlans: {
                        vioOnly: {
                            title: '部分痩身',
                            price: '29,800円',
                            sessions: '1エリア',
                            monthly: '応相談'
                        },
                        fullBody: {
                            title: '複数エリア',
                            price: '特別価格',
                            sessions: '応相談',
                            monthly: '応相談'
                        }
                    },
                    points: [
                        {
                            icon: 'user-md',
                            title: '経験豊富な医師の的確な診断',
                            description: '湘南美容クリニックでは経験豊富な医師があなたの体質やライフスタイルに合わせて最適な痩身プランを提案します。一人一人に最適化された治療で確実な結果を目指します。'
                        },
                        {
                            icon: 'list-ul',
                            title: '豊富なメニューで一人一人に最適化',
                            description: '湘南美容クリニックでは豊富なメニューを用意しており、あなたの悩みや目標に合わせて最適な治療を選択できます。クールスカルプティングから脂肪溶解注射まで、一人一人に最適化した痩身治療を提供します。'
                        },
                        {
                            icon: 'award',
                            title: '経験豊富な医師と安心サポート',
                            description: '湘南美容クリニックは経験豊富な医師が在籍し、あなたの不安や疑問に丁寧に答えます。最新の医療技術と安心のサポート体制で、理想のボディラインを実現します。'
                        }
                    ],
                    reviews: [
                        {
                            rating: 5,
                            date: '2024年1月',
                            text: '大手なので安心感があります。効果も確実でした。'
                        },
                        {
                            rating: 5,
                            date: '2023年12月',
                            text: '色々なメニューから選べるのが良かったです。'
                        }
                    ],
                    // stores: [] // 店舗は動的に取得するため削除
                    campaignInfo: {
                        header: 'INFORMATION!',
                        title: '湘南美容クリニックの今月のお得な情報',
                        logoSrc: '/images/clinics/sbc/sbc-logo.webp',
                        logoAlt: '湘南美容クリニック',
                        description: '期間限定キャンペーン<br>モニター募集中',
                        ctaUrl: 'https://www.s-b-c.net/slimming/',
                        ctaText: '湘南美容クリニックの公式サイト',
                        microcopy: '＼症例実績30万件以上の実績／'
                    }
                }
            };

            // クリニック名に基づいて正しいクリニックIDを取得
            const clinicNameToIdMap = {
                'ディオクリニック': '1',
                'ウララクリニック': '2',
                'リエートクリニック': '3',
                'エミナルクリニック': '4',
                '湘南美容クリニック': '5'
            };
            
            const correctClinicId = clinicNameToIdMap[clinic.name] || clinicId;
            
            // 正しいクリニックIDに基づいてデータを取得し、地域IDを追加
            const data = clinicDetailDataMap[correctClinicId] || clinicDetailDataMap['1'];
            data.regionId = regionId;
            
            // 5番目のクリニック（湘南美容クリニック）の場合、bannerを追加
            if (clinicId === '5' && !data.banner) {
                data.banner = '/images/clinics/sbc/sbc_detail_bnr.webp';
            }
            
            // 店舗データを動的に取得（store_view.csvに基づいてフィルタリング）
            const allStores = this.dataManager.getStoresByRegionId(regionId);
            console.log(`🏬 地域 ${regionId} の全店舗:`, allStores.map(s => `${s.id}:${s.clinicName}`));
            
            // クリニック名のマッピング（stores.csvとitems.csvの名前の違いを解決）
            // 実際のstores.csvを確認した結果、すべて同じ名前で統一されていることが判明
            const clinicNameMap = {
                'ディオクリニック': 'ディオクリニック',
                'エミナルクリニック': 'エミナルクリニック',
                'ウララクリニック': 'ウララクリニック',
                'リエートクリニック': 'リエートクリニック',
                '湘南美容クリニック': '湘南美容クリニック'
            };
            
            const storeClinicName = clinicNameMap[clinic.name] || clinic.name;
            
            // 現在のクリニックに属する店舗のみをフィルタリング
            data.stores = allStores.filter(store => store.clinicName === storeClinicName);

            detailItem.innerHTML = `
                <div class="ranking_box_in">
                    <div class="detail-rank">
                        <div class="detail-rank-header">
                            <div class="detail-rank-badge ${badgeClass}">No.${rank}</div>
                            <div class="detail-title">
                                <h3>${data.title}</h3>
                                <p>${data.subtitle}</p>
                            </div>
                        </div>
                        <div class="ranking__name">
                            <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id)}" target="_blank" rel="noopener nofollow">${clinic.name} ＞</a>
                        </div>
                    </div>
                ${(() => {
                    // クリニック名に基づいて正しいバナーパスを設定
                    const clinicNameToBannerMap = {
                        'ディオクリニック': '/images/clinics/dio/dio_detail_bnr.webp',
                        'ウララクリニック': '/images/clinics/urara/urara_detail_bnr.webp',
                        'リエートクリニック': '/images/clinics/lieto/lieto_detail_bnr.webp',
                        'エミナルクリニック': '/images/clinics/eminal/eminal_detail_bnr.webp',
                        '湘南美容クリニック': '/images/clinics/sbc/sbc_detail_bnr.webp'
                    };
                    const correctBanner = clinicNameToBannerMap[clinic.name] || data.banner;
                    return correctBanner ? `
                    <div class="detail-banner">
                        <img src="${correctBanner}" alt="${clinic.name}キャンペーン">
                    </div>
                    ` : '';
                })()}
                <div class="detail-features">
                    ${data.features.map(feature => `<span class="feature-tag"># ${feature}</span>`).join('')}
                </div>
                
                <!-- 拡張版価格表 -->
                <table class="info-table">
                    ${Object.entries(data.priceDetail).map(([key, value]) => `
                        <tr>
                            <td>${key}</td>
                            <td>${value}</td>
                        </tr>
                    `).join('')}
                </table>
                
                <!-- CTAボタン -->
                <div class="clinic-cta-button-wrapper">
                    <p class="btn btn_second_primary">
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id)}" target="_blank" rel="noopener noreferrer">
                            <span class="bt_s">無料カウンセリングはコチラ</span>
                            <span class="btn-arrow">▶</span>
                        </a>
                    </p>
                </div>
                
                <!-- クリニックのポイント -->
                <div class="clinic-points-section">
                    <h4 class="section-title">POINT</h4>
                    <div class="ribbon_point_box_no">
                        ${data.points.map((point, index) => {
                            let iconClass = 'fa-clock';
                            if (point.icon === 'lightbulb') iconClass = 'fa-lightbulb';
                            else if (point.icon === 'phone') iconClass = 'fa-mobile-alt';
                            else if (point.icon === 'coins') iconClass = 'fa-yen-sign';
                            
                            return `
                            <div class="ribbon_point_title2_s">
                                <i class="fas ${iconClass} point-icon-inline"></i>
                                <strong>${point.title}</strong>
                            </div>
                            <div class="ribbon_point_txt">
                                <p style="font-size:14px;">${point.description}</p>
                            </div>
                            `;
                        }).join('')}
                        <div class="ribbon_point_link">
                            【公式】<a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id)}" target="_blank" rel="noopener"><strong>${data.priceDetail['公式サイト'] || '#'}</strong></a>
                        </div>
                    </div>
                </div>
                
                
                <!-- 口コミ -->
                <div class="reviews-section">
                    <h4 class="section-title-review">REVIEW</h4>
                    
                    <section id="review_tab_box">
                        <nav role="navigation" class="review_tab2">
                            <ul>
                                <li class="select2" data-tab="cost"><i class="fas fa-yen-sign"></i> コスパ</li>
                                <li data-tab="access"><i class="fas fa-heart"></i> 通いやすさ</li>
                                <li data-tab="staff"><i class="fas fa-user-md"></i> スタッフ</li>
                            </ul>
                        </nav>
                        ${rank === 2 ? `
                        <div class="wrap_long2 active">
                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon4.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>25キロ減量に成功！</strong></div>
                                    <div class="review_tab_box_txt">
                                        25キロ弱体重を落とせました。自分1人の力だけでは絶対になし得なかったので良かったと思ってます。
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon5.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>3ヶ月で10キロ減！辛くない</strong></div>
                                    <div class="review_tab_box_txt">
                                        3ヶ月の契約をして結果10キロの減量できました。特に辛いこともなく順調だったと思います。
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon6.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>きつい運動なしで6kg減！</strong></div>
                                    <div class="review_tab_box_txt">
                                        3ヶ月で6kg減でした！(継続中) きつい運動や厳しい食事制限も無い中で、順調に体重減少しているので、良かったです。
                                    </div>
                                </div>
                            </div>
                            <p style="font-size:8px;text-align:right">※効果には個人差があります<br>※個人の感想です</p>
                        </div>

                        <div class="wrap_long2 disnon2">
                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon4.webp" alt="レビューアイコン">
                                    <span>★★★★☆</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>多角的なアプローチで効果的！</strong></div>
                                    <div class="review_tab_box_txt">
                                        医療美容ということで施術と並行して点滴や錠剤など多角的にダイエットと向き合いました。管理栄養士による栄養指導もあり、モチベーションを保つには最適な環境でした。
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon5.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>スタッフが素晴らしい！</strong></div>
                                    <div class="review_tab_box_txt">
                                        関わっていただいた全てのスタッフの方々が本当に感じが良いので毎週通うのが苦ではなかったです。
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon6.webp" alt="レビューアイコン">
                                    <span>★★★☆☆</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>運動嫌いでも6キロ減！</strong></div>
                                    <div class="review_tab_box_txt">
                                        食習慣が変わったり運動が嫌いですが3〜4ヶ月で6キロほど体重も落ちました。予約も比較的取りやすく駅からも近いので無理なく通えました。
                                    </div>
                                </div>
                            </div>
                            <p style="font-size:8px;text-align:right">※効果には個人差があります<br>※個人の感想です</p>
                        </div>

                        <div class="wrap_long2 disnon2">
                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon7.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>投薬なしで3キロ減！</strong></div>
                                    <div class="review_tab_box_txt">
                                        初めに投薬なしで3ヶ月間リバースエイジングコースをし、体重が3㌔ほど痩せました。スタッフの方々も皆さん、優しく、毎日楽しく通わせてもらっています。
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon8.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>教育が行き届いている！</strong></div>
                                    <div class="review_tab_box_txt">
                                        16回の通院の中、医師、看護師、管理栄養士の方々の対応はとても丁寧で、教育が行き届いているという印象を受けました。
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon9.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>専門知識で安心施術！</strong></div>
                                    <div class="review_tab_box_txt">
                                        スタッフさんが明るくて優しかったので不安な施術も安心して受けられました。専門的な知識を教えてくださったり栄養指導もしてくれるので無理なく出来ました。
                                    </div>
                                </div>
                            </div>
                            <p style="font-size:8px;text-align:right">※効果には個人差があります<br>※個人の感想です</p>
                        </div>
                        ` : `
                        <div class="wrap_long2 active">
                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon${rank === 1 ? '1' : rank === 3 ? '7' : rank === 4 ? '10' : '3'}.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>${rank === 3 ? '若い頃の体型に戻れました！' : 'ストイックな運動より効果的！'}</strong></div>
                                    <div class="review_tab_box_txt">
                                        ${rank === 3 ? '6カ月間通い終わり、80kgあった体重が62kgになり、体脂肪率は40%から27%に。昔のジーンズをはいてみたり、若い頃に戻ったようです。' : '某スポーツジムでストイックに食事管理をしても減らなかった体重が、薬で無理なく減っていきビックリしました。え、あの辛い運動や糖質制限はなんだったんだろう…。'}
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon${rank === 1 ? '2' : rank === 3 ? '8' : rank === 4 ? '1' : '4'}.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>${rank === 3 ? '不安からのスタートでしたが、今は大満足！' : '2ヶ月で8キロ減！'}</strong></div>
                                    <div class="review_tab_box_txt">
                                        ${rank === 3 ? 'なんと85kgあった体重が70kgに！正直、最初は効果があるか不安でしたが、結果が出て大満足です。適正体重を取り戻せたので、今後もキープしたいです。' : 'なかなかジムなどに通っても減らなくなってしまっていましたが、こちらに通い始めて2ヶ月ぐらいで8キロぐらい減らすことができました！'}
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon${rank === 1 ? '3' : rank === 3 ? '9' : rank === 4 ? '2' : '5'}.webp" alt="レビューアイコン">
                                    <span>★★★★☆</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>${rank === 3 ? '見た目も体重も変化を実感！' : '周りから痩せたと言われる！'}</strong></div>
                                    <div class="review_tab_box_txt">
                                        ${rank === 3 ? '今の時点では見た目にも体重的にも効果は出てきていると思うのでやって後悔はしていません。' : '2ヶ月たって、周りの人から痩せたねと言われることが多くなりました！サクセンダのおかげで空腹感をあまり感じずに食事制限することが出来ました！'}
                                    </div>
                                </div>
                            </div>
                            <p style="font-size:8px;text-align:right">※効果には個人差があります<br>※個人の感想です</p>
                        </div>

                        <div class="wrap_long2 disnon2">
                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon9.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>${rank === 3 ? '丁寧な対応と万全のフォローで安心' : '言葉遣いが丁寧！'}</strong></div>
                                    <div class="review_tab_box_txt">
                                        ${rank === 3 ? '予約の取りやすさや対応の丁寧さが素晴らしい。施術後のフォローも含め、疑問や不安があればすぐに相談できて助かります！' : '言葉遣いも、めちゃくちゃ丁寧で、こちらが恐縮してしまうくらい、しっかり教育もされていたので、毎回、気持ち良く通わせて頂きました。ありがとうございました。'}
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon5.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>${rank === 3 ? '駅近で会社帰りにも◎' : '清潔感があり丁寧な対応'}</strong></div>
                                    <div class="review_tab_box_txt">
                                        ${rank === 3 ? '駅近で会社帰りに行きやすく、仕事が終わってから毎回通わせていただいています。ここで独自に出されているプロテインは飲みやすく、置き換えしやすい。' : '院内は清潔感があって、スタッフはどの方も丁寧で優しいです。距離感は付かず離れずの丁度良い感じでした。'}
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon6.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>${rank === 3 ? '急な予定変更にも柔軟に対応！' : '栄養士さんが熱心！'}</strong></div>
                                    <div class="review_tab_box_txt">
                                        ${rank === 3 ? 'みなさん優しく、丁寧な対応をしていただけるので、安心して通えます！仕事都合で急なキャンセルや予約変更にも対応していただけるところも、通いやすいです！' : '受付の方の対応も、とても落ち着いていて且つ優しくて、ほっとします。栄養士さんが糖質の摂り方など、熱心に教えてくださるので、楽しくて勉強になります。'}
                                    </div>
                                </div>
                            </div>
                            <p style="font-size:8px;text-align:right">※効果には個人差があります<br>※個人の感想です</p>
                        </div>

                        <div class="wrap_long2 disnon2">
                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon7.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>${rank === 3 ? '接遇レベルの高さに感動！' : '人生一度きり！頑張ります'}</strong></div>
                                    <div class="review_tab_box_txt">
                                        ${rank === 3 ? '美容クリニックは施術が大事なのはもちろんですが、接遇のレベルが高いと次もまた来たくなりますね！スタッフの皆さんの気遣いが素晴らしく、いつも快適に過ごせてます。' : '今まで色んなことをしても痩せられなかったので、人生一度きりだと思い通うことを決めました。1ヶ月で、食事制限などが苦手な私でも、−５㌔落ちました！'}
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon8.webp" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>${rank === 3 ? '分かりやすいカウンセリング' : '栄養士の指導で結果が出た！'}</strong></div>
                                    <div class="review_tab_box_txt">
                                        ${rank === 3 ? 'カウンセリングの際、その都度分からないことがあるか確認していただけたのでプランの内容も理解しやすかったです！看護師さん達もとても丁寧で、終始安心して受けられます。' : '栄養士の先生の指導と最先端の機材を使った施術でしっかりと結果が出ました。無理のない範囲で食事指導もして頂き、停滞したら新しい一手を提案して貰えるので、頑張れます。'}
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon9.webp" alt="レビューアイコン">
                                    <span>★★★★☆</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>${rank === 3 ? '心からおすすめしたいクリニック' : '1ヶ月半で簡単に体重が落ちた！'}</strong></div>
                                    <div class="review_tab_box_txt">
                                        ${rank === 3 ? 'スタッフのみなさんお一人お一人がとてもご親切ご丁寧な対応で驚きました。リエートクリニックは本当におすすめなので、ぜひとも、たくさんの方に紹介したいです！！' : '約1か月半たち、自分ではどうしても落とさなかった体重が、簡単に落とせてびっくりです！通うたびに変化が出るので、とてもモチベーションが上がります！！'}
                                    </div>
                                </div>
                            </div>
                            <p style="font-size:8px;text-align:right">※効果には個人差があります<br>※個人の感想です</p>
                        </div>
                        `}
                    </section>
                </div>
                
                <!-- 店舗情報 -->
                <div class="brand-section">
                    <h4 class="section-heading">
                        ${clinic.name}の【${this.getRegionName(data.regionId)}】の店舗
                    </h4>
                    ${this.generateStoresDisplay(data.stores || [], clinicId)}
                </div>
                
                <!-- 特典情報 -->
                <div class="campaign-section">
                    ${this.generateCampaignDisplay(clinic.id, data.campaignInfo)}
                </div>
                </div>
            `;

            console.log('Appending detail item for clinic:', clinic.name);
            detailsList.appendChild(detailItem);
            console.log('Detail item appended. Current HTML length:', detailsList.innerHTML.length);
        });
    }
    
    // 店舗表示のHTML生成（MAX3店舗 + アコーディオン）
    generateStoresDisplay(stores, clinicId) {
        // クリニック名を取得（IDに基づいて）
        const clinicNames = {
            '1': 'dio',
            '2': 'eminal',
            '3': 'urara',
            '4': 'lieto',
            '5': 'sbc'
        };
        const clinicName = clinicNames[clinicId] || 'dio';
        if (!stores || stores.length === 0) {
            return '<div class="shops"><p class="no-stores">店舗情報がありません</p></div>';
        }
        
        const visibleStores = stores.slice(0, 3);
        const hiddenStores = stores.slice(3);
        const storeId = `shops-${Date.now()}`; // ユニークなIDを生成
        
        let html = `<div class="shops" id="${storeId}">`;
        
        // 最初の3店舗を表示
        visibleStores.forEach((store, index) => {
            html += `
                <div class='shop'>
                    <div class='shop-image'>
                        <img src="${this.getStoreImage(clinicName, index + 1)}" alt="${store.name}" onerror="this.src='${window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images'}/clinics/${clinicName}/${clinicName}-logo.jpg'" />
                    </div>
                    <div class='shop-info'>
                        <div class='shop-name'>
                            <a href="${this.urlHandler.getClinicUrlByNameWithRegionId(clinicName)}" target="_blank" rel="nofollow">${store.name || `店舗${index + 1}`}</a>
                        </div>
                        <div class='shop-address line-clamp'>
                            ${store.address || '住所情報なし'}
                        </div>
                    </div>
                    <a class="shop-btn map-toggle-btn" href="javascript:void(0);" data-store-id="${storeId}-${index}">
                        <i class='fas fa-map-marker-alt btn-icon'></i>
                        地図
                    </a>
                    <!-- 地図アコーディオン -->
                    <div class="map-accordion" id="map-${storeId}-${index}" style="display: none;">
                        <div class="map-content">
                            <div class="map-iframe-container">
                                ${this.generateMapIframe(store.address)}
                            </div>
                            <div class="map-details">
                                <div class="map-detail-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span class="map-detail-label">住所:</span>
                                    <span>${store.address || '住所情報なし'}</span>
                                </div>
                                ${store.access ? `
                                <div class="map-detail-item">
                                    <i class="fas fa-train"></i>
                                    <span class="map-detail-label">アクセス:</span>
                                    <span>${store.access}</span>
                                </div>
                                ` : ''}
                                ${store.hours ? `
                                <div class="map-detail-item">
                                    <i class="fas fa-clock"></i>
                                    <span class="map-detail-label">営業時間:</span>
                                    <span>${store.hours}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // 4店舗以上ある場合は隠しコンテンツとして追加
        hiddenStores.forEach((store, index) => {
            html += `
                <div class='shop hidden-content hidden'>
                    <div class='shop-image'>
                        <img src="${this.getStoreImage(clinicName, index + 4)}" alt="${store.name}" onerror="this.src='${window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images'}/clinics/${clinicName}/${clinicName}-logo.jpg'" />
                    </div>
                    <div class='shop-info'>
                        <div class='shop-name'>
                            <a href="${this.urlHandler.getClinicUrlByNameWithRegionId(clinicName)}" target="_blank" rel="nofollow">${store.name || `店舗${index + 4}`}</a>
                        </div>
                        <div class='shop-address line-clamp'>
                            ${store.address || '住所情報なし'}
                        </div>
                    </div>
                    <a class="shop-btn map-toggle-btn" href="javascript:void(0);" data-store-id="${storeId}-${index + 3}">
                        <i class='fas fa-map-marker-alt btn-icon'></i>
                        地図
                    </a>
                    <!-- 地図アコーディオン -->
                    <div class="map-accordion" id="map-${storeId}-${index + 3}" style="display: none;">
                        <div class="map-content">
                            <div class="map-iframe-container">
                                ${this.generateMapIframe(store.address)}
                            </div>
                            <div class="map-details">
                                <div class="map-detail-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span class="map-detail-label">住所:</span>
                                    <span>${store.address || '住所情報なし'}</span>
                                </div>
                                ${store.access ? `
                                <div class="map-detail-item">
                                    <i class="fas fa-train"></i>
                                    <span class="map-detail-label">アクセス:</span>
                                    <span>${store.access}</span>
                                </div>
                                ` : ''}
                                ${store.hours ? `
                                <div class="map-detail-item">
                                    <i class="fas fa-clock"></i>
                                    <span class="map-detail-label">営業時間:</span>
                                    <span>${store.hours}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // 4店舗以上ある場合はボタンを追加
        if (hiddenStores.length > 0) {
            html += `
                <a class="section-btn" data-target="#${storeId}" href="javascript:void(0);" onclick="toggleStores(this)">
                    他${hiddenStores.length}件のクリニックを見る
                    <i class="fas fa-chevron-down btn-icon"></i>
                </a>
            `;
        }
        
        return html;
    }
    
    // 残りの店舗情報生成（アコーディオン内）
    generateHiddenStores(stores) {
        let html = '';
        stores.forEach((store, index) => {
            html += `
                <div class="store-item">
                    <div class="store-header">
                        <h5 class="store-name">${store.name || `店舗${index + 4}`}</h5>
                    </div>
                    <div class="store-info">
                        <div class="store-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${store.address || '住所情報なし'}</span>
                        </div>
                        <div class="store-detail">
                            <i class="fas fa-train"></i>
                            <span>${store.access || 'アクセス情報なし'}</span>
                        </div>
                        <div class="store-detail">
                            <i class="fas fa-phone"></i>
                            <span>${store.tel || '電話番号なし'}</span>
                        </div>
                        <div class="store-detail">
                            <i class="fas fa-clock"></i>
                            <span>${store.hours || '営業時間情報なし'}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // 残りの店舗がある場合はアコーディオンで表示
        if (hiddenStores.length > 0) {
            html += `
                <div class="stores-accordion">
                    <button class="accordion-button" onclick="this.classList.toggle('active'); this.nextElementSibling.classList.toggle('show');">
                        <span>他${hiddenStores.length}件のクリニックを見る</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="accordion-content">
            `;
            
            hiddenStores.forEach((store, index) => {
                html += `
                    <div class="store-item">
                        <div class="store-header">
                            <h5 class="store-name">${store.name || `店舗${visibleStores.length + index + 1}`}</h5>
                        </div>
                        <div class="store-info">
                            <div class="store-detail">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${store.address || '住所情報なし'}</span>
                            </div>
                            <div class="store-detail">
                                <i class="fas fa-train"></i>
                                <span>${store.access || 'アクセス情報なし'}</span>
                            </div>
                            <div class="store-detail">
                                <i class="fas fa-phone"></i>
                                <span>${store.tel || '電話番号なし'}</span>
                            </div>
                            <div class="store-detail">
                                <i class="fas fa-clock"></i>
                                <span>${store.hours || '営業時間情報なし'}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    // キャンペーン表示のHTML生成（各クリニックのcampaignInfoを使用）
    generateCampaignDisplay(clinicId, campaignInfo) {
        if (!campaignInfo) {
            return ''; // キャンペーン情報がない場合は空を返す
        }
        
        // クリニック名を取得
        const clinic = this.dataManager.getAllClinics().find(c => c.id === clinicId);
        const clinicName = clinic ? clinic.name : 'クリニック';
        
        return `
            <div class="campaign-container">
                <div class="campaign-header">${campaignInfo.header}</div>
                <div class="campaign-content">
                    <div class="camp_header3">
                        <div class="info_logo">
                            <img src="${campaignInfo.logoSrc}" alt="${campaignInfo.logoAlt}">
                        </div>
                        <div class="camp_txt">
                            ${campaignInfo.description}
                        </div>
                    </div>
                    
                    <div class="cv_box_img">
                        ${campaignInfo.microcopy || '＼月額・総額がリーズナブルなクリニック／'}
                        <p class="btn btn_second_primary" style="margin-top: 10px;">
                            <a href="${this.urlHandler.getClinicUrlWithRegionId(clinicId)}" target="_blank" rel="noopener">
                                <span class="bt_s">${campaignInfo.ctaText}</span>
                                <span class="btn-arrow">▶</span>
                            </a>
                        </p>
                    </div>
                </div>
            </div>
            ${clinicId === '1' ? `
                <!-- ディオクリニックの確認事項アコーディオン -->
                <div class="disclaimer-accordion" style="margin-top: 15px;">
                    <button class="disclaimer-header" onclick="toggleDisclaimer('dio-campaign')" style="width: 100%; text-align: left; padding: 8px 12px; background-color: #fafafa; border: 1px solid #f0f0f0; border-radius: 3px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 10px; font-weight: 500; color: #666;">ディオクリニックの確認事項</span>
                        <span id="dio-campaign-arrow" style="font-size: 8px; color: #999; transition: transform 0.2s;">▼</span>
                    </button>
                    <div id="dio-campaign-content" class="disclaimer-content" style="display: none; padding: 8px 12px; background-color: #fcfcfc; border: 1px solid #f0f0f0; border-top: none; border-radius: 0 0 3px 3px; margin-top: -1px;">
                        <div style="font-size: 9px; color: #777; line-height: 1.4;">
                            <p>「通院者の99%が体重減少効果あり」※最終体重測定2023/2/1～2023/7/31で薬なし、食事指導なしを除く、3ヶ月コース（ビューティー/リピート除く）の契約終了者が対象。効果には個人差があります。初回体重50kg以上or初回BMI25以上の方限定。</p>
                            <p>「平均13.7kg減量」※2023/2/1~7/31の3ヶ月コース（楽やせ食事指導なし、ビューティーリピートを除く）全卒業者が対象</p>
                            <p>「12ヶ月分 0円」※支払総額193,992円を64回、月々3,000円に分割し、12ヶ月分（12回分）の分割金が減額されます。※他キャンペーンとの併用不可※当社指定の信販会社で契約をした方限定※コースのみ契約者適用※契約時の申し出のみ有効。</p>
                            <p>「12ヶ月分無料」※支払総額の12ヶ月分が無料※他キャンペーンとの併用不可</p>
                            <p>「モニター75%OFF」※1～3：他キャンペーンと併用不可／契約時の申し出のみ有効コースご契約者様限定、但し一部コースを除く※3：医師の判断で適用できない場合がございます。</p>
                            <p>「痩せなかったら全額返金保証」※他のキャンペーンの併用不可※初回ご来院時測定体重を元に目標体重を設定し、減量率が50%未満の場合、契約終了を条件に全額返金の適用を受けられます※契約時に同意書契約を結んだ場合のみ適用※落ち幅3.0%での計算に限る※中途解約手数料なし。</p>
                            <p>下記に当てはまる方は施術不可の為、施術が受けれられません。体重40kg以下/BMI18.5以下/19歳以下70歳以上/がん/妊娠中/授乳中/産後3ヶ月以内の方</p>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    }

    // 店舗画像のパスを取得するメソッド
    getStoreImage(clinicName, storeNumber) {
        // SBCクリニックまたはウララクリニックの場合は、ロゴ画像を使用
        if (clinicName === 'sbc' || clinicName === 'urara') {
            const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
            return `${imagesPath}/clinics/${clinicName}/${clinicName}-logo.webp`;
        }
        
        // 店舗番号を3桁の文字列に変換
        const paddedNumber = String(storeNumber).padStart(3, '0');
        
        // クリニックごとの画像拡張子を定義
        const imageExtensions = {
            'dio': 'webp',
            'eminal': 'webp',
            'lieto': 'webp'
        };
        
        const extension = imageExtensions[clinicName] || 'webp';
        const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
        const storeImagePath = `${imagesPath}/clinics/${clinicName}/${clinicName}_clinic/clinic_image_${paddedNumber}.${extension}`;
        
        return storeImagePath;
    }

    // 地域IDから地域名を取得するヘルパーメソッド
    getRegionName(regionId) {
        if (!window.dataManager) {
            return '';
        }
        const region = window.dataManager.getRegionById(regionId);
        return region ? region.name : '';
    }

    // Google Maps iframeを生成
    generateMapIframe(address) {
        if (!address) {
            return '<p>住所情報がありません</p>';
        }
        
        // 住所をエンコード
        const encodedAddress = encodeURIComponent(address);
        
        // Google Maps Embed APIのURL
        const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&output=embed&z=16`;
        
        return `
            <iframe 
                src="${mapUrl}"
                width="100%" 
                height="300" 
                style="border:0;" 
                allowfullscreen="" 
                loading="lazy" 
                referrerpolicy="no-referrer-when-downgrade"
                title="Google Maps">
            </iframe>
        `;
    }

    // 地図モーダルのイベントリスナーを設定
    setupMapAccordions() {
        console.log('setupMapAccordions called');
        
        // モーダル要素を取得
        const mapModal = document.getElementById('map-modal');
        const mapModalClose = document.getElementById('map-modal-close');
        const mapModalOverlay = document.querySelector('.map-modal-overlay');
        
        console.log('Modal elements:', {
            modal: !!mapModal,
            close: !!mapModalClose,
            overlay: !!mapModalOverlay
        });
        
        // 既存のイベントリスナーを削除（この処理は不要なのでコメントアウト）
        // const mapButtons = document.querySelectorAll('.map-toggle-btn');
        // console.log('Map buttons found:', mapButtons.length);
        // 
        // mapButtons.forEach(btn => {
        //     const newBtn = btn.cloneNode(true);
        //     btn.parentNode.replaceChild(newBtn, btn);
        // });

        // イベント委譲を使用して、動的に追加されたボタンにも対応
        const self = this; // thisを保存
        
        // 既存のイベントリスナーがあれば削除
        if (this.mapButtonClickHandler) {
            document.removeEventListener('click', this.mapButtonClickHandler);
        }
        
        // 新しいイベントリスナーを作成
        this.mapButtonClickHandler = (e) => {
            if (e.target.closest('.map-toggle-btn')) {
                console.log('Map button clicked!');
                e.preventDefault();
                const button = e.target.closest('.map-toggle-btn');
                
                // 店舗情報を取得（実際のHTML構造に合わせて修正）
                const shopContainer = button.closest('.shop');
                console.log('Shop container found:', !!shopContainer);
                
                if (shopContainer) {
                    // 店舗名を取得
                    const storeNameElement = shopContainer.querySelector('.shop-name a');
                    const storeName = storeNameElement?.textContent?.trim() || '店舗';
                    
                    // 住所を取得
                    const addressElement = shopContainer.querySelector('.shop-address');
                    const address = addressElement?.textContent?.trim() || '住所情報なし';
                    
                    // アクセス情報を取得
                    let access = '駅から徒歩圏内'; // デフォルト値
                    let clinicName = 'クリニック'; // デフォルト値
                    
                    // CSVデータから正確なアクセス情報とクリニック名を取得
                    if (self.dataManager) {
                        const stores = self.dataManager.stores; // 直接storesプロパティを参照
                        // 店舗名と住所が一致する店舗を探す
                        const matchingStore = stores.find(store => {
                            return store.storeName === storeName && store.address === address;
                        });
                        
                        if (matchingStore) {
                            if (matchingStore.access) {
                                access = matchingStore.access;
                            }
                            // CSVからクリニック名を取得
                            if (matchingStore.clinicName) {
                                clinicName = matchingStore.clinicName;
                            }
                            console.log('Found store in CSV:', matchingStore);
                        } else {
                            // CSVから見つからない場合は、HTMLから取得を試みる
                            const shopInfoElement = shopContainer.querySelector('.shop-info');
                            if (shopInfoElement) {
                                const infoText = shopInfoElement.textContent;
                                const lines = infoText.split('\n').map(line => line.trim()).filter(line => line);
                                const accessLine = lines.find(line => line.includes('駅') && (line.includes('徒歩') || line.includes('分')));
                                if (accessLine) {
                                    access = accessLine;
                                }
                            }
                        }
                    }
                    
                    // CSVからクリニック名を取得できなかった場合のみ、HTMLから取得
                    if (clinicName === 'クリニック') {
                        const shopsContainer = shopContainer.closest('.shops');
                        const clinicDetailElement = shopsContainer?.closest('.detail-item');
                        
                        // h3要素から正しいクリニック名を取得（例: ディオクリニック）
                        const h3Element = clinicDetailElement?.querySelector('h3');
                        if (h3Element) {
                            // h3のテキストから「ⓘ」などの記号を除去
                            const h3Text = h3Element.childNodes[0]?.textContent?.trim() || h3Element.textContent?.trim();
                            // 実際のクリニック名を抽出（ボタンのクラス名などから推測）
                            const detailButtons = clinicDetailElement.querySelectorAll('.detail_btn_2, .link_btn');
                            if (detailButtons.length > 0) {
                                const href = detailButtons[0].getAttribute('href');
                                if (href?.includes('/draft/go/dio/') || href?.includes('/go/dio/')) {
                                    clinicName = 'ディオクリニック';
                                } else if (href?.includes('/draft/go/eminal/') || href?.includes('/go/eminal/')) {
                                    clinicName = 'エミナルクリニック';
                                } else if (href?.includes('/draft/go/urara/') || href?.includes('/go/urara/')) {
                                    clinicName = 'ウララクリニック';
                                } else if (href?.includes('/draft/go/lieto/') || href?.includes('/go/lieto/')) {
                                    clinicName = 'リエートクリニック';
                                } else if (href?.includes('/draft/go/sbc/') || href?.includes('/go/sbc/')) {
                                    clinicName = '湘南美容クリニック';
                                }
                            }
                        }
                    }
                    
                    console.log('Store info:', { clinicName, storeName, address, access });
                    
                    // モーダルに情報を設定
                    try {
                        // デバッグ用に詳細ログを追加
                        console.log('Processing store name:', {
                            originalStoreName: storeName,
                            clinicName: clinicName,
                            startsWithClinic: storeName.startsWith('クリニック'),
                            includesClinicName: storeName.includes(clinicName)
                        });
                        
                        // 店舗名が「クリニック 渋谷院」のような形式の場合、「クリニック」を正しいクリニック名に置換
                        let fullStoreName = storeName;
                        if (storeName.startsWith('クリニック')) {
                            // 「クリニック 新宿院」→「ディオクリニック新宿院」
                            fullStoreName = clinicName + storeName.replace('クリニック', '').trim();
                        } else if (!storeName.includes(clinicName)) {
                            // 店舗名にクリニック名が含まれていない場合、追加
                            fullStoreName = clinicName + storeName;
                        }
                        
                        console.log('Final store name:', fullStoreName);
                        self.showMapModal(fullStoreName, address, access, clinicName);
                    } catch (error) {
                        console.error('Error in showMapModal:', error);
                    }
                } else {
                    console.log('Shop container not found. Button parent:', button.parentElement);
                    console.log('Button HTML:', button.outerHTML);
                    
                    // フォールバック: 最低限の情報でモーダルを表示
                    try {
                        self.showMapModal('テストクリニック', 'テスト住所', 'テストアクセス', 'test');
                    } catch (error) {
                        console.error('Error in fallback showMapModal:', error);
                    }
                }
            }
        };
        
        // イベントリスナーを追加
        document.addEventListener('click', this.mapButtonClickHandler);
        
        // モーダルを閉じるイベント
        if (mapModalClose) {
            mapModalClose.addEventListener('click', () => {
                self.hideMapModal();
            });
        }
        
        if (mapModalOverlay) {
            mapModalOverlay.addEventListener('click', () => {
                self.hideMapModal();
            });
        }
        
        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mapModal?.style.display !== 'none') {
                self.hideMapModal();
            }
        });
    }
    
    // 地図モーダルを表示
    showMapModal(clinicName, address, access, clinicCode) {
        console.log('showMapModal called with:', { clinicName, address, access, clinicCode });
        
        const modal = document.getElementById('map-modal');
        const modalClinicName = document.getElementById('map-modal-clinic-name');
        const modalAddress = document.getElementById('map-modal-address');
        const modalAccess = document.getElementById('map-modal-access');
        const modalHours = document.getElementById('map-modal-hours');
        const modalMapContainer = document.getElementById('map-modal-map-container');
        const modalButton = document.getElementById('map-modal-button');
        
        console.log('Modal elements check:', {
            modal: !!modal,
            modalClinicName: !!modalClinicName,
            modalAddress: !!modalAddress,
            modalAccess: !!modalAccess,
            modalMapContainer: !!modalMapContainer
        });
        
        if (modal && modalClinicName && modalAddress && modalAccess && modalMapContainer) {
            // モーダルの内容を設定
            modalClinicName.textContent = clinicName;
            modalAddress.textContent = address;
            modalAccess.textContent = access;
            
            // 営業時間を設定（クリニックごとに異なる場合は条件分岐を追加）
            if (modalHours) {
                // デフォルトの営業時間を設定
                let hours = '11:00〜21:00';
                
                // クリニック名に基づいて営業時間を調整（必要に応じて）
                if (clinicName.includes('DIO') || clinicName.includes('ディオ')) {
                    hours = '11:00〜21:00';
                } else if (clinicName.includes('エミナル')) {
                    hours = '11:00〜21:00';
                } else if (clinicName.includes('湘南')) {
                    hours = '10:00〜19:00';
                } else if (clinicName.includes('リエート')) {
                    hours = '11:00〜20:00';
                } else if (clinicName.includes('ウララ')) {
                    hours = '11:00〜20:00';
                }
                
                modalHours.textContent = hours;
            }
            
            // Google Maps iframeを生成
            modalMapContainer.innerHTML = this.generateMapIframe(address);
            
            // 公式サイトボタンのURLとテキストを設定
            if (modalButton && clinicCode) {
                // クリニック名をマッピング用のキーに変換
                let clinicKey = '';
                if (clinicCode.includes('ディオ')) {
                    clinicKey = 'dio';
                } else if (clinicCode.includes('エミナル')) {
                    clinicKey = 'eminal';
                } else if (clinicCode.includes('ウララ')) {
                    clinicKey = 'urara';
                } else if (clinicCode.includes('リエート')) {
                    clinicKey = 'lieto';
                } else if (clinicCode.includes('湘南')) {
                    clinicKey = 'sbc';
                }
                
                const generatedUrl = this.urlHandler.getClinicUrlByNameWithRegionId(clinicKey);
                
                console.log('🔗 地図モーダルURL設定:', {
                    clinicCode,
                    clinicKey,
                    generatedUrl
                });
                
                modalButton.href = generatedUrl;
                
                // ボタンテキストを設定
                const buttonText = document.getElementById('map-modal-button-text');
                if (buttonText) {
                    // クリニック名を取得
                    let clinicBaseName = '';
                    if (clinicCode.includes('ディオ')) {
                        clinicBaseName = 'ディオクリニック';
                    } else if (clinicCode.includes('エミナル')) {
                        clinicBaseName = 'エミナルクリニック';
                    } else if (clinicCode.includes('湘南')) {
                        clinicBaseName = '湘南美容クリニック';
                    } else if (clinicCode.includes('リエート')) {
                        clinicBaseName = 'リエートクリニック';
                    } else if (clinicCode.includes('ウララ')) {
                        clinicBaseName = 'ウララクリニック';
                    } else {
                        clinicBaseName = 'クリニック';
                    }
                    buttonText.textContent = clinicBaseName + 'の公式サイト';
                }
            }
            
            // モーダルを表示
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // スクロールを無効化
            console.log('Modal display set to flex');
        } else {
            console.error('Modal elements missing. Cannot show modal.');
        }
    }
    
    // 地図モーダルを非表示
    hideMapModal() {
        const modal = document.getElementById('map-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // スクロールを再度有効化
        }
    }
}

// 店舗の表示/非表示を切り替える関数（一回限り）
function toggleStores(button) {
    const targetId = button.getAttribute('data-target');
    const targetShops = document.querySelector(targetId);
    const hiddenShops = targetShops.querySelectorAll('.hidden-content');
    
    // 隠されている店舗を表示
    hiddenShops.forEach(shop => {
        shop.classList.remove('hidden');
    });
    
    // ボタンを非表示にする（一度クリックしたら消える）
    button.style.display = 'none';
}

// アプリケーションの起動（DOM読み込み完了後に実行）
// 注: この部分は削除して、下の初期化コードに統合します
/*
document.addEventListener('DOMContentLoaded', () => {
    const app = new RankingApp();
    app.init();
    
    // Smooth scrolling for table of contents links
    // Temporarily disabled for debugging scroll issues
    
    document.querySelectorAll('.toc-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                
                window.scrollTo({
                    top: targetPosition - 80,
                    behavior: 'smooth'
                });
            }
            
            return false;
        });
    });
    */
    
    // Prevent default behavior for all href="#" links
    // This prevents page jumping to top
    // Temporarily disabled for debugging - too broad impact with capture phase
    /*
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href="#"]');
        if (link) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    */
// });

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOMContentLoaded Event Fired ===');
    console.log('DOM ready state:', document.readyState);
    
    const app = new RankingApp();
    window.app = app; // グローバルアクセス用
    
    console.log('=== Initializing RankingApp ===');
    app.init();
    
    // 初期化後にも一度詳細リンクをチェック
    setTimeout(() => {
        console.log('=== Post-init check for detail links ===');
        const allDetailLinks = document.querySelectorAll('a[href*="#clinic"]');
        console.log('Found links with #clinic in href:', allDetailLinks.length);
        
        // #clinicを含むリンクにイベントリスナーを追加
        allDetailLinks.forEach((link, index) => {
            console.log(`#clinic link ${index + 1}:`, {
                text: link.textContent.trim(),
                href: link.getAttribute('href'),
                className: link.className
            });
            
            link.addEventListener('click', (e) => {
                console.log('=== #clinic link clicked ===');
                console.log('Link details:', {
                    text: e.target.textContent,
                    href: e.target.getAttribute('href'),
                    className: e.target.className
                });
                // デフォルトの動作（アンカーリンクへのジャンプ）は維持
            });
        });
        
        // グローバルなクリックイベントリスナーも追加（デバッグ用）
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && (e.target.textContent.includes('詳細を見る') || e.target.textContent.includes('詳細をみる'))) {
                console.log('=== Global click listener detected 詳細を見る/詳細をみる click ===');
                console.log('Clicked element:', {
                    text: e.target.textContent,
                    href: e.target.href,
                    className: e.target.className
                });
            }
        }, true);
    }, 500);
    
    // フッターのページリンクにパラメータ引き継ぎ機能を追加
    document.querySelectorAll('.footer-page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const currentParams = new URLSearchParams(window.location.search);
            if (currentParams.toString()) {
                const url = new URL(this.href, window.location.origin);
                // 全てのパラメータを追加
                for (const [key, value] of currentParams) {
                    url.searchParams.set(key, value);
                }
                window.location.href = url.toString();
            } else {
                window.location.href = this.href;
            }
        });
    });
});