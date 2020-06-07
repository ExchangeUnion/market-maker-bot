# ExchangeBroker

The exchange module is responsible for all the interactions between the system and its configured exchanges.

```
const binanceBroker = new ExchangeBroker({
  exchange: 'Binance',
  apiKey: 'abc',
  apiSecret: '123',
});
const openDexBroker = new ExchangeBroker({
  exchange: 'OpenDEX',
  certPath: '/home/xud/xud.cert',
  rpchost: 'localhost',
  rpcport: 8886,
});
```

## Basic information

### Price stream

Get the current tradingpair's price stream

```
const btcUsdPriceStream = broker.getPrice('BTCUSDT');
btcUsdPriceStream.on('price', handlePriceChange);
```

### Asset allocation

```
const ownedAssets = broker.getAssets();
->
{
  assets: [
    { asset: DAI, free: 10000, locked: 100 },
    { symbol: ETH, free: 0.1, locked: 0.1 },
    { symbol: BTC, free: 1, locked: 0.5 },
  ],
}
```

## Orders

The system should support entering basic orders (market and limit) to the orderbook automatically. Orders should also be revocable. The system should be designed in a way that allows for advanced order types to be added in the future.

### Creating an order

#### Market

```
const order = broker.newOrder({
  baseAsset: 'DAI',
  quoteAsset: 'BTC',
  orderType: 'MARKET',
  orderSide: 'BUY',
  quantity: 10000,
});
```

#### Limit

```
const order = broker.newOrder({
  baseAsset: 'DAI',
  quoteAsset: 'BTC',
  orderType: 'LIMIT',
  orderSide: 'BUY',
  quantity: 10000,
  price: 5000,
});
```

#### Stop-Limit

```
const order = broker.newOrder({
  baseAsset: 'DAI',
  quoteAsset: 'BTC',
  orderType: 'STOP-LIMIT',
  orderSide: 'BUY',
  quantity: 10000,
  price: 5000,
  stopPrice: 5500,
});
```

#### Events

```
order.on('failure', e => console.log('failure', e));
order.on('fill', fill => console.log('fill', fill));
order.on('complete', summary => console.log('complete', summary));
order.on('status', newStatus => console.log('status', newStatus));
```

### Start the order

Once the order has been created and event listeners attached

```
order.start();
```

### Cancel the order

```
order.cancel();
```
