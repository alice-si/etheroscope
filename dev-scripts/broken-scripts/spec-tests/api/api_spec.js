/* global expect, describe, it */
let api = require('../../../../backend/api')
describe('API endpoint Unit Tests', function () {
  describe('APISanityCheck', function () {
    it('checks test library is functioning', function (done) {
      // Intentionally fail
      expect(1).toBe(1)
      done()
    })
  })
  describe('API Module loading', function () {
    it('checks module is loaded', function (done) {
      expect(api).toBeDefined()
      done()
    })
  })
})
