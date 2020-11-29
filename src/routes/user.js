import { Router } from 'express'
import logger from '../common/logger'
import UserService from '../services/user'
const router = Router()

export default (app) => {
  app.use('/user', router)

  router.post('/search', async (req, res, next) => {
    const { keyword, pageSize, lastTime } = req.body
    if (!keyword || keyword.trim() === '') {
      logger.error('【route /user/search】【搜索好友参数异常】', `keyword: ${keyword}`)
      return res.json({
        success: false,
        code: 200,
        message: '搜索条件为空'
      })
    }
    let data = []
    const userServiceInstance = new UserService()
    try {
      data = await userServiceInstance.search({ keyword, pageSize, lastTime, uid: req.data.uid })
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

  router.post('/addFriend', async (req, res, next) => {
    const { toId, toName } = req.body
    if (!toId || !toName) {
      logger.error('【route /user/addFriend】【添加好友参数异常】', `to_id: ${toId}、to_name: ${toName}`)
      return res.json({
        success: false,
        code: 200,
        message: '参数有误'
      })
    }
    const userServiceInstance = new UserService()
    try {
      await userServiceInstance.addFriend({ toId, toName, fromId: req.data.uid, fromName: req.data.name })
    } catch (e) {
      return next(e)
    }
    return res.json({
      success: true,
      message: '',
      code: 200
    })
  })

  router.post('/addList', async (req, res, next) => {
    const { pageSize, lastTime } = req.body
    let data = []
    const userServiceInstance = new UserService()
    try {
      data = await userServiceInstance.addList({ pageSize, lastTime, uid: req.data.uid })
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

  router.post('/agreeAdd', async (req, res, next) => {
    const { fromName, fromId, id } = req.body
    if (!fromName || !fromId || !id) {
      logger.error('【route /user/agreeAdd】【同意添加好友参数异常】', `fromName: ${fromName}、fromId: ${fromId}、id: ${id}`)
      return res.json({
        success: false,
        code: 200,
        message: '参数异常'
      })
    }
    const { name, uid } = req.data
    const userServiceInstance = new UserService()
    try {
      await userServiceInstance.agreeAdd({ fromName, fromId, id, name, uid })
    } catch (e) {
      logger.error('route /user/agreeAdd】【同意加人失败】', e)
      return next(e)
    }
    return res.json({
      success: true,
      message: '',
      code: 200
    })
  })

  router.post('/deleteAddInfo', async (req, res, next) => {
    const { id } = req.body
    if (!id) {
      logger.error('【route /user/deleteAddInfo】【删除添加好友信息参数异常】', `id: ${id}`)
      return res.json({
        success: false,
        code: 200,
        message: '参数异常'
      })
    }
    const userServiceInstance = new UserService()
    try {
      await userServiceInstance.deleteAddInfo({ id })
    } catch (e) {
      return next(e)
    }
    return res.json({
      success: true,
      message: '',
      code: 200
    })
  })

  router.post('/getFriendList', async (req, res, next) => {
    const userServiceInstance = new UserService()
    let data = []
    try {
      data = await userServiceInstance.getFriendList({ id: req.data.uid })
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
