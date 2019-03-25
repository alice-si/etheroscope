"use strict";

/*
CREATE TABLE IF NOT EXISTS `Variables` (
    `id` INTEGER NOT NULL auto_increment ,
    `ContractHash` VARCHAR(40) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `cachedFrom` BIGINT NOT NULL,
    `cachedUpTo` BIGINT NOT NULL,
    `UnitId` INTEGER,
    UNIQUE `uniqueTag` (`ContractHash`, `name`),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`ContractHash`) REFERENCES `Contracts` (`hash`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`UnitId`) REFERENCES `Units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
*/


module.exports = (sequelize, DataTypes) => {
    const Variable = sequelize.define('Variable', {
            ContractHash: {type: DataTypes.STRING(40), allowNull: false, unique: 'uniqueTag'},
            name: {type: DataTypes.STRING(50), allowNull: false, unique: 'uniqueTag'},
            cachedFrom: {type: DataTypes.BIGINT, allowNull: true},
            cachedUpTo: {type: DataTypes.BIGINT, allowNull: true},
        },
        {
            // don't add the timestamp attributes (updatedAt, createdAt)
            timestamps: false
        }
    );


    Variable.associate = function (models) {
        models.Variable.hasMany(models.DataPoint);

        models.Variable.belongsTo(models.Contract, {
            onDelete: "CASCADE",
            foreignKey: {
                allowNull: false
            }
        });
        models.Variable.belongsTo(models.Unit, {
            onDelete: "CASCADE",
            foreignKey: {
                allowNull: true
            }
        });
    };

    return Variable;
};

