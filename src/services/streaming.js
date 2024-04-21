// dependencies
const SynchronizationListener = require("metaapi.cloud-sdk").SynchronizationListener;
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

// env
const metaAuthToken = process.env.TOKEN;
const accountId = process.env.ACCOUNT_ID;
const domain = process.env.DOMAIN;
const interval = process.env.INTERVAL;
const timeCheck = process.env.TIMECHECK;

// helpers
const candleHelpers = require("../helpers/candleHelpers");

const savedCandle = {
	"XAUUSDm": {},
	//"EURUSD": {},
	"BTCUSDm": {},
	"ETHUSDm": {}
};

class QuoteListener extends SynchronizationListener {
	async onCandlesUpdated(instanceIndex, candles) {
		await Promise.all(
			candles.map(async(closedCandle, index) => {
				if (
					closedCandle.timeframe == interval && 
					index % 2	== 0 && 
					closedCandle.time.toString() !== savedCandle[closedCandle.symbol]?.time?.toString()) 
				{
					savedCandle[closedCandle.symbol] = closedCandle;
					await candleHelpers.streamingCandleProcessing(closedCandle);
				}
			})
		);
	}
}

const createStreaming = async (account, symbols) => {
	const connection = account.getStreamingConnection();
	const quoteListener = new QuoteListener();
	connection.addSynchronizationListener(quoteListener);
	await connection.connect();
	await connection.waitSynchronized();
	console.log("Synchronize...");

	await Promise.all(
		symbols.map(async (element) => {
			return await connection.subscribeToMarketData(element, [
				{type: "candles", timeframe: interval, intervalInMilliseconds: 10000},
			],
			1);
		})
	);

	// eslint-disable-next-line no-constant-condition
	while(true){
		await new Promise(res => setTimeout(res, 2000));
	}
};


module.exports = {
	createStreaming
};