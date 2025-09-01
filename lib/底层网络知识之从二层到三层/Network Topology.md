## 一、拓扑结构

拓扑结构是由多个交换机连接起来组成的。

![](https://static001.geekbang.org/resource/image/08/29/0867321c36cc52bd3dd4d7622583fa29.jpg?wh=2866*2176)

### 1. 解决环路问题

TODO 待学习补充

* 多个交换机组成的结构

#### 1.1 STP 算法

##### 1.1.1 STP 工作过程

* STP 是用来解决环路问题的  最小生成树

* 根交换机
* 指定交换机
* 网桥协议数据单元
* 优先级向量

* 谁的根交换机优先级高，则整个链路就会跟谁

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
