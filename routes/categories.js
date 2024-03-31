var express = require('express');
var router = express.Router();
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

// const categories = [ 
//   { id: 1, name: "category 1", img: "dm1.jpeg"}, 
//   { id: 2, name: "category 2", img: "dm2.jpeg"}, 
//   { id: 3, name: "category 3", img: "dm3.jpeg"}, 
//   ]; 

/* GET home page. */
// thực hiện gọi đến model db
const connectDb=require('../models/db');


//hiển thị trang sản phẩm

router.get('/', async(req, res, next)=>{
  const db=await connectDb();
  const productsCollection = db.collection('categories');
  const categories = await productsCollection.find().toArray();
  res.render('categories',{categories})
})

router.get('/add', function(req, res, next) {
  res.render('addCate');
});
//
router.post('/add', upload.single('img'), async (req, res) => {
  const db = await connectDb();
  const categoriesCollection = db.collection('categories');
  let { name, img } = req.body; 
  let newCategory = { name, img };
  await categoriesCollection.insertOne(newCategory);
  res.redirect('/categories');
});


router.get('/edit/:id', async(req, res, next) =>{
  const db= await connectDb();
  const categoriesCollection = db.collection('categories');
  const id = req.params.id;
  const category = await categoriesCollection.findOne({id:parseInt(id)});
  res.render('editCate',{category});
});
//Post để sửa sản phẩm
router.post('/edit', upload.single('img'),async(req, res) =>{
  let id = req.body.id;
  const db= await connectDb();
  const categoriesCollection = db.collection('categories');
  let {name} =req.body;
  let img = req.file? req.file.originalname : req.body.imgOld;
  let editCategories={name,img};
  await categoriesCollection.updateOne({id : parseInt(id) }, {$set: editCategories });
  res.redirect('/categories');
});

router.get('/delete/:id', async (req, res, next) => {
  let id = req.params.id;
  const db = await connectDb();
  const productsCollection = db.collection('categories');
  

  await categoriesCollection.deleteOne({ id: parseInt(id) });
  
  res.redirect('/categories');
});

router.get('/:id', function(req, res, next) {

  let id=req.params.id;
  let cate=categories.find(p=>p.id==id);
  res.send(`
  
  <h2>Trang chi tiet danh muc</h2>  
  <h4>${cate.name}</h4>
  <img src="../images/${cate.img}" width="200px">

  `);
});



module.exports = router;

