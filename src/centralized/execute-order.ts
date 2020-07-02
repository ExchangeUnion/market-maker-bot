import BigNumber from 'bignumber.js';
import { Observable, of, timer } from 'rxjs';
import { mapTo, mergeMap, tap } from 'rxjs/operators';
import { Logger } from '../logger';
import { CEXorder } from './order-builder';
import { Config } from '../config';

type ExecuteCEXorderParams = {
  config: Config;
  logger: Logger;
  price: BigNumber;
  order: CEXorder;
};

const executeCEXorder$ = ({
  config,
  logger,
  price,
  order,
}: ExecuteCEXorderParams): Observable<null> => {
  return of(price).pipe(
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
