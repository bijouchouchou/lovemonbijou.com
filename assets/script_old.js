const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhuvjofIeGugPL69XD_Lf9G3xCylG-fTaaqau8JFbH3n2px13z7XSxSiGrX6D2vlDpPptZe-oCTtk/pub?gid=452020768&single=true&output=csv";

let allProducts = [];
let filteredProducts = [];

// ———————————————————————————————————————
//  🔹 Chargement du CSV
// ———————————————————————————————————————
async function loadProducts() {
  try {
    const res = await fetch(CSV_URL);
    const text = await res.text();
    const lines = text.trim().split("\n").filter(l => l.trim().length > 0);

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    const products = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const obj = {};
      headers.forEach((h, i) => (obj[h] = (values[i] || "").trim()));
      return normalizeProduct(obj);
    });

    allProducts = products;
    filteredProducts = [...allProducts];
    renderProducts(filteredProducts);
  } catch (err) {
    console.error("Erreur chargement CSV :", err);
    document.querySelector("#product-list").innerHTML =
      "<p class='error'>Impossible de charger les produits 😢</p>";
  }
}

// ———————————————————————————————————————
//  🔧 Parse CSV
// ———————————————————————————————————————
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ———————————————————————————————————————
//  🧩 Normalisation des données
// ———————————————————————————————————————
function normalizeProduct(p) {
  const get = key => (p[key] !== undefined ? p[key].trim() : "");

  const rawPrix = (get("price_euros") || get("price €") || get("price") || get("prix") || "0")
    .replace(/[^\d,.\-]/g, "")
    .replace(",", ".");
  const prix = parseFloat(rawPrix) || 0;

  const normalized = {
    reference: get("reference"),
    type: get("type de bijoux") || get("type"),
    description: get("description"),
    image: get("image"),
    couleur: get("couleur"),
    titre: get("titre"),
    or: get("poids or"),
    pierres: get("type de pierres"),
    poidsPierre: get("poids pierre"),
    tailles: get("tailles disponibles"),
    qteTaille: get("quantité par taille") || get("quantité_par_taille") || get("quantitÃ©_ par_ taille"),
    prix,
    stock: get("stock"),
    fabrication: (get("fabrication_possible") || get("fabrication") || "").toUpperCase(),
  };

  // Image par défaut Cloudinary
  if (!normalized.image || normalized.image === "") {
    normalized.image = `https://res.cloudinary.com/dcak9pjrt/image/upload/${normalized.reference}.png`;
  }

  return normalized;
}

// ———————————————————————————————————————
//  🎨 Rendu des produits
// ———————————————————————————————————————
// ----------------------------
// RENDU PRODUITS (avec tailles)
// Remplace ta fonction renderProducts existante par celle-ci
// ----------------------------
function renderProducts(products) {
  const container = document.querySelector("#product-list");
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = "<p>Aucun bijou trouvé 🕊️</p>";
    return;
  }

  container.innerHTML = products.map(p => {
    const imgSrc = p.image && p.image.trim()
      ? p.image.trim()
      : `https://res.cloudinary.com/dcak9pjrt/image/upload/${encodeURIComponent(p.reference)}.png`;

    const priceLabel = p.prix && p.prix > 0 ? p.prix.toFixed(2) : "—";

    // Tailles + quantités -> construction des lignes avec data-qte
    let taillesHtml = "";
    if (p.tailles && p.qteTaille) {
      const tailles = p.tailles.split(/[,;\/]+/).map(s => s.trim());
      const qtes = p.qteTaille.split(/[,;\/]+/).map(s => s.trim());
      taillesHtml = `<div class="tailles-stock">` +
        tailles.map((t, i) => {
          const q = Number(qtes[i]) || 0;
          // bouton toujours présent : "Ajouter au panier" si q>0, sinon "Commander (sur-mesure)"
          const btnLabel = q > 0 ? "Ajouter au panier" : "Commander (sur-mesure)";
          const btnClass = q > 0 ? "buy-btn available" : "buy-btn surmesure";
          // data attributes: ref, taille, prix, qte
          return `<div class="taille-item">
                    <div>
                      <strong>${escapeHtml(t)}</strong>
                      <span class="qte">(${q})</span>
                    </div>
                    <div>
                      <button
                        class="${btnClass}"
                        data-ref="${escapeHtml(p.reference)}"
                        data-taille="${escapeHtml(t)}"
                        data-titre="${escapeHtml(p.titre)}"
                        data-prix="${escapeHtml(priceLabel)}"
                        data-qte="${q}"
                      >${btnLabel}</button>
                    </div>
                  </div>`;
        }).join("") +
      `</div>`;
    } else if (p.tailles) {
      taillesHtml = `<div class="tailles-stock"><em>${escapeHtml(p.tailles)}</em></div>`;
    }

    const fabricationBtn = p.fabrication === "OUI"
      ? `<button class="fabrication-btn" data-ref="${escapeHtml(p.reference)}" data-titre="${escapeHtml(p.titre)}">Fabrication</button>`
      : "";

    return `
      <article class="product-card">
        <img src="${imgSrc}" alt="${escapeHtml(p.titre || p.reference)}" onerror="this.onerror=null;this.src='https://via.placeholder.com/240x240?text=Pas+d%27image'"/>
        <h3>${escapeHtml(p.titre || "Bijou")}</h3>
        ${p.reference ? `<p class="ref"><strong>Ref :</strong> ${escapeHtml(p.reference)}</p>` : ""}
        ${p.type ? `<p class="type">${escapeHtml(p.type)}</p>` : ""}
        <p class="price">${priceLabel === "—" ? "—" : priceLabel + " €"}</p>
        ${p.stock ? `<p class="stock">Stock global : ${escapeHtml(p.stock)}</p>` : ""}
        ${taillesHtml}
        <div class="actions">${fabricationBtn}</div>
      </article>
    `;
  }).join("");

  // après insertion : attacher listeners aux boutons
  // boutons "Ajouter au panier" ou "Commander (sur-mesure)"
  container.querySelectorAll(".buy-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const el = e.currentTarget;
      const ref = el.dataset.ref;
      const taille = el.dataset.taille;
      const titre = el.dataset.titre;
      const prix = el.dataset.prix;
      const qte = Number(el.dataset.qte);

      if (qte > 0) {
        // en stock -> ajout au panier
        addToCart({ reference: ref, titre, taille, prix: Number(prix.replace(",", ".") || 0), qty: 1 });
      } else {
        // rupture -> ouvrir la page de fabrication / commande sur-mesure
        openFabricationPage(ref, titre, taille);
      }
    });
  });

  // bouton fabrication globale (si présent)
  container.querySelectorAll(".fabrication-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const el = e.currentTarget;
      const ref = el.dataset.ref;
      const titre = el.dataset.titre;
      openFabricationPage(ref, titre, "");
    });
  });
}

// ----------------------------
// MINI-PANIER (localStorage)
// ----------------------------
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart_v1") || "[]");
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart_v1", JSON.stringify(cart));
}

function addToCart(item) {
  // item = { reference, titre, taille, prix, qty }
  const cart = getCart();
  // si même ref+taille existe, incrémente qty
  const idx = cart.findIndex(ci => ci.reference === item.reference && ci.taille === item.taille);
  if (idx >= 0) {
    cart[idx].qty += item.qty;
  } else {
    cart.push(item);
  }
  saveCart(cart);
  // feedback utilisateur
  showTempMessage(`✅ ${item.titre} (taille ${item.taille}) ajouté au panier`, 2800);
  // (optionnel) mise à jour UI ou icône panier si tu en as une
}

// ----------------------------
// OUVRIR PAGE FABRICATION (préremplir le formulaire)
// ----------------------------
function openFabricationPage(ref, titre, taille) {
  // redirige vers fabrication.html en passant ref et taille dans l'URL
  const url = `fabrication.html?ref=${encodeURIComponent(ref || "")}&titre=${encodeURIComponent(titre || "")}&taille=${encodeURIComponent(taille || "")}`;
  window.location.href = url;
}

// ----------------------------
// FEEDBACK UTILISATEUR
// ----------------------------
function showTempMessage(text, ms = 2000) {
  // crée un petit message en bas de l'écran
  const id = "temp-msg";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.bottom = "24px";
    el.style.transform = "translateX(-50%)";
    el.style.background = "#fffbe6";
    el.style.border = "1px solid #f0d8a6";
    el.style.padding = "8px 12px";
    el.style.borderRadius = "10px";
    el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
    el.style.zIndex = 9999;
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.style.opacity = "1";
  setTimeout(() => {
    if (el) el.style.opacity = "0";
    // remove after fade
    setTimeout(() => el && el.remove(), 500);
  }, ms);
}

// ———————————————————————————————————————
//  ✉️ Achat / Fabrication
// ———————————————————————————————————————
document.addEventListener("click", e => {
  // 🔹 Achat direct (stock disponible)
  if (e.target.classList.contains("buy-btn") && !e.target.disabled) {
    const ref = e.target.dataset.ref;
    const taille = e.target.dataset.taille;
    const titre = e.target.dataset.titre;
    const prix = e.target.dataset.prix;

    // 👉 Ici tu peux ajouter la logique d’ajout au panier ou d’achat
    alert(`🛍️ Achat de ${titre} (${ref}) en taille ${taille} — ${prix}`);
  }

  // 🔹 Demande de fabrication (stock à 0)
  if (e.target.classList.contains("fab-btn")) {
    const ref = e.target.dataset.ref;
    const titre = e.target.dataset.titre;

    // 👉 On ouvre le petit formulaire inline
    showFabricationForm(ref, titre);
  }
});

// ———————————————————————————————————————
//  🧹 Protection XSS
// ———————————————————————————————————————
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ———————————————————————————————————————
//  🚀 Lancement
// ———————————————————————————————————————
document.addEventListener("DOMContentLoaded", loadProducts);
