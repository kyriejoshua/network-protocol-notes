const net = require('net');

// 创建服务器
const server = net.createServer((socket) => {
  console.log('客户端已连接');

  // 接收来自客户端的数据
  socket.on('data', (data) => {
    console.log('收到客户端数据:', data.toString());
  });

  // 客户端断开连接的事件
  socket.on('end', () => {
    console.log('客户端已断开连接');
  });

  // 发送数据到客户端
  socket.write('你好，来自服务器的问候!\n');
});

// 监听 3000 端口
server.listen(3000, () => {
  console.log('服务器正在监听端口 3000');
});