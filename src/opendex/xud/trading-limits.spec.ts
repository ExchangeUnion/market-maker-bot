import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import { TradingLimitsRequest } from '../../broker/opendex/proto/xudrpc_pb';
import { getXudTradingLimits$ } from './trading-limits';

jest.mock('../../broker/opendex/proto/xudrpc_grpc_pb');
jest.mock('../../broker/opendex/proto/xudrpc_pb');

describe('getXudTradingLimits$', () => {
  test('success', done => {
    expect.assertions(2);
    const expectedTradingLimits = 'tradingLimitsResponse';
    const client = ({
      tradingLimits: (req: any, cb: any) => {
        cb(null, expectedTradingLimits);
      },
    } as unknown) as XudClient;
    const tradingLimits$ = getXudTradingLimits$(client);
    tradingLimits$.subscribe(actualLimits => {
      expect(actualLimits).toEqual(expectedTradingLimits);
      expect(TradingLimitsRequest).toHaveBeenCalledTimes(1);
      done();
    });
  });

  test('failure', done => {
    expect.assertions(1);
    const expectedError = 'tradingLimitsError';
    const client = ({
      tradingLimits: (req: any, cb: any) => {
        cb(expectedError);
      },
    } as unknown) as XudClient;
    const tradingLimits$ = getXudTradingLimits$(client);
    tradingLimits$.subscribe({
      error: error => {
        expect(error).toEqual(expectedError);
        done();
      },
    });
  });
});
