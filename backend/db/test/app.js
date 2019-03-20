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
    let dao = await require('..');
    await sleep(3000)

    // let result = await dao.getContracts();
    // console.log("\n\n#1 -> " + result)

    await dao.addContracts(
        [
            {hash: '1', name: 'c', abi: 'h'},
            {hash: '2', name: 'd', abi: 'p'},
            {hash: '3', name: 'a', abi: 'toIUc'},
        ]
    );

    let result2 = await dao.getContracts();
    // re``
    // console.log("\n\n#2 ->" + result2);
    // console.log(result2[0]);

    await dao.addContractLookup(result2[0].hash);
    await dao.addContractLookup(result2[0].hash);
    await dao.addContractLookup(result2[1].hash);

    // let result3 = await dao.getPopularContracts(2, 1);
    // console.log("\n\n#3 ->" + result3);
    // console.log(result3);

    // result3= await dao.getContract(result2[0].hash)
    // console.log("\n\n#3 ->" + result3);
    // console.log(result3);

    let result4 = await dao.addVariables([{
        ContractHash: '1',
        name: 'namenameVariable',
        cachedFrom: '420',
        cachedUpTo: '422',
        /*UnitId:'1',*/
    }, {
        ContractHash: '2',
        name: 'namename22',
        cachedFrom: '420',
        cachedUpTo: '422',
        /*UnitId:'1',*/
    }, {
        ContractHash: '2',
        name: 'namename23',
        cachedFrom: '420',
        cachedUpTo: '422',
        /*UnitId:'1',*/
    },

    ]);

    // console.log(result4[0].ContractHash)
    let result5 = await dao.getVariables(2)
    // result5.forEach(x => console.log(x.ContractHash));
    var arr = [];
    let mp = [];
    for (var i = 1; i < 1000; i++) {
        await sleep(1);
        // console.log(Date.now())
        arr.push({number: i, timeStamp: Date.now()})
        mp.push(['ignored value', i, i])
    }
    let result6 = await dao.addBlocks(arr);
    let result7 = await dao.getBlockTime(1)
    let result8 = await dao.getBlockTime(990)
    let result9 = await dao.getLatestCachedBlock()
    let result10 = await dao.getCachedFromTo(2, 'namename22')
    let result11 = await dao.updateContractABI(2, 'tutaj')
    let result12 = await dao.searchContract('0x2');
    let result13 = await dao.addDataPoints('2', 'namename22', mp, 10, 55);
    let result14 = await dao.getDataPoints('2', 'namename22');
    let result15 = await dao.getDataPointsInBlockNumberRange('2', 'namename22', 1, 2);
    // console.log(result6)
    // console.log(result7.getTime());
    // console.log(result8.getTime());
    // console.log(result11);
    // let result12  = await dao.getContracts();
    // console.log(result12);
    // console.log(result13);
    // console.log(result14[1].Block.number);
    // console.log(result15);
}