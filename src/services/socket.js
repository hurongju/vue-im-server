import _ from 'lodash'
import RoomModel from '../models/room'
import cons from '../constants'
import logger from '../common/logger'
import cluster from 'cluster'
import { v4 as uuidv4 } from 'uuid'
export default class SocketService {
  online (username, sid) {
    if (cluster.isWorker) {
      process.send(JSON.stringify({
        from: cons.WORKER_PROCESS_NAME + process.pid,
        to: cons.MASTER_PROCESS_NAME,
        type: cons.processEvent.ON_LINE,
        data: { username, sid }
      }))
    }
    logger.info(`【SocketService online】【用户${username}已上线】`)
  }

  offline (username, sid) {
    if (cluster.isWorker) {
      process.send(JSON.stringify({
        from: cons.WORKER_PROCESS_NAME + process.pid,
        to: cons.MASTER_PROCESS_NAME,
        type: cons.processEvent.OFF_LINE,
        data: { username, sid }
      }))
    }
    logger.info(`SocketService offline】【用户${username}已离线】`)
  }

  sendHandshake (socket, username) { // 初次登录发送欢迎语
    logger.info(`【SocketService sendHandshake】【socket发送欢迎语】${socket.meta.username} vChat团队欢迎你`)
    socket.join(cons.PREFIX_ROOM_HAND_SHAKE + username)
    const msgData = {
      from: cons.DEFAULT_ROOM_NAME,
      to: username,
      content: cons.DEFAULT_WELCOME_WORDS,
      type: cons.message.SYSTEM_MESSAGE,
      cmd: cons.message.WELCOME_WORD_CMD,
      roomId: username,
      sendTime: Date.now(),
      uuid: uuidv4()
    }
    global.imCtx.emitter.of('/').to(cons.PREFIX_ROOM_HAND_SHAKE + username).emit('message', msgData)
  }

  sendMsg (msgData) { // 发送消息
    logger.info(`【往${msgData.roomId}房间发送消息】`, JSON.stringify(msgData))
    global.imCtx.emitter.of('/').to(cons.PREFIX_ROOM + msgData.roomId).emit('message', msgData)
  }

  join (username, room, cb) {
    if (cluster.isWorker) {
      process.once('message', (msg) => {
        logger.info(`【SocketService join】【worker进程${process.pid}接受到消息】`, msg)
        let msgObj = null
        try {
          msgObj = JSON.parse(msg)
          switch (msgObj.type) {
            case cons.processEvent.POST_SOCKET_ID:
              _.forEach(msgObj.data, async function (v) {
                await global.imCtx.io.of('/').adapter.remoteJoin(v.sid, cons.PREFIX_ROOM + room)
              })
              cb(null, 0)
              break
            default:
              cb(new Error('加入房间失败'))
          }
        } catch (e) {
          logger.error(`【SocketService join】【worker进程${process.pid}接受到消息】`, e)
          cb(e)
        }
      })
      const sendMsg = {
        from: cons.WORKER_PROCESS_NAME + process.pid,
        to: cons.MASTER_PROCESS_NAME,
        type: cons.processEvent.GET_SOCKET_ID,
        data: username
      }
      logger.info(`【SocketService join】【worker进程${process.pid}发送消息】`, JSON.stringify(sendMsg))
      process.send(JSON.stringify(sendMsg))
    } else {
      global.imCtx.io.sockets.sockets.forEach((socket, socketId) => {
        if (username.includes(socket.meta.username)) {
          socket.join(cons.PREFIX_ROOM + room)
        }
      })
      cb(null, 0)
    }
  }

  joinAll (socket, username) {
    // 查库获取所有roomId
    const roomModel = new RoomModel()
    roomModel.queryRoomList({ username }).then(data => {
      const roomId = []
      _.forEach(data, value => {
        roomId.push(value.roomId)
        socket.join(cons.PREFIX_ROOM + value.roomId)
      })
      logger.info(`【SocketService joinAll】【${username}获取所有roomId】`, roomId.join())
    }).catch(rej => {
      logger.error(`【SocketService joinAll】【${username}获取所有roomId】`, rej)
    })
  }
}
