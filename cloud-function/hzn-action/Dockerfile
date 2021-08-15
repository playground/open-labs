FROM ubuntu:20.04

# Set timezone:
RUN ln -snf /usr/share/zoneinfo/$CONTAINER_TIMEZONE /etc/localtime && echo $CONTAINER_TIMEZONE > /etc/timezone

RUN apt-get update && apt-get install -y tzdata curl sudo net-tools

RUN curl -sL https://deb.nodesource.com/setup_16.x  | bash
RUN apt-get -yq install nodejs

ENV HZN_ORG_ID biz
ENV HZN_EXCHANGE_USER_AUTH iamapikey:Gp3JG7s1Oq0mgzo3h7GgXSjOU1rlObfIOUf0NEqu892k
ENV HZN_FSS_CSSURL https://cp-console.ieam42-edge-8e873dd4c685acf6fd2f13f4cdfb05bb-0000.us-south.containers.appdomain.cloud/edge-css

RUN echo $HZN_ORG_ID
RUN curl -u "$HZN_ORG_ID/$HZN_EXCHANGE_USER_AUTH" -k -o agent-install.sh $HZN_FSS_CSSURL/api/v1/objects/IBM/agent_files/agent-install.sh/data
RUN chmod +x agent-install.sh

RUN ./agent-install.sh -i 'css:'; exit 0
RUN hzn key create IBM ljeff@us.ibm.com 
