## 索引
 
> [[Physical and Data Link|物理层与数据链路层]]
> 
> [[Network Topology|拓扑结构]]
> 
> [[ICMP and Ping|ICMP与Ping]]
> 
> [[Gateway|网关]]
> 
> [[Routeing Protocol|路由协议]]

## 时序图示意图

下面是客户端 client1 想要连接 client6 的示意图。

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