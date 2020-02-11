import { Logger, Level } from './logger';
import path from 'path';
import { ExchangeBroker } from './broker/exchange';
import { TradeManager } from './trade/manager';
import {
  ExchangeType,
} from './enums';

type Config = {
  loglevel: string,
  logpath: string,
};

class Arby {
  private shuttingDown = false;
  private logger!: Logger;
  private config: Config;
  private tradeManager!: TradeManager;

  constructor() {
    require('dotenv').config();
    const dataDir = process.env.DATA_DIR || __dirname;
    this.config = {
      loglevel: Level.Debug,
      logpath: path.resolve(dataDir, 'arby.log'),
    };

    process.on('SIGINT', () => {
      this.beginShutdown();
    });

    process.on('SIGTERM', () => {
      this.beginShutdown();
    });
  }

  public start = async () => {
    const loggers = Logger.createLoggers(this.config.loglevel, this.config.logpath);
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
  const arby = new Arby();
  void arby.start();
}
