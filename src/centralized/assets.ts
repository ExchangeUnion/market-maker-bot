import { BigNumber } from 'bignumber.js';
import { interval } from 'rxjs';
import { mapTo, startWith, tap } from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';

type GetCentralizedExchangeAssetsParams = {
  config: Config;
  logger: Logger;
};
// Mock centralized exchange assets for testing
const getCentralizedExchangeAssets$ = ({
  config,
  logger,
}: GetCentralizedExchangeAssetsParams) => {
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
    tap(({ baseAssetBalance, quoteAssetBalance }) => {
      logger.info(
        `Base asset balance ${baseAssetBalance.toString()} and quote asset balance ${quoteAssetBalance.toString()}`
      );
    })
  );
};

export { getCentralizedExchangeAssets$, GetCentralizedExchangeAssetsParams };
