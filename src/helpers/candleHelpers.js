const moment = require("moment");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

// env
const schema = process.env.SCHEMA;
const interval = process.env.INTERVAL;
const timeCheck = process.env.TIMECHECK;
const measure = process.env.MEASURE;
const timeAmount = process.env.SUBSTRACTAMOUNT;
const nPivot = process.env.NPIVOT;


// helpers
const indicatorHelper = require("./indicatorHelpers");
const dbHelpers = require("./dbHelpers");
const calcHelpers = require("./calcHelpers");
const apiHelpers = require("./apiHelpers");

let refillCandleFlag = {
	"XAUUSDm" : false,
	"EURUSDm" : false,
	"US500m" : false,
	"BTCUSDm" : false,
};

const checkMissedCandle = async (closedCandle, candleInDB) => {
	const lastestDBTime = moment.utc(candleInDB.time).add(timeAmount, measure).format("YYYY/MM/DD HH:mm:ss");
	const lastestStreamingTime = moment.utc(closedCandle.time).format("YYYY/MM/DD HH:mm:ss");
	const lSymbol = closedCandle.symbol.toLowerCase();
	const table = lSymbol + closedCandle.timeframe;
	console.log("lastestDBTime:: ", lastestDBTime);
	console.log("lastestStreamingTime:: ", lastestStreamingTime);
	const timeDistance = Math.abs(new Date(lastestStreamingTime).getTime() - new Date(lastestDBTime).getTime());
	if (timeDistance > timeCheck) {
		const numOfMissedCandle = Math.abs(timeDistance / timeCheck);
		let missedCandle = await global.metaxAccount.getHistoricalCandles(candleInDB.symbol, interval, lastestStreamingTime, numOfMissedCandle);
		missedCandle =  missedCandle.filter(item => 
			new Date(item.brokerTime) >= new Date(lastestDBTime) && 
			new Date(item.brokerTime) < new Date(lastestStreamingTime)
		);
		await dbHelpers.refillManyDataQuery(missedCandle, table, schema);
		console.log("Data refilled!");
	}
};

const clearDuplicateCandle = async (symbol, interval) => {
	let flag;
	let query = "";
	const candles = await dbHelpers.doQuery(`SELECT id, time FROM public.${symbol}${interval} ORDER BY time;`, (result) => {
		return result.rows;
	});
	flag = candles[0];
	candles.forEach((candle, index) => {
		if (index != 0) {
			if (candle.time.toString() == flag.time.toString()) {
				query += 
`DELETE FROM public.${symbol}${interval} WHERE id = ${candle.id};
`;
			} else {
				flag = candle;
			}
		} 
	});
	console.log(query);
	const doDelete = await dbHelpers.doQuery(query, (result) => {
		return result.rowCount;
	});
};

const streamingCandleProcessing = async (candle) => {
	const lSymbol = candle.symbol.toLowerCase();
	const table = lSymbol + candle.timeframe;
	let lastCandleInDatabase = await dbHelpers.getLastCandleInDatabase(schema, table);
	let compareTime = lastCandleInDatabase.time;
	// get moment type
	const mCompareTime = moment.utc(compareTime);
	const mcurrentCandleTime = moment.utc(candle.time);

	console.log(candle.symbol, candle.timeframe);
	console.log("lastestDBTime:: ", mCompareTime);
	console.log("lastestStreamingTime:: ", mcurrentCandleTime);
	// calc time distance
	const timeDistance = mcurrentCandleTime.diff(mCompareTime, "milliseconds");

	if (refillCandleFlag[candle.symbol] == false) {
		refillCandleFlag[candle.symbol] = true;
		await checkMissedCandle(candle, lastCandleInDatabase);
	}

	lastCandleInDatabase = await dbHelpers.getLastCandleInDatabase(schema, table);
	compareTime = lastCandleInDatabase.time;

	if (candle.time != compareTime && timeDistance > 0) {
		const [[rsi, ema8, ema9, ema20, 
			ema21, ema25, ema34, ema50,
			ema52, ema72, ema100, ema200, BB], psar, adxData] = await Promise.all([
			indicatorHelper.getRSI_EMA_BB(lSymbol, "close", interval, candle),
			indicatorHelper.getPSAR(lSymbol, interval, candle),
			indicatorHelper.getADXandMACD(lSymbol, interval, candle),
		]);
		const { adx, pdi, mdi, macd, signalMACD, histogramMACD } = adxData;

		const currentCandle = {
			...candle,
			isPivot: false,
			HH: null,
			LL: null,
			HLC: null,
			HLO: null,
			trend: 0,
			preTrend: 0,
			isBreak: false,
			RSI: rsi,
			EMA8: ema8,
			EMA9: ema9,
			EMA20: ema20,
			EMA21: ema21,
			EMA25: ema25,
			EMA34: ema34,
			EMA50: ema50,
			EMA52: ema52,
			EMA72: ema72,
			EMA100: ema100,
			EMA200: ema200,
			BBUpper: BB.upper,
			BBMiddle: BB.middle,
			BBLower: BB.lower,
			PSAR: psar,
			ADX: adx,
			PDI: pdi,
			MDI: mdi,
			MACD: macd,
			signal: signalMACD,
			Histogram: histogramMACD,
		};

		await dbHelpers.insertDataQuery(currentCandle , table, schema);

		const pivots = await dbHelpers.getPivots(schema, table);
        
		let lastPivotHL = pivots.find(result => result["HLC"] !== "high" && result["HLC"] !== "low");
		let lastPivotClose = pivots.find(result => result["HLC"] === "high" || result["HLC"] === "low");
                    
		let pointOfTime;

		if (lastPivotHL && lastPivotClose) {
			if (moment(lastPivotHL["time"]).isBefore(moment(lastPivotClose["time"]))) {
				pointOfTime = lastPivotHL["time"];
			} else if (moment(lastPivotClose["time"]).isBefore(moment(lastPivotHL["time"]))) {
				pointOfTime = lastPivotClose["time"];
			} else {
				pointOfTime = lastPivotHL["time"];
			}
		} else if (!lastPivotHL && !lastPivotClose) {
			pointOfTime = false;
		} else if (!lastPivotHL) {
			pointOfTime = lastPivotClose["time"];
		} else if (!lastPivotClose) {
			pointOfTime = lastPivotHL["time"];
		}

		let candles = await dbHelpers.get10PrevCandles(schema, table, pointOfTime);
		

		if (candles) {
			candles = calcHelpers.findPivotHigh(candles, "high", nPivot);
			candles = calcHelpers.findPivotLow(candles, "low", nPivot);
			candles = calcHelpers.findPivotHigh(candles, "close", nPivot);
			candles = calcHelpers.findPivotLow(candles, "close", nPivot);
            
			// get all pivot point
			let pivotList = candles.filter(item => item["isPivot"] === true);
            
			// remove noise pivot high 
			let resultList = calcHelpers.removeNoisePivotHL(pivotList, "high");
			// remove noise pivot low 
			resultList = calcHelpers.removeNoisePivotHL(resultList, "low");      
			// remove noise pivot low
			resultList = calcHelpers.removeNoisePivotOC(resultList, "close", "high", "low");
			resultList = calcHelpers.removeNoisePivotOC(resultList, "close", "low", "high");
            
			let updateQuery = "";
			resultList.forEach(item => {
				if (item["trend"] === null) {
					item["trend"] = 0;
					item["preTrend"] = 0;
					item["isBreak"] = false;
				}
				let tempQuery = `UPDATE ${schema}.${table} SET
	            "isPivot"='${item["isPivot"]}',
	            "HH"='${item["HH"]}',
	            "LL"='${item["LL"]}',
	            "HLO"='${item["HLO"]}',
	            "HLC"='${item["HLC"]}',
	            trend='${item["trend"]}',
	            "preTrend"='${item["preTrend"]}',
	            "isBreak"='${item["isBreak"]}'
	            WHERE id = ${item["id"]};\n`;
				updateQuery += tempQuery;
			});
            
			if (updateQuery.length > 0) {
				let updateFunc = await dbHelpers.doQuery(updateQuery,(result) => {
					return result;
				});
			}
		}

		await dbHelpers.updateCandle(schema, table, currentCandle);
		// send candle to signal module
		await apiHelpers.sendSignalData(currentCandle, interval);
		// apiHelpers.sendSignalData(currentCandle, interval);
	}
};

const initializeDatabase = async (pair, interval) => {
	let missedCandle = await global.metaxAccount.getHistoricalCandles(pair, interval);
	await dbHelpers.refillManyDataQuery(missedCandle, pair.toLowerCase() + interval, "public");
	console.log(`${pair}${interval} done!`);
};

module.exports = {
	streamingCandleProcessing,
	clearDuplicateCandle,
	initializeDatabase,
};