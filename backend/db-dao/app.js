const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


app.listen(port, () =>
    f().then(value => console.log(`Example app listening on port ${port}!`))
)



async function f() {
    let dao = await require('./db');
    await sleep(3000)
    let result = await dao.getContracts();
    console.log("\n\n#1 -> " + result)
    await dao.addContracts(
            [
                {hash: '1', name: 'ch', abi: 'hw'},
                {hash: '2', name: 'wd', abi: 'dp'},
                {hash: '3', name: 'pp', abi: 'toIdeaUlic'},
            ]
        );

    let result2 = await dao.getContracts();
    console.log("\n\n#2 ->" + result2);
    // console.log(result2);

    await dao.addContractLookup(result2[0].hash);
    await dao.addContractLookup(result2[0].hash);
    await dao.addContractLookup(result2[1].hash);

    let result3= await dao.getPopularContracts(2, 1);
    console.log("\n\n#3 ->" + result3);
    console.log(result3);

    // result3= await dao.getContract(result2[0].hash)
    // console.log("\n\n#3 ->" + result3);
    // console.log(result3);
}