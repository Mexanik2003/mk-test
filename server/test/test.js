process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();


chai.use(chaiHttp);

describe('/GET lessons', () => {
    it('get all lessons', (done) => {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.not.be.eql(0);
                done();
        });
    });
    it('all params', (done) => {
        const params = 'date=2019-06-17&status=1&teacherIds=1,4&studentsCount=1,4&page=1&lessonsPerPage=10';
        chai.request(server)
            .get('/?'+params)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(1);
                done();
        });
    });
    it('between two dates', (done) => {
        const params = 'date=2019-06-17,2019-09-03';
        chai.request(server)
            .get('/?'+params)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(5);
                done();
        });
    });
    
    it('between two dates vise verse', (done) => {
        const params = 'date=2019-09-03,2019-06-17';
        chai.request(server)
            .get('/?'+params)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(5);
                done();
        });
    });
    
    it('teachersId array', (done) => {
        const params = 'status=1&teacherIds=1,4&studentsCount=1,4&page=1&lessonsPerPage=10';
        chai.request(server)
            .get('/?'+params)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(3);
                done();
        });
    });
    
    it('teachersId is one integer', (done) => {
        const params = 'status=1&teacherIds=4&studentsCount=1,4&page=1&lessonsPerPage=10';
        chai.request(server)
            .get('/?'+params)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(2);
                done();
        });
    });
    
    it('pagination', (done) => {
        const params = 'status=1&teacherIds=1,4&studentsCount=1,4&page=2&lessonsPerPage=2';
        chai.request(server)
            .get('/?'+params)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(1);
                done();
        });
    });
});

describe('/POST lessons', () => {
    it('params from paper', (done) => {
        const params = {
            "teacherIds": [1,2],
            "title": "Blue Ocean",
            "days": [0,1,3,6],
            "firstDate": "2019-09-10",
            "lessonsCount": 9,
            "lastDate": "2019-12-31"
        };
        chai.request(server)
            .post('/lessons')
            .send(params)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(9);
                done();
        });
    });
    it('no date & no count, lesson every day (300 lessons restrict)', (done) => {
        const params = {
            "teacherIds": [1,2],
            "title": "Blue Ocean",
            "days": [0,1,2,3,4,5,6],
            "firstDate": "2019-09-10"
        };
        chai.request(server)
            .post('/lessons')
            .send(params)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(300);
                done();
        });
    });
    it('no date & no count, one lesson per week (1 year restrict)', (done) => {
        const params = {
            "teacherIds": [1,2],
            "title": "Blue Ocean",
            "days": [0],
            "firstDate": "2019-09-10",
        };
        chai.request(server)
            .post('/lessons')
            .send(params)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(53);
                done();
        });
    });
});

