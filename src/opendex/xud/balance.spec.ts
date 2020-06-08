import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import { GetBalanceRequest } from '../../broker/opendex/proto/xudrpc_pb';
import { getXudBalance$ } from './balance';

jest.mock('../../broker/opendex/proto/xudrpc_grpc_pb');
jest.mock('../../broker/opendex/proto/xudrpc_pb');

describe('getXudBalance$', () => {
  test('success', done => {
    expect.assertions(2);
    const expectedBalance = 'balanceResponse';
    const client = ({
      getBalance: (req: any, cb: any) => {
        cb(null, expectedBalance);
      },
    } as unknown) as XudClient;
    const xudBalance$ = getXudBalance$(client);
    xudBalance$.subscribe(actualBalance => {
      expect(actualBalance).toEqual(expectedBalance);
      expect(GetBalanceRequest).toHaveBeenCalledTimes(1);
      done();
    });
  });

  test('failure', done => {
    expect.assertions(1);
    const expectedError = 'balanceError';
    const client = ({
      getBalance: (req: any, cb: any) => {
        cb(expectedError);
      },
    } as unknown) as XudClient;
    const xudBalance$ = getXudBalance$(client);
    xudBalance$.subscribe({
      error: error => {
        expect(error).toEqual(expectedError);
        done();
      },
    });
  });
});
