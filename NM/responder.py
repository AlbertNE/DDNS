

file = "/Users/albert/Documents/项目/一兆韦德/appex_rsp_erp_allow_sub_10.2.83.0_24"
fr = open(file,'r')
fw = open("/Users/albert/Documents/项目/一兆韦德/rsp_policy",'a')

for i in fr.readlines():
    b = i.replace('\n', '')
    l = b.split('_')
    str="add responder policy %s \"!CLIENT.IP.SRC.IN_SUBNET(%s/%s)\" RESET\n" % (b,l[5],l[6])
    fw.write(str)
fr.close()
fw.close()

import socket
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
s.connect(("127.0.0.1",8777))
s.send(b"0x62000000190000000100000078c2ffff00001008bebaadde070d02067cba2b5f01000000041e0d000100000000000000000000006e73726f6f74003137322e31362e3131322e310006003433323937004353540073686f77206e7374726163650000")