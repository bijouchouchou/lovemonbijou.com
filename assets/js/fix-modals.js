// assets/js/fix-modals.js - Correctif immediat pour les modales
console.log("🔧 Application du correctif modales...");

function fixModalPosition() {
    // Corriger la modale produit
    const productModal = document.getElementById('productModal');
    if (productModal) {
        console.log("Correctif modale produit...");
        
        // Forcer les styles
        productModal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0,0,0,0.5) !important;
            z-index: 10000 !important;
            display: none;
            overflow: auto;
        `;
        
        // Corriger le contenu
        const modalContent = productModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.cssText = `
                position: relative !important;
                background: white !important;
                margin: 50px auto !important;
                padding: 25px !important;
                border-radius: 12px !important;
                max-width: 800px !important;
                width: 90% !important;
                border: 2px solid #b18a60 !important;
                box-shadow: 0 5px 25px rgba(0,0,0,0.2) !important;
                animation: modalFixSlideIn 0.3s ease !important;
            `;
        }
        
        // Bouton fermer
        const closeBtn = productModal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.style.cssText = `
                position: absolute !important;
                top: 15px !important;
                right: 15px !important;
                background: none !important;
                border: none !important;
                font-size: 2rem !important;
                color: #5a4634 !important;
                cursor: pointer !important;
                z-index: 10001 !important;
            `;
        }
    }
    
    // Ajouter l'animation CSS
    if (!document.querySelector('#modal-fix-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-fix-styles';
        style.textContent = `
            @keyframes modalFixSlideIn {
                from { transform: translateY(-30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            /* Cacher le défilement du body quand modale ouverte */
            body.modal-open {
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log("✅ Correctif modales appliqué");
}

// Appliquer apres chargement
document.addEventListener('DOMContentLoaded', fixModalPosition);

// Appliquer aussi apres un delai au cas ou
setTimeout(fixModalPosition, 1000);

// Exposer pour test manuel
window.fixModalPosition = fixModalPosition;

console.log("💡 Pour forcer la correction: window.fixModalPosition()");
