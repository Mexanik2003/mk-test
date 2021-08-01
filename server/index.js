require('dotenv').config();
const Koa = require('koa');
var app = new Koa();

const { router } = require('./router.js');
const { defRequest, defResponse } = require('./db.js'); // данные нужны для роутинга, поэтому импортируем их



app.use(router.routes())
app.use(router.allowedMethods());
app.listen(process.env.PORT);