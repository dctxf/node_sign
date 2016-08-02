# 基于express框架实现简单的注册登录Web功能

[TOC]

## 使用技术

* node.js
* express  
* mongodb

## 下载安装

```
git clone git@github.com:dctxf/node_sign.git

npm i
```

## 设计思路

1. `home` 进入网站首页，判断是否登录，登录即跳转到home页，没登录跳转到login页
2. `login` 输入用户名，密码，点击登录，判断用户是否存在，存在即登录，不存在提示
3. `regist` 输入用户名，密码，点击注册，判断用户是否存在，不存在即创建用户，并登录


## mongodb

MongoDB是一个基于分布式文件存储的数据库。由C++语言编写。旨在为WEB应用提供可扩展的高性能数据存储解决方案。 他的特点:高性能、易部署、易使用，存储数据非常方便

### 在Mac上安装MongoDB

使用Mac上面的Homebrew安装

首先更新Homebrew的package数据库

```
brew update
```

更新完成之后，直接安装MongoDB

```
brew install mongodb
```



```
Downloading https://homebrew.bintray.com/bottles/mongodb-3.0.6.yosemite.bottle.tar.gz Already downloaded:
/Library/Caches/Homebrew/mongodb-3.0.6.yosemite.bottle.tar.gz ==> Pouring mongodb-3.0.6.yosemite.bottle.tar.gz ==> Caveats To have
launchd start mongodb at login: ln -sfv /usr/local/opt/mongodb/*.plist ~/Library/LaunchAgents Then to load mongodb now: launchctl load
~/Library/LaunchAgents/homebrew.mxcl.mongodb.plist Or, if you don't
want/need launchctl, you can just run: mongod --config
/usr/local/etc/mongod.conf ==> Summary 🍺
/usr/local/Cellar/mongodb/3.0.6: 17 files, 159M
```

### 启动MongoDB

上面最后的提示的是直接启动Mongodb的方法

```
mongod --config /usr/local/etc/mongod.conf
```
### mongoose

　　Mongoose是MongoDB的一个对象模型工具，是基于node-mongodb-native开发的MongoDB nodejs驱动，可以在异步的环境下执行。

同时它也是针对MongoDB操作的一个对象模型库，封装了MongoDB对文档的的一些增删改查等常用方法，让NodeJS操作Mongodb数据库变得更加灵活简单。

我们通过Mongoose去创建一个“集合”并对其进行增删改查，就要用到它的三个属性：Schema(数据属性模型)、Model、Entity

这里简单介绍一下，更详细的用法可以自行查阅~

#### Schema 

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

#### Model

由Schema构造生成的模型，除了Schema定义的数据库骨架以外，还具有数据库操作的行为，类似于管理数据库属性、行为的类。

比如定义一个Model：

```
var db = mongoose.connect("mongodb://127.0.0.1:27017/test");

// 创建Model
var TestModel = db.model("test1", TestSchema);

```

#### Entity

由Model创建的实体，使用save方法保存数据，Model和Entity都有能影响数据库的操作，但Model比Entity更具操作性。

比如定义一个Entity：

```
var TestEntity = new TestModel({
      name : "Lenka",
      age  : 36,
      email: "lenka@qq.com"
});
console.log(TestEntity.name); // Lenka
console.log(TestEntity.age); // 36
```


基本就介绍到这里

因为我们要使用数据库，那就来创建它。使用的就是上述的方法

首先，在项目根目录下建立一个database文件夹，建立文件 models.js  然后建立model处理文件 dbHandel.js

写入文件 models.js  一个user集合，里面有name和password属性

```
module.exports = {
    user:{
        name:{type:String,required:true},
        password:{type:String,required:true}
    }
};
```

写入文件 dbHandel.js  里边主要是获取 Schema 然后处理获取 model ，最后就是返回一个model了（提供其他文件对model的操作 -- Entity是使用）

```
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
```

app.js中加上

```
var multer = require('multer');
var mongoose = require('mongoose');

global.dbHandel = require('./database/dbHandel');
global.db = mongoose.connect("mongodb://localhost:27017/nodedb");

// 下边这里也加上 use(multer())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
app.use(cookieParser());
```

## session

安装express-session 模块

然后在app.js中引用它并作初始设置：

```
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

```


当然了，把所以路径的处理放在同一个index.js事实上有点糟糕，可以考虑分着写：（这里提供一种思路分出模块）

比如一个home.js模块里边：

```
module.exports = function ( app ) {
    app.get('/logout', function(req, res){
        req.session.user = null;
        req.session.error = null;
        res.redirect('/');
    });
}
```

从而只需要在index.js模块里边引用即可

```
module.exports = function ( app ) {
    require('./logout')(app);
};
```

在app.js模块中再引用一下就可以（routes目录下index.js是默认文件，所以可以省略index)

```
require('./routes')(app);
```

## 启动项目

```
npm start
```

浏览器输入 http://localhost:3000 访问（期间可以自己查看mongodb数据库里边nodedb --> user 数据的改动，使用mongoVUE或者命令查看）



