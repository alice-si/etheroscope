const db = require('../db')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function demo() {
    console.log('Taking a break...');
    await sleep(2000);
    console.log('Two seconds later');




    // xd = await db.addContract({
    //     hash: "address.substr(2)",
    //     name: "contractName",
    //     abi: "JSON.stringify(parsedABI)"
    // })
    let xd = await db.addBlock({
        number: 1,
        timeStamp: 3,
    })
    console.log(xd)
     xd = await db.addBlock({
        number: 1,
        timeStamp: 3,
    })
    console.log(xd)
    // xd = await db.addContract({
    //     hash: "2",
    //     name: "contractName",
    //     abi: "JSON.stringify(parsedABI)"
    // })


    // let result4 = await db.addVariables([{
    //     ContractHash: '1',
    //     name: 'namenameVariable',
    //     cachedUpTo: '422',
    //     // UnitId:'1',
    // }, {
    //     ContractHash: '2',
    //     name: 'namename22',
    //     cachedUpTo: '422',
    //     // UnitId:'1',
    // },
    //
    // ]);
    // console.log("ok", result4)

    // await sleep(2000)
    //
    // result4 = await db.addVariables([{
    //     ContractHash: '1',
    //     name: 'namenameVariable',
    //     cachedUpTo: '422',
    //     // UnitId:'1',
    // }, {
    //     ContractHash: '2',
    //     name: 'namename22',
    //     cachedUpTo: '422',
    //     // UnitId:'1',
    // },

    // ]);
    // console.log("ok2", result4)

    //
    // xd = await db.getPopularContracts(10)
    console.log("ok", xd)
    // await db.addContractLookup("address.substr(2)")
    // xd = await db.getPopularContracts(10)
    // console.log("ok", xd)


}

demo();