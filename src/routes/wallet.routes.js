const express = require('express');
const router = express.Router();
const { topupWallet, verifyTopup, getTransactionStatus } = require('../controllers/wallet.controller');
const  validateUser  = require('../middlewares/auth.middleware');

// Topup wallet (initialize Paystack payment)
router.post('/topup', validateUser, topupWallet);

// Verify Paystack payment
router.get('/verify-topup/:reference', validateUser, verifyTopup);

// Get transaction status
router.get('/transaction-status/:reference', validateUser, getTransactionStatus);

module.exports = router;