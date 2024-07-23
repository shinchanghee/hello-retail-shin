FROM ubuntu:latest

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_DEFAULT_REGION

RUN apt-get update --yes && \
    apt-get install --yes \
    git \
    dos2unix \
    jq \
    curl \
    dirmngr \
    apt-transport-https \
    lsb-release \
    ca-certificates \
    gcc \
    g++ \
    make \
    python3-pip \
    openjdk-8-jre-headless \
    unzip

RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

RUN aws configure set aws_access_key_id ${AWS_ACCESS_KEY_ID} && \
    aws configure set aws_secret_access_key ${AWS_SECRET_ACCESS_KEY} && \
    aws configure set region ${AWS_DEFAULT_REGION}

RUN git clone https://github.com/shinchanghee/hello-retail.git
WORKDIR /hello-retail/

RUN chmod 777 /hello-retail/*.sh && \
    chmod 777 /hello-retail/build/*.sh && \
    dos2unix /hello-retail/*.sh && \
    dos2unix /hello-retail/build/*.sh

RUN ./install.sh ${AWS_DEFAULT_REGION} prod company team

CMD sleep 1000000000000000000000
