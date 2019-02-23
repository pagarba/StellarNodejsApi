const express = require('express')
const StellarBase = require('stellar-base')
const StellarSdk = require('stellar-sdk')
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')
const source = StellarSdk.Keypair.random()
const bodyParser = require('body-parser')
const request = require('request')

StellarSdk.Network.useTestNetwork()

let app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(express.json())

app.get('/', (req, res) => {
	res.send('hello world!')
})

// creates account
app.get('/createaccount', (req, res) => {
	const publicKey = source.publicKey()
	const secret = source.secret()

	request.get({
		url: 'https://friendbot.stellar.org',
		qs: {
			addr: publicKey
		},
		json: true
	}, (error, response, body) => {
		if (error || response.statusCode !== 200) {
			console.error('ERROR!', error || body)
		} else {
			console.log('SUCCESS! You have a new account :)\n', body)
			return body
		}
	})

		// server.loadAccount(publicKey).then((account) => {
		// 	console.log(`Balances for account: ${account} ` + publicKey)
		// 	account.balances.forEach((balance) => {
		// 		console.log('Type:', balance.asset_type, ', Balance:', balance.balance)
		// 	})
		// }).catch((e) => console.log(e))
	
	
	console.log(publicKey)
	console.log(secret)
})

app.post('/transaction', (req, res) => {
	const public = req.body.public
	const secret = req.body.secret
	const destination = req.body.destination
	const memoText = req.body.text
	const memo = StellarBase.Memo.text(memoText)

	server.accounts()
		.accountId(public)
		.call()
		.then(({
			sequence
		}) => {
			const account = new StellarSdk.Account(public, sequence)
			const transaction = new StellarSdk.TransactionBuilder(account, {
					memo: memo,
					fee: StellarSdk.BASE_FEE
				})
				.addOperation(StellarBase.Operation.payment({
					destination: destination,
					asset: StellarBase.Asset.native(),
					amount: '100.50'
				}))
				.setTimeout(1000)
				.build()
			transaction.sign(StellarSdk.Keypair.fromSecret(secret))
			return server.submitTransaction(transaction)
		})
		.then(results => {
			console.log('Transaction', results._links.transaction.href)
		})
})

app.listen(3500)
