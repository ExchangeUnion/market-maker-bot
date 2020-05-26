import { Stream } from '../stream';
import { Observable, empty } from 'rxjs';
import { BigNumber } from 'bignumber.js';

class OpenDexStream extends Stream {
  public start = () => {
    return Promise.resolve();
  }
  public close = () => {
    return Promise.resolve();
  }
  public getObservable = (): Observable<BigNumber> => {
    return empty();
  }
}

export { OpenDexStream };
