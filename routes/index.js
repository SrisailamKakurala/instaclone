var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require('./multer');

passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function (req, res) {
  res.render('index', { footer: false });
});

router.get('/login', function (req, res) {
  res.render('login', { footer: false });
});

router.get('/feed', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const posts = await postModel.find().populate('user');
  res.render('feed', { footer: true, user, posts });
});

router.get('/profile', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate('posts');
  console.log(user)
  res.render('profile', { footer: true, user });
});

router.get('/search', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('search', { footer: true, user });
});

router.get('/username/:username', isLoggedIn, async function(req,res,next) {
  const regex = new RegExp(`^${req.params.username}`, 'i')
  const users = await userModel.find({username: regex});
  res.json(users);
})

router.get('/edit', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('edit', { footer: true, user });
});

router.get('/upload', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('upload', { footer: true, user });
});

router.post('/upload', isLoggedIn, upload.single('image') ,async (req, res) => {
  const userData = await userModel.findOne({ username: req.session.passport.user });
  const postData = await postModel.create({
    picture: req.file.filename,
    user: userData._id,
    caption: req.body.caption,
  });

  userData.posts.push(postData._id);
  await userData.save();
  res.redirect("/feed");
})

router.post('/register', (req, res) => {
  const userData = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  });

  userModel.register(userData, req.body.password)
    .then(() => {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/feed');
      })
    })
})

router.post('/login', passport.authenticate('local', {
  successRedirect: '/feed',
  failureRedirect: '/login',
}), function (req, res) {
});

router.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

router.post('/update', upload.single('image'), async (req, res, next) => {
  const user = await userModel.findOneAndUpdate({ username: req.session.passport.user },
    {
      username: req.body.username,
      name: req.body.name,
      bio: req.body.bio
    },
    { new: true }
  );

  if (req.file) {
    user.profileImage = req.file.filename;
  }
  await user.save();
  res.redirect("/profile");
})

router.get('/like/post/:postId', isLoggedIn, async function(req, res, next) {
  const post = await postModel.findOne({_id: req.params.postId});
  const user = await userModel.findOne({username: req.session.passport.user});
  
  // if already liked remove the like
  // else add the like
  if(post.likes.indexOf(user._id) === -1){
    post.likes.push(user);
  }
  else{
    post.likes.splice(post.likes.indexOf(user._id), 1)
  }

  await post.save();
  res.redirect('/feed');
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

module.exports = router;
