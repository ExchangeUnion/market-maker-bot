import { checkConfigOptions } from './config';

describe('checkConfigOptions', () => {
  it('allows BTC/USDT trading pair', () => {
    const dotEnvConfig = {
      LOG_LEVEL: 'trace',
      CEX: 'Binance',
      CEX_API_KEY: '123',
      CEX_API_SECRET: 'abc',
      DATA_DIR: '/some/data/path',
      OPENDEX_CERT_PATH: '/some/cert/path',
      OPENDEX_RPC_HOST: 'localhost',
      OPENDEX_RPC_PORT: '1234',
      MARGIN: '0.06',
      BASEASSET: 'BTC',
      QUOTEASSET: 'USDT',
      TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE: '321',
      TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE: '123',
      LIVE_CEX: 'false',
    };
    const verifiedConfig = checkConfigOptions(dotEnvConfig);
    expect(verifiedConfig).toEqual({
      ...dotEnvConfig,
      LIVE_CEX: false,
    });
  });

  it('allows ETH/BTC trading pair', () => {
    const dotEnvConfig = {
      LOG_LEVEL: 'trace',
      CEX: 'Binance',
      CEX_API_KEY: '123',
      CEX_API_SECRET: 'abc',
      DATA_DIR: '/some/data/path',
      OPENDEX_CERT_PATH: '/some/cert/path',
      OPENDEX_RPC_HOST: 'localhost',
      OPENDEX_RPC_PORT: '1234',
      MARGIN: '0.06',
      BASEASSET: 'ETH',
      QUOTEASSET: 'BTC',
      TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE: '321',
      TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE: '123',
      LIVE_CEX: 'false',
    };
    const verifiedConfig = checkConfigOptions(dotEnvConfig);
    expect(verifiedConfig).toEqual({
      ...dotEnvConfig,
      LIVE_CEX: false,
    });
  });

  it('does not allow LTC/LTC trading pair', () => {
    const dotEnvConfig = {
      LOG_LEVEL: 'trace',
      CEX: 'Binance',
      CEX_API_KEY: '123',
      CEX_API_SECRET: 'abc',
      DATA_DIR: '/some/data/path',
      OPENDEX_CERT_PATH: '/some/cert/path',
      OPENDEX_RPC_HOST: 'localhost',
      OPENDEX_RPC_PORT: '1234',
      MARGIN: '0.06',
      BASEASSET: 'LTC',
      QUOTEASSET: 'LTC',
      TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE: '321',
      TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE: '123',
      LIVE_CEX: 'false',
    };
    expect(() => {
      checkConfigOptions(dotEnvConfig);
    }).toThrowErrorMatchingSnapshot();
  });
});
