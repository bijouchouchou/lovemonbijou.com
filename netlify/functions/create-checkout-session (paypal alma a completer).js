const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const items = body.items || [];

        const line_items = items.map(item => ({
            price_data: {
                currency: "eur",
                product_data: {
                    name: item.title + (item.size ? ` — Taille ${item.size}` : ""),
                    metadata: {
                        reference: item.ref || "",
                        size: item.size || "",
                        fabrication: item.fabrication ? "yes" : "no"
                    }
                },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.qty
        }));

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items,
            success_url: `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.URL}/cart.html`
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ id: session.id, url: session.url })
        };

    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
