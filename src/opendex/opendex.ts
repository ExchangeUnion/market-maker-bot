import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ExchangeAssetAllocation } from '../trade/manager';
import { BigNumber } from 'bignumber.js';
import { GetBalanceResponse } from '../broker/opendex/proto/xudrpc_pb';

const xudBalanceToExchangeAssetAllocation =
  (
    {
      balanceResponse,
      baseAsset,
      quoteAsset,
    }:
    {
      balanceResponse: GetBalanceResponse
      baseAsset: string,
      quoteAsset: string
    }
  ):
  ExchangeAssetAllocation => {
    const balancesMap = balanceResponse.getBalancesMap();
    const baseAssetBalance = new BigNumber(
      balancesMap
      .get(baseAsset)
      .getChannelBalance()
    );
    const quoteAssetBalance = new BigNumber(
      balancesMap
      .get(quoteAsset)
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
        balanceResponse,
        quoteAsset,
        baseAsset,
      }:
      {
        balanceResponse: GetBalanceResponse,
        quoteAsset: string,
        baseAsset: string
      }
    ) => ExchangeAssetAllocation,
    quoteAsset: string,
    baseAsset: string,
  }
): Observable<ExchangeAssetAllocation> => {
  return xudBalance$.pipe(
    map((balanceResponse) => {
      return xudBalanceToExchangeAssetAllocation({
        balanceResponse,
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
