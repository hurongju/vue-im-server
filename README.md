# vue-im-server
基于[express](https://expressjs.com/zh-cn/)、[socket.io](https://socket.io/docs/v3)的即时通讯App服务端

## 安装node >= 10.0

## 安装mysql(>=8.0) 或 mariadb(>=10.0)

新建数据库 运行easy_im.sql
## 安装redis

## 安装工程
```
npm install -g nodemon
npm install
```

## 修改配置
替换所有.env中的配置
## 运行工程
```
npm start
```

## 生产部署
```
安装pm2 
修改pm2.json配置
pm2 start pm2.json
```



