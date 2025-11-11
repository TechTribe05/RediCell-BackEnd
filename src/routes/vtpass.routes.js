const express = require('express');
const router = express.Router();
const validateUser = require('../middlewares/auth.middleware');
const vtpassController = require('../controllers/vtpass.controller');

// VTpass routes
router.post('/buy-airtime', validateUser, vtpassController.buyAirtime);
router.post('/buy-data', validateUser, vtpassController.buyData);
router.post('/pay-bill', validateUser, vtpassController.payBill);
router.get('/services', validateUser, vtpassController.getServices);
router.get('/service-variations/:serviceID', validateUser, vtpassController.getServiceVariations);
router.get('/verify-transaction/:request_id', validateUser, vtpassController.verifyTransaction);

module.exports = router;