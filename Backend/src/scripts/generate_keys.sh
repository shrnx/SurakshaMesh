#!/bin/bash
set -e
mkdir -p keys
echo "Generating RSA 2048 keys into ./keys/"
openssl genpkey -algorithm RSA -out ./keys/private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in ./keys/private.pem -out ./keys/public.pem
echo "Done. Keys in ./keys/private.pem and ./keys/public.pem"
