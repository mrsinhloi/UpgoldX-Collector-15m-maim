// data
const fs = require("fs");
let data = fs.readFileSync("precisionDict.json");
let precisionDict = JSON.parse(data);

// indicators
const indicators = require("technicalindicators");
const PSAR = require("technicalindicators").PSAR;
const ADX = require("technicalindicators").ADX;
const MACD = require("technicalindicators").MACD;

// helpers
const dbHelpers = require("./dbHelpers");

const getRSI_EMA_BB = async (coinPair, sourceType, interval, currentCandle, endTime = undefined) => {
	let candles;
	if (endTime !== undefined) {
		candles = await dbHelpers.getNCandleSourceTypeFromDB(coinPair, interval, sourceType, endTime);
	} else {
		candles = await dbHelpers.getNCandleSourceTypeFromDB(coinPair, interval, sourceType);
	}
	candles.push(parseFloat(currentCandle[sourceType]));

	let rsiInput = {
		values: candles,
		period: 14,
	};

	let ema8Input = {
		values: candles,
		period: 8,
	};

	let ema20Input = {
		values: candles,
		period: 20,
	};

	let ema21Input = {
		values: candles,
		period: 21,
	};

	let ema34Input = {
		values: candles,
		period: 34,
	};

	let ema50Input = {
		values: candles,
		period: 50,
	};

	let ema52Input = {
		values: candles,
		period: 52,
	};

	let ema72Input = {
		values: candles,
		period: 72,
	};

	let ema100Input = {
		values: candles,
		period: 100,
	};

	let ema200Input = {
		values: candles,
		period: 200,
	};

	let BBInput = {
		values: candles,
		period: 20,
		stdDev: 2,
	};

	let ema9Input = {
		values: candles,
		period: 9,
	};

	let ema25Input = {
		values: candles,
		period: 25,
	};

	let RSI = indicators.RSI.calculate(rsiInput);
	let EMA8 = indicators.EMA.calculate(ema8Input);
	let EMA9 = indicators.EMA.calculate(ema9Input);
	let EMA20 = indicators.EMA.calculate(ema20Input);
	let EMA21 = indicators.EMA.calculate(ema21Input);
	let EMA25 = indicators.EMA.calculate(ema25Input);
	let EMA34 = indicators.EMA.calculate(ema34Input);
	let EMA50 = indicators.EMA.calculate(ema50Input);
	let EMA52 = indicators.EMA.calculate(ema52Input);
	let EMA72 = indicators.EMA.calculate(ema72Input);
	let EMA100 = indicators.EMA.calculate(ema100Input);
	let EMA200 = indicators.EMA.calculate(ema200Input);
	let BB = indicators.BollingerBands.calculate(BBInput);
	return Promise.all([RSI, EMA8, EMA9, EMA20, EMA21, EMA25, EMA34, EMA50, EMA52, EMA72, EMA100, EMA200, BB])
		.then (res => {
			let rsiArray = res[0];
			let ema8Array = res[1];
			let ema9Array = res[2];
			let ema20Array = res[3];
			let ema21Array = res[4];
			let ema25Array = res[5];
			let ema34Array = res[6];
			let ema50Array = res[7];
			let ema52Array = res[8];
			let ema72Array = res[9];
			let ema100Array = res[10];
			let ema200Array = res[11];
			let BBArray = res[12];

			return [
				rsiArray[rsiArray.length - 1], 
				parseFloat(ema8Array[ema8Array.length - 1].toFixed(precisionDict[coinPair]["pricePrecision"])),
				parseFloat(ema9Array[ema9Array.length - 1].toFixed(precisionDict[coinPair]["pricePrecision"])),
				parseFloat(ema20Array[ema20Array.length - 1].toFixed(precisionDict[coinPair]["pricePrecision"])),
				parseFloat(ema21Array[ema21Array.length - 1].toFixed(precisionDict[coinPair]["pricePrecision"])),
				parseFloat(ema25Array[ema25Array.length - 1].toFixed(precisionDict[coinPair]["pricePrecision"])),
				parseFloat(ema34Array[ema34Array.length - 1].toFixed(precisionDict[coinPair]["pricePrecision"])),
				parseFloat(ema50Array[ema50Array.length - 1].toFixed(precisionDict[coinPair]["pricePrecision"])),
				parseFloat(ema52Array[ema52Array.length - 1].toFixed(precisionDict[coinPair]["pricePrecision"])),
				parseFloat(ema72Array[ema72Array.length - 1].toFixed(precisionDict[coinPair]["pricePrecision"])),
				parseFloat(ema100Array[ema100Array.length - 1].toFixed(precisionDict[coinPair]["pricePrecision"])),
				parseFloat(ema200Array[ema200Array.length - 1].toFixed(precisionDict[coinPair]["pricePrecision"])),
				{
					upper: parseFloat(BBArray[BBArray.length - 1].upper.toFixed(precisionDict[coinPair]["pricePrecision"])),
					middle: parseFloat(BBArray[BBArray.length - 1].middle.toFixed(precisionDict[coinPair]["pricePrecision"])),
					lower: parseFloat(BBArray[BBArray.length - 1].lower.toFixed(precisionDict[coinPair]["pricePrecision"])),
				},
			];
		})
		.catch (err => {if(err) throw err;});
};

const getPSAR = async (coinPair, interval, currentCandle) => {
	let candles = await dbHelpers.getNCandleFromDB(coinPair, interval);
    
	let highArray = candles.map(item => {return parseFloat(item.high);});
	let lowArray = candles.map(item => {return parseFloat(item.low);});

	highArray.push(parseFloat(currentCandle.high));
	lowArray.push(parseFloat(currentCandle.low));

	let step = 0.02;
	let max = 0.2;

	let input = { step: step, max: max, high: highArray, low: lowArray };
	let psar = PSAR.calculate(input);
	return calc(parseFloat(psar[psar.length -1]), 3);
};

const calc = (value, pricePrecision) => {
	// eslint-disable-next-line no-useless-escape
	var re = new RegExp("^-?\\d+(?:\.\\d{0," + (pricePrecision || -1) + "})?");
	return parseFloat(value.toString().match(re)[0]);
};

const getADXandMACD = async (coinPair, interval, currentCandle) => {
	let candles = await dbHelpers.getNCandleFromDB(coinPair, interval);
    
	let highArray = candles.map(item => {return parseFloat(item.high);});
	let lowArray = candles.map(item => {return parseFloat(item.low);});
	let closeArray = candles.map(item => {return parseFloat(item.close);});

	highArray.push(parseFloat(currentCandle.high));
	lowArray.push(parseFloat(currentCandle.low));
	closeArray.push(parseFloat(currentCandle.close));

	let inputADX = { close: closeArray, high: highArray, low: lowArray, period: 14 };
	let resultADX = ADX.calculate(inputADX);
	let adx = parseFloat(resultADX[resultADX.length -1].adx.toFixed(precisionDict[coinPair]["pricePrecision"]));
	let pdi = parseFloat(resultADX[resultADX.length -1].pdi.toFixed(precisionDict[coinPair]["pricePrecision"]));
	let mdi = parseFloat(resultADX[resultADX.length -1].mdi.toFixed(precisionDict[coinPair]["pricePrecision"]));

	let inputMACD = {
		values: closeArray,
		fastPeriod        : 12,
		slowPeriod        : 26,
		signalPeriod      : 9,
		SimpleMAOscillator: false,
		SimpleMASignal    : false
	};
	let resultMACD = MACD.calculate(inputMACD);
	let macd = parseFloat(resultMACD[resultMACD.length -1].MACD.toFixed(precisionDict[coinPair]["pricePrecision"]));
	let signalMACD = parseFloat(resultMACD[resultMACD.length -1].signal.toFixed(precisionDict[coinPair]["pricePrecision"]));
	let histogramMACD = parseFloat(resultMACD[resultMACD.length -1].histogram.toFixed(precisionDict[coinPair]["pricePrecision"]));

	return {adx: adx, pdi: pdi, mdi: mdi, macd: macd, signalMACD: signalMACD, histogramMACD: histogramMACD};
};

String.prototype.insert = function(index, string) {
	if (index > 0) {
		return this.substring(0, index) + string + this.substr(index);
	}
	return string + this;
};

module.exports = {
	getRSI_EMA_BB,
	getPSAR,
	getADXandMACD
};