import log from '../common/logger'
import multer from 'multer'
import config from '../config'
import moment from 'moment'
import fs from 'fs'
import path from 'path'

function mkdirsSync (dirname) { // 递归创建文件夹
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let type = ''
    if (/image/.test(file.mimetype)) {
      type = 'image'
    }
    const localPath = `www/static/${type}/${moment().format('YYYYMMDD')}/`
    try {
      mkdirsSync(localPath)
      cb(null, localPath)
    } catch (e) {
      cb(e)
    }
  },
  filename: function (req, file, cb) {
    cb(null, Number(Math.random().toString().substr(3, 6) + Date.now()).toString(36) + '.' + file.mimetype.replace('image/', ''))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxSize,
    files: config.upload.maxCount
  },
  fileFilter (req, file, cb) {
    // 上传文件
    if (!config.upload.mimetypes.includes(file.mimetype)) {
      return cb(new Error(file.originalname + '图片类型不支持'))
    }
    return cb(null, true)
  }
}).any()

export default function (req, res, next) {
  upload(req, res, function (err) {
    log.info('【上传文件的信息】', req.files)
    log.info('【上传文件文本域数据】', JSON.stringify(req.body))
    if (err) {
      // 发生错误
      log.error('【上传图片失败】', err)
      return next(err)
    }
    const data = req.files.map(val => val.path.replace(/^www\//, ''))
    return res.json({
      success: true,
      code: 200,
      msg: '上传成功',
      data: data
    })
  })
}
