module.exports = function (db) {
    return {
        // Middleware route handler
        requireAuthentication: function (req, res, next) {
            var token = req.get('Auth');
            
            db.user.findByToken(token).then(function (user) {
                req.user = user;
                next();
            }, function () {
                res.status(401).send();
                // 'next' is not called - the process stops and the private code is not run
            });
        }
    };
};