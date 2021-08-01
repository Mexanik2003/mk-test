require('dotenv').config();
const Koa = require('koa');
// const cors = require('koa-cors');
let app = new Koa();

const { router } = require('./router.js');

// const multer = require('koa-multer');
// const bodyparser = require('koa-bodyparser');

// app.use(cors({
//     headers: ['Origin, X-Requested-With, Content-Type, Accept'],
//     methods: ['GET', 'POST']
// }));

//app.use(bodyparser);
//app.use(multer);

app.use(router.routes())
app.use(router.allowedMethods());
app.listen(process.env.PORT);