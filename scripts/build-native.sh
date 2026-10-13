#!/bin/bash
# Builds better-sqlite3 against glibc 2.28 (AlmaLinux 8). The bundled prebuild needs
# glibc 2.29 and will not load on CloudLinux 8 hosts. Usage: build-native.sh [outdir]
set -euo pipefail
cd "$(dirname "$0")/.."

ver=$(node -p "require('./package-lock.json').packages['node_modules/better-sqlite3'].version")
out="${1:-.native}"
mkdir -p "$out"

docker run --rm -e VER="$ver" -v "$PWD/$out:/out" almalinux:8 bash -euo pipefail -c '
	dnf install -y -q gcc-toolset-12-gcc-c++ make python3.11 xz
	curl -fsSL https://nodejs.org/dist/v22.23.3/node-v22.23.3-linux-x64.tar.xz | tar -xJ -C /opt
	export npm_config_python=/usr/bin/python3.11
	export PATH=/opt/node-v22.23.3-linux-x64/bin:$PATH
	source /opt/rh/gcc-toolset-12/enable
	mkdir /build && cd /build && npm init -y >/dev/null
	npm install --ignore-scripts better-sqlite3@"$VER" node-gyp
	cd node_modules/better-sqlite3
	npx node-gyp rebuild --release --force_build=1
	cp build/Release/better_sqlite3.node /out/
'
echo "Built $out/better_sqlite3.node (better-sqlite3 $ver)"
