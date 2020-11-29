import cons from '../constants'
import BaseModel from './base'

export default class RoomMemberModel extends BaseModel {
  query ({ roomId = '' }) {
    return new Promise((resolve, reject) => {
      this.conn.query('SELECT * FROM `im_room_member` WHERE `room_id` = ? AND `status` = 1', [roomId], (err, results, fields) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }

  insert ({ roomId, userId, userName, isTop = cons.message.IS_NOT_TOP, createBy = cons.DEFAULT_SYSTEM_NAME, memberType = null }) {
    return new Promise((resolve, reject) => {
      const time = Date.now()
      this.conn.query('INSERT INTO `im_room_member` SET ?', {
        room_id: roomId,
        user_id: userId,
        user_name: userName,
        is_top: isTop,
        create_time: time,
        update_time: time,
        create_by: createBy,
        update_by: createBy,
        member_type: memberType
      }, (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            roomMemberId: results.insertId
          })
        }
      })
    })
  }

  getRoomId ({ toId = '', uid = '' }) {
    return new Promise((resolve, reject) => {
      this.conn.query(`SELECT room_id as roomId, COUNT(room_id) as \`count\` FROM im_room_member
      WHERE user_id = ? OR user_id = ? GROUP BY room_id HAVING \`count\` > 1`, [toId, uid], (err, results, fields) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }
}
