const net = require('net');

// 创建一个 socket（客户端）
const client = net.createConnection({ port: 3000 }, () => {
  console.log('已连接到服务器');
  client.write('你好，这是客户端!');
});

// 接收来自服务器的数据
client.on('data', (data) => {
  console.log(data.toString());
  client.end(); // 断开与服务器的连接
});

// 监听断开连接事件
client.on('end', () => {
  console.log('已从服务器断开');
});