// UNFINISHED AND NOT WORKING - ET

var mock = {}
mock.ContractApp = (function () {
  var klass = function(){}
  klass.get = function(str, func){}
  return klass
})

const contract = require('../../../devServer/controller/contract')(app);

// Original template code by WW
describe('Contract api', function () {
  describe('test', function () {
    it('works', function (done) {
      expect(1).toBe(1)
      contract
      done()
    })
  })
})

describe('devServer/controller/contract.js', function () {
  describe('explore', function () {
    it('contract json returned is not null for known contract', function (done) {
      // TODO
      done()
    })
    it('contract json returned is correct contract for known contract', function (done) {
      // TODO
      done()
    })
  })
})
