const userService = require("./user.service");
const logService = require('../log/log.service');

const createUser = async (req, res) => {
    try {
        const { username, email, password, fullname, phone } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email và password là bắt buộc'
            });
        }

        const userData = {
            username,
            email,
            password,
            fullname: fullname || '',
            phone: phone || '',
            role_id: 2
        };

        const newUser = await userService.createUser(userData);

        const logData = {
            user_id: req.user?.id || null,
            noi_dung: `Tạo người dùng mới: ${newUser.username}`,
            source: 'user_management'
        };
        await logService.addLog(logData);

        res.status(201).json({
            success: true,
            message: 'Tạo người dùng thành công',
            data: newUser
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { createUser };
