"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var dotenv_1 = require("dotenv");
var hentai_1 = require("./commands/hentai");
var rule34_1 = require("./providers/rule34");
var hentai_haven_1 = require("./providers/hentai-haven");
var hanime_1 = require("./providers/hanime");
// Load environment variables
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = process.env.PORT || 3000;
// --- Express API --- //
app.get("/", function (req, res) { return res.send("Hentai API running!"); });
// NSFW Rule34 endpoint
app.get("/nsfw/rule34", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var tag, imageUrl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                tag = req.query.tag;
                if (!tag)
                    return [2 /*return*/, res.status(400).json({ error: "Tag required" })];
                return [4 /*yield*/, (0, rule34_1.fetchRule34)(tag)];
            case 1:
                imageUrl = _a.sent();
                if (!imageUrl)
                    return [2 /*return*/, res.status(404).json({ error: "No image found" })];
                res.json({ url: imageUrl });
                return [2 /*return*/];
        }
    });
}); });
// NSFW Hentai Haven endpoint
app.get("/nsfw/hentai-haven", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var tag, imageUrl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                tag = req.query.tag;
                if (!tag)
                    return [2 /*return*/, res.status(400).json({ error: "Tag required" })];
                return [4 /*yield*/, (0, hentai_haven_1.fetchHentaiHaven)(tag)];
            case 1:
                imageUrl = _a.sent();
                if (!imageUrl)
                    return [2 /*return*/, res.status(404).json({ error: "No image found" })];
                res.json({ url: imageUrl });
                return [2 /*return*/];
        }
    });
}); });
// NSFW Hanime endpoint
app.get("/nsfw/hanime", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var tag, imageUrl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                tag = req.query.tag;
                if (!tag)
                    return [2 /*return*/, res.status(400).json({ error: "Tag required" })];
                return [4 /*yield*/, (0, hanime_1.fetchHanime)(tag)];
            case 1:
                imageUrl = _a.sent();
                if (!imageUrl)
                    return [2 /*return*/, res.status(404).json({ error: "No image found" })];
                res.json({ url: imageUrl });
                return [2 /*return*/];
        }
    });
}); });
// Start Express server
app.listen(PORT, function () { return console.log("Server running on port ".concat(PORT)); });
// --- Bot Commands --- //
// Replace this with your real bot object (e.g., WhatsApp, Telegram)
var bot = {
    onMessage: function (handler) {
        // Your bot library's message event hook
        // Example: bot.on("message", handler)
    }
};
// Bot message listener
bot.onMessage(function (m) { return __awaiter(void 0, void 0, void 0, function () {
    var text, args;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                text = m.text || "";
                args = text.split(" ").slice(1);
                if (!text.startsWith(".hentai")) return [3 /*break*/, 2];
                return [4 /*yield*/, (0, hentai_1.hentaiCommand)(m, args, "hanime")];
            case 1:
                _a.sent();
                return [3 /*break*/, 6];
            case 2:
                if (!text.startsWith(".hentaihaven")) return [3 /*break*/, 4];
                return [4 /*yield*/, (0, hentai_1.hentaiCommand)(m, args, "hentai-haven")];
            case 3:
                _a.sent();
                return [3 /*break*/, 6];
            case 4:
                if (!text.startsWith(".rule34")) return [3 /*break*/, 6];
                return [4 /*yield*/, (0, hentai_1.hentaiCommand)(m, args, "rule34")];
            case 5:
                _a.sent();
                _a.label = 6;
            case 6: return [2 /*return*/];
        }
    });
}); });
