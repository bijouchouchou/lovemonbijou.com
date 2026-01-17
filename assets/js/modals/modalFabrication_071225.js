// assets/js/modals/modalFabrication.js - VERSION AVEC BOUTON PROPRE
import { ModalBase } from './modalBase.js';
import { theme } from '../core/theme.js';

export class FabricationModal extends ModalBase {
    constructor(modalId = 'fabricationModal') {
        super(modalId, {
            bgColor: theme.cream.medium,
            borderColor: theme.gold.dark,
            textColor: theme.brown.dark
        });
    }

    showFabricationInfo() {
        const content = `
            <div style="
                background: ${theme.cream.light};
                border-radius: 12px;
                padding: 25px;
                max-width: 600px;
                margin: 50px auto;
                border: 2px solid ${theme.gold.dark};
                box-shadow: 0 5px 25px rgba(0,0,0,0.2);
                position: relative;
            ">
                <h2 style="
                    color: ${theme.gold.dark};
                    text-align: center;
                    margin-bottom: 25px;
                    font-size: 1.6rem;
                    border-bottom: 2px solid ${theme.gold.light};
                    padding-bottom: 10px;
                    font-weight: 700;
                ">
                    ♡ Notre Savoir-Faire Artisanal ♡
                </h2>
                
                <div style="margin-bottom: 20px;">
                    <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${theme.gold.medium};">
                        <h3 style="color: ${theme.brown.dark}; margin-bottom: 8px;">🏭 Fabrication Française</h3>
                        <p style="color: ${theme.brown.light}; line-height: 1.5;">
                            Tous nos bijoux sont conçus et fabriqués en France.
                        </p>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${theme.gold.light};">
                        <h3 style="color: ${theme.brown.dark}; margin-bottom: 8px;">💎 Matériaux de Qualité</h3>
                        <p style="color: ${theme.brown.light}; line-height: 1.5;">
                            Or 18 carats, argent 925, pierres précieuses certifiées.
                        </p>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid ${theme.gold.dark};">
                        <h3 style="color: ${theme.brown.dark}; margin-bottom: 8px;">🌿 Engagement Éthique</h3>
                        <p style="color: ${theme.brown.light}; line-height: 1.5;">
                            Or recyclé, pierres éthiques, emballages écologiques.
                        </p>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px dashed ${theme.border};">
                    <button id="fabricationCloseBtn" style="
                        padding: 12px 30px;
                        background: ${theme.gold.medium};
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
        
        // Passer false pour ne pas empecher automatiquement la propagation
        this.setContent(content, false);
        this.open();
        
        // Gerer le bouton de fermeture specifique
        this.setupCloseButton();
    }
    
    setupCloseButton() {
        setTimeout(() => {
            const closeBtn = document.getElementById('fabricationCloseBtn');
            if (closeBtn) {
                // Supprimer tous les ecouteurs existants
                const newCloseBtn = closeBtn.cloneNode(true);
                closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
                
                // Ajouter le nouvel ecouteur
                newCloseBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.close();
                });
                
                // Effet hover
                newCloseBtn.addEventListener('mouseenter', () => {
                    newCloseBtn.style.background = theme.gold.dark;
                    newCloseBtn.style.transform = 'translateY(-2px)';
                });
                
                newCloseBtn.addEventListener('mouseleave', () => {
                    newCloseBtn.style.background = theme.gold.medium;
                    newCloseBtn.style.transform = 'translateY(0)';
                });
            }
        }, 100);
    }
}
