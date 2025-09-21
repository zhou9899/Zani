// RiveScript.js
// https://www.rivescript.com/

// This code is released under the MIT License.
// See the "LICENSE" file for more information.

// Brain logic for RiveScript

"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var utils = require("./utils");
var inherit_utils = require("./inheritance");

var tags = {
	'bot': {
		selfClosing: true, handle: function () {
			var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(rive, data, user, scope) {
				var split, val;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								split = data.split("=");

								if (!(split.length > 1)) {
									_context.next = 6;
									break;
								}

								rive._var[split[0].trim()] = split[1];
								return _context.abrupt("return", "");

							case 6:
								if (!(split.length === 1)) {
									_context.next = 12;
									break;
								}

								val = rive._var[split[0].trim()];

								if (val === undefined) val = "undefined";
								return _context.abrupt("return", val);

							case 12:
								return _context.abrupt("return", "undefined");

							case 13:
							case "end":
								return _context.stop();
						}
					}
				}, _callee, undefined);
			}));

			function handle(_x, _x2, _x3, _x4) {
				return _ref.apply(this, arguments);
			}

			return handle;
		}()
	},
	'env': {
		selfClosing: true, handle: function () {
			var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(rive, data, user, scope) {
				var split, val;
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								split = data.split("=");

								if (!(split.length > 1)) {
									_context2.next = 6;
									break;
								}

								rive._global[split[0].trim()] = split[1];
								return _context2.abrupt("return", "");

							case 6:
								if (!(split.length === 1)) {
									_context2.next = 12;
									break;
								}

								val = rive._global[split[0].trim()];

								if (val === undefined) val = "undefined";
								return _context2.abrupt("return", val);

							case 12:
								return _context2.abrupt("return", "undefined");

							case 13:
							case "end":
								return _context2.stop();
						}
					}
				}, _callee2, undefined);
			}));

			function handle(_x5, _x6, _x7, _x8) {
				return _ref2.apply(this, arguments);
			}

			return handle;
		}()
	},
	'set': {
		selfClosing: true, handle: function () {
			var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(rive, data, user, scope) {
				var split;
				return regeneratorRuntime.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								split = data.split("=");
								_context3.next = 3;
								return rive.setUservar(user, split[0].trim(), split[1]);

							case 3:
								return _context3.abrupt("return", "");

							case 4:
							case "end":
								return _context3.stop();
						}
					}
				}, _callee3, undefined);
			}));

			function handle(_x9, _x10, _x11, _x12) {
				return _ref3.apply(this, arguments);
			}

			return handle;
		}()
	},
	'get': {
		selfClosing: true, handle: function () {
			var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(rive, data, user, scope) {
				var result;
				return regeneratorRuntime.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								_context4.next = 2;
								return rive.getUservar(user, data.trim());

							case 2:
								result = _context4.sent;
								return _context4.abrupt("return", result);

							case 4:
							case "end":
								return _context4.stop();
						}
					}
				}, _callee4, undefined);
			}));

			function handle(_x13, _x14, _x15, _x16) {
				return _ref4.apply(this, arguments);
			}

			return handle;
		}()
	},
	'add': {
		selfClosing: true, handle: function () {
			var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(rive, data, user, scope) {
				var split, name, existingValue, value, existingNumber, result;
				return regeneratorRuntime.wrap(function _callee5$(_context5) {
					while (1) {
						switch (_context5.prev = _context5.next) {
							case 0:
								split = data.split("=");
								name = split[0].trim();
								_context5.next = 4;
								return rive.getUservar(user, name);

							case 4:
								_context5.t0 = _context5.sent;

								if (_context5.t0) {
									_context5.next = 7;
									break;
								}

								_context5.t0 = 0;

							case 7:
								existingValue = _context5.t0;

								if (existingValue === 'undefined') existingValue = 0;
								value = parseInt(split[1].trim());
								existingNumber = parseInt(existingValue);

								if (!isNaN(value)) {
									_context5.next = 15;
									break;
								}

								return _context5.abrupt("return", "[ERR: Math can't 'add' non-numeric value '" + value + "']");

							case 15:
								if (!isNaN(existingNumber)) {
									_context5.next = 19;
									break;
								}

								return _context5.abrupt("return", "[ERR: Math can't 'add' non-numeric user variable '" + name + "']");

							case 19:
								result = Number(existingNumber + value);
								_context5.next = 22;
								return rive.setUservar(user, name, result);

							case 22:
								return _context5.abrupt("return", '');

							case 23:
							case "end":
								return _context5.stop();
						}
					}
				}, _callee5, undefined);
			}));

			function handle(_x17, _x18, _x19, _x20) {
				return _ref5.apply(this, arguments);
			}

			return handle;
		}()
	},
	'sub': {
		selfClosing: true, handle: function () {
			var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(rive, data, user, scope) {
				var split, name, existingValue, value, existingNumber, result;
				return regeneratorRuntime.wrap(function _callee6$(_context6) {
					while (1) {
						switch (_context6.prev = _context6.next) {
							case 0:
								split = data.split("=");
								name = split[0].trim();
								_context6.next = 4;
								return rive.getUservar(user, name);

							case 4:
								_context6.t0 = _context6.sent;

								if (_context6.t0) {
									_context6.next = 7;
									break;
								}

								_context6.t0 = 0;

							case 7:
								existingValue = _context6.t0;
								value = parseInt(split[1].trim());

								if (existingValue === 'undefined') existingValue = 0;
								existingNumber = parseInt(existingValue);

								if (!isNaN(value)) {
									_context6.next = 15;
									break;
								}

								return _context6.abrupt("return", "[ERR: Math can't 'sub' non-numeric value '" + value + "']");

							case 15:
								if (!isNaN(existingNumber)) {
									_context6.next = 19;
									break;
								}

								return _context6.abrupt("return", "[ERR: Math can't 'sub' non-numeric user variable '" + name + "']");

							case 19:
								result = Number(existingNumber - value);
								_context6.next = 22;
								return rive.setUservar(user, name, result);

							case 22:
								return _context6.abrupt("return", '');

							case 23:
							case "end":
								return _context6.stop();
						}
					}
				}, _callee6, undefined);
			}));

			function handle(_x21, _x22, _x23, _x24) {
				return _ref6.apply(this, arguments);
			}

			return handle;
		}()
	},
	'mult': {
		selfClosing: true, handle: function () {
			var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(rive, data, user, scope) {
				var split, name, existingValue, value, existingNumber, result;
				return regeneratorRuntime.wrap(function _callee7$(_context7) {
					while (1) {
						switch (_context7.prev = _context7.next) {
							case 0:
								split = data.split("=");
								name = split[0].trim();
								_context7.next = 4;
								return rive.getUservar(user, name);

							case 4:
								_context7.t0 = _context7.sent;

								if (_context7.t0) {
									_context7.next = 7;
									break;
								}

								_context7.t0 = 0;

							case 7:
								existingValue = _context7.t0;
								value = parseInt(split[1].trim());

								if (existingValue === 'undefined') existingValue = 0;
								existingNumber = parseInt(existingValue);

								if (!isNaN(value)) {
									_context7.next = 15;
									break;
								}

								return _context7.abrupt("return", "[ERR: Math can't 'mult' non-numeric value '" + value + "']");

							case 15:
								if (!isNaN(existingNumber)) {
									_context7.next = 19;
									break;
								}

								return _context7.abrupt("return", "[ERR: Math can't 'mult' non-numeric user variable '" + name + "']");

							case 19:
								result = Number(existingNumber * value);
								_context7.next = 22;
								return rive.setUservar(user, name, result);

							case 22:
								return _context7.abrupt("return", '');

							case 23:
							case "end":
								return _context7.stop();
						}
					}
				}, _callee7, undefined);
			}));

			function handle(_x25, _x26, _x27, _x28) {
				return _ref7.apply(this, arguments);
			}

			return handle;
		}()
	},
	'div': {
		selfClosing: true, handle: function () {
			var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(rive, data, user, scope) {
				var split, name, existingValue, value, existingNumber, result;
				return regeneratorRuntime.wrap(function _callee8$(_context8) {
					while (1) {
						switch (_context8.prev = _context8.next) {
							case 0:
								split = data.split("=");
								name = split[0].trim();
								_context8.next = 4;
								return rive.getUservar(user, name);

							case 4:
								_context8.t0 = _context8.sent;

								if (_context8.t0) {
									_context8.next = 7;
									break;
								}

								_context8.t0 = 0;

							case 7:
								existingValue = _context8.t0;
								value = parseInt(split[1].trim());

								if (existingValue === 'undefined') existingValue = 0;
								existingNumber = parseInt(existingValue);

								if (!isNaN(value)) {
									_context8.next = 15;
									break;
								}

								return _context8.abrupt("return", "[ERR: Math can't 'div' non-numeric value '" + value + "']");

							case 15:
								if (!isNaN(existingNumber)) {
									_context8.next = 19;
									break;
								}

								return _context8.abrupt("return", "[ERR: Math can't 'div' non-numeric user variable '" + name + "']");

							case 19:
								if (!(value === 0)) {
									_context8.next = 23;
									break;
								}

								return _context8.abrupt("return", "[ERR: Can't Divide By Zero]");

							case 23:
								result = Number(existingNumber / value);
								_context8.next = 26;
								return rive.setUservar(user, name, result);

							case 26:
								return _context8.abrupt("return", '');

							case 27:
							case "end":
								return _context8.stop();
						}
					}
				}, _callee8, undefined);
			}));

			function handle(_x29, _x30, _x31, _x32) {
				return _ref8.apply(this, arguments);
			}

			return handle;
		}()
	},
	'call': {
		selfClosing: false, handle: function () {
			var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(rive, data, user, scope) {
				var parts, output, obj, args, lang;
				return regeneratorRuntime.wrap(function _callee9$(_context9) {
					while (1) {
						switch (_context9.prev = _context9.next) {
							case 0:
								parts = utils.trim(data).split(" ");
								output = rive.errors.objectNotFound;
								obj = parts[0];
								args = [];

								if (parts.length > 1) {
									args = utils.parseCallArgs(parts.slice(1).join(" "));
								}

								if (!(obj in rive._objlangs)) {
									_context9.next = 21;
									break;
								}

								// We do, but do we have a handler for that language?
								lang = rive._objlangs[obj];

								if (!(lang in rive._handlers)) {
									_context9.next = 20;
									break;
								}

								_context9.prev = 8;
								_context9.next = 11;
								return rive._handlers[lang].call(rive, obj, args, scope);

							case 11:
								output = _context9.sent;
								_context9.next = 18;
								break;

							case 14:
								_context9.prev = 14;
								_context9.t0 = _context9["catch"](8);

								if (_context9.t0 != undefined) {
									rive.brain.warn(_context9.t0);
								}
								output = "[ERR: Error raised by object macro: " + _context9.t0.message + "]";

							case 18:
								_context9.next = 21;
								break;

							case 20:
								output = "[ERR: No Object Handler]";

							case 21:
								return _context9.abrupt("return", output);

							case 22:
							case "end":
								return _context9.stop();
						}
					}
				}, _callee9, undefined, [[8, 14]]);
			}));

			function handle(_x33, _x34, _x35, _x36) {
				return _ref9.apply(this, arguments);
			}

			return handle;
		}()
	}
};

/**
Brain (RiveScript master)

Create a Brain object which handles the actual process of fetching a reply.
*/

var Brain = function () {
	function Brain(master) {
		_classCallCheck(this, Brain);

		var self = this;

		self.master = master;
		self.strict = master._strict;
		self.utf8 = master._utf8;

		// Private variables only relevant to the reply-answering part of RiveScript.
		self._currentUser = null; // The current user asking for a message
	}

	// Proxy functions


	_createClass(Brain, [{
		key: "say",
		value: function say(message) {
			return this.master.say(message);
		}
	}, {
		key: "warn",
		value: function warn(message, filename, lineno) {
			return this.master.warn(message, filename, lineno);
		}

		/**
  async reply (string user, string msg[, scope])
  	Fetch a reply for the user. This returns a Promise that may be awaited on.
  */

	}, {
		key: "reply",
		value: function () {
			var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(user, msg, scope) {
				var self, reply, begin, history;
				return regeneratorRuntime.wrap(function _callee10$(_context10) {
					while (1) {
						switch (_context10.prev = _context10.next) {
							case 0:
								self = this;


								self.say("Asked to reply to [" + user + "] " + msg);

								// Store the current user's ID.
								self._currentUser = user;

								// Format their message.
								msg = self.formatMessage(msg);
								reply = "";

								// Set initial match to be undefined

								_context10.next = 7;
								return self.master._session.set(user, {
									__initialmatch__: null
								});

							case 7:
								if (!self.master._topics.__begin__) {
									_context10.next = 21;
									break;
								}

								_context10.next = 10;
								return self._getReply(user, "request", "begin", 0, scope);

							case 10:
								begin = _context10.sent;

								if (!(begin.indexOf("{ok}") > -1)) {
									_context10.next = 16;
									break;
								}

								_context10.next = 14;
								return self._getReply(user, msg, "normal", 0, scope);

							case 14:
								reply = _context10.sent;

								begin = begin.replace(/\{ok\}/g, reply);

							case 16:
								_context10.next = 18;
								return self.processTags(user, msg, begin, [], [], 0, scope);

							case 18:
								reply = _context10.sent;
								_context10.next = 24;
								break;

							case 21:
								_context10.next = 23;
								return self._getReply(user, msg, "normal", 0, scope);

							case 23:
								reply = _context10.sent;

							case 24:
								_context10.next = 26;
								return self.master._session.get(user, "__history__");

							case 26:
								history = _context10.sent;

								if (history == "undefined") {
									// purposeful typecast
									history = newHistory();
								}
								try {
									// If modifying it fails, the data was bad, and reset it.
									history.input.pop();
									history.input.unshift(msg);
									history.reply.pop();
									history.reply.unshift(reply);
								} catch (e) {
									history = newHistory();
								}
								_context10.next = 31;
								return self.master._session.set(user, {
									__history__: history
								});

							case 31:

								// Unset the current user ID.
								self._currentUser = null;

								return _context10.abrupt("return", reply);

							case 33:
							case "end":
								return _context10.stop();
						}
					}
				}, _callee10, this);
			}));

			function reply(_x37, _x38, _x39) {
				return _ref10.apply(this, arguments);
			}

			return reply;
		}()

		/**
  async _getReply (string user, string msg, string context, int step, scope)
  	The internal reply method. DO NOT CALL THIS DIRECTLY.
  	* user, msg and scope are the same as reply()
  * context = "normal" or "begin"
  * step = the recursion depth
  * scope = the call scope for object macros
  */

	}, {
		key: "_getReply",
		value: function () {
			var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(user, msg, context, step, scope) {
				var self, topic, stars, thatstars, reply, history, matched, matchedTrigger, foundMatch, allTopics, j, len, top, lastReply, k, len1, trig, pattern, botside, match, userSide, regexp, isAtomic, isMatch, _match, l, _len, _trig, _pattern, _regexp, _isAtomic, _isMatch, _match2, i, _len2, lastTriggers, n, redirect, o, len4, row, halves, condition, left, eq, right, potreply, passed, bucket, q, len5, rep, weight, _match3, _i, choice, _match4, giveup, name, _name, value;

				return regeneratorRuntime.wrap(function _callee11$(_context11) {
					while (1) {
						switch (_context11.prev = _context11.next) {
							case 0:
								self = this;

								// Needed to sort replies?

								if (self.master._sorted.topics) {
									_context11.next = 4;
									break;
								}

								self.warn("You forgot to call sortReplies()!");
								return _context11.abrupt("return", "ERR: Replies Not Sorted");

							case 4:
								_context11.next = 6;
								return self.master.getUservar(user, "topic");

							case 6:
								topic = _context11.sent;

								if (topic === null || topic === "undefined") {
									topic = "random";
								}

								stars = [];
								thatstars = []; // For %Previous

								reply = "";

								// Avoid letting them fall into a missing topic.

								if (self.master._topics[topic]) {
									_context11.next = 16;
									break;
								}

								self.warn("User " + user + " was in an empty topic named '" + topic + "'");
								topic = "random";
								_context11.next = 16;
								return self.master.setUservar(user, "topic", topic);

							case 16:
								if (!(step > self.master._depth)) {
									_context11.next = 18;
									break;
								}

								return _context11.abrupt("return", self.master.errors.deepRecursion);

							case 18:

								// Are we in the BEGIN block?
								if (context === "begin") {
									topic = "__begin__";
								}

								// Initialize this user's history.
								_context11.next = 21;
								return self.master._session.get(user, "__history__");

							case 21:
								history = _context11.sent;

								if (!(history == "undefined")) {
									_context11.next = 26;
									break;
								}

								// purposeful typecast
								history = newHistory();
								_context11.next = 26;
								return self.master._session.set(user, {
									__history__: history
								});

							case 26:
								if (self.master._topics[topic]) {
									_context11.next = 28;
									break;
								}

								return _context11.abrupt("return", "ERR: No default topic 'random' was found!");

							case 28:

								// Create a pointer for the matched data when we find it.
								matched = null;
								matchedTrigger = null;
								foundMatch = false;

								// See if there were any %Previous's in this topic, or any topic related
								// to it. This should only be done the first time -- not during a recursive
								// redirection. This is because in a redirection, "lastreply" is still gonna
								// be the same as it was the first time, resulting in an infinite loop!

								if (!(step === 0)) {
									_context11.next = 78;
									break;
								}

								allTopics = [topic];

								if (self.master._topics[topic].includes || self.master._topics[topic].inherits) {
									// Get ALL the topics!
									allTopics = inherit_utils.getTopicTree(self.master, topic);
								}

								// Scan them all.
								j = 0, len = allTopics.length;

							case 35:
								if (!(j < len)) {
									_context11.next = 78;
									break;
								}

								top = allTopics[j];

								self.say("Checking topic " + top + " for any %Previous's");

								if (!self.master._sorted.thats[top].length) {
									_context11.next = 74;
									break;
								}

								// There's one here!
								self.say("There's a %Previous in this topic!");

								// Do we have history yet?
								lastReply = history.reply ? history.reply[0] : "undefined";

								// Format the bot's last reply the same way as the human's.

								lastReply = self.formatMessage(lastReply, true);
								self.say("Last reply: " + lastReply);

								// See if it's a match
								k = 0, len1 = self.master._sorted.thats[top].length;

							case 44:
								if (!(k < len1)) {
									_context11.next = 72;
									break;
								}

								trig = self.master._sorted.thats[top][k];
								pattern = trig[1].previous;
								_context11.next = 49;
								return self.triggerRegexp(user, pattern);

							case 49:
								botside = _context11.sent;


								self.say("Try to match lastReply (" + lastReply + ") to " + botside);

								// Match?
								match = lastReply.match(new RegExp("^" + botside + "$"), 'i');

								if (!match) {
									_context11.next = 69;
									break;
								}

								// Huzzah! See if OUR message is right too.
								self.say("Bot side matched!");

								thatstars = match; // Collect the bot stars in case we need them
								thatstars.shift();

								// Compare the triggers to the user's message.
								userSide = trig[1];
								_context11.next = 59;
								return self.triggerRegexp(user, userSide.trigger);

							case 59:
								regexp = _context11.sent;

								self.say("Try to match \"" + msg + "\" against " + userSide.trigger + " (" + regexp + ")");

								// If the trigger is atomic, we don't need to bother with the regexp engine.
								isAtomic = utils.isAtomic(userSide.trigger);
								isMatch = false;

								if (isAtomic) {
									if (msg === regexp) {
										isMatch = true;
									}
								} else {
									_match = msg.match(new RegExp("^" + regexp + "$"));

									if (_match) {
										isMatch = true;
										// Get the stars
										stars = _match;
										if (stars.length >= 1) {
											stars.shift();
										}
									}
								}

								// Was it a match?

								if (!isMatch) {
									_context11.next = 69;
									break;
								}

								// Keep the trigger pointer.
								matched = userSide;
								foundMatch = true;
								matchedTrigger = userSide.trigger;
								return _context11.abrupt("break", 72);

							case 69:
								k++;
								_context11.next = 44;
								break;

							case 72:
								_context11.next = 75;
								break;

							case 74:
								self.say("No %Previous in this topic!");

							case 75:
								j++;
								_context11.next = 35;
								break;

							case 78:
								if (foundMatch) {
									_context11.next = 100;
									break;
								}

								self.say("Searching their topic for a match...");
								l = 0, _len = self.master._sorted.topics[topic].length;

							case 81:
								if (!(l < _len)) {
									_context11.next = 100;
									break;
								}

								_trig = self.master._sorted.topics[topic][l];
								_pattern = _trig[0];
								_context11.next = 86;
								return self.triggerRegexp(user, _pattern);

							case 86:
								_regexp = _context11.sent;


								self.say("Try to match \"" + msg + "\" against " + _pattern + " (" + _regexp + ")");

								// If the trigger is atomic, we don't need to bother with the regexp engine.
								_isAtomic = utils.isAtomic(_pattern);
								_isMatch = false;

								if (_isAtomic) {
									if (msg === _regexp) {
										_isMatch = true;
									}
								} else {
									// Non-atomic triggers always need the regexp.
									_match2 = msg.match(new RegExp("^" + _regexp + "$", 'i'));

									if (_match2) {
										// The regexp matched!
										_isMatch = true;

										// Collect the stars
										stars = [];
										if (_match2.length > 1) {
											for (i = 1, _len2 = _match2.length; i < _len2; i++) {
												stars.push(_match2[i]);
											}
										}
									}
								}

								// A match somehow?

								if (!_isMatch) {
									_context11.next = 97;
									break;
								}

								self.say("Found a match!");

								// Keep the pointer to this trigger's data.
								matched = _trig[1];
								foundMatch = true;
								matchedTrigger = _pattern;
								return _context11.abrupt("break", 100);

							case 97:
								l++;
								_context11.next = 81;
								break;

							case 100:
								_context11.next = 102;
								return self.master._session.set(user, { __lastmatch__: matchedTrigger });

							case 102:
								lastTriggers = [];

								if (!(step === 0)) {
									_context11.next = 106;
									break;
								}

								_context11.next = 106;
								return self.master._session.set(user, {
									// Store initial matched trigger. Like __lastmatch__, this can be undefined.
									__initialmatch__: matchedTrigger,

									// Also initialize __last_triggers__ which will keep all matched triggers
									__last_triggers__: lastTriggers
								});

							case 106:
								if (!matched) {
									_context11.next = 160;
									break;
								}

								// Keep the current match
								lastTriggers.push(matched);
								_context11.next = 110;
								return self.master._session.set(user, { __last_triggers__: lastTriggers });

							case 110:
								n = 0;

							case 111:
								if (!(n < 1)) {
									_context11.next = 160;
									break;
								}

								if (!(matched.redirect != null)) {
									_context11.next = 122;
									break;
								}

								self.say("Redirecting us to " + matched.redirect);
								_context11.next = 116;
								return self.processTags(user, msg, matched.redirect, stars, thatstars, step, scope);

							case 116:
								redirect = _context11.sent;


								self.say("Pretend user said: " + redirect);
								_context11.next = 120;
								return self._getReply(user, redirect, context, step + 1, scope);

							case 120:
								reply = _context11.sent;
								return _context11.abrupt("break", 160);

							case 122:
								o = 0, len4 = matched.condition.length;

							case 123:
								if (!(o < len4)) {
									_context11.next = 150;
									break;
								}

								row = matched.condition[o];
								halves = row.split(/\s*=>\s*/);

								if (!(halves && halves.length === 2)) {
									_context11.next = 147;
									break;
								}

								condition = halves[0].match(/^(.+?)\s+(==|eq|!=|ne|<>|<|<=|>|>=)\s+(.*?)$/);

								if (!condition) {
									_context11.next = 147;
									break;
								}

								left = utils.strip(condition[1]);
								eq = condition[2];
								right = utils.strip(condition[3]);
								potreply = halves[1].trim();

								// Process tags all around

								_context11.next = 135;
								return self.processTags(user, msg, left, stars, thatstars, step, scope);

							case 135:
								left = _context11.sent;
								_context11.next = 138;
								return self.processTags(user, msg, right, stars, thatstars, step, scope);

							case 138:
								right = _context11.sent;


								// Defaults?
								if (left.length === 0) {
									left = "undefined";
								}
								if (right.length === 0) {
									right = "undefined";
								}

								self.say("Check if " + left + " " + eq + " " + right);

								// Validate it
								passed = false;

								if (eq === "eq" || eq === "==") {
									if (left === right) {
										passed = true;
									}
								} else if (eq === "ne" || eq === "!=" || eq === "<>") {
									if (left !== right) {
										passed = true;
									}
								} else {
									try {
										// Dealing with numbers here
										left = parseInt(left);
										right = parseInt(right);
										if (eq === "<" && left < right) {
											passed = true;
										} else if (eq === "<=" && left <= right) {
											passed = true;
										} else if (eq === ">" && left > right) {
											passed = true;
										} else if (eq === ">=" && left >= right) {
											passed = true;
										}
									} catch (error) {
										e = error;
										self.warn("Failed to evaluate numeric condition!");
									}
								}

								// OK?

								if (!passed) {
									_context11.next = 147;
									break;
								}

								reply = potreply;
								return _context11.abrupt("break", 150);

							case 147:
								o++;
								_context11.next = 123;
								break;

							case 150:
								if (!(reply !== null && reply.length > 0)) {
									_context11.next = 152;
									break;
								}

								return _context11.abrupt("break", 160);

							case 152:

								// Process weights in the replies.
								bucket = [];

								for (q = 0, len5 = matched.reply.length; q < len5; q++) {
									rep = matched.reply[q];
									weight = 1;
									_match3 = rep.match(/\{weight=(\d+?)\}/i);

									if (_match3) {
										weight = _match3[1];
										if (weight <= 0) {
											self.warn("Can't have a weight <= 0!");
											weight = 1;
										}
									}

									for (_i = 0; _i < weight; _i++) {
										bucket.push(rep);
									}
								}

								// Get a random reply.
								choice = parseInt(Math.random() * bucket.length);

								reply = bucket[choice];
								return _context11.abrupt("break", 160);

							case 157:
								n++;
								_context11.next = 111;
								break;

							case 160:

								// Still no reply?
								if (!foundMatch) {
									reply = self.master.errors.replyNotMatched;
								} else if (reply === void 0 || reply.length === 0) {
									reply = self.master.errors.replyNotFound;
								}

								self.say("Reply: " + reply);

								// Process tags for the BEGIN block.

								if (!(context === "begin")) {
									_context11.next = 194;
									break;
								}

								// The BEGIN block can set {topic} and user vars.

								// Topic setter
								_match4 = reply.match(/\{topic=(.+?)\}/i);
								giveup = 0;

							case 165:
								if (!_match4) {
									_context11.next = 177;
									break;
								}

								giveup++;

								if (!(giveup >= 50)) {
									_context11.next = 170;
									break;
								}

								self.warn("Infinite loop looking for topic tag!");
								return _context11.abrupt("break", 177);

							case 170:
								name = _match4[1];
								_context11.next = 173;
								return self.master.setUservar(user, "topic", name);

							case 173:
								reply = reply.replace(new RegExp("{topic=" + utils.quotemeta(name) + "}", "ig"), "");
								_match4 = reply.match(/\{topic=(.+?)\}/i);
								_context11.next = 165;
								break;

							case 177:

								// Set user vars
								_match4 = reply.match(/<set (.+?)=(.+?)>/i);
								giveup = 0;

							case 179:
								if (!_match4) {
									_context11.next = 192;
									break;
								}

								giveup++;

								if (!(giveup >= 50)) {
									_context11.next = 184;
									break;
								}

								self.warn("Infinite loop looking for set tag!");
								return _context11.abrupt("break", 192);

							case 184:
								_name = _match4[1];
								value = _match4[2];
								_context11.next = 188;
								return self.master.setUservar(user, _name, value);

							case 188:
								reply = reply.replace(new RegExp("<set " + utils.quotemeta(_name) + "=" + utils.quotemeta(value) + ">", "ig"), "");
								_match4 = reply.match(/<set (.+?)=(.+?)>/i);
								_context11.next = 179;
								break;

							case 192:
								_context11.next = 195;
								break;

							case 194:
								// Process all the tags.
								reply = self.processTags(user, msg, reply, stars, thatstars, step, scope);

							case 195:
								return _context11.abrupt("return", reply);

							case 196:
							case "end":
								return _context11.stop();
						}
					}
				}, _callee11, this);
			}));

			function _getReply(_x40, _x41, _x42, _x43, _x44) {
				return _ref11.apply(this, arguments);
			}

			return _getReply;
		}()

		/**
  string formatMessage (string msg)
  	Format a user's message for safe processing.
  */

	}, {
		key: "formatMessage",
		value: function formatMessage(msg, botreply) {
			var self = this;

			// Lowercase it.
			msg = "" + msg;
			if (self.master._caseSensitive !== true) {
				msg = msg.toLowerCase();
			}

			// Run substitutions and sanitize what's left.
			msg = self.substitute(msg, "sub");

			// In UTF-8 mode, only strip metacharcters and HTML brackets (to protect
			// against obvious XSS attacks).
			if (self.utf8) {
				msg = msg.replace(/[\\<>]+/, "");

				if (self.master.unicodePunctuation != null) {
					msg = msg.replace(self.master.unicodePunctuation, "");
				}

				// For the bot's reply, also strip common punctuation.
				if (botreply != null) {
					msg = msg.replace(/[.?,!;:@#$%^&*()]/, "");
				}
			} else {
				// For everything else, strip all non-alphanumerics
				msg = utils.stripNasties(msg, self.utf8);
			}

			// cut leading and trailing blanks once punctuation dropped office
			msg = msg.trim();
			msg = msg.replace(/\s+/g, " ");
			return msg;
		}

		/**
  async triggerRegexp (string user, string trigger)
  	Prepares a trigger for the regular expression engine.
  */

	}, {
		key: "triggerRegexp",
		value: function () {
			var _ref12 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12(user, regexp) {
				var self, match, giveup, parts, opts, j, len, p, pipes, _match5, name, rep, _match6, _name2, _rep, _match7, _name3, _rep2, history, ref, k, len1, type, i, value;

				return regeneratorRuntime.wrap(function _callee12$(_context12) {
					while (1) {
						switch (_context12.prev = _context12.next) {
							case 0:
								self = this;

								// If the trigger is simply '*' then the * needs to become (.*?)
								// to match the blank string too.

								regexp = regexp.replace(/^\*$/, "<zerowidthstar>");

								// Simple replacements.
								regexp = regexp.replace(/\*/g, "(.+?)"); // Convert * into (.+?)
								regexp = regexp.replace(/#/g, "(\\d+?)"); // Convert # into (\d+?)
								regexp = regexp.replace(/_/g, "(\\w+?)"); // Convert _ into (\w+?)
								regexp = regexp.replace(/\s*\{weight=\d+\}\s*/g, ""); // Remove {weight} tags
								regexp = regexp.replace(/<zerowidthstar>/g, "(.*?)");
								regexp = regexp.replace(/\|{2,}/, '|'); // Remove empty entities
								regexp = regexp.replace(/(\(|\[)\|/g, '$1'); // Remove empty entities from start of alt/opts
								regexp = regexp.replace(/\|(\)|\])/g, '$1'); // Remove empty entities from end of alt/opts

								// UTF-8 mode special characters.
								if (self.utf8) {
									regexp = regexp.replace(/\\@/, "\\u0040"); // @ symbols conflict w/ arrays
								}

								// Optionals.
								match = regexp.match(/\[(.+?)\]/);
								giveup = 0;

							case 13:
								if (!match) {
									_context12.next = 29;
									break;
								}

								if (!(giveup++ > 50)) {
									_context12.next = 17;
									break;
								}

								self.warn("Infinite loop when trying to process optionals in a trigger!");
								return _context12.abrupt("return", "");

							case 17:

								// The resulting regexp needs to work in two scenarios:
								// 1) The user included the optional word(s) in which case they must be
								//    in the message surrounded by a space or a word boundary (e.g. the
								//    end or beginning of their message)
								// 2) The user did not include the word, meaning the whole entire set of
								//    words should be "OR'd" with a word boundary or one or more spaces.
								//
								// The resulting regexp ends up looking like this, for a given input
								// trigger of: what is your [home|office] number
								// what is your(?:(?:\s|\b)+home(?:\s|\b)+|(?:\s|\b)+office(?:\s|\b)+|(?:\b|\s)+)number
								//
								// See https://github.com/aichaos/rivescript-js/issues/48

								parts = match[1].split("|");
								opts = [];

								for (j = 0, len = parts.length; j < len; j++) {
									p = parts[j];

									opts.push("(?:\\s|\\b)+" + p + "(?:\\s|\\b)+");
								}

								// If this optional had a star or anything in it, make it non-matching.
								pipes = opts.join("|");

								pipes = pipes.replace(new RegExp(utils.quotemeta("(.+?)"), "g"), "(?:.+?)");
								pipes = pipes.replace(new RegExp(utils.quotemeta("(\\d+?)"), "g"), "(?:\\d+?)");
								pipes = pipes.replace(new RegExp(utils.quotemeta("(\\w+?)"), "g"), "(?:\\w+?)");

								// Temporarily dummy out the literal square brackets so we don't loop forever
								// thinking that the [\s\b] part is another optional.
								pipes = pipes.replace(/\[/g, "__lb__").replace(/\]/g, "__rb__");
								regexp = regexp.replace(new RegExp("\\s*\\[" + utils.quotemeta(match[1]) + "\\]\\s*"), "(?:" + pipes + "|(?:\\b|\\s)+)");
								match = regexp.match(/\[(.+?)\]/);
								_context12.next = 13;
								break;

							case 29:

								// Restore the literal square brackets.
								regexp = regexp.replace(/__lb__/g, "[").replace(/__rb__/g, "]");

								// _ wildcards can't match numbers! Quick note on why I did it this way:
								// the initial replacement above (_ => (\w+?)) needs to be \w because the
								// square brackets in [\s\d] will confuse the optionals logic just above.
								// So then we switch it back down here. Also, we don't just use \w+ because
								// that matches digits, and similarly [A-Za-z] doesn't work with Unicode,
								// so this regexp excludes spaces and digits instead of including letters.
								regexp = regexp.replace(/\\w/g, "[^\\s\\d]");

								// Filter in arrays.
								giveup = 0;

							case 32:
								if (!(regexp.indexOf("@") > -1)) {
									_context12.next = 39;
									break;
								}

								if (!(giveup++ > 50)) {
									_context12.next = 35;
									break;
								}

								return _context12.abrupt("break", 39);

							case 35:
								_match5 = regexp.match(/\@(.+?)\b/);

								if (_match5) {
									name = _match5[1];
									rep = "";

									if (self.master._array[name]) {
										rep = "(?:" + self.master._array[name].join("|") + ")";
									}
									regexp = regexp.replace(new RegExp("@" + utils.quotemeta(name) + "\\b"), rep);
								}
								_context12.next = 32;
								break;

							case 39:

								// Filter in bot variables.
								giveup = 0;

							case 40:
								if (!(regexp.indexOf("<bot") > -1)) {
									_context12.next = 47;
									break;
								}

								if (!(giveup++ > 50)) {
									_context12.next = 43;
									break;
								}

								return _context12.abrupt("break", 47);

							case 43:
								_match6 = regexp.match(/<bot (.+?)>/i);

								if (_match6) {
									_name2 = _match6[1];
									_rep = '';

									if (self.master._var[_name2]) {
										_rep = utils.stripNasties(self.master._var[_name2], self.utf8);
									}
									regexp = regexp.replace(new RegExp("<bot " + utils.quotemeta(_name2) + ">"), _rep.toLowerCase());
								}
								_context12.next = 40;
								break;

							case 47:
								// Filter in user variables.
								giveup = 0;

							case 48:
								if (!(regexp.indexOf("<get") > -1)) {
									_context12.next = 60;
									break;
								}

								if (!(giveup++ > 50)) {
									_context12.next = 51;
									break;
								}

								return _context12.abrupt("break", 60);

							case 51:
								_match7 = regexp.match(/<get (.+?)>/i);

								if (!_match7) {
									_context12.next = 58;
									break;
								}

								_name3 = _match7[1];
								_context12.next = 56;
								return self.master.getUservar(user, _name3);

							case 56:
								_rep2 = _context12.sent;

								regexp = regexp.replace(new RegExp("<get " + utils.quotemeta(_name3) + ">", "ig"), _rep2.toLowerCase());

							case 58:
								_context12.next = 48;
								break;

							case 60:
								// Filter in input/reply tags.
								giveup = 0;
								regexp = regexp.replace(/<input>/i, "<input1>");
								regexp = regexp.replace(/<reply>/i, "<reply1>");
								_context12.next = 65;
								return self.master._session.get(user, "__history__");

							case 65:
								history = _context12.sent;

								if (history == "undefined") {
									// purposeful typecast
									history = newHistory();
								}

							case 67:
								if (!(regexp.indexOf("<input") > -1 || regexp.indexOf("<reply") > -1)) {
									_context12.next = 74;
									break;
								}

								if (!(giveup++ > 50)) {
									_context12.next = 70;
									break;
								}

								return _context12.abrupt("break", 74);

							case 70:
								ref = ["input", "reply"];

								for (k = 0, len1 = ref.length; k < len1; k++) {
									type = ref[k];

									for (i = 1; i <= 9; i++) {
										if (regexp.indexOf("<" + type + i + ">") > -1) {
											value = self.formatMessage(history[type][i - 1], type === "reply");

											regexp = regexp.replace(new RegExp("<" + type + i + ">", "g"), value);
										}
									}
								}
								_context12.next = 67;
								break;

							case 74:

								// Recover escaped Unicode symbols.
								if (self.utf8 && regexp.indexOf("\\u") > -1) {
									regexp = regexp.replace(/\\u([A-Fa-f0-9]{4})/, function (match, grp) {
										return String.fromCharCode(parseInt(grp, 16));
									});
								}

								// Prevent accidental wildcard match due to double-pipe (e.g. /hi||hello/)
								regexp = regexp.replace(/\|{2,}/mg, '|');
								return _context12.abrupt("return", regexp);

							case 77:
							case "end":
								return _context12.stop();
						}
					}
				}, _callee12, this);
			}));

			function triggerRegexp(_x45, _x46) {
				return _ref12.apply(this, arguments);
			}

			return triggerRegexp;
		}()
	}, {
		key: "handleTag",
		value: function () {
			var _ref13 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(rive, user, content, scope, depth) {
				var tag, reminder, i, selfClosing, endTag, result, response;
				return regeneratorRuntime.wrap(function _callee13$(_context13) {
					while (1) {
						switch (_context13.prev = _context13.next) {
							case 0:
								tag = "";
								reminder = "";
								i = 0;

							case 3:
								if (!(i < content.length)) {
									_context13.next = 21;
									break;
								}

								if (!tags[tag]) {
									_context13.next = 9;
									break;
								}

								reminder = content.substring(i + 1);
								return _context13.abrupt("break", 21);

							case 9:
								if (!(content[i] === " ")) {
									_context13.next = 14;
									break;
								}

								reminder = content.substring(i + 1);
								return _context13.abrupt("break", 21);

							case 14:
								if (!(content[i] === ">")) {
									_context13.next = 17;
									break;
								}

								reminder = content.substring(i + 1);
								return _context13.abrupt("return", { response: "<" + tag + ">", reminder: reminder });

							case 17:
								tag += content[i];

							case 18:
								i++;
								_context13.next = 3;
								break;

							case 21:
								selfClosing = tags[tag] ? tags[tag].selfClosing : true;
								endTag = selfClosing ? ">" : "</" + tag + ">";
								_context13.next = 25;
								return this.parseComplexTags(rive, user, reminder, scope, depth, endTag);

							case 25:
								result = _context13.sent;

								reminder = result.reminder;

								if (!(tags[tag] && tags[tag].handle)) {
									_context13.next = 33;
									break;
								}

								_context13.next = 30;
								return tags[tag].handle(rive, result.response, user, scope);

							case 30:
								_context13.t0 = _context13.sent;
								_context13.next = 34;
								break;

							case 33:
								_context13.t0 = "<" + tag + " " + result.response + ">";

							case 34:
								response = _context13.t0;
								return _context13.abrupt("return", { response: response, reminder: reminder });

							case 36:
							case "end":
								return _context13.stop();
						}
					}
				}, _callee13, this);
			}));

			function handleTag(_x47, _x48, _x49, _x50, _x51) {
				return _ref13.apply(this, arguments);
			}

			return handleTag;
		}()
	}, {
		key: "parseComplexTags",
		value: function () {
			var _ref14 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14(rive, user, content, scope, depth) {
				var endTag = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : "";
				var response, reminder, nextTag, nextEnd, result;
				return regeneratorRuntime.wrap(function _callee14$(_context14) {
					while (1) {
						switch (_context14.prev = _context14.next) {
							case 0:
								if (!(depth > 50)) {
									_context14.next = 2;
									break;
								}

								return _context14.abrupt("return", { response: content, reminder: "" });

							case 2:
								response = '';
								reminder = content;
								nextTag = reminder.indexOf("<");
								nextEnd = endTag ? reminder.indexOf(endTag) : reminder.length;

							case 6:
								if (!(reminder.length > 0 && nextTag > -1 && nextTag < nextEnd)) {
									_context14.next = 18;
									break;
								}

								response += reminder.substring(0, nextTag);
								reminder = reminder.substring(nextTag + 1);
								_context14.next = 11;
								return this.handleTag(rive, user, reminder, scope, depth + 1);

							case 11:
								result = _context14.sent;

								response += result.response;
								reminder = result.reminder;
								nextTag = reminder.indexOf("<");
								nextEnd = endTag ? reminder.indexOf(endTag) : reminder.length;
								_context14.next = 6;
								break;

							case 18:
								response += reminder.substring(0, nextEnd);
								reminder = reminder.substring(nextEnd + endTag.length);

								return _context14.abrupt("return", { response: response, reminder: reminder });

							case 21:
							case "end":
								return _context14.stop();
						}
					}
				}, _callee14, this);
			}));

			function parseComplexTags(_x53, _x54, _x55, _x56, _x57) {
				return _ref14.apply(this, arguments);
			}

			return parseComplexTags;
		}()

		/**
  string processTags (string user, string msg, string reply, string[] stars,
  					string[] botstars, int step, scope)
  	Process tags in a reply element.
  */

	}, {
		key: "processTags",
		value: function () {
			var _ref15 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15(user, msg, reply, st, bst, step, scope) {
				var self, stars, botstars, match, giveup, name, result, i, len, _i2, _len3, history, _i3, random, text, output, formats, m, _len4, type, content, replace, _name4, target, subreply;

				return regeneratorRuntime.wrap(function _callee15$(_context15) {
					while (1) {
						switch (_context15.prev = _context15.next) {
							case 0:
								self = this;

								// Prepare the stars and botstars.

								stars = [""];

								stars.push.apply(stars, st);
								botstars = [""];

								botstars.push.apply(botstars, bst);
								if (stars.length === 1) {
									stars.push("undefined");
								}
								if (botstars.length === 1) {
									botstars.push("undefined");
								}

								// Turn arrays into randomized sets.
								match = reply.match(/\(@([A-Za-z0-9_]+)\)/i);
								giveup = 0;

							case 9:
								if (!match) {
									_context15.next = 20;
									break;
								}

								if (!(giveup++ > self.master._depth)) {
									_context15.next = 13;
									break;
								}

								self.warn("Infinite loop looking for arrays in reply!");
								return _context15.abrupt("break", 20);

							case 13:
								name = match[1];
								result = void 0;

								if (self.master._array[name]) {
									result = "{random}" + self.master._array[name].join("|") + "{/random}";
								} else {
									// Dummy it out so we can reinsert it later.
									result = "\0@" + name + "\0";
								}

								reply = reply.replace(new RegExp("\\(@" + utils.quotemeta(name) + "\\)", "ig"), result);
								match = reply.match(/\(@([A-Za-z0-9_]+)\)/i);
								_context15.next = 9;
								break;

							case 20:

								// Restore literal arrays that didn't exist.
								reply = reply.replace(/\x00@([A-Za-z0-9_]+)\x00/g, "(@$1)");

								// Tag shortcuts.
								reply = reply.replace(/<person>/ig, "{person}<star>{/person}");
								reply = reply.replace(/<@>/ig, "{@<star>}");
								reply = reply.replace(/<formal>/ig, "{formal}<star>{/formal}");
								reply = reply.replace(/<sentence>/ig, "{sentence}<star>{/sentence}");
								reply = reply.replace(/<uppercase>/ig, "{uppercase}<star>{/uppercase}");
								reply = reply.replace(/<lowercase>/ig, "{lowercase}<star>{/lowercase}");

								// Weight and star tags.
								reply = reply.replace(/\{weight=\d+\}/ig, ""); // Remove {weight}s
								reply = reply.replace(/<star>/ig, stars[1]);
								reply = reply.replace(/<botstar>/ig, botstars[1]);
								for (i = 1, len = stars.length; i <= len; i++) {
									reply = reply.replace(new RegExp("<star" + i + ">", "ig"), stars[i]);
								}
								for (_i2 = 1, _len3 = botstars.length; _i2 <= _len3; _i2++) {
									reply = reply.replace(new RegExp("<botstar" + _i2 + ">", "ig"), botstars[_i2]);
								}

								// <input> and <reply>
								_context15.next = 34;
								return self.master._session.get(user, "__history__");

							case 34:
								history = _context15.sent;

								if (history == "undefined") {
									// purposeful typecast for `undefined` too
									history = newHistory();
								}
								reply = reply.replace(/<input>/ig, history.input ? history.input[0] : "undefined");
								reply = reply.replace(/<reply>/ig, history.reply ? history.reply[0] : "undefined");
								for (_i3 = 1; _i3 <= 9; _i3++) {
									if (reply.indexOf("<input" + _i3 + ">") > -1) {
										reply = reply.replace(new RegExp("<input" + _i3 + ">", "ig"), history.input[_i3 - 1]);
									}
									if (reply.indexOf("<reply" + _i3 + ">") > -1) {
										reply = reply.replace(new RegExp("<reply" + _i3 + ">", "ig"), history.reply[_i3 - 1]);
									}
								}

								// <id> and escape codes
								reply = reply.replace(/<id>/ig, user);
								reply = reply.replace(/\\s/ig, " ");
								reply = reply.replace(/\\n/ig, "\n");
								reply = reply.replace(/\\#/ig, "#");

								// {random}
								match = reply.match(/\{random\}(.+?)\{\/random\}/i);
								giveup = 0;

							case 45:
								if (!match) {
									_context15.next = 57;
									break;
								}

								if (!(giveup++ > self.master._depth)) {
									_context15.next = 49;
									break;
								}

								self.warn("Infinite loop looking for random tag!");
								return _context15.abrupt("break", 57);

							case 49:
								random = [];
								text = match[1];

								if (text.indexOf("|") > -1) {
									random = text.split("|");
								} else {
									random = text.split(" ");
								}

								output = random[parseInt(Math.random() * random.length)];

								reply = reply.replace(new RegExp("\\{random\\}" + utils.quotemeta(text) + "\\{\\/random\\}", "ig"), output);
								match = reply.match(/\{random\}(.+?)\{\/random\}/i);
								_context15.next = 45;
								break;

							case 57:

								// Person substitutions & string formatting
								formats = ["person", "formal", "sentence", "uppercase", "lowercase"];
								m = 0, _len4 = formats.length;

							case 59:
								if (!(m < _len4)) {
									_context15.next = 78;
									break;
								}

								type = formats[m];

								match = reply.match(new RegExp("{" + type + "}(.+?){/" + type + "}", "i"));
								giveup = 0;

							case 63:
								if (!match) {
									_context15.next = 75;
									break;
								}

								giveup++;

								if (!(giveup >= 50)) {
									_context15.next = 68;
									break;
								}

								self.warn("Infinite loop looking for " + type + " tag!");
								return _context15.abrupt("break", 75);

							case 68:
								content = match[1];
								replace = void 0;

								if (type === "person") {
									replace = self.substitute(content, "person");
								} else {
									replace = utils.stringFormat(type, content);
								}

								reply = reply.replace(new RegExp("{" + type + "}" + utils.quotemeta(content) + ("{/" + type + "}"), "ig"), replace);
								match = reply.match(new RegExp("{" + type + "}(.+?){/" + type + "}", "i"));
								_context15.next = 63;
								break;

							case 75:
								m++;
								_context15.next = 59;
								break;

							case 78:
								_context15.next = 80;
								return self.parseComplexTags(self.master, user, reply, scope, 0);

							case 80:
								reply = _context15.sent.response;


								// Topic setter
								match = reply.match(/\{topic=(.+?)\}/i);
								giveup = 0;

							case 83:
								if (!match) {
									_context15.next = 95;
									break;
								}

								giveup++;

								if (!(giveup >= 50)) {
									_context15.next = 88;
									break;
								}

								self.warn("Infinite loop looking for topic tag!");
								return _context15.abrupt("break", 95);

							case 88:
								_name4 = match[1];
								_context15.next = 91;
								return self.master.setUservar(user, "topic", _name4);

							case 91:
								reply = reply.replace(new RegExp("{topic=" + utils.quotemeta(_name4) + "}", "ig"), "");
								match = reply.match(/\{topic=(.+?)\}/i); // Look for more
								_context15.next = 83;
								break;

							case 95:

								// Inline redirector
								match = reply.match(/\{@([^\}]*?)\}/);
								giveup = 0;

							case 97:
								if (!match) {
									_context15.next = 111;
									break;
								}

								giveup++;

								if (!(giveup >= 50)) {
									_context15.next = 102;
									break;
								}

								self.warn("Infinite loop looking for redirect tag!");
								return _context15.abrupt("break", 111);

							case 102:
								target = utils.strip(match[1]);

								self.say("Inline redirection to: " + target);

								_context15.next = 106;
								return self._getReply(user, target, "normal", step + 1, scope);

							case 106:
								subreply = _context15.sent;

								reply = reply.replace(new RegExp("\\{@" + utils.quotemeta(match[1]) + "\\}", "i"), subreply);
								match = reply.match(/\{@([^\}]*?)\}/);
								_context15.next = 97;
								break;

							case 111:
								return _context15.abrupt("return", reply);

							case 112:
							case "end":
								return _context15.stop();
						}
					}
				}, _callee15, this);
			}));

			function processTags(_x58, _x59, _x60, _x61, _x62, _x63, _x64) {
				return _ref15.apply(this, arguments);
			}

			return processTags;
		}()

		/**
  string substitute (string msg, string type)
  	Run substitutions against a message. `type` is either "sub" or "person" for
  the type of substitution to run.
  */

	}, {
		key: "substitute",
		value: function substitute(msg, type) {
			var self = this;

			// Safety checking.
			if (!self.master._sorted[type]) {
				self.master.warn("You forgot to call sortReplies()!");
				return "";
			}

			// Get the substitutions map.
			var subs = type === "sub" ? self.master._sub : self.master._person;

			// Get the max number of words in sub/person to minimize interations
			var maxwords = type === "sub" ? self.master._submax : self.master._personmax;
			var result = "";

			// Take the original message with no punctuation
			var pattern;
			if (self.master.unicodePunctuation != null) {
				pattern = msg.replace(self.master.unicodePunctuation, "");
			} else {
				pattern = msg.replace(/[.,!?;:]/g, "");
			}

			var tries = 0;
			var giveup = 0;
			var subgiveup = 0;

			// Look for words/phrases until there is no "spaces" in pattern
			while (pattern.indexOf(" ") > -1) {
				giveup++;
				// Give up if there are too many substitutions (for safety)
				if (giveup >= 1000) {
					self.warn("Too many loops when handling substitutions!");
					break;
				}

				var li = utils.nIndexOf(pattern, " ", maxwords);
				var subpattern = pattern.substring(0, li);

				// If finds the pattern in sub object replace and stop to look
				result = subs[subpattern];
				if (result !== undefined) {
					msg = msg.replace(subpattern, result);
				} else {
					// Otherwise Look for substitutions in a subpattern
					while (subpattern.indexOf(" ") > -1) {
						subgiveup++;

						// Give up if there are too many substitutions (for safety)
						if (subgiveup >= 1000) {
							self.warn("Too many loops when handling substitutions!");
							break;
						}

						li = subpattern.lastIndexOf(" ");
						subpattern = subpattern.substring(0, li);

						// If finds the subpattern in sub object replace and stop to look
						result = subs[subpattern];
						if (result !== undefined) {
							msg = msg.replace(subpattern, result);
							break;
						}

						tries++;
					}
				}

				var fi = pattern.indexOf(" ");
				pattern = pattern.substring(fi + 1);
				tries++;
			}

			// After all loops, see if just one word is in the pattern
			result = subs[pattern];
			if (result !== undefined) {
				msg = msg.replace(pattern, result);
			}

			return msg;
		}
	}]);

	return Brain;
}();

;

function newHistory() {
	return {
		input: ["undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined"],
		reply: ["undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined"]
	};
}

module.exports = Brain;