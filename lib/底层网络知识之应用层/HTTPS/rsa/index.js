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