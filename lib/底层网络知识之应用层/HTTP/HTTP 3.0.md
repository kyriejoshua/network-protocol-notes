## QUIC

QUIC 是基于 UDP 的协议，是构成 HTTP3 的基础。

![](https://pic4.zhimg.com/v2-d61a62fdfb08ed3882e1018136ce6b2f_1440w.jpg)

## 一、QUIC 的结构

### 1. QUIC 包结构

QUIC 是基于 UDP 的，因此包头是 UDP。
[[../../底层网络知识之重要的传输层/UDP#二、UDP 格式|UDP 格式]]

#### 1.1 包头结构

##### 1.1.1 比特单位

```mermaid
---
title: "QUIC数据包结构(bits)"
---
packet-beta
0-7: "Flags"
8-63: "Connection Id"
64-95: "Version"
96-127: "包序号，长度不固定，8-48 之间"
```

##### 1.1.2 字节单位

```mermaid
---
title: "QUIC数据包结构(bytes)"
---
packet-beta
0-1: "Flags"
2-9: "DCID SCID"
10-13: "Version"
14-17: "包序号，长度不固定"
```

#### 1.2 报文结构

##### 1.2.1 报文内容比特单位

```mermaid
---
title: "QUIC数据包结构(bits)"
---
packet-beta
0-7: "Frame Type"
8-31: "StreamId(1-4bytes)"
32-63: "offset(0-8bytes)"
64-79: "Data Length"
80-127: "Data"
```

```mermaid
---
title: "QUIC数据包结构(bytes)"
---
packet-beta
0-1: "Frame"
2-3: "Frame"
```

##### 1.2.2 框架图

```mermaid
block-beta
	columns 12
	Flags:1
	CID["ConnectionId"]:2
	Version:2
	PN["Packet Number"]:3
	Frames["Frames"]:4
	space:12
	block:groupCID:2
		columns 2
		DCID:1
		SCID:1
	end
	block:groupFrames:10
		columns 10
		Frame1 Frame2 Frame3 Frame4
	end
	space:12
	block:groupFrame:4
		columns 4
		type payload
	end
	space:12
	block:groupPayload:4
		columns 4
		streamId offset dl["data Length"] Data
	end
	
	Frames --> groupFrames
	CID --> groupCID
	Frame1 --> groupFrame
	payload --> groupPayload
```

#### 1.3 包头类型

QUIC 分为长包头和短包头。
长包头用来建立连接，数据包相对多一些。
短包头用来传输数据。

##### 1.3.1 长包头

```mermaid
---
title: "QUIC长包头结构(bits)"
---
packet-beta
0: "长包头1"
1: "1"
2-5: "类型"
6-7: "保留位"
8-39: "版本号"
40-71: "目标连接ID (DCID) "
72-103: "源连接 ID（SCID）"
104-127: "包序号，长度不固定"
```

##### 1.3.2 短包头

```mermaid
---
title: "QUIC短包头结构(bits)"
---
packet-beta
0: "短包头0"
1: "密钥"
2-3: "包号长度"
4-5: "保留位"
6-37: "目标连接ID (DCID) "
38-69: "截断的包序号，长度不固定"
70-127: "Payload"
```

## 二、QUIC 的优化

### [图解QUIC](https://cangsdarm.github.io/illustrate/quic)

### 1. 机制一：自定义连接机制

TCP 建立连接依靠四元素（源 IP、源端口、目标 IP、目标端口），当网络变化（例如从 wifi 切换到蜂窝网络时），ip 地址或端口势必会变化。此时，不可避免需要进行一次重连。

QUIC 基于 UDP 是无连接的，新定义了一种连接方式，基于 `connectionId`(一个 64 位的随机数) 建立连接，不依赖 IP 和端口号，即使网络变化，也能保证不断开重连，从而提高网络效率。

#### 1.1 演示图

```mermaid
architecture-beta
    group tcp(cloud)[TCP]

    service A(cloud)[sip sport dip dport version A] in tcp
    service C(cloud)[sip sport dip dport version B] in tcp
    service 4g(server)[4G] in tcp
    service wifi(server)[Wifi] in tcp

    A:L -- R:wifi
    4g:T -- B:wifi
    C:T -- B:A
    4g:R -- L:C
    
    group quic(cloud)[QUIC]

    service C1(cloud)[connection ID A] in quic
    service C2(cloud)[connection ID B] in quic
    service 4g1(server)[4G] in quic
    service wifi1(server)[Wifi] in quic

    C1:L -- R:wifi1
    4g1:T -- B:wifi1
    C1:T -- B:C2
    4g1:R -- L:C2
```

#### 1.2 低时延连接

对 HTTPS 中的 [[../HTTPS/index#4.1 版本 1.2 及以下的建立连接过程|TLS 1.2 连接流程图]] 和 [[../HTTPS/index#4.2 版本 1.3 的建立连接过程|TLS 1.3 连接流程图]]进行简化并且对比 HTTP 3.0.

#### 1.2.1 TLS 1.2 vs 1.3

在真正开始 TLS 的连接前，还需要先建立 TCP 的连接，所以实际上分别会消耗 3 个 RTT 和 2 个 RTT 的对比:

```mermaid
sequenceDiagram
box TLS 1.2 连接
actor Client1.2
participant Server1.2
end

box TLS 1.3 连接
actor Client1.3
participant Server1.3
end

par 第1个 RTT
Client1.2 <<->> Server1.2: TCP 连接，过程省略
end

par 第2个 RTT
Client1.2 ->> Server1.2: Client Hello
Server1.2 ->> Client1.2: Server Hello
end

par 第3个 RTT
Client1.2 ->> Server1.2: Client 回应并生成预主密钥
Server1.2 ->> Client1.2: 计算预主密钥并回复客户端
end

Client1.2 <<->> Server1.2: Client 双方开始通信

par 第1个 RTT
Client1.3 <<->> Server1.3: TCP 连接，过程省略
end

par 第2个 RTT
Client1.3 ->> Server1.3: Client Hello
Server1.3 ->> Client1.3: Server Hello
note over Client1.3, Server1.3: 双方各自通过 DH 算法生成会话密钥
end
Client1.3 <<->> Server1.3: Client 双方开始通信
```

#### 1.2.2 TLS 1.3 vs QUIC

新的 QUIC 初次连接只需要 1 个 RTT 就可以开始传输。因为 QUIC 集成了 TLS 安全协议。


```mermaid
sequenceDiagram

box TLS 1.3 连接
actor Client1.3
participant Server1.3
end

box QUIC 连接
actor Client
participant Server
end

par 第1个 RTT
Client1.3 <<->> Server1.3: TCP 连接，过程省略
end

par 第2个 RTT
Client1.3 ->> Server1.3: Client Hello
Server1.3 ->> Client1.3: Server Hello
note over Client1.3, Server1.3: 双方各自通过 DH 算法生成会话密钥
end
Client1.3 <<->> Server1.3: Client 双方开始通信

par 第1个 RTT
Client ->> Server: Client Hello
Server ->> Client: Server Hello
end

Client <<->> Server: Client 双方开始通信
```

### 2. 机制二：自定义重传机制

TCP 使用**序号和应答机制**来解决顺序问题和丢包问题。
QUIC 使用序号和相对位置来重传。
* `packet number`字段用来标识包序号，如果没有收到该序号的响应，就会重发一个包。包的序号在当前最近发送的序号基础上依次递增，通过 `offset` 相对位置来确认数据的具体位置。
* `ACK` 返回的序号则和发送的序号对应上。

例如下图，序号 2 的包丢失了，重传的包序号是 2. `offset` 是 1.

```mermaid
sequenceDiagram
actor Client
Client ->> Server: PKN=1,Offset=0
Client ->> Server: PKN=2,Offset=1
Client ->> Server: PKN=3,Offset=2
Server ->> Client: SACK=1,3
Client ->> Server: PKN=4,Offset=1
Server ->> Client: SACK=4
```

### 3. 机制三：无阻塞的多路复用

QUIC 把连接能够拆分成多个流 Stream，这些多个 Stream 并不像 HTTP2 的 TCP 一样共享一个滑动窗口，而是分别使用不同的滑动窗口。而且这些 Stream 之间完全不是相互依赖的，并不会发生前后阻塞的情况。

[[HTTP 2.0#3. 多路复用]]

### 4. 机制四：自定义流量控制

#### 4.1 流量控制

QUIC 也使用和 TCP 类似的滑动窗口机制来实现流量控制。

QUIC 的滑动窗口分成两个级别，`Connection` 和 `Stream`。
* `Connection` 规定了所有数据流的大小；
* `Stream` 流量控制规定了每个流的大小。

```mermaid
---
title: stream1
---
block-beta
columns 12
s11["发送窗口 100"]:10 s12["可用窗口 20"]:2
style s12 fill:#bbf
```

```mermaid
---
title: stream2
---
block-beta
columns 12
s21["发送窗口 90"]:9 s22["可用窗口 30"]:3
style s22 fill:#bbf
```

```mermaid
---
title: stream3
---
block-beta
columns 12
s31["发送窗口 110"]:10 s32["可用窗口 10"]:1
style s32 fill:#bbf
```

`Connection` 的可用窗口大小是 **60**.

## 三、参考

> [QUIC 协议](https://zhuanlan.zhihu.com/p/405387352)
> [RFC9312中文](https://autumnquiche.github.io/RFC9312_Chinese_Simplified/#2.1_QUIC_Packet_Header_Structure)