import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function handler() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'products.csv');
    const csv = await fs.promises.readFile(filePath, 'utf-8');

    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });

    const products = parsed.data.map((p) => ({
      reference: p.reference || '',
      picture: p.picture || '',
      couleur: p.couleur || '',
      titre: p.titre || '',
      poids: p.poids || null,
      or: p.or || '',
      qualite_diamant: p.qualite_diamant || '',
      nombre_diamant: p.nombre_diamant || '',
      serti: p.serti || '',
      autre_pierre: p.autre_pierre || '',
      price: parseFloat(p.prix || 0), // clé uniforme pour le front
      sizes: p.sizes ? p.sizes.split(';').map(s => s.trim()) : null,
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(products),
    };
  } catch (err) {
    console.error('Erreur lecture CSV:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
