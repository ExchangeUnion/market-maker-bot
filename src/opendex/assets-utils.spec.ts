import { BigNumber } from 'bignumber.js';
import { Logger } from '../logger';
import { GetBalanceResponse, TradingLimitsResponse } from '../proto/xudrpc_pb';
import { getLoggers, testConfig } from '../test-utils';
import { satsToCoinsStr } from '../utils';
import { logAssetBalance, parseOpenDEXassets } from './assets-utils';

describe('OpenDEX.assets-utils', () => {
  test('parseOpenDEXassets success', () => {
    const config = testConfig();
    const baseAssetBalance = {
      getChannelBalance: () => 10000000,
    };
    const quoteAssetBalance = {
      getChannelBalance: () => 20000000,
    };
    const balancesMap = new Map();
    const baseAsset = config.BASEASSET;
    const quoteAsset = config.QUOTEASSET;
    balancesMap.set(baseAsset, baseAssetBalance);
    balancesMap.set(quoteAsset, quoteAssetBalance);
    const balanceResponse = ({
      getBalancesMap: () => balancesMap,
    } as unknown) as GetBalanceResponse;
    const limitsMap = new Map();
    const baseAssetLimits = {
      getMaxsell: () => 5000000,
      getMaxbuy: () => 5000000,
    };
    const quoteAssetLimits = {
      getMaxsell: () => 10000000,
      getMaxbuy: () => 10000000,
    };
    limitsMap.set(config.BASEASSET, baseAssetLimits);
    limitsMap.set(config.QUOTEASSET, quoteAssetLimits);
    const tradingLimitsResponse = ({
      getLimitsMap: () => limitsMap,
    } as unknown) as TradingLimitsResponse;
    expect(
      parseOpenDEXassets({
        baseAsset,
        quoteAsset,
        balanceResponse,
        tradingLimitsResponse,
      })
    ).toEqual({
      baseAssetBalance: new BigNumber(
        satsToCoinsStr(baseAssetBalance.getChannelBalance())
      ),
      baseAssetMaxOutbound: new BigNumber(
        satsToCoinsStr(baseAssetLimits.getMaxsell())
      ),
      baseAssetMaxInbound: new BigNumber(
        satsToCoinsStr(baseAssetLimits.getMaxbuy())
      ),
      quoteAssetBalance: new BigNumber(
        satsToCoinsStr(quoteAssetBalance.getChannelBalance())
      ),
      quoteAssetMaxOutbound: new BigNumber(
        satsToCoinsStr(quoteAssetLimits.getMaxsell())
      ),
      quoteAssetMaxInbound: new BigNumber(
        satsToCoinsStr(quoteAssetLimits.getMaxbuy())
      ),
    });
  });

  test('error baseAssetBalance', () => {
    const { BASEASSET, QUOTEASSET } = testConfig();
    const balancesMap = new Map();
    const balanceResponse = ({
      getBalancesMap: () => balancesMap,
    } as unknown) as GetBalanceResponse;
    const limitsMap = new Map();
    const tradingLimitsResponse = ({
      getLimitsMap: () => limitsMap,
    } as unknown) as TradingLimitsResponse;
    expect(() => {
      parseOpenDEXassets({
        baseAsset: BASEASSET,
        quoteAsset: QUOTEASSET,
        balanceResponse,
        tradingLimitsResponse,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test('error quoteAssetBalance', () => {
    const { BASEASSET, QUOTEASSET } = testConfig();
    const balancesMap = new Map();
    const baseAssetBalance = {
      getChannelBalance: () => 10000000,
    };
    balancesMap.set(BASEASSET, baseAssetBalance);
    const balanceResponse = ({
      getBalancesMap: () => balancesMap,
    } as unknown) as GetBalanceResponse;
    const limitsMap = new Map();
    const tradingLimitsResponse = ({
      getLimitsMap: () => limitsMap,
    } as unknown) as TradingLimitsResponse;
    expect(() => {
      parseOpenDEXassets({
        baseAsset: BASEASSET,
        quoteAsset: QUOTEASSET,
        balanceResponse,
        tradingLimitsResponse,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test('error baseAssetTradingLimits', () => {
    const { BASEASSET, QUOTEASSET } = testConfig();
    const balancesMap = new Map();
    const baseAssetBalance = {
      getChannelBalance: () => 10000000,
    };
    const quoteAssetBalance = {
      getChannelBalance: () => 10000000,
    };
    balancesMap.set(BASEASSET, baseAssetBalance);
    balancesMap.set(QUOTEASSET, quoteAssetBalance);
    const balanceResponse = ({
      getBalancesMap: () => balancesMap,
    } as unknown) as GetBalanceResponse;
    const limitsMap = new Map();
    const tradingLimitsResponse = ({
      getLimitsMap: () => limitsMap,
    } as unknown) as TradingLimitsResponse;
    expect(() => {
      parseOpenDEXassets({
        baseAsset: BASEASSET,
        quoteAsset: QUOTEASSET,
        balanceResponse,
        tradingLimitsResponse,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test('error quoteAssetLimits', () => {
    const { BASEASSET, QUOTEASSET } = testConfig();
    const balancesMap = new Map();
    const baseAssetBalance = {
      getChannelBalance: () => 10000000,
    };
    const quoteAssetBalance = {
      getChannelBalance: () => 10000000,
    };
    balancesMap.set(BASEASSET, baseAssetBalance);
    balancesMap.set(QUOTEASSET, quoteAssetBalance);
    const balanceResponse = ({
      getBalancesMap: () => balancesMap,
    } as unknown) as GetBalanceResponse;
    const limitsMap = new Map();
    const baseAssetLimits = {
      getMaxsell: () => 5000000,
      getMaxbuy: () => 5000000,
    };
    limitsMap.set(BASEASSET, baseAssetLimits);
    const tradingLimitsResponse = ({
      getLimitsMap: () => limitsMap,
    } as unknown) as TradingLimitsResponse;
    expect(() => {
      parseOpenDEXassets({
        baseAsset: BASEASSET,
        quoteAsset: QUOTEASSET,
        balanceResponse,
        tradingLimitsResponse,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  test('logAssetBalance', () => {
    const logger = (getLoggers().global as unknown) as Logger;
    logger.trace = jest.fn();
    const baseAssetBalance = '1.23456789';
    const baseAssetMaxOutbound = '0.617283945';
    const baseAssetMaxInbound = '0.33';
    const quoteAssetBalance = '9.87654321';
    const quoteAssetMaxInbound = '0.55';
    const quoteAssetMaxOutbound = '0.44';
    const assets = {
      baseAssetBalance: new BigNumber(baseAssetBalance),
      baseAssetMaxOutbound: new BigNumber(baseAssetMaxOutbound),
      baseAssetMaxInbound: new BigNumber(baseAssetMaxInbound),
      quoteAssetBalance: new BigNumber(quoteAssetBalance),
      quoteAssetMaxInbound: new BigNumber(quoteAssetMaxInbound),
      quoteAssetMaxOutbound: new BigNumber(quoteAssetMaxOutbound),
    };
    logAssetBalance({
      logger,
      assets,
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
