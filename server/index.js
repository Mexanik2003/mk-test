require('dotenv').config();
const Koa = require('koa');
// const cors = require('koa-cors');
let app = new Koa();

const { router } = require('./router.js');
const bodyParser = require('koa-bodyparser');

// const multer = require('koa-multer');

// app.use(cors({
//     headers: ['Origin, X-Requested-With, Content-Type, Accept'],
//     methods: ['GET', 'POST']
// }));

app.use(bodyParser());
// app.use(async ctx => {
//     // the parsed body will store in ctx.request.body
//     // if nothing was parsed, body will be an empty object {}
//     ctx.body = ctx.request.body;
// });
//app.use(multer);

app.use(router.routes())
app.use(router.allowedMethods());
app.listen(process.env.PORT);