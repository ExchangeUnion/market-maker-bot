import {
  DataTypes,
  Model,
  ModelAttributes,
  ModelOptions,
  Sequelize,
} from 'sequelize';
import { ModelCtor } from 'sequelize/types/lib/model';

type FeeAttributes = {
  orderId?: string;
  tradeId?: string;
  type: 'taker' | 'maker';
  currency: string;
  rate: number;
  cost: number;
};

export interface FeeInstance extends Model<FeeAttributes>, FeeAttributes {}

export function Fee(sequelize: Sequelize): ModelCtor<FeeInstance> {
  const attributes: ModelAttributes<FeeInstance> = {
    orderId: { type: DataTypes.STRING, allowNull: true },
    tradeId: { type: DataTypes.STRING, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: false },
    currency: { type: DataTypes.STRING, allowNull: false },
    rate: { type: DataTypes.DOUBLE, allowNull: false },
    cost: { type: DataTypes.DOUBLE, allowNull: false },
  };

  const options: ModelOptions = {
    tableName: 'fees',
    timestamps: false,
  };

  return sequelize.define<FeeInstance>('Fee', attributes, options);
}
