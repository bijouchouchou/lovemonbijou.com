// netlify/functions/send-order.js
import nodemailer from 'nodemailer';

export async function handler(event) {
  try {
    const { cart, email } = JSON.parse(event.body || '{}');
    if (!cart || !email) {
      return { statusCode: 400, body: 'Données manquantes' };
    }

    // Exemple SMTP test (à remplacer par tes infos réelles)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const total = cart.reduce((sum, p) => sum + p.price * p.quantity, 0);

    const html = `
      <h2>Nouvelle commande</h2>
      <ul>
        ${cart.map(p => `<li>${p.titre} (${p.size}) x${p.quantity} - €${p.price.toFixed(2)}</li>`).join('')}
      </ul>
      <p>Total: €${total.toFixed(2)}</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Confirmation de commande',
      html,
    });

    return { statusCode: 200, body: JSON.stringify({ message: 'Email envoyé !' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
