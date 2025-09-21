"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pinterest = void 0;
const axios_1 = __importDefault(require("axios"));
const pin_1 = require("./pin");
class Pinterest {
    static async getPins(boardName, minCount = 20, ignoredPinIDs = [], minRatio = 0.1, maxRatio = 10, acceptedMediaExtensions = ['jpg', 'png', 'jpeg']) {
        return new Promise((resolve, reject) => (async () => {
            const url = 'https://www.pinterest.com/' + boardName;
            try {
                await this.getPinsHTML(boardName)
                    .then(res => (async () => {
                    var pins = [];
                    for (let pin of res.pins) {
                        try {
                            if (this.isPinOk(pin, ignoredPinIDs, minRatio, maxRatio, acceptedMediaExtensions)) {
                                pins.push(pin);
                                ignoredPinIDs.push(pin.id);
                                if (pin.originalId) {
                                    ignoredPinIDs.push(pin.originalId);
                                }
                            }
                        }
                        catch { }
                    }
                    var bookMark = res.bookmark != '-end-' ? res.bookmark : null;
                    while (bookMark && pins.length < minCount) {
                        await this.getPinsWithBookMark(boardName, res.boardID, bookMark, res.pinCount)
                            .then(_res => {
                            bookMark = _res.bookmark != bookMark && _res.bookmark != '-end-' ? _res.bookmark : null;
                            for (let pin of _res.pins) {
                                if (this.isPinOk(pin, ignoredPinIDs, minRatio, maxRatio, acceptedMediaExtensions)) {
                                    pins.push(pin);
                                    ignoredPinIDs.push(pin.id);
                                    if (pin.originalId) {
                                        ignoredPinIDs.push(pin.originalId);
                                    }
                                }
                            }
                        })
                            .catch(_ => resolve(pins));
                    }
                    resolve(pins);
                })())
                    .catch(err => reject(err));
            }
            catch (exception) {
                reject(`${exception}`);
            }
        })());
    }
    static isPinOk(pin, ignoredPinIDs = [], minRatio = 0.1, maxRatio = 10, acceptedMediaExtensions = ['jpg', 'png', 'jpeg']) {
        return !(ignoredPinIDs.includes(pin.id) || (pin.originalId && ignoredPinIDs.includes(pin.originalId)))
            &&
                acceptedMediaExtensions.includes(pin.image.extension)
            &&
                (pin.image.ratio > minRatio && pin.image.ratio < maxRatio);
    }
    static async getPinsHTML(boardName) {
        const promise = new Promise((resolve, reject) => {
            const url = `https://www.pinterest.com/${boardName}`;
            try {
                (async () => {
                    const response = await axios_1.default.get(url);
                    const jsonStr = '{"rebuildStoreOnClient":' + response.data.split('{"rebuildStoreOnClient":')[1].split('</script>')[0].trim();
                    const respObj = JSON.parse(jsonStr);
                    resolve({
                        pins: this.toPins(respObj.resourceResponses[1].response.data),
                        boardID: respObj.resourceResponses[0].response.data.id,
                        bookmark: respObj.resourceResponses[1].nextBookmark,
                        pinCount: respObj.resourceResponses[0].response.data.pin_count
                    });
                })();
            }
            catch (exception) {
                reject(`${exception}`);
            }
        });
        return promise;
    }
    static async getPinsWithBookMark(boardName, boardID, bookMark, boardPinCount) {
        const promise = new Promise((resolve, reject) => {
            const url = `https://www.pinterest.com/resource/BoardFeedResource/get/?source_url=/${boardName}/&data={"options":{"board_id":"${boardID}","page_size":25,"add_vase":true,"bookmarks":["${bookMark}"],"field_set_key":"unauth_react","filter_section_pins":false,"pin_count":${boardPinCount},"rank_with_query":null},"context":{}}&_=${Date.now()}`;
            try {
                (async () => {
                    const response = await axios_1.default.get(url);
                    resolve({
                        pins: this.toPins(response.data.resource_response.data),
                        bookmark: response.data.resource_response.bookmark
                    });
                })();
            }
            catch (exception) {
                reject(`${exception}`);
            }
        });
        return promise;
    }
    static toPins(objs) {
        var pins = [];
        for (let e of objs) {
            try {
                pins.push(new pin_1.Pin(e));
            }
            catch { }
        }
        return pins;
    }
}
exports.Pinterest = Pinterest;
//# sourceMappingURL=pinterest.js.map