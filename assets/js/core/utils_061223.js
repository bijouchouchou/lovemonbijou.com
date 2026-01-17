// ============================================
// UTILS.JS — Fonctions utilitaires + Notifications
// ============================================

/**
 * Raccourcis DOM
 */
export function $(selector, context = document) {
    return context.querySelector(selector);
}

export function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

/**
 * Cree un element DOM
 */
export function createEl(tag, className = "", content = "") {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content) el.textContent = content;
    return el;
}

/**
 * Formatte un prix (ex: 99.5 -> "99,50€")
 */
export function formatPrice(price) {
    if (price == null || price === "") return "0,00€";
    const num = parseFloat(price);
    if (isNaN(num)) return String(price);
    return num.toFixed(2).replace(".", ",") + "€";
}

/**
 * Affiche une notification simple en haut a droite
 */
export function showNotification(message, type = "info") {
    console.log(`NOTIF [${type}] →`, message);

    const box = document.createElement("div");
    box.className = `notif notif-${type}`;
    box.textContent = message;

    // style minimal en inline pour etre sûr que ca se voit
    box.style.position = "fixed";
    box.style.top = "20px";
    box.style.right = "20px";
    box.style.background =
        type === "error"   ? "#e53935" :
        type === "success" ? "#43a047" :
        type === "info"    ? "#1e88e5" :
                             "#555";
    box.style.color = "#fff";
    box.style.padding = "10px 16px";
    box.style.borderRadius = "6px";
    box.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
    box.style.zIndex = "9999";
    box.style.fontSize = "14px";
    box.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    box.style.opacity = "0";
    box.style.transition = "opacity 0.2s ease-out";

    document.body.appendChild(box);

    // fade-in
    requestAnimationFrame(() => {
        box.style.opacity = "1";
    });

    // disparition apres 3s
    setTimeout(() => {
        box.style.opacity = "0";
        setTimeout(() => box.remove(), 200);
    }, 3000);
}

console.log("UTILS.JS: utilitaires + showNotification chargés (module ES)");
