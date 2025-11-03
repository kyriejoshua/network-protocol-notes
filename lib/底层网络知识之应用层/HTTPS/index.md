## 一、加密

### 1. 对称加密

加密和解密的密钥是相同的。用一个加密算法进行加密和解密。
* winRAR 和 winZIP 压缩包的加密和解密就是同一个。

常用的对称加密算法有 AES，是目前最广泛使用的加密算法。

#### 1.1 AES 算法

加密

```javascript
const secret = encrypt(key, message);
```

解密

```javascript
const plain = decrypt(key, password);
```

##### 1.1.1 加密模式

ECB 是最简单的加密模式，只需要一个固定长度的密钥，固定的明文会生成固定的密文，这样的加密方式简单但也不可靠。
CBC 模式通过使用一个随机数作为 IV 参数，这样可以让每次生成的密文都不相同。

##### 1.1.1 算法实现

下面实现一个 128 位的极简加密算法。初始化一个实例，并选择加密模式。

###### 使用 js 实现

```javascript
// 极简 AES-128 加密核心（ECB模式示例，实际生产环境应使用GCM/CBC）
class MiniAES {
  static async encrypt(key, data) {
    const cryptoKey = await crypto.subtle.importKey('raw', 
      new TextEncoder().encode(key.padEnd(16)), 
      { name: 'AES-ECB' }, false, ['encrypt']
    );
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-ECB' },
      cryptoKey,
      new TextEncoder().encode(data)
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  static async decrypt(key, ciphertext) {
    const cryptoKey = await crypto.subtle.importKey('raw',
      new TextEncoder().encode(key.padEnd(16)),
      { name: 'AES-ECB' }, false, ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-ECB' },
      cryptoKey,
      Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
    );
    
    return new TextDecoder().decode(decrypted);
  }
}

// 使用示例
(async () => {
  const encrypted = await MiniAES.encrypt('my16bytekey', 'secret');
  console.log('加密结果:', encrypted);  // 输出Base64
  
  const decrypted = await MiniAES.decrypt('my16bytekey', encrypted);
  console.log('解密结果:', decrypted); // 输出"secret"
})();
```

###### 使用 python 实现

```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
import os

def generate_key():
    """生成随机密钥（AES-256需要32字节）"""
    return os.urandom(32)

def encrypt_aes(key, plaintext):
    """AES加密"""
    # 生成随机IV（初始化向量）
    iv = os.urandom(16)
    
    # 创建加密器（CBC模式）
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    
    # 填充数据（AES要求数据长度为16字节的倍数）
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(plaintext) + padder.finalize()
    
    # 加密
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()
    
    return iv + ciphertext  # 返回IV+密文

def decrypt_aes(key, encrypted_data):
    """AES解密"""
    # 提取IV和密文
    iv = encrypted_data[:16]
    ciphertext = encrypted_data[16:]
    
    # 创建解密器
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    
    # 解密
    padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
    
    # 去除填充
    unpadder = padding.PKCS7(128).unpadder()
    plaintext = unpadder.update(padded_plaintext) + unpadder.finalize()
    
    return plaintext

# 使用示例
if __name__ == "__main__":
    # 生成密钥（在实际应用中需要安全存储）
    key = generate_key()
    print(f"密钥 (hex): {key.hex()}")
    
    # 原始消息
    message = b"Hello, AES Encryption World!"
    print(f"原始消息: {message.decode()}")
    
    # 加密
    encrypted = encrypt_aes(key, message)
    print(f"加密后 (hex): {encrypted.hex()}")
    
    # 解密
    decrypted = decrypt_aes(key, encrypted)
    print(f"解密后: {decrypted.decode()}")
```

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

###### 使用 python 实现

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

### 3. 签名算法

非对称加密里，使用公钥加密，私钥解密，可以进行通信。反之，使用私钥加密，公钥解密，也有实际的应用场景。
这类场景的最终意义不在于加密，而在于证明消息由谁发出，换言之，这成为消息发送者的，独一无二的签名，**数字签名**。

不过实际应用的时候，不是直接对消息进行签名，而是对消息的哈希进行签名。

```javascript
const signature = encrypt(privateKey, sha256(message));
```

```javascript
const hash = decrypt(publicKey, signature);
```

#### 3.1 算法实现

常用的签名算法也是基于 RSA 的。

##### 3.1.1 python 实现

```python
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization

def generate_rsa_keypair():
    """生成RSA密钥对"""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    public_key = private_key.public_key()
    return private_key, public_key

def rsa_sign(private_key, message):
    """使用RSA私钥对消息签名"""
    signature = private_key.sign(
        message.encode(),
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    return signature

def rsa_verify(public_key, message, signature):
    """使用RSA公钥验证签名"""
    try:
        public_key.verify(
            signature,
            message.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False

# 使用示例
if __name__ == "__main__":
    private_key, public_key = generate_rsa_keypair()
    message = "Important document content"
    
    # 签名
    signature = rsa_sign(private_key, message)
    print(f"消息: {message}")
    print(f"RSA签名 (hex): {signature.hex()}")
    
    # 验证
    is_valid = rsa_verify(public_key, message, signature)
    print(f"RSA签名验证: {'成功' if is_valid else '失败'}")
```

## 二、数字证书

数字证书包括证书的发布机构，有效期，所有者，公钥。

### 1. CA

颁发数字证书的权威机构称为 CA.

## 三、SSL 加密

**浏览器和服务器先通过 RSA 交换 AES 口令建立连接，然后用对称加密算法进行通信。**