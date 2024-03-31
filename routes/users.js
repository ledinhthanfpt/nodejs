
require('dotenv').config();

const nodemailer = require('nodemailer');
const { encrypt, decrypt } = require('./crypto'); // Đường dẫn tương đối từ users.js tới crypto.js
const checkUserLoggedIn = require('./authMiddleware');

var fs = require('fs');
var path = require('path');
var {
  validationResult
} = require('express-validator');
require('dotenv').config();


var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const upload = multer();



async function findUserByEmail(email) {
  const db = await connectDb();
  const collection = db.collection('users'); // Thay 'users' bằng tên collection thực tế của bạn
  const user = await collection.findOne({ email: email });
  return user;
}



const url = "mongodb://127.0.0.1:27017";
const dbName = 'bookshop';
const client = new MongoClient(url);
const saltRounds = 10;

function generateRandomId(length) {
  var result = '';
  var characters = '0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function sendVerificationEmail(email, verificationToken) {
  // Create a transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  const mailOptions = {
    from: `"Shop" <${process.env.EMAIL_USERNAME}>`, // sender address
    to: email, // list of receivers
    subject: "Xác Minh Email Của Bạn", // Subject line
    html: `
      <html>
        <body>
          <h1>Xác Minh Email Của Bạn</h1>
          <p>Cảm ơn bạn đã đăng ký! Vui lòng nhấp vào liên kết dưới đây để xác minh địa chỉ email của bạn và kích hoạt tài khoản.</p>
          <a href="http://localhost:3000/verify?token=${verificationToken}" style="background-color: #4CAF50; color: white; padding: 15px 25px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 5px; transition: background-color 0.3s ease-in-out;">
          Xác Minh Ngay</a>
          <p>Nếu bạn không đăng ký tài khoản này, bạn có thể bỏ qua email này.</p>
        </body>
      </html>
    `
  };

  try {
    // Send mail with defined transport object
    let info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

async function connectDb() {
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  return db;
}

router.get('/', checkUserLoggedIn, async (req, res, next) => {
  const db = await connectDb();
  const usersCollection = db.collection('users');
  const users = await usersCollection.find().toArray();
  res.render('users', { users })
})

router.get('/roleadmin',checkUserLoggedIn, async (req, res, next) => {
  try {
    const db = await connectDb();
    const usersCollection = db.collection('users');

    // Chỉ lấy những người dùng có role là 'admin'
    const admins = await usersCollection.find({ role: 'admin' }).toArray();

    // Hiển thị danh sách người dùng có vai trò là admin thông qua template 'roleadmin'
    res.render('roleadmin', { admins });
  } catch (error) {
    console.error('Đã có lỗi xảy ra:', error);
    res.status(500).send('Internal server error');
  }
})
// Lấy thông tin người dùng để sửa, dựa trên username
router.get('/edit/:username',checkUserLoggedIn, async (req, res) => {
  try {
    const username = req.params.username;

    const db = await connectDb();

    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username: username });

    if (!user) {
      return res.status(404).send('Không tìm thấy người dùng với username cung cấp');
    }

    res.render('editUser', { user });
  } catch (error) {
    console.error('Đã có lỗi xảy ra', error);
    res.status(500).send('Lỗi server khi lấy thông tin người dùng.');
  }
});

router.post('/edit/',checkUserLoggedIn, async (req, res) => {
  try {
    const { username, email, role } = req.body; // Lấy dữ liệu từ form
    console.log(req.body);

    const db = await connectDb();

    const usersCollection = db.collection('users');

    const updateResult = await usersCollection.updateOne({ username }, { $set: { email, role } });

    if (updateResult.matchedCount === 0) {
      return res.status(404).send('Không tìm thấy người dùng để cập nhật.');
    }

    res.redirect('/users');
  } catch (error) {
    console.error('Đã có lỗi xảy ra', error);
    res.status(500).send('Lỗi server khi cập nhật thông tin người dùng.');
  }
});




// xóa người dùng
router.get('/delete/:username',checkUserLoggedIn, async (req, res) => {
  try {
    const { username } = req.params;
    const db = await connectDb();
    const usersCollection = db.collection('users');

    const deleteResult = await usersCollection.deleteOne({ username: username });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).send('Không tìm thấy người dùng để xóa.');
    }

    // Redirect sau khi xóa thành công
    res.redirect('/users');
  } catch (error) {
    console.error('Đã có lỗi xảy ra', error);
    res.status(500).send('Lỗi server khi xóa người dùng.');
  }
});


// Đăng ký
router.get('/register', function (req, res) {
  res.render('register');
});

router.post('/register', async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      dateofbirth,
      gender,
      phoneNumber,
      username,
      password,
      email
    } = req.body;
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString(); // Tạo token xác minh
    const db = await connectDb();
    const usersCollection = db.collection('users');

    // Kiểm tra xem người dùng đã tồn tại chưa
    const existingUser = await usersCollection.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).send('Người dùng đã tồn tại');
    }

    // Mã hóa mật khẩu và lưu người dùng mới
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await usersCollection.insertOne({
      firstname,
      lastname,
      dateofbirth,
      gender,
      phoneNumber,
      username,
      password: hashedPassword,
      email,
      key: 'off', // 'off' nghĩa là tài khoản chưa được xác minh
      verificationToken,
      role: 'user' // Mặc định vai trò là 'user'
    });

    // Gửi email xác minh
    const emailSent = await sendVerificationEmail(email, verificationToken);
    if (emailSent) {
      res.send("Đăng Kí Thành Công. Vui lòng kiểm tra mail để xác minh tài khoản.");
    } else {
      res.send("Đăng ký thành công, nhưng không thể gửi email xác minh.");
    }
  } catch (err) {
    console.error("Error processing request:", err);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});



// Đăng nhập
router.get('/login', function (req, res) {
  res.render('login');
});

// Đăng nhập
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const db = await connectDb();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username });

    if (user && await bcrypt.compare(password, user.password)) {

      // Tạo JWT cho người dùng
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({
        userId: user._id,
        role: user.role,
        username: user.username 
      }, process.env.KEY_CRYPTO, { expiresIn: '7d' });
      

      // Lưu JWT vào cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        // secure: true, 
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 1 tuần
      });
      
      

      // Kiểm tra nếu người dùng là 'admin', chuyển hướng đến trang quản lý admin
      if (user.key === 'off') {
        res.status(401).send('Vui lòng sác minh tài khoản bằng đường dẫn trong gmail');
      } else if (user.key === 'xx') {
        res.status(401).send('Tài khoản quản trị bị khóa liên hệ mail:"quanlyhosothucung@gmail.com" để biết thêm ');
      } else if (user.role === 'admin') {
        return res.redirect('/products');
      } else if (user.role === 'user') {
        // Chuyển hướng người dùng thông thường đến trang shopee
        return res.redirect('https://shopee.vn/');
      }
    } else {
      res.status(401).send('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  } catch (error) {
    console.error('Đã có lỗi xảy ra', error);
    res.status(500).send('Lỗi server');
  }
});
// thay đổi mật khẩu

router.get('/change-password', function (req, res) {
  res.render('change-password');
});

router.post('/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  try {
    const db = await connectDb();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username });

    // Kiểm tra mật khẩu hiện tại có đúng không
    if (user && await bcrypt.compare(currentPassword, user.password)) {
      // Mật khẩu hiện tại đúng, tiến hành cập nhật mật khẩu mới
      const salt = await bcrypt.genSalt(10);

      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      await usersCollection.updateOne({ username }, { $set: { password: hashedNewPassword } });

      res.redirect('/users/login');
    } else {
      // Mật khẩu hiện tại không đúng
      res.status(400).send('Mật khẩu hiện tại không chính xác.');
    }
  } catch (error) {
    console.error('Đã có lỗi xảy ra', error);
    res.status(500).send('Lỗi server khi thay đổi mật khẩu.');
  }
});





//quen mat khau sac minh bang gmail

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

router.get('/forgot-password', function (req, res) {
  res.render('forgot-password');
});
// Route xử lý form quên mật khẩu
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const encryptedEmail = encrypt(email); // Sử dụng hàm mã hóa đã được yêu cầu

  const mailOptions = {
    from: process.env.EMAIL_USERNAME, // Sử dụng email từ biến môi trường
    to: email,
    subject: 'Yêu Cầu Đặt Lại Mật Khẩu',
    html: `
           <html>
        <body>
          <h1>Yêu Cầu Đặt Lại Mật Khẩu</h1>
          <p>Đây là mã xác nhận của bạn:</p>
          <a href="http://localhost:3000/users/forgot-password-edit?token=${encryptedEmail}" style="background-color: #4CAF50; color: white; padding: 15px 25px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 5px; transition: background-color 0.3s ease-in-out;">
          Xác Minh Ngay</a>
          <p>Nếu bạn không đăng ký tài khoản này, bạn có thể bỏ qua email này.</p>
        </body>
      </html>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email đặt lại mật khẩu đã được gửi.');
    res.send('Yêu cầu đặt lại mật khẩu đã được xử lý, vui lòng kiểm tra email của bạn.');
  } catch (error) {
    console.error('Lỗi khi gửi email: ', error);
    res.status(500).send('Lỗi khi gửi yêu cầu đặt lại mật khẩu.');
  }
});

// Trong file route của bạn, ví dụ: users.js
router.get('/forgot-password-edit', async (req, res) => {
  const { token } = req.query;

  try {
    const decryptedEmail = decrypt(token);
    const user = await findUserByEmail(decryptedEmail);
    console.log(user);
    if (user) {
      // Nếu tìm thấy người dùng, hiển thị form đặt lại mật khẩu
      res.render('forgot-password-edit', { email: decryptedEmail });
    } else {
      // Nếu không tìm thấy, thông báo lỗi
      res.status(404).send('Không tìm thấy người dùng.');
    }
  } catch (error) {
    console.error('Lỗi khi truy vấn cơ sở dữ liệu:', error);
    res.status(500).send('Lỗi máy chủ nội bộ.');
  }
});



async function updateUserPassword(email, hashedPassword) {
  const db = await connectDb();
  const collection = db.collection('users'); // Thay đổi 'users' nếu tên collection của bạn khác

  // Cập nhật mật khẩu mới cho người dùng
  const updateResult = await collection.updateOne(
    { email: email },
    { $set: { password: hashedPassword } }
  );

  if (updateResult.matchedCount === 0) {
    throw new Error('Không tìm thấy người dùng với email này.');
  }

  return updateResult;
}

router.post('/forgot-password-edit', async (req, res) => {
  const { email, newPassword, confirmNewPassword } = req.body;

  // Kiểm tra mật khẩu mới và mật khẩu xác nhận có khớp không
  if (newPassword !== confirmNewPassword) {
    return res.status(400).send('Mật khẩu mới và xác nhận mật khẩu không khớp.');
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds); // Mã hóa mật khẩu mới
    await updateUserPassword(email, hashedPassword); // Cập nhật mật khẩu đã mã hóa
    res.send(`Mật khẩu đã được đặt lại thành công.
      <script>
      setTimeout(function() {
        window.location.href = "users/login";
      }, 5000);
    </script>
    `);
  } catch (error) {
    console.error('Lỗi khi cập nhật mật khẩu mới:', error);
    res.status(500).send('Lỗi server khi đặt lại mật khẩu.');
  }
});
module.exports = router;
