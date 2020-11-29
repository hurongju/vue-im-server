import { Router } from 'express'
import logger from '../common/logger'
import LoginService from '../services/login'

const router = Router()

function verify (req, res, next) {
  const name = req.body.username
  const password = req.body.password
  if (name.length > 50) {
    logger.error('【route /login/index】', '用户名不能多于50位字符！')
    return res.json({
      success: false,
      message: '用户名不能多于50位字符！'
    })
  }
  if (name.slice(0, 1).toUpperCase().charCodeAt() < 65 ||
    name.slice(0, 1).toUpperCase().charCodeAt() > 90
  ) {
    logger.error('【route /login/index】', '用户名只能以字母开头！')
    return res.json({
      success: false,
      message: '用户名只能以字母开头！'
    })
  }
  if (password.length < 6) {
    logger.error('【route /login/index】', '密码不能低于6位字符！')
    return res.json({
      success: false,
      message: '密码不能低于6位字符！'
    })
  }
  next()
}

export default (app) => {
  app.use('/login', router)
  router.post('/index', verify, async (req, res, next) => {
    const name = req.body.username
    const password = req.body.password
    const loginServiceInstance = new LoginService()
    let data = null
    try {
      data = await loginServiceInstance.login({ name, pass: password })
    } catch (e) {
      return next(e)
    }
    if (data === false) {
      return res.json({
        success: false,
        message: '用户名或密码不正确'
      })
    }
    res.json({
      success: true,
      data: data,
      message: '登录成功'
    })
  })
}
