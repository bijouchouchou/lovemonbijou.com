// netlify/functions/create-alma-session.js
import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { cart, total } = JSON.parse(event.body || "{}");

    const response = await fetch("https://api.sandbox.getalma.eu/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.ALMA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        payment: {
          purchase_amount: Math.round(total * 100),
          installments_count: 3, // 3x par défaut
          return_url: `${process.env.URL}/success.html`,
          cancel_url: `${process.env.URL}/cancel.html`,
        },
        customer: { email: "test@example.com" } // tu peux remplacer plus tard
      }),
    });

    const data = await response.json();

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
