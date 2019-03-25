"use strict";

/*
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
