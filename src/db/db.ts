import { from, Observable, of } from 'rxjs';
import { Sequelize, ModelCtor } from 'sequelize';
import { Order, OrderInstance } from './order';
import { Trade, TradeInstance } from './trade';
import { Logger } from '../logger';
import { mergeMap } from 'rxjs/operators';

type InitDBParams = {
  dataDir?: string;
  logger: Logger;
};

type InitDBResponse = {
  Order: ModelCtor<OrderInstance>;
  Trade: ModelCtor<TradeInstance>;
};

const createModels = (sequelize: Sequelize): InitDBResponse => {
  const models = {
    Order: Order(sequelize),
    Trade: Trade(sequelize),
  };

  models.Order.hasMany(models.Trade, {
    as: 'orderTrades',
    foreignKey: 'orderId',
    constraints: true,
  });
  models.Trade.belongsTo(models.Order, {
    as: 'orderInstance',
    constraints: true,
    foreignKey: 'orderId',
  });

  return models;
};

let sequelize: Sequelize;

const initDB$ = ({
  logger,
  dataDir,
}: InitDBParams): Observable<InitDBResponse> => {
  sequelize = new Sequelize({
    storage: dataDir ? `${dataDir}/arby.db` : undefined,
    logging: logger.trace,
    dialect: 'sqlite',
  });

  return of(createModels(sequelize)).pipe(
    mergeMap(models => {
      return from(sequelize.authenticate()).pipe(
        mergeMap(() => {
          return from(models.Order.sync()).pipe(
            mergeMap(() => {
              return from(models.Trade.sync()).pipe(mergeMap(() => of(models)));
            })
          );
        })
      );
    })
  );
};

const closeDB$ = (): Observable<void> => {
  return from(sequelize.close());
};

export { initDB$, InitDBParams, InitDBResponse, closeDB$ };
