import cons from '../constants'
import BaseModel from './base'

export default class RoomMsgModel extends BaseModel {
  queryList ({ roomId = '', page = 1, pageSize = 10, lastMsgSendTime }) {
    const sql = `SELECT \`content\`, create_time as sendTime, \`extra\`, msg_id as id, sender as \`from\`, \`type\`  FROM im_room_msg WHERE \`room_id\` = ? AND
    \`status\` = 1 AND \`create_time\` < ? ORDER BY \`create_time\` DESC LIMIT ?`
    const args = [
      roomId,
      lastMsgSendTime || Date.now(),
      pageSize
    ]
    return new Promise((resolve, reject) => {
      this.conn.query(sql, args, (err, results, fields) => {
        if (err) {
          reject(err)
        } else {
          results.sort(function (a, b) {
            return a.sendTime - b.sendTime
          })
          resolve(results)
        }
      })
    })
  }

  insert ({ content, senderId, sender = '[SYSTEM]', type = cons.message.NORMAL_TEXT_MESSAGE, extra = null, roomId, createTime }) {
    return new Promise((resolve, reject) => {
      const time = Date.now()
      this.conn.query('INSERT INTO `im_room_msg` SET ?', {
        content: content,
        sender_id: senderId,
        sender: sender,
        type: type,
        create_time: createTime || time,
        update_time: createTime || time,
        extra: extra,
        room_id: roomId
      }, (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            msgId: results.insertId
          })
        }
      })
    })
  }
}
