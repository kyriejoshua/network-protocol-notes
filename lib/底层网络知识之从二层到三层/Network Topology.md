## 一、拓扑结构

### 1. 解决环路问题

TODO 待学习补充

* 多个交换机组成的结构

### 1.1 STP 算法

#### 1.1.1 STP 工作过程

* STP 是用来解决环路问题的  最小生成树

* 根交换机
* 指定交换机
* 网桥协议数据单元
* 优先级向量

* 谁的根交换机优先级高，则整个链路就会跟谁
* 
### 2. 路由演示图

下面是客户端 client1 想要连接 client6 的示意图。

#### 2.1 拓扑图示意
```mermaid
architecture-beta
    group lan1(cloud)[LAN1]

    service switch1(server)[Switch1] in lan1
    service client2(disk)[client2] in lan1
    service client1(disk)[client1] in lan1

    switch1:L -- R:client1
    client2:T -- B:switch1

    service router1(internet)[router1]
    service router2(internet)[router2]

    group lan2(cloud)[LAN2]

    service switch2(server)[Switch2] in lan2
    service client3(disk)[client3] in lan2
    service client4(disk)[client4] in lan2

    switch2:T -- B:client4
    client3:L -- R:switch2

    group lan3(cloud)[LAN3]

    service switch3(server)[Switch3] in lan3
    service client5(disk)[client5] in lan3
    service client6(disk)[client6] in lan3

    switch3:T -- B:client6
    client5:L -- R:switch3

    switch1:R -- L:router1
    router2:L -- R:router1
    switch2:L -- R:router2
    switch3:T -- B:router2
```

#### 2.2 时序图示意

```mermaid
sequenceDiagram
    actor client1
    participant switch1
    participant router1
    participant router2
    participant switch2
    actor client6
    activate client1
    client1->>client1: 与子网掩码计算，确认不在同一子网内
    client1->>client1: 通过 ARP 协议查找默认网关的 MAC 地址
    note right of client1: 默认网关的地址作为目标 MAC 地址，和原始 MAC 地址一起封装到数据链路层
    note right of client1: 目标 IP 地址和原始 IP 地址封装在网络层头部
    deactivate client1
    client1->>switch1: 发送数据包
    switch1->>+router1: 确认 MAC 地址为默认网关，转发到路由器1
    router1->>router1: 检查目标 IP 地址，确认下一跳的 IP 地址
    router1->>-router1: 匹配路由表，确认要转发的端口号在哪儿
    router1->>+router2: 通过端口号转发
    router2->>router2: 匹配路由表，确认要转发的端口号在哪儿
    router2->>-router2: 通过 ARP 协议查找目标 IP 对应的 MAC 地址
    note right of router2: 目标 MAC 的地址封装到数据链路层
    router2->>switch2: 通过 MAC 地址确认端口号，转发数据到交换机
    switch2->>client6: 通过转发表确认 MAC 地址的端口号位置，转发数据到目标客户端
```

### 3. VLAN

* 虚拟隔离（虚拟局域网）