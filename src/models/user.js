import md5 from 'md5'
import moment from 'moment'
import BaseModel from './base'

export default class UserModel extends BaseModel {
  search ({ name = '', lastTime }) {
    return new Promise((resolve, reject) => {
      this.conn.query(`SELECT \`id\`, avatar_url as avatarUrl, name as username, create_time as createTime FROM im_user
      WHERE \`name\` LIKE ? AND create_time < ? AND \`status\` = 1 ORDER BY create_time DESC LIMIT 50`,
      ['%' + name + '%', lastTime || Date.now()], (err, results, fields) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }

  query ({ name = '' }) {
    return new Promise((resolve, reject) => {
      this.conn.query('SELECT * FROM `im_user` WHERE `name` = ? AND `status` = 1', [name], (err, results, fields) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  }

  insert ({ name, pass }) {
    return new Promise((resolve, reject) => {
      const salt = Math.random().toFixed(6).substr(2)
      const time = Date.now()
      this.conn.query('INSERT INTO `im_user` SET ?', {
        name: name,
        pass: md5(salt + pass),
        salt: salt,
        create_time: time,
        update_time: time,
        create_date: moment(time).format('YYYY-MM-DD HH:mm:ss'),
        update_date: moment(time).format('YYYY-MM-DD HH:mm:ss')
      }, (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve([{
            id: results.insertId,
            name: name,
            create_time: time,
            avatar_url: null
          }])
        }
      })
    })
  }
}
