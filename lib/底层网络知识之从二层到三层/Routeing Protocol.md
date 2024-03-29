# 路由协议

路由器就是一台网络设备，它内部会有多张网卡。
从一个入口进来的网络数据包，会根据路由器内的一个本地的转发信息库，来决定从哪个网口发出去。这个转发信息库就是路由表。

## 静态路由算法

### 配置路由

**本地的转发信息库称之为路由表。**
路由表的信息至少包含以下三种：
* `destination`: 目的网络，这个数据包想去哪里
* `port` 端口：出口设备，把数据包发往哪里去
* `next route`: 下一个网关，下一个路由器的地址

通过 `ip route` 或 `route` 可以进行查询或配置。
* `ip route add 10.176.48.0/20 via 10.173.32.1 dev eth0`
* 这条命令的意思是，要去 `10.176.48.0/20` 这个目标网络，要从 `eth0` 端口出去，经过 `10.173.32.1`。

**这里配置的核心思想是，通过目的 IP 地址来配置路由。** 严格按照上述三个信息来配置。

#### 配置策略路由

真实的网络环境会更加复杂，除了 IP，还需要其他参数来配置。
根据除了 IP 以外的多个参数来配置路由，称之为策略路由。这些配置包括源 IP 地址、入口设备、TOS 等选择路由表。
* 静态路由通过配置复杂的策略路由来控制转发策略。

#### 配置策略路由的简单示例

```shell
ip rule add from 192.168.1.0/24 table 10 
ip rule add from 192.168.2.0/24 table 20
```

上面的配置表示
* 从 `192.168.1.10/24` 这个网段来的，使用 table 10 中的路由表;
* 从 `192.168.2.0/24` 网段来的，使用 table20 的路由表。

#### 配置策略路由的具体示例

同一条路由配置规则，也可以设置多条路径。

```shell
ip route add default scope global nexthop via 100.100.100.1 weight 1 nexthop via 200.200.200.1 weight 2
```

上面的配置表示下一跳有两个地方，分别是 `100.100.100.1` 和 `200.200.200.1`，权重分别是 1 和 2.

这种场景是房东给家里拉了两根网线，分别配置不同的出口。

![](https://static001.geekbang.org/resource/image/c3/db/c3f476eb7ce8f185befb6c7a2b1752db.jpg?wh=2247*2505)

根据这个网络拓扑图，可以将路由配置成这样：

  ```shell
	$ ip route list table main
	60.190.27.189/30 dev eth3  proto kernel  scope link  src 60.190.27.190
	183.134.188.1 dev eth2  proto kernel  scope link  src 183.134.189.34
	192.168.1.0/24 dev eth1  proto kernel  scope link  src 192.168.1.1
	127.0.0.0/8 dev lo  scope link
	default via 183.134.188.1 dev eth2
	```

当路由这样配置的时候，就告诉这个路由器如下的规则：
* 如果去运营商二，就走 eth3；
* 如果去运营商一呢，就走 eth2；
* 如果访问内网，就走 eth1；
* 如果所有的规则都匹配不上，默认走运营商一，也即走快的网络。

假如上述场景中，租户 A 表示自己使用网络少，不想交多的网费，也不需要好的网速，那么我们可以进行一系列的路由配置来达到这样的效果。
我们添加一个 Table，名叫 `chao`.

```shell
# echo 200 chao >> /etc/iproute2/rt_tables
```

再添加一条规则：

```shell
# ip rule add from 192.168.1.101 table chao
# ip rule ls
0:  from all lookup local 
32765:  from 10.0.0.10 lookup chao
32766:  from all lookup main 
32767:  from all lookup default
```

这条规则设定从 IP `192.168.1.101` 来的包都查看 `chao` 这个路由表。
在 `chao` 路由表中添加规则：

```shell
# ip route add default via 60.190.27.189 dev eth3 table chao
# ip route flush cache
```
配置的效果是让租户 A 默认使用慢的路由，也即运营商 2 的慢速网络。

TODO
* 不同的 ip 对应去相应的  eth.
* 默认是去 eth2.

## 动态路由算法

* 使用动态路由路由器，可以根据路由协议算法生成动态路由表，随网络运行状况的变化而变化。
* 求最短路径的算法，Bellman-Ford 和 Dijkstra. 下面两者就是基于这两个算法来实现的。

### 距离矢量算法(distance vector routing)

基于 Bellman-Ford 算法。
* 优势：正确的消息传递较快。
* 劣势：
	* 错误消息传播较慢，因为需要每个路由器确认，直到超出阈值为止。
	* 每次发送需要发送整个路由表。
* 应用场景：适用于小型网络（小于 15 跳）

### 链路状态路由算法(link state routing)

基于 Dijkstra 算法。
* 每个路由器会把自己和就近路由器的链路状态包广播出去，发送到整个网络的每个路由器。这样每个路由器都能够收到它和邻居之间的关系的信息。所以，**每个路由器都能在自己本地构建一个完整的图，然后针对这个图使用 Dijkstra 算法，找到两点之间的最短路径。**
* 链路状态路由协议只广播**更新的**或**改变的网络拓扑**，这使得更新的信息更小，从而节省了带宽和 CPU 利用率。而且一旦一个路由器挂了，它的邻居都会广播这个消息，可以使得坏消息迅速收敛。

## 动态路由协议

上面讲述的是两种算法，下面讲述的是基于算法产生的协议。

### OSPF

OSPF（Open Shortest Path First，开放式最短路径优先）就是这样一个基于链路状态路由协议，广泛应用在数据中心中的协议。
* 由于主要用在数据中心内部，用于路由决策，因而称为**内部网关协议（Interior Gateway Protocol，简称 IGP）**。
**内部网关协议的重点就是找到最短的路径。在一个组织内部，路径最短往往最优。**
* 有时候 OSPF 可以发现多个最短的路径，可以**在这多个路径中进行负载均衡，这常常被称为等价路由**。

![](https://static001.geekbang.org/resource/image/2e/db/2eb5f4722689adf9926fded5005e02db.jpg?wh=3463*1039)

### BGP

**外网路由协议（Border Gateway Protocol，简称 BGP）**。例如国家之间的路由协议。
在网络中，一个个国家会成为自治系统 AS（Autonomous System）。
自治系统分几种类型。
* Stub AS：对外只有一个连接。这类 AS 不会传输其他 AS 的包。例如，个人或者小公司的网络。
* Multihomed AS：可能有多个连接连到其他的 AS，但是大多拒绝帮其他的 AS 传输包。例如一些大公司的网络。
* Transit AS：有多个连接连到其他的 AS，并且可以帮助其他的 AS 传输包。例如主干网。

每个自治系统都有边界路由器，通过边界路由器来和外界建立连接。
	
![](https://static001.geekbang.org/resource/image/69/3d/698e368848fdbf1eb8e270983e18143d.jpg?wh=2977*2008)

BGP 又分为两类，`eBGP` 和 `iBGP`。
自治系统间，边界路由器之间使用 `eBGP` 广播路由。
内部网络也需要访问其他的自治系统。边界路由器如何将 BGP 学习到的路由导入到内部网络呢？就是通过运行 `iBGP`，使得内部的路由器能够找到到达外网目的地的最好的边界路由器。

BGP 协议使用的算法是路径矢量路由协议（path-vector protocol）。它是距离矢量路由协议的升级版。
* 它通过保存自治系统 AS 的路径来避免上述错误信息传递较慢的问题。
* 通过 `eBGP` 处理外部和 `iBGP` 处理内部，可以让各个路由都走最短的路径。
* 在路径中将一个自治系统看成一个整体，不区分自治系统内部的路由器，这样自治系统的数目是非常有限的。也就是网络规模相对较小。
