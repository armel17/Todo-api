var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

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
    res.json(todos);
});


// GET /todos/:id
app.get('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {id: todoId});

// OLD    
//    var matchedTodo;
//    
//    todos.forEach(function(item) {
//        if (item.id == todoId) {
//                matchedTodo = item;
//            }
//    });
    
    //res.send('Asking for todo with id of ' + req.params.id);
    
    if(!matchedTodo) {
        res.status(404).send(); // 404 -> Not found
    } else {
        res.json(matchedTodo);
    }
});


// POST /todos
app.post('/todos', function(req, res){
    var body = _.pick(req.body, 'description', 'completed');
    
    if(!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
        return res.status(400).send();  // 400 -> Bad request
    }
    
    body.description = body.description.trim();
    
    // Add id number to the todo
    body.id = todoNextId;
    todoNextId ++;
    
    // Add the new todo to the todo-list
    todos.push(body);
    
    // Send response
    res.json(body);
    
});

// DELETE /todos/:id
app.delete('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {id: todoId});

    if(!matchedTodo) {
        res.status(404).json({"error":"no todo found with that id."});
    } else {
        // Delete the item
        todos = _.without(todos, matchedTodo);
        // Return the deleted item (+ a 200 Status)
        res.json(matchedTodo);
    }
});

// PUT /todos/:id
app.put('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {id: todoId});

    if(!matchedTodo) {
        return res.status(404).json({"error":"no todo found with that id."});
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

app.listen(PORT, function() {
    console.log('Express listening on port ' + PORT + '!');
});