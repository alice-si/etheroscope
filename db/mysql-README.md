### Etheroscope backend setup with MYSQL
You need to set your api connector and geth database path in `api/parity.js` file.
Geth database can be accessed only by one process,
so you can make to geths instances one with `fast sync` for api connector
and one with `archive sync`,
wich creates database for Eth-storage module.

You need to set your mysql connection in `db/db.js` file.

You need to make tables in your database like in `mysql-dbschema.ddl`.
//TODO check if db.loadSchema() works

You need to addBlocks to your database running `mysql-add-blocks.js`.
(you can simply change start and end block in code)

To get resonable timestamps for blocks in quick way
 run `mysql-update-block-times.js`.
(its not generating real timestamps but similar, like on Rinkeby)
//TODO check if cacheBlocks.js works (if yes it is probably slow)

(You don`t need to add anything to 'contracts' table)

### TODO
Adding Truffle method to index mappings, currently charts
are always made for variable at index 0

Changing Eth-storage results handling
to stop searching for datapoints when contract start block found
