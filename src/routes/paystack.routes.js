const express = require("express");
const router = express.Router();
const { initializePayment, verifyPayment, paystackWebhook } = require("../controllers/paystack.controller");
const validateUser = require("../middleware/validateUser");

router.post("/initialize/payment", validateUser, initializePayment);
router.get("/verify/:reference", validateUser, verifyPayment);
router.post("/webhook", express.raw({ type: "application/json" }), paystackWebhook); // Important: raw body!

module.exports = router;
