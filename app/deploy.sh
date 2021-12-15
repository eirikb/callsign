#!/usr/bin/env bash
set -x

prep() {
  cp -r /b /home/node/b
  cd /home/node/b
  git clean -fXd
  cd app
}

if [ "$1" == "" ]; then
  rm -rf build
  mkdir build
  for target in server host client; do
    bash deploy.sh docker-node $target
  done
  bash deploy.sh deploy
  bash deploy.sh restart

elif [ "$1" == "docker-node" ]; then
    docker run --rm -it -v $PWD/../:/b:ro -v $PWD/build:/build -u $UID node:16 bash /b/app/deploy.sh "$2"

elif [ "$1" == "server" ]; then
  prep
  cd server
  npm i
  cd ..
  cp -r server /build/server

elif [ "$1" == "host" ]; then
  prep
  cp -r host/* /build/

elif [ "$1" == "client" ]; then
  prep
  cd client
  npm i
  ./node_modules/.bin/parcel build src/index.html --public-url .
  cd ..
  cp -r client/dist /build/client
  cp client/favicon.ico /build/client/

elif [ "$1" == "deploy" ]; then
  rsync -aP build/* 192.168.1.2:~/callsign/

elif [ "$1" == "restart" ]; then
  ssh 192.168.1.2 "cd callsign && docker-compose down"
  ssh 192.168.1.2 "cd callsign && docker-compose up -d"
fi
