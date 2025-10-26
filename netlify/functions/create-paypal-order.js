import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { cart, shippingFee } = JSON.parse(event.body || "{}");
    const total = (cart.reduce((sum, i) => sum + i.price * i.quantity, 0) + shippingFee).toFixed(2);

    const response = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PAYPAL_CLIENT_TOKEN}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "EUR", value: total } }]
      })
    });

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
