"use strict"

module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define('Transaction', {
            // if value is null then this record was put into database in order to mark actual cached range
            value: { type: DataTypes.BIGINT(80), defaultValue: null },
            transactionHash: { type: DataTypes.STRING(66), defaultValue: null },
            from: { type: DataTypes.STRING(42), allowNull: false },
            to: { type: DataTypes.STRING(42), allowNull: false },
        },
        {
            // don't add the timestamp attributes (updatedAt, createdAt)
            timestamps: false
        }
    )

    Transaction.associate = (models) => {
        models.Transaction.belongsTo(models.Block, {
            onDelete: "CASCADE",
            foreignKey: {
                allowNull: false
            }
        })
    }

    return Transaction
}