const Router = require('koa-router');
let router = new Router();

router.get('/', async (ctx, next) => {
    ctx.body = getData();
});

router.post('/lessons', async (ctx, next) => {
    ctx.body = setData();
});

function getData() {
    return "getData";
    console.log("getData");
}

function setData() {
    return "setData";
    console.log("setData");
}

module.exports = {
    router
};