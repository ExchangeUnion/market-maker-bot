import { Stream } from '../stream';

class OpenDexStream extends Stream {
  public start = () => {
    return Promise.resolve();
  }
  public close = () => {
    return Promise.resolve();
  }
}

export { OpenDexStream };
