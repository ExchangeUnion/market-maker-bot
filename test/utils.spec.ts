import { getStartShutdown$ } from '../src/utils';

describe('getStartShutdown$', () => {

  it('completes on SIGINT', (done) => {
    getStartShutdown$()
      .subscribe({
        complete: done
      });
    process.emit('SIGINT', 'SIGINT');
  });

  it('completes on SIGTERM', (done) => {
    getStartShutdown$()
      .subscribe({
        complete: done
      });
    process.emit('SIGTERM', 'SIGTERM');
  });

});
