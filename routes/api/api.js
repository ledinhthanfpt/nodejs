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
//Imort model 
const connectDb=require('../../models/db');



//Trả về danh sách sản phẩm

router.get('/products',async(req, res, next)=>{
    console.log('Hot products route hit');
    const db=await connectDb();
    const productsCollection = db.collection('products');
    const products = await productsCollection.find().toArray();
    if (products) {
        res.status(200).json(products);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});


//Lấy danh sách sản phẩm theo Mã danh mục: 

router.get('/products/:categoryId', async (req, res, next) => {
    const db = await connectDb();
    const productsCollection = db.collection('products');
    const categoryId = req.params.categoryId; 

    const products = await productsCollection.find({ categoryId: parseInt(categoryId) }).toArray();
    if (products.length > 0) {
        res.status(200).json(products);
    } else {
        res.status(404).json({ message: 'No products found for this category' });
    }
});



//Thêm sản phẩm

router.post('/products', upload.single('img'),async(req, res, next) =>{
    let {name, price, description, categoryId} =req.body;
    let img = req.file.originalname;
    const db= await connectDb();
    const productsCollection = db.collection('products');
    // lấy sản phẩm có id cao nhất bằng cách sắp xếp giảm dần (-1) và lấy 1
    let lastProduct = await productsCollection.find().sort({id:-1}).limit(1).toArray();
    // kiểm tra có lastCategory kh nếu có thì id+1, nếu kh có là kh có sản phẩm 
    //nào hết thì id = 1.
    let id = lastProduct[0] ? lastProduct[0].id + 1 : 1;
    let newProduct={id, name, price, categoryId,img,description};
    await productsCollection.insertOne(newProduct);
    if (newProduct) {
        res.status(200).json(newProduct);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});


//sửa sản phẩm
router.put('/products/:id',upload.single('img'),async(req,res,next)=>{
    let id = req.params.id;
    const db= await connectDb();
    const productsCollection = db.collection('products');
    let {name, price, description, categoryId} =req.body;
    if (req.file) {
        var img = req.file.originalname;
    }else{
        let product = await productsCollection.findOne({id: parseInt(id)});
        var img = product.img;
        
    }
    let editProduct = {name, price, categoryId, img, description};
    product = await productsCollection.updateOne({ id: parseInt(id) },  { $set: editProduct });
    if (product) {
        res.status(200).json(editProduct);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});

//show chi tiết 1 sản phẩm
router.get('/products/:id',async(req, res, next)=>{
    const db=await connectDb();
    const productsCollection = db.collection('products');
    let id=req.params.id;
    const product = await productsCollection.findOne({id: parseInt(id)});
    if (product) {
        res.status(200).json(product);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});



// xóa sản phẩm

router.delete('/products/:id', async (req, res, next) => {
    let id=req.params.id;
    const db=await connectDb();
    const productsCollection = db.collection('products');
    let product = await productsCollection.deleteOne({id: parseInt(id)});
    if(product){
        res.status(200).json({message: 'Xóa thành công'});
    }else{
        res.status(404).json({message: 'Not found'});
    }
});


//Trả về danh sách danh mục

router.get('/categories',async(req, res, next)=>{
    const db=await connectDb();
    const categoriesCollection = db.collection('categories');
    const categories = await categoriesCollection.find().toArray();
    if (categories) {
        res.status(200).json(categories);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});

//show chi tiết 1 danh mục
router.get('/categories/:id',async(req, res, next)=>{
    const db=await connectDb();
    const categoriesCollection = db.collection('categories');
    let id=req.params.id;
    const categories = await categoriesCollection.findOne({id: parseInt(id)});
    if (categories) {
        res.status(200).json(categories);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});

//thêm danh mục

router.post('/categories', upload.single('img'),async(req, res, next) =>{
    let {name} =req.body;
    let img = req.file.originalname;
    const db= await connectDb();
    const categoriesCollection = db.collection('categories');
    // lấy sản phẩm có id cao nhất bằng cách sắp xếp giảm dần (-1) và lấy 1
    let lastCategory = await categoriesCollection.find().sort({id:-1}).limit(1).toArray();
    // kiểm tra có lastCategory kh nếu có thì id+1, nếu kh có là kh có sản phẩm 
    //nào hết thì id = 1.
    let id = lastCategory[0] ? lastCategory[0].id + 1 : 1;
    let newCategory={id,name,img};
    await categoriesCollection.insertOne(newCategory);
    if (newCategory) {
        res.status(200).json(newCategory);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});

//sửa danh mục
router.put('/categories/:id',upload.single('img'),async(req,res,next)=>{
    let id = req.body.id;
    const db= await connectDb();
    const categoriesCollection = db.collection('categories');
    let {name} =req.body;
    if (req.file) {
        var img = req.file.originalname;
    }else{
        let category = await categoriesCollection.findOne({id: parseInt(id)});
        var img = category.img;
        
    }
    let editCategory = {name, img};
    category = await categoriesCollection.updateOne({ id: parseInt(id) },  { $set: editCategory });
    if (category) {
        res.status(200).json(editCategory);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});

//xóa danh mục

router.delete('/categories/:id', async (req, res, next) => {
    let id=req.params.id;
    const db=await connectDb();
    const categoriesCollection = db.collection('categories');
    let categories = await categoriesCollection.deleteOne({id: parseInt(id)});
    if(categories){
        res.status(200).json({message: 'Xóa thành công'});
    }else{
        res.status(404).json({message: 'Not found'});
    }
});


// trả về danh sách user

router.get('/users',async(req, res, next)=>{
    const db=await connectDb();
    const usersCollection = db.collection('users');
    const users = await usersCollection.find().toArray();
    if (users) {
        res.status(200).json(users);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});


//show chi tiết 1 users
router.get('/users/:id', async (req, res, next) => {
    const db = await connectDb();
    const usersCollection = db.collection('users');
    let id = req.params.id;
    const users = await usersCollection.findOne({id: id});
    if (users) {
        res.status(200).json(users);
    } else {
        res.status(404).json({message: 'Not found'});
    }
});

//sửa users

router.get('/hot', async (req, res, next) => {
    console.log('Hot products route hit');
    const db = await connectDb();
    const productsCollection = db.collection('products');
    const hotCategoryId = 4;
    try {
        const products = await productsCollection.find({ categoryId: hotCategoryId }).toArray();
        console.log('Products found:', products);
        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found for the hot category' });
        }
    } catch (error) {
        console.error('Error when fetching hot products:', error);
        res.status(500).send('Server error');
    }
});


// kiểm tra sản phẩm hot


module.exports = router;