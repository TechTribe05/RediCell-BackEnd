const axios = require("axios");
const Transaction = require("../models/transaction.schema");
const User = require("../models/user.schema");

// SANDBOX CONFIGURATION
const VTPASS_SANDBOX_BASE_URL = "https://sandbox.vtpass.com/api";
const VTPASS_SANDBOX_EMAIL = "sandbox@vtpass.com";
const VTPASS_SANDBOX_PASSWORD = "sandbox";

// Use sandbox credentials
const VTPASS_BASE_URL = process.env.VTPASS_BASE_URL || VTPASS_SANDBOX_BASE_URL;
const VTPASS_API_KEY = "Basic " + Buffer.from(
  `${process.env.VTPASS_EMAIL || VTPASS_SANDBOX_EMAIL}:${process.env.VTPASS_PASSWORD || VTPASS_SANDBOX_PASSWORD}`
).toString("base64");

console.log("🟡 Using VTpass Sandbox:");
console.log("🟡 Base URL:", VTPASS_BASE_URL);

// Generate a unique request ID
const generateRequestId = () => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Service IDs mapping for sandbox
const SERVICE_IDS = {
  AIRTIME: {
    MTN: "mtn",
    GLO: "glo",
    AIRTEL: "airtel",
    "9MOBILE": "etisalat"
  },
  DATA: {
    MTN: "mtn-data",
    GLO: "glo-data",
    AIRTEL: "airtel-data",
    "9MOBILE": "etisalat-data"
  },
  BILLS: {
    ELECTRICITY: {
      IKEJA: "ikeja-electric"
    },
    CABLE_TV: {
      DSTV: "dstv",
      GOTV: "gotv",
      STARTIMES: "startimes"
    }
  }
};

const buyData = async (req, res) => {
  console.log("=== 🟡 BUY DATA CONTROLLER STARTED (SANDBOX) ===");
  
  try {
    const { phone, variation_code, serviceID, planName, amount } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!phone || !variation_code || !serviceID) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone, variation_code, and serviceID are required" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const amountNum = parseInt(amount);
    
    if (user.walletBalance < amountNum) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance"
      });
    }

    // DEDUCT BALANCE IMMEDIATELY
    user.walletBalance -= amountNum;
    await user.save();

    // Create transaction (simulate success for sandbox)
    const transaction = await Transaction.create({
      userId: userId,
      serviceType: "DATA",
      amount: amountNum,
      status: "SUCCESS",
      paymentReference: generateRequestId(),
      meta: {
        serviceID: serviceID,
        variation_code: variation_code,
        phone: phone,
        planName: planName,
        environment: "sandbox",
        note: "Simulated successful transaction in sandbox mode"
      }
    });

    console.log("✅ Data purchase successful (Sandbox Simulation)");

    return res.status(200).json({
      success: true,
      message: "Data purchase successful",
      transactionId: transaction._id,
      walletBalance: user.walletBalance,
      sandbox: true
    });

  } catch (error) {
    console.error("❌ Data purchase error:", error);
    
    // Refund on error
    try {
      if (req.user && req.body.amount) {
        const user = await User.findById(req.user._id);
        const amountNum = parseInt(req.body.amount);
        if (user && amountNum) {
          user.walletBalance += amountNum;
          await user.save();
          console.log("✅ Amount refunded due to error");
        }
      }
    } catch (refundError) {
      console.error("❌ Refund failed:", refundError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Data purchase failed",
      error: error.message 
    });
  }
};

const buyAirtime = async (req, res) => {
  console.log("=== 🟡 BUY AIRTIME CONTROLLER STARTED (SANDBOX) ===");
  
  try {
    const { phone, amount, network } = req.body;
    const userId = req.user._id;

    if (!phone || !amount || !network) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone, amount, and network are required" 
      });
    }

    const user = await User.findById(userId);
    const amountNum = parseInt(amount);
    
    if (user.walletBalance < amountNum) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance"
      });
    }

    // Deduct balance immediately
    user.walletBalance -= amountNum;
    await user.save();

    const transaction = await Transaction.create({
      userId: userId,
      serviceType: "AIRTIME",
      amount: amountNum,
      status: "SUCCESS",
      paymentReference: generateRequestId(),
      meta: {
        network: network,
        phone: phone,
        environment: "sandbox",
        note: "Simulated successful transaction in sandbox mode"
      }
    });

    return res.status(200).json({
      success: true,
      message: "Airtime purchase successful",
      transactionId: transaction._id,
      walletBalance: user.walletBalance,
      sandbox: true
    });

  } catch (error) {
    console.error("❌ Airtime purchase error:", error);
    
    // Refund on error
    try {
      const user = await User.findById(req.user._id);
      const amountNum = parseInt(req.body.amount);
      user.walletBalance += amountNum;
      await user.save();
    } catch (refundError) {
      console.error("❌ Refund failed:", refundError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Airtime purchase failed", 
      error: error.message 
    });
  }
};

const payBill = async (req, res) => {
  console.log("=== 🟡 PAY BILL CONTROLLER STARTED (SANDBOX) ===");
  
  try {
    const { serviceID, phone, amount, billType } = req.body;
    const userId = req.user._id;

    if (!serviceID || !phone || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "ServiceID, phone, and amount are required" 
      });
    }

    const user = await User.findById(userId);
    const amountNum = parseInt(amount);
    
    if (user.walletBalance < amountNum) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance"
      });
    }

    // Deduct balance immediately
    user.walletBalance -= amountNum;
    await user.save();

    const transaction = await Transaction.create({
      userId: userId,
      serviceType: billType || "BILL",
      amount: amountNum,
      status: "SUCCESS",
      paymentReference: generateRequestId(),
      meta: {
        serviceID: serviceID,
        phone: phone,
        billType: billType,
        environment: "sandbox",
        note: "Simulated successful transaction in sandbox mode"
      }
    });

    return res.status(200).json({
      success: true,
      message: "Bill payment successful",
      transactionId: transaction._id,
      walletBalance: user.walletBalance,
      sandbox: true
    });

  } catch (error) {
    console.error("❌ Bill payment error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Bill payment failed",
      error: error.message 
    });
  }
};

// Get available services from sandbox
const getServices = async (req, res) => {
  try {
    console.log("🟡 Fetching services from VTpass Sandbox...");
    
    const response = await axios.get(`${VTPASS_BASE_URL}/services`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: VTPASS_API_KEY,
      }
    });

    console.log("✅ VTpass Sandbox Services Response");

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error("❌ VTpass Sandbox Services Error:", error.message);
    
    // Return mock services if sandbox is down
    res.status(200).json({
      success: true,
      data: {
        content: [
          { name: "MTN", serviceID: "mtn" },
          { name: "Airtel", serviceID: "airtel" },
          { name: "Glo", serviceID: "glo" },
          { name: "9mobile", serviceID: "etisalat" },
          { name: "MTN Data", serviceID: "mtn-data" },
          { name: "Airtel Data", serviceID: "airtel-data" },
          { name: "Glo Data", serviceID: "glo-data" },
          { name: "9mobile Data", serviceID: "etisalat-data" }
        ]
      },
      sandbox: true
    });
  }
};

// Get service variations from sandbox
const getServiceVariations = async (req, res) => {
  try {
    const { serviceID } = req.params;
    console.log("🟡 Fetching variations for service:", serviceID);

    const response = await axios.get(`${VTPASS_BASE_URL}/service-variations?serviceID=${serviceID}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: VTPASS_API_KEY,
      }
    });

    console.log("✅ VTpass Sandbox Variations Response");

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error("❌ VTpass Sandbox Service Variations Error:", error.message);
    
    // Return mock data plans if sandbox is down
    const mockDataPlans = {
      "mtn-data": [
        { name: "1GB", variation_code: "mtn-1gb", variation_amount: 500 },
        { name: "2GB", variation_code: "mtn-2gb", variation_amount: 900 },
        { name: "5GB", variation_code: "mtn-5gb", variation_amount: 2000 }
      ],
      "airtel-data": [
        { name: "1GB", variation_code: "airtel-1gb", variation_amount: 500 },
        { name: "2GB", variation_code: "airtel-2gb", variation_amount: 900 },
        { name: "5GB", variation_code: "airtel-5gb", variation_amount: 2000 }
      ],
      "glo-data": [
        { name: "1GB", variation_code: "glo-1gb", variation_amount: 500 },
        { name: "2GB", variation_code: "glo-2gb", variation_amount: 900 }
      ],
      "etisalat-data": [
        { name: "1GB", variation_code: "etisalat-1gb", variation_amount: 500 },
        { name: "2GB", variation_code: "etisalat-2gb", variation_amount: 900 }
      ]
    };

    res.status(200).json({
      success: true,
      data: {
        content: mockDataPlans[serviceID] || []
      },
      sandbox: true
    });
  }
};

// Verify transaction in sandbox
const verifyTransaction = async (req, res) => {
  try {
    const { request_id } = req.params;
    console.log("🟡 Verifying transaction in sandbox:", request_id);

    const response = await axios.post(`${VTPASS_BASE_URL}/requery`, {
      request_id: request_id
    }, {
      headers: {
        "Content-Type": "application/json",
        Authorization: VTPASS_API_KEY,
      }
    });

    console.log("✅ VTpass Sandbox Verification Response");

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error("❌ VTpass Sandbox Verification Error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to verify transaction", 
      error: error.message 
    });
  }
};

module.exports = { buyAirtime, buyData, payBill, getServices, getServiceVariations, verifyTransaction, SERVICE_IDS };