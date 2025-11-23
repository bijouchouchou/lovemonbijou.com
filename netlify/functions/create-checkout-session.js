// netlify/functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const cart = body.cart || { items: [] };
    // Build line_items from cart.items
    const line_items = cart.items.map(i => ({
      price_data: {
        currency: 'eur',
        product_data: { name: i.title },
        unit_amount: Math.round((i.price || 0) * 100)
      },
      quantity: i.qty || 1
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: body.successUrl || `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: body.cancelUrl || `${process.env.URL}/cancel.html`
    });
    return { statusCode: 200, body: JSON.stringify({ sessionId: session.id, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
