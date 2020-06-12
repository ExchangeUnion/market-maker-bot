# Market Maker Tools

## Arby
A market making bot that allows its users to easily arbitrage between OpenDEX and centralized exchanges.

Arby looks for arbitrage opportunities on the OpenDEX network. It will enter active orders with the configured margin to the orderbook and updates them as soon as the price changes.

### Setup instructions

#### Requirements
- Node v12.18.0

#### Install dependencies
`npm i`

#### Configuration
Copy `.env-example` to `.env`

#### Start in development mode
`npm run dev:arby`

#### Tests
`npm run test`
or
`npm run test:watch` to continuously run the tests.

### Disclaimer
This is alpha software. Please be extra careful when using this on mainnet.
