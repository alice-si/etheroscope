async function doStuff() {
    // ...
}
// doStuff is defined inside the module so we can call it wherever we want
//
// https://codeburst.io/how-to-test-javascript-with-mocha-the-basics-80132324752e
//
// Export it to make it available outside
module.exports.doStuff = doStuff;