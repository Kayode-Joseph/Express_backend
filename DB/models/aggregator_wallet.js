'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class aggregator_wallet extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate({ aggregators }) {
            this.belongsTo(aggregators, { foreignKey: 'aggregator_id' });
        }
    }
    aggregator_wallet.init(
        {
            // id: {
            //   allowNull: false,
            //   autoIncrement: true,

            //   primaryKey: true,
            //   type: DataTypes.INTEGER,
            // },
            aggregator_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true,

                references: {
                    model: 'aggregators',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
            },
            wallet_balance: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                validator: { notNull: true, isDecimal: true },
            },
            ledger_balance: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                validator: { notNull: true, isDecimal: true },
            },
            pin: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            isBusy: {
                allowNull: false,
                defaultValue: false,
                type: DataTypes.BOOLEAN,
            },
        },
        {
            sequelize,
            modelName: 'aggregator_wallet',
        }
    );
    return aggregator_wallet;
};
