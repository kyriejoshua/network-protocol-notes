## 一、CDN

### 1. CDN 是什么

CDN 是内容分发网络(Content Delivery Network). 适合缓存静态数据，也支持缓存动态数据。

#### 1.1 CDN 架构

```mermaid
mindmap
	((中心节点))
		(区域节点)
			)边缘节点(
			)边缘节点(
			)边缘节点(
		(区域节点)
			)边缘节点(
			)边缘节点(
			)边缘节点(
		(区域节点)
			)边缘节点(
			)边缘节点(
			)边缘节点(
```

#### 1.2 CDN 策略

CDN 的全局负载均衡 DNS 服务器，根据用户的**地理位置**、**运营商**、实时的**网络情况**和各个节点的**承载流量（负载）** 来分配具体的边缘节点。

#### 1.3 CDN 分发流程

##### 1.3.1 全流程

用户访问 `web.com`, 访问对应的 权威 DNS 服务器.


```mermaid
sequenceDiagram
autonumber
actor User
activate DNS Server
User ->> DNS Server: web.com
note left of DNS Server: CNAME 别名 web.cdn.com
DNS Server ->> DNS Server: 解析 web.cdn.com
alt CDN 网络
DNS Server ->> +CDN DNS Server: web.cdn.com
note left of CDN DNS Server: CNAME 别名直接指向另外的域名，就是全局负载均衡器 GSLB
CDN DNS Server ->> -DNS Server: GSLB Server
DNS Server ->> +GSLB Server: 请解析域名
GSLB Server->> -DNS Server: 最优节点（缓存的服务器的 IP 地址）
DNS Server ->> User: IP 地址
deactivate DNS Server
end
User ->> IP Server: web.com
```

##### 1.3.2 简化版流程

```mermaid
sequenceDiagram
autonumber
actor 用户
participant DNS 服务器
participant CDN全局负载均衡器
participant 边缘节点
participant 源服务器
Note over 用户,源服务器: 第一阶段：DNS智能解析
用户 ->> +DNS 服务器:请求资源
DNS 服务器 ->> +CDN全局负载均衡器: 请求最优节点 IP
CDN全局负载均衡器 ->> -DNS 服务器: 返回边缘节点
DNS 服务器 ->> 用户: 返回边缘节点
deactivate DNS 服务器
Note over 用户,源服务器: 第二阶段：内容请求和响应
用户 ->> +边缘节点: 请求资源
边缘节点 ->> 边缘节点: 检查缓存
note left of 边缘节点: 没有缓存的情况
边缘节点 ->> +源服务器: 请求资源
源服务器 ->> -边缘节点: 返回资源
边缘节点 ->> 边缘节点: 缓存资源
边缘节点 ->> -用户: 返回资源
```

##### 1.3.3 传统访问模式，不使用 CDN

直接访问源服务器的方式：距离远、延迟高。
例如从杭州访问北京的服务器。传统方式直接访问，速度必然慢。CDN 会优先返回杭州或上海的服务器，响应自然会快一些。

```mermaid
sequenceDiagram
autonumber
actor 用户
用户 ->> DNS 服务器: 请求资源
DNS 服务器 ->> 源服务器: 请求资源
源服务器 ->> DNS 服务器: 返回资源
DNS 服务器 ->> 用户: 返回资源
```

#### 1.4 CDN 流程图

```mermaid
graph TB
    A[用户] --> B{DNS解析请求}
    B --> C[本地DNS]
    C --> D[CDN的DNS调度系统]
    
    subgraph "CDN网络"
        D --> E[智能调度]
        E --> F[选择最优节点]
        
        subgraph "CDN节点层级"
            G[边缘节点<br/>Edge Server]
            H[区域节点<br/>Regional Server]
            I[中心节点<br/>Central Server]
        end
        
        F --> G
        G -->|缓存未命中| H
        H -->|缓存未命中| I
    end
    
    I -->|回源请求| J[源站服务器<br/>Origin Server]
    J -->|返回内容| I
    I -->|缓存并返回| H
    H -->|缓存并返回| G
    G -->|返回内容| A
    
    style A fill:#e1f5fe
    style J fill:#fce4ec
    style G fill:#c8e6c9
    style H fill:#fff9c4
    style I fill:#ffccbc
```
### 2. CDN 的优势

#### 2.1 提高速度，降低延迟

CDN 会返回最优节点，从最合适的节点返回数据，速度比访问远处的源服务器更快。

#### 2.2 节省带宽

CDN 节点能够有效减少源服务器的带宽流量，取而代之的是这些流量会被 CDN 承载。

#### 2.3 提高可用性

CDN 通常有多个边缘节点，单一节点挂掉之后，其他节点仍然可以提供服务。

#### 2.4 提高安全性

内容分发以后，源服务器的流量分流，也能承受 DDoS 的攻击，因为攻击的流量也会分散。

### 3. CDN 缓存动态数据

动态 CDN 主要是两种缓存方式

#### 3.1 边缘计算模式

数据的逻辑计算和存储，在边缘节点里完成。
* 定时从源服务器同步元数据，然后在边缘节点计算得到结果。
#### 3.2 路径优化模式

数据在源服务器产生，通过路径优化，将源数据快速下发到最优的边缘节点。

## 二、TODO

通过在权威 DNS 服务器设置域名别名的方式，也就是设置 `CNAME`,把域名执行 CDN 域名，