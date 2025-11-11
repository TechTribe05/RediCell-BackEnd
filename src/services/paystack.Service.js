const axios = require('axios');
const config = require('../../config/paystack');

const initializeTransaction = async (email, amount, metadata) =>{
    const PAYSTACKTEST_SECRET = process.env.PAYSTACKTEST_SECRET;

    const url =  "https://api.paystack.co/transaction/initialize";

    const response = await axios.post(
        url, {email, amount, metadata},
        { headers: { Authorization: `Bearer ${  PAYSTACKTEST_SECRET}`}}
    );
    return response.data.data;
};

const verifyTransaction = async (reference) => {
    const response =await axios.get(`${config.baseUrl}/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${config.secretKey}` }
    });
    return response.data.data;
};

module.exports = { initializeTransaction, verifyTransaction };