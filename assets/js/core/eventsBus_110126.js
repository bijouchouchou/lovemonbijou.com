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
        // CORRECTIF APPLIQUÉ ICI
        if (typeof event !== 'string' || event.trim() === '') {
            console.error('[EventsBus] Tentative d\'écoute avec event invalide :', event);
            return;
        }

        if (typeof callback !== 'function') {
            console.error('[EventsBus] Callback invalide pour event :', event);
            return;
        }

        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        const wrapper = (data) => {
            if (this.debug) {
                console.log(`🎯 [${module}] reçoit ${event}:`, data);
            }
            callback(data);
        };
        
        wrapper._original = callback;
        wrapper._module = module;
        
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
        if (this.debug) {
            console.log(`📢 [${source}] émet ${event}:`, data);
            this.addToHistory(event, data, source);
        }

        if (this.events.has(event)) {
            // Copie pour éviter modifications pendant l'exécution
            const callbacks = [...this.events.get(event)];
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Erreur dans callback ${event} de ${callback._module}:`, error);
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
        // CORRECTIF APPLIQUÉ ICI AUSSI (pour cohérence)
        if (typeof event !== 'string' || event.trim() === '') {
            console.error('[EventsBus] Tentative d\'écoute (once) avec event invalide :', event);
            return;
        }

        if (typeof callback !== 'function') {
            console.error('[EventsBus] Callback invalide pour event (once) :', event);
            return;
        }

        const wrapper = (data) => {
            this.off(event, wrapper);
            if (this.debug) {
                console.log(`🎯 [${module}] reçoit ${event} (once):`, data);
            }
            callback(data);
        };
        
        wrapper._original = callback;
        wrapper._module = module;
        
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
  CART_CLEARED: 'cart:cleared',

  CART_GET_STATE: 'cart:getState',
  CART_STATE_RESPONSE: 'cart:stateResponse',

  // --- Products ---
  PRODUCT_ADD_TO_CART: 'product:addToCart',
  PRODUCT_VIEWED: 'product:viewed',

  // --- Customer ---
  CUSTOMER_EMAIL_UPDATE: 'customer:emailUpdate',
  CUSTOMER_EMAIL_CHANGED: 'customer:emailChanged',
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