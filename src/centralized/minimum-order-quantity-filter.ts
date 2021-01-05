import { BigNumber } from 'bignumber.js';
import { curry } from 'ramda';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap, take } from 'rxjs/operators';
import { Logger } from '../logger';
import { ArbyStore } from '../store';

const quantityAboveMinimum = curry(
  (
    store: ArbyStore,
    logger: Logger,
    assetToTradeOnCEX: string,
    minimumQuantity$: Observable<BigNumber>,
    quantity: BigNumber
  ) => {
    logger.info(
      `Swap success. Accumulated ${assetToTradeOnCEX} quantity: ${quantity.toFixed()}`
    );
    store.resetLastOrderUpdatePrice();
    return minimumQuantity$.pipe(
      take(1),
      mergeMap(minimumQuantity => {
        if (quantity.isGreaterThanOrEqualTo(minimumQuantity)) {
          return of(quantity);
        }
        logger.info(
          `Will not execute CEX order because ${quantity.toFixed()} is below the minimum allowed CEX quantity ${minimumQuantity.toFixed()}`
        );
        return EMPTY;
      })
    );
  }
);

export { quantityAboveMinimum };
