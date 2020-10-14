# Market Maker Tools

## Arby
Arby is a market maker bot that allows to easily arbitrage between [OpenDEX](http://opendex.network/) and centralized exchanges like [Binance](https://www.binance.com). In other words, anyone with capital to spare is able to "earn interest" on their assets by running arby and providing liquidity to the OpenDEX network.

The overall goal of Arby is to pull liquidity from centralized exchanges into OpenDEX and incentivize this process financially.

### How it works
Arby looks for arbitrage opportunities on the OpenDEX network. It issues orders on OpenDEX based on the price of a connected centralized exchange, adding the configured `margin` on top. It will update the orders as soon as the price on the centralized exchange changes.

Trades on OpenDEX are settled in seconds. This allows arby to execute the counter trade on the connected centralized exchange right after an order is settled on OpenDEX. Since the order on OpenDEX was issued with an additional margin, the trade on the centralized exchange can almost always be settled for a significantly better price. The price difference between the two trades is the profit (the "interest") arby generates.

Example with real numbers:

- Balances before starting Arby

| Currency | OpenDEX | Binance |
| -------- | ------- | ------- |
| BTC      | 1.0     | 1.0     |
| USDT     | 11000   | 11000   |

- Total BTC balance between OpenDEX and Binance `1.0 + 1.0 = 2.0 BTC`
- Total USDT balance between OpenDEX and Binance `11000 + 11000 = 22000 USDT`

---
- Arby is started for BTC/USDT trading pair with 3% margin. The configured centralized exchange is Binance.
- Balance on OpenDEX is 1 BTC and 1 BTC on Binance
- USDT balance on OpenDEX is 10000 USDT and 10000 USDT on Binance
- Arby monitors the latest price of BTC/USDT on Binance. The latest price is $10000.
- Arby creates/updates the buy order on OpenDEX for `10000 - 0.03 * 10000 = $9700`.
- Arby creates/updates the sell order on OpenDEX for `10000 * 1.03 = $10300`.
- Whenever the latest price on Binance changes, Arby updates the orders on OpenDEX accordingly.

##### Scenario A
- OpenDEX buy order is filled and settled for 1 BTC ($9700).
- Arby issues a sell order on Binance for 0.97 BTC ($9700), locking in 0.03 BTC ($300) profit.
- Balances after scenario A

| Currency | OpenDEX | Binance |
| -------- | ------- | ------- |
| BTC      | 2.0     | 0.03    |
| USDT     | 1300    | 20700   |

- Total BTC balance between OpenDEX and Binance `2.0 + 0.03 = 2.03 BTC` (0.03 BTC yield)
- Total USDT balance between OpenDEX and Binance `1300 + 20700 = 22000 USDT`

---

##### Scenario B
- OpenDEX sell order is filled and settled for 1 BTC ($10300)
- Arby issues a buy order on Binance for 1.03 ($10300), locking in 0.03 BTC ($300) profit.

| Currency | OpenDEX | Binance |
| -------- | ------- | ------- |
| BTC      | 0       | 2.03    |
| USDT     | 21300   | 700     |

Total BTC balance between OpenDEX and Binance `2.0 + 0.03 = 2.03 BTC` (0.03 BTC yield)
Total USDT balance between OpenDEX and Binance `21300 + 700 = 22000 USDT`

---

### FAQ

#### Which exchanges are supported?
Currently, Binance and Kraken are supported. Bitfinex is next on the roadmap.

https://github.com/ExchangeUnion/market-maker-tools/issues/92

#### What happens if I lose connectivity to Binance?
Arby will automatically remove all orders on OpenDEX until connection is re-established.

#### What happens if the order quantity is too big to execute on Binance?
Arby will not execute trades on OpenDEX that it cannot counter-trade on Binance.

#### What happens when the order quantity is too small to execute on Binance?
Arby will automatically accumulate the traded quantity on OpenDEX and only execute an order on Binance when it is greater than or equal to the minimum amount on Binance.

#### Is it possible to configure Arby to take profits in non-BTC assets?
Support for taking profits in other assets (ETH, DAI, USDT etc.) is technically supported, but currently not enabled.

#### What about rebalancing between centralized exchange and OpenDEX balances?
Support for automatic rebalancing of the assets is planned in the upcoming releases.

### Setup instructions
Recommended way of running Arby is by following the [market maker guide](https://docs.exchangeunion.com/start-earning/market-maker-guide).

#### Development Setup
The setup guide below is **only** for development purposes. Please refer to the guide above for production use.

The development mode assumes a working [xud](https://github.com/ExchangeUnion/xud) setup with functioning swap clients for all currencies Arby is configured to use.

##### Requirements
- Node v12.18.0+

##### Install dependencies
`npm i`

##### Configuration
Copy `.env-example` to `.env`

##### Start in development mode
`npm run dev:arby`

##### Tests
`npm run test`
or
`npm run test:watch` to continuously run the tests.

### Disclaimer
This is alpha software. Please be extra careful when using this on the mainnet.
