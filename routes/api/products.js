var express = require('express'); 
var router = express.Router(); 
const multer = require('multer'); 
//Thiết lập nơi lưu trữ và tên file 
const checkUserPermission = require('../authMiddleware');
const checkAdminPermission = require('../authMiddleware-admin');


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

router.get('/',async(req, res, next)=>{
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

router.get('/danhsach/:categoryId', async (req, res, next) => {
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

router.get('/hot', async (req, res, next) => {
    const db = await connectDb();
    const productsCollection = db.collection('products');
    const product=await productsCollection.find({hot:1}).toArray();
    if(product){
        res.status(200).json(product);
    }else{
        res.status(400).json({message : "chịu kiếm ko ra"})
    }
});

//show chi tiết 1 sản phẩm
router.get('/:id',async(req, res, next)=>{
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

router.delete('/:id', async (req, res, next) => {
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

// GET danh sách sản phẩm theo tên danh mục
router.get('/categoryname/:name', async (req, res, next) => {
    const categoryName = req.params.name;
    const db = await connectDb();
    const categoriesCollection = db.collection('categories');
    const productsCollection = db.collection('products');

    try {
        // Đầu tiên, tìm ID của danh mục dựa trên tên
        const category = await categoriesCollection.findOne({ name: categoryName });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        // Tiếp theo, tìm tất cả sản phẩm thuộc danh mục đó
        const products = await productsCollection.find({ categoryId: category.id }).toArray();
        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found for this category' });
        }
    } catch (error) {
        console.error('Error fetching products by category name:', error);
        res.status(500).send('Server error');
    }
});

// GET danh sách sản phẩm theo ID danh mục
router.get('/categoryid/:id', async (req, res, next) => {
    const categoryId = parseInt(req.params.id); // Chuyển đổi id từ chuỗi sang số
    const db = await connectDb();
    const productsCollection = db.collection('products');

    try {
        // Truy vấn tìm tất cả sản phẩm thuộc danh mục đó
        const products = await productsCollection.find({ categoryId: categoryId }).toArray();
        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found for this category' });
        }
    } catch (error) {
        console.error('Error fetching products by category id:', error);
        res.status(500).send('Server error');
    }
});

// GET danh sách sản phẩm theo tên danh mục
router.get('/search/:name', async (req, res, next) => {
    const name = req.params.name;
    const db = await connectDb();
    const productsCollection = db.collection('products');

    try {
        // Tiếp theo, tìm tất cả sản phẩm thuộc danh mục đó
        const products = await productsCollection.find({ name: name }).toArray();
        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found for this category' });
        }
    } catch (error) {
        console.error('Error fetching products by category name:', error);
        res.status(500).send('Server error');
    }
});

// GET danh sách sản phẩm theo tên
router.get('/search-red/:name', async (req, res) => {
    const name = req.params.name;
    const db = await connectDb();
    const productsCollection = db.collection('products');

    try {
        // Sử dụng biểu thức chính quy để tìm kiếm linh hoạt
        const products = await productsCollection.find({ name: new RegExp(name, 'i') }).toArray(); // 'i' cho phép tìm kiếm không phân biệt hoa thường

        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found with that name' });
        }
    } catch (error) {
        console.error('Error fetching products by name:', error);
        res.status(500).send('Server error');
    }
});


router.get('/sort/asc/limit/:limit', async (req, res, next) => {
    const limit = parseInt(req.params.limit); // Lấy giới hạn từ URL và chuyển đổi sang số
    const db = await connectDb();
    const productsCollection = db.collection('products');

    try {
        // Truy vấn tìm tất cả sản phẩm, sắp xếp tăng dần theo giá và áp dụng giới hạn
        const products = await productsCollection.find().sort({ price: 1 }).limit(limit).toArray();
        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found' });
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server error');
    }
});

router.get('/sort/desc/limit/:limit', async (req, res, next) => {
    const limit = parseInt(req.params.limit); // Lấy giới hạn từ URL và chuyển đổi sang số
    const db = await connectDb();
    const productsCollection = db.collection('products');

    try {
        // Truy vấn tìm tất cả sản phẩm, sắp xếp tăng dần theo giá và áp dụng giới hạn
        const products = await productsCollection.find().sort({ price: -1 }).limit(limit).toArray();
        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found' });
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server error');
    }
});


router.get('/page/:pageNumber/limit/:limitNumber', async (req, res) => {
    const pageNumber = parseInt(req.params.pageNumber);
    const limitNumber = parseInt(req.params.limitNumber);
    const db = await connectDb();
    const productsCollection = db.collection('products');

    // Tính toán số sản phẩm bỏ qua dựa trên số trang
    const skipNumber = (pageNumber - 1) * limitNumber;

    try {
        const products = await productsCollection.find()
                                                 .skip(skipNumber)   // Bỏ qua số lượng sản phẩm đã xác định
                                                 .limit(limitNumber) // Giới hạn số lượng sản phẩm trên mỗi trang
                                                 .toArray();

        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching paginated products:', error);
        res.status(500).send('Server error');
    }
});



// kiểm tra sản phẩm liên quan


router.get('/related-products/:productId', async (req, res) => {
    const { productId } = req.params;
    const db = await connectDb();
    const productsCollection = db.collection('products');

    // Lấy sản phẩm dựa trên productId
    const product = await productsCollection.findOne({id: parseInt(productId)});

    console.log(product);

    if (!product) {
        return res.status(404).send({ message: 'Product not found' });
    }

    // Giả sử tên sản phẩm được tách bởi dấu cách và từ khóa đầu tiên là từ đầu tiên
    const firstKeyword = product.name.split(' ')[0];

    // Tìm sản phẩm liên quan dựa vào từ khóa đầu tiên, trừ sản phẩm hiện tại
    const relatedProducts = await productsCollection.aggregate([
        { $match: { name: { $regex: firstKeyword, $options: 'i' }, _id: { $ne: productId } } },
        { $sample: { size: 4 } } // Lấy ngẫu nhiên 4 sản phẩm
    ]).toArray();

    res.json(relatedProducts);
});




module.exports = router;