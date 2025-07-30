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
                details: { default: 'design1' }
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
        const url = `/medical-diet002/sections/${sectionName}/${design}/index.html`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load ${sectionName} with design ${design}`);
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
                existingSection.innerHTML = '';
                existingSection.appendChild(sectionContainer);
            } else if (targetElement) {
                targetElement.replaceWith(sectionContainer);
            } else {
                console.error(`Section container not found for ${sectionName}`);
            }
            
            // セクション固有のスクリプトを実行
            this.executeScripts(sectionContainer);
            
            console.log(`Loaded ${sectionName} with design ${design}`);
            
        } catch (error) {
            console.error(`Error loading section ${sectionName}:`, error);
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
            fallbackElement.innerHTML = `<p>セクション ${sectionName} の読み込みに失敗しました。</p>`;
        }
    }
    
    async loadAllSections() {
        const sections = ['header', 'hero', 'ranking', 'tips', 'comparison', 'details'];
        
        // 全セクションを順番に読み込み
        for (const section of sections) {
            await this.loadSection(section);
        }
        
        // 読み込み完了後、mainタグでmainセクションを囲む
        const container = document.querySelector('.container');
        if (container && !container.querySelector('main')) {
            const mainElement = document.createElement('main');
            
            // ranking以降のセクションをmain要素に移動
            const mainSections = ['ranking', 'tips', 'comparison', 'details'];
            mainSections.forEach(sectionName => {
                const sectionElement = container.querySelector(`[data-section="${sectionName}"]`);
                if (sectionElement) {
                    mainElement.appendChild(sectionElement);
                }
            });
            
            container.appendChild(mainElement);
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
        const url = `/medical-diet002/sections/${sectionName}/${design}/index.html`;
        
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