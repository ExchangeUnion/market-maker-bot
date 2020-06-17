import { getStartShutdown$ } from '../src/utils';

describe('Utils', () => {
  describe('getStartShutdown$', () => {
    it('completes on SIGINT', done => {
      getStartShutdown$().subscribe({
        complete: done,
      });
      process.emit('SIGINT', 'SIGINT');
    });

    it('completes on SIGTERM', done => {
      getStartShutdown$().subscribe({
        complete: done,
      });
      process.emit('SIGTERM', 'SIGTERM');
    });
  });
});
