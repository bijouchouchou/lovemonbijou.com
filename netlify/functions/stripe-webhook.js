import Stripe from "stripe";
import { google } from "googleapis";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getSheetsClient() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function handler(event) {
  const sig = event.headers["stripe-signature"];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const s = stripeEvent.data.object;
    const orderData = s.metadata?.order_data ? JSON.parse(s.metadata.order_data) : [];

    const sheets = await getSheetsClient();
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const rows = orderData.map(p => [
      new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" }),
      s.id,
      s.customer_details?.email || "",
      p.name,
      p.size || "",
      p.ref || "",
      p.quantity,
      (s.amount_total / 100).toFixed(2),
      s.currency.toUpperCase()
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "A:I",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows }
    });
  }
  return { statusCode: 200, body: JSON.stringify({ received: true }) };
}
