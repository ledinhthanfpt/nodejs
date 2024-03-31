var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
const { MongoClient } = require('mongodb');



const url = "mongodb://127.0.0.1:27017";
const dbName = 'bookshop';
const client = new MongoClient(url);

router.get('/', async function(req, res) {
  var token = req.query.token;
  if (!token) {
    return res.status(400).send('Verification token is required.');
  }

  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Tìm và cập nhật người dùng với token được cung cấp
    const updateResult = await usersCollection.updateOne(
      { verificationToken: token },
      { $set: { key: 'on' } } // Cập nhật key thành "on"
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).send('Token not valid or expired.');
    }

    res.send(`
    <p>Sác minh tài khoản thành công. Bạn sẽ được chuyển hướng về trang đăng nhập trong 5 giây.</p>
    <script>
      setTimeout(function() {
        window.location.href = "users/login";
      }, 5000);
    </script>
    `);
  
  } catch (err) {
    console.error('An error occurred:', err);
    return res.status(500).send('Internal server error.');
  } finally {
    await client.close();
  }
});

module.exports = router;
