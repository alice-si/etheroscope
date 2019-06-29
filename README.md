## Etheroscope
### An Ethereum-based smart contract visualiser
Etheroscope helps you monitor the state of smart contract variables over time.<br>
Video presentation:<br>
https://www.youtube.com/watch?v=eLNDXLViJZ8 <br>
https://www.youtube.com/watch?v=dBDGcbk6F4Q <br>

### To install backend on Linux
```shell
cd dev-scripts/local-work
./installDependencies.sh
```

### To run this project on Linux
```shell
# in 1 terminal
cd backend
sh startBackend 
# in 2. terminal
cd frontend
sh startFrontend
```
go to localhost:8090


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
