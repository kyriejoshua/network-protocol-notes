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