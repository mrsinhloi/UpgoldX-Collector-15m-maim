const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
const token = process.env.TOKEN;
const domain = process.env.DOMAIN;
const accountId = process.env.ACCOUNT_ID;

const MetaApi = require("metaapi.cloud-sdk").default;
const api = new MetaApi(token);


const createAccount = async () => {
	const account = await api.metatraderAccountApi.getAccount(accountId);

	const initialState = account.state;
	const deployedStates = ["DEPLOYING", "DEPLOYED"];

	if(!deployedStates.includes(initialState)) {
		// wait until account is deployed and connected to broker
		console.log("Deploying account");
		await account.deploy();
	}
	console.log("Waiting for API server to connect to broker (may take couple of minutes)");
	await account.waitConnected();

	return account;
};

module.exports = {
	createAccount,
};