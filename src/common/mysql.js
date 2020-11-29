import mysql from 'mysql'
import logger from './logger'
import config from '../config'

const pool = mysql.createPool(config.mysqlPool)

pool.on('acquire', function (connection) {
  logger.info('【Connection %d acquired】', connection.threadId)
})

pool.on('connection', function (connection) {
  logger.info('【msql连接池】创建了一个新连接%d', connection.threadId)
})

pool.on('enqueue', function () {
  logger.info('【mysql队列】中等待可用连接的回调函数被触发')
})

pool.on('release', function (connection) {
  logger.info('【Connection %d released】', connection.threadId)
})

export default {
  pool,
  getConnection () {
    return new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          reject(err)
        } else {
          resolve(connection)
        }
      })
    })
  }
}
