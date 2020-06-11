import BigNumber from 'bignumber.js';
import { Observable, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import WebSocket from 'ws';
import { Config } from '../config';
import { Logger } from '../logger';
import { errors } from '../opendex/errors';

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
      logger.trace(`${tradingPair} established connection to ${url}`);
    };
    socket.on('error', e => {
      observer.error(e);
    });
    const heartbeat = () => {
      logger.trace(`heartbeat from ${tradingPair} socket`);
    };
    socket.onclose = (event: WebSocket.CloseEvent) => {
      if (event.reason) {
        logger.trace(
          `${tradingPair} stream closed with reason: ${event.reason}`
        );
      } else {
        logger.trace(`${tradingPair} stream closed`);
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
    timeout(20000),
    catchError(e => {
      return throwError(errors.CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR);
    })
  );
};

export { getCentralizedExchangePrice$, CentralizedExchangePriceParams };
