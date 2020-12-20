import {
  DataTypes,
  Model,
  ModelAttributes,
  ModelOptions,
  Sequelize,
} from 'sequelize';
import { ModelCtor } from 'sequelize/types/lib/model';

type TradeAttributes = {
  id: string;
  orderId: string;
  amount: number;
  datetime: string;
  info: any;
  price: number;
  timestamp: number;
  type?: 'market' | 'limit';
  side: 'buy' | 'sell';
  symbol: string;
  takerOrMaker: 'taker' | 'maker';
  cost: number;
};

export interface TradeInstance
  extends Model<TradeAttributes>,
    TradeAttributes {}

export function Trade(sequelize: Sequelize): ModelCtor<TradeInstance> {
  const attributes: ModelAttributes<TradeInstance> = {
    id: { type: DataTypes.STRING, primaryKey: true },
    orderId: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DOUBLE, allowNull: false },
    datetime: { type: DataTypes.STRING, allowNull: false },
    info: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DOUBLE, allowNull: false },
    timestamp: { type: DataTypes.BIGINT, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    side: { type: DataTypes.STRING, allowNull: false },
    symbol: { type: DataTypes.STRING, allowNull: false },
    takerOrMaker: { type: DataTypes.STRING, allowNull: false },
    cost: { type: DataTypes.DOUBLE, allowNull: false },
  };

  const options: ModelOptions = {
    tableName: 'trades',
    timestamps: false,
  };

  return sequelize.define<TradeInstance>('Trade', attributes, options);
}
