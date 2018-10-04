var mysql = require('promise-mysql');
var connection;

var connection = mysql.createConnection({
  host     : 'localhost',
  port     : '8083',
  user     : 'root',
  password : 'wp',
  database : 'etheroscope'
}).then(function(conn) {
  connection = conn;
  console.log('Successfully connected to the db.');


  //create();

  connection.end();

}).catch(function(err) {
  console.log('Error connecting to the db: ' + err);
});


function test() {
  connection.query('SELECT 1 + 1 AS solution').then(function(results) {
    console.log('The solution is: ', results[0].solution);
  });
};

function create() {
  connection.query('create table contracts(\n' +
    '    contractHash VARCHAR(40)  not null,\n' +
    '    name         VARCHAR(128),\n' +
    '    abi          TEXT,\n' +
    '    primary key (contractHash)\n' +
    ');').then(function(results) {
    console.log(results);
  });
};






