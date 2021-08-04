const { getLessonsList, createLessons} = require('../db');


const getData = async (ctx, next) =>  {
    const result = await getLessonsList(ctx.request.query);
    ctx.status = result.status;
    ctx.body = result.data;
    //ctx.status = result.status;
    next();
}

const setData = async (ctx, next) =>  {
    const result = await createLessons(ctx.request.query);
    ctx.status = result.status;
    ctx.body = result.data;
    next();
}

module.exports = {
    getData,
    setData
}
