var express = require('express');
const { render, response, route } = require('../app');
var router = express.Router();
const productHelper = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const userHelper = require('../helpers/user-helpers');
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}


/* GET home page. */
router.get('/',async function (req, res, next) {
  let user = req.session.user
  console.log(user);
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
  }
  
  productHelper.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user ,cartCount});
  })
});

router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.loginErr })
    req.session.loginErr = false
  }
})

router.get('/signup', (req, res) => {

  res.render('user/signup')
})

router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    console.log(response);
    req.session.loggedIn=true
    req.session.user = response
    res.redirect('/')
  })
})

router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    }
    else {
      req.session.loginErr = true
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart', verifyLogin,async(req, res ) => {
  let user = req.session.user
  let products=await userHelper.getCartProducts(req.session.user._id)
  let total=await userHelper.getTotalAmount(req.session.user._id)
  if(req.session.user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
  }
  console.log('DARK   SCN   '+products);
  res.render('user/cart',{products,user:req.session.user._id,total,user,cartCount})
})

router.get('/add-to-cart/:id',(req,res)=>{
  console.log("here at router user js");
  console.log(req.params.id);
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })

})

router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body);
  userHelper.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userHelper.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.get('/place-order',verifyLogin, async(req,res)=>{
  let user = req.session.user
  let total=await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user._id,user})
})

router.post('/place-order',async(req,res)=>{
  let products=await userHelper.getCartProduct(req.body.userId)
  let totalPrice=await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body,products,totalPrice).then((response)=>{
    res.json({status:true})
  })
  console.log(req.body);
})


router.get('/myOrders', verifyLogin,async(req, res ) => {
  let user = req.session.user._id
  console.log('user id :'+req.session.user._id);
  let order=await userHelper.getOrders(req.session.user._id)
  if(req.session.user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
  }
  console.log(order);
  console.log(order.products);
  res.render('user/myOrders',{user:req.session.user._id,order,user,cartCount})
})

module.exports = router;
