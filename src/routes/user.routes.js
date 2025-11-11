const express = require('express');
const router = express.Router();
const usercontroller = require('../controllers/user.controller'); // exact filename
const validateUser = require('../middlewares/auth.middleware'); // exact filename

// Public routes
router.post('/register', usercontroller.register);
router.post('/login', usercontroller.login);

// Protected route
router.get('/getUserProfile', validateUser, usercontroller.getUserProfile);

module.exports = router;
