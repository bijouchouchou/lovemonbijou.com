// netlify/functions/send-order.js
import nodemailer from 'nodemailer';

export async function handler(event) {
  try {
    // Récupération du panier depuis le body
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
    const htmlContent = `
      <h2>Nouvelle commande</h2>
      <ul>
        ${cart.map(p => `<li>${p.titre} - ${p.couleur} - €${p.prix.toFixed(2)}</li>`).join('')}
      </ul>
      <p><strong>Total: €${total.toFixed(2)}</strong></p>
    `;

    // Configuration du transporteur SMTP Infomaniak
    const transporter = nodemailer.createTransport({
      host: 'mail.infomaniak.com',
      port: 465,       // SSL
      secure: true,    // true car SSL
      auth: {
        user: process.env.ORDER_EMAIL_USER,
        pass: process.env.ORDER_EMAIL_PASS
      }
    });

    // Envoi de l'email
    await transporter.sendMail({
      from: process.env.ORDER_EMAIL_USER,
      to: process.env.ORDER_EMAIL_USER,
      subject: 'Nouvelle commande',
      html: htmlContent
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Commande envoyée avec succès !' })
    };

  } catch (err) {
    console.error('Erreur lors de l’envoi de la commande :', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
