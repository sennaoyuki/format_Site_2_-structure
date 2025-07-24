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

    // クリニックURLにregion_idパラメータを付与するヘルパー関数
    getClinicUrlWithRegionId(clinicId) {
        const baseUrls = {
            '1': 'https://dioclinic.jp/',
            '2': 'https://diet.eminal-clinic.jp/lp/m_bodymake/',
            '3': 'https://uraraclinic.jp/',
            '4': 'https://lietoclinic.com/lpbot/lpbot07kana15',
            '5': 'https://www.s-b-c.net/slimming/'
        };
        
        const baseUrl = baseUrls[clinicId];
        if (!baseUrl) return '#';
        
        const regionId = this.getRegionId();
        const url = new URL(baseUrl);
        url.searchParams.set('region_id', regionId);
        return url.toString();
    }

    // クリニック名からURLを生成してregion_idパラメータを付与するヘルパー関数
    getClinicUrlByNameWithRegionId(clinicName) {
        const baseUrls = {
            'dio': 'https://dioclinic.jp/',
            'eminal': 'https://diet.eminal-clinic.jp/lp/m_bodymake/',
            'urara': 'https://uraraclinic.jp/',
            'lieto': 'https://lietoclinic.com/lpbot/lpbot07kana15',
            'sbc': 'https://www.s-b-c.net/slimming/'
        };
        
        const baseUrl = baseUrls[clinicName];
        if (!baseUrl) return '#';
        
        const regionId = this.getRegionId();
        const url = new URL(baseUrl);
        url.searchParams.set('region_id', regionId);
        return url.toString();
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

    // 地域セレクターを更新し、選択された地域を設定
    updateRegionSelector(regions, selectedRegionId) {
        this.regionSelect.innerHTML = '';
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region.id;
            option.textContent = region.name;
            option.selected = region.id === selectedRegionId;
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
                2: { score: 4.8, stars: 4.8 },
                3: { score: 4.7, stars: 4.7 },
                4: { score: 4.6, stars: 4.6 },
                5: { score: 4.5, stars: 4.5 }
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
            const bannerImages = {
                1: '/images/clinics/dio/dio-logo.jpg',
                2: '/images/clinics/eminal/eminal-logo.jpg',
                3: '/images/clinics/urara/urara-logo.jpg',
                4: '/images/clinics/lieto/lieto-logo.jpg',
                5: '/images/clinics/sbc/sbc-logo.jpg'
            };
            const bannerImage = bannerImages[clinic.id] || '/images/clinics/dio/dio-logo.jpg';

            // 押しメッセージの定義
            const pushMessages = {
                1: "【総合人気No.1】\n2025年のイチ押し！\n業界屈指のコスパ",
                2: "次世代医療！\n成功率94%の実績",
                3: "厚労省承認マシン\n科学的に脂肪を減らす",
                4: "多店舗展開\n笑なる",
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
                        ${clinic.name}
                    </div>
                    <div class="clinic-banner">
                        <img src="${bannerImage}" alt="${rankNum}位バナー">
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
        // brand-section-wrapperを取得
        const brandSectionWrapper = document.querySelector('.brand-section-wrapper');
        if (!brandSectionWrapper) {
            console.error('brand-section-wrapper not found');
            return;
        }
        
        // 店舗リストセクションを完全に削除
        brandSectionWrapper.innerHTML = '';
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
        this.dataPath = './data/';
    }

    async init() {
        try {
            // CSVファイルの読み込み
            await Promise.all([
                this.loadRegions(),
                this.loadClinics(),
                this.loadStores(),
                this.loadRankings(),
                this.loadStoreViews(),
                this.loadCampaigns()
            ]);

            // 店舗と地域の関連付け
            this.associateStoresWithRegions();
        } catch (error) {
            console.error('データの初期化に失敗しました:', error);
            throw error;
        }
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
            name: row.store_name,
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
            
            // 各順位のクリニックIDを設定
            Object.keys(row).forEach(key => {
                if (key.startsWith('no') && row[key]) {
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
        return this.stores.filter(store => 
            storeIdsToShow.includes(store.id)
        );
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

            // 初期地域IDの取得
            this.currentRegionId = this.urlHandler.getRegionId();

            // 地域セレクターの初期化
            const regions = this.dataManager.getAllRegions();
            this.displayManager.updateRegionSelector(regions, this.currentRegionId);

            // イベントリスナーの設定
            this.setupEventListeners();

            // 初期表示の更新
            this.updatePageContent(this.currentRegionId);
        } catch (error) {
            console.error('アプリケーションの初期化に失敗しました:', error);
            this.displayManager.showError('データの読み込みに失敗しました。ページを再読み込みしてください。');
        }
    }

    setupEventListeners() {
        // 地域選択の変更イベント
        this.displayManager.regionSelect.addEventListener('change', (e) => {
            const newRegionId = e.target.value;
            this.changeRegion(newRegionId);
        });

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

        // ブラウザの戻る/進むボタン対応
        window.addEventListener('popstate', () => {
            const regionId = this.urlHandler.getRegionId();
            if (regionId !== this.currentRegionId) {
                this.updatePageContent(regionId);
                this.displayManager.regionSelect.value = regionId;
            }
        });
    }

    changeRegion(regionId) {
        // URLパラメータの更新
        this.urlHandler.updateRegionId(regionId);
        this.currentRegionId = regionId;

        // ページコンテンツの更新
        this.updatePageContent(regionId);
    }

    // クリニック検索処理
    handleClinicSearch(searchTerm) {
        const searchTermLower = searchTerm.toLowerCase().trim();
        
        // フィルター条件を取得
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
            
            // フィルター条件の判定（現時点ではクリニック名のみ）
            // TODO: 実際のクリニックデータに対応部位と店舗数の情報を追加する必要がある
            const specialtyMatch = specialtyFilter === '';
            const hoursMatch = hoursFilter === '';
            
            if (nameMatch && specialtyMatch && hoursMatch) {
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
            if (clinicName.toLowerCase().includes(searchTermLower) || searchTermLower === '') {
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
            if (clinicName.toLowerCase().includes(searchTermLower) || searchTermLower === '') {
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
            const stores = this.dataManager.getStoresByRegionId(regionId);
            const clinicsWithStores = this.groupStoresByClinics(stores, ranking, allClinics);
            this.displayManager.updateStoresDisplay(stores, clinicsWithStores);

            // 比較表の更新
            this.updateComparisonTable(allClinics, ranking);
            
            // 詳細コンテンツの更新
            this.updateClinicDetails(allClinics, ranking, regionId);

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
                // このクリニックに属する店舗をクリニック名でフィルタリング
                const clinicStores = stores.filter(store => 
                    store.clinicName === clinic.name
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

        // ランキング順のクリニックデータを取得
        const rankedClinics = [];
        const sortedRanks = Object.entries(ranking.ranks).sort((a, b) => {
            const numA = parseInt(a[0].replace('no', ''));
            const numB = parseInt(b[0].replace('no', ''));
            return numA - numB;
        });

        sortedRanks.forEach(([position, clinicId]) => {
            const clinic = clinics.find(c => c.id === clinicId);
            if (clinic) {
                rankedClinics.push({
                    ...clinic,
                    rank: parseInt(position.replace('no', ''))
                });
            }
        });

        // 比較表の内容を生成
        this.generateComparisonTable(rankedClinics);
        
        // レビュータブ切り替え機能の設定
        this.setupReviewTabs();
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
            const achievements = {
                1: 'ダイエット成功率99％<br>平均13.7kg減',
                2: 'ダイエット成功率94%',
                3: 'ダイエット成功率94%',
            };
            const benefits = {
                1: '今なら<br>12ヶ月分0円！',
                2: '今なら<br>最大79%OFF！',
                3: '最大80%OFF<br>（モニター割引）',
            };
            const popularPlans = {
                1: '脂肪冷却',
                2: '脂肪冷却',
                3: '脂肪冷却',
            };
            const machines = {
                1: '脂肪冷却<br>医療用EMS<br>医療ハイフ<br>医療ラジオ波',
                2: '脂肪冷却装置<br>医療用EMS<br>医療電磁場装置<br>医療ラジオ波',
                3: '脂肪冷却<br>医療用EMS<br>医療ハイフ',
            };
            const injections = {
                1: '脂肪溶解注射<br>サンサム注射<br>ダイエット点滴<br>GLP-1<br>サクセンダ',
                2: '脂肪溶解注射<br>ダイエット点滴<br>GLP-1<br>オルリスタット<br>ビグアナイド系薬剤',
                3: '脂肪溶解注射<br>ダイエット美容点滴<br>エクソソーム点滴',
            };
            const dietSupport = {
                1: '栄養管理士<br>による指導',
                2: '管理栄養士<br>による指導',
                3: '医師監修のもと<br>管理栄養士の指導',
            };
            const monitorDiscount = {
                1: 'あり<br>75％OFF',
                2: 'あり<br>最大79%OFF',
                3: 'あり<br>最大80%OFF',
            };
            const moneyBack = {
                1: '痩せなかったら返金',
                2: '痩せなかったら返金',
                3: 'あり（※条件付き）',
            };
            
            const rankNum = clinic.rank || index + 1;
            
            // クリニックのロゴ画像パスを設定
            const clinicLogos = {
                'ディオクリニック': '/images/clinics/dio/dio-logo.jpg',
                'DIOクリニック': '/images/clinics/dio/dio-logo.jpg',
                'ウララクリニック': '/images/clinics/urara/urara-logo.jpg',
                'URARAクリニック': '/images/clinics/urara/urara-logo.jpg',
                'リエートクリニック': '/images/clinics/lieto/lieto-logo.jpg',
                'エミナルクリニック': '/images/clinics/eminal/eminal-logo.jpg',
                'SBCクリニック': '/images/clinics/sbc/sbc-logo.jpg',
                '湘南美容クリニック': '/images/clinics/sbc/sbc-logo.jpg'
            };
            const logoPath = clinicLogos[clinic.name] || '/images/clinics/dio/dio-logo.jpg';
            
            tr.innerHTML = `
                <td class="ranking-table_td1">
                    <img src="${logoPath}" alt="${clinic.name}" width="80">
                    <a href="#clinic${rankNum}" class="clinic-link">${clinic.name}</a>
                </td>
                <td class="" style="">
                    <span class="ranking_evaluation">${clinic.rating || '4.8'}</span><br>
                    <span class="star5_rating" data-rate="${clinic.rating || '4.8'}"></span>
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
            const ratings = { 1: 4.9, 2: 4.8, 3: 4.7, 4: 4.7, 5: 4.7 };
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
                        <a href="#clinic${clinic.rank}" class="cta-link">詳細を見る</a>
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
                        <a href="#clinic${clinic.rank}" class="cta-link">詳細を見る</a>
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
                        <a href="#clinic${clinic.rank}" class="cta-link">詳細を見る</a>
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
        const detailsList = document.getElementById('clinic-details-list');
        if (!detailsList) return;

        detailsList.innerHTML = '';

        if (!ranking || Object.keys(ranking.ranks).length === 0) {
            return;
        }

        // ランキング順のクリニックデータを取得（3位まで）
        const sortedRanks = Object.entries(ranking.ranks).sort((a, b) => {
            const numA = parseInt(a[0].replace('no', ''));
            const numB = parseInt(b[0].replace('no', ''));
            return numA - numB;
        }).slice(0, 3);

        sortedRanks.forEach(([position, clinicId]) => {
            const clinic = clinics.find(c => c.id === clinicId);
            if (!clinic) return;

            const rank = parseInt(position.replace('no', ''));
            const detailItem = document.createElement('div');
            detailItem.className = `detail-item ranking_box_inner ranking_box_${rank}`;
            detailItem.setAttribute('data-rank', rank);
            detailItem.setAttribute('data-clinic-id', clinicId);

            // ランクに応じたバッジクラス
            let badgeClass = '';
            if (rank === 2) badgeClass = 'silver';
            else if (rank === 3) badgeClass = 'bronze';

            // クリニック詳細データ（拡張版）
            const clinicDetailDataMap = {
                '1': { // DIO
                    title: '最新医療機器で確実に痩せる！',
                    subtitle: 'リバウンドしにくい体質へ',
                    link: 'DIO ＞',
                    banner: '/images/clinics/dio/dio_detail_bnr.jpg',
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
                        title: 'DIOクリニックの今月のお得な情報',
                        logoSrc: '/images/clinics/dio/dio-logo.jpg',
                        logoAlt: 'DIOクリニック',
                        description: '今なら12ヶ月分が0円！<br>痩せなければ返金保証あり',
                        ctaUrl: 'https://dioclinic.jp/',
                        ctaText: 'DIOクリニックの公式サイト',
                        microcopy: '＼症例数50万件以上の実績で安心／'
                    }
                },
                '2': { // エミナルクリニック
                    title: '次世代医療で理想のボディへ！',
                    subtitle: '成功率94%の高い実績',
                    link: 'エミナルクリニック ＞',
                    banner: '/images/clinics/eminal/eminal_detail_bnr.jpg',
                    features: ['最新医療機器導入', '全額返金保証制度'],
                    priceMain: '医療痩身コース',
                    priceValue: '月々9,780円',
                    priceDetail: {
                        '料金': '通常価格45,591円<br>79%OFF 月々9,780円',
                        '施術機械': '脂肪冷却装置<br>医療用EMS<br>医療電磁場装置<br>医療ラジオ波',
                        '目安期間': '-5〜10kg：約3ヶ月',
                        '営業時間': '平日10:00〜20:00<br>土日祝日10:00〜20:00',
                        '対応部位': '顔全体／二の腕／お腹／お尻／太もも／その他 (全身)',
                        '店舗': '東京 (新宿, 銀座)',
                        '公式サイト': 'https://diet.eminal-clinic.jp/lp/m_bodymake/'
                    },
                    vioPlans: {
                        vioOnly: {
                            title: 'VIOのみ',
                            price: '40,800円',
                            sessions: '5回',
                            monthly: '月々1,000円'
                        },
                        fullBody: {
                            title: '全身＋VIO',
                            price: '98,000円',
                            sessions: '5回',
                            monthly: '月々1,600円'
                        }
                    },
                    points: [
                        {
                            icon: 'lightbulb',
                            title: '専門家チームが徹底サポート！無理な勧誘なしで安心',
                            description: 'エミナルクリニックでは、ダイエット専門医や管理栄養士がサポートし、独自開発の医療痩身プログラムを提供しています。医学的根拠に基づいた治療でリバウンドしにくい体質へ改善を目指します。無理な勧誘は一切なく、初めての方も安心です。'
                        },
                        {
                            icon: 'phone',
                            title: '最新医療マシンをオーダーメイド！短期間で理想のボディへ',
                            description: '医療電磁場装置、脂肪冷却装置、直流EMS、ラジオ波など、最新の医療機器で効率よく脂肪を減少させます。全身にアプローチし、短期間での効果が期待できます。厳しい食事制限や運動が苦手な方にもおすすめです。'
                        },
                        {
                            icon: 'coin',
                            title: '高い成功率と全額返金保証で安心！',
                            description: 'ダイエット成功率94%、リバウンド率6%と高い実績を誇ります。モニター協力で全額返金保証制度もあり、安心して医療ダイエットに挑戦できます。'
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
                    stores: [
                        {
                            name: 'エミナルクリニック 新宿院',
                            address: '東京都新宿区西新宿1-4-1 プリンスビル7F',
                            access: 'JR新宿駅西口より徒歩3分',
                            tel: '0120-YYY-YYY',
                            hours: '11:00〜21:00（不定休）'
                        },
                        {
                            name: 'エミナルクリニック 銀座院',
                            address: '東京都中央区銀座7-5-2 居酒屋ビル4F',
                            access: '東京メトロ銀座駅A2出口より徒歩3分',
                            tel: '0120-YYY-YYY',
                            hours: '11:00〜21:00（不定休）'
                        },
                        {
                            name: 'エミナルクリニック 池袋院',
                            address: '東京都豊島区南池袋3-13-10 ISP第3ビル4F',
                            access: 'JR池袋駅東口より徒歩4分',
                            tel: '0120-YYY-YYY',
                            hours: '11:00〜21:00（不定休）'
                        }
                    ],
                    campaigns: [
                        {
                            title: '全身＋VIO 医療脱毛',
                            subtitle: '5回完了コース',
                            originalPrice: '174,900円',
                            discountPrice: '98,000円',
                            monthlyPrice: '月額1,600円〜',
                            discount: '今だけ価格'
                        }
                    ],
                    campaignInfo: {
                        header: 'INFORMATION!',
                        title: 'エミナルクリニック新春キャンペーン',
                        logoSrc: '/images/clinics/eminal/eminal-logo.jpg',
                        logoAlt: 'エミナルクリニック',
                        description: '【期間限定】<br>全身+VIO脱毛が<br>月額1,000円から始められる！',
                        ctaUrl: 'https://diet.eminal-clinic.jp/lp/m_bodymake/',
                        ctaText: 'エミナル公式はコチラ',
                    }
                },
                '3': { // ウララクリニック
                    title: 'リーズナブルな価格設定',
                    subtitle: '学生に人気の医療痩身',
                    link: 'ウララクリニック ＞',
                    banner: '/images/clinics/urara/urara_detail_bnr.jpg',
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
                        '公式サイト': 'https://diet.eminal-clinic.jp/lp/m_bodymake/'
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
                            rating: 4,
                            date: '2024年1月',
                            text: '追加料金がないから安心。効果も満足しています。'
                        },
                        {
                            rating: 5,
                            date: '2023年11月',
                            text: 'カウンセリングが丁寧で、不安なく始められました。'
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
                        title: 'URARAクリニックの今月のお得な情報',
                        logoSrc: '/images/clinics/urara/urara-logo.jpg',
                        logoAlt: 'URARAクリニック',
                        description: '痩せなければ返金保証<br>さらに脂肪買取制度あり',
                        ctaUrl: 'https://urara-clinic.com/',
                        ctaText: 'URARAクリニックの公式サイト',
                        microcopy: '＼ダイエット成功率94％の実績／'
                    }
                },
                '4': { // リエートクリニック
                    title: '最新技術で安心痩身',
                    subtitle: '個人に合わせたオーダーメイド施術',
                    link: 'リエートクリニック ＞',
                    banner: '/images/clinics/lieto/lieto_detail_bnr.jpg',
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
                        '公式サイト': 'https://lietoclinic.com/'
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
                            text: '個室なので周りを気にせず施術を受けられて良かったです。'
                        },
                        {
                            rating: 4,
                            date: '2023年12月',
                            text: '痛みが少なく、スタッフの対応も丁寧でした。'
                        }
                    ],
                    clinicInfo: {
                        name: 'リエートクリニック 池袋院',
                        address: '東京都豊島区南池袋1-25-1 池袋MYTビル4F',
                        access: 'JR池袋駅東口より徒歩3分',
                        tel: '0120-AAA-AAA',
                        hours: '11:00〜20:00（年中無休）',
                        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="200" y="150" text-anchor="middle" fill="%23666" font-size="18"%3E院内写真%3C/text%3E%3C/svg%3E'
                    },
                    campaignInfo: {
                        header: 'INFORMATION!',
                        title: 'リエートクリニックの今月のお得な情報',
                        logoSrc: '/images/clinics/lieto/lieto-logo.jpg',
                        logoAlt: 'リエートクリニック',
                        description: 'モニター最大80％OFF<br>痩せなければ返金保証あり',
                        ctaUrl: 'https://lietoclinic.com/',
                        ctaText: 'リエートクリニックの公式サイト',
                        microcopy: '＼リバウンドしない率99.8％／'
                    }
                }
            };

            // クリニックIDに基づいてデータを取得し、地域IDを追加
            const data = clinicDetailDataMap[clinicId] || clinicDetailDataMap['1'];
            data.regionId = regionId;
            
            // 5番目のクリニック（湘南美容クリニック）の場合、bannerを追加
            if (clinicId === '5' && !data.banner) {
                data.banner = '/images/clinics/sbc/sbc_detail_bnr.jpg';
            }
            
            // 店舗データを動的に取得（store_view.csvに基づいてフィルタリング）
            const allStores = this.dataManager.getStoresByRegionId(regionId);
            
            // クリニック名のマッピング（stores.csvとitems.csvの名前の違いを解決）
            const clinicNameMap = {
                'ディオクリニック': 'DIO',
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
                ${data.banner ? `
                <div class="detail-banner">
                    <img src="${data.banner}" alt="${this.getClinicDisplayName(clinic)}キャンペーン">
                </div>
                ` : ''}
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
                            【公式】<a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id)}" target="_blank" rel="noopener"><strong>${clinic.id === '1' ? 'https://dioclinic.jp/' : clinic.id === '2' ? 'https://eminal-clinic.jp/' : clinic.id === '3' ? 'https://uraraclinic.jp/' : clinic.id === '4' ? 'https://lietoclinic.com/' : clinic.id === '5' ? 'https://www.s-b-c.net/' : '#'}</strong></a>
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
                                    <img src="/images/review_icon/review_icon4.png" alt="レビューアイコン">
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
                                    <img src="/images/review_icon/review_icon5.png" alt="レビューアイコン">
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
                                    <img src="/images/review_icon/review_icon6.png" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>きつい運動なしで6kg減！</strong></div>
                                    <div class="review_tab_box_txt">
                                        3ヶ月で6kg減でした！(継続中) きつい運動や厳しい食事制限も無い中で、順調に体重減少しているので、良かったです。
                                    </div>
                                </div>
                            </div>
                            <p style="font-size:8px;text-align:right">※個人の感想です</p>
                        </div>

                        <div class="wrap_long2 disnon2">
                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon4.png" alt="レビューアイコン">
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
                                    <img src="/images/review_icon/review_icon5.png" alt="レビューアイコン">
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
                                    <img src="/images/review_icon/review_icon6.png" alt="レビューアイコン">
                                    <span>★★★☆☆</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>運動嫌いでも6キロ減！</strong></div>
                                    <div class="review_tab_box_txt">
                                        食習慣が変わったり運動が嫌いですが3〜4ヶ月で6キロほど体重も落ちました。予約も比較的取りやすく駅からも近いので無理なく通えました。
                                    </div>
                                </div>
                            </div>
                            <p style="font-size:8px;text-align:right">※個人の感想です</p>
                        </div>

                        <div class="wrap_long2 disnon2">
                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon7.png" alt="レビューアイコン">
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
                                    <img src="/images/review_icon/review_icon8.png" alt="レビューアイコン">
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
                                    <img src="/images/review_icon/review_icon9.png" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>専門知識で安心施術！</strong></div>
                                    <div class="review_tab_box_txt">
                                        スタッフさんが明るくて優しかったので不安な施術も安心して受けられました。専門的な知識を教えてくださったり栄養指導もしてくれるので無理なく出来ました。
                                    </div>
                                </div>
                            </div>
                            <p style="font-size:8px;text-align:right">※個人の感想です</p>
                        </div>
                        ` : `
                        <div class="wrap_long2 active">
                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon${rank === 1 ? '1' : rank === 3 ? '7' : rank === 4 ? '10' : '3'}.png" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>ストイックな運動より効果的！</strong></div>
                                    <div class="review_tab_box_txt">
                                        某スポーツジムでストイックに食事管理をしても減らなかった体重が、薬で無理なく減っていきビックリしました。え、あの辛い運動や糖質制限はなんだったんだろう…。
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon${rank === 1 ? '2' : rank === 3 ? '8' : rank === 4 ? '1' : '4'}.png" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>2ヶ月で8キロ減！</strong></div>
                                    <div class="review_tab_box_txt">
                                        なかなかジムなどに通っても減らなくなってしまっていましたが、こちらに通い始めて2ヶ月ぐらいで8キロぐらい減らすことができました！
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon${rank === 1 ? '3' : rank === 3 ? '9' : rank === 4 ? '2' : '5'}.png" alt="レビューアイコン">
                                    <span>★★★★☆</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>周りから痩せたと言われる！</strong></div>
                                    <div class="review_tab_box_txt">
                                        2ヶ月たって、周りの人から痩せたねと言われることが多くなりました！サクセンダのおかげで空腹感をあまり感じずに食事制限することが出来ました！
                                    </div>
                                </div>
                            </div>
                            <p style="font-size:8px;text-align:right">※個人の感想です</p>
                        </div>

                        <div class="wrap_long2 disnon2">
                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon9.png" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>言葉遣いが丁寧！</strong></div>
                                    <div class="review_tab_box_txt">
                                        言葉遣いも、めちゃくちゃ丁寧で、こちらが恐縮してしまうくらい、しっかり教育もされていたので、毎回、気持ち良く通わせて頂きました。ありがとうございました。
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon5.png" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>清潔感があり丁寧な対応</strong></div>
                                    <div class="review_tab_box_txt">
                                        院内は清潔感があって、スタッフはどの方も丁寧で優しいです。距離感は付かず離れずの丁度良い感じでした。
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon6.png" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>栄養士さんが熱心！</strong></div>
                                    <div class="review_tab_box_txt">
                                        受付の方の対応も、とても落ち着いていて且つ優しくて、ほっとします。栄養士さんが糖質の摂り方など、熱心に教えてくださるので、楽しくて勉強になります。
                                    </div>
                                </div>
                            </div>
                            <p style="font-size:8px;text-align:right">※個人の感想です</p>
                        </div>

                        <div class="wrap_long2 disnon2">
                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon7.png" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>人生一度きり！頑張ります</strong></div>
                                    <div class="review_tab_box_txt">
                                        今まで色んなことをしても痩せられなかったので、人生一度きりだと思い通うことを決めました。1ヶ月で、食事制限などが苦手な私でも、−５㌔落ちました！
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon8.png" alt="レビューアイコン">
                                    <span>★★★★★</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>栄養士の指導で結果が出た！</strong></div>
                                    <div class="review_tab_box_txt">
                                        栄養士の先生の指導と最先端の機材を使った施術でしっかりと結果が出ました。無理のない範囲で食事指導もして頂き、停滞したら新しい一手を提案して貰えるので、頑張れます。
                                    </div>
                                </div>
                            </div>

                            <div class="review_tab_box_in">
                                <div class="review_tab_box_img">
                                    <img src="/images/review_icon/review_icon9.png" alt="レビューアイコン">
                                    <span>★★★★☆</span>
                                </div>
                                <div class="review_tab_box_r">
                                    <div class="review_tab_box_title"><strong>1ヶ月半で簡単に体重が落ちた！</strong></div>
                                    <div class="review_tab_box_txt">
                                        約1か月半たち、自分ではどうしても落とさなかった体重が、簡単に落とせてびっくりです！通うたびに変化が出るので、とてもモチベーションが上がります！！
                                    </div>
                                </div>
                            </div>
                            <p style="font-size:8px;text-align:right">※個人の感想です</p>
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

            detailsList.appendChild(detailItem);
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
                        <img src="${this.getStoreImage(clinicName, index + 1)}" alt="${store.name}" onerror="this.src='/images/clinics/${clinicName}/${clinicName}-logo.jpg'" />
                    </div>
                    <div class='shop-info'>
                        <div class='shop-name'>
                            <a href="${this.urlHandler.getClinicUrlByNameWithRegionId(clinicName)}" target="_blank" rel="nofollow">${store.name || `店舗${index + 1}`}</a>
                        </div>
                        <div class='shop-address line-clamp'>
                            ${store.address || '住所情報なし'}
                        </div>
                    </div>
                    <a class="shop-btn" href="javascript:void(0);"><i class='fas fa-map-marker-alt btn-icon'></i>
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
                        <img src="${this.getStoreImage(clinicName, index + 4)}" alt="${store.name}" onerror="this.src='/images/clinics/${clinicName}/${clinicName}-logo.jpg'" />
                    </div>
                    <div class='shop-info'>
                        <div class='shop-name'>
                            <a href="${this.urlHandler.getClinicUrlByNameWithRegionId(clinicName)}" target="_blank" rel="nofollow">${store.name || `店舗${index + 4}`}</a>
                        </div>
                        <div class='shop-address line-clamp'>
                            ${store.address || '住所情報なし'}
                        </div>
                    </div>
                    <a class="shop-btn" href="javascript:void(0);"><i class='fas fa-map-marker-alt btn-icon'></i>
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
                            <a href="${campaignInfo.ctaUrl}" target="_blank" rel="noopener">
                                <span class="bt_s">${campaignInfo.ctaText}</span>
                                <span class="btn-arrow">▶</span>
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    // 店舗画像のパスを取得するメソッド
    getStoreImage(clinicName, storeNumber) {
        // 店舗番号を3桁の文字列に変換
        const paddedNumber = String(storeNumber).padStart(3, '0');
        
        // クリニックごとの画像拡張子を定義
        const imageExtensions = {
            'dio': 'jpg',
            'eminal': 'webp',
            'lieto': 'jpg',
            'sbc': 'jpg',
            'urara': 'jpg'
        };
        
        const extension = imageExtensions[clinicName] || 'jpg';
        const storeImagePath = `/images/clinics/${clinicName}/${clinicName}_clinic/clinic_image_${paddedNumber}.${extension}`;
        
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
    const app = new RankingApp();
    window.app = app; // グローバルアクセス用
    app.init();
    
    // フッターのページリンクにパラメータ引き継ぎ機能を追加
    document.querySelectorAll('.footer-page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const currentParams = new URLSearchParams(window.location.search);
            const regionId = currentParams.get('region_id');
            if (regionId) {
                window.location.href = this.href + '?region_id=' + regionId;
            } else {
                window.location.href = this.href;
            }
        });
    });
});