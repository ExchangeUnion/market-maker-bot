import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ExchangeAssetAllocation } from '../trade/manager';
import { BigNumber } from 'bignumber.js';
import { GetBalanceResponse } from '../broker/opendex/proto/xudrpc_pb';

const xudBalanceToExchangeAssetAllocation =
  (
    {
      balanceResponse,
      baseCurrency,
      quoteCurrency,
    }:
    {
      balanceResponse: GetBalanceResponse
      baseCurrency: string,
      quoteCurrency: string
    }
  ):
  ExchangeAssetAllocation => {
    const balancesMap = balanceResponse.getBalancesMap();
    const baseAssetBalance = new BigNumber(
      balancesMap
      .get(baseCurrency)
      .getChannelBalance()
    );
    const quoteAssetBalance = new BigNumber(
      balancesMap
      .get(quoteCurrency)
      .getChannelBalance()
    );
    return {
      baseAssetBalance,
      quoteAssetBalance,
    }
}

const getOpenDEXassets$ = (
  {
    xudBalance$,
    xudBalanceToExchangeAssetAllocation,
    quoteAsset,
    baseAsset,
  }:
  {
    xudBalance$: Observable<GetBalanceResponse>,
    xudBalanceToExchangeAssetAllocation: (
      {
        balance,
        quoteAsset,
        baseAsset,
      }:
      {
        balance: GetBalanceResponse,
        quoteAsset: string,
        baseAsset: string
      }
    ) => ExchangeAssetAllocation,
    quoteAsset: string,
    baseAsset: string,
  }
): Observable<ExchangeAssetAllocation> => {
  return xudBalance$.pipe(
    map((balance) => {
      return xudBalanceToExchangeAssetAllocation({
        balance,
        quoteAsset,
        baseAsset,
      });
    }),
    take(1),
  );
};

export {
  getOpenDEXassets$,
  xudBalanceToExchangeAssetAllocation,
};
