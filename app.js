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

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const User = require('./models').Users;
const IdeaSheets = require('./models').IdeaSheets;
const IdeaNodes = require('./models').IdeaNodes;
const IdeaBranches = require('./models').IdeaBranches;

const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'sd#8931',
    database: 'Mindmap',
    port: '3306'
});

connection.connect((err) => {
    if (err) {
        console.log('error connecting: ' + err.stack);
        return;
    }
    console.log('Server connecting success');
});

const mustacheExpress = require('mustache-express');
const { error } = require('console');

const fs = require('fs');

app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views/ideaPage');

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
                const verificationUrl = 'http://192.168.2.103:3000' + req.originalUrl.split('&signature=')[0];
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
//みんなのアイデアを見る
app.get('/everyone_idea', (req, res) => {
    IdeaSheets.findAll({
        where: { //自分のidと一致または公開設定されているデータを取得
            [Op.or]: {
                id: req.user.id,
                sharingSetting: true
            }
        }
    }).then(idea => {
        res.render('everyone_idea.ejs', { idea_list: idea });
    });
});

/*-----------------------------------------------------*/
//自分のアイデアを見る
app.get('/my_idea', (req, res) => {
    IdeaSheets.findAll({
        where: {
            id: req.user.id //自分のid一致するデータのみ取得
        }
    }).then(idea => {
        res.render('my_idea.ejs', { idea_list: idea });
    });

});

//公開設定 1=公開,0=非公開
app.post('/sharingSetting_change/:rootID', (req, res) => {
    IdeaSheets.update({ sharingSetting: req.body.sharingSetting }, { where: { rootID: req.params.rootID } }).then(() => {
        res.redirect('/my_idea');
    });

});

//各アイデアページ
app.get('/idea_edit/:rootID', (req, res) => {
    IdeaSheets.findAll({
        where: { rootID: req.params.rootID }
    }).then((ideaPage_data) => {
        res.render('ideaPage/' + req.params.rootID + '.ejs', { ideaPage_data: ideaPage_data });
    });
});

//マインドマップタイトル変更
app.post('/change_title/:rootID', (req, res) => {
    IdeaSheets.update({
        title: req.body.changeTitle
    }, {
        where: { rootID: req.params.rootID }
    }).then(() => {
        res.redirect('/my_idea');
    });
});

//マインドマップを保存
app.post('/save_data/:rootID', (req, res) => {
    console.log(req.body.data);
    fs.writeFileSync('public/mindelixir/data/' + req.params.rootID + '.js', 'let mindmapData = ' + req.body.data + ';');
    res.redirect('/my_idea');
});

//マインドマップを削除
app.post('/idea_delete/:rootID', (req, res) => {
    IdeaSheets.destroy({
        where: { rootID: req.params.rootID }
    }).then(() => {
        res.redirect('/my_idea');
    });
});

/*-----------------------------------------------------*/

app.get('/create_new_idea', (req, res) => {
    User.findAll({
        where: { id: req.user.id }
    }).then((results) => {
        res.render('create_new_idea.ejs', { create_idea: results });
    });
});

app.post('/create/:id', (req, res) => {
    IdeaSheets.create({
        id: req.body.id,
        email: req.body.email,
        nickName: req.body.nickName,
        title: req.body.title,
        rootName: req.body.rootName,
        sharingSetting: req.body.sharingSetting,
        createdAt: new Date(),
        updatedAt: new Date()
    }).then(() => {
        res.redirect('/createPage');
    });
});

app.get('/createPage', (req, res) => {
    IdeaSheets.max('rootID').then(maxRootId => {
        IdeaSheets.update({ pageURL: maxRootId + '.ejs' }, { where: { rootID: maxRootId } }).then(() => {
            fs.copyFile('views/ideaPage/template.ejs', 'views/ideaPage/' + maxRootId + '.ejs', (err) => {
                if (err) {
                    console.log(err.stack);
                } else {
                    console.log('Done.');
                }
            });

            fs.copyFile('public/mindelixir/data/template.js', 'public/mindelixir/data/' + maxRootId + '.js', (err) => {
                if (err) {
                    console.log(err.stack);
                } else {
                    console.log('Done.');
                }
            });
            res.redirect('/my_idea');
        });
    });
});

/*-----------------------------------------------------*/
//ユーザー情報変更機能
const changeValidationRules = [
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

app.post('/change/:id', changeValidationRules, (req, res) => {
    const errors = validationResult(req);

    console.log(errors);

    if (!errors.isEmpty()) { // バリデーション失敗

        return res.status(422).json({ errors: errors.array() });

    }
    const password2 = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8));
    User.update({ name: req.body.name, email: req.body.email, password: password2 }, { where: { id: req.params.id } }).then(() => {
        res.redirect('/configuration');
    });
});

app.get('/configuration', (req, res) => {
    User.findAll({
        where: { id: req.user.id }
    }).then((results) => {
        res.render('configuration.ejs', { login_user: results });
    });
});

/*-----------------------------------------------------*/

app.post('/delete/:id', (req, res) => {
    connection.query(
        `DELETE FROM Users WHERE id = ${req.params.id}`,
        (error, results) => {
            res.redirect('/login');
        }
    );
});

/*-----------------------------------------------------*/

app.listen(port, () => {
    console.log(`Mindmap app listening at http://localhost:${port}`);
});


module.exports = app;