"use strict";

/*
previously:
create table if not exists variableUnits(
    id          BIGINT not null,
    variable    VARCHAR(50) not null, // moze mi to ktos wytlumaczyc sskad to tu i po co
    unit        VARCHAR(50) not null,
    description NVARCHAR(11844),
    primary key (id)
);

now:
CREATE TABLE IF NOT EXISTS `Units`(
    `id` INTEGER NOT NULL auto_increment,
    `unit` VARCHAR(50) NOT NULL,
    `description` TEXT,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB;
*/

module.exports = (sequelize, DataTypes) => {
    const Unit = sequelize.define('Unit', {
            unit: {type: DataTypes.STRING(50), allowNull: false},
            description: DataTypes.TEXT,
        },
        {
            // don't add the timestamp attributes (updatedAt, createdAt)
            timestamps: false
        }
    );

    Unit.associate = function (models) {
        models.Unit.hasMany(models.Variable);
    };

    return Unit;
};
