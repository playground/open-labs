lang en_US.UTF-8
keyboard us
timezone America/New_York --isUtc
zerombr
clearpart --all --initlabel
autopart --type=plain --fstype=xfs --nohome
reboot
text
network --bootproto=dhcp
user --name ieam --groups=wheel --password=ieam123
services --enabled=ostree-remount
ostreesetup --nogpg --osname=rhel --url=http://192.168.1.118:8080/repo/ --ref=rhel/8/x86_64/edge
