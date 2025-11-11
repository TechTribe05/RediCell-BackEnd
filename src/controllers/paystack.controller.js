const Transaction = require("../models/transaction.schema");
const User = require("../models/user.schema");
const crypto = require("crypto");
const fs = require('fs');
const  paystack = require("paystack-api")(process.env.PAYSTACKTEST_SECRET);


////INITIALIZE PAYMENT ✅✅
const initializePayment = async (req, res) =>{
    try{
        const userId = req.userData.userId;
        const phone = req.userData.phone;
        const email = req.userData.email;
        const { amount, serviceType, serviceDetails } = req.body;

        if(!userId || !phone ||  !email || !amount || !serviceType || !serviceDetails) {
            return res.status(400).json({ success: false, 
                message: "All field required."});
        }
        const reference =  `redicell_${ userId }_${ Date.now () }`; 

        const paymentData = {
            email: email,  amount:  Math.round(amount * 100), 
            currency: "NGN", reference, metadata: {
                userId: userId.toString( ),
                serviceType, serviceDetails,
            },
        };
        const paystackResponse =await paystack.transaction.initialize(paymentData);

        if(!paystackResponse.status) {
            return res.status(400).json({ success: false,
                 message: "Payment initialization failed.",
                 error: paystackResponse.message });
        }
        const transaction = new Transaction({
            userId, serviceType, serviceDetails, amount,
             paymentReference: reference, 
            });
            await transaction.save();

            return res.status(200).json({ success: true, 
                message: "Payment initialize successfully.", 
            data: {
                authrization_url: paystackResponse.data.authrization_url,
                access_code: paystackResponse.data.access_code, reference, 
                amount,
            },
        });
    } catch(error){
        return res.status(500).json({ success: false, error: error.message });
    }
};

///VERIFY PAYMENT ✅✅
const verifyPayment = async (req, res) => {
    try{
        const  {reference} = req.params;
        if(!reference) {
             return res.status(400).json({ success: false, 
                message: "Payment reference is required."});
        }
        const paystackResponse = await paystack.transaction.verify({reference});
        const transaction = await Transaction.findOne({ paymentReference: reference});

        if(!transaction) {
            return res.status(400).json({ success: false, message: "Transaction not found."});
        }
        if(paystackResponse.status && paystackResponse.data.status ==="success") {
             if(!transaction.isPaid) {
                transaction.isPaid = true;
                transaction.paidAt =paystackResponse.data.paid_at || new Date();
                await transaction.save();
            }
            return res.status(200).json({ success: true, 
                message: "Payment verified successfully.", 
                data: {
                    transaction, paystack: paystackResponse.data,
                },
            });
       }
       return res.status(400).json({ success: false, 
        message: "Payment not successful", paystack: paystackResponse.data });

    }catch(error) {
        return res.status(500).json({ success: false, error: error.message });
    }         
};


module.exports = { initializePayment, verifyPayment };