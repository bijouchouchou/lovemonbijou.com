// === IMPORTS ===
import { readFile } from "fs/promises";
import { existsSync } from "fs";

// === PARAMÈTRES ===
const htmlFiles = [
  "index.html",
  "panier.html",
  "fabrication.html",
  "guide-tailles.html",
  "ethique.html",
  "cgv.html",
  "qui-sommes-nous.html"   // remplace contact.html
];

// classes à ignorer (dynamiques, techniques)
const ignoredClasses = new Set([
  "open",
  "cart-animate",
  "csv-modal-backdrop",
  "csv-modal-box",
  "product-card", // utilisée mais les scanners JS la ratent parfois
]);

// === FONCTIONS ===

async function read(file) {
  if (!existsSync(file)) return "";
  return await readFile(file, "utf-8");
}

function extractHtml(html) {
  const classes = new Set();
  const ids = new Set();

  const classRegex = /class="([^"]+)"/g;
  const idRegex = /id="([^"]+)"/g;

  let m;
  while ((m = classRegex.exec(html))) {
    m[1].split(/\s+/).forEach(c => c && classes.add(c));
  }

  while ((m = idRegex.exec(html))) ids.add(m[1]);

  return { classes, ids };
}

function extractCss(css) {
  const classes = new Set();
  const regex = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;

  let m;
  while ((m = regex.exec(css))) {
    const name = m[1];
    if (!name.includes(":") && !ignoredClasses.has(name)) {
      classes.add(name);
    }
  }
  return classes;
}

function extractJs(js) {
  const classes = new Set();
  const ids = new Set();

  // querySelector
  const qs = /querySelector(All)?\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = qs.exec(js))) {
    const sel = m[2];
    const c = sel.match(/\.([a-zA-Z0-9_-]+)/);
    const i = sel.match(/#([a-zA-Z0-9_-]+)/);
    if (c) classes.add(c[1]);
    if (i) ids.add(i[1]);
  }

  // classList
  const cl = /classList\.(add|remove|toggle)\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = cl.exec(js))) {
    const className = m[2];
    if (!ignoredClasses.has(className)) classes.add(className);
  }

  return { classes, ids };
}

// === TRAITEMENT ===

let htmlAll = "";
for (const file of htmlFiles) htmlAll += await read(file);

const css = await read("assets/style.css");
const js = await read("assets/script.js");

const { classes: htmlClasses, ids: htmlIds } = extractHtml(htmlAll);
const cssClasses = extractCss(css);
const { classes: jsClasses, ids: jsIds } = extractJs(js);

const usedClasses = new Set([...htmlClasses, ...jsClasses]);
const usedIds = new Set([...htmlIds, ...jsIds]);

// === RESULTATS ===
console.log("=== COHERENCE HTML / CSS / JS (V3) ===\n");

// 1) Classes manquantes dans CSS
const missingCss = [...usedClasses].filter(c => !cssClasses.has(c));
console.log("Classes HTML/JS SANS style CSS :");
missingCss.length ? missingCss.forEach(c => console.log("  •", c)) : console.log("  ✔ OK");

// 2) Classes CSS jamais utilisées
const unusedCss = [...cssClasses].filter(c => !usedClasses.has(c));
console.log("\nClasses CSS JAMAIS utilisées :");
unusedCss.length ? unusedCss.forEach(c => console.log("  •", c)) : console.log("  ✔ OK");

// 3) IDs utilisés dans JS mais absents du HTML
const missingIds = [...jsIds].filter(id => !htmlIds.has(id));
console.log("\nIDs utilisés en JS mais absents du HTML :");
missingIds.length ? missingIds.forEach(id => console.log("  •", id)) : console.log("  ✔ OK");

// Résumé
console.log("\n--- Résumé ---");
console.log("Classes utilisées :", usedClasses.size);
console.log("Classes CSS :", cssClasses.size);
console.log("IDs utilisés JS :", jsIds.size);
console.log("IDs HTML :", htmlIds.size);
