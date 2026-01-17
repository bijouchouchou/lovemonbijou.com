// assets/js/modals/modalBase.js
import { theme } from "../core/theme.js";

/**
 * Gestion globale : UNE SEULE modale active
 */
let activeModal = null;

/**
 * Listener ESC UNIQUE (global)
 */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && activeModal) {
    activeModal.close();
  }
});

export class ModalBase {
  constructor(modalId, options = {}) {
    this.modalId = modalId;
    this.modal = document.getElementById(modalId);

    this.options = {
      bgColor: theme.cream.light,
      borderColor: theme.gold.medium,
      textColor: theme.brown.dark,
      closeColor: theme.brown.light,
      ...options
    };

    this.isOpen = false;

    this.init();
  }

  /* ============================
     INIT
  ============================ */
  init() {
    if (!this.modal) {
      this.createModalStructure();
    }

    this.modalContent = this.modal.querySelector(".modal-content");
    this.closeBtn = this.modal.querySelector(".close-modal");

    this.applyStyles();
    this.bindEvents();
  }

  /* ============================
     STRUCTURE
  ============================ */
  createModalStructure() {
    const html = `
      <div id="${this.modalId}" class="modal" style="display:none;">
        <div class="modal-content"></div>
        <button class="close-modal" aria-label="Fermer">×</button>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);
    this.modal = document.getElementById(this.modalId);
  }

  /* ============================
     STYLES
  ============================ */
  applyStyles() {
    if (!this.modal) return;

    this.modal.style.background = this.options.bgColor;
    this.modal.style.color = this.options.textColor;

    if (this.closeBtn) {
      this.closeBtn.style.color = this.options.closeColor;

      this.closeBtn.addEventListener("mouseenter", () => {
        this.closeBtn.style.color = theme.gold.medium;
      });

      this.closeBtn.addEventListener("mouseleave", () => {
        this.closeBtn.style.color = this.options.closeColor;
      });
    }
  }

  /* ============================
     EVENTS
  ============================ */
  bindEvents() {
    if (!this.modal) return;

    // Bouton fermeture
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    // Click sur overlay
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Stop propagation contenu
    if (this.modalContent) {
      this.modalContent.addEventListener("click", (e) =>
        e.stopPropagation()
      );
    }
  }

  /* ============================
     OPEN
  ============================ */
  open() {
    if (this.isOpen) return;

    // Fermer toute autre modale
    if (activeModal && activeModal !== this) {
      activeModal.close(true);
    }

    activeModal = this;
    this.isOpen = true;

    this.modal.style.display = "block";
    this.modal.style.opacity = "0";

    requestAnimationFrame(() => {
      this.modal.style.transition = "opacity 0.3s ease";
      this.modal.style.opacity = "1";
    });

    document.body.style.overflow = "hidden";
  }

  /* ============================
     CLOSE
  ============================ */
  close(force = false) {
    if (!this.isOpen) return;

    this.isOpen = false;

    this.modal.style.opacity = "0";

    setTimeout(() => {
      this.modal.style.display = "none";

      if (activeModal === this || force) {
        activeModal = null;
        document.body.style.overflow = "auto";
      }
    }, 250);
  }

  /* ============================
     CONTENT
  ============================ */
  setContent(html) {
    if (this.modalContent) {
      this.modalContent.innerHTML = html;
    }
  }
}
