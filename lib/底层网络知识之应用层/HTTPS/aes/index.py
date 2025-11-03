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