import onFinished from 'on-finished'
import log4js from 'log4js'
import logger from '../common/logger'

export default ({ app }) => {
  app.use((req, res, next) => { // 添加打印响应体的中间件
    const _json = res.json
    let _body = null
    res.json = function (body) {
      _body = body
      _json.apply(res, arguments)
    }
    onFinished(res, () => {
      res.body = JSON.stringify(_body)
    })
    next()
  })

  app.use(log4js.connectLogger(logger, {
    level: 'info',
    format: (req, res, format) => {
      return format(`:remote-addr - HTTP/:http-version :method :url ${JSON.stringify(req.body)}  :status :content-length :referrer :user-agent ${res.body}`)
    }
  }))
}
