import { BigNumber } from 'bignumber.js';
import { interval, Observable } from 'rxjs';
import { exhaustMap, mapTo, takeUntil, tap } from 'rxjs/operators';
import { getCentralizedExchangePrice$ } from '../centralized/exchange-price';
import { Config } from '../config';
import { Loggers } from '../logger';
import { GetTradeInfoParams, tradeInfoArrayToObject } from '../trade/info';
import { TradeInfo } from '../trade/manager';
import { getOpenDEXassets$ } from './assets';
import { logAssetBalance, parseOpenDEXassets } from './assets-utils';
import { CreateOpenDEXordersParams } from './create-orders';
import { GetOpenDEXorderFilledParams } from './order-filled';
import { tradeInfoToOpenDEXorders } from './orders';
import { removeOpenDEXorders$ } from './remove-orders';
import { getXudBalance$ } from './xud/balance';
import { getXudClient$ } from './xud/client';
import { createXudOrder$ } from './xud/create-order';
import { getXudTradingLimits$ } from './xud/trading-limits';
import { subscribeXudSwaps$ } from './xud/subscribe-swaps';
import { SwapSuccess } from 'src/broker/opendex/proto/xudrpc_pb';

type GetOpenDEXcompleteParams = {
  config: Config;
  loggers: Loggers;
  tradeInfo$: ({
    config,
    openDexAssets$,
    centralizedExchangeAssets$,
    centralizedExchangePrice$,
  }: GetTradeInfoParams) => Observable<TradeInfo>;
  createOpenDEXorders$: ({
    config,
    logger,
    getTradeInfo,
    tradeInfoToOpenDEXorders,
    getXudClient$,
    createXudOrder$,
  }: CreateOpenDEXordersParams) => Observable<boolean>;
  openDEXorderFilled$: ({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  }: GetOpenDEXorderFilledParams) => Observable<SwapSuccess>;
};

const getOpenDEXcomplete$ = ({
  config,
  loggers,
  tradeInfo$,
  createOpenDEXorders$,
  openDEXorderFilled$,
}: GetOpenDEXcompleteParams): Observable<boolean> => {
  const openDEXassetsWithConfig = (config: Config) => {
    return getOpenDEXassets$({
      config,
      logger: loggers.opendex,
      parseOpenDEXassets,
      logBalance: logAssetBalance,
      xudClient$: getXudClient$,
      xudBalance$: getXudBalance$,
      xudTradingLimits$: getXudTradingLimits$,
    });
  };
  // Mock centralized exchange assets for testing
  const getCentralizedExchangeAssets$ = (config: Config) => {
    return interval(1000).pipe(
      mapTo({
        baseAssetBalance: new BigNumber('123'),
        quoteAssetBalance: new BigNumber('321'),
      })
    );
  };
  return tradeInfo$({
    config,
    loggers,
    tradeInfoArrayToObject,
    openDexAssets$: openDEXassetsWithConfig,
    centralizedExchangeAssets$: getCentralizedExchangeAssets$,
    centralizedExchangePrice$: getCentralizedExchangePrice$,
  }).pipe(
    // ignore new trade information when creating orders
    // is already in progress
    exhaustMap((tradeInfo: TradeInfo) => {
      const getTradeInfo = () => {
        return tradeInfo;
      };
      // create orders based on latest trade info
      return createOpenDEXorders$({
        config,
        logger: loggers.opendex,
        getTradeInfo,
        getXudClient$,
        createXudOrder$,
        removeOpenDEXorders$,
        tradeInfoToOpenDEXorders,
      });
    }),
    // wait for the order to be filled
    takeUntil(
      openDEXorderFilled$({
        config,
        getXudClient$,
        subscribeXudSwaps$,
      }).pipe(tap(() => loggers.opendex.info('OpenDEX order has been filled.')))
    )
  );
};

export { getOpenDEXcomplete$, GetOpenDEXcompleteParams };
