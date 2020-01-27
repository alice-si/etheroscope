## Etheroscope
### An Ethereum-based smart contract explorer
Etheroscope, works by first identifying which variables are recorded by a smart contract — for example how many donations made to a project are still pending approval by the validator to be paid to the charity — and then immediately gives the current state of that variable.

This makes a huge difference in terms of user experience. To draw an analogy, it’s like looking directly into a bank vault to find out how much money is in there, rather than trying to figure it out by adding and subtracting every single deposit or withdrawal that has ever been made.

Even better, Etheroscope is able to scan over the blockchain, index how those variables have changed over time, and present you with that data in a visual format that is simple and, most importantly, familiar. As a donor on the Alice platform, this means you can find out a wealth of information held in relevant smart contracts, simply by searching for a project’s name. No hashes, no sifting, no headaches.

![etheroscope-screenshot](https://miro.medium.com/max/1222/1*fVzsWs1Nxa0CTx6cD7cepA.png)

### Indexed data storage

Etheroscope stores indexed contract states in a sql database.

The configuration is located in the backend/db/config.js file and depends on the environment.

The credentials for a production deployment are taken from the environment variables:

```shell
production: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOSTNAME,
        dialect: 'mysql',
        operatorsAliases: false,
        logging: false,
    }
```

### Installation on unix-like environment
```shell
cd dev-scripts/local-work
./installDependencies.sh
```

### Runing on unix-like environment
```shell
# in 1 terminal
cd backend
sh startBackend
# in 2. terminal
cd frontend
sh startFrontend
```
go to localhost:8090


### To install&run this project on Windows
```shell
cd dev-scripts
docker-compose up # run your MariaDB on Docker
geth --datadir ../geth-blockchains/fastRinkebyBlockchain console --rinkeby --rpc --nodiscover
node ../server.js
node ../services/index.js
ng serve --port 8090 # alias ng="C:/Users/ja1/AppData/Roaming/npm/node_modules/@angular/cli/bin/ng"
go localhost:8090
```
### Contributions

#### The first stage of the project have been implemented together with the students of Imperial College London

Please check out their [blog post](https://docs.microsoft.com/en-gb/archive/blogs/uk_faculty_connection/etheroscope-a-smart-contract-visualiser) summarising the development.

#### The next stage have been implemented by the students from Warsaw University

A year later another team of students decided to dedicate their two-semester project to upgrade the Ethereoscope optimising the indexing speed and upgrading the UI. Take a look at the videos from the demo day presentations:

##### Caching points online
[![Watch the video](https://img.youtube.com/vi/eLNDXLViJZ8/hqdefault.jpg)](https://www.youtube.com/watch?v=eLNDXLViJZ8)
##### User interface overview
[![Watch the video](https://img.youtube.com/vi/dBDGcbk6F4Q/hqdefault.jpg)](https://www.youtube.com/watch?v=dBDGcbk6F4Q)
