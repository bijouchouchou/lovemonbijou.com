import emailjs from "https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js";

emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

export async function sendOrderConfirmationEmail(order) {
  return emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_ORDER,
    {
      order_id: order.orderId,
      order_date: order.date,
      customer_email: order.email,
      total_amount: `${order.amount.total.toFixed(2)} €`
    }
  );
}
