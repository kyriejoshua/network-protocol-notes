## 一、拓扑结构

拓扑结构是由多个交换机连接起来组成的。

![](https://static001.geekbang.org/resource/image/08/29/0867321c36cc52bd3dd4d7622583fa29.jpg?wh=2866*2176)

### 1. 解决环路问题

TODO 待学习补充

拓扑结构是多个交换机组成的结构。

交换机传播数据的方式是广播，就有可能出现环路问题，所有数据同时在广播，会阻塞通信，占用过量资源，导致正常数据无法传输。

#### 1.1 STP 算法

生成树协议，作用在 OSI 网络模型中第二层的通信协议。

该算法通过阻塞冗余链路，把物理上可能形成环路的网络在逻辑上变成一个无环的树形结构。

##### 1.1.1 STP 相关定义

STP 是用来解决环路问题的最小生成树。

![](https://static001.geekbang.org/resource/image/47/23/47baa69073b38357e0ae3f88ff74dd23.jpg?wh=3623*2579)

* 根交换机(Root Bridge)
	* 在交换机网络中，拥有最低网桥 ID(优先级值和 MAC 地址的组合) 的交换机会选为根桥。
	* 根桥是整个生成树拓扑的根节点。
* 指定交换机
* 网桥协议数据单元(BPDU)
	* 在交换机内直接传递的一种特殊的协议报文，专门在 STP 中使用
* 优先级向量

##### 1.1.2 STP 工作过程

1. 选择根交换机(根网桥)
	* 根网桥就是根交换机
	* 选择 BID 最小的交换机作为根网桥
	* 如下所示，**BID 由 2bytes 和 6bytes 的 MAC 地址组成**。

```mermaid
packet-beta

0-1: "网桥优先级"
2-7: "网桥的 MAC 地址"

```

2. 选择根端口(Root Port)
  * 在每一个非根桥中选举一个根端口，根端口的路径开销是最小的
  * *注意根端口并不在根网桥上*
3. 选择指定端口(Designated Port)
  * 在非根桥中，PID 更小的会成为指定端口，负责收发数据，剩余优先级更高的端口只负责接受消息，不再转发数据
4. 谁的根交换机优先级高，则整个链路就会跟谁
  * 端口也有 **PID，由 8 位的端口优先级和 8 位的端口编号组成**。

```mermaid
packet-beta
0-7: "端口优先级"
8-15: "端口编号"
```

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

### 3. VLAN(虚拟局域网)

要解决广播问题和安全问题，可以对交换机进行物理隔离或者是逻辑隔离（虚拟隔离）。

VLAN 是逻辑隔离，就是虚拟局域网，通常使用在交换机中。

#### 3.1 VLAN 包结构

在原来的二层包头上，添加一个 Tag，用来标识。其中有一个 12bits 的 VLAN ID 字段。可以标识最多 4096 个 VLAN。

通过二层头里的这个 ID，交换机可以准确识别相同 ID 的包，符合条件的才会互相转发，来解决广播问题和安全问题。

![](https://static001.geekbang.org/resource/image/ba/60/ba720f6988558f95c381f4deaab11660.jpg?wh=2066*1583)

##### 3.1.1 包图示意

常规数据包

```mermaid
block-beta
  columns 5
  aa["6bytes"]:1 bb["6bytes"]:1 cc["2bytes"]:1 dd["46-1500bytes"] ee["4bytes"]
  a["目标MAC地址"]:1 b["源MAC地址"]:1 c["长度"]:1 d["数据内容"] e["FCS"]
```

VLAN 的数据包

```mermaid
block-beta
  columns 6
  aa["6bytes"]:1 bb["6bytes"]:1 cc["4bytes"]:1 cd["2bytes"]:1 dd["46-1500bytes"] ee["4bytes"]
  a1["目标MAC地址"]:1 b1["源MAC地址"]:1 f1["VLAN TAG"]:1 c1["长度"]:1 d1["数据内容"] e1["FCS"]
  space:6
  space:1
  block:vlan:4
    va["TPID"]:1 vb["PRI"]:1 vc["CFI"]:1 vv["VID"]:1
  end
  space:1
  space:1
  block:vlantype:4
    j1["类型"] k1["优先级"] l1["规范格式"] m1["VLAN ID"]
  end
  space:1
  space:1
  block:vlandata:4
    j["2bytes"] k["3bits"] l["1bits"] m["12bits"]
  end
  
  f1 --> vlan
```

##### 3.1.2 拓扑图示意

![](https://static001.geekbang.org/resource/image/5c/4a/5c207a6e2c1c9881823b04e648f4ba4a.jpg?wh=2593*1873)

下面可以看到，即使机器 6 和机器 8 不存在于同一物理位置，连接着不同的交换机，但仍然处于同一个虚拟局域网内。
机器 3 和机器 4 也是。

```mermaid
architecture-beta
    group vlan1(cloud)[VLAN1]

    service switch1(server)[Switch1]
    
    service client1(disk)[client1] in vlan1
    service client2(disk)[client2] in vlan1

    switch1:L -- R:client1
    switch1:L -- R:client2
    client8:T -- B:switch1

    group vlan2(cloud)[VLAN2]

    service switch2(server)[Switch2]
    service client3(disk)[client3] in vlan2
    service client4(disk)[client4] in vlan2

    switch1:T -- B:client3
    client4:B -- T:switch2

    group vlan3(cloud)[VLAN3]
    group vlan4(cloud)[VLAN4]

    service client5(disk)[client5] in vlan4
    service client7(disk)[client7] in vlan4
    service client8(disk)[client8] in vlan3
    service client6(disk)[client6] in vlan3

    switch2:B -- T:client6
    client5:L -- R:switch2
    client7:L -- R:switch2

    switch1:R -- L:switch2
    
```
#### 3.2 VLAN 的优势

##### 3.2.1 减少广播域的大小

能够显著减少带宽流量。

##### 3.2.2 增强网络安全些

VLAN 创建的虚拟边界，只能被路由器跨越。因此可以通过路由器来设置安全措施，限制对 VLAN 的访问。

##### 3.2.3 易于管理

可以快速添加或更改网络节点，为有着相似网络需求的用户提供服务。
