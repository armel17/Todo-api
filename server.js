var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

// Middleware class
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Todo API Root!');
});

// GET /todos
app.get('/todos', function (req, res) {
    var query = req.query;
    var where = {};

    // NEW - With real database

    if (query.hasOwnProperty('completed') && query.completed === 'true') {
        where.completed = true;
    } else if (query.hasOwnProperty('completed') && query.completed === 'false') {
        where.completed = false;
    }

    if (query.hasOwnProperty('q') && query.q.trim().length > 0) {
        where.description = {
            $like: '%' + query.q.trim() + '%'
        };
    }

    db.todo.findAll({
            where: where
        })
        .then(function (matchedTodo) {
            res.json(matchedTodo);
        }, function (e) {
            res.status(500).send(e);
        });


    // OLD - with static array
    //    var queryParams = req.query; // Same type as req.body
    //    var filteredTodos = todos;
    //
    //    if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
    //        filteredTodos = _.where(todos, {
    //            completed: true
    //        });
    //    } else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
    //        filteredTodos = _.where(todos, {
    //            completed: false
    //        });
    //    }
    //
    //    if (queryParams.hasOwnProperty('q') && queryParams.q.trim().length > 0) {
    //        filteredTodos = _.filter(filteredTodos, function (num) {
    //            return (num.description.toLowerCase().indexOf(queryParams.q.trim().toLocaleLowerCase()) > -1);
    //        });
    //    }
    //
    //    res.json(filteredTodos);
});


// GET /todos/:id
app.get('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);

    // NEW - with persistent database
    db.todo.findById(todoId)
        .then(function (matchedTodo) {
            if (matchedTodo) {
                res.json(matchedTodo);
            } else {
                res.status(404).send();
            }
        })
        .catch(function (e) {
            res.status(400).send(e);
        });

    // OLD - with static array    
    //    var matchedTodo = _.findWhere(todos, {
    //        id: todoId
    //    });
    //
    //    if (!matchedTodo) {
    //        res.status(404).send(); // 404 -> Not found
    //    } else {
    //        res.json(matchedTodo);
    //    }
});


// POST /todos
app.post('/todos', function (req, res) {
    var body = _.pick(req.body, 'description', 'completed');

    // NEW - with persistent database
    db.todo.create(body).then(function (todo) {
        res.json(todo.toJSON());
    }).catch(function (e) {
        res.status(400).json(e);
    });


    //  OLD - with static array
    //    if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
    //        return res.status(400).send(); // 400 -> Bad request
    //    }
    //
    //    body.description = body.description.trim();
    //
    //    // Add id number to the todo
    //    body.id = todoNextId;
    //    todoNextId++;
    //
    //    // Add the new todo to the todo-list
    //    todos.push(body);
    //
    //    // Send response
    //    res.json(body);

});

// DELETE /todos/:id
app.delete('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);

    // NEW - Real database
    db.todo.destroy({
        where: {
            id: todoId
        }
    }).then(function (rowsDeleted) {
        if (rowsDeleted === 0) {
            res.status(404).json({
                error: 'No todo with id'
            });
        } else {
            res.status(204).send();
        }
    }, function () {
        res.status(500).send();
    });

    // OTHER METHOD:
    //    db.todo.findById(todoId)
    //        .then(function (matchedTodo) {
    //            if (matchedTodo) {
    //                res.json(matchedTodo);
    //                return matchedTodo.destroy({
    //                    force: true
    //                });
    //            } else {
    //                res.status(404).send();
    //            }
    //        })
    //        .catch(function (e) {
    //            res.status(400).send(e);
    //        });

    // OLD - static array
    //    var matchedTodo = _.findWhere(todos, {
    //        id: todoId
    //    });
    //
    //    if (!matchedTodo) {
    //        res.status(404).json({
    //            "error": "no todo found with that id."
    //        });
    //    } else {
    //        // Delete the item
    //        todos = _.without(todos, matchedTodo);
    //        // Return the deleted item (+ a 200 Status)
    //        res.json(matchedTodo);
    //    }
});

// PUT /todos/:id
app.put('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {
        id: todoId
    });

    if (!matchedTodo) {
        return res.status(404).json({
            "error": "no todo found with that id."
        });
    } else {
        var body = _.pick(req.body, 'description', 'completed');
        var validAttributes = {};

        // 1 - Validate 'completed'
        if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
            // Attribute present and valid format
            validAttributes.completed = body.completed;
        } else if (body.hasOwnProperty('completed')) {
            // Bad request
            return res.status(400).send();
        }

        // 2 - Validate 'description'
        if (body.hasOwnProperty('description') && _.isString(body.description) & body.description.trim().length > 0) {
            // Attribute present and valid format
            validAttributes.completed = body.completed;
        } else if (body.hasOwnProperty('description')) {
            // Bad request
            return res.status(400).send();
        }

        // 3 - Update todo
        // OBJECTS are passed by REFERENCE in js (so the matchedTodo is actually refering the one in 'todos')
        _.extend(matchedTodo, validAttributes);
        res.json(matchedTodo);
    }
});

// Attach the database here
db.sequelize.sync().then(function () {
    app.listen(PORT, function () {
        console.log('Express listening on port ' + PORT + '!');
    });
})