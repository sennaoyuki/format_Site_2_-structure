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
            const rankingItem = document.createElement('div');
            rankingItem.className = 'ranking-item';

            let rankClass = '';
            if (rankNum === 1) rankClass = 'gold';
            else if (rankNum === 2) rankClass = 'silver';
            else if (rankNum === 3) rankClass = 'bronze';

            rankingItem.innerHTML = `
                <div class="ranking-number ${rankClass}">${rankNum}</div>
                <div class="clinic-info">
                    <div class="clinic-name">${clinic.name}</div>
                    <div class="clinic-code">コード: ${clinic.code}</div>
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

            // ランキングの取得と表示
            const ranking = this.dataManager.getRankingByRegionId(regionId);
            const allClinics = this.dataManager.getAllClinics();
            this.displayManager.updateRankingDisplay(allClinics, ranking);

            // 店舗リストの取得と表示（クリニックごとにグループ化）
            const stores = this.dataManager.getStoresByRegionId(regionId);
            const clinicsWithStores = this.groupStoresByClinics(stores, ranking, allClinics);
            this.displayManager.updateStoresDisplay(stores, clinicsWithStores);

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
}

// アプリケーションの起動（DOM読み込み完了後に実行）
document.addEventListener('DOMContentLoaded', () => {
    const app = new RankingApp();
    app.init();
});