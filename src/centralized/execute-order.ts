import BigNumber from 'bignumber.js';
import { Observable, timer } from 'rxjs';
import { mapTo, mergeMap, take, tap } from 'rxjs/operators';
import { Logger } from '../logger';
import { CEXorder } from './order-builder';

type ExecuteCEXorderParams = {
  logger: Logger;
  centralizedExchangePrice$: Observable<BigNumber>;
  order: CEXorder;
};
const executeCEXorder$ = ({
  logger,
  centralizedExchangePrice$,
  order,
}: ExecuteCEXorderParams): Observable<null> => {
  return centralizedExchangePrice$.pipe(
    take(1),
    mergeMap(price => {
      logger.info(
        `Starting centralized exchange ${order.side} order (quantity: ${
          order.quantity
        }, price: ${price.toFixed()})`
      );
      return timer(5000).pipe(
        tap(() =>
          logger.info(
            'Centralized exchange order finished. TODO(karl): order fill quantity, price and side.'
          )
        )
      );
    }),
    mapTo(null)
  );
};

export { executeCEXorder$, ExecuteCEXorderParams };
