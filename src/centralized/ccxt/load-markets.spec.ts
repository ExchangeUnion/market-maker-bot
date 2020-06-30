import { loadMarkets$ } from './load-markets';
import { Exchange } from 'ccxt';

describe('CCXT', () => {
  it('has ETH/BTC trading pair', done => {
    expect.assertions(1);
    const markets = 'marketsResponse';
    const exchange = ({
      loadMarkets: () => Promise.resolve(markets),
    } as unknown) as Exchange;
    const markets$ = loadMarkets$(exchange);
    markets$.subscribe({
      next: actualMarkets => {
        expect(actualMarkets).toEqual(markets);
      },
      complete: done,
    });
  });
});
