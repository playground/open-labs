FROM registry.access.redhat.com/ubi8/ubi
ARG kickstart
ARG commit
RUN yum -y install httpd && yum clean all
ADD $kickstart /var/www/html/
ADD $commit /var/www/html/
EXPOSE 80
CMD ["/usr/sbin/httpd", "-D", "FOREGROUND"]
