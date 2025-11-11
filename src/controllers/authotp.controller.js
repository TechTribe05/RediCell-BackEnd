const express = require("express");
const nodemailer = require("nodemailer");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


/////STORES OTP IN MEMORY

const otpStorage = new Map(); 

let transporter;

try{
    transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", 
        port: 465,
        secure: true, 
        auth: {
            user: process.env.EMAIL, 
            pass: process.env.EMAILSECRET,
        },
        connectionTimeout: 60000, //60 seconds
        greetingTimeout: 30000, //30 seconds
        socketTimeout: 60000, //60 seconds
    });
    console.log("✅ Email transporter successfully created");
    console.log(`✅ Using email: ${process.env.EMAIL}`);

    ///CONNECTION SETUP

    transporter.verify((error, succes) =>{
        if(error) {
            console.error("Email configuration test failed:", error.message);
            console.error("💡 please check your email credentials and app password ");
        } else {
            console.log("✅ Email server connection verified successfully");
        }
    });
} catch( error ) {
    console.error("❌Error creating email transport", error);
}

function generateOTP (){
    return Math.floor(100000 + Math.random()* 900000).toString();
}

//STORES  OTP.....
function storedOTP(email, otp) {
    const  expiryTime = Date.now() + 10 * 60 * 1000; //10 mintues expiration
    otpStorage.set(email, {
        otp, expiryTime, attempts: 0
    });
    return expiryTime;
}

async function sendOTPEmail(email, otp) {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email, 
        subject: "Your OTP code", 
         html: `
        <div style= "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto">
            <h2>Your OTP Codes</h2>
            <div style="background-color: #f0f0f0; padding:20px; text-align: center; border-radius: 5px">
                <h1 style= "color: #007bff;  font-size: 36px; margin: 0;">${otp}</h1>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
            </div>
            `, 
            text: `Your OTP code is : ${otp}. This code will expire in 10 minutes.`,
    };
    return await transporter.sendMail(mailOptions);
}

async function sendOTP(req, res) {
    try{
        const {email} =req.body;
        if(!email) {
            return res.status(400).json({success: false, 
                message: "Email is required"});
        }
        if(!validator.isEmail) {
            return res.status(400).json({success: false, 
                message: "Invalid email address"});
        }
        const otp = generateOTP();
        const expiryTime = storedOTP (email, otp);
        await sendOTPEmail (email, otp)
        return res.status(200).json({success: true, 
            message: "otp sent successful", 
            expiryTime: expiryTime});
    } catch (error) {
        console.error("send otp error", error);
        return res.status(500).json({success: false,
             error: "failed to send otp" + error.message});
    }
}

async function verifyOTP(req, res) {
    try{
        const { email, otp} = req.body
        if(!email || !otp){
            return res.status(404).json({
                success: false, error: "Email and OTP are required" });
        }
        const storedData = otpStorage.get(email);
        if(!storedData){
            return res.status(404).json({success: false, 
                error: "OTP not found or expired"});
        }
        if(Date.now() > storedData.expiryTime) {
            otpStorage.delete(email);
            return res.status(400).json({success: false, error: "OTP has expired"});
        }
        if(storedData.otp.toString() === otp.toString()) {
            const verifyemail = await userSchema.findOne({email: email});
            if(verifyemail) {
                let jwtToken = jwt.sign(
                    {
                        email: verifyemail.email,
                        name: verifyemail.name,
                        userId: verifyemail._id,
                        phone: verifyemail.phone,
                    },
                    process.env.SECRET,
                    { expiresIn: "1d" }
                );
                return res.status(200).json({success: true, data: {accessToken, jwtToken}, 
                message: "Email verification successful"});
            }
        } else {
            storedData.attempts++;
            if(storedData.attempts >= 3){
                otpStorage.delete(email);
                return res.status(400).json({success: false, 
                    error: "Too many failed attempts. Please request a new otp",});
            }
            return res.status(400).json({success: false, error: "Invalid otp"});
        }
    } catch (error) {
        console.error("Verify OTP error", error);
        return res.status(500).json({success: false, 
            error: error.message || "Failed to verify OTP",});
    }
}

module.exports = { sendOTP, verifyOTP };