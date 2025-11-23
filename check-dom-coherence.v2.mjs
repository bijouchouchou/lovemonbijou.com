// check-dom-coherence.v2.mjs
// Analyse la cohérence HTML / CSS / JS du projet

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

// --- Helpers de lecture ---------------------------------

async function read(path) {
  if (!existsSync(path)) {
    console.log(`[WARN] Fichier introuvable : ${path}`);
    return '';
  }
  try {
    return await readFile(path, 'utf8');
  } catch (e) {
    console.log(`[ERROR] Lecture ${path} :`, e.message);
    return '';
  }
}

// --- Extraction HTML ------------------------------------

function extractHtmlClassesAndIds(html) {
  const classSet = new Set();
  const idSet = new Set();

  const classRegex = /class="([^"]+)"/g;
  let m;
  while ((m = classRegex.exec(html)) !== null) {
    m[1].split(/\s+/).forEach(c => c && classSet.add(c));
  }

  const idRegex = /id="([^"]+)"/g;
  while ((m = idRegex.exec(html)) !== null) {
    idSet.add(m[1]);
  }

  return { classSet, idSet };
}

// --- Extraction CSS -------------------------------------

function extractCssClasses(css) {
  const set = new Set();
  const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const regex = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  let m;
  while ((m = regex.exec(cssWithoutComments)) !== null) {
    const name = m[1];
    if (!name.includes(':')) {
      set.add(name);
    }
  }
  return set;
}

// --- Extraction JS --------------------------------------

function extractJsSelectors(js) {
  const classes = new Set();
  const ids = new Set();
  let m;

  // getElementById('id')
  const idRegex = /getElementById\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = idRegex.exec(js)) !== null) {
    ids.add(m[1]);
  }

  // querySelector / querySelectorAll
  const qsRegex = /querySelector(All)?\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = qsRegex.exec(js)) !== null) {
    const sel = m[2];
    const classMatch = sel.match(/\.([a-zA-Z0-9_-]+)/);
    if (classMatch) classes.add(classMatch[1]);
    const idMatch = sel.match(/#([a-zA-Z0-9_-]+)/);
    if (idMatch) ids.add(idMatch[1]);
  }

  // classList.add/remove/toggle('xxx')
  const clRegex = /classList\.(add|remove|toggle)\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = clRegex.exec(js)) !== null) {
    classes.add(m[2]);
  }

  // createEl('div', { class: 'xxx yyy' })
  const createElRegex = /createEl\([^,]+,\s*\{[^}]*class\s*:\s*['"]([^'"]+)['"][^}]*\}/g;
  while ((m = createElRegex.exec(js)) !== null) {
    m[1].split(/\s+/).forEach(c => c && classes.add(c));
  }

  // element.className = 'xxx yyy'
  const classNameRegex = /\.className\s*=\s*['"]([^'"]+)['"]/g;
  while ((m = classNameRegex.exec(js)) !== null) {
    m[1].split(/\s+/).forEach(c => c && classes.add(c));
  }

  return { classes, ids };
}

// --- MAIN -----------------------------------------------

const htmlFiles = [
  "index.html",
  "panier.html",
  "fabrication.html",
  "guide-tailles.html",
  "ethique.html",
  "cgv.html",
  "checkout.html",
  "success.html",
  "cancel.html",
  "qui-sommes-nous.html"
];

let allHtml = "";
for (const file of htmlFiles) {
  allHtml += "\n\n" + await read(file);
}

const css = await read("assets/style.css");
const js = await read("assets/script.js");

const { classSet: htmlClasses, idSet: htmlIds } = extractHtmlClassesAndIds(allHtml);
const cssClasses = extractCssClasses(css);
const { classes: jsClasses, ids: jsIds } = extractJsSelectors(js);

// Classes réellement utilisées :
const usedClasses = new Set([...htmlClasses, ...jsClasses]);

console.log("=== COHERENCE HTML / CSS / JS (v2) ===");

// --- Classes sans style CSS ---
const htmlJsWithoutCss = [...usedClasses].filter(c => !cssClasses.has(c));
console.log("\nClasses HTML/JS sans style CSS :");
if (htmlJsWithoutCss.length === 0) {
  console.log("  -> OK, toutes les classes utilisées ont un style.");
} else {
  htmlJsWithoutCss.forEach(c => console.log("  - " + c));
}

// --- Classes CSS jamais utilisées ---
const cssNeverUsed = [...cssClasses].filter(c => !usedClasses.has(c));
console.log("\nClasses CSS jamais utilisées :");
if (cssNeverUsed.length === 0) {
  console.log("  -> OK, toutes les classes CSS sont utilisées.");
} else {
  cssNeverUsed.forEach(c => console.log("  - " + c));
}

// --- IDs JS absents du HTML ---
const jsIdsNotInHtml = [...jsIds].filter(id => !htmlIds.has(id));
console.log("\nIDs utilisés dans le JS mais absents du HTML :");
if (jsIdsNotInHtml.length === 0) {
  console.log("  -> OK, tous les IDs JS existent dans le HTML.");
} else {
  jsIdsNotInHtml.forEach(id => console.log("  - " + id));
}

// --- Résumé ---
console.log("\n--- Résumé ---");
console.log("Classes utilisées (HTML+JS): " + usedClasses.size);
console.log("Classes dans le CSS: " + cssClasses.size);
console.log("IDs utilisés dans le JS: " + jsIds.size);
console.log("IDs dans le HTML: " + htmlIds.size);
