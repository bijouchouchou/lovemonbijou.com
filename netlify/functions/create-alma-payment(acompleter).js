const fetch = require("node-fetch");

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const items = body.items || [];

        const amount = Math.round(
            items.reduce((s, i) => s + i.price * i.qty, 0) * 100
        );

        const resp = await fetch("https://api.getalma.eu/v1/payments", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.ALMA_PRIVATE_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                installments_count: 3,
                purchase_amount: amount,
                return_url: `${process.env.URL}/success.html?alma_payment_id={payment_id}`
            })
        });

        const data = await resp.json();

        return {
            statusCode: 200,
            body: JSON.stringify({ url: data.url })
        };

    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
