// シンプルなCASEカルーセル JavaScript - 軽量版

class SimpleCaseCarousel {
    constructor(container) {
        this.container = container;
        this.carousel = container.querySelector('.case-carousel-container');
        this.slides = container.querySelectorAll('.case-slide');
        this.dots = [];
        this.currentIndex = 0;
        
        // デバッグ用
        console.log('SimpleCaseCarousel initializing:', {
            container: this.container,
            slides: this.slides.length,
            carousel: this.carousel
        });
        
        if (!this.carousel || this.slides.length === 0) {
            console.error('SimpleCaseCarousel: Missing required elements');
            return;
        }
        
        this.init();
    }
    
    init() {
        this.createDots();
        this.createNavigation();
        this.setupEventListeners();
        this.updateActiveStates();
    }
    
    createDots() {
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'case-dots';
        // スタイルを直接指定して中央揃えを強制
        dotsContainer.style.display = 'flex';
        dotsContainer.style.justifyContent = 'center';
        dotsContainer.style.gap = '8px';
        dotsContainer.style.marginTop = '15px';
        dotsContainer.style.padding = '0 20px';
        
        this.slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'case-dot';
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dots.push(dot);
            dotsContainer.appendChild(dot);
        });
        
        this.container.appendChild(dotsContainer);
    }
    
    createNavigation() {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'case-nav case-nav-prev';
        prevBtn.innerHTML = '←';
        prevBtn.addEventListener('click', () => this.prevSlide());
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'case-nav case-nav-next';
        nextBtn.innerHTML = '→';
        nextBtn.addEventListener('click', () => this.nextSlide());
        
        this.container.appendChild(prevBtn);
        this.container.appendChild(nextBtn);
    }
    
    setupEventListeners() {
        // スクロール位置の監視
        let scrollTimeout;
        this.carousel.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateCurrentIndex();
            }, 100);
        });
        
        // タッチスワイプのスムーズ化
        let startX = 0;
        let scrollLeft = 0;
        
        this.carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].pageX - this.carousel.offsetLeft;
            scrollLeft = this.carousel.scrollLeft;
        });
        
        this.carousel.addEventListener('touchmove', (e) => {
            if (!startX) return;
            const x = e.touches[0].pageX - this.carousel.offsetLeft;
            const walk = (x - startX) * 2;
            this.carousel.scrollLeft = scrollLeft - walk;
        });
        
        this.carousel.addEventListener('touchend', () => {
            startX = 0;
            // 最寄りのスライドにスナップ
            setTimeout(() => this.snapToNearestSlide(), 100);
        });
    }
    
    updateCurrentIndex() {
        const scrollLeft = this.carousel.scrollLeft;
        const slideWidth = this.carousel.clientWidth;
        this.currentIndex = Math.round(scrollLeft / slideWidth);
        this.updateActiveStates();
    }
    
    updateActiveStates() {
        // ドットの更新
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }
    
    goToSlide(index) {
        this.currentIndex = index;
        const slideWidth = this.carousel.clientWidth;
        this.carousel.scrollTo({
            left: slideWidth * index,
            behavior: 'smooth'
        });
        this.updateActiveStates();
    }
    
    nextSlide() {
        const nextIndex = (this.currentIndex + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }
    
    prevSlide() {
        const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }
    
    snapToNearestSlide() {
        this.updateCurrentIndex();
        this.goToSlide(this.currentIndex);
    }
}

// 初期化 - タイミングを複数設定
function initCarousels() {
    const caseSliders = document.querySelectorAll('.case-slider');
    caseSliders.forEach(slider => {
        if (!slider.classList.contains('carousel-initialized')) {
            new SimpleCaseCarousel(slider);
            slider.classList.add('carousel-initialized');
        }
    });
}

// グローバルに公開
window.initCarousels = initCarousels;

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', initCarousels);

// window.onload（画像読み込み後）
window.addEventListener('load', initCarousels);

// 少し遅延して実行（動的生成対応）
setTimeout(initCarousels, 1000);
setTimeout(initCarousels, 2000);
setTimeout(initCarousels, 3000);

// MutationObserverで動的な要素の追加を監視
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (node.classList && node.classList.contains('case-slider')) {
                        setTimeout(initCarousels, 100);
                    } else if (node.querySelector && node.querySelector('.case-slider')) {
                        setTimeout(initCarousels, 100);
                    }
                }
            });
        }
    });
});

// body要素を監視
if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// 既存のSlick初期化を無効化
if (window.jQuery) {
    $(document).ready(function() {
        // Slickの初期化を上書き
        window.initCaseSlider = function() {
            console.log('Slick initialization disabled - using simple carousel instead');
        };
    });
}