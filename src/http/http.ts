import * as http from 'http';
import { Logger } from '../logger';
import { fromEvent, Observable, of } from 'rxjs';
import { InitDBResponse } from '../db/db';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { catchError, map } from 'rxjs/operators';
import { FromEventTarget } from 'rxjs/internal/observable/fromEvent';

type InitHttpParams = {
  port: number;
  logger: Logger;
  models: InitDBResponse;
};

type InitHttpResponse = {
  req: IncomingMessage;
  res: ServerResponse;
  handler?: Promise<any>;
};

const route = (
  method: string,
  url: string,
  cb: (req: IncomingMessage, res: ServerResponse) => any
) => {
  return (HTTP: InitHttpResponse) => {
    const { req, res, handler } = HTTP;
    if (req.url !== url || req.method !== method.toLocaleUpperCase())
      return HTTP;
    const newHandler: Promise<any> = handler
      ? handler.then(cb(req, res))
      : cb(req, res);
    return { req, res, handler: newHandler };
  };
};

const getOrders = (req: IncomingMessage, res: ServerResponse) => {
  //TODO fetch orders according to req
  console.log('WORKING??');
  res.end('test');
};

const handleRoutes = () => {
  return (source: Observable<InitHttpResponse>) =>
    source.pipe(
      map(route('GET', '/orders', getOrders)),
      catchError(err => err)
    );
};

let server: Server;
const initHttp$ = ({ port, logger }: InitHttpParams): Observable<void> => {
  server = http.createServer();

  const request$ = fromEvent(
    server as FromEventTarget<[http.IncomingMessage, http.ServerResponse, any]>,
    'request'
  ).pipe(
    map(
      ([req, res, handler]: [
        http.IncomingMessage,
        http.ServerResponse,
        any
      ]): InitHttpResponse => {
        return { req, res, handler };
      }
    ),
    handleRoutes()
  ) as Observable<void>;

  server.listen(port, () => {
    logger.info(`HTTP server started at ${port}`);
  });

  return request$;
};

const closeServer$ = () => {
  return of(server.close());
};

export { initHttp$, InitHttpParams, closeServer$ };
