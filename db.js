//
// Code interacting with the database, that will be used by the server.
//

var Sequelize = require('sequelize');
// Setup using environment variables
var env = process.env.NODE_ENV || 'development';
var sequelize;

if (env === 'production') {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres'
    });
} else {
    sequelize = new Sequelize(undefined, undefined, undefined, {
        'dialect': 'sqlite',
        'storage': __dirname + '/data/dev-todo-api.sqlite'
    });
}


// Allows to export multiple things
var db = {};

// Load models from separate file
db.todo = sequelize.import(__dirname + '/models/todo.js');
db.user = sequelize.import(__dirname + '/models/user.js');
// Export Sequelize module and sequelize instance
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;