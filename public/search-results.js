// 検索結果ページのJavaScript

class SearchResultsApp {
    constructor() {
        this.clinicsData = [];
        this.storesData = [];
        this.filteredResults = [];
        this.filters = {
            bodyParts: [],
            regions: [],
            storeCount: 'all'
        };
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.applyFiltersFromURL();
        this.setupHamburgerMenu();
    }

    async loadData() {
        try {
            // クリニックデータの読み込み
            const clinicsResponse = await fetch('data/出しわけSS - items.csv');
            const clinicsText = await clinicsResponse.text();
            this.clinicsData = this.parseCSV(clinicsText);
            console.log('クリニックデータ読み込み完了:', this.clinicsData.length, '件');
            
            // 店舗データの読み込み
            const storesResponse = await fetch('data/出しわけSS - stores.csv');
            const storesText = await storesResponse.text();
            this.storesData = this.parseCSV(storesText);
            console.log('店舗データ読み込み完了:', this.storesData.length, '件');
            
            // 各クリニックの店舗数を計算
            this.calculateStoreCount();
            console.log('データ処理完了');
            
            // 初期表示
            this.filteredResults = this.clinicsData;
            this.displayResults();
            
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            // エラー時はダミーデータを使用
            this.useDummyData();
        }
    }
    
    useDummyData() {
        console.log('ダミーデータを使用します');
        // ダミーデータの設定
        this.clinicsData = [
            {
                id: 'dio',
                clinic_name: 'DIO',
                official_url: 'https://dioclinic.jp/',
                storeCount: 22,
                regions: new Set(['hokkaido', 'miyagi', 'tokyo', 'saitama', 'kanagawa', 'chiba', 'aichi', 'kyoto', 'osaka', 'hyogo', 'hiroshima', 'fukuoka']),
                bodyParts: ['face', 'upperarm', 'stomach', 'buttocks', 'thigh']
            },
            {
                id: 'eminal',
                clinic_name: 'エミナルクリニック',
                official_url: 'https://eminal-clinic.jp/',
                storeCount: 15,
                regions: new Set(['tokyo', 'osaka', 'fukuoka']),
                bodyParts: ['face', 'stomach', 'thigh']
            },
            {
                id: 'fire',
                clinic_name: 'ファイヤークリニック',
                official_url: 'https://www.fire-method.com/',
                storeCount: 8,
                regions: new Set(['tokyo', 'osaka']),
                bodyParts: ['face', 'upperarm', 'stomach', 'buttocks', 'thigh', 'other']
            }
        ];
        
        this.filteredResults = this.clinicsData;
        this.displayResults();
    }

    parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index] ? values[index].trim() : '';
            });
            data.push(row);
        }
        
        return data;
    }

    calculateStoreCount() {
        // 各クリニックの店舗数を計算
        const storeCountMap = {};
        this.storesData.forEach(store => {
            const clinicName = store.clinic_name;
            if (!storeCountMap[clinicName]) {
                storeCountMap[clinicName] = 0;
            }
            storeCountMap[clinicName]++;
        });
        
        // クリニックデータに店舗数を追加
        this.clinicsData.forEach(clinic => {
            // clinic_nameを正しく設定
            const clinicName = clinic.clinic_name || 'Unknown';
            clinic.storeCount = storeCountMap[clinicName] || 0;
            
            // IDを設定（codeフィールドがあればそれを使用）
            clinic.id = clinic.code || clinic.clinic_id || clinicName.toLowerCase();
            
            // 公式URLを設定（仮のURL）
            clinic.official_url = this.getOfficialUrl(clinic.id);
            
            // 店舗がある地域を収集
            clinic.regions = new Set();
            this.storesData.forEach(store => {
                if (store.clinic_name === clinicName) {
                    const region = this.getRegionFromAddress(store.adress);
                    if (region) {
                        clinic.regions.add(region);
                    }
                }
            });
            
            // 仮の対応部位データ（実際のデータがない場合のデモ用）
            clinic.bodyParts = this.getBodyPartsForClinic(clinicName);
            
        });
    }
    
    getOfficialUrl(clinicId) {
        const urlMap = {
            'dio': 'https://dioclinic.jp/',
            'eminal': 'https://eminal-clinic.jp/',
            'urara': 'https://urara-clinic.jp/',
            'lieto': 'https://lieto-clinic.jp/',
            'sbc': 'https://www.s-b-c.net/'
        };
        return urlMap[clinicId] || '#';
    }

    getRegionFromAddress(address) {
        const regionMap = {
            '北海道': 'hokkaido',
            '宮城': 'miyagi',
            '東京': 'tokyo',
            '埼玉': 'saitama',
            '神奈川': 'kanagawa',
            '千葉': 'chiba',
            '愛知': 'aichi',
            '京都': 'kyoto',
            '大阪': 'osaka',
            '兵庫': 'hyogo',
            '広島': 'hiroshima',
            '福岡': 'fukuoka'
        };
        
        for (const [key, value] of Object.entries(regionMap)) {
            if (address.includes(key)) {
                return value;
            }
        }
        return null;
    }

    getBodyPartsForClinic(clinicName) {
        // 各クリニックの実際の対応部位情報（ウェブ調査結果より）
        const bodyPartsMap = {
            'DIO': ['face', 'upperarm', 'stomach', 'buttocks', 'thigh', 'other'],
            'ディオクリニック': ['face', 'upperarm', 'stomach', 'buttocks', 'thigh', 'other'],
            'エミナルクリニック': ['stomach', 'thigh', 'upperarm', 'other'], // 医療ハイフ、EMS、脂肪冷却で全身対応
            'ウララクリニック': ['face', 'upperarm', 'stomach', 'buttocks', 'thigh', 'other'], // 脂肪冷却、脂肪溶解注射で全身対応
            'リエートクリニック': ['face', 'upperarm', 'stomach', 'buttocks', 'thigh', 'other'], // 医療HIFU、脂肪冷却、脂肪溶解注射で全身対応
            '湘南美容クリニック': ['face', 'upperarm', 'stomach', 'buttocks', 'thigh', 'other'] // 脂肪溶解注射で全身対応
        };
        
        return bodyPartsMap[clinicName] || ['stomach', 'thigh']; // デフォルトは腹部と太もも
    }

    setupEventListeners() {
        // フィルターのイベントリスナー
        document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateFilters());
        });
        
        document.querySelectorAll('.filter-radio').forEach(radio => {
            radio.addEventListener('change', () => this.updateFilters());
        });
        
        // ボタンのイベントリスナー
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.applyFilters();
        });
        
        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    setupHamburgerMenu() {
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const sidebarMenu = document.getElementById('sidebar-menu');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const closeSidebar = document.getElementById('close-sidebar');
        
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', () => {
                hamburgerMenu.classList.toggle('active');
                sidebarMenu.classList.toggle('active');
                sidebarOverlay.classList.toggle('active');
            });
        }
        
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                hamburgerMenu.classList.remove('active');
                sidebarMenu.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                hamburgerMenu.classList.remove('active');
                sidebarMenu.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }
    }

    updateFilters() {
        // 対応部位フィルター
        this.filters.bodyParts = Array.from(document.querySelectorAll('input[name="body-parts"]:checked'))
            .map(checkbox => checkbox.value);
        
        // 地域フィルター
        this.filters.regions = Array.from(document.querySelectorAll('input[name="regions"]:checked'))
            .map(checkbox => checkbox.value);
        
        // 店舗数フィルター
        this.filters.storeCount = document.querySelector('input[name="store-count"]:checked').value;
    }

    applyFilters() {
        this.updateFilters();
        this.filterResults();
        this.updateURL();
        this.displayResults();
    }

    clearFilters() {
        // チェックボックスをクリア
        document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // ラジオボタンをリセット
        document.querySelector('input[name="store-count"][value="all"]').checked = true;
        
        // フィルターをリセット
        this.filters = {
            bodyParts: [],
            regions: [],
            storeCount: 'all'
        };
        
        this.filterResults();
        this.updateURL();
        this.displayResults();
    }

    filterResults() {
        console.log('フィルター適用前のデータ数:', this.clinicsData.length);
        console.log('適用するフィルター:', {
            bodyParts: this.filters.bodyParts,
            regions: this.filters.regions,
            storeCount: this.filters.storeCount
        });
        
        this.filteredResults = this.clinicsData.filter(clinic => {
            // 対応部位フィルター
            if (this.filters.bodyParts.length > 0) {
                const hasBodyPart = this.filters.bodyParts.some(part => 
                    clinic.bodyParts && clinic.bodyParts.includes(part)
                );
                if (!hasBodyPart) {
                    console.log(`${clinic.clinic_name}: 対応部位でフィルタリング`);
                    return false;
                }
            }
            
            // 地域フィルター
            if (this.filters.regions.length > 0) {
                const hasRegion = this.filters.regions.some(region => 
                    clinic.regions && clinic.regions.has(region)
                );
                if (!hasRegion) {
                    console.log(`${clinic.clinic_name}: 地域でフィルタリング`);
                    return false;
                }
            }
            
            // 店舗数フィルター
            if (this.filters.storeCount !== 'all') {
                const count = clinic.storeCount || 0;
                let passFilter = true;
                switch (this.filters.storeCount) {
                    case 'small':
                        passFilter = count <= 5;
                        break;
                    case 'medium':
                        passFilter = count >= 6 && count <= 10;
                        break;
                    case 'large':
                        passFilter = count >= 11 && count <= 20;
                        break;
                    case 'xlarge':
                        passFilter = count > 20;
                        break;
                }
                if (!passFilter) {
                    console.log(`${clinic.clinic_name}: 店舗数でフィルタリング (${count}店舗)`);
                    return false;
                }
            }
            
            return true;
        });
        
        console.log('フィルター適用後のデータ数:', this.filteredResults.length);
    }

    displayResults() {
        const resultsGrid = document.getElementById('results-grid');
        const resultsCount = document.getElementById('results-count');
        const noResults = document.getElementById('no-results');
        
        // 検索結果件数を表示
        resultsCount.textContent = `${this.filteredResults.length}件のクリニックが見つかりました`;
        
        if (this.filteredResults.length === 0) {
            resultsGrid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }
        
        resultsGrid.style.display = 'grid';
        noResults.style.display = 'none';
        
        // 結果を表示
        resultsGrid.innerHTML = this.filteredResults.map(clinic => {
            const bodyPartsText = this.getBodyPartsText(clinic.bodyParts);
            const regionsText = Array.from(clinic.regions).map(r => this.getRegionText(r)).join('、');
            const clinicFeatures = this.getClinicFeatures(clinic.clinic_name);
            const logoColor = this.getClinicLogoColor(clinic.clinic_name);
            
            return `
                <div class="result-card">
                    <div class="result-card-header">
                        <div class="clinic-logo-placeholder" style="width: 80px; height: 80px; background: ${logoColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 24px;">${clinic.clinic_name.substring(0, 2)}</div>
                        <div class="clinic-info">
                            <h3 class="clinic-name">${clinic.clinic_name}</h3>
                            <p class="clinic-region">${regionsText || '全国'}</p>
                        </div>
                    </div>
                    <div class="result-card-features">
                        <p class="clinic-features">${clinicFeatures}</p>
                    </div>
                    <div class="result-card-details">
                        <div class="detail-row">
                            <span class="detail-label">対応部位</span>
                            <span class="detail-value">${bodyPartsText}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">店舗数</span>
                            <span class="detail-value">${clinic.storeCount}店舗</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">主な施術</span>
                            <span class="detail-value">${this.getMainTreatments(clinic.clinic_name)}</span>
                        </div>
                    </div>
                    <div class="result-card-actions">
                        <a href="index.html#${clinic.id}" class="detail-link">詳細を見る</a>
                        <a href="${clinic.official_url}" class="official-link" target="_blank" rel="noopener">公式サイト</a>
                    </div>
                </div>
            `;
        }).join('');
        
        // 検索条件のサマリーを更新
        this.updateSearchSummary();
    }
    
    getClinicFeatures(clinicName) {
        const features = {
            'ディオクリニック': '419万通りのメニューから選べるオーダーメイド医療ダイエット',
            'エミナルクリニック': '注射が苦手な方も安心！医療機器メインの痩身プログラム',
            'ウララクリニック': '次世代医療テクノロジーで健康的に美しく痩せる',
            'リエートクリニック': '非侵襲的な施術でダウンタイムなし！即日常生活に戻れます',
            '湘南美容クリニック': '豊富な脂肪溶解注射メニューで理想のボディデザインを実現'
        };
        
        return features[clinicName] || '医療ダイエット専門クリニック';
    }
    
    getClinicLogoColor(clinicName) {
        const colors = {
            'ディオクリニック': '#FF6B35',
            'エミナルクリニック': '#E91E63',
            'ウララクリニック': '#9C27B0',
            'リエートクリニック': '#3F51B5',
            '湘南美容クリニック': '#00BCD4'
        };
        
        return colors[clinicName] || '#757575';
    }
    
    getMainTreatments(clinicName) {
        const treatments = {
            'ディオクリニック': '脂肪冷却・医療HIFU',
            'エミナルクリニック': '医療ハイフ・医療EMS・脂肪冷却',
            'ウララクリニック': '脂肪冷却・脂肪溶解注射',
            'リエートクリニック': '脂肪冷却・医療HIFU・StimSure',
            '湘南美容クリニック': '脂肪溶解注射・小顔注射'
        };
        
        return treatments[clinicName] || '医療ダイエット';
    }

    getBodyPartsText(bodyParts) {
        const partsMap = {
            'face': '顔全体',
            'upperarm': '二の腕',
            'stomach': 'お腹',
            'buttocks': 'お尻',
            'thigh': '太もも',
            'other': 'その他'
        };
        
        return bodyParts.map(part => partsMap[part] || part).join('、');
    }

    getRegionText(region) {
        const regionMap = {
            'hokkaido': '北海道',
            'miyagi': '宮城',
            'tokyo': '東京',
            'saitama': '埼玉',
            'kanagawa': '神奈川',
            'chiba': '千葉',
            'aichi': '愛知',
            'kyoto': '京都',
            'osaka': '大阪',
            'hyogo': '兵庫',
            'hiroshima': '広島',
            'fukuoka': '福岡'
        };
        
        return regionMap[region] || region;
    }

    updateSearchSummary() {
        const summary = document.getElementById('search-summary');
        const conditions = [];
        
        if (this.filters.bodyParts.length > 0) {
            const parts = this.filters.bodyParts.map(p => this.getBodyPartsText([p])).join('、');
            conditions.push(`対応部位: ${parts}`);
        }
        
        if (this.filters.regions.length > 0) {
            const regions = this.filters.regions.map(r => this.getRegionText(r)).join('、');
            conditions.push(`地域: ${regions}`);
        }
        
        if (this.filters.storeCount !== 'all') {
            const countText = {
                'small': '0〜5店舗',
                'medium': '6〜10店舗',
                'large': '10〜20店舗',
                'xlarge': '21店舗以上'
            };
            conditions.push(`店舗数: ${countText[this.filters.storeCount]}`);
        }
        
        summary.textContent = conditions.length > 0 
            ? `検索条件: ${conditions.join(' / ')}` 
            : 'すべてのクリニックを表示';
    }

    updateURL() {
        const params = new URLSearchParams();
        
        if (this.filters.bodyParts.length > 0) {
            params.set('bodyParts', this.filters.bodyParts.join(','));
        }
        
        if (this.filters.regions.length > 0) {
            params.set('regions', this.filters.regions.join(','));
        }
        
        if (this.filters.storeCount !== 'all') {
            params.set('storeCount', this.filters.storeCount);
        }
        
        const newURL = params.toString() 
            ? `${window.location.pathname}?${params.toString()}` 
            : window.location.pathname;
            
        window.history.replaceState(null, '', newURL);
    }

    applyFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        // URLパラメータから対応部位を設定
        const bodyParts = params.get('bodyParts');
        if (bodyParts) {
            bodyParts.split(',').forEach(part => {
                const checkbox = document.querySelector(`input[name="body-parts"][value="${part}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        // URLパラメータから地域を設定
        const regions = params.get('regions');
        if (regions) {
            regions.split(',').forEach(region => {
                const checkbox = document.querySelector(`input[name="regions"][value="${region}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        // URLパラメータから店舗数を設定
        const storeCount = params.get('storeCount');
        if (storeCount) {
            const radio = document.querySelector(`input[name="store-count"][value="${storeCount}"]`);
            if (radio) radio.checked = true;
        }
        
        // フィルターを適用
        this.applyFilters();
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new SearchResultsApp();
});