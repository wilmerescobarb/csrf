const express = require('express')
const fs = require('fs');
const handlebars = require('express-handlebars');

const session = require('express-session');
const {v4: uuid} = require('uuid');
const flash = require('connect-flash-plus');

const app = express();
const PORT = 3000;

//Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'prueba',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

app.set('views', __dirname);
app.engine('hbs', handlebars({
    defaultLayout: 'main',
    layoutsDir: __dirname,
    extname: '.hbs'
}));
app.set('view engine', 'hbs');

//CSRF Tokens
const tokens = new Map();
const csrfToken = (sessionID) => {    
    const token = uuid();

    setTimeout(() => {
        tokens.get(sessionID).delete(token)
    }, 30000);

    tokens.get(sessionID).add(token);
    return token;
}

const csrf = (req, res, next) =>{
    const token = req.body.csrf;
    if(!token || !tokens.get(req.sessionID).has(token)){
        res.status(422).send('CSRF Token ha expirado')
    }else {
        next();
    }
}

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
    res.render('login', {message: req.flash('message')});
});

app.post('/login', (req, res) => {
    if (!req.body.email || !req.body.password) {
        req.flash('message', 'Todos los campos son obligatorios')
        return res.redirect('/login');
    }

    const user = USERS.find(user => user.email === req.body.email);
    if (!user || user.password !== req.body.password) {
        req.flash('message', 'Credenciales inválidas')
        return res.redirect('/login')
    }

    req.session.user = user;

    tokens.set(req.sessionID, new Set())
    res.redirect('/home');
});

app.get('/edit', login, (req, res) => {    
    res.render('edit', {token: csrfToken(req.sessionID)});
})

app.post('/edit', login, csrf, (req, res) => {
    const user = USERS.find(user => user.id === req.session.user.id);
    user.email = req.body.email;
    console.log(`Usuario ${user.id} email cambiado a ${user.email}`);
    res.send('Email cambiado');
})


app.get('/logout', login, (req, res) => {
    req.session.destroy();
    res.send('Sesión finalizada')
})

//Server
app.listen(PORT, () => console.warn('Listening on Port', PORT));