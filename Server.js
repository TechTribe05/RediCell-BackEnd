require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectBD = require("./database/DBconnection");

const userRoutes = require("./src/routes/user.routes");
const walletRoutes = require("./src/routes/wallet.routes");
const vtpassRoutes = require("./src/routes/vtpass.routes");
const transactionRoutes = require("./src/routes/transaction.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("🚀 RediCell Server is Running 😎");
});

// ✅ Health check route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "✅ RediCell backend is healthy and running!",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/vtpass", vtpassRoutes);
app.use("/api/v1/transaction", transactionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 9001;
connectBD()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 RediCell running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });
