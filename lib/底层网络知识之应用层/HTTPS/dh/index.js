class DiffieHellman {
    constructor(prime, generator) {
        // 使用预定义的质数 p 和生成元 g
        this.p = BigInt(prime);
        this.g = BigInt(generator);
        this.privateKey = null;
        this.publicKey = null;
        this.sharedSecret = null;
    }
    
    generateKeys() {
        // 生成私钥 (随机数，范围: 1 < privateKey < p-1)
        const min = BigInt(2);
        const max = this.p - BigInt(1);
        
        // 生成随机私钥 (简化版本，实际应用中应使用更安全的随机数)
        const range = max - min;
        const randomBuffer = new Uint32Array(1);
        crypto.getRandomValues(randomBuffer);
        const randomValue = BigInt(randomBuffer[0]) % range;
        this.privateKey = min + randomValue;
        
        // 计算公钥: publicKey = g^privateKey mod p
        this.publicKey = this.modExp(this.g, this.privateKey, this.p);
        
        return {
            privateKey: this.privateKey.toString(),
            publicKey: this.publicKey.toString()
        };
    }
    
    computeSharedSecret(theirPublicKey) {
        // 计算共享密钥: sharedSecret = theirPublicKey^privateKey mod p
        const theirPubKey = BigInt(theirPublicKey);
        this.sharedSecret = this.modExp(theirPubKey, this.privateKey, this.p);
        
        return this.sharedSecret.toString();
    }
    
    // 模幂运算: (base^exponent) % modulus
    modExp(base, exponent, modulus) {
        if (modulus === BigInt(1)) return BigInt(0);
        
        let result = BigInt(1);
        base = base % modulus;
        
        while (exponent > BigInt(0)) {
            // 如果 exponent 是奇数，乘以 base
            if (exponent % BigInt(2) === BigInt(1)) {
                result = (result * base) % modulus;
            }
            // exponent 必须是偶数
            exponent = exponent / BigInt(2);
            base = (base * base) % modulus;
        }
        
        return result;
    }
    
    // 获取共享密钥的十六进制表示（可用于派生对称加密密钥）
    getSharedSecretHex() {
        if (!this.sharedSecret) return null;
        return '0x' + this.sharedSecret.toString(16);
    }
}

// 使用示例
function demonstrateDH() {
    // 使用一个相对较小的质数进行演示（实际应用应使用更大的质数）
    const prime = "23"; // 质数 p
    const generator = "5"; // 生成元 g
    
    console.log("=== Diffie-Hellman 密钥交换演示 ===\n");
    
    // Alice 生成密钥对
    const alice = new DiffieHellman(prime, generator);
    const aliceKeys = alice.generateKeys();
    console.log("Alice:");
    console.log("  私钥:", aliceKeys.privateKey);
    console.log("  公钥:", aliceKeys.publicKey);
    
    // Bob 生成密钥对
    const bob = new DiffieHellman(prime, generator);
    const bobKeys = bob.generateKeys();
    console.log("\nBob:");
    console.log("  私钥:", bobKeys.privateKey);
    console.log("  公钥:", bobKeys.publicKey);
    
    // 密钥交换
    console.log("\n=== 密钥交换 ===");
    
    // Alice 使用 Bob 的公钥计算共享密钥
    const aliceSharedSecret = alice.computeSharedSecret(bobKeys.publicKey);
    console.log("Alice 计算的共享密钥:", aliceSharedSecret);
    console.log("Alice 共享密钥(hex):", alice.getSharedSecretHex());
    
    // Bob 使用 Alice 的公钥计算共享密钥
    const bobSharedSecret = bob.computeSharedSecret(aliceKeys.publicKey);
    console.log("Bob 计算的共享密钥:", bobSharedSecret);
    console.log("Bob 共享密钥(hex):", bob.getSharedSecretHex());
    
    // 验证共享密钥是否相同
    console.log("\n=== 验证结果 ===");
    console.log("共享密钥匹配:", aliceSharedSecret === bobSharedSecret);
    
    // 演示中间人无法计算相同的共享密钥
    console.log("\n=== 安全演示 ===");
    const eve = new DiffieHellman(prime, generator);
    eve.generateKeys();
    
    // Eve 尝试使用自己的私钥和对方的公钥计算（但无法得到相同的共享密钥）
    const eveWithAlice = eve.computeSharedSecret(aliceKeys.publicKey);
    const eveWithBob = eve.computeSharedSecret(bobKeys.publicKey);
    
    console.log("Eve 与 Alice 计算的密钥:", eveWithAlice);
    console.log("Eve 与 Bob 计算的密钥:", eveWithBob);
    console.log("Eve 能否获得相同密钥:", 
        eveWithAlice === aliceSharedSecret || eveWithBob === bobSharedSecret ? "是" : "否");
}

// 运行演示
if (typeof window !== 'undefined' && window.crypto) {
    // 浏览器环境
    demonstrateDH();
} else if (typeof crypto !== 'undefined') {
    // Node.js 环境（需要 Node.js v15+）
    demonstrateDH();
} else {
    console.log("请在现代浏览器或 Node.js 环境中运行此代码");
}

// 更安全的版本，使用更大的质数（RFC 3526 中的 2048-bit MODP Group）
class SecureDiffieHellman extends DiffieHellman {
    constructor() {
        // 使用 RFC 3526 2048-bit MODP Group
        const prime2048 = `
            0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E08
            8A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302
            B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED
            6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D
            C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C
            62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C3290
            5E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCB
            F6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF
        `.replace(/\s+/g, '');
        
        super(prime2048, "2");
    }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DiffieHellman, SecureDiffieHellman };
}