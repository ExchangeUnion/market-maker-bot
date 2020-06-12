import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { startArby } from '../src/arby';
import { Config } from '../src/config';
import { getLoggers } from './test-utils';

describe('startArby', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('waits for valid configuration before starting', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const config$ = cold('1000ms a') as Observable<Config>;
      const getTrade$ = () => {
        return cold('b', { b: true });
      };
      const shutdown$ = cold('');
      const arby$ = startArby({
        config$,
        getLoggers,
        shutdown$,
        trade$: getTrade$,
      });
      const expected = '1000ms b';
      expectObservable(arby$).toBe(expected, {
        b: true,
      });
    });
  });

  it('stops gracefully when kill signal received', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const config$ = cold('a') as Observable<Config>;
      const getTrade$ = () => {
        return cold('500ms b', { b: true });
      };
      const shutdown$ = cold('10s c');
      const arby$ = startArby({
        config$,
        getLoggers,
        trade$: getTrade$,
        shutdown$,
      });
      const expected = '500ms b 9499ms |';
      expectObservable(arby$).toBe(expected, {
        b: true,
      });
    });
  });
});
