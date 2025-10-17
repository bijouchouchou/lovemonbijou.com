import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  try {
    const { cart, shippingFee } = JSON.parse(event.body || "{}");
    const line_items = cart.map(i => ({
      price_data: {
        currency: "eur",
        product_data: { name: `${i.name} (${i.size})` },
        unit_amount: Math.round(i.price * 100),
      },
      quantity: i.quantity
    }));
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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/cancel.html`,
      metadata: { order_data: JSON.stringify(cart) }
    });
    return { statusCode: 200, body: JSON.stringify({ id: session.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
