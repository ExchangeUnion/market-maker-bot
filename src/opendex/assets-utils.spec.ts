import { BigNumber } from 'bignumber.js';
import { getLoggers } from '../../test/utils';
import { GetBalanceResponse } from '../broker/opendex/proto/xudrpc_pb';
import { Logger } from '../logger';
import { satsToCoinsStr } from '../utils';
import { logAssetBalance, getOpenDEXtradableAssets } from './assets-utils';

describe('OpenDEX.assets-utils', () => {
  test('getOpenDEXtradableAssets success', () => {
    const ethBalance = {
      getChannelBalance: () => 10000000,
    };
    const btcBalance = {
      getChannelBalance: () => 20000000,
    };
    const balancesMap = new Map();
    const baseAsset = 'ETH';
    const quoteAsset = 'BTC';
    balancesMap.set(baseAsset, ethBalance);
    balancesMap.set(quoteAsset, btcBalance);
    const getBalanceResponse = ({
      getBalancesMap: () => balancesMap,
    } as unknown) as GetBalanceResponse;
    expect(
      getOpenDEXtradableAssets({
        baseAsset,
        quoteAsset,
        balanceResponse: getBalanceResponse,
      })
    ).toEqual({
      baseAssetBalance: new BigNumber(
        satsToCoinsStr(ethBalance.getChannelBalance())
      ),
      quoteAssetBalance: new BigNumber(
        satsToCoinsStr(btcBalance.getChannelBalance())
      ),
    });
  });

  test('error baseAssetBalance', () => {
    const balancesMap = new Map();
    const getBalanceResponse = ({
      getBalancesMap: () => balancesMap,
    } as unknown) as GetBalanceResponse;
    expect(() => {
      getOpenDEXtradableAssets({
        baseAsset: 'ETH',
        quoteAsset: 'BTC',
        balanceResponse: getBalanceResponse,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test('logAssetBalance', () => {
    const logger = (getLoggers().global as unknown) as Logger;
    logger.trace = jest.fn();
    const baseAssetBalance = '1.23456789';
    const quoteAssetBalance = '9.87654321';
    const assetBalance = {
      baseAssetBalance: new BigNumber(baseAssetBalance),
      quoteAssetBalance: new BigNumber(quoteAssetBalance),
    };
    logAssetBalance({
      logger,
      assetBalance,
    });
    expect(logger.trace).toHaveBeenCalledTimes(1);
    expect(logger.trace).toHaveBeenCalledWith(
      expect.stringContaining(baseAssetBalance)
    );
    expect(logger.trace).toHaveBeenCalledWith(
      expect.stringContaining(quoteAssetBalance)
    );
  });
});
