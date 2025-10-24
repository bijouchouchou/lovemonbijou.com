// netlify/functions/get-products.js
import fs from 'fs';
import path from 'path';

export async function handler() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'products.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const products = JSON.parse(data);

    // Normalisation : s'assurer que toutes les clés sont cohérentes avec catalogue
    const normalized = products.map(p => ({
      reference: p.id || p.reference || '',
      titre: p.name || p.titre || '',
      couleur: p.color || p.couleur || '',
      price: p.price || p.prix || 0,
      or: p.or || null,
      poids: p.weight || p.poids || null,
      sizes: p.sizes || p.sizesField || null,
    }));

    return { statusCode: 200, body: JSON.stringify(normalized) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
