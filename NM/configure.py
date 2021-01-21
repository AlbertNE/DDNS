from re import search
srvc=[]
text=[]
n=1
with open('/Users/albert/Downloads/suzhoubank.csv','r') as fr:
    for i in fr.readlines():
        text.append(i)
fad = open('/Users/albert/Downloads/add.txt','a')
frm = open('/Users/albert/Downloads/rm.txt','a')
for f in text:
    idle=''
    f=f.replace('\n','')
    f=f.replace('﻿','')
    i=f.split(',')
    host = i[7].split(':')[0]
    port = i[7].split(':')[1]
    srvconf = "add service"
    srvconf += " " + i[4]
    srvconf += " " + host
    if i[2] == 'tcp_idle_1200':
        idle='1200'
        srvconf += " tcp"
    else:
        srvconf += " " + i[2]
    srvconf += " " + port
    if i[3] == 'usip':
        srvconf += " -usip yes"
    else:
        srvconf += " -usip no"
    if idle != '':
        srvconf += " -svrTimeout %s" % idle

    vshost = i[1].split(':')[0]
    vsport = i[1].split(':')[1]
    vsconf = "add lb vserver"
    vsconf += " " + i[0]
    if i[2] == 'tcp_idle_1200':
        idle='1200'
        vsconf += " tcp"
    else:
        vsconf += " " + i[2]
    vsconf += " " + vshost
    vsconf += " " + vsport
    vsconf += " -lbmethod ROUNDROBIN"
    if idle!='':
        vsconf += " -cltTimeout " + idle
    bindmon = "bind service %s -monitorName %s" % (i[4],i[6])
    bindconf = "bind lb vs %s %s" % (i[0],i[4])
    print("%d::" % n + srvconf)
    print("%d::" % n + bindmon)
    print("%d::" % n + vsconf)
    print("%d::" % n + bindconf)
    if i[4] not in srvc:
        fad.write(srvconf+'\n')
        fad.write(bindmon+'\n')
        frm.write("rm service %s\n" % i[4])
        srvc.append(i[4])
    fad.write(vsconf+'\n')
    fad.write(bindconf+'\n')
    frm.write("rm lb vs %s\n" % i[0])
    n+=1
fad.close()
frm.close()

