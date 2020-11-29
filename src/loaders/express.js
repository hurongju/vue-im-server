import createError from 'http-errors'
import cookieParser from 'cookie-parser'
import jwt from '../common/jwt'
import upload from './upload'
import config from '../config'
import express from 'express'
import logger from '../common/logger'
import route from '../routes'

export default ({ app }) => {
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(cookieParser())
  if (config.resource.enable) {
    app.use(express.static(config.resource.root)) // 代理静态资源，生产建议关闭，使用nginx
  }

  app.all('*', function (req, res, next) { // 允许全部跨域
    res.header('Access-Control-Allow-Headers', "Content-Type,Content-Length, Authorization,'Origin',Accept,X-Requested-With")
    res.header('Access-Control-Allow-Origin', '*')
    next()
  })

  app.use(function (req, res, next) { // 校验token
    const token = req.headers.authorization
    logger.info('token :>> ', token)
    if (~config.whiteUrl.indexOf(req.url) || /\/static/.test(req.url)) {
      return next()
    }
    if (typeof token === 'undefined' || token === null) {
      logger.error('【token验证失败】', 'token不存在')
      return res.status(401).json({ success: false, msg: '用户令牌校验失败', code: 401 })
    } else {
      jwt.verify(token).then(data => {
        req.data = data
        return next()
      }).catch(rej => {
        logger.error('【token验证失败】', rej)
        return res.status(401).json({ success: false, msg: '用户令牌校验失败', code: 401 })
      })
    }
  })

  app.post(config.api.upload, upload) // 上传图片处理

  app.use(config.api.prefix, route())

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404))
  })

  // error handler
  app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // return the error code
    const status = err.status || 500
    const msg = status === 500 ? '系统异常' : ''
    res.status(status)
    res.json({ success: false, message: msg, code: status })
  })
}
