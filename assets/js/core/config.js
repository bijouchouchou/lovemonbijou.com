// ============================================
// CONFIG.JS — VERSION VALIDE
// ============================================

const CONFIG = {
    // URL du CSV
    csvUrl: "./data/products.csv",


    // Placeholder Cloudinary en cas d'image manquante
    placeholder: "https://placehold.co/300x300?text=Bijou",

    // Configuration Cloudinary
    cloudinary: {
        cloudName: "dcak9pjrt",
        version: "1761920568"
    },

    // Genere l'URL Cloudinary pour une reference
    getCloudinaryUrl(reference) {
        if (!reference) return this.placeholder;

        return `https://res.cloudinary.com/${this.cloudinary.cloudName}/image/upload/v${this.cloudinary.version}/${reference}`;
    }
};

console.log("CONFIG.JS: Configuration chargee");

export default CONFIG;
