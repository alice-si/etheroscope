###To start etheroscope backend setup with MYSQL
You need to set your api connector and geth database path in api/parity.js file.

You need to set your mysql connection in db/db.js file.

You need to make tables in your database like in mysql-dbschema.ddl.
//TODO check if db.loadSchema() works

You need to addBlocks to your database running mysql-add-blocks.js.

To get resonable timestamps for blocks in quick way run mysql-update-block-times.
(its not genereting real timestamps but similar)
//TODO check if cacheBlocks.js works (if yes it is probably slow)



