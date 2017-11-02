/* global expect, describe, it */
let Parity = require('../../api/parity')
describe('Parity Unit Tests', function () {
  describe('ParitySanityCheck', function () {
    it('checks test library is functioning', function (done) {
      expect(1).toBe(1)
      done()
    })
  })
  describe('Parity Module loading', function () {
    it('checks module is loaded', function (done) {
      expect(Parity).toBeDefined()
      done()
    })
  })
  describe('Parity Module loading', function () {
    it('checks module is loaded', function (done) {
      let address = '0xBd897c8885b40d014Fb7941B3043B21adcC9ca1C'
      Parity.getContract(address).then((result) => {
        console.log(result)
      })
    })
  })
})
