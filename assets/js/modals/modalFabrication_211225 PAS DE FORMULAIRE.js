// assets/js/modals/modalFabrication.js
// EV1 - Fabrication modal with fixed inline colors (no theme.js)

import { ModalBase } from './modalBase.js';

export class FabricationModal extends ModalBase {
    constructor() {
        super("fabrication-modal");
    }

    // Show fabrication modal
    showFabricationInfo(product) {

        const content = `
            <div style="
                background: #fffdf7;
                border-radius: 12px;
                padding: 25px;
                max-width: 600px;
                margin: 50px auto;
                border: 2px solid #a6784c;
                box-shadow: 0 5px 25px rgba(0,0,0,0.2);
                position: relative;
            ">

                <h2 style="
                    color: #a6784c;
                    text-align: center;
                    margin-bottom: 25px;
                    font-size: 1.6rem;
                    border-bottom: 2px solid #c8a97e;
                    padding-bottom: 10px;
                    font-weight: 700;
                ">
                    Fabrication sur mesure
                </h2>

                <div style="margin-bottom: 20px;">

                    <div style="
                        background: #ffffff;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        border-left: 4px solid #b18a60;
                    ">
                        <h3 style="color: #3d2b1f; margin-bottom: 8px;">Fabrication francaise</h3>
                        <p style="color: #5a4634; line-height: 1.5;">
                            Tous nos bijoux sont fabriques en France.
                        </p>
                    </div>

                    <div style="
                        background: #ffffff;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        border-left: 4px solid #c8a97e;
                    ">
                        <h3 style="color: #3d2b1f; margin-bottom: 8px;">Materiaux de qualite</h3>
                        <p style="color: #5a4634; line-height: 1.5;">
                            Or 18 carats, argent 925, pierres precieuses certifiees.
                        </p>
                    </div>

                    <div style="
                        background: #ffffff;
                        padding: 15px;
                        border-radius: 8px;
                        border-left: 4px solid #a6784c;
                    ">
                        <h3 style="color: #3d2b1f; margin-bottom: 8px;">Engagement ethique</h3>
                        <p style="color: #5a4634; line-height: 1.5;">
                            Or recycle, pierres ethique, emballages responsables.
                        </p>
                    </div>

                </div>

                <div style="
                    text-align: center;
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 1px dashed #eadfca;
                ">
                    <button id="fabricationCloseBtn" style="
                        padding: 12px 30px;
                        background: #b18a60;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                    ">
                        Fermer
                    </button>
                </div>

            </div>
        `;

        this.setContent(content, false);
        this.open();

        this.setupCloseButton();
    }

    // Close button binding
    setupCloseButton() {
        setTimeout(() => {
            const btn = document.getElementById("fabricationCloseBtn");
            if (!btn) return;

            const clone = btn.cloneNode(true);
            btn.parentNode.replaceChild(clone, btn);

            clone.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            });

            clone.addEventListener("mouseenter", () => {
                clone.style.background = "#a6784c";
                clone.style.transform = "translateY(-2px)";
            });

            clone.addEventListener("mouseleave", () => {
                clone.style.background = "#b18a60";
                clone.style.transform = "translateY(0)";
            });
        }, 80);
    }
}