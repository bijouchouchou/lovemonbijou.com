import { readFile } from 'fs/promises';
import path from 'path';

export async function handler(event, context) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'products.json'); // <-- chemin vers ton JSON
    const data = await readFile(filePath, 'utf-8');
    const products = JSON.parse(data);

    return {
      statusCode: 200,
      body: JSON.stringify(products),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (err) {
    console.error('Erreur get-products:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
}
