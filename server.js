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
});

// PUT /todos/:id
app.put('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    var body = _.pick(req.body, 'description', 'completed');
    var attributes = {};

    //  1 - Validate 'completed'
    if (body.hasOwnProperty('completed')) {
        // Attribute present and valid format
        attributes.completed = body.completed;
    }

    // 2 - Validate 'description'
    if (body.hasOwnProperty('description')) {
        // Attribute present and valid format
        attributes.description = body.description;
    }

    // 3 - Update todo
    //  /!\ Here, an INSTANCE method is used, and not a MODEL method as before
    db.todo.findById(todoId)
        .then(function (todo) {
            if (todo) {
                todo.update(attributes)
                    .then(function (todo) { // Same todo as before but updated
                        res.json(todo.toJSON());
                    }, function (e) {
                        res.status(400).json(e); // If an error occur with the 'update' method
                    });
            } else {
                res.status(404).send();
            }
        }, function () { // If an error occur with the 'findById' method
            res.status(500).send();
        });
});

// Attach the database here
db.sequelize.sync().then(function () {
    app.listen(PORT, function () {
        console.log('Express listening on port ' + PORT + '!');
    });
})