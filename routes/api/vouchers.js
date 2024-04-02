
const express = require('express');
const router = express.Router();

// Import model
const connectDb = require('../../models/db');


// Trong routes/vouchers.js

// Lấy danh sách tất cả vouchers
router.get('/', async (req, res) => {
    const db = await connectDb();
    const vouchersCollection = db.collection('vouchers');
  
    const vouchers = await vouchersCollection.find().toArray();
  
    res.json(vouchers);
  });
  
  // Lấy chi tiết voucher dựa trên ID
  router.get('/:id', async (req, res) => {
    const db = await connectDb();
    const vouchersCollection = db.collection('vouchers');
  
    const voucher = await vouchersCollection.findOne({ id: req.params.id });
  
    if (!voucher) {
      return res.status(404).json({ error: 'Không tìm thấy voucher' });
    }
  
    res.json(voucher);
  });
  
  // Xóa voucher dựa trên ID
  router.delete('/:id', async (req, res) => {
    const db = await connectDb();
    const vouchersCollection = db.collection('vouchers');
  
    const deletedVoucher = await vouchersCollection.findOneAndDelete({ _id: req.params.id });
  
    if (!deletedVoucher.value) {
      return res.status(404).json({ error: 'Không tìm thấy voucher để xóa' });
    }
  
    res.json({ message: 'Voucher đã được xóa thành công' });
  });
  
  module.exports = router;
  


module.exports = router;
