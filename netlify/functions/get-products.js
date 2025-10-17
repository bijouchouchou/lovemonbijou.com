// netlify/functions/get-products.js 
import { google } from 'googleapis'; 
 
export async function handler() { 
  try { 
    // On récupère les identifiants du compte de service Google 
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT); 
 
    const auth = new google.auth.GoogleAuth({ 
      credentials, 
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], 
    }); 
 
    const sheets = google.sheets({ version: 'v4', auth }); 
 
    // Lecture du Google Sheet "catalogue" 
    const response = await sheets.spreadsheets.values.get({ 
      spreadsheetId: process.env.GOOGLE_SHEETS_ID, 
      range: 'catalogue!A2:K', // ✅ A → K = 11 colonnes (inclut "Autre pierre") 
    }); 
 
    const rows = response.data.values || []; 
 
    // Conversion des lignes du Google Sheet en objets produits 
    const products = rows.map((row) => ({ 
      reference: row[0] || '', 
      picture: row[1] || '', 
      couleur: row[2] || '', 
      titre: row[3] || '', 
      poids: row[4] || '', 
      or: row[5] || '', 
      qualite_diamant: row[6] || '', 
      nombre_diamant: row[7] || '', 
      serti: row[8] || '', 
      autre_pierre: row[9] || '', // 🆕 nouvelle colonne 
      prix: parseFloat(row[10]) || 0, // 🆗 décalée d'une case 
    })); 
 
    // On renvoie la liste des produits au frontend 
    return { 
      statusCode: 200, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(products), 
    }; 
 
  } catch (error) { 
    console.error('Erreur lors de la lecture du Google Sheet :', error); 
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }), 
    }; 
  } 
} 

