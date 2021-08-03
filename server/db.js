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



defRequest = {
    teacherIds: [1,2],      // id учителей, ведущих занятия
    title: 'Blue Ocean',    // Тема занятия. Одинаковая на все создаваемые занятия
    days: [0,1,3,6],        // Дни недели, по которым нужно создать занятия, где 0 - это воскресенье
    firstDate: '2019-09-10',// Первая дата, от которой нужно создавать занятия
    lessonsCount: 9,        // Количество занятий для создания
    lastDate: '2019-12-31', // Последняя дата, до которой нужно создавать занятия.
}

module.exports = {
    getLessonsList,
    defRequest,
    db
}


    
    