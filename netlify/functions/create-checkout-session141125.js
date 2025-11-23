// /netlify/functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Méthode non autorisée" })
      };
    }

    const { items } = JSON.parse(event.body || "{}");

    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Panier vide ou invalide." })
      };
    }

    // Transforme ton panier en line_items Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.title + (item.fabrication ? " (Fabrication)" : ""),
          metadata: {
            ref: item.ref || "",
            fabrication: item.fabrication ? "true" : "false"
          }
        },
        unit_amount: Math.round(item.price * 100), // prix en centimes
      },
      quantity: item.quantity,
    }));

    // URLs depuis le .env
    const baseUrl = process.env.URL || "https://lovemonbijou.com";

    // Création session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,

      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel.html`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    console.error("Stripe error:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur serveur Stripe.",
        details: err.message
      })
    };
  }
};
