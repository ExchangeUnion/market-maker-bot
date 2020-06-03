import { TestScheduler } from 'rxjs/testing';
import {
  getOpenDEXassets$,
  xudBalanceToExchangeAssetAllocation,
} from './opendex';
import { Observable } from 'rxjs';
import { GetBalanceResponse } from '../broker/opendex/proto/xudrpc_pb';
import { BigNumber } from 'bignumber.js';

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

  test('getOpenDexAssets$', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const inputEvents = {
        xudBalance$:   '1s a',
      };
      const expected = '1s (a|)'
      const xudBalanceToExchangeAssetAllocation =
        ({ balanceResponse }: any) => balanceResponse;
      const xudBalance$ = cold(inputEvents.xudBalance$) as unknown as Observable<GetBalanceResponse>;
      const openDEXassets$ = getOpenDEXassets$({
        xudBalance$,
        xudBalanceToExchangeAssetAllocation,
        quoteAsset: 'ETH',
        baseAsset: 'BTC',
      });
      expectObservable(openDEXassets$).toBe(expected);
    });
  });

});
