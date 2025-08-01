FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js and nginx
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
    mkdir /run/sshd && \
    if ! id -u ubuntu >/dev/null 2>&1; then \
        useradd --create-home --uid 1000 --shell /bin/bash ubuntu; \
    fi && \
    echo 'ubuntu:pass123' | chpasswd && \
    usermod -aG sudo ubuntu && \
    sed -ri 's/#?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -ri 's/#?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY . /var/www/html

# Configure nginx
RUN echo 'server {\n\
    listen 80;\n\
    root /var/www/html;\n\
    index index.html index.htm;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
}' > /etc/nginx/sites-available/default

EXPOSE 22 80

RUN ssh-keygen -A

# Create startup script to run nginx, Node.js app and sshd
RUN echo '#!/bin/bash\n\
echo "Starting nginx..."\n\
service nginx start\n\
echo "Starting SSH daemon..."\n\
/usr/sbin/sshd -D' > /startup.sh && \
    chmod +x /startup.sh

CMD ["/startup.sh"]