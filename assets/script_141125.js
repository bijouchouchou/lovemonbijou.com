
// ===========================
// SÃ‰CURITÃ‰ EMAILJS
// ===========================
function safeEmailJSInit() {
    if (typeof emailjs === 'undefined') {
        console.log("â³ EmailJS pas encore chargÃ©, attente...");
        setTimeout(safeEmailJSInit, 100);
        return;
    }
    
    try {
        emailjs.init("QvP4ltdzywwg7IolM");
        console.log("[OK] EmailJS initialisÃ© avec succÃ¨s");
    } catch (error) {
        console.error("[KO] Erreur initialisation EmailJS:", error);
    }
}

// Remplacer l'appel direct emailjs.init() par :
// safeEmailJSInit();


// ===========================
// SÃ‰CURITÃ‰ EMAILJS
// ===========================
function safeEmailJSInit() {
    if (typeof emailjs === 'undefined') {
        console.log("â³ EmailJS pas encore chargÃ©, attente...");
        setTimeout(safeEmailJSInit, 100);
        return;
    }
    
    try {
        safeEmailJSInit();
        console.log("[OK] EmailJS initialisÃ© avec succÃ¨s");
    } catch (error) {
        console.error("[KO] Erreur initialisation EmailJS:", error);
    }
}

// Remplacer l'appel direct emailjs.init() par :
// safeEmailJSInit();


// ===========================
// SÃ‰CURITÃ‰ EMAILJS
// ===========================
function safeEmailJSInit() {
    if (typeof emailjs === 'undefined') {
        console.log("â³ EmailJS pas encore chargÃ©, attente...");
        setTimeout(safeEmailJSInit, 100);
        return;
    }
    
    try {
        safeEmailJSInit();
        console.log("[OK] EmailJS initialisÃ© avec succÃ¨s");
    } catch (error) {
        console.error("[KO] Erreur initialisation EmailJS:", error);
    }
}

// Remplacer l'appel direct emailjs.init() par :
// safeEmailJSInit();

// ===== CONFIGURATION EMAILJS =====
const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_xafynxq',
    TEMPLATE_ID: 'template_2lmp4gc',
    PUBLIC_KEY: 'QvP4ltdzywwg7IolM',  // Ã¢Å¡Â Ã¯Â¸Â Ãƒâ‚¬ mettre dans index.html
    USER_ID: 'bijouchouchou'         // Optionnel, dÃƒÂ©jÃƒÂ  dans init
};

// ===== FONCTION D'ENVOI D'EMAIL =====
async function sendConfirmationEmail(clientInfo, commandeDetails) {
    try {
        console.log('Ã°Å¸â€œÂ§ DÃƒÂ©but envoi email...');
        
        // ParamÃƒÂ¨tres pour le template EmailJS
        const templateParams = {
            to_email: clientInfo.email,
            to_name: clientInfo.nom,
            client_nom: clientInfo.nom,
            client_email: clientInfo.email,
            client_telephone: clientInfo.telephone,
            client_adresse: clientInfo.adresse,
            commande_numero: commandeDetails.numero,
            commande_date: new Date().toLocaleDateString('fr-FR'),
            commande_heure: new Date().toLocaleTimeString('fr-FR'),
            commande_total: `${commandeDetails.total.toFixed(2)}Ã¢â€šÂ¬`,
            commande_details: generateEmailDetails(commandeDetails.items),
            items_count: commandeDetails.items.reduce((sum, item) => sum + item.quantite, 0)
        };

        console.log('ParamÃƒÂ¨tres email:', templateParams);

        // Envoi via EmailJS
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            templateParams
        );

        console.log('Ã¢Å“â€¦ Email envoyÃƒÂ© avec succÃƒÂ¨s:', response);
        return { success: true, response };

    } catch (error) {
        console.error('Ã¢ÂÅ’ Erreur envoi email:', error);
        return { 
            success: false, 
            error: error.text || error.message || 'Erreur inconnue' 
        };
    }
}

// ===== GENERATION DU DETAIL DE COMMANDE =====
function generateEmailDetails(items) {
    let detailsHTML = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
                <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Produit</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">RÃƒÂ©fÃƒÂ©rence</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Taille</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">QuantitÃƒÂ©</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Prix</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Sous-total</th>
                </tr>
            </thead>
            <tbody>
    `;

    items.forEach(item => {
        const sousTotal = item.prix * item.quantite;
        detailsHTML += `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.titre}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.reference}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.taille || 'N/A'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantite}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.prix}Ã¢â€šÂ¬</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${sousTotal.toFixed(2)}Ã¢â€šÂ¬</td>
            </tr>
        `;
    });

    detailsHTML += `
            </tbody>
        </table>
    `;

    return detailsHTML;
}

// ===== FONCTION DE SOUMISSION DE COMMANDE =====
async function submitOrder(paymentMethod) {
    try {
        // RÃƒÂ©cupÃƒÂ©rer les infos client
        const clientInfo = collectClientInfo();
        if (!validateClientInfo(clientInfo)) {
            return;
        }

        // GÃƒÂ©nÃƒÂ©rer numÃƒÂ©ro de commande
        const commandeNumero = 'CMD-' + Date.now();
        
        // PrÃƒÂ©parer les dÃƒÂ©tails de la commande
        const commandeDetails = {
            numero: commandeNumero,
            total: cart.reduce((sum, item) => sum + (item.prix * item.quantite), 0),
            items: [...cart], // Copie du panier
            client: clientInfo,
            payment_method: paymentMethod,
            date: new Date().toISOString()
        };

        console.log('Ã°Å¸â€â€ž Envoi de la confirmation email...');

        // Envoyer l'email de confirmation
        const emailResult = await sendConfirmationEmail(clientInfo, commandeDetails);

        if (emailResult.success) {
            // SuccÃƒÂ¨s - Rediriger vers la page de succÃƒÂ¨s
            showNotification('Ã¢Å“â€¦ Commande confirmÃƒÂ©e ! Email envoyÃƒÂ©.');
            
            // Sauvegarder la commande dans le localStorage
            saveOrderToHistory(commandeDetails);
            
            // Vider le panier
            cart = [];
            saveCart();
            updateCartUI();
            
            // Redirection vers page de succÃƒÂ¨s
            setTimeout(() => {
                window.location.href = `success.html?commande=${commandeNumero}`;
            }, 2000);
            
        } else {
            throw new Error(`Erreur email: ${emailResult.error}`);
        }

    } catch (error) {
        console.error('Ã¢ÂÅ’ Erreur commande:', error);
        showNotification('Ã¢ÂÅ’ Erreur lors de la commande: ' + error.message);
    }
}

// ===== VALIDATION DES INFORMATIONS CLIENT =====
function validateClientInfo(clientInfo) {
    const errors = [];
    
    if (!clientInfo.nom || clientInfo.nom.trim().length < 2) {
        errors.push('Le nom est requis (min. 2 caractÃƒÂ¨res)');
    }
    
    if (!clientInfo.email || !isValidEmail(clientInfo.email)) {
        errors.push('Un email valide est requis');
    }
    
    if (!clientInfo.telephone || clientInfo.telephone.trim().length < 10) {
        errors.push('Un numÃƒÂ©ro de tÃƒÂ©lÃƒÂ©phone valide est requis');
    }
    
    if (!clientInfo.adresse || clientInfo.adresse.trim().length < 10) {
        errors.push('Une adresse complÃƒÂ¨te est requise');
    }
    
    if (errors.length > 0) {
        showNotification('Ã¢ÂÅ’ ' + errors.join(', '));
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ===== SAUVEGARDE DE L'HISTORIQUE =====
function saveOrderToHistory(commande) {
    let commandes = JSON.parse(localStorage.getItem('commandesHistory')) || [];
    commandes.unshift(commande); // Ajouter au dÃ©but
    localStorage.setItem('commandesHistory', JSON.stringify(commandes));
}

// ===== COLLECTE DES INFOS CLIENT =====
function collectClientInfo() {
    return {
        nom: document.getElementById('clientNom')?.value || '',
        email: document.getElementById('clientEmail')?.value || '',
        telephone: document.getElementById('clientTelephone')?.value || '',
        adresse: document.getElementById('clientAdresse')?.value || ''
    };
}


// ===========================
// TRANSFORMATION reference ? URL CLOUDINARY
// ===========================
// Vérifiez que la fonction est corrigée
console.log("Fonction corrigée:", getProductImageUrl.toString());

// Test avec un produit réel
if (window.allProducts && window.allProducts.length > 0) {
    const testProduct = window.allProducts[0];
    console.log("REFERENCE:", testProduct.REFERENCE);
    console.log("URL générée:", getProductImageUrl(testProduct));
    
    // Test d'affichage
    const img = new Image();
    img.src = getProductImageUrl(testProduct);
    img.style.width = "200px";
    img.onload = () => {
        console.log("✅ Image chargée avec la fonction corrigée!");
        document.body.appendChild(img);
    };
}

// ===========================
// NETTOYAGE DES REFERENCES
// ===========================
function cleanProductReference(product) {
    if (product.REFERENCE) {
        product.REFERENCE = product.REFERENCE.trim();
    }
    return product;
}

function normalizeProductWithCleanRef(rawObj) {
    const product = normalizeProduct(rawObj);
    return cleanProductReference(product); // correct
}


// ===========================
// DIAGNOSTIC GOOGLE SHEETS
// ===========================
async function debugGoogleSheets() {
    console.log("Diagnostic Google Sheets...");
    
    try {
        const response = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhuvjofIeGugPL69XD_Lf9G3xCylG-fTaaqau8JFbH3n2px13z7XSxSiGrX6D2vlDpPptZe-oCTtk/pub?gid=452020768&single=true&output=csv");
        
        if (!response.ok) {
            console.error("[KO] Erreur HTTP:", response.status);
            return;
        }
        
        const csvText = await response.text();
        console.log("[OK] CSV chargÃ©, premiÃ¨res lignes:");
        
        const lines = csvText.split('\n').slice(0, 5);
        lines.forEach((line, index) => {
            console.log(`Ligne ${index}: ${line}`);
        });
        
    } catch (error) {
        console.error("[KO] Erreur chargement Google Sheets:", error);
    }
}

// Tester Google Sheets
setTimeout(debugGoogleSheets, 1000);





