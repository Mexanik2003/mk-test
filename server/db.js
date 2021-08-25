const { isNumber } = require('lodash');

var types = require('pg').types;
// override parsing date column to Date()
types.setTypeParser(1082, val => val); 

const db = require('knex')({
    client: 'pg',
    connection: {
      host : process.env.PGHOST,
      user : process.env.PGUSER,
      password : process.env.PGPASSWORD,
      database : process.env.PGDATABASE,
      multipleStatements: true
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
                    const teachersIdsArr = searchParams.teacherIds.toString().split(",");
                    if (teachersIdsArr) {
                        this.select('lesson_id').from('lesson_teachers').whereIn('teacher_id',teachersIdsArr);
                    } else {
                        this.select('lesson_id').from('lesson_teachers').where('teacher_id',searchParams.teacherIds);
                    }
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
        })//.toString();
        //console.log(data);

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

async function _createLessons(lessonParams) {
    let data = [];


    const answer = {};
    answer.data = data;
    answer.status = 200;
    return answer;

}

async function createLessons(lessonParams) {
    let data = [];

    try {

        if (!lessonParams.teacherIds) return returnErr({routine: "No teachers"});
        if (!lessonParams.firstDate) return returnErr({routine: "No firstDate"});
        if (!lessonParams.title) return returnErr({routine: "No title"});
        if (!lessonParams.days) return returnErr({routine: "No days"});
        if (!lessonParams.lastDate) lessonParams.lastDate = "9999-12-31";

        // Даем приоритет параметру lessonsCount
        if (!lessonParams.lessonsCount) {
            lessonParams.lessonsCount = 300;
        } else {
            lessonParams.lastDate = "9999-12-31";
        }

        let firstDate = new Date;
        if (!lessonParams.firstDate) {
            firstDate = new Date();
        } else {
            firstDate = new Date(Date.parse(lessonParams.firstDate + 'T00:00:00.000Z'));
        }

        const lastDate = new Date(Date.parse(lessonParams.lastDate + 'T00:00:00.000Z'));
        
        let firstZeroDate = new Date;
        cloneDate(firstDate, firstZeroDate);
        firstZeroDate.setDate(firstZeroDate.getDate() - firstZeroDate.getDay());
        let lastLessonDate = new Date;
        cloneDate(firstZeroDate, lastLessonDate);

        let days = lessonParams.days;
        let count = 1;
        let week = 0;
        let lessonsArr = [];
        while (validateLessonDate (count, lessonParams.lessonsCount, lastLessonDate, lastDate, firstDate)) {
            cloneDate(firstZeroDate, lastLessonDate);
            days.forEach((day) => {
                lastLessonDate.setDate(firstDate.getDate() + +day);
                if (
                    validateLessonDate (count, lessonParams.lessonsCount, lastLessonDate, lastDate, firstDate) && 
                    firstDate <= lastLessonDate
                ) {
                    lessonsArr.push({
                        title: lessonParams.title,
                        date:  lastLessonDate.getUTCFullYear() + '-' + ('0' + (lastLessonDate.getUTCMonth()+1)).slice(-2) + '-' + ('0' + lastLessonDate.getUTCDate()).slice(-2),
                        status: 0,
                    });
                    count++;
                }
            });

            week++;
            firstZeroDate.setDate(firstZeroDate.getDate() + 7);
        }

        data = lessonsArr;

        
    } catch (err) {
        return returnErr (err);
    }

    let lessonTeacherArr = [];
    const lessonsIds = await db.insert(data).returning('id').into('lessons');

    if (process.env.NODE_ENV === 'test') {
        await db('lessons')
            .whereIn('id', lessonsIds)
            .del();
    }
    
    if (lessonParams.teacherIds) {
        lessonsIds.forEach((lesson) => {
            lessonParams.teacherIds.forEach((teacher) => {
                lessonTeacherArr.push({
                    lesson_id: lesson,
                    teacher_id: teacher
                })
            })
        });
    }

    if (process.env.NODE_ENV !== 'test') {
        await db.insert(lessonTeacherArr).into('lesson_teachers');
    }

    const answer = {};
    answer.data = lessonsIds;
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
    createLessons,
}


    
    