var express = require('express');
const { render } = require('../app');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');

/* GET users listing. */
router.get('/', function (req, res, next) {

  productHelper.getAllProducts().then((products) => {
    console.log(products)
    res.render('admin/view-products', { admin: true, products });

  })

});



router.get('/adminLogin', (req, res) => {
  if (req.session.admin) {
    res.redirect('/admin')
  } else {
    res.render('admin/admin-login', { admin: true })
  }
}) 


router.get('/allOrders', async(req, res ) => {
  let order = null;
  order=await productHelper.getOrders()
  console.log("admin js");
  console.log(order);
  if(order!=null){
    res.render('admin/view-orders', { admin: true,order })
  }else{
    res.render('admin/view-orders', { admin: true })
  }

  
})

router.get('/add-product', function (req, res) {

  res.render('admin/add-product', { admin: true })
})

router.post('/add-product', (req, res) => {
  console.log(req.body);
  console.log(req.files.image);

  req.body.mrp=parseInt(req.body.mrp)
  req.body.price=parseInt(req.body.price)
  console.log(req.body);

  productHelper.addProduct(req.body, (id) => {
    let image = req.files.image
    console.log(id);
    image.mv('./public/product-images/' + id + '.jpg', (err) => {
      if (!err) {
        res.render("admin/add-product")
      } else {
        console.log(err);
      }
    })
  })
})

router.get('/delete-product/:id', (req, res) => {
  let prodId = req.params.id
  productHelper.deleteProduct(prodId).then((response) => {
    res.redirect('/admin/')
  })
})

router.get('/edit-product/:id', async (req, res) => {
  console.log(req.params.id);
  let product = await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render("admin/edit-products", { product })
})

router.post('/edit-product/:id', (req, res) => {
  //console.log(req.params.id);
  let id=req.params.id
  console.log(req.params);
  
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin')
    if(req.files.image){
      let image=req.files.image
      image.mv('./public/product-images/' + id + '.jpg')      
    }
  })

})
router.get('/toShipped/:id',(req,res)=>{
  console.log("admin js il vannu mwone");
  console.log(req.params.id);
  productHelpers.orderShipped(req.params.id).then((response)=>{
    console.log("All set");
    res.json(response)
  })

})

router.get('/toDelivered/:id',(req,res)=>{
  console.log("admin js il vannu mwone");
  console.log(req.params.id);
  productHelpers.orderDelivered(req.params.id).then((response)=>{
    console.log("All set");
    res.json(response)
  })

})
router.get('/toPacking/:id',(req,res)=>{
  console.log("admin js il vannu mwone");
  console.log(req.params.id);
  productHelpers.orderPacking(req.params.id).then((response)=>{
    console.log("All set");
    res.json(response)
  })

})


router.get('/allUsers', async(req, res ) => {
  let users=await productHelper.getUsers()
  console.log("admin js");
  console.log(users);
  res.render('admin/all-users', { admin: true,users })

})

router.get('/deleteUser/:id', (req, res ) => {
  productHelper.deleteUser(req.params.id).then((response)=>{
    console.log("admin js user delete");
    console.log(response);
    res.json(response)

  })
    
})


module.exports = router;
