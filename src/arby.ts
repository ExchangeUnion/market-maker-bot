import { Logger } from './logger';
import { ExchangeBroker } from './broker/exchange';
import { TradeManager } from './trade/manager';
import {
  ExchangeType,
} from './enums';
import { loadConfig, Config } from './config';

class Arby {
  private shuttingDown = false;
  private logger!: Logger;
  private tradeManager!: TradeManager;

  constructor() {
    process.on('SIGINT', () => {
      this.beginShutdown();
    });

    process.on('SIGTERM', () => {
      this.beginShutdown();
    });
  }

  public start = async (config: Config) => {
    const loggers = Logger.createLoggers(
      config.LOG_LEVEL,
      config.LOG_PATH,
    );
    this.logger = loggers.global;
    this.logger.info('Starting Arby...');
    const openDexBroker = new ExchangeBroker({
      exchange: ExchangeType.OpenDEX,
      logger: loggers.opendex,
      certPath: process.env.OPENDEX_CERT_PATH,
      rpchost: process.env.OPENDEX_RPC_HOST,
      rpcport: parseInt(process.env.OPENDEX_RPC_PORT!, 10),
    });
    const binanceBroker = new ExchangeBroker({
      exchange: ExchangeType.Binance,
      logger: loggers.binance,
      apiKey: process.env.BINANCE_API_KEY,
      apiSecret: process.env.BINANCE_API_SECRET,
    });
    this.tradeManager = new TradeManager({
      logger: loggers.trademanager,
      opendex: openDexBroker,
      binance: binanceBroker,
    });
    await this.tradeManager.start();
  }

  public beginShutdown = () => {
    // we begin the shutdown process but return a response before it completes.
    void (this.shutdown());
  }

  private shutdown = async () => {
    if (this.shuttingDown) {
      this.logger.info('Arby is already shutting down');
      return;
    }
    this.shuttingDown = true;
    this.logger.info('Arby is shutting down');

    await this.tradeManager.close();

    this.logger.info('Arby shutdown gracefully');
  }
}

if (!module.parent) {
  const config$ = loadConfig();
  config$.subscribe({
    next: (config: Config) => {
      const arby = new Arby();
      void arby.start(config);
    },
    error: (e) => {
      console.log(e.message);
    },
  });
}
