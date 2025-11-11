const express = require('express');
const router = express.Router();
const { buyData, buyAirtime, payBill, getATransactions, getAllTransactions } = require('../controllers/transaction.controller');
const validateUser = require('../middlewares/auth.middleware');

//Transaction end-point
router.post('/buy-data', validateUser, buyData);
router.post('/buy-airtime', validateUser, buyAirtime);
router.post('/pay-bill', validateUser, payBill);

// Transaction routes
router.get('/my-transactions', validateUser, getATransactions);
// router.get('/all-transactions', validateUser, transactionController.getAllTransactions); // Add admin middleware if needed

module.exports = router;
