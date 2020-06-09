import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import WebSocket from 'ws';
import { Config } from '../config';
import { Logger } from '../logger';

type CentralizedExchangePriceParams = {
  config: Config;
  logger: Logger;
};

const getCentralizedExchangePrice$ = ({
  config,
  logger,
}: CentralizedExchangePriceParams): Observable<BigNumber> => {
  const priceObservable: Observable<BigNumber> = new Observable(observer => {
    const tradingPair = `${config.BASEASSET}${config.QUOTEASSET}`;
    const url = `wss://stream.binance.com:9443/ws/${tradingPair.toLowerCase()}@aggTrade`;
    const socket = new WebSocket(url);
    socket.onopen = () => {
      logger.info(`${tradingPair} established connection to ${url}`);
    };
    socket.on('error', e => {
      logger.error(`error from the socket ${e}`);
    });
    const heartbeat = () => {
      logger.info(`heartbeat from ${tradingPair} socket`);
    };
    socket.onclose = (event: WebSocket.CloseEvent) => {
      if (event.reason) {
        logger.info(
          `${tradingPair} stream closed with reason: ${event.reason}`
        );
      } else {
        logger.info(`${tradingPair} stream closed`);
      }
    };
    socket.on('ping', heartbeat);
    socket.on('open', heartbeat);
    socket.onmessage = (event: WebSocket.MessageEvent) => {
      const aggTrade = JSON.parse(event.data.toString());
      const { p: priceString } = aggTrade;
      const price = new BigNumber(priceString);
      observer.next(price);
    };
    return () => {
      socket.terminate();
    };
  });
  return priceObservable.pipe(
    // if we have not received a price value in 20 seconds we'll error
    timeout(20000)
  );
};

export { getCentralizedExchangePrice$, CentralizedExchangePriceParams };
