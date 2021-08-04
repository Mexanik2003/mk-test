const db = require('knex')({
    client: 'pg',
    connection: {
      host : process.env.PGHOST,
      user : process.env.PGUSER,
      password : process.env.PGPASSWORD,
      database : process.env.PGDATABASE
    }
});


async function getLessonsList(searchParams) {
    if (!searchParams.page) {searchParams.page = 1}
    if (!searchParams.lessonsPerPage) {searchParams.lessonsPerPage = 5}
    offset = (searchParams.page - 1) * searchParams.lessonsPerPage;
    let data = {};
    try {
        data = await db.select('lessons.*', db.raw('(select count(visit) as "visitCount" from lesson_students ls where visit = true and lesson_id = lessons.id group by lesson_id)'))
            .from('lessons').offset(offset).limit(searchParams.lessonsPerPage).where((builder) => {
                if (searchParams.date) {
                    let { date } = searchParams;
                    let dateArr = date.split(',');
                    if (dateArr.length < 2) {
                        builder.where('date',searchParams.date);
                    } else {
                        let maxDate, minDate;
                        if (Date.parse(dateArr[1]) >= Date.parse(dateArr[0])) {
                            maxDate=dateArr[1];
                            minDate=dateArr[0];
                        } else {
                            maxDate=dateArr[0];
                            minDate=dateArr[1];
                        }
                        builder.where('date', '>=', minDate);
                        builder.where('date', '<=', maxDate);
                    }
                }
            if (searchParams.status) builder.andWhere('status',searchParams.status);
            if (searchParams.teacherIds)  {
                builder.whereIn('id', function() {
                    this.select('lesson_id').from('lesson_teachers').whereIn('teacher_id',searchParams.teacherIds.split(','));
                });
            }
            if (searchParams.studentsCount) {
                let { studentsCount } = searchParams;
                if (Number(studentsCount)) {
                    builder.whereIn('id', function() {
                        this.select('lesson_id').from('lesson_students').groupBy('lesson_id')
                            .havingRaw('COUNT (student_id) = ' + studentsCount);
                    });
                } else {
                    const studentsCountArr = studentsCount.split(',');
                    builder.whereIn('id', function() {
                        this.select('lesson_id').from('lesson_students').groupBy('lesson_id')
                            .havingRaw('COUNT (student_id) between ' + Math.min.apply(null, studentsCountArr) + ' and ' + Math.max.apply(null, studentsCountArr));
                    });
                }
            }
        });

        for (key in data) {
            let query = await db.select('st.*', 'ls.visit').from({st: 'students', ls: 'lesson_students'})
                .whereRaw('st.id = ls.student_id')
                .andWhere('ls.lesson_id', data[key].id);
            data[key].students = query;
            query = await db.select('t.*').from({t: 'teachers', lt: 'lesson_teachers'})
                .whereRaw('t.id = lt.teacher_id')
                .andWhere('lt.lesson_id', data[key].id);
            data[key].teachers = query;
            //console.log(key);
        }

    } catch (err) {
        return returnErr (err);
    }
    const answer = {};
    answer.data = data;
    answer.status = 200;
    return answer;
}

function returnErr (err) {
    const result = {};
    result.data=err.routine;
    result.status=400;
    return result;
}



async function createLessons(lessonParams) {
    let data = [];

    try {

        if (!lessonParams.teacherIds) return returnErr({routine: "No teachers"});
        if (!lessonParams.firstDate) return returnErr({routine: "No firstDate"});
        if (!lessonParams.title) return returnErr({routine: "No title"});
        if (!lessonParams.days) return returnErr({routine: "No days"});
        if (!lessonParams.lastDate) lessonParams.lastDate = "'9999-12-31'";

        // Даем приоритет параметру lessonsCount
        if (!lessonParams.lessonsCount) {
            lessonParams.lessonsCount = 300;
        } else {
            lessonParams.lastDate = "'9999-12-31'";
        }

        console.log('lessonParams');
        console.log(lessonParams);

        let firstDate = new Date;
        if (!lessonParams.firstDate) {
            firstDate = new Date();
        } else {
            firstDate = new Date(Date.parse(lessonParams.firstDate.substr(1,lessonParams.firstDate.length - 2) + 'T00:00:00.000Z'));
        }
        console.log('firstDate');
        console.log(firstDate);

        const lastDate = new Date(Date.parse(lessonParams.lastDate.substr(1,lessonParams.lastDate.length - 2) + 'T00:00:00.000Z'));
        console.log('lastDate');
        console.log(lastDate);
        
        let firstZeroDate = new Date;
        cloneDate(firstDate, firstZeroDate);
        firstZeroDate.setDate(firstZeroDate.getDate() - firstZeroDate.getDay());
        let lastLessonDate = new Date;
        cloneDate(firstZeroDate, lastLessonDate);
        console.log('firstZeroDate');
        console.log(firstZeroDate);
        console.log('lastLessonDate');
        console.log(lastLessonDate);

        // console.log(lessonParams.firstDate);
        // lastLessonDate.setDate(firstDate.getDate() + 2);
        // console.log(lastLessonDate);
        // console.log((+lastLessonDate - +firstDate)/86400/1000);
        // console.log('---');
        // console.log(firstDate);
        // console.log(firstDate.getDay());
        // firstDate.setDate(firstDate.getDate() - firstDate.getDay());
        // console.log(firstDate);
        // console.log(firstDate.getDay());
        // console.log('---');

        let days = JSON.parse(lessonParams.days);
        let count = 1;
        let week = 0;
        let lessonsArr = [];
        while (validateLessonDate (count, lessonParams.lessonsCount, lastLessonDate, lastDate, firstDate)) {
            console.log('------');
            console.log('Week: ' + week);
            console.log('firstZeroDate');
            cloneDate(firstZeroDate, lastLessonDate);
            console.log(firstZeroDate);
            console.log(lastLessonDate);
            days.forEach((day) => {
                lastLessonDate.setDate(firstDate.getDate() + +day);
                if (
                    validateLessonDate (count, lessonParams.lessonsCount, lastLessonDate, lastDate, firstDate) && 
                    firstDate <= lastLessonDate
                ) {
                    console.log('day of week: ' + day);
                    console.log('lesson ord: ' + count);
                    console.log(lastLessonDate);
                    lessonsArr.push({
                        title: lessonParams.title,
                        date:  lastLessonDate.getUTCFullYear() + '-' + ('0' + (lastLessonDate.getUTCMonth()+1)).slice(-2) + '-' + ('0' + lastLessonDate.getUTCDate()).slice(-2),
                       status: 0,
                        teacherIds: JSON.parse(lessonParams.teacherIds)
                    })
                    addNewLesson();
                    count++;
                }
            });

            week++;
            firstZeroDate.setDate(firstZeroDate.getDate() + 7);
        }

        data = lessonsArr;
        

        // for (let i = 0; i < lessonParams.lessonsCount; i++) {
        //     const data = await db('lessons').insert({
        //         date: '2000-01-01',
        //         title: lessonParams.title.substr(1,lessonParams.title.length - 2),
        //         status: '1'
        //     });
        // }
    } catch (err) {
        return returnErr (err);
    }

    const answer = {};
    answer.data = data;
    answer.status = 200;
    return answer;

}

function cloneDate (dateFrom, dateTo) {
    dateTo.setUTCFullYear(dateFrom.getUTCFullYear());
    dateTo.setUTCMonth(dateFrom.getUTCMonth());
    dateTo.setUTCDate(dateFrom.getUTCDate());
    dateTo.setUTCHours(dateFrom.getUTCHours());
    dateTo.setUTCMinutes(dateFrom.getUTCMinutes());
    dateTo.setUTCSeconds(dateFrom.getUTCSeconds());
    dateTo.setUTCMilliseconds(dateFrom.getUTCMilliseconds());
}

function addNewLesson (lesson) {

}

function validateLessonDate (count, lessonsCount, lastLessonDate, lastDate, firstDate) {
    if (
        count <= lessonsCount &&
        count <=300 &&
        lastLessonDate <= lastDate &&
        (+lastLessonDate - +firstDate)/86400000 <= 365
    ) {
        return true;
    }

}

function convertDateToUTC(date) { return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); }



module.exports = {
    getLessonsList,
    createLessons
}


    
    