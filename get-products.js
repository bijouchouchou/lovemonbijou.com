const fs = require('fs').promises;
const path = require('path');
const Papa = require('papaparse');

const CLOUDINARY_CLOUD_NAME = 'dcak9pjrt';

function getImageUrl(product) {
  if (product.image && product.image.startsWith('http')) return product.image;
  const reference = product.REFERENCE?.trim() || 'placeholder';
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${reference}.png`;
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const csvPath = path.join(process.cwd(), 'data', 'products.csv');
    const csv = await fs.readFile(csvPath, 'utf-8');

    const cleaned = csv
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !/^,+$/.test(l))
      .join('\n');

    const parsed = Papa.parse(cleaned, { header: true, skipEmptyLines: true });
    
    const products = parsed.data
      .filter(p => p.REFERENCE?.trim())
      .map((p, index) => {
        // conversion du prix
        const prixString = p['price €'] || '0';
        const prixNettoye = prixString.replace(/[^\d,.-]/g, '').replace(',', '.');
        const prixFinal = parseFloat(prixNettoye) || 0;

        // Quantités par taille
        let quantities = [];
        if (p['quantité par taille']) {
          quantities = p['quantité par taille'].split(',').map(s => parseInt(s.trim()) || 1);
        } else if (p['tailles disponibles']) {
          // si pas renseigné, on met 1 par défaut pour chaque taille
          quantities = p['tailles disponibles'].split(',').map(_ => 1);
        }

        return {
          reference: p.REFERENCE?.trim() || '',
          type: p['type de bijoux']?.trim() || '',
          titre: p.TITRE?.trim() || '',
          description: p.description?.trim() || '',
          picture: getImageUrl(p),
          couleur: p.couleur?.trim() || '',
          poids: (p['POIDS OR'] || '').trim(),
          pierres: p['type de pierres'] ? p['type de pierres'].split(',').map(s => s.trim()) : [],
          poidsPierre: p['Poids pierre']?.trim() || '',
          tailles: p['tailles disponibles'] ? p['tailles disponibles'].split(',').map(s => s.trim()) : [],
          quantityPerSize: quantities,
          price: prixFinal,
          stock: parseInt(p.stock) || 0,
          fabricationPossible: (p.fabrication_possible || 'NON').toLowerCase() === 'oui'
        };
      });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: products.length,
        products
      })
    };

  } catch (err) {
    console.error('Erreur:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: err.message
      })
    };
  }
};
