# Setup instructions

## Requirements
- Node v12.16.0

## Install dependencies
`npm i`

## Configuration
Rename `.env-example-balancer` to `.env`. `.env` file is under git ignore and won't be commited to the repository. `DATA_DIR` is the path where Balancer stores its data.

## Start in development mode
`npm run dev:balancer`

## Tests
`npm run test`
or
`npm run test:watch` to continuously run the tests.
