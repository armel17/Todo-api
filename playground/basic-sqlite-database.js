var Sequelize = require('sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined, {
    'dialect': 'sqlite',
    'storage': __dirname + '/basic-sqlite-database.sqlite'
});

// DEFINE NEW MODEL - Doc on docs.sequelizejs.com
var Todo = sequelize.define('todo', {
    description: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            len: [1, 250]
        }
    },
    completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

// sync() returns a PROMISE, so we can have a callback function using what comes back
sequelize.sync({
    //force: true
}).then(function () {
    console.log('Everything is synced.');
    
    return Todo.findById(1);
    
//    Todo.create({
//        description: 'Walking the dog'
//    }).then(function (todo) {
//        return Todo.create({
//            description: 'Clean office'
//        });
//    // From here, we have 2 items in the database
//    }).then(function(){
//        // return Todo.findById(1);
//        return Todo.findAll({
//            where: {
//                description: {//false
//                    $like: '%clean%'
//                }
//            }
//        });
//    }).then(function(todos){
//        if (todos){
//            todos.forEach(function(todo){
//                console.log(todo.toJSON());
//            })
//        } else {
//            console.log('No todo found!');
//        }
//    }).catch(function(e){
//        console.log(e);
//    });
}).then(function(todo) {
    console.log(todo.toJSON());
});