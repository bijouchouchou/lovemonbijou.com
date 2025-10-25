import fs from 'fs';
import path from 'path';

export async function handler() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'products.csv');
    const csv = await fs.promises.readFile(filePath, 'utf-8');

    const lines = csv.trim().split('\n');
    const headers = lines.shift().split(',');

    const products = lines.map((line) => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = values[i]?.trim() || '';
      });
      // Convertir le prix en nombre
      obj.prix = parseFloat(obj.prix || 0);
      return obj;
    });

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
