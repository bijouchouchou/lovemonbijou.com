// assets/js/core/promoSlider.js
import { theme } from './theme.js';

export class PromoSlider {
    constructor() {
        this.messagesDefault = [
            "✨ Livraison offerte dès 100 € ✨",
            "💎 Bijoux en or recyclé & pierres éthiques",
            "🎁 Gravure offerte sur les alliances",
            "🔥 Nouveautés 2025 — Collections exclusives"
        ];
        
        this.messagesByMonth = {
            1: ["🎉 Bonne année ! -10% sur tout le mois de janvier"],
            2: ["💘 Saint-Valentin : idées cadeaux en or"],
            5: ["🎁 Fête des mères — Sélection spéciale"],
            10: ["🎃 Promo d'automne : frais de port offerts"],
            12: ["🎄 Noël : coffrets cadeaux disponibles 🎄"]
        };
        
        this.currentIndex = 0;
        this.interval = null;
        this.init();
    }

    init() {
        this.promoEl = document.getElementById('promoMessage');
        if (!this.promoEl) {
            console.warn('Élément promoMessage non trouvé');
            return;
        }
        
        // Style de base
        this.promoEl.style.cssText = `
            transition: opacity 0.3s ease;
            font-weight: 600;
            color: ${theme.gold.dark};
            padding: 5px 0;
        `;
        
        this.startRotation();
    }

    getMessagesForCurrentMonth() {
        const now = new Date();
        const month = now.getMonth() + 1;
        
        // Messages spécifiques au mois ou messages par défaut
        const monthMessages = this.messagesByMonth[month];
        return monthMessages && monthMessages.length > 0 ? monthMessages : this.messagesDefault;
    }

    rotateMessages() {
        if (!this.promoEl) return;
        
        const messages = this.getMessagesForCurrentMonth();
        if (messages.length === 0) return;
        
        // Effet de fondu
        this.promoEl.style.opacity = '0';
        
        setTimeout(() => {
            this.promoEl.textContent = messages[this.currentIndex];
            this.promoEl.style.opacity = '1';
            
            // Passer au message suivant
            this.currentIndex = (this.currentIndex + 1) % messages.length;
        }, 300);
    }

    startRotation(intervalMs = 3000) {
        if (this.interval) {
            clearInterval(this.interval);
        }
        
        // Premier message immédiat
        this.rotateMessages();
        
        // Rotation automatique
        this.interval = setInterval(() => {
            this.rotateMessages();
        }, intervalMs);
    }

    stopRotation() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    setMessages(messages) {
        if (Array.isArray(messages) && messages.length > 0) {
            this.messagesDefault = messages;
            this.currentIndex = 0;
            this.rotateMessages();
        }
    }

    addMessage(message) {
        this.messagesDefault.push(message);
    }

    // Pour tests manuels (exposer dans la console)
    next() {
        this.rotateMessages();
    }
    
    previous() {
        const messages = this.getMessagesForCurrentMonth();
        this.currentIndex = (this.currentIndex - 1 + messages.length) % messages.length;
        this.rotateMessages();
    }
}
