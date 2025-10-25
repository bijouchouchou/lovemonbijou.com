import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function handler() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'products.csv');
    const csv = await fs.promises.readFile(filePath, 'utf-8');

    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true, quoteChar: '"' });

    const products = parsed.data
      .filter(p => p.REFERENCE && p.REFERENCE.trim() !== '') // ignore les lignes vides
      .map(p => ({
        reference: p.REFERENCE.trim(),
        type: p['type de bijoux']?.trim() || '',
        description: p.description?.trim() || '',
        picture: p.image?.trim() || '',
        couleur: p.couleur?.trim() || '',
        titre: p.TITRE?.trim() || '',
        poids: p['POIDS OR']?.replace(',', '.') || null,
        pierres: p['type de pierres']?.split(',').map(s => s.trim()) || [],
        sizes: p['tailles disponibles']?.split(',').map(s => s.trim()) || [],
        quantityPerSize: p['quantité par taille']?.split(',').map(s => s.trim()) || [],
        price: parseFloat((p.price || '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0
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
