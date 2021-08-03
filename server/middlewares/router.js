const { getLessonsList, defResponse} = require('../db');


const getData = async (ctx, next) =>  {
    const result = await getLessonsList(ctx.request.query);
    ctx.status = result.status;
    ctx.body = result.data;
    //ctx.status = result.status;
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
