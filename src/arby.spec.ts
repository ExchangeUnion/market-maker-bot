import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { startArby } from '../src/arby';
import { Config } from '../src/config';
import { getLoggers } from './test-utils';
import { Exchange } from 'ccxt';

let testScheduler: TestScheduler;

type AssertStartArbyParams = {
  expected: string;
  inputEvents: {
    config$: string;
    getTrade$: string;
    shutdown$: string;
    cleanup$: string;
    initCEX$: string;
  };
};

const assertStartArby = ({ expected, inputEvents }: AssertStartArbyParams) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const config$ = cold(inputEvents.config$) as Observable<Config>;
    const getTrade$ = () => {
      return (cold(inputEvents.getTrade$) as unknown) as Observable<boolean>;
    };
    const shutdown$ = cold(inputEvents.shutdown$);
    const cleanup$ = () => {
      return cold(inputEvents.cleanup$);
    };
    const initCEX$ = () => {
      return (cold(inputEvents.initCEX$) as unknown) as Observable<Exchange>;
    };
    const arby$ = startArby({
      config$,
      getLoggers,
      shutdown$,
      trade$: getTrade$,
      cleanup$,
      initCEX$,
    });
    expectObservable(arby$).toBe(expected);
  });
};

describe('startArby', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('waits for valid configuration before starting', () => {
    const inputEvents = {
      config$: '1000ms a',
      initCEX$: '1s a',
      getTrade$: 'b',
      shutdown$: '',
      cleanup$: '',
    };
    const expected = '2s b';
    assertStartArby({
      inputEvents,
      expected,
    });
  });

  it('performs cleanup when shutting down gracefully', () => {
    const inputEvents = {
      config$: 'a',
      initCEX$: '1s a',
      getTrade$: '500ms b',
      shutdown$: '10s c',
      cleanup$: '2s a',
    };
    const expected = '1500ms b 11499ms a';
    assertStartArby({
      inputEvents,
      expected,
    });
  });

  it('performs cleanup when getTrade$ errors', () => {
    const inputEvents = {
      config$: 'a',
      initCEX$: '1s a',
      getTrade$: '500ms #',
      shutdown$: '10s c',
      cleanup$: '2s a',
    };
    const expected = '3500ms a';
    assertStartArby({
      inputEvents,
      expected,
    });
  });
});
