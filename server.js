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
        res.status(404).send();
    } else {
        res.json(matchedTodo);
    }
});


// POST
app.post('/todos', function(req, res){
    var body = _.pick(req.body, 'description', 'completed');
    
    if(!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
        return res.status(400).send();
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

app.listen(PORT, function() {
    console.log('Express listening on port ' + PORT + '!');
});