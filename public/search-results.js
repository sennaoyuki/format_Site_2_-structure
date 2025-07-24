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
            
            // 店舗データの読み込み
            const storesResponse = await fetch('data/出しわけSS - stores.csv');
            const storesText = await storesResponse.text();
            this.storesData = this.parseCSV(storesText);
            
            // 各クリニックの店舗数を計算
            this.calculateStoreCount();
            
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
        }
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
            clinic.storeCount = storeCountMap[clinic.clinic_name] || 0;
            
            // 店舗がある地域を収集
            clinic.regions = new Set();
            this.storesData.forEach(store => {
                if (store.clinic_name === clinic.clinic_name) {
                    const region = this.getRegionFromAddress(store.adress);
                    if (region) {
                        clinic.regions.add(region);
                    }
                }
            });
            
            // 仮の対応部位データ（実際のデータがない場合のデモ用）
            clinic.bodyParts = this.getBodyPartsForClinic(clinic.clinic_name);
        });
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
        // 仮のデータ（実際のデータがない場合のデモ用）
        const bodyPartsMap = {
            'DIO': ['face', 'upperarm', 'stomach', 'buttocks', 'thigh'],
            'エミナル': ['face', 'stomach', 'thigh'],
            'ファイヤー': ['face', 'upperarm', 'stomach', 'buttocks', 'thigh', 'other'],
            'グロウ': ['face', 'stomach', 'buttocks', 'thigh'],
            'レアビューティー': ['face', 'upperarm', 'stomach', 'thigh'],
            '湘南美容クリニック': ['face', 'upperarm', 'stomach', 'buttocks', 'thigh', 'other'],
            'リエートクリニック': ['face', 'stomach', 'thigh']
        };
        
        return bodyPartsMap[clinicName] || ['face', 'stomach'];
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
        this.filteredResults = this.clinicsData.filter(clinic => {
            // 対応部位フィルター
            if (this.filters.bodyParts.length > 0) {
                const hasBodyPart = this.filters.bodyParts.some(part => 
                    clinic.bodyParts.includes(part)
                );
                if (!hasBodyPart) return false;
            }
            
            // 地域フィルター
            if (this.filters.regions.length > 0) {
                const hasRegion = this.filters.regions.some(region => 
                    clinic.regions.has(region)
                );
                if (!hasRegion) return false;
            }
            
            // 店舗数フィルター
            if (this.filters.storeCount !== 'all') {
                const count = clinic.storeCount;
                switch (this.filters.storeCount) {
                    case 'small':
                        if (count > 5) return false;
                        break;
                    case 'medium':
                        if (count < 6 || count > 10) return false;
                        break;
                    case 'large':
                        if (count < 11 || count > 20) return false;
                        break;
                    case 'xlarge':
                        if (count <= 20) return false;
                        break;
                }
            }
            
            return true;
        });
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
            
            return `
                <div class="result-card">
                    <div class="result-card-header">
                        <img src="images/clinics/${clinic.id}/logo.png" alt="${clinic.clinic_name}" class="clinic-logo" onerror="this.src='images/placeholder-logo.png'">
                        <div class="clinic-info">
                            <h3 class="clinic-name">${clinic.clinic_name}</h3>
                            <p class="clinic-region">${regionsText}</p>
                        </div>
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