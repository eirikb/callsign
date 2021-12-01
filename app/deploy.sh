#!/usr/bin/env bash

rm -rf build
docker run --rm -it -v $(pwd)/../:/b -u $(id -u):$(id -g) node:16 /bin/sh -c "\
cp -r /b /home/node/b && cd /home/node/b
git clean -fXd
cd app
mkdir build
cat package.json
npm i
cp -r server build
cp -r node_modules build/server
cp -r build /b/app/build
"
