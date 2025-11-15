//sha256 + RSA sign/verify

import crypto from 'crypto'
import fs from 'fs'

const PRIVATE_KEY_PATH = process.env.SIGNING_PRIVATE_KEY_PATH || './keys/private.pem';
const PUBLIC_KEY_PATH = process.env.SIGNING_PUBLIC_KEY_PATH || './keys/public.pem';

function sha256hex(obj) {
  const s = JSON.stringify(obj);
  return crypto.createHash('sha256').update(s).digest('hex');
}

function signPayload(payload) {
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  const hash = sha256hex(payload);
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(hash);
  const signature = signer.sign(privateKey, 'base64');
  return { signature, hash, signer: 'RS256' };
}

function verifyPayload(payload, signature) {
  const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
  const hash = sha256hex(payload);
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(hash);
  return verifier.verify(publicKey, signature, 'base64');
}

module.exports = { sha256hex, signPayload, verifyPayload };
