# Setup instructions

## Requirements
- Node v12.16.0

## Install dependencies
`npm i`

## Configuration
Enter your `BINANCE_API_KEY` and `BINANCE_API_SECRET` to `.env-example-arby` and rename the file to `.env`. `.env` file is under git ignore and won't be commited to the repository. `DATA_DIR` is the path where Arby stores its data.

By default Arby uses the test endpoint for creating new orders on Binance. To enable trading with real money you'll also need to include `LIVE_TRADING=true` to `.env`.

`MARGIN` is the percentage markup added to OpenDEX orderds.

## Start in development mode
`npm run dev:arby`

## Tests
`npm run test`
or
`npm run test:watch` to continuously run the tests.
