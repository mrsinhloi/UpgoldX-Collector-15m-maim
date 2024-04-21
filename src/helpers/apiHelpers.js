const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));

const sendSignalData = async (candle, interval) => {
	//let url = "http://metax-system-socket-1:3000/onCloseCandle";
	let url = "http://socket.metaxtrading.com/onCloseCandle"; 

	console.log("Sending candle...");
	console.log(candle);
	let signal = fetch(
		url,
		// `http://localhost:3001/signal-processing`,
		{
			method: "POST",
			body: JSON.stringify({
				candle: candle,
				interval: interval
			}),
			headers: { "Content-type": "application/json" },
		},
        
	)
		.then((res) => res.json())
		.then(json => {return json;})
		.catch(err => {
			console.log(err);
			return err;
		});
	return Promise.all([signal])
		.then(([signal]) => {
			if (signal["code"] !== 200) {
				console.log(signal["status"]);
			}
			return signal;
		});
};
module.exports = {
	sendSignalData,
};