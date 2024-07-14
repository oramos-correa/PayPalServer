// const express = require("express");
// const paypal = require("paypal-rest-sdk");
// const app = express();
import express from "express";
import paypal from "paypal-rest-sdk";

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, world!');
  });
  

paypal.configure({
    mode: "sandbox",
    client_id:
    "Ad4Ggwjs4bqu2vzPbK51Ff9dHNE8qIUeR26EToLARsnagO-FlTD9YH_P50BRmaD6y5piFtjZCE41UsN0",
    client_secret:
    "EPqAzHXYD3Wu0KGS9ppqcXhHzSE2_zTIdj2cW5xOmWrKDSvvCsu_FjFhJO3SDdFF-wCmqksp6CZ26kAy",
});

app.post("/create-payment", (req, res) => {

    console.log("Test Amount", req.body)

    const create_payment_json = {
        intent: "sale",
        payer: {
            payment_method: "paypal"
        },
        redirect_urls: {
            return_url: "http://localhost:19000/success",
            cancel_url: "http://localhost:19000/cancel"
        },
        transactions: [
            {
                item_list: {
                    items: [
                        {
                            name: req.body.name,
                            sku: req.body.sku,
                            price: req.body.amount,
                            currency: "USD",
                            quantity: req.body.quantity
                        }
                    ]
                },
                amount: {
                    currency: "USD",
                    total: req.body.total
                },
                payee: {
                    email: req.body.payeeEmail // Add the payee's email address here
                },
                description: req.body.desc
            }
        ]
    };

    paypal.payment.create(create_payment_json, (error, payment) => {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === "approval_url") {
                    console.log(payment.links[i].href);
                    res.json(payment.links[i].href);
                }
            }
        }
    });
});

app.post("/execute-payment", (req, res) => {
    console.log("Amount ExeCuted", req.body.total);
    console.log("PayerID ExeCuted", req.body.payerId);
    console.log("PaymentID ExeCuted", req.body.paymentId);
    console.log("ExeCute", req.body);
    const payerId = req.body.payerId;
    const paymentId = req.body.paymentId;

    const execute_payment_json = {
        payer_id: payerId,
        transactions: [
            {
                amount: {
                    currency: "USD",
                    total: req.body.total
                }
            }
        ]
    };

    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
        if (error) {
            throw error;
        } else {
            const saleId = payment.transactions[0].related_resources[0].sale.id;
            res.json({ message: "Payment completed successfully", saleId: saleId });
        }
    });
});


app.get("/success", (req, res) => {
    res.send("Success! Payment was completed.");
});

app.get("/cancel", (req, res) => {
    res.send("Payment was cancelled.");
});



//WORK ON REFUND CODE
app.post("/refund-payment", (req, res) => {
    const saleId = req.body.saleId; // Ensure the client provides the sale ID
    const refund_json = {
        amount: {
            currency: "USD",
            total: req.body.amount // The amount to refund
        }
    };

    paypal.sale.refund(saleId, refund_json, (error, refund) => {
        if (error) {
            console.error("Refund Error:", error);
            res.status(500).json({ error: "Refund failed" });
        } else {
            console.log("Refund Success:", refund);
            res.json({ message: "Refund completed successfully", refund });
        }
    });
});




const PORT = process.env.PORT || 19000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})