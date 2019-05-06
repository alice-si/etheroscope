"use strict";

/*
CREATE TABLE IF NOT EXISTS `Blocks` (
    `number`    BIGINT NOT NULL,
    `timeStamp` BIGINT NOT NULL,
    PRIMARY KEY (`number`)
) ENGINE=InnoDB;
*/

module.exports = (sequelize, DataTypes) => {
    const Block = sequelize.define('Block', {
            number: {type: DataTypes.BIGINT, allowNull: false, primaryKey: true},
            timeStamp: {type: DataTypes.BIGINT, allowNull: false},
        },
        {
            // don't add the timestamp attributes (updatedAt, createdAt)
            timestamps: false
        }
    );

    Block.associate = function (models) {
        models.Block.hasMany(models.DataPoint);
    };
    return Block;
};

