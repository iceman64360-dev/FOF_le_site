/**
 * FORCE OPÉRATIONNELLE FRANÇAISE - MAIN SCRIPT
 * Ce fichier gère l'ensemble des interactions front-end de la Landing Page FOF :
 * - Navigation mobile et effet au défilement (Scroll)
 * - Animations d'apparition (IntersectionObserver)
 * - Navigation par ancres fluide
 * - Carrousel interactif (Historique / ADN)
 * - Appels API pour le statut des serveurs
 * - Carrousel 3D (Galerie / Streamers)
 */

// Initialise la librairie d'icônes Lucide (utilisée dans les badges tactiques)
lucide.createIcons();

/**
 * 1. EFFET DE NAVIGATION AU DÉFILEMENT (Navbar Scroll)
 * Ajoute une classe 'scrolled' (fond flouté/assombri) à la barre de navigation
 * dès que l'utilisateur descend de plus de 50 pixels.
 */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

/**
 * 2. GESTION DU MENU MOBILE (Menu Burger)
 * Permet d'ouvrir/fermer le menu de navigation sur les petits écrans
 * et de le refermer automatiquement lorsqu'un lien est cliqué.
 */
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle) {
    // Bascule l'état ouvert/fermé au clic sur l'icône burger
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Ferme le menu de navigation automatiquement dès qu'on clique sur un lien
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

/**
 * 3. SYSTÈME D'ANIMATION À L'APPARITION (Scroll Reveal)
 * Utilise l'IntersectionObserver API pour ajouter la classe '.active' 
 * aux éléments cachés (classe '.reveal') dès qu'ils rentrent dans le champ de vision (10%).
 */
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // Optionnel : dé-commenter la ligne suivante pour jouer l'animation une seule fois
            // revealObserver.unobserve(entry.target); 
        }
    });
}, {
    threshold: 0.1 // L'élément doit être visible à 10% pour déclencher l'animation
});

// Applique l'observateur sur tous les éléments '.reveal'
revealElements.forEach(el => {
    revealObserver.observe(el);
});

/**
 * 4. DÉFILEMENT DOUX (Smooth Scroll Anchors)
 * Intercepte les clics sur les liens contenant un '#' pour faire défiler la page 
 * délicatement jusqu'à la section ciblée, au lieu d'y sauter brutalement.
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80, // Décalage de 80px pour ne pas que la navbar fixe cache le titre de section
                behavior: 'smooth'
            });
        }
    });
});

/**
 * 5. LOGIQUE DES ONGLETS DE L'HISTORIQUE (Text Slider / Tabs)
 * Gère l'affichage dynamique des "Slides" de la section ADN.
 * Le clic sur un bouton d'onglet (.history-tab) cache le texte actuel et affiche le nouveau.
 */
const historyTabs = document.querySelectorAll('.history-tab');
const historySlides = document.querySelectorAll('.history-slide');

if(historyTabs.length > 0) {
    historyTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Nettoyage : Retire la classe 'active' de TOUS les onglets et TOUTES les slides
            historyTabs.forEach(t => t.classList.remove('active'));
            historySlides.forEach(s => s.classList.remove('active'));

            // Activation : Ajoute la classe 'active' au bouton de l'onglet cliqué
            tab.classList.add('active');

            // Affichage : Lit l'ID cible (ex: 'slide-orga') et affiche la slide HTML correspondante
            const targetId = tab.getAttribute('data-target');
            const targetSlide = document.getElementById(targetId);
            if (targetSlide) {
                targetSlide.classList.add('active');
            }
        });
    });
}

/**
 * 6. HUD TACTIQUE EN TEMPS RÉEL (Récupération de l'API Serveur)
 * Cette fonction interroge périodiquement (toutes les 30s) l'API du bot Discord FOF (Conflict Monitor)
 * pour afficher en direct vos statuts (En ligne / Hors Ligne) et vos effectifs de soldats sur le terrain.
 */
// Lancement initial de la requête, puis boucle toute les 30000 millisecondes
fetchTacticalData();
setInterval(fetchTacticalData, 30000);

async function fetchTacticalData() {
    const statusEl = document.getElementById('js-server-status');
    const ratioEl = document.getElementById('hud-unit-ratio');

    // Sécurité GitHub Pages : Empêche le spam d'erreurs 'ERR_CONNECTION_REFUSED'.
    // Le site détecte s'il tourne véritablement sur votre serveur local (127.0.0.1) ou sur un vrai domaine externe.
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Si en production sans backend configuré, 'apiUrl' vaut 'null'
    const apiUrl = isLocal ? 'http://localhost:3000/api/mod-data' : null; // TODO : Remplacer "null" par l'URL publique de votre backend (ex: Render/Railway)

    if (!apiUrl) {
        // Mode Hors Ligne par défaut pour la production tant que l'API n'est pas déployée en ligne
        if (statusEl) {
            statusEl.textContent = 'HORS LIGNE';
            statusEl.classList.remove('status-online');
            statusEl.classList.add('status-offline');
        }
        if (ratioEl) ratioEl.textContent = '00 / 00';
        return;
    }

    try {
        // Tentative d'interrogation du Backend Modération (Dashboard Unifié)
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('API Offline');
        
        const data = await response.json();
        
        // Extrait le ratio des effectifs (ex: '25 / 48') depuis les données de l'API
        const ratio = data.conflitData?.ratio || '-- / --';
        if (ratioEl) ratioEl.textContent = ratio;
        
        // Met à jour l'indicateur visuel sur 'EN LIGNE' (Vert style CRT)
        if (statusEl) {
            statusEl.textContent = 'EN LIGNE';
            statusEl.classList.remove('status-offline');
            statusEl.classList.add('status-online');
        }
    } catch (error) {
        // Gestion des pannes de serveur : Bascule l'indicateur au Rouge 'HORS LIGNE'
        if (isLocal) console.warn('Tactical API unreachable.');
        if (statusEl) {
            statusEl.textContent = 'HORS LIGNE';
            statusEl.classList.remove('status-online');
            statusEl.classList.add('status-offline');
        }
        if (ratioEl) ratioEl.textContent = '00 / 00';
    }
}

/**
 * 7. LOGIQUE DU CARROUSEL 3D (Galerie & Streamers)
 * Classe orientée objet permettant de créer une galerie 3D rotative.
 * Configure dynamiquement la perspective, la profondeur (Z-index), et l'opacité
 * des éléments selon leur position par rapport à l'élément central (currentIndex).
 */
const track = document.getElementById('carousel-track');
class TacticalCarousel {
    /**
     * @param {Object} config - Configuration du carrousel contenant l'ID du track, boutons et dots.
     */
    constructor(config) {
        this.track = document.getElementById(config.trackId);
        this.prevBtn = document.getElementById(config.prevId);
        this.nextBtn = document.getElementById(config.nextId);
        this.dotsContainer = document.getElementById(config.dotsId);
        this.autoPlayDelay = config.autoPlayDelay || 5000; // Défilement automatique par défaut (5s)
        
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

    /**
     * Calcule et applique les transformations 3D CSS (Rotation, Translation, Opacité)
     * à chaque carte de la galerie selon sa distance (diff) avec la carte centrale.
     */
    update() {
        const totalItems = this.items.length;
        const isMobile = window.innerWidth < 768; // Détecte l'affichage sur smartphone
        
        this.items.forEach((item, index) => {
            let diff = index - this.currentIndex;
            
            // Calcul du chemin le plus court pour un carrousel infini
            if (diff > totalItems / 2) diff -= totalItems;
            if (diff < -totalItems / 2) diff += totalItems;
            
            let absDiff = Math.abs(diff);

            // Paramètres adaptatifs : On écarte davantage les éléments sur mobile pour éviter qu'ils se superposent
            let shiftFactor = isMobile ? 100 : 75;      // Décalage latéral (X)
            let depthFactor = isMobile ? 220 : 250;     // Profondeur 3D (Z)
            let rotateFactor = isMobile ? -35 : -45;    // Angle d'inclinaison
            let scaleFactor = isMobile ? 0.25 : 0.2;    // Réduction de taille
            
            // Calcul des transformations CSS finales
            let translateX = diff * shiftFactor; 
            let translateZ = -absDiff * depthFactor; 
            let rotateY = diff * rotateFactor; 
            // Les cartes s'estompent au fur et à mesure qu'elles s'éloignent du centre
            let opacity = 1 - (absDiff * 0.4);
            let zIndex = 100 - Math.round(absDiff * 10);
            let scale = 1 - (absDiff * scaleFactor);

            // Masque complètement les cartes très reculées pour des raisons de performances
            if (absDiff > (isMobile ? 1.2 : 2.2)) {
                opacity = 0;
                item.style.visibility = 'hidden';
            } else {
                item.style.visibility = 'visible';
            }

            // Application du style calculé à l'élément DOM
            item.style.transform = `translate(-50%, -50%) translate3d(${translateX}%, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
            item.style.opacity = opacity;
            item.style.zIndex = zIndex;
            // Seul l'élément au centre est cliquable (pointerEvents)
            item.style.pointerEvents = absDiff === 0 ? 'auto' : 'none';
        });

        // Met à jour l'indicateur visuel (.dots) actif
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

/**
 * 8. SYSTÈME DE LIGHTBOX (Visionneuse d'images plein écran)
 * Gère l'ouverture des images de la Galerie en grand format avec un fond sombre.
 */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxCaption = document.getElementById('lightbox-caption');

// Fonction d'ouverture de la Lightbox
function openLightbox(item) {
    const img = item.querySelector('img');
    const title = item.querySelector('.label-title').textContent;
    
    // Injecte la source de l'image cliquée dans la Lightbox
    lightboxImg.src = img.src;
    lightboxCaption.textContent = title;
    lightbox.classList.add('active'); // Rend la lightbox visible via CSS
    
    // Bloque le défilement de la page en arrière-plan
    document.body.style.overflow = 'hidden';
}

// Fonction de fermeture de la Lightbox
function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Restaure le scroll global
}

if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
}

/**
 * 9. INITIALISATION AU CHARGEMENT DE LA PAGE
 * Instancie l'ensemble des modules dynamiques du site une fois le HTML lu par le navigateur.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Carrousel de la section "Galerie Opérationnelle"
    new TacticalCarousel({
        trackId: 'gallery-track',
        prevId: 'gallery-prev',
        nextId: 'gallery-next',
        dotsId: 'gallery-dots',
        autoPlayDelay: 6000 // Changement toutes les 6 secondes
    });

    // Carrousel de la section "Créateurs de contenu FOF"
    new TacticalCarousel({
        trackId: 'streamers-track',
        prevId: 'streamers-prev',
        nextId: 'streamers-next',
        dotsId: 'streamers-dots',
        autoPlayDelay: 5000 // Changement toutes les 5 secondes
    });

    // Optionnel : Intégration du lecteur Twitch en direct
    if (document.getElementById('twitch-embed')) {
        // Sécurité système : Le lecteur Twitch plante sévèrement si ouvert depuis le disque dur (sans serveur)
        const isLocalFile = window.location.protocol === 'file:';
        
        if (isLocalFile) {
            document.getElementById('twitch-embed').innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100%;background:rgba(10,15,25,0.8);color:var(--text-muted);text-align:center;padding:2rem;font-size:0.9rem;border:1px dashed var(--glass-border);">📺<br><br>Lecteur Twitch bloqué par sécurité de Google Chrome.<br>Ouvrez le site sur un serveur (Live Server) ou mettez-le en ligne pour visionner le direct.</div>';
        } else if (typeof Twitch !== 'undefined') {
            // Génération d'une liste propre de domaines autorisés
            const validParents = ["localhost", "127.0.0.1", "fof-arma.github.io"];
            if (window.location.hostname) validParents.push(window.location.hostname);

            new Twitch.Player("twitch-embed", {
                width: "100%",
                height: "100%",
                channel: "fof_arma",
                parent: validParents,
                autoplay: true,
                muted: true,
                controls: true
            });
        }
    }

    // Hub Ambiance Observer
    const hubSection = document.getElementById('streamers');
    const hubObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.body.classList.add('theme-streamer');
            } else {
                document.body.classList.remove('theme-streamer');
            }
        });
    }, { threshold: 0.3 });

    if (hubSection) hubObserver.observe(hubSection);

    // Lancement du chargement dynamique des avatars Twitch
    loadTwitchAvatars();
});

/**
 * 10. CHARGEMENT DYNAMIQUE DES DONNÉES TWITCH (Avatars & Statut Live)
 * Interroge l'API publique DecAPI en parallèle pour récupérer la vraie image de profil
 * et vérifier si la chaîne est actuellement en direct.
 */
async function loadTwitchAvatars() {
    // 1. Évite la sécurité CORS agressive "origin null" si on regarde le site en local sans serveur
    if (window.location.protocol === 'file:') {
        console.warn("Désactivation des requêtes Twitch : Le fonctionnement local bloque les appels d'API externes.");
        return;
    }

    const streamerCards = Array.from(document.querySelectorAll('.streamer-card'));
    
    // 2. Boucle séquentielle (for...of) pour éviter d'envoyer 26 requêtes à la milliseconde (Erreur 429 Too Many Requests)
    for (const card of streamerCards) {
        const usernameEl = card.querySelector('h3');
        const avatarContainer = card.querySelector('.streamer-avatar');
        const statusBadge = card.querySelector('.streamer-status'); // Badge "AFFILIÉ"
        
        if (!usernameEl || !avatarContainer) continue;
        const username = usernameEl.textContent.trim();

        try {
            // Lancement de 2 requêtes simultanées pour ce streamer particulier
            const [avatarRes, uptimeRes] = await Promise.all([
                fetch(`https://decapi.me/twitch/avatar/${username}`),
                fetch(`https://decapi.me/twitch/uptime/${username}`)
            ]);
            
            // Mise à jour de l'Avatar
            if (avatarRes.ok) {
                const avatarUrl = await avatarRes.text();
                if (avatarUrl && avatarUrl.startsWith('http') && !avatarUrl.includes("User not found")) {
                    avatarContainer.innerHTML = `<img src="${avatarUrl}" alt="Avatar de ${username}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid var(--glass-border);">`;
                    avatarContainer.style.background = 'transparent';
                    avatarContainer.style.color = 'transparent';
                }
            }

            // Mise à jour du Statut (Live / Offline)
            if (uptimeRes.ok && statusBadge) {
                const uptimeText = await uptimeRes.text();
                
                if (uptimeText && !uptimeText.includes("offline") && !uptimeText.includes("User not found")) {
                    statusBadge.innerHTML = '🔴 EN DIRECT';
                    statusBadge.style.background = 'rgba(230, 57, 70, 0.8)';
                    statusBadge.style.color = '#ffffff';
                    statusBadge.style.boxShadow = '0 0 10px rgba(230, 57, 70, 0.5)';
                    statusBadge.style.animation = 'signal-pulse 2s infinite';
                } else {
                    statusBadge.innerHTML = '⚫ HORS LIGNE';
                    statusBadge.style.background = 'rgba(10, 15, 25, 0.8)';
                    statusBadge.style.color = 'var(--text-muted)';
                    statusBadge.style.border = '1px solid var(--glass-border)';
                }
            }
            
            // 3. Pause artificielle de 300 millisecondes avant le streamer suivant pour ménager l'API publique
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
            console.warn(`Données Twitch inaccessibles pour ${username}.`);
        }
    }
}
