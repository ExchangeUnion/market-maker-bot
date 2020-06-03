import { Observable, combineLatest } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getXudClient$ } from './xud-client';
import { testConfig } from '../../test/utils';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';

jest.mock('../broker/opendex/proto/xudrpc_grpc_pb');

describe('XudClient', () => {

  describe('xudClient$', () => {

    it('initializes the client once', (done) => {
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
  });

});
