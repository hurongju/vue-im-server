import config from '../config'
import jwt from 'jsonwebtoken'

export default {
  sign (obj) {
    return new Promise((resolve, reject) => {
      if (Object.prototype.toString.call(obj) !== '[object Object]') {
        reject(new Error('这里需要传入一个对象'))
        return
      }
      jwt.sign({
        ...obj
      }, config.jwt.secret, { algorithm: config.jwt.algorithm, expiresIn: config.jwt.expiresIn }, function (err, token) {
        if (err) {
          reject(err)
        } else {
          resolve(token)
        }
      })
    })
  },
  verify (token) {
    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new Error('token不存在'))
        return
      }
      const tokenCode = /^Bearer.*/.test(token) ? token.substr(7) : token
      jwt.verify(tokenCode, config.jwt.secret, function (err, decoded) {
        if (err) {
          reject(err)
        } else {
          resolve(decoded)
        }
      })
    })
  },
  decode (token) {
    return jwt.decode(token)
  }
}
