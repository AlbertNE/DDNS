# -*- coding: cp936 -*-
import requests,re,datetime,urllib,base64,hmac,random
from hashlib import sha1
class dnsapi():
    def __init__(self):
        self.__D={

        }
    def __start(self):
        strurl = self.__starturl()
        signature = self.__hmac(strurl, 'IMnC44a3C4RcvKfxhanesl35JQemR7')
        self.__addParameter('Signature', signature.decode('utf-8'))
        url = 'https://alidns.aliyuncs.com/?' + urllib.parse.urlencode(self.__D)
        print(url)
        r = requests.get(url)
        print(r)
        return (r.text)
    def __utctimenow(self):
        timenow = datetime.datetime.utcnow()
        timenow = str(timenow)
        timenow = timenow.replace(' ', 'T')
        d = re.compile('\.[0-9]+')
        timenow = d.sub('', timenow) + 'Z'
        return (timenow)
    def __addParameter(self,name,value):
        self.__D[str(name)]=str(value)
    def __percentEncode(slef,strc):
        res = urllib.parse.quote(strc.encode('utf8'), '')
        res = res.replace('+', '%20')
        res = res.replace('*', '%2A')
        res = res.replace('%7E', '~')
        return res
    def __starturl(self):
        sortedD = sorted(self.__D.items(), key=lambda x: x[0])
        canstring = ''
        for k, v in sortedD:
            canstring += '&' + self.__percentEncode(k) + '=' + self.__percentEncode(v)
        stringToSign = 'GET&%2F&' + self.__percentEncode(canstring[1:])
        return (stringToSign)
    def __hmac(self,stringToSign,access_key_secret):
        h = hmac.new((access_key_secret + "&").encode('utf-8'), stringToSign.encode('utf-8'), sha1)
        signature = base64.encodestring(h.digest()).strip()
        return (signature)
    def AddRecod(self,host,value,Type='A'):
        self.__D={}
        self.__addParameter('Format','JSON')
        self.__addParameter('Version', '2015-01-09')
        self.__addParameter('SignatureVersion','1.0')
        self.__addParameter('SignatureMethod', 'HMAC-SHA1')
        self.__addParameter('SignatureNonce', str(random.randint(1,99999999999999999)))
        self.__addParameter('AccessKeyId', 'LTAIuAcLddELe8Fe')
        self.__addParameter('DomainName', 'qianyuansj.com')
        self.__addParameter('Timestamp', str(self.__utctimenow()))
        self.__addParameter('RR', host)
        self.__addParameter('Type', Type)
        self.__addParameter('Value',value)
        self.__addParameter('Action','AddDomainRecord')
        try:
            r=self.__start()
            return(r)
        except:
            return('参数不正确,正确方式：添加DNS记录(www,1.2.3.4,A)')
    def ListRecodeing(self,RR=None,Type=None):
        self.__D={}
        self.__addParameter('Format', 'json')
        self.__addParameter('Version', '2015-01-09')
        self.__addParameter('SignatureVersion', '1.0')
        self.__addParameter('SignatureMethod', 'HMAC-SHA1')
        self.__addParameter('SignatureNonce', str(random.randint(1, 99999999999)))
        self.__addParameter('AccessKeyId', 'LTAIuAcLddELe8Fe')
        self.__addParameter('Timestamp', self.__utctimenow())
        self.__addParameter('DomainName', 'qianyuansj.com')
        self.__addParameter('Action', 'DescribeDomainRecords')
        if RR!=None:
            self.__addParameter('RRKeyWord', RR)
        if Type!=None:
            self.__addParameter('TypeKeyWord', Type)
        c=self.__start()
        return c
    def ModifyReodeing(self,RecodeID,RR,Type,Value):
        self.__D={}
        self.__addParameter('Format', 'json')
        self.__addParameter('Version', '2015-01-09')
        self.__addParameter('SignatureVersion', '1.0')
        self.__addParameter('SignatureMethod', 'HMAC-SHA1')
        self.__addParameter('SignatureNonce', str(random.randint(1, 99999999999)))
        self.__addParameter('AccessKeyId', 'LTAIuAcLddELe8Fe')
        self.__addParameter('Timestamp', self.__utctimenow())
        self.__addParameter('DomainName', 'qianyuansj.com')
        self.__addParameter('Action', 'UpdateDomainRecord')
        self.__addParameter('RecordId', RecodeID)
        self.__addParameter('RR', RR)
        self.__addParameter('Type', Type)
        self.__addParameter('Value', Value)
        c = self.__start()
        return c
class strprocess():
    def getparameter(self,strs):
        rr=re.search(r'"RR":"[A-z0-9.*_]+',strs).group()
        host=rr.split('":"')[-1]
        v=re.search(r'"Value":"[A-z0-9.*_]+',strs).group()
        values=v.split('":"')[-1]
        t=re.search(r'"Type":"[A-z0-9.*_]+',strs).group()
        Type=t.split('":"')[-1]
        rid=re.search(r'"RecordId":"[A-z0-9.*_]+',strs).group()
        RecordID=rid.split('":"')[-1]
        retur='主机头:'+host+'\r\n'+'解析地址:'+values+'\r\n'+'记录类型:'+Type+'\r\n'+'解析ID:'+RecordID+'\r\n________________________\r\n'
        return(retur)
    def listdns(self,prestr):
        try:
            strs=re.search('\['+r'[A-z0-9{}"",.:]+'+'\]',prestr).group()[2:-2]
            try:
                strs=strs.split('},{')
                returnlist=''
                for i in strs:
                    returnlist+=self.getparameter(i)
                return (returnlist)
            except:
                return(self.getparameter(strs))
        except:
            return('返回时取值错误')
    def modifydns(self,prestr):
        if 'RecordId' in prestr:
            return('操作成功')
        else:
            return('操作失败，错误如下：'+prestr)