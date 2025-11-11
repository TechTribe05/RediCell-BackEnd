const mongoose = require("mongoose");

require("dotenv").config();

const dbConnectionString= process.env.DBSTRING;

const connectDB = async () => {
    try{
        console.log("connecting to db...")
        await mongoose.connect(dbConnectionString, {});
        console.log("connection to DB esthablished 100✅✅");
    } catch (error) {
        console.error("Error connection to DB:", error);
    }
};

module.exports = connectDB;