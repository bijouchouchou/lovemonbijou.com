// create-checkout-session.js
// Netlify Function: crée une session Stripe Checkout à partir d'un panier envoyé depuis le front.
// Attendu: POST JSON { items: [ { REFERENCE, TITRE, price_euros, price, quantity, image } ], metadata: { ... } }
// Les prix doivent être en Euros TTC (TVA incluse) et fournis en champ price_euros (ou price).
// Retour: { sessionId, url }

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Panier vide' }) };
    }

    // Construire les line_items Stripe
    const line_items = items.map(item => {
      // essayer différents champs de prix (front peut envoyer price_euros ou price)
      const priceFloat = parseFloat(item.price_euros ?? item.price ?? item.unit_price ?? 0) || 0;
      const unit_amount = Math.round(priceFloat * 100); // en centimes

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.TITRE || item.title || item.name || item.REFERENCE || 'Produit',
            metadata: {
              reference: item.REFERENCE || '',
              type: item.type || ''
            },
            images: item.image ? [item.image] : undefined
          },
          unit_amount
        },
        quantity: item.quantity ? parseInt(item.quantity, 10) : 1
      };
    });

    // Optional: metadata général (ex: email client, options fabrication)
    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: false },
      allow_promotion_codes: true,
      metadata,
      success_url: `${process.env.BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/cancel.html`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id, url: session.url })
    };

  } catch (err) {
    console.error('create-checkout-session error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erreur serveur' }) };
  }
};
