// assets/js/modals/modalBase.js
import { theme } from "../core/theme.js";

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

        this.init();
    }

    // -----------------------------
    // INIT
    // -----------------------------
    init() {

        if (!this.modal) {
            this.createModalStructure();
        }

        this.modalContent = this.modal.querySelector(".modal-content");
        this.closeBtn = this.modal.querySelector(".close-modal");

        this.applyModalStyles();
        this.initEvents();
    }

    // -----------------------------
    createModalStructure() {
        console.warn(`Modale absente : ${this.modalId} → création automatique.`);

        const html = `
            <div id="${this.modalId}" class="modal" style="display:none;">
                <div class="modal-content"></div>
                <button class="close-modal">×</button>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", html);
        this.modal = document.getElementById(this.modalId);
    }

    // -----------------------------
    applyModalStyles() {

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

    // -----------------------------
    initEvents() {

        if (this.closeBtn) {
            this.closeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.close();
            });
        }

        this.modal.addEventListener("click", (e) => {
            if (e.target === this.modal) this.close();
        });

        if (this.modalContent) {
            this.modalContent.addEventListener("click", (e) => e.stopPropagation());
        }

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.modal.style.display === "block")
                this.close();
        });
    }

    // -----------------------------
    open() {
        this.modal.style.display = "block";
        this.modal.style.opacity = "0";

        requestAnimationFrame(() => {
            this.modal.style.transition = "opacity 0.3s ease";
            this.modal.style.opacity = "1";
        });

        document.body.style.overflow = "hidden";
    }

    // -----------------------------
    close() {
        this.modal.style.opacity = "0";

        setTimeout(() => {
            this.modal.style.display = "none";
            document.body.style.overflow = "auto";
        }, 250);
    }

    // -----------------------------
    setContent(html) {
        if (this.modalContent) {
            this.modalContent.innerHTML = html;
        }
    }
}
