require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

// Import model
const connectDb = require('../../models/db');

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
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    const mailOptions = {
        from: `"Shop" <${process.env.EMAIL_USERNAME}>`,
        to: email,
        subject: "Xác Minh Email Của Bạn",
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
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
}


// Trả về danh sách người dùng
router.get('/', async (req, res, next) => {
  const db = await connectDb();
  const usersCollection = db.collection('users');
  const users = await usersCollection.find().toArray();
  if (users.length > 0) {
      res.status(200).json(users);
  } else {
      res.status(404).json({ message: 'Not found' });
  }
});

// Hiển thị chi tiết một người dùng
router.get('/:id', async (req, res, next) => {
  const db = await connectDb();
  const usersCollection = db.collection('users');
  let id = req.params.id;
  // Giả sử id được lưu trữ dưới dạng số nguyên trong cơ sở dữ liệu
  const user = await usersCollection.findOne({ id: parseInt(id) });
  if (user) {
      res.status(200).json(user);
  } else {
      res.status(404).json({ message: 'Not found' });
  }
});

// Sửa thông tin người dùng
router.put('/:id', async (req, res, next) => {
  const db = await connectDb();
  const usersCollection = db.collection('users');
  let id = req.params.id; 
  let { username, password, email, role } = req.body;
  let editUser = { username, password, email, role };
  let user = await usersCollection.updateOne({ id: parseInt(id) }, { $set: editUser });

  if (user.matchedCount > 0) {
      res.status(200).json(editUser);
  } else {
      res.status(404).json({ message: 'User not found' });
  }
});



// Đăng ký
router.post('/register', async (req, res, next) => {
    // Lấy dữ liệu từ request body
    const { firstname, lastname, dateofbirth, gender, phoneNumber, username, password, email } = req.body;
    const db = await connectDb();
    const usersCollection = db.collection('users');
    const userId = uuidv4();
    
    // Kiểm tra người dùng tồn tại
    try {
        const userExists = await usersCollection.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).send({ message: 'Email hoặc Username đã được sử dụng.' });
        }

        // Mã hóa mật khẩu và lưu người dùng mới
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const verificationToken = generateRandomId(6); // Tạo token xác minh

        await usersCollection.insertOne({
            id: userId,
            firstname,
            lastname,
            dateofbirth,
            gender,
            phoneNumber,
            username,
            email,
            password: hashedPassword,
            verificationToken,
            key: 'off',
            role: 'user'
        });

        // Gửi email xác minh
        const emailSent = await sendVerificationEmail(email, verificationToken);
        if (!emailSent) {
            return res.status(500).send({ message: 'Không thể gửi email xác minh. Vui lòng thử lại sau.' });
        }

        res.status(201).send({ message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản của bạn.' });
    } catch (error) {
        console.error('Đã có lỗi xảy ra trong quá trình đăng ký:', error);
        res.status(500).send({ message: 'Lỗi server' });
    }
});

// Các route khác ...

module.exports = router;
