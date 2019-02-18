"use strict";

/*
previously:
create table if not exists contractLookupHistory(
    contractHash VARCHAR(40)  not null,
    date datetime,
    primary key (contractHash, date)
);

now:
CREATE TABLE IF NOT EXISTS `ContractLookups` (
    `id`            INTEGER NOT NULL auto_increment ,
    `date`          DATETIME NOT NULL,
    `ContractHash`  VARCHAR(40),
     PRIMARY KEY (`id`),
     FOREIGN KEY (`ContractHash`) REFERENCES `Contracts` (`hash`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
*/

module.exports = (sequelize, DataTypes) => {
    const ContractLookup = sequelize.define(
        'ContractLookup',
        {date: {type: DataTypes.DATE, allowNull: false}},
        {timestamps: false}
    );

    ContractLookup.associate = function (models) {
        models.ContractLookup.belongsTo(models.Contract, {
            onDelete: "CASCADE",
            foreignKey: {
                allowNull: false
            }
        });
    };

    return ContractLookup;
};