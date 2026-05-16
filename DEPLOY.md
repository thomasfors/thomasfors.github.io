# Thomas Fors Deployment Notes

## Goal

Run the site as a small Node.js service on Debian. Keep uploaded images outside the app deploy folder so new deployments do not overwrite media.

## Host Paths

Use this layout on the Debian host:

```text
/opt/thomasfors.se        # app checkout/deploy target
/srv/thomasfors-media     # uploaded images, outside the app
```

Create the media folder:

```sh
sudo mkdir -p /srv/thomasfors-media/galleries
sudo chown -R root:root /srv/thomasfors-media
```

## Environment

Set these for the service:

```sh
PORT=3002
MEDIA_DIR=/srv/thomasfors-media
ADMIN_PASSWORD=choose-a-password
COOKIE_SECRET=choose-a-long-random-secret
```

## First Install

On the Debian host, from the app folder:

```sh
npm install --omit=dev
```

## Run With Systemd

Create `/etc/systemd/system/thomasfors.service`:

```ini
[Unit]
Description=Thomas Fors gallery site
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/thomasfors.se
Environment=PORT=3002
Environment=MEDIA_DIR=/srv/thomasfors-media
Environment=ADMIN_PASSWORD=choose-a-password
Environment=COOKIE_SECRET=choose-a-long-random-secret
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable it:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now thomasfors
```

## Nginx Proxy

Use Nginx to send the public domain to the Node app:

```nginx
server {
    server_name thomasfors.se www.thomasfors.se;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

After DNS points to the host, add TLS with Certbot.

## Moving Existing Images

The old checkout does not currently include the referenced JPG files. If you have them elsewhere, copy them into:

```text
/srv/thomasfors-media/galleries/<gallery-slug>/
```

Example:

```text
/srv/thomasfors-media/galleries/future-comes/future comes34.jpg
```

The filenames should match `server/data/galleries.json`.
