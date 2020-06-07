import { Observable, of } from 'rxjs';
import { tap, delay } from 'rxjs/operators';
import { TradeInfo } from '../trade/manager';
import { Config } from '../config';

const createOpenDEXorders$ = (config: Config, tradeInfo: TradeInfo): Observable<boolean> => {
  // mock implementation
  return of(true).pipe(
    delay(3000),
    tap(() => console.log('Mock orders have been submitted to OpenDEX.')),
  );
}

export {
  createOpenDEXorders$,
};
