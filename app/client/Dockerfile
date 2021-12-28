FROM caddy:2-builder AS builder

RUN xcaddy build --with github.com/caddy-dns/lego-deprecated

FROM node:16 as clientbuilder

COPY . /app
WORKDIR /app
RUN du -a
RUN npm i && ./node_modules/.bin/parcel build src/index.html --public-url .

FROM caddy:2

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
COPY --from=clientbuilder /app/dist /data/client
COPY --from=clientbuilder /app/Caddyfile /etc/caddy/


RUN du -a /data
