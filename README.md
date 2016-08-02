# node.js基于express框架搭建一个简单的注册登录Web功能

[TOC]

## 技术

node.js  bootstrap  express  
数据库 ：使用mongoose对象模型来操作 mongodb

## 步骤

### 设计需求

1. `home` 进入网站首页，判断是否登录，登录即跳转到home页，没登录跳转到login页
2. `login` 输入用户名，密码，点击登录，判断用户是否存在，存在即登录，不存在提示
3. `regist` 输入用户名，密码，点击注册，判断用户是否存在，不存在即创建用户，并登录


### 项目创建

```
express test
```

项目创建成功之后，生成四个文件夹


```
app.js  //主文件
packetage.json  //配置信息文件
bin //是项目的启动文件，配置以什么方式启动项目，默认 npm start
public  //是项目的静态文件，放置js css img等文件
routes  //是项目的路由信息文件,控制地址路由
views  //是视图文件，放置模板文件ejs或jade等（其实就相当于html形式文件啦~)
```

express这样的MVC框架模式，是一个Web项目的基本构成。

### 数据库

#### mongoose

这里使用到了mongodb . 据我所知mongodb主要有两种使用方法，这里使用了其中的一种：使用 mongoose

　　Mongoose是MongoDB的一个对象模型工具，是基于node-mongodb-native开发的MongoDB nodejs驱动，可以在异步的环境下执行。

同时它也是针对MongoDB操作的一个对象模型库，封装了MongoDB对文档的的一些增删改查等常用方法，让NodeJS操作Mongodb数据库变得更加灵活简单。

我们通过Mongoose去创建一个“集合”并对其进行增删改查，就要用到它的三个属性：Schema(数据属性模型)、Model、Entity

这里简单介绍一下，更详细的用法可以自行查阅~

##### Schema 

一种以文件形式存储的数据库模型骨架，无法直接通往数据库端，也就是说它不具备对数据库的操作能力，仅仅只是数据库模型在程序片段中的一种表现，可以说是数据属性模型(传统意义的表结构)，又或着是“集合”的模型骨架。

比如定义一个Schema：

```
var mongoose = require("mongoose");

var TestSchema = new mongoose.Schema({
    name : { type:String },//属性name,类型为String
    age  : { type:Number, default:0 },//属性age,类型为Number,默认为0
    time : { type:Date, default:Date.now },
    email: { type:String,default:''}
});
```

##### Model

由Schema构造生成的模型，除了Schema定义的数据库骨架以外，还具有数据库操作的行为，类似于管理数据库属性、行为的类。

比如定义一个Model：

```
var db = mongoose.connect("mongodb://127.0.0.1:27017/test");

// 创建Model
var TestModel = db.model("test1", TestSchema);

```

##### Entity

由Model创建的实体，使用save方法保存数据，Model和Entity都有能影响数据库的操作，但Model比Entity更具操作性。

比如定义一个Entity：


var TestEntity = new TestModel({
      name : "Lenka",
      age  : 36,
      email: "lenka@qq.com"
});
console.log(TestEntity.name); // Lenka
console.log(TestEntity.age); // 36





基本就介绍到这里

因为我们要使用数据库，那就来创建它。使用的就是上述的方法

首先，在项目根目录下建立一个database文件夹，建立文件 models.js  然后建立model处理文件 dbHandel.js

写入文件 models.js  一个user集合，里面有name和password属性


module.exports = {
    user:{
        name:{type:String,required:true},
        password:{type:String,required:true}
    }
};





写入文件 dbHandel.js  里边主要是获取 Schema 然后处理获取 model ，最后就是返回一个model了（提供其他文件对model的操作 -- Entity是使用）


var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var models = require("./models");

for(var m in models){
    mongoose.model(m,new Schema(models[m]));
}

module.exports = {
    getModel: function(type){
        return _getModel(type);
    }
};

var _getModel = function(type){
    return mongoose.model(type);
};





建立好基本文件后我们就在app.js中调用使用它：要使用multer和mongoose模块

项目没有，所以我们要安装

app.js中加上


var multer = require('multer');
var mongoose = require('mongoose');

global.dbHandel = require('./database/dbHandel');
global.db = mongoose.connect("mongodb://localhost:27017/nodedb");

// 下边这里也加上 use(multer())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
app.use(cookieParser());





　　2.因为我们使用到了session（比如进入home的时候判断session值是否为空），所以需要express-session 模块

然后在app.js中引用它并作初始设置：


var session = require('express-session');

var app = express();
app.use(session({
    secret: 'secret',
    cookie:{
        maxAge: 1000*60*30;
    }
}));

app.use(function(req,res,next){
    res.locals.user = req.session.user;  // 从session 获取 user对象
    var err = req.session.error;  //获取错误信息
    delete req.session.error;
    res.locals.message = "";  // 展示的信息 message
    if(err){
        res.locals.message = '<div class="alert alert-danger" style="margin-bottom:20px;color:red;">'+err+'</div>';
    }
    next();  //中间件传递
});





好现在想想我们还剩下什么：

数据库已经提供出model接口给我们使用（给它填数据）

已经初始化了路径处理

初始化了session信息 数据库配置等

页面模板也已经做完

所以剩下的就是路径处理的部分：去routes目录下 修改index.js吧

/  路径


/* GET index page. */
router.get('/', function(req, res,next) {
  res.render('index', { title: 'Express' });    // 到达此路径则渲染index文件，并传出title值供 index.html使用
});





/login 路径


/* GET login page. */
router.route("/login").get(function(req,res){    // 到达此路径则渲染login文件，并传出title值供 login.html使用
    res.render("login",{title:'User Login'});
}).post(function(req,res){                        // 从此路径检测到post方式则进行post数据的处理操作
    //get User info
    //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
    var User = global.dbHandel.getModel('user'); 
    var uname = req.body.uname;                //获取post上来的 data数据中 uname的值
    User.findOne({name:uname},function(err,doc){  //通过此model以用户名的条件 查询数据库中的匹配信息
        if(err){                                        //错误就返回给原post处（login.html) 状态码为500的错误
            res.send(500);
            console.log(err);
        }else if(!doc){                                //查询不到用户名匹配信息，则用户名不存在
            req.session.error = '用户名不存在';
            res.send(404);                            //    状态码返回404
        //    res.redirect("/login");
        }else{
            if(req.body.upwd != doc.password){    //查询到匹配用户名的信息，但相应的password属性不匹配
                req.session.error = "密码错误";
                res.send(404);
            //    res.redirect("/login");
            }else{                                    //信息匹配成功，则将此对象（匹配到的user) 赋给session.user  并返回成功
                req.session.user = doc;
                res.send(200);
            //    res.redirect("/home");
            }
        }
    });
});





/register 路径


/* GET register page. */
router.route("/register").get(function(req,res){    // 到达此路径则渲染register文件，并传出title值供 register.html使用
    res.render("register",{title:'User register'});
}).post(function(req,res){
    //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
    var User = global.dbHandel.getModel('user');
    var uname = req.body.uname;
    var upwd = req.body.upwd;
    User.findOne({name: uname},function(err,doc){  // 同理 /login 路径的处理方式
        if(err){
            res.send(500);
            req.session.error =  '网络异常错误！';
            console.log(err);
        }else if(doc){
            req.session.error = '用户名已存在！';
            res.send(500);
        }else{
            User.create({                            // 创建一组user对象置入model
                name: uname,
                password: upwd
            },function(err,doc){
                if (err) {
                        res.send(500);
                        console.log(err);
                    } else {
                        req.session.error = '用户名创建成功！';
                        res.send(200);
                    }
                  });
        }
    });
});





/home  路径


/* GET home page. */
router.get("/home",function(req,res){
    if(!req.session.user){                    //到达/home路径首先判断是否已经登录
        req.session.error = "请先登录"
        res.redirect("/login");                //未登录则重定向到 /login 路径
    }
    res.render("home",{title:'Home'});        //已登录则渲染home页面
});





/logout  路径


/* GET logout page. */
router.get("/logout",function(req,res){    // 到达 /logout 路径则登出， session中user,error对象置空，并重定向到根路径
    req.session.user = null;
    req.session.error = null;
    res.redirect("/");
});





当然了，把所以路径的处理放在同一个index.js事实上有点糟糕，可以考虑分着写：（这里提供一种思路分出模块）

比如一个home.js模块里边：


module.exports = function ( app ) {
    app.get('/logout', function(req, res){
        req.session.user = null;
        req.session.error = null;
        res.redirect('/');
    });
}





从而只需要在index.js模块里边引用即可


module.exports = function ( app ) {
    require('./logout')(app);
};





在app.js模块中再引用一下就可以（routes目录下index.js是默认文件，所以可以省略index)


require('./routes')(app);





3.好了，一个简单的注册登录功能已经完成了，启动项目吧

（注意：因为要使用到mongodb数据库，所以要先开启数据库服务，不然无法访问，因为我们使用了nodedb 这个数据库，所以最后也要先在mongodb中创建它，不然也有可能出错 未安装数据库的可以看看  这篇   ，检测数据库服务是否开启：浏览器打开localhost:27017 就能访问 ，然后给数据库添加nodedb吧）

初始化nonedb可以类似这样

启动项目，npm start

上面那个bson错误的不用管它..我也不知咋处理，听说可以直接 npm install bson 或者 npm update 就行

但我试了貌似没什么效果

好了，项目已经打开，浏览器输入 localhost:3000 访问吧 （期间可以自己查看mongodb数据库里边nodedb --> user 数据的改动，使用mongoVUE或者命令查看）

需要代码的可移步至Github：  https://github.com/imwtr/nodejs_express_login_register


