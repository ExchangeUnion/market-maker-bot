import { Stream } from '../stream';
import WebSocket from 'ws';
import { Logger } from '../../logger';

// If we haven't received a ping during this time we'll consider
// socket dead.
const HEARTBEAT_TIMEOUT = 60 * 1000 * 3 + 1000;
// Since Binance allows to keep a single socket alive for maximum of 24h we're
// recrating the socket after the specified amount of time
const RESTART_TIMEOUT = 60 * 60 * 1000;

class BinanceStream extends Stream {
  private isAlive = false;
  private socket!: WebSocket;
  private pingTimeout!: ReturnType<typeof setTimeout>;
  private restartTimeout!: ReturnType<typeof setTimeout>;

  constructor(private logger: Logger, private tradingPair: string) {
    super();
  }

  public start = (): Promise<void> => {
    return new Promise((resolve) => {
      clearTimeout(this.pingTimeout);
      clearTimeout(this.restartTimeout);
      const url = `wss://stream.binance.com:9443/ws/${this.tradingPair.toLowerCase()}@aggTrade`;
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.logger.info(`${this.tradingPair} established connection to ${url}`);
      };

      this.socket.on('ping', this.heartbeat);
      this.socket.on('open', this.heartbeat);
      this.socket.on('error', (e) => {
        this.logger.error(`error from the socket ${e}`);
      });

      this.socket.onclose = this.onClose;
      this.socket.onmessage = this.onMessage;
      this.restartTimeout = setTimeout(async () => {
        this.logger.warn(`${this.tradingPair} socket timeout reached - restarting`);
        this.socket.terminate();
        await this.restart();
      }, RESTART_TIMEOUT);
      resolve();
    });
  }

  public close = (): Promise<void> => {
    clearTimeout(this.restartTimeout);
    this.socket.terminate();
    return new Promise((resolve) => {
      const isAliveCheck = setInterval(() => {
        if (!this.isAlive) {
          clearInterval(isAliveCheck);
          resolve();
        }
      });
    });
  }

  private onMessage = (event: WebSocket.MessageEvent) => {
    const aggTrade = JSON.parse(event.data.toString());
    const { p: priceString } = aggTrade;
    const price = parseFloat(priceString);
    this.emit('price', this.tradingPair, price);
  }

  private onClose = (event: WebSocket.CloseEvent) => {
    clearTimeout(this.pingTimeout);
    this.isAlive = false;
    if (event.reason) {
      this.logger.info(`${this.tradingPair} stream closed with reason: ${event.reason}`);
    } else {
      this.logger.info(`${this.tradingPair} stream closed`);
    }
  }

  private restart = async () => {
    try {
      // restart if heartbeat fails
      await this.start();
    } catch (e) {
      this.logger.error(`${this.tradingPair} failed to restart stream: ${e}`);
    }
  }

  private heartbeat = () => {
    this.logger.info(`heartbeat from ${this.tradingPair} socket - isAlive: ${this.isAlive}`);
    this.isAlive = true;
    clearTimeout(this.pingTimeout);
    this.pingTimeout = setTimeout(async () => {
      this.isAlive = false;
      this.socket.terminate();
      await this.restart();
    }, HEARTBEAT_TIMEOUT);
  }

}

export { BinanceStream };
