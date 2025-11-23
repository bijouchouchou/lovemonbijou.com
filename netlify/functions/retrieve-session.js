// retrieve-session.js
// GET ?session_id=cs_test_xxx
// Retourne la session Stripe (et l'expande si besoin)

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  try {
    const sessionId = (event.queryStringParameters && event.queryStringParameters.session_id) || null;
    if (!sessionId) return { statusCode: 400, body: JSON.stringify({ error: 'session_id manquant' }) };

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent', 'customer']
    });

    return { statusCode: 200, body: JSON.stringify({ session }) };
  } catch (err) {
    console.error('retrieve-session error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Impossible de récupérer la session' }) };
  }
};
