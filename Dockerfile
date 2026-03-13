FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package.json .

# 安装依赖
RUN npm install --production

# 复制代码
COPY index.js .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["node", "index.js"]
