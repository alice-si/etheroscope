'use strict';

/*
previously:
create table if not exists contracts(
    contractHash VARCHAR(40)  not null,
    name         VARCHAR(128),
    abi          NVARCHAR(11844),
    primary key (contractHash)
);

now:
CREATE TABLE IF NOT EXISTS `Contracts` (
    `hash`      VARCHAR(40) NOT NULL ,
    `name`      VARCHAR(255),
    `abi`       TEXT,
    PRIMARY KEY (`hash`)
) ENGINE=InnoDB;
 */

module.exports = (sequelize, DataTypes) => {

    const Contract = sequelize.define(
        'Contract',
        {
            hash: {type: DataTypes.STRING(40), allowNull: false, primaryKey: true},
            name: DataTypes.STRING,
            abi: DataTypes.TEXT // not sure
        },
        {
            // don't add the timestamp attributes (updatedAt, createdAt)
            timestamps: false
        }
    );

    Contract.associate = function (models) {
        models.Contract.hasMany(models.ContractLookup);
        models.Contract.hasMany(models.Variable);
    };

    return Contract;
};