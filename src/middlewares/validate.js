const validate = (schema) => {
    return (req, res, next) => {
        let errors = [];
        const { error } = schema.validate(
            {
                ...req.body,
                ...req.params,
                ...req.query,
            },
            { abortEarly: false }
        );

        console.log(error);

        if (error) {
            error.details.forEach((element) => {
                errors.push({ message: element.message, field: element.path[0] });
            });
            console.log(errors);
            return res.status(400).json(errors); // ✅ send once, and with proper status code
        } else {
            next();
        }
    };
};

module.exports = { validate };
