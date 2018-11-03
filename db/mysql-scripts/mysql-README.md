### Etheroscope backend setup with MYSQL
You need to set your api connector and geth database path in `api/parity.js` file.
Geth database can be accessed only by one process,
so you can make to geths instances one with `fast sync` for api connector
and one with `archive sync`,
wich creates database for Eth-storage module.

You need to set your mysql connection in `db/db.js` file.

##### Run `setupNewMysqlDatabaseAllInOne.js` to setup new database ready for etheroscope.

##### Alternativley you can do the same using 3 scripts: <br>
You need to create database running `db/mysql-scripts/createDatabase.js`.<br>
You need to create tables in your database running `db/mysql-scripts/createTables.js`.<br>
You need to addBlocks to your database running `db/mysql-scripts/addBlocksWIthTimestamps.js`.<br>
(its not generating real timestamps for blocks but similar, like on Rinkeby)<br>
//TODO check if cacheBlocks.js works (if yes it is probably slow)

(You don`t need to add anything to 'contracts' table)

### TODO
Adding Truffle method to index mappings, currently charts
are always made for variable at index 0

Changing Eth-storage results handling
to stop searching for datapoints when contract start block found
