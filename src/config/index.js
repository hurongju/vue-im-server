import dotenv from 'dotenv'
import _ from 'lodash'
import path from 'path'

let envPath = '.env.development'

const config = require(`./${process.env.NODE_ENV}`).default

if (process.env.NODE_ENV === 'production') {
  envPath = '.env.production'
} else if (process.env.NODE_ENV === 'staging') {
  envPath = '.env.staging'
}

const envFound = dotenv.config({ path: envPath })

if (envFound.error) {
  throw new Error("Couldn't find .env file")
}

export default _.merge({ // 递归合并对象和数组
  workers: 0, // worker进程数量，默认不开启多进程
  port: 8080, // 默认服务端口
  /* redis配置 */
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT)
  },
  /* jwt配置 */
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: 30 * 24 * 60 * 60,
    algorithm: 'HS512'
  },
  /* mysql连接池配置 */
  mysqlPool: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    port: process.env.MYSQL_PORT,
    charset: process.env.MYSQL_CHARSET,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: Number(process.env.MYSQL_POOL_CONNECTION_LIMIT)
  },
  /* 日志配置 */
  log: {
    filename: path.join(__dirname, '../../log/all-the-logs.log') // 日志文件
  },
  /* 静态资源 */
  resource: {
    enable: true, // 是否开启
    root: path.join(__dirname, '../../www'), // 静态资源根目录
    publicPath: /^\/(static|favicon\.ico)/ // 公共资源路径
  },
  /* 文件上传配置 */
  upload: {
    maxCount: 3, // 多文件上传最大数量
    maxSize: 10 * 1024 * 1024, // 文件最大大小
    mimetypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'] // 允许的上传类型
  },
  whiteUrl: ['/api/login/index', '/login/index'], // 请求白名单,不校验token
  /* 接口路由 */
  api: {
    prefix: '/api', // 路由前缀
    upload: '/api/upload' // 上传文件路由
  }
}, config)
