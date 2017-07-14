var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.route('/name').get(function(req, res) {
  res.send('hello');
})
module.exports = router;
