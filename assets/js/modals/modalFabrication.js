// assets/js/modals/modalFabrication.js - VERSION FINALE CORRIGÉE

import { ModalBase } from './modalBase.js';

export class FabricationModal extends ModalBase {
    constructor() {
        super("fabrication-modal");
    }

    // Show fabrication modal
    showFabricationInfo(product = null) {
        console.log('Ouvrir modal fabrication pour:', product);

        // Données du produit
        const productId = product?.id || product?.ID || "";
        const productRef = product?.REFERENCE || product?.reference || product?.Ref || "—";
        const productName = product?.titleLabel || product?.title || product?.name || `Bijou ${productRef}`;
        
        const content = this.generateModalContent(productId, productRef, productName);
        
        // CORRECTION ICI : Appeler setContent() puis open()
        this.setContent(content);
        this.open();

        this.setupButtons();
    }

    // Générer le contenu HTML
    generateModalContent(productId, productRef, productName) {
        return `
            <div style="
                background: #fffdf7;
                border-radius: 12px;
                padding: 25px;
                max-width: 700px;
                margin: 0 auto;
                border: 2px solid #a6784c;
                box-shadow: 0 5px 25px rgba(0,0,0,0.2);
                position: relative;
            ">

                <h2 style="
                    color: #a6784c;
                    text-align: center;
                    margin-bottom: 25px;
                    font-size: 1.8rem;
                    border-bottom: 2px solid #c8a97e;
                    padding-bottom: 10px;
                    font-weight: 700;
                ">
                    ✨ Fabrication sur mesure : ${this.escapeHtml(productName)}
                </h2>

                <!-- Section Formulaire de personnalisation -->
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #3d2b1f; margin-bottom: 15px; font-size: 1.3rem;">
                        Personnalisez votre création
                    </h3>
                    
                    <form id="customizationForm" style="background: #ffffff; padding: 20px; border-radius: 8px;">
                        <input type="hidden" name="product_id" value="${productId}">
                        <input type="hidden" name="product_ref" value="${productRef}">
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; color: #5a4634; margin-bottom: 5px; font-weight: 600;">
                                Dimensions (mm)
                            </label>
                            <input type="text" 
                                   name="dimensions" 
                                   placeholder="ex: 45x30x15" 
                                   style="width: 100%; padding: 10px; border: 1px solid #c8a97e; border-radius: 5px;"
                                   required>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; color: #5a4634; margin-bottom: 5px; font-weight: 600;">
                                Matériau
                            </label>
                            <select name="material" 
                                    style="width: 100%; padding: 10px; border: 1px solid #c8a97e; border-radius: 5px;"
                                    required>
                                <option value="">Sélectionnez un matériau</option>
                                <option value="or_18k">Or 18 carats</option>
                                <option value="argent_925">Argent 925</option>
                                <option value="or_plaquee">Or plaqué or</option>
                                <option value="acier">Acier inoxydable</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; color: #5a4634; margin-bottom: 5px; font-weight: 600;">
                                Pierre principale
                            </label>
                            <select name="stone" 
                                    style="width: 100%; padding: 10px; border: 1px solid #c8a97e; border-radius: 5px;">
                                <option value="">Aucune pierre</option>
                                <option value="diamant">Diamant</option>
                                <option value="saphir">Saphir</option>
                                <option value="rubis">Rubis</option>
                                <option value="emeraude">Émeraude</option>
                                <option value="topaze">Topaze bleue</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; color: #5a4634; margin-bottom: 5px; font-weight: 600;">
                                Notes supplémentaires
                            </label>
                            <textarea name="notes" 
                                      rows="3" 
                                      placeholder="Précisions, exigences particulières, date souhaitée..."
                                      style="width: 100%; padding: 10px; border: 1px solid #c8a97e; border-radius: 5px;"></textarea>
                        </div>
                    </form>
                </div>

                <!-- Section Informations fabrication -->
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #3d2b1f; margin-bottom: 15px; font-size: 1.3rem;">
                        Notre savoir-faire
                    </h3>

                    <div style="
                        background: #ffffff;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        border-left: 4px solid #b18a60;
                    ">
                        <h4 style="color: #3d2b1f; margin-bottom: 8px;">🏭 Fabrication française</h4>
                        <p style="color: #5a4634; line-height: 1.5;">
                            Tous nos bijoux sont fabriqués en atelier en France, par des artisans joailliers expérimentés.
                        </p>
                    </div>

                    <div style="
                        background: #ffffff;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        border-left: 4px solid #c8a97e;
                    ">
                        <h4 style="color: #3d2b1f; margin-bottom: 8px;">💎 Matériaux de qualité</h4>
                        <p style="color: #5a4634; line-height: 1.5;">
                            Or 18 carats, argent 925, pierres précieuses certifiées. Traçabilité garantie.
                        </p>
                    </div>

                    <div style="
                        background: #ffffff;
                        padding: 15px;
                        border-radius: 8px;
                        border-left: 4px solid #a6784c;
                    ">
                        <h4 style="color: #3d2b1f; margin-bottom: 8px;">🌱 Engagement éthique</h4>
                        <p style="color: #5a4634; line-height: 1.5;">
                            Or recyclé, pierres éthiques, emballages responsables. Respect des normes environnementales.
                        </p>
                    </div>
                </div>

                <!-- Boutons d'action -->
                <div style="
                    display: flex;
                    justify-content: space-between;
                    gap: 15px;
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 1px dashed #eadfca;
                ">
                    <button id="fabricationCloseBtn" style="
                        flex: 1;
                        padding: 12px 20px;
                        background: #f5f5f5;
                        color: #5a4634;
                        border: 1px solid #c8a97e;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                    ">
                        Annuler
                    </button>
                    
                    <button id="submitCustomBtn" style="
                        flex: 2;
                        padding: 12px 20px;
                        background: #b18a60;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                    ">
                        ✨ Demander un devis personnalisé
                    </button>
                </div>

            </div>
        `;
    }

    // Échapper le HTML pour la sécurité
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Gestion des boutons
    setupButtons() {
        setTimeout(() => {
            // Bouton Fermer
            const closeBtn = document.getElementById("fabricationCloseBtn");
            if (closeBtn) {
                closeBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.close();
                });
            }

            // Bouton Soumettre
            const submitBtn = document.getElementById("submitCustomBtn");
            if (submitBtn) {
                submitBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    this.submitCustomization();
                });
            }
        }, 80);
    }

    // Soumission du formulaire
    submitCustomization() {
        const form = document.getElementById("customizationForm");
        if (!form) {
            console.error("Formulaire non trouvé");
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        console.log("Données de personnalisation:", data);
        
        // Ajoutez votre logique d'envoi ici
        alert("✅ Votre demande de devis personnalisé a été enregistrée.\nNous vous contacterons dans les 48h.");
        this.close();
    }
}