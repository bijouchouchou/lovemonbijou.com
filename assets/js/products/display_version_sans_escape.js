// ============================================
// AFFICHAGE DES BIJOUX ET FILTRES
// AdaptE aux classes CSS de votre style.css
// ============================================

// ============================================
// FONCTIONS LOCALES POUR REMPLACER LES IMPORTS
// ============================================

// 1. Selecteurs DOM simples
function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function createEl(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
}

// 2. Formatage prix (identique a votre CSV)
function formatPrice(price) {
    const num = parseFloat(price) || 0;
    return num.toFixed(2).replace('.', ',') + '€';
}

// 3. Securite texte (DeJa EXISTANTE - ne creez pas en double)
// function safeText(text) { ... } // ← NE RECReEZ PAS SI ELLE EXISTE DeJa

// 4. Modal produit (simplifiee)
function openProductModal(product) {
    console.log('Ouvrir modal pour:', product.reference);
    alert(`Details produit: ${product.titre || product.reference}\nPrix: ${product.price_euros}€`);
}

// 5. Panier (simplifie)
function addToCart(productId, quantity = 1) {
    console.log(`Ajouter au panier: ${productId} x${quantity}`);
    
    // Animation feedback
    const event = new CustomEvent('cartAdd', { 
        detail: { productId, quantity } 
    });
    window.dispatchEvent(event);
    
    alert(`Produit ${productId} ajoute au panier`);
}

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
        console.warn('Aucun conteneur pour les produits trouvE');
        return;
    }
    
    // Appliquer vos classes CSS
    container.className = 'products-grid';
    
    // Initialiser les filtres AVEC VOTRE STYLE
    initAllFilters();
    
    // Afficher les produits
    renderProducts();
    
    // Ecouter les changements d'Etat
    window.addEventListener('filteredProductsUpdated', renderProducts);
    window.addEventListener('productsLoaded', renderProducts);
    
    console.log('✅ Affichage produits initialisE');
}
// Fonction utilitaire simple pour votre CSV
function safeText(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// SElecteur DOM simple
function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
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
    
    // Attacher les EvEnements
    attachProductEvents();
    
    // Mettre a jour le compteur
    updateProductCount(products.length);
}


// ============================================
// FONCTION PRINCIPALE : CREATION CARTE PRODUIT
// ============================================
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const ref = product.reference || '';
    const titre = product.titre || 'Bijou';
    const prix = product.price_euros || '0';
    const type = product.type_de_bijoux || '';
    const stock = parseInt(product.stock || 0);
    const desc = product.description || '';
    
    const imageUrl = ref ? 
        `https://res.cloudinary.com/dcak9pjrt/image/upload/v1761920568/${ref}.png` :
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNjY2MiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CaWpvdTwvdGV4dD48L3N2Zz4=';
    
    card.innerHTML = `
        <div class="product-card-inner">
            <div class="product-image-container">
                <img src="${imageUrl}" 
                     alt="${safeText(titre)}"
                     class="product-image"
                     loading="lazy">
            </div>
            
            <div class="product-info">
                <div class="product-header">
                    <h3 class="product-name">${safeText(titre)}</h3>
                    <div class="product-reference">${ref}</div>
                </div>
                
                ${type ? `<div class="product-type">${safeText(type)}</div>` : ''}
                
                ${desc ? `<p class="product-description">${safeText(desc.substring(0, 80))}${desc.length > 80 ? '...' : ''}</p>` : ''}
                
                <div class="product-price">${safeText(prix)}€</div>
                
                <div class="product-stock ${stock > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${stock > 0 ? 'En stock' : 'Rupture'}
                </div>
                
                <div class="product-actions">
                    <button class="view-btn" data-ref="${ref}">Voir</button>
                    ${stock > 0 ? 
                        `<button class="add-to-cart-btn" data-ref="${ref}">Ajouter</button>` :
                        `<button class="add-to-cart-btn" disabled>Indisponible</button>`
                    }
                </div>
            </div>
        </div>
    `;
    
    return card;
}
// ============================================
// FONCTION D'AFFICHAGE PRINCIPALE (SIMPLE)
// ============================================

export function displayProducts(products, container) {
    console.log('🎨 Affichage de', products.length, 'produits');
    
    if (!container) {
        console.error('❌ Conteneur manquant');
        return;
    }
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="no-products-message">
                <p>Aucun produit disponible</p>
            </div>
        `;
        return;
    }
    
    // VIDER ET PRePARER
    container.innerHTML = '';
    container.className = 'products-grid';
    
    // AJOUTER LES CARTES
    products.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
    
    // COMPTEUR
    const counter = document.createElement('div');
    counter.className = 'product-counter';
    counter.textContent = `${products.length} bijoux disponibles`;
    container.parentNode.insertBefore(counter, container.nextSibling);
    
    console.log('✅ Produits affich es avec succès');
}
// ============================================
// FILTRES AVANCES AVEC VOTRE STYLE
// ============================================

function initAllFilters() {
    // VErifier si on a dEja un filtre d'EvEnement (votre style)
    const existingFilter = $('#eventFilter');
    if (existingFilter) {
        // Utiliser votre filtre existant
        initEventFilter(existingFilter);
        return;
    }
    
    // Sinon crEer tous les filtres
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
            
            <!-- FILTRE EVENEMENT (GROS - votre style) -->
            <div class="filter-bar">
                <label class="filter-label">EvEnement :</label>
                <select id="eventFilter" class="event-filter-select">
                    <option value="">Tous les EvEnements</option>
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
            
            <!-- Bouton rEinitialiser -->
            <div class="filter-actions">
                <button id="resetFilters" class="reset-filters-btn">
                    REinitialiser les filtres
                </button>
            </div>
            
            <!-- Compteur de rEsultats -->
            <div id="productCount" class="product-counter"></div>
        </div>
    `;
    
    filtersContainer.innerHTML = filtersHTML;
    
    // Attacher les EvEnements
    attachFilterEvents();
}

// Initialiser votre filtre EvEnement existant
function initEventFilter(selectElement) {
    // Remplir les options
    const events = getAllUniqueEvents();
    events.forEach(event => {
        const option = createEl('option', '', capitalizeFirst(event));
        option.value = event;
        selectElement.appendChild(option);
    });
    
    // Ecouter les changements
    selectElement.addEventListener('change', function() {
        const event = this.value;
        setEventFilter(event);
    });
    
    console.log('Filtre EvEnement initialisE');
}

// ============================================
// GESTION DES FILTRES
// ============================================

function attachFilterEvents() {
    // Filtre EvEnement (select)
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
    
    // Bouton rEinitialiser
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
    
    // 1. Filtre EvEnement
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
    
    // Mettre a jour l'Etat
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

// CrEer les badges d'EvEnements
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

// Obtenir l'emoji pour un EvEnement
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
    
    return emojiMap[event] || '';
}

// Obtenir l'icone pour un type de bijou
function getTypeIcon(type) {
    const iconMap = {
        'bague': '',
        'collier': '',
        'bracelet': '',
        'boucles': '',
        'sautoir': '',
        'pendentif': '',
        'broche': ''
    };
    
    return iconMap[type] || '💎';
}

// REcupErer toutes les couleurs uniques
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

// REcupErer tous les EvEnements uniques
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

// REcupErer tous les types uniques
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

// REcupErer toutes les pierres uniques
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

// REinitialiser tous les filtres
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
    
    // REinitialiser l'UI
    const eventFilter = $('#eventFilter');
    if (eventFilter) eventFilter.value = '';
    
    $$('input[type="checkbox"]:checked').forEach(cb => cb.checked = false);
    
    const searchInput = $('#textSearch');
    if (searchInput) searchInput.value = '';
    
    applyAllFilters();
}

// DEbounce pour la recherche
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
                <h3>Aucun bijou trouvE</h3>
                <p>Essayez de modifier vos critères de recherche</p>
                <button class="reset-filters-btn" onclick="resetAllFilters()">
                    REinitialiser les filtres
                </button>
            </div>
        </div>
    `;
}

function updateProductCount(count) {
    const counter = $('#productCount') || createProductCounter();
    if (counter) {
        counter.textContent = `${count} bijou${count !== 1 ? 'x' : ''} trouvE${count !== 1 ? 's' : ''}`;
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
    // DElEgation d'EvEnements pour la grille
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
        
        // Bouton "Voir dEtails"
        if (button.classList.contains('view-btn')) {
            e.preventDefault();
            openProductModal(product);
        }
        
        // Bouton "Ajouter au panier"
        if (button.classList.contains('add-to-cart-btn')) {
            e.preventDefault();
            // Ajouter avec taille par dEfaut
            addToCart(product, product.default_size || 'unique', 1);
            
            // Animation feedback
            button.classList.add('added');
            button.innerHTML = '✓ AjoutE';
            button.disabled = true;
            
            setTimeout(() => {
                button.classList.remove('added');
                button.innerHTML = '  Ajouter';
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
