import BaseModel from './base'
import cons from '../constants'

export default class AddInfoModel extends BaseModel {
  findOne ({ toId, fromId }) {
    return new Promise((resolve, reject) => {
      this.conn.query(`SELECT \`id\`, \`add_status\` as addStatus from im_add_info
        WHERE to_id = ? AND from_id = ?`,
      [toId, fromId], (err, results, fields) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }

  queryList ({ toId, pageSize = 10, lastTime }) {
    return new Promise((resolve, reject) => {
      this.conn.query(`SELECT a.id, a.from_name as fromName, a.from_id as fromId, a.update_time as updateTime,
      a.add_status as addStatus, b.avatar_url as avatarUrl FROM
      ( SELECT * , ROW_NUMBER() OVER (PARTITION BY \`from_id\` ORDER BY \`add_status\` DESC, \`update_time\` DESC )
        as \`ranker\` FROM \`im_add_info\` WHERE \`to_id\` = ? AND \`status\` = 1 ) as a
        LEFT JOIN \`im_user\` as b
        ON a.from_id = b.id
        WHERE a.ranker = 1 AND a.update_time < ? ORDER BY a.update_time DESC LIMIT ?`,
      [toId, lastTime || Date.now(), pageSize], (err, results, fields) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }

  updateAddStatus ({ updateTime, id, fromId, uid }) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE `im_add_info` SET `update_time` = ?, `add_status` = 2 WHERE `id` = ? OR (`to_id` = ? AND `from_id` = ?)'
      const data = [updateTime || Date.now(), id, fromId, uid]
      this.conn.query(sql, data, (err, results) => {
        if (err) {
          console.log('updateAddStatuserr :>> ', err)
          reject(err)
        } else {
          resolve(cons.SUCCESS_CODE)
        }
      })
    })
  }

  update ({ updateTime, addStatus, id }) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE `im_add_info` SET `update_time` = ?, `status` = 1, `add_status` = ? WHERE `id` = ?'
      const data = [updateTime || Date.now(), addStatus || 1, id]
      data.push()
      this.conn.query(sql, data, (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve(cons.SUCCESS_CODE)
        }
      })
    })
  }

  insert ({ toId, toName, fromId, fromName }) {
    return new Promise((resolve, reject) => {
      const time = Date.now()
      this.conn.query('INSERT INTO `im_add_info` SET ?', {
        to_id: toId,
        to_name: toName,
        from_id: fromId,
        from_name: fromName,
        create_time: time,
        update_time: time
      }, (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve(cons.SUCCESS_CODE)
        }
      })
    })
  }

  delete ({ updateTime, id }) {
    return new Promise((resolve, reject) => {
      const now = Date.now()
      this.conn.query('UPDATE `im_add_info` SET `status` = 0, `update_time` = ? WHERE `id` = ?', [updateTime || now, id], (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve(cons.SUCCESS_CODE)
        }
      })
    })
  }

  getFriendList ({ id }) {
    return new Promise((resolve, reject) => {
      this.conn.query(`SELECT f.*, e.room_id as roomId FROM
      (
        SELECT name,id,avatarUrl,uid FROM
        (
            SELECT b.name, c.id, b.avatar_url as avatarUrl, c.uid, row_number() over(PARTITION by name) as ranker FROM
            (
              SELECT a.id,  a.from_id as uid FROM im_add_info as a  WHERE a.to_id = ? AND a.add_status = 2
              UNION ALL
              SELECT a.id, a.to_id as uid FROM im_add_info as a  WHERE a.from_id = ? AND a.add_status = 2
            ) as c
            LEFT JOIN im_user as b ON c.uid = b.id WHERE b.status = 1
        ) as d WHERE  d.ranker = 1
      ) as f
      LEFT JOIN
      (
        SELECT * FROM
        (
          SELECT b.room_id,b.user_id,row_number() over(PARTITION by user_id) as ranker FROM \`im_room_member\` as a
          LEFT JOIN \`im_room_member\` as b ON a.room_id = b.room_id
          WHERE a.user_id = ? AND b.user_id != ? AND a.status = 1 AND b.status = 1
        ) as ab WHERE ab.ranker = 1
      ) as e
      ON e.user_id = f.uid`, [id, id, id, id], (err, results, fields) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }

  deleteFriend ({ id, uid }) {
    return new Promise((resolve, reject) => {
      const now = Date.now()
      this.conn.query('UPDATE `im_add_info` SET `add_status` = 0, `update_time` = ? WHERE (`from_id` = ? AND `to_id` = ?) OR (`from_id` = ? AND `to_id` = ?)',
        [now, id, uid, uid, id], (err, results) => {
          if (err) {
            reject(err)
          } else {
            resolve(cons.SUCCESS_CODE)
          }
        })
    })
  }
}
