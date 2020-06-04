import { TestScheduler } from 'rxjs/testing';
import {
  getOpenDEXassets$,
  xudBalanceToExchangeAssetAllocation,
  logAssetBalance,
} from './opendex';
import { Observable } from 'rxjs';
import { GetBalanceResponse } from '../broker/opendex/proto/xudrpc_pb';
import { BigNumber } from 'bignumber.js';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import { testConfig, getLoggers } from '../../test/utils';
import { Logger } from '../logger';

describe('OpenDEX', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  test('xudBalanceToExchangeAssetAllocation', () => {
    const ethBalance = {
      getChannelBalance: () => 10000000
    };
    const btcBalance = {
      getChannelBalance: () => 20000000
    };
    const balancesMap = new Map();
    const baseAsset = 'ETH';
    const quoteAsset = 'BTC';
    balancesMap.set(baseAsset, ethBalance);
    balancesMap.set(quoteAsset, btcBalance);
    const getBalanceResponse = {
      getBalancesMap: () => balancesMap,
    } as unknown as GetBalanceResponse;
    expect(
      xudBalanceToExchangeAssetAllocation({
        baseAsset,
        quoteAsset,
        balanceResponse: getBalanceResponse,
      })
    ).toEqual({
      baseAssetBalance:
        new BigNumber(ethBalance.getChannelBalance()),
      quoteAssetBalance:
        new BigNumber(btcBalance.getChannelBalance()),
    });
  });

  test('xudBalanceToExchangeAssetAllocation error baseAssetBalance', () => {
    const balancesMap = new Map();
    const getBalanceResponse = {
      getBalancesMap: () => balancesMap,
    } as unknown as GetBalanceResponse;
    expect(() => {
      xudBalanceToExchangeAssetAllocation({
        baseAsset: 'ETH',
        quoteAsset: 'BTC',
        balanceResponse: getBalanceResponse,
      })
    }).toThrowErrorMatchingSnapshot();
  });

  test('getOpenDexAssets$', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const inputEvents = {
        xudBalance$:   '500ms a',
        xudClient$:    '500ms a',
      };
      const expected = '1s (a|)'
      const xudBalanceToExchangeAssetAllocation =
        ({ balanceResponse }: any) => balanceResponse;
      const getXudBalance$ = () => {
        return cold(inputEvents.xudBalance$) as unknown as Observable<GetBalanceResponse>;
      };
      const getXudClient$ = () => {
        return cold(inputEvents.xudClient$) as unknown as Observable<XudClient>;
      };
      const logBalance = () => {};
      const openDEXassets$ = getOpenDEXassets$({
        logBalance,
        config: testConfig(),
        logger: getLoggers().global,
        xudClient$: getXudClient$,
        xudBalance$: getXudBalance$,
        xudBalanceToExchangeAssetAllocation,
      });
      expectObservable(openDEXassets$).toBe(expected);
    });
  });

  describe('logAssetBalance', () => {
    const logger = getLoggers().global as unknown as Logger;
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
