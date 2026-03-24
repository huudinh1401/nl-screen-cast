require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/sequelize');
const User = require('../modules/user/user.model');
const Role = require('../modules/role/role.model');

async function resetSuperAdminPassword() {
    try {
        await db.sequelize.authenticate();
        console.log('Kết nối database thành công');

        const superAdmin = await User.findOne({
            where: { username: 'superadmin' },
            include: [{
                model: Role,
                as: 'Role'
            }]
        });

        if (!superAdmin) {
            console.error('Không tìm thấy tài khoản superadmin');
            process.exit(1);
        }

        const newPassword = 'Admin@123';
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await superAdmin.update({
            password: hashedPassword,
            refreshToken: null
        });

        console.log('=================================');
        console.log('Reset mật khẩu SuperAdmin thành công!');
        console.log('Username: superadmin');
        console.log('Password: Admin@123');
        console.log('=================================');
        console.log('VUI LÒNG ĐỔI MẬT KHẨU SAU KHI ĐĂNG NHẬP!');
        console.log('=================================');

        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error);
        process.exit(1);
    }
}

resetSuperAdminPassword();
