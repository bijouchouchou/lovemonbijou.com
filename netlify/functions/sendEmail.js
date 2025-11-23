// netlify/functions/sendEmail.js
// Exemple Node.js (CommonJS) compatible Netlify Functions.
// Pour utiliser : place ce fichier dans netlify/functions/sendEmail.js
// Puis configure les variables d'environnement pour ton fournisseur d'email.

// handler
exports.handler = async function(event, context) {
  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    // payload.cart, payload.total
    console.log('SendEmail called. Payload:', payload);

    // TODO: remplacer ce bloc par l'intégration à ton fournisseur d'email.
    // Exemples :
    // - SendGrid : sendgrid.send({...})
    // - Resend : fetch('https://api.resend.com/emails', { headers:{ Authorization: `Bearer ${process.env.RESEND_API_KEY}` }, body: JSON })
    // Utilise le fichier email/confirmation.html comme template si besoin.

    // Réponse simulée OK
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: 'Simulated email sent (configure provider).' })
    };
  } catch (err) {
    console.error('sendEmail error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
