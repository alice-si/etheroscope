const parity = require('../../../devServer/service/parity')

// Test addresses
let alice = '0xBd897c8885b40d014Fb7941B3043B21adcC9ca1C'

describe('devServer/service/parity.js: ', function () {
  describe('getContract() ', function () {
    it('contract for alice contains correct variables', function (done) {
      parity.getContract(alice)
      .then(function (contract) {
        var uintItems = []
        contract.abi.forEach(function (item) {
          if (item.outputs && item.outputs.length === 1 &&
            item.outputs[0].type.indexOf('uint') === 0 &&
            item.inputs.length === 0) {
            uintItems.push(item)
          }
        })
        expect(uintItems).toEqual([
          { constant: true,
            inputs: [],
            name: 'total',
            outputs: [ { name: '', type: 'uint256' } ],
            payable: false,
            type: 'function' } ])
        done()
      }).catch(function (err) {
        fail('Unexpected error ' + err.message)
        done()
      })
    })
    it('incorrect address throws error', function (done) {
      parity.getContract('X')
      .then(function (contract) {
        fail('Invalid contract address should throw an error')
        done()
      }).catch(function (err) {
        expect(err.message).not.toBe(null)
        done()
      })
    })
  })
})
