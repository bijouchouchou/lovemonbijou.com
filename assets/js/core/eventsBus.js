// assets/js/core/eventsBus.js
/**
 * BUS D'ÉVÉNEMENTS CENTRAL - SINGLETON
 * Communication entre tous les modules sans couplage
 */
class EventsBus {
    constructor() {
        // Événements enregistrés : { eventName: [callbacks] }
        this.events = new Map();
        
        // Debug mode
        this.debug = true;
        
        // Historique pour debugging
        this.history = [];
        this.maxHistory = 50;
    }

    /**
     * Écouter un événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction à exécuter
     * @param {string} module - Nom du module (pour debug)
     */
    on(event, callback, module = 'unknown') {
        // Validation des paramètres
        if (typeof event !== 'string' || event.trim() === '') {
            console.error('[EventsBus] Tentative d\'écoute avec event invalide :', event);
            return;
        }

        if (typeof callback !== 'function') {
            console.error('[EventsBus] Callback invalide pour event :', event);
            return;
        }

        // Initialiser le tableau de callbacks si nécessaire
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        // Créer un wrapper pour inclure les métadonnées
        const wrapper = (data) => {
            if (this.debug) {
                console.log(`🎯 [${module}] reçoit ${event}:`, data);
            }
            callback(data);
        };
        
        // Ajouter des métadonnées au wrapper
        wrapper._original = callback;
        wrapper._module = module;
        
        // Enregistrer le callback
        this.events.get(event).push(wrapper);
        
        if (this.debug) {
            console.log(`👂 [${module}] écoute ${event}`);
        }
    }

    /**
     * Émettre un événement
     * @param {string} event - Nom de l'événement
     * @param {any} data - Données à passer
     * @param {string} source - Source de l'événement (pour debug)
     */
    emit(event, data = {}, source = 'unknown') {
  // 🔒 GARDE-FOU CRITIQUE (NE JAMAIS SUPPRIMER)
  if (!event || typeof event !== "string") {
    console.error("🚨 EVENT INVALIDE BLOQUÉ", {
      event,
      data,
      source,
      stack: new Error().stack
    });
    return;
  }

  if (this.debug) {
    console.log(`📢 [${source}] émet ${event}:`, data);
    this.addToHistory?.(event, data, source);
  }

  if (!this.events.has(event)) return;

  // Copie défensive
  const callbacks = [...this.events.get(event)];

  for (const callback of callbacks) {
    try {
      callback(data);
    } catch (error) {
      console.error(
        `❌ Erreur callback "${event}" (${callback._module || "unknown"})`,
        error
      );
    }
  }
}

        // Mode debug
        if (this.debug) {
            console.log(`📢 [${source}] émet ${event}:`, data);
            if (typeof this.addToHistory === 'function') {
                this.addToHistory(event, data, source);
            }
        }

        // Exécution des callbacks
        if (this.events && this.events.has(event)) {
            const callbacks = this.events.get(event);
            // Copie pour éviter les modifications pendant l'exécution
            [...callbacks].forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`❌ Erreur callback ${event}`, err);
                    // Ajouter plus d'informations si disponibles
                    if (callback._module) {
                        console.error(`  Module: ${callback._module}`);
                    }
                }
            });
        }
    }

    /**
     * Supprimer un écouteur
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Callback à supprimer
     */
    off(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            const index = callbacks.findIndex(cb => 
                cb._original === callback || cb === callback
            );
            
            if (index > -1) {
                const removed = callbacks.splice(index, 1)[0];
                if (this.debug) {
                    console.log(`👋 Supprimé écouteur ${event} de ${removed._module}`);
                }
            }
        }
    }

    /**
     * Écouter une fois seulement
     */
    once(event, callback, module = 'unknown') {
        // Validation des paramètres (pour cohérence)
        if (typeof event !== 'string' || event.trim() === '') {
            console.error('[EventsBus] Tentative d\'écoute (once) avec event invalide :', event);
            return;
        }

        if (typeof callback !== 'function') {
            console.error('[EventsBus] Callback invalide pour event (once) :', event);
            return;
        }

        // Créer un wrapper qui se supprime après une exécution
        const wrapper = (data) => {
            this.off(event, wrapper);
            if (this.debug) {
                console.log(`🎯 [${module}] reçoit ${event} (once):`, data);
            }
            callback(data);
        };
        
        // Ajouter des métadonnées
        wrapper._original = callback;
        wrapper._module = module;
        
        // Enregistrer le wrapper
        this.on(event, wrapper, module);
    }

    /**
     * Ajouter à l'historique pour debug
     */
    addToHistory(event, data, source) {
        this.history.unshift({
            timestamp: new Date().toISOString(),
            event,
            source,
            data: JSON.parse(JSON.stringify(data)) // Deep clone simple
        });
        
        // Limiter la taille de l'historique
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
    }

    /**
     * Afficher l'historique des événements
     */
    showHistory() {
        console.group('📜 Historique des événements');
        this.history.forEach((item, index) => {
            console.log(`${index + 1}. [${item.timestamp.split('T')[1].slice(0,8)}] ${item.source} → ${item.event}:`, item.data);
        });
        console.groupEnd();
    }

    /**
     * Vérifier qui écoute un événement
     */
    getListeners(event) {
        if (!this.events.has(event)) return [];
        return this.events.get(event).map(cb => ({
            module: cb._module,
            callback: cb._original
        }));
    }

    /**
     * Nettoyer tous les écouteurs
     */
    clearAll() {
        this.events.clear();
        this.history = [];
        console.log('🧹 Tous les écouteurs ont été nettoyés');
    }
}

// Singleton global
export const eventsBus = new EventsBus();

// Événements standards définis
export const EVENTS = {
    // --- Cart ---
    CART_INITIALIZED: 'cart:initialized',
    CART_UPDATED: 'cart:updated',
    CART_ERROR: 'cart:error',
    CART_COUNT_UPDATED: 'cart:countUpdated',

    CART_ITEM_ADDED: 'cart:itemAdded',
    CART_ITEM_UPDATED: 'cart:itemUpdated',
    CART_ITEM_REMOVED: 'cart:itemRemoved',
    CART_QUANTITY_CHANGE: 'cart:quantityChange',
    CART_CLEAR_REQUEST: 'cart:clearRequest',
    CART_CLEARED: 'cart:cleared',

    CART_GET_STATE: 'cart:getState',
    CART_STATE_RESPONSE: 'cart:stateResponse',

    // --- Products ---
    PRODUCT_ADD_TO_CART: 'product:addToCart',
    PRODUCT_VIEWED: 'product:viewed',

    // --- Customer ---
    CUSTOMER_EMAIL_UPDATE: 'customer:emailUpdate',
    CUSTOMER_EMAIL_CHANGED: 'customer:emailChanged',
    CART_CLEAR_REQUEST: "cart:clearRequest",
    CART_CLEAR_REQUEST: "cart:clearRequest",
    CUSTOMER_DATA_CLEARED: 'customer:dataCleared',

    // --- Discount ---
    DISCOUNT_APPLY: 'discount:apply',
    DISCOUNT_APPLIED: 'discount:applied',
    DISCOUNT_REMOVE: 'discount:remove',
    DISCOUNT_REMOVED: 'discount:removed',

    // --- Filters ---
    FILTERS_CHANGED: 'filters:changed',

    // --- UI ---
    MODAL_OPENED: 'modal:opened',
    MODAL_CLOSED: 'modal:closed'
};

// DEBUG DEV ONLY
if (typeof window !== "undefined") {
    window.eventsBus = eventsBus;
    window.EVENTS = EVENTS;
}