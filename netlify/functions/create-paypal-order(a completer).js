const fetch = require("node-fetch");

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const items = body.items || [];

        const clientId = process.env.PAYPAL_CLIENT_ID;
        const secret = process.env.PAYPAL_CLIENT_SECRET;

        // 1 — Auth
        const auth = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
            method: "POST",
            headers: {
                "Authorization": "Basic " + Buffer.from(clientId + ":" + secret).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials"
        }).then(r => r.json());

        // 2 — Create order
        const order = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${auth.access_token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [{
                    items: items.map(i => ({
                        name: i.title + (i.size ? ` — Taille ${i.size}` : ""),
                        unit_amount: { value: i.price.toFixed(2), currency_code: "EUR" },
                        quantity: i.qty
                    })),
                    amount: {
                        currency_code: "EUR",
                        value: items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)
                    }
                }],
                payment_source: {}
            })
        }).then(r => r.json());

        const approvalUrl = order.links.find(l => l.rel === "approve")?.href;

        return {
            statusCode: 200,
            body: JSON.stringify({
                orderID: order.id,
                approvalUrl
            })
        };

    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
