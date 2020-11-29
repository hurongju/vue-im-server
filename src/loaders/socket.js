import config from '../config'
import jwt from '../common/jwt'
import logger from '../common/logger'
import SocketService from '../services/socket'

function init (http) {
  const io = require('socket.io')(http)
  const redisAdapter = require('socket.io-redis')
  const Redis = require('ioredis')

  io.adapter(redisAdapter({
    pubClient: new Redis(config.redis),
    subClient: new Redis(config.redis)
  }))

  io.of('/').adapter.on('error', function (err) {
    logger.error('【socket.io-redis】 ', err)
  })

  io.on('connection', async function (socket) {
    const sockets = await io.allSockets()
    logger.info('【socket在线人数】', sockets.size)
    handler(socket)
  })

  io.use(function (socket, next) {
    const token = socket.handshake.query.token
    jwt.verify(token).then(data => {
      logger.info('【服务端socket校验成功】', data)
      next()
    }).catch(err => {
      logger.error('【服务端socket校验失败】', err)
      next(new Error('websocket认证失败'))
    })
  })

  global.imCtx.io = io

  const emitter = require('socket.io-emitter')(new Redis(config.redis))

  emitter.redis.on('error', function onError (err) {
    logger.error('【socket.io-emitter】', err)
  })

  global.imCtx.emitter = emitter
}

function handler (socket) {
  logger.info('【socket.handshake.query】', JSON.stringify(socket.handshake.query))
  const token = socket.handshake.query.token
  const isRegister = socket.handshake.query.isRegister
  const data = jwt.decode(token)
  logger.info('【JWT解密信息】', data)
  const socketServiceInstance = new SocketService()
  socket.meta = socket.meta || {}
  socket.meta.username = data.name

  // 初次登录发送消息
  if (isRegister === 'true') {
    socketServiceInstance.sendHandshake(socket, data.name)
  }
  // 用户进线
  socketServiceInstance.online(data.name, socket.id)
  // 加入所有聊天室
  socketServiceInstance.joinAll(socket, data.name)
  socket.on('message', function (message) {
    logger.info('【客户端推送socket消息】', socket.meta.username, socket.id, JSON.stringify(message))
  })

  socket.on('ack', function (message) {
    logger.info(`【客户端${data.name}收到socket消息回执】`, message)
  })

  socket.on('disconnect', function () {
    logger.info('【socket断开连接】', 'disconnect')
    socketServiceInstance.offline(socket.meta.username, socket.id)
  })
}

export default ({ app }) => {
  const http = require('http').createServer(app)
  init(http)

  http.listen(config.port, () => {
    logger.info(`
      🛡️ Server listening on port: ${config.port} Process in ${process.pid}🛡️
    `)
  }).on('error', err => {
    logger.error('【http server listen failed】', err)
    process.exit(1)
  })
}
