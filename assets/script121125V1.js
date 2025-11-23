document.addEventListener("DOMContentLoaded", async () => {
  // === CONFIGURATION ===
  const TEST_MODE = false; // ⬅️ Passe à false pour activer Cloudinary
  const CSV_URL = "./data/products.csv";

  // 🔁 Le script choisit automatiquement la bonne source d'images
  const CLOUDINARY_BASE = TEST_MODE
    ? "./assets/" // mode test → image locale
    : "https://res.cloudinary.com/dcak9pjrt/image/upload/";

  const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
  const FALLBACK_IMAGE = "./assets/REFERENCE.png";

  const grid = document.getElementById("products-grid");

  // === FONCTION : Lecture CSV → tableau d’objets ===
  async function loadCSV(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Impossible de charger le fichier CSV");
    const text = await response.text();

    const rows = text.trim().split("\n");
    const headers = rows[0].split(",").map(h => h.trim());

    return rows.slice(1).map(row => {
      const values = row.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i]?.trim().replace(/^"|"$/g, ""); // nettoie les guillemets
      });
      return obj;
    });
  }

  // === FONCTION : Trouver la bonne image Cloudinary ou locale ===
  async function findImageUrl(reference) {
    if (TEST_MODE) {
      // 🔹 En mode test : on utilise l’image locale de secours
      return FALLBACK_IMAGE;
    }

    // 🔹 Sinon on teste plusieurs extensions Cloudinary
    for (const ext of IMAGE_EXTENSIONS) {
      const url = `${CLOUDINARY_BASE}${reference}${ext}`;
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return url;
    }

    return FALLBACK_IMAGE; // fallback si aucune image trouvée
  }

  // === FONCTION : Créer la carte produit ===
  function createProductCard(product, imageUrl) {
    const card = document.createElement("div");
    card.classList.add("product-card");

    const title = product["TITRE"] || "Bijou";
    const type = product["type de bijoux"] || "";
    const desc = product["description"] || "";
    const prix = product["price €"] || "";
    const fabrication = product["fabrication_possible"] || "";
    const tailles = product["tailles disponibles"] || "";
    const stock = product["stock"] || "";

    card.innerHTML = `
      <img src="${imageUrl}" alt="${title}" loading="lazy">
      <h3>${title}</h3>
      <p class="type">${type}</p>
      <p class="desc">${desc}</p>
      <p class="price">${prix ? prix + " €" : ""}</p>
      ${tailles ? `<p><strong>Tailles :</strong> ${tailles}</p>` : ""}
      ${stock ? `<p><strong>Stock :</strong> ${stock}</p>` : ""}
      ${fabrication === "OUI" ? `<p class="fabri">🛠 Fabrication possible</p>` : ""}
    `;

    return card;
  }

  // === FONCTION : Message de chargement ===
  function showLoading() {
    const msg = document.createElement("p");
    msg.id = "loading-msg";
    msg.textContent = "⏳ Chargement des produits...";
    msg.style.textAlign = "center";
    msg.style.fontSize = "1.1em";
    grid.appendChild(msg);
  }

  function hideLoading() {
    const msg = document.getElementById("loading-msg");
    if (msg) msg.remove();
  }

  // === FONCTION PRINCIPALE ===
  async function init() {
    showLoading();

    try {
      const products = await loadCSV(CSV_URL);
      console.log(`✅ ${products.length} produits chargés.`);
      hideLoading();

      for (const product of products) {
        const ref = product["REFERENCE"]?.trim();
        if (!ref) continue;
        const imageUrl = await findImageUrl(ref);
        const card = createProductCard(product, imageUrl);
        grid.appendChild(card);
      }

    } catch (err) {
      console.error("❌ Erreur :", err);
      hideLoading();
      grid.innerHTML = `<p style="color:red; text-align:center;">Erreur de chargement des produits.</p>`;
    }
  }

  // === DÉMARRAGE ===
  init();
});
