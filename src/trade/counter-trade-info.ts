import { SwapSuccess } from '../proto/xudrpc_pb';

type CounterTradeInfo = {
  quantityReceived: number;
  assetReceived: string;
};

type GetCounterTradeInfoParams = {
  swapSuccess: SwapSuccess;
  asset: string;
};

const getCounterTradeInfo = ({
  swapSuccess,
  asset,
}: GetCounterTradeInfoParams): CounterTradeInfo => {
  return {
    quantityReceived: swapSuccess.getAmountReceived(),
    assetReceived: swapSuccess.getCurrencyReceived(),
  };
};

export { getCounterTradeInfo, CounterTradeInfo, GetCounterTradeInfoParams };
