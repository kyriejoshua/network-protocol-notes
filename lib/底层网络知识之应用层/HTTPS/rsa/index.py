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