"use strict";

/*
CREATE TABLE IF NOT EXISTS `DataPoints` (
    `id`            INTEGER NOT NULL auto_increment ,
    `value`         VARCHAR(80),
    `BlockNumber`   BIGINT,
    `VariableId`    INTEGER NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`BlockNumber`) REFERENCES `Blocks` (`number`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`VariableId`) REFERENCES `Variables` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
*/

module.exports = (sequelize, DataTypes) => {
    const DataPoint = sequelize.define('DataPoint', {
            value: {type: DataTypes.STRING, allowNull: true}, // if null then it is a delimiter -> fake datapoint
            // that means this variable is cached up to this block
        },
        {
            // don't add the timestamp attributes (updatedAt, createdAt)
            timestamps: false
        }
    );


    DataPoint.associate = function (models) {
        models.DataPoint.belongsTo(models.Variable, {
            onDelete: "CASCADE",
            foreignKey: {
                allowNull: false
            }
        });
        models.DataPoint.belongsTo(models.Block, {
            onDelete: "CASCADE",
            foreignKey: {
                allowNull: false
            }
        });
    };

    return DataPoint;
};
