var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

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
app.get('/todos', middleware.requireAuthentication, function (req, res) {
    var query = req.query;
    var where = {
        userId: req.user.get('id')
    };

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
app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoId = parseInt(req.params.id, 10);

    // NEW - with persistent database
    db.todo.findOne({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function (matchedTodo) {
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
app.post('/todos', middleware.requireAuthentication, function (req, res) {
    var body = _.pick(req.body, 'description', 'completed');

    // NEW - with persistent database
    db.todo.create(body).then(function (todo) {
        req.user.addTodo(todo).then(function () {
            // Return the updated todo item since we set the user it belongs to
            return todo.reload();
        }).then(function (todo) {
            res.json(todo.toJSON());
        });
    }, function (e) {
        res.status(400).json(e);
    });
});

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoId = parseInt(req.params.id, 10);

    // NEW - Real database
    db.todo.destroy({
        where: {
            id: todoId,
            userId: req.user.get('id')
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
app.put('/todos/:id', middleware.requireAuthentication, function (req, res) {
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
    db.todo.findOne({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function (todo) {
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

// POST /users -- Sign up
app.post('/users', function (req, res) {
    var body = _.pick(req.body, 'email', 'password');
    
    db.user.create(body).then(function(user) {
        res.json(user.toPublicJSON());
    }, function(e) {
        res.status(400).json(e);
    });
});

// POST /users/login -- Sign in
app.post('/users/login', function (req, res) {
    var body = _.pick(req.body, 'email', 'password');
    var userInstance;
    
    db.user.authenticate(body).then(function (user) {
        var token = user.generateToken('authentication');
        userInstance = user;
        
        // Save token in db
        return db.token.create({
            token: token
        });
    }).then(function (tokenInstance) {
        res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
    }).catch(function () {
        res.status(401).send();
    });
});

// DELETE /users/login
app.delete('/users/login', middleware.requireAuthentication, function (req, res) {
    // token has been attached to the request body in the middleware code
    req.token.destroy().then(function () {
        res.status(204).send();
    }).catch(function () {
        res.status(500).send();
    });
});

// Attach the database here
db.sequelize.sync({force: true}).then(function () { //force sequelize to rebuild the db
    app.listen(PORT, function () {
        console.log('Express listening on port ' + PORT + '!');
    });
})