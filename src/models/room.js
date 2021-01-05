import BaseModel from './base'
import cons from '../constants'

export default class RoomModel extends BaseModel {
  find ({ nameList }) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT room_id as roomId  FROM im_room WHERE `name` IN (?)'
      this.conn.query(sql, [nameList], (err, results, fields) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }

  queryRoomList ({ username }) { // 查询聊天列表
    return new Promise((resolve, reject) => {
      const sql = `SELECT a.room_id as roomId, a.last_msg_time as lastMsgTime, a.last_msg as lastMsg,
                a.name as \`name\`, a.nickname as nickname, b.is_top as isTop FROM im_room as a
                LEFT JOIN im_room_member as b ON a.room_id = b.room_id
                WHERE b.user_name = ? AND a.status = 1 ORDER BY a.last_msg_time DESC`
      this.conn.query(sql, [username], (err, results, fields) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }

  insert ({ name, lastMsg, createBy = cons.DEFAULT_SYSTEM_NAME, createTime, type = cons.message.SYSTEM_ROOM }) {
    return new Promise((resolve, reject) => {
      const time = Date.now()
      this.conn.query('INSERT INTO `im_room` SET ?', {
        name: name,
        last_msg_time: time,
        last_msg: lastMsg,
        create_time: createTime || time,
        type: type,
        update_time: createTime || time,
        create_by: createBy,
        update_by: createBy
      }, (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            roomId: results.insertId,
            lastMsgTime: time,
            lastMsg: lastMsg,
            name: name
          })
        }
      })
    })
  }

  update ({ lastMsg, lastMsgTime, updateBy, roomId, status }) {
    return new Promise((resolve, reject) => {
      let sql = 'UPDATE `im_room` SET `last_msg_time` = ?, `last_msg` = ?, `update_time` = ?, `update_by` = ?, `status` = 1  WHERE `room_id` = ?'
      if (!status) {
        sql += ' AND `status` = 1'
      }
      this.conn.query(sql, [
        lastMsgTime || Date.now(),
        lastMsg,
        lastMsgTime || Date.now(),
        updateBy,
        roomId
      ], (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }

  delete ({ updateBy, roomId }) {
    const now = Date.now()
    return new Promise((resolve, reject) => {
      this.conn.query('UPDATE `im_room` SET `update_time` = ?, `update_by` = ?, `status` = 0  WHERE `room_id` = ?', [
        now,
        updateBy,
        roomId
      ], (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }
}
