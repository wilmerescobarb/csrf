const express = require('express')
const fs = require('fs');
const handlebars = require('express-handlebars');

const session = require('express-session');

const app = express();
const PORT = 3000;

//Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'prueba',
    resave: false,
    saveUninitialized: false
}));
app.set('views', __dirname);
app.engine('hbs', handlebars({
    defaultLayout: 'main',
    layoutsDir: __dirname,
    extname: '.hbs'
}));
app.set('view engine', 'hbs');

//Verificamos que la petición tenga un sessionID
const login = (req, res, next) => {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        next();
    }
}


//Db
const USERS = JSON.parse(fs.readFileSync('db.json'));

//Routes
app.get('/home', login, (req, res) => {
    res.send('Home page, debe estar logeado para acceder');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    if (!req.body.email || !req.body.password) return res.status(400).send('Todos los campos son requeridos');

    const user = USERS.find(user => user.email === req.body.email);
    if (!user || user.password !== req.body.password) {
        return res.status(400).send('Credenciales Inválidas');
    }

    req.session.user = user;
    res.redirect('/home');
});

app.get('/edit', login, (req, res) => {
    res.render('edit');
})

app.post('/edit', login, (req, res) => {
    const user = USERS.find(user => user.id === req.session.user.id);
    user.email = req.body.email;
    console.log(`Usuario ${user.id} email cambiado a ${user.email}`);
    res.send('Email cambiado');
})

//Server
app.listen(PORT, () => console.warn('Listening on Port', PORT));