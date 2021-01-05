import AddInfoModel from '../models/addInfo'
import UserModel from '../models/user'
import mysql from '../common/mysql'
import RoomModel from '../models/room'
import RoomMemberModel from '../models/roomMember'
import RoomMsgModel from '../models/roomMsg'
import logger from '../common/logger'
import cons from '../constants'
import to from 'await-to-js'
import SocketService from './socket'
import { v4 as uuidv4 } from 'uuid'

// 同意加人，更新加人记录表，插入会话表、会话成员表、聊天记录表
async function agree ({ fromId, fromName, id, name, uid }) {
  const [connectionErr, connection] = await to(mysql.getConnection())
  if (connectionErr) {
    logger.error('【UserService agree】【获取mysql连接失败】', connectionErr)
    return Promise.reject(connectionErr)
  }
  const now = Date.now()
  const content = `你好，我是${fromName}`
  // 更新add_info表数据
  const addInfoModel = new AddInfoModel(connection)
  const roomModel = new RoomModel(connection)
  const roomMemberModel = new RoomMemberModel(connection)
  const roomMsgModel = new RoomMsgModel(connection)
  const [findErr, addInfoData] = await to(addInfoModel.findOne({ toId: uid, fromId }))
  if (findErr) {
    connection.release()
    logger.error('【UserService agree】【查找add_info表失败】', findErr)
    return Promise.reject(findErr)
  }
  if (addInfoData[0].addStatus > 1) {
    connection.release()
    logger.info('【UserService agree】【查找add_info表状态已更新】', JSON.stringify(addInfoData))
    return Promise.resolve(cons.SUCCESS_CODE)
  }
  const [transactionErr] = await to(
    new Promise((resolve, reject) => {
      connection.beginTransaction(async (err) => {
        if (err) {
          return reject(err)
        }
        resolve(0)
      })
    })
  )
  if (transactionErr) {
    connection.release()
    logger.error('【UserService agree】【开启mysql事务失败】', transactionErr)
    return Promise.reject(transactionErr)
  }
  const addInfoRes = addInfoModel.updateAddStatus({ id, fromId, uid })
  // 查找是否存在room表数据
  let [roomInsertErr, roomIdObj] = await to(roomModel.find({
    nameList: [JSON.stringify([name, fromName]), JSON.stringify([fromName, name])]
  }))
  if (roomInsertErr) {
    connection.rollback(function () {
      connection.release()
    })
    return Promise.reject(roomInsertErr)
  }
  if (roomIdObj.length > 0) { // 存在room表数据，更新room表数据
    roomIdObj = {
      roomId: roomIdObj[0].roomId,
      lastMsgTime: now,
      lastMsg: content,
      name: JSON.stringify([name, fromName])
    }
    // 创建会话
    const [roomUpdateErr] = await to(roomModel.update(
      {
        roomId: roomIdObj.roomId,
        lastMsg: content,
        updateBy: fromName,
        lastMsgTime: now,
        status: 1
      }))
    if (roomUpdateErr) {
      connection.rollback(function () {
        connection.release()
      })
      return Promise.reject(roomUpdateErr)
    }
    // 插入聊天记录表
    const [roomMsgRes] = await to(roomMsgModel.insert({
      content: content,
      senderId: fromId,
      sender: fromName,
      roomId: roomIdObj.roomId,
      createTime: now
    }))
    if (roomMsgRes) {
      connection.rollback(function () {
        connection.release()
      })
      return Promise.reject(roomMsgRes)
    }
  } else {
    // 创建会话
    [roomInsertErr, roomIdObj] = await to(roomModel.insert({
      name: JSON.stringify([name, fromName]),
      lastMsg: content,
      createBy: fromName,
      createTime: now,
      type: cons.message.SINGLE_ROOM
    }))
    if (roomInsertErr) {
      connection.rollback(function () {
        connection.release()
      })
      return Promise.reject(roomInsertErr)
    }
    // 插入会话成员表
    const roomMemberOneRes = roomMemberModel.insert({
      roomId: roomIdObj.roomId,
      userId: uid,
      userName: name,
      createBy: fromName
    })
    const roomMemberTwoRes = roomMemberModel.insert({
      roomId: roomIdObj.roomId,
      userId: fromId,
      userName: fromName,
      createBy: fromName
    })
    // 插入聊天记录表
    const roomMsgRes = roomMsgModel.insert({
      content: content,
      senderId: fromId,
      sender: fromName,
      roomId: roomIdObj.roomId,
      createTime: now
    })
    const [allErr] = await to(Promise.all([addInfoRes, roomMemberOneRes, roomMemberTwoRes, roomMsgRes]))
    if (allErr) {
      connection.rollback(function () {
        connection.release()
      })
      return Promise.reject(allErr)
    }
  }
  return new Promise((resolve, reject) => {
    connection.commit(function (err) {
      if (err) {
        connection.rollback(function () {
          connection.release()
        })
        return reject(err)
      }
      connection.release()
      resolve(roomIdObj)
    })
  })
}

export default class UserService {
  async addFriend ({ toId, toName, fromId, fromName }) {
    const addInfoModel = new AddInfoModel()
    const [findErr, data] = await to(addInfoModel.findOne({ toId, fromId }))
    if (findErr) {
      logger.error('【UserService addFriend】【查询add_info表异常】', findErr)
      throw new Error('查询失败')
    }
    if (data.length > 0) {
      const [updateErr] = await to(addInfoModel.update({ id: data[0].id }))
      if (updateErr) {
        logger.error('【UserService addFriend】【更新dd_info表异常】', updateErr)
        throw new Error('更新失败')
      }
    } else {
      const [insertErr] = await to(addInfoModel.insert({ toId, toName, fromId, fromName }))
      if (insertErr) {
        logger.error('【UserService addFriend】【插入dd_info表异常】', insertErr)
        throw new Error('插入失败')
      }
    }
  }

  async deleteFriend ({ id, uid, roomId, username }) {
    const addInfoModel = new AddInfoModel()
    const roomModel = new RoomModel()
    const [updateUserInfoErr] = await to(addInfoModel.deleteFriend({ id, uid }))
    if (updateUserInfoErr) {
      logger.error('【UserService deleteFriend】【更新add_info表异常】', updateUserInfoErr)
      throw new Error('更新失败')
    }
    const [updateRoomErr] = await to(roomModel.delete({ roomId, updateBy: username }))
    if (updateRoomErr) {
      logger.error('【UserService deleteFriend】【更新room表异常】', updateRoomErr)
      throw new Error('更新失败')
    }
    // 发送删除好友socket消息
    const msgData = {
      roomId: roomId,
      lastMsgTime: Date.now(),
      lastMsg: `${username}删除了好友`,
      type: cons.message.SYSTEM_MESSAGE,
      cmd: cons.message.DELETE_FRIEND_CMD,
      from: cons.DEFAULT_SYSTEM_NAME,
      uuid: uuidv4()
    }
    const socketServiceInstance = new SocketService()
    socketServiceInstance.sendMsg(msgData)
  }

  async agreeAdd ({ fromId, fromName, id, name, uid }) {
    const [err, result] = await to(agree({ fromId, fromName, id, name, uid }))
    if (err) {
      logger.error('【UserService agreeAdd】【插入失败】', err)
      throw err
    }
    if (result === cons.SUCCESS_CODE) {
      logger.info('【UserService agreeAdd】【对方已经同意过了】')
      return result // 已经同意过了，直接返回
    }
    // 加入房间
    logger.info('【UserService agreeAdd】【入库成功socket开始加入房间】', result.roomId)
    const socketServiceInstance = new SocketService()
    const [addErr, data] = await to(new Promise((resolve, reject) => {
      socketServiceInstance.join([fromName, name], result.roomId, (err, data) => {
        if (err) {
          return reject(err)
        }
        // 发送加人消息，前端本地建立会话
        const msgData = {
          roomId: result.roomId,
          lastMsgTime: result.lastMsgTime,
          lastMsg: result.lastMsg,
          name: result.name,
          type: cons.message.SYSTEM_MESSAGE,
          cmd: cons.message.AGREE_ADD_FRIEND_CMD,
          from: cons.DEFAULT_SYSTEM_NAME,
          uuid: uuidv4()
        }
        socketServiceInstance.sendMsg(msgData)
        resolve(data)
      })
    }))
    if (addErr) {
      throw addErr
    }
    return data
  }

  async search ({ keyword, lastTime, pageSize, uid }) {
    const addInfoModel = new AddInfoModel()
    const userModel = new UserModel()
    const userList = userModel.search({
      name: keyword.trim() || '',
      lastTime: lastTime
    })
    const contactList = addInfoModel.getFriendList({
      id: uid
    })
    const [allErr, resList] = await to(
      Promise.all([userList, contactList])
    )
    if (allErr) {
      logger.error('【UserService search】【查找数据库失败】', allErr)
      throw new Error('查找失败')
    }
    const exceptList = []
    resList[1].forEach(val => {
      exceptList.push(val.uid)
    })
    const data = resList[0].filter(val => {
      return !~exceptList.indexOf(val.id)
    })
    return data.slice(0, pageSize)
  }

  async addList ({ pageSize, lastTime, uid }) {
    const addInfoModel = new AddInfoModel()
    const [err, data] = await to(
      addInfoModel.queryList({
        toId: uid,
        pageSize,
        lastTime
      })
    )
    if (err) {
      logger.error('【UserService addList】【查找add_info表失败】', err)
      throw new Error('查找失败')
    }
    return data
  }

  async deleteAddInfo ({ id }) {
    const addInfoModel = new AddInfoModel()
    const [err, data] = await to(addInfoModel.delete({ id: id }))
    if (err) {
      logger.error('UserService deleteAddInfo】【删除add_info表数据失败】', err)
    }
    return data
  }

  async getFriendList ({ id }) {
    const addInfoModel = new AddInfoModel()
    const [err, data] = await to(addInfoModel.getFriendList({ id: id }))
    if (err) {
      logger.error('UserService getFriendList】【获取add_info表数据失败】', err)
    }
    return data
  }
}
