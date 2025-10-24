import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  try {
    const { cart, shippingFee, method } = JSON.parse(event.body || "{}");

    if (!cart || cart.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Panier vide" }) };
    }

    // 🔹 Convertir les produits en format Stripe
    const line_items = cart.map(i => ({
      price_data: {
        currency: "eur",
        product_data: { name: `${i.name} (${i.size})` },
        unit_amount: Math.round(i.price * 100),
      },
      quantity: i.quantity
    }));

    // 🔹 Ajouter les frais de livraison
    if (shippingFee > 0) {
      line_items.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Frais de livraison" },
          unit_amount: Math.round(shippingFee * 100),
        },
        quantity: 1
      });
    }

    // 🧠 Redirection selon le mode de paiement choisi
    if (method === "stripe") {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items,
        success_url: `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.URL}/cancel.html`,
        metadata: { order_data: JSON.stringify(cart) }
      });
      return { statusCode: 200, body: JSON.stringify({ id: session.id, url: session.url }) };
    }

    if (method === "paypal") {
      // Redirection simulée vers une page PayPal test
      const paypalUrl = `${process.env.URL}/paypal-simulate.html`;
      return { statusCode: 200, body: JSON.stringify({ url: paypalUrl }) };
    }

    if (method === "alma") {
      // Redirection simulée vers Alma (paiement 3x)
      const almaUrl = `${process.env.URL}/alma-simulate.html`;
      return { statusCode: 200, body: JSON.stringify({ url: almaUrl }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Méthode de paiement inconnue" }) };

  } catch (err) {
    console.error("Erreur dans create-checkout-session:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
