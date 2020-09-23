import { checkConfigOptions } from './config';

describe('checkConfigOptions', () => {
  describe('LIVE_CEX disabled', () => {
    const validLiveCEXdisabledConf = {
      LOG_LEVEL: 'trace',
      CEX: 'binance',
      DATA_DIR: '/some/data/path',
      OPENDEX_CERT_PATH: '/some/cert/path',
      OPENDEX_RPC_HOST: 'localhost',
      OPENDEX_RPC_PORT: '1234',
      MARGIN: '0.06',
      BASEASSET: 'btc',
      QUOTEASSET: 'usdt',
      TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE: '321',
      TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE: '123',
      LIVE_CEX: 'false',
    };

    it('allows BTC/USDT', () => {
      expect.assertions(1);
      const config = checkConfigOptions(validLiveCEXdisabledConf);
      expect(config).toEqual({
        ...config,
        CEX: 'BINANCE',
        LIVE_CEX: false,
        BASEASSET: 'BTC',
        QUOTEASSET: 'USDT',
      });
    });

    it('allows ETH/BTC trading pair', () => {
      const config = checkConfigOptions({
        ...validLiveCEXdisabledConf,
        ...{ BASEASSET: 'eth', QUOTEASSET: 'btc' },
      });
      expect(config).toEqual({
        ...config,
        CEX: 'BINANCE',
        LIVE_CEX: false,
        BASEASSET: 'ETH',
        QUOTEASSET: 'BTC',
      });
    });

    it('does not allow LTC/LTC trading pair', () => {
      const config = {
        ...validLiveCEXdisabledConf,
        ...{ BASEASSET: 'LTC', QUOTEASSET: 'LTC' },
      };
      expect(() => {
        checkConfigOptions(config);
      }).toThrowErrorMatchingSnapshot();
    });

    it('requires TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE', () => {
      expect.assertions(1);
      const config = {
        ...validLiveCEXdisabledConf,
      };
      delete config.TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE;
      expect(() => {
        checkConfigOptions(config);
      }).toThrowErrorMatchingSnapshot();
    });

    it('requires TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE', () => {
      expect.assertions(1);
      const config = {
        ...validLiveCEXdisabledConf,
      };
      delete config.TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE;
      expect(() => {
        checkConfigOptions(config);
      }).toThrowErrorMatchingSnapshot();
    });
  });

  describe('LIVE_CEX enabled', () => {
    const validLiveCEXenabledConf = {
      LOG_LEVEL: 'trace',
      CEX: 'kraken',
      CEX_API_KEY: '123',
      CEX_API_SECRET: 'abc',
      DATA_DIR: '/some/data/path',
      OPENDEX_CERT_PATH: '/some/cert/path',
      OPENDEX_RPC_HOST: 'localhost',
      OPENDEX_RPC_PORT: '1234',
      MARGIN: '0.06',
      BASEASSET: 'BTC',
      QUOTEASSET: 'USDT',
      LIVE_CEX: 'true',
    };

    it('allows BTC/USDT', () => {
      expect.assertions(1);
      const config = checkConfigOptions(validLiveCEXenabledConf);
      expect(config).toEqual({
        ...config,
        CEX: 'KRAKEN',
        LIVE_CEX: true,
      });
    });

    it('allows ETH/BTC trading pair', () => {
      const config = checkConfigOptions({
        ...validLiveCEXenabledConf,
        ...{ BASEASSET: 'ETH', QUOTEASSET: 'BTC' },
      });
      expect(config).toEqual({
        ...config,
        CEX: 'KRAKEN',
        LIVE_CEX: true,
      });
    });

    it('requires CEX_API_KEY', () => {
      expect.assertions(1);
      const config = {
        ...validLiveCEXenabledConf,
      };
      delete config.CEX_API_KEY;
      expect(() => {
        checkConfigOptions(config);
      }).toThrowErrorMatchingSnapshot();
    });

    it('requires CEX_API_SECRET', () => {
      expect.assertions(1);
      const config = {
        ...validLiveCEXenabledConf,
      };
      delete config.CEX_API_SECRET;
      expect(() => {
        checkConfigOptions(config);
      }).toThrowErrorMatchingSnapshot();
    });
  });
});
