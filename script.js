// Initialize Lucide icons
lucide.createIcons();

// Navbar effect on scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

// Scroll Reveal Observer
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, {
    threshold: 0.1
});

revealElements.forEach(el => {
    revealObserver.observe(el);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80, // Adjust for navbar height
                behavior: 'smooth'
            });
        }
    });
});

// Initial Tactical Fetch & Interval
fetchTacticalData();
setInterval(fetchTacticalData, 30000);

// Tactical Data Fetcher (from Moderation Dashboard)
async function fetchTacticalData() {
    const statusEl = document.getElementById('js-server-status');
    const ratioEl = document.getElementById('hud-unit-ratio');

    try {
        const response = await fetch('http://localhost:3000/api/mod-data');
        if (!response.ok) throw new Error('API Offline');
        
        const data = await response.json();
        const ratio = data.conflitData?.ratio || '-- / --';
        
        if (ratioEl) ratioEl.textContent = ratio;
        
        if (statusEl) {
            statusEl.textContent = 'EN LIGNE';
            statusEl.classList.remove('status-offline');
            statusEl.classList.add('status-online');
        }
    } catch (error) {
        console.warn('Tactical API unreachable.');
        if (statusEl) {
            statusEl.textContent = 'HORS LIGNE';
            statusEl.classList.remove('status-online');
            statusEl.classList.add('status-offline');
        }
        if (ratioEl) ratioEl.textContent = '00 / 00';
    }
}

// Tactical Carousel Logic
const track = document.getElementById('carousel-track');
class TacticalCarousel {
    constructor(config) {
        this.track = document.getElementById(config.trackId);
        this.prevBtn = document.getElementById(config.prevId);
        this.nextBtn = document.getElementById(config.nextId);
        this.dotsContainer = document.getElementById(config.dotsId);
        this.autoPlayDelay = config.autoPlayDelay || 5000;
        
        if (!this.track) return;
        
        this.items = Array.from(this.track.children);
        this.currentIndex = 0;
        this.autoPlayInterval = null;

        // Check if fof_arma is here and should be prioritized (is-official)
        const officialIndex = this.items.findIndex(item => item.classList.contains('is-official'));
        if (officialIndex !== -1) {
            this.currentIndex = officialIndex;
        }

        this.init();
    }

    init() {
        this.initIndicators();
        this.update();
        this.startAutoPlay();
        this.addEventListeners();
    }

    update() {
        const totalItems = this.items.length;
        
        const isMobile = window.innerWidth < 768;
        
        this.items.forEach((item, index) => {
            let diff = index - this.currentIndex;
            
            if (diff > totalItems / 2) diff -= totalItems;
            if (diff < -totalItems / 2) diff += totalItems;
            
            let absDiff = Math.abs(diff);

            // Adaptive Params
            let shiftFactor = isMobile ? 50 : 75;
            let depthFactor = isMobile ? 120 : 250;
            let rotateFactor = isMobile ? -25 : -45;
            let scaleFactor = isMobile ? 0.15 : 0.2;
            
            let translateX = diff * shiftFactor; 
            let translateZ = -absDiff * depthFactor; 
            let rotateY = diff * rotateFactor; 
            let opacity = 1 - (absDiff * 0.4);
            let zIndex = 100 - Math.round(absDiff * 10);
            let scale = 1 - (absDiff * scaleFactor);

            if (absDiff > (isMobile ? 1.5 : 2.2)) {
                opacity = 0;
                item.style.visibility = 'hidden';
            } else {
                item.style.visibility = 'visible';
            }

            item.style.transform = `translate(-50%, -50%) translate3d(${translateX}%, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
            item.style.opacity = opacity;
            item.style.zIndex = zIndex;
            item.style.pointerEvents = absDiff === 0 ? 'auto' : 'none';
        });

        // Update dots
        const dots = this.dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    nextSlide() {
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        this.update();
    }

    prevSlide() {
        this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
        this.update();
    }

    initIndicators() {
        this.dotsContainer.innerHTML = '';
        this.items.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.addEventListener('click', () => {
                this.currentIndex = i;
                this.update();
                this.resetAutoPlay();
            });
            this.dotsContainer.appendChild(dot);
        });
    }

    startAutoPlay() {
        if (this.autoPlayInterval) clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = setInterval(() => this.nextSlide(), this.autoPlayDelay);
    }

    resetAutoPlay() {
        this.startAutoPlay();
    }

    addEventListeners() {
        this.nextBtn?.addEventListener('click', () => {
            this.nextSlide();
            this.resetAutoPlay();
        });

        this.prevBtn?.addEventListener('click', () => {
            this.prevSlide();
            this.resetAutoPlay();
        });

        // Click on items to center or open lightbox (for gallery)
        this.items.forEach((item, index) => {
            item.addEventListener('click', () => {
                if (index === this.currentIndex) {
                    // Specific gallery logic: Lightbox
                    if (item.classList.contains('gallery-item')) {
                        openLightbox(item);
                    }
                } else {
                    this.currentIndex = index;
                    this.update();
                    this.resetAutoPlay();
                }
            });
        });
    }
}

// Lightbox Logic (Global)
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxCaption = document.getElementById('lightbox-caption');

function openLightbox(item) {
    const img = item.querySelector('img');
    const title = item.querySelector('.label-title').textContent;
    
    lightboxImg.src = img.src;
    lightboxCaption.textContent = title;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
}

// Initialize Carousels when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    new TacticalCarousel({
        trackId: 'gallery-track',
        prevId: 'gallery-prev',
        nextId: 'gallery-next',
        dotsId: 'gallery-dots',
        autoPlayDelay: 6000
    });

    new TacticalCarousel({
        trackId: 'streamers-track',
        prevId: 'streamers-prev',
        nextId: 'streamers-next',
        dotsId: 'streamers-dots',
        autoPlayDelay: 5000
    });

    // Initialize Official Twitch Live Player (Synced with HUD methodology)
    if (document.getElementById('twitch-embed')) {
        if (typeof Twitch !== 'undefined') {
            new Twitch.Player("twitch-embed", {
                width: "100%",
                height: "100%",
                channel: "fof_arma",
                parent: ["localhost", "127.0.0.1", "iceman64360-dev.github.io", window.location.hostname],
                autoplay: true,
                muted: true,
                controls: true
            });
        }
    }
});

// Initial Tactical Fetch & Interval
fetchTacticalData();
setInterval(fetchTacticalData, 30000);
