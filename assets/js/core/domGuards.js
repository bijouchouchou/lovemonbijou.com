/**
 * core/domGuards.js
 * ------------------------------------------------------
 * GARDE-FOU DOM CENTRAL
 *
 * Objectifs :
 * - empêcher les injections DOM multiples
 * - empêcher les listeners dupliqués
 * - détecter les éléments fixed bloquants
 * - fournir une API SAFE pour créer / détruire l’UI
 *
 * Ce fichier NE FAIT PAS d’UI.
 * Il protège le DOM.
 * ------------------------------------------------------
 */

class DomGuards {
  constructor() {
    /**
     * Registre des éléments DOM contrôlés
     * key -> HTMLElement
     */
    this.domRegistry = new Map();

    /**
     * Registre des listeners
     * key -> { element, type, handler }
     */
    this.listenerRegistry = new Map();

    /**
     * Mode debug
     */
    this.debug = true;
  }

  /* ======================================================
     DOM REGISTRY
  ====================================================== */

  /**
   * Enregistrer un élément DOM de façon unique
   * @param {string} key - identifiant logique (ex: 'productsCounter')
   * @param {HTMLElement} element
   */
  registerElement(key, element) {
    if (!key || !element) return element;

    if (this.domRegistry.has(key)) {
      const existing = this.domRegistry.get(key);

      if (existing && existing !== element) {
        if (this.debug) {
          console.warn(`[DomGuards] Élément déjà enregistré → suppression de l'ancien : ${key}`);
        }
        existing.remove();
      }
    }

    this.domRegistry.set(key, element);

    if (this.debug) {
      console.log(`[DomGuards] Élément enregistré : ${key}`);
    }

    return element;
  }

  /**
   * Vérifier si un élément est déjà enregistré
   */
  hasElement(key) {
    return this.domRegistry.has(key);
  }

  /**
   * Récupérer un élément enregistré
   */
  getElement(key) {
    return this.domRegistry.get(key) || null;
  }

  /**
   * Supprimer proprement un élément DOM
   */
  removeElement(key) {
    const el = this.domRegistry.get(key);
    if (el) {
      el.remove();
      this.domRegistry.delete(key);

      if (this.debug) {
        console.log(`[DomGuards] Élément supprimé : ${key}`);
      }
    }
  }

  /**
   * Nettoyer tous les éléments enregistrés
   */
  clearAllElements() {
    this.domRegistry.forEach((el, key) => {
      try {
        el.remove();
      } catch (e) {}
      if (this.debug) {
        console.log(`[DomGuards] Élément nettoyé : ${key}`);
      }
    });
    this.domRegistry.clear();
  }

  /* ======================================================
     LISTENER REGISTRY
  ====================================================== */

  /**
   * Ajouter un listener en mode SAFE (pas de duplication)
   */
  addListener(key, element, type, handler, options = false) {
    if (!key || !element || !type || !handler) return;

    if (this.listenerRegistry.has(key)) {
      const old = this.listenerRegistry.get(key);
      old.element.removeEventListener(old.type, old.handler, old.options);

      if (this.debug) {
        console.warn(`[DomGuards] Listener remplacé : ${key}`);
      }
    }

    element.addEventListener(type, handler, options);
    this.listenerRegistry.set(key, { element, type, handler, options });

    if (this.debug) {
      console.log(`[DomGuards] Listener ajouté : ${key}`);
    }
  }

  /**
   * Supprimer un listener
   */
  removeListener(key) {
    const item = this.listenerRegistry.get(key);
    if (!item) return;

    item.element.removeEventListener(item.type, item.handler, item.options);
    this.listenerRegistry.delete(key);

    if (this.debug) {
      console.log(`[DomGuards] Listener supprimé : ${key}`);
    }
  }

  /**
   * Nettoyer tous les listeners
   */
  clearAllListeners() {
    this.listenerRegistry.forEach((item, key) => {
      try {
        item.element.removeEventListener(item.type, item.handler, item.options);
      } catch (e) {}
      if (this.debug) {
        console.log(`[DomGuards] Listener nettoyé : ${key}`);
      }
    });
    this.listenerRegistry.clear();
  }

  /* ======================================================
     FIXED ELEMENTS GUARD
  ====================================================== */

  /**
   * Détecter les éléments position: fixed dangereux
   * (ceux qui bloquent les modales / clics)
   */
  scanFixedElements(minWidth = 100) {
    const all = [...document.querySelectorAll('*')];

    const fixed = all.filter(el => {
      const style = getComputedStyle(el);
      return (
        style.position === 'fixed' &&
        el.offsetWidth > minWidth &&
        el.offsetHeight > 20 &&
        style.pointerEvents !== 'none' &&
        style.visibility !== 'hidden'
      );
    });

    if (this.debug) {
      console.group('[DomGuards] Éléments fixed détectés');
      fixed.forEach(el => console.log(el));
      console.groupEnd();
    }

    return fixed;
  }

  /**
   * Neutraliser temporairement les fixed non autorisés
   */
  disableForeignFixed(allowedKeys = []) {
    const fixed = this.scanFixedElements();

    fixed.forEach(el => {
      const isAllowed = [...this.domRegistry.values()].includes(el);
      if (!isAllowed) {
        el.dataset.domGuardsDisabled = 'true';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '0';

        if (this.debug) {
          console.warn('[DomGuards] Fixed neutralisé', el);
        }
      }
    });
  }

  /* ======================================================
     DEBUG
  ====================================================== */

  dump() {
    console.group('🧠 DomGuards State');
    console.log('Elements:', [...this.domRegistry.keys()]);
    console.log('Listeners:', [...this.listenerRegistry.keys()]);
    console.groupEnd();
  }

  reset() {
    this.clearAllListeners();
    this.clearAllElements();
    if (this.debug) {
      console.log('🧹 DomGuards réinitialisé');
    }
  }
}

/* ======================================================
   SINGLETON
====================================================== */

export const domGuards = new DomGuards();
// === API PUBLIQUE DOM GUARDS ===

export function ensureSingleElement(key, el) {
  return domGuards.ensureSingleElement(key, el);
}

export function ensureSingleListener(key, el, type, handler, options) {
  return domGuards.ensureSingleListener(key, el, type, handler, options);
}

export function cleanupElement(key) {
  return domGuards.cleanupElement(key);
}

export function cleanupListener(key) {
  return domGuards.cleanupListener(key);
}

export function resetDomGuards() {
  return domGuards.reset();
}
