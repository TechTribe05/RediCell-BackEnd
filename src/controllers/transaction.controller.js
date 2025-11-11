const User = require('../models/user.schema');
const Transaction = require('../models/transaction.schema');
const Ledger = require('../models/ledger.schema');
// const vtpassService = require('../services/vtpass.service');


// Helper to create ledger entries
async function createLedger(userId, transactionId, type, amount, description) {
    return Ledger.create({
        userId,
        transactionId,
        type,
        amount,
        description
    });
}

// Fake service provider function (simulate external API call)
async function callServiceProviderAPI(serviceType, payload) {
    console.log(`[ServiceAPI] Simulating ${serviceType} with:`, payload);
    // Simulate a delay
    await new Promise(r => setTimeout(r, 1000));
    // Always return success for now
    return { success: true, reference: 'PROV-' + Date.now() };
}

// 🟡 BUY DATA
const buyData = async (req, res) => {
    try {
        const { userId, network, plan, recipientPhone, amount } = req.body;

        // 1️⃣ Get user
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.walletBalance < amount) return res.status(400).json({ success: false, message: 'Insufficient funds' });

        // 2️⃣ Generate payment reference
        const paymentReference = `REF-${Date.now()}`;
        const serviceType = 'data';

        // 3️⃣ Create transaction
        const txn = await Transaction.create({
            userId,
            serviceType,                   
            paymentReference,        
            amount,
            serviceDetails: { network, plan, recipientPhone }  // ✅ matches schema
        });

        // 4️⃣ Debit wallet
        user.walletBalance -= amount;
        await user.save();

        // 5️⃣ Create ledger entry
        await createLedger(userId, txn._id, 'DEBIT', amount, `Buy data - ${network} ${plan}`);

        // 6️⃣ Call service provider
        const providerRes = await callServiceProviderAPI('buyData', { network, plan, recipientPhone, amount });

        if (providerRes.success) {
            txn.isPaid = true;
            txn.paidAt = new Date();
            txn.serviceDetails.providerRef = providerRes.reference;
            await txn.save();

            return res.status(200).json({ success: true, message: 'Data purchase successful', transaction: txn });
        } else {
            // Refund
            user.walletBalance += amount;
            await user.save();

            txn.isPaid = false;
            await txn.save();
            return res.status(400).json({ success: false, message: 'Data purchase failed, wallet refunded' });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err.message });
    }
};


// 🟡 BUY AIRTIME
const buyAirtime = async (req, res) => {
    try {
        const { userId, network, recipientPhone, amount } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.walletBalance < amount) return res.status(400).json({ success: false, message: 'Insufficient funds' });

        const paymentReference = `REF-${Date.now()}`;
        const serviceType = 'airtime';

        const txn = await Transaction.create({
            userId,
            serviceType,
            paymentReference,
            amount,
            serviceDetails: { network, recipientPhone }
        });

        user.walletBalance -= amount;
        await user.save();

        await createLedger(userId, txn._id, 'DEBIT', amount, `Send airtime - ${network}`);

        const providerRes = await callServiceProviderAPI('sendAirtime', { network, recipientPhone, amount });

        if (providerRes.success) {
            txn.isPaid = true;
            txn.paidAt = new Date();
            txn.serviceDetails.providerRef = providerRes.reference;
            await txn.save();
            return res.status(200).json({ success: true, message: 'Airtime sent successfully', transaction: txn });
        } else {
            user.walletBalance += amount;
            await user.save();
            txn.isPaid = false;
            await txn.save();
            return res.status(400).json({ success: false, message: 'Airtime sending failed, wallet refunded' });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err.message });
    }
};


// 🟡 PAY BILL
const payBill = async (req, res) => {
    try {
        const { userId, biller, accountNumber, amount } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.walletBalance < amount) return res.status(400).json({ success: false, message: 'Insufficient funds' });

        const paymentReference = `REF-${Date.now()}`;
        const serviceType = 'bill';

        const txn = await Transaction.create({
            userId,
            serviceType,
            paymentReference,
            amount,
            serviceDetails: { biller, accountNumber }
        });

        user.walletBalance -= amount;
        await user.save();

        await createLedger(userId, txn._id, 'DEBIT', amount, `Pay bill - ${biller}`);

        const providerRes = await callServiceProviderAPI('payBill', { biller, accountNumber, amount });

        if (providerRes.success) {
            txn.isPaid = true;
            txn.paidAt = new Date();
            txn.serviceDetails.providerRef = providerRes.reference;
            await txn.save();
            return res.status(200).json({ success: true, message: 'Bill paid successfully', transaction: txn });
        } else {
            user.walletBalance += amount;
            await user.save();
            txn.isPaid = false;
            await txn.save();
            return res.status(400).json({ success: false, message: 'Bill payment failed, wallet refunded' });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// 🟡 GET USER TRANSACTIONS (for specific user)
const getATransactions = async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID from authenticated request
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: "User ID is required." 
            });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found." 
            });
        }

        const transactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 })
            .select('serviceType paymentReference amount isPaid paidAt serviceDetails createdAt updatedAt');

        return res.status(200).json({
            success: true,
            message: "Transactions fetched successfully.",
            count: transactions.length,
            transactions
        });

    } catch (error) {
        console.error("Get user transactions error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to fetch transactions",
            error: error.message 
        });
    }
};

// 🟡 GET ALL TRANSACTIONS (admin view)
// const getAllTransactions = async (req, res) => {
//     try {
//         // Optional: Add admin check here
//         // if (req.user.role !== 'admin') {
//         //     return res.status(403).json({ 
//         //         success: false, 
//         //         message: "Access denied. Admin rights required." 
//         //     });
//         // }

//         const transactions = await Transaction.find()
//             .sort({ createdAt: -1 })
//             .populate('userId', 'firstName lastName email phone') // Populate user details
//             .select('userId serviceType paymentReference amount isPaid paidAt serviceDetails createdAt updatedAt');

//         return res.status(200).json({
//             success: true,
//             message: "All transactions fetched successfully.",
//             count: transactions.length,
//             transactions
//         });

//     } catch (error) {
//         console.error("Get all transactions error:", error);
//         return res.status(500).json({ 
//             success: false, 
//             message: "Failed to fetch all transactions",
//             error: error.message 
//         });
//     }
// };
module.exports = { buyData, buyAirtime, payBill, getATransactions };
