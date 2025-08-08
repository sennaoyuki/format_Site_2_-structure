// クリニックURLをCSVデータベースから動的に取得
function getClinicUrlFromConfig(clinicId, rank = 1) {
    // DataManagerから動的に取得
    if (window.dataManager) {
        const clinicCode = window.dataManager.getClinicCodeById(clinicId);
        if (clinicCode) {
            // CSVデータベースから遷移先URLを取得
            const urlKey = `遷移先URL（${rank}位）`;
            const url = window.dataManager.getClinicText(clinicCode, urlKey, '');
            if (url) {
                return url;
            }
        }
    }
    
    // デフォルトURL（データが見つからない場合）
    return 'https://sss.ac01.l-ad.net/cl/p1a64143O61e70f7/?bid=a6640dkh37648h88&param2=[ADID_PLACEHOLDER]&param3=[GCLID_PLACEHOLDER]';
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

    // クリニックURLを取得（CSVから直接URLを取得し、パラメータを適切に処理）
    getClinicUrlWithRegionId(clinicId, rank = 1) {
        // DataManagerが初期化されているか確認
        if (!window.dataManager) {
            console.error('DataManager not initialized');
            return '#';
        }
        
        // 中間ページ経由でリダイレクトするURLを生成
        const redirectUrl = new URL('./redirect.html', window.location.origin + window.location.pathname);
        const currentParams = new URLSearchParams(window.location.search);
        
        // 中間ページに渡すパラメータを設定
        redirectUrl.searchParams.set('clinic_id', clinicId);
        redirectUrl.searchParams.set('rank', rank);
        
        // region_idを追加
        const regionId = this.getRegionId();
        if (regionId) {
            redirectUrl.searchParams.set('region_id', regionId);
        }
        
        // 現在のURLのパラメータをすべて転送
        for (const [key, value] of currentParams) {
            redirectUrl.searchParams.set(key, value);
        }
        
        return redirectUrl.toString();
    }

    // クリニック名からURLを生成してregion_idパラメータを付与するヘルパー関数（リダイレクトページ経由）
    getClinicUrlByNameWithRegionId(clinicName) {
        // DataManagerから動的にクリニックコードを取得
        let clinicCode = clinicName;
        
        // グローバルのdataManagerを使用
        const dataManager = window.dataManager;
        
        // clinicNameがクリニック名の場合、クリニックコードに変換
        if (dataManager) {
            const clinics = dataManager.clinics || [];
            const clinic = clinics.find(c => c.name === clinicName || c.code === clinicName);
            if (clinic) {
                clinicCode = clinic.code;
            }
        }
        
        // redirect.htmlへのパスを生成
        if (!clinicCode) return '#';
        
        // DataManagerからクリニックIDを取得
        let clinicId = null;
        let rank = 1; // デフォルトは1位
        
        if (dataManager) {
            const clinics = dataManager.clinics || [];
            const clinic = clinics.find(c => c.code === clinicCode);
            if (clinic) {
                clinicId = clinic.id;
                // ランキングから順位を取得（getRankingsByRegionメソッドを直接使用）
                try {
                    if (dataManager.getRankingsByRegion && typeof dataManager.getRankingsByRegion === 'function') {
                        const rankings = dataManager.getRankingsByRegion(this.getRegionId());
                        const rankInfo = rankings.find(r => r.clinicId == clinicId);
                        if (rankInfo) {
                            rank = rankInfo.rank;
                        }
                    } else {
                        // getRankingsByRegionが存在しない場合は、rankingsから直接取得
                        const regionId = this.getRegionId();
                        if (dataManager.rankings && dataManager.rankings[regionId]) {
                            const regionRankings = dataManager.rankings[regionId];
                            // regionRankingsから該当するクリニックの順位を探す
                            const rankingEntries = Object.entries(regionRankings.ranks || {});
                            for (const [position, cId] of rankingEntries) {
                                if (cId == clinicId) {
                                    rank = parseInt(position.replace('no', '')) || 1;
                                    break;
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.log('ランキング取得エラー:', e);
                    rank = 1; // エラー時はデフォルトで1位
                }
            }
        }
        
        if (!clinicId) return '#';
        
        // redirect.htmlへのパスを生成
        const regionId = this.getRegionId();
        let redirectUrl = `./redirect.html?clinic_id=${clinicId}&rank=${rank}`;
        if (regionId) {
            redirectUrl += `&region_id=${regionId}`;
        }
        
        // UTMパラメータなどを追加
        const urlParams = new URLSearchParams(window.location.search);
        const utmCreative = urlParams.get('utm_creative');
        const gclid = urlParams.get('gclid');
        
        if (utmCreative) {
            redirectUrl += `&utm_creative=${encodeURIComponent(utmCreative)}`;
        }
        if (gclid) {
            redirectUrl += `&gclid=${encodeURIComponent(gclid)}`;
        }
        
        return redirectUrl;
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

            // 評価スコアをclinic-texts.jsonから取得
            const clinicCodeForRating = window.dataManager.getClinicCodeById(clinic.id);
            const ratingScore = clinicCodeForRating 
                ? parseFloat(window.dataManager.getClinicText(clinicCodeForRating, '総合評価', '4.5'))
                : 4.5;
            const rating = { 
                score: ratingScore, 
                stars: ratingScore 
            };

            // スターのHTML生成
            let starsHtml = '';
            const fullStars = Math.floor(rating.stars);
            const decimalPart = rating.stars % 1;
            
            // 完全な星を表示
            for (let i = 0; i < fullStars; i++) {
                starsHtml += '<i class="fas fa-star"></i>';
            }
            
            // 小数部分の処理
            if (decimalPart > 0) {
                const percentage = Math.round(decimalPart * 100);
                starsHtml += `<i class="far fa-star" style="background: linear-gradient(90deg, #ffd700 ${percentage}%, transparent ${percentage}%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"></i>`;
            }
            
            // 残りの空の星を表示
            for (let i = Math.ceil(rating.stars); i < 5; i++) {
                starsHtml += '<i class="far fa-star"></i>';
            }

            // バナー画像をclinic-texts.jsonから取得
            const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
            const clinicCodeForImage = window.dataManager.getClinicCodeById(clinic.id);
            let bannerImage = `${imagesPath}/clinics/dio/dio-logo.webp`; // デフォルト
            
            if (clinicCodeForImage) {
                // clinic-texts.jsonからパスを取得
                const imagePath = window.dataManager.getClinicText(clinicCodeForImage, 'クリニックロゴ画像パス', '');
                if (imagePath) {
                    bannerImage = imagePath;
                } else {
                    // フォールバック：コードベースのパス
                    bannerImage = `${imagesPath}/clinics/${clinicCodeForImage}/${clinicCodeForImage}-logo.webp`;
                }
            }

            // 押しメッセージをclinic-texts.jsonから取得
            const clinicCode = window.dataManager.getClinicCodeById(clinic.id);
            const pushMessage = clinicCode 
                ? window.dataManager.getClinicText(clinicCode, 'ランキングプッシュメッセージ', '人気のクリニック')
                : '人気のクリニック';

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
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank || 1)}" target="_blank" rel="noopener">
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
            link.href = this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank || 1);
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
        this.siteTexts = {}; // サイトテキストデータ（旧）
        this.clinicTexts = {}; // クリニック別テキストデータ
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
            const response = await fetch('./data/compiled-data.json');
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
            
            // 共通テキストデータの読み込み
            try {
                const commonTextResponse = await fetch(this.dataPath + 'site-common-texts.json');
                if (commonTextResponse.ok) {
                    this.commonTexts = await commonTextResponse.json();
                    console.log('✅ 共通テキストデータを読み込みました:', this.commonTexts);
                } else {
                    console.warn('⚠️ site-common-texts.json が見つかりません。デフォルトテキストを使用します。');
                    this.commonTexts = {};
                }
            } catch (error) {
                console.warn('⚠️ 共通テキストの読み込みに失敗しました:', error);
                this.commonTexts = {};
            }
            
            // クリニック別テキストデータの読み込み
            try {
                const clinicTextResponse = await fetch(this.dataPath + 'clinic-texts.json');
                if (clinicTextResponse.ok) {
                    this.clinicTexts = await clinicTextResponse.json();
                } else {
                    this.clinicTexts = {};
                }
            } catch (error) {
                console.warn('⚠️ クリニック別テキストの読み込みに失敗しました:', error);
                this.clinicTexts = {};
            }
            
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
    
    // クリニックIDでクリニックを取得
    getClinicById(clinicId) {
        // 文字列と数値の両方に対応
        return this.clinics.find(c => c.id == clinicId);
    }

    // 地域IDで地域を取得
    getRegionById(regionId) {
        return this.regions.find(r => r.id === regionId);
    }

    // クリニックIDでクリニックコードを取得
    getClinicCodeById(clinicId) {
        const clinic = this.clinics.find(c => c.id === String(clinicId));
        return clinic ? clinic.code : null;
    }

    // 地域IDとエレメントIDでサイトテキストを取得（旧）
    getSiteText(regionId, elementId, defaultText = '') {
        if (this.siteTexts && this.siteTexts[regionId] && this.siteTexts[regionId][elementId]) {
            return this.siteTexts[regionId][elementId];
        }
        return defaultText;
    }

    // 共通テキストを取得（プレースホルダー置換機能付き）
    getCommonText(itemKey, defaultText = '', placeholders = {}) {
        let text = defaultText;
        if (this.commonTexts && this.commonTexts[itemKey]) {
            text = this.commonTexts[itemKey];
        }
        
        // プレースホルダーを置換
        Object.keys(placeholders).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            text = text.replace(regex, placeholders[key]);
        });
        
        return text;
    }
    
    // クリニックコードと項目名でクリニック別テキストを取得
    getClinicText(clinicCode, itemKey, defaultText = '') {
        // クリニックコードからクリニック名を取得
        const clinic = this.clinics.find(c => c.code === clinicCode);
        const clinicName = clinic ? clinic.name : null;  // clinic_nameではなくname
        
        if (clinicName && this.clinicTexts && this.clinicTexts[clinicName] && this.clinicTexts[clinicName][itemKey]) {
            return this.clinicTexts[clinicName][itemKey];
        }
        return defaultText;
    }

    // クリニック評価を取得する関数
    getClinicRating(clinicCode, defaultRating = 4.5) {
        const rating = this.getClinicText(clinicCode, '総合評価', defaultRating.toString());
        return parseFloat(rating) || defaultRating;
    }

    // クリニック名を取得する関数
    getClinicName(clinicCode, defaultName = 'クリニック') {
        return this.getClinicText(clinicCode, 'クリニック名', defaultName);
    }

    // decoタグを処理してHTMLに変換する関数
    processDecoTags(text) {
        if (!text || typeof text !== 'string') return text;
        
        // <deco>タグを<span class="deco-text">に変換
        return text.replace(/<deco>(.*?)<\/deco>/g, '<span class="deco-text">$1</span>');
    }

    // クリニックの口コミデータを動的に取得
    getClinicReviews(clinicCode) {
        const reviews = {
            cost: [], // コスパタブの口コミ
            access: [], // 通いやすさタブの口コミ
            staff: [] // スタッフタブの口コミ
        };
        
        // コスパタブの口コミ（3つ）
        for (let i = 1; i <= 3; i++) {
            const title = this.getClinicText(clinicCode, `口コミ${i}タイトル（コスパ）`, '');
            const content = this.getClinicText(clinicCode, `口コミ${i}内容（コスパ）`, '');
            if (title && content) {
                reviews.cost.push({ title, content });
            }
        }
        
        // 通いやすさタブの口コミ（3つ）
        for (let i = 1; i <= 3; i++) {
            const title = this.getClinicText(clinicCode, `口コミ${i}タイトル（通いやすさ）`, '');
            const content = this.getClinicText(clinicCode, `口コミ${i}内容（通いやすさ）`, '');
            if (title && content) {
                reviews.access.push({ title, content });
            }
        }
        
        // スタッフタブの口コミ（3つ）
        for (let i = 1; i <= 3; i++) {
            const title = this.getClinicText(clinicCode, `口コミ${i}タイトル（スタッフ）`, '');
            const content = this.getClinicText(clinicCode, `口コミ${i}内容（スタッフ）`, '');
            if (title && content) {
                reviews.staff.push({ title, content });
            }
        }
        
        return reviews;
    }
    
    // 地域名を取得
    getRegionName(regionId) {
        const region = this.getRegionById(regionId);
        return region ? region.name : '';
    }
    
    // 店舗画像パスを取得
    getStoreImage(clinicCode, storeNumber) {
        // クリニックの設定に基づいて画像パスを動的に決定
        const clinic = this.clinics?.find(c => c.code === clinicCode);
        if (clinic) {
            // クリニック固有の画像設定がある場合はそれを使用
            const customImagePath = this.getClinicText(clinicCode, '店舗画像パス', '');
            if (customImagePath) {
                return customImagePath;
            }
        }
        
        // デフォルトの画像パス生成
        const paddedNumber = String(storeNumber).padStart(3, '0');
        return `/images/clinics/${clinicCode}/${clinicCode}_clinic/clinic_image_${paddedNumber}.webp`;
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
            <iframe src="${mapUrl}" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Google Maps">
            </iframe>
        `;
    }
    
    // 店舗表示のHTML生成（medical-diet001スタイル）
    generateStoresDisplay(clinicId, regionId) {
        // クリニックコードを取得
        const clinicCode = this.getClinicCodeById(clinicId);
        if (!clinicCode) {
            return '<div class="shops"><p class="no-stores">店舗情報がありません</p></div>';
        }
        
        // 簡単な店舗データ（後で拡張可能）
        const storeData = this.getStoreDataForClinic(clinicCode, regionId);
        if (!storeData || storeData.length === 0) {
            return '<div class="shops"><p class="no-stores">この地域には店舗がありません</p></div>';
        }
        
        const visibleStores = storeData.slice(0, 3);
        const hiddenStores = storeData.slice(3);
        const storeId = `shops-${Date.now()}`; // ユニークなIDを生成
        
        let html = `<div class="shops" id="${storeId}">`;
        
        // 最初の3店舗を表示
        visibleStores.forEach((store, index) => {
            html += `
                <div class='shop'>
                    <div class='shop-image'>
                        <img src="${this.getStoreImage(clinicCode, index + 1)}" alt="${store.name}" onerror="this.src='${this.getClinicLogoPath(clinicCode)}'" />
                    </div>
                    <div class='shop-info'>
                        <div class='shop-name'>
                            <a href="./go/${clinicCode}/?region_id=${regionId}" target="_blank" rel="nofollow">${store.name}</a>
                        </div>
                        <div class='shop-address line-clamp'>
                            ${store.address}
                        </div>
                    </div>
                    <a class="shop-btn map-toggle-btn" href="javascript:void(0);" data-store-id="${storeId}-${index}">
                        <i class='fas fa-map-marker-alt btn-icon'></i>
                        地図
                    </a>
                </div>
            `;
        });
        
        // 4店舗以上ある場合は隠しコンテンツとして追加
        hiddenStores.forEach((store, index) => {
            html += `
                <div class='shop hidden-content hidden'>
                    <div class='shop-image'>
                        <img src="${this.getStoreImage(clinicCode, index + 4)}" alt="${store.name}" onerror="this.src='${this.getClinicLogoPath(clinicCode)}'" />
                    </div>
                    <div class='shop-info'>
                        <div class='shop-name'>
                            <a href="./go/${clinicCode}/?region_id=${regionId}" target="_blank" rel="nofollow">${store.name}</a>
                        </div>
                        <div class='shop-address line-clamp'>
                            ${store.address}
                        </div>
                    </div>
                    <a class="shop-btn map-toggle-btn" href="javascript:void(0);" data-store-id="${storeId}-${index + 3}">
                        <i class='fas fa-map-marker-alt btn-icon'></i>
                        地図
                    </a>
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
    
    // クリニックの店舗データを取得（地域別）
    getStoreDataForClinic(clinicCode, regionId) {
        // store_viewから該当地域のデータを取得
        const storeView = this.storeViews.find(sv => sv.regionId === regionId);
        if (!storeView) return [];
        
        // ランキングデータを取得して、表示されているクリニックを特定
        const ranking = this.getRankingByRegionId(regionId);
        if (!ranking) return [];
        
        // クリニックコードからクリニックIDを動的に取得
        const clinic = this.clinics.find(c => c.code === clinicCode);
        if (!clinic) return [];
        
        const clinicId = clinic.id;
        if (!clinicId) return [];
        
        // ランキングに表示されているクリニックIDに対応する店舗IDを取得
        const clinicKey = `clinic_${clinicId}`;
        const storeIdsToShow = storeView.clinicStores[clinicKey] || [];
        
        if (storeIdsToShow.length === 0) return [];
        
        // 店舗IDに基づいて実際の店舗情報を取得
        const allStoreIds = [];
        storeIdsToShow.forEach(storeId => {
            if (storeId.includes('/')) {
                // dio_009/dio_010 のような形式を分割
                const ids = storeId.split('/');
                allStoreIds.push(...ids);
            } else {
                allStoreIds.push(storeId);
            }
        });
        
        const result = this.stores.filter(store => 
            allStoreIds.includes(store.id)
        );
        
        // 結果を適切な形式に変換
        return result.map(store => ({
            name: store.storeName || store.name,
            address: store.address,
            access: store.access || '主要駅より徒歩圏内',
            hours: this.getClinicText(clinicCode, '営業時間', '10:00〜19:00')
        }));
    }
    
    // 地域に応じた住所を生成
    generateAddressForRegion(regionId, defaultAddress = '') {
        const region = this.getRegionById(regionId);
        if (!region) {
            return defaultAddress || '住所情報準備中';
        }
        
        // 地域IDに基づく基本的な住所パターン
        const addressPatterns = {
            '013': '東京都渋谷区宇田川町33-1グランド東京渋谷ビル4階', // 東京
            '056': '東京都渋谷区宇田川町33-1グランド東京渋谷ビル4階', // 東京その他
            '014': '神奈川県横浜市西区高島2-19-12スカイビル16階', // 神奈川
            '015': '埼玉県さいたま市大宮区桜木町2-3-2泰伸ビル2階', // 埼玉
            '012': '千葉県千葉市中央区富士見2-3-1塚本大千葉ビル7階', // 千葉
            '027': '大阪府大阪市北区梅田1-1-3大阪駅前第3ビル18階', // 大阪
            '023': '愛知県名古屋市中村区名駅3-26-19名駅永田ビル7階', // 愛知
            '040': '福岡県福岡市中央区天神2-3-10天神パインクレスト4階' // 福岡
        };
        
        return addressPatterns[regionId] || `${region.name}の主要エリア内`;
    }

    // クリニックロゴパスを取得
    getClinicLogoPath(clinicCode) {
        return this.getClinicText(clinicCode, 'クリニックロゴ画像パス', `/images/clinics/${clinicCode}/${clinicCode}-logo.webp`);
    }

    // クリニック詳細データを動的に取得
    getClinicDetailData(clinicId) {
        const clinic = this.getClinicById(clinicId);
        if (!clinic) return null;
        
        const clinicCode = clinic.code;
        const clinicName = clinic.name;
        
        // clinic-texts.jsonから詳細データを動的に構築
        const detailData = {
            title: this.getClinicText(clinicCode, '詳細タイトル', '医療痩せプログラム'),
            subtitle: this.getClinicText(clinicCode, '詳細サブタイトル', '効果的な痩身治療'),
            link: `${clinicName} ＞`,
            banner: this.getClinicText(clinicCode, '詳細バナー画像パス', `/images/clinics/${clinicCode}/${clinicCode}_detail_bnr.webp`),
            features: (() => {
                const tagsText = this.getClinicText(clinicCode, '特徴タグ', '# 医療ダイエット<br># 医療痩身<br># リバウンド防止');
                // <br>で分割し、#と空白を削除
                return tagsText.split('<br>').map(tag => tag.replace(/^#\s*/, '').trim()).filter(tag => tag);
            })(),
            priceMain: this.getClinicText(clinicCode, '人気プラン', '医療痩身コース'),
            priceValue: (() => {
                // 料金フィールドから月々の金額を抽出
                const ryokin = this.getClinicText(clinicCode, '料金', '月々4,900円');
                const match = ryokin.match(/月々[\d,]+円/);
                return match ? match[0] : '月々4,900円';
            })(),
            priceDetail: {
                '料金': this.getClinicText(clinicCode, '料金', '通常価格24,800円<br>月々4,900円'),
                '注射治療': this.getClinicText(clinicCode, '注射治療', '脂肪溶解注射'),
                '目安期間': this.getClinicText(clinicCode, '目安期間', '約3ヶ月'),
                '営業時間': this.getClinicText(clinicCode, '営業時間', '10:00〜19:00'),
                '対応部位': this.getClinicText(clinicCode, '対応部位', '顔全体／二の腕／お腹'),
                '店舗': this.getClinicText(clinicCode, '店舗', '東京／大阪／福岡'),
                '公式サイト': this.getClinicText(clinicCode, '公式サイトURL', '')
            },
            points: [
                {
                    icon: 'lightbulb',
                    title: this.getClinicText(clinicCode, 'POINT1タイトル', 'ポイント1'),
                    description: this.getClinicText(clinicCode, 'POINT1内容', '詳細説明1')
                },
                {
                    icon: 'phone',
                    title: this.getClinicText(clinicCode, 'POINT2タイトル', 'ポイント2'),
                    description: this.getClinicText(clinicCode, 'POINT2内容', '詳細説明2')
                },
                {
                    icon: 'coin',
                    title: this.getClinicText(clinicCode, 'POINT3タイトル', 'ポイント3'),
                    description: this.getClinicText(clinicCode, 'POINT3内容', '詳細説明3')
                }
            ]
        };
        
        return detailData;
    }

    // 現在選択されているクリニックを判定する関数
    getCurrentClinic() {
        // URLパラメータから判定
        const urlParams = new URLSearchParams(window.location.search);
        const clinicParam = urlParams.get('clinic');
        if (clinicParam) {
            return clinicParam;
        }

        // 地域の1位クリニックをデフォルトとして使用
        const currentRegionId = this.getCurrentRegionId();
        const ranking = this.getRankingByRegionId(currentRegionId);
        if (ranking && ranking.ranks && ranking.ranks.no1) {
            const topClinicId = ranking.ranks.no1;
            // getClinicCodeByIdを使用して動的に取得
            const clinicCode = this.getClinicCodeById(topClinicId);
            if (clinicCode) return clinicCode;
        }
        
        // デフォルトは最初のクリニックのコードを使用
        const firstClinic = this.clinics && this.clinics[0];
        return firstClinic ? firstClinic.code : '';
    }

    // 現在の地域IDを取得
    getCurrentRegionId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('region_id') || '013';
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
        
        if (!ranking) return [];
        
        // 表示する店舗IDのリストを作成
        const storeIdsToShow = [];
        
        // ランキングに表示されているクリニックIDに対応する店舗IDを取得
        
        Object.entries(ranking.ranks).forEach(([position, clinicId]) => {
            // clinic_1〜clinic_5はクリニックID（1〜5）に対応
            const clinicKey = `clinic_${clinicId}`;
            
            if (storeView.clinicStores[clinicKey]) {
                storeIdsToShow.push(...storeView.clinicStores[clinicKey]);
            }
        });
        
        // 店舗IDに基づいて実際の店舗情報を取得
        // アンダースコアで区切られた複数店舗IDを処理
        const allStoreIds = [];
        
        storeIdsToShow.forEach(storeId => {
            if (storeId.includes('/')) {
                // dio_009/dio_010 のような形式を分割
                const ids = storeId.split('/');
                allStoreIds.push(...ids);
            } else {
                allStoreIds.push(storeId);
            }
        });
        
        
        const result = this.stores.filter(store => 
            allStoreIds.includes(store.id)
        );
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
        this.textsInitialized = false;
    }

    async init() {
        try {
            // データマネージャーの初期化
            this.dataManager = new DataManager();
            await this.dataManager.init();
            
            // グローバルアクセス用にwindowオブジェクトに設定
            window.dataManager = this.dataManager;
            window.urlHandler = this.urlHandler;
            

            // 初期地域IDの取得（URLパラメータから取得、なければデフォルト）
            this.currentRegionId = this.urlHandler.getRegionId();
            console.log('🎯 初期地域ID:', this.currentRegionId, 'URL:', window.location.search);

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

        // 地図アコーディオンの開閉制御 - モーダル表示に変更したため無効化
        /*
        document.addEventListener('click', function(e) {
            if (e.target.matches('.map-toggle-btn') || e.target.closest('.map-toggle-btn')) {
                const button = e.target.matches('.map-toggle-btn') ? e.target : e.target.closest('.map-toggle-btn');
                const storeId = button.getAttribute('data-store-id');
                const mapElement = document.getElementById(`map-${storeId}`);
                
                if (mapElement) {
                    if (mapElement.style.display === 'none' || mapElement.style.display === '') {
                        mapElement.style.display = 'block';
                        button.classList.add('active');
                    } else {
                        mapElement.style.display = 'none';
                        button.classList.remove('active');
                    }
                }
                e.preventDefault();
            }
        });
        */

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
        
        // クリニック名はそのまま使用（マッピング不要）
        const storeClinicName = normalizedClinicName;
        
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
        console.log('📍 updatePageContent called with regionId:', regionId);
        try {
            // 地域情報の取得
            const region = this.dataManager.getRegionById(regionId);
            if (!region) {
                console.error('❌ 地域が見つかりません:', regionId);
                throw new Error('指定された地域が見つかりません');
            }
            console.log('✅ 地域情報取得成功:', region);

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

            // サイト全体のテキストを動的に更新
            // 初回はsetTimeoutで少し遅延させてDOMが完全に構築されるのを待つ
            if (!this.textsInitialized) {
                setTimeout(() => {
                    this.updateAllTexts(regionId);
                    this.textsInitialized = true;
                }, 100);
            } else {
                this.updateAllTexts(regionId);
            }

            //ランキングの地域名も更新（共通テキストを使用）
            const rankRegionElement = document.getElementById('rank-region-name');
            if (rankRegionElement) {
                // 共通テキストから後半部分を取得
                const rankingText = this.dataManager.getCommonText('ランキング地域名テキスト', 'で人気の脂肪溶解注射はココ！');
                const fullText = region.name + rankingText;
                rankRegionElement.textContent = fullText;
                
                console.log('🏷️ ランキング地域名更新:', {
                    regionName: region.name,
                    rankingText: rankingText,
                    fullText: fullText,
                    element: rankRegionElement
                });
                
                // 地域名の文字数に応じてleftの位置を調整
                const regionNameLength = region.name.length;
                let leftPosition = '52%'; // デフォルト値
                
                if (regionNameLength === 2) {
                    leftPosition = '52%'; // 2文字（例：東京）
                } else if (regionNameLength === 3) {
                    leftPosition = '51%'; // 3文字（例：神奈川）
                } else if (regionNameLength === 4) {
                    leftPosition = '50%'; // 4文字
                }
                
                rankRegionElement.style.left = leftPosition;
            }
            
            // ランキングバナーのalt属性も動的に更新
            const rankingBannerImages = document.querySelectorAll('.ranking-banner-image');
            if (rankingBannerImages.length > 0) {
                const altText = this.dataManager.getCommonText('ランキングバナーAltテキスト', 'で人気の脂肪溶解注射はココ！');
                rankingBannerImages.forEach(img => {
                    img.alt = region.name + altText;
                });
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
            // const stores = this.dataManager.getStoresByRegionId(regionId);
            // const clinicsWithStores = this.groupStoresByClinics(stores, ranking, allClinics);
            // this.displayManager.updateStoresDisplay(stores, clinicsWithStores);

            // 比較表の更新
            this.updateComparisonTable(allClinics, ranking);
            
            // 詳細コンテンツの更新
            this.updateClinicDetails(allClinics, ranking, regionId);
            
            // 比較表の注釈を更新（1位〜5位）
            setTimeout(() => {
                initializeDisclaimers();
            }, 100);

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

    // サイト全体のテキストを動的に更新（クリニック別対応）
    updateAllTexts(regionId) {
        try {
            console.log('🔄 updateAllTexts called with regionId:', regionId);
            console.log('📊 CommonTexts loaded:', Object.keys(this.dataManager.commonTexts || {}).length);
            console.log('📊 ClinicTexts loaded:', Object.keys(this.dataManager.clinicTexts || {}).length);
            
            const currentClinic = this.dataManager.getCurrentClinic();
            console.log(`🎯 現在のクリニック: ${currentClinic}`);

            // ページタイトルの更新
            const pageTitle = this.dataManager.getClinicText(currentClinic, 'サイトタイトル', '2025年全国版｜脂肪溶解注射比較ランキング');
            document.title = pageTitle;
            console.log(`✅ Page title updated: ${pageTitle}`);

            // メタディスクリプションの更新
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                const metaDescText = this.dataManager.getClinicText(currentClinic, 'メタディスクリプション', 'あなたの地域の優良クリニックを探そう。');
                metaDesc.setAttribute('content', metaDescText);
                console.log(`✅ Meta description updated: ${metaDescText}`);
            }

            // サイトロゴの更新（共通テキスト）
            const siteLogo = document.querySelector('.site-logo');
            if (siteLogo) {
                const logoText = this.dataManager.getCommonText('サイトロゴ', '脂肪溶解注射比較.com');
                siteLogo.textContent = logoText;
                console.log(`✅ Site logo updated: ${logoText}`);
            }

            // MVアピールテキストの更新（共通テキスト）
            const appealText1Element = document.getElementById('mv-left-appeal-text');
            if (appealText1Element) {
                const text1 = this.dataManager.getCommonText('MVアピールテキスト1', 'コスパ');
                appealText1Element.textContent = text1;
                console.log(`✅ MV Appeal Text 1 updated: ${text1}`);
            }

            const appealText2Element = document.getElementById('mv-right-appeal-text');
            if (appealText2Element) {
                const text2 = this.dataManager.getCommonText('MVアピールテキスト2', '通いやすさ');
                appealText2Element.textContent = text2;
                console.log(`✅ MV Appeal Text 2 updated: ${text2}`);
            }

            // SVGテキストの更新（共通テキスト）
            const svgText1Element = document.querySelector('#mv-main-svg-text text');
            if (svgText1Element) {
                const svgText1 = this.dataManager.getCommonText('MVSVGテキスト1', '脂肪溶解注射');
                svgText1Element.textContent = svgText1;
                console.log(`✅ MV SVG Text 1 updated: ${svgText1}`);
            }

            // SVGテキスト2の更新（共通テキスト、ランキング数を動的に計算）
            const svgText2Element = document.querySelector('#mv-appeal1-text text');
            if (svgText2Element) {
                // 現在の地域のランキング数を取得
                const ranking = this.dataManager.getRankingByRegionId(regionId);
                let rankCount = 5; // デフォルト値
                
                if (ranking && ranking.ranks) {
                    // ランキングに含まれるクリニック数を計算（"-"以外のものをカウント）
                    const validRanks = Object.entries(ranking.ranks)
                        .filter(([key, value]) => value !== '-' && value !== null && value !== undefined)
                        .length;
                    if (validRanks > 0) {
                        rankCount = Math.min(validRanks, 5); // 最大5位まで
                    }
                }
                
                // プレースホルダーを使用してテキストを取得
                const svgText2 = this.dataManager.getCommonText('MVSVGテキスト2', 'ランキング', {
                    RANK_COUNT: rankCount
                });
                svgText2Element.textContent = svgText2;
                console.log(`✅ MV SVG Text 2 updated: ${svgText2} (Rank count: ${rankCount})`);
            }

            // ランキングバナーのalt属性更新（共通テキスト）
            const rankingBanner = document.querySelector('.ranking-banner-image');
            if (rankingBanner) {
                const rankingAlt = this.dataManager.getCommonText('ランキングバナーalt', 'で人気の脂肪溶解注射はここ！');
                rankingBanner.setAttribute('alt', rankingAlt);
                console.log(`✅ Ranking banner alt updated: ${rankingAlt}`);
            }

            // 比較表タイトルの更新（共通テキスト）
            const comparisonTitle = document.querySelector('.comparison-title');
            if (comparisonTitle) {
                const titleText = this.dataManager.getCommonText('比較表タイトル', 'で人気の脂肪溶解注射');
                // 地域名を動的に挿入
                const region = this.dataManager.getRegionById(regionId);
                const regionName = region ? region.name : '';
                comparisonTitle.innerHTML = `<span id="comparison-region-name">${regionName}</span>${titleText}`;
                console.log(`✅ Comparison title updated: ${regionName}${titleText}`);
            }

            // 比較表サブタイトルの更新（共通テキスト）
            const comparisonSubtitle = document.querySelector('.comparison-subtitle');
            if (comparisonSubtitle) {
                const subtitleHtml = this.dataManager.getCommonText('比較表サブタイトル', 'クリニックを<span class="pink-text">徹底比較</span>');
                comparisonSubtitle.innerHTML = this.dataManager.processDecoTags(subtitleHtml);
                console.log(`✅ Comparison subtitle updated`);
            }
            
            // 案件詳細バナーのalt属性を更新（共通テキスト）
            const detailsBannerImg = document.querySelector('.details-banner-image');
            if (detailsBannerImg) {
                const detailsBannerAlt = this.dataManager.getCommonText('案件詳細バナーalt', 'コスパ×効果×通いやすさで選ぶ脂肪溶解注射BEST3');
                detailsBannerImg.setAttribute('alt', detailsBannerAlt);
                console.log(`✅ Details banner alt updated: ${detailsBannerAlt}`);
            }
            
            // フッターサイト名の更新（共通テキスト）
            const footerSiteName = document.querySelector('.footer_contents h4 a');
            if (footerSiteName) {
                const footerText = this.dataManager.getCommonText('フッターサイト名', '脂肪溶解注射比較.com');
                footerSiteName.textContent = footerText;
                console.log(`✅ Footer site name updated: ${footerText}`);
            }
            
            // フッターコピーライトの更新（共通テキスト）
            const footerCopyright = document.querySelector('.copyright');
            if (footerCopyright) {
                const copyrightText = this.dataManager.getCommonText('フッターコピーライト', '© 2025 脂肪溶解注射比較.com');
                footerCopyright.textContent = copyrightText;
                console.log(`✅ Footer copyright updated: ${copyrightText}`);
            }
            
            // Tipsセクションの更新（共通テキスト）
            // タブタイトルの更新
            const tabTexts = document.querySelectorAll('.tips-container .tab-text');
            if (tabTexts.length >= 3) {
                tabTexts[0].textContent = this.dataManager.getCommonText('Tipsタブ1タイトル', '脂肪溶解注射の効果');
                tabTexts[1].textContent = this.dataManager.getCommonText('Tipsタブ2タイトル', 'クリニック選び');
                tabTexts[2].textContent = this.dataManager.getCommonText('Tipsタブ3タイトル', '今がおすすめ');
                console.log('✅ Tips tab titles updated');
            }
            
            // Tips内容の更新（タブコンテンツ内のp要素）
            const tabContents = document.querySelectorAll('.tips-container .tab-content');
            if (tabContents.length >= 3) {
                const tips1P = tabContents[0].querySelector('p');
                if (tips1P) {
                    const tips1Content = this.dataManager.getCommonText('Tips1内容', '本気で痩せたいなら脂肪溶解注射が最短！科学的根拠に基づき、脂肪細胞そのものを破壊・減少させる痩身治療です。リバウンドしにくく、部分痩せも可能。自己流ダイエットで失敗続きの方にこそ試してほしい、確実な痩身方法です。');
                    tips1P.innerHTML = this.dataManager.processDecoTags(tips1Content);
                }
                
                const tips2P = tabContents[1].querySelector('p');
                if (tips2P) {
                    const tips2Content = this.dataManager.getCommonText('Tips2内容', 'クリニック選びの失敗が理想の体型実現の失敗につながります。<br>強引な勧誘は危険信号。次の3条件を満たす医院を選びましょう。<br><br>☑️医師が直接診察する<br>☑️施術後のアフターケア<br>☑️料金を明確に説明する');
                    tips2P.innerHTML = this.dataManager.processDecoTags(tips2Content);
                }
                
                const tips3P = tabContents[2].querySelector('p');
                if (tips3P) {
                    const tips3Content = this.dataManager.getCommonText('Tips3内容', '夏本番になると予約が取りにくくなり、料金も高くなりがち。今なら夏直前キャンペーンでお得に始められて、予約もスムーズ！理想の体型で夏を迎えるなら今がラストチャンスです。');
                    tips3P.innerHTML = this.dataManager.processDecoTags(tips3Content);
                }
                console.log('✅ Tips contents updated');
            }

            // 注意事項HTMLの更新（既存の注意事項を置き換える）
            const disclaimerHTML = this.dataManager.getCommonText('注意事項HTML', '');
            if (disclaimerHTML) {
                // 既存の注意事項セクションを探す
                const disclaimerAccordion = document.querySelector('.disclaimer-accordion');
                if (disclaimerAccordion) {
                    // 既存の main-disclaimer を置き換える
                    const existingMainDisclaimer = disclaimerAccordion.querySelector('.main-disclaimer');
                    if (existingMainDisclaimer) {
                        // 注意：JSONからのHTMLが正しい形式でない場合があるので、確認
                        // 現在は既存のHTMLはそのまま使用
                        console.log('✅ 注意事項HTML 確認（現在は既存のHTMLを維持）');
                    }
                }
            }

            // 比較表ヘッダーの更新（食事指導を対応部位に変更）
            const tableHeaders = document.querySelectorAll('.comparison-table th');
            tableHeaders.forEach(th => {
                if (th.textContent.includes('食事指導')) {
                    th.textContent = '対応部位';
                    th.style.display = ''; // 表示する
                    th.classList.remove('th-none');
                    console.log('✅ 比較表ヘッダー「食事指導」を「対応部位」に変更');
                }
            });

        } catch (error) {
            console.error('クリニック別テキストの更新に失敗しました:', error);
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
                // クリニック名はそのまま使用（stores.csvとitems.csvで名前は統一されている）
                const storeClinicName = clinic.name;
                
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
            
            // 実際のデータ設定 - JSONから取得
            const getRatingFromJson = (rank) => {
                const clinic = clinics[rank - 1];
                if (!clinic) return '';
                
                const clinicCode = window.dataManager.getClinicCodeById(clinic.id);
                return clinicCode ? this.dataManager.getClinicRating(clinicCode, 4.5) : '';
            };
            const getAchievementFromJson = (rank) => {
                const clinic = clinics[rank - 1];
                if (!clinic) return '';
                
                const clinicCode = window.dataManager.getClinicCodeById(clinic.id);
                return clinicCode ? this.dataManager.getClinicText(clinicCode, '実績', '') : '';
            };
            const getBenefitFromJson = (rank) => {
                const clinic = clinics[rank - 1];
                if (!clinic) return '';
                
                const clinicCode = window.dataManager.getClinicCodeById(clinic.id);
                return clinicCode ? this.dataManager.getClinicText(clinicCode, '特典', '') : '';
            };
            const getPopularPlanFromJson = (rank) => {
                const clinic = clinics[rank - 1];
                if (!clinic) return '';
                
                const clinicCode = window.dataManager.getClinicCodeById(clinic.id);
                return clinicCode ? this.dataManager.getClinicText(clinicCode, '人気プラン', '') : '';
            };
            // clinic-texts.jsonからデータを取得する関数
            const getClinicDataByRank = (rankNum, itemKey, defaultValue = '') => {
                const clinic = clinics[rankNum - 1];
                if (!clinic) return defaultValue;
                
                const clinicCode = window.dataManager.getClinicCodeById(clinic.id);
                if (!clinicCode) return defaultValue;
                
                return window.dataManager.getClinicText(clinicCode, itemKey, defaultValue);
            };
            
            const rankNum = clinic.rank || index + 1;
            
            // クリニックのロゴ画像パスをclinic-texts.jsonから取得
            const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
            const clinicCode = window.dataManager.getClinicCodeById(clinic.id);
            let logoPath = `${imagesPath}/clinics/dio/dio-logo.webp`; // デフォルト
            
            if (clinicCode) {
                // clinic-texts.jsonからパスを取得
                const imagePath = window.dataManager.getClinicText(clinicCode, 'クリニックロゴ画像パス', '');
                if (imagePath) {
                    logoPath = imagePath;
                } else {
                    // フォールバック：コードベースのパス
                    logoPath = `${imagesPath}/clinics/${clinicCode}/${clinicCode}-logo.webp`;
                }
            }
            
            tr.innerHTML = `
                <td class="ranking-table_td1">
                    <img src="${logoPath}" alt="${clinic.name}" width="80">
                    <a href="#clinic${rankNum}" class="clinic-link">${clinic.name}</a>
                </td>
                <td class="" style="">
                    <span class="ranking_evaluation">${getRatingFromJson(rankNum)}</span><br>
                    <span class="star5_rating" data-rate="${getRatingFromJson(rankNum)}"></span>
                </td>
                <td class="" style="">${getAchievementFromJson(rankNum)}</td>
                <td class="" style="">${getBenefitFromJson(rankNum)}</td>
                <td class="th-none" style="display: none;">${getPopularPlanFromJson(rankNum)}</td>
                <td class="th-none" style="display: none;">${getClinicDataByRank(rankNum, '医療機器', '')}</td>
                <td class="th-none" style="display: none;">${getClinicDataByRank(rankNum, '注射治療', '')}</td>
                <td class="th-none" style="display: none;">${getClinicDataByRank(rankNum, '対応部位', '')}</td>
                <td class="th-none" style="display: none;">${getClinicDataByRank(rankNum, 'モニター割', '')}</td>
                <td class="th-none" style="display: none;">${getClinicDataByRank(rankNum, '返金保証', '')}</td>
                <td>
                    <a class="link_btn" href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank || rankNum)}" target="_blank">公式サイト &gt;</a>
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
                    <div class="rating-cell">${getRatingFromJson(clinic.rank)}</div>
                    <div class="rating-stars">
                        ${'<i class="fas fa-star"></i>'.repeat(Math.floor(getRatingFromJson(clinic.rank)))}
                        ${getRatingFromJson(clinic.rank) % 1 ? '<i class="fas fa-star-half-alt"></i>' : ''}
                    </div>
                </td>
                <td class="achievement-text">${getAchievementFromJson(clinic.rank)}</td>
                <td class="benefit-text">${getBenefitFromJson(clinic.rank)}</td>
                <td>
                    <div class="cta-cell">
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank)}" class="cta-button" target="_blank" rel="noopener">公式サイト</a>
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
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank)}" class="cta-button" target="_blank" rel="noopener">公式サイト</a>
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
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank)}" class="cta-button" target="_blank" rel="noopener">公式サイト</a>
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

            // クリニック詳細データを動的に取得
            // DataManagerから動的にクリニック詳細データを取得
            const data = this.dataManager.getClinicDetailData(clinicId);
            if (!data) {
                console.error(`クリニックID ${clinicId} の詳細データが見つかりません`);
                return; // forEachの中ではcontinueではなくreturnを使用
            }
            data.regionId = regionId;
            
            // バナーがない場合はデフォルトパスを設定
            if (!data.banner) {
                const clinicCode = this.dataManager.getClinicCodeById(clinicId);
                data.banner = `/images/clinics/${clinicCode}/${clinicCode}_detail_bnr.webp`;
            }
            
            // 店舗データを動的に取得（store_view.csvに基づいてフィルタリング）
            const allStores = this.dataManager.getStoresByRegionId(regionId);
            console.log(`🏬 地域 ${regionId} の全店舗:`, allStores.map(s => `${s.id}:${s.clinicName}`));
            
            // クリニック名はそのまま使用
            const storeClinicName = clinic.name;
            
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
                            <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank)}" target="_blank" rel="noopener nofollow">${clinic.name} ＞</a>
                        </div>
                    </div>
                ${(() => {
                    // DataManagerからバナーパスを動的に取得
                    const clinicCode = this.dataManager.getClinicCodeById(clinicId);
                    const correctBanner = data.banner || `/images/clinics/${clinicCode}/${clinicCode}_detail_bnr.webp`;
                    return correctBanner ? `
                    <div class="detail-banner">
                        <img src="${correctBanner}" alt="${clinic.name}キャンペーン">
                    </div>
                    ` : '';
                })()}
                <div class="detail-features">
                    ${data.features.map(feature => `<span class="feature-tag">${feature.startsWith('#') ? feature : '# ' + feature}</span>`).join('')}
                </div>
                
                <!-- 拡張版価格表 -->
                <table class="info-table">
                    ${Object.entries(data.priceDetail).map(([key, value]) => `
                        <tr>
                            <td>${key}</td>
                            <td>${this.dataManager.processDecoTags(value)}</td>
                        </tr>
                    `).join('')}
                </table>
                
                <!-- CTAボタン -->
                <div class="clinic-cta-button-wrapper">
                    <p class="btn btn_second_primary">
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank)}" target="_blank" rel="noopener noreferrer">
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
                                <strong>${this.dataManager.processDecoTags(point.title)}</strong>
                            </div>
                            <div class="ribbon_point_txt">
                                <p style="font-size:14px;">${this.dataManager.processDecoTags(point.description)}</p>
                            </div>
                            `;
                        }).join('')}
                        <div class="ribbon_point_link">
                            【公式】<a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank)}" target="_blank" rel="noopener"><strong>${data.priceDetail['公式サイト'] || '#'}</strong></a>
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
                        ${(() => {
                            // 口コミデータを動的に取得
                            const clinicCode = this.dataManager.getClinicCodeById(clinicId);
                            const reviews = this.dataManager.getClinicReviews(clinicCode);
                            const reviewIcons = [
                                '/images/review_icon/review_icon1.webp',
                                '/images/review_icon/review_icon2.webp',
                                '/images/review_icon/review_icon3.webp',
                                '/images/review_icon/review_icon4.webp',
                                '/images/review_icon/review_icon5.webp',
                                '/images/review_icon/review_icon6.webp',
                                '/images/review_icon/review_icon7.webp',
                                '/images/review_icon/review_icon8.webp',
                                '/images/review_icon/review_icon9.webp'
                            ];
                            
                            let html = '';
                            
                            // コスパタブの口コミ
                            html += '<div class="wrap_long2 active">';
                            reviews.cost.forEach((review, index) => {
                                const iconIndex = (rank + index) % reviewIcons.length;
                                html += `
                                    <div class="review_tab_box_in">
                                        <div class="review_tab_box_img">
                                            <img src="${reviewIcons[iconIndex]}" alt="レビューアイコン">
                                            <span>★★★★★</span>
                                        </div>
                                        <div class="review_tab_box_r">
                                            <div class="review_tab_box_title"><strong>${review.title}</strong></div>
                                            <div class="review_tab_box_txt">
                                                ${review.content}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            });
                            html += '<p style="font-size:8px;text-align:right">※効果には個人差があります<br>※個人の感想です</p>';
                            html += '</div>';
                            
                            // 通いやすさタブの口コミ
                            html += '<div class="wrap_long2 disnon2">';
                            reviews.access.forEach((review, index) => {
                                const iconIndex = (rank + index + 3) % reviewIcons.length;
                                html += `
                                    <div class="review_tab_box_in">
                                        <div class="review_tab_box_img">
                                            <img src="${reviewIcons[iconIndex]}" alt="レビューアイコン">
                                            <span>★★★★★</span>
                                        </div>
                                        <div class="review_tab_box_r">
                                            <div class="review_tab_box_title"><strong>${review.title}</strong></div>
                                            <div class="review_tab_box_txt">
                                                ${review.content}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            });
                            html += '<p style="font-size:8px;text-align:right">※効果には個人差があります<br>※個人の感想です</p>';
                            html += '</div>';
                            
                            // スタッフタブの口コミ
                            html += '<div class="wrap_long2 disnon2">';
                            reviews.staff.forEach((review, index) => {
                                const iconIndex = (rank + index + 6) % reviewIcons.length;
                                html += `
                                    <div class="review_tab_box_in">
                                        <div class="review_tab_box_img">
                                            <img src="${reviewIcons[iconIndex]}" alt="レビューアイコン">
                                            <span>★★★★★</span>
                                        </div>
                                        <div class="review_tab_box_r">
                                            <div class="review_tab_box_title"><strong>${review.title}</strong></div>
                                            <div class="review_tab_box_txt">
                                                ${review.content}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            });
                            html += '<p style="font-size:8px;text-align:right">※効果には個人差があります<br>※個人の感想です</p>';
                            html += '</div>';
                            
                            return html;
                        })()}
                    </section>
                </div>
                
                <!-- 店舗情報 -->
                <div class="brand-section">
                    <h4 class="section-heading">
                        ${clinic.name}の【${this.dataManager.getRegionName(regionId)}】の店舗
                    </h4>
                    ${this.dataManager.generateStoresDisplay(clinicId, regionId)}
                </div>
                
                <!-- キャンペーンセクション -->
                <div class="campaign-section">
                    <div class="campaign-container">
                        ${(() => {
                            // キャンペーン情報を動的に生成
                            const clinicCode = this.dataManager.getClinicCodeById(clinicId);
                            const campaignHeader = this.dataManager.getClinicText(clinicCode, 'キャンペーンヘッダー', 'INFORMATION!');
                            const campaignDescription = this.dataManager.getClinicText(clinicCode, 'INFORMATIONキャンペーンテキスト', '');
                            const campaignMicrocopy = this.dataManager.getClinicText(clinicCode, 'マイクロコピー', '＼月額・総額がリーズナブルなクリニック／');
                            const ctaText = this.dataManager.getClinicText(clinicCode, 'CTAボタンテキスト', `${clinic.name}の公式サイト`);
                            const logoSrc = `/images/clinics/${clinicCode}/${clinicCode}-logo.webp`;
                            const logoAlt = clinic.name;
                            
                            return `
                            <div class="campaign-header">${campaignHeader}</div>
                            <div class="campaign-content">
                                <div class="camp_header3">
                                    <div class="info_logo">
                                        <img src="${logoSrc}" alt="${logoAlt}" onerror="this.onerror=null; this.src='/images/clinics/${clinicCode}/${clinicCode}-logo.jpg';">
                                    </div>
                                    <div class="camp_txt">
                                        ${campaignDescription}
                                    </div>
                                </div>
                                
                                <div class="cv_box_img">
                                    ${campaignMicrocopy}
                                    <p class="btn btn_second_primary" style="margin-top: 10px;">
                                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinicId, clinic.rank || 1)}" target="_blank" rel="noopener">
                                            <span class="bt_s">${ctaText}</span>
                                            <span class="btn-arrow">▶</span>
                                        </a>
                                    </p>
                                </div>
                            </div>
                            `;
                        })()}
                    </div>
            ${(() => {
                // 確認事項があるクリニックのみアコーディオンを表示
                const clinicCode = this.dataManager.getClinicCodeById(clinic.id);
                const disclaimerText = clinicCode ? this.dataManager.getClinicText(clinicCode, 'INFORMATION確認事項', '') : '';
                
                if (disclaimerText && disclaimerText.trim() !== '') {
                    return `
                    <!-- ${clinic.name}の確認事項アコーディオン -->
                    <div class="disclaimer-accordion" style="margin-top: 15px;">
                        <button class="disclaimer-header" onclick="toggleDisclaimer('${clinic.code}-campaign')" style="width: 100%; text-align: left; padding: 8px 12px; background-color: #fafafa; border: 1px solid #f0f0f0; border-radius: 3px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 10px; font-weight: 500; color: #666;">${clinic.name}の確認事項</span>
                            <span id="${clinic.code}-campaign-arrow" style="font-size: 8px; color: #999; transition: transform 0.2s;">▼</span>
                        </button>
                        <div id="${clinic.code}-campaign-content" class="disclaimer-content" style="display: none; padding: 8px 12px; background-color: #fcfcfc; border: 1px solid #f0f0f0; border-top: none; border-radius: 0 0 3px 3px; margin-top: -1px;">
                            <div style="font-size: 9px; color: #777; line-height: 1.4;">
                                ${disclaimerText.split('<br>').map(text => text.trim()).filter(text => text).map(text => `<p>${text}</p>`).join('\n                                ')}
                            </div>
                        </div>
                    </div>
                    `;
                }
                return '';
            })()}
                </div>
            </div>
            `;
            
            detailsList.appendChild(detailItem);
        });
    }

    // 店舗画像のパスを取得するメソッド（複数拡張子対応）
    getStoreImage(clinicName, storeNumber) {
        // 店舗番号を3桁の文字列に変換
        const paddedNumber = String(storeNumber).padStart(3, '0');
        const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
        
        // 最初の拡張子でパスを返す（onerrorでフォールバックされる）
        const storeImagePath = `${imagesPath}/clinics/${clinicName}/${clinicName}_clinic/clinic_image_${paddedNumber}.webp`;
        
        return storeImagePath;
    }

    // 画像フォールバック処理（複数拡張子対応）
    handleImageError(imgElement, clinicName, storeNumber) {
        const paddedNumber = String(storeNumber).padStart(3, '0');
        const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
        const extensions = ['jpg', 'png'];
        
        // 現在の拡張子を取得
        const currentSrc = imgElement.src;
        let currentExtIndex = -1;
        
        if (currentSrc.includes('.webp')) currentExtIndex = -1; // webpから開始
        else if (currentSrc.includes('.jpg')) currentExtIndex = 0;
        else if (currentSrc.includes('.png')) currentExtIndex = 1;
        
        // 次の拡張子を試す
        const nextExtIndex = currentExtIndex + 1;
        if (nextExtIndex < extensions.length) {
            imgElement.src = `${imagesPath}/clinics/${clinicName}/${clinicName}_clinic/clinic_image_${paddedNumber}.${extensions[nextExtIndex]}`;
        } else {
            // 全て失敗した場合、ロゴ画像にフォールバック
            imgElement.src = `${imagesPath}/clinics/${clinicName}/${clinicName}-logo.webp`;
            imgElement.onerror = () => {
                imgElement.src = `${imagesPath}/clinics/${clinicName}/${clinicName}-logo.jpg`;
            };
        }
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
            document.removeEventListener('click', this.mapButtonClickHandler, true);
        }
        
        // 新しいイベントリスナーを作成（モーダル表示）
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
                                // URLからクリニックコードを抽出して動的にクリニック名を取得
                                const urlMatch = href?.match(/\/go\/([^\/]+)\//);
                                if (urlMatch) {
                                    const clinicCode = urlMatch[1];
                                    const clinic = this.dataManager?.clinics?.find(c => c.code === clinicCode);
                                    if (clinic) {
                                        clinicName = clinic.name;
                                    }
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
        document.addEventListener('click', this.mapButtonClickHandler, true);
        
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
            // まずモーダルを表示
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // スクロールを無効化
            console.log('Modal display set to flex');
            
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
            
            // 公式サイトボタンのURLとテキストを設定（エラーが発生してもモーダルは表示される）
            if (modalButton) {
                try {
                // クリニック名からクリニックコードを取得
                let clinicKey = '';
                const clinics = this.dataManager.clinics || [];
                
                // clinicCodeパラメータはクリニック名なので、クリニック名で検索
                const clinic = clinics.find(c => 
                    c.name === clinicCode || 
                    clinicName.includes(c.name) || 
                    c.name === clinicName
                );
                
                if (clinic) {
                    clinicKey = clinic.code;
                } else {
                    // フォールバック：クリニック名から推測
                    if (clinicName.includes('ディオ')) {
                        clinicKey = 'dio';
                    } else if (clinicName.includes('エミナル')) {
                        clinicKey = 'eminal';
                    } else if (clinicName.includes('湘南')) {
                        clinicKey = 'sbc';
                    } else if (clinicName.includes('リエート')) {
                        clinicKey = 'lieto';
                    } else if (clinicName.includes('ウララ')) {
                        clinicKey = 'urara';
                    } else if (clinicName.includes('DS')) {
                        clinicKey = 'dsc';
                    }
                }
                
                // urlHandlerのインスタンスがある場合は使用、なければ直接URLを生成
                let generatedUrl = '#';
                
                try {
                    if (window.urlHandler) {
                        generatedUrl = window.urlHandler.getClinicUrlByNameWithRegionId(clinicKey);
                    }
                } catch (e) {
                    console.error('URL生成エラー:', e);
                }
                
                // URLが生成できなかった場合のフォールバック
                if (!generatedUrl || generatedUrl === '#') {
                    // 直接redirect.htmlへのリンクを生成
                    const regionId = new URLSearchParams(window.location.search).get('region_id') || '013';
                    if (clinic) {
                        generatedUrl = `./redirect.html?clinic_id=${clinic.id}&rank=1&region_id=${regionId}`;
                    }
                }
                
                console.log('🔗 地図モーダルURL設定:', {
                    clinicName,
                    clinicCode,
                    clinicKey,
                    generatedUrl,
                    hasUrlHandler: !!window.urlHandler,
                    hasClinic: !!clinic
                });
                
                // URLが正しく生成されているか確認
                if (generatedUrl && generatedUrl !== '#' && generatedUrl !== '') {
                    modalButton.href = generatedUrl;
                    modalButton.target = '_blank';
                    modalButton.rel = 'noopener';
                    
                    // クリックイベントを削除（通常のリンクとして動作させる）
                    modalButton.onclick = null;
                } else {
                    console.error('❌ 地図モーダルURL生成失敗:', {
                        clinicName,
                        clinicKey,
                        generatedUrl
                    });
                    // URLが生成できない場合は、メインページのクリニック詳細へスクロール
                    modalButton.href = '#';
                    modalButton.onclick = (e) => {
                        e.preventDefault();
                        this.hideMapModal();
                        // クリニック詳細セクションへスクロール
                        const clinicDetail = document.querySelector(`[data-clinic-id="${clinic?.id || '1'}"]`);
                        if (clinicDetail) {
                            clinicDetail.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    };
                }
                
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
                } catch (error) {
                    console.error('Error setting modal button:', error);
                    // エラーが発生してもモーダルは表示されたままにする
                    modalButton.href = '#';
                    modalButton.onclick = (e) => {
                        e.preventDefault();
                        this.hideMapModal();
                    };
                }
            }
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
// 比較表の注釈を動的に生成する関数
function initializeDisclaimers() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent || !window.dataManager) {
        console.log('mainContent or dataManager not found');
        return;
    }

    // 現在選択されている地域IDを取得
    // 方法1: RankingAppのインスタンスから取得（推奨）
    let regionId = window.app?.currentRegionId;
    
    // 方法2: 上記が取得できない場合はURLパラメータから直接取得
    if (!regionId) {
        const urlParams = new URLSearchParams(window.location.search);
        regionId = urlParams.get('region_id');
    }
    
    // デフォルトは全国（013）
    if (!regionId) {
        regionId = '013';
    }
    
    console.log(`📊 initializeDisclaimers - 地域ID: ${regionId}`);
    
    // ランキングデータを取得
    const ranking = window.dataManager.getRankingByRegionId(regionId);
    if (!ranking || !ranking.ranks) {
        console.log(`⚠️ 地域ID ${regionId} のランキングデータが見つかりません`);
        mainContent.innerHTML = ''; // 空にする
        return;
    }
    
    console.log(`📊 ランキングデータ:`, ranking.ranks);

    // 1位〜5位のクリニックを取得
    const topClinics = [];
    for (let i = 1; i <= 5; i++) {
        const clinicId = ranking.ranks[`no${i}`];
        
        // '-' や無効なIDをスキップ
        if (clinicId && clinicId !== '-' && clinicId !== '') {
            const clinic = window.dataManager.getClinicById(clinicId);
            if (clinic) {
                const clinicCode = window.dataManager.getClinicCodeById(clinicId);
                if (clinicCode) {
                    topClinics.push({
                        rank: i,
                        id: clinicId,
                        code: clinicCode,
                        name: clinic.name
                    });
                    console.log(`✅ ${i}位: ${clinic.name} (ID: ${clinicId}, Code: ${clinicCode})`);
                } else {
                    console.log(`⚠️ ${i}位: クリニックコードが見つかりません (ID: ${clinicId})`);
                }
            } else {
                console.log(`⚠️ ${i}位: クリニック情報が見つかりません (ID: ${clinicId})`);
            }
        } else {
            console.log(`⚠️ ${i}位: 無効なクリニックID (${clinicId})`);
        }
    }

    // 有効なクリニックがない場合
    if (topClinics.length === 0) {
        console.log('⚠️ 表示可能なクリニックがありません');
        mainContent.innerHTML = '';
        return;
    }

    // HTMLを生成
    let disclaimerHTML = '';
    let disclaimerCount = 0;
    
    topClinics.forEach(clinic => {
        const disclaimerText = window.dataManager.getClinicText(clinic.code, 'INFORMATION確認事項', '');
        
        // 注意事項がある場合のみ表示
        if (disclaimerText && disclaimerText.trim() !== '') {
            disclaimerCount++;
            disclaimerHTML += `
                <!-- 第2段階: ${clinic.rank}位 ${clinic.name} -->
                <div class="disclaimer-item">
                    <button class="disclaimer-header" onclick="toggleDisclaimer('${clinic.code}')" style="width: 100%; text-align: left; padding: 6px 10px; background-color: #f8f8f8; border: 1px solid #eeeeee; border-radius: 2px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                        <span style="font-size: 9px; font-weight: 400; color: #777;">${clinic.name}</span>
                        <span id="${clinic.code}-arrow" style="font-size: 7px; color: #aaa; transition: transform 0.2s;">▼</span>
                    </button>
                    <div id="${clinic.code}-content" class="disclaimer-content" style="display: none; padding: 6px 10px; background-color: #fefefe; border: 1px solid #eeeeee; border-top: none; border-radius: 0 0 2px 2px; margin-top: -2px;">
                        <div style="font-size: 9px; color: #777; line-height: 1.4;">
                            ${disclaimerText.split('<br>').map(text => text.trim()).filter(text => text).map(text => `<p>${text}</p>`).join('\n                            ')}
                        </div>
                    </div>
                </div>
            `;
            console.log(`📝 ${clinic.rank}位 ${clinic.name} の注意事項を追加`);
        } else {
            console.log(`📝 ${clinic.rank}位 ${clinic.name} には注意事項がありません`);
        }
    });

    // 生成したHTMLを挿入
    mainContent.innerHTML = disclaimerHTML;
    console.log(`✅ 比較表の注釈を動的に生成しました（${disclaimerCount}件の注意事項）`);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOMContentLoaded Event Fired ===');
    console.log('DOM ready state:', document.readyState);
    
    const app = new RankingApp();
    window.app = app; // グローバルアクセス用
    
    console.log('=== Initializing RankingApp ===');
    app.init();
    
    // 比較表の注釈を動的に初期化
    setTimeout(() => {
        initializeDisclaimers();
    }, 100);
    
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