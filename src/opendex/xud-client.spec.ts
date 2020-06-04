import { Observable, combineLatest } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import {
  getXudClient$,
  getXudBalance$,
  processResponse,
} from './xud-client';
import { testConfig } from '../../test/utils';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import {
  GetBalanceRequest,
} from '../broker/opendex/proto/xudrpc_pb';
import { ServiceError } from '@grpc/grpc-js';

jest.mock('../broker/opendex/proto/xudrpc_grpc_pb');
jest.mock('../broker/opendex/proto/xudrpc_pb');

describe('XudClient', () => {

  test('getXudClient$', (done) => {
    expect.assertions(2);
    const config = testConfig();
    const xudClient$ = getXudClient$(config);
    xudClient$.subscribe(() => {
      expect(XudClient).toHaveBeenCalledTimes(1);
      expect(XudClient).toHaveBeenCalledWith(
        `${config.OPENDEX_RPC_HOST}:${config.OPENDEX_RPC_PORT}`,
        expect.any(Object),
        expect.any(Object),
      );
      done();
    });
  });

  test('processResponse success', (done) => {
    expect.assertions(1);
    const nextValue = 'next';
    const source$ = new Observable((subscriber) => {
      processResponse(subscriber)(null, nextValue);
    });
    source$.subscribe((actualNextValue) => {
      expect(actualNextValue).toEqual(nextValue);
      done();
    });
  });

  test('processResponse error', (done) => {
    expect.assertions(1);
    const errorValue = 'errorValue' as unknown as ServiceError;
    const source$ = new Observable((subscriber) => {
      processResponse(subscriber)(errorValue, null);
    });
    source$.subscribe({
      error: (errorMsg) => {
        expect(errorMsg).toEqual(errorValue);
        done();
      }
    });
  });

  test('getXudBalance$ success', (done) => {
    expect.assertions(2);
    const expectedBalance = 'balanceResponse';
    const client = {
      getBalance: (req: any, cb: any) => {
        cb(null, expectedBalance);
      }
    } as unknown as XudClient;
    const xudBalance$ = getXudBalance$(client);
    xudBalance$.subscribe((actualBalance) => {
      expect(actualBalance).toEqual(expectedBalance);
      expect(GetBalanceRequest).toHaveBeenCalledTimes(1);
      done();
    });
  });

  test('getXudBalance$ failure', (done) => {
    expect.assertions(1);
    const expectedError = 'balanceError';
    const client = {
      getBalance: (req: any, cb: any) => {
        cb(expectedError);
      }
    } as unknown as XudClient;
    const xudBalance$ = getXudBalance$(client);
    xudBalance$.subscribe({
      error: (error) => {
        expect(error).toEqual(expectedError);
        done();
      }
    });
  });

});
