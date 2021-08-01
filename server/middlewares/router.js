const { getLessonsList, defResponse} = require('../db');


const getData = async (ctx, next) =>  {
    ctx.body = await getLessonsList(ctx.request.query);
    next();
}

const setData = async (ctx, next) =>  {
    ctx.body = defResponse;
    next();
}

module.exports = {
    getData,
    setData
}
