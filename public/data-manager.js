// データ管理クラス
class DataManager {
    constructor() {
        this.regions = [];
        this.clinics = [];
        this.stores = [];
        this.rankings = [];
        this.storeViews = [];
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
                this.loadStoreViews()
            ]);

            // 店舗と地域の関連付け
            this.associateStoresWithRegions();
        } catch (error) {
            console.error('データの初期化に失敗しました:', error);
            throw error;
        }
    }

    // CSVファイルを読み込む汎用関数
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

    // CSVパーサー
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

    // 地域IDで店舗を取得（store_viewベース）
    getStoresByRegionId(regionId) {
        // store_viewから該当地域のデータを取得
        const storeView = this.storeViews.find(sv => sv.regionId === regionId);
        if (!storeView) return [];
        
        // ランキングデータを取得して、表示されているクリニックを特定
        const ranking = this.getRankingByRegionId(regionId);
        if (!ranking) return [];
        
        // 表示する店舗IDのリストを作成
        const storeIdsToShow = [];
        
        // ランキングのno1〜no5に対応するclinic_1〜clinic_5の店舗IDを取得
        Object.entries(ranking.ranks).forEach(([position, clinicId]) => {
            const positionNum = parseInt(position.replace('no', ''));
            const clinicKey = `clinic_${positionNum}`;
            
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
}

// ローカル開発用のデータ読み込み代替実装
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}