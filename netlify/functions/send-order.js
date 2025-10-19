// netlify/functions/send-order.js
import nodemailer from 'nodemailer';

export async function handler(event) {
  try {
    const { cart } = JSON.parse(event.body);

    if (!cart || cart.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Le panier est vide.' })
      };
    }

    // Calcul du total
    const total = cart.reduce((sum, p) => sum + p.prix, 0);

    // Génération du contenu HTML de l'email
    const itemsHtml = cart
      .map(p => `<li>${p.titre} - ${p.couleur} - €${p.prix.toFixed(2)}</li>`)
      .join('');

    const html = `
      <h2>Nouvelle commande</h2>
      <ul>${itemsHtml}</ul>
      <p><strong>Total: €${total.toFixed(2)}</strong></p>
    `;

  // Configuration du transporteur SMTP Infomaniak
const transporter = nodemailer.createTransport({
  host: 'mail.infomaniak.com',
  port: 465,       // 465 pour SSL
  secure: true,    // true car SSL
  auth: {
    user: process.env.ORDER_EMAIL_USER,
    pass: process.env.ORDER_EMAIL_PASS
  }
});

// Envoi de l'email
await transporter.sendMail({
  from: process.env.ORDER_EMAIL_USER,   // votre adresse Infomaniak
  to: process.env.ORDER_EMAIL_USER,     // destinataire, ici vous-même
  subject: 'Nouvelle commande',
  html: `
    <h2>Nouvelle commande</h2>
    <ul>
      ${cart.map(p => `<li>${p.titre} - ${p.couleur} - €${p.prix.toFixed(2)}</li>`).join('')}
    </ul>
    <p><strong>Total: €${cart.reduce((sum, p) => sum + p.prix, 0).toFixed(2)}</strong></p>
  `
});



    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Commande envoyée avec succès !' })
    };

  } catch (err) {
    console.error('Erreur lors de l’envoi de la commande:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
