import { Observable, of } from 'rxjs';

const getCleanup$ = (): Observable<unknown> => {
  return of('cleanup complete');
};

export { getCleanup$ };
