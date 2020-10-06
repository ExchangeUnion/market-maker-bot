import BigNumber from 'bignumber.js';
import { Observable, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, share } from 'rxjs/operators';
import WebSocket from 'ws';
import { errors } from '../opendex/errors';
import { GetPriceParams } from './exchange-price';

const getKrakenPrice$ = ({
  config,
  logger,
}: GetPriceParams): Observable<BigNumber> => {
  const priceObservable: Observable<BigNumber> = new Observable(observer => {
    const tradingPair = `${config.CEX_BASEASSET}/${config.CEX_QUOTEASSET}`;
    const url = 'wss://ws.kraken.com';
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
    socket.on('open', () => {
      const subscribeTrade = {
        event: 'subscribe',
        pair: [tradingPair],
        subscription: {
          name: 'trade',
        },
      };
      socket.send(JSON.stringify(subscribeTrade));
      heartbeat();
    });
    let channelID = -1;
    socket.onmessage = (event: WebSocket.MessageEvent) => {
      const eventData = JSON.parse(event.data.toString());
      if (eventData.channelID) {
        channelID = eventData.channelID;
      }
      if (eventData[0] === channelID) {
        const priceString = eventData[1][0][0];
        const price = new BigNumber(priceString);
        observer.next(price);
      }
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

export { getKrakenPrice$ };
