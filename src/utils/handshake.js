import { importRsaPublicKey, rsaEncryptAesKey } from "./rsaHelper";
import { bytesToHex } from "./cryptoHelper";
const BASE_URL = process.env.VUE_APP_API_URL;
export async function performHandshake() {

    // 1. Ambil public RSA key
    const res = await fetch(`${BASE_URL}/crypto/public-key`);
    const data = await res.json();
    const publicKeyPem = data.public_key;

    const rsaKey = await importRsaPublicKey(publicKeyPem);

    // 2. Generate AES key
    const aesKeyBytes = crypto.getRandomValues(new Uint8Array(32));
    const aesKeyHex = bytesToHex(aesKeyBytes);

    // 3. Encrypt AES key
    const encryptedKeyHex = await rsaEncryptAesKey(aesKeyBytes, rsaKey);

    // 4. Kirim handshake
    const handshakeRes = await fetch(`${BASE_URL}/crypto/handshake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: encryptedKeyHex })
    });

    const handshakeJson = await handshakeRes.json();
    const sessionToken = handshakeJson.session_token;

    localStorage.setItem("ENCRYPTION_SESSION", sessionToken);
    localStorage.setItem("AES_KEY", aesKeyHex);

    return { aesKeyHex, sessionToken };
}

export function getSessionToken() {
    return localStorage.getItem("ENCRYPTION_SESSION");
}

export function getAesKey() {
    return localStorage.getItem("AES_KEY");
}
