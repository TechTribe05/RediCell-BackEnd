const paystackService = require("../services/paystack.Service");
const Transaction = require("../models/transaction.schema");
const User = require("../models/user.schema");
const { generateRef } = require("../utils/id");

const topupWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = req.user;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid amount." 
            });
        }

        // 💰 Convert amount to Kobo
        const amountKobo = Math.round(Number(amount) * 100);
        const reference = generateRef();

        const metadata = {
            userId: user._id.toString(),
            type: "WALLET_FUND",
            reference,
            userEmail: user.email,
            userName: `${user.firstName} ${user.lastName}`
        };

        // 🚀 Initialize Paystack transaction
        const paystackInit = await paystackService.initializeTransaction(
            user.email,
            amountKobo,
            metadata
        );

        // Create transaction record
        await Transaction.create({
            userId: user._id,
            serviceType: "WALLET_FUND",
            amount: amount,
            amountKobo: amountKobo,
            status: "PENDING",
            paymentReference: paystackInit.reference,
            meta: { 
                paystackInit,
                userEmail: user.email,
                userName: `${user.firstName} ${user.lastName}`
            }
        });

        console.log(`🟡 PAYMENT INITIALIZED: User ${user._id}, Amount: ₦${amount}, Reference: ${paystackInit.reference}`);

        return res.status(200).json({ 
            success: true, 
            message: "Payment initialized successfully.",
            authorization_url: paystackInit.authorization_url, 
            reference: paystackInit.reference,
            amount: amount
        });

    } catch (error) {
        console.error("❌ Topup error:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

const verifyTopup = async (req, res) => {
    try {
        const { reference } = req.params;

        if (!reference) {
            return res.status(400).json({ 
                success: false, 
                message: "Reference is required." 
            });
        }

        console.log(`🟡 VERIFYING PAYMENT: ${reference}`);

        // Check if transaction already processed
        const existingTransaction = await Transaction.findOne({ 
            paymentReference: reference 
        });
        
        if (existingTransaction && existingTransaction.status === "SUCCESS") {
            const user = await User.findById(existingTransaction.userId);
            console.log(`✅ PAYMENT ALREADY VERIFIED: ${reference}`);
            return res.status(200).json({ 
                success: true, 
                message: "Payment already verified.", 
                walletBalance: user.walletBalance,
                amountAdded: existingTransaction.amount,
                reference: reference
            });
        }

        // Verify payment from Paystack
        const verifyResponse = await paystackService.verifyTransaction(reference);
        console.log("🟡 PAYSTACK VERIFY RESPONSE:", JSON.stringify(verifyResponse, null, 2));

        // Handle both response shapes safely
        const data = verifyResponse?.data || verifyResponse;
        if (!data) {
            console.log("❌ INVALID PAYSTACK RESPONSE STRUCTURE");
            return res.status(400).json({ 
                success: false, 
                message: "Invalid Paystack response structure.", 
                response: verifyResponse 
            });
        }

        // Extract values safely
        const metadata = data.metadata || {};
        const amount = data.amount ? data.amount / 100 : 0;
        const userId = metadata.userId;

        console.log(`🟡 PAYMENT STATUS: ${data.status}, Amount: ₦${amount}, User: ${userId}`);

        // Check payment status
        if (data.status === "success") {
            // Update transaction
            const transaction = await Transaction.findOneAndUpdate(
                { paymentReference: reference },
                { 
                    status: "SUCCESS", 
                    paidAt: new Date(),
                    meta: { 
                        ...(existingTransaction?.meta || {}), 
                        verificationData: data,
                        paidAt: new Date()
                    }
                },
                { new: true }
            );
            
            if (!transaction) {
                console.log("❌ TRANSACTION NOT FOUND:", reference);
                return res.status(404).json({ 
                    success: false, 
                    message: "Transaction not found." 
                });
            }

            // Update user wallet balance
            const user = await User.findById(userId);
            if (!user) {
                console.log("❌ USER NOT FOUND:", userId);
                return res.status(404).json({ 
                    success: false, 
                    message: "User not found." 
                });
            }

            const oldBalance = user.walletBalance || 0;
            user.walletBalance = oldBalance + amount;
            await user.save();

            console.log(`✅ WALLET UPDATED: User ${user._id}, +₦${amount}, Old: ₦${oldBalance}, New: ₦${user.walletBalance}`);

            return res.status(200).json({ 
                success: true, 
                message: "Wallet top-up verified successfully.", 
                walletBalance: user.walletBalance, 
                amountAdded: amount,
                reference: reference,
                oldBalance: oldBalance,
                newBalance: user.walletBalance
            });

        } else if (data.status === "pending") {
            console.log("🟡 PAYMENT STILL PENDING:", reference);
            return res.status(200).json({ 
                success: false, 
                message: "Payment is still pending. Please wait...", 
                status: "pending",
                reference: reference
            });
        } else {
            // Payment failed
            console.log("❌ PAYMENT FAILED:", reference, data.status);
            await Transaction.findOneAndUpdate(
                { paymentReference: reference },
                { 
                    status: "FAILED",
                    meta: { 
                        ...(existingTransaction?.meta || {}), 
                        verificationData: data,
                        failedAt: new Date()
                    }
                }
            );
            
            return res.status(400).json({ 
                success: false, 
                message: "Payment verification failed.", 
                status: data.status,
                reference: reference,
                gateway_response: data.gateway_response
            });
        }
    } catch (error) {
        console.error("❌ Verify error:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            reference: req.params.reference
        });
    }
}

// Additional function to get transaction status
const getTransactionStatus = async (req, res) => {
    try {
        const { reference } = req.params;

        if (!reference) {
            return res.status(400).json({ 
                success: false, 
                message: "Reference is required." 
            });
        }

        const transaction = await Transaction.findOne({ paymentReference: reference });
        
        if (!transaction) {
            return res.status(404).json({ 
                success: false, 
                message: "Transaction not found." 
            });
        }

        return res.status(200).json({
            success: true,
            status: transaction.status,
            reference: transaction.paymentReference,
            amount: transaction.amount,
            createdAt: transaction.createdAt,
            paidAt: transaction.paidAt
        });

    } catch (error) {
        console.error("Transaction status error:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

module.exports = { 
    topupWallet, 
    verifyTopup,
    getTransactionStatus 
};