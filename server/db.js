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

defRequest = {
    teacherIds: [1,2],      // id учителей, ведущих занятия
    title: 'Blue Ocean',    // Тема занятия. Одинаковая на все создаваемые занятия
    days: [0,1,3,6],        // Дни недели, по которым нужно создать занятия, где 0 - это воскресенье
    firstDate: '2019-09-10',// Первая дата, от которой нужно создавать занятия
    lessonsCount: 9,        // Количество занятий для создания
    lastDate: '2019-12-31', // Последняя дата, до которой нужно создавать занятия.
}

module.exports = {
    defResponse,
    defRequest
}
    
    