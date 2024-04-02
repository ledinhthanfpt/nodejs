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

// const products = [ 
//   { id: 1, name: "product 1", price: 100, categoryId: 1,img: "1.jpeg", description: "Description 1"}, 
//   { id: 2, name: "product 2", price: 200, categoryId: 2,img: "2.jpeg", description: "Description 2"}, 
//   { id: 3, name: "product 3", price: 300, categoryId: 3,img: "3.jpeg", description: "Description 3"}, 
//   { id: 4, name: "product 4", price: 400, categoryId: 1,img: "4.jpeg", description: "Description 4"}, 
//   { id: 5, name: "product 5", price: 500, categoryId: 2,img: "5.jpeg", description: "Description 5"}, 
//   { id: 6, name: "product 6", price: 600, categoryId: 1,img: "6.jpeg", description: "Description 6"}, 
//   ];



// thực hiện gọi đến model db
const connectDb=require('../models/db');


//hiển thị trang sản phẩm
router.get('/',checkUserLoggedIn, async(req, res, next)=>{
  const db=await connectDb();
  const productsCollection = db.collection('products');

  const products = await productsCollection.find().toArray();
  

  const userName = req.user ? req.user.username : 'Khách';

  res.render('product',{products, userName })
  
})




router.get('/add',checkUserLoggedIn, function(req, res, next) {
  res.render('addPro');
});
//
router.post('/add', upload.single('img'),async(req, res) =>{
  const db= await connectDb();
  const productsCollection = db.collection('products');

  let { name, price, description, categoryId, StockQuantity } = req.body;
  let img = req.file.originalname;

  price = parseFloat(price); // Giả sử giá có thể là số thực
  categoryId = parseInt(categoryId, 10);
  StockQuantity = parseInt(StockQuantity, 10);

  // lấy sản phẩm có id cao nhất bằng cách sắp xếp giảm dần (-1) và lấy 1
  let lastProduct = await productsCollection.find().sort({id:-1}).limit(1).toArray();

  // kiểm tra có lastproduct kh nếu có thì id+1, nếu kh có là kh có sản phẩm 
  //nào hết thì id = 1.
  let id = lastProduct[0] ? lastProduct[0].id + 1 : 1;
  let newProduct={id, name, price, categoryId,img,description};
  await productsCollection.insertOne(newProduct);
  res.redirect('/products');
});

//hiển thị trang sản phẩm
router.get('/:categoryId',checkUserLoggedIn, async(req, res, next)=>{
  const db=await connectDb();
  const productsCollection = db.collection('products');
  const categoryId = req.params.categoryId; 

  const products = await productsCollection.find({ categoryId: parseInt(categoryId) }).toArray();

  res.render('cate-1',{products })

})

router.get('/edit/:id',checkUserLoggedIn, async(req, res, next)=> {
  const db= await connectDb();
  const productsCollection = db.collection('products');
  const id = req.params.id;
  const product = await productsCollection.findOne({id:parseInt(id)});
  res.render('editPro',{product});
});
//Post để sửa sản phẩm
router.post('/edit', upload.single('img'),async(req, res) =>{
  let id = req.body.id;
  const db= await connectDb();
  const productsCollection = db.collection('products');
  let {name, price, categoryId, description} =req.body;
  let img = req.file? req.file.originalname : req.body.imgOld;
  let editProduct={name,price, categoryId,img,description};
  await productsCollection.updateOne({id:parseInt(id)},{$set:editProduct});
  res.redirect('/products');
});
router.get('/delete/:id',checkUserLoggedIn, async (req, res, next) => {
  let id = req.params.id;
  const db = await connectDb();
  const productsCollection = db.collection('products');
  
  await productsCollection.deleteOne({ id: parseInt(id) });
  
  res.redirect('/products');
});


// router.get('/:id',checkUserLoggedIn, function(req, res, next) {

//   let id=req.params.id;
//   let product=products.find(p=>p.id==id);
//   res.send(`
  
//   <h2>Trang chi tiet san pham</h2>  
//   <h4>${product.name}</h4>
//   <h4>Giá: ${product.price}</h4>
//   <img src="../images/${product.img}" width="200px">
//   <h4>Mô tả: ${product.description}</h4>
//   `);
// });


module.exports = router;
