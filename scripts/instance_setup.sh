#!/bin/bash
yum -y update
sudo yum -y install ruby
yum -y install wget
cd /home/ec2-user
wget https://aws-codedeploy-us-east-2.s3.us-east-2.amazonaws.com/latest/install
sudo chmod +x ./install
sudo ./install auto
sudo systemctl enable codedeploy-agent
sudo systemctl start codedeploy-agent
curl -sL https://rpm.nodesource.com/setup_20.x | sudo bash -
yum install -y nodejs
npm install pm2@latest -g
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user


# Install nginx
sudo yum install nginx -y

# Overwrite the NGINX config for reverse proxy
cat <<EOL | sudo tee /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format  main  '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                      '\$status \$body_bytes_sent "\$http_referer" '
                      '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Redirect all server traffic to the application on port 3000
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_cache_bypass \$http_upgrade;
        }
    }

    # Further SSL configuration can go here when ready for HTTPS
    # server {
    #     listen 443 ssl default_server;
    #     listen [::]:443 ssl default_server;
    #     server_name _;
    #     ssl_certificate /path/to/certificate;
    #     ssl_certificate_key /path/to/private/key;
    #     # Other SSL related directives...
    #     location / {
    #         proxy_pass http://localhost:3000;
    #         proxy_http_version 1.1;
    #         proxy_set_header Upgrade \$http_upgrade;
    #         proxy_set_header Connection 'upgrade';
    #         proxy_set_header Host \$host;
    #         proxy_cache_bypass \$http_upgrade;
    #     }
    # }
}
EOL

# Start nginx and enable it to start on boot
sudo systemctl start nginx
sudo systemctl enable nginx