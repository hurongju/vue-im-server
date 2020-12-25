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
1、修改.env.production配置

2、安装pm2 

npm install -g pm2

pm2 install pm2-intercom

工程下添加pm2.json配置

{
  "apps": [{
    "name": "vue-im-server",
    "script": "dist/app.js",
    "cwd": "rootPath", // 改为你的项目绝对路径
    "exec_mode": "fork",
    "max_memory_restart": "1G",
    "autorestart": true,
    "instance_var": "INSTANCE_ID",
    "node_args": [],
    "args": [],
    "env": {
      "NODE_ENV": "production"
    }
  }]
}

3、编译代码
npm run compile

4、启动pm2守护进程
pm2 start pm2.json
```
## 生产配置nginx
```
工程下添加nginx.conf文件

server {
    listen 80;
    # 修改为你的hostname
    server_name im.goldzy.top;
 
    rewrite ^(.*)$ https://${server_name}$1 permanent;
}

server {
    listen       443 ssl;
    server_name  im.goldzy.top;
    ssl_certificate      ./cert/im.goldzy.top.pem;
    ssl_certificate_key  ./cert/im.goldzy.top.key;

    # 改为你的项目下的www
    root /yourRootPath/vue-im-server/www;
    
    set $node_port 8080;

    index index.js index.html index.htm;
    if ( -f $request_filename/index.html ){
        rewrite (.*) $1/index.html break;
    }
    
    location ~ /api|/socket\.io {
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy true;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_pass http://127.0.0.1:$node_port$request_uri;
        proxy_redirect off;
    }

    location ~ /static/ {
        etag         on;
        expires      max;
    }
}

把上面nginx.conf包含到你的服务器上的nginx配置文件中:
...

http {
  ...

  # 修改为你的项目路径
  include vue-im-server/nginx.conf;
}

Tips: nginx配置如果不生效，可能是服务器上工程目录的访问权限不足

```




