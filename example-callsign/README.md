Example callsign server

Uses [Caddy server](https://caddyserver.com), but could use any other server you like.  
It also uses Let's Encrypt, but again you can use anything.

To run yourself you need a domain and a server, with [docker](https://www.docker.com)
and [docker-compose](https://docs.docker.com/compose).  
Add your domain to [.env](.env) file.

Example:

```bash
echo "CALLSIGN=iambob.com" > .env
docker-compose up
```
