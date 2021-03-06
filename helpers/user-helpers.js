var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { response } = require('../app')
var objectId = require('mongodb').ObjectID
const Razorpay=require('razorpay')

var instance = new Razorpay({
    key_id: 'rzp_test_h59U9j6i6V36DS',
    key_secret: 'pGu3P1sw6KrQlopRP8RzmjUg',
  });

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.ops[0])
            })

        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: userData.mobile })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log("Login Success");
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("Incorrect Password");
                        resolve({ status: false })
                    }

                })
            } else {
                console.log("User not found");
                resolve({ status: false })
            }
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                        {

                            $inc: { 'products.$.quantity': 1 }

                        }).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {

                                $push: { products: proObj }

                            }
                        ).then((response) => {
                            resolve()
                        })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            console.log(cartItems);
            console.log("so here"+cartItems[0].product);
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }

                    }).then((response) => {
                        resolve({ removeProduct: true })
                    })
        } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }
                ).then((response) => {
                    resolve({status:true})
                })
            }


        })
    },
    getTotalAmount:(userId)=>{
        
        return new Promise(async (resolve, reject) => {
            
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }
                }
                ,
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
                ,
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.price']}}
                    }
                }

            ]).toArray()
            console.log(total[0].total);
            resolve(total[0].total)
        })

    },
    placeOrder:(order,products,price)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(order,products,price);
            let status=order.paymentMethod==='cod'?'placed':'pending'
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(order.userId) })

            let ordered = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(order.userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            console.log(ordered);
            console.log(user);
            order.number=parseInt(order.number)
            let orderObj={
                deliveryDetails:{
                    address:order.address,
                    village:order.village,
                    landmark:order.landmark,
                    number:order.number
                },
                userId:objectId(order.userId),
                name:user.name,
                newmobile:user.mobile,
                paymentMethod:order.paymentMethod,
                products:products,
                getTotalAmount:price,
                status:status,
                date:new Date(),
                orderStatus:'Packing',
                Packing:true,
                Shipped:false,
                Delivered:false,
                itemDetails:ordered
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userId)})
                resolve(response.ops[0]._id)
            })
        })

    },
    getCartProduct:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.products)
        })
    },
    getOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let order=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
            console.log(order);
            resolve(order)
        })
    },
    getOrderDetails:(orderId)=>{
        return new Promise(async (resolve, reject) => {
            let orderDetails = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            console.log("Here at user helper for specific order details");
            console.log(orderDetails);
            resolve(orderDetails)
        })
    },
    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{

            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                if(err){
                    console.log("error rpay");
                    console.log(err);
                }else{
                    console.log("New rozor order",order);
                    resolve(order)
                }
              });            
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'pGu3P1sw6KrQlopRP8RzmjUg'); //key_secret => pGu3P1sw6KrQlopRP8RzmjUg
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            let generatedSignature = hmac.digest('hex');
            if(generatedSignature==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            console.log("passed verify");
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
                {
                    $set:{
                        status:'Paid' 
                    }
                }).then(()=>{
                    resolve()
                })
        })
    },
    getProdDetails:(proId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log("here at user helepr");
            let details=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
            resolve(details)
        })
    }

    

}
