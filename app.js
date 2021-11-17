require('dotenv').config();

const express = require('express');
const app = express();
const port = 3000;

const passport = require('./auth');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const { check, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('./models').Users;
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'Mindmap',
    port: '3306'
});

const mustacheExpress = require('mustache-express');
const { error } = require('console');

app.use(express.static('public'));

app.engine('mst', mustacheExpress());
app.set('view engine', 'mst');
app.set('views', __dirname + '/views');

app.get('/', (req, res) => {

    res.render('index', {
        title: 'ページタイトル',
        message: 'テストメッセージ'
    });

});

/*-------------------------------------------------------------*/
//ログイン機能
// ミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(session({
    secret: 'YOUR-SECRET-STRING',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

const authMiddleware = (req, res, next) => {
    if (req.isAuthenticated()) { // ログインしてるかチェック

        next();

    } else if (req.cookies.remember_me) {
        const [rememberToken, hash] = req.cookies.remember_me.split('|');
        User.findAll({
            where: {
                rememberToken: rememberToken
            }
        }).then(users => {

            for (let i in users) {
                const user = users[i];
                const verifyingHash = crypto.createHmac('sha256', APP_KEY)
                    .update(user.id + '-' + rememberToken)
                    .digest('hex');

                if (hash === verifyingHash) {
                    return req.login(user, () => {
                        // セキュリティ的はここで remember_me を再度更新すべき
                        next();
                    });
                }
            }
            res.redirect(302, '/login');
        });
    } else {

        res.redirect(302, '/login');

    }
};
/*---------------------------------------------------------*/


// 暗号化につかうキー
const APP_KEY = 'YOUR-SECRET-KEY';

// ログインフォーム
app.get('/login', (req, res) => {
    const errorMessage = req.flash('error').join('<br>');
    res.render('login/form', {
        errorMessage: errorMessage
    });
});

// ログイン実行
app.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true,
        badRequestMessage: '「メールアドレス」と「パスワード」は必須入力です。'
    }),
    (req, res, next) => {

        if (!req.body.remember) { // 次回もログインを省略しない場合

            res.clearCookie('remember_me');
            return next();

        }

        const user = req.user;
        const rememberToken = crypto.randomBytes(20).toString('hex'); // ランダムな文字列
        const hash = crypto.createHmac('sha256', APP_KEY)
            .update(user.id + '-' + rememberToken)
            .digest('hex');
        user.rememberToken = rememberToken;
        user.save();

        res.cookie('remember_me', rememberToken + '|' + hash, {
            path: '/',
            maxAge: 5 * 365 * 24 * 60 * 60 * 1000 // 5年
        });

        return next();

    },
    (req, res) => {

        res.redirect('/home');

    }
);

// ログイン成功後のページ
app.get('/home', authMiddleware, (req, res) => {
    const user = req.user;
    res.render('MindMap_home.ejs');
});

//ログアウト処理
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

/*-------------------------------------------------------------*/

/*app.get('/all-users', (req, res) => {
    Users.findAll().then(users => {
        res.send(users);
    });
});*/

app.get('/mindmap', (req, res) => {
    res.render('MindMap_login.ejs');
});

/*-----------------------------------------------------*/
//ユーザー登録
// 暗号化につかうキー
const appKey = 'YOUR-SECRET-KEY';

// メール送信設定
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    service: 'gmail',
    auth: {
        user: 'pblmindmap@gmail.com',
        pass: 'tbszwtmgeldoouny'
    }
});

// バリデーション・ルール
const registrationValidationRules = [
    check('name')
    .not().isEmpty().withMessage('この項目は必須入力です。'),
    check('email')
    .not().isEmpty().withMessage('この項目は必須入力です。')
    .isEmail().withMessage('有効なメールアドレス形式で指定してください。'),
    check('password')
    .not().isEmpty().withMessage('この項目は必須入力です。')
    .isLength({ min: 8, max: 25 }).withMessage('8文字から25文字にしてください。')
    .custom((value, { req }) => {

        if (req.body.password !== req.body.passwordConfirmation) {

            throw new Error('パスワード（確認）と一致しません。');

        }

        return true;

    })
];

app.post('/register', registrationValidationRules, (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) { // バリデーション失敗

        return res.status(422).json({ errors: errors.array() });

    }

    // 送信されたデータ
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    // ユーザーデータを登録（仮登録）
    User.findOrCreate({
        where: { email: email },
        defaults: {
            name: name,
            email: email,
            password: bcrypt.hashSync(password, bcrypt.genSaltSync(8))
        }
    }).then(([user]) => {

        if (user.emailVerifiedAt) { // すでに登録されている時

            return res.status(422).json({
                errors: [{
                    value: email,
                    msg: 'すでに登録されています。',
                    param: 'email',
                    location: 'body'
                }]
            });

        }
        // 本登録URLを作成
        const hash = crypto.createHash('sha1')
            .update(user.email)
            .digest('hex');
        const now = new Date();
        const expiration = now.setHours(now.getHours() + 1); // 1時間だけ有効
        let verificationUrl = req.get('origin') + '/verify/' + user.id + '/' + hash + '?expires=' + expiration;
        const signature = crypto.createHmac('sha256', appKey)
            .update(verificationUrl)
            .digest('hex');
        verificationUrl += '&signature=' + signature;

        // 本登録メールを送信
        transporter.sendMail({
            from: 'pblmindmap@gmail.com',
            to: email,
            text: "以下のURLをクリックして本登録を完了させてください。\n\n" + verificationUrl,
            subject: '本登録メール',
        });

        return res.json({
            result: true
        });

    });

});

app.get('/verify/:id/:hash', (req, res) => {

    const userId = req.params.id;
    User.findByPk(userId)
        .then(user => {

            if (!user) {

                res.status(422).send('このURLは正しくありません。');

            } else if (user.emailVerifiedAt) { // すでに本登録が完了している場合

                // ログイン＆リダイレクト（Passport.js）
                req.login(user, () => res.redirect('/home'));

            } else {

                const now = new Date();
                const hash = crypto.createHash('sha1')
                    .update(user.email)
                    .digest('hex');
                const isCorrectHash = (hash === req.params.hash);
                const isExpired = (now.getTime() > parseInt(req.query.expires));
                const verificationUrl = 'http://192.168.2.197:3000' + req.originalUrl.split('&signature=')[0];
                const signature = crypto.createHmac('sha256', APP_KEY)
                    .update(verificationUrl)
                    .digest('hex');
                const isCorrectSignature = (signature === req.query.signature);

                if (!isCorrectHash || !isCorrectSignature || isExpired) {

                    res.status(422).send('このURLはすでに有効期限切れか、正しくありません。');

                } else { // 本登録

                    user.emailVerifiedAt = new Date();
                    user.save();

                    // ログイン＆リダイレクト（Passport.js）
                    req.login(user, () => res.redirect('/home'));

                }

            }

        });

});

//ユーザー登録フォーム
app.get('/register', (req, res) => {
    return res.render('auth/register');
});

/*-----------------------------------------------------*/

app.get('/everyone_idea', (req, res) => {
    res.render('everyone_idea.ejs');
});

app.get('/my_idea', (req, res) => {
    res.render('my_idea.ejs');
});

app.get('/create_new_idea', (req, res) => {
    res.render('create_new_idea.ejs');
});

app.get('/configuration', (req, res) => {
    connection.query(
        'SELECT * FROM Users',
        (error, results) => {
            console.log(results);
            res.render('configuration.ejs');
        }
    )
});

app.listen(port, () => {
    console.log(`Mindmap app listening at http://localhost:${port}`);
});


module.exports = app;