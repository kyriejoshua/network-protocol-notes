import socket

def tcp_server():
  # 创建 socket 对象
  serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

  # 获取本地主机名
  # host = socket.gethostname()
  host = '127.0.0.1'
  port = 9999

  # 绑定端口号
  serversocket.bind((host, port))

  # 设置最大连接数，超过后排队
  serversocket.listen(5)
  print('Waiting for connection...')

  while True:
    # 建立客户端连接
    clientsocket, addr = serversocket.accept()
    print(f"连接地址：{str(addr)}")
    msg = '欢迎访问TCP服务器！' + "\r\n"
    clientsocket.send(msg.encode('utf-8'))
    # 发送消息返回给客户端
    while True:
        data = clientsocket.recv(1024)
        time.sleep(1)
        if not data or data.decode('utf-8') == 'exit':
            break
        clientsocket.send(('Hello, %s!' % data.decode('utf-8')).encode('utf-8'))
    clientsocket.close()

if __name__ == '__main__':
  tcp_server()