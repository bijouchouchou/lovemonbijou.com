// assets/js/modals/modalBase.js
// Base class for all modals (product, fabrication, etc.)

import { theme } from '../core/theme.js';

export class ModalBase {
    constructor(modalId, options = {}) {
        // Id of the modal overlay element in HTML
        this.modalId = modalId;

        // Root DOM element (overlay)
        this.modal = document.getElementById(modalId);

        // Options with theme defaults
        this.options = {
            bgColor: theme.cream.light,
            borderColor: theme.gold.medium,
            textColor: theme.brown.dark,
            closeColor: theme.brown.light,
            ...options
        };

        // Internal refs
        this.modalContent = null;
        this.closeBtn = null;
        this._handleEsc = this._handleEsc.bind(this);

        this.init();
    }

    // Initialize modal: ensure structure, cache elements, bind events
    init() {
        if (!this.modal) {
            this.createModalStructure();
        }

        this.modalContent = this.modal.querySelector('.modal-content');
        this.closeBtn = this.modal.querySelector('.close-modal');

        this.applyModalStyles();
        this.initEvents();
    }

    // Create a basic modal structure if not present in HTML
    createModalStructure() {
        console.warn(
            'ModalBase: modal with id "' +
            this.modalId +
            '" not found in HTML. A basic structure will be created.'
        );

        const modalHTML = `
            <div id="${this.modalId}" class="modal-overlay" style="
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.25s ease;
            ">
                <div class="modal-content" style="
                    position: relative;
                    margin: 40px auto;
                    max-width: 900px;
                    background: ${this.options.bgColor};
                    border-radius: 12px;
                    border: 1px solid ${this.options.borderColor};
                    padding: 20px;
                    box-shadow: 0 10px 30px ${theme.shadow.medium};
                ">
                    <!-- dynamic content -->
                </div>
                <button class="close-modal" style="
                    position: absolute;
                    top: 12px;
                    right: 16px;
                    background: none;
                    border: none;
                    font-size: 2rem;
                    line-height: 1;
                    cursor: pointer;
                    color: ${this.options.closeColor};
                ">
                    ×
                </button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById(this.modalId);
    }

    // Apply minimal style logic (main styling should be in CSS files)
    applyModalStyles() {
        if (!this.modal) return;

        // Root overlay base styles (can be refined by CSS)
        this.modal.style.display = 'none';
        this.modal.style.opacity = '0';
        this.modal.style.position = 'fixed';
        this.modal.style.inset = '0';
        this.modal.style.background = 'rgba(0,0,0,0.55)';
        this.modal.style.zIndex = '10000';
        this.modal.style.transition = 'opacity 0.25s ease';

        if (this.modalContent) {
            this.modalContent.style.position = 'relative';
            this.modalContent.style.margin = '40px auto';
            this.modalContent.style.maxWidth = '900px';
            this.modalContent.style.background = this.options.bgColor;
            this.modalContent.style.color = this.options.textColor;
            this.modalContent.style.borderRadius = '14px';
            this.modalContent.style.border = '1px solid ' + this.options.borderColor;
            this.modalContent.style.boxShadow = '0 14px 40px ' + theme.shadow.medium;
        }

        // Close button hover behavior
        if (this.closeBtn) {
            this.closeBtn.style.cursor = 'pointer';
            this.closeBtn.style.color = this.options.closeColor;
            this.closeBtn.style.transition = 'color 0.2s ease, transform 0.2s ease';

            this.closeBtn.addEventListener('mouseenter', () => {
                this.closeBtn.style.color = theme.gold.medium;
                this.closeBtn.style.transform = 'scale(1.1)';
            });

            this.closeBtn.addEventListener('mouseleave', () => {
                this.closeBtn.style.color = this.options.closeColor;
                this.closeBtn.style.transform = 'scale(1)';
            });
        }
    }

    // Setup core events: close button, overlay click, escape key
    initEvents() {
        if (!this.modal) return;

        // Close button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            });
        }

        // Click on overlay should close (but not on modal content)
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                // Clicked on overlay (outside of modal content)
                this.close();
            }
        });

        // Prevent clicks inside content from closing or bubbling
        if (this.modalContent) {
            this.modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Close with ESC key
        document.addEventListener('keydown', this._handleEsc);
    }

    // ESC key handler
    _handleEsc(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (this.modal && this.modal.style.display === 'block') {
                this.close();
            }
        }
    }

    // Open the modal with fade in
    open() {
        if (!this.modal) return;

        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Force reflow to trigger transition
        void this.modal.offsetWidth;
        this.modal.style.opacity = '1';
    }

    // Close the modal with fade out
    close() {
        if (!this.modal) return;

        this.modal.style.opacity = '0';

        // Wait for transition, then hide
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 250);
    }

    // Set inner HTML content of modal
    // preventPropagation: if true, attaches stopPropagation to all inner elements
    setContent(content, preventPropagation = true) {
        if (!this.modalContent) return;

        this.modalContent.innerHTML = content;

        if (preventPropagation) {
            setTimeout(() => {
                const allElements = this.modalContent.querySelectorAll('*');
                allElements.forEach((el) => {
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });
                });
            }, 50);
        }
    }

    // Destroy listeners if needed (for advanced cases)
    destroy() {
        if (!this.modal) return;

        document.removeEventListener('keydown', this._handleEsc);
    }
}
