const config = require('./env.config');

module.exports = {
  HOST: config.DB_HOST,
  USER: config.DB_USER,
  PASSWORD: config.DB_PASSWORD,
  DB: config.DB_NAME,
  PORT: config.DB_PORT,
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: config.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
};
