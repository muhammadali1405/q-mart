var express = require('express');
const { render, response, route } = require('../app');
var router = express.Router();
const productHelper = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const userHelper = require('../helpers/user-helpers');
const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
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
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.userLoginErr })
    req.session.userLoginErr = false
  }
}) 

router.get('/signup', (req, res) => {

  res.render('user/signup')
})

router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    console.log(response);
    req.session.user = response
    req.session.userLoggedIn=true
    res.redirect('/')
  })
})

router.post('/login', (req, res) => {
  console.log(req.body);
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.userLoggedIn = true
      res.redirect('/')
    }
    else {
      req.session.userLoginErr = true
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
})

router.get('/cart', verifyLogin,async(req, res ) => {
  if(req.session.user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
  }
  if(cartCount){
    var products=await userHelper.getCartProducts(req.session.user._id)
  }  
  let total = 0
  if(products){
    total=await userHelper.getTotalAmount(req.session.user._id)
    res.render('user/cart',{products,user:req.session.user._id,total})
  }else{
    res.render('user/cart')
  }  
  
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
  let user = req.session.user._id
  let total=await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user._id,user})
})

router.post('/place-order',verifyLogin,async(req,res)=>{
  console.log("success till here::::::::::::::::::::::::::");
  let products=await userHelper.getCartProduct(req.body.userId)
  let totalPrice=await userHelper.getTotalAmount(req.body.userId)
  console.log("fetched price and cart");
  userHelper.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['paymentMethod']==='cod'){
      res.json({codSuccess:true})
    }else{
      userHelper.generateRazorpay(orderId,totalPrice).then((response)=>{
        console.log("user js place order");
        res.json(response)
      })
    }
    
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
  res.render('user/myOrders',{user:req.session.user._id,order,user,cartCount})
})

router.get('/get-order-details/:id',verifyLogin,async(req,res)=>{
  let products = await userHelper.getOrderDetails(req.params.id)
  res.render('user/get-order-details',{user:req.session.user,products})
})

router.post('/verify-payment',(req,res)=>{
  console.log("verify userjs payment");
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log("user js verify payment post false");
    console.log(err);
    res.json({status:false,errMsg:''})
  })


})
module.exports = router;
