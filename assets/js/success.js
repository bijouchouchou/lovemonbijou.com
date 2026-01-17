import { sendOrderConfirmationEmail } from "./email/sendOrderEmail.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  if (!sessionId) return;

  // Anti double-envoi
  if (sessionStorage.getItem("email_sent")) return;

  const res = await fetch(`/.netlify/functions/retrieve-session?session_id=${sessionId}`);
  if (!res.ok) return;

  const { session } = await res.json();

  const orderSummary = {
    orderId: session.id,
    date: new Date().toLocaleDateString("fr-FR"),
    email: session.customer_details.email,
    amount: {
      total: session.amount_total / 100,
      currency: session.currency
    }
  };

  try {
    await sendOrderConfirmationEmail(orderSummary);
    sessionStorage.setItem("email_sent", "true");
    console.log("📩 Email de confirmation envoyé");
  } catch (err) {
    console.error("Erreur email :", err);
  }
});
