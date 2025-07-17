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
            
            // 3位までに制限
            if (rankNum > 3) return;
            
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

            // バナー画像の設定（プレースホルダー画像）
            const bannerImages = {
                1: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"%3E%3Crect fill="%23fce0ec" width="300" height="150"/%3E%3Ctext x="20" y="30" fill="%23ec4899" font-size="12" font-weight="bold"%3EFREY-A CLINIC%3C/text%3E%3Ctext x="20" y="55" fill="%23333" font-size="10"%3E医療脱毛%3C/text%3E%3Ctext x="20" y="75" fill="%23ec4899" font-size="18" font-weight="bold"%3E5周年記念%3C/text%3E%3Ctext x="20" y="95" fill="%23333" font-size="11"%3E全身%2BVIO%2B顔%3C/text%3E%3Ctext x="20" y="115" fill="%23ec4899" font-size="14" font-weight="bold"%3E¥101,000~%3C/text%3E%3Ctext x="20" y="135" fill="%23666" font-size="9"%3E月額￥1,500~%3C/text%3E%3C/svg%3E',
                2: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"%3E%3Crect fill="%23fff7e6" width="300" height="150"/%3E%3Ctext x="20" y="30" fill="%23f59e0b" font-size="12" font-weight="bold"%3EREGINA CLINIC%3C/text%3E%3Ctext x="20" y="55" fill="%23333" font-size="10"%3E医療脱毛%3C/text%3E%3Ctext x="20" y="80" fill="%23f59e0b" font-size="20" font-weight="bold"%3E¥48,000円%3C/text%3E%3Ctext x="20" y="100" fill="%23666" font-size="9"%3E(5回総額)%3C/text%3E%3Ctext x="20" y="120" fill="%23333" font-size="10"%3E月々¥1,000~%3C/text%3E%3C/svg%3E',
                3: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"%3E%3Crect fill="%23e6f3ff" width="300" height="150"/%3E%3Ctext x="20" y="30" fill="%233b82f6" font-size="12" font-weight="bold"%3ERIZE%3C/text%3E%3Ctext x="20" y="55" fill="%23333" font-size="10"%3E全身%2BVIO%2B顔%3C/text%3E%3Ctext x="20" y="80" fill="%233b82f6" font-size="16" font-weight="bold"%3E月々¥4,800~%3C/text%3E%3Ctext x="20" y="100" fill="%23ec4899" font-size="14" font-weight="bold"%3E+¥500%3C/text%3E%3Ctext x="20" y="120" fill="%23666" font-size="9"%3Eニードル脱毛%3C/text%3E%3C/svg%3E'
            };
            const bannerImage = bannerImages[rankNum] || bannerImages[1];

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
                        <img src="${bannerImage}" alt="${clinic.name}キャンペーンバナー">
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
            
            // 詳細コンテンツの更新
            this.updateClinicDetails(allClinics, ranking);

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
                            <div class="clinic-main-name">${this.getClinicDisplayName(clinic)}</div>
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
                            <div class="clinic-main-name">${this.getClinicDisplayName(clinic)}</div>
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

    // クリニック詳細の更新
    updateClinicDetails(clinics, ranking) {
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
            detailItem.className = 'detail-item';
            detailItem.setAttribute('data-rank', rank);
            detailItem.setAttribute('data-clinic-id', clinicId);

            // ランクに応じたバッジクラス
            let badgeClass = '';
            if (rank === 2) badgeClass = 'silver';
            else if (rank === 3) badgeClass = 'bronze';

            // クリニック詳細データ（拡張版）
            const clinicDetailDataMap = {
                '1': { // DIO
                    title: '肌に優しい脱毛機を採用！',
                    subtitle: '日焼け肌も産毛もスベスベに',
                    link: 'DIO ＞',
                    banner: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"%3E%3Crect fill="%23fce0ec" width="800" height="400"/%3E%3Ctext x="40" y="60" fill="%23ec4899" font-size="24" font-weight="bold"%3EFREY-A CLINIC%3C/text%3E%3Ctext x="40" y="100" fill="%23333" font-size="18"%3E※自由診療%3C/text%3E%3Ctext x="40" y="140" fill="%23ec4899" font-size="32" font-weight="bold"%3Eフレイア開院5周年記念キャンペーン%3C/text%3E%3Ctext x="40" y="180" fill="%23333" font-size="20"%3E全身%2BVIO%2B顔 5回コース%3C/text%3E%3Ctext x="40" y="220" fill="%23ec4899" font-size="36" font-weight="bold"%3E月額 1,500円%3C/text%3E%3Ctext x="350" y="220" fill="%23666" font-size="16"%3E(税込)%3C/text%3E%3Ctext x="40" y="260" fill="%23666" font-size="16"%3E払い 101,000円%3C/text%3E%3Ctext x="40" y="290" fill="%23666" font-size="14"%3E111,100円(税込)/月々1,500円(税込)%3C/text%3E%3Ctext x="40" y="330" fill="%23ec4899" font-size="20" font-weight="bold"%3E学割 5周年記念キャンペーン%3C/text%3E%3Ctext x="40" y="360" fill="%23333" font-size="16"%3E全身%2BVIO%2B顔 5回 月額 1,300円%3C/text%3E%3C/svg%3E',
                    features: ['熱破壊式が蓄熱式の照射方法を選択可◯', '痛みに敏感な方も◯'],
                    priceMain: '全身+VIO+顔 5回コース',
                    priceValue: '月々1,500円',
                    priceDetail: {
                        '料金': '総額111,100円<br>学生：月々1,300円<br>学生：総額94,600円',
                        '脱毛機': 'メディオスターNext PRO<br>メディオスターモノリス',
                        '完了目安期間': '最短1〜1年半程度',
                        '営業時間': '平日12:00〜21:00',
                        'シェービング代': '手の届かない部位無料',
                        '麻酔代': '無料',
                        '店舗': '全国13院',
                        '公式サイト': '<a href="#" class="clinic-link">公式サイトへ ></a>'
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
                            number: '01',
                            title: '痛みが少ない蓄熱式',
                            description: '蓄熱式脱毛機を採用。じんわりと温かく、痛みを最小限に抑えます。'
                        },
                        {
                            number: '02',
                            title: '平日21時まで営業',
                            description: '仕事帰りでも通いやすい。土日も診療しているから予約が取りやすい。'
                        },
                        {
                            number: '03',
                            title: '当日キャンセル無料',
                            description: '急な予定変更でも安心。当日キャンセルでもペナルティなし。'
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
                    clinicInfo: {
                        name: 'DIO 銀座院',
                        address: '東京都中央区銀座5-5-1 マツモトキヨシ銀座5thビル5F',
                        access: '東京メトロ銀座駅B5出口より徒歩2分',
                        tel: '0120-XXX-XXX',
                        hours: '平日 12:00〜21:00 / 土日祝 11:00〜20:00',
                        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="200" y="150" text-anchor="middle" fill="%23666" font-size="18"%3E院内写真%3C/text%3E%3C/svg%3E'
                    }
                },
                '2': { // エミナルクリニック
                    title: '豊富なプランから選べる！',
                    subtitle: '肌質・毛質に合わせた施術',
                    link: 'エミナルクリニック ＞',
                    features: ['最新機器導入', '短時間施術'],
                    priceMain: '全身+VIO',
                    priceValue: '月額1,000円〜',
                    priceDetail: {
                        '料金': '総額98,000円〜',
                        '脱毛機': '最新医療レーザー',
                        '完了目安期間': '最短5ヶ月',
                        '営業時間': '11:00〜21:00',
                        'シェービング代': '背面無料',
                        '麻酔代': '3,000円',
                        '店舗': '全国60院以上',
                        '公式サイト': '<a href="#" class="clinic-link">公式サイトへ ></a>'
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
                            number: '01',
                            title: '最短5ヶ月で完了',
                            description: '1ヶ月に1回通えるから、スピーディーに脱毛完了。'
                        },
                        {
                            number: '02',
                            title: '全国60院以上',
                            description: '引っ越しても安心。全国どこでも通いやすい。'
                        },
                        {
                            number: '03',
                            title: '21時まで営業',
                            description: '仕事や学校帰りでも通いやすい営業時間。'
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
                    clinicInfo: {
                        name: 'エミナルクリニック 新宿院',
                        address: '東京都新宿区西新宿1-4-1 プリンスビル7F',
                        access: 'JR新宿駅西口より徒歩3分',
                        tel: '0120-YYY-YYY',
                        hours: '11:00〜21:00（不定休）',
                        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="200" y="150" text-anchor="middle" fill="%23666" font-size="18"%3E院内写真%3C/text%3E%3C/svg%3E'
                    }
                },
                '3': { // ウララクリニック
                    title: 'リーズナブルな価格設定',
                    subtitle: '学生に人気の医療脱毛',
                    link: 'ウララクリニック ＞',
                    features: ['24回払い無利息', 'キャンセル料無料'],
                    priceMain: '全身+VIO+顔',
                    priceValue: '月々4,800円',
                    priceDetail: {
                        '料金': '総額198,000円',
                        '脱毛機': '3種類の機器を使い分け',
                        '完了目安期間': '最短8ヶ月',
                        '営業時間': '10:00〜20:00',
                        'シェービング代': '無料',
                        '麻酔代': '3,300円',
                        '店舗': '全国26院',
                        '公式サイト': '<a href="#" class="clinic-link">公式サイトへ ></a>'
                    },
                    vioPlans: {
                        vioOnly: {
                            title: 'VIOのみ',
                            price: '81,600円',
                            sessions: '5回',
                            monthly: '月々3,600円'
                        },
                        fullBody: {
                            title: '全身＋VIO',
                            price: '252,000円',
                            sessions: '5回',
                            monthly: '月々4,900円'
                        }
                    },
                    points: [
                        {
                            number: '01',
                            title: '3種類の脱毛機',
                            description: '肌質・毛質に合わせて最適な機器を選択。効果的な脱毛を実現。'
                        },
                        {
                            number: '02',
                            title: 'キャンセル料無料',
                            description: '予約時間の3時間前まで無料でキャンセル可能。'
                        },
                        {
                            number: '03',
                            title: '追加料金なし',
                            description: 'シェービング代、初診料、再診料すべて無料。'
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
                        name: 'ウララクリニック 渋谷院',
                        address: '東京都渋谷区神南1-10-1 神南ビル6F',
                        access: 'JR渋谷駅ハチ公口より徒歩5分',
                        tel: '0120-ZZZ-ZZZ',
                        hours: '10:00〜14:00 / 15:00〜20:00',
                        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="200" y="150" text-anchor="middle" fill="%23666" font-size="18"%3E院内写真%3C/text%3E%3C/svg%3E'
                    }
                },
                '4': { // リエートクリニック
                    title: '最新技術で安心脱毛',
                    subtitle: '個人に合わせたオーダーメイド施術',
                    link: 'リエートクリニック ＞',
                    features: ['痛みの少ない最新機器', '完全個室でプライバシー配慮'],
                    priceMain: '全身+VIO+顔',
                    priceValue: '月々2,800円',
                    priceDetail: {
                        '料金': '総額148,000円',
                        '脱毛機': '最新蓄熱式レーザー',
                        '完了目安期間': '最短6ヶ月',
                        '営業時間': '11:00〜20:00',
                        'シェービング代': '無料',
                        '麻酔代': '無料',
                        '店舗': '全国20院',
                        '公式サイト': '<a href="#" class="clinic-link">公式サイトへ ></a>'
                    },
                    vioPlans: {
                        vioOnly: {
                            title: 'VIOのみ',
                            price: '55,000円',
                            sessions: '5回',
                            monthly: '月々1,800円'
                        },
                        fullBody: {
                            title: '全身＋VIO',
                            price: '148,000円',
                            sessions: '5回',
                            monthly: '月々2,800円'
                        }
                    },
                    points: [
                        {
                            number: '01',
                            title: '完全個室でリラックス',
                            description: 'プライバシーに配慮した完全個室。リラックスして施術を受けられます。'
                        },
                        {
                            number: '02',
                            title: '最新機器で痛み軽減',
                            description: '蓄熱式の最新脱毛機を導入。痛みを最小限に抑えた施術が可能。'
                        },
                        {
                            number: '03',
                            title: 'アフターケア充実',
                            description: '施術後のケアも万全。肌トラブル時も医師が丁寧に対応。'
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
                    }
                }
            };

            // クリニックIDに基づいてデータを取得
            const data = clinicDetailDataMap[clinicId] || clinicDetailDataMap['1'];

            detailItem.innerHTML = `
                <div class="detail-rank">
                    <div class="detail-rank-badge ${badgeClass}">No.${rank}</div>
                    <div class="detail-title">
                        <h3>${data.title}</h3>
                        <p>${data.subtitle}</p>
                    </div>
                    <a href="#" class="detail-cta-link">
                        ${data.link}
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </div>
                ${data.banner ? `
                <div class="detail-banner">
                    <img src="${data.banner}" alt="${this.getClinicDisplayName(clinic)}キャンペーン">
                </div>
                ` : ''}
                <div class="detail-features">
                    ${data.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                </div>
                
                <!-- 拡張版価格表 -->
                <div class="detail-info-table">
                    <table class="info-table">
                        ${Object.entries(data.priceDetail).map(([key, value]) => `
                            <tr>
                                <td>${key}</td>
                                <td>${value}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
                
                <!-- VIOプラン比較 -->
                <div class="vio-plans-section">
                    <h4 class="section-title">VIO脱毛プラン</h4>
                    <div class="vio-plans-container">
                        <div class="vio-plan-card">
                            <h5>${data.vioPlans.vioOnly.title}</h5>
                            <div class="plan-price">${data.vioPlans.vioOnly.price}</div>
                            <div class="plan-sessions">${data.vioPlans.vioOnly.sessions}</div>
                            <div class="plan-monthly">${data.vioPlans.vioOnly.monthly}</div>
                        </div>
                        <div class="vio-plan-card recommended">
                            <div class="recommend-badge">おすすめ</div>
                            <h5>${data.vioPlans.fullBody.title}</h5>
                            <div class="plan-price">${data.vioPlans.fullBody.price}</div>
                            <div class="plan-sessions">${data.vioPlans.fullBody.sessions}</div>
                            <div class="plan-monthly">${data.vioPlans.fullBody.monthly}</div>
                        </div>
                    </div>
                </div>
                
                <!-- クリニックのポイント -->
                <div class="clinic-points-section">
                    <h4 class="section-title">${this.getClinicDisplayName(clinic)}の<span class="pink-text">3つ</span>のポイント</h4>
                    <div class="points-container">
                        ${data.points.map(point => `
                            <div class="point-item">
                                <div class="point-number">${point.number}</div>
                                <div class="point-content">
                                    <h5>${point.title}</h5>
                                    <p>${point.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- 口コミ -->
                <div class="reviews-section">
                    <h4 class="section-title">口コミ・評判</h4>
                    <div class="reviews-container">
                        ${data.reviews.map(review => `
                            <div class="review-item">
                                <div class="review-header">
                                    <div class="review-rating">
                                        ${'<i class="fas fa-star"></i>'.repeat(review.rating)}
                                    </div>
                                    <div class="review-date">${review.date}</div>
                                </div>
                                <p class="review-text">${review.text}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- 店舗情報 -->
                <div class="clinic-info-section">
                    <h4 class="section-title">店舗情報</h4>
                    <div class="clinic-info-container">
                        <div class="clinic-image">
                            <img src="${data.clinicInfo.image}" alt="${data.clinicInfo.name}">
                        </div>
                        <div class="clinic-details">
                            <h5>${data.clinicInfo.name}</h5>
                            <dl>
                                <dt><i class="fas fa-map-marker-alt"></i> 住所</dt>
                                <dd>${data.clinicInfo.address}</dd>
                                <dt><i class="fas fa-train"></i> アクセス</dt>
                                <dd>${data.clinicInfo.access}</dd>
                                <dt><i class="fas fa-phone"></i> 電話番号</dt>
                                <dd>${data.clinicInfo.tel}</dd>
                                <dt><i class="fas fa-clock"></i> 営業時間</dt>
                                <dd>${data.clinicInfo.hours}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
                
                <div class="detail-cta-section">
                    <a href="#" class="detail-cta-button">
                        無料カウンセリング予約
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </div>
            `;

            detailsList.appendChild(detailItem);
        });
    }
}

// アプリケーションの起動（DOM読み込み完了後に実行）
document.addEventListener('DOMContentLoaded', () => {
    const app = new RankingApp();
    app.init();
});