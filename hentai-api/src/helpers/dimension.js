"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dimension = void 0;
var Dimension = /** @class */ (function () {
    function Dimension(width, height) {
        this.width = width;
        this.height = height;
    }
    Dimension.prototype.getAspectRatio = function () {
        var gcd = this.gcd(this.width, this.height);
        return "".concat(this.width / gcd, ":").concat(this.height / gcd);
    };
    Dimension.prototype.getWidthInPx = function () {
        return this.width;
    };
    Dimension.prototype.getHeightInPx = function () {
        return this.height;
    };
    Dimension.prototype.getWidthInRem = function (baseFontSize) {
        if (baseFontSize === void 0) { baseFontSize = 16; }
        return this.width / baseFontSize;
    };
    Dimension.prototype.getHeightInRem = function (baseFontSize) {
        if (baseFontSize === void 0) { baseFontSize = 16; }
        return this.height / baseFontSize;
    };
    Dimension.prototype.gcd = function (a, b) {
        if (b === 0) {
            return a;
        }
        return this.gcd(b, a % b);
    };
    Dimension.fromString = function (dimensionString) {
        var _a = dimensionString.split('x').map(Number), width = _a[0], height = _a[1];
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            return null;
        }
        return new Dimension(width, height);
    };
    return Dimension;
}());
exports.Dimension = Dimension;
