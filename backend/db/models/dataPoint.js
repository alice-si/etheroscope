"use strict";

/*
previously:
create table if not exists dataPoints(
    contractHash VARCHAR(40) not null,
    variableName VARCHAR(50) not null,
    blockNumber  BIGINT      not null,
    value        VARCHAR(78) not null,
    primary key (contractHash, variableName, blockNumber),
    foreign key (contractHash) references contracts(contractHash),
    foreign key (blockNumber) references blocks(blockNumber),
    foreign key (contractHash, variableName) references variables(contractHash, variableName)
);

now:
CREATE TABLE IF NOT EXISTS `DataPoints` (
    `id`            INTEGER NOT NULL auto_increment ,
    `value`         VARCHAR(80) NOT NULL,
    `BlockNumber`   BIGINT,
    `VariableId`    INTEGER NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`BlockNumber`) REFERENCES `Blocks` (`number`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`VariableId`) REFERENCES `Variables` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
*/

module.exports = (sequelize, DataTypes) => {
    const DataPoint = sequelize.define('DataPoint', {
            value: {type: DataTypes.STRING(80), allowNull: false},
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