import { Exchange } from 'ccxt';
import { fetchBalance$ } from './fetch-balance';

describe('CCXT', () => {
  it('fetches balance', done => {
    expect.assertions(1);
    const balance = 'balanceResponse';
    const exchange = ({
      fetchBalance: () => Promise.resolve(balance),
    } as unknown) as Exchange;
    const balance$ = fetchBalance$(exchange);
    balance$.subscribe({
      next: actualBalance => {
        expect(actualBalance).toEqual(balance);
      },
      complete: done,
    });
  });
});
