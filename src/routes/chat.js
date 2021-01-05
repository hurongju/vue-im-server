import { Router } from 'express'
import logger from '../common/logger'
import ChatService from '../services/chat'
import cons from '../constants';

const router = Router()

export default (app) => {
  app.use('/chat', router)

  router.post('/send', async (req, res, next) => {
    const { content, type, roomId, toName, sendSocketId } = req.body
    const { name, uid } = req.data
    if (!content) {
      logger.error(`【route /chat/send】【用户${req.data.name}】发送message不存在`)
      return res.json({ success: false, message: '参数异常', code: 200 })
    }
    if (isNaN(roomId)) {
      logger.error(`【route /chat/send】【用户${req.data.name}】发送roomId不存在`)
      return res.json({ success: false, message: '参数异常', code: 200 })
    }
    const chatServiceInstance = new ChatService()
    let result = cons.SUCCESS_CODE
    try {
      result = await chatServiceInstance.send({ content, type, roomId, toName, sendSocketId, name, uid })
    } catch (e) {
      return next(e)
    }
    if (result === cons.FAIL_CODE) { // 会话不存在，前端提示已被好友删除
      return res.json({
        success: false,
        data: result,
        message: '好友不存在',
        code: 200
      })
    }
    return res.json({
      success: true,
      message: '',
      code: 200
    })
  })

  router.post('/getMsgList', async (req, res, next) => {
    const { roomId, page, pageSize, lastMsgSendTime } = req.body
    if (isNaN(roomId)) {
      logger.error('【route /chat/getMsgList】【获取消息列表参数异常】', `roomId: ${roomId}`)
      return res.json({
        success: false,
        code: 200,
        message: '参数异常'
      })
    }
    let data = []
    const chatServiceInstance = new ChatService()
    try {
      data = await chatServiceInstance.getMsgList({ roomId, page, pageSize, lastMsgSendTime })
    } catch (e) {
      return next(e)
    }
    return res.json({
      success: true,
      data: data,
      message: '',
      code: 200
    })
  })
}
