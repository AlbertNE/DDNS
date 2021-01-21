#* -*- coding: utf-8 -*-
import getopt, datetime, re, urllib
from time import sleep
from Crypto.Cipher import AES
from binascii import b2a_hex, a2b_hex
from requests import get
from hashlib import sha1
from hmac import new
from random import randint
from base64 import b64encode, b64decode, encodestring
from sys import argv

class aliyunapi():
    def __init__(self):
        self.Signature = ''
        # self.Signature = 'IMnC44a3C4RcvKfxhanesl35JQemR7'
        self.AccessKeyId = ''
        # self.AccessKeyId = 'LTAIuAcLddELe8Fe'
        self.Domain = ''
        self.__D={

        }
    def __start(self):
        strurl = self.__starturl()
        signature = self.__hmac(strurl, self.Signature)
        self.__addParameter('Signature', signature.decode('utf-8'))
        url = 'https://alidns.aliyuncs.com/?' + urllib.parse.urlencode(self.__D)
        #print(url)
        r = get(url)
        #print(r.text)
        return (r)
    def __utctimenow(self):
        timenow = datetime.datetime.utcnow()
        timenow = str(timenow)
        timenow = timenow.replace(' ', 'T')
        d = re.compile('\.[0-9]+')
        timenow = d.sub('', timenow) + 'Z'
        return (timenow)
    def __addParameter(self, name, value):
        self.__D[str(name)]=str(value)
    def __percentEncode(slef, strc):
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
    def __hmac(self, stringToSign, access_key_secret):
        #h = new(bytes(str((access_key_secret + bytes("&", encoding='utf-8'))).encode('utf-8')), stringToSign.encode('utf-8'), sha1)
        h = new((access_key_secret + "&").encode('utf-8'), stringToSign.encode('utf-8'), sha1)
        signature = encodestring(h.digest()).strip()
        return (signature)
    def AddRecorde(self, host, value, Type='A'):
        self.__D={}
        self.__addParameter('Format', 'JSON')
        self.__addParameter('Version', '2015-01-09')
        self.__addParameter('SignatureVersion', '1.0')
        self.__addParameter('SignatureMethod', 'HMAC-SHA1')
        self.__addParameter('SignatureNonce', str(randint(1, 99999999999999999)))
        self.__addParameter('AccessKeyId', self.AccessKeyId)
        self.__addParameter('DomainName', self.Domain)
        self.__addParameter('Timestamp', str(self.__utctimenow()))
        self.__addParameter('RR', host)
        self.__addParameter('Type', Type)
        self.__addParameter('Value', value)
        self.__addParameter('Action', 'AddDomainRecord')
        try:
            r=self.__start()
            return(r)
        except:
            raise ('Error')
    def ListRecorde(self, RR=None, Type=None):
        self.__D={}
        self.__addParameter('Format', 'json')
        self.__addParameter('Version', '2015-01-09')
        self.__addParameter('SignatureVersion', '1.0')
        self.__addParameter('SignatureMethod', 'HMAC-SHA1')
        self.__addParameter('SignatureNonce', str(randint(1, 99999999999)))
        self.__addParameter('AccessKeyId', self.AccessKeyId)
        self.__addParameter('Timestamp', self.__utctimenow())
        self.__addParameter('DomainName', self.Domain)
        self.__addParameter('Action', 'DescribeDomainRecords')
        if RR!=None:
            self.__addParameter('RRKeyWord', RR)
        if Type!=None:
            self.__addParameter('TypeKeyWord', Type)
        c=self.__start()
        return (c)
    def ModifyRecorde(self, RecodeID, RR, Type, Value):
        self.__D={}
        self.__addParameter('Format', 'json')
        self.__addParameter('Version', '2015-01-09')
        self.__addParameter('SignatureVersion', '1.0')
        self.__addParameter('SignatureMethod', 'HMAC-SHA1')
        self.__addParameter('SignatureNonce', str(randint(1, 99999999999)))
        self.__addParameter('AccessKeyId', self.AccessKeyId)
        self.__addParameter('Timestamp', self.__utctimenow())
        self.__addParameter('DomainName', self.Domain)
        self.__addParameter('Action', 'UpdateDomainRecord')
        self.__addParameter('RecordId', RecodeID)
        self.__addParameter('RR', RR)
        self.__addParameter('Type', Type)
        self.__addParameter('Value', Value)
        c = self.__start()
        return (c)

class dynamicdns:

    def __init__(self):
        self.confdict={}

    def usage(self):
        print('')
        print('''                                                                                                      
      *                                                                                                         *
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *   
      *                                                                                                         *
      *         %%%            %%            %%     %%         %%                  %%%                          *        
      *      %%    %%          %%             %  %%%%          %%%%%%%%%%           %             %%%%%%%       *        
      *     % %%  %% %%         %                     %%%    % %%   %%         %%   %   %%         %   %%       *        
      *    % %%       %        %%%%%%%     %% %%%%%%%        % %%%%%%%%%%       %   %  %%%         % %%%        *        
      *    % %%       %     %%%%%            %   %% %%       % %% % %% %%      %%%%%%   %          %%           *        
      *    % %%       %        %%%           %  %%   %       % % %% %% %%           %             %%% %%%%%%%   *        
      *     % %%%%%% %%       %% %%         %%      %%        %%  % %%%%        %   %   %%     %%  %% %%  %%    *        
      *      %%    %%        %%   %%%      %%       %%       %%     %%          % %%%%%%%%      %  %   % %%%    *        
      *         %%         %%      %%%%%%        %%%%       %       %          %%       %%      %      %        *        
      *                                            %                %                                           *        
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *                                                                                                                           
      *                                                                                                         *
                                                                                                               ''')
        print('')
        print('')
        print('''-m                                       指定一个启动模式     
                                        [if]:配置文件生成模式
                                        [sf]:读取配置文件并执行动态域名解析
                                        [sc]:通过命令行带入参数执行动态域名解析''')
        print('The SF MODE')
        print('-i                                       指定一个配置文件路径')
        print('The SC MODE')
        print('-r                                       指定进行动态域名解析的主机名')
        print('-d                                       指定主机所在域名')
        print('-t                                       指定解析记录类型')
        print('-k                                       指定AccessKeyID')
        print('-s                                       指定AccessKeyID的密钥')
        print('-v                                       指定一个检查间隔，单位为分钟')
        print('-h                                       --help查看帮助信息')
        return()

    def main(self):
        mode=''
        input=''
        host=''
        domain=''
        types="A"
        key=''
        signature=''
        interval='10'
        try:
            if argv[1] in ("-h", "--help"):
                return (self.usage())
        except:
            return (self.usage())
        try:
            opts, args = getopt.getopt(argv[1:], "hm:i:d:t:r:k:s:v", ["help", "mode", "input", "domain", "type", "host", "key", "signature", "interval"])
        except getopt.GetoptError as err:
            raise (err)
        for r, v in opts:
            if r in ("-m", "--mode"):
                mode=v
            elif r in ("-i", "--input"):
                input=v
            elif r in ("-r", "--host"):
                host=v
            elif r in ("-d", "--domain"):
                domain=v
            elif r in ("-t", "--type"):
                types=v
            elif r in ("-k", "--key"):
                key=v
            elif r in ("-s", "--signature"):
                signature=v
            elif r in ("-v", "--interval"):
                interval=v
        if mode == '':
            raise ("[Error]:You must specify a valid start mode")
        if mode.upper() == "IF":
            self.start_if()
        elif mode.upper() == "SF":
            if input != '':
                self.start_sf(input)
            else:
                raise ("[Error]:You must specify a input path when mode is sf ")
        elif mode.upper() == "CF":
            if host == '':
                raise ("[Error]:You must specify a valid RR when mode is cf " )
            elif domain == '':
                raise ("[Error]:You must specify a valid domain when mode is cf ")
            elif key == '':
                raise ("[Error]:You must specify a valid AccessKeyId when mode is cf ")
            elif signature == '':
                raise ("[Error]:You must specify a valid Signature when mode is cf ")
            else:
                self.start_cf(host, domain, types, key, signature, interval)
        return()

    def text16(self, strs, leng, rpstrs):
        lstr=len(strs)
        if (lstr % leng) != 0 :
            add = leng - (lstr % leng)
        else:
            add = 0
        strs += rpstrs * add
        return(strs)

    def get_pubip(self):
        self.ddns_log('Getting the public ip from http://ip.42.pl/raw...', 'info')
        res = get('http://ip.42.pl/raw')
        if res.status_code == 200:
            self.ddns_log('Current public address is %s' % res.text, 'info')
            return(res.text)
        else:
            self.ddns_log('The http://ip.42.pl/raw is unavailable...', 'warning')
            res = get('http://txt.go.sohu.com/ip/soip')
            if res.status_code == 200:
                pubip = re.search(r'\d{3}\.\d{3}\.\d{3}\.\d{3}', res.text).group()
            else:
                raise (self.ddns_log('The http://txt.go.sohu.com/ip/soip is unavailable...', 'warning'))
        return(pubip)

    def ddns_log(self, text, level):
        nowtime = '['+datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')+']'
        print(nowtime+'['+level+']'.upper()+text)

    def encrypt(self, key, text):
        key = self.text16(key, 16, 'f')
        cryptor = AES.new(key, AES.MODE_CBC, key)
        text = self.text16(text, 16, '\0')
        ciphertext = cryptor.encrypt(text)
        return (b2a_hex(ciphertext))

    def decrypt(self, key, text):
        key = self.text16(key, 16, 'f')
        cryptor = AES.new(key, AES.MODE_CBC, key)
        ciphertext = cryptor.decrypt(text)
        return (ciphertext)

    def start_if(self):
        path = input("Enter the output path for configuration file: ")
        try:
            with open(path, 'w') as f:
                f.write('test')
        except:
            raise ("[Error]:The path does not exist or insufficient permissions ")
        configfile={}
        configfile["domain"]=input("Enter your domain please: ")
        enc=input("Do you want to encrypt AccessKeyId and Signature?(Y/N)")
        if enc.upper() == 'Y':
            configfile["encrypt"] = 'ENABLE'
            passwd = input("Enter a password to encrypt AccessKeyId and Signature: ")
            AccessKeyId = input("Enter the ali AccessKeyId please: ")
            configfile["len_key"] = len(AccessKeyId)
            configfile["AccessKeyId"] = self.encrypt(passwd, AccessKeyId)
            Signature = input("Enter the ali Signature please: ")
            configfile["len_sig"] = len(Signature)
            configfile["Signature"] = self.encrypt(passwd, Signature)
        else:
            configfile["AccessKeyId"] = input("Enter the ali AccessKeyId please: ")
            configfile["Signature"] = input("Enter the ali Signature please: ")
        configfile["interval"] = input("Enter the interval please: ")
        num = input("How many records do you want to enable dynamic resolution: ")
        configfile['host'] = {}
        for i in range(int(num)):
            configfile["host"][i] = {}
            configfile["host"][i]['rr'] = input("Enter RR%d please: " % (i+1))
            configfile["host"][i]['type'] = input("Enter type%s please: " % (i+1)).upper()
        with open(path, 'w') as file:
            file.write(str(b64encode(bytes(str(configfile), encoding='utf-8'))))
        return()

    def start_sf(self, file):
        conf=''
        with open(file, 'rb') as rf:
            self.ddns_log('loading the config file...', 'info')
            for i in rf.readlines():
                conf += str(i,'utf-8')
        conf_dict = eval(str(b64decode(conf[2:-1]), encoding='utf-8'))
        self.ddns_log('Formatting the configuration file...', 'info')
        self.ddns_log('Read the config file...', 'info')
        self.ddns_log(str(conf_dict), 'info')
        if conf_dict["encrypt"] == "ENABLE":
            passwd = input("The configuration file is encrypted. Please enter your password:")
            len_key = conf_dict["len_key"]
            len_sig = conf_dict["len_sig"]
            self.ddns_log('Decryption AccessKeyId annd Signature from the configration file...', 'info')
            key_encrypt = a2b_hex(conf_dict['AccessKeyId'])
            signature_encrypt = a2b_hex(conf_dict['Signature'])
            try:
                key_decrypt = str(self.decrypt(passwd, key_encrypt)[:len_key], encoding='utf-8')
                signature_decrypt = str(self.decrypt(passwd, signature_encrypt)[:len_sig], encoding='utf-8')
            except:
                raise('The password is invaild, program will be discontinued')
        else:
            self.ddns_log('Get AccessKeyId annd Signature from the configration file...', 'info')
            key_decrypt = conf_dict['AccessKeyId']
            signature_decrypt = conf_dict['Signature']
        self.ddns_log('The information is initialized, enabling dynamic DNS module...', 'info')
        #print(key_decrypt)
        #print(signature_decrypt)
        self.start_cf(conf_dict['host'], conf_dict['domain'], key_decrypt, signature_decrypt, conf_dict['interval'])
        return()

    def start_cf(self, host, domain, key, signature, interval):
        dns = aliyunapi()
        dns.AccessKeyId = key
        dns.Signature = signature
        dns.Domain = domain
        while True:
            try:
                public_ip = self.get_pubip()
                for i in host:
                    RecodList = dns.ListRecorde(host[i]['rr'], host[i]['type'].upper()).text
                    RecodList = eval(RecodList.replace('true', 'True').replace('false', 'False'))
                    self.ddns_log('Getting dns records infomation for %s.%s....' % (host[i]['rr'], domain), 'info')
                    RecodList_type = RecodList['DomainRecords']['Record'][0]['Type']
                    self.ddns_log('The record type is %s ' % RecodList_type, 'info')
                    status = RecodList['DomainRecords']['Record'][0]['Status']
                    self.ddns_log('The record status is %s ' % status, 'info')
                    RID = RecodList['DomainRecords']['Record'][0]['RecordId']
                    self.ddns_log('The record RID is %s ' % RID, 'info')
                    TTL = RecodList['DomainRecords']['Record'][0]['TTL']
                    self.ddns_log('The record TTL is %s ' % TTL, 'info')
                    Value = RecodList['DomainRecords']['Record'][0]['Value']
                    self.ddns_log('The record ip address is %s' % Value, 'info')
                    if public_ip !=  Value:
                        self.ddns_log('The record ip address does not match the current public ip address', 'INFO')
                        self.ddns_log('The record is updating...', 'info')
                        res = dns.ModifyRecorde(RID, host[i]['rr'], host[i]['type'], public_ip)
                        if res.status_code == 200 :
                            self.ddns_log("The record is updated, RR:%s from %s to %s" % (host[i]['rr'], Value, public_ip), 'info')
                        else:
                            self.ddns_log("Failed to update the record，%s" % res.text)
                    else:
                        self.ddns_log("The record address matches the network address，without updating the record", "info")
            except:
                self.ddns_log('Error，The program is restarting', 'Warning')
            sleep(int(interval) * 60)

if __name__ == '__main__':
    ddns = dynamicdns()
    ddns.main()
    #ddns.start_sf('/Users/albert/python/alidns/conf.ddns')
    #ddns.start_if()
