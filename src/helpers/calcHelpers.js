const compareGreater = (a, b) => {
	let numA = parseFloat(a);
	let numB = parseFloat(b);
	if ( numA >= numB ) 
	{   
		return true;
	} else {
		return false;
	}
};

const compareLesser = (a, b) => {
	let numA = parseFloat(a);
	let numB = parseFloat(b);
	if ( numA <= numB ) {
		return true;
	} else {
		return false;
	}
};

const isLastCandlePivotHL = (Candles) => {
	let newLastCandle = Candles[0];
	let isHighPivot = 1;
	let isLowPivot = 1;
	// Compare last candle with 10 previous candles
	Candles.forEach((candle, index) => {
		if (index !== 0) {
			if (compareLesser(newLastCandle["high"], candle["high"])) {
				isHighPivot *= 0;
			}
			if (compareGreater(newLastCandle["low"], candle["low"])) {
				isLowPivot *= 0;
			}
		}
	});

	// if last candle's high is biggest ==> high pivot
	if (isHighPivot === 1) {
		newLastCandle["isPivot"] = true;
		newLastCandle["HH"] = "high";
	}

	// if last candle's low is smallest ==> low pivot
	if (isLowPivot === 1) {
		newLastCandle["isPivot"] = true;
		newLastCandle["LL"] = "low";
	}
    
	return newLastCandle;
};

const isLastCandlePivotClose = (Candles) => {
	let newLastCandle = Candles[0];
	let isHighClosePivot = 1;
	let isLowClosePivot = 1;
	// Compare last candle with 10 previous candles
	Candles.forEach((candle, index) => {
		if (index !== 0) {
			if (compareLesser(newLastCandle["close"], candle["close"])) {
				isHighClosePivot *= 0;
			}
			if (compareGreater(newLastCandle["close"], candle["close"])) {
				isLowClosePivot *= 0;
			}
		}
	});

	// if last candle's high is biggest ==> high pivot
	if (isHighClosePivot === 1) {
		newLastCandle["isPivot"] = true;
		newLastCandle["HLC"] = "high";
	}

	// if last candle's low is smallest ==> low pivot
	if (isLowClosePivot === 1) {
		newLastCandle["isPivot"] = true;
		newLastCandle["HLC"] = "low";
	}
    
	return newLastCandle;
};

const findPivotHigh = (Candles, type, n) => {
	let pivotHighArray = [];
	Candles.forEach((candle, i) => {
		if (i > n-1 && i < (Candles.length - n)) {
			let check = 1; 
			for (let j = 1; j <= n; j ++) {
				if (compareGreater(candle[type], Candles[i - j][type]) && compareGreater(candle[type], Candles[i + j][type])) {
					check = check * 1;
				}
				else {
					check = check * 0;
					break;
				}
			}
			if (check === 1) {
				candle["isPivot"] = true;
				let field;
				switch(type) {
				case "high":
					field = "HH";
					break;
				case "low":
					field = "LL";
					break;
				case "open":
					field = "HLO";
					break;
				case "close":
					field = "HLC";
					break;
				default:
					break;
				}
				candle[field] = "high";
			}
		}
		pivotHighArray.push(candle);
	});
	return pivotHighArray;
};

const findPivotLow = (Candles, type, n) => {
	let pivotLowArray = [];
	Candles.forEach((candle, i) => {
		if (i > n-1 && i < (Candles.length - n)) {
			let check = 1; 
			for (let j = 1; j <= n; j ++) {
				if (compareLesser(candle[type], Candles[i - j][type]) && compareLesser(candle[type], Candles[i + j][type])) {
					check = check * 1;
				}
				else {
					check = check * 0;
					break;
				}
			}
			if (check === 1) {
				candle["isPivot"] = true;
				let field;
				switch(type) {
				case "high":
					field = "HH";
					break;
				case "low":
					field = "LL";
					break;
				case "open":
					field = "HLO";
					break;
				case "close":
					field = "HLC";
					break;
				default:
					break;
				}
				candle[field] = "low";
			}
		}
		pivotLowArray.push(candle);
	});
	return pivotLowArray;
};

/**
 * @param {Array.<Object>} pivotList - [{candleData}, {candleData}]
 * @param {String} type - example: high for high pivot
 * @return {Array.<Object>} newPivotList removed noise pivot - example: - [{candleData}, {candleData}]
 */

const removeNoisePivotHL = (pivotList, type) => {
	let firstStack = [];
	let secondStack = [];
	let newPivotList = [];
	let field, properties, invertField, invertProperties;
	if (type === "high") {
		field = "HH";
		properties = "high";
		invertField = "LL";
		invertProperties = "low";
	} else {
		field = "LL";
		properties = "low";
		invertField = "HH";
		invertProperties = "high";
	}

	// remove noise high/low pivot
	pivotList.forEach((pivot, index) => {
		if (pivot[field] === properties) {
			if (firstStack.length === 0) {
				firstStack.push(pivot);
			} else if (firstStack.length === 1) {
				firstStack.push(pivot);
				if (secondStack.length === 0) {
					if (type === "high") {
						let isThisPivotGreater = compareGreater(firstStack[1][properties], firstStack[0][properties]);
						if (isThisPivotGreater) {
							firstStack[0][field] = false;
							firstStack[0]["isPivot"] = false;
							if ( 
								(firstStack[0]["LL"] && firstStack[0]["LL"] != "null") || 
                                    (firstStack[0]["HLO"] && firstStack[0]["HLO"] != "null") ||
                                    (firstStack[0]["HLC"] && firstStack[0]["HLC"] != "null")
							)
							{
								firstStack[0]["isPivot"] = true;
							}
							newPivotList.push(firstStack[0]);
							firstStack.shift();
						} else {
							firstStack[1][field] = false;
							firstStack[1]["isPivot"] = false;
							if ( 
								(firstStack[1]["LL"] && firstStack[1]["LL"] != "null") || 
                                    (firstStack[1]["HLO"] && firstStack[1]["HLO"] != "null") ||
                                    (firstStack[1]["HLC"] && firstStack[1]["HLC"] != "null")
							)
							{
								firstStack[1]["isPivot"] = true;
							}
							newPivotList.push(firstStack[1]);
							firstStack.pop();
						}
					} else if (type === "low") {
						let isThisPivotLesser = compareLesser(firstStack[1][properties], firstStack[0][properties]);
						if (isThisPivotLesser) {
							firstStack[0][field] = false;
							firstStack[0]["isPivot"] = false;
							if (
								(firstStack[0]["HH"] && firstStack[0]["HH"] != "null")  ||  
                                    (firstStack[0]["HLO"] && firstStack[0]["HLO"] != "null") ||
                                    (firstStack[0]["HLC"] && firstStack[0]["HLC"] != "null")
							)
							{
								firstStack[0]["isPivot"] = true;
							}
							newPivotList.push(firstStack[0]);
							firstStack.shift();
						} else {
							firstStack[1][field] = false;
							firstStack[1]["isPivot"] = false;
							if (
								(firstStack[1]["HH"] && firstStack[1]["HH"] != "null")  ||  
                                    (firstStack[1]["HLO"] && firstStack[1]["HLO"] != "null") ||
                                    (firstStack[1]["HLC"] && firstStack[1]["HLC"] != "null")
							)
							{
								firstStack[1]["isPivot"] = true;
							}
							newPivotList.push(firstStack[1]);
							firstStack.pop();
						}
					}
				} else {
					newPivotList.push(firstStack[0], secondStack[0]);
					firstStack.shift();
					secondStack = [];
				}                
			}
		} else if (pivot[invertField] === invertProperties) {
			if (secondStack.length === 0 && firstStack.length === 1) {
				secondStack.push(pivot);
			} else {
				newPivotList.push(pivot);
			}
		} else {
			newPivotList.push(pivot);
		}
		if (index === pivotList.length - 1) {
			while (firstStack.length !== 0) {
				newPivotList.push(firstStack[0]);
				firstStack.shift();
			} 
			while (secondStack.length !== 0) {
				newPivotList.push(secondStack[0]);
				secondStack.shift();
			}
		}
	});
	// return newPivotList.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
	// return newPivotList;
	return newPivotList.sort((a,b) => {
		var c = new Date(a["time"]);
		var d = new Date(b["time"]);
		return c-d;
	});
};

/**
 * @param {Array.<Object>} pivotList - [{candleData}, {candleData}]
 * @param {String} type - example: open for open pivot
 * @param {String} level - example: high for pivot high => remove noise open pivot high
 * @param {String} invertLevel - example: low for pivot low => use this to check is the high pivot noise?
 * @return {Array.<Object>} newPivotList removed noise pivot - example: - [{candleData}, {candleData}]
 */

const removeNoisePivotOC = (pivotList, type, level, invertLevel) => {
	let firstStack = [];
	let secondStack = [];
	let newPivotList = [];
	let field, properties;
	if (type === "open") {
		field = "HLO";
		properties = "open";
	} else if (type === "close") {
		field = "HLC";
		properties = "close";
	}
	pivotList.forEach((pivot, index) => {
		if (pivot[field] && pivot[field] === level) {
			if (firstStack.length === 0) {
				firstStack.push(pivot);
			} else if (firstStack.length === 1) {
				firstStack.push(pivot);
				if (secondStack.length === 0) {
					if (level === "high") {
						let isThisPivotGreater = compareGreater(firstStack[1][properties], firstStack[0][properties]);
						if (isThisPivotGreater) {
							firstStack[0][field] = false;
							firstStack[0]["isPivot"] = false;
							if (
								(firstStack[0]["HH"] && firstStack[0]["HH"] != "null")  || 
                                    (firstStack[0]["LL"] && firstStack[0]["LL"] != "null") || 
                                    (firstStack[0]["HLO"] && firstStack[0]["HLO"] != "null") ||
                                    (firstStack[0]["HLC"] && firstStack[0]["HLC"] != "null")
							)
							{
								firstStack[0]["isPivot"] = true;
							}
							newPivotList.push(firstStack[0]);
							firstStack.shift();
						} else {
							firstStack[1][field] = false;
							firstStack[1]["isPivot"] = false;
							if (
								(firstStack[1]["HH"] && firstStack[1]["HH"] != "null")  || 
                                    (firstStack[1]["LL"] && firstStack[1]["LL"] != "null") || 
                                    (firstStack[1]["HLO"] && firstStack[1]["HLO"] != "null") ||
                                    (firstStack[1]["HLC"] && firstStack[1]["HLC"] != "null")
							)
							{
								firstStack[1]["isPivot"] = true;
							}
							newPivotList.push(firstStack[1]);
							firstStack.pop();
						}
					} else if (level === "low") {
						let isThisPivotLesser = compareLesser(firstStack[1][properties], firstStack[0][properties]);
						if (isThisPivotLesser) {
							firstStack[0][field] = false;
							firstStack[0]["isPivot"] = false;
							if (
								(firstStack[0]["HH"] && firstStack[0]["HH"] != "null")  || 
                                    (firstStack[0]["LL"] && firstStack[0]["LL"] != "null") || 
                                    (firstStack[0]["HLO"] && firstStack[0]["HLO"] != "null") ||
                                    (firstStack[0]["HLC"] && firstStack[0]["HLC"] != "null")
							)
							{
								firstStack[0]["isPivot"] = true;
							}
							newPivotList.push(firstStack[0]);
							firstStack.shift();
						} else {
							firstStack[1][field] = false;
							firstStack[1]["isPivot"] = false;
							if (
								(firstStack[1]["HH"] && firstStack[1]["HH"] != "null")  || 
                                    (firstStack[1]["LL"] && firstStack[1]["LL"] != "null") || 
                                    (firstStack[1]["HLO"] && firstStack[1]["HLO"] != "null") ||
                                    (firstStack[1]["HLC"] && firstStack[1]["HLC"] != "null")
							)
							{
								firstStack[1]["isPivot"] = true;
							}
							newPivotList.push(firstStack[1]);
							firstStack.pop();
						}
					}
				} else {
					newPivotList.push(firstStack[0], secondStack[0]);
					firstStack.shift();
					secondStack = [];
				}                
			}
		} else if (pivot[field] === invertLevel) {
			if (secondStack.length === 0 && firstStack.length === 1) {
				secondStack.push(pivot);
			} else {
				newPivotList.push(pivot);
			}
		} else {
			newPivotList.push(pivot);
		}

		if (index === pivotList.length - 1) {
			while (firstStack.length !== 0) {
				newPivotList.push(firstStack[0]);
				firstStack.shift();
			} 
			while (secondStack.length !== 0) {
				newPivotList.push(secondStack[0]);
				secondStack.shift();
			}
		}
	});
	// return newPivotList.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
	// return newPivotList;
	return newPivotList.sort((a,b) => {
		var c = new Date(a["time"]);
		var d = new Date(b["time"]);
		return c-d;
	});
};

module.exports = {
	compareGreater,
	compareLesser,
	findPivotHigh,
	findPivotLow,
	removeNoisePivotHL,
	removeNoisePivotOC,
	isLastCandlePivotHL,
	isLastCandlePivotClose,
};
