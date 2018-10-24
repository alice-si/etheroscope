### Etheroscope backend setup with MYSQL
You need to set your api connector and geth database path in api/parity.js file.

You need to set your mysql connection in db/db.js file.

You need to make tables in your database like in mysql-dbschema.ddl.
//TODO check if db.loadSchema() works

You need to addBlocks to your database running mysql-add-blocks.js.
(you can simply change start and end block in code)

To get resonable timestamps for blocks in quick way run mysql-update-block-times.
(its not genereting real timestamps but similar, like oon Rinkeby)
//TODO check if cacheBlocks.js works (if yes it is probably slow)

### TODO
Adding Truffle method to index mappings, currently charts
are always made for variable at index 0

Changing Eth-storage results handling
to stop searching for datapoints when contract start block found