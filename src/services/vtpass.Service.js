const axios = require('axios');
const config = require('../../config/vtuProvider');

const purchaseData = async ({
    network, planCode, phone, amountKobo, reference }) => {
    const payload = { 
        network, plan: planCode, phone, 
        amount: amountKobo, reference };

    if(!config.baseUrl) {
        return {
            success: true,
            providerRef: 'MOCK-' + reference,
            message: 'Mock purchase - provider not configured',
            raw: payload
        };
    }
    try{
            const res = await axios.post(`${config.baseUrl}/api/v1/data`, payload, {
        headers: {
            Authorization: `Bearer ${config.apiKey}`
        }
    });
    return res.data;

    } catch (error) {
        console.error('Data purchase error:', error.response?.data || error.message);
        return {
            success: false, 
            message: 'Data purchase failed',
            error: error.response?.data || error.message
        };
    }
};

const sendAirtime = async ({ network, phone, amountKobo, reference}) => {
    const payload = { network, phone, amount: amountKobo, reference};

    if(!config.baseUrl) {
        return {
            success: true,
            providerRef: 'MOCK-' + reference,
            message: 'Mock airtime - provider not configured',
            raw: payload
        };
    }
    try{
        const res =await axios.post(`${config.baseUrl}/api/v1/airtime`, payload, {
        headers: {
            Authorization: `Bearer ${config.apiKey}`
        }
    });
    return res.data;

    } catch (error) {
        console.error('Airtime send error:', error.response?.data || error.message);
        return {
            success: false,
            message: 'Airtime sending failed',
            error: error.response?.data || error.message
        };
    }
};

module.exports = { purchaseData, sendAirtime };