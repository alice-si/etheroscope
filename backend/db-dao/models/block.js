"use strict";

/*
previously:
create table if not exists blocks(
    blockNumber BIGINT   not null,
    timeStamp   BIGINT   not null,
    userLog     BIT      not null,
    primary key (blockNumber)
);

now:
CREATE TABLE IF NOT EXISTS `Blocks` (
    `number`    BIGINT NOT NULL,
    `timeStamp` DATETIME NOT NULL,
    PRIMARY KEY (`number`)
) ENGINE=InnoDB;
*/

module.exports = (sequelize, DataTypes) => {
    const Block = sequelize.define('Block', {
            number: {type: DataTypes.BIGINT, allowNull: false, primaryKey: true},
            timeStamp: {type: DataTypes.DATE, allowNull: false},
            // userLog: DataTypes.BOOLEAN // todo  not sure
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

