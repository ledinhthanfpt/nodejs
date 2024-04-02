var express = require('express');
var router = express.Router();
const checkUserLoggedIn = require('./authMiddleware');

// thực hiện gọi đến model db
const connectDb = require('../models/db');

//hiển thị trang sản phẩm
router.get('/', checkUserLoggedIn, async (req, res, next) => {
  const db = await connectDb();
  const vouchersCollection = db.collection('vouchers');

  const vouchers = await vouchersCollection.find().toArray();

  res.render('vouchers', { vouchers })

})

router.get('/add', checkUserLoggedIn, function (req, res, next) {
  res.render('addVouchers');
});
// Trong routes/vouchers.js
router.post('/add', checkUserLoggedIn, async (req, res) => {
  const db = await connectDb();
  const vouchersCollection = db.collection('vouchers');

  const newVoucher = {
    name: req.body.name,
    type: req.body.type,
    value: req.body.value,
    condition: req.body.condition,
    expiration_date: req.body.date
  };
  await vouchersCollection.insertOne(newVoucher);
  res.redirect('/vouchers');
});

// Trong routes/vouchers.js

// Hiển thị chi tiết voucher dựa trên ID
router.get('/:id', checkUserLoggedIn, async (req, res) => {
  const db = await connectDb();
  const vouchersCollection = db.collection('vouchers');

  const voucher = await vouchersCollection.findOne({ _id: req.params.id });

  if (!voucher) {
    // Trả về lỗi nếu không tìm thấy voucher
    return res.status(404).send('Không tìm thấy voucher');
  }

  res.render('voucherDetail', { voucher });
});

// Xóa voucher dựa trên ID
router.post('/:id/delete', checkUserLoggedIn, async (req, res) => {
  const db = await connectDb();
  const vouchersCollection = db.collection('vouchers');

  const deletedVoucher = await vouchersCollection.findOneAndDelete({ _id: req.params.id });

  if (!deletedVoucher.value) {
    // Trả về lỗi nếu không tìm thấy voucher để xóa
    return res.status(404).send('Không tìm thấy voucher để xóa');
  }

  // Redirect về trang danh sách voucher sau khi xóa
  res.redirect('/vouchers');
});



module.exports = router;
