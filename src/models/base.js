import mysql from '../common/mysql'

export default class BaseModel {
  constructor (connect) {
    this.conn = connect || mysql.pool
  }
}
