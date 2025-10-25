import fs from 'fs';
import path from 'path';

export async function handler() {
  try {
    // 1️⃣ Chemin vers le fichier de données
    const filePath = path.join(process.cwd(), 'data', 'products.json');
    const data = await fs.promises.readFile(filePath, 'utf-8');
    const products = JSON.parse(data);

    // 2️⃣ Normalisation : unifier toutes les clés
    const normalized = products.map(p => ({
      reference: p.id || p.reference || '',
      titre: p.name || p.titre || '',
      couleur: p.color || p.couleur || '',
      // ✅ Gérer à la fois "price" et "prix"
      price: Number(p.price ?? p.prix ?? 0),
      or: p.or || null,
      poids: p.weight || p.poids || null,
      sizes: p.sizes || p.sizesField || null,
    }));

    // 3️⃣ Réponse correcte avec headers
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized),
    };
  } catch (err) {
    console.error('Erreur dans get-products:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
