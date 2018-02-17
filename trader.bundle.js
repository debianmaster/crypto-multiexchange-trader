'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _binanceApiNode = require('binance-api-node');

var _binanceApiNode2 = _interopRequireDefault(_binanceApiNode);

var _hitbtcApi = require('hitbtc-api');

var _hitbtcApi2 = _interopRequireDefault(_hitbtcApi);

var _cryptopia = require('cryptopia');

var _cryptopia2 = _interopRequireDefault(_cryptopia);

var _gate = require('gate.io');

var _gate2 = _interopRequireDefault(_gate);

var _util = require('util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var request = require('request-json');
require('dotenv').load();
var httpClient = request.createClient('https://api.coinmarketcap.com');
var express = require('express');
var app = express();
var cors = require('cors');
app.use(cors());

var async = require("async");

var Trader = function () {
	function Trader(bin_creds, hitbtc_creds, cryptopia_creds, gateio_creds) {
		_classCallCheck(this, Trader);

		this.coins = [];
		this.hitbtc = new _hitbtcApi2.default({ key: hitbtc_creds.key, secret: hitbtc_creds.secret, isDemo: false });
		this.bin = (0, _binanceApiNode2.default)({
			apiKey: bin_creds.key,
			apiSecret: bin_creds.secret
		});
		this.gateio = new _gate2.default(gateio_creds.key, gateio_creds.secret);
		this.cryptopia = new _cryptopia2.default(cryptopia_creds.key, cryptopia_creds.secret);
	}

	_createClass(Trader, [{
		key: 'getBalances',
		value: function getBalances(cb) {
			var self = this;
			async.parallel([
			//binance
			function (callback) {
				self.bin.accountInfo().then(function (accountInfo) {
					var balances = accountInfo.balances;
					var coins = [];
					balances.forEach(function (balance) {
						if (balance.free > 0 || balance.locked > 0) {
							coins[balance.asset] = {
								asset: balance.asset,
								free: balance['free'],
								locked: balance.locked,
								qty: balance['free'] + balance['locked'],
								exchange: 'binance'
							};
						}
					});
					//console.log("binance",coins);
					callback(null, coins);
				}).catch(function (err) {
					console.log(err);
					callback(err, null);
				});
			},
			//hitbtc
			function (callback) {
				self.hitbtc.getMyBalance().then(function (balances) {
					balances = balances['balance'];
					var coins = [];
					Object.keys(balances).forEach(function (key) {
						if (balances[key].cash > 0 || balances[key].reserved > 0) {
							coins[key] = {
								asset: key,
								free: balances[key].cash,
								locked: balances[key].reserved,
								qty: balances[key].cash + balances[key].reserved,
								exchange: 'hitbtc'
							};
						}
					});
					//console.log("hitbtc",coins);
					callback(null, coins);
				}).catch(function (err) {
					callback(err, null);
				});
			},
			//Cryptopia
			function (callback) {
				self.cryptopia.getBalance(function (err, balances) {
					if (err) {
						callback(err, null);
					}
					balances = balances.Data;
					var coins = [];
					balances.forEach(function (balance) {
						if (balance.Available > 0 || balance.HeldForTrades > 0) {
							coins[balance.Symbol] = {
								asset: balance.Symbol,
								free: balance.Available,
								locked: balance.Unconfirmed,
								qty: balance.Total,
								exchange: 'cryptopia'
							};
						}
					});
					//console.log("crypto",coins);
					callback(null, coins);
				}, {});
			},
			//gate.io
			function (callback) {
				self.gateio.getBalances(function (err, res, balances) {
					if (!(0, _util.isNull)(err)) {
						callback(err, null);
						return false;
					}
					var coins = [];
					balances = JSON.parse(balances);
					balances = balances.available;
					Object.keys(balances).forEach(function (key, val) {
						coins[key] = {
							asset: key,
							free: val,
							locked: 0,
							qty: val,
							exchange: 'gateio'
						};
					});
					//console.log("gate",coins);
					callback(null, coins);
				});
			}], function (err, results) {
				if (err) {
					console.log(err);
					cb([]);
					return false;
				}
				var finalCoins = new Object();
				results.forEach(function (res) {
					Object.keys(res).forEach(function (key) {
						if (undefined !== finalCoins[key]) finalCoins[key].qty += res[key].qty;

						finalCoins[key] = res[key];
					});
				});
				cb(finalCoins);
			});
		}
	}]);

	return Trader;
}();

var Exchange = function Exchange(key, secret) {
	_classCallCheck(this, Exchange);

	this.key = key;
	this.secret = secret;
};

var hitbtc_creds = new Exchange(process.env.hitbtc_key, process.env.hitbtc_secret);
var binance_creds = new Exchange(process.env.binance_key, process.env.binance_secret);
var cryptopia_creds = new Exchange(process.env.cryptopia_key, process.env.cryptopia_secret);
var gateio_creds = new Exchange(process.env.gateio_key, process.env.gateio_secret);

var trader = new Trader(binance_creds, hitbtc_creds, cryptopia_creds, gateio_creds);

app.use('/', express.static('public'));

app.get('/api', function (request, response) {
	trader.getBalances(function (balances) {
		//console.log(balances);
		httpClient.get('/v1/ticker/?limit=10000', function (err, res, body) {
			var coins = [];
			body.forEach(function (ticker) {
				//console.log(balances[ticker['symbol']]);
				if (undefined !== balances[ticker['symbol']]) {
					var qty = parseFloat(balances[ticker['symbol']].qty).toFixed(4);
					var bal = balances[ticker['symbol']];
					ticker['qty'] = qty;
					ticker['exchange'] = bal.exchange;
					ticker['total_usd'] = qty * parseFloat(ticker.price_usd).toFixed(4);
					ticker['total_btc'] = qty * parseFloat(ticker.price_btc).toFixed(4);
					coins.push(ticker);
				}
			});
			response.json(coins);
		});
	});
});

app.listen(8080);
