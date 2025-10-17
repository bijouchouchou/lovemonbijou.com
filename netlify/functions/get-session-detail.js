import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  const id = event.queryStringParameters.session_id;
  const s = await stripe.checkout.sessions.retrieve(id);
  const order = s.metadata?.order_data ? JSON.parse(s.metadata.order_data) : [];
  return {
    statusCode: 200,
    body: JSON.stringify({
      total: (s.amount_total / 100).toFixed(2),
      currency: s.currency,
      order
    })
  };
}
