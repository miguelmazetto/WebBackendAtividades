//  Atividade cookies e sessão
// Nome: Miguel Ferreira Mazetto
// RA: 2266504

const express = require('express')
const mustacheExpress = require("mustache-express");
const cookieParser = require("cookie-parser")
const session = require("express-session")
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path')
const app = express()
const engine = mustacheExpress()
const port = 3000

app.engine("mustache", engine);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "mustache");

app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());
app.use(session({
    secret: "$!532$%2364",
    resave: false,
    saveUninitialized: false
}));

// Inicialize passport e sessões
app.use(passport.initialize());
app.use(passport.session());

/**
 * @typedef User
 * @type {object}
 * @property {string} username
 * @property {string} password
 * @property {string[]} tarefas
*/

/** @type {Record<string, User>} */
let users = {}

passport.use(new LocalStrategy(
    (username, password, done) => {
        const user = users[username];
        if (!user)
            return done(null, false, { message: 'Usuário não encontrado.' });
        if (user.password !== password)
            return done(null, false, { message: 'Senha incorreta.' });
        return done(null, user);
    }
));

passport.serializeUser((user, done) => {
    done(null, user.username)
});

passport.deserializeUser((username, done) => {
    done(null, users[username])
});

let tarefa_count = 0

app.get('/registrar', (req, res) => {
    res.render('registrar', { username: req.user?.username });
})
app.get('/', (req, res) => {
    res.render('index', { username: req.user?.username, tarefa_count });
})
app.post('/registrar', (req, res) => {
    if(users[req.body.username]){
        res.render('registrar', { error: 'Usuário já cadastrado' });
    }else{
        const { username, password } = users[req.body.username] = {
            username: req.body.username,
            password: req.body.password,
            tarefas: []
        }
        req.login({ username, password }, (err) => {
            if(err)
                res.render('registrar', { error: err });
            else
                res.redirect('/')
        })
    }
});

app.get('/sair', (req, res) => {
    req.logout((err) => {
        if (err) res.status(500).send('Erro ao sair');
        else     res.redirect('/');
    });
});

app.get('/entrar', (req, res) => {
    res.render('entrar', { username: req.user?.username });
})
app.post('/entrar', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/entrar',
    failureFlash: true,
}));

app.get('/tarefas', (req, res) => {
    res.render('tarefas', {
        username: req.user?.username,
        tarefas: (users[req.user?.username??'']?.tarefas ?? []).map(t => `<li>${t}</li>`).join('\n')
    });
})
app.post('/novatarefa', (req, res) => {
    if(!req.isAuthenticated()) return res.redirect('/entrar')
    tarefa_count++;
    users[req.user.username].tarefas.push(req.body.newtask)
    res.redirect('/tarefas')
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});