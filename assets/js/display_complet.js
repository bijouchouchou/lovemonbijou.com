// ============================================
// AFFICHAGE DES BIJOUX ET FILTRES
// Adapte aux classes CSS de votre style.css
// ============================================

import { $, $$, createEl, formatPrice, safeText } from '../core/utils.js';
import { openProductModal } from '../modals/modalView.js';
import { addToCart } from '../core/state.js';

// ============================================
// CONFIGURATION D'AFFICHAGE
// ============================================

const DISPLAY_CONFIG = {
    itemsPerRow: 4,
    imageHeight: '250px',
    showStock: true,
    showMetalInfo: true,
    showStoneInfo: true,
    enableQuickView: true,
    enableDirectAddToCart: true
};

// ============================================
// INITIALISATION PRINCIPALE
// ============================================

export function initProductDisplay() {
    console.log('🖼️ Initialisation affichage produits...');
    
    // Trouver le conteneur
    const container = $('#products-container') || $('.products-grid') || createProductsContainer();
    
    if (!container) {
        console.warn('Aucun conteneur pour les produits trouvé');
        return;
    }
    
    // Appliquer vos classes CSS
    container.className = 'products-grid';
    
    // Initialiser les filtres AVEC VOTRE STYLE
    initAllFilters();
    
    // Afficher les produits
    renderProducts();
    
    // ecouter les changements d'etat
    window.addEventListener('filteredProductsUpdated', renderProducts);
    window.addEventListener('productsLoaded', renderProducts);
    
    console.log('✅ Affichage produits initialisé');
}

// ============================================
// RENDU DES PRODUITS
// ============================================

function renderProducts() {
    const container = $('#products-container') || $('.products-grid');
    if (!container) return;
    
    const products = window.state?.filteredProducts || window.state?.products || [];
    
    if (products.length === 0) {
        showNoProductsMessage(container);
        return;
    }
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const card = createBijouCard(product);
        container.appendChild(card);
    });
    
    // Attacher les evenements
    attachProductEvents();
    
    // Mettre a jour le compteur
    updateProductCount(products.length);
}

// ============================================
// CReATION D'UNE CARTE BIJOU (VOTRE STYLE)
// ============================================

function createBijouCard(product) {
    const card = createEl('article', 'product-card');
    
    // Badges d'evenements (utilisez vos classes si vous en avez)
    const eventBadges = createEventBadges(product.events);
    
    // Image (avec placeholder de votre config)
    const imageHTML = `
        <div class="product-image-container">
            <img src="${product.image}" 
                 alt="${safeText(product.name)}" 
                 class="product-image"
                 loading="lazy"
                 onerror="this.src='${CONFIG.placeholder}'">
            ${eventBadges}
            ${product.new ? '<span class="badge-new">NOUVEAU</span>' : ''}
        </div>
    `;
    
    // Informations metal (or jaune/blanc/rose)
    const metalInfo = DISPLAY_CONFIG.showMetalInfo ? `
        <div class="product-metal">
            <span class="metal-label">Or 9 carats ${product.metal_color}</span>
            ${product.metal_weight ? `<span class="metal-weight">(${product.metal_weight}g)</span>` : ''}
        </div>
    ` : '';
    
    // Informations pierre
    const stoneInfo = DISPLAY_CONFIG.showStoneInfo && product.has_stone ? `
        <div class="product-stone">
            <span class="stone-type">${product.stone_type}</span>
            ${product.stone_weight ? `<span class="stone-weight">(${product.stone_weight}ct)</span>` : ''}
        </div>
    ` : '';
    
    // Tailles disponibles (important pour vos bagues)
    const sizesInfo = product.available_sizes && product.available_sizes.length > 0 ? `
        <div class="product-sizes">
            <span class="sizes-label">Tailles :</span>
            <div class="sizes-list">
                ${product.available_sizes.map(size => `
                    <span class="size-tag">${size}</span>
                `).join(' ')}
            </div>
        </div>
    ` : '';
    
    // Stock
    const stockInfo = DISPLAY_CONFIG.showStock ? `
        <div class="product-stock">
            ${product.stock > 0 
                ? `<span class="in-stock">✓ Stock : ${product.stock}</span>`
                : '<span class="out-of-stock">✗ Rupture</span>'
            }
        </div>
    ` : '';
    
    // Type de bijou avec icone
    const typeIcon = getTypeIcon(product.type);
    
    card.innerHTML = `
        <div class="product-card-inner">
            <!-- Image -->
            ${imageHTML}
            
            <!-- Informations principales -->
            <div class="product-info">
                <!-- En-tête avec référence -->
                <div class="product-header">
                    <h3 class="product-name" title="${safeText(product.title || product.name)}">
                        ${safeText(product.title || product.name)}
                    </h3>
                    <div class="product-reference">Ref: ${product.reference}</div>
                </div>
                
                <!-- Type et icône -->
                <div class="product-type">
                    <span class="type-icon">${typeIcon}</span>
                    <span class="type-label">${product.type}</span>
                </div>
                
                <!-- Description courte -->
                <p class="product-description" title="${safeText(product.description)}">
                    ${safeText(product.description.substring(0, 60))}${product.description.length > 60 ? '...' : ''}
                </p>
                
                <!-- Métal et pierres -->
                <div class="product-materials">
                    ${metalInfo}
                    ${stoneInfo}
                </div>
                
                <!-- Tailles -->
                ${sizesInfo}
                
                <!-- Prix -->
                <div class="product-price">
                    <span class="price-amount">${formatPrice(product.price)}</span>
                </div>
                
                <!-- Stock -->
                ${stockInfo}
                
                <!-- Actions -->
                <div class="product-actions">
                    <button class="view-btn" data-id="${product.id}">
                        Voir détails
                    </button>
                    ${product.stock > 0 && DISPLAY_CONFIG.enableDirectAddToCart ? `
                        <button class="add-to-cart-btn" data-id="${product.id}">
                            🛒 Ajouter
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// ============================================
// FILTRES AVANCeS AVEC VOTRE STYLE
// ============================================

function initAllFilters() {
    // Verifier si on a deja un filtre d'evenement (votre style)
    const existingFilter = $('#eventFilter');
    if (existingFilter) {
        // Utiliser votre filtre existant
        initEventFilter(existingFilter);
        return;
    }
    
    // Sinon creer tous les filtres
    const filtersContainer = $('#filters-container') || createFiltersContainer();
    
    const events = getAllUniqueEvents();
    const eventOptions = events.map(event => `
        <option value="${event}">${capitalizeFirst(event)}</option>
    `).join('');
    
    const types = getAllUniqueTypes();
    const typeOptions = types.map(type => `
        <label class="filter-checkbox">
            <input type="checkbox" 
                   name="type" 
                   value="${type}" 
                   class="filter-type">
            <span class="checkbox-text">
                ${getTypeIcon(type)} ${capitalizeFirst(type)}
            </span>
        </label>
    `).join('');
    
    const stones = getAllUniqueStones();
    const stoneOptions = stones.map(stone => `
        <label class="filter-checkbox">
            <input type="checkbox" 
                   name="stone" 
                   value="${stone}" 
                   class="filter-stone">
            <span class="checkbox-text">
                💎 ${capitalizeFirst(stone)}
            </span>
        </label>
    `).join('');
    
    const colors = getAllUniqueColors();
    const colorOptions = colors.map(color => `
        <label class="filter-checkbox">
            <input type="checkbox" 
                   name="color" 
                   value="${color}" 
                   class="filter-color">
            <span class="checkbox-text">
                <span class="color-dot ${color}"></span>
                ${capitalizeFirst(color)}
            </span>
        </label>
    `).join('');
    
    const filtersHTML = `
        <div class="filters-section">
            <!-- Titre principal -->
            <div class="filters-header">
                <h2>Filtrer la collection</h2>
            </div>
            
            <!-- FILTRE ÉVÉNEMENT (GROS - votre style) -->
            <div class="filter-bar">
                <label class="filter-label">Événement :</label>
                <select id="eventFilter" class="event-filter-select">
                    <option value="">Tous les événements</option>
                    ${eventOptions}
                </select>
            </div>
            
            <!-- AUTRES FILTRES (en ligne) -->
            <div class="additional-filters">
                <!-- Type de bijoux -->
                <div class="filter-group">
                    <h4>Type de bijou</h4>
                    <div class="filter-checkboxes">
                        ${typeOptions}
                    </div>
                </div>
                
                <!-- Type de pierres -->
                <div class="filter-group">
                    <h4>Type de pierres</h4>
                    <div class="filter-checkboxes">
                        ${stoneOptions}
                    </div>
                </div>
                
                <!-- Couleur de l'or -->
                <div class="filter-group">
                    <h4>Couleur de l'or</h4>
                    <div class="filter-checkboxes">
                        ${colorOptions}
                    </div>
                </div>
                
                <!-- Recherche texte -->
                <div class="filter-group search-group">
                    <h4>Recherche</h4>
                    <div class="search-container">
                        <input type="text" 
                               id="textSearch" 
                               placeholder="Rechercher par titre ou description..."
                               class="search-input">
                    </div>
                </div>
            </div>
            
            <!-- Bouton réinitialiser -->
            <div class="filter-actions">
                <button id="resetFilters" class="reset-filters-btn">
                    Réinitialiser les filtres
                </button>
            </div>
            
            <!-- Compteur de résultats -->
            <div id="productCount" class="product-counter"></div>
        </div>
    `;
    
    filtersContainer.innerHTML = filtersHTML;
    
    // Attacher les evenements
    attachFilterEvents();
}

// Initialiser votre filtre evenement existant
function initEventFilter(selectElement) {
    // Remplir les options
    const events = getAllUniqueEvents();
    events.forEach(event => {
        const option = createEl('option', '', capitalizeFirst(event));
        option.value = event;
        selectElement.appendChild(option);
    });
    
    // ecouter les changements
    selectElement.addEventListener('change', function() {
        const event = this.value;
        setEventFilter(event);
    });
    
    console.log('Filtre événement initialisé');
}

// ============================================
// GESTION DES FILTRES
// ============================================

function attachFilterEvents() {
    // Filtre evenement (select)
    const eventFilter = $('#eventFilter');
    if (eventFilter) {
        eventFilter.addEventListener('change', function() {
            setEventFilter(this.value);
        });
    }
    
    // Checkboxes type
    $$('.filter-type').forEach(cb => {
        cb.addEventListener('change', updateTypeFilter);
    });
    
    // Checkboxes pierre
    $$('.filter-stone').forEach(cb => {
        cb.addEventListener('change', updateStoneFilter);
    });
    
    // Checkboxes couleur
    $$('.filter-color').forEach(cb => {
        cb.addEventListener('change', updateColorFilter);
    });
    
    // Recherche texte
    const searchInput = $('#textSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(updateTextFilter, 300));
    }
    
    // Bouton reinitialiser
    const resetBtn = $('#resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAllFilters);
    }
}

function setEventFilter(event) {
    if (!window.state?.filters) return;
    
    window.state.filters.event = event || '';
    applyAllFilters();
    updateProductCount(window.state.filteredProducts?.length || 0);
}

function updateTypeFilter() {
    const selectedTypes = $$('.filter-type:checked')
        .map(cb => cb.value);
    
    if (window.state?.filters) {
        window.state.filters.types = selectedTypes;
    }
    
    applyAllFilters();
}

function updateStoneFilter() {
    const selectedStones = $$('.filter-stone:checked')
        .map(cb => cb.value);
    
    if (window.state?.filters) {
        window.state.filters.stones = selectedStones;
    }
    
    applyAllFilters();
}

function updateColorFilter() {
    const selectedColors = $$('.filter-color:checked')
        .map(cb => cb.value);
    
    if (window.state?.filters) {
        window.state.filters.colors = selectedColors;
    }
    
    applyAllFilters();
}

function updateTextFilter() {
    const searchText = $('#textSearch')?.value?.toLowerCase() || '';
    
    if (window.state?.filters) {
        window.state.filters.searchText = searchText;
    }
    
    applyAllFilters();
}

function applyAllFilters() {
    const products = window.state?.products || [];
    const filters = window.state?.filters || {};
    
    let filtered = [...products];
    
    // 1. Filtre evenement
    if (filters.event && filters.event !== '') {
        filtered = filtered.filter(p => 
            p.events && p.events.includes(filters.event)
        );
    }
    
    // 2. Filtre types
    if (filters.types && filters.types.length > 0) {
        filtered = filtered.filter(p => 
            filters.types.includes(p.type)
        );
    }
    
    // 3. Filtre pierres
    if (filters.stones && filters.stones.length > 0) {
        filtered = filtered.filter(p => 
            filters.stones.includes(p.stone_type)
        );
    }
    
    // 4. Filtre couleurs
    if (filters.colors && filters.colors.length > 0) {
        filtered = filtered.filter(p => 
            filters.colors.includes(p.metal_color)
        );
    }
    
    // 5. Filtre texte (titre ET description)
    if (filters.searchText && filters.searchText.trim() !== '') {
        const search = filters.searchText.toLowerCase();
        filtered = filtered.filter(p => 
            (p.title && p.title.toLowerCase().includes(search)) ||
            (p.name && p.name.toLowerCase().includes(search)) ||
            (p.description && p.description.toLowerCase().includes(search))
        );
    }
    
    // Mettre a jour l'etat
    if (window.state) {
        window.state.filteredProducts = filtered;
    }
    
    // Rafraichir l'affichage
    renderProducts();
    
    // Mettre a jour le compteur
    updateProductCount(filtered.length);
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

// Creer les badges d'evenements
function createEventBadges(events) {
    if (!events || events.length === 0) return '';
    
    // Limiter a 2 badges pour ne pas surcharger
    const displayEvents = events.slice(0, 2);
    
    return `
        <div class="event-badges">
            ${displayEvents.map(event => `
                <span class="event-badge" title="${capitalizeFirst(event)}">
                    ${getEventEmoji(event)}
                </span>
            `).join('')}
        </div>
    `;
}

// Obtenir l'emoji pour un evenement
function getEventEmoji(event) {
    const emojiMap = {
        'mariage': '💒',
        'anniversaire': '🎂',
        'naissance': '👶',
        'fete': '🎉',
        'noel': '🎄',
        'saint-valentin': '💝',
        'quotidien': '🌟'
    };
    
    return emojiMap[event] || '🎁';
}

// Obtenir l'icone pour un type de bijou
function getTypeIcon(type) {
    const iconMap = {
        'bague': '💍',
        'collier': '📿',
        'bracelet': '🪬',
        'boucles': '👂',
        'sautoir': '🧣',
        'pendentif': '🔗',
        'broche': '📍'
    };
    
    return iconMap[type] || '💎';
}

// Recuperer toutes les couleurs uniques
function getAllUniqueColors() {
    const products = window.state?.products || [];
    const colors = new Set();
    
    products.forEach(product => {
        if (product.metal_color) {
            colors.add(product.metal_color);
        }
    });
    
    // Assurer les 3 couleurs principales
    const allColors = Array.from(colors);
    if (!allColors.includes('jaune')) allColors.push('jaune');
    if (!allColors.includes('blanc')) allColors.push('blanc');
    if (!allColors.includes('rose')) allColors.push('rose');
    
    return allColors.sort();
}

// Recuperer tous les evenements uniques
function getAllUniqueEvents() {
    const products = window.state?.products || [];
    const events = new Set();
    
    products.forEach(product => {
        if (product.events && Array.isArray(product.events)) {
            product.events.forEach(event => {
                if (event && event.trim() !== '') {
                    events.add(event.trim());
                }
            });
        }
    });
    
    return Array.from(events).sort();
}

// Recuperer tous les types uniques
function getAllUniqueTypes() {
    const products = window.state?.products || [];
    const types = new Set();
    
    products.forEach(product => {
        if (product.type && product.type.trim() !== '') {
            types.add(product.type.trim());
        }
    });
    
    return Array.from(types).sort();
}

// Recuperer toutes les pierres uniques
function getAllUniqueStones() {
    const products = window.state?.products || [];
    const stones = new Set();
    
    products.forEach(product => {
        if (product.stone_type && 
            product.stone_type.trim() !== '' && 
            product.stone_type.toLowerCase() !== 'aucune') {
            stones.add(product.stone_type.trim());
        }
    });
    
    return Array.from(stones).sort();
}

// Reinitialiser tous les filtres
function resetAllFilters() {
    if (window.state?.filters) {
        window.state.filters = {
            event: '',
            types: [],
            stones: [],
            colors: [],
            searchText: ''
        };
    }
    
    // Reinitialiser l'UI
    const eventFilter = $('#eventFilter');
    if (eventFilter) eventFilter.value = '';
    
    $$('input[type="checkbox"]:checked').forEach(cb => cb.checked = false);
    
    const searchInput = $('#textSearch');
    if (searchInput) searchInput.value = '';
    
    applyAllFilters();
}

// Debounce pour la recherche
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Capitaliser la premiere lettre
function capitalizeFirst(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// ============================================
// FONCTIONS SUPPORT
// ============================================

function createProductsContainer() {
    const container = createEl('div', 'products-container');
    document.querySelector('main')?.appendChild(container);
    return container;
}

function createFiltersContainer() {
    const container = createEl('div', 'filters-container');
    document.querySelector('main')?.prepend(container);
    return container;
}

function showNoProductsMessage(container) {
    container.innerHTML = `
        <div class="no-products-message">
            <div class="no-products-content">
                <span class="no-products-icon">🔍</span>
                <h3>Aucun bijou trouvé</h3>
                <p>Essayez de modifier vos critères de recherche</p>
                <button class="reset-filters-btn" onclick="resetAllFilters()">
                    Réinitialiser les filtres
                </button>
            </div>
        </div>
    `;
}

function updateProductCount(count) {
    const counter = $('#productCount') || createProductCounter();
    if (counter) {
        counter.textContent = `${count} bijou${count !== 1 ? 'x' : ''} trouvé${count !== 1 ? 's' : ''}`;
        counter.style.display = 'block';
    }
}

function createProductCounter() {
    const counter = createEl('div', 'product-counter');
    const filtersContainer = $('#filters-container');
    if (filtersContainer) {
        filtersContainer.appendChild(counter);
        return counter;
    }
    return null;
}

function attachProductEvents() {
    // Delegation d'evenements pour la grille
    const grid = $('#products-container') || $('.products-grid');
    if (!grid) return;
    
    grid.addEventListener('click', (e) => {
        const target = e.target;
        const button = target.closest('button');
        
        if (!button) return;
        
        const productId = button.dataset.id;
        if (!productId) return;
        
        const product = window.state?.products?.find(p => p.id === productId);
        if (!product) return;
        
        // Bouton "Voir details"
        if (button.classList.contains('view-btn')) {
            e.preventDefault();
            openProductModal(product);
        }
        
        // Bouton "Ajouter au panier"
        if (button.classList.contains('add-to-cart-btn')) {
            e.preventDefault();
            // Ajouter avec taille par defaut
            addToCart(product, product.default_size || 'unique', 1);
            
            // Animation feedback
            button.classList.add('added');
            button.innerHTML = '✓ Ajouté';
            button.disabled = true;
            
            setTimeout(() => {
                button.classList.remove('added');
                button.innerHTML = '🛒 Ajouter';
                button.disabled = false;
            }, 1500);
        }
    });
}

// ============================================
// EXPORT
// ============================================

export { 
    initProductDisplay, 
    renderProducts, 
    updateProductDisplay,
    applyAllFilters,
    resetAllFilters 
};
