// assets/js/fix-encoding.js - Correctif d'encodage universel
console.log("🔠 Correction d'encodage UTF-8...");

function fixAllEncoding() {
    console.log("Recherche de problèmes d'encodage...");
    
    let fixedCount = 0;
    
    // 1. Corriger tous les textes avec â‚¬
    document.querySelectorAll('*').forEach(element => {
        const text = element.textContent || '';
        const html = element.innerHTML || '';
        
        if (text.includes('â‚¬') || html.includes('â‚¬')) {
            // Remplacer dans textContent
            if (element.textContent && element.textContent.includes('â‚¬')) {
                element.textContent = element.textContent.replace(/â‚¬/g, '€');
                fixedCount++;
            }
            
            // Remplacer dans innerHTML
            if (element.innerHTML && element.innerHTML.includes('â‚¬')) {
                element.innerHTML = element.innerHTML.replace(/â‚¬/g, '€');
                fixedCount++;
            }
        }
    });
    
    // 2. Forcer l'encodage UTF-8 via CSS
    if (!document.querySelector('#force-utf8')) {
        const style = document.createElement('style');
        style.id = 'force-utf8';
        style.textContent = \
            /* Forcer l'affichage UTF-8 */
            body, .cart-panel, .modal, .product-card {
                font-family: "Segoe UI", Arial, sans-serif !important;
            }
            
            /* S'assurer que € s'affiche */
            .cart-summary *:after {
                font-family: Arial, sans-serif !important;
            }
        \;
        document.head.appendChild(style);
    }
    
    // 3. Corriger specifiquement le panier
    fixCartEncoding();
    
    console.log(\✅ Encodage corrigé: \ éléments fixés\);
}

function fixCartEncoding() {
    const panel = document.querySelector('.cart-panel');
    if (!panel) return;
    
    // Remplacer dans le panneau panier
    const elements = panel.querySelectorAll('span, div, strong, .value');
    elements.forEach(el => {
        if (el.textContent.includes('â‚¬')) {
            el.textContent = el.textContent.replace(/â‚¬/g, '€');
        }
        if (el.innerHTML && el.innerHTML.includes('â‚¬')) {
            el.innerHTML = el.innerHTML.replace(/â‚¬/g, '€');
        }
    });
    
    // S'assurer que les nouveaux € ajoutes sont corrects
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                if (mutation.target.textContent.includes('â‚¬')) {
                    mutation.target.textContent = mutation.target.textContent.replace(/â‚¬/g, '€');
                }
            }
        });
    });
    
    observer.observe(panel, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

// Executer au chargement
document.addEventListener('DOMContentLoaded', fixAllEncoding);

// Executer aussi apres un delai pour les contenus dynamiques
setTimeout(fixAllEncoding, 1000);
setTimeout(fixAllEncoding, 3000);

// Exposer pour tests
window.fixEncoding = fixAllEncoding;
window.checkEncoding = function() {
    const elements = document.querySelectorAll('.cart-summary, .value, [class*="price"], [class*="total"]');
    elements.forEach(el => {
        console.log(el.textContent, '- contient â‚¬?', el.textContent.includes('â‚¬'));
    });
};

console.log("💡 Pour tester: window.fixEncoding() ou window.checkEncoding()");
