/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const {getPairs} = require("./helpers/dbHelpers");
const { createStreaming } = require("./services/streaming");
const { createAccount } = require("./helpers/metaHelpers");
const { clearDuplicateCandle, initializeDatabase } = require("./helpers/candleHelpers");

require("events").EventEmitter.prototype._maxListeners = 70;
require("events").defaultMaxListeners = 70;

module.exports = async () => {

	// Get pairs from database
	const pairs = await getPairs();
	console.log(pairs);
	const account = await createAccount();
	global.metaxAccount = account;
	await createStreaming(account, pairs);

	// clear duplicate
	// clearDuplicateCandle("xauusd", "4h");

	// init database
	// pairs.forEach(async (pair) => {
	// 	initializeDatabase(pair, "4h");
	// });
	// initializeDatabase("ETHUSD", "4h");
};