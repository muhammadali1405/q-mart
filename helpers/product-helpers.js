//add to database codes are here and are called at admin.js file....


var db = require('../config/connection')
var collection = require('../config/collections')
const { response } = require('express')
var objectId = require('mongodb').ObjectID

module.exports = {
    addProduct: (product, callback) => {
        db.get().collection('product').insertOne(product).then((data) => {
            callback(data.ops[0]._id)

        })


    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({ _id: objectId(prodId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getProductDetails: (_id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(_id) }).then((product) => {
                resolve(product)
            })
        })
    },
    
    updateProduct: (_id, proDetails) => {
        return new Promise((resolve, reject) => {
            console.log(_id);
            proDetails.price=parseInt(proDetails.price)
            proDetails.mrp=parseInt(proDetails.mrp)
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(_id) }, {
                $set: {
                    name: proDetails.name,
                    description: proDetails.description,
                    price: proDetails.price,
                    mrp:proDetails.mrp,
                    category: proDetails.category
                }
            }).then((response) => {
                resolve()
            })
        })
    },

    getOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            console.log("going to fetch");
            let order=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            console.log("fetched from db");
            console.log(order);
            resolve(order)
        })
    },
    orderShipped:(orderId)=>{
        return new Promise((resolve,reject)=>{
            console.log("Changing order Status");
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
                {
                    $set:{
                        orderStatus:'Shipped',
                        Shipped:true,
                        Delivered:false,
                        Packing:false
                    }
                }).then((response)=>{
                    resolve(response)
                })
        })
    },
    orderDelivered:(orderId)=>{
        return new Promise((resolve,reject)=>{
            console.log("Changing order Status");
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
                {
                    $set:{
                        orderStatus:'Delivered',
                        Shipped:false,
                        Delivered:true,
                        Packing:false
                    }
                }).then((response)=>{
                    resolve(response)
                })
        })
    },

    orderPacking:(orderId)=>{
        return new Promise((resolve,reject)=>{
            console.log("Changing order Status");
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
                {
                    $set:{
                        orderStatus:'Packing',
                        Shipped:false,
                        Delivered:false,
                        Packing:true
                    }
                }).then((response)=>{
                    resolve(response)
                })
        })
    }
}



