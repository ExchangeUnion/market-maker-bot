import BigNumber from 'bignumber.js';
import { Observable, throwError } from 'rxjs';
import { catchError, share, distinctUntilChanged } from 'rxjs/operators';
import WebSocket from 'ws';
import { errors } from '../opendex/errors';
import { GetPriceParams } from './exchange-price';

const getBinancePrice$ = ({
  config,
  logger,
}: GetPriceParams): Observable<BigNumber> => {
  const priceObservable: Observable<BigNumber> = new Observable(observer => {
    const tradingPair = `${config.CEX_BASEASSET}${config.CEX_QUOTEASSET}`;
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
    catchError(() => {
      return throwError(errors.CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR);
    }),
    distinctUntilChanged((a, b) => a.isEqualTo(b)),
    share()
  );
};

export { getBinancePrice$ };
