const db = require('knex')({
    client: 'pg',
    connection: {
      host : process.env.PGHOST,
      user : process.env.PGUSER,
      password : process.env.PGPASSWORD,
      database : process.env.PGDATABASE
    }
});


defResponse = {
    id : 9,                 // id занятия
    date: '2019-09-01',     // Дата занятия
    title: 'Orange',        // Тема занятия
    status: 1,              // Статус занятия
    visitCount: 3,          // Количество учеников, посетивших занятие (по полю visit)
    students: [             // Массив учеников, записанных на занятие
        { 
            id: 1,          // id ученика
            name: 'Ivan',   // имя
            visit: true,
        }
    ],
    teachers: [             // Массив учителей, ведущих занятие
        { 
            id: 1,          // id учителя
            name: 'Tanya'   // имя
        }
    ]
}

function getLessonsList(searchParams) {
    if (!searchParams.page) {searchParams.page = 1}
    if (!searchParams.lessonsPerPage) {searchParams.lessonsPerPage = 5}
    offset = (searchParams.page - 1) * searchParams.lessonsPerPage;
    let answer = db.select('lessons.*', db.raw('(select count(visit) as "visitCount" from lesson_students ls where visit = true and lesson_id = lessons.id group by lesson_id)'))
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
    })
    console.log(answer.toString());
    return answer;
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


    
    