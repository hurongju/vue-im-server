import UserModel from '../models/user'
import logger from '../common/logger'
import to from 'await-to-js'
import jwt from '../common/jwt'
import md5 from 'md5'

async function sign (data) {
  // 生成token
  const [err, token] = await to(jwt.sign({
    uid: data[0].id,
    name: data[0].name,
    createTime: data[0].createTime,
    avatarUrl: data[0].avatarUrl
  }))
  if (err) {
    logger.error('【LoginService sign】【生成jwt失败】', err)
    throw err
  }
  return token
}

export default class LoginService {
  async login ({ name, pass }) {
    const userModel = new UserModel()
    const [err, data] = await to(userModel.query({ name: name }))
    if (err) {
      logger.error('【LoginService index】【查找user表失败】', err)
      throw new Error('查找失败')
    }
    if (data.length === 0) { // 用户不存在，注册一个
      const [insertErr, insertData] = await to(userModel.insert({ name, pass }))
      if (insertErr) {
        logger.error('【LoginService index】【插入user表失败】', insertErr)
        throw new Error('插入失败')
      }
      try {
        const token = await sign(insertData)
        return {
          username: insertData[0].name,
          avatarUrl: insertData[0].avatarUrl,
          isRegister: true,
          token: token
        }
      } catch (e) {
        throw new Error('用户令牌生产失败')
      }
    } else {
      if (data[0].pass === md5(data[0].salt + pass)) {
        try {
          const token = await sign(data)
          return {
            username: data[0].name,
            avatarUrl: data[0].avatarUrl,
            isRegister: false,
            token: token
          }
        } catch (e) {
          throw new Error('用户令牌生产失败')
        }
      } else {
        return false
      }
    }
  }
}
