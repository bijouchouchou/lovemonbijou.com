// webhook.js
// Configure Stripe webhook verification.
// IMPORTANT: pour le test local, lance : stripe listen --forward-to localhost:8888/.netlify/functions/webhook
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  const rawBody = event.body; // body comes as string raw from Netlify functions

  if (!sig) {
    console.error('Missing stripe-signature header');
    return { statusCode: 400, body: 'Missing signature' };
  }

  try {
    // Verify event
    const stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);

    // Handle event types
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        console.log('✅ checkout.session.completed', session.id);

        // Exemple : récupérer line items (via API) si besoin
        // const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

        // TODO : ici tu peux :
        //  - créer une commande en base
        //  - envoyer un email via un service backend (SMTP / Sendgrid / Mailgun)
        //  - déclencher une fabrication automatique
        // Exemple console log:
        console.log('Session metadata:', session.metadata);

        break;
      }
      case 'payment_intent.succeeded': {
        console.log('payment_intent.succeeded', stripeEvent.data.object.id);
        break;
      }
      default:
        console.log('Unhandled event type', stripeEvent.type);
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('Webhook signature failed:', err && err.message ? err.message : err);
    return { statusCode: 400, body: `Webhook Error: ${err && err.message ? err.message : 'unknown'}` };
  }
};
