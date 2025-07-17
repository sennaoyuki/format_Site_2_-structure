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
}

// 表示管理クラス
class DisplayManager {
    constructor() {
        this.regionSelect = document.getElementById('region-select');
        this.selectedRegionName = document.getElementById('selected-region-name');
        this.rankingList = document.getElementById('ranking-list');
        this.storesList = document.getElementById('stores-list');
        this.errorMessage = document.getElementById('error-message');
        this.errorText = document.getElementById('error-text');
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
        this.selectedRegionName.textContent = regionName || '該当店舗なし';
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
                1: { score: 4.3, stars: 4.5 },
                2: { score: 4.0, stars: 4 },
                3: { score: 3.2, stars: 3 }
            };
            const rating = ratings[rankNum] || { score: 3.0, stars: 3 };

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

            // キャンペーンバナーの生成（仮のデータ）
            const banners = {
                1: 'フレイア脱毛 5周年記念キャンペーン',
                2: 'レジーナクリニック 医療脱毛',
                3: '全身+VIO+顔'
            };
            const bannerText = banners[rankNum] || 'キャンペーン実施中';

            // 価格情報の生成（仮のデータ）
            const prices = {
                1: { main: '全身+VIO+顔', detail: '月額1,500円〜', discount: '最大13万円OFF！', note: '記念プラン開始！' },
                2: { main: '全身+VIO', detail: '月額1,000円〜' },
                3: { main: '全身+VIO+顔', detail: '月々4,800円' }
            };
            const price = prices[rankNum] || { main: '要問合せ', detail: '詳細はクリニックへ' };

            rankingItem.innerHTML = `
                <div class="rank-medal ${medalClass}">
                    <span class="medal-text">${medalText}</span>
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
                        <div class="clinic-logo">${clinic.name}</div>
                    </div>
                    <div class="clinic-banner">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect fill='%23${rankNum === 1 ? 'fce7f3' : rankNum === 2 ? 'fbbf24' : 'e0e7ff'}' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23${rankNum === 1 ? 'ec4899' : rankNum === 2 ? 'fff' : '4c1d95'}' font-size='20' font-weight='bold'%3E${bannerText}%3C/text%3E%3C/svg%3E" alt="キャンペーンバナー">
                    </div>
                    <div class="price-info">
                        <div class="price-main">${price.main}</div>
                        <div class="price-details">${price.detail}</div>
                        ${price.discount ? `<div class="price-discount">${price.discount}</div>` : ''}
                        ${price.note ? `<div class="price-note">${price.note}</div>` : ''}
                    </div>
                    <a href="#" class="clinic-cta-button">
                        <span class="cta-text">予約する</span>
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </div>
            `;

            this.rankingList.appendChild(rankingItem);
        });
    }

    updateStoresDisplay(stores, clinicsWithStores) {
        this.storesList.innerHTML = '';

        if (!stores || stores.length === 0) {
            this.storesList.innerHTML = '<div class="empty-state"><p>この地域に店舗はありません</p></div>';
            return;
        }

        // クリニックごとにグループ化された店舗を表示
        if (clinicsWithStores && clinicsWithStores.size > 0) {
            clinicsWithStores.forEach((clinicStores, clinic) => {
                // クリニックグループのコンテナ
                const clinicGroup = document.createElement('div');
                clinicGroup.className = 'clinic-group';

                // クリニック名のヘッダー
                const clinicHeader = document.createElement('h3');
                clinicHeader.className = 'clinic-group-header';
                clinicHeader.textContent = clinic.name;
                clinicGroup.appendChild(clinicHeader);

                // そのクリニックの店舗を表示
                if (clinicStores.length > 0) {
                    clinicStores.forEach(store => {
                        const storeItem = document.createElement('div');
                        storeItem.className = 'store-item';

                        // 郵便番号の重複を修正
                        const zipcode = store.zipcode.replace(/^〒/, '');

                        storeItem.innerHTML = `
                            <div class="store-name">${store.name}</div>
                            <div class="store-details">
                                <p class="store-zipcode">〒${zipcode}</p>
                                <p class="store-address">${store.address}</p>
                                <p class="store-access">アクセス: ${store.access}</p>
                            </div>
                        `;

                        clinicGroup.appendChild(storeItem);
                    });
                } else {
                    // 店舗がない場合の表示
                    const noStoreItem = document.createElement('div');
                    noStoreItem.className = 'empty-state';
                    noStoreItem.innerHTML = '<p>該当店舗なし</p>';
                    clinicGroup.appendChild(noStoreItem);
                }

                this.storesList.appendChild(clinicGroup);
            });
        } else {
            // フォールバック：グループ化できない場合は従来の表示
            stores.forEach(store => {
                const storeItem = document.createElement('div');
                storeItem.className = 'store-item';

                const zipcode = store.zipcode.replace(/^〒/, '');

                storeItem.innerHTML = `
                    <div class="store-name">${store.name}</div>
                    <div class="store-details">
                        <p class="store-zipcode">〒${zipcode}</p>
                        <p class="store-address">${store.address}</p>
                        <p class="store-access">アクセス: ${store.access}</p>
                    </div>
                `;

                this.storesList.appendChild(storeItem);
            });
        }
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
}

// アプリケーションクラス
class RankingApp {
    constructor() {
        this.urlHandler = new UrlParamHandler();
        this.displayManager = new DisplayManager();
        this.dataManager = null;
        this.currentRegionId = null;
    }

    async init() {
        try {
            // データマネージャーの初期化
            this.dataManager = new DataManager();
            await this.dataManager.init();

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

            // ランキングの取得と表示
            const ranking = this.dataManager.getRankingByRegionId(regionId);
            const allClinics = this.dataManager.getAllClinics();
            this.displayManager.updateRankingDisplay(allClinics, ranking);

            // 店舗リストの取得と表示（クリニックごとにグループ化）
            const stores = this.dataManager.getStoresByRegionId(regionId);
            const clinicsWithStores = this.groupStoresByClinics(stores, ranking, allClinics);
            this.displayManager.updateStoresDisplay(stores, clinicsWithStores);

            // 比較表の更新
            this.updateComparisonTable(allClinics, ranking);

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

        // 各タブの内容を生成
        this.generateGeneralTab(rankedClinics);
        this.generateTreatmentTab(rankedClinics);
        this.generateServiceTab(rankedClinics);

        // タブ切り替え機能の設定
        this.setupTabSwitching();
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
                            <div class="clinic-main-name">${clinic.name}</div>
                            <a href="#" class="clinic-sub-name">クリニック</a>
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
                        <a href="#" class="cta-button">公式サイト</a>
                        <a href="#" class="cta-link">詳細を見る</a>
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
                            <div class="clinic-main-name">${clinic.name}</div>
                            <a href="#" class="clinic-sub-name">クリニック</a>
                        </div>
                    </div>
                </td>
                <td>全身＋VIO脱毛</td>
                <td>最新医療レーザー</td>
                <td><i class="fas fa-circle feature-icon"></i></td>
                <td>
                    <div class="cta-cell">
                        <a href="#" class="cta-button">公式サイト</a>
                        <a href="#" class="cta-link">詳細を見る</a>
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
                            <div class="clinic-main-name">${clinic.name}</div>
                            <a href="#" class="clinic-sub-name">クリニック</a>
                        </div>
                    </div>
                </td>
                <td><i class="fas fa-circle feature-icon"></i></td>
                <td>${clinic.rank <= 3 ? '<i class="fas fa-circle feature-icon"></i>' : '<i class="fas fa-triangle feature-icon triangle"></i>'}</td>
                <td>${clinic.rank <= 2 ? '<i class="fas fa-circle feature-icon"></i>' : '-'}</td>
                <td>
                    <div class="cta-cell">
                        <a href="#" class="cta-button">公式サイト</a>
                        <a href="#" class="cta-link">詳細を見る</a>
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
}

// アプリケーションの起動（DOM読み込み完了後に実行）
document.addEventListener('DOMContentLoaded', () => {
    const app = new RankingApp();
    app.init();
});