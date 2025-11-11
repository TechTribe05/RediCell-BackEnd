const jwt = require("jsonwebtoken");
const User = require("../models/user.schema");

const validateUser = async (req, res, next) => {
    try {
        console.log(`🟡 AUTH MIDDLEWARE: Checking ${req.method} ${req.originalUrl}`);
        
        if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
            console.log("❌ AUTH: No token provided");
            return res.status(401).json({ message: "No token provided or invalid format" });
        }

        const token = req.headers.authorization.replace("Bearer ", "");
        console.log("🟡 AUTH: Token received, verifying...");
        
        const decodedData = jwt.verify(token, process.env.SECRET);
        console.log("🟡 AUTH: Token decoded, user ID:", decodedData.id);

        // Attach the full user object to req.user
        const user = await User.findById(decodedData.id);
        if (!user) {
            console.log("❌ AUTH: User not found in database");
            return res.status(401).json({ message: "User not found" });
        }

        // Use only req.user for consistency
        req.user = user;
        console.log(`✅ AUTH: User ${user._id} authenticated successfully`);
        
        next();
    } catch (error) {
        console.log("❌ AUTH ERROR:", error.message);
        return res.status(401).json({ message: "Authentication failed, unauthorized token" });
    }
};

module.exports = validateUser;