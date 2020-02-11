import { Logger, Level } from './logger';
import path from 'path';
import { ExchangeBroker } from './broker/exchange';
import { BalancerTradeManager } from './trade/balancer';
import {
  ExchangeType,
} from './enums';

type Config = {
  loglevel: string,
  logpath: string,
};

class Balancer {
  private shuttingDown = false;
  private logger!: Logger;
  private config: Config;
  private balancerManager!: BalancerTradeManager;

  constructor() {
    require('dotenv').config();
    const dataDir = process.env.DATA_DIR || __dirname;
    this.config = {
      loglevel: Level.Debug,
      logpath: path.resolve(dataDir, 'balancer.log'),
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
    this.logger.info('Starting Balancer...');
    const openDexBroker = new ExchangeBroker({
      exchange: ExchangeType.OpenDEX,
      logger: loggers.opendex,
      certPath: process.env.OPENDEX_CERT_PATH,
      rpchost: process.env.OPENDEX_RPC_HOST,
      rpcport: parseInt(process.env.OPENDEX_RPC_PORT!, 10),
    });
    this.balancerManager = new BalancerTradeManager({
      logger: loggers.balancer,
      opendex: openDexBroker,
    });
    await this.balancerManager.start();
  }

  public beginShutdown = () => {
    // we begin the shutdown process but return a response before it completes.
    void (this.shutdown());
  }

  private shutdown = async () => {
    if (this.shuttingDown) {
      this.logger.info('Balancer is already shutting down');
      return;
    }
    this.shuttingDown = true;
    this.logger.info('Balancer is shutting down');
    await this.balancerManager.close();

    this.logger.info('Balancer has been shutdown gracefully');
  }
}

if (!module.parent) {
  const balancer = new Balancer();
  void balancer.start();
}
