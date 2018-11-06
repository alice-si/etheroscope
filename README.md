## Etheroscope
### An Ethereum-based smart contract visualiser
Etheroscope helps you monitor the state of smart contract variables over time.

### To install backend on Linux
```shell
cd dev-scripts
./installDependencies.sh
./setupDockerAndMysql.sh

# produce more data in blockchain
./syncFastBlockchain.sh
./syncFullBlockchain.sh
```

### To run this project on Linux
```shell
cd dev-scripts
./startRPCAPI.sh
./startMysql.sh
./startBackend.sh
./startFrontend.sh
go localhost:8090
```

### To install backend on Windows
install Node.js<br>
install Geth https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum<br>
install Docker
```shell
npm install
cd dev-scripts
docker-compose up
# (if docker-compose up doesn`t work install MariaDB on docker in other way, then set ports)
node mysql-scripts setupNewDatabase.js

# produce more data in blockchain
geth --datadir ../geth-blockchains/fastRinkebyBlockchain console --rinkeby
geth --datadir ../geth-blockchains/fullRinkebyBlockchain console --rinkeby --gcmode archive
```

### To run this project on Windows
```shell
cd dev-scripts
docker-compose up # run your MariaDB on Docker
geth --datadir ../geth-blockchains/fastRinkebyBlockchain console --rinkeby --rpc --nodiscover
node ../server.js
node ../services/index.js
ng serve --port 8090 # alias ng="C:/Users/ja1/AppData/Roaming/npm/node_modules/@angular/cli/bin/ng"
go localhost:8090
```

### Etheroscope backend setup with MYSQL
###### Etheroscope needs Geth RPC API (WEB3) and database(LevelDB) with blockchain creted by Geth
You need to set your api connector and geth database path in `api/parity.js` file.
Geth database can be accessed only by one process,
so you can create to databases with blockchain one with `fast sync` for RPC API
and one with `archive sync` (`--gcmode archive`),
wich creates database for Eth-storage module (quick history searching).

###### Etheroscope needs MYSQL Database for storing app data.
You need to set your mysql connection in `db/db.js` file.

Best way to install MYSQL is to run Docker command `docker-compose up` in
folder with `.yml` file https://github.com/alice-si/etheroscope/blob/ZPP/dev-scripts/docker-compose.yml.

Then:<br>
Run `dev-srcipts/mysql-scripts/setupMysql.js` to setup new database ready for etheroscope.

Alternativley you can do the same using 3 scripts: <br>
You need to create database running `dev-scripts/mysql-scripts/createDatabase.js`.<br>
You need to create tables in your database running `dev-scripts/mysql-scripts/createTables.js`.<br>
Run second time `dev-scripts/mysql-scripts/createTables.js`.<br>
You need to addBlocks to your database running `dev-scripts/mysql-scripts/addBlocksWIthTimestamps.js`.<br>
(its not generating real timestamps for blocks but similar, like on Rinkeby)<br>
//TODO check if cacheBlocks.js works (if yes it is probably slow)
(You don`t need to add anything to 'contracts' table)

