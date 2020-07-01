import { BigNumber } from 'bignumber.js';
import { Balances, Exchange } from 'ccxt';
import { curry } from 'ramda';
import { interval, Observable } from 'rxjs';
import { map, mapTo, repeatWhen, startWith, take, tap } from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';
import { ExchangeAssetAllocation } from '../trade/info';

const logAssetAllocation = (
  logger: Logger,
  source: Observable<ExchangeAssetAllocation>
) => {
  return source.pipe(
    tap(({ baseAssetBalance, quoteAssetBalance }) => {
      logger.info(
        `Base asset balance ${baseAssetBalance.toString()} and quote asset balance ${quoteAssetBalance.toString()}`
      );
    })
  );
};

type GetCentralizedExchangeAssetsParams = {
  config: Config;
  logger: Logger;
  CEX: Observable<Exchange>;
  CEXfetchBalance$: (exchange: Observable<Exchange>) => Observable<Balances>;
  convertBalances: (
    config: Config,
    balances: Balances
  ) => ExchangeAssetAllocation;
  logAssetAllocation: (
    logger: Logger,
    source: Observable<ExchangeAssetAllocation>
  ) => Observable<ExchangeAssetAllocation>;
};

const getCentralizedExchangeAssets$ = ({
  config,
  logger,
  CEX,
  CEXfetchBalance$,
  convertBalances,
  logAssetAllocation,
}: GetCentralizedExchangeAssetsParams): Observable<ExchangeAssetAllocation> => {
  const logAssetAllocationWithLogger = curry(logAssetAllocation)(logger);
  if (config.LIVE_CEX) {
    const convertBalancesWithConfig = curry(convertBalances)(config);
    return CEXfetchBalance$(CEX).pipe(
      map(convertBalancesWithConfig),
      logAssetAllocationWithLogger,
      take(1),
      // refetch assets every 30 seconds
      repeatWhen(() => {
        return interval(30000);
      })
    );
  } else {
    const testCentralizedBalances = {
      baseAssetBalance: new BigNumber(
        config.TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE
      ),
      quoteAssetBalance: new BigNumber(
        config.TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE
      ),
    };
    return interval(30000).pipe(
      startWith(testCentralizedBalances),
      mapTo(testCentralizedBalances),
      logAssetAllocationWithLogger
    );
  }
};

export {
  getCentralizedExchangeAssets$,
  GetCentralizedExchangeAssetsParams,
  logAssetAllocation,
};
