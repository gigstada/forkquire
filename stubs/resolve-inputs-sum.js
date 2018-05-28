const _ = require("lodash");

module.exports = (...args) => Promise.resolve(_.sum(args));