var express = require('express');
var router = express.Router();
const checkUserLoggedIn = require('./authMiddleware');

const multer = require('multer'); 
//Thiết lập nơi lưu trữ và tên file 
let storage = multer.diskStorage({ 
destination: function (req, file, cb) { 
  cb(null, './public/images') 
}, 
filename: function (req, file, cb) { 
cb(null, file.originalname) 
} 
}) 
//Kiểm tra file upload 
function checkFileUpLoad(req, file, cb){ 
if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)){ 
return cb(new Error('Bạn chỉ được upload file ảnh')); 
} 
cb(null, true); 
} 
//Upload file 
let upload = multer({ storage: storage, fileFilter: checkFileUpLoad });

const connectDb=require('../models/db');

// router.get('/', checkUserLoggedIn, async(req, res, next) => {
//     const db = await connectDb();
//     const orderCollection = db.collection('orders');
//     const orders = await orderCollection.find().toArray();  // Đổi tên biến thành orders để tránh nhầm lẫn
//     res.render('order', { orders }); // Truyền biến orders vào đây

// })

router.get('/', checkUserLoggedIn, async (req, res) => {

    const db = await connectDb();
    const ordersCollection = db.collection('orders');
    const orderDetailsCollection = db.collection('orderDetails');
    const productsCollection = db.collection('products');
    const usersCollection = db.collection('users');

    // Lấy tất cả đơn hàng
    const orders = await ordersCollection.find().toArray();

    // Với mỗi đơn hàng, lấy chi tiết và thông tin liên quan
    const ordersDetailsPromises = orders.map(async (order) => {
        const orderDetails = await orderDetailsCollection.find({ OrderID: order.OrderID }).toArray();

        const userDetails = await usersCollection.findOne({ id: order.UserID });
        
        const username = userDetails ? userDetails.username : "Không xác định";

        const productsDetailsPromises = orderDetails.map(async (detail) => {
            const product = await productsCollection.findOne({ id: detail.ProductID });
            
            return {
                ...detail,
                ProductName: product ? product.name : "Sản phẩm không xác định",
            };
        });
        
        const productsDetails = await Promise.all(productsDetailsPromises);

        return {
            ...order,
            username: username,
            ProductsDetails: productsDetails,
        };
    });

    const ordersWithDetails = await Promise.all(ordersDetailsPromises);

    // Gửi thông tin đến template
    res.render('order', { orders: ordersWithDetails });
});



router.get('/search-order/:OrderID', checkUserLoggedIn, async (req, res) => {
    const db = await connectDb();
    const ordersCollection = db.collection('orders');
    const orderDetailsCollection = db.collection('orderDetails');
    const productsCollection = db.collection('products');
    const usersCollection = db.collection('users');

    const OrderID = parseInt(req.params.OrderID); // Chuyển đổi OrderID từ String sang Integer

    // Lấy đơn hàng cụ thể
    const order = await ordersCollection.findOne({ OrderID: OrderID });

    if (!order) {
        return res.status(404).send('Không tìm thấy đơn hàng.');
    }

    const orderDetails = await orderDetailsCollection.find({ OrderID: OrderID }).toArray();
    const userDetails = await usersCollection.findOne({ id: order.UserID });
    const username = userDetails ? userDetails.username : "Không xác định";

    const productsDetailsPromises = orderDetails.map(async (detail) => {
        const product = await productsCollection.findOne({ id: detail.ProductID });
        
        return {
            ...detail,
            ProductName: product ? product.name : "Sản phẩm không xác định",
        };
    });
    
    const productsDetails = await Promise.all(productsDetailsPromises);

    const orderWithDetails = {
        ...order,
        username: username,
        ProductsDetails: productsDetails,
    };

    // Gửi thông tin đến template
    res.render('search-order', { order: orderWithDetails });
});





router.get('/delete/:OrderID', checkUserLoggedIn, async (req, res) => {
    try {
        const { OrderID } = req.params;
        const db = await connectDb();
        const orderCollection = db.collection('order');

        // Chuyển đổi orderid từ chuỗi sang số nguyên
        // const OrderIDInt = parseInt(OrderID, 10);
 
        console.log("Đang xóa đơn hàng với OrderID:", OrderID);
        const deleteResult = await orderCollection.deleteOne({ OrderID: OrderID });
        console.log("Kết quả xóa:", deleteResult);
        

        if (deleteResult.deletedCount === 0) {
            return res.status(404).send('Không tìm thấy đơn hàng để xóa.');
        }

        // Redirect sau khi xóa thành công
        res.redirect('/order');
    } catch (error) {
        console.error('Đã có lỗi xảy ra', error);
        res.status(500).send('Lỗi server khi xóa đơn hàng.');
    }
});





module.exports = router;
