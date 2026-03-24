const bcrypt = require('bcryptjs');
const User = require('../modules/user/user.model');
const Role = require('../modules/role/role.model');

async function createSuperAdmin() {
    try {
        const existingSuperAdmin = await User.findOne({
            where: { username: 'superadmin' }
        });

        if (existingSuperAdmin) {
            return;
        }

        let superadminRole = await Role.findOne({ where: { name: 'superadmin' } });

        if (!superadminRole) {
            superadminRole = await Role.create({
                name: 'superadmin',
                description: 'Super Administrator - Toàn quyền quản trị hệ thống'
            });
            console.log('Đã tạo role superadmin');
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('Admin@123', salt);

        const superAdmin = await User.create({
            username: 'superadmin',
            email: 'superadmin@nltech.com',
            password: hashedPassword,
            fullname: 'Super Administrator',
            phone: '0000000000',
            role_id: superadminRole.id,
            isActive: true
        });

        console.log('=================================');
        console.log('Tạo SuperAdmin thành công!');
        console.log('Username: superadmin');
        console.log('Password: Admin@123');
        console.log('Email: superadmin@nltech.com');
        console.log('=================================');
        console.log('VUI LÒNG ĐỔI MẬT KHẨU SAU KHI ĐĂNG NHẬP!');
        console.log('=================================');

        return superAdmin;
    } catch (error) {
        console.error('Lỗi khi tạo SuperAdmin:', error);
        throw error;
    }
}

module.exports = createSuperAdmin;
