import { from, Observable, of } from 'rxjs';
import { Sequelize, ModelCtor } from 'sequelize';
import { Order, OrderInstance } from './order';
import { Fee, FeeInstance } from './fee';
import { Trade, TradeInstance } from './trade';
import { Logger } from '../logger';
import { mergeMap } from 'rxjs/operators';

type InitDBparams = {
  dataDir?: string;
  logger: Logger;
};

type InitDBResponse = {
  Order: ModelCtor<OrderInstance>;
  Fee: ModelCtor<FeeInstance>;
  Trade: ModelCtor<TradeInstance>;
};

const createModels = (sequelize: Sequelize): InitDBResponse => {
  const models = {
    Order: Order(sequelize),
    Fee: Fee(sequelize),
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

  models.Fee.belongsTo(models.Order, {
    foreignKey: 'orderId',
    constraints: true,
  });
  models.Fee.belongsTo(models.Trade, {
    foreignKey: 'tradeId',
    constraints: true,
  });

  return models;
};

const initDB$ = ({
  logger,
  dataDir,
}: InitDBparams): Observable<InitDBResponse> => {
  const sequelize = new Sequelize({
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
              return from(models.Trade.sync()).pipe(
                mergeMap(() => {
                  return from(models.Fee.sync()).pipe(mergeMap(() => of(models)));
                })
              );
            })
          );
        })
      );
    })
  );
};

export { initDB$, InitDBparams, InitDBResponse };
