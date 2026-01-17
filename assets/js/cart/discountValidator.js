// assets/js/cart/discountValidator.js
export class DiscountValidator {
    constructor() {
        this.validCodes = {
            // Format: code: { type: 'percent'|'amount', value: number, minOrder: number|null, expires: date|null }
            'LOVE10': { type: 'percent', value: 10, minOrder: 50, expires: null, description: '10% de réduction dès 50€' },
            'BIJOU20': { type: 'percent', value: 20, minOrder: 100, expires: null, description: '20% de réduction dès 100€' },
            'LIVRAISON': { type: 'amount', value: 5, minOrder: null, expires: null, description: '5€ de réduction' },
            'NOEL2024': { type: 'percent', value: 15, minOrder: 80, expires: '2024-12-31', description: '15% de réduction spécial Noël' }
        };
    }

    validateCode(code, subtotal = 0) {
        code = code.trim().toUpperCase();
        
        if (!this.validCodes[code]) {
            return {
                valid: false,
                message: 'Code promo invalide',
                code: code
            };
        }
        
        const promo = this.validCodes[code];
        const now = new Date();
        
        // Verifier la date d'expiration
        if (promo.expires) {
            const expireDate = new Date(promo.expires);
            if (now > expireDate) {
                return {
                    valid: false,
                    message: 'Ce code promo a expiré',
                    code: code
                };
            }
        }
        
        // Verifier le montant minimum
        if (promo.minOrder && subtotal < promo.minOrder) {
            return {
                valid: false,
                message: `Minimum ${promo.minOrder}€ d\'achat requis`,
                code: code,
                requiredAmount: promo.minOrder
            };
        }
        
        // Calculer le montant de la reduction
        let discountAmount = 0;
        if (promo.type === 'percent') {
            discountAmount = subtotal * (promo.value / 100);
        } else if (promo.type === 'amount') {
            discountAmount = Math.min(promo.value, subtotal);
        }
        
        return {
            valid: true,
            message: `Code "${code}" appliqué ! ${promo.description}`,
            code: code,
            type: promo.type,
            value: promo.value,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            description: promo.description
        };
    }
    
    getValidCodes() {
        return Object.keys(this.validCodes);
    }
    
    addCode(code, config) {
        this.validCodes[code.toUpperCase()] = config;
    }
    
    removeCode(code) {
        delete this.validCodes[code.toUpperCase()];
    }
}
