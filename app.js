const express = require('express');
const { name } = require('ejs');
const sessions = require('express-session');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const cookieParser = require("cookie-parser");
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const flash = require('connect-flash');

//initializations
const app = express();
const db = new sqlite3.Database('./db/barberia.db');

//Settings
const port = 3000;
app.set('view engine', '.ejs');
const timeEXP = 1000 * 60 * 60 * 24;

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessions({
    secret: 'nbiocnonltaesylor',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: timeEXP}
}));
app.use(cookieParser());
// app.use(flash());

// Global variables
// app.use((req, res, next) => {
//     req.locals.success_msg = req.flash('success_msg');
//     req.locals.error_msg = req.flash('error_msg');
// });

// Static Files
app.use(express.static(__dirname + '/public'));



//Routes
app.get('/', function(req, res) {
    res.render('pages/index');
});

app.get('/login', (req, res) => {
    res.render('pages/login');
});

app.get('/register', (req, res) => {
    res.render('pages/register');
});

app.get('/create', (req, res) => {
    res.render('pages/crearbarberia');
});

app.post('/logicaregister', (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);

    db.run(`INSERT INTO users(name, email, password) VALUES (?, ?, ?) `,
        [name, email, hash],
        function (error) {
            if (!error) {
                console.log("Insert OK");
                res.redirect('login');
            } else {
                console.log("Insert error", error.code);
                if (error.code == "SQLITE_CONSTRAINTS") {
                    return res.send('El usurario ya existe')
                }
                return res.send('Ocurrio algun error');
            }
        }
    )
});

app.post('/logicalogin', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    db.get("SELECT email, password FROM users WHERE email=$email", {
        $email: email
    }, (error, row) => {

        if (error) {
            return res.send('correo o contraseña incorrecta');
        }

        if (row) {
            if (bcrypt.compareSync(password, row.password)) {
                session = req.session;
                session.userid = email;
                return res.redirect('/barberia');
            }
            return res.send('correo o contraseña incorrecta');
        }
        return res.send('correo o contraseña incorrecta');
    })
});

//Mostrar tabla de agenda
app.get('/barberia', (req, res) => {

    session = req.session;

    if (session.userid) {

    db.get("INSERT * FROM agenda WHERE iduser=$id", {
        $id:session.userid
    }, (error, row) => {
        if (!error) {
            return res.render('pages/barberia', {data:row})
        }else {
            return res.send("error")
        }
        
    }) 
}else{
    return res.send("<script>alert('debes iniciar sesión'); window.location = '/' </script>")
}

});



//Server is listening

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
