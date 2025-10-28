## 一、加密

### 1. 对称加密

加密和解密的密钥是相同的。

### 2. 非对称加密

比较经典的非对称加密算法，是 RSA 算法。

每个客户端，维护属于自己的一套公钥和私钥。公钥在互联网公开，私钥只有自己维护。

公钥加密的信息，只有私钥能解密。私钥加密的信息，只有公钥能解密。

- **公钥**用于加密数据或验证数字签名，可以自由分发和共享。
- **私钥**用于解密数据和创建数字签名，但必须保密，以确保安全。

常见的非对称加密算法：
- Rivest-Shamir-Adleman (RSA)
- 椭圆曲线加密 (ECC)
- 数字签名算法 (DSA)

#### 2.1 RSA 算法

RSA 是一种非对称加密算法，以其发明者的名字命名。该算法依赖于**素数的数学复杂性**来生成密钥对，使用一对公私密钥进行加密和解密，因此，适用于安全数据传输和数字签名。

RSA 算法通常帮助保护 HTTPS、SSH 和 TLS 等通信协议。尽管是在 20 世纪 70 年代开发的，但由于其稳健性和安全性，RSA 仍被广泛使用。各种应用程序都依赖于 RSA，包括安全的电子邮件、VPN 和软件更新。

##### 2.1.1 算法实现

###### 使用 js 实现

核心使用浏览器提供的 [Web_Crypto_API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Crypto_API).

```javascript
// 生成RSA密钥对（2048位）
async function generateKeyPair() {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
      hash: "SHA-256",
    },
    true, // 是否可导出
    ["encrypt", "decrypt"]
  );
}

// RSA加密（公钥加密）
async function rsaEncrypt(publicKey, plaintext) {
  const encoded = new TextEncoder().encode(plaintext);
  return await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encoded
  );
}

// RSA解密（私钥解密）
async function rsaDecrypt(privateKey, ciphertext) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

// ---------- 使用示例 ----------
(async () => {
  // 1. 生成密钥对
  const { publicKey, privateKey } = await generateKeyPair();

  // 2. 加密数据
  const originalText = "Hello RSA!";
  const encrypted = await rsaEncrypt(publicKey, originalText);
  console.log("加密结果 (ArrayBuffer):", encrypted);

  // 3. 解密数据
  const decrypted = await rsaDecrypt(privateKey, encrypted);
  console.log("解密结果:", decrypted); // 输出: "Hello RSA!"
})();
```

###### 2.1.2 使用 python 实现

| **`cryptography`** | 功能全面，提供了高级和低级接口[](https://ironpdf.com/zh/python/blog/python-help/cryptography-python/)，是目前最流行、维护最积极的加密库之一 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes

# 生成RSA私钥
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,  # 安全起见，建议至少2048位
)

# 从私钥导出公钥
public_key = private_key.public_key()

# 序列化公钥以便分发
pem_public = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)
print("公钥:\n", pem_public.decode())

# 待加密的原始消息
message = b"Hello, Secret World!"

# 使用公钥加密
ciphertext = public_key.encrypt(
    message,
    padding.OAEP(  # 推荐使用OAEP填充模式
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)
print("\n加密后的密文 (hex):", ciphertext.hex())

# 使用私钥解密
plaintext = private_key.decrypt(
    ciphertext,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)
print("\n解密后的明文:", plaintext.decode())
```

## 二、数字证书

### 1. CA
