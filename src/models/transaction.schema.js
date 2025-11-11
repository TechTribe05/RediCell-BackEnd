const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, ref: "User", required: true
    },
    serviceType: { 
        type: String, 
        required: true 
    }, // e.g., "data", "airtime", "bill"
    serviceDetails: { 
        type: Object, 
        default: {} 
    }, // e.g., { network, plan, recipientPhone }
    amount: { 
        type: Number,
        required: true
    },
    paymentReference: { 
        type: String, 
        required: true, 
        unique: true 
    },
    isPaid: { 
        type: Boolean, 
        default: false
    },
    paidAt: { 
        type: Date
    },
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
