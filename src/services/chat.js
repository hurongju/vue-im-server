import mysql from '../common/mysql'
import RoomModel from '../models/room'
import RoomMsgModel from '../models/roomMsg'
import logger from '../common/logger'
import cons from '../constants'
import to from 'await-to-js'
import { v4 as uuidv4 } from 'uuid'
import SocketService from './socket'

export default class ChatService {
  async getMsgList ({ roomId, page, pageSize, lastMsgSendTime }) {
    const roomMsgModel = new RoomMsgModel()
    const [err, data] = await to(roomMsgModel.queryList({ roomId, page, pageSize, lastMsgSendTime }))
    if (err) {
      logger.error('【ChatService getMsgList】【查找room_msg表失败】', err)
      throw new Error('查找失败')
    }
    return data
  }

  async send ({ content, type, roomId, toName, sendSocketId, name, uid }) {
    const [connectionErr, connection] = await to(mysql.getConnection())
    if (connectionErr) {
      logger.error('【ChatService send】【获取mysql连接失败】', connectionErr)
      throw connectionErr
    }
    const [transactionErr] = await to(
      new Promise((resolve, reject) => {
        connection.beginTransaction(async (err) => {
          if (err) {
            return reject(err)
          }
          resolve(cons.SUCCESS_CODE)
        })
      })
    )
    if (transactionErr) {
      connection.release()
      logger.error('【ChatService send】【开启mysql事务失败】', transactionErr)
      throw transactionErr
    }
    const roomModel = new RoomModel(connection)
    const roomMsgModel = new RoomMsgModel(connection)
    // 更新room表最后消息数据
    const [roomUpdateErr, roomResult] = await to(roomModel.update({ lastMsg: content, updateBy: name, roomId: roomId }))
    if (roomUpdateErr) {
      logger.error('【ChatService send】【更新room表失败】', roomUpdateErr)
      connection.rollback(function () {
        connection.release()
      })
      throw roomUpdateErr
    }
    if (roomResult.affectedRows === 0) { // 会话不存在，前端提示已被好友删除
      connection.commit(function (err) {
        if (err) {
          connection.rollback(function () {
            connection.release()
          })
        }
        connection.release()
      })
      return cons.FAIL_CODE
    }
    // 插入room_msg表数据
    const [roomMsgErr, results] = await to(roomMsgModel.insert({ content, senderId: uid, sender: name, type, roomId }))
    if (roomMsgErr) {
      logger.error('【ChatService send】【插入room_msg表失败】', roomMsgErr)
      connection.rollback(function () {
        connection.release()
      })
      throw roomMsgErr
    }
    const [commitErr] = await to(
      new Promise((resolve, reject) => {
        connection.commit(function (err) {
          if (err) {
            connection.rollback(function () {
              connection.release()
            })
            return reject(err)
          }
          connection.release()
          return resolve(cons.SUCCESS_CODE)
        })
      })
    )
    if (commitErr) {
      logger.error('【ChatService send】【事务提交commit失败】', commitErr)
      throw commitErr
    }
    // 发送socket消息
    const data = {
      id: results.msgId,
      from: name,
      to: toName,
      content: content,
      type: type,
      roomId: roomId,
      sendTime: Date.now(),
      sendSocketId: sendSocketId,
      uuid: uuidv4()
    }
    const socketServiceInstance = new SocketService()
    socketServiceInstance.sendMsg(data)
    return cons.SUCCESS_CODE
  }
}
