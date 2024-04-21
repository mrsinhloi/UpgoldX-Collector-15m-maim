const {Pool} = require("pg");
const moment = require("moment");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

// Database connect config
const config = {
	host: process.env.database_server_name,
	user: process.env.database_username,
	password: process.env.database_password,
	database: process.env.database,
	port: 5432,
	keepAlive: true
};

const pool = new Pool(config);

const doQuery = async function (query, callback) {
	return new Promise((resolve, reject) => {
		pool.query(query, async (err, results) => {
			if (err) reject(err);
			let finalResult = await callback(results);
			resolve(finalResult);
		});
	})
		.then(result => { return result; })
		.catch(err => {
			console.log(err);
			return err;
		});
};

const getPairs = async () => {
	let pairs = await doQuery(
		"SELECT * FROM public.\"CoinPairm\" ORDER BY \"CoinPairm\";", (result) => {
			return result["rows"];
		});
	pairs = pairs.map(item => item.CoinPair);
	return pairs;
};

const insertDataQuery = async (candle, table, schema) => {
	let { time, open, high, low, close, tickVolume, spread, symbol, brokerTime,
		HH, LL, HLO, HLC, isPivot, trend, preTrend, isBreak,
		RSI, EMA8, EMA9, EMA20, 
		EMA21, EMA25, EMA34, EMA50,
		EMA52, EMA72, EMA100, EMA200, BBUpper, BBMiddle, BBLower,
		PSAR, ADX, PDI, MDI, MACD, signal: Signal, Histogram } = candle;

	time = moment.utc(time).format("YYYY/MM/DD HH:mm:ss");

	brokerTime = moment.utc(brokerTime).format("YYYY/MM/DD HH:mm:ss");

	// Create query Insert data
	let insertQuery = `INSERT INTO ${schema}.${table} (
        "time", open, close, high, low, "tickVolume", spread, "symbol", "brokerTime",
        "HH","LL","HLO","HLC","isPivot","trend","preTrend","isBreak",
        "RSI","EMA21","EMA52","EMA200","BBUpper","BBMiddle","BBLower","EMA9","EMA25", 
		"PSAR", "ADX", "PDI", "MDI", "MACD", "signal", "Histogram", "EMA8",
		"EMA20", "EMA34", "EMA50", "EMA72", "EMA100")
        VALUES (
        '${time}', '${open}', '${close}', '${high}', '${low}', '${tickVolume}', '${spread}','${symbol}','${brokerTime}',
        '${HH}','${LL}','${HLO}','${HLC}','${isPivot}','${trend}','${preTrend}','${isBreak}',
        '${RSI}','${EMA21}','${EMA52}','${EMA200}','${BBUpper}','${BBMiddle}','${BBLower}','${EMA9}','${EMA25}',
		'${PSAR}', '${ADX}', '${PDI}', '${MDI}', '${MACD}', '${Signal}', '${Histogram}', '${EMA8}',
		'${EMA20}', '${EMA34}', '${EMA50}', '${EMA72}', '${EMA100}');`;
	console.log(insertQuery);
	let insertFunc = await doQuery(insertQuery, (result) => {
		return result;
	});
};

const refillManyDataQuery = async (candles, table, schema) => {
	let insertQuery = "";
	candles.forEach(candle => {
		let { time, open, high, low, close, tickVolume, spread, symbol, brokerTime } = candle;

		time = moment.utc(time).format("YYYY/MM/DD HH:mm:ss");

		brokerTime = moment.utc(brokerTime).format("YYYY/MM/DD HH:mm:ss");

		// Create query Insert data
		insertQuery += `
        INSERT INTO ${schema}.${table} ("time", open, close, high, low, "tickVolume", spread, "symbol", "brokerTime")
        VALUES ('${time}', '${open}', '${close}', '${high}', '${low}', '${tickVolume}', '${spread}','${symbol}','${brokerTime}');`;
	});
	let insertFunc = await doQuery(insertQuery, (result) => {
		return result;
	});
};

const getLastCandleTimeInDatabase = async (schema, table) => {
	let query = `SELECT * FROM ${schema}.${table} ORDER BY time DESC LIMIT 1;`;
	let lastCandleInDatabase = await doQuery(query, (res) => {
		return res["rows"][0];
	});
	let lastCandleTime = lastCandleInDatabase.time;
	return lastCandleTime;
};

const getLastCandleInDatabase = async (schema, table) => {
	let query = `SELECT * FROM ${schema}.${table} ORDER BY time DESC LIMIT 1;`;
	let lastCandleInDatabase = await doQuery(query, (res) => {
		return res["rows"][0];
	});
	return lastCandleInDatabase;
};

const getLastPivot = async (table, schema) => {
	let lastPivot = await doQuery(`SELECT * FROM ${schema}.${table} WHERE "isPivot" = 'true' ORDER BY time DESC LIMIT 1`, (result) => {
		return result["rows"][0];
	});
	return lastPivot;
};

const getNCandleSourceTypeFromDB = async (coinPair, interval, sourceType, endTime = undefined) => {
	let candelQuery;
	if (endTime !== undefined) {
		candelQuery = `SELECT * FROM public."${coinPair}${interval}" WHERE "time" <= '${endTime}' ORDER BY "time" DESC LIMIT 201;`;
	} else {
		candelQuery = `SELECT * FROM public."${coinPair}${interval}" ORDER BY "time" DESC LIMIT 200;`;
	}
	let candles = await doQuery(candelQuery, (result) => {
		return result["rows"].sort((a, b) => {
			var c = new Date(a["time"]);
			var d = new Date(b["time"]);
			return c - d;
		});
	});

	let arrays = candles.map(item => { return parseFloat(item[sourceType]); });
	return arrays;
};

const getNCandleFromDB = async (coinPair, interval) => {
	const query = `SELECT * FROM public."${coinPair}${interval}" ORDER BY "time" DESC LIMIT 200;`;

	const candles = await doQuery(query, (result) => {
		return result["rows"].sort((a, b) => {
			var c = new Date(a["time"]);
			var d = new Date(b["time"]);
			return c - d;
		});
	});

	return candles;
};

const getPivots = async (schema, table) => {
	let results = await doQuery(`SELECT * FROM ${schema}.${table} 
    WHERE "isPivot" = 'true' 
    AND (("HH" = 'high' OR "LL" = 'low') OR "HLC" IN ('high', 'low'))
    ORDER BY "time" DESC 
    LIMIT 2;
    `, (result) => {
		return result.rows;
	});
	return results;
};

const get10PrevCandles = async (schema, table, pointOfTime) => {
	let query = "";
	if (pointOfTime == false) {
		query = `SELECT * FROM (SELECT * FROM ${schema}.${table} ORDER BY time DESC LIMIT 100) ORDER BY time;`;
	} else {
		query = `SELECT * FROM ${schema}.${table} 
		WHERE "time" >= '${moment.utc(pointOfTime).subtract(parseInt(process.env.SUBTRACTAMOUNT) * 10, process.env.MEASURE).format("YYYY/MM/DD HH:mm:ss")}' ORDER BY "time"`;
	}
	const candles = await doQuery(query,
		(result) => { return result["rows"]; });
	return candles;
};

const updateCandle = async (schema, table, currentCandle) => {
	await doQuery(
		`UPDATE ${schema}.${table} 
        SET trend = '${currentCandle["trend"]}', 
        "preTrend" = '${currentCandle["preTrend"]}', 
        "isBreak" = '${currentCandle["isBreak"]}' 
        WHERE id = (SELECT MAX(id) FROM ${schema}.${table});`,
		(result) => {
			return result;
		}
	);
};

module.exports = {
	doQuery,
	getPairs,
	insertDataQuery,
	getLastCandleTimeInDatabase,
	getLastPivot,
	getNCandleSourceTypeFromDB,
	getNCandleFromDB,
	getLastCandleInDatabase,
	refillManyDataQuery,
	getPivots,
	get10PrevCandles,
	updateCandle,
};