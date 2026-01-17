// ============================================
// FILTERS.JS — EV1 STABLE avec compteur persistant
// Gestion des filtres produits
// ============================================

// --------------------------------------------
// Etat global des filtres (SOURCE DE VERITE)
// --------------------------------------------
export const filtersState = {
    event: "all",      // string | "all"
    stoneTypes: [],    // array<string>
    priceMin: null,    // number
    priceMax: null,    // number
    totalProducts: 0,  // Nouveau: nombre total de produits
    filteredProducts: 0 // Nouveau: nombre de produits filtrés
};

// --------------------------------------------
// Gestionnaire de compteur de produits
// --------------------------------------------
const ProductCounter = {
    // État d'initialisation
    initialized: false,
    
    // Élément d'affichage du compteur
    counterElement: null,
    
    // ID pour cancelAnimationFrame
    rafId: null,
    
    // Initialiser le compteur (une seule fois)
    init() {
        if (this.initialized) {
            console.log('[ProductCounter] Déjà initialisé');
            return;
        }
        
        this.initialized = true;
        console.trace("renderCounter - Initialisation du compteur");
        
        // GARDE-FOU ABSOLU : un seul compteur avec ID unique
        const COUNTER_ID = 'products-counter-global';
        this.counterElement = document.getElementById(COUNTER_ID);
        
        // Vérifier si un compteur existe déjà
        if (this.counterElement) {
            console.warn('[ProductCounter] Compteur déjà présent dans le DOM, réutilisation');
        } else {
            // Créer l'élément avec ID unique
            this.counterElement = document.createElement('div');
            this.counterElement.id = COUNTER_ID;
            this.counterElement.className = 'products-counter';
            this.counterElement.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0,0,0,0.85);
                color: white;
                padding: 12px 24px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: 500;
                z-index: 1000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
                transition: all 0.3s ease;
                display: none;
                cursor: default;
                user-select: none;
            `;
            
            // Ajouter le style hover
            const hoverStyle = `
                .products-counter:hover {
                    background: rgba(0, 0, 0, 0.95);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
                }
                @keyframes counterPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                .products-counter.pulse {
                    animation: counterPulse 0.3s ease;
                }
            `;
            
            // Ajouter les styles dynamiquement
            const styleEl = document.createElement('style');
            styleEl.textContent = hoverStyle;
            document.head.appendChild(styleEl);
            
            // Vérifier qu'il n'y a pas d'autre body (sécurité)
            if (!document.body) {
                console.error('[ProductCounter] document.body non disponible');
                return;
            }
            
            document.body.appendChild(this.counterElement);
            console.log('[ProductCounter] Nouveau compteur créé avec ID:', COUNTER_ID);
        }
        
        // Récupérer l'état précédent depuis localStorage
        this.loadState();
        
        // Écouter les événements de nettoyage
        this.setupCleanupListeners();
        
        // Vérifier la présence de doublons (debug)
        this.checkForDuplicates();
    },
    
    // Vérifier les doublons dans le DOM
    checkForDuplicates() {
        const allCounters = document.querySelectorAll('.products-counter, [id*="counter"]');
        if (allCounters.length > 1) {
            console.warn(`[ProductCounter] ATTENTION: ${allCounters.length} compteurs détectés!`, allCounters);
            // Supprimer les doublons
            allCounters.forEach((counter, index) => {
                if (index > 0 && counter.id !== 'products-counter-global') {
                    console.warn('[ProductCounter] Suppression du compteur doublon:', counter);
                    counter.remove();
                }
            });
        }
    },
    
    // Configurer les écouteurs de nettoyage
    setupCleanupListeners() {
        // Nettoyage quand la page est déchargée
        const cleanupHandler = () => this.cleanup();
        window.addEventListener('beforeunload', cleanupHandler);
        
        // Nettoyage quand la visibilité de la page change
        const visibilityHandler = () => {
            if (document.hidden) {
                this.cleanup();
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler);
        
        // Stocker les handlers pour pouvoir les retirer
        this._cleanupHandlers = {
            beforeunload: cleanupHandler,
            visibilitychange: visibilityHandler
        };
    },
    
    // Mettre à jour l'affichage (version optimisée avec cancelAnimationFrame)
    updateDisplay(filteredCount, totalCount) {
        // S'assurer que le compteur est initialisé
        if (!this.initialized) {
            this.init();
        }
        
        // Vérifier que l'élément existe toujours
        if (!this.counterElement || !document.body.contains(this.counterElement)) {
            console.warn('[ProductCounter] Élément perdu, réinitialisation...');
            this.reset();
            this.init();
        }
        
        console.trace("renderCounter - Mise à jour affichage");
        
        // Annuler l'animation frame précédente si elle existe
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        
        // Planifier la mise à jour sur le prochain frame
        this.rafId = requestAnimationFrame(() => {
            this._performUpdate(filteredCount, totalCount);
        });
    },
    
    // Réaliser la mise à jour effective
    _performUpdate(filteredCount, totalCount) {
        if (!this.counterElement || !document.body.contains(this.counterElement)) {
            console.error('[ProductCounter] Impossible de mettre à jour: élément manquant');
            return;
        }
        
        filtersState.filteredProducts = filteredCount;
        filtersState.totalProducts = totalCount;
        
        // Sauvegarder dans localStorage
        this.saveState();
        
        // Mettre à jour le texte
        if (filteredCount === totalCount) {
            this.counterElement.textContent = `${totalCount} produit${totalCount > 1 ? 's' : ''}`;
        } else {
            this.counterElement.textContent = `${filteredCount} sur ${totalCount} produit${totalCount > 1 ? 's' : ''}`;
        }
        
        // Ajouter une classe pour l'animation
        this.counterElement.classList.add('pulse');
        setTimeout(() => {
            this.counterElement.classList.remove('pulse');
        }, 300);
        
        // Toujours afficher le compteur
        this.counterElement.style.display = 'block';
        
        // Dispatcher un événement pour les autres composants
        document.dispatchEvent(new CustomEvent('productCounter:updated', {
            detail: { filteredCount, totalCount }
        }));
        
        console.log(`[ProductCounter] ${filteredCount}/${totalCount} produits affichés`);
        
        // Réinitialiser l'ID
        this.rafId = null;
    },
    
    // Mise à jour immédiate (pour les cas critiques)
    updateDisplayImmediate(filteredCount, totalCount) {
        if (!this.initialized) {
            this.init();
        }
        
        // Vérifier que l'élément existe
        if (!this.counterElement || !document.body.contains(this.counterElement)) {
            console.warn('[ProductCounter] Élément manquant pour mise à jour immédiate');
            this.reset();
            this.init();
        }
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this._performUpdate(filteredCount, totalCount);
    },
    
    // Sauvegarder l'état
    saveState() {
        try {
            const state = {
                filtered: filtersState.filteredProducts,
                total: filtersState.totalProducts,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            localStorage.setItem('productCounter_state', JSON.stringify(state));
        } catch (e) {
            console.error('[ProductCounter] Erreur sauvegarde:', e);
        }
    },
    
    // Charger l'état
    loadState() {
        try {
            const saved = localStorage.getItem('productCounter_state');
            if (saved) {
                const data = JSON.parse(saved);
                filtersState.filteredProducts = data.filtered || 0;
                filtersState.totalProducts = data.total || 0;
            }
        } catch (e) {
            console.error('[ProductCounter] Erreur chargement:', e);
        }
    },
    
    // Masquer le compteur
    hide() {
        if (this.initialized && this.counterElement && document.body.contains(this.counterElement)) {
            this.counterElement.style.display = 'none';
        }
    },
    
    // Afficher le compteur
    show() {
        if (this.initialized && this.counterElement && document.body.contains(this.counterElement)) {
            this.counterElement.style.display = 'block';
        }
    },
    
    // Nettoyer les ressources
    cleanup() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        // Retirer les écouteurs d'événements
        if (this._cleanupHandlers) {
            window.removeEventListener('beforeunload', this._cleanupHandlers.beforeunload);
            document.removeEventListener('visibilitychange', this._cleanupHandlers.visibilitychange);
        }
    },
    
    // Réinitialiser complètement
    reset() {
        this.cleanup();
        
        // Supprimer l'élément du DOM
        if (this.counterElement && this.counterElement.parentNode) {
            this.counterElement.parentNode.removeChild(this.counterElement);
        }
        
        this.initialized = false;
        this.counterElement = null;
        this._cleanupHandlers = null;
        
        console.log('[ProductCounter] Réinitialisation complète');
    },
    
    // Vérifier l'état actuel
    getStatus() {
        return {
            initialized: this.initialized,
            elementExists: !!(this.counterElement && document.body.contains(this.counterElement)),
            elementId: this.counterElement ? this.counterElement.id : null,
            hasRaf: !!this.rafId
        };
    }
};

// --------------------------------------------
// Initialisation UI des filtres
// --------------------------------------------
export function initFiltersUI(products) {
    console.log("Init filters UI");
    
    // Vérifier que les produits sont valides
    if (!Array.isArray(products)) {
        console.error('[Filters] Produits invalides:', products);
        return;
    }
    
    // Initialiser le compteur (seulement une fois)
    ProductCounter.init();
    
    // Initialiser avec le nombre total de produits
    const totalProducts = products.length;
    filtersState.totalProducts = totalProducts;
    filtersState.filteredProducts = totalProducts;
    
    // Mettre à jour l'affichage initial
    ProductCounter.updateDisplayImmediate(totalProducts, totalProducts);
    
    // Générer les filtres UI
    generateEventFilters(products);
    generateStoneFilters(products);
    generatePriceFilter(products);
    
    // Écouter les changements de page/produits
    setupProductChangeListener();
    
    // Log de debug
    console.log('[Filters] UI initialisée avec', totalProducts, 'produits');
    console.log('[Filters] Statut compteur:', ProductCounter.getStatus());
}

// --------------------------------------------
// Application des filtres (optimisé)
// --------------------------------------------
export function applyFilters(products) {
    console.trace("renderCounter - Application des filtres");
    
    // Vérifier l'entrée
    if (!Array.isArray(products)) {
        console.error('[Filters] applyFilters: produits invalides');
        return [];
    }
    
    let result = [...products];

    // --- Filtre evenement ---
    if (filtersState.event !== "all") {
        result = result.filter(p =>
            Array.isArray(p.events) &&
            p.events.includes(filtersState.event)
        );
    }

    // --- Filtre type de pierre ---
    if (filtersState.stoneTypes.length > 0) {
        result = result.filter(p =>
            p.stone_type &&
            filtersState.stoneTypes.includes(
                normalizeStone(p.stone_type)
            )
        );
    }

    // --- Filtre prix ---
    if (filtersState.priceMin !== null) {
        result = result.filter(p => p.price >= filtersState.priceMin);
    }

    if (filtersState.priceMax !== null) {
        result = result.filter(p => p.price <= filtersState.priceMax);
    }
    
    // Mettre à jour le compteur
    const filteredCount = result.length;
    const totalCount = products.length;
    
    ProductCounter.updateDisplay(filteredCount, totalCount);

    return result;
}

// ============================================
// UI GENERATION
// ============================================

// Variable pour les IDs d'animation frame
const animationFrames = {
    priceUpdate: null,
    dispatchChange: null,
    productUpdate: null
};

function generateEventFilters(products) {
    const container = document.getElementById("event-filters");
    if (!container) return;

    const events = unique(
        products.flatMap(p => p.events || [])
    );

    container.innerHTML = "";

    // Bouton Tous
    const allBtn = createButton("Tous", true);
    allBtn.onclick = () => {
        filtersState.event = "all";
        setActive(container, allBtn);
        dispatchChange();
    };
    container.appendChild(allBtn);

    events.forEach(ev => {
        const btn = createButton(ev);
        btn.onclick = () => {
            filtersState.event = ev;
            setActive(container, btn);
            dispatchChange();
        };
        container.appendChild(btn);
    });
}

function generateStoneFilters(products) {
    const container = document.getElementById("stone-filters");
    if (!container) return;

    const stones = unique(
        products
            .map(p => normalizeStone(p.stone_type))
            .filter(Boolean)
    );

    container.innerHTML = "";

    stones.forEach(stone => {
        const btn = createButton(stone);
        btn.onclick = () => {
            toggleArray(filtersState.stoneTypes, stone);
            btn.classList.toggle("active");
            dispatchChange();
        };
        container.appendChild(btn);
    });
}

function generatePriceFilter(products) {
    const container = document.getElementById("price-filter");
    if (!container) return;

    const prices = products
        .map(p => Number(p.price))
        .filter(v => !isNaN(v));

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // Init state
    filtersState.priceMin = min;
    filtersState.priceMax = max;

    container.innerHTML = `
        <div class="price-filter-group">
            <label>
                Min €
                <input type="range" id="price-min-range" min="${min}" max="${max}" value="${min}">
                <input type="number" id="price-min" min="${min}" max="${max}" value="${min}">
            </label>
            
            <span class="price-separator">–</span>
            
            <label>
                Max €
                <input type="range" id="price-max-range" min="${min}" max="${max}" value="${max}">
                <input type="number" id="price-max" min="${min}" max="${max}" value="${max}">
            </label>
        </div>
        
        <div class="price-display">
            <span id="price-range-display">${min}€ - ${max}€</span>
        </div>
    `;

    const minInput = container.querySelector("#price-min");
    const maxInput = container.querySelector("#price-max");
    const minRange = container.querySelector("#price-min-range");
    const maxRange = container.querySelector("#price-max-range");
    const display = container.querySelector("#price-range-display");

    const updateDisplay = () => {
        display.textContent = `${filtersState.priceMin}€ - ${filtersState.priceMax}€`;
    };

    const updateFilters = () => {
        // Annuler la précédente mise à jour
        if (animationFrames.priceUpdate) {
            cancelAnimationFrame(animationFrames.priceUpdate);
        }
        
        // Planifier la mise à jour
        animationFrames.priceUpdate = requestAnimationFrame(() => {
            const minVal = Number(minInput.value);
            const maxVal = Number(maxInput.value);
            
            // Assurer min <= max
            if (minVal > maxVal) {
                minInput.value = maxVal;
                maxInput.value = minVal;
                filtersState.priceMin = maxVal;
                filtersState.priceMax = minVal;
            } else {
                filtersState.priceMin = isNaN(minVal) ? min : minVal;
                filtersState.priceMax = isNaN(maxVal) ? max : maxVal;
            }
            
            // Synchroniser les sliders
            minRange.value = filtersState.priceMin;
            maxRange.value = filtersState.priceMax;
            
            updateDisplay();
            dispatchChange();
            
            animationFrames.priceUpdate = null;
        });
    };

    minInput.addEventListener("input", updateFilters);
    maxInput.addEventListener("input", updateFilters);
    minRange.addEventListener("input", () => {
        minInput.value = minRange.value;
        updateFilters();
    });
    maxRange.addEventListener("input", () => {
        maxInput.value = maxRange.value;
        updateFilters();
    });

    updateDisplay();
}

// ============================================
// ÉCOUTEURS D'ÉVÉNEMENTS
// ============================================

function setupProductChangeListener() {
    // Écouter les changements de produits
    document.addEventListener('products:updated', (e) => {
        console.trace("renderCounter - Produits mis à jour");
        
        // Debounce avec requestAnimationFrame
        if (animationFrames.productUpdate) {
            cancelAnimationFrame(animationFrames.productUpdate);
        }
        
        animationFrames.productUpdate = requestAnimationFrame(() => {
            if (e.detail && e.detail.products) {
                const filtered = applyFilters(e.detail.products);
                ProductCounter.updateDisplay(filtered.length, e.detail.products.length);
            }
            animationFrames.productUpdate = null;
        });
    });
    
    // Écouter le défilement pour cacher le compteur si besoin
    let scrollTimeout;
    let scrollRafId;
    
    window.addEventListener('scroll', () => {
        // Masquer immédiatement
        ProductCounter.hide();
        
        // Annuler les précédentes animations
        if (scrollRafId) cancelAnimationFrame(scrollRafId);
        clearTimeout(scrollTimeout);
        
        // Réafficher après 1 seconde d'inactivité
        scrollRafId = requestAnimationFrame(() => {
            scrollTimeout = setTimeout(() => {
                ProductCounter.show();
                scrollRafId = null;
            }, 1000);
        });
    });
    
    // Touches de raccourci pour debug
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'd') {
            console.trace("renderCounter - Debug manuel");
            console.log('État des filtres:', filtersState);
            console.log('Statut compteur:', ProductCounter.getStatus());
        }
    });
}

// ============================================
// UTILS
// ============================================

function dispatchChange() {
    // Debounce les changements de filtres
    if (animationFrames.dispatchChange) {
        cancelAnimationFrame(animationFrames.dispatchChange);
    }
    
    animationFrames.dispatchChange = requestAnimationFrame(() => {
        document.dispatchEvent(new Event("filters:change"));
        console.trace("renderCounter - Filtres changés");
        animationFrames.dispatchChange = null;
    });
}

function createButton(label, active = false) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "filter-btn";
    if (active) btn.classList.add("active");
    return btn;
}

function setActive(container, activeBtn) {
    container.querySelectorAll("button").forEach(b =>
        b.classList.remove("active")
    );
    activeBtn.classList.add("active");
}

function toggleArray(arr, value) {
    const i = arr.indexOf(value);
    if (i === -1) arr.push(value);
    else arr.splice(i, 1);
}

function unique(arr) {
    return [...new Set(arr)];
}

function normalizeStone(value) {
    if (!value) return null;
    return value.toString().trim().toLowerCase();
}

// ============================================
// EXPORT DE LA FONCTION DE MISE À JOUR
// ============================================

export function updateProductCounter(filteredCount, totalCount) {
    console.trace("renderCounter - Mise à jour directe");
    ProductCounter.updateDisplay(filteredCount, totalCount);
}

export function getCurrentCounts() {
    return {
        filtered: filtersState.filteredProducts,
        total: filtersState.totalProducts
    };
}

export function cleanupProductCounter() {
    ProductCounter.cleanup();
}

export function resetProductCounter() {
    ProductCounter.reset();
}

export function getCounterStatus() {
    return ProductCounter.getStatus();
}

// Initialisation automatique si dans le DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Initialiser seulement si nécessaire
        if (!ProductCounter.initialized) {
            ProductCounter.init();
        }
    });
} else if (!ProductCounter.initialized) {
    // Si le DOM est déjà prêt, initialiser
    ProductCounter.init();
}

// Exporter pour debug
window.ProductCounter = ProductCounter;