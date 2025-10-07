"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.md5 = md5;
exports.sha256 = sha256;
var crypto_1 = require("crypto");
function md5(input) {
    return crypto_1.default.createHash("md5").update(input).digest("hex");
}
function sha256(input) {
    return crypto_1.default.createHash("sha256").update(input).digest("hex");
}
