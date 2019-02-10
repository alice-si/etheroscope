let Mocha = require('mocha'),
    path = require('path');

// Instantiate a Mocha instance.
let mocha = new Mocha({
    ui: 'tdd',
    reporter: 'list'
});

let testDir = './';

console.log(

    path.join(testDir, 'types.js'),
)
mocha.addFile(
    path.join(testDir, 'mochaTests/formatterTest.js'),
    // path.join(testDir, 'types.js')
);

// Run the tests.
mocha.run(failures => {
    process.on('exit', () => {
        process.exit(failures)  // exit with non-zero status if there were failures
    })
});