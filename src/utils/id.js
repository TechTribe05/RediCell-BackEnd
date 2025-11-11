const { v4: uuidv4 } = require("uuid");
module.exports = { generateRef: (prefix = "") => prefix + uuidv4().replace(/-/g, "").slice(0,24) };