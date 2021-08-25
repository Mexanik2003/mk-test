require('dotenv').config();
const Koa = require('koa');
let app = new Koa();

const { router } = require('./router.js');
const bodyParser = require('koa-bodyparser');

app.use(bodyParser());

app.use(router.routes())
//app.use(router.allowedMethods());
const server = app.listen(process.env.PORT);

module.exports = server; // для тестирования