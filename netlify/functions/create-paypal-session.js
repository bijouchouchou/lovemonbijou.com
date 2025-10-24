import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  try {
    const { cart, shippingFee, paymentMethod } = JSON.parse(event.body || '{}');

    if (!cart || cart.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Panier vide' }) };
    }

    // Préparation des lignes pour Stripe
    const line_items = cart.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: { name: `${item.titre} (${item.size})` },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    if (shippingFee > 0) {
      line_items.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Frais de livraison' },
          unit_amount: Math.round(shippingFee * 100),
        },
        quantity: 1,
      });
    }

    // Définition du mode de paiement selon choix
    let paymentMethods = ['card']; // Stripe par défaut
    if (paymentMethod === 'alma') {
      paymentMethods = ['card']; // Alma utilise Stripe, mais via un plan de paiement
    } else if (paymentMethod === 'paypal') {
      // Pour PayPal, tu devras intégrer via un bouton PayPal JS séparé
      paymentMethods = ['card']; // ici on laisse Stripe pour test
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethods,
      mode: 'payment',
      line_items,
      success_url: `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/cancel.html`,
      metadata: { order_data: JSON.stringify(cart) },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
