//jshint esversion:6
const express=require("express");
const app=express();
const bodyParser=require("body-parser");
const mongoose=require("mongoose");

const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
  secret:"iamgreenarrow",
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/Blog",{ useUnifiedTopology: true,useNewUrlParser: true });

const userSchema=new mongoose.Schema({
  username:String,
  password:String
});

const articleSchema=new mongoose.Schema({
  heading:String,
  content:String
});

userSchema.plugin(passportLocalMongoose);

const user=new mongoose.model("user",userSchema);
const article=new mongoose.model("article",articleSchema);

passport.use(user.createStrategy());
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.get("/login",function(req,res){
  if(req.isAuthenticated()){
    res.redirect("/");
  }else{
    res.render("login",{auth:0,titleName:"VBlog - Login"});
  }
});

app.post("/login",function(req,res,next){
  let i=0;
  user.find(function(err,arr){
    i=arr.length;
    if(i==0){
      user.register({username:req.body.username},req.body.password,function(err){
        if(err){
          console.log(err);
        }else{
          passport.authenticate("local")(req,res,function(){
            res.redirect("/");
          });
        }
      });
    }else{
      // const input=new user({
      //   username:req.body.username,
      //   password:req.body.password
      // });
      // req.login(input,function(err){
      //   if(err){
      //     console.log(err);
      //   }else{
      //     passport.authenticate("local")(req,res,function(){
      //       res.redirect("/");
      //     });
      //   }
      // });
      passport.authenticate('local',{
        successRedirect: '/',
        failureRedirect: '/login'
      })(req,res,next);
    }
  });
});

app.get("/",function(req,response){
  article.find(function(err,res){
    if(req.isAuthenticated()){
      response.render("home",{auth:1,data:res,titleName:"VBlog - Home"});
    }else{
      response.render("home",{auth:0,data:res,titleName:"VBlog - Home"});
    }
  });
});

app.get("/newArticle",function(req,res){
  if(req.isAuthenticated()){
    res.render("newArticle",{auth:1,titleName:"VBlog - New Article"});
  }else{
    res.redirect("/");
  }
});

app.post("/newArticle",function(req,res){
  const input=new article({
    heading:req.body.heading,
    content:req.body.content
  });
  input.save();
  res.redirect("/");
});

app.post("/updateArticle",function(req,res){
  article.updateOne({_id:req.body._id},{heading:req.body.heading,content:req.body.content},function(err){
    if(err){
      console.log(err);
    }
  });
  res.redirect("/");
});

app.get("/posts/:postName",function(req,response){
  let i=0;
  article.find(function(err,res){
    for(i=0;i<res.length;i++){
      if(res[i].heading.replace(/ +/g, "-")==req.params.postName){
        break;
      }
    }
    if(req.isAuthenticated()){
      response.render("posts",{auth:1,titleName:"VBlog - "+res[i].heading,data:res[i]});
    }else{
      response.render("posts",{auth:0,titleName:"VBlog - "+res[i].heading,data:res[i]});
    }
  });
});

app.post("/edit",function(req,res){
  article.findOne({_id:req.body._id},function(err,response){
    const dat=new article({
      _id:response._id,
      heading:response.heading,
      content:response.content
    });
    res.render("edit",{auth:1,titleName:"VBlog - Edit",data:dat});
  });
});

app.post("/delete",function(req,res){
  article.deleteOne({_id:req.body._id},function(err){
    if(err){
      console.log(err);
    }
  });
  res.redirect("/");
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

app.listen(process.env.PORT||8080,function(){
  console.log("Server started at 8080");
});
