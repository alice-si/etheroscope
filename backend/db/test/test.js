const assert = require('assert');
let dao;

// function runAllTests() {

describe('db tests', function () {
    this.timeout(0);
    it('test connection then rest of tests', async function () {
        dao = await require('..');

        describe('#getContracts()', function () {
                it('empty db', async function () {
                        let result = await dao.getContracts();
                        assert.deepEqual(result, []);
                    }
                )
            }
        )

        describe('#addContracts()', function () {
                it('empty db', function () {
                        dao.addContracts(
                            [
                                {hash: '1234567890123456', name: 'ch', abi: 'hw'},
                                {hash: '2', name: 'w', abi:''},
                                {hash: '3', name: 'hh', abi: 'toIdeaUlic'},
                            ]
                        ).then( () =>
                            dao.getContracts().then(result => assert.deepEqual(result, [
                                {hash: '1234567890123456', name: 'ch', abi: 'hw'},
                                {hash: '2', name: 'w', abi:''},
                                {hash: '3', name: 'hh', abi: 'toIdeaUlic'},
                            ]))
                        );

                    }
                )
            }
        )


    })
});
// }