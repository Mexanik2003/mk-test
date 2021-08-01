const Router = require('koa-router');
let router = new Router();
const { getData, setData } = require('./middlewares/router');

router.get('/',getData);
router.post('/lessons', setData);

module.exports = {
    router
};