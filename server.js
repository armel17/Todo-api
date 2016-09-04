var express = require('express');
var bodyParser = require('body-parser');

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
    var todoId = req.params.id;
    var todoReq;
    
    todos.forEach(function(item) {
        if (item.id == todoId) {
                todoReq = item;
            }
    });
    
    //res.send('Asking for todo with id of ' + req.params.id);
    
    if(!todoReq) {
        res.status(404).send();
    } else {
        res.json(todoReq);
    }
});


// POST
app.post('/todos', function(req, res){
    var body = req.body;
    
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