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

// Form Submission handling (placeholder)
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = contactForm.querySelector('.btn-submit');
        const originalText = btn.textContent;
        
        btn.textContent = 'Transmission en cours...';
        btn.disabled = true;
        
        // Simulate network request
        setTimeout(() => {
            alert('Transmission réussie ! Votre message a été envoyé aux quartiers généraux de la FOF.');
            contactForm.reset();
            btn.textContent = originalText;
            btn.disabled = false;
        }, 1500);
    });
}

// Custom Video Player Logic
const fofVideo = document.getElementById('fof-video');
const videoPlayer = document.getElementById('video-player');
const playBtn = document.getElementById('play-btn');
const fsBtn = document.getElementById('fs-btn');
const progressBar = document.getElementById('progress-bar');

if (fofVideo) {
    function togglePlay() {
        if (fofVideo.paused) {
            fofVideo.play();
            videoPlayer.classList.add('playing');
            playBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        } else {
            fofVideo.pause();
            videoPlayer.classList.remove('playing');
            playBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        }
    }

    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
    });

    videoPlayer.addEventListener('click', () => {
        togglePlay();
    });

    fofVideo.addEventListener('timeupdate', () => {
        const progress = (fofVideo.currentTime / fofVideo.duration) * 100;
        progressBar.style.width = `${progress}%`;
    });

    fsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (fofVideo.requestFullscreen) {
            fofVideo.requestFullscreen();
        } else if (fofVideo.webkitRequestFullscreen) {
            fofVideo.webkitRequestFullscreen();
        } else if (fofVideo.msRequestFullscreen) {
            fofVideo.msRequestFullscreen();
        }
    });

    // Reset when ended
    fofVideo.addEventListener('ended', () => {
        videoPlayer.classList.remove('playing');
        playBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    });
}

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
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const dotsContainer = document.getElementById('carousel-dots');

if (track) {
    const items = Array.from(track.children);
    let currentIndex = 0;
    let autoPlayInterval;

    const getItemsPerView = () => {
        if (window.innerWidth <= 600) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    };

    const updateCarousel = () => {
        const itemsPerView = getItemsPerView();
        const moveAmount = currentIndex * (100 / itemsPerView);
        track.style.transform = `translateX(-${moveAmount}%)`;
        
        // Update dots
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    };

    const nextSlide = () => {
        const itemsPerView = getItemsPerView();
        const maxIndex = items.length - itemsPerView;
        
        if (currentIndex < maxIndex) {
            currentIndex++;
        } else {
            currentIndex = 0; // Loop back
        }
        updateCarousel();
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            const itemsPerView = getItemsPerView();
            currentIndex = items.length - itemsPerView;
        }
        updateCarousel();
    };

    const initIndicators = () => {
        dotsContainer.innerHTML = '';
        const itemsPerView = getItemsPerView();
        const dotCount = items.length - itemsPerView + 1;
        
        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                currentIndex = i;
                updateCarousel();
                resetAutoPlay();
            });
            dotsContainer.appendChild(dot);
        }
    };

    const startAutoPlay = () => {
        autoPlayInterval = setInterval(nextSlide, 5000);
    };

    const resetAutoPlay = () => {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    };

    nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoPlay();
    });

    prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoPlay();
    });

    window.addEventListener('resize', () => {
        initIndicators();
        updateCarousel();
    });

    initIndicators();
    updateCarousel();
    startAutoPlay();
}

// Initial Tactical Fetch & Interval
fetchTacticalData();
setInterval(fetchTacticalData, 30000);
