// データ管理クラス
class DataManager {
    constructor() {
        this.regions = [];
        this.clinics = [];
        this.stores = [];
        this.rankings = [];
        this.dataPath = '/Users/hattaryoga/Desktop/kiro_サイト出し分け/data2/';
    }

    async init() {
        try {
            // CSVファイルの読み込み
            await Promise.all([
                this.loadRegions(),
                this.loadClinics(),
                this.loadStores(),
                this.loadRankings()
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

    // 地域IDで店舗を取得
    getStoresByRegionId(regionId) {
        return this.stores.filter(s => s.regionId === regionId);
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
// 実際の環境では、サーバーからデータを取得するように修正が必要です
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}

// ブラウザ環境での動作のため、ダミーデータを使用する実装を追加
DataManager.prototype.loadCsvFile = async function(filename) {
    // 実際の実装では、サーバーからCSVファイルを取得します
    // ここではダミーデータを返します
    
    if (filename === '出しわけSS - region.csv') {
        return [
            { parameter_no: '001', region: '北海道' },
            { parameter_no: '008', region: '茨城' },
            { parameter_no: '009', region: '栃木' },
            { parameter_no: '010', region: '群馬' },
            { parameter_no: '011', region: '埼玉' },
            { parameter_no: '012', region: '千葉' },
            { parameter_no: '013', region: '東京' },
            { parameter_no: '014', region: '神奈川' },
            { parameter_no: '023', region: '愛知' },
            { parameter_no: '027', region: '大阪' },
            { parameter_no: '040', region: '福岡' }
        ];
    }
    
    if (filename === '出しわけSS - items.csv') {
        return [
            { clinic_id: 'C001', clinic_name: '東京美容クリニック', code: 'TBC001' },
            { clinic_id: 'C002', clinic_name: '品川スキンクリニック', code: 'SSC001' },
            { clinic_id: 'C003', clinic_name: '湘南美容外科', code: 'SBC001' },
            { clinic_id: 'C004', clinic_name: 'TCB東京中央美容外科', code: 'TCB001' },
            { clinic_id: 'C005', clinic_name: '聖心美容クリニック', code: 'SHC001' }
        ];
    }
    
    if (filename === '出しわけSS - stores.csv') {
        return [
            { store_id: 'S001', clinic_name: '東京美容クリニック', store_name: '東京美容クリニック新宿院', Zipcode: '160-0023', adress: '東京都新宿区西新宿1-1-1', access: 'JR新宿駅西口徒歩5分' },
            { store_id: 'S002', clinic_name: '東京美容クリニック', store_name: '東京美容クリニック渋谷院', Zipcode: '150-0002', adress: '東京都渋谷区渋谷1-1-1', access: 'JR渋谷駅ハチ公口徒歩3分' },
            { store_id: 'S003', clinic_name: '品川スキンクリニック', store_name: '品川スキンクリニック品川本院', Zipcode: '108-0075', adress: '東京都港区港南2-1-1', access: 'JR品川駅港南口徒歩3分' },
            { store_id: 'S004', clinic_name: '湘南美容外科', store_name: '湘南美容外科新宿本院', Zipcode: '160-0023', adress: '東京都新宿区西新宿6-5-1', access: 'JR新宿駅西口徒歩10分' },
            { store_id: 'S005', clinic_name: 'TCB東京中央美容外科', store_name: 'TCB新宿三丁目院', Zipcode: '160-0022', adress: '東京都新宿区新宿3-1-1', access: '地下鉄新宿三丁目駅直結' },
            { store_id: 'S006', clinic_name: '東京美容クリニック', store_name: '東京美容クリニック大阪梅田院', Zipcode: '530-0001', adress: '大阪府大阪市北区梅田1-1-1', access: 'JR大阪駅徒歩5分' },
            { store_id: 'S007', clinic_name: '湘南美容外科', store_name: '湘南美容外科大阪梅田院', Zipcode: '530-0013', adress: '大阪府大阪市北区茶屋町1-1', access: '阪急梅田駅徒歩3分' }
        ];
    }
    
    if (filename === '出しわけSS - ranking.csv') {
        return [
            { parameter_no: '013', no1: 'C001', no2: 'C003', no3: 'C004', no4: 'C002', no5: 'C005' },
            { parameter_no: '027', no1: 'C003', no2: 'C001', no3: 'C002' },
            { parameter_no: '011', no1: 'C004', no2: 'C001', no3: 'C003' }
        ];
    }
    
    return [];
};