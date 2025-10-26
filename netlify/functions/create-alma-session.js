import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { cart, shippingFee } = JSON.parse(event.body || "{}");

    // Alma attend le total en centimes
    const amount = Math.round(
      cart.reduce((sum, i) => sum + i.price * i.quantity, 0) + shippingFee
    );

    const response = await fetch("https://api.getalma.eu/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.ALMA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount,
        currency: "EUR",
        country: "FR",
        test: true
      })
    });

    const data = await response.json();

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
