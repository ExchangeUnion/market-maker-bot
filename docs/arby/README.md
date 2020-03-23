# Arby
Arby looks for arbitrage opportunities on the OpenDEX network. Once a profitable trade appears it will automatically attempt to enter it. It will also enter active orders to the orderbook and updates them every 1 minute by default.

Currently, it is possible to use Arby for arbitrage trades between OpenDEX and Binance for LTCBTC trading pair. The system is designed in a way that allows more exchanges and trading pairs to be added in the future.

[Setup Guide](./setup.md)

## How does it work?
Below you'll find a flowchart that attempts to describe Arby's logic in as much as detail as possible:
![Arby's Logic](./logic-dia.png)
