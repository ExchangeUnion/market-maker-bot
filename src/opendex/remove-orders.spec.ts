import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { testConfig } from '../../test/utils';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import { removeOpenDEXorders$ } from './remove-orders';
import { ListXudOrdersResponse } from './xud/list-orders';
import { RemoveOrderResponse } from '../broker/opendex/proto/xudrpc_pb';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type RemoveOpenDEXordersInputEvents = {
  getXudClient$: string;
  listXudOrders$: string;
  removeXudOrder$: string;
};

const assertRemoveOpenDEXorders = (
  inputEvents: RemoveOpenDEXordersInputEvents,
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const getXudClient$ = () => {
      return (cold(inputEvents.getXudClient$) as unknown) as Observable<
        XudClient
      >;
    };
    const listXudOrders$ = () => {
      return (cold(inputEvents.listXudOrders$) as unknown) as Observable<
        ListXudOrdersResponse
      >;
    };
    const removeXudOrder$ = () => {
      return (cold(inputEvents.removeXudOrder$) as unknown) as Observable<
        RemoveOrderResponse
      >;
    };
    const removeOrders$ = removeOpenDEXorders$({
      config: testConfig(),
      getXudClient$,
      listXudOrders$,
      removeXudOrder$,
    });
    expectObservable(removeOrders$).toBe(expected);
  });
};

describe('removeOpenDEXorders$', () => {
  beforeEach(testSchedulerSetup);

  it('gets a list of all active orders and removes all of them', () => {
    const inputEvents = {
      getXudClient$: '1s a',
      listXudOrders$: '1s a',
      removeXudOrder$: '1s a',
    };
    const expectedEvents = '2s a';
    assertRemoveOpenDEXorders(inputEvents, expectedEvents);
  });
});
