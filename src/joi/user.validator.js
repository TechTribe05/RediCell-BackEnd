//VALIDATE USER 
const Joi = require("joi");

const addUserValidator = Joi.object({
    name: Joi.string()
        .alphanum()
        .required()
        .trim()
        .min(3)
        .max(30),

    email: Joi.string()
        .required()
        .trim()
        .min(5)
        .email({ tlds: { allow: ["com", "mail", "org", "net", "biz"] }}),

    phone: Joi.string()
        .required()
        .max(15)
        .pattern(/^[0-9]+$/),

    country: Joi.string()
        .trim(),
});

module.exports = addUserValidator;
