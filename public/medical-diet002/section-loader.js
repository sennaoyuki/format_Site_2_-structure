// セクション動的読み込みシステム
class SectionLoader {
    constructor() {
        this.config = {
            sections: {
                header: { default: 'design1' },
                hero: { default: 'design1' },
                ranking: { default: 'design1' },
                tips: { default: 'design1' },
                comparison: { default: 'design1' },
                details: { default: 'design1' },
                'medical-columns': { default: 'design1' },
                'first-choice-recommendation': { default: 'design1' },
                footer: { default: 'design1' },
                modals: { default: 'design1' }
            }
        };
        
        // URLパラメータからデザイン設定を読み取る
        this.readDesignParams();
    }
    
    readDesignParams() {
        const params = new URLSearchParams(window.location.search);
        
        // 各セクションのデザインパラメータを確認
        Object.keys(this.config.sections).forEach(section => {
            const designParam = params.get(`${section}_design`);
            if (designParam) {
                this.config.sections[section].current = designParam;
            } else {
                this.config.sections[section].current = this.config.sections[section].default;
            }
        });
    }
    
    async loadSection(sectionName, targetElement) {
        const design = this.config.sections[sectionName].current;
        const url = `./sections/${sectionName}/${design}/index.html`;
        
        try {
            console.log(`Loading section ${sectionName} from ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`HTTP ${response.status} for ${url}`);
                throw new Error(`Failed to load ${sectionName} with design ${design} (HTTP ${response.status})`);
            }
            
            const html = await response.text();
            
            // セクションコンテナを作成
            const sectionContainer = document.createElement('div');
            sectionContainer.className = `section-container section-${sectionName}`;
            sectionContainer.setAttribute('data-section', sectionName);
            sectionContainer.setAttribute('data-design', design);
            sectionContainer.innerHTML = html;
            
            // 既存のコンテンツを置換
            const existingSection = document.getElementById(`${sectionName}-section`);
            if (existingSection) {
                console.log(`Found section container for ${sectionName}, replacing content`);
                // loadingメッセージを削除してコンテンツを追加
                existingSection.classList.remove('section-loading');
                existingSection.innerHTML = html;
                
                // セクション固有のスクリプトを実行
                this.executeScripts(existingSection);
                console.log(`Successfully loaded ${sectionName} with design ${design}`);
            } else {
                console.error(`Section container not found for ${sectionName}`);
            }
            
        } catch (error) {
            console.error(`Error loading section ${sectionName}:`, error);
            console.error(`Failed URL: ${url}`);
            // フォールバックとして元のコンテンツを表示
            this.loadFallback(sectionName);
        }
    }
    
    executeScripts(container) {
        // セクション内のスクリプトタグを見つけて実行
        const scripts = container.getElementsByTagName('script');
        Array.from(scripts).forEach(oldScript => {
            const newScript = document.createElement('script');
            
            // 属性をコピー
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            
            // インラインスクリプトの場合はコンテンツをコピー
            if (!oldScript.src) {
                newScript.textContent = oldScript.textContent;
            }
            
            // 新しいスクリプトに置換
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }
    
    async loadFallback(sectionName) {
        // フォールバック処理
        console.warn(`Loading fallback content for ${sectionName}`);
        const fallbackElement = document.getElementById(`${sectionName}-section`);
        if (fallbackElement) {
            // 読み込み状態を解除
            fallbackElement.classList.remove('section-loading');
            fallbackElement.innerHTML = `<div class="section-error">セクション ${sectionName} の読み込みに失敗しました。</div>`;
        }
    }
    
    async loadAllSections() {
        const sections = ['header', 'hero', 'ranking', 'tips', 'comparison', 'details', 'medical-columns', 'first-choice-recommendation', 'footer', 'modals'];
        
        // 全セクションを並列で読み込み（高速化）
        console.log('Loading sections in parallel:', sections);
        const loadPromises = sections.map(section => this.loadSection(section));
        const results = await Promise.allSettled(loadPromises);
        
        // 読み込み結果をログ出力
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Failed to load section ${sections[index]}:`, result.reason);
            } else {
                console.log(`Successfully loaded section ${sections[index]}`);
            }
        });
        
        // 読み込み完了後、mainタグでmainセクションを囲む
        const container = document.querySelector('.container');
        if (container && !container.querySelector('main')) {
            const mainElement = document.createElement('main');
            
            // ranking以降のセクションをmain要素に移動（footer、modals以外）
            const mainSections = ['ranking', 'tips', 'comparison', 'details', 'medical-columns', 'first-choice-recommendation'];
            mainSections.forEach(sectionName => {
                const sectionElement = document.getElementById(`${sectionName}-section`);
                if (sectionElement) {
                    mainElement.appendChild(sectionElement);
                }
            });
            
            // heroセクションの後にmainを挿入
            const heroSection = document.getElementById('hero-section');
            if (heroSection && heroSection.nextSibling) {
                container.insertBefore(mainElement, heroSection.nextSibling);
            } else {
                container.appendChild(mainElement);
            }
        }
    }
    
    // デザインを切り替える
    switchDesign(sectionName, newDesign) {
        this.config.sections[sectionName].current = newDesign;
        
        // URLパラメータを更新
        const url = new URL(window.location);
        url.searchParams.set(`${sectionName}_design`, newDesign);
        window.history.replaceState({}, '', url);
        
        // セクションをリロード
        this.loadSection(sectionName);
    }
    
    // 全セクションのデザインを一括変更
    switchAllDesigns(designName) {
        Object.keys(this.config.sections).forEach(section => {
            this.switchDesign(section, designName);
        });
    }
}

// iframe版のローダー（オプション）
class IframeSectionLoader extends SectionLoader {
    async loadSection(sectionName, targetElement) {
        const design = this.config.sections[sectionName].current;
        const url = `./sections/${sectionName}/${design}/index.html`;
        
        // iframeを作成
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.className = `section-iframe section-${sectionName}-iframe`;
        iframe.setAttribute('data-section', sectionName);
        iframe.setAttribute('data-design', design);
        iframe.style.width = '100%';
        iframe.style.border = 'none';
        iframe.loading = 'lazy';
        
        // iframeの高さを自動調整
        iframe.onload = function() {
            try {
                const height = iframe.contentWindow.document.body.scrollHeight;
                iframe.style.height = height + 'px';
            } catch (e) {
                console.error('Cannot access iframe content:', e);
            }
        };
        
        // 既存のコンテンツを置換
        const container = document.getElementById(`${sectionName}-section`);
        if (container) {
            container.innerHTML = '';
            container.appendChild(iframe);
        }
        
        console.log(`Loaded ${sectionName} with design ${design} via iframe`);
    }
}

// デフォルトでエクスポート
window.SectionLoader = SectionLoader;
window.IframeSectionLoader = IframeSectionLoader;