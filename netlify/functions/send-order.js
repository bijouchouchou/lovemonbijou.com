import nodemailer from 'nodemailer';

export async function handler(event) {
  try {
    const data = JSON.parse(event.body);

    // Données attendues : { cart: [...], email: "client@example.com" }
    const cart = data.cart;
    const total = cart.reduce((sum, p) => sum + p.prix, 0);

    // Contenu HTML de l’email
    const itemsHtml = cart.map(p => `
      <li>${p.titre} - ${p.couleur} - €${p.prix.toFixed(2)}</li>
    `).join('');

    const html = `
      <h2>Nouvelle commande</h2>
      <ul>${itemsHtml}</ul>
      <p><strong>Total: €${total.toFixed(2)}</strong></p>
    `;

    // Configurer nodemailer avec un compte Gmail / App Password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ORDER_EMAIL_USER, // bijouchou@gmail.com
        pass: process.env.ORDER_EMAIL_PASS, // mot de passe application Gmail
      }
    });

    await transporter.sendMail({
      from: process.env.ORDER_EMAIL_USER,
      to: process.env.ORDER_EMAIL_USER, // vous-même
      subject: 'Nouvelle commande',
      html
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Commande envoyée avec succès !' })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
