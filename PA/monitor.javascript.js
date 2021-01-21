Ext.ns('Pan.acc.whois');
Ext.applyIf(Pan.acc.whois, {
    resolveHostnamesInProgress: false,
    resolveLogViewerHostnamesToggle: false,
    ip2hostname: {},
    ip2hostnameLogViewer: {},
    lookup: function (txt) {
        var url;
        var dots = txt.split('.');
        if (dots.length >= 2) {
            if (!dots[dots.length - 1].match(/\d/)) {
                var domainname = dots[dots.length - 2] + '.' + dots[dots.length - 1];
                url = Pan.acc.whois.domainLookupUrlTemplate.apply({domain: domainname});
            }
        }
        if (!url && Pan.base.validation.isIpAddress(txt)) {
            url = Pan.acc.whois.ipaddressLookupUrlTemplate.apply({ip: txt});
        }
        if (url) {
            window.open(url, '_blank');
        }
    },
    resolveLogViewerHostnames: function () {
        if (!Pan.acc.whois.resolveLogViewerHostnamesToggle) return;
        var ele = Ext.DomQuery.select('.resolved-log-address');
        if (ele && ele[0]) {
            ele = ele[0];
            var hostname = (ele.textContent || ele.innerText || ele.innerHTML || '').replace(/\s+/g, '');
            var parent = ele.parentNode;
            var vsys = parent && parent.childNodes && parent.childNodes.length > 0 && parent.childNodes[1];
            if (vsys) {
                vsys = vsys.textContent || vsys.innerText || vsys.innerHTML;
            }
            vsys = vsys || 'shared';
            if (Pan.acc.whois.ip2hostnameLogViewer[vsys] && Pan.acc.whois.ip2hostnameLogViewer[vsys][hostname]) {
                Pan.acc.whois.replaceWithLogViewerHostname(parent, Pan.acc.whois.ip2hostnameLogViewer[vsys][hostname]);
                Pan.acc.whois.resolveLogViewerHostnames();
            }
            else {
                PanDirect.run('PanDirect.resolveIpToObjectNameOrHostname', [hostname, vsys], function (result) {
                    result = result ? result : hostname;
                    if (!Pan.acc.whois.ip2hostnameLogViewer[vsys]) {
                        Pan.acc.whois.ip2hostnameLogViewer[vsys] = {};
                    }
                    Pan.acc.whois.ip2hostnameLogViewer[vsys][hostname] = result;
                    Pan.acc.whois.replaceWithLogViewerHostname(parent, result);
                    Pan.acc.whois.resolveLogViewerHostnames();
                });
            }
        }
    },
    replaceWithLogViewerHostname: function (el, hostname) {
        el = Ext.get(el);
        if (el) {
            el.update('<img src="/js/3rdParty/ext/resources/images/default/grid/wait.gif"/>');
            (function () {
                if (el) {
                    el.update(Pan.acc.whois.hostnameLogViewerRenderer(hostname));
                }
            }).defer(200);
        }
    },
    hostnameLogViewerRenderer: function (hostname) {
        return hostname;
    },
    reportVsysContext: function () {
        if (!Pan.global.isCms() && !Pan.global.isMultiVsys()) {
            return 'vsys1';
        }
        else {
            return Pan.monitor.vsysScope() || 'shared';
        }
    },
    isReportHostnameResolved: function (hostname, vsys) {
        vsys = vsys || Pan.acc.whois.reportVsysContext();
        if (Pan.acc.whois.ip2hostnameLogViewer[vsys] && Pan.acc.whois.ip2hostnameLogViewer[vsys][hostname]) {
            return Pan.acc.whois.ip2hostnameLogViewer[vsys][hostname];
        }
        return false;
    },
    resolveHostnames: function (useHostnameAsHint) {
        if (Pan.acc.whois.resolveHostnamesInProgress) {
            return;
        }
        var ele = Ext.DomQuery.select('.resolved-address');
        if (ele && ele[0]) {
            ele = ele[0];
            var hostname = (ele.textContent || ele.innerText || ele.innerHTML || '').replace(/\s+/g, '');
            var parent = ele.parentNode;
            var vsys = Pan.acc.whois.reportVsysContext();
            var resolved = Pan.acc.whois.isReportHostnameResolved(hostname, vsys);
            if (resolved) {
                Pan.acc.whois.replaceWithHostname(parent, resolved, useHostnameAsHint ? hostname : undefined);
                Pan.acc.whois.resolveHostnames(useHostnameAsHint);
            }
            else {
                Pan.acc.whois.resolveHostnamesInProgress = true;
                PanDirect.run('PanDirect.resolveIpToObjectNameOrHostname', [hostname, vsys], function (result) {
                    Pan.acc.whois.resolveHostnamesInProgress = false;
                    result = result ? result : hostname;
                    if (!Pan.acc.whois.ip2hostnameLogViewer[vsys]) {
                        Pan.acc.whois.ip2hostnameLogViewer[vsys] = {};
                    }
                    Pan.acc.whois.ip2hostnameLogViewer[vsys][hostname] = result;
                    Pan.acc.whois.replaceWithHostname(parent, result, useHostnameAsHint ? hostname : undefined);
                    Pan.acc.whois.resolveHostnames(useHostnameAsHint);
                });
            }
        }
    },
    replaceWithHostname: function (el, resolved, ip) {
        el = Ext.get(el);
        if (el) {
            el.update(Pan.acc.whois.hostnameRenderer(resolved, ip));
        }
    },
    hostnameRenderer: function (hostname, ip) {
        if (!ip) {
            return String.format("{3}<img onclick='{0}' src='{1}' title='{2}' border='0'/>", String.format('Pan.acc.whois.lookup({0})', Ext.encode(hostname)), '/images/external_link.png', _T('external whois lookup'), hostname);
        }
        return String.format('<em ext:qtip="{1}" class="x-hyperlink" style="white-space: nowrap;">{0}</em>', hostname, ip);
    },
    rewriteJsonResolvedAddress: function (response) {
        if (Ext.isObject(response)) {
            for (var n in response) {
                if (response.hasOwnProperty(n)) {
                    if (n == 'resolved-src' || n == 'resolved-dst') {
                        var ip = response[n];
                        var vsys = response['vsys'];
                        var resolved;
                        if (!vsys) {
                            resolved = (Pan.acc.whois.ip2hostnameLogViewer['shared'] && Pan.acc.whois.ip2hostnameLogViewer['shared'][ip]) || (Pan.acc.whois.ip2hostnameLogViewer['vsys1'] && Pan.acc.whois.ip2hostnameLogViewer['vsys1'][ip]);
                        }
                        else {
                            resolved = Pan.acc.whois.ip2hostnameLogViewer[vsys] && Pan.acc.whois.ip2hostnameLogViewer[vsys][ip];
                        }
                        if (resolved) {
                            response[n] = resolved;
                        }
                    }
                    else {
                        Pan.acc.whois.rewriteJsonResolvedAddress(response[n]);
                    }
                }
            }
        }
        else if (Ext.isArray(response)) {
            var i, l = response.length;
            for (i = 0; i < l; i++) {
                Pan.acc.whois.rewriteJsonResolvedAddress(response[i]);
            }
        }
    }
});
Ext.ns('Pan.acc.threatNameResolve');
Ext.applyIf(Pan.acc.threatNameResolve, {
    resolveLogViewerThreatNamesInProgress: false,
    resolveThreatNamesInProgress: false,
    id2threatName: {},
    id2threatNameLogViewer: {},
    id2threatNameAppScope: {},
    threatNameRenderer: function (threatName, tid, noFormat) {
        if (noFormat) {
            return threatName;
        }
        return String.format('<em ext:qtip="{1}" class="x-hyperlink" style="white-space: nowrap;">{0}</em>', threatName, tid);
    },
    isReportThreatNameResolved: function (threatName) {
        if (isNaN(threatName)) {
            return threatName;
        }
        if (Pan.acc.threatNameResolve.id2threatNameLogViewer[threatName]) {
            return Pan.acc.threatNameResolve.id2threatNameLogViewer[threatName];
        }
        return false;
    },
    resolveThreatNames: function (useThreatNameAsHint) {
        if (Pan.acc.threatNameResolve.resolveThreatNamesInProgress) {
            return;
        }
        var ele = Ext.DomQuery.select('.resolved-threat-id');
        if (ele && ele[0]) {
            ele = ele[0];
            var threatName = (ele.textContent || ele.innerText || ele.innerHTML || '').replace(/\s+/g, '');
            var parent = ele.parentNode;
            var resolved = Pan.acc.threatNameResolve.isReportThreatNameResolved(threatName);
            if (resolved) {
                Pan.acc.threatNameResolve.replaceWithThreatName(parent, resolved, useThreatNameAsHint ? threatName : undefined);
                Pan.acc.threatNameResolve.resolveThreatNames(useThreatNameAsHint);
            }
            else {
                Pan.acc.threatNameResolve.resolveThreatNamesInProgress = true;
                PanDirect.run('PanDirect.resolveTidToThreatName', [threatName], function (result) {
                    Pan.acc.threatNameResolve.resolveThreatNamesInProgress = false;
                    result = result ? result : threatName;
                    Pan.acc.threatNameResolve.id2threatNameLogViewer[threatName] = result;
                    Pan.acc.threatNameResolve.replaceWithThreatName(parent, result, useThreatNameAsHint ? threatName : undefined);
                    Pan.acc.threatNameResolve.resolveThreatNames(useThreatNameAsHint);
                });
            }
        }
    },
    resolveThreatNamesBulk: function (useThreatNameAsHint, noFormat) {
        if (Pan.acc.threatNameResolve.resolveThreatNamesInProgress) {
            return;
        }
        var i, threatName, threatElement;
        var ele = Ext.DomQuery.select('.resolved-threat-id');
        threatName = "";
        if (Ext.isArray(ele)) {
            for (i = 0; i < ele.length; i++) {
                threatElement = ele[i];
                threatName += (threatElement.textContent || threatElement.innerText || threatElement.innerHTML || '').replace(/\s+/g, '') + (i < ele.length - 1 ? "," : "");
            }
            Pan.acc.threatNameResolve.resolveThreatNamesInProgress = true;
            PanDirect.run('PanDirect.resolveTidToThreatName', [threatName], function (result) {
                Pan.acc.threatNameResolve.resolveThreatNamesInProgress = false;
                if (Ext.isString(result)) {
                    result = result ? result : threatName;
                    Pan.acc.threatNameResolve.id2threatNameLogViewer[threatName] = result;
                }
                else if (result["result"] && Ext.isArray(result["result"]["entry"])) {
                    var entries = result["result"]["entry"];
                    for (i = 0; i < entries.length; i++) {
                        if (entries[i]["@name"] !== "Unknown") {
                            Pan.acc.threatNameResolve.id2threatNameLogViewer[entries[i]["@id"]] = entries[i]["@name"];
                        }
                    }
                }
                for (i = 0; i < ele.length; i++) {
                    threatElement = ele[i];
                    threatName = (threatElement.textContent || threatElement.innerText || threatElement.innerHTML || '').replace(/\s+/g, '');
                    var parent = threatElement.parentNode;
                    if (Pan.acc.threatNameResolve.id2threatNameLogViewer[threatName]) {
                        Pan.acc.threatNameResolve.replaceWithThreatName(parent, Pan.acc.threatNameResolve.id2threatNameLogViewer[threatName], undefined, noFormat);
                    }
                }
            });
        }
    },
    resolveLogViewerThreatNamesBulk: function () {
        if (Pan.acc.threatNameResolve.resolveLogViewerThreatNamesInProgress) return;
        var i, threatName, threatElement;
        var ele = Ext.DomQuery.select('.resolved-log-tid');
        threatName = "";
        if (Ext.isArray(ele)) {
            for (i = 0; i < ele.length; i++) {
                threatElement = ele[i];
                threatName += (threatElement.textContent || threatElement.innerText || threatElement.innerHTML || '').replace(/\s+/g, '') + (i < ele.length - 1 ? "," : "");
            }
            Pan.acc.threatNameResolve.resolveLogViewerThreatNamesInProgress = true;
            PanDirect.run('PanDirect.resolveTidToThreatName', [threatName], function (result) {
                Pan.acc.threatNameResolve.resolveLogViewerThreatNamesInProgress = false;
                if (Ext.isString(result)) {
                    result = result ? result : threatName;
                    Pan.acc.threatNameResolve.id2threatNameLogViewer[threatName] = result;
                }
                else if (result["result"] && Ext.isArray(result["result"]["entry"])) {
                    var entries = result["result"]["entry"];
                    for (i = 0; i < entries.length; i++) {
                        if (entries[i]["@name"] !== "Unknown") {
                            Pan.acc.threatNameResolve.id2threatNameLogViewer[entries[i]["@id"]] = entries[i]["@name"];
                        }
                    }
                }
                for (i = 0; i < ele.length; i++) {
                    threatElement = ele[i];
                    threatName = (threatElement.textContent || threatElement.innerText || threatElement.innerHTML || '').replace(/\s+/g, '');
                    var parent = threatElement.parentNode;
                    if (Pan.acc.threatNameResolve.id2threatNameLogViewer[threatName]) {
                        Pan.acc.threatNameResolve.replaceWithLogViewerThreatName(parent, Pan.acc.threatNameResolve.id2threatNameLogViewer[threatName]);
                    }
                }
            });
        }
    },
    resolveLogViewerThreatNames: function () {
        if (Pan.acc.threatNameResolve.resolveLogViewerThreatNamesInProgress) return;
        var ele = Ext.DomQuery.select('.resolved-log-tid');
        if (ele && ele[0]) {
            ele = ele[0];
            var threatName = (ele.textContent || ele.innerText || ele.innerHTML || '').replace(/\s+/g, '');
            var parent = ele.parentNode;
            if (Pan.acc.threatNameResolve.id2threatNameLogViewer[threatName]) {
                Pan.acc.threatNameResolve.replaceWithLogViewerThreatName(parent, Pan.acc.threatNameResolve.id2threatNameLogViewer[threatName]);
                Pan.acc.threatNameResolve.resolveLogViewerThreatNames();
            }
            else {
                Pan.acc.threatNameResolve.resolveLogViewerThreatNamesInProgress = true;
                PanDirect.run('PanDirect.resolveTidToThreatName', [threatName], function (result) {
                    Pan.acc.threatNameResolve.resolveLogViewerThreatNamesInProgress = false;
                    result = result ? result : threatName;
                    if (isNaN(result)) {
                        Pan.acc.threatNameResolve.id2threatNameLogViewer[threatName] = result;
                    }
                    Pan.acc.threatNameResolve.replaceWithLogViewerThreatName(parent, result);
                    Pan.acc.threatNameResolve.resolveLogViewerThreatNames();
                });
            }
        }
    },
    replaceWithLogViewerThreatName: function (el, threatName) {
        el = Ext.get(el);
        if (el) {
            el.update('<img src="/js/3rdParty/ext/resources/images/default/grid/wait.gif"/>');
            (function () {
                if (el) {
                    el.update(Pan.acc.threatNameResolve.threatNameLogViewerRenderer(threatName));
                }
            }).defer(200);
        }
    },
    replaceWithThreatName: function (el, resolved, tid, noFormat) {
        el = Ext.get(el);
        if (el) {
            el.update(Pan.acc.threatNameResolve.threatNameRenderer(resolved, tid, noFormat));
        }
    },
    threatNameLogViewerRenderer: function (threatName) {
        return threatName;
    }
});
Ext.ns('Pan.monitor.common');
Pan.monitor.common.LogTypes = {
    authEventEnum: {
        "0": "Authentication Success",
        "1": "Authentication Failure",
        "2": "User Password Failure",
        "3": "User is Locked",
        "4": "User not allowed",
        "5": "Invalid Certificate",
        "6": "Password Expired",
        "7": "Kerberos Single Sign-On Failed",
        "8": "SAML Single Sign-On Failed",
        "9": "MFA Failed",
        "10": "Authentication Timeout"
    },
    fieldsMaps: {
        'unified': {'filename': _T('File Name'), 'url': _T("URL")},
        'evidence': {'misc': _T("File Digest"), 'url': _T("URL"), 'filedigest': _T("File Digest"), 'ip': _T("IP")},
        'common': {
            'captive-portal': _T('Captive Portal'),
            'transaction': _T('Proxy Transaction'),
            'flag-proxy': _T('Decrypted'),
            'flag-pcap': _T('Packet Capture'),
            'flag-recon-excluded': _T('Recon excluded'),
            'flag-decrypt-forwarded': _T('Decrypt Forwarded'),
            'direction': _T('Dummy Direction'),
            'client-to-server': _T('Client to Server'),
            'server-to-client': _T('Server to Client'),
            "dstuser": _T('User'),
            "dst": _T('Destination'),
            "dstloc": _T("Country"),
            "dport": _T('Port'),
            "to": _T('Zone'),
            "outbound_if": _T('Interface'),
            "natdst": _T('NAT IP'),
            "natdport": _T('NAT Port'),
            "srcuser": _T('User'),
            "src": _T('Source'),
            "srcloc": _T("Country"),
            "sport": _T('Port'),
            "from": _T('Zone'),
            "inbound_if": _T('Interface'),
            "natsrc": _T('NAT IP'),
            "natsport": _T('NAT Port'),
            "user_agent": _T('User-Agent'),
            "referer": _T('Referer'),
            "xff": _T("X-Forwarded-For"),
            "loglinks": ' '
        },
        'data': {
            'sessionid': _T('Session ID'),
            'action': _T('Action'),
            'app': _T('Application'),
            'rule': _T('Rule'),
            'vsys': _T('Virtual System'),
            'serial': _T('Device SN'),
            'proto': _T('IP Protocol'),
            'logset': _T('Log Action'),
            'category': _T('Category'),
            'time_generated': _T('Generated Time'),
            'receive_time': _T('Receive Time'),
            'parent_session_id': _T('Parent Session ID'),
            'parent_start_time': _T('Parent Start Time'),
            'monitortag': _T('Monitor Tag'),
            'subtype': _T('Content Type'),
            'threatid': _T('Content'),
            'tid': _T('ID'),
            'severity': _T('Severity'),
            'repeatcnt': _T('Repeat Count'),
            'misc': _T('URL/Filename'),
            'url': _T('URL'),
            'filename': _T('File Name'),
            'captive-portal': _T('Captive Portal'),
            'transaction': _T('Proxy Transaction'),
            'flag-proxy': _T('Decrypted'),
            'flag-pcap': _T('Packet Capture'),
            'direction': _T('Dummy Direction'),
            'client-to-server': _T('Client to Server'),
            'server-to-client': _T('Server to Client'),
            'flag-tunnel-inspected': _T('Tunnel Inspected'),
            "dstuser": _T('Destination User'),
            "dst": _T('Destination'),
            "dstloc": _T("Country"),
            "dport": _T('Port'),
            "to": _T('Zone'),
            "outbound_if": _T('Interface'),
            "natdst": _T('NAT IP'),
            "natdport": _T('NAT Port'),
            "srcuser": _T('Source User'),
            "src": _T('Source'),
            "srcloc": _T("Country"),
            "sport": _T('Port'),
            "from": _T('Zone'),
            "inbound_if": _T('Interface'),
            "natsrc": _T('NAT IP'),
            "natsport": _T('NAT Port'),
            "sender": _T('Sender Address'),
            "recipient": _T("Recipient Address"),
            "subject": _T("Subject"),
            "loglinks": ' ',
            "view_parent_link": _T('View Parent Session'),
            'imsi': _T('IMSI'),
            'imei': _T('IMEI'),
            'tunnelid': _T('Tunnel ID'),
            'tunnel': _T('Tunnel Type')
        },
        'threat': {
            'sessionid': _T('Session ID'),
            'action': _T('Action'),
            'app': _T('Application'),
            'rule': _T('Rule'),
            'vsys': _T('Virtual System'),
            'serial': _T('Device SN'),
            'proto': _T('IP Protocol'),
            'logset': _T('Log Action'),
            'time_generated': _T('Generated Time'),
            'receive_time': _T('Receive Time'),
            'parent_session_id': _T('Parent Session ID'),
            'parent_start_time': _T('Parent Start Time'),
            'monitortag': _T('Monitor Tag'),
            'subtype': _T('Threat Type'),
            'threatid': _T('Threat Name'),
            'tid': _T('ID'),
            'thr_category': _T('Category'),
            'severity': _T('Severity'),
            'repeatcnt': _T('Repeat Count'),
            'misc': _T('URL/Filename'),
            'url': _T('URL'),
            'filename': _T('File Name'),
            'pcap_id': _T('Pcap ID'),
            'captive-portal': _T('Captive Portal'),
            'transaction': _T('Proxy Transaction'),
            'flag-proxy': _T('Decrypted'),
            'flag-pcap': _T('Packet Capture'),
            'direction': _T('Dummy Direction'),
            'client-to-server': _T('Client to Server'),
            'server-to-client': _T('Server to Client'),
            'flag-tunnel-inspected': _T('Tunnel Inspected'),
            "dstuser": _T('Destination User'),
            "dst": _T('Destination'),
            "dstloc": _T("Country"),
            "dport": _T('Port'),
            "to": _T('Zone'),
            "outbound_if": _T('Interface'),
            "natdst": _T('NAT IP'),
            "natdport": _T('NAT Port'),
            "srcuser": _T("Source User"),
            "src": _T("Source"),
            "srcloc": _T("Country"),
            "sport": _T('Port'),
            "from": _T('Zone'),
            "inbound_if": _T('Interface'),
            "natsrc": _T('NAT IP'),
            "natsport": _T('NAT Port'),
            "user_agent": _T('User-Agent'),
            "referer": _T('Referer'),
            "xff": _T("X-Forwarded-For"),
            "sender": _T('Sender Address'),
            "recipient": _T("Recipient Address"),
            "subject": _T("Subject"),
            "loglinks": ' ',
            "src_uuid": _T('Source UUID'),
            "dst_uuid": _T("Destination UUID"),
            "view_parent_link": _T('View Parent Session'),
            'imsi': _T('IMSI'),
            'imei': _T('IMEI'),
            'tunnelid': _T('Tunnel ID'),
            'tunnel': _T('Tunnel Type'),
            'contentver': _T('Content Version')
        },
        'url': {
            'sessionid': _T('Session ID'),
            'action': _T('Action'),
            'app': _T('Application'),
            'rule': _T('Rule'),
            'vsys': _T('Virtual System'),
            'serial': _T('Device SN'),
            'proto': _T('IP Protocol'),
            'logset': _T('Log Action'),
            'category': _T('Category'),
            'time_generated': _T('Generated Time'),
            'receive_time': _T('Receive Time'),
            'parent_session_id': _T('Parent Session ID'),
            'parent_start_time': _T('Parent Start Time'),
            'monitortag': _T('Monitor Tag'),
            'severity': _T('Severity'),
            'repeatcnt': _T('Repeat Count'),
            'misc': _T('URL'),
            'url': _T('URL'),
            'catlink': _T('Action'),
            'http_method': _T('HTTP Method'),
            'http_headers': _T('Headers Inserted'),
            'captive-portal': _T('Captive Portal'),
            'transaction': _T('Proxy Transaction'),
            'flag-proxy': _T('Decrypted'),
            'flag-pcap': _T('Packet Capture'),
            'direction': _T('Dummy Direction'),
            'client-to-server': _T('Client to Server'),
            'server-to-client': _T('Server to Client'),
            'flag-tunnel-inspected': _T('Tunnel Inspected'),
            'credential-detected': _T('Credential Detected'),
            "dstuser": _T('Destination User'),
            "dst": _T('Destination'),
            "dstloc": _T("Country"),
            "dport": _T('Port'),
            "to": _T('Zone'),
            "outbound_if": _T('Interface'),
            "natdst": _T('NAT IP'),
            "natdport": _T('NAT Port'),
            "srcuser": _T('Source User'),
            "src": _T('Source'),
            "srcloc": _T("Country"),
            "sport": _T('Port'),
            "from": _T('Zone'),
            "inbound_if": _T('Interface'),
            "natsrc": _T('NAT IP'),
            "natsport": _T('NAT Port'),
            "user_agent": _T('User-Agent'),
            "referer": _T('Referrer'),
            "xff": _T("X-Forwarded-For"),
            "loglinks": ' ',
            "view_parent_link": _T('View Parent Session'),
            'imsi': _T('IMSI'),
            'imei': _T('IMEI'),
            'tunnelid': _T('Tunnel ID'),
            'tunnel': _T('Tunnel Type')
        },
        'traffic': {
            'sessionid': _T('Session ID'),
            'action': _T('Action'),
            'action_source': _T('Action Source'),
            'app': _T('Application'),
            'rule': _T('Rule'),
            'category': _T('Category'),
            'session_end_reason': _T('Session End Reason'),
            'vsys': _T('Virtual System'),
            'serial': _T('Device SN'),
            'proto': _T('IP Protocol'),
            'logset': _T('Log Action'),
            'time_generated': _T('Generated Time'),
            'start': _T('Start Time'),
            'receive_time': _T('Receive Time'),
            'elapsed': _T('Elapsed Time(sec)'),
            'assoc_id': _T('Association ID'),
            'parent_session_id': _T('Parent Session ID'),
            'parent_start_time': _T('Parent Start Time'),
            'monitortag': _T('Monitor Tag'),
            'subtype': _T('Type'),
            'bytes': _T('Bytes'),
            'bytes_received': _T('Bytes Received'),
            'bytes_sent': _T('Bytes Sent'),
            'repeatcnt': _T('Repeat Count'),
            'packets': _T('Packets'),
            'pkts_received': _T('Packets Received'),
            'pkts_sent': _T('Packets Sent'),
            'chunks': _T('Chunks'),
            'chunks_received': _T('Chunks Received'),
            'chunks_sent': _T('Chunks Sent'),
            'captive-portal': _T('Captive Portal'),
            'transaction': _T('Proxy Transaction'),
            'flag-proxy': _T('Decrypted'),
            'flag-decrypt-forwarded': _T('Decrypt Forwarded'),
            'flag-pcap': _T('Packet Capture'),
            'pbf-c2s': _T('Client to Server'),
            'pbf-s2c': _T('Server to Client'),
            'sym-return': _T('Symmetric Return'),
            'decrypt-mirror': _T('Mirrored'),
            'flag-tunnel-inspected': _T('Tunnel Inspected'),
            'flag-mptcp-set': _T('MPTCP Options'),
            'flag-recon-excluded': _T('Recon excluded'),
            "dstuser": _T('Destination User'),
            "dst": _T('Destination'),
            "dstloc": _T("Country"),
            "dport": _T('Port'),
            "to": _T('Zone'),
            "outbound_if": _T('Interface'),
            "natdst": _T('NAT IP'),
            "natdport": _T('NAT Port'),
            "srcuser": _T('Source User'),
            "src": _T('Source'),
            "srcloc": _T("Country"),
            "sport": _T('Port'),
            "from": _T('Zone'),
            "inbound_if": _T('Interface'),
            "natsrc": _T('NAT IP'),
            "natsport": _T('NAT Port'),
            "loglinks": ' ',
            "src_uuid": _T('Source UUID'),
            "dst_uuid": _T("Destination UUID"),
            "view_parent_link": _T('View Parent Session'),
            'imsi': _T('IMSI'),
            'imei': _T('IMEI'),
            'tunnelid': _T('Tunnel ID'),
            'tunnel': _T('Tunnel Type')
        },
        'wildfire': {
            'sessionid': _T('Session ID'),
            'action': _T('Action'),
            'app': _T('Application'),
            'rule': _T('Rule'),
            'vsys': _T('Virtual System'),
            'serial': _T('Device SN'),
            'proto': _T('IP Protocol'),
            'logset': _T('Log Action'),
            'time_generated': _T('Generated Time'),
            'receive_time': _T('Receive Time'),
            'subtype': _T('Threat/Content Type'),
            'parent_session_id': _T('Parent Session ID'),
            'parent_start_time': _T('Parent Start Time'),
            'monitortag': _T('Monitor Tag'),
            'reportid': _T('ID'),
            'tid': _T('Threat ID'),
            'severity': _T('Severity'),
            'repeatcnt': _T('Repeat Count'),
            'misc': _T('URL/FileName'),
            'url': _T('URL'),
            'filename': _T('File Name'),
            'verdict': _T('Verdict'),
            'captive-portal': _T('Captive Portal'),
            'transaction': _T('Proxy Transaction'),
            'flag-proxy': _T('Decrypted'),
            'flag-pcap': _T('Packet Capture'),
            'flag-url-denied': _T('URL Denied'),
            'direction': _T('Dummy Direction'),
            'client-to-server': _T('Client to Server'),
            'server-to-client': _T('Server to Client'),
            'flag-tunnel-inspected': _T('Tunnel Inspected'),
            "dstuser": _T('Destination User'),
            "dst": _T('Destination'),
            "dport": _T('Port'),
            "to": _T('Zone'),
            "outbound_if": _T('Interface'),
            "natdst": _T('NAT IP'),
            "natdport": _T('NAT Port'),
            "srcuser": _T("Source User"),
            "src": _T("Source"),
            "sport": _T('Port'),
            "from": _T('Zone'),
            "inbound_if": _T('Interface'),
            "natsrc": _T('NAT IP'),
            "natsport": _T('NAT Port'),
            "user_agent": _T('User-Agent'),
            "referer": _T('Referrer'),
            "xff": _T("X-Forwarded-For"),
            "sender": _T('Sender Address'),
            "recipient": _T("Recipient Address"),
            "subject": _T("Subject"),
            "recipient-userid": _T("Recipient User-ID"),
            "filetype": _T("File Type"),
            "loglinks": ' ',
            "view_parent_link": _T('View Parent Session'),
            'imsi': _T('IMSI'),
            'imei': _T('IMEI'),
            'tunnelid': _T('Tunnel ID'),
            'tunnel': _T('Tunnel Type')
        },
        'corr': {
            "version": _T('Version'),
            "objectid": _T('Object ID'),
            "match_oid": _T('Match OID'),
            "serial": _T('Serial'),
            "match_time": _T('Match Time'),
            "last_update_time": _T('Last Update Time'),
            "objectname": _T('Object Name'),
            "severity": _T('Severity'),
            "summary": _T('Summary'),
            "@name": _T('Name'),
            "@id": _T('ID'),
            "description": _T('Title'),
            "category": _T("Category"),
            "state": _T("State"),
            "detailed-description": _T('Detailed Description')
        },
        'gtp': {
            'sessionid': _T('Session ID'),
            'action': _T('Action'),
            'action_source': _T('Action Source'),
            'app': _T('Application'),
            'rule': _T('Rule'),
            'category': _T('Category'),
            'session_end_reason': _T('Session End Reason'),
            'vsys': _T('Virtual System'),
            'serial': _T('Device SN'),
            'proto': _T('IP Protocol'),
            'logset': _T('Log Action'),
            'time_generated': _T('Generated Time'),
            'start': _T('Start Time'),
            'receive_time': _T('Receive Time'),
            'elapsed': _T('Elapsed Time(sec)'),
            'event_type': _T('GTP Event Type'),
            'msg_type': _T('GTP Message Type'),
            'imsi': _T('IMSI'),
            'imei': _T('IMEI'),
            'end_ip_addr': _T('End User IP Address'),
            'cause_code': _T('GTP Cause'),
            'event_code': _T('GTP Event Code'),
            'apn': _T('APN'),
            'msisdn': _T('MSISDN'),
            'rat': _T('RAT'),
            'teid1': _T('TEID1'),
            'teid2': _T('TEID2'),
            'mcc': _T('Serving Network MCC'),
            'mnc': _T('Serving Network MNC'),
            'area_code': _T('Area Code'),
            'cell_id': _T('Cell ID'),
            'parent_session_id': _T('Parent Session ID'),
            'gtp_interface': _T('GTP Interface'),
            "dst": _T('Destination'),
            "dstloc": _T("Country"),
            "dport": _T('Port'),
            "to": _T('Zone'),
            "outbound_if": _T('Interface'),
            "natdst": _T('NAT IP'),
            "natdport": _T('NAT Port'),
            "src": _T('Source'),
            "srcloc": _T("Country"),
            "sport": _T('Port'),
            "from": _T('Zone'),
            "inbound_if": _T('Interface'),
            "natsrc": _T('NAT IP'),
            "natsport": _T('NAT Port'),
            "severity": _T('Severity'),
            "tunnel": _T('Tunnel Type'),
            "loglinks": ' '
        },
        'tunnel': {
            'subtype': _T('Type'),
            'tunnelid': _T('Tunnel ID'),
            'tunnel': _T('Tunnel Type'),
            'monitortag': _T('Monitor Tag'),
            'sessionid': _T('Session ID'),
            'action': _T('Action'),
            'action_source': _T('Action Source'),
            'app': _T('Application'),
            'rule': _T('Security Rule'),
            'session_end_reason': _T('Session End Reason'),
            'vsys': _T('Virtual System'),
            'serial': _T('Device SN'),
            'proto': _T('IP Protocol'),
            'logset': _T('Log Action'),
            'time_generated': _T('Generated Time'),
            'start': _T('Start Time'),
            'receive_time': _T('Receive Time'),
            'elapsed': _T('Elapsed Time(sec)'),
            'bytes': _T('Bytes'),
            'bytes_received': _T('Bytes Received'),
            'bytes_sent': _T('Bytes Sent'),
            'repeatcnt': _T('Repeat Count'),
            'packets': _T('Packets'),
            'pkts_received': _T('Packets Received'),
            'pkts_sent': _T('Packets Sent'),
            'max_encap': _T('Max. Encap (pkts)'),
            'unknown_proto': _T('Unknown Protocol (pkts)'),
            'strict_check': _T('Strict Checking (pkts)'),
            'tunnel_fragment': _T('Tunnel Fragment (pkts)'),
            'sessions_created': _T('Sessions Created'),
            'sessions_closed': _T('Sessions Closed'),
            'parent_session_id': _T('Parent Session ID'),
            'parent_start_time': _T('Parent Start Time'),
            'view_parent_tunnel_link': _T('View Parent Tunnel'),
            "dstuser": _T('Destination User'),
            "dst": _T('Destination'),
            "dstloc": _T("Country"),
            "dport": _T('Port'),
            "to": _T('Zone'),
            "outbound_if": _T('Interface'),
            "natdst": _T('NAT IP'),
            "natdport": _T('NAT Port'),
            "srcuser": _T('Source User'),
            "src": _T('Source'),
            "srcloc": _T("Country"),
            "sport": _T('Port'),
            "from": _T('Zone'),
            "inbound_if": _T('Interface'),
            "natsrc": _T('NAT IP'),
            "natsport": _T('NAT Port'),
            "loglinks": ' ',
            'captive-portal': _T('Captive Portal'),
            'transaction': _T('Proxy Transaction'),
            'flag-proxy': _T('Decrypted'),
            'flag-pcap': _T('Packet Capture'),
            'direction': _T('Dummy Direction'),
            'client-to-server': _T('Client to Server'),
            'server-to-client': _T('Server to Client'),
            'flag-tunnel-inspected': _T('Tunnel Inspected'),
            'credential-detected': _T('Credential Detected'),
            'pbf-c2s': _T('Client to Server'),
            'pbf-s2c': _T('Server to Client'),
            'sym-return': _T('Symmetric Return'),
            'decrypt-mirror': _T('Mirrored'),
            'flag-mptcp-set': _T('MPTCP Options'),
            'flag-recon-excluded': _T('Recon excluded'),
            'tunnel_insp_rule': _T('Tunnel Inspection Rule')
        },
        'sctp': {
            'sessionid': _T('Session ID'),
            'action': _T('Action'),
            'ppid': _T('PPID'),
            'rule': _T('Rule'),
            'sctp_filter': _T('Filter Name'),
            'assoc_end_reason': _T('Association End Reason'),
            'vsys': _T('Virtual System'),
            'serial': _T('Device SN'),
            'proto': _T('IP Protocol'),
            'logset': _T('Log Action'),
            'time_generated': _T('Generated Time'),
            'receive_time': _T('Receive Time'),
            'chunks': _T('Chunks'),
            'chunks_received': _T('Chunks Received'),
            'chunks_sent': _T('Chunks Sent'),
            'packets': _T('Packets'),
            'pkts_received': _T('Packets Received'),
            'pkts_sent': _T('Packets Sent'),
            'sctp_event_type': _T('SCTP Event Type'),
            'sctp_event_code': _T('SCTP Event Code'),
            'sctp_chunk_type': _T('Chunk Type'),
            'verif_tag_1': _T('Verification Tag 1'),
            'verif_tag_2': _T('Verification Tag 2'),
            'assoc_id': _T('Association ID'),
            'stream_id': _T('Stream ID'),
            'diam_app_id': _T('Diameter Application ID'),
            'diam_cmd_code': _T('Diameter Command Code'),
            'diam_avp_code': _T('Diameter AVP Code'),
            'sccp_calling_ssn': _T('SCCP Calling Party SSN'),
            'sccp_calling_gt': _T('SCCP Calling Party GT'),
            'op_code': _T('Operation Code'),
            "severity": _T('Severity'),
            'sctp_cause_code': _T('SCTP Cause Code'),
            "dst": _T('Destination'),
            "dstloc": _T("Country"),
            "dport": _T('Port'),
            "to": _T('Zone'),
            "outbound_if": _T('Interface'),
            "src": _T('Source'),
            "srcloc": _T("Country"),
            "sport": _T('Port'),
            "from": _T('Zone'),
            "inbound_if": _T('Interface'),
            "loglinks": ' '
        },
        'auth': {
            'domain': _T('Domain'),
            'user': _T('User'),
            'ip': _T('IP Address'),
            'clienttype': _T('Client Type'),
            'subtype': _T('Client Subtype'),
            'authpolicy': _T('Rule'),
            "event": _T("Event"),
            "authid": _T("Authentication ID"),
            "vendor": _T('Vendor'),
            "factorno": _T('Factor Number'),
            'time_generated': _T('Generated Time'),
            'receive_time': _T('Receive Time'),
            'object': _T('Object'),
            'serverprofile': _T('Server Profile'),
            'desc': _T('Description'),
            'device_name': _T('Device Name')
        },
        "panflex/traps_esm/threat": {
            'filename': _T('File Name'),
            'product': _T('Product'),
            'serial': _T('Serial'),
            'time_generated': _T('Generated Time'),
            'receive_time': _T('Receive Time'),
            'eventid': _T('Event ID'),
            'machinename': _T('Source Host'),
            'srcuser': _T('Source User'),
            'hash': _T('Hash'),
            'module': _T('Module'),
            'severity': _T('Severity'),
            'event_time': _T('Event Time'),
            'version': _T('Version')
        },
        "panflex/traps_esm/policy2": {
            'serial': _T('Serial'),
            'event_time': _T('Event Time'),
            'time_generated': _T('Generated Time'),
            'receive_time': _T('Receive Time'),
            'eventid': _T('Event ID'),
            'machinename': _T('Source Host'),
            'product': _T('Product'),
            'srcuser': _T('Source User'),
            'description': _T('Description'),
            'hash': _T('Hash'),
            'rule': _T('Rule'),
            'severity': _T('Severity'),
            'version': _T('Version')
        },
        "panflex/traps_esm/system": {
            'event_time': _T('Event Time'),
            'time_generated': _T('Generated Time'),
            'receive_time': _T('Receive Time'),
            'eventid': _T('Event ID'),
            'machinename': _T('Source Host'),
            'product': _T('Product'),
            'srcuser': _T('Source User'),
            'description': _T('Description'),
            'dstmachine': _T('Destination Host'),
            'dstuser': _T('Destination User'),
            'severity': _T('Severity'),
            'filename': _T('File Name'),
            'version': _T('Version')
        }
    },
    fieldsOrder: {
        "panflex/traps_esm/threat": {
            General: ['product', 'description', 'serial', 'eventid', 'event_time', 'time_generated', 'receive_time'],
            User: ['machinename', 'srcuser'],
            Detail: ['version', 'filename', 'module', 'hash', 'severity']
        },
        "panflex/traps_esm/policy2": {
            General: ['product', 'description', 'serial', 'eventid', 'event_time', 'time_generated', 'receive_time'],
            User: ['machinename', 'srcuser'],
            Detail: ['version', 'rule', 'hash', 'severity']
        },
        "panflex/traps_esm/system": {
            General: ['product', 'description', 'serial', 'eventid', 'event_time', 'time_generated', 'receive_time'],
            User: ['machinename', 'srcuser', 'dstmachine', 'dstuser'],
            Detail: ['version', 'filename', 'severity']
        },
        'auth': {
            General: ['authid', 'event', 'factorno', 'device_name', 'time_generated', 'receive_time'],
            User: ['user', 'ip', 'clienttype', 'subtype'],
            Details: ['desc', 'serverprofile', 'authpolicy', 'vendor', 'domain']
        },
        'threat': {
            General: ['sessionid', 'action', 'app', 'rule', 'vsys', 'serial', 'proto', 'logset', 'time_generated', 'receive_time', 'tunnel', 'parent_session_id', 'parent_start_time', 'view_parent_link', 'monitortag', 'tunnelid', 'imei', 'imsi'],
            Source: ["srcuser", "src", "srcloc", "sport", "from", "inbound_if", "natsrc", "natsport"],
            Destination: ["dstuser", "dst", "dstloc", "dport", "to", "outbound_if", "natdst", "natdport"],
            Details: ['subtype', 'threatid', 'tid', 'thr_category', 'contentver', 'severity', 'repeatcnt', 'filename', 'url', 'pcap_id', 'src_uuid', 'dst_uuid'],
            Flags: ["captive-portal", "transaction", "flag-proxy", "flag-pcap", "direction", "client-to-server", "server-to-client", "flag-tunnel-inspected"],
            "Email Headers": ['sender', 'recipient', 'subject'],
            "Log Links": ["loglinks"]
        },
        'data': {
            General: ['sessionid', 'action', 'app', 'rule', 'vsys', 'serial', 'proto', 'logset', 'category', 'time_generated', 'receive_time', 'tunnel', 'parent_session_id', 'parent_start_time', 'view_parent_link', 'monitortag', 'tunnelid', 'imei', 'imsi'],
            Source: ["srcuser", "src", "srcloc", "sport", "from", "inbound_if", "natsrc", "natsport"],
            Destination: ["dstuser", "dst", "dstloc", "dport", "to", "outbound_if", "natdst", "natdport"],
            Details: ['subtype', 'threatid', 'tid', 'severity', 'repeatcnt', 'filename', 'url'],
            Flags: ["captive-portal", "transaction", "flag-proxy", "flag-pcap", "direction", "client-to-server", "server-to-client", "flag-tunnel-inspected"],
            "Email Headers": ['sender', 'recipient', 'subject'],
            "Log Links": ["loglinks"]
        },
        'url': {
            General: ['sessionid', 'action', 'app', 'rule', 'vsys', 'serial', 'proto', 'logset', 'category', 'time_generated', 'receive_time', 'tunnel', 'parent_session_id', 'parent_start_time', 'view_parent_link', 'monitortag', 'tunnelid', 'imei', 'imsi'],
            Source: ["srcuser", "src", "srcloc", "sport", "from", "inbound_if", "natsrc", "natsport"],
            Destination: ["dstuser", "dst", "dstloc", "dport", "to", "outbound_if", "natdst", "natdport"],
            "HTTP Headers": ["user_agent", "referer", "xff", "http_headers"],
            Details: ['severity', 'repeatcnt', 'url', 'catlink', 'http_method'],
            Flags: ["captive-portal", "transaction", "flag-proxy", "flag-pcap", "direction", "client-to-server", "server-to-client", "flag-tunnel-inspected", "credential-detected"],
            "Log Links": ["loglinks"]
        },
        'traffic': {
            General: ['sessionid', 'action', 'action_source', 'app', 'rule', 'session_end_reason', 'category', 'vsys', 'serial', 'proto', 'logset', 'time_generated', 'start', 'receive_time', 'elapsed', 'tunnel', 'parent_session_id', 'parent_start_time', 'view_parent_link', 'monitortag', 'tunnelid', 'imei', 'imsi', 'assoc_id'],
            Source: ["srcuser", "src", "srcloc", "sport", "from", "inbound_if", "natsrc", "natsport"],
            Destination: ["dstuser", "dst", "dstloc", "dport", "to", "outbound_if", "natdst", "natdport"],
            Details: ['subtype', 'bytes', 'bytes_received', 'bytes_sent', 'repeatcnt', 'packets', 'pkts_received', 'pkts_sent', 'src_uuid', 'dst_uuid', 'chunks', 'chunks_received', 'chunks_sent'],
            Flags: ['captive-portal', 'transaction', 'flag-proxy', 'flag-pcap', 'pbf-c2s', 'pbf-s2c', 'sym-return', 'decrypt-mirror', "direction", "client-to-server", "server-to-client", "flag-tunnel-inspected", "flag-mptcp-set", "flag-recon-excluded", "flag-decrypt-forwarded"],
            "Log Links": ["loglinks"]
        },
        'wildfire': {
            General: ['sessionid', 'action', 'app', 'rule', 'verdict', 'vsys', 'serial', 'proto', 'logset', 'time_generated', 'receive_time', 'tunnel', 'parent_session_id', 'parent_start_time', 'view_parent_link', 'monitortag', 'tunnelid', 'imei', 'imsi'],
            Source: ["srcuser", "src", "srcloc", "sport", "from", "inbound_if", "natsrc", "natsport"],
            Destination: ["dstuser", "dst", "dstloc", "dport", "to", "outbound_if", "natdst", "natdport"],
            "HTTP Headers": ["user_agent", "referer", "xff"],
            Details: ['subtype', 'reportid', 'severity', 'repeatcnt', 'filetype', 'filename', 'url'],
            Flags: ['captive-portal', 'transaction', 'flag-proxy', 'flag-pcap', 'pbf-c2s', 'pbf-s2c', "direction", "client-to-server", "server-to-client", "flag-tunnel-inspected"],
            "Email Headers": ['sender', 'recipient', 'recipient-userid', 'subject'],
            "Log Links": ["loglinks"]
        },
        'corr': {
            "Object Details": ["description", "@id", "detailed-description", "category"],
            "Match Details": ["match_time", "last_update_time", "description", "severity", "summary"]
        },
        'gtp': {
            General: ['sessionid', 'action', 'app', 'rule', 'vsys', 'serial', 'proto', 'logset', 'time_generated', 'receive_time'],
            Source: ["src", "srcloc", "sport", "from", "inbound_if", "natsrc", "natsport"],
            Destination: ["dst", "dstloc", "dport", "to", "outbound_if", "natdst", "natdport"],
            Details: ['event_type', 'event_code', 'imsi', 'imei', 'msisdn', 'apn', 'rat', 'msg_type'],
            "Details (Continued)": ['end_ip_addr', 'teid1', 'teid2', 'gtp_interface', 'cause_code', 'severity', 'mcc', 'mnc', 'area_code', 'cell_id'],
            "Log Links": ["loglinks"]
        },
        'tunnel': {
            General: ['tunnelid', 'monitortag', 'sessionid', 'action', 'action_source', 'app', 'rule', 'tunnel_insp_rule', 'session_end_reason', 'vsys', 'serial', 'proto', 'logset', 'time_generated', 'start', 'receive_time', 'elapsed'],
            Source: ["srcuser", "src", "srcloc", "sport", "from", "inbound_if", "natsrc", "natsport"],
            Destination: ["dstuser", "dst", "dstloc", "dport", "to", "outbound_if", "natdst", "natdport"],
            Details: ['subtype', 'bytes', 'bytes_received', 'bytes_sent', 'repeatcnt', 'packets', 'pkts_received', 'pkts_sent'],
            Flags: ["captive-portal", "transaction", "flag-proxy", "flag-pcap", "client-to-server", "server-to-client", "flag-tunnel-inspected", "flag-mptcp-set", "flag-recon-excluded"],
            "Tunnel Statistics": ['max_encap', 'unknown_proto', 'strict_check', 'tunnel_fragment', 'sessions_created', 'sessions_closed'],
            "Parent Tunnel": ['parent_session_id', 'parent_start_time', 'view_parent_tunnel_link'],
            "Log Links": ["loglinks"]
        },
        'sctp': {
            General: ['sessionid', 'action', 'ppid', 'rule', 'sctp_filter', 'assoc_end_reason', 'vsys', 'serial', 'proto', 'logset', 'time_generated', 'receive_time'],
            Source: ['src', 'srcloc', 'sport', 'from', 'inbound_if'],
            Destination: ['dst', 'dstloc', 'dport', 'to', 'outbound_if'],
            Details: ['chunks', 'chunks_received', 'chunks_sent', 'packets', 'pkts_received', 'pkts_sent', 'sctp_event_type', 'sctp_event_code', 'sctp_chunk_type'],
            'Details (Continued)': ['verif_tag_1', 'verif_tag_2', 'assoc_id', 'stream_id', 'diam_app_id', 'diam_cmd_code', 'diam_avp_code', 'sccp_calling_ssn', 'sccp_calling_gt', 'op_code', 'severity', 'sctp_cause_code'],
            'Log Links': ['loglinks']
        }
    },
    fields: [{name: 'receive_time', type: 'string'}, {name: 'action', type: 'string'}, {
        name: 'action_source',
        type: 'string'
    }, {name: 'actionflags', type: 'string'}, {name: 'app', type: 'string'}, {
        name: 'bytes',
        type: 'string'
    }, {name: 'bytes_received', type: 'string'}, {name: 'bytes_sent', type: 'string'}, {
        name: 'captive-portal',
        type: 'string'
    }, {name: 'category', type: 'string'}, {name: 'verdict', type: 'string'}, {
        name: 'config_ver',
        type: 'string'
    }, {name: 'cpadding', type: 'string'}, {name: 'decrypt-mirror', type: 'string'}, {
        name: 'direction',
        type: 'string'
    }, {name: 'domain', type: 'string'}, {name: 'dport', type: 'string'}, {
        name: 'dst',
        type: 'string'
    }, {name: 'dstuser', type: 'string'}, {name: 'dstloc', type: 'string'}, {
        name: 'elapsed',
        type: 'string'
    }, {name: 'exported', type: 'string'}, {name: 'flag-flagged', type: 'string'}, {
        name: 'flag-nat',
        type: 'string'
    }, {name: 'flag-pcap', type: 'string'}, {name: 'flag-proxy', type: 'string'}, {
        name: 'flag-url-denied',
        type: 'string'
    }, {name: 'flag-tunnel-inspected', type: 'string'}, {name: 'credential-detected', type: 'string'}, {
        name: 'flags',
        type: 'string'
    }, {name: 'from', type: 'string'}, {name: 'inbound_if', type: 'string'}, {
        name: 'logset',
        type: 'string'
    }, {name: 'misc', type: 'string'}, {name: 'flag-mptcp-set', type: 'string'}, {
        name: 'flag-recon-excluded',
        type: 'string'
    }, {name: 'flag-decrypt-forwarded', type: 'string'}, {name: 'catlink', type: 'string'}, {
        name: 'http_method',
        type: 'string'
    }, {name: 'http_headers', type: 'string'}, {
        name: 'view_parent_link',
        type: 'string'
    }, {name: 'view_parent_tunnel_link', type: 'string'}, {name: 'natsrc', type: 'string'}, {
        name: 'natdst',
        type: 'string'
    }, {name: 'natdport', type: 'string'}, {name: 'natsport', type: 'string'}, {
        name: 'outbound_if',
        type: 'string'
    }, {name: 'packets', type: 'string'}, {name: 'padding', type: 'string'}, {
        name: 'pbf-c2s',
        type: 'string'
    }, {name: 'pbf-s2c', type: 'string'}, {name: 'pcap', type: 'string'}, {
        name: 'pcap_id',
        type: 'string'
    }, {name: 'pcap-file', type: 'string'}, {name: 'pktlog', type: 'string'}, {
        name: 'pkts_received',
        type: 'string'
    }, {name: 'pkts_sent', type: 'string'}, {name: 'proto', type: 'string'}, {
        name: 'receive_time',
        type: 'string'
    }, {name: 'repeatcnt', type: 'string'}, {name: 'rule', type: 'string'}, {
        name: 'seqno',
        type: 'string'
    }, {name: 'serial', type: 'string'}, {name: 'sessionid', type: 'string'}, {
        name: 'severity',
        type: 'string'
    }, {name: 'sport', type: 'string'}, {name: 'src', type: 'string'}, {
        name: 'srcuser',
        type: 'string'
    }, {name: 'srcloc', type: 'string'}, {name: 'start', type: 'string'}, {
        name: 'subtype',
        type: 'string'
    }, {name: 'sym-return', type: 'string'}, {name: 'temporary-match', type: 'string'}, {
        name: 'time_generated',
        type: 'string'
    }, {name: 'time_received', type: 'string'}, {name: 'to', type: 'string'}, {
        name: 'transaction',
        type: 'string'
    }, {name: 'type', type: 'string'}, {name: 'vsys', type: 'string'}, {
        name: 'url_idx',
        type: 'string'
    }, {name: 'user_agent', type: 'string'}, {name: 'referer', type: 'string'}, {
        name: 'xff',
        type: 'string'
    }, {name: 'sender', type: 'string'}, {name: 'recipient', type: 'string'}, {
        name: 'recipient-user-id',
        type: 'string'
    }, {name: 'subject', type: 'string'}, {name: 'filetype', type: 'string'}, {
        name: 'reportid',
        type: 'string'
    }, {name: 'threatid', type: 'string'}, {name: 'tid', type: 'string'}, {
        name: 'filedigest',
        type: 'string'
    }, {name: 'cloud', type: 'string'}, {name: 'session_end_reason', type: 'string'}, {
        name: 'version',
        type: 'string'
    }, {name: 'objectid', type: 'string'}, {name: 'match_oid', type: 'string'}, {
        name: 'serial',
        type: 'string'
    }, {name: 'match_time', type: 'string'}, {name: 'last_update_time', type: 'string'}, {
        name: 'objectname',
        type: 'string'
    }, {name: 'url', type: 'string'}, {name: 'filename', type: 'string'}, {
        name: 'logtype',
        type: 'string'
    }, {name: 'summary', type: 'string'}, {name: '@name', type: 'string'}, {
        name: '@id',
        type: 'string'
    }, {name: 'description', type: 'string'}, {name: 'detailed-description', type: 'string'}, {
        name: 'category',
        type: 'string'
    }, {name: 'state', type: 'string'}, {name: 'hostname', type: 'string'}, {
        name: 'device_name',
        type: 'string'
    }, {name: 'event_type', type: 'string'}, {name: 'end_ip_addr', type: 'string'}, {
        name: 'imsi',
        type: 'string'
    }, {name: 'imei', type: 'string'}, {name: 'msg_type', type: 'string'}, {
        name: 'event_code',
        type: 'string'
    }, {name: 'cause_code', type: 'string'}, {name: 'gtp_interface', type: 'string'}, {
        name: 'apn',
        type: 'string'
    }, {name: 'msisdn', type: 'string'}, {name: 'rat', type: 'string'}, {name: 'teid1', type: 'string'}, {
        name: 'teid2',
        type: 'string'
    }, {name: 'mcc', type: 'string'}, {name: 'mnc', type: 'string'}, {
        name: 'area_code',
        type: 'string'
    }, {name: 'cell_id', type: 'string'}, {name: 'parent_session_id', type: 'string'}, {
        name: 'src_uuid',
        type: 'string'
    }, {name: 'dst_uuid', type: 'string'}, {name: 'tunnelid', type: 'string'}, {
        name: 'tunnel',
        type: 'string'
    }, {name: 'monitortag', type: 'string'}, {name: 'max_encap', type: 'string'}, {
        name: 'unknown_proto',
        type: 'string'
    }, {name: 'strict_check', type: 'string'}, {name: 'tunnel_fragment', type: 'string'}, {
        name: 'sessions_created',
        type: 'string'
    }, {name: 'sessions_closed', type: 'string'}, {
        name: 'parent_session_id',
        type: 'string'
    }, {name: 'parent_start_time', type: 'string'}, {name: 'contentver', type: 'string'}, {
        name: 'tunnel_insp_rule',
        type: 'string'
    }, {name: 'assoc_end_reason', type: 'string'}, {name: 'assoc_id', type: 'string'}, {
        name: 'chunks',
        type: 'string'
    }, {name: 'chunks_received', type: 'string'}, {name: 'chunks_sent', type: 'string'}, {
        name: 'diam_app_id',
        type: 'string'
    }, {name: 'diam_avp_code', type: 'string'}, {name: 'diam_cmd_code', type: 'string'}, {
        name: 'op_code',
        type: 'string'
    }, {name: 'ppid', type: 'string'}, {name: 'sctp_cause_code', type: 'string'}, {
        name: 'sccp_calling_gt',
        type: 'string'
    }, {name: 'sccp_calling_ssn', type: 'string'}, {name: 'sctp_chunk_type', type: 'string'}, {
        name: 'sctp_event_code',
        type: 'string'
    }, {name: 'sctp_event_type', type: 'string'}, {name: 'sctp_filter', type: 'string'}, {
        name: 'stream_id',
        type: 'string'
    }, {name: 'verif_tag_1', type: 'string'}, {name: 'verif_tag_2', type: 'string'}],
    columns: {
        "default": [{
            header: _T("PCAP"), dataIndex: 'pcap_id', fixed: true, width: 40, sortable: true, columnAvail: function () {
                return Pan.base.admin.getPermission('privacy/view-pcap-files') === 'enable';
            }, renderer: function renderer(val, metaData, record) {
                var type = record.get('type').toLowerCase();
                var subtype = record.get('subtype').toLowerCase();
                var flagpcap = record.get('flag-pcap').toLowerCase();
                var pcap = '';
                var pcap_id = record.get('pcap_id');
                var pktlog = record.get('pktlog');
                var pcapfile = record.get('pcap-file');
                var serial = record.get('serial');
                var receive_time = record.get('receive_time');
                var time_generated = record.get('time_generated');
                var device_name = record.get('device_name');
                if (!device_name) {
                    device_name = '';
                }
                var sessionid = record.get('sessionid');
                if (type == Pan.monitor.log.LogType.Data) {
                    type = 'dlp';
                }
                else if (type == Pan.monitor.log.LogType.Threat) {
                    if (subtype == 'data') {
                        type = 'dlp';
                        pcap = pktlog;
                    }
                    else {
                        type = 'threat';
                        pcap = pcap_id;
                    }
                }
                else if (type == Pan.monitor.log.LogType.Traffic) {
                    type = 'application';
                    pcap = pcapfile;
                    pcap = pcap.replace('-', '/');
                }
                if (type && flagpcap == 'yes' && receive_time) {
                    return '<a href=\'javascript:void(0)\' onclick=\'Pan.monitor.log.downloadPcap("' + type + '","' + Pan.base.htmlEncode(pcap) + '","' + Pan.base.htmlEncode(serial) + '","' + Pan.base.htmlEncode(receive_time) + '","' + Pan.base.htmlEncode(time_generated) + '","' + Pan.base.htmlEncode(device_name) + '","' + Pan.base.htmlEncode(sessionid) + '")\'><img src=\'/images/download.gif\' border=0/></a>';
                }
                else {
                    return '&nbsp;';
                }
            }
        }, {header: _T("Receive Time"), dataIndex: 'receive_time', width: 180, sortable: true}, {
            header: _T("Log"),
            dataIndex: 'type',
            hidden: true,
            width: 80,
            sortable: true
        }, {header: _T("Type"), dataIndex: 'subtype', width: 110, sortable: true}, {
            header: _T("Application"),
            dataIndex: 'app',
            width: 130,
            sortable: true
        }, {header: _T("Action"), dataIndex: 'action', width: 100, sortable: true}, {
            header: _T("Action Source"),
            dataIndex: 'action_source',
            hidden: true,
            width: 100,
            sortable: true
        }, {header: _T("Rule"), dataIndex: 'rule', width: 100, sortable: true}, {
            header: _T("Bytes"),
            dataIndex: 'bytes',
            width: 70,
            sortable: true
        }, {
            header: _T("Packets"),
            dataIndex: 'packets',
            hidden: true,
            width: 90,
            sortable: true
        }, {header: _T("Severity"), dataIndex: 'severity', width: 110, sortable: true}, {
            header: _T("Category"),
            dataIndex: 'category',
            sortable: true
        }, {header: _T("Verdict"), dataIndex: 'verdict', sortable: true}, {
            header: _T("URL"),
            dataIndex: 'url',
            sortable: true,
            wrap: false
        }, {header: _T("File Name"), dataIndex: 'filename', sortable: true, wrap: false}, {
            header: _T("User Agent"),
            dataIndex: 'user_agent',
            sortable: true,
            hidden: true,
            wrap: false
        }, {
            header: _T("X-Forwarded-For"),
            dataIndex: 'xff',
            sortable: true,
            hidden: true,
            wrap: false
        }, {header: _T("Referer"), dataIndex: 'referer', sortable: true, hidden: true, wrap: false}],
        gtp: [{
            header: _T("Receive Time"),
            dataIndex: 'receive_time',
            width: 180,
            sortable: true
        }, {header: _T("GTP Event Type"), dataIndex: 'event_type', width: 110, sortable: true}, {
            header: _T("IMSI"),
            dataIndex: 'imsi',
            width: 110,
            sortable: true
        }, {
            header: _T("GTP Message Type"),
            dataIndex: 'msg_type',
            width: 110,
            sortable: true
        }, {header: _T("End User IP"), dataIndex: 'end_ip_addr', width: 110, sortable: true}, {
            header: _T("Source IP"),
            dataIndex: 'src',
            width: 110,
            sortable: true
        }, {header: _T("Destination IP"), dataIndex: 'dst', width: 110, sortable: true}, {
            header: _T("Application"),
            dataIndex: 'app',
            width: 110,
            sortable: true
        }, {header: _T("GTP Cause"), dataIndex: 'cause_code', width: 110, sortable: true}, {
            header: _T("Action"),
            dataIndex: 'action',
            width: 110,
            sortable: true
        }],
        tunnel: [{
            header: _T("Session ID"),
            dataIndex: 'sessionid',
            width: 110,
            sortable: true
        }, {header: _T("Start Time"), dataIndex: 'start', width: 180, sortable: true}, {
            header: _T("Source IP"),
            dataIndex: 'src',
            width: 110,
            sortable: true
        }, {header: _T("Source Zone"), dataIndex: 'from', width: 110, sortable: true}, {
            header: _T("Destination IP"),
            dataIndex: 'dst',
            width: 110,
            sortable: true
        }, {header: _T("Destination Zone"), dataIndex: 'to', width: 110, sortable: true}],
        sctp: [{
            header: _T('Receive Time'),
            dataIndex: 'receive_time',
            width: 78,
            sortable: true
        }, {
            header: _T('Association ID'),
            dataIndex: 'assoc_id',
            width: 78,
            sortable: true
        }, {
            header: _T('Source Address'),
            dataIndex: 'src',
            width: 78,
            sortable: true
        }, {header: _T('Destination Address'), dataIndex: 'dst', width: 78, sortable: true}, {
            header: _T('Severity'),
            dataIndex: 'severity',
            width: 78,
            sortable: true
        }, {header: _T('Action'), dataIndex: 'action', width: 78, sortable: true}, {
            header: _T('PPID'),
            dataIndex: 'ppid',
            width: 78,
            sortable: true
        }, {
            header: _T('SCTP Event Type'),
            dataIndex: 'sctp_event_type',
            width: 78,
            sortable: true
        }, {
            header: _T('Chunk Type'),
            dataIndex: 'sctp_chunk_type',
            width: 78,
            sortable: true
        }, {header: _T('Association End Reason'), dataIndex: 'assoc_end_reason', width: 78, sortable: true}]
    },
    fieldIsFlag: function (fieldkey) {
        var flagFields = ["decrypt-mirror", "sym-return", "transaction", "captive-portal", "credential-detected", "non-std-dport", "pbf-c2s", "pbf-s2c"];
        return flagFields.indexOf(fieldkey) != -1 || fieldkey.match(/^flag-/);
    },
    fieldIsUserIdFlag: function (fieldkey) {
        var flagFields = ['flag-duplicate-user', 'flag-user-group-found'];
        return flagFields.indexOf(fieldkey) != -1;
    }
};
Ext.ns('Pan.monitor');
Ext.apply(Pan.monitor, {
    emptyMsg: String.format('<table align=center><tr><td>{0}</td></tr></table>', _T('NO DATA TO DISPLAY')),
    downloadReportVsysScope: function () {
        var vsys = 'shared';
        if (Pan.global.isCmsSelected()) {
            vsys = Pan.global.getLocVal();
        }
        else if (Pan.global.isMultiVsys()) {
            vsys = Pan.global.getLocVal();
            if (!vsys || vsys.indexOf('vsys') != 0) {
                vsys = 'shared';
            }
        }
        return vsys;
    },
    vsysScope: function () {
        var vsys = '';
        if (Pan.global.isCmsSelected()) {
            vsys = Pan.global.getLocVal();
            if (vsys == 'shared') {
                vsys = '';
            }
        }
        else if (Pan.global.isMultiVsys()) {
            vsys = Pan.global.getLocVal();
            if (!vsys) {
                vsys = '';
            }
        }
        return vsys;
    },
    isDGScope: function () {
        if (Pan.global.isCms()) {
            var loc = Pan.monitor.vsysScope();
            return loc != '' && loc != 'shared';
        }
        return false;
    },
    isSharedSchema: function () {
        return (!Pan.global.isCms() && !Pan.global.isMultiVsys()) || Pan.global.getLocVal() == '' || Pan.global.getLocVal() == 'shared';
    },
    isCachedLoggingBackend: function () {
        return true;
    }
});
Ext.ns('Pan.monitor');
Pan.monitor.MonitorPage = Ext.extend(Pan.mainui.MenuTreePage, {
    initComponent: function () {
        Pan.monitor.MonitorPage.superclass.initComponent.apply(this, arguments);
        Pan.monitor.loggingServiceCustomReportMsg = '';
        PanDirect.runCallback("DeviceDirect.requestLicenseInfo")(function (response) {
            if (response && response["@status"] === "success") {
                Ext.each(response.result.licenses.entry, function (entry) {
                    if (Pan.global.isCmsSelected() && entry.feature && entry.feature.indexOf("Logging Service") >= 0 && entry.expired !== "yes") {
                        if (Pan.global.CONTEXT.loggingServiceCustomReportMessage) {
                            Pan.monitor.loggingServiceCustomReportMsg = Pan.global.CONTEXT.loggingServiceCustomReportMessage;
                            var form = Pan.monitor.ManageCustomReport.Viewer.prototype.recordForm;
                            if (form && form.windowConfig) {
                                form.windowConfig.height = 525;
                                form.windowConfig.minHeight = 525;
                            }
                        }
                        return false;
                    }
                }, this);
            }
        }, this);
    }, getToolbarItems: function () {
        if (Pan.global.isCms()) {
            return ['->', {
                xtype: "tbtext",
                text: _T('Data Source'),
                id: 'appscope-data-source-label'
            }, {
                xtype: 'pan-selectbox',
                name: "appscope-data-source",
                id: "appscope-data-source",
                width: 130,
                allowBlank: false,
                stateful: true,
                stateId: "appscope-data-source",
                stateEvents: ['change'],
                getState: function () {
                    return {value: this.getValue()};
                },
                applyState: function (state) {
                    this.setValue(state.value);
                },
                listeners: {
                    'select': function () {
                        Pan.appframework.PanAppInterface.refresh(true);
                    }
                },
                store: [['panorama', _T('Panorama')], ['remote', _T('Remote Device Data')]]
            }];
        }
    }, generateSysLogs: function () {
        PanDirect.run('MonitorDirect.generateSysLogs', [], function (result) {
            if (Pan.base.json.path(result, '$.@status') != 'success') {
                Pan.base.msg('Error on generating system logs');
            }
        }.createDelegate(this));
    }, activate: function (branch, vsys, params, pageChanged) {
        if (vsys === undefined && Pan.global && Pan.global.getLoc && Pan.global.getLoc()) {
            vsys = Pan.global.getLoc().val;
        }
        if (pageChanged) {
            this.generateSysLogs();
        }
        if (branch) {
            var showAllAsShared = (branch == "monitor/reports" || branch == "monitor/custom-reports" || branch.indexOf("monitor/pdf-reports/") == 0);
            var vsysCombo = Ext.getCmp('vsys');
            if (vsysCombo) {
                var s = vsysCombo.getStore();
                var firstitem = s.getAt(0);
                var requireReload = firstitem && firstitem.data && ((showAllAsShared && firstitem.data.vsysName == Pan.i18n('All')) || (!showAllAsShared && firstitem.data.vsysName != Pan.i18n('All')));
                if (requireReload) {
                    var currentLocation = vsysCombo.getValue();
                    vsysCombo.reload(currentLocation, branch);
                }
            }
        }
        if (!branch) {
            branch = (this.getBranch() || this.findInitialNode(this.root)).getPath();
        }
        var cb = Ext.getCmp("appscope-data-source");
        var lb = Ext.getCmp("appscope-data-source-label");
        var loccombo = Ext.getCmp('vsys');
        if (Pan.global.isCms()) {
            var onDGValueChange = function (val) {
                if (!val || val == 'shared') {
                    cb.setDisabled(false);
                }
                else {
                    cb.setValue('panorama');
                    cb.setDisabled(true);
                }
            };
            if (cb && loccombo) {
                onDGValueChange(loccombo.getValue());
                loccombo.on('select', function (combo, record) {
                    var val = record.get('value');
                    onDGValueChange(val);
                });
            }
        }
        if (branch && branch.indexOf('app-scope') >= 0) {
            var isPassive = Pan.global.CONTEXT.haLocalState == 'passive';
            if (isPassive) {
                if (cb) cb.hide();
                if (lb) lb.hide();
            }
            else {
                if (cb) cb.show();
                if (lb) lb.show();
            }
        }
        else {
            if (cb) cb.hide();
            if (lb) lb.hide();
        }
        Pan.monitor.MonitorPage.superclass.activate.apply(this, arguments);
    }, deactivate: function () {
        PanDirect.run('MonitorDirect.clearReportAllBySession');
        PanDirect.run('MonitorDirect.clearQueryAllBySession');
        Pan.monitor.MonitorPage.superclass.deactivate.apply(this, arguments);
    }, processTreeBranches: function (branch, vsys) {
        if (Pan.global.isCms() || Pan.global.isMultiVsys()) {
            var isVsysDG = vsys != "" && vsys != 'shared';
            var nodesHiddenInAllShared = [];
            var nodesHiddenInVsysDG = ['monitor/logs/system', 'monitor/logs/configuration', 'monitor/botnet', 'monitor/packet-capture', "monitor/external-logs"];
            var nodeConfigDotIds = ['monitor/pdf-reports/manage-pdf-summary', 'monitor/pdf-reports/user-activity-report', 'monitor/pdf-reports/saas-application-usage-report', 'monitor/pdf-reports/report-groups', 'monitor/pdf-reports/email-scheduler', 'monitor/custom-reports'];
            nodeConfigDotIds.forEach(function (id) {
                var isNotEmpty = this.isNotEmptyNode(null, id);
                this.showNode(id, isNotEmpty);
            }, this);
            if (Pan.base.admin.isDeviceGroupAdmin()) {
                nodesHiddenInAllShared = ["monitor/pdf-reports", "monitor/custom-reports", "monitor/reports"];
            }
            var i;
            for (i = 0; i < nodesHiddenInVsysDG.length; i++) {
                if (isVsysDG) {
                    this.hideNode(nodesHiddenInVsysDG[i], 'monitor/logs/traffic');
                }
                else {
                    if (nodesHiddenInVsysDG[i] != "monitor/external-logs" || Pan.monitor.showExtlogNode)
                        this.showNode(nodesHiddenInVsysDG[i]);
                }
            }
            for (i = 0; i < nodesHiddenInAllShared.length; i++) {
                if (isVsysDG) {
                    this.showNode(nodesHiddenInAllShared[i]);
                }
                else {
                    this.hideNode(nodesHiddenInAllShared[i], 'monitor/logs/traffic');
                }
            }
        }
        if (!Pan.base.admin.getPermission("privacy/view-pcap-files")) {
            this.hideNode('monitor/packet-capture', 'monitor/logs/traffic');
        }
        var isGTPEnabled = Pan.global.CONTEXT.isGTPEnabled;
        isGTPEnabled ? this.showNode('monitor/logs/gtp') : this.hideNode('monitor/logs/gtp');
        var isSCTPEnabled = Pan.global.CONTEXT.isSCTPEnabled;
        isSCTPEnabled ? this.showNode('monitor/logs/sctp') : this.hideNode('monitor/logs/sctp');
        var isCorrEnabled = Pan.global.isCorrelationLogEnabled();
        isCorrEnabled ? this.showNode('monitor/automated-correlation-engine') : this.hideNode('monitor/automated-correlation-engine');
        var isPa3020 = Pan.global.CONTEXT.model === "PA-3020";
        var isPa220 = Pan.global.CONTEXT.model === "PA-220";
        (Pan.global.isPhoenixVM() || Pan.global.isMillennium() || isPa3020 || isPa220) ? this.hideNode('monitor/block-ip-list') : this.showNode('monitor/block-ip-list');
    }
});
Pan.appframework.PanAppInterface.registerPage('monitor', Pan.monitor.MonitorPage);
Ext.ns('Pan.monitor');
Pan.monitor._locationField = Pan.base.clone(Pan.common.CommonViewerConfig.fieldConfig.location);
Ext.applyIf(Pan.monitor._locationField.uiHint, {hidden: true});
Pan.monitor._locationField.parentFieldPath = '$';
Pan.monitor.MonitorViewer = Ext.extend(Pan.appframework.modelview.PanGridViewer, {
    configStates: {
        isSupportingCmsPrivate: false,
        isSupportingShared: true,
        alwaysHideLocation: true,
        defaultSingleVsysModeLocation: Pan.global.isCms() ? function () {
            var locVal = Pan.global.getLocVal();
            return locVal === '' ? 'shared' : locVal;
        } : 'shared'
    },
    fieldConfig: Ext.applyIf({}, Pan.common.CommonViewerConfig.fieldConfig),
    columnConfig: Ext.applyIf({}, Pan.common.CommonViewerConfig.columnConfig),
    commonFields: [Pan.monitor._locationField],
    cloneForm: {hasSameXPathId: true}
});
Ext.namespace('Pan.monitor.ReportDatePicker');
Pan.monitor.ReportDatePicker = Ext.extend(Ext.DatePicker, {
    constructor: function (config) {
        Ext.apply(this, {
            showToday: false, todayText: 'Latest', format: 'Y/m/d', listeners: {
                'render': function () {
                    var main = this.el.dom.firstChild;
                    Ext.fly(main).setWidth("100%");
                    Ext.fly(main).setHeight("100%");
                    this.el.query(".x-date-inner")[0].style.width = "100%";
                    this.el.query(".x-date-inner")[0].style.height = "100%";
                }
            }
        });
        Ext.apply(this, config);
        Pan.monitor.ReportDatePicker.superclass.constructor.call(this);
    }
});
Ext.ns('Pan.monitor');
(function () {
    Pan.monitor.fieldDefinitions['threatid'].width = 360;
    Pan.monitor.fieldDefinitions['tid'].width = 40;
    Pan.monitor.accDrillDown = function (storeId, id, dataIndex) {
        var store = Ext.StoreMgr.item(storeId);
        var obj = store.getById(id);
        var value = obj.data[dataIndex];
        var params = {};
        if (dataIndex.indexOf('risk') >= 0 && !(value >= 1 && value <= 5)) {
            return false;
        }
        if (dataIndex == 'rule' && !Pan.global.isCmsSelected() && Pan.base.admin.getPermission('policies/security-rulebase')) {
            var ruleVsys = obj.data['vsys'];
            params = {selectedRule: value};
            if (!Pan.global.CONTEXT.isCms && ruleVsys && ruleVsys.indexOf('vsys') != -1) {
                Pan.appframework.PanAppInterface.jumpToBranch('policies/security-rulebase', ruleVsys, params);
            }
            return false;
        }
        if (!Pan.base.admin.getPermission('acc')) {
            return false;
        }
        if (value && value['@code']) {
            value = value['@code'];
        }
        else if (dataIndex == 'translated-src') {
            dataIndex = 'srcloc';
        }
        else if (dataIndex == 'translated-dst') {
            dataIndex = 'dstloc';
        }
        else if (dataIndex == 'tunneled-name') {
            dataIndex = 'app';
        }
        params = {filter: {"key": dataIndex, "value": value}};
        if (dataIndex == 'threatid') {
            var tid = obj.data['tid'];
            if (tid) {
                params["filter"]["logtype"] = 'thsum';
                params["filter"]["display_value"] = params["filter"]["value"];
                params["filter"]["value"] = tid;
            }
        }
        if (store.starttime && store.endtime) {
            params['start-time'] = store.starttime;
            params['end-time'] = store.endtime;
        }
        Pan.appframework.PanAppInterface.closeAllModalWindows();
        Pan.appframework.PanAppInterface.jumpToBranch('acc', params['vsys'], params);
        return false;
    };

    function EnabledDatesReObj(arr) {
        this.enabledDates = arr;
    }

    EnabledDatesReObj.prototype.test = function (str) {
        return (this.enabledDates.indexOf(str) == -1);
    };
    var barImageTpl = new Ext.Template("{number} &#160; ", "<img border=0 src='/images/{bar_image}_right_left.gif' height='10' width='1'/>", "<img border=0 src='/images/{bar_image}_center.gif' height='10' width='{width}'/>", "<img border=0 src='/images/{bar_image}_right_left.gif' height='10' width='1'/>", "<!--suppress CheckImageSize --><img border=0 src='/images/s.gif' height='10' width='{space}'/>").compile();

    function barImageRenderer(img, nodeName) {
        return function (v, metadata, record) {
            var jpath = "$.json.@percentage_" + this.dataIndex;
            var percentage = Pan.base.json.path(record, jpath, 1);
            jpath = "$.store.reader.jsonData.max-percentage." + this.dataIndex;
            var maxLen = Pan.base.json.path(record, jpath, 100);
            var space = maxLen - percentage;
            var base = 1000;
            switch (nodeName) {
                case'nbytes':
                case'bytes':
                case'bytes_sent':
                case'bytes_received':
                    base = Pan.common.Constants.noOf1KBytes;
                    break;
                default:
            }
            return barImageTpl.apply({
                number: Pan.base.util.prettyPrintNumber(v, base),
                bar_image: img,
                width: percentage,
                space: space
            });
        };
    }

    function countryValueRenderer(v) {
        if (!Ext.isObject(v)) {
            v = {'@cc': v, 'text': v};
        }
        return Pan.mainui.countryFlagRenderer(v['@cc']) + '&#160;' + v['text'];
    }

    function threatNameRenderer(v) {
        var hostname = Pan.acc.threatNameResolve.isReportThreatNameResolved(v);
        if (hostname) {
            return Pan.acc.threatNameResolve.threatNameRenderer(hostname);
        }
        else {
            return '<span><span class="resolved-threat-id">' + v + '</span></span>';
        }
    }

    function hostnameRenderer(v, metadata, record) {
        var vsys = record && record.data && record.data.vsys;
        var hostname = Pan.acc.whois.isReportHostnameResolved(v, vsys);
        if (hostname) {
            return Pan.acc.whois.hostnameRenderer(hostname);
        }
        else {
            return '<span><span class="resolved-address">' + v + '</span></span>';
        }
    }

    function createHipReportLinkRenderer(storeId) {
        return function (v, metadata, record) {
            var icon = "<img src='/images/icons/computer_link.png' border=0/>";
            var fmt = "Pan.acc.accHipReportDrillDown('{0}','{1}')";
            var onclick = String.format(fmt, storeId, record.id);
            return String.format('<a class="reportViewer" href="javascript:" onclick="' + '{0}' + '">' + icon + '</a>', onclick);
        };
    }

    function newlineRenderer(v) {
        return v.replace("\n", "<br/>");
    }

    function createRenderer(storeId, axis, drilldown, logtype, transform, acc) {
        var lastvalue = {};
        return function (v, metadata, record, rowIndex, colIndex, store) {
            var drilldownOverride = drilldown;
            if (axis && axis == this.dataIndex) {
                var displayValue = (v && v.text) || (v && Ext.isFunction(v.toString) && v.toString()) || v;
                if (displayValue == '') {
                    drilldownOverride = false;
                    v = displayValue = _T("Unknown");
                }
                if (rowIndex != 0 && lastvalue[colIndex] && lastvalue[colIndex] == displayValue) {
                    v = '';
                }
                else {
                    lastvalue[colIndex] = displayValue;
                }
            }
            if (transform) {
                v = transform(v, metadata, record, rowIndex, colIndex, store);
            }
            if (drilldownOverride) {
                var fmt = acc ? ("Pan.acc.accDrillDown('{0}','{1}','{2}', '" + logtype + "')") : "Pan.monitor.accDrillDown('{0}','{1}','{2}')";
                var onclick = String.format(fmt, storeId, record.id, this.dataIndex);
                return String.format('<a class="reportViewer" href="javascript:" onclick="' + '{0}' + '">{1}</a>', onclick, v);
            }
            return v;
        };
    }

    Pan.monitor.RowNumberer = Ext.extend(Ext.grid.RowNumberer, {
        renderer: function (v, p, record) {
            var log = PanLogging.getLogger('monitor:ReportViewer');
            if (this.rowspan) {
                p.cellAttr = 'rowspan="' + this.rowspan + '"';
            }
            var idx = record.store.snapshot.indexOfKey(record.id);
            if (idx != -1) {
                return idx + 1;
            }
            log.info('Record index not found');
            return '';
        }
    });
    var reportViewerPagingLimit = 100;
    Pan.monitor.ReportViewer = Ext.extend(Pan.base.grid.GridPanel, {
        supportFastRender: false,
        stateEvents: ['columnresize', 'groupchange'],
        stateful: true,
        itemId: "ACC_REPORT_ID",
        enableColumnMove: false,
        supportLocalPaging: true,
        showBbar: true,
        localPagingParams: {start: 0, limit: reportViewerPagingLimit},
        hasGridFilter: false,
        storeScrollPosition: false,
        theme: Pan.base.Constants.uiThemes[0],
        buildReportExportForm: function () {
            if (!document.getElementById("report.export.form")) {
                var html = ['<form id="report.export.form" method="post" target="_blank" action="/php/monitor/report.export.xml.php">', '<input type="hidden" name="xml"/>', '<input type="hidden" name="filename" value="report"/>', '<input type="hidden" name="jobid" value=""/>', '<input type="hidden" name="format" value="csv"/>', '</form>'].join('');
                var el = new Ext.Element(document.createElement('div'));
                el.dom.innerHTML = html;
                el.appendTo(document.body);
            }
            return document.getElementById("report.export.form");
        },
        exportReport: function (format) {
            return this.exportCSVReport(format);
        },
        exportCSVReport: function (format) {
            var s = this.getStore();
            var response = Pan.base.json.path(s, '$.reader.jsonData', '');
            var jobid = Pan.base.json.path(response, '$.result.job.id', '');
            var fullpath = Pan.base.json.path(response, '$.result.@fullpath', '');
            if (fullpath) {
                Pan.Msg.wait(_T("Exporting..."));
                PanDirect.run('MonitorDirect.enqueueExportScheduledReportJob', [fullpath, format], $.proxy(this.exportReportCallback, this));
            }
            else if (jobid) {
                Pan.Msg.wait(_T("Exporting..."));
                PanDirect.run('MonitorDirect.enqueueExportRunNowCustomReportJob', [jobid, format], $.proxy(this.exportReportCallback, this));
            }
            else {
                Pan.Msg.alert(_T("Error"), _T('Missing report job id'));
            }
        },
        buildCSVReportExportForm: function () {
            var formid = "report.export.form.csv";
            if (!document.getElementById(formid)) {
                var html = ['<form id="', formid, '" method="post" target="_blank" action="/php/device/export.file.php">', '<input type="hidden" name="type" value ="customreportexport"/>', '<input type="hidden" name="file" value=""/>', '</form>'].join('');
                var el = new Ext.Element(document.createElement('div'));
                el.dom.innerHTML = html;
                el.appendTo(document.body);
            }
            return document.getElementById(formid);
        },
        exportReportCallback: function (exportjob) {
            var self = this;
            var polljob = function () {
                var error = '';
                PanDirect.run('PanDirect.pollReport', [exportjob.result.job], function (result) {
                    if (result && result.result && result.result.job && result.result.job.status) {
                        switch (result.result.job.status) {
                            case'PEND':
                            case'ACT':
                                polljob.defer(1500);
                                break;
                            case'FIN':
                                if (result.result.job.resultfile) {
                                    Pan.Msg.hide();
                                    var form = self.buildCSVReportExportForm();
                                    form.file.value = result.result.job.resultfile;
                                    form.submit();
                                }
                                else {
                                    error = _T('Export file is missing');
                                }
                                break;
                            default:
                                error = _T('Invalid job status');
                                break;
                        }
                    }
                    else {
                        error = _T('Error polling job status');
                    }
                    if (error) {
                        Pan.Msg.alert(_T("Error"), error);
                    }
                });
            };
            if (exportjob && exportjob.result) {
                if (exportjob.result.resultfile) {
                    Pan.Msg.hide();
                    var form = self.buildCSVReportExportForm();
                    form.file.value = exportjob.result.resultfile;
                    form.submit();
                }
                else if (exportjob.result.job) {
                    polljob.defer(1500);
                }
                else {
                    Pan.Msg.alert(_T("Error"), _T('Error enqueuing export job'));
                }
            }
            else {
                var msg = Pan.common.util.getErrorMessageText(exportjob).trim();
                Pan.Msg.alert(_T("Error"), (msg ? msg : _T('Error enqueuing export job')));
            }
        },
        loadReport: function (result) {
            this.storeId = Ext.id();
            var view = this.getView();
            if (result && result.result && result.result.job && result.result.job.status != 'ACT') {
                view.emptyText = (result && result.emptyText) || _T('No Matching Records');
            }
            else {
                view.emptyText = '';
            }
            var cols = [];
            var colsmodel = [];
            var root, entry, axis, logtype, starttime, endtime, reportcaption;
            if (Pan.base.json.path(result, '$.result.report.entry')) {
                root = 'result.report.entry';
                axis = Pan.base.json.path(result, '$.result.report.@axis');
                logtype = Pan.base.json.path(result, '$.result.report.@logtype');
                reportcaption = Pan.base.json.path(result, '$.result.report.@name');
                starttime = Pan.base.json.path(result, '$.result.report.@start');
                endtime = Pan.base.json.path(result, '$.result.report.@end');
            }
            else if (Pan.base.json.path(result, '$.result.entry')) {
                root = 'result.entry';
                axis = Pan.base.json.path(result, '$.result.@axis');
                logtype = Pan.base.json.path(result, '$.result.@logtype');
                reportcaption = Pan.base.json.path(result, '$.result.@name');
                starttime = Pan.base.json.path(result, '$.result.@start');
                endtime = Pan.base.json.path(result, '$.result.@end');
            }
            var cmsVsysSerialDrilldown = Pan.global.isCms() ? this.acc : false;
            var accDrilldownRenderer = createRenderer(this.storeId, axis, true, logtype, null, this.acc);
            var riskValueRenderer = createRenderer(this.storeId, axis, true, logtype, Pan.mainui.riskValueRenderer, this.acc);
            var severityRenderer = createRenderer(this.storeId, axis, false, logtype, Pan.mainui.severityRenderer, this.acc);
            var countryRenderer = createRenderer(this.storeId, axis, true, logtype, countryValueRenderer, this.acc);
            var defaultRenderer = createRenderer(this.storeId, axis, false, logtype);
            var httpHeadersRenderer = createRenderer(this.storeId, axis, false, logtype, Pan.mainui.httpHeadersRenderer, this.acc);
            var vsysRenderer = createRenderer(this.storeId, axis, cmsVsysSerialDrilldown, logtype, null, cmsVsysSerialDrilldown);
            var serialRenderer = createRenderer(this.storeId, axis, cmsVsysSerialDrilldown, logtype, null, cmsVsysSerialDrilldown);
            var dayOfReceivedTimeRenderer = createRenderer(this.storeId, axis, false, logtype, Ext.util.Format.dateRenderer('D, M j, Y'));
            var hourOfReceivedTimeRenderer = createRenderer(this.storeId, axis, false, logtype, Ext.util.Format.dateRenderer('Y/m/d H:i'));
            var hipReportLinkRenderer = createHipReportLinkRenderer(this.storeId);
            if (root) {
                entry = Pan.base.json.path(result, '$.' + root + '[0]');
            }
            if (entry) {
                colsmodel.push(new Pan.monitor.RowNumberer({width: 46}));
                for (var nodeName in entry) if (entry.hasOwnProperty(nodeName)) {
                    if (nodeName.indexOf('@percentage_') == 0 || nodeName == 'id') {
                        continue;
                    }
                    var dataconfig = {name: nodeName};
                    var colconfig = {
                        header: _TC(nodeName),
                        sortable: true,
                        dataIndex: nodeName,
                        hideable: false,
                        renderer: defaultRenderer
                    };
                    if ((nodeName == 'serial' && !Pan.global.isCmsSelected()) || ((nodeName == 'vsys' || nodeName == 'vsys_name') && !Pan.global.isCmsSelected() && !Pan.global.isMultiVsys())) {
                        colconfig.hidden = true;
                    }
                    var field = Pan.monitor.log.getFieldDefinition(nodeName, logtype);
                    if (logtype == 'wildfire' && nodeName == 'category') field['long_name'] = 'Verdict';
                    if ((logtype == 'tunnel' || logtype == 'tunnelsum') && nodeName == 'rule') field['long_name'] = 'Security Rule';
                    colconfig.header = _TC(field['long_name']);
                    colconfig.width = field['width'] || colconfig.width;
                    colconfig.renderer = field['acc_drilldown'] ? accDrilldownRenderer : defaultRenderer;
                    if (field['bar_image']) {
                        Ext.apply(colconfig, {
                            renderer: barImageRenderer(field['bar_image'], nodeName),
                            width: 175,
                            align: 'right'
                        });
                        Ext.apply(dataconfig, {type: 'int'});
                    }
                    if (Ext.isDefined(entry[nodeName]['@cc']) || nodeName == 'srcloc' || nodeName == 'dstloc') {
                        colconfig.renderer = countryRenderer;
                        colconfig.sortable = false;
                    }
                    else if (nodeName.indexOf('risk') == 0) {
                        colconfig.renderer = riskValueRenderer;
                        colconfig.width = 35;
                    }
                    else if (nodeName.indexOf('severity') == 0) {
                        colconfig.renderer = severityRenderer;
                    }
                    else if (nodeName.indexOf('resolved-') == 0) {
                        colconfig.renderer = hostnameRenderer;
                    }
                    else if (nodeName == 'description') {
                        colconfig.renderer = newlineRenderer;
                    }
                    else if (nodeName == 'vsys') {
                        colconfig.renderer = vsysRenderer;
                    }
                    else if (nodeName == 'serial') {
                        colconfig.renderer = serialRenderer;
                    }
                    else if (nodeName == 'day-of-receive_time') {
                        Ext.apply(dataconfig, {type: 'date'});
                        colconfig.renderer = dayOfReceivedTimeRenderer;
                    }
                    else if (nodeName == 'hour-of-receive_time' || nodeName == 'quarter-hour-of-receive_time') {
                        Ext.apply(dataconfig, {type: 'date', dateFormat: 'Y/m/d H:i:s'});
                        colconfig.renderer = hourOfReceivedTimeRenderer;
                    }
                    if (nodeName == 'vsys') {
                        reportcaption = Pan.base.json.path(result, '$.result.report.@name');
                        if (reportcaption == _T('Top HIP Report Matches')) {
                            colconfig.hidden = false;
                            colconfig.header = _T('HIP Report');
                            colconfig.renderer = hipReportLinkRenderer;
                        }
                    }
                    if (nodeName == 'http_headers') {
                        colconfig.renderer = httpHeadersRenderer;
                    }
                    cols.push(dataconfig);
                    if (this.acc) {
                        colconfig.sortable = false;
                    }
                    colsmodel.push(colconfig);
                }
            }
            else {
                colsmodel.push({header: ''});
            }
            Ext.each(this.buttons, function (btn) {
                btn.setDisabled(!entry);
            });
            var store = new Pan.base.autorender.GridRecordStore({
                supportLocalPaging: true,
                localPagingParams: {start: 0, limit: reportViewerPagingLimit},
                storeId: this.storeId,
                autoLoad: true,
                proxy: new Pan.base.data.XMLMemoryProxy(),
                reader: new Pan.base.data.JsonMemoryReader({json: result, root: root}, cols),
                listeners: {localPagingChanged: this.onLocalPagingChanged, scope: this}
            });
            this.bottomToolbar.find("xtype", "pan-paging")[0].bindStore(store, true);
            store.starttime = starttime;
            store.endtime = endtime;
            if (root && entry) {
                store.load();
            }
            var cm = new Ext.grid.ColumnModel(colsmodel);
            this.reconfigure(store, cm);
            this.view.updateAllColumnWidths();
            Pan.acc.whois.resolveHostnames.defer(1000);
            Pan.acc.threatNameResolve.resolveThreatNamesBulk.defer(1000);
            this.doLayout(true);
        },
        onLocalPagingChanged: function () {
            Pan.acc.threatNameResolve.resolveThreatNamesBulk.defer(1000);
        },
        constructor: function (config) {
            this.acc = config.acc;
            Ext.applyIf(config, {
                loadMask: {msg: _T('Loading...')},
                stripeRows: true,
                cls: 'vline-on darkblue',
                border: false,
                enableHdMenu: true,
                buttons: [{
                    text: _T('Export to PDF'),
                    disabled: true,
                    handler: this.exportReport.createDelegate(this, ['pdf'])
                }, {
                    text: _T('Export to CSV'),
                    disabled: true,
                    handler: this.exportReport.createDelegate(this, ['csv'])
                }, {
                    text: _T('Export to XML'),
                    disabled: true,
                    handler: this.exportReport.createDelegate(this, ['xml'])
                }],
                buttonAlign: 'center',
                listeners: {
                    "reconfigure": function () {
                        if (Ext.state.Manager.get(this.itemId)) {
                            this.applyState(Ext.state.Manager.get(this.itemId));
                        }
                    }
                },
                viewConfig: {autoFill: true, forceFit: false, deferEmptyText: true, emptyText: _T("Initializing...")},
                ds: new Ext.data.Store({
                    autoDestroy: true,
                    reader: new Ext.data.ArrayReader({}, [{name: 'comment'}]),
                    data: [[_T('No report available')]]
                }),
                cm: new Ext.grid.ColumnModel([{header: '', width: 120, sortable: true, dataIndex: 'comment'}])
            });
            Pan.monitor.ReportViewer.superclass.constructor.call(this, config);
        }
    });
    Pan.monitor.ScheduledReportViewer = Ext.extend(Ext.Panel, {
        exportReport: function (format) {
            var url = '/php/monitor/report.export.php?' + Ext.urlEncode({
                reportname: this.reportname,
                filename: this.selectedFilename,
                format: format,
                reporttype: this.reportType,
                vsys: Pan.monitor.downloadReportVsysScope()
            });
            window.open(url, '_blank');
        }, loadReport: function (filename) {
            var self = this;
            this.selectedFilename = filename;
            this.grid.loadMask.show();
            PanDirect.run('MonitorDirect.getReport', [{
                reportname: this.reportname,
                filename: filename,
                format: 'xml',
                reporttype: this.reportType,
                vsys: Pan.monitor.downloadReportVsysScope()
            }], function (result) {
                if (result && result.result) {
                    result.result['@filename'] = filename;
                }
                try {
                    self.grid.loadReport(result);
                }
                catch (e) {
                }
            });
        }, initialize: function () {
            if (this.initialized) return;
            this.initialized = true;
            var self = this;
            var enable_days = [];
            var re_xmlfilename = /(2\d{3})([01]\d)([0123]\d)/;
            var jsonArgs = {
                reporttype: this.reportType,
                reportname: this.reportname,
                vsys: Pan.monitor.downloadReportVsysScope()
            };
            PanDirect.run('MonitorDirect.completeReportFilenames', [jsonArgs], function (values) {
                Ext.each(values, function (v) {
                    var m = v.match(re_xmlfilename);
                    if (m) {
                        var datestr = m[1] + '/' + m[2] + '/' + m[3];
                        self.reportXmlFilenames[datestr] = v;
                        enable_days.push(datestr);
                    }
                });
                enable_days.sort();
                var enabledReObj = new EnabledDatesReObj(enable_days);
                try {
                    self.datepicker.setDisabledDates(enabledReObj);
                    if (enable_days.length > 0) {
                        self.datepicker.setMinDate(Date.parseDate(enable_days[0], 'Y/m/d'));
                        var mdatestr = enable_days[enable_days.length - 1];
                        var mdate = Date.parseDate(mdatestr, 'Y/m/d');
                        self.datepicker.setMaxDate(mdate);
                        self.datepicker.setValue(mdate);
                        self.loadReport(self.reportXmlFilenames[mdatestr]);
                    }
                }
                catch (e) {
                }
            });
        }, constructor: function (config) {
            var self = this;
            var reportname = Pan.monitor.xpathToReportnames[config.treePath];
            config.reportType = 'predefined';
            if (!reportname) {
                reportname = config.treePath.replace(/([^\/]+\/){2}/, '');
                config.reportType = 'custom';
            }
            config.reportname = reportname;
            Ext.apply(this, config);
            this.grid = new Pan.monitor.ReportViewer({});
            this.datepicker = new Pan.monitor.ReportDatePicker();
            this.reportXmlFilenames = {};
            this.datepicker.on('select', function (dp, dt) {
                self.loadReport(self.reportXmlFilenames[dt.format('Y/m/d')]);
            });
            Ext.apply(config, {
                layout: 'border',
                defaults: {border: false},
                items: [{region: "center", layout: 'fit', items: this.grid}, {
                    region: "east",
                    title: _T("Date"),
                    width: 180,
                    split: true,
                    collapsible: true,
                    layout: 'anchor',
                    items: this.datepicker
                }]
            });
            Pan.monitor.ScheduledReportViewer.superclass.constructor.call(this, config);
            this.initialize();
        }
    });
    Pan.reg("Monitor/Custom Reports", Pan.monitor.ScheduledReportViewer);
    Pan.reg("Monitor/Application Reports", Pan.monitor.ScheduledReportViewer);
    Pan.reg("Monitor/Threat Reports", Pan.monitor.ScheduledReportViewer);
    Pan.reg("Monitor/URL Filtering Reports", Pan.monitor.ScheduledReportViewer);
    Pan.reg("Monitor/Traffic Reports", Pan.monitor.ScheduledReportViewer);
})();
Ext.ns('Pan.monitor');
(function () {
    function EnabledDatesReObj(arr) {
        this.enabledDates = arr;
    }

    EnabledDatesReObj.prototype.test = function (str) {
        return (this.enabledDates.indexOf(str) == -1);
    };
    Pan.monitor.AccordionReportViewer = Ext.extend(Ext.Panel, {
        exportReport: function (format) {
            var url = '/php/monitor/report.export.php?' + Ext.urlEncode({
                reportname: this.reportname,
                filename: this.selectedFilename,
                format: format,
                reporttype: this.reportType,
                vsys: Pan.monitor.downloadReportVsysScope()
            });
            window.open(url, '_blank');
        }, loadReport: function (filename) {
            var self = this;
            this.selectedFilename = filename;
            this.grid.loadMask.show();
            var vsys = Pan.monitor.downloadReportVsysScope();
            var fullpath = '/opt/pancfg/mgmt/';
            switch (this.reportType) {
                case'predefined':
                    fullpath += 'reports/';
                    break;
                case'custom':
                    if (vsys != '' && vsys != "shared") {
                        if (Pan.global.isCms()) {
                            fullpath += 'dg-reports/' + vsys + '/custom-reports/';
                        }
                        else {
                            fullpath += 'vsys-reports/' + vsys + '/custom-reports/';
                        }
                    }
                    else {
                        fullpath += 'custom-reports/';
                    }
                    break;
                case'summary':
                    fullpath += 'pdf-reports/';
                    break;
            }
            fullpath += this.reportname + '/' + filename;
            PanDirect.run('MonitorDirect.getReport', [{
                reportname: this.reportname,
                filename: filename,
                format: 'xml',
                reporttype: this.reportType,
                vsys: vsys
            }], function (result) {
                if (result && result.result) {
                    result.result['@filename'] = filename;
                    result.result['@fullpath'] = fullpath;
                }
                self.grid.loadReport(result);
            });
        }, initialize: function (treePath) {
            var reportname = Pan.monitor.xpathToReportnames['Monitor/' + treePath];
            this.reportType = 'predefined';
            if (!reportname) {
                if (treePath.indexOf('PDF Summary Reports') == 0) {
                    this.reportType = 'summary';
                }
                else {
                    this.reportType = 'custom';
                }
                reportname = treePath.replace(/([^\/]+\/)/, '');
            }
            this.reportname = reportname;
            var self = this;
            var enable_days = [];
            var re_xmlfilename = /(2\d{3})([01]\d)([0123]\d)/;
            var jsonArgs = {
                reporttype: this.reportType,
                reportname: this.reportname,
                vsys: Pan.monitor.downloadReportVsysScope()
            };
            this.reportXmlFilenames = {};
            PanDirect.run('MonitorDirect.completeReportFilenames', [jsonArgs], function (values) {
                var reportloaded = false;
                Ext.each(values, function (v) {
                    var m = v.match(re_xmlfilename);
                    if (m) {
                        var datestr = m[1] + '/' + m[2] + '/' + m[3];
                        self.reportXmlFilenames[datestr] = v;
                        enable_days.push(datestr);
                    }
                });
                enable_days.sort();
                var enabledReObj = new EnabledDatesReObj(enable_days);
                self.datepicker.setDisabledDates(enabledReObj);
                if (enable_days.length > 0) {
                    self.datepicker.setMinDate(Date.parseDate(enable_days[0], 'Y/m/d'));
                    var mdatestr = enable_days[enable_days.length - 1];
                    var mdate = Date.parseDate(mdatestr, 'Y/m/d');
                    self.datepicker.setMaxDate(mdate);
                    self.datepicker.setValue(mdate);
                    if (self.reportType == 'summary') {
                        self.grid.loadReport({emptyText: _T('Please select a date on the right to download pdf report')});
                    }
                    else {
                        self.loadReport(self.reportXmlFilenames[mdatestr]);
                        reportloaded = true;
                    }
                }
                if (!reportloaded) {
                    self.grid.loadReport({});
                }
            });
        }, constructor: function (config) {
            var self = this;
            this.treeNodes = {};
            this.reportXmlFilenames = {};
            Ext.apply(this, config);
            this.grid = new Pan.monitor.ReportViewer({columnsHideable: true});
            this.datepicker = new Pan.monitor.ReportDatePicker();
            var enabledReObj = new EnabledDatesReObj([]);
            this.datepicker.setDisabledDates(enabledReObj);
            this.datepicker.on('select', function (dp, dt) {
                var file = self.reportXmlFilenames[dt.format('Y/m/d')];
                if (file) {
                    if (self.reportType == 'summary') {
                        self.selectedFilename = file;
                        self.exportReport('');
                    }
                    else {
                        self.loadReport(file);
                    }
                }
            });
            Ext.apply(config, {
                layout: 'border',
                defaults: {border: false},
                items: [{region: "center", layout: 'fit', items: this.grid}, {
                    region: "east", width: 180, split: true, layout: {type: 'vbox', align: 'stretch'}, items: [{
                        xtype: 'panel', flex: 1, frame: false, width: 180, layout: 'accordion', listeners: {
                            'render': function (accordion) {
                                var m = new Pan.base.widgets.LoadMask(this.el, {});
                                m.show();
                                PanDirect.run('MonitorDirect.getAccordionReportNamesJson', [Pan.monitor.vsysScope()], function (result) {
                                    Pan.monitor.ManageCustomReport.scheduledReportNames = eval('(' + result + ')');
                                    var accordionItems = [];
                                    Ext.each(Pan.monitor.ManageCustomReport.scheduledReportNames, function (report) {
                                        var nodeconfig = {
                                            text: report[0],
                                            value: report[0],
                                            iconCls: 'icon-report',
                                            children: []
                                        };
                                        for (var i = 0; i < report[1].length; i++) {
                                            nodeconfig.children.push({
                                                text: report[1][i],
                                                value: report[1][i],
                                                iconCls: 'icon-report',
                                                leaf: true
                                            });
                                        }
                                        var treePanel = new Ext.tree.TreePanel({
                                            width: 180,
                                            flex: 1,
                                            rootVisible: false,
                                            useArrows: true,
                                            autoScroll: true,
                                            containerScroll: true,
                                            border: false,
                                            frame: false,
                                            root: new Pan.base.tree.TreeNode(nodeconfig)
                                        });
                                        treePanel.on('click', function (node) {
                                            var path = node.getMenuPath();
                                            self.initialize(path);
                                            var parent = node.parentNode.text;
                                            for (var n in self.treeNodes) {
                                                if (self.treeNodes.hasOwnProperty(n)) {
                                                    if (n != parent) {
                                                        node = self.treeNodes[n].getSelectionModel().getSelectedNode();
                                                        if (node) {
                                                            node.unselect();
                                                        }
                                                    }
                                                }
                                            }
                                        });
                                        self.treeNodes[report[0]] = treePanel;
                                        var accordionItem = {
                                            xtype: 'panel',
                                            layout: 'fit',
                                            title: report[0],
                                            items: treePanel
                                        };
                                        accordionItems.push(accordionItem);
                                    });
                                    m.hide();
                                    m.destroy();
                                    accordion.add(accordionItems);
                                    accordion.doLayout();
                                });
                            }
                        }
                    }, this.datepicker]
                }]
            });
            Pan.monitor.AccordionReportViewer.superclass.constructor.call(this, config);
        }
    });
    Pan.reg("Monitor/Reports", Pan.monitor.AccordionReportViewer);
})();
Ext.ns('Pan.monitor.ManagePdfSummary');
Ext.apply(Pan.monitor.ManagePdfSummary, {
    reportWidgetColumn: function (w) {
        var col = 0;
        var c = parseInt(w.column, 10);
        if (!isNaN(c)) {
            col = c - 1;
        }
        return col;
    }, reportWidgetRow: function (w) {
        var row = 0;
        var c = parseInt(w.row, 10);
        if (!isNaN(c)) {
            row = c - 1;
        }
        return row;
    }, menuItemclickHandler: function (item) {
        item.setChecked(!item.checked);
        return false;
    }, DESTINATEDCOLUMN: false
});
Pan.monitor.ManagePdfSummary.Editor = Ext.extend(Ext.ux.Portal, {
    beforecheckchange: function (item, checked) {
        if (!checked) {
            return true;
        }
        var total = 0;
        for (var i = 0; i < 3; i = i + 1) {
            var col = this.columns[i];
            total += col.items.length;
        }
        if (total < 18) {
            return true;
        }
        Pan.base.msg.warn('You can have at most 18 items in this layout.');
        return false;
    }, checkchange: function (item, checked) {
        if (checked) {
            this.addWidget(item);
        }
        else {
            this.removeWidget(item);
        }
    }, removeWidget: function (item) {
        var portal = this;
        var panel = Ext.getCmp(item.id + '-panel');
        if (panel) {
            var col = panel.ownerCt.id;
            var colNum = col.slice(-1);
            var portlet = portal.items.items[colNum];
            portlet.remove(panel);
        }
    }, findColumn: function () {
        if (Pan.monitor.ManagePdfSummary.DESTINATEDCOLUMN !== false && this.columns[Pan.monitor.ManagePdfSummary.DESTINATEDCOLUMN]) {
            return Pan.monitor.ManagePdfSummary.DESTINATEDCOLUMN;
        }
        for (var i = 0; i < 3; i = i + 1) {
            var col = this.columns[i];
            if (col.items.length < 6) {
                return i;
            }
        }
        return -1;
    }, addWidget: function (item) {
        var portal = this;
        var col = this.findColumn();
        if (col != -1) {
            var portlet = portal.items.items[col];
            var chartType = Pan.monitor.ManagePdfSummary.widgetDefinitions[item.id]['chart-type'];
            portlet.add({
                'title': '<img align="left" src="/images/pdfReports/' + chartType + '.gif"> ' + item.text,
                'id': item.id + '-panel',
                bodyStyle: {height: '1px'},
                'tools': [{
                    'id': 'close', 'handler': function (e, target, panel) {
                        var el = Ext.getCmp(panel.id.replace(/-panel$/, ''));
                        if (el) {
                            el.setChecked(false);
                        }
                    }
                }],
                collapsible: false
            });
            portlet.doLayout();
        }
    }, isValid: function () {
        var atLeastOneWidget = false;
        for (var column = 0; column < 3; column = column + 1) {
            var col = this.columns[column];
            if (col.items.length > 0) {
                atLeastOneWidget = true;
            }
            if (col.items.length > 6) {
                return false;
            }
        }
        return atLeastOneWidget;
    }, validate: function () {
        var atLeastOneWidget = false;
        for (var column = 0; column < 3; column = column + 1) {
            var col = this.columns[column];
            if (col.items.length > 0) {
                atLeastOneWidget = true;
            }
            if (col.items.length > 6) {
                Pan.base.msg.warn(_T('You cannot have more than 6 widgets in column {column}.', {column: column + 1}));
                return false;
            }
        }
        if (!atLeastOneWidget) {
            if (Pan.global.getLocVal() && Pan.global.getLocVal().indexOf('vsys') >= 0) {
                Pan.base.msg.warn(_T('PDF summary must contain at least one report. Please add a daily scheduled custom report.'));
            }
            else {
                Pan.base.msg.warn(_T('PDF summary must contain at least one report. Please add a predefined report or a daily scheduled custom report.'));
            }
            return false;
        }
        return true;
    }, populateNewPdfSummaryReport: function () {
        var i = 0;
        for (var n in Pan.monitor.ManagePdfSummary.widgetDefinitions) {
            if (Pan.monitor.ManagePdfSummary.widgetDefinitions.hasOwnProperty(n)) {
                if (i >= 18) {
                    break;
                }
                else {
                    var el = Ext.getCmp(n);
                    if (el) {
                        el.setChecked(true);
                        ++i;
                    }
                }
            }
        }
    }, setValue: function (report) {
        this.record = report;
        var predefined = Pan.base.json.path(report, '$.predefined-widget.entry');
        var custom = Pan.base.json.path(report, '$.custom-widget.entry');
        var widgets = [[], [], []];
        var chartType, checkItem, col, arr;
        Ext.each(predefined, function (w) {
            chartType = w['chart-type'] || 'table';
            checkItem = Ext.getCmp('predefined-' + w['@name'] + '-' + chartType);
            if (checkItem) {
                col = Pan.monitor.ManagePdfSummary.reportWidgetColumn(w);
                arr = widgets[col];
                arr.push({item: checkItem, column: col, row: Pan.monitor.ManagePdfSummary.reportWidgetRow(w)});
            }
        });
        Ext.each(custom, function (w) {
            checkItem = Ext.getCmp('custom-' + w['@name'] + '-table');
            if (checkItem) {
                col = Pan.monitor.ManagePdfSummary.reportWidgetColumn(w);
                arr = widgets[col];
                arr.push({item: checkItem, column: col, row: Pan.monitor.ManagePdfSummary.reportWidgetRow(w)});
            }
        });
        for (col = 0; col < 3; col++) {
            Pan.monitor.ManagePdfSummary.DESTINATEDCOLUMN = col;
            arr = widgets[col];
            arr.sort(function (a, b) {
                if (a.row == b.row) {
                    return 0;
                }
                else {
                    if (a.row > b.row) {
                        return 1;
                    }
                    else {
                        return -1;
                    }
                }
            });
            Ext.each(arr, function (item) {
                item.item.setChecked(true);
            });
        }
        Pan.monitor.ManagePdfSummary.DESTINATEDCOLUMN = false;
    }, isDirty: function () {
        return true;
    }, customSave: true, getValue: function () {
        var predefined = [];
        var custom = [];
        for (var column = 0; column < 3; column = column + 1) {
            var col = Ext.getCmp('col' + column);
            for (var row = 0; row < col.items.length; row = row + 1) {
                var widget = col.items.items[row];
                var w = Pan.monitor.ManagePdfSummary.widgetDefinitions[widget.id.replace(/-panel$/, '')];
                var obj = {'@name': w['name'], 'chart-type': w['chart-type'], column: column + 1, row: row + 1};
                if (w['custom']) {
                    custom.push(obj);
                }
                else {
                    predefined.push(obj);
                }
            }
        }
        if (Pan.monitor.isSharedSchema()) {
            this.record['predefined-widget'] = {entry: predefined};
        }
        this.record['custom-widget'] = {entry: custom};
        this.record["@__recordInfo"].xpathId = Pan.base.defaultXpathId();
        return this.record;
    }, serverfields: [_T('Trend Reports')], buildToolbar: function (record) {
        var checkItemListeners = {
            beforecheckchange: this.beforecheckchange.createDelegate(this),
            checkchange: this.checkchange.createDelegate(this)
        };
        var items = [];
        var chartTypeDescription = function (report) {
            switch (report['chart-type']) {
                case'line':
                    return ' (' + _T('Line Chart') + ')';
                case'pie':
                    return ' (' + _T('Pie Chart') + ')';
                case'bar':
                    return ' (' + _T('Bar Chart') + ')';
                default:
                    return '';
            }
        };
        var predefineMenus = {};
        for (var id in Pan.monitor.ManagePdfSummary.widgetDefinitions) {
            if (Pan.monitor.ManagePdfSummary.widgetDefinitions.hasOwnProperty(id)) {
                var report = Pan.monitor.ManagePdfSummary.widgetDefinitions[id];
                if (report.group) {
                    if (report.name) {
                        if (!Pan.global.CONTEXT.isGTPEnabled && report.name.indexOf('gtp-') >= 0) {
                            continue;
                        }
                        if (!Pan.global.CONTEXT.isSCTPEnabled && report.name.indexOf('sctp-') >= 0) {
                            continue;
                        }
                    }
                    if (predefineMenus[report.group] == undefined) {
                        predefineMenus[report.group] = [];
                    }
                    predefineMenus[report.group].push({
                        id: id,
                        text: Pan.i18n(report.caption) + chartTypeDescription(report),
                        listeners: checkItemListeners,
                        checked: false
                    });
                }
            }
        }
        if (Pan.monitor.isSharedSchema()) {
            for (var group in predefineMenus) {
                if (predefineMenus.hasOwnProperty(group)) {
                    var menu = {
                        id: group,
                        listeners: {itemclick: Pan.monitor.ManagePdfSummary.menuItemclickHandler},
                        items: predefineMenus[group]
                    };
                    items.push({
                        text: menu.id,
                        menu: new Ext.menu.Menu(menu),
                        cls: 'x-btn-text-icon',
                        iconCls: 'icon-report-group'
                    });
                }
            }
        }
        var entries = Pan.base.json.path(record, '$.store.__extraInfo.custom-reports');
        if (entries && entries[0]) {
            var customReportMenu = new Ext.menu.Menu({
                listeners: {'itemclick': Pan.monitor.ManagePdfSummary.menuItemclickHandler},
                id: 'Custom Reports'
            });
            Ext.each(entries, function (entry) {
                var id = 'custom-' + entry.name + '-table';
                Pan.monitor.ManagePdfSummary.widgetDefinitions[id] = {
                    name: entry.name,
                    'chart-type': 'table',
                    caption: entry.caption,
                    custom: true
                };
                customReportMenu.add({text: entry.caption, id: id, checked: false, listeners: checkItemListeners});
            });
            items.push({
                text: customReportMenu.id,
                cls: 'x-btn-text-icon',
                iconCls: 'icon-report-group',
                menu: customReportMenu
            });
        }
        return items;
    }, constructor: function (config) {
        var record = config.getRecord();
        this.columns = [];
        for (var i = 0; i < 3; i++) {
            var style = i == 2 ? 'padding:10px' : 'padding:10px 0 10px 10px';
            this.columns.push(new Ext.ux.PortalColumn({'id': 'col' + i, 'columnWidth': 0.33, 'style': style}));
        }
        Ext.apply(this, {
            hideBorders: true,
            frame: false,
            border: false,
            monitorResize: true,
            tbar: this.buildToolbar(record),
            'items': this.columns
        });
        Ext.applyIf(this, Pan.base.autorender.GridRecordField.prototype);
        Pan.monitor.ManagePdfSummary.Editor.superclass.constructor.apply(this, arguments);
        if (record.phantom) {
            this.on('afterrender', this.populateNewPdfSummaryReport.createDelegate(this));
        }
    }
});
Ext.applyIf(Pan.monitor.ManagePdfSummary.Editor.prototype, Pan.base.autorender.GridRecordField.prototype);
Ext.reg('pan-managepdfsummary-editor', Pan.monitor.ManagePdfSummary.Editor);
Pan.monitor.ManagePdfSummary.Helper = {
    getPredefinedWidget: function (obj) {
        return jsonPath(obj.__record, '$.predefined-widget.entry[*].@name') || '';
    }, getCustomWidget: function (obj) {
        return jsonPath(obj.__record, '$.custom-widget.entry[*].@name') || '';
    }
};
Pan.monitor.ManagePdfSummary.Viewer = Ext.extend(Pan.monitor.MonitorViewer, {
    storeInputs: {objectType: _T("PDF Summary Report")},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: 'ManagePdfSummary',
            api: {readSchema: Pan.appframework.schema.getVsysOrDgSchema("pdf-summary-report")}
        }
    },
    fields: [Pan.monitor.MonitorViewer.prototype.fieldConfig.createName(), {
        name: 'predefined-widget',
        dataMap: Pan.monitor.ManagePdfSummary.Helper.getPredefinedWidget,
        saveMap: undefined
    }, {name: 'custom-widget', dataMap: Pan.monitor.ManagePdfSummary.Helper.getCustomWidget, saveMap: undefined}],
    columns: [Pan.monitor.MonitorViewer.prototype.columnConfig.name, {
        dataIndex: 'predefined-widget',
        header: _T('Predefined Widgets'),
        width: 200,
        hidden: Pan.global.isMultiVsys() && Pan.global.getLocVal(),
        sortable: true
    }, {dataIndex: 'custom-widget', header: _T('Custom Widgets'), width: 200, sortable: true}],
    recordForm: {
        columnCount: 1,
        windowConfig: {width: 750},
        items: [{itemId: 'name'}, Pan.monitor._locationField, {
            itemId: '$',
            hideLabel: true,
            height: 380,
            border: false,
            xtype: 'pan-managepdfsummary-editor'
        }]
    }
});
Pan.reg("Monitor/PDF Reports/Manage PDF Summary", Pan.monitor.ManagePdfSummary.Viewer);
Ext.ns('Pan.monitor.botnet');
Pan.monitor.botnet.pollJob = function (jobid, panel) {
    PanDirect.run('PanDirect.pollJob', [jobid], function (result) {
        var status = Pan.base.json.path(result, '$.result.job.status');
        var jobresult = Pan.base.json.path(result, '$.result.job.result');
        var filename = Pan.base.json.path(result, '$.result.job.resultfile');
        if (status == 'PEND' || status == 'ACT') {
            setTimeout(function () {
                Pan.monitor.botnet.pollJob(jobid, panel);
            }, 1500);
            return;
        }
        if (status == 'FIN' && jobresult == 'OK' && filename) {
            var filenameRef = filename;
            PanDirect.run('MonitorDirect.loadBotnetReportJob', [filename], function (result) {
                if (result && result.result) {
                    result.result['@fullpath'] = filenameRef;
                }
                panel.update('');
                var grid = new Pan.monitor.ReportViewer({});
                panel.add(grid);
                panel.doLayout();
                grid.loadReport(result);
            });
        }
        else {
            var msg = Pan.base.json.path(result, '$.result.job.details.line', 'Fail to run report');
            panel.update(msg);
        }
    });
};
Pan.monitor.botnet.ReportEditor = Ext.extend(Pan.base.container.TabPanel, {
    validate: function () {
        if (this.validatedOnce) {
        }
        this.validatedOnce = true;
        return true;
    }, setValue: function (record) {
        this.record = record;
    }, isDirty: function () {
        return true;
    }, customSave: true, getValue: function () {
    }, runReport: function () {
        var w = this.get(0).getWidth();
        var h = this.ownerCt.ownerCt.ownerCt.getHeight() - 80;
        var tabid = Ext.id();
        var html = '<div style=\'width:' + w + 'px;height:' + h + 'px;position: relative;\'><div class=\'ext-el-mask\'></div><div class=\'ext-el-mask-msg x-mask-loading\' style=\'left: ' + (w / 2 - 25) + 'px; top: ' + h / 2 + 'px;\'><div>Loading...</div></div></div>';
        var panel = new Ext.Panel({
            id: tabid,
            title: _T('Botnet Report'),
            closable: true,
            layout: 'fit',
            html: html,
            height: h
        });
        this.add(panel);
        this.activate(tabid);
        var firsttab = this.items.items[0];
        var toptb = firsttab.getTopToolbar();
        var period = toptb.find('name', 'time-frame')[0].getValue();
        var query = this.find('itemId', '$.query')[0].getValue();
        var topn = this.find('itemId', '$.topn')[0].getValue();
        PanDirect.run('MonitorDirect.startBotnetReportJob', [period, topn || 50, query || ''], function (result) {
            var jobid = Pan.base.json.path(result, '$.result.job');
            if (jobid == '0' || jobid) {
                Pan.monitor.botnet.pollJob(jobid, panel);
            }
            else {
                panel.update('Fail to start report job');
            }
        });
    }, buildUI: function () {
        var timeframe = {
            itemId: 'time-frame',
            name: 'time-frame',
            xtype: 'pan-selectbox',
            store: [["last-24-hrs", _T('Last 24 Hours')], ["last-calendar-day", _T("Last Calendar Day")]]
        };
        var scheduled = {itemId: '$.scheduled'};
        var topn = {
            itemId: '$.topn',
            fieldLabel: _T('No. of Rows'),
            boxMaxWidth: 50,
            xtype: 'pan-selectbox',
            store: (function () {
                var data = [];
                var i = 5;
                while (i <= 500) {
                    data.push(i);
                    if (i < 50) {
                        i += 5;
                    }
                    else if (i < 100) {
                        i += 25;
                    }
                    else {
                        i += 50;
                    }
                }
                return data;
            })()
        };
        var query = new Ext.form.TextArea({
            fieldLabel: _T('Query'),
            height: 80,
            xtype: 'pan-textarea',
            anchor: '100%',
            itemId: '$.query'
        });
        var filterbuilderform = {
            flex: 1,
            xtype: 'pan-fieldset',
            title: _T('Query Builder'),
            layout: 'vbox',
            layoutConfig: {align: 'stretch'},
            items: [query, {
                style: 'padding-top: 5',
                flex: 1,
                xtype: 'Pan.monitor.log.FilterBuilderForm',
                logtype: 'url',
                filters: ['zone', 'zone.src', 'zone.dst', 'addr', 'addr.src', 'addr.dst', 'user', 'user.src', 'user.dst'],
                target: query
            }]
        };
        var configTab = {
            xtype: 'panel',
            bodyStyle: 'padding:10',
            title: _T('Report Setting'),
            tbar: {
                items: [_T('Test Run Time frame') + ':', timeframe, {
                    iconCls: 'icon-run',
                    width: 100,
                    scope: this,
                    handler: this.runReport,
                    text: _T('Run Now')
                }]
            },
            layout: 'vbox',
            layoutConfig: {align: 'stretch'},
            items: [{
                xtype: 'pan-container',
                layout: 'form',
                items: [{
                    xtype: 'pan-container',
                    rfLayoutConfig: Pan.base.autorender.layout.RFColumnLayoutConfig,
                    columnCount: 2,
                    items: [topn, scheduled]
                }]
            }, filterbuilderform]
        };
        Ext.apply(this, {
            id: 'manageCustomReportTabPanel',
            activeTab: 0,
            bodyStyle: 'padding:0; margin:0',
            layoutOnTabChange: true,
            items: configTab
        });
    }, constructor: function () {
        this.validatedOnce = false;
        this.buildUI();
        Pan.monitor.botnet.ReportEditor.superclass.constructor.apply(this, arguments);
    }
});
Ext.applyIf(Pan.monitor.botnet.ReportEditor.prototype, Pan.base.autorender.GridRecordField.prototype);
Ext.reg('Pan.monitor.botnet.ReportEditor', Pan.monitor.botnet.ReportEditor);
Pan.monitor.botnet.ReportViewer = Ext.extend(Pan.appframework.modelview.PanRecordFormViewer, {
    constructor: function (config) {
        config = config || {};
        config.rbaPath = "monitor/botnet";
        Pan.monitor.botnet.ReportViewer.superclass.constructor.call(this, config);
    },
    useToolbarAddAction: false,
    useToolbarDeleteAction: false,
    useToolbarCloneAction: false,
    useCheckBoxSelection: false,
    storeInputs: {objectType: _T('Botnet Report')},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: 'BotnetReport',
            api: {readSchema: "$.config.shared.botnet.report"}
        }
    },
    fields: [{name: 'name', attrPath: '@name'}, {
        name: '$', saveMap: function () {
        }
    }],
    recordForm: {
        windowConfig: {
            maximizable: true,
            width: 800,
            height: 500,
            resizable: true,
            autoHeight: false,
            helpTopic: 'botnet_reports'
        },
        rfLayoutConfig: Pan.base.autorender.layout.RFTableLayoutConfig,
        cls: 'darkblue-container',
        items: [{itemId: '$', xtype: 'Pan.monitor.botnet.ReportEditor', vflex: true}]
    },
    storeConfig: {ztype: Pan.appframework.modelview.PanGridStore, includeFieldPathsInSave: false}
});
Pan.reg("Monitor/Botnet/Manage Report", Pan.monitor.botnet.ReportViewer);
(function () {
    var fields = [{name: 'name', attrPath: '@name'}, {
        name: '$.unknown-applications.unknown-tcp',
        childrenNames: ["$.unknown-applications.unknown-tcp.sessions-per-hour", "$.unknown-applications.unknown-tcp.destinations-per-hour", "$.unknown-applications.unknown-tcp.session-length.minimum-bytes", "$.unknown-applications.unknown-tcp.session-length.maximum-bytes"],
        uiHint: {builder: 'PropertyGridBuilder', title: _T('Unknown TCP')}
    }, {
        name: '$.unknown-applications.unknown-udp',
        childrenNames: ["$.unknown-applications.unknown-udp.sessions-per-hour", "$.unknown-applications.unknown-udp.destinations-per-hour", "$.unknown-applications.unknown-udp.session-length.minimum-bytes", "$.unknown-applications.unknown-udp.session-length.maximum-bytes"],
        uiHint: {builder: 'PropertyGridBuilder', title: _T('Unknown UDP')}
    }, {
        name: '$.unknown-applications',
        childrenNames: ['$.unknown-applications.unknown-tcp', '$.unknown-applications.unknown-udp'],
        uiHint: {
            builder: 'FieldSetBuilder',
            rfLayoutConfig: Pan.base.autorender.layout.RFColumnLayoutConfig,
            columnCount: 2
        }
    }, {
        name: '$.other-applications',
        childrenNames: ["$.other-applications.irc"],
        uiHint: {
            builder: 'FieldSetBuilder',
            labelWidth: 10,
            autoHeight: false,
            association: {
                match: {evaluate: 'fieldEvt', operands: {field: '$.unknown-applications', event: 'resize'}},
                exec: {
                    evaluate: 'fieldFn',
                    operands: {
                        fn: 'setHeight',
                        operands: [{evaluate: 'fieldFn', operands: {fn: 'getHeight', field: '$.unknown-applications'}}]
                    }
                }
            }
        }
    }, {
        name: 'http-applications',
        childrenNames: ['$.http'],
        uiHint: {fieldLabel: _T('HTTP Traffic'), builder: 'FieldSetBuilder'}
    }, {
        name: '$.http',
        uiHint: {
            builder: 'PropertyGridBuilder',
            isMultiProperty: true,
            fieldLabel: _T('Event'),
            titleColumnConfig: {width: 230, fixed: true}
        }
    }, {
        name: "$.http.malware-sites",
        uiHint: {fieldLabel: _T('Malware URL visit')},
        additionalChildrenNames: ["$.http.malware-sites.description"]
    }, {
        name: "$.http.malware-sites.enabled",
        uiHint: {fieldLabel: _T('Enable'), columnConfig: {width: 50, fixed: true}}
    }, {
        name: "$.http.malware-sites.threshold",
        uiHint: {fieldLabel: _T('Count'), columnConfig: {width: 50, fixed: true}}
    }, {
        name: "$.http.malware-sites.description",
        attrName: 'description',
        type: "string",
        uiHint: {fieldLabel: _T('Description'), columnConfig: {editor: {}}},
        defaultValue: _T('Identifies users communicating with known malware URLs based on Malware and Botnet URL filtering categories')
    }, {
        name: "$.http.dynamic-dns",
        uiHint: {fieldLabel: _T('Use of dynamic DNS'), columnConfig: {editor: {}}},
        additionalChildrenNames: ["$.http.dynamic-dns.description"]
    }, {
        name: "$.http.dynamic-dns.description",
        attrName: 'description',
        type: "string",
        uiHint: {columnConfig: {editor: {}}},
        defaultValue: _T('Looks for dynamic DNS query traffic which could be indicative of botnet communication')
    }, {
        name: "$.http.recent-domains",
        uiHint: {fieldLabel: _T('Browsing to recently registered domains'), columnConfig: {editor: {}}},
        additionalChildrenNames: ["$.http.recent-domains.description"]
    }, {
        name: "$.http.recent-domains.description",
        attrName: 'description',
        type: "string",
        uiHint: {columnConfig: {editor: {}}},
        defaultValue: _T('Looks for traffic to domains that have been registered within the last 30 days')
    }, {
        name: "$.http.ip-domains",
        uiHint: {fieldLabel: _T('Browsing to IP domains'), columnConfig: {editor: {}}},
        additionalChildrenNames: ["$.http.ip-domains.description"]
    }, {
        name: "$.http.ip-domains.description",
        attrName: 'description',
        type: "string",
        uiHint: {columnConfig: {editor: {}}},
        defaultValue: _T('Identifies users that browse to IP domains instead of URLs')
    }, {
        name: "$.http.executables-from-unknown-sites",
        uiHint: {fieldLabel: _T('Executable files from unknown sites'), columnConfig: {editor: {}}},
        additionalChildrenNames: ["$.http.executables-from-unknown-sites.description"]
    }, {
        name: "$.http.executables-from-unknown-sites.description",
        attrName: 'description',
        type: "string",
        uiHint: {columnConfig: {editor: {}}},
        defaultValue: _T('Identifies executable files downloaded from unknown URLs')
    }, {
        name: 'root',
        uiHint: {
            rfLayoutConfig: Pan.base.autorender.layout.SimpleLayoutConfig,
            rfLayoutMap: [['http-applications', '-', '-', '-'], ['$.unknown-applications', '-', '-', '$.other-applications']]
        },
        childrenNames: ['http-applications', '$.unknown-applications', '$.other-applications']
    }];
    Pan.monitor.botnet.ConfigViewer = Ext.extend(Pan.appframework.modelview.PanRecordFormViewer, {
        constructor: function (config) {
            config = config || {};
            config.rbaPath = "monitor/botnet";
            Pan.monitor.botnet.ConfigViewer.superclass.constructor.call(this, config);
        },
        useToolbarAddAction: false,
        useToolbarDeleteAction: false,
        useToolbarCloneAction: false,
        useCheckBoxSelection: false,
        storeInputs: {objectType: _T('Botnet Configuration')},
        recordBinderOverride: {
            dataProxyAPI: {
                remoteClass: 'BotnetConfiguration',
                api: {readSchema: "$.config.shared.botnet.configuration"}
            }
        },
        fields: fields,
        recordForm: {windowConfig: {width: 700, minWidth: 700, helpTopic: 'botnet_config'}, items: [{itemId: 'root'}]},
        storeConfig: {ztype: Pan.appframework.modelview.PanGridStore}
    });
    Pan.reg("Monitor/Botnet/Configuration", Pan.monitor.botnet.ConfigViewer);
})();
Ext.ns('Pan.monitor.botnet');
(function () {
    function EnabledDatesReObj(arr) {
        this.enabledDates = arr;
    }

    EnabledDatesReObj.prototype.test = function (str) {
        return (this.enabledDates.indexOf(str) == -1);
    };
    Pan.monitor.botnet.Viewer = Ext.extend(Ext.Panel, {
        exportReport: function (format) {
            var url = '/php/monitor/report.export.php?' + Ext.urlEncode({
                reportname: this.reportname,
                filename: this.selectedFilename,
                format: format,
                reporttype: this.reportType,
                vsys: Pan.monitor.downloadReportVsysScope()
            });
            window.open(url, '_blank');
        }, loadReport: function (filename) {
            var self = this;
            this.selectedFilename = filename;
            this.grid.loadMask.show();
            PanDirect.run('MonitorDirect.getReport', [{
                reportname: this.reportname,
                filename: filename,
                format: 'xml',
                reporttype: this.reportType,
                vsys: Pan.monitor.downloadReportVsysScope()
            }], function (result) {
                if (result && result.result) {
                    result.result['@filename'] = filename;
                    var scope = Pan.monitor.vsysScope();
                    if (['', 'shared'].indexOf(scope) >= 0) {
                        result.result['@fullpath'] = '/opt/pancfg/mgmt/reports/botnet/' + filename;
                    }
                    else {
                        scope = scope.replace(/[^a-zA-Z0-9_-]+/g, '');
                        result.result['@fullpath'] = '/opt/pancfg/mgmt/vsys-reports/' + scope + '/botnet/' + filename;
                    }
                    result.result['@filename'] = filename;
                }
                try {
                    self.grid.loadReport(result);
                }
                catch (e) {
                }
            });
        }, initialize: function () {
            if (this.initialized) return;
            this.initialized = true;
            var self = this;
            var enable_days = [];
            var re_xmlfilename = /(2\d{3})([01]\d)([0123]\d)/;
            var jsonArgs = {
                reporttype: this.reportType,
                reportname: this.reportname,
                vsys: Pan.monitor.downloadReportVsysScope()
            };
            PanDirect.run('MonitorDirect.completeReportFilenames', [jsonArgs], function (values) {
                Ext.each(values, function (v) {
                    var m = v.match(re_xmlfilename);
                    if (m) {
                        var datestr = m[1] + '/' + m[2] + '/' + m[3];
                        self.reportXmlFilenames[datestr] = v;
                        enable_days.push(datestr);
                    }
                });
                enable_days.sort();
                var enabledReObj = new EnabledDatesReObj(enable_days);
                try {
                    self.datepicker.setDisabledDates(enabledReObj);
                    if (enable_days.length > 0) {
                        self.datepicker.setMinDate(Date.parseDate(enable_days[0], 'Y/m/d'));
                        var mdatestr = enable_days[enable_days.length - 1];
                        var mdate = Date.parseDate(mdatestr, 'Y/m/d');
                        self.datepicker.setMaxDate(mdate);
                        self.datepicker.setValue(mdate);
                        self.loadReport(self.reportXmlFilenames[mdatestr]);
                    }
                }
                catch (e) {
                }
            });
        }, constructor: function (config) {
            var self = this;
            var reportname = 'botnet';
            config.reportType = 'predefined';
            config.reportname = reportname;
            Ext.apply(this, config);
            this.grid = new Pan.monitor.ReportViewer({});
            this.datepicker = new Pan.monitor.ReportDatePicker();
            this.reportXmlFilenames = {};
            this.datepicker.on('select', function (dp, dt) {
                self.loadReport(self.reportXmlFilenames[dt.format('Y/m/d')]);
            });
            Ext.apply(config, {
                layout: 'border',
                defaults: {border: false},
                items: [{region: "center", layout: 'fit', items: this.grid}, {
                    region: "east",
                    title: _T("Date"),
                    width: 180,
                    split: true,
                    collapsible: true,
                    layout: {type: 'vbox', padding: 5, align: 'stretch'},
                    items: [this.datepicker, {xtype: 'container', html: '&#160;', height: 25}, {
                        xtype: 'pan-linkbutton',
                        text: _T('Configuration'),
                        handler: function () {
                            new Pan.appframework.action.PanViewerWindowAction({treePath: "Monitor/Botnet/Configuration"}).execute();
                        }
                    }, {
                        xtype: 'pan-linkbutton', text: _T('Report Setting'), handler: function () {
                            new Pan.appframework.action.PanViewerWindowAction({
                                cls: "darkblue-container",
                                treePath: "Monitor/Botnet/Manage Report"
                            }).execute();
                        }
                    }]
                }]
            });
            Pan.monitor.ScheduledReportViewer.superclass.constructor.call(this, config);
            this.initialize();
        }
    });
    Pan.reg("Monitor/Botnet", Pan.monitor.botnet.Viewer);
})();
Ext.ns('Pan.monitor.blockIpList');
(function () {
    Ext.apply(Pan.monitor.blockIpList, {
        filterRenderer: function (val, column, record) {
            var vsys = record.get('vsys');
            if (val == 'True') val = 'yes';
            if (val == 'False') val = 'no';
            var template = '<a class="subtle x-hyperlink" onclick="Pan.monitor.blockIpList.addFilter(\'{0}\', \'{1}\', \'{2}\');"><span>{1}</span></a>';
            return String.format(template, this.dataIndex, val, vsys);
        }, textRenderer: function (val) {
            var template;
            template = '<span>{0}</span>';
            return String.format(template, val);
        }
    });
})();
Pan.monitor.blockIpList.BlockIpListViewer = Ext.extend(Pan.base.grid.GridPanel, {
    showLoadMaskInitially: true,
    hasGridFilter: false,
    useCheckBoxSelection: true,
    theme: Pan.base.Constants.uiThemes[0],
    FILTERS: {},
    constructor: function (cfg) {
        Pan.monitor.blockIpList.BlockIpListViewer.superclass.constructor.call(this, Ext.apply(cfg, {filters: {}}));
    },
    getBlockIpUsage: function (data) {
        var text = "";
        if (data["@status"] === "success") {
            var used = data.result["v4-entry-total"];
            var total = data.result["v4-table-total"];
            text = _T("Total Blocked IPs: {used} ouf of {total} ({percentage}% used)", {
                used: used,
                total: total,
                percentage: Math.round(Number(used) / Number(total) * 10000) / 100
            });
        }
        this.statusString.setText(text);
    },
    getBlockIpList: function (data) {
        if (this.mask) {
            this.mask.hide();
            this.mask.destroy();
            delete this.mask;
        }
        var blockIpListStore = Ext.StoreMgr.get('blockIpListStore');
        if (!blockIpListStore || !data) {
            return;
        }
        if (data["@status"] === "error") {
            if (Ext.isDefined(data.msg)) {
                var error = "";
                if (Ext.isString(data.msg) || (Ext.isObject(data.msg) && Ext.isString(data.msg.line))) {
                    error = data.msg.line || data.msg;
                }
                else if (Ext.isArray(data.msg) || (Ext.isObject(data.msg) && Ext.isString(data.msg.line))) {
                    error = "<ul>";
                    Ext.each(data.msg.line || data.msg, function (line) {
                        error += "<li>" + line + "</li>";
                    });
                    error += "</ul>";
                }
                if (!Ext.isEmpty(error)) {
                    var field = Ext.getCmp('filterStr');
                    if (!Ext.isEmpty(field.getValue()))
                        field.markInvalid(error);
                    Pan.base.msg.error(error);
                }
                else {
                    Pan.base.msg.error(_T("An error occurred while retrieving the ip lists."));
                }
            }
        }
        var blockIpList = [];
        if (data && data.result) {
            blockIpList = data.result['entry'] ? data.result['entry'] : [];
            blockIpList = blockIpList.blockIps ? [blockIpList.blockIps] : blockIpList;
        }
        blockIpListStore.loadData(blockIpList);
    },
    convertFilters2String: function (values) {
        var filtersStr = '';
        var template = '<{0}>{1}</{0}>';
        for (var key in values) {
            if (values.hasOwnProperty(key)) {
                var value = values[key];
                if (value) {
                    filtersStr += String.format(template, key, value);
                }
            }
        }
        return filtersStr;
    },
    parseFilters: function (line) {
        var items = line.split(/\s+and\s+/);
        var values = {};
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (Ext.isEmpty(item))
                continue;
            item = item.replace(/['()]/g, '');
            var filter = item.split(/\s+eq\s+/);
            if (filter.length > 1) {
                values[filter[0]] = filter[1];
            }
        }
        return values;
    },
    applyFilters: function (values) {
        if (this.el) {
            this.mask = new Pan.base.widgets.LoadMask(this.el, {msg: _T('Filtering...')});
            this.mask.show();
        }
        var filtersStr = this.convertFilters2String(values);
        var vsys;
        if (Pan.global.isMultiVsys()) {
            vsys = Pan.global.getLoc().val;
            if (vsys.indexOf('localhost.localdomain') >= 0 || vsys == '') {
                vsys = 'any';
            }
        }
        PanDirect.run('BlockIpList.get', [filtersStr, Pan.global.getLocVal()], this.getBlockIpList.createDelegate(this));
        PanDirect.run('BlockIpList.summary', [], this.getBlockIpUsage.createDelegate(this));
    },
    setFilterValues: function () {
        var template = "({0} eq '{1}')";
        var str = '';
        for (var att in this.filters) {
            if (this.filters.hasOwnProperty(att)) {
                if (!Ext.isEmpty(str))
                    str += ' and ';
                str += String.format(template, att, this.filters[att]);
            }
        }
        var field = Ext.getCmp('filterStr');
        field.setValue(str);
    },
    addFilter: function (key, value) {
        var filter = this.getMappingFilter(key);
        if (filter == 'min-kb') {
            value = Math.floor(value / 1024);
            value = (value == 0 ? 1 : value);
        }
        this.filters[filter] = (filter == 'state') ? Ext.util.Format.lowercase(value) : value;
        this.setFilterValues();
        var field = Ext.getCmp('filterStr');
        field.focus();
    },
    getDefaultFilters: function () {
        var ret = {};
        for (var key in this.FILTERS) {
            if (this.FILTERS.hasOwnProperty(key)) {
                var item = this.FILTERS[key];
                ret[key] = item.value;
            }
        }
        return ret;
    },
    getFilterTitles: function () {
        var ret = {};
        for (var key in this.FILTERS) {
            if (this.FILTERS.hasOwnProperty(key)) {
                var item = this.FILTERS[key];
                ret[key] = item.title;
            }
        }
        return ret;
    },
    getMappingFilter: function (key) {
        for (var filter in this.FILTERS) {
            if (this.FILTERS.hasOwnProperty(filter)) {
                var item = this.FILTERS[filter];
                var mapping = item.mapping;
                if (mapping.indexOf(key) != -1)
                    return filter;
            }
        }
        return key;
    },
    buildStore: function () {
        var store = new Ext.ux.data.PagingArrayStore({
            storeId: "blockIpListStore",
            autoDestroy: true,
            lastOptions: {params: {start: 0, limit: Pan.base.Constants.defaultGridLocalPagingSize}},
            autoLoad: false,
            remoteSort: true,
            fields: [{name: 'block-time', mapping: 'block-time'}, {name: 'type', mapping: 'type'}, {
                name: 'slot',
                mapping: 'slot'
            }, {name: 'source-ip', mapping: 'source-ip'}, {
                name: 'ingress-zone',
                mapping: 'ingress-zone'
            }, {name: 'ttl-sec', mapping: 'ttl-sec'}, {name: 'dos-profile', mapping: 'dos-profile'}],
            reloadMethod: "completeReload",
            completeReload: this.onReload.createDelegate(this)
        });
        this.store = store;
    },
    onReload: function () {
        var field = Ext.getCmp('filterStr');
        var line = field.getValue();
        var values = this.parseFilters(line);
        this.applyFilters(values);
    },
    initComponent: function () {
        this.buildStore();
        var tbar = {
            cls: Pan.base.Constants.uiThemes[0],
            items: [{xtype: 'tbspacer'}, {xtype: "tbtext", text: _T("Filters"), width: 40}, {
                xtype: "textfield", width: 750, id: 'filterStr', listeners: {
                    scope: this, change: function (textField, newValue) {
                        try {
                            this.filters = this.parseFilters(newValue);
                            this.applyFilters(this.filters);
                        }
                        catch (e) {
                            textField.markInvalid(e);
                            this.filters = {};
                            this.applyFilters(this.filters);
                        }
                    }, specialkey: function (textField, e) {
                        if (e.getKey() == e.ENTER) {
                            try {
                                var line = textField.getValue();
                                this.filters = this.parseFilters(line);
                                this.applyFilters(this.filters);
                            }
                            catch (ex) {
                                textField.markInvalid(ex);
                                this.filters = {};
                                this.applyFilters(this.filters);
                            }
                        }
                    }
                }
            }, {xtype: 'tbspacer'}, {
                xtype: 'tbbutton', iconCls: 'icon-run', scope: this, handler: function () {
                    var field = Ext.getCmp('filterStr');
                    var line = field.getValue();
                    var values = this.parseFilters(line);
                    this.applyFilters(values);
                }
            }, {
                xtype: 'tbbutton', iconCls: 'icon-clear', scope: this, handler: function () {
                    var field = Ext.getCmp('filterStr');
                    field.setValue('');
                    this.filters = {};
                    this.applyFilters(this.filters);
                }
            }]
        };
        this.statusString = new Ext.Toolbar.TextItem({text: _T("")});
        var extraActions = [{
            text: _T('Delete'), xtype: 'pan-button', formBind: true, afterDeletion: function () {
                Pan.appframework.PanAppInterface.refresh();
            }, handler: function () {
                var records = this.ownerCt.ownerCt.getSelections();
                var filters = [], i = 0, filter = "";
                var record = {};
                for (i = 0; i < records.length; i++) {
                    if (records[i]) {
                        record = records[i];
                        if (record.get('type') === 'sw') {
                            Pan.base.msg.alert(_T("Deletion of software entry is not allowed."));
                            return;
                        }
                    }
                }
                var msg = null;
                if (records.length > 0) {
                    msg = _T('Delete selected items from Block List?');
                    Pan.Msg.confirm(_T("Delete"), msg, function (btn) {
                        if (btn == 'yes') {
                            for (i = 0; i < records.length; i++) {
                                if (records[i]) {
                                    record = records[i];
                                    filter = record.get("source-ip") ? "<source-ip>" + record.get("source-ip") + "</source-ip>" : "";
                                    filter += record.get("ingress-zone") ? "<ingress-zone>" + record.get("ingress-zone") + "</ingress-zone>" : "";
                                    filters.push(filter);
                                }
                            }
                            PanDirect.run("BlockIpList.delete", [filters, Pan.global.getLocVal()], function (result) {
                                var message = "";
                                if (result["@status"] === "error" && result.msg) {
                                    if (Ext.isArray(result.msg)) {
                                        message = "<br/>";
                                        for (var i = 0; i < result.msg.length; i++) {
                                            message += result.msg[i] + "<br/>";
                                        }
                                    }
                                    else if (Ext.isString(result.msg)) {
                                        message = result.msg;
                                    }
                                    Pan.Msg.alert(_T('Error'), message);
                                }
                                Pan.appframework.PanAppInterface.refresh();
                            });
                        }
                    });
                }
            }
        }, {
            text: _T('Clear All'), xtype: 'pan-button', formBind: true, handler: function () {
                var msg = _T("Clear all entries from Block List?");
                Pan.Msg.confirm(_T("Clear"), msg, function (btn) {
                    if (btn == 'yes') {
                        PanDirect.run("BlockIpList.clear", [], function () {
                            Pan.appframework.PanAppInterface.refresh();
                        });
                    }
                });
            }
        }, '-', this.statusString, '-', _T("Use IP address detail lookup for more information")];
        Ext.apply(this, {
            border: false,
            loadMask: {msg: _T('Loading...')},
            store: this.store,
            columns: [{
                header: _T('Block Time'),
                width: 60,
                dataIndex: 'block-time',
                renderer: Pan.monitor.blockIpList.textRenderer
            }, {
                header: _T('Type'),
                width: 30,
                dataIndex: 'type',
                renderer: Pan.monitor.blockIpList.filterRenderer
            }, {
                header: _T('NIC Slot'),
                width: 30,
                dataIndex: 'slot',
                renderer: Pan.monitor.blockIpList.filterRenderer,
                columnAvail: function () {
                    return Pan.global.CONTEXT.family === "7000";
                }
            }, {
                header: _T('Source IP Address'),
                width: 70,
                dataIndex: 'source-ip',
                renderer: Pan.monitor.blockIpList.filterRenderer,
                columnActions: [{
                    text: _T("Who Is"), iconCls: 'icon-find', handler: function (grid, component) {
                        var ip = component.record.get("source-ip");
                        var api = Pan.global.CONTEXT.ipLookUpLink || 'https://www.whois.com/whois/';
                        var url = api + ip;
                        window.open(url);
                    }
                }]
            }, {
                header: _T('Ingress Zone'),
                width: 70,
                dataIndex: 'ingress-zone',
                renderer: Pan.monitor.blockIpList.filterRenderer
            }, {
                header: _T('Time Remaining'),
                width: 70,
                dataIndex: 'ttl-sec',
                renderer: Pan.monitor.blockIpList.textRenderer
            }, {
                header: _T('Block Source'),
                width: 70,
                dataIndex: 'dos-profile',
                renderer: Pan.monitor.blockIpList.filterRenderer
            }],
            tbar: tbar,
            bbar: new Pan.base.widgets.PagingToolbar({
                store: this.store,
                pageSize: Pan.base.Constants.defaultGridLocalPagingSize,
                displayInfo: true,
                hideRefresh: true,
                cls: Pan.base.Constants.uiThemes[0],
                buttons: extraActions
            })
        });
        Pan.monitor.blockIpList.BlockIpListViewer.superclass.initComponent.apply(this, arguments);
        Pan.monitor.blockIpList.addFilter = this.addFilter.createDelegate(this);
        var filtersStr = this.convertFilters2String(this.filters);
        PanDirect.run('BlockIpList.get', [filtersStr, Pan.global.getLocVal()], this.getBlockIpList.createDelegate(this));
        PanDirect.run('BlockIpList.summary', [], this.getBlockIpUsage.createDelegate(this));
    }
});
Pan.reg("Monitor/Block IP List", Pan.monitor.blockIpList.BlockIpListViewer);
Ext.namespace('Pan.monitor.blockIpList');
(function () {
    Ext.apply(Pan.monitor.blockIpList, {
        filterRenderer: function (val, column, record) {
            var vsys = record.get('vsys');
            if (val == 'True') val = 'yes';
            if (val == 'False') val = 'no';
            var template = '<a class="subtle x-hyperlink" onclick="Pan.monitor.blockIpList.addFilter(\'{0}\', \'{1}\', \'{2}\');"><span>{1}</span></a>';
            return String.format(template, this.dataIndex, val, vsys);
        }, zoneRenderer: function (val, column, record) {
            var selectedVsys = Pan.global.getLoc().val;
            var vsys = record.get('vsys');
            var template;
            if (selectedVsys != "") {
                template = '<a class="subtle x-hyperlink" onclick="Pan.monitor.blockIpList.addFilter(\'{0}\', \'{1}\', \'{2}\');"><span>{1}</span></a>';
            }
            else {
                template = '<span>{1}</span>';
            }
            return String.format(template, this.dataIndex, val, vsys);
        }
    });
})();
Pan.monitor.blockIpList.BlockIpListBrowser = Ext.extend(Pan.base.component.Browser, {
    constructor: function (cfg) {
        Pan.monitor.blockIpList.BlockIpListBrowser.superclass.constructor.call(this, Ext.apply(cfg, {
            loadMaskId: cfg.loadMaskId,
            itemId: 'block-ip-list-browser',
            columnModel: {
                columns: [{
                    header: _T('Block Time'),
                    width: 95,
                    dataIndex: 'block-time',
                    xtype: 'datecolumn',
                    format: 'm/d H:i:s'
                }, {
                    header: _T('Type'),
                    width: 70,
                    dataIndex: 'type',
                    renderer: Pan.monitor.blockIpList.filterRenderer
                }, {
                    header: _T('Source IP Address'),
                    width: 70,
                    dataIndex: 'source-ip',
                    renderer: Pan.monitor.blockIpList.filterRenderer,
                    columnActions: [{}]
                }, {
                    header: _T('Ingress Zone'),
                    width: 70,
                    dataIndex: 'ingress-zone',
                    renderer: Pan.monitor.blockIpList.filterRenderer
                }, {
                    header: _T('Time Remaining'),
                    width: 70,
                    dataIndex: 'ttl-sec',
                    renderer: Pan.monitor.blockIpList.zoneRenderer
                }, {
                    header: _T('Block Source'),
                    width: 70,
                    dataIndex: 'dos-profile',
                    renderer: Pan.monitor.blockIpList.filterRenderer
                }], defaults: {sortable: false, menuDisabled: false}, viewConfig: {forceFit: false}
            },
            recordFields: [{name: 'block-time', mapping: 'block-time'}, {
                name: 'type',
                mapping: 'type'
            }, {name: 'source-ip', mapping: 'source-ip'}, {
                name: 'ingress-zone',
                mapping: 'ingress-zone'
            }, {name: 'ttl-sec', mapping: 'ttl-sec'}, {name: 'dos-profile', mapping: 'dos-profile'}]
        }));
    }, getPagingToolbar: function () {
        this.blockedStat = new Ext.Toolbar.TextItem({text: _T("Total Blocked IPs: 1381 out of 10000")});
        var buttons = [{
            text: _T('Delete'), xtype: 'pan-button', formBind: true, handler: function () {
                var record = this.ownerCt.ownerCt.getSelections();
                var filter = "";
                if (record[0]) {
                    record = record[0];
                    filter += record.get("source-ip") ? "<source-ip>" + record.get("source-ip") + "</source-ip>" : "";
                    filter += record.get("ingress-zone") ? "<ingress-zone>" + record.get("ingress-zone") + "</ingress-zone>" : "";
                }
                PanDirect.run("BlockIpList.delete", [filter], function () {
                    Pan.appframework.PanAppInterface.refresh();
                });
            }
        }, {
            text: _T('Clear All'), xtype: 'pan-button', formBind: true, handler: function () {
                PanDirect.run("BlockIpList.clear", [], function () {
                    Pan.appframework.PanAppInterface.refresh();
                });
            }
        }, '-', this.blockedStat];
        var pagingStore = this.getPagingStore();
        return ({
            xtype: 'pan-paging',
            store: pagingStore,
            pageSize: Pan.base.Constants.defaultGridLocalPagingSize,
            displayInfo: true,
            hideRefresh: true,
            cls: Pan.base.Constants.uiThemes[0],
            buttons: buttons
        });
    }
});
Ext.reg('block-ip-list-browser', Pan.monitor.blockIpList.BlockIpListBrowser);
Ext.ns('Pan.monitor.ReportGroup');
Pan.monitor.ReportGroup.Editor = Ext.extend(Ext.Panel, {
    onAddClick: function () {
        var sm = this.src.tree.getSelectionModel();
        var n = sm.getSelectedNode();
        if (!n || !n.isLeaf()) {
            return;
        }
        var node = n.nextSibling || n.previousSibling;
        this.dst.root.appendChild(n);
        this.dst.tree.expandAll();
        if (node) {
            sm.select(node);
        }
    }, onRemoveClick: function () {
        var sm = this.dst.tree.getSelectionModel();
        var n = sm.getSelectedNode();
        if (!n || !n.isLeaf()) {
            return;
        }
        var node = n.nextSibling || n.previousSibling;
        var p = this.src.tree.getNodeById(n.attributes.folder);
        if (!p) {
            return;
        }
        p.appendChild(n);
        this.src.tree.expandAll();
        if (node) {
            sm.select(node);
        }
    }, isExcludedPredefinedReport: function (report) {
        var excludedList = ['-trend'];
        if (!Pan.global.CONTEXT.isGTPEnabled) {
            excludedList.push('GTP', 'Top Users Visiting Malicious URL', 'Top Malicious Wildfire Submissions');
        }
        if (!Pan.global.CONTEXT.isSCTPEnabled) {
            excludedList.push('SCTP');
        }
        var result = _.findIndex(excludedList, function (item) {
            return report.indexOf(item) >= 0;
        });
        return result === -1 ? false : true;
    }, buildUI: function (record) {
        var self = this;
        this.btn = {};
        this.src = {};
        this.dst = {};
        this.btn.add = new Ext.Button({
            text: _T("Add") + ' >>',
            minWidth: 80,
            handler: this.onAddClick.createDelegate(this)
        });
        this.btn.remove = new Ext.Button({
            text: '<< ' + _T("Remove"),
            minWidth: 80,
            handler: this.onRemoveClick.createDelegate(this)
        });
        this.src.tree = new Ext.tree.TreePanel({
            flex: 1,
            cls: "report-group-tree",
            animate: true,
            autoScroll: true,
            rootVisible: false,
            enableDrag: true,
            containerScroll: true,
            dropConfig: {appendOnly: true},
            listeners: {dblclick: {fn: this.onAddClick, scope: this}}
        });
        var rootspec = {"text": "root", "id": "root", "cls": "report-group-folder", draggable: false, children: []};
        var treeconfig = [];
        if (Pan.monitor.isSharedSchema()) {
            treeconfig.push({name: "predefined-report", iconCls: "report-group-report"});
        }
        treeconfig.push({name: "custom-report", iconCls: "report-group-report"});
        treeconfig.push({name: "pdf-summary-report", customName: "PDF-summary-report", iconCls: "report-group-pdf"});
        treeconfig.push({name: "csv", customName: "CSV", iconCls: "report-group-log", key: "custom-report"});
        if (!(Pan.global.isCms())) {
            treeconfig.push({name: "log-view", iconCls: "report-group-log", key: "custom-report"});
        }
        for (var i = 0; i < treeconfig.length; i++) {
            var obj = treeconfig[i];
            var key = obj.key || obj.name;
            var parent = {
                "text": Pan.base.util.capitalize(obj.customName ? obj.customName : obj.name),
                "id": obj.name,
                "cls": "report-group-folder",
                draggable: false,
                iconCls: obj.iconCls + '-folder',
                children: []
            };
            var reports = Pan.base.json.path(record, '$.store.__extraInfo.completions');
            if (reports && reports[key]) {
                Ext.each(reports[key], function (report) {
                    if (report) {
                        if (key === "predefined-report" && self.isExcludedPredefinedReport(report)) {
                            return;
                        }
                        var text;
                        switch (obj.name) {
                            case"log-view":
                                text = report + ' (Log View)';
                                break;
                            case"csv":
                                text = report + ' (CSV)';
                                break;
                            default:
                                text = report;
                                break;
                        }
                        parent.children.push({
                            "text": text,
                            "leaf": true,
                            "cls": "file",
                            folder: obj.name,
                            iconCls: obj.iconCls
                        });
                    }
                });
            }
            parent.children.sort(function (x, y) {
                var a = x.text.toLowerCase(), b = y.text.toLowerCase();
                return a > b ? 1 : a < b ? -1 : 0;
            });
            rootspec.children.push(parent);
        }
        this.src.root = new Pan.base.tree.TreeNode(rootspec);
        this.src.tree.setRootNode(this.src.root);
        this.src.tree.on('afterlayout', function () {
            self.src.root.expand(true, false);
        });
        this.dst.tree = new Ext.tree.TreePanel({
            flex: 1,
            cls: "report-group-tree",
            animate: true,
            autoScroll: true,
            containerScroll: true,
            enableDD: true,
            listeners: {dblclick: {fn: this.onRemoveClick, scope: this}}
        });
        this.dst.root = new Pan.base.tree.TreeNode({
            "text": "Report Group",
            draggable: false,
            "cls": "report-group-folder"
        });
        this.dst.tree.setRootNode(this.dst.root);
        this.dst.tree.on('afterlayout', function () {
            self.dst.root.expand(true, false);
        });
    }, validate: function () {
        if (this.dst.root.childNodes.length <= 0) {
            if (this.validatedOnce) {
                Pan.base.msg.warn("Please add at least one report");
            }
            this.validatedOnce = true;
            return false;
        }
        return true;
    }, reportKeys: function () {
        var keys = [];
        if (Pan.monitor.isSharedSchema()) {
            keys.push('predefined-report');
        }
        keys.push('custom-report');
        keys.push('pdf-summary-report');
        if (!(Pan.global.isCms())) {
            keys.push('log-view');
        }
        keys.push('csv');
        return keys;
    }, setValue: function (record) {
        var self = this;
        this.record = record;
        var keys = this.reportKeys();
        var widgets = [];
        Ext.each(Pan.base.json.path(record, '$.custom-widget.entry'), function (w) {
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                if (w[k]) {
                    widgets.push({"text": w[k], folder: k});
                    break;
                }
            }
        });
        for (var i = 0; i < widgets.length; i++) {
            var w = widgets[i];
            var p = self.src.tree.getNodeById(w.folder);
            if (!p) {
                continue;
            }
            var text = w.text;
            if (w.folder == 'log-view') {
                text += ' (Log View)';
            }
            else if (w.folder == 'csv') {
                text += ' (CSV)';
            }
            var c = p.findChild('text', text);
            if (c) {
                self.dst.root.appendChild(c);
            }
        }
        self.dst.tree.expandAll();
    }, isDirty: function () {
        return true;
    }, customSave: true, getValue: function () {
        this.record["@__recordInfo"].xpathId = Pan.base.defaultXpathId();
        this.record['custom-widget'] = {};
        var arr = [];
        var idx = 1;
        this.dst.root.eachChild(function (c) {
            var entry = {'@name': idx++};
            var text = c.text;
            if (c.attributes.folder == 'log-view') {
                text = text.replace(/ \(Log View\)$/, '');
            }
            else if (c.attributes.folder == 'csv') {
                text = text.replace(/ \(CSV\)$/, '');
            }
            entry[c.attributes.folder] = text;
            arr.push(entry);
        });
        this.record['custom-widget'].entry = arr;
        return this.record;
    }, constructor: function (config) {
        this.validatedOnce = false;
        this.buildUI(config.getRecord());
        Ext.apply(this, {
            "layout": "hbox",
            style: {"padding-top": 5, "padding-bottom": 10},
            height: 300,
            "layoutConfig": {"align": "stretch"},
            "items": [this.src.tree, {
                "xtype": "pan-container",
                layout: "vbox",
                layoutConfig: {pack: "center"},
                "width": 80,
                "items": [this.btn.add, this.btn.remove]
            }, this.dst.tree]
        });
        Pan.monitor.ReportGroup.Editor.superclass.constructor.apply(this, arguments);
    }
});
Ext.applyIf(Pan.monitor.ReportGroup.Editor.prototype, Pan.base.autorender.GridRecordField.prototype);
Ext.reg('pan-reportgroup-editor', Pan.monitor.ReportGroup.Editor);
Pan.monitor.ReportGroup.Helper = {
    getEntry: function (r, name) {
        var entries = Pan.base.json.path(r, '$.variable.entry');
        var result = null;
        Ext.each(entries, function (entry) {
            if (entry['@name'] == name) {
                result = entry;
                return false;
            }
        });
        return result;
    }, removeEntry: function (r, name) {
        var entries = Pan.base.json.path(r, '$.variable.entry');
        var idx = 0;
        Ext.each(entries, function (entry) {
            if (entry['@name'] == name) {
                entries.splice(idx, 1);
                return false;
            }
            idx++;
        });
    }, getTitle: function (config) {
        var value = '';
        var entry = Pan.monitor.ReportGroup.Helper.getEntry(config.__record, 'title');
        if (entry) {
            value = entry['value'];
        }
        return value;
    }, createEntry: function (r) {
        if (!r['variable']) r['variable'] = {};
        if (!r['variable']['entry']) r['variable']['entry'] = [];
    }, setEntry: function (r, name, v) {
        Pan.monitor.ReportGroup.Helper.createEntry(r);
        var entry = Pan.monitor.ReportGroup.Helper.getEntry(r, name);
        if (!entry) {
            r['variable']['entry'].push({'@name': name, 'value': v});
        }
        else {
            entry['value'] = v;
        }
    }, setTitle: function (config) {
        var r = config.__record, v = config.__v;
        if (v) {
            Pan.monitor.ReportGroup.Helper.setEntry(r, 'title', v);
        }
        else {
            Pan.monitor.ReportGroup.Helper.removeEntry(r, 'title');
        }
    }, getWidget: function (config) {
        var widgets = ['custom-report', 'log-view', 'csv', 'pdf-summary-report', 'predefined-report'];
        var result = [];
        Ext.each(widgets, function (widget) {
            var jpath = '$.entry[*].' + widget;
            var names = jsonPath(config.__v, jpath);
            if (names) {
                result = result.concat(names);
            }
        });
        if (result.length == 0) {
            result = '';
        }
        return result;
    }
};
Pan.monitor.ReportGroup.Viewer = Ext.extend(Pan.monitor.MonitorViewer, {
    storeInputs: {objectType: _T("Report Group")},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: 'ReportGroup',
            api: {readSchema: Pan.appframework.schema.getVsysOrDgSchema("report-group")}
        }
    },
    fields: [Pan.monitor.MonitorViewer.prototype.fieldConfig.createName(), 'title-page', {
        name: 'title',
        dataMap: Pan.monitor.ReportGroup.Helper.getTitle,
        saveMap: Pan.monitor.ReportGroup.Helper.setTitle
    }, {name: 'custom-widget', dataMap: Pan.monitor.ReportGroup.Helper.getWidget, saveMap: undefined}],
    columns: [Pan.monitor.MonitorViewer.prototype.columnConfig.name, {
        dataIndex: 'title-page',
        width: 70,
        sortable: true
    }, {dataIndex: 'title', width: 150, sortable: true}, {
        dataIndex: 'custom-widget',
        header: _T('Widgets'),
        width: 150,
        sortable: true
    }],
    recordForm: {
        columnCount: 1,
        windowConfig: {width: 700},
        items: [{itemId: 'name'}, Pan.monitor._locationField, {itemId: 'title-page'}, {
            itemId: 'title',
            xtype: 'pan-textfield'
        }, {itemId: '$', fieldLabel: '', border: false, xtype: 'pan-reportgroup-editor'}]
    }
});
Pan.reg("Monitor/PDF Reports/Report Groups", Pan.monitor.ReportGroup.Viewer);
Ext.ns('Pan.monitor.UserActivityReport');
Pan.monitor.UserActivityReport.Helper = {
    runNow: function (type, user, filter, v, skipurllogs) {
        var timeperiod;
        var dateTimeFmtstr = 'Y/m/d h:ia';
        var fmtstr = 'Y/m/d H:i:s';
        var start = null, end = null;
        var dateTimeSeparator = ' - ';
        var components = v.split(dateTimeSeparator);
        if (components && components[0] && components[1]) {
            start = Date.parseDate(components[0], dateTimeFmtstr);
            end = Date.parseDate(components[1], dateTimeFmtstr);
            if (start && end) {
                start = start.format(fmtstr);
                end = end.format(fmtstr);
                timeperiod = '<start-time>' + start + '</start-time><end-time>' + end + '</end-time>';
            }
        }
        if (!timeperiod) {
            timeperiod = '<period>' + v + '</period>';
        }
        PanDirect.run('MonitorDirect.startUserActivityReportJob', [type, user, filter, timeperiod, skipurllogs, Pan.monitor.vsysScope()], function (result) {
            var jobid = Pan.base.json.path(result, '$.result.job');
            if (jobid == '0' || jobid) {
                Pan.Msg.show({
                    title: _T('User Activity Report'),
                    msg: _T('Generating User Activity Report, please wait...'),
                    buttons: Ext.MessageBox.CANCEL,
                    progressText: _T('Generating User Activity Report...'),
                    width: 300,
                    wait: true,
                    waitConfig: {interval: 200},
                    closable: true,
                    fn: function (btn) {
                        if (btn == 'cancel') {
                            PanDirect.run('MonitorDirect.stopUserActivityReportJob', [jobid]);
                        }
                    }
                });
                Pan.monitor.UserActivityReport.Helper.pollJob(jobid);
            }
        });
    }, buildExportForm: function () {
        if (!document.getElementById("uar.export.form")) {
            var html = ['<form id="uar.export.form" method="post" target="_blank" action="/php/monitor/uar.export.php">', '<input type="hidden" name="filename" value="report"> </input>', '</form>'].join('');
            var el = new Ext.Element(document.createElement('div'));
            el.dom.innerHTML = html;
            el.appendTo(document.body);
        }
        return document.getElementById("uar.export.form");
    }, pollJob: function (jobid) {
        PanDirect.run('PanDirect.pollJob', [jobid], function (result) {
            var status = Pan.base.json.path(result, '$.result.job.status');
            var jobresult = Pan.base.json.path(result, '$.result.job.result');
            var resultfile = Pan.base.json.path(result, '$.result.job.resultfile');
            var csvfile = Pan.base.json.path(result, '$.result.job.csvfile') || '';
            if (status == 'PEND' || status == 'ACT') {
                setTimeout(function () {
                    Pan.monitor.UserActivityReport.Helper.pollJob(jobid);
                }, 1500);
                return;
            }
            Ext.MessageBox.hide();
            if (status == 'FIN' && jobresult == 'OK' && resultfile) {
                resultfile = resultfile.replace(/\/\//g, '/');
                csvfile = csvfile.replace(/\/\//g, '/');
                var url = '/php/monitor/uar.export.php?' + Ext.urlEncode({filename: resultfile});
                var csvurl = '/php/monitor/uar.export.php?' + Ext.urlEncode({filename: csvfile});
                var msg = "<a target='_blank' href='" + url + "'>" + _T('Download User Activity Report') + "</a>";
                if (csvfile) {
                    msg += "<br><a target='_blank' href='" + csvurl + "'>" + _T('Download URL logs') + "</a>";
                }
                Ext.Msg.show({title: _T('User Activity Report'), width: 300, msg: msg, buttons: Ext.Msg.CANCEL});
            }
        });
    }
};
if (Pan.global.isCms()) {
    Pan.monitor.UserActivityReport.Schema = function () {
        Pan.schemaMkNode('$.injected.user-activity-report', {
            "@attr": {"node-type": "array", "optional": "yes"},
            "entry": {
                "@attr": {"node-type": "sequence", "tlo": "yes"},
                "@name": {
                    "@attr": {
                        "node-type": "attr-req",
                        "type": "string",
                        "maxlen": "63",
                        "subtype": "object-name",
                        "help-string": "alphanumeric string [ 0-9a-zA-Z._-]"
                    }
                },
                "type": {
                    "@attr": {"node-type": "union"},
                    "user": {"@attr": {"node-type": "element", "type": "string", "maxlen": "64"}},
                    "user-group": {"@attr": {"node-type": "element", "type": "string", "maxlen": "64"}}
                },
                "filter": {"@attr": {"node-type": "element", "type": "string", "maxlen": "100", "optional": "yes"}},
                "time-period": {"@attr": {"node-type": "element", "type": "string", "maxlen": "50"}},
                "include-detailed-browsing": {
                    "@attr": {
                        "node-type": "element",
                        "type": "bool",
                        "default": "no",
                        "optional": "yes"
                    }
                }
            }
        });
    };
}
else {
    Pan.monitor.UserActivityReport.Schema = function () {
        Pan.schemaMkNode('$.injected.user-activity-report', {
            "@attr": {"node-type": "array", "optional": "yes"},
            "entry": {
                "@attr": {"node-type": "sequence", "tlo": "yes"},
                "@name": {
                    "@attr": {
                        "node-type": "attr-req",
                        "type": "string",
                        "maxlen": "63",
                        "subtype": "object-name",
                        "help-string": "alphanumeric string [ 0-9a-zA-Z._-]"
                    }
                },
                "type": {
                    "@attr": {"node-type": "union"},
                    "user": {"@attr": {"node-type": "element", "type": "string", "maxlen": "64"}},
                    "user-group": {"@attr": {"node-type": "element", "type": "string", "maxlen": "64"}}
                },
                "filter": {"@attr": {"node-type": "element", "type": "string", "maxlen": "100", "optional": "yes"}},
                "time-period": {"@attr": {"node-type": "element", "type": "string", "maxlen": "50"}},
                "include-detailed-browsing": {
                    "@attr": {
                        "node-type": "element",
                        "type": "bool",
                        "default": "no",
                        "optional": "yes"
                    }
                }
            }
        });
    };
}
Pan.monitor.UserActivityReport.fields = [Pan.monitor.MonitorViewer.prototype.fieldConfig.createName(), {
    name: "$",
    uiHint: {labelWidth: 130},
    childrenNames: ['name', 'location', '$.type', 'filterContainer', '$.time-period', '$.include-detailed-browsing']
}, {
    name: "$.time-period",
    uiHint: {xtype: 'pan-customtimecombo'}
}, {name: "$.include-detailed-browsing"}, {
    name: "$.type",
    uiHint: {largeSelectionCount: 3, singleLineLayout: false, builder: 'RadioCardBuilder', fieldLabel: _T('Type')}
}, {
    name: "$.type.user", uiHint: {
        builder: 'PanCompletionBuilder',
        completion: function () {
            return PanDirect.runCallback('MonitorDirect.completeUserActivityReportUsers');
        },
        hideLabel: false,
        forceSelection: false,
        remoteFilter: true,
        minChars: 1,
        alwaysReload: true,
        fieldLabel: _T("Username / IP Address"),
        boxLabel: _T("User")
    }
}, {
    name: "$.filter",
    uiHint: {
        vflex: true,
        autoHeight: false,
        xtype: 'pan-textarea',
        itemId: 'uar_filter_textarea',
        height: 150,
        width: 250
    }
}, {
    name: "$.type.user-group", uiHint: {
        builder: 'PanCompletionBuilder',
        completion: function () {
            return PanDirect.runCallback('MonitorDirect.completeUserActivityReportUserGroups');
        },
        hideLabel: false,
        forceSelection: false,
        remoteFilter: true,
        fieldLabel: _T("Group Name"),
        boxLabel: _T("Group")
    }
}, {
    name: 'filterbuilder', uiHint: {
        xtype: 'pan-linkbutton', text: _T('Filter Builder'), handler: function () {
            var target = this.__pdefaults.__dataExtractor('$.filter', '');
            var win = new Pan.monitor.log.FilterBuilder({logtype: 'uar', target: target});
            win.show();
        }
    }
}, {
    name: 'filterContainer',
    childrenNames: ['$.filter', 'filterbuilder'],
    uiHint: {layout: 'hbox', fieldLabel: _T('Additional Filters')}
}];
Pan.monitor.UARViewer = Ext.extend(Pan.monitor.MonitorViewer, {
    storeInputs: {objectType: _T("User Activity Report")},
    rbaPath: 'monitor/pdf-reports/user-activity-report',
    hasGridFilter: true,
    viewConfig: {nearLimit: 50},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: 'UserActivityReport',
            api: {
                readSchema: {
                    injectedSchema: Pan.monitor.UserActivityReport.Schema,
                    device: "$.injected.user-activity-report.entry",
                    cms: "$.injected.user-activity-report.entry"
                }
            }
        }, commandXPathTemplate: {
            getObjects: [{
                isCmsSelected: '${isCmsSelected}',
                isMultiVsys: '${isMultiVsys}',
                id: '${__id}',
                xpathId: '${__xpathId}',
                getTestXML: false,
                vsysName: function () {
                    var vsys = Pan.global.getLocVal();
                    if (!Pan.global.isCmsSelected() && !Pan.global.isMultiVsys()) {
                        vsys = '';
                    }
                    return vsys;
                },
                template: '${Pan.global.getTemplate()}',
                argumentsAreJSON: true
            }]
        }
    },
    fields: Pan.monitor.UserActivityReport.fields,
    columns: [Pan.monitor.MonitorViewer.prototype.columnConfig.name, {
        dataIndex: '$.type',
        width: 100,
        sortable: false,
        header: _T('Type')
    }, {dataIndex: '$.time-period'}, {dataIndex: '$.filter'}, {dataIndex: '$.include-detailed-browsing'}],
    recordForm: {
        customButtons: [{
            text: _T('Run Now'), isCreateAction: true, formBind: true, handler: function () {
                var type = this.__pdefaults.__dataExtractor('$.type');
                var user = this.__pdefaults.__dataExtractor('$.type.' + type);
                var filter = this.__pdefaults.__dataExtractor('$.filter');
                var time = this.__pdefaults.__dataExtractor('$.time-period');
                var skipurllogs = !this.__pdefaults.__dataExtractor('$.include-detailed-browsing');
                if (type && user && time) {
                    Pan.monitor.UserActivityReport.Helper.runNow(type, user, filter, time, skipurllogs);
                }
            }
        }], items: [{itemId: '$'}]
    }
});
Pan.reg("Monitor/PDF Reports/User Activity Report", Pan.monitor.UARViewer);
Ext.ns('Pan.monitor.SaasAppUsageReport');
Pan.monitor.SaasAppUsageReport.Helper = {
    runNow: function (options) {
        var v = options.time;
        var includeDetailedLogs = options.includeDetailedLogs;
        var reportName = options.reportName;
        var choice = options.choice;
        var limitSubcat = options.limitSubcat;
        var zone = options.zone ? "<zone>" + options.zone + "</zone>" : "<zone></zone>";
        var userGroups = choice === "selected-user-group" ? "<user-group>" + options.userGroups + "</user-group>" : "<user-groups>" + options.userGroups + "</user-groups>";
        var includeUserGroupsInfo = options.includeUserGroupsInfo;
        var timeperiod;
        var dateTimeFmtstr = 'Y/m/d h:ia';
        var fmtstr = 'Y/m/d H:i:s';
        var start = null, end = null;
        var dateTimeSeparator = ' - ';
        var components = v.split(dateTimeSeparator);
        if (components && components[0] && components[1]) {
            start = Date.parseDate(components[0], dateTimeFmtstr);
            end = Date.parseDate(components[1], dateTimeFmtstr);
            if (start && end) {
                start = start.format(fmtstr);
                end = end.format(fmtstr);
                timeperiod = '<start-time>' + start + '</start-time><end-time>' + end + '</end-time>';
            }
        }
        if (!timeperiod) {
            timeperiod = '<period>' + v + '</period>';
        }
        PanDirect.run('MonitorDirect.startSaasAppUsageReportJob', [timeperiod, includeDetailedLogs, choice, limitSubcat, zone, userGroups, includeUserGroupsInfo, Pan.monitor.vsysScope(), reportName], function (result) {
            var jobId = Pan.base.json.path(result, '$.result.job');
            if (jobId == '0' || jobId) {
                Pan.reports.saas.SaasReport.showReportJobStatus(jobId, includeDetailedLogs, reportName, Pan.monitor.vsysScope(), limitSubcat, includeUserGroupsInfo);
            }
            else {
                var msg = '';
                if (result['msg']) {
                    if (result['msg']['line']) {
                        msg = result['msg']['line'];
                    }
                    else {
                        msg = result['msg'];
                    }
                }
                if (msg) {
                    Pan.base.msg.error(msg);
                }
            }
        });
    }, buildExportForm: function () {
    }, pollJob: function (jobid, userData) {
        PanDirect.run('PanDirect.pollJob', [jobid], function (result) {
            var status = Pan.base.json.path(result, '$.result.job.status');
            var resultfile = Pan.base.json.path(result, '$.result.job.resultfile');
            if (status == 'PEND' || status == 'ACT') {
                setTimeout(function () {
                    Pan.monitor.SaasAppUsageReport.Helper.pollJob(jobid, userData);
                }, 1500);
                return;
            }
            Ext.MessageBox.hide();
            if (resultfile) {
                resultfile = resultfile.replace(/\/\//g, '/');
                resultfile = resultfile.replace(/\/report_complete$/i, '');
                var url = '/reports/saas/saas_report.php?' + Ext.urlEncode(Ext.apply({
                    dir: resultfile,
                    file: "result.xml"
                }, userData));
                window.open(url);
            }
        });
    }
};
Pan.monitor.SaasAppUsageReport.Schema = function () {
    Pan.schemaMkNode('$.injected.saas-application-usage-report', {
        "@attr": {"node-type": "array", "optional": "yes"},
        "entry": {
            "@attr": {"node-type": "sequence", "tlo": "yes"},
            "@name": {
                "@attr": {
                    "node-type": "attr-req",
                    "type": "string",
                    "maxlen": "63",
                    "subtype": "object-name",
                    "help-string": "alphanumeric string [ 0-9a-zA-Z._-]"
                }
            },
            "time-period": {"@attr": {"node-type": "element", "type": "string", "maxlen": "50"}},
            "include-detailed-app-category": {
                "@attr": {
                    "node-type": "element",
                    "type": "bool",
                    "default": "yes",
                    "optional": "yes"
                }
            },
            "choice": {
                "@attr": {"node-type": "choice"},
                "all": {
                    "@attr": {
                        "node-type": "array",
                        "optional": "no",
                        "max-count": 1,
                        "help-string": "All User Groups and Zones"
                    },
                    "entry": {
                        "@attr": {"node-type": "sequence", "optional": "no", "max-count": 1},
                        "include-user-groups-info": {
                            "@attr": {
                                "node-type": "element",
                                "type": "bool",
                                "default": "no",
                                "optional": "yes"
                            }
                        },
                        "user-groups": {
                            "@attr": {"node-type": "array", "default-member": "yes", "optional": "yes"},
                            "member": {"@attr": {"node-type": "element", "type": "string"}}
                        }
                    }
                },
                "selected-zone": {
                    "@attr": {
                        "node-type": "array",
                        "optional": "no",
                        "max-count": 1,
                        "help-string": "Selected Zone"
                    },
                    "entry": {
                        "@attr": {"node-type": "sequence", "optional": "no", "max-count": 1},
                        "include-user-groups-info": {
                            "@attr": {
                                "node-type": "element",
                                "type": "bool",
                                "default": "no",
                                "optional": "yes"
                            }
                        },
                        "user-groups": {
                            "@attr": {"node-type": "array", "default-member": "yes", "optional": "yes"},
                            "member": {"@attr": {"node-type": "element", "type": "string"}}
                        },
                        "zone": {"@attr": {"node-type": "element", "type": "string"}}
                    }
                },
                "selected-user-group": {
                    "@attr": {
                        "node-type": "array",
                        "optional": "no",
                        "max-count": 1,
                        "help-string": "Selected User Group"
                    },
                    "entry": {
                        "@attr": {"node-type": "sequence", "optional": "no", "max-count": 1},
                        "user-group": {"@attr": {"node-type": "element", "type": "string"}}
                    }
                }
            },
            "limit-max-subcat": {"@attr": {"node-type": "element", "type": "string", "maxlen": "50"}}
        }
    });
};
Pan.objects.MiniUserGroupsViewer = Ext.extend(Pan.base.container.FormPanel, {
    labelAlign: 'top',
    constructor: function (config) {
        this.items = [{
            xtype: 'pan-container',
            layout: 'fit',
            items: [{
                theme: 'blue',
                xtype: "pan-group-editor",
                srcTitle: "Available Groups",
                dstTitle: "Selected Groups",
                path: 'completions',
                maxCount: 25,
                api: {read: 'SaasAppUsageReport.getUserGroups'}
            }]
        }];
        Pan.objects.MiniUserGroupsViewer.superclass.constructor.call(this, config);
    }
});
Pan.reg("Objects/Mini User Groups", Pan.objects.MiniUserGroupsViewer);
Pan.monitor.SaasAppUsageReport.fields = [{
    type: 'string', name: 'name', mapping: '@name', uiHint: {
        showHelpString: _T("Please select and tag sanctioned SaaS Apps for accurate reporting"), avail: [{
            match: {
                evaluate: function () {
                    var r = this.__component.getRecord();
                    if (!r.phantom) {
                        var pdefaults = this.__component.__pdefaults;
                        if (pdefaults && Ext.isDefined(pdefaults.__renameable)) {
                            return pdefaults.__renameable;
                        }
                    }
                    return !(Pan.common.CommonViewerConfig.fieldConfig.isReadOnlyName(r));
                }
            }, availHide: false
        }]
    }
}, {
    name: "$",
    childrenNames: ["name", "location", "$.time-period", '$.choice', "$.include-detailed-app-category", "$.limit-max-subcat"],
    uiHint: {labelWidth: 120}
}, {
    name: "$.time-period", uiHint: {
        xtype: 'pan-customtimecombo', data: ["last-7-days", "last-30-days", "last-90-days"], association: [{
            listenToAfterInit: true,
            match: {
                evaluate: 'lastOperand',
                operands: [{
                    evaluate: '||',
                    operands: [{evaluate: 'fieldEvt', field: '$.time-period'}, {evaluate: 'fieldEvt', field: 'name'}]
                }]
            },
            exec: {
                evaluate: function () {
                    var period = this.__component.getValue();
                    var runNow = Ext.getCmp("saasRunNow");
                    if (period === "last-90-days" || !this.__component.__pdefaults.__recordForm.isValid()) {
                        runNow.disable();
                    }
                    else {
                        runNow.enable();
                    }
                }
            }
        }], hasCustom: false
    }
}, {
    name: "$.include-detailed-app-category",
    uiHint: {fieldLabel: _T("Include detailed application category information in report")}
}, {
    name: "$.limit-max-subcat",
    defaultValue: "All",
    uiHint: {
        xtype: 'pan-combo',
        fieldLabel: _T('Limit max subcategories in the report to'),
        store: new Ext.data.SimpleStore({
            itemId: 'limit-max-subcat',
            fields: ['value', 'display'],
            data: [['10', '10'], ['15', '15'], ['20', '20'], ['25', '25'], ['All', _T('All')]]
        }),
        displayField: 'display',
        valueField: 'value',
        mode: 'local'
    }
}, {
    name: '$.choice', defaultValue: "all", uiHint: {
        useHelpStringAsDisplay: true, fieldLabel: _T('Include logs from'), association: [{
            listenToAfterInit: false, match: {evaluate: 'fieldEvt', field: '$.choice'}, exec: {
                evaluate: function () {
                    var type = this.__component.__pdefaults.__dataExtractor("$.choice");
                    var allBrowser = Ext.getCmp("AllUserGroups_Drawer");
                    var selectedZoneBrowser = Ext.getCmp("SelectedZoneUserGroups_Drawer");
                    switch (type) {
                        case'all':
                            if (selectedZoneBrowser) {
                                selectedZoneBrowser.hide();
                            }
                            break;
                        case'selected-zone':
                            if (allBrowser) {
                                allBrowser.hide();
                            }
                            break;
                        default:
                            if (allBrowser) {
                                allBrowser.hide();
                            }
                            if (selectedZoneBrowser) {
                                selectedZoneBrowser.hide();
                            }
                    }
                }
            }
        }]
    }
}, {name: '$.all.entry', uiHint: {fieldLabel: ' '}}, {
    name: '$.all.entry.*',
    childrenNames: ['$.all.entry.*.include-user-groups-info']
}, {
    name: '$.all.entry.*.include-user-groups-info',
    childrenNames: ['$.all.entry.*.user-groups.member'],
    uiHint: {fieldLabel: _T('Include user group information in the report'), builder: 'FieldSetBuilder', labelWidth: 20}
}, {
    name: '$.all.entry.*.user-groups.member',
    uiHint: {
        showHelpString: _T('Note: Select one or more user groups'),
        text: _T('manage groups'),
        fieldLabel: ' ',
        xtype: "pan-linkbutton-drawer",
        buttonCfg: {
            ref: '../browseButtonAll',
            itemId: 'browseButtonAll',
            componentItemId: '$.all.entry.*.user-groups.member'
        },
        drawer: {
            multiDrawers: true,
            treePath: 'Objects/Mini User Groups',
            title: _T("User Groups"),
            width: 460,
            itemId: 'AllUserGroups'
        },
        association: [{
            listenToAfterInit: false,
            match: {evaluate: 'fieldEvt', field: '$.all.entry.*.include-user-groups-info'},
            exec: {
                evaluate: function () {
                }
            }
        }],
        allowEmpty: false
    }
}, {name: '$.selected-zone.entry', uiHint: {forceSelection: false, fieldLabel: ' '}}, {
    name: '$.selected-zone.entry.*',
    childrenNames: ["$.selected-zone.entry.*.zone", '$.selected-zone.entry.*.include-user-groups-info']
}, {
    name: '$.selected-zone.entry.*.include-user-groups-info',
    childrenNames: ['$.selected-zone.entry.*.user-groups.member'],
    uiHint: {fieldLabel: _T('Include user group information in the report'), builder: 'FieldSetBuilder', labelWidth: 20}
}, {
    name: '$.selected-zone.entry.*.user-groups.member',
    uiHint: {
        text: _T('manage groups for selected zone'),
        showHelpString: _T('Note: Select one or more user groups'),
        fieldLabel: ' ',
        xtype: 'pan-linkbutton-drawer',
        buttonCfg: {
            ref: '../browseButtonSelectedZone',
            itemId: 'browseButtonSelectedZone',
            componentItemId: '$.selected-zone.entry.*.user-groups.member'
        },
        drawer: {
            multiDrawers: true,
            treePath: 'Objects/Mini User Groups',
            title: _T("User Groups For Selected Zone"),
            width: 480,
            itemId: 'SelectedZoneUserGroups'
        },
        allowEmpty: false
    }
}, {name: "$.selected-user-group.entry", uiHint: {fieldLabel: " "}}, {
    name: "$.selected-user-group.entry.*.user-group",
    uiHint: {
        labelWidth: 138, fieldLabel: _T('User Group'), completion: function () {
            return PanDirect.runCallback('SaasAppUsageReport.getUserGroups');
        }, builder: 'PanCompletionBuilder', hideLabel: false, forceSelection: false, remoteFilter: true
    }
}, {
    name: "$.selected-zone.entry.*.zone",
    uiHint: {
        forceSelection: false, fieldLabel: _T('Zone'), completion: function () {
            return PanDirect.runCallback('SaasAppUsageReport.getZones');
        }, builder: 'PanCompletionBuilder', labelWidth: 175
    }
}];
Pan.monitor.SaasAppUsageReportViewer = Ext.extend(Pan.monitor.MonitorViewer, {
    storeInputs: {objectType: _T("SaaS Application Usage")},
    rbaPath: 'monitor/pdf-reports/saas-application-usage-report',
    hasGridFilter: true,
    viewConfig: {nearLimit: 50},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: 'SaasAppUsageReport',
            api: {
                readSchema: {
                    injectedSchema: Pan.monitor.SaasAppUsageReport.Schema,
                    device: "$.injected.saas-application-usage-report.entry",
                    cms: "$.injected.saas-application-usage-report.entry"
                }
            }
        }, commandXPathTemplate: {
            getObjects: [{
                isCmsSelected: '${isCmsSelected}',
                isMultiVsys: '${isMultiVsys}',
                id: '${__id}',
                xpathId: '${__xpathId}',
                getTestXML: false,
                vsysName: function () {
                    var vsys = Pan.global.getLocVal();
                    if (!Pan.global.isCmsSelected() && !Pan.global.isMultiVsys()) {
                        vsys = '';
                    }
                    return vsys;
                },
                template: '${Pan.global.getTemplate()}',
                argumentsAreJSON: true
            }]
        }
    },
    fields: Pan.monitor.SaasAppUsageReport.fields,
    columns: [Pan.monitor.MonitorViewer.prototype.columnConfig.name, {dataIndex: '$.time-period'}, {
        dataIndex: '$.choice',
        header: _T("Run Report For")
    }, {
        dataIndex: '$.include-detailed-app-category',
        header: _T("Include Detailed Application Category")
    }, {dataIndex: '$.limit-max-subcat', header: _T("Max Subcategories")}],
    recordForm: {
        windowConfig: {width: 520}, cancelCallback: function () {
            var allBrowser = Ext.getCmp("AllUserGroups_Drawer");
            var selectedZoneBrowser = Ext.getCmp("SelectedZoneUserGroups_Drawer");
            if (Ext.isDefined(allBrowser)) {
                allBrowser.hide(true);
            }
            if (Ext.isDefined(selectedZoneBrowser)) {
                selectedZoneBrowser.hide(true);
            }
            return true;
        }, okCallback: function () {
            var allBrowser = Ext.getCmp("AllUserGroups_Drawer");
            var selectedZoneBrowser = Ext.getCmp("SelectedZoneUserGroups_Drawer");
            if (Ext.isDefined(allBrowser)) {
                allBrowser.hide(true);
            }
            if (Ext.isDefined(selectedZoneBrowser)) {
                selectedZoneBrowser.hide(true);
            }
            return true;
        }, labelWidth: 120, customButtons: [{
            text: _T('Run Now'), id: "saasRunNow", isCreateAction: true, handler: function () {
                var formattedUserGroups = "";
                var limitSubcat = this.__pdefaults.__dataExtractor('$.limit-max-subcat');
                var choice = this.__pdefaults.__dataExtractor('$.choice');
                var userGroups = null;
                var zone = null;
                var includeUserGroupsInfo = null;
                if (choice !== "selected-user-group") {
                    if (choice === "selected-zone") {
                        zone = this.__pdefaults.__dataExtractor('$.' + choice + '.entry.*.zone');
                    }
                    includeUserGroupsInfo = this.__pdefaults.__dataExtractor('$.' + choice + '.entry.*.include-user-groups-info');
                    userGroups = this.__pdefaults.__dataExtractor('$.' + choice + '.entry.*.user-groups.member');
                }
                userGroups = userGroups || this.__pdefaults.__dataExtractor('$.' + choice + '.entry.*.user-group');
                if (Ext.isArray(userGroups)) {
                    for (var i = 0; i < userGroups.length; i++) {
                        formattedUserGroups += "<member>" + userGroups[i] + "</member>";
                    }
                }
                else {
                    formattedUserGroups = userGroups;
                }
                var time = this.__pdefaults.__dataExtractor('$.time-period');
                var includeDetailedLogs = this.__pdefaults.__dataExtractor('$.include-detailed-app-category');
                var reportName = this.__pdefaults.__dataExtractor('name');
                var options = {
                    time: time,
                    includeDetailedLogs: includeDetailedLogs,
                    reportName: reportName,
                    choice: choice,
                    zone: zone,
                    limitSubcat: limitSubcat,
                    userGroups: formattedUserGroups,
                    includeUserGroupsInfo: includeUserGroupsInfo
                };
                if (time) {
                    Pan.monitor.SaasAppUsageReport.Helper.runNow(options);
                }
            }
        }], items: [{
            xtype: 'pan-fieldset',
            title: _T('Warning'),
            iconCls: "saas_report_warning",
            defaults: {anchor: '-50'},
            items: {
                xtype: "label",
                itemId: "warning_text",
                html: _T("There are multiple VSYS configured on this device. Please note that running the SaaS Application Usage Report for all VSYS with mixed application tagging configuration will produce overlapping results.")
            },
            initComponent: function () {
                Pan.base.form.FieldSet.prototype.initComponent.apply(this, arguments);
                if (Pan.global.isCms()) {
                    this.findByItemId("warning_text").setText(_T("There are multiple device groups configured on this Panorama. Please note that running the SaaS Application Usage Report with mixed application tagging configuration will produce overlapping results."));
                    if (!(Pan.global.getLocVal() === "" || Pan.global.getLocVal() === "shared")) {
                        var dgHierarchy = Pan.global.ContextVariables.get("dgHierarchy");
                        var loc = Pan.global.getLocVal();
                        var dg = _.filter(dgHierarchy, {"@name": loc});
                        if (dg && dg.length === 1 && dg[0].children && dg[0].children.length) {
                        }
                        else {
                            this.setVisible(false);
                        }
                    }
                }
                else if (!Pan.global.isMultiVsys() || !(Pan.global.getLocVal() === "" || Pan.global.getLocVal() === "shared")) {
                    this.setVisible(false);
                }
            }
        }, {itemId: '$'}]
    }
});
Pan.reg("Monitor/PDF Reports/SaaS Application Usage", Pan.monitor.SaasAppUsageReportViewer);
Ext.ns('Pan.monitor.EmailScheduler');
Pan.monitor.EmailScheduler.Helper = {
    getRecurrence: function (config) {
        var r = config.__record;
        var monthly = Pan.base.json.path(r, '$.recurring.monthly');
        var weekly = Pan.base.json.path(r, '$.recurring.weekly');
        var daily = Pan.base.json.path(r, '$.recurring.daily');
        if (daily) {
            return _T('Daily');
        }
        else if (weekly) {
            return _TC('Every {weekday}', {weekday: Pan.base.util.capitalize(weekly)});
        }
        else if (monthly) {
            return _TC('Every {date} day of each month', {date: Pan.base.util.ordinalNumberSuffix(monthly)});
        }
        else {
            return _T('Disable');
        }
    }, setRecurrence: function (config) {
        var r = config.__record;
        var v = config.__v;
        r.recurring = {};
        if (v.indexOf('day of each month') > 0) {
            r.recurring.monthly = v.replace(/\D/g, '');
        }
        else if (v.indexOf('Every ') == 0) {
            r.recurring.weekly = v.substr(6).toLowerCase();
        }
        else if (v == 'Daily') {
            r.recurring.daily = {};
        }
        else {
            r.recurring.disabled = {};
        }
    }, normalizeRecipientEmails: function (v) {
        return v.replace(/,|;|\n/g, ' ').replace(/\s+/g, ' ').replace(/(^\s+)|(\s+$)/g, '');
    }, setRecipientEmails: function (config) {
        var r = config.__record;
        var v = config.__v;
        if (v) {
            r['recipient-emails'] = Pan.monitor.EmailScheduler.Helper.normalizeRecipientEmails(v);
        }
        else {
            delete r['recipient-emails'];
        }
    }, validateRecipientEmails: function (v) {
        var emails = Pan.monitor.EmailScheduler.Helper.normalizeRecipientEmails(v).split(' ');
        var msg = [];
        var regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+/i;
        Ext.each(emails, function (email) {
            if (!email.match(regex)) {
                msg.push(email + ' is not a valid email.');
            }
        });
        return (v == '' || msg.length == 0) || msg.join('\n');
    }
};
Pan.monitor.EmailScheduler.Viewer = Ext.extend(Pan.monitor.MonitorViewer, {
    storeInputs: {objectType: _T("Email Scheduler")},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: 'EmailScheduler',
            api: {readSchema: Pan.appframework.schema.getVsysOrDgSchema("email-scheduler")}
        }
    },
    fields: [Pan.monitor.MonitorViewer.prototype.fieldConfig.createName(), {
        name: 'recipient-emails',
        saveMap: Pan.monitor.EmailScheduler.Helper.setRecipientEmails
    }, {
        name: 'recurring',
        dataMap: Pan.monitor.EmailScheduler.Helper.getRecurrence,
        saveMap: Pan.monitor.EmailScheduler.Helper.setRecurrence
    }],
    columns: [Pan.monitor.MonitorViewer.prototype.columnConfig.name, {
        dataIndex: '$.email-profile',
        width: 150,
        sortable: true
    }, {
        dataIndex: '$.report-group',
        header: _T('PDF Report or Report Group'),
        width: 150,
        sortable: true
    }, {
        dataIndex: 'recipient-emails',
        header: _T('Override Email Addresses'),
        width: 200,
        sortable: true
    }, {dataIndex: 'recurring', header: _T('Recurrence'), width: 100, sortable: true}],
    recordForm: {
        customButtons: [{
            text: _T('Send test email'), isCreateAction: true, handler: function (btn) {
                var ep = this.__pdefaults.__dataExtractor('$.email-profile');
                var re = this.__pdefaults.__dataExtractor('recipient-emails');
                if (ep) {
                    if (Pan.monitor.EmailScheduler.Helper.validateRecipientEmails(re) === true) {
                        re = Pan.monitor.EmailScheduler.Helper.normalizeRecipientEmails(re);
                        var m = new Pan.base.widgets.LoadMask(btn.el, {useLoadMaskDisplayerClassAsMaskEl: true});
                        m.show();
                        PanDirect.run('MonitorDirect.testSendEmail', [ep, re, Pan.monitor.vsysScope()], function (result) {
                            m.hide();
                            if (Ext.isArray(result)) {
                                result = result.join("\n");
                                if (result.indexOf('Test email sent') >= 0) {
                                    Pan.base.msg.info(result);
                                }
                                else {
                                    Pan.base.msg.alert(result);
                                }
                            }
                        });
                    }
                }
            }
        }],
        items: [{itemId: 'name'}, Pan.monitor._locationField, {
            itemId: '$.report-group',
            fieldLabel: _T('PDF Report or Report Group')
        }, {
            itemId: '$.email-profile',
            menuActions: [{
                atype: 'addRemoteRecordAction',
                text: _T("Email Profile"),
                componentItemId: '$.email-profile',
                recordFieldName: '$.email-profile',
                treePath: "Device/Server Profiles/Email"
            }]
        }, {
            itemId: 'recurring',
            xtype: 'pan-selectbox',
            allowBlank: false,
            fieldLabel: _T('Recurrence'),
            store: [['Disable', _T('Disable')], ['Daily', _T('Daily')], ['Every Monday', _T('Every Monday')], ['Every Tuesday', _T('Every Tuesday')], ['Every Wednesday', _T('Every Wednesday')], ['Every Thursday', _T('Every Thursday')], ['Every Friday', _T('Every Friday')], ['Every Saturday', _T('Every Saturday')], ['Every Sunday', _T('Every Sunday')], ["Every 1st day of each month", _T("Every 1st day of each month")], ["Every 2nd day of each month", _T("Every 2nd day of each month")], ["Every 3rd day of each month", _T("Every 3rd day of each month")], ["Every 4th day of each month", _T("Every 4th day of each month")], ["Every 5th day of each month", _T("Every 5th day of each month")], ["Every 6th day of each month", _T("Every 6th day of each month")], ["Every 7th day of each month", _T("Every 7th day of each month")], ["Every 8th day of each month", _T("Every 8th day of each month")], ["Every 9th day of each month", _T("Every 9th day of each month")], ["Every 10th day of each month", _T("Every 10th day of each month")], ["Every 11th day of each month", _T("Every 11th day of each month")], ["Every 12th day of each month", _T("Every 12th day of each month")], ["Every 13th day of each month", _T("Every 13th day of each month")], ["Every 14th day of each month", _T("Every 14th day of each month")], ["Every 15th day of each month", _T("Every 15th day of each month")], ["Every 16th day of each month", _T("Every 16th day of each month")], ["Every 17th day of each month", _T("Every 17th day of each month")], ["Every 18th day of each month", _T("Every 18th day of each month")], ["Every 19th day of each month", _T("Every 19th day of each month")], ["Every 20th day of each month", _T("Every 20th day of each month")], ["Every 21st day of each month", _T("Every 21st day of each month")], ["Every 22nd day of each month", _T("Every 22nd day of each month")], ["Every 23rd day of each month", _T("Every 23rd day of each month")], ["Every 24th day of each month", _T("Every 24th day of each month")], ["Every 25th day of each month", _T("Every 25th day of each month")], ["Every 26th day of each month", _T("Every 26th day of each month")], ["Every 27th day of each month", _T("Every 27th day of each month")], ["Every 28th day of each month", _T("Every 28th day of each month")], ["Every 29th day of each month", _T("Every 29th day of each month")], ["Every 30th day of each month", _T("Every 30th day of each month")], ["Every 31st day of each month", _T("Every 31st day of each month")]]
        }, {
            itemId: 'recipient-emails',
            allowBlank: true,
            xtype: 'pan-textarea',
            fieldLabel: _T('Override Email Addresses'),
            validator: Pan.monitor.EmailScheduler.Helper.validateRecipientEmails
        }]
    }
});
Pan.reg("Monitor/PDF Reports/Email Scheduler", Pan.monitor.EmailScheduler.Viewer);
Pan.monitor.PcapViewer = Ext.extend(Pan.base.container.Window, {
    download: function () {
        var url = '/php/monitor/pcap.export.php?' + Ext.urlEncode({
            type: this.type,
            serial: this.serial,
            filename: this.filename,
            receive_time: this.receive_time,
            time_generated: this.time_generated,
            device_name: this.device_name,
            sessionid: this.sessionid
        });
        window.open(url);
    }, constructor: function (config) {
        var self = this;
        this.filename = config.filename;
        this.type = config.type;
        this.serial = config.serial;
        this.device_name = config.device_name;
        this.sessionid = config.sessionid;
        var panel = new Ext.Panel({
            xtype: 'panel',
            autoScroll: true,
            cls: "darkblue",
            listeners: {
                'render': function () {
                    panel.getUpdater().update({
                        timeout: 5 * 60,
                        url: '/php/monitor/pcap.html.php?' + Ext.urlEncode({
                            type: self.type,
                            serial: self.serial,
                            filename: self.filename,
                            receive_time: self.receive_time,
                            time_generated: self.time_generated,
                            device_name: self.device_name,
                            sessionid: self.sessionid
                        })
                    });
                }
            }
        });
        Ext.apply(config, {
            title: _T('Packet Capture'),
            height: 500,
            width: 610,
            layout: 'fit',
            defaults: {border: false},
            buttons: [{text: _T('Export'), handler: this.download, scope: this}, {
                text: _T('Close'),
                handler: this.close,
                scope: this
            }],
            items: panel
        });
        Pan.monitor.PcapViewer.superclass.constructor.call(this, config);
    }
});
Ext.ns('Pan.monitor.autoFocus');
Ext.ns('Pan.monitor.autoFocus.AutoFocusAppLoadHandler');
Pan.monitor.autoFocus.AutoFocusAppLoadHandler = (function () {
    var handler = function (value, search) {
        Pan.appframework.PanAppInterface.jumpToBranch("monitor/logs/unified", '', {"query": search.substring("autofocus=".length)});
    };
    Pan.appframework.PanAppInterface.regAppLoadHandler({key: "autofocus", handler: handler});
    return handler;
}());
Ext.ns('Pan.monitor.autoFocus');
Ext.ns('Pan.monitor.autoFocus.AutoFocusColumnAction');
Pan.monitor.autoFocus.AutoFocusColumnAction = Ext.extend(Object, {
    getRemoteConfig: (function () {
        var config;
        var firstTime = true;
        return function (fetchWhenEmpty, reset) {
            if (!fetchWhenEmpty) {
                return config;
            }
            var reportError = false;
            if (reset) {
                config = undefined;
                reportError = true;
            }
            if (!config) {
                PanDirect.execute("AutoFocus.getDataSchema", {"reset": reset}, function (result) {
                    var firstTimeCopy = firstTime;
                    firstTime = false;
                    Pan.appframework.schema.PanSchemaRepository.clearEntry(new RegExp("Autofocus/.*"));
                    Pan.schemaRmNode("$.autofocus");
                    var status = "success";
                    if (Ext.isString(result)) {
                        config = Ext.util.JSON.decode(result);
                        status = config && config['@status'];
                    }
                    else if (Ext.isObject(result)) {
                        config = result;
                        status = config && config['@status'];
                    }
                    else {
                        config = {};
                    }
                    if (status == 'failure') {
                        var configCopy = config;
                        config = undefined;
                        if (reportError) {
                            Pan.appframework.errorhandling.reportStatus(configCopy);
                        }
                        else if (firstTimeCopy) {
                            this.resetConfig();
                        }
                    }
                    else {
                        if (this.dataSchemaLoadedCB) {
                            this.dataSchemaLoadedCB();
                        }
                    }
                }, this);
            }
            else {
                if (this.dataSchemaLoadedCB) {
                    this.dataSchemaLoadedCB();
                }
            }
            return config;
        };
    }()), init: function (dataSchemaLoadedCB, versionMismatchCB) {
        this.dataSchemaLoadedCB = dataSchemaLoadedCB;
        this.versionMismatchCB = versionMismatchCB;
        this.getRemoteConfig(true);
    }, destroy: function () {
        delete this.dataSchemaLoadedCB;
        delete this.versionMismatchCB;
    }, resetConfig: function () {
        this.getRemoteConfig(true, true);
    }, isColumnSupported: function (logtype, column) {
        var metaDataSchema = this.getRemoteConfig();
        if (metaDataSchema && metaDataSchema.logtype) {
            return metaDataSchema.logtype[logtype] && metaDataSchema.logtype[logtype][column];
        }
    }, getConfig: function (logtype, column) {
        var metaDataSchema = this.getRemoteConfig();
        var thisPtr = this;
        if (metaDataSchema && metaDataSchema.logtype) {
            if (metaDataSchema.logtype[logtype] && metaDataSchema.logtype[logtype][column]) {
                var dataSchemaName = metaDataSchema.logtype[logtype][column];
                var schemaPath = "$.autofocus." + logtype + "." + column + ".dataschema";
                var treePath = "Autofocus/" + logtype + "/" + column;
                Pan.schemaMkNode(schemaPath, metaDataSchema.schema[dataSchemaName]);
                Pan.reg(treePath, Pan.appframework.modelview.PanRecordFormViewer, {
                    loadMask: {showMask: false},
                    initComponent: function () {
                        if (this.actionComponent && this.actionComponent.cellEventInfo) {
                            var elements = Ext.fly(this.actionComponent.cellEventInfo.miniCellColEl).select(".resolved-log-address").elements;
                            if (!elements.length > 0) {
                                elements = Ext.fly(this.actionComponent.cellEventInfo.miniCellColEl).select("a").elements;
                                if (!elements.length > 0) {
                                    elements = Ext.fly(this.actionComponent.cellEventInfo.miniCellColEl).select("").elements;
                                }
                            }
                            if (elements.length > 0) {
                                var serial;
                                if (this.actionComponent.grid) {
                                    serial = this.actionComponent.grid.store.getAt(this.actionComponent.cellEventInfo.row).get("serial");
                                }
                                else {
                                    serial = Pan.global.CONTEXT.serialNumber;
                                }
                                if (serial) {
                                    Ext.apply(this.storeInputs, {logDeviceSN: serial});
                                }
                                Ext.apply(this.storeInputs, {queryValue: elements[0].textContent || elements[0].innerText || ""});
                                this.recordForm = Ext.applyIf({}, this.recordForm);
                                this.recordForm.windowConfig = Ext.applyIf({title: this.initialConfig.recordForm.windowConfig.title + " - " + this.storeInputs.queryValue}, this.recordForm.windowConfig);
                            }
                        }
                        Pan.appframework.modelview.PanRecordFormViewer.prototype.initComponent.apply(this, arguments);
                        this.setProgress(0, false);
                        this.store.addListener('afterload', this.afterLoadHandler, this);
                    },
                    destroyPollTask: function () {
                        if (this.pollTask) {
                            this.pollTask.cancel();
                            delete this.pollTask;
                        }
                    },
                    onDestroy: function () {
                        if (this.store) {
                            this.store.removeListener('afterload', this.afterLoadHandler, this);
                        }
                        this.destroyPollTask();
                        Pan.appframework.modelview.PanRecordFormViewer.prototype.onDestroy.apply(this, arguments);
                    },
                    getCompletionPercentage: function () {
                        var store = this.store;
                        return store.__extraInfo && store.__extraInfo['percent-complete'];
                    },
                    afterLoadHandler: function (store) {
                        delete store.storeInputs.queryToken;
                        var config = thisPtr.getRemoteConfig();
                        if (!store.__extraInfo || !config || store.__extraInfo.version !== config.version) {
                            thisPtr.resetConfig();
                            if (thisPtr.versionMismatchCB) {
                                thisPtr.versionMismatchCB();
                                return;
                            }
                        }
                        var completionPercentage = this.getCompletionPercentage();
                        if (Ext.isDefined(completionPercentage) && completionPercentage != 100) {
                            this.setProgress(completionPercentage);
                            Pan.base.widgets.LoadMask.prototype.setLoadingIndication(true, this.getEl());
                            Pan.base.widgets.LoadMask.prototype.setLoadingIndicationTooltip("" + completionPercentage + "%", this.el);
                            store.storeInputs.queryToken = store.__extraInfo['query-token'];
                            this.pollTask = new Ext.util.DelayedTask(store.reload, store, []);
                            this.pollTask.delay(store.__extraInfo['poll-interval'] || 2000);
                        }
                        else {
                            this.setProgress(100, true);
                        }
                    },
                    theme: Pan.base.Constants.uiThemes[1],
                    vflex: true,
                    storeConfig: {ztype: Pan.appframework.modelview.PanGridStore},
                    storeInputs: {logType: logtype, logColumn: column},
                    recordBinderOverride: {
                        dataProxyAPI: {
                            remoteClass: 'AutoFocus',
                            api: {readSchema: {cms: schemaPath, device: schemaPath}}
                        },
                        commandXPathTemplate: {
                            getObjects: [{
                                isCmsSelected: '${isCmsSelected}',
                                queryValue: '${queryValue}',
                                logDeviceSN: '${logDeviceSN}',
                                logType: '${logType}',
                                logColumn: '${logColumn}',
                                queryToken: '${queryToken}',
                                argumentsAreJSON: true
                            }]
                        },
                        readCommandParts: ["getObjects", "isCmsSelected", "queryValue", "logDeviceSN", "logType", "logColumn", "queryToken"]
                    },
                    recordForm: {
                        hideOK: true,
                        cancelText: _T('Close'),
                        renameable: false,
                        formLabelWidth: 120,
                        ignoreValidationResult: true,
                        cls: 'autofocus-form',
                        windowConfig: {
                            width: 800,
                            shadow: false,
                            helpTopic: "autofocus_summary",
                            title: _T("AutoFocus Intelligence Summary"),
                            iconCls: ''
                        },
                        items: [{itemId: '$'}],
                        additionalPdefaults: {uiConfigSourceUntrustworthy: true}
                    }
                });
                return {
                    iconCls: 'icon-information',
                    text: _T('AutoFocus'),
                    useMiniCellSelection: true,
                    atype: 'panViewerWindowAction',
                    treePath: treePath,
                    scope: this
                };
            }
        }
    }
});
Ext.ns('Pan.monitor.autoFocus');
Pan.monitor.autoFocus.AutoFocusHttpLinkButton = Ext.extend(Pan.base.button.HttpLinkButton, {
    href: "",
    initComponent: function () {
        Pan.monitor.autoFocus.AutoFocusHttpLinkButton.superclass.initComponent.apply(this, arguments);
        if (Ext.isEmpty(this.href)) {
            PanDirect.execute("AutoFocus.getAutoFocusURL", {}, function (url) {
                if (Ext.isEmpty(this.href)) {
                    this.setValue({href: url});
                }
            }, this);
        }
    }
});
Ext.reg("autofocus-httplinkbutton", Pan.monitor.autoFocus.AutoFocusHttpLinkButton);
(function () {
    var handler = function (value) {
        if (value) {
            var saasReportArguments = decodeURIComponent(window.location.search.substring("?saas_report=".length));
            window.open('/reports/saas/saas_report.php?arguments=' + encodeURIComponent(saasReportArguments));
        }
    };
    Pan.appframework.PanAppInterface.regAppLoadHandler({key: "saas_report", handler: handler});
    return handler;
})();
Ext.ns('Pan.monitor');
Pan.monitor.LogPageSizePlugin = function (cfg) {
    cfg = cfg || {};
    if (cfg.min != undefined && cfg.max && cfg.interval) {
        cfg.data = [];
        for (var i = cfg.min; i <= cfg.max; i += cfg.interval) {
            cfg.data.push([i.toString(), i]);
        }
    }
    if (!cfg.data) {
        cfg.data = [['20', 20], ['30', 30], ['40', 40], ['50', 50], ['75', 75], ['100', 100]];
    }
    if (!cfg.value) {
        cfg.value = 20;
    }
    this.itemsPerPageText = cfg.txt || _T("per page");
    var store = new Ext.data.SimpleStore({fields: ['text', 'value'], data: cfg.data});
    Pan.monitor.LogPageSizePlugin.superclass.constructor.call(this, {
        store: store,
        value: cfg.value,
        treePath: cfg.treePath,
        mode: 'local',
        displayField: 'text',
        valueField: 'value',
        editable: false,
        allowBlank: false,
        triggerAction: 'all',
        width: 50
    });
};
Ext.extend(Pan.monitor.LogPageSizePlugin, Ext.form.ComboBox, {
    stateful: true, stateEvents: ['select'], init: function (paging) {
        paging.on('render', this.onInitView, this);
    }, getStateId: function () {
        return (this.itemId || this.treePath + '-logPageSize');
    }, getState: function () {
        var value = this.getValue();
        if (value) {
            return {pageSize: value};
        }
        return {};
    }, applyState: function (state) {
        if (state && state.pageSize) {
            this.setValue(state.pageSize);
        }
        this.pagingSize = parseInt(this.getValue(), 10);
    }, onInitView: function (paging) {
        paging.add('-', this, this.itemsPerPageText);
        var state = Ext.state.Manager.get(this.getStateId());
        if (!state) {
            this.setValue(paging.pageSize);
        }
        else {
            paging.pageSize = this.pagingSize;
        }
        this.on('select', this.onPageSizeChanged, paging);
    }, onPageSizeChanged: function (combo) {
        this.pageSize = parseInt(combo.getValue(), 10);
        this.store.changePageSize(this.pageSize);
    }
});
Ext.ns('Pan.monitor.log');
(function () {
    var logtype = '';
    var idPrefix;
    var log = PanLogging.getLogger('monitor.log.LogFilterBuilder');

    function setIdPrefix() {
        idPrefix = Ext.id(null, 'logfilterbuilder') + '-';
    }

    function id(name) {
        return idPrefix + name;
    }

    function multiselectConfig(config) {
        config = Ext.apply({
            xtype: 'multiselect',
            id: config.name ? id(config.name) : Ext.id(),
            ignoreValidationResult: true,
            width: undefined,
            height: undefined,
            allowBlank: true,
            maxSelections: 1,
            store: []
        }, config);
        return new Ext.ux.form.MultiSelect(config);
    }

    function cardLayoutConfig(config) {
        return new Pan.base.container.CardLayoutPanel(Ext.apply({
            id: config.name ? id(config.name) : Ext.id(),
            border: true,
            defaults: {border: false}
        }, config));
    }

    function connectorConfig(negateLocation) {
        negateLocation = negateLocation || 'south';
        var sel = multiselectConfig({
            region: 'center',
            name: 'connector',
            store: [['and', _T('and')], ['or', _T('or')]]
        });
        sel.on('render', function () {
            try {
                sel.setValue('and');
            }
            catch (e) {
            }
        });
        return {
            xtype: 'panel',
            layout: 'border',
            title: _T('Connector'),
            items: [sel, {
                region: negateLocation,
                xtype: 'checkbox',
                name: 'negate',
                id: id('negate'),
                boxLabel: _T('Negate')
            }]
        };
    }

    function attributeStore(logtype, filters) {
        var store = [];
        Ext.each(dbToField[logtype], function (attr) {
            var text = Pan.base.json.path(Pan.monitor.query.expressions.fieldToName, '$.' + logtype + '.' + attr);
            if (!text) {
                text = Pan.monitor.query.expressions.fieldToName.common[attr];
            }
            if (!text) {
                text = attr;
                log.info(attr + ' does not have fieldToName defined in log.query.expression.php');
            }
            if (!filters || filters.indexOf(attr) >= 0) {
                store.push([attr, text.replace(/\s/g, '&nbsp;')]);
            }
            var compare = function (a, b) {
                if (a[1] < b[1])
                    return -1;
                if (a[1] > b[1])
                    return 1;
                return 0;
            };
            store.sort(compare);
        });
        return store;
    }

    function attributeConfig(operatorPanel, filters) {
        var sel = multiselectConfig({name: 'attribute', store: attributeStore(logtype, filters)});
        sel.on('change', function (sel, val) {
            if (!operatorPanel.childrenInitialized) {
                operatorPanel.initChildren();
            }
            Ext.getCmp(id('value')).setEmptyItem();
            var ops = Pan.monitor.query.expressions.fieldToOpTypeSpec[logtype] && Pan.monitor.query.expressions.fieldToOpTypeSpec[logtype][val] ? Pan.monitor.query.expressions.fieldToOpTypeSpec[logtype][val] : Pan.monitor.query.expressions.fieldToOp[val];
            var opid = id('operator' + ops.join(''));
            var el = Ext.getCmp(opid);
            if (!el) {
                log.info(ops.join(''));
                return;
            }
            el.reset();
            operatorPanel.setAutoScroll(true);
            operatorPanel.setSize(operatorPanel.getWidth(), operatorPanel.getHeight() + 1);
            operatorPanel.doLayout();
            operatorPanel.setSize(operatorPanel.getWidth(), operatorPanel.getHeight() - 1);
            operatorPanel.doLayout();
            var l = operatorPanel.getLayout();
            l.setActiveItem(el);
        });
        operatorPanel.attributePanel = sel;
        return {
            xtype: 'panel',
            layout: 'fit',
            title: _T('Attribute'),
            items: sel,
            listeners: {
                'bodyresize': function (p, w, h) {
                    var fs = p.items.items[0].fs;
                    fs.setSize(w, h);
                }
            }
        };
    }

    function findValCmp(logtype, attr, val) {
        var cmp;
        cmp = Ext.getCmp(id('value' + logtype + attr + val));
        if (!cmp) {
            cmp = Ext.getCmp(id('value' + logtype + attr));
        }
        if (!cmp) {
            cmp = Ext.getCmp(id('value' + logtype + 'input'));
        }
        if (!cmp) {
            cmp = Ext.getCmp(id('value' + attr + val));
        }
        if (!cmp) {
            cmp = Ext.getCmp(id('value' + attr));
        }
        if (!cmp) {
            cmp = Ext.getCmp(id('value' + 'input'));
        }
        return cmp;
    }

    function operationConfig(valuePanel) {
        var items = [];
        var panel;
        panel = cardLayoutConfig({
            title: _T('Operator'),
            name: 'operator',
            items: items,
            listeners: {
                'bodyresize': function (p, w, h) {
                    p.items.each(function (ms) {
                        var fs = ms.fs;
                        if (fs) {
                            fs.setSize(w, h);
                        }
                    });
                }
            }
        });
        panel.childrenInitialized = false;
        panel.initChildren = function () {
            panel.childrenInitialized = true;
            var items = [];
            Ext.each(Pan.monitor.query.expressions.allOps, function (ops) {
                var store = [];
                Ext.each(ops, function (op) {
                    store.push([op, Pan.monitor.query.expressions.opToName[op]]);
                });
                var sel = multiselectConfig({name: 'operator' + ops.join(''), store: store});
                sel.on('change', function (sel, val) {
                    if (!valuePanel.childrenInitialized) {
                        valuePanel.initChildren();
                    }
                    var attr = panel.attributePanel.getValue();
                    var cmp = findValCmp(logtype, attr, val);
                    if (cmp.reset) {
                        cmp.reset();
                    }
                    if (val == "exists") {
                        valuePanel.setEmptyItem();
                    }
                    else {
                        var l = valuePanel.getLayout();
                        l.setActiveItem(cmp);
                        var d = valuePanel.getSize();
                        valuePanel.setSize(d.width - 1, d.height);
                        valuePanel.setSize(d.width, d.height);
                    }
                    return false;
                });
                items.push(sel);
            });
            panel.setItems(items);
        };
        return panel;
    }

    function textfieldValidate(attr, val) {
        switch (attr) {
            case"zone":
            case"zone.src":
            case"zone.dsr":
            case"rule":
            case"cmd":
            case"vsys":
            case"sctp_filter":
            case"serial":
                if (!Pan.base.validation.isObjectName(val)) {
                    return _T("Invalid name");
                }
                break;
            case"addr":
            case"addr.src":
            case"addr.dst":
            case"natsrc":
            case"natdst":
                if (!(Pan.base.validation.isIpV4AddressMask(val) || Pan.base.validation.isIpV6AddressMask(val))) {
                    return _T("Invalid IP specification");
                }
                break;
            case"port":
            case"port.src":
            case"port.dst":
            case"natsport":
            case"natdport":
            case"bytes":
            case"bytes_sent":
            case"packets":
            case"sessionid":
            case"elapsed":
            case"assoc_id":
            case"sctp_event_code":
            case"verif_tag_1":
            case"verif_tag_2":
            case"diam_avp_code":
            case"stream_id":
            case"sccp_calling_gt":
            case"chunks":
            case"chunks_sent":
            case"chunks_received":
                if (!Pan.base.validation.isNumber(val)) {
                    return _T("Invalid number");
                }
                break;
            case"threatid":
                if (!(Pan.base.validation.isNumber(val) || Pan.base.validation.isObjectName(val))) {
                    return _T("Invalid thread id/name");
                }
                break;
            case"proto":
                if (!(Pan.base.validation.inRange(val, 0, 255) || Pan.base.validation.isObjectName(val))) {
                    return _T("Invalid protocol");
                }
                break;
            case"interface":
            case"interface.src":
            case"interface.dst":
                if (!Pan.base.validation.isInterface(val)) {
                    return _T("Invalid interface");
                }
                break;
            case"host":
                if (!Pan.base.validation.isIpAddress(val)) {
                    return _T("Invalid host");
                }
                break;
            case"admin":
                if (!Pan.base.validation.isValidAdminName(val)) {
                    return _T("Invalid admin name");
                }
                break;
            case"user":
            case"user.src":
            case"user.dst":
                break;
            default:
                break;
        }
        return true;
    }

    function buildValueConfig(n, values, prefix) {
        var name = 'value' + prefix + n;
        if (n == 'srcuser' || n == 'dstuser') {
            values = {
                xtype: 'pan-combo',
                itemId: 'logfilterbuilder_' + n,
                remoteFilter: true,
                minChars: 1,
                alwaysReload: true,
                forceSelection: false,
                tpl: '<tpl for="."><div class="x-combo-list-item">'
                    + '<tpl if="display == &quot;&quot; && (name ==  &quot;srcuser&quot; || name ==  &quot;dstuser&quot;)">'
                    + 'None'
                    + '</tpl>'
                    + '<tpl if="display != &quot;&quot;">'
                    + '{display:htmlEncode}'
                    + '</tpl>'
                    + '</div></tpl>',
                store: new Pan.appframework.modelview.PanCompletionStore({
                    getLoadOptions: function () {
                        var vsysName = Pan.global.getLoc().val;
                        var xpathId = (Ext.isEmpty(vsysName) || vsysName == 'shared') ? "shared" : "vsys";
                        return {
                            "params": {
                                "action": "complete",
                                "arguments": ["execute", [{
                                    "xpathId": xpathId,
                                    "vsysName": vsysName,
                                    "xpath": Pan.acc2.GlobalFilters.getXpath(n),
                                    "argumentsAreJSON": true,
                                    "useCache": true,
                                    "query": this.baseParams.query
                                }]]
                            }
                        };
                    },
                    recordBinderOverride: Ext.apply({dataProxyAPI: {api: {complete: PanDirect.runCallback(Pan.acc2.GlobalFilters.getCompletionAPI(n))}}}, Pan.appframework.modelview.PanGridStore.prototype.recordBinderOverrideConfig)
                }),
                allowBlank: false,
                valueField: n == 'name-of-threatid' ? 'help-string' : 'value',
                noneString: (Pan.acc2.filterWithNoneOption.indexOf(n) != -1) ? Pan.base.Constants.nonestr : false,
                displayField: 'display'
            };
        }
        if (!Ext.isArray(values)) {
            var config = Ext.apply({ignoreValidationResult: true, name: name, id: id(name)}, values);
            if (config.validator === null) {
                config.validator = function (val) {
                    var attr = Ext.getCmp(id('attribute')).getValue();
                    return textfieldValidate(attr, val);
                };
            }
            return config;
        }
        else {
            var store = [];
            Ext.each(values, function (val) {
                store.push([val.value, val.text]);
            });
            return multiselectConfig({name: name, store: store});
        }
    }

    function addArrayToObject(obj, property, array) {
        if (Ext.isArray(array)) {
            if (!obj[property]) obj[property] = [];
            obj[property] = obj[property].concat(array);
        }
    }

    function valueConfig() {
        var items = [];
        var panel;
        panel = cardLayoutConfig({
            title: _T('Value'),
            name: 'value',
            items: items,
            listeners: {
                'bodyresize': function (p, w, h) {
                    p.items.each(function (ms) {
                        var fs = ms.fs;
                        if (fs) {
                            fs.setSize(w, h);
                        }
                    });
                }
            }
        });
        panel.childrenInitialized = false;
        panel.initChildren = function () {
            panel.childrenInitialized = true;
            var items = [];
            var mergedItemsObject = {};
            var common = Pan.monitor.query.expressions.valueToConfig['common'];
            for (var n in common) {
                if (common.hasOwnProperty(n)) {
                    var values = common[n];
                    addArrayToObject(mergedItemsObject, n, values);
                    items.push(buildValueConfig(n, values, ''));
                }
            }
            var alldb = ['config', 'data', 'system', 'threat', 'url', 'traffic', 'appstat', 'trsum', 'thsum', 'alarm', 'wildfire', 'userid', 'auth'];
            Ext.each(alldb, function (logtype) {
                if (!Pan.monitor.query.expressions.valueToConfig[logtype]) return;
                var logtypeValues = Pan.monitor.query.expressions.valueToConfig[logtype];
                for (var n in logtypeValues) {
                    if (logtypeValues.hasOwnProperty(n)) {
                        var values = logtypeValues[n];
                        if (values === true) {
                            continue;
                        }
                        addArrayToObject(mergedItemsObject, n, values);
                        items.push(buildValueConfig(n, values, logtype));
                    }
                }
            });
            for (n in mergedItemsObject) {
                if (mergedItemsObject.hasOwnProperty(n)) {
                    mergedItemsObject[n] = _.uniq(mergedItemsObject[n], function (element) {
                        return element.value;
                    });
                    items.push(buildValueConfig(n, mergedItemsObject[n], 'unified'));
                }
            }
            panel.setItems(items);
        };
        return panel;
    }

    function connectorRequired(target) {
        return Ext.util.Format.trim(target.getValue());
    }

    function constructFilter(target) {
        var expr = '';
        var negate = Ext.getCmp(id('negate')).getValue();
        var connector = Ext.getCmp(id('connector'));
        if (!connector.isValid()) {
            return;
        }
        connector = connector.getValue();
        var attribute = Ext.getCmp(id('attribute'));
        if (!(attribute && attribute.isValid())) {
            return;
        }
        attribute = attribute.getValue();
        var operator = Ext.getCmp(id('operator')).getLayout().activeItem;
        if (!operator || !operator.isValid()) {
            return;
        }
        operator = operator.getValue();
        if (operator == "exists") {
            if (connectorRequired(target)) {
                expr = ' ' + connector + ' ';
            }
            expr += negate ? 'not ' : '';
            expr += '(' + attribute + " neq '')";
        }
        else {
            var value = Ext.getCmp(id('value')).getLayout().activeItem;
            if (value && value.isValid()) {
                value = value.getValue();
                if (connectorRequired(target)) {
                    expr = ' ' + connector + ' ';
                }
                expr += negate ? 'not ' : '';
                expr += '(' + attribute + ' ' + operator + ' ' +
                    Pan.base.validation.quoteIfNecessary(value, attribute) + ')';
            }
        }
        if (expr) {
            appendFilter(target, expr);
        }
    }

    function appendFilter(target, filter) {
        var val = Ext.util.Format.trim(target.getValue());
        var oldLen = val.length;
        val += filter;
        target.setValue(val);
        target.selectText(oldLen, val.length);
    }

    function copyFilter(target, copyFromValue) {
        var val = Ext.util.Format.trim(copyFromValue);
        target.setValue(val);
    }

    var dbToField = Pan.monitor.query.expressions.dbToField;
    var a = [];
    if (!Pan.global.CONTEXT.isGTPEnabled) {
        a = a.concat(Pan.monitor.query.expressions.gtpOnlyFields);
    }
    if (!Pan.global.CONTEXT.isSCTPEnabled) {
        a = a.concat(Pan.monitor.query.expressions.sctpOnlyFields);
    }
    if (a.length > 0) {
        $.each(dbToField, function (logtype) {
            $.each(a, function (index, attr) {
                dbToField[logtype].remove(attr);
            });
        });
    }
    Pan.monitor.log.FilterBuilderForm = Ext.extend(Ext.Panel, {
        validate: function () {
            return true;
        }, setValue: function (report) {
            this.record = report;
        }, isDirty: function () {
            return true;
        }, customSave: true, getValue: function () {
            return this.record;
        }, changeLogtype: function (lt) {
            logtype = lt;
            Ext.getCmp(id('value')).setEmptyItem();
            Ext.getCmp(id('operator')).setEmptyItem();
            var sel = Ext.getCmp(id('attribute'));
            sel.store.loadData(attributeStore(logtype));
        }, constructor: function (config) {
            setIdPrefix();
            logtype = config.logtype;
            this.target = config.target;
            var cfg = {flex: 1, style: "border: solid #ccc 1px;"};
            var v = Ext.apply(valueConfig(), cfg);
            var o = Ext.apply(operationConfig(v), cfg);
            var a = Ext.apply(attributeConfig(o, config.filters), cfg);
            var c = Ext.apply(connectorConfig(config.negateLocation), cfg);
            var b = {
                iconCls: 'icon-add',
                handler: constructFilter.createDelegate(this, [this.target]),
                text: _T('Add'),
                maxHeight: 50,
                xtype: 'pan-linkbutton'
            };
            Ext.apply(config, {layout: 'hbox', layoutConfig: {align: 'stretch'}, items: [c, a, o, v, b]});
            Pan.monitor.log.FilterBuilderForm.superclass.constructor.call(this, config);
        }
    });
    Ext.applyIf(Pan.monitor.log.FilterBuilderForm.prototype, Pan.base.autorender.GridRecordField.prototype);
    Ext.reg('Pan.monitor.log.FilterBuilderForm', Pan.monitor.log.FilterBuilderForm);
    Pan.monitor.log.FilterBuilder = Ext.extend(Pan.base.container.Window, {
        constructor: function (config) {
            var self = this;
            setIdPrefix();
            logtype = config.logtype;
            this.target = config.target;
            var cfg = {flex: 1};
            var v = Ext.apply(valueConfig(), cfg);
            var o = Ext.apply(operationConfig(v), cfg);
            var a = Ext.apply(attributeConfig(o), cfg);
            var c = Ext.apply(connectorConfig(config.negateLocation), cfg);
            var query = new Ext.form.TextArea({
                fieldLabel: _T('Query'),
                height: 80,
                emptyText: _T('Please type (or) add a filter using the filter builder'),
                itemId: '$.query',
                value: this.target.getValue() || ''
            });
            var form = Ext.apply({
                xtype: 'pan-container',
                height: 180,
                minHeight: 180,
                layout: 'border',
                items: [{
                    region: 'north',
                    collapsible: true,
                    xtype: 'pan-container',
                    layout: 'fit',
                    height: 80,
                    minHeight: 80,
                    items: query
                }, {
                    region: 'center',
                    xtype: 'pan-container',
                    layout: 'hbox',
                    layoutConfig: {align: 'stretch'},
                    items: [c, a, o, v]
                }]
            }, config);
            Ext.apply(config, {
                title: _T("Add Log Filter"),
                maximizable: true,
                resizable: true,
                width: 740,
                height: 350,
                border: false,
                plain: true,
                layout: 'fit',
                items: form,
                modal: true,
                buttons: [{
                    text: _T('Add'), handler: function () {
                        Pan.base.util.invokeLater(100, constructFilter, window, [query]);
                    }
                }, {
                    text: _T('Apply'), handler: function () {
                        Pan.base.util.invokeLater(100, copyFilter, window, [self.target, query.getValue()]);
                        self.close();
                    }
                }, {
                    text: _T('Close'), handler: function () {
                        self.close();
                    }
                }]
            });
            Pan.monitor.log.FilterBuilder.superclass.constructor.call(this, config);
        }
    });
})();
Ext.ns('Pan.monitor.log');
Ext.apply(Pan.monitor.log, {
    defaultRenderer: function (value, metaData, record, rowIndex, colIndex, store) {
        var display = value;
        switch (this.dataIndex) {
            case'vsys':
                var hasVsysName = record && record.get && record.get('vsys_name');
                if (!hasVsysName) {
                    display = Pan.mainui.vsysRenderer(value, metaData, record, rowIndex, colIndex, store);
                }
                break;
            case'serial':
                var hasDeviceName = record && record.get && record.get('device_name');
                if (!hasDeviceName) {
                    display = Pan.mainui.serialRenderer(value);
                }
                break;
            case'time_generated':
            case'receive_time':
                display = Pan.mainui.shortReceiveTimeRenderer(value);
                break;
            case'time_acknowledged':
                if ((new Date(value)).getTime() < (new Date(Pan.base.Constants.DEFAULT_ACK_TIME)).getTime())
                    display = "";
                break;
            case'nbytes':
            case'bytes':
            case'bytes_sent':
            case'bytes_received':
                display = Pan.base.util.prettyPrintNumber(value, Pan.common.Constants.noOf1KBytes);
                break;
            case'npkts':
            case'packets':
            case'pkts_sent':
            case'pkts_received':
                display = Pan.base.util.prettyPrintNumber(value);
                break;
            case'src':
            case'srcipv6':
            case'dst':
            case'natsrc':
            case'natdst':
            case'host':
            case'ip':
            case'end_ip_addr':
                if (this.dataIndex === 'srcipv6' && value === '0.0.0.0') {
                    value = '';
                }
                var vsys = Pan.base.json.path(record, '$.data.vsys', 'shared');
                var hostname = !Pan.base.validation.isIpAddress(value) ? value : Pan.acc.whois.ip2hostnameLogViewer[vsys] && Pan.acc.whois.ip2hostnameLogViewer[vsys][value];
                if (store && store.resolvehostname && hostname) {
                    display = Pan.acc.whois.hostnameLogViewerRenderer(hostname);
                }
                else {
                    display = '<span class="resolved-log-address">' + value + '</span><span style="display:none">' + vsys + '</span>';
                }
                break;
            case"threatid":
                var threatName = isNaN(value) ? value : Pan.acc.threatNameResolve.id2threatNameLogViewer[value];
                if (threatName) {
                    display = Pan.acc.threatNameResolve.threatNameLogViewerRenderer(threatName);
                }
                else {
                    display = '<span class="resolved-log-tid">' + value + '</span>';
                }
                break;
            case"http_headers":
                display = Pan.monitor.log.httpHeaderInsertionRenderer(value);
                break;
        }
        var supportedInQuery = Pan.monitor.log.rendererMapping[this.dataIndex];
        if (supportedInQuery) {
            if (this.dataIndex === 'repeatcnt') {
                var logType = record.store.baseParams.logtype;
                var supportedCount = (logType === 'threat' && !Pan.global.isCms() || logType === 'traffic' && !Pan.global.isCms() || logType === 'gtp' || logType === 'sctp');
                if (!supportedCount) {
                    return display;
                }
            }
            return '<a class="log" href="javascript:void(0)">' + display + '</a>';
        }
        else {
            return display;
        }
    }, pcapRenderer: function (type, filename, serial, receive_time, time_generated, device_name, sessionid) {
        if (!serial) {
            serial = '';
        }
        if (!device_name) {
            device_name = '';
        }
        var onclick = String.format("Pan.monitor.log.downloadPcap('{0}','{1}','{2}','{3}','{4}','{5}','{6}'); return false;", type, filename, serial, receive_time, time_generated, device_name, sessionid);
        return String.format('<a class="log" href="javascript:void(0)" onclick="{0}"><img src="/images/download.gif"></a>', onclick);
    }, threatPcapRenderer: function (value, metaData, record) {
        if (value && value != '0') {
            var filename = value;
            return Pan.monitor.log.pcapRenderer('threat', filename, record.data['serial'], record.data['receive_time'], record.data['time_generated'], record.data['device_name'], record.data['sessionid']);
        }
        else {
            return '&#160;';
        }
    }, trafficPcapRenderer: function (value, metaData, record) {
        if (value) {
            var filename = value.replace('-', '/');
            return Pan.monitor.log.pcapRenderer('application', filename, record.data['serial'], '', '', record.data['device_name'], record.data['sessionid']);
        }
        else {
            return '&#160;';
        }
    }, matchesObjectDescriptionRenderer: function (value, metaData, record) {
        var display;
        if (record.data.objectid) {
            var schema = Pan.acc2.logs.AccCorrelationLogViewerUtils.getSchemaForObject(record.data.objectid);
            display = schema ? schema.description : "";
        }
        else {
            display = '&#160;';
        }
        return '<a class="log" href="javascript:void(0)">' + display + '</a>';
    }, dataPcapRenderer: function (value, metaData, record, rowIndex, colIndex, store, grid) {
        if (Pan.global.isCms()) {
            if (value) {
                return Pan.monitor.log.pcapRenderer('dlp', value, record.data['serial'], '', '', record.data['device_name'], record.data['sessionid']);
            }
            else {
                return '&#160;';
            }
        }
        else {
            if (value && grid.isDataAccessPasswordSet) {
                return Pan.monitor.log.pcapRenderer('dlp', value, record.data['serial'], '', '', record.data['device_name'], record.data['sessionid']);
            }
            else {
                return '&#160;';
            }
        }
    }, downloadPcap: function (type, filename, serial, receive_time, time_generated, device_name, sessionid) {
        if (type == 'dlp') {
            PanDirect.run('MonitorDirect.checkDataAccess', [serial], function (result, t) {
                if (result) {
                    Pan.monitor.log.downloadPcapCallback(type, filename, serial, receive_time, time_generated, device_name, sessionid);
                }
                else {
                    Pan.base.PasswordPrompt.prompt(_T('Data Access Password'), _T("Please enter password") + ':', function (btn, passwd) {
                        if (btn == 'ok') {
                            PanDirect.run('MonitorDirect.setDataAccess', [passwd, serial], function (result) {
                                if (result) {
                                    Pan.monitor.log.downloadPcapCallback(type, filename, serial, receive_time, time_generated, device_name, sessionid);
                                }
                                else {
                                    Pan.base.msg.warn(_T('Fail to set data access password'));
                                }
                            });
                        }
                    });
                }
            });
        }
        else {
            Pan.monitor.log.downloadPcapCallback(type, filename, serial, receive_time, time_generated, device_name, sessionid);
        }
    }, downloadPcapCallback: function (type, filename, serial, receive_time, time_generated, device_name, sessionid) {
        Ext.getBody().mask('', 'x-mask-loading-no-img');
        var win = new Pan.monitor.PcapViewer({
            type: type,
            serial: serial,
            filename: filename,
            receive_time: receive_time,
            time_generated: time_generated,
            device_name: device_name,
            sessionid: sessionid
        });
        win.on('close', function () {
            Ext.getBody().unmask(true);
        });
        win.show();
    }, httpHeaderInsertionRenderer: function (value) {
        var headerValuePairs = value.split('\n');
        if (headerValuePairs.length === 0 || headerValuePairs.length % 2 === 0) {
            return value;
        }
        var display = '';
        for (var i = 0; i < headerValuePairs.length - 1; i++) {
            display += headerValuePairs[i];
            display += (i % 2) === 0 ? ':' : ';';
        }
        return display;
    }
});
Ext.ns('Pan.monitor.log');
Ext.apply(Pan.monitor.log, {
    rendererMapping: {
        "vsys": {action: 'eq'},
        "vsys_name": {action: 'eq'},
        "serial": {action: 'eq'},
        "device_name": {action: 'eq'},
        "bytes": {action: 'eq'},
        "bytes_sent": {action: 'eq'},
        "bytes_received": {action: 'eq'},
        "packets": {action: 'eq'},
        "pkts_sent": {action: 'eq'},
        "pkts_received": {action: 'eq'},
        "tid": {action: 'eq', translated: 'threatid'},
        "threatid": {action: 'eq', translated: 'name-of-threatid'},
        "thr_category": {action: 'eq', translated: 'category-of-threatid'},
        "url": {action: 'eq'},
        "filename": {action: 'eq'},
        "misc": {action: 'eq'},
        "filedigest": {action: 'eq'},
        "machinename": {action: 'eq'},
        "os": {action: 'eq'},
        "hostid": {action: 'eq'},
        "user": {action: 'eq'},
        "mac": {action: 'eq', translated: 'mac-address'},
        "udid": {action: 'eq'},
        "devname": {action: 'eq'},
        "errcode": {action: 'eq'},
        "matchname": {action: 'eq'},
        "matchtype": {action: 'eq'},
        "receive_time": {action: 'leq'},
        "match_time": {action: 'leq'},
        "last_update_time": {action: 'leq'},
        "time_generated": {action: 'leq'},
        "subtype": {action: 'eq'},
        "category": {action: 'eq'},
        "verdict": {action: 'eq'},
        "objectname": {action: 'eq'},
        "srcloc": {action: 'eq'},
        "dstloc": {action: 'eq'},
        "srcuser": {action: 'eq', translated: 'user.src'},
        "dstuser": {action: 'eq', translated: 'user.dst'},
        "from": {action: 'eq', translated: 'zone.src'},
        "to": {action: 'eq', translated: 'zone.dst'},
        "src": {action: 'in', translated: 'addr.src'},
        "srcipv6": {action: 'in', translated: 'addr.srcipv6'},
        "dst": {action: 'in', translated: 'addr.dst'},
        "flag-mptcp-set": {action: 'has'},
        "flag-recon-excluded": {action: 'has'},
        "natsrc": {action: 'eq'},
        "natdst": {action: 'eq'},
        "natsport": {action: 'eq'},
        "natdport": {action: 'eq'},
        "sessionid": {action: 'eq'},
        "session_end_reason": {action: 'eq'},
        "flag-pcap": {action: 'has'},
        "credential-detected": {action: 'has'},
        'http_method': {action: 'eq'},
        'http_headers': {action: 'contains'},
        "flag-nat": {action: 'has'},
        "flag-proxy": {action: 'has'},
        "flag-url-denied": {action: 'has'},
        "flag-tunnel-inspected": {action: 'has'},
        "flag-decrypt-forwarded": {action: 'has'},
        "decrypt-mirror": {action: 'has'},
        "sym-return": {action: 'has'},
        "transaction": {action: 'has'},
        "captive-portal": {action: 'has'},
        "sport": {action: 'eq', translated: 'port.src'},
        "dport": {action: 'eq', translated: 'port.dst'},
        "proto": {action: 'eq'},
        "app": {action: 'eq'},
        "action": {action: 'eq'},
        "action_source": {action: 'eq'},
        "rule": {action: 'eq'},
        "admin": {action: 'eq'},
        "host": {action: 'in'},
        "client": {action: 'eq'},
        "cmd": {action: 'eq'},
        "result": {action: 'eq'},
        "severity": {action: 'eq'},
        "eventid": {action: 'eq'},
        "object": {action: 'eq'},
        "opaque": {action: 'contains', translated: 'description'},
        "desc": {action: 'eq'},
        "inbound_if": {action: 'eq', translated: 'interface.src'},
        "outbound_if": {action: 'eq', translated: 'interface.dst'},
        "contenttype": {action: 'eq'},
        "rulegroup": {action: 'eq'},
        "ack_admin": {action: 'eq'},
        "time_acknowledged": {action: 'leq'},
        "user_agent": {action: 'contains'},
        "referer": {action: 'eq'},
        "xff": {action: 'contains'},
        "sender": {action: 'contains'},
        "recipient": {action: 'contains'},
        "subject": {action: 'contains'},
        "filetype": {action: 'contains'},
        "reportid": {action: 'eq'},
        "imsi": {action: 'eq'},
        "imei": {action: 'eq'},
        "msg_type": {action: 'eq'},
        "end_ip_addr": {action: 'in'},
        "cause_code": {action: 'eq'},
        "event_code": {action: 'eq'},
        "gtp_interface": {action: 'eq'},
        "event_type": {action: 'eq'},
        "apn": {action: 'eq'},
        "area_code": {action: 'eq'},
        "cell_id": {action: 'eq'},
        "mcc": {action: 'eq'},
        "mnc": {action: 'eq'},
        "msisdn": {action: 'eq'},
        "parent_session_id": {action: 'eq'},
        "rat": {action: 'eq'},
        "teid1": {action: 'eq'},
        "teid2": {action: 'eq'},
        "sctp_event_type": {action: 'eq'},
        "assoc_end_reason": {action: 'eq'},
        "assoc_id": {action: 'eq'},
        "sctp_chunk_type": {action: 'eq'},
        "ppid": {action: 'eq'},
        "chunks": {action: 'eq'},
        "chunks_received": {action: 'eq'},
        "chunks_sent": {action: 'eq'},
        "sctp_event_code": {action: 'eq'},
        "verif_tag_1": {action: 'eq'},
        "verif_tag_2": {action: 'eq'},
        "stream_id": {action: 'eq'},
        "diam_app_id": {action: 'eq'},
        "diam_cmd_code": {action: 'eq'},
        "diam_avp_code": {action: 'eq'},
        "sccp_calling_ssn": {action: 'eq'},
        "sccp_calling_gt": {action: 'eq'},
        "op_code": {action: 'eq'},
        "sctp_cause_code": {action: 'eq'},
        "sctp_cause_code2": {action: 'eq'},
        'sctp_filter': {action: 'eq'},
        'tunnel': {action: 'eq'},
        'tunnelid': {action: 'eq'},
        'monitortag': {action: 'eq'},
        'max_encap': {action: 'eq'},
        'unknown_proto': {action: 'eq'},
        'strict_check': {action: 'eq'},
        'tunnel_fragment': {action: 'eq'},
        'sessions_created': {action: 'eq'},
        'sessions_closed': {action: 'eq'},
        'parent_start_time': {action: 'eq'},
        'start': {action: 'eq'},
        'elapsed': {action: 'eq'},
        'tunnel_insp_rule': {action: 'eq'},
        'clienttype': {action: 'eq'},
        'serverprofile': {action: 'eq'},
        'authpolicy': {action: 'eq'},
        "event": {action: 'eq'},
        "authid": {action: 'eq'},
        "authproto": {action: 'eq'},
        "vendor": {action: 'eq'},
        "normalize_user": {action: 'eq'},
        "factorno": {action: 'eq'},
        'factorcompletiontime': {action: 'eq'},
        'beginport': {action: 'eq'},
        'endport': {action: 'eq'},
        'ip': {action: 'in'},
        'timeout': {action: 'eq'},
        'factortype': {action: 'eq'},
        'datasource': {action: 'eq'},
        'datasourcetype': {action: 'eq'},
        'datasourcename': {action: 'eq'},
        'count': {action: 'eq'},
        'src_uuid': {action: 'eq'},
        'dst_uuid': {action: 'eq'},
        'repeatcnt': {action: 'eq'},
        'full-path': {action: 'contains'},
        'userbysource': {action: 'eq'},
        'flag-user-group-found': {action: 'has'},
        'flag-duplicate-user': {action: 'has'},
        'direction': {action: 'eq'}
    },
    fieldDefinitionOverride: {
        'unified': {
            "logtype": {long_name: _T("Log Type"), width: 60},
            "subtype": {long_name: _T("Log Subtype")},
            "action_source": {long_name: _T("Action Source")},
            'threatid': {long_name: _T('Name'), width: 150},
            "url_idx": {long_name: _T("URL Index")},
            "url": {long_name: _T("URL")},
            "event_type": {long_name: _T("GTP Event Type")},
            "imsi": {long_name: _T("IMSI")},
            "imei": {long_name: _T("IMEI")},
            "msg_type": {long_name: _T("GTP Message Type")},
            "end_ip_addr": {long_name: _T("End User IP Address")},
            "cause_code": {long_name: _T("GTP Cause")},
            "event_code": {long_name: _T("GTP Event Code")},
            "gtp_interface": {long_name: _T("GTP Interface")},
            'sctp_event_type': {long_name: _T('SCTP Event Type')},
            "assoc_end_reason": {long_name: _T("Association End Reason")},
            'assoc_id': {long_name: _T('Association ID')},
            'ppid': {long_name: _T('PPID')},
            'sctp_chunk_type': {long_name: _T('Chunk Type')},
            'chunks': {long_name: _T('Chunks')},
            'sctp_event_code': {long_name: _T('SCTP Event Code')},
            'verif_tag_1': {long_name: _T('Verification Tag 1')},
            'verif_tag_2': {long_name: _T('Verification Tag 2')},
            'stream_id': {long_name: _T('Stream ID')},
            'diam_app_id': {long_name: _T('Diameter Application ID')},
            'diam_cmd_code': {long_name: _T('Diameter Command Code')},
            'diam_avp_code': {long_name: _T('Diameter AVP Code')},
            'sccp_calling_ssn': {long_name: _T('SCCP Calling Party SSN')},
            'sccp_calling_gt': {long_name: _T('SCCP Calling Party GT')},
            'op_code': {long_name: _T('Operation Code')},
            'sctp_cause_code': {long_name: _T('SCTP Cause Code')},
            'sctp_filter': {long_name: _T('Filter Name')},
            'chunks_received': {long_name: _T('Chunks Received')},
            'chunks_sent': {long_name: _T('Chunks Sent')},
            "apn": {long_name: _T("APN")},
            "msisdn": {long_name: _T("MSISDN")},
            "rat": {long_name: _T("RAT")},
            "teid1": {long_name: _T("TEID1")},
            "teid2": {long_name: _T("TEID2")},
            "mcc": {long_name: _T("Serving Network MCC")},
            "mnc": {long_name: _T("Serving Network MNC")},
            "area_code": {long_name: _T("Area Code")},
            "cell_id": {long_name: _T("Cell ID")},
            "parent_session_id": {long_name: _T("Parent Session ID")},
            'normalize_user': {long_name: _T('Normalized User')},
            'authpolicy': {long_name: _T('Authentication Policy Rule')},
            'serverprofile': {long_name: _T('Server Profile')},
            "severity": {long_name: _T("Severity"), width: 70},
            'thr_category': {long_name: _T('Threat Category')}
        },
        'traffic': {
            "action_source": {long_name: _T("Action Source")},
            "subtype": {long_name: _T("Type")},
            "from": {long_name: _T("From Zone")},
            "to": {long_name: _T("To Zone")},
            "src": {long_name: _T("Source")},
            "dst": {long_name: _T("Destination")},
            "natdst": {long_name: _T("NAT Dest IP")},
            "sport": {long_name: _T("From Port")},
            "dport": {long_name: _T("To Port")},
            "inbound_if": {long_name: _T("Ingress I/F")},
            "outbound_if": {long_name: _T("Egress I/F")},
            "category": {long_name: _T("URL Category")},
            "session_end_reason": {long_name: _T("Session End Reason")},
            "src_uuid": {long_name: _T("Source UUID")},
            "dst_uuid": {long_name: _T("Destination UUID")},
            'parent_session_id': {long_name: _T('Parent Session ID')},
            'parent_start_time': {long_name: _T('Parent Start Time')},
            'monitortag': {long_name: _T('Monitor Tag')},
            'flag-tunnel-inspected': {long_name: _T('Tunnel Inspected')},
            'flag-mptcp-set': {long_name: _T('MPTCP Options')},
            'flag-recon-excluded': {long_name: _T('Recon excluded')},
            'flag-decrypt-forwarded': {long_name: _T('Decrypt Forwarded')},
            'assoc_id': {long_name: _T('Association ID')},
            'chunks': {long_name: _T('Chunks')},
            'chunks_received': {long_name: _T('Chunks Received')},
            'chunks_sent': {long_name: _T('Chunks Sent')}
        },
        'wildfire': {
            "verdict": {long_name: _T("Verdict")},
            "misc": {long_name: _T("Filename"), width: 200},
            "url": {long_name: _T("URL")},
            "filename": {long_name: _T("File Name")},
            "sender": {long_name: _T("Sender Address")},
            "recipient": {long_name: _T("Recipient Address")},
            "subject": {long_name: _T("Subject")},
            "recipient-userid": {long_name: _T("Recipient User-ID")},
            "filetype": {long_name: _T("File Type")},
            "reportid": {long_name: _T("ID")},
            "tid": {long_name: _T("Threat ID")},
            "url_idx": {long_name: _T("URL Index")},
            'parent_session_id': {long_name: _T('Parent Session ID')},
            'parent_start_time': {long_name: _T('Parent Start Time')},
            'monitortag': {long_name: _T('Monitor Tag')},
            'flag-tunnel-inspected': {long_name: _T('Tunnel Inspected')}
        },
        'threat': {
            'threatid': {long_name: _T('Name'), width: 150},
            'thr_category': {long_name: _T('Threat Category')},
            "subtype": {long_name: _T("Type")},
            "from": {long_name: _T("From Zone")},
            "to": {long_name: _T("To Zone")},
            "natdst": {long_name: _T("NAT Dest IP")},
            "sport": {long_name: _T("From Port")},
            "dport": {long_name: _T("To Port")},
            "inbound_if": {long_name: _T("Ingress I/F")},
            "outbound_if": {long_name: _T("Egress I/F")},
            "action": {width: 90},
            "url": {long_name: _T("URL")},
            "filename": {long_name: _T("File Name")},
            "url_idx": {long_name: _T("URL Index")},
            "src_uuid": {long_name: _T("Source UUID")},
            "dst_uuid": {long_name: _T("Destination UUID")},
            "sender": {long_name: _T("Sender Address")},
            "recipient": {long_name: _T("Recipient Address")},
            "subject": {long_name: _T("Subject")},
            'parent_session_id': {long_name: _T('Parent Session ID')},
            'parent_start_time': {long_name: _T('Parent Start Time')},
            'monitortag': {long_name: _T('Monitor Tag')},
            'flag-tunnel-inspected': {long_name: _T('Tunnel Inspected')},
            'contentver': {long_name: _T('Content Version')},
            'assoc_id': {long_name: _T('Association ID')},
            'ppid': {long_name: _T('PPID')}
        },
        'thsum': {
            'parent_session_id': {long_name: _T('Parent Session ID')},
            'parent_start_time': {long_name: _T('Parent Start Time')},
            'monitortag': {long_name: _T('Monitor Tag')},
            'flag-tunnel-inspected': {long_name: _T('Tunnel Inspected')},
            'contentver': {long_name: _T('Content Version')}
        },
        'url': {
            'threatid': {long_name: _T('Name')},
            "src": {long_name: _T("Source")},
            "dst": {long_name: _T("Destination")},
            "subtype": {long_name: _T("Type")},
            "misc": {long_name: _T("URL")},
            "url": {long_name: _T("URL")},
            "from": {long_name: _T("From Zone")},
            "to": {long_name: _T("To Zone")},
            "natdst": {long_name: _T("NAT Dest IP")},
            "sport": {long_name: _T("From Port")},
            "dport": {long_name: _T("To Port")},
            "inbound_if": {long_name: _T("Ingress I/F")},
            "outbound_if": {long_name: _T("Egress I/F")},
            "xff": {long_name: _T("X-Forwarded-For")},
            "referer": {long_name: _T("Referer")},
            "user_agent": {long_name: _T("User-Agent")},
            "url_idx": {long_name: _T("URL Index")},
            'parent_session_id': {long_name: _T('Parent Session ID')},
            'parent_start_time': {long_name: _T('Parent Start Time')},
            'monitortag': {long_name: _T('Monitor Tag')},
            'flag-tunnel-inspected': {long_name: _T('Tunnel Inspected')},
            "http_method": {long_name: _T("Method")},
            'http_headers': {long_name: _T("Headers Inserted")}
        },
        'data': {
            'threatid': {long_name: _T('Name')},
            "subtype": {long_name: _T("Type")},
            "misc": {long_name: _T("File Name")},
            "url": {long_name: _T("URL")},
            "filename": {long_name: _T("File Name")},
            "from": {long_name: _T("From Zone")},
            "to": {long_name: _T("To Zone")},
            "natdst": {long_name: _T("NAT Dest IP")},
            "sport": {long_name: _T("From Port")},
            "dport": {long_name: _T("To Port")},
            "inbound_if": {long_name: _T("Ingress I/F")},
            "outbound_if": {long_name: _T("Egress I/F")},
            "sender": {long_name: _T("Sender Address")},
            "recipient": {long_name: _T("Recipient Address")},
            "subject": {long_name: _T("Subject")},
            'parent_session_id': {long_name: _T('Parent Session ID')},
            'parent_start_time': {long_name: _T('Parent Start Time')},
            'monitortag': {long_name: _T('Monitor Tag')},
            'flag-tunnel-inspected': {long_name: _T('Tunnel Inspected')}
        },
        'config': {
            "admin": {long_name: _T("Administrator"), width: 95},
            "subtype": {long_name: _T("Type"), width: 60},
            "cmd": {long_name: _T("Command"), width: 60},
            "client": {width: 60},
            "result": {width: 60},
            "host": {width: 88},
            "path": {long_name: _T("Configuration Path"), width: 200},
            'before-change-preview': {long_name: _T("Before Change"), width: 100},
            'after-change-preview': {long_name: _T("After Change"), width: 100}
        },
        'system': {
            "subtype": {long_name: _T("Type"), width: 60},
            "eventid": {long_name: _T("Event"), width: 120},
            "opaque": {long_name: _T("Description"), width: 250}
        },
        'hipmatch': {"src": {long_name: _T("Source IPv4"), width: 105}, "hostid": {long_name: _T("Host ID")}},
        'alarm': {
            "receive_time": {long_name: _T("Receive Time"), width: 120},
            "admin": {long_name: _T("Admin"), width: 95},
            "src": {long_name: _T("Source"), width: 60},
            "sport": {long_name: _T("Source Port"), width: 50},
            "dst": {long_name: _T("Destination"), width: 60},
            "dport": {long_name: _T("Destination Port"), width: 50},
            "rulegroup": {long_name: _T("Rule Group"), width: 95},
            "opaque": {long_name: _T("Description"), width: 120},
            "ack_admin": {long_name: _T("Acknowledging Admin"), width: 95},
            "time_acknowledged": {long_name: _T("Time Acknowledged"), width: 120}
        },
        'corr': {
            "version": {long_name: _T('Version'), width: 50},
            "objectid": {long_name: _T('Object ID'), width: 50},
            "match_oid": {long_name: _T('Match OID'), width: 50},
            "match_time": {long_name: _T('Match Time'), width: 120},
            "last_update_time": {long_name: _T('Update Time'), width: 120},
            "host": {long_name: _T('Host'), width: 150},
            "objectname": {long_name: _T('Object Name'), width: 120},
            "object_description": {long_name: _T('Object Description'), width: 100},
            "severity": {long_name: _T('Severity'), width: 70},
            "serial": {long_name: _T('Serial'), width: 100},
            "summary": {long_name: _T('Summary'), width: 250}
        },
        'gtp': {
            "event_type": {long_name: _T("GTP Event Type")},
            "imsi": {long_name: _T("IMSI")},
            "imei": {long_name: _T("IMEI")},
            "msg_type": {long_name: _T("GTP Message Type")},
            "end_ip_addr": {long_name: _T("End User IP Address")},
            "cause_code": {long_name: _T("GTP Cause")},
            "event_code": {long_name: _T("GTP Event Code")},
            "gtp_interface": {long_name: _T("GTP Interface")},
            "apn": {long_name: _T("APN")},
            "msisdn": {long_name: _T("MSISDN")},
            "rat": {long_name: _T("RAT")},
            "teid1": {long_name: _T("TEID1")},
            "teid2": {long_name: _T("TEID2")},
            "mcc": {long_name: _T("Serving Network MCC")},
            "mnc": {long_name: _T("Serving Network MNC")},
            "area_code": {long_name: _T("Area Code")},
            "cell_id": {long_name: _T("Cell ID")},
            "parent_session_id": {long_name: _T("Parent Session ID")},
            "severity": {long_name: _T("Severity"), width: 70}
        },
        'tunnel': {
            'subtype': {long_name: _T('Type')},
            'tunnelid': {long_name: _T('Tunnel ID')},
            'rule': {long_name: _T('Security Rule')},
            'tunnel_insp_rule': {long_name: _T('Tunnel Inspection Rule')},
            'monitortag': {long_name: _T('Monitor Tag')},
            'action_source': {long_name: _T('Action Source')},
            'max_encap': {long_name: _T('Max. Encap (pkts)')},
            'unknown_proto': {long_name: _T('Unknown Protocol (pkts)')},
            'strict_check': {long_name: _T('Strict Checking (pkts)')},
            'tunnel_fragment': {long_name: _T('Tunnel Fragment (pkts)')},
            'sessions_created': {long_name: _T('Sessions Created')},
            'sessions_closed': {long_name: _T('Sessions Closed')},
            'parent_session_id': {long_name: _T('Parent Session ID')},
            'parent_start_time': {long_name: _T('Parent Start Time')}
        },
        'sctp': {
            'chunks_received': {long_name: _T('Chunks Received')},
            'chunks_sent': {long_name: _T('Chunks Sent')},
            'sctp_event_type': {long_name: _T('SCTP Event Type')},
            'assoc_id': {long_name: _T('Association ID')},
            'ppid': {long_name: _T('PPID')},
            'sctp_chunk_type': {long_name: _T('Chunk Type')},
            'src': {long_name: _T('Source Address')},
            'dst': {long_name: _T('Destination Address')},
            'assoc_end_reason': {long_name: _T('Association End Reason')},
            'chunks': {long_name: _T('Chunks')},
            'sctp_event_code': {long_name: _T('SCTP Event Code')},
            'verif_tag_1': {long_name: _T('Verification Tag 1')},
            'verif_tag_2': {long_name: _T('Verification Tag 2')},
            'stream_id': {long_name: _T('Stream ID')},
            'diam_app_id': {long_name: _T('Diameter Application ID')},
            'diam_cmd_code': {long_name: _T('Diameter Command Code')},
            'diam_avp_code': {long_name: _T('Diameter AVP Code')},
            'sccp_calling_ssn': {long_name: _T('SCCP Calling Party SSN')},
            'sccp_calling_gt': {long_name: _T('SCCP Calling Party GT')},
            'op_code': {long_name: _T('Operation Code')},
            'sctp_cause_code': {long_name: _T('SCTP Cause Code')},
            'sctp_filter': {long_name: _T('Filter Name')}
        },
        'auth': {
            'ip': {long_name: _T('IP Address')},
            'clienttype': {long_name: _T('Type')},
            'subtype': {long_name: _T('Subtype')},
            'serverprofile': {long_name: _T('Server Profile')},
            'authpolicy': {long_name: _T('Rule')},
            "event": {long_name: _T("Event")},
            "authid": {long_name: _T("Authentication ID")},
            "authproto": {long_name: _T("Authentication Protocol")},
            'normalize_user': {long_name: _T('Normalized User')},
            "factorno": {long_name: _T('Factor Number')}
        },
        'userid': {
            'beginport': {long_name: _T('Begin Port')},
            'endport': {long_name: _T('End Port')},
            'eventid': {long_name: _T('Event ID')},
            'datasource': {long_name: _T('Data Source')},
            'datasourcename': {long_name: _T('Source Name')},
            'datasourcetype': {long_name: _T('Source Type')},
            'factortype': {long_name: _T('Factor Type')},
            "factorcompletiontime": {long_name: _T('Factor Completion Time')},
            "factorno": {long_name: _T('Factor Number')},
            "userbysource": {long_name: _T('User Provided by Source')},
            "flag-user-group-found": {long_name: _T("Group Found")},
            "flag-duplicate-user": {long_name: _T("Duplicate Users")},
            'subtype': {long_name: _T('Event Type')},
            'event_type': {long_name: _T('Event Type')}
        }
    },
    getFieldDefinition: function (field, logtype) {
        var short_logtype_name;
        if (logtype) {
            short_logtype_name = logtype.replace('panorama-', '');
        }
        var obj = Ext.apply({
            'field': field,
            'unified_field': false,
            'long_name': Pan.base.util.capitalize(field),
            'bar_image': false,
            'acc_drilldown': false
        }, Pan.monitor.fieldDefinitions[field]);
        if (Pan.monitor.log.fieldDefinitionOverride[short_logtype_name] && Pan.monitor.log.fieldDefinitionOverride[short_logtype_name][field]) {
            Ext.apply(obj, Pan.monitor.log.fieldDefinitionOverride[short_logtype_name][field]);
        }
        return obj;
    }
});
if (Pan.global.isCms()) {
    Pan.monitor.log.rendererMapping["before-change-preview"] = {action: 'contains'};
    Pan.monitor.log.rendererMapping["after-change-preview"] = {action: 'contains'};
}
Ext.ns('Pan.monitor.log');
Ext.ns('Pan.monitor.log.gridColumns');
Ext.ns('Pan.monitor.log.storeColumns');
Ext.apply(Pan.monitor.log.storeColumns, {
    'unified': ['details', 'logtype', 'receive_time', 'subtype', 'sessionid', "from", "*time_generated", "to", "src", "srcuser", "dst", "dport", "app", "action", "rule", "bytes", 'threatid', 'severity', "filename", "url", 'filetype', 'event_type', 'msg_type', 'end_ip_addr', 'event_code', 'sctp_event_type', 'sctp_chunk_type', 'assoc_id', 'ppid', 'chunks', '*session_end_reason', '*ip', '*user', '*normalize_user', '*vendor', '*object', '*serverprofile', '*clienttype', '*authpolicy', '*event', '*desc', '*verdict', '*device_name'],
    'unified-excluded': [],
    'traffic': ['details', '*logtype', 'pcap-file', "receive_time", "*time_generated", "subtype", "from", "to", "src", "srcuser", "*srcloc", '*natsrc', "dst", "*dstuser", "*dstloc", '*natdst', "*sport", '*natsport', "dport", '*natdport', "*proto", "app", '*category', "action", "*action_source", "rule", 'session_end_reason', "*inbound_if", "*outbound_if", "bytes", '*bytes_sent', '*bytes_received', '*packets', '*pkts_sent', '*pkts_received', '*captive-portal', '*transaction', '*flag-proxy', '*flag-pcap', '*flag-mptcp-set', '*flag-recon-excluded', '*flag-decrypt-forwarded', '*pbf-c2s', '*pbf-s2c', '*sym-return', '*decrypt-mirror', '*repeatcnt', '*sessionid', '*logset', '*start', '*elapsed', '*flag-nat', '*src_uuid', '*dst_uuid', '*parent_session_id', '*parent_start_time', '*monitortag', '*flag-tunnel-inspected', '*imsi', '*imei', '*tunnel', '*tunnelid', '*assoc_id', '*chunks', '*chunks_received', '*chunks_sent'],
    'threat': ['details', '*logtype', 'pcap_id', 'receive_time', "*time_generated", 'subtype', 'threatid', '*thr_category', '*tid', 'from', 'to', 'src', "srcuser", "*srcloc", '*natsrc', 'dst', "*dstuser", "*dstloc", '*natdst', '*sport', '*natsport', 'dport', '*natdport', '*proto', 'app', 'action', 'severity', '*rule', "*captive-portal", "*transaction", "*flag-proxy", "*flag-pcap", "*direction", "*inbound_if", "*outbound_if", "*repeatcnt", "filename", "url", "*sessionid", "*logset", "*time_received", '*flag-nat', '*url_idx', '*src_uuid', '*dst_uuid', '*sender', '*recipient', '*subject', '*parent_session_id', '*parent_start_time', '*monitortag', '*flag-tunnel-inspected', '*imsi', '*imei', '*tunnel', '*tunnelid', '*contentver', '*assoc_id', '*ppid'],
    'wildfire': ['details', '*logtype', 'receive_time', "*time_generated", "filename", "url", '*tid', '*reportid', 'from', 'to', 'src', "srcuser", 'dst', "*dstuser", '*sport', '*natsport', 'dport', '*natdport', 'app', 'rule', '*serial', '*cloud', '*filedigest', '*sessionid', "*proto", '*inbound_if', '*outbound_if', '*direction', '*flags', '*flag-pcap', '*flag-flagged', '*flag-proxy', '*flag-url-denied', '*flag-nat', '*repeatcnt', '*logset', '*subtype', 'verdict', 'action', 'severity', '*url_idx', 'sender', 'recipient', '*subject', '*recipient-userid', 'filetype', '*parent_session_id', '*parent_start_time', '*monitortag', '*flag-tunnel-inspected', '*imsi', '*imei', '*tunnel', '*tunnelid', '**flag-wf-channel', '*device_name'],
    'url': ['details', '*logtype', 'receive_time', "*time_generated", 'category', '*contenttype', 'url', 'from', 'to', 'src', "srcuser", "*srcloc", '*natsrc', 'dst', "*dstuser", "*dstloc", '*natdst', '*sport', '*natsport', '*dport', '*natdport', 'app', 'action', '*severity', "*captive-portal", "*transaction", "*flag-proxy", "*flag-pcap", "*credential-detected", "*http_method", "*direction", "*inbound_if", "*outbound_if", "*repeatcnt", "*proto", "*rule", "*sessionid", "*logset", "*time_received", '*flag-nat', '*xff', '*referer', '*user_agent', '*url_idx', 'http_headers', '*parent_session_id', '*parent_start_time', '*monitortag', '*flag-tunnel-inspected', '*imsi', '*imei', '*tunnel', '*tunnelid'],
    'data': ['details', '*logtype', 'pktlog', 'receive_time', "*time_generated", 'category', '*subtype', "filename", "url", 'threatid', '*tid', 'from', 'to', 'src', "srcuser", "*srcloc", '*natsrc', 'dst', "*dstuser", "*dstloc", '*natdst', '*sport', '*natsport', 'dport', '*natdport', 'app', 'action', '*sender', '*recipient', '*subject', '*severity', "*captive-portal", "*transaction", "*flag-proxy", "*flag-pcap", "*direction", "*inbound_if", "*outbound_if", "*repeatcnt", "*sessionid", "*rule", '*proto', '*logset', '*time_received', '*flag-nat', '*parent_session_id', '*parent_start_time', '*monitortag', '*flag-tunnel-inspected', '*imsi', '*imei', '*tunnel', '*tunnelid'],
    'config': ['receive_time', "*time_generated", '*logtype', 'admin', 'host', 'client', 'cmd', 'result', 'path', 'full-path', 'before-change-preview', 'after-change-preview', 'seqno'],
    'system': ['receive_time', "*time_generated", '*logtype', 'subtype', 'severity', 'eventid', 'object', 'opaque'],
    'hipmatch': ['details', '*logtype', 'receive_time', "*time_generated", "src", "srcipv6", "srcuser", "machinename", "os", "matchname", "matchtype", "*hostid"],
    'alarm': ['receive_time', "*time_generated", '*logtype', 'admin', 'src', 'dst', 'sport', 'dport', 'rulegroup', 'opaque', 'ack_admin', 'time_acknowledged'],
    'corr': ["details", '*logtype', "*version", "*objectid", "*match_oid", "match_time", "last_update_time", "objectname", "src", "srcuser", "severity", "summary"],
    'gtp': ['details', '*logtype', "receive_time", "*time_generated", "*subtype", "*from", "*to", "*srcloc", '*natsrc', "*dstloc", '*natdst', "*sport", '*natsport', "*dport", '*natdport', "*proto", "*rule", "*inbound_if", "*outbound_if", '*captive-portal', '*transaction', '*flag-proxy', '*flag-pcap', '*pbf-c2s', '*pbf-s2c', '*sym-return', '*decrypt-mirror', '*repeatcnt', '*sessionid', '*start', '*elapsed', '*flag-nat', 'event_type', 'imsi', '*imei', 'msg_type', 'end_ip_addr', "src", "dst", 'app', '*cause_code', 'event_code', '*gtp_interface', 'action', '*msisdn', '*apn', '*rat', '*teid1', '*teid2', '*mcc', '*mnc', '*area_code', '*cell_id', '*parent_session_id', 'severity', '*tunnel'],
    'sctp': ['details', 'receive_time', '*time_generated', 'sctp_event_type', 'assoc_id', 'sctp_chunk_type', 'ppid', 'src', 'dst', 'severity', 'action', 'chunks', 'packets', '*logtype', '*chunks_received', '*chunks_sent', '*assoc_end_reason', '*sessionid', '*rule', '*proto', '*logset', "*srcloc", "*sport", "*from", "*inbound_if", "*dstloc", "*dport", "*to", "*outbound_if", '*pkts_received', '*pkts_sent', '*sctp_event_code', '*verif_tag_1', '*verif_tag_2', '*stream_id', '*diam_app_id', '*diam_cmd_code', '*diam_avp_code', '*sccp_calling_ssn', '*sccp_calling_gt', '*op_code', '*sctp_cause_code', '*sctp_filter'],
    'tunnel': ['details', 'receive_time', 'app', '*logtype', '*tunnel', 'tunnelid', 'monitortag', 'sessionid', 'subtype', '*action', '*action_source', 'rule', 'tunnel_insp_rule', '*session_end_reason', '*proto', '*logset', '*time_generated', '*start', '*elapsed', 'bytes', '*bytes_received', '*bytes_sent', '*repeatcnt', '*packets', '*pkts_received', '*pkts_sent', '*max_encap', '*unknown_proto', '*strict_check', '*tunnel_fragment', '*sessions_created', '*sessions_closed', 'parent_session_id', '*parent_start_time', "src", "srcuser", "*srcloc", "*sport", "from", "*inbound_if", "*natsrc", "*natsport", "dst", "dstuser", "*dstloc", "*dport", "to", "*outbound_if", "*natdst", "*natdport", '*flag-nat', '*captive-portal', '*transaction', '*flag-proxy', '*flag-pcap', '*pbf-c2s', '*pbf-s2c', '*sym-return', '*decrypt-mirror', '*flag-tunnel-inspected', '*flag-recon-excluded'],
    'userid': ['details', 'receive_time', "*time_generated", 'ip', 'user', 'timeout', 'datasource', 'datasourcename', 'datasourcetype', 'factortype', 'factorcompletiontime', 'factorno', "*repeatcnt", "*eventid", "*beginport", "*endport", "userbysource", "*flag-user-group-found", "*flag-duplicate-user", '*event_type'],
    'auth': ['*logtype', "receive_time", 'ip', 'user', 'normalize_user', 'time_generated', 'vendor', '*factorno', 'object', 'serverprofile', 'clienttype', 'subtype', 'authpolicy', 'event', 'desc', '*seqno', '*actionflags', '*config_ver', '*authid', '*logset', '*repeatcnt', 'authproto']
});
if (!Pan.global.CONTEXT.isGTPEnabled) {
    var gtpColumns = ['imsi', '*imsi', 'imei', '*imei'];
    $.each(Pan.monitor.log.storeColumns, function (db) {
        $.each(gtpColumns, function (index, column) {
            Pan.monitor.log.storeColumns[db].remove(column);
        });
    });
}
if (!Pan.global.CONTEXT.isSCTPEnabled) {
    var sctpColumns = ['assoc_id', 'ppid', 'chunks', 'chunks_received', 'chunks_sent', 'sctp_event_type', 'sctp_chunk_type', 'sctp_filter', '*assoc_id', '*ppid', '*chunks', '*chunks_received', '*chunks_sent', '*sctp_event_type', '*sctp_chunk_type', '*sctp_filter'];
    $.each(Pan.monitor.log.storeColumns, function (db) {
        $.each(sctpColumns, function (index, column) {
            Pan.monitor.log.storeColumns[db].remove(column);
        });
    });
}
var unifiedLogDefaultDatabases = Pan.global.CONTEXT.isGTPEnabled ? Pan.base.Constants.unifiedLogDefaultDatabases : Pan.base.Constants.unifiedLogDefaultDatabases.remove('gtp');
if (!Pan.global.CONTEXT.isSCTPEnabled) {
    unifiedLogDefaultDatabases = unifiedLogDefaultDatabases.remove('sctp');
}
Ext.each(unifiedLogDefaultDatabases, function (db) {
    Pan.monitor.log.storeColumns['unified'] = Pan.monitor.log.storeColumns['unified'].concat(Pan.monitor.log.storeColumns[db].filter(function (item) {
        item = item.replace(/\*/g, "");
        return (Pan.monitor.log.storeColumns['unified-excluded'].indexOf(item) < 0) && (Pan.monitor.log.storeColumns['unified'].indexOf(item) < 0) && (Pan.monitor.log.storeColumns['unified'].indexOf('*' + item) < 0);
    }));
});
Pan.monitor.log.getSeverityColorCode = function (str) {
    var colorCodeMapping = {
        '1': 'color13',
        '2': 'color3',
        '3': 'color15',
        '4': 'color6',
        '5': 'color1',
        'informational': 'color13',
        'low': 'color3',
        'medium': 'color15',
        'high': 'color6',
        'critical': 'color1'
    };
    return colorCodeMapping[str];
};
(function () {
    var idx;
    var genidx;
    Ext.each(['traffic', 'threat', 'url', 'data', 'hipmatch', 'wildfire', 'gtp', 'tunnel', 'sctp', 'userid', 'auth', 'unified'], function (db) {
        Pan.monitor.log.storeColumns[db].push('*vsys');
        Pan.monitor.log.storeColumns[db].push('*vsys_name');
    });
    if (Pan.global.CONTEXT.isCms) {
        Ext.each(['traffic', 'threat', 'url', 'data', 'config', 'system', 'gtp', 'tunnel', 'sctp', 'hipmatch', 'alarm', 'userid', 'auth'], function (db) {
            Pan.monitor.log.storeColumns[db].push('serial');
            Pan.monitor.log.storeColumns[db].push('device_name');
        });
        Pan.monitor.log.storeColumns['corr'].push('*serial');
        Pan.monitor.log.storeColumns['corr'].push('*device_name');
        for (var dbname in Pan.monitor.log.storeColumns) {
            if (Pan.monitor.log.storeColumns.hasOwnProperty(dbname)) {
                idx = Pan.monitor.log.storeColumns[dbname].indexOf("receive_time");
                genidx = Pan.monitor.log.storeColumns[dbname].indexOf("*time_generated");
                if (idx >= 0) {
                    Pan.monitor.log.storeColumns[dbname][idx] = "*receive_time";
                }
                if (genidx >= 0) {
                    Pan.monitor.log.storeColumns[dbname][genidx] = "time_generated";
                }
            }
        }
    }
    for (var logtype in Pan.monitor.log.storeColumns) if (Pan.monitor.log.storeColumns.hasOwnProperty(logtype)) {
        var isUnifiedLog = (logtype == "unified");
        Pan.monitor.log.gridColumns[logtype] = [];
        var len = Pan.monitor.log.storeColumns[logtype].length;
        for (var i = 0; i < len; i++) {
            var col = Pan.monitor.log.storeColumns[logtype][i];
            var hidden = false;
            if (col.indexOf('**') == 0) {
                col = col.substr(2);
                Pan.monitor.log.storeColumns[logtype][i] = col;
                continue;
            } else if (col.indexOf('*') == 0) {
                hidden = true;
                col = col.substr(1);
                Pan.monitor.log.storeColumns[logtype][i] = col;
            }
            var config = {fixedOrder: i};
            var field = Pan.monitor.log.getFieldDefinition(col, logtype);
            if (field['long_name']) config.header = Pan.i18n(field['long_name']);
            if (field['width']) config.width = field['width'];
            config.hidden = hidden;
            var imageColumnWidth = 28;
            var pcapHeader = '';
            if (col == 'external_link') {
                Ext.apply(config, {
                    header: '',
                    dataIndex: col,
                    hidden: false,
                    hideable: false,
                    width: imageColumnWidth,
                    renderer: function (value, metaData, record) {
                        var url = '/php/monitor/wildfire.external.link.php?' + Ext.urlEncode({
                            serial: record.data.serial,
                            id: record.data.tid
                        });
                        return '<a class="x-hyperlink" target="_blank" href="' + url + '"><img src="/images/external_link.png"/></a>';
                    }
                });
            }
            else if (col == 'severity') {
                Ext.apply(config, {
                    header: _TC(col), dataIndex: col, width: 120, renderer: function (count) {
                        var severity = count;
                        var str = severity ? severity.toString() : "";
                        if (str.match(/^(1|2|3|4|5|critical|high|informational|low|medium)$/)) {
                            if (str.match(/^(1|2|3|4|5)$/)) {
                                var severityMapping = Pan.common.Constants.SEVERITY_MAPPING;
                                var text = str ? str.toString() : "";
                                if (severityMapping[text]) {
                                    str = severityMapping[text];
                                }
                            }
                            var colorCode = Pan.monitor.log.getSeverityColorCode(str);
                            var iconColorCls = 'icon-combo-' + colorCode;
                            return '<div class="icon-tag icon-combo ' + iconColorCls + '"><span class="x-draggable"><em class="x-hyperlink">' + str + '</em></span></div>';
                        }
                        return severity;
                    }
                });
            }
            else if (col == 'details') {
                Ext.apply(config, {
                    header: '',
                    dataIndex: col,
                    hidden: false,
                    hideable: false,
                    width: imageColumnWidth,
                    renderer: function (value, metaData, record) {
                        if (metaData.grid.logtype === 'unified' && record.data['logtype'] && record.data['logtype'] === 'auth') {
                            return '';
                        }
                        return '<a class="x-hyperlink"><img src="/images/details.gif"/></a>';
                    }
                });
            }
            else if (col == 'pktlog') {
                if (!Pan.base.admin.getPermission('privacy/view-pcap-files')) {
                    continue;
                }
                if (logtype == 'data' || logtype == 'unified') {
                    Ext.apply(config, {
                        header: isUnifiedLog ? _TC(col) : pcapHeader,
                        dataIndex: col,
                        hidden: isUnifiedLog,
                        hideable: isUnifiedLog,
                        width: imageColumnWidth,
                        renderer: Pan.monitor.log.dataPcapRenderer
                    });
                }
            }
            else if (col == 'pcap_id') {
                if (!Pan.base.admin.getPermission('privacy/view-pcap-files')) {
                    continue;
                }
                Ext.apply(config, {
                    header: isUnifiedLog ? _TC('pcap-id') : pcapHeader,
                    dataIndex: col,
                    hidden: isUnifiedLog,
                    hideable: isUnifiedLog,
                    width: imageColumnWidth,
                    renderer: Pan.monitor.log.threatPcapRenderer
                });
            }
            else if (col == 'pcap-file') {
                if (!Pan.base.admin.getPermission('privacy/view-pcap-files')) {
                    continue;
                }
                Ext.apply(config, {
                    header: isUnifiedLog ? _TC(col) : pcapHeader,
                    dataIndex: col,
                    hidden: isUnifiedLog,
                    hideable: isUnifiedLog,
                    width: imageColumnWidth,
                    renderer: Pan.monitor.log.trafficPcapRenderer
                });
            }
            else if (col == 'objectname') {
                Ext.apply(config, {
                    header: "Object Name",
                    dataIndex: col,
                    width: 150,
                    renderer: Pan.monitor.log.matchesObjectDescriptionRenderer
                });
            }
            else if (col == 'serial' && logtype == 'corr') {
                Ext.apply(config, {
                    header: "Device SN",
                    dataIndex: col,
                    hidden: true,
                    hideable: false,
                    renderer: function (value) {
                        return value;
                    }
                });
            }
            else if (col == 'device_name' && logtype == 'corr') {
                Ext.apply(config, {
                    header: "Device Name",
                    dataIndex: col,
                    hidden: true,
                    hideable: false,
                    renderer: function (value) {
                        return value;
                    }
                });
            }
            else if (!Pan.global.isCms() && (col == 'src_uuid' || col == 'dst_uuid') && !Pan.global.isPhoenixVM()) {
                Ext.apply(config, {hidden: true, hideable: false});
            }
            else {
                Ext.applyIf(config, {header: _TC(col), dataIndex: col, renderer: Pan.monitor.log.defaultRenderer});
                if (col == 'bytes') {
                    config.width = 60;
                }
                else if (col == 'misc' || col == 'url' || col == 'filename' || col == 'recipient' || col == 'sender' || col == 'subject' || col == 'xff' || col == 'referer' || col == 'user_agent' || col == 'http_headers') {
                    config.wrap = false;
                }
                else if (col == 'before-change-preview' || col == 'after-change-preview') {
                    config.wrapWithEllipsis = true;
                }
                else if (col == 'threatid') {
                    config.columnActions = [{atype: 'threatDetailAction', isAcc: false}];
                }
                if (col == 'sctp_event_type') {
                    config.width = 200;
                }
                else if (col == 'ppid') {
                    config.width = 90;
                }
                else if (col == 'severity') {
                    config.width = 100;
                }
                else if (col == 'action' || col == 'chunks' || col == 'packets') {
                    config.width = 80;
                }
            }
            Pan.monitor.log.gridColumns[logtype].push(config);
        }
        Pan.monitor.log.gridColumns[logtype].sort(function (x, y) {
            if (x.hidden && y.hidden) {
                return x.header.localeCompare(y.header);
            }
            else if (x.hidden) {
                return 1;
            }
            else if (y.hidden) {
                return -1;
            }
            if (x.fixedOrder < y.fixedOrder) {
                return -1;
            }
            if (x.fixedOrder > y.fixedOrder) {
                return 1;
            }
            return 0;
        });
    }
})();
Ext.ns('Pan.monitor.log');
Pan.monitor.log.addThreatExceptionProfiles = function (scope) {
    var store = new Pan.base.autorender.GridRecordStore({
        autoDestroy: true,
        reader: new Ext.data.JsonReader({
            idProperty: 'id',
            fields: [{name: 'id', type: 'number'}, {name: 'name', type: 'string'}, {
                name: 'location',
                type: 'string'
            }, {name: 'selected', type: 'bool'}, {name: 'current', type: 'bool'}]
        }),
        autoLoad: true,
        baseParams: {
            vsys: scope.vsys,
            rule: scope.rule,
            subtype: scope.subtype,
            tid: scope['@id'],
            name: scope['@name'],
            location: scope.location
        },
        directFn: PanDirect.runCallback('MonitorDirect.getThreatExceptionProfiles')
    });
    return {
        xtype: 'pan-editorgrid',
        store: store,
        itemId: "exempt-profiles",
        vflex: true,
        autoExpandColumn: 'name',
        useCheckBoxSelection: true,
        columns: [{
            id: 'name',
            header: _T('Exempt Profiles'),
            sortable: true,
            dataIndex: 'name',
            renderer: function (value, metaData, record) {
                return value + (record.data['location'] == 'shared' ? ' (shared)' : '');
            },
            hideable: false
        }, {
            id: 'location',
            header: _T('Location'),
            sortable: true,
            dataIndex: 'location',
            hidden: true,
            hideable: false
        }, {
            id: 'current',
            header: _T("Used in current security rule"),
            width: 180,
            sortable: true,
            dataIndex: 'current',
            renderer: function (v) {
                return v ? '<img src="/images/checkmark.gif"/>' : '';
            },
            hideable: false
        }]
    };
};
Pan.monitor.log.getExemptIPConfig = function (scope) {
    if ((scope.subtype === 'spyware' || scope.subtype === 'vulnerability') && scope.category !== "dns") {
        var storeExemptIP = new Pan.base.autorender.GridRecordStore({
            localStore: true,
            fields: [{name: 'ip'}],
            autoDestroy: true
        });
        return {
            layout: 'fit',
            vflex: true,
            xtype: 'pan-editorgrid',
            allowBlank: true,
            itemId: "exempt-ip",
            useCheckBoxSelection: true,
            store: storeExemptIP,
            columns: [{
                header: _T('Exempt IP Addresses'),
                dataIndex: 'ip',
                editor: {xtype: 'pan-textfield', vtype: 'ipAndIntegerSubnetMaskV4orV6'}
            }],
            viewConfig: {scrollOffset: Pan.base.Constants.scrollOffset},
            bbar: [{atype: 'addRecordAction', checkCount: {count: 100}}, 'deleteRecordAction']
        };
    }
    else {
        return {xtype: 'hidden'};
    }
};
Pan.monitor.log.ThreatDetailViewer = Ext.extend(Pan.base.container.Window, {
    afterRender: function () {
        Pan.monitor.log.ThreatDetailViewer.superclass.afterRender.call(this);
        this.addCVELinkHandler();
        this.addThreatNameLinkHandler();
        this.addThreatIDLinkHandler();
    }, addCVELinkHandler: function () {
        var self = this;
        $('#cvelink').click(function () {
            var cveArr = Pan.base.json.path(self.threatInfo, '$.vulnerability.cve.member') || [];
            var cveValue = cveArr[0] || '';
            var logInfo = self.logInfo.initialConfig.scope;
            var logRecord = self.logInfo.record;
            logRecord.data.cve = cveValue;
            logInfo.addFilterOnClick(logRecord, 'cve');
            return false;
        });
    }, addThreatNameLinkHandler: function () {
        var self = this;
        $('#threatNamelink').click(function () {
            var logInfo = self.logInfo.initialConfig.scope;
            var logRecord = self.logInfo.record;
            logInfo.addFilterOnClick(logRecord, 'threatid');
            return false;
        });
    }, addThreatIDLinkHandler: function () {
        var self = this;
        $('#threatIDlink').click(function () {
            var logInfo = self.logInfo.initialConfig.scope;
            var logRecord = self.logInfo.record;
            logInfo.addFilterOnClick(logRecord, 'tid');
            return false;
        });
    }, constructor: function (config) {
        config = config || {};
        this.isAcc = config.isAcc;
        this.threatInfo = config.threatInfo;
        this.threatInfo.location = Pan.global.getLocVal();
        this.logInfo = config.logInfo;
        Pan.monitor.log.ThreatDetailViewer.superclass.constructor.call(this, config);
    }, onOK: function () {
        this.buttons[0].setDisabled(true);
        var self = this;
        this.grid = this.findByItemId('exempt-profiles');
        var collection = this.grid.getSelectionModel().getSelections();
        var exemptIPGrid = this.findByItemId('exempt-ip');
        var ip = [];
        if (Ext.isObject(exemptIPGrid) && self.threatInfo.subtype != 'virus') {
            var store = exemptIPGrid.getStore();
            store.getSnapshot().each(function (rec) {
                ip.push(rec.data.ip);
            }, store);
        }
        var request = [];
        if (collection && collection.length) {
            for (var i = 0; i < collection.length; i++) {
                request.push({name: collection[i].data.name, location: collection[i].data.location});
            }
            PanDirect.run('MonitorDirect.addThreatExceptionToProfiles', [{
                tid: self.threatInfo['@id'],
                subtype: self.threatInfo.subtype,
                category: self.threatInfo.category,
                profile: request,
                ip: ip
            }], function (result) {
                if (!Pan.base.isJsonSuccessResponse(result)) {
                    Pan.base.msg.error(Pan.base.extractJsonMsg(result));
                }
                Pan.global.ContextVariables.retrieveConfigChangePending();
                self.close();
            });
        }
        else {
            self.close();
        }
    }, getRBAPath: function (type) {
        var path = '';
        switch (type) {
            case'vulnerability':
                path = 'objects/security-profiles/vulnerability-protection';
                break;
            case'spyware':
                path = 'objects/security-profiles/anti-spyware';
                break;
            case'virus':
            case'wildfire':
                path = 'objects/security-profiles/antivirus';
                break;
            default:
                path = 'invalid type ' + type;
                break;
        }
        return path;
    }, initComponent: function () {
        var buttons = [];
        var rbaPath = this.getRBAPath(this.threatInfo.subtype);
        if (this.threatInfo.logtype == 'threat' && (this.threatInfo.subtype == 'spyware' || this.threatInfo.subtype == 'vulnerability' || this.threatInfo.subtype == 'virus' || this.threatInfo.subtype == 'wildfire') && Pan.base.admin.getPermission(rbaPath) == 'enable') {
            buttons.push({
                xtype: 'pan-button',
                cls: 'default-btn',
                text: _T('OK'),
                id: 'OKThreatDetailButton',
                handler: this.onOK,
                scope: this
            });
        }
        buttons.push({xtype: 'pan-button', text: _T('Cancel'), handler: this.close, scope: this});
        Ext.apply(this, {
            title: _T('Threat Details'),
            helpTopic: "threat_details",
            rbaPath: rbaPath,
            autoHeight: true,
            width: 600,
            layout: 'form',
            cls: Pan.base.Constants.formThemes[0],
            labelWidth: 80,
            items: [{
                xtype: 'pan-displayfield',
                fieldLabel: "<strong>" + _T("Name") + "</strong>",
                value: this.isAcc ? this.threatInfo['@name'] : "<a href='javascript:void(0);' id='threatNamelink'>" +
                    this.threatInfo['@name'] + "</a>"
            }, {
                xtype: 'pan-displayfield',
                fieldLabel: "<strong>" + _T("ID") + "</strong>",
                value: (function (tid, isAcc) {
                    tid = parseInt(tid, 10);
                    var result = isAcc ? tid : ("<a href='javascript:void(0);' id='threatIDlink'>" +
                        tid + "</a>");
                    result += " (<a target='_blank' href='" + Pan.base.Constants.THREAT_VAULT_API + tid + "'>View in Threat Vault</a>)";
                    return result;
                })(Pan.base.json.path(this.threatInfo, '@id') || '', this.isAcc)
            }, {
                xtype: 'pan-displayfield',
                border: false,
                readOnly: true,
                width: '98%',
                fieldLabel: "<strong>" + _T("Description") + "</strong>",
                value: Ext.util.Format.trim(this.threatInfo['description'] || '').replace(/\n\n/g, '<br/><br/>')
            }, {
                xtype: 'pan-displayfield',
                fieldLabel: "<strong>" + _T("Severity") + "</strong>",
                value: "<img src='/images/threat_" + this.threatInfo['severity'] + ".gif'/>"
            }, {
                xtype: 'pan-displayfield',
                fieldLabel: "<strong>" + _T("CVE") + "</strong>",
                value: this.isAcc ? (Pan.base.json.path(this.threatInfo, '$.vulnerability.cve.member') || []).join(', ') : "<a href='javascript:void(0);' id='cvelink'>" +
                    (Pan.base.json.path(this.threatInfo, '$.vulnerability.cve.member') || []).join(', ') + "</a>"
            }, {
                xtype: 'pan-displayfield',
                fieldLabel: "<strong>" + _T("Bugtraq ID") + "</strong>",
                value: (Pan.base.json.path(this.threatInfo, '$.vulnerability.bugtraq.member') || []).join(', ')
            }, {
                xtype: 'pan-displayfield',
                fieldLabel: "<strong>" + _T("Vendor ID") + "</strong>",
                value: (Pan.base.json.path(this.threatInfo, '$.vulnerability.vendor.member') || []).join(', ')
            }, {
                xtype: 'pan-displayfield',
                fieldLabel: "<strong>" + _T("Reference") + "</strong>",
                value: (function (refs) {
                    for (var i = 0; i < refs.length; i++) {
                        refs[i] = "<a target='_blank' href='" + refs[i] + "'>" + refs[i] + "</a>";
                    }
                    return refs;
                })(Pan.base.json.path(this.threatInfo, '$.reference.member') || []).join('<BR/>')
            }, {
                xtype: 'pan-container',
                layout: 'fit',
                vflex: true,
                height: 225,
                rfLayoutConfig: Pan.base.autorender.layout.RFTableLayoutConfig,
                columnCount: ((this.threatInfo.subtype === 'spyware' || this.threatInfo.subtype === 'vulnerability') && this.threatInfo.category !== "dns") ? 2 : 1,
                items: [Pan.monitor.log.addThreatExceptionProfiles(this.threatInfo), Pan.monitor.log.getExemptIPConfig(this.threatInfo)]
            }],
            buttons: buttons
        });
        Pan.monitor.log.ThreatDetailViewer.superclass.initComponent.apply(this, arguments);
        var grid = this.findByItemId('exempt-profiles');
        grid.selModel.addListener('selectionchange', this.onSelectionChange, this);
    }, onSelectionChange: function () {
        var grid = this.findByItemId('exempt-profiles');
        var count = grid.selModel.getCount();
        if (this.buttons[0].id == 'OKThreatDetailButton')
            this.buttons[0].setDisabled(count == 0);
    }
});
Ext.ns('Pan.monitor.log');
Pan.monitor.log.SaveFilterWin = Ext.extend(Pan.base.container.Window, {
    constructor: function (config) {
        this.query = config.query || '';
        this.logtype = config.logtype;
        Pan.monitor.log.SaveFilterWin.superclass.constructor.call(this, config);
    }, onOKClicked: function () {
        var form = this.form.getForm();
        if (form.isValid()) {
            var name = form.getValues()['name'];
            var dialog = this;
            PanDirect.run('MonitorDirect.setSavedLogQuery', [this.logtype, name, this.query], function (result) {
                if (Pan.base.json.path(result, '$.@status') != 'success') {
                    var errorMsg = Pan.base.json.path(result, '$.msg[0]');
                    if (errorMsg) {
                        Pan.base.msg.alert(errorMsg);
                    }
                    else {
                        Pan.base.msg.alert('Error saving');
                    }
                }
                dialog.close();
            });
            Pan.global.ContextVariables.retrieveConfigChangePending();
        }
    }, initComponent: function () {
        this.form = new Ext.form.FormPanel({
            layout: 'form',
            labelWidth: 50,
            bodyStyle: 'padding:5px 5px 0',
            items: {
                xtype: 'textfield',
                vtype: 'objectName',
                fieldLabel: _T('Name'),
                name: 'name',
                anchor: '100%',
                allowBlank: false
            }
        });
        Ext.applyIf(this, {
            title: _T('Save Filter'),
            layout: 'fit',
            modal: true,
            width: 300,
            height: 120,
            plain: true,
            items: this.form,
            buttons: [{text: _T('OK'), handler: this.onOKClicked, scope: this}, {
                text: _T('Cancel'),
                handler: this.close,
                scope: this
            }]
        });
        Pan.monitor.log.SaveFilterWin.superclass.initComponent.call(this);
    }
});
Ext.ns('Pan.monitor.log');
Pan.monitor.log.LoadFilterWin = Ext.extend(Pan.base.container.Window, {
    constructor: function (config) {
        this.logtype = config.logtype;
        this.query = config.query;
        Pan.monitor.log.LoadFilterWin.superclass.constructor.call(this, config);
    }, onOKClicked: function () {
        var sel = this.grid.getSelectionModel().getSelected();
        if (!sel) return;
        this.query.setValue(sel.data['query']);
        this.query.focus();
        this.close();
    }, initComponent: function () {
        var self = this;
        var reader = new Ext.data.JsonReader({
            idProperty: '@name',
            root: 'result.' + this.logtype + '.entry',
            fields: [{name: 'name', type: 'string', mapping: '@name'}, {
                name: 'query',
                type: 'string'
            }, {name: 'action'}]
        });
        var store = new Ext.data.DirectStore({
            autoDestroy: true,
            reader: reader,
            autoLoad: true,
            baseParams: {logtype: this.logtype},
            paramOrder: ['logtype'],
            paramsAsHash: false,
            directFn: PanDirect.runCallback('MonitorDirect.getSavedLogQuery')
        });
        this.grid = new Pan.base.grid.GridPanel({
            store: store,
            columns: [{header: _T("Name"), width: 120, dataIndex: 'name', sortable: true}, {
                header: _T("Query"),
                width: 200,
                dataIndex: 'query',
                sortable: true
            }, {
                header: "", width: 60, dataIndex: 'action', sortable: false, renderer: function () {
                    return "<img src='/images/clear.png'/>";
                }
            }],
            stripeRows: true,
            fitToFrame: true,
            fitContainer: true,
            height: 200,
            listeners: {
                'cellclick': function (grid, rowIdx, colIdx, evt) {
                    if (colIdx != 2 || evt.target.tagName != 'IMG') {
                        return;
                    }
                    try {
                        var store = grid.getStore();
                        var record = store.getAt(rowIdx);
                        PanDirect.run('MonitorDirect.deleteSavedLogQuery', [self.logtype, record.data.name], function (result) {
                            if (result['@status'] == 'success') {
                                store.removeAt(rowIdx);
                            }
                        });
                    }
                    catch (e) {
                    }
                }
            }
        });
        Ext.applyIf(this, {
            title: _T('Load Filter'),
            layout: 'fit',
            modal: true,
            width: 500,
            height: 300,
            plain: true,
            items: this.grid,
            buttons: [{text: _T('OK'), handler: this.onOKClicked, scope: this}, {
                text: _T('Cancel'),
                handler: this.close,
                scope: this
            }]
        });
        Pan.monitor.log.LoadFilterWin.superclass.initComponent.call(this);
    }
});
Ext.ns('Pan.monitor.log');
Pan.monitor.log.UserIDLogDetailViewer = Ext.extend(Pan.appframework.modelview.PanRecordFormViewer, {
    showButtons: false,
    storeInputs: {objectType: _T('User-ID Log Details')},
    storeConfig: {localStore: true, autoLoad: false, ztype: Pan.appframework.modelview.PanGridStore},
    recordBinderOverride: {dataProxyAPI: {api: {readSchema: "$.injected.monitor-op-cmd.schema.userid-log.entry"}}},
    fields: [Ext.applyIf({uiHint: {hidden: true}}, Pan.objects.ObjectViewer.prototype.fieldConfig.createName()), {
        name: 'top',
        childrenNames: ["$.user", "$.ip"],
        uiHint: {rfLayoutConfig: Pan.base.autorender.layout.RFColumnLayoutConfig, columnCount: 2, labelWidth: 70}
    }, {name: '$.user', uiHint: {fieldLabel: "<b>" + _T("User") + "</b>"}}, {
        name: 'bottom',
        childrenNames: ["$.vsys", "$.timeout", "$.datasource", "$.datasourcename", "$.datasourcetype", "$.factortype", "$.factorcompletiontime", "$.factorno", "$.time_generated", "$.beginport", "$.endport", "$.userbysource", "$.flag-user-group-found", "$.flag-duplicate-user", '$.event_type'],
        uiHint: {builder: 'PropertyGridBuilder', title: _T('User Information'), inlineEditing: false, isWidget: true}
    }, {name: '$.ip', uiHint: {fieldLabel: "<b>" + _T("IP Address") + "</b>"}}, {
        name: '$',
        childrenNames: ["top", "bottom"]
    }],
    setupRecord: function () {
        Pan.monitor.log.UserIDLogDetailViewer.superclass.setupRecord.apply(this, arguments);
        if (this.editRecord) {
            var logRecordData = this.initialConfig.logRecord.data;
            for (var property in logRecordData) {
                if (logRecordData.hasOwnProperty(property)) {
                    this.editRecord.data['$.' + property] = logRecordData[property];
                }
            }
        }
    },
    recordForm: {
        ignoreHasEditPermissionResult: true,
        windowConfig: {
            buttons: Pan.createActionBar([{atype: 'windowCloseAction'}]),
            buttonAlign: "right",
            title: _T("User-ID Log Details"),
            width: 600,
            autoHeight: true
        },
        items: [{dataIndex: '$'}]
    }
});
Pan.reg('User-ID_LogDetail_Viewer', Pan.monitor.log.UserIDLogDetailViewer);
Ext.ns('Pan.monitor.log');
Pan.monitor.log.LogFilterBuilderWindow = Ext.extend(Pan.base.container.Window, {
    initComponent: function () {
        Ext.apply(this, {
            itemId: 'Pan.monitor.log.LogFilterBuilderWindow',
            layout: 'fit',
            width: 800,
            minHeight: 500,
            height: 500,
            autoHeight: false,
            title: _T('Create Filter'),
            resizable: true,
            closeAction: 'close',
            modal: true,
            border: false,
            items: [{xtype: 'Pan.monitor.log.LogFilterBuilderEditor', logtype: this.logtype, query: this.query}],
            buttons: [{
                text: _T('OK'),
                xtype: 'pan-button',
                cls: 'default-btn',
                handler: this.OKHandler,
                scope: this
            }, {text: _T('Cancel'), xtype: 'pan-button', handler: this.cancelHandler, scope: this}]
        });
        Pan.monitor.log.LogFilterBuilderWindow.superclass.initComponent.call(this);
    }, cancelHandler: function () {
        PanDirect.run('MonitorDirect.clearReportAllBySession');
        PanDirect.run('MonitorDirect.clearQueryAllBySession');
        this.close();
    }, OKHandler: function () {
        var editedQuery = '';
        var currentTab = this.findByItemId('reportTabPanel').getActiveTab();
        if (currentTab && currentTab.identifier == 'builderTab') {
            editedQuery = currentTab.findByItemId('$.query').getValue();
        }
        else if (currentTab && currentTab.identifier == 'viewerTab') {
            var logGridToolBar = currentTab.grid.getTopToolbar();
            var viewFilteredLogsQueryTextArea = logGridToolBar.find('name', 'query')[0];
            editedQuery = viewFilteredLogsQueryTextArea.getValue();
        }
        if (editedQuery != undefined && editedQuery.trim() == '') {
            editedQuery = 'All Logs';
        }
        this.combo.__editRecord ? this.combo.__editRecord.set('$.match-list.entry.*.filter', editedQuery) : this.combo.setValue(editedQuery);
        PanDirect.run('MonitorDirect.clearReportAllBySession');
        PanDirect.run('MonitorDirect.clearQueryAllBySession');
        this.close();
    }
});
Ext.ns('Pan.monitor.log');
Pan.monitor.log.LogFilterBuilderEditor = Ext.extend(Pan.base.container.TabPanel, {
    cls: 'darkblue-container', validate: function () {
        if (this.validatedOnce) {
        }
        this.validatedOnce = true;
        return true;
    }, setValue: function (record) {
        this.record = record;
    }, isDirty: function () {
        return true;
    }, customSave: true, buildUI: function () {
        var recordLogType = this.recordLogType;
        var query = new Ext.form.TextArea({
            fieldLabel: _T('Query'),
            height: 80,
            emptyText: _T('Please select filter from below'),
            xtype: 'pan-textarea',
            itemId: '$.query',
            value: ''
        });
        var buildFilterTab = {
            xtype: 'panel',
            bodyStyle: 'padding:10',
            title: _T('Create Filter'),
            identifier: 'builderTab',
            layout: 'vbox',
            layoutConfig: {align: 'stretch'},
            items: [query, {
                style: 'padding-top: 5',
                flex: 1,
                xtype: 'Pan.monitor.log.FilterBuilderForm',
                logtype: recordLogType,
                target: query
            }]
        };
        var logConfig = {
            treePath: "Monitor/Logs/" + recordLogType,
            identifier: 'viewerTab',
            noTitle: false,
            title: _T('View Filtered Logs')
        };
        var viewFilteredLogsTab = Pan.create(logConfig);
        Ext.apply(this, {
            itemId: 'reportTabPanel',
            activeTab: 0,
            bodyStyle: 'padding:0; margin:0',
            layoutOnTabChange: true,
            items: [buildFilterTab, viewFilteredLogsTab],
            listeners: {
                beforetabchange: function (tabpanel, newtab, currenttab) {
                    PanDirect.run('MonitorDirect.clearReportAllBySession');
                    PanDirect.run('MonitorDirect.clearQueryAllBySession');
                    var buildFilterQueryTextArea;
                    var viewFilteredLogsQueryTextArea;
                    if (currenttab == undefined) {
                        buildFilterQueryTextArea = newtab.findByItemId('$.query');
                        if (buildFilterQueryTextArea && this.recordQuery.trim() != '') {
                            buildFilterQueryTextArea.setValue(this.recordQuery);
                        }
                    }
                    else if (currenttab.identifier == 'builderTab') {
                        var logGridToolBar = newtab.grid.getTopToolbar();
                        buildFilterQueryTextArea = currenttab.findByItemId('$.query');
                        viewFilteredLogsQueryTextArea = logGridToolBar.find('name', 'query')[0];
                        viewFilteredLogsQueryTextArea.setValue(buildFilterQueryTextArea.getValue());
                        logGridToolBar.find('iconCls', 'icon-run')[0].getEl().dom.click();
                    }
                    else if (currenttab.identifier == 'viewerTab') {
                        viewFilteredLogsQueryTextArea = currenttab.grid.getTopToolbar().find('name', 'query')[0];
                        buildFilterQueryTextArea = newtab.findByItemId('$.query');
                        buildFilterQueryTextArea.setValue(viewFilteredLogsQueryTextArea.getValue());
                    }
                }
            }
        });
    }, constructor: function (config) {
        var recordLogType = config.logtype == 'correlation' ? 'corr' : config.logtype;
        this.recordLogType = recordLogType;
        var recordQuery = config.query;
        if (!recordQuery) {
            recordQuery = '';
        }
        this.recordQuery = recordQuery;
        this.validatedOnce = false;
        this.buildUI();
        Pan.monitor.log.LogFilterBuilderEditor.superclass.constructor.apply(this, arguments);
    }
});
Ext.applyIf(Pan.monitor.log.LogFilterBuilderEditor.prototype, Pan.base.autorender.GridRecordField.prototype);
Ext.reg('Pan.monitor.log.LogFilterBuilderEditor', Pan.monitor.log.LogFilterBuilderEditor);
Ext.ns('Pan.monitor.log');
Pan.monitor.log.LogFilterBuilderInvokeAction = Ext.extend(Pan.base.action.RemoteAction, {
    constructor: function (config) {
        var cfg = Ext.apply({
            text: _T('Filter Builder'),
            iconCls: undefined,
            ref: '../LogFilterBuilderInvokeAction',
            handler: this.doAction.createDelegate(this)
        }, config);
        Pan.monitor.log.LogFilterBuilderInvokeAction.superclass.constructor.call(this, cfg);
    }, doAction: function (element) {
        var componentItemId = this.initialConfig.componentItemId;
        var filterPos = componentItemId.indexOf(".filter");
        var rootPath = componentItemId.substring(0, filterPos);
        var log = PanLogging.getLogger('monitor.log.LogFilterBuilderInvokeAction');
        log.debug('Root Path:' + rootPath);
        var logtype = null;
        var query = null;
        if (componentItemId == '$.match-list.entry.*.filter') {
            logtype = this.initialConfig.editorComponent.__pdefaults.__dataExtractor('$.match-list.entry.*.log-type');
            query = this.initialConfig.editorComponent.__pdefaults.__dataExtractor('$.match-list.entry.*.filter');
        }
        else {
            logtype = this.initialConfig.logtype;
            query = element.editorComponent.el.dom.value;
        }
        this.logFilterWindow = new Pan.monitor.log.LogFilterBuilderWindow({
            logtype: logtype,
            query: query == 'All Logs' ? '' : query,
            combo: element.editorComponent
        });
        this.logFilterWindow.show();
    }
});
Pan.areg("LogFilterBuilderInvokeAction", Pan.monitor.log.LogFilterBuilderInvokeAction);
Ext.ns('Pan.monitor.log');
Pan.monitor.log.Viewer = Ext.extend(Pan.base.grid.GridPanel, {
    supportFastRender: false,
    hasGridFilter: false,
    defaultPageSize: 20,
    forceFit: false,
    storeScrollPosition: false,
    cmsReceiveTimeConstraintComboWidth: 110,
    viewConfig: {scrollOffset: Pan.base.Constants.scrollOffset},
    theme: Pan.base.Constants.uiThemes[0],
    runOnClick: function () {
        var query = this.getQueryTextfield();
        query.saveState();
        var store = this.grid.getStore();
        store.completeReload();
    },
    findEffectiveQueries: function () {
        var store = this.grid.getStore();
        var query = this.getQueryTextfield();
        var win = new Pan.monitor.log.EffectiveQueries({
            logstore: store,
            logtype: this.logtype,
            query: query.getValue(),
            databases: this.databases,
            all_databases: this.all_databases
        });
        win.show();
    },
    clearFilter: function () {
        var query = this.getQueryTextfield();
        query.setValue('');
        query.focus();
        query.saveState();
        var store = this.grid.getStore();
        store.completeReload();
    },
    addFilter: function () {
        var win = new Pan.monitor.log.FilterBuilder({
            logtype: this._logtype || this.logtype,
            target: this.getQueryTextfield()
        });
        win.show();
    },
    saveFilter: function () {
        (new Pan.monitor.log.SaveFilterWin({logtype: this.logtype, query: this.getQueryTextfield().getValue()})).show();
    },
    loadFilter: function () {
        (new Pan.monitor.log.LoadFilterWin({logtype: this.logtype, query: this.getQueryTextfield()})).show();
    },
    pollCsvJob: function (jobid) {
        var self = this;
        PanDirect.run('PanDirect.pollQuery', [jobid, ''], function (result) {
            var status = Pan.base.json.path(result, '$.result.job.status');
            var resultfile = Pan.base.json.path(result, '$.result.job.csvpath');
            if (status == 'PEND' || status == 'ACT') {
                (function () {
                    self.pollCsvJob(jobid);
                }).defer(1500);
                return;
            }
            Ext.MessageBox.hide();
            if (status == 'FIN' && resultfile) {
                var url = '/php/monitor/log.export.csv.php?' + Ext.urlEncode({filename: resultfile});
                Ext.Msg.show({
                    title: _T('Log Export'),
                    width: 300,
                    msg: "<a target='_blank' href='" + url + "'>" + _T('Download file') + "</a>",
                    buttons: Ext.Msg.CANCEL
                });
            }
            else {
                Pan.base.msg.alert(Pan.base.extractJsonText(result));
            }
        });
    },
    exportLog: function () {
        var self = this;
        var userQuery = this.getUserQueryValue() || '';
        userQuery += this.appendImplicitFitler();
        userQuery = Ext.util.Format.trim(userQuery);
        var m = new Pan.base.widgets.LoadMask(Ext.getBody(), {msgCls: 'x-mask-loading', msg: _T("Please wait...")});
        m.show();
        this.databases = [];
        var reqObj = {logtype: this._logtype || this.logtype, query: userQuery, vsys: Pan.monitor.vsysScope()};
        if (this.logtype == 'unified') {
            this.databases = this.getSelectedUnifiedDatabases();
            reqObj.databases = this.databases;
        }
        PanDirect.run('MonitorDirect.enqueueCsvLogRequest', [reqObj], function (result) {
            m.hide();
            var jobid = Pan.base.json.path(result, '$.result.job');
            if (jobid == '0' || jobid) {
                Pan.mainui.tasks.addDescription('log', parseInt(jobid, 10), _T('{logtype} log csv export', {logtype: self.logtype}));
                Pan.Msg.show({
                    title: _T('Exporting Logs'),
                    msg: _T('Exporting logs, please wait...'),
                    buttons: Ext.MessageBox.CANCEL,
                    progressText: _T('Exporting Logs...'),
                    width: 300,
                    wait: true,
                    waitConfig: {interval: 200},
                    closable: true,
                    fn: function (btn) {
                        if (btn == 'cancel') {
                            PanDirect.run('PanDirect.stopQuery', [jobid]);
                        }
                    }
                });
                self.pollCsvJob(jobid);
            }
            else {
                Pan.base.msg.alert(Pan.base.extractJsonText(result));
            }
        });
    },
    highlightLogViewerActions: function (highlight) {
        if (this.grid) {
            var view = this.grid.getView();
            if (view && view.el) {
                var rows = view.getRows();
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].className.indexOf("not-allow-or-alert-row") >= 0 || rows[i].className.indexOf("continue-or-override-row") >= 0) {
                        if (highlight) {
                            view.addRowClass(i, 'show-color');
                        }
                        else {
                            view.removeRowClass(i, 'show-color');
                        }
                    }
                }
            }
        }
    },
    getRowClass: function (record) {
        var rowCls = '';
        var action = record.get('action');
        if (action) {
            if (action == "deny" || action == "drop" || action == "drop-icmp" || action == "rst-client" || action == "reset-server" || action == "reset-both" || action == "block-continue" || action == "block-ip" || action == "block-override" || action == "block-url" || action == "drop-all" || action == "sinkhole") {
                rowCls = 'not-allow-or-alert-row';
            }
            else if (action == "continue" || action == "override") {
                rowCls = 'continue-or-override-row';
            }
        }
        return rowCls;
    },
    getLogLinks: function () {
        var self = this;
        PanDirect.run('MonitorDirect.getDetailLogExternalLinkURL', [], function (linksresult) {
            self.loglinks = linksresult;
        });
    },
    showCompleteText: function (data, menuitem, col, record) {
        var fileName = col.dataIndex;
        if (fileName != 'before-change-preview' && fileName != 'after-change-preview')
            return Pan.monitor.log.Viewer.superclass.showCompleteText.call(this, data, menuitem);
        var scope = this;
        scope.loadMask = new Pan.base.widgets.LoadMask(scope.ownerCt.el, {});
        scope.loadMask.show();
        var args = {
            id: record.id || '',
            serial: record.get('serial'),
            receiveTime: record.get('receive_time'),
            seqno: record.get('seqno'),
            fileName: fileName
        };
        PanDirect.run('MonitorDirect.getConfigChangeDetail', [args], function (result) {
            if (scope.loadMask) {
                scope.loadMask.hide();
                scope.loadMask.destroy();
            }
            var what = (fileName.indexOf('before') >= 0) ? ' before ' : ' after ';
            var change = result;
            var h = 300;
            if (!change || change.length == 0) {
                h = 70;
                change = "  No data.";
            }
            new Pan.appframework.action.PanViewerWindowAction({
                title: _T('Configuration detail') + what + _T('changes'),
                treePath: "Pan.monitor.LogConfigDiff",
                data: change,
                height: h,
                autoWidth: true,
                constrainHeader: false,
                autoScroll: true,
                maximizable: true,
                closable: true,
                modal: true,
                buttonAlign: 'right',
                buttons: ["->", {
                    text: _T('Close'), handler: function () {
                        this.findParentByType('pan-window').close();
                    }
                }]
            }).execute();
        });
    },
    showThreatDetail: function (record) {
        this.record = record;
        var m = {
            title: _T('Querying Threat Vault'),
            msg: _T('Querying threat vault, please wait...'),
            progressText: _T('Exporting Logs...'),
            width: 300,
            wait: true,
            waitConfig: {interval: 200},
            closable: false
        };
        Pan.Msg.show(m);
        this.fn = function (result) {
            Pan.Msg.hide();
            var threat = Pan.base.json.path(result, '$.result.entry[0]');
            if (threat) {
                threat.vsys = this.record.data.vsys;
                threat.rule = this.record.data.rule;
                threat.subtype = this.record.data.subtype;
                threat.severity = this.record.data.severity;
                threat.logtype = this.logtype;
                var w = new Pan.monitor.log.ThreatDetailViewer({threatInfo: threat, logInfo: this});
                w.show();
            }
        };
        PanDirect.run('MonitorDirect.getThreatDetail', [record.data.tid], this.fn.createDelegate(this));
    },
    showHIPReport: function (record) {
        Ext.getBody().mask(_T('Loading...'), 'x-mask-loading');
        var buttons = [];
        var w = new Pan.base.container.Window({
            title: _T('Log Details'),
            height: 500,
            autoWidth: true,
            constrainHeader: false,
            autoScroll: true,
            maximizable: true,
            closable: true,
            modal: true,
            buttonAlign: 'right',
            buttons: buttons
        });
        this.logDetailWindowId = w.getId();
        w.setPosition(-1000, 0);
        w.show();
        var url, params;
        url = '/php/acc/hipreport.html.php';
        params = {
            logtype: this.logtype,
            anchor: record.id,
            responseText: this.store.responseText,
            machinename: record.data['machinename'],
            src: record.data['src'],
            srcipv6: record.data['srcipv6'],
            srcuser: record.data['srcuser'],
            vsys: record.data['vsys'],
            serial: record.data['serial'],
            useExpander: true
        };
        var ud = w.getUpdater();
        ud.on('update', function () {
            w.constrainHeader = true;
            Ext.getBody().unmask(true);
            w.center();
            var width = w.getWidth();
            w.setWidth(width);
        });
        ud.on('failure', function () {
            Ext.getBody().unmask(true);
            w.center();
            var width = w.getWidth();
            w.setWidth(width);
        });
        ud.update({params: params, url: url});
    },
    logRecordToFilter: function (record, fieldName) {
        var map = Pan.monitor.log.rendererMapping[fieldName];
        var op = (map && map.action) || 'eq';
        var value = Pan.base.validation.quoteIfNecessary(record.get(fieldName));
        var fieldkey = (!this.isExternalLog && map && map.translated) || fieldName;
        var negate = false;
        var locationFields = ["srcloc", "dstloc"];
        if (locationFields.indexOf(fieldkey) != -1) {
            var arr = record.node.children;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].localName == fieldkey && arr[i].attributes.cc.nodeValue) {
                    value = Pan.base.validation.quoteIfNecessary(arr[i].attributes.cc.nodeValue, fieldkey);
                }
            }
        }
        if (Pan.monitor.common.LogTypes.fieldIsFlag(fieldkey)) {
            negate = value == 'no';
            if (fieldkey.match(/^flag-/)) {
                value = fieldkey.replace(/^flag-/, '');
            }
            else {
                value = fieldkey;
            }
            if (Pan.monitor.common.LogTypes.fieldIsUserIdFlag(fieldkey)) {
                fieldkey = 'ugflags';
            } else {
                fieldkey = 'flags';
            }
        }
        switch (fieldkey) {
            case'misc':
                if (this.logtype == 'url') {
                    fieldkey = 'url';
                }
                else if (this.logtype == 'data') {
                    fieldkey = 'filename';
                }
                break;
            case'severity':
                var severityMapping = Pan.common.Constants.SEVERITY_MAPPING;
                var text = value ? value.toString() : "";
                if (severityMapping[text]) {
                    value = severityMapping[text];
                }
                break;
            case'http_headers':
                return this.buildQueryTermForHttpHeaders(fieldkey, op, value);
            default:
                break;
        }
        return this.buildQueryTerm(fieldkey, op, value, negate);
    },
    buildQueryTerm: function (fieldkey, op, value, negate) {
        if (!Ext.isDefined(fieldkey) || !Ext.isDefined(op) || !Ext.isDefined(value)) {
            return "";
        }
        var term = '( ' + fieldkey + " " + op + " " + value + " )";
        if (negate) {
            term = 'not ' + term;
        }
        return term;
    },
    buildQueryTermForHttpHeaders: function (fieldkey, op, value) {
        if (!Ext.isDefined(fieldkey) || !Ext.isDefined(op) || !Ext.isDefined(value)) {
            return "";
        }
        value = value.replace(/'/g, '');
        var headerValuePairs = value.split('\n');
        headerValuePairs.pop();
        var terms = [];
        for (var i = 0; i < headerValuePairs.length; i++) {
            if (i % 2 === 0) {
                var header = "'" + headerValuePairs[i] + "'";
                terms.push(this.buildQueryTerm(fieldkey, op, header));
            }
        }
        return terms.join(' and ');
    },
    addFilterOnClick: function (record, fieldName) {
        var term = this.logRecordToFilter(record, fieldName);
        var query = this.getQueryTextfield();
        var q = query.getValue();
        var oldLen = q.length;
        if (q) {
            q += ' and ' + term;
        }
        else {
            q = term;
        }
        query.setValue(q);
        query.selectText(oldLen, q.length);
        query.focus();
    },
    onCellClick: function (grid, rowIdx, colIdx, evt) {
        var fieldName = grid.getColumnModel().getDataIndex(colIdx);
        var isValidTarget = function () {
            var target = evt.getTarget();
            if (!(target.tagName == "A" || target.className == 'resolved-log-address' || target.className == 'resolved-log-tid' || target.tagName == "IMG" || target.tagName == "EM")) {
                return false;
            }
            if (fieldName == 'pktlog' || fieldName == 'pcap-file' || fieldName == 'pcap_id' || fieldName == 'external_link') {
                return false;
            }
            return true;
        };
        if (!isValidTarget()) {
            return;
        }
        var record = grid.getStore().getAt(rowIdx);
        var isDetailIcon = (fieldName == 'details' && record && record.data);
        if (isDetailIcon) {
            var urlDB;
            var computedLogType = (record.data.logtype && record.data.logtype != '') ? record.data.logtype : this.logtype;
            switch (computedLogType) {
                case'data':
                case'threat':
                case'url':
                case'traffic':
                case'wildfire':
                case'corr':
                case'gtp':
                case'tunnel':
                case'sctp':
                    urlDB = this.store.reader.getMessage(this.store.reader.xmlData);
                    Pan.monitor.log.showDetailedLog(computedLogType, record, urlDB, this.store.responseText, this);
                    break;
                case'userid':
                    new Pan.appframework.action.PanViewerWindowAction({
                        treePath: "User-ID_LogDetail_Viewer",
                        name: 'userIdLogDetails',
                        logRecord: record
                    }).execute();
                    break;
                case'mdm':
                case'hipmatch':
                    this.showHIPReport(record, computedLogType);
                    break;
            }
        }
        else {
            this.addFilterOnClick(record, fieldName);
        }
    },
    onBodyResize: function (w) {
        var filter = this.getQueryTextfield();
        var neww = this.logtype == 'unified' ? w - 158 - 18 : w - 156;
        if (Pan.global.isCms()) {
            neww -= this.cmsReceiveTimeConstraintComboWidth;
        }
        filter.setWidth(Math.max(10, neww));
        return Pan.monitor.log.Viewer.superclass.onBodyResize.apply(this, arguments);
    },
    appendImplicitFitler: function () {
        if (this.getItemId() != "Monitor/Logs/Alarms")
            return "";
        var fv = this.getQueryTextfield().value;
        if (fv && Ext.util.Format.trim(fv).length > 0 && fv.indexOf('time_acknowledged leq') >= 0 && fv.indexOf(Pan.base.Constants.DEFAULT_ACK_TIME) == -1)
            return " AND (time_acknowledged geq '" + Pan.base.Constants.DEFAULT_ACK_TIME + "')";
        return "";
    },
    getQueryTextfield: function () {
        return this.grid.getTopToolbar().find('name', 'query')[0];
    },
    getUserQueryValue: function () {
        var val = (this.grid.getTopToolbar().find('name', 'query')[0]).getValue();
        if (!Pan.global.isCms()) {
            return val;
        }
        var timeconstraint = (this.grid.getTopToolbar().find('name', 'time-constraint')[0]).getValue();
        timeconstraint = timeconstraint ? 'receive_time in ' + timeconstraint : '';
        var query = val;
        if (val && timeconstraint) {
            query = '(' + val + ')' + ' AND ( ' + timeconstraint + ')';
        }
        else if (timeconstraint) {
            query = timeconstraint;
        }
        return query;
    },
    getSelectedUnifiedDatabases: function () {
        this.databases = this.getFilteredUnifiedDatabasesByAdminRole(Pan.base.Constants.unifiedLogDefaultDatabases);
        this.all_databases = this.databases;
        var effectiveQueriesDBState = Ext.state.Manager.get('effectiveQueriesGrid');
        if (effectiveQueriesDBState) {
            var effectiveQueriesDBs = effectiveQueriesDBState["check"];
            if (effectiveQueriesDBs && effectiveQueriesDBs.length > 0) {
                this.databases = effectiveQueriesDBs;
            }
        }
        return this.databases;
    },
    getFilteredUnifiedDatabasesByAdminRole: function () {
        var filteredDatabases = [];
        var synonymdbs = {'data': 'data-filtering', 'auth': 'authentication'};
        var adminRoleLogs = Pan.base.admin.permission.monitor.logs;
        var computedDB;
        Ext.each(Pan.base.Constants.unifiedLogDefaultDatabases, function (db) {
            computedDB = synonymdbs[db] || db;
            if (adminRoleLogs[computedDB] == "enable") {
                filteredDatabases.push(db);
            }
        });
        return filteredDatabases;
    },
    buildStore: function () {
        this.databases = [];
        if (this.logtype == 'unified') {
            this.databases = this.getSelectedUnifiedDatabases();
        }
        else {
            this.databases.push(this._logtype || this.logtype);
        }
        var baseParams = {logtype: this.logtype, dir: 'bkwd', databases: this.databases};
        if (this.identifier && this.identifier == 'viewerTab') {
            baseParams.identifier = 'viewerTab';
        }
        var store = new Pan.base.data.LogStore({
            listeners: {
                pollingInProgress: {
                    fn: function (store, finish) {
                        try {
                            if (!this.toolbarLoadMask && this.el) {
                                this.toolbarLoadMask = new Pan.base.widgets.LoadMask(this.el, {showMask: false});
                            }
                            if (this.toolbarLoadMask) {
                                if (finish) {
                                    this.toolbarLoadMask.hide();
                                }
                                else {
                                    this.toolbarLoadMask.show();
                                }
                            }
                        }
                        catch (e) {
                        }
                    }, scope: this
                }
            },
            autoLoad: false,
            url: '/php/monitor/log.data.xml.php',
            baseParams: baseParams,
            logviewer: this,
            reader: new Pan.base.data.LogXmlReader({
                record: 'result/log/logs/entry',
                id: '@logid',
                totalProperty: 'result/log/logs/@count',
                messageProperty: 'result/log/logs/@urlDB'
            }, Pan.monitor.log.storeColumns[this.logtype])
        });
        this.store = store;
        store.on('loadexception', function (proxy, options, response) {
            var msg = Pan.base.extractMgmtErrmsg(response.responseXML);
            Pan.base.msg.alert(msg);
            if (this.toolbarLoadMask) {
                this.toolbarLoadMask.hide();
            }
        });
        this.addListener({
            afterrender: {
                fn: function () {
                    this.store.load.defer(1, this.store, [{
                        params: {
                            start: 0,
                            limit: this.bottomToolbar.pageSize > 0 ? this.bottomToolbar.pageSize : this.defaultPageSize
                        }
                    }]);
                    var query = this.getQueryTextfield();
                    if (query) {
                        query.saveState();
                    }
                }, scope: this
            }
        });
    },
    buildLogExportForm: function () {
        if (!document.getElementById("log.export.form")) {
            var html = ['<form id="log.export.form" method="get" target="_blank" action="/php/monitor/log.export.csv.php">', '<input type="hidden" name="logtype"/>', '<input type="hidden" name="period"/>', '<input type="hidden" name="t1"/>', '<input type="hidden" name="t2"/>', '<input type="hidden" name="query"/>', '</form>'].join('');
            var el = new Ext.Element(document.createElement('div'));
            el.dom.innerHTML = html;
            el.appendTo(document.body);
        }
    },
    constructor: function (config) {
        Ext.applyIf(this, config);
        this.logtype = config.treePath.toLowerCase().replace(/[^\/]+\//g, '');
        var extlog = 'monitor/external logs/';
        if (config.treePath.toLowerCase().indexOf(extlog) == 0) {
            this.isExternalLog = true;
            this.logtype = config.treePath.substring(extlog.length);
            this._logtype = Pan.monitor.log.extlog.logtypemapping[this.logtype] || this.logtype;
        }
        else if (this.logtype.indexOf('url') == 0) {
            this.logtype = 'url';
        }
        else if (this.logtype.indexOf('data') == 0) {
            this.logtype = 'data';
            this.isDataAccessPasswordSet = true;
            PanDirect.run('MonitorDirect.isDataAccessPasswordSet', [], function (response) {
                this.isDataAccessPasswordSet = response["@status"] === "success";
            }.createDelegate(this));
        }
        else if (this.logtype.indexOf('correlated') == 0) {
            this.logtype = 'corr';
        }
        else if (this.logtype.indexOf('config') == 0) {
            this.logtype = 'config';
        }
        else if (this.logtype.toLowerCase().indexOf('hip') == 0) {
            this.logtype = 'hipmatch';
        }
        else if (this.logtype.toLowerCase().indexOf('alarms') == 0) {
            this.logtype = 'alarm';
        }
        else if (this.logtype.toLowerCase().indexOf('wildfire') == 0) {
            this.logtype = 'wildfire';
        }
        else if (this.logtype.toLowerCase().indexOf('gtp') == 0) {
            this.logtype = 'gtp';
        }
        else if (this.logtype.toLowerCase().indexOf('sctp') == 0) {
            this.logtype = 'sctp';
        }
        else if (this.logtype.toLowerCase().indexOf('tunnel') == 0) {
            this.logtype = 'tunnel';
        }
        else if (this.logtype.toLowerCase().indexOf('user-id') == 0) {
            this.logtype = 'userid';
        }
        else if (this.logtype.toLowerCase().indexOf('authentication') == 0) {
            this.logtype = 'auth';
        }
        this.addEvents('beforeload', 'load');
        config.itemId = 'logviewer-' + config.logtype;
        this.viewConfig.getRowClass = this.getRowClass.createDelegate(this);
        Pan.monitor.log.Viewer.superclass.constructor.call(this, config);
    },
    onDestroy: function () {
        if (this.toolbarLoadMask) {
            this.toolbarLoadMask.destroy();
            this.toolbarLoadMask = undefined;
        }
        if (this.autoFocusColumnActionGenerator) {
            this.autoFocusColumnActionGenerator.destroy();
        }
        Pan.monitor.log.Viewer.superclass.onDestroy.apply(this, arguments);
    },
    initComponent: function () {
        this.getLogLinks();
        this.buildStore();
        var self = this;
        var tbar = [];
        if (this.logtype == 'unified') {
            tbar.push({
                iconCls: 'icon-open-effectivequeries',
                tooltip: _T('Effective Queries'),
                handler: this.findEffectiveQueries.createDelegate(this)
            });
        }
        tbar.push('<img src="/images/icons/magnifier.png"/>', {
            xtype: 'textfield',
            name: 'query',
            width: 400,
            stateful: this.identifier == 'viewerTab' ? false : true,
            stateId: "logviewer-" + this.logtype + '-filter',
            stateEvents: ['change'],
            getState: function () {
                var value = this.getValue();
                if (!Ext.isEmpty(value)) {
                    return {value: value};
                }
            },
            applyState: function (state) {
                var value = this.getValue();
                if (Ext.isEmpty(value) && state && state.value) {
                    this.setValue(state.value);
                }
            },
            listeners: {
                specialkey: function (f, o) {
                    if (o.getKey() == 13) {
                        self.runOnClick();
                    }
                }
            },
            value: this.query || ''
        }, {
            iconCls: 'icon-run',
            tooltip: _T('Apply Filter'),
            handler: this.runOnClick.createDelegate(this)
        }, {
            iconCls: 'icon-clear',
            tooltip: _T('Clear Filter'),
            handler: this.clearFilter.createDelegate(this)
        }, {iconCls: 'icon-add', tooltip: _T('Add Filter'), handler: this.addFilter.createDelegate(this)});
        if (!this.isExternalLog) {
            tbar.push({
                iconCls: 'icon-manage-log-filter',
                tooltip: _T('Save Filter'),
                handler: this.saveFilter.createDelegate(this)
            }, {
                iconCls: 'icon-open-filter',
                tooltip: _T('Load Filter'),
                handler: this.loadFilter.createDelegate(this)
            });
        }
        tbar.push({iconCls: 'icon-excel', tooltip: _T('Export to CSV'), handler: this.exportLog.createDelegate(this)});
        if (Pan.global.isCms()) {
            var logCollectorTimePeriods = [];
            Ext.each(["last-15-minutes", "last-hour", "last-6-hrs", "last-12-hrs", "last-24-hrs", "last-7-days", "last-30-days", "All"], function (t) {
                logCollectorTimePeriods.push([t == "All" ? "" : t, _TC(t)]);
            });
            var logCollectorTimeCombo = {
                xtype: 'pan-selectbox',
                width: this.cmsReceiveTimeConstraintComboWidth,
                name: 'time-constraint',
                value: 'last-24-hrs',
                store: logCollectorTimePeriods,
                stateful: true,
                stateId: "logviewer-cms-receivetime-constraint",
                stateEvents: ['change', 'select'],
                getState: function () {
                    return {value: this.getValue()};
                },
                applyState: function (state) {
                    this.setValue(state.value);
                },
                listeners: {'select': this.runOnClick.createDelegate(this)}
            };
            this.logtype == 'unified' ? tbar.splice(3, 0, logCollectorTimeCombo) : tbar.splice(2, 0, logCollectorTimeCombo);
        }
        Ext.apply(this, {
            itemId: self.treePath,
            hasExpander: false,
            stripeRows: true,
            cls: 'vline-on',
            border: false,
            loadMask: {showMask: false},
            store: this.store,
            columns: Pan.monitor.log.gridColumns[this.logtype],
            tbar: tbar,
            bbar: new Pan.base.widgets.LogPagingToolbar({
                pageSize: this.defaultPageSize,
                store: this.store,
                treePath: self.treePath,
                plugins: [new Pan.monitor.LogPageSizePlugin({value: this.defaultPageSize, treePath: self.treePath})]
            })
        });
        this.buildLogExportForm();
        Pan.monitor.log.Viewer.superclass.initComponent.apply(this, arguments);
        this.grid = this;
        this.grid.on('cellclick', this.onCellClick, this);
        this.grid.on('columnmove', this.onColumnMove, this);
        this.autoFocusColumnActionGenerator = new Pan.monitor.autoFocus.AutoFocusColumnAction();
        this.autoFocusColumnActionGenerator.init(this.resetColumnActions.createDelegate(this), function () {
            Pan.base.util.invokeLater(1, Pan.Msg.alert, Pan.Msg, [_T("AutoFocus API Version Mismatch"), _T("AutoFocus application interface version mismatched.  Please retry.")]);
        }.createDelegate(this));
        if (Pan.global.isHighSpeedLogFwdEnabled() && this.logtype && this.logtype != 'config' && this.logtype != 'system' && (Pan.global.isCondor() || Pan.global.isGryphon())) {
            Pan.global.showHighSpeedLogFwdMessage(this);
        }
    },
    onColumnMove: function () {
        this.highlightLogViewerActions(this.bottomToolbar.store.highlightactions);
    },
    setupColumnActions: function (col) {
        if (this.autoFocusColumnActionGenerator) {
            if (col.columnActions) {
                for (var i = col.columnActions.length - 1; i >= 0; i--) {
                    if (col.columnActions[i].initialConfig && col.columnActions[i].initialConfig.scope === this.autoFocusColumnActionGenerator) {
                        col.columnActions.splice(i, 1);
                    }
                }
            }
            var columnName = Pan.monitor.log.rendererMapping[col.dataIndex] && Pan.monitor.log.rendererMapping[col.dataIndex].translated;
            if (!columnName || !this.autoFocusColumnActionGenerator.isColumnSupported(this.logtype, columnName)) {
                columnName = col.dataIndex;
            }
            var autoFocusColumnAction = this.autoFocusColumnActionGenerator.getConfig(this.logtype, columnName);
            if (autoFocusColumnAction) {
                col.columnActions = Pan.base.util.integrateArray(col.columnActions, autoFocusColumnAction);
            }
        }
        Pan.monitor.log.Viewer.superclass.setupColumnActions.apply(this, arguments);
    }
});
Pan.reg("Monitor/Logs", Pan.monitor.log.Viewer);
Pan.reg("Monitor/External Logs", Pan.monitor.log.Viewer);
Ext.ns('Pan.monitor.log');
Pan.monitor.log.DetailedLogWin = Ext.extend(Pan.base.container.Window, {
    maxHeight: 500, constructor: function (config) {
        var detailedlogwin = this;
        config = config || {};
        Ext.apply(config, {
            title: _T('Detailed Log View'),
            closeable: false,
            minWidth: 800,
            minHeight: 500,
            height: 500,
            width: 800,
            stateful: false,
            maximizable: true,
            modal: true,
            autoScroll: false,
            layout: 'fit',
            items: {
                autoScroll: false,
                xtype: 'pan-container',
                layout: 'border',
                items: [{
                    region: 'center',
                    xtype: 'pan-container',
                    layout: 'fit',
                    itemId: 'DetailLogHolder',
                    items: [{
                        xtype: 'detaillogviewer',
                        itemId: 'detail_log_viewer',
                        detailedlogwin: detailedlogwin,
                        level: 1,
                        logtype: config.logtype,
                        data: config.data,
                        urlDB: config.urlDB,
                        responseText: config.responseText
                    }]
                }, {
                    region: 'south',
                    collapseMode: 'mini',
                    split: true,
                    itemId: config.logtype + '_detail_log_viewer_south',
                    height: 150,
                    xtype: "Pan.monitor.log.RelatedLogGridPanel",
                    level: 1,
                    logtype: config.logtype,
                    data: config.data,
                    responseText: config.responseText
                }]
            },
            plain: true,
            buttonAlign: 'left',
            buttons: ["->", {text: _T('Close'), handler: this.close, scope: this}]
        });
        Pan.monitor.log.DetailedLogWin.superclass.constructor.call(this, config);
    }, initComponent: function () {
        Pan.monitor.log.DetailedLogWin.superclass.initComponent.call(this, arguments);
    }
});
Pan.monitor.log.showDetailedLog = function (logtype, rs, urlDB, responseText, parent, windowx, windowy) {
    var win = new Pan.monitor.log.DetailedLogWin({
        data: rs,
        logtype: logtype,
        urlDB: urlDB,
        responseText: responseText,
        parent: parent,
        x: windowx,
        y: windowy
    });
    win.show();
};
Ext.ns('Pan.monitor.log');
Pan.monitor.log.DetailViewer = Ext.extend(Pan.base.container.Container, {
    constructor: function (config) {
        this.detailedlogwin = config.detailedlogwin;
        config = config || {};
        if (config.level == 1) {
            this.detailedlogwin.urlDB = config.urlDB;
        }
        if (config.logtype == Pan.monitor.log.LogType.WildFire) {
            Ext.apply(config, {
                layout: 'fit',
                cls: 'x-log-detail',
                items: [{
                    xtype: "pan-tabpanel",
                    id: "toptabpanel",
                    activeTab: 0,
                    bodyPadding: 0,
                    padding: 0,
                    border: 0,
                    items: [{
                        xtype: 'pan-container',
                        title: _T('Log Info'),
                        layout: 'fit',
                        id: 'detail_composite_container',
                        items: [{
                            xtype: 'CommonDLogCompositeViewer',
                            logtype: config.logtype,
                            data: config.data,
                            config: config
                        }]
                    }]
                }]
            });
        }
        else {
            Ext.apply(config, {
                layout: 'fit',
                items: [{
                    xtype: 'CommonDLogCompositeViewer',
                    logtype: config.logtype,
                    data: config.data,
                    config: config
                }]
            });
        }
        Pan.monitor.log.DetailViewer.superclass.constructor.call(this, config);
    }, initComponent: function () {
        Pan.monitor.log.DetailViewer.superclass.initComponent.call(this, arguments);
        if (this.logtype === 'wildfire') {
            this.showWildfireReport(this.data);
            this.retrieveEmailHdrUserIDs(this.data);
        }
    }, showWildfireReport: function (record) {
        var self = this;
        var serial = record.data.serial;
        var reportid = record.data.reportid != "0" ? record.data.reportid : record.data.tid;
        if (record.data.filedigest && record.data.cloud) {
            var filedigest = record.data.filedigest;
            var cloud = record.data.cloud;
            var flagWfChannel = record.data['flag-wf-channel'];
            PanDirect.run('LogData.wildfireReportV6Link', [serial, reportid, filedigest, cloud, flagWfChannel], function (url) {
                self.showWildfireReportAjaxCallback(record, url);
            });
        }
        else {
            PanDirect.run('LogData.wildfireReportV5Link', [serial, reportid], function (url) {
                self.showWildfireReportAjaxCallback(record, url);
            });
        }
    }, showWildfireReportAjaxCallback: function (record, url) {
        var tabs = Ext.getCmp('toptabpanel');
        tabs.add({
            layout: 'fit',
            xtype: 'iframepanel',
            title: _T('WildFire Analysis Report'),
            closeable: true,
            loadMask: true,
            defaultSrc: url
        });
    }, retrieveEmailHdrUserIDs: function (record) {
        var self = this;
        var emails = record.data.recipient;
        if (Ext.isEmpty(emails)) {
            var win = this.findParentByType(Pan.monitor.log.DetailedLogWin);
            var mask = win && win.loadMasks && win.loadMasks["Email Headers"];
            if (mask) {
                mask.hide();
                mask.destroy();
            }
            return;
        }
        var myvsys = record.data['vsys'];
        var serial = record.data['serial'];
        var allvsys = {};
        if (!Pan.global.isCms()) {
            allvsys = Pan.global.CONTEXT.accessibleVsys;
        }
        else {
            if (serial) {
                if (Pan.monitor.cmsVsys2DisplayNameMapping[serial]) {
                    allvsys = Pan.monitor.cmsVsys2DisplayNameMapping[serial];
                }
            }
        }
        for (var m in allvsys) {
            if (allvsys.hasOwnProperty(m)) {
                if (allvsys[m] == myvsys) {
                    myvsys = m;
                    break;
                }
            }
        }
        PanDirect.run('LogData.retrieveEmailHdrUserIDs', [emails, myvsys, serial], function (resp) {
            self.retrieveEmailHdrUserIDsAjaxCallback(record, resp);
        });
    }, retrieveEmailHdrUserIDsAjaxCallback: function (record, resp) {
        if (resp && resp['result'] && resp['result']['result']['entry']) {
            record.set('recipient-userid', resp['result']['result']['entry']);
            var config = {};
            config.logtype = "wildfire";
            config.data = record;
            var cont = Ext.getCmp("detail_composite_container");
            cont.removeAll();
            cont.insert(0, {xtype: 'CommonDLogCompositeViewer', logtype: "wildfire", data: record, config: config});
            cont.doLayout();
        }
        var win = this.findParentByType(Pan.monitor.log.DetailedLogWin);
        for (var m in win.loadMasks) {
            if (win.loadMasks.hasOwnProperty(m)) {
                if (win.loadMasks[m]) {
                    win.loadMasks[m].hide();
                    win.loadMasks[m].destroy();
                }
            }
        }
    }
});
Ext.reg("detaillogviewer", Pan.monitor.log.DetailViewer);
Pan.monitor.log.LogType = {
    Data: 'data',
    Threat: 'threat',
    Url: 'url',
    Traffic: 'traffic',
    WildFire: 'wildfire',
    Correlation: 'corr',
    GTP: 'gtp',
    Tunnel: 'tunnel',
    SCTP: 'sctp'
};
Pan.monitor.log.removeFooterDOM = function (c) {
    c.bwrap.dom.removeChild(c.bwrap.dom.lastChild);
};
Ext.ns('Pan.monitor.log');
Pan.monitor.log.CommonDetailedLogCompositeViewer = Ext.extend(Pan.appframework.modelview.PanCompositeViewer, {
    initComponent: function () {
        this.populateViewConfigs();
        Pan.monitor.log.CommonDetailedLogCompositeViewer.superclass.initComponent.apply(this, arguments);
    }, populateViewConfigs: function () {
        this.viewerConfigs = [];
        var logtype = this.config.data.data.logtype;
        var widgets = this.fieldsOrder[logtype];
        var logDetailWindow = this.config.detailedlogwin;
        var loglinks = logDetailWindow.initialConfig.parent.loglinks;
        if (Ext.isArray(loglinks) && loglinks.length == 0) {
            if (widgets) {
                delete widgets["Log Links"];
            }
        }
        else {
            this.populateLogLinks(loglinks, this.config.data, logtype);
        }
        this.viewerConfigs.push([]);
        this.viewerConfigs.push([]);
        this.viewerConfigs.push([]);
        var col = 0;
        for (var prop in widgets) {
            if (widgets.hasOwnProperty(prop)) {
                var val = widgets[prop];
                if (val) {
                    this.viewerConfigs[col].push({
                        xtype: 'CommonDLogPropertyWidget',
                        isPortlet: false,
                        title: prop,
                        data: this.data,
                        config: this.config,
                        orderedFields: val
                    });
                }
            }
            col++;
            if (logtype == 'wildfire' || logtype == 'url' || logtype == 'corr') {
                if (col == 3) {
                    col = 0;
                }
            }
            else {
                if (col == 3) {
                    col = 1;
                }
            }
        }
    }, fieldsOrder: Pan.monitor.common.LogTypes.fieldsOrder, populateLogLinks: function (linksresult, record, logtype) {
        var linksArr = [], groupedlinks = '';
        var linktext, linkhref;
        var k;
        for (k in linksresult) {
            if ({}.hasOwnProperty.call(linksresult, k)) {
                linktext = k;
                linkhref = linksresult[k];
                var attrs = {};
                attrs["proto"] = record.data.proto;
                attrs["direction"] = record.data.direction;
                attrs["elapsed"] = record.data.elapsed;
                attrs["recvtime_YYYY"] = record.data.receive_time ? record.data.receive_time.substring(0, 4) : undefined;
                attrs["recvtime_MM"] = record.data.receive_time ? record.data.receive_time.substring(5, 7) : undefined;
                attrs["recvtime_DD"] = record.data.receive_time ? record.data.receive_time.substring(8, 10) : undefined;
                attrs["recvtime_hh"] = record.data.receive_time ? record.data.receive_time.substring(11, 13) : undefined;
                attrs["recvtime_mm"] = record.data.receive_time ? record.data.receive_time.substring(14, 16) : undefined;
                attrs["recvtime_ss"] = record.data.receive_time ? record.data.receive_time.substring(17, 19) : undefined;
                if (logtype == 'threat' && record.data.direction == 'server-to-client') {
                    attrs["suser"] = record.data.dstuser;
                    attrs["duser"] = record.data.srcuser;
                    attrs["src"] = record.data.dst;
                    attrs["dst"] = record.data.src;
                    attrs["sport"] = record.data.dport;
                    attrs["dport"] = record.data.sport;
                    attrs["szone"] = record.data.to;
                    attrs["dzone"] = record.data.from;
                    attrs["ingress"] = record.data.outbound_if;
                    attrs["egress"] = record.data.inbound_if;
                }
                else {
                    attrs["suser"] = record.data.srcuser;
                    attrs["duser"] = record.data.dstuser;
                    attrs["src"] = record.data.src;
                    attrs["dst"] = record.data.dst;
                    attrs["sport"] = record.data.sport;
                    attrs["dport"] = record.data.dport;
                    attrs["szone"] = record.data.from;
                    attrs["dzone"] = record.data.to;
                    attrs["ingress"] = record.data.inbound_if;
                    attrs["egress"] = record.data.outbound_if;
                }
                attrs["filedigest"] = record.data.filedigest;
                linkhref = this.updatelinkhref(linkhref, attrs);
            }
            linksArr.push({text: linktext, href: linkhref});
        }
        groupedlinks += '<ul>';
        for (k = 0; k < linksArr.length; k++) {
            linktext = linksArr[k].text;
            linkhref = linksArr[k].href;
            groupedlinks += '<li><a target=_blank href="' + linkhref + '">' + '- ' + linktext + '</a></li>';
        }
        groupedlinks += '</ul>';
        if (record.set) {
            record.set('loglinks', groupedlinks);
        }
        else {
            record.data.loglinks = groupedlinks;
        }
    }, updatelinkhref: function (linkhref, attrs) {
        var attrname, attrval;
        for (var k in attrs) {
            if ({}.hasOwnProperty.call(attrs, k)) {
                attrname = k;
                attrval = attrs[k];
                linkhref = (attrval != '' && attrval != undefined && attrval != 'undefined') ? linkhref.replace("{" + attrname + "}", encodeURIComponent(attrval)) : linkhref.replace("{" + attrname + "}", "");
            }
        }
        return linkhref;
    }
});
Ext.reg('CommonDLogCompositeViewer', Pan.monitor.log.CommonDetailedLogCompositeViewer);
Ext.ns('Pan.monitor.log');
Pan.monitor.log.CommonDetailedLogPropertyWidget = Ext.extend(Pan.appframework.modelview.PanPortletViewer, {
    rbaPath: ['monitor/logs'],
    boxMaxWidth: 550,
    recordForm: {items: [{itemId: 'root'}]},
    storeInputs: {objectType: _T("Logs")},
    storeConfig: {ztype: Pan.appframework.modelview.PanGridStore, autoLoad: false},
    populate: function () {
        var info = this.data.data;
        var data = {'root': info};
        var rec = new this.store.recordType();
        rec.data = data;
        var basicForm = this.getForm();
        basicForm.loadRecord(rec);
    },
    constructor: function (config) {
        this.addFields(config);
        Pan.monitor.log.CommonDetailedLogPropertyWidget.superclass.constructor.apply(this, arguments);
    },
    addFields: function (config) {
        var logDetailWidget = this;
        if (config.title == 'Log Links') {
            this.rootField = {
                name: 'root',
                childrenNames: [],
                uiHint: {
                    builder: 'PropertyGridBuilder',
                    inlineEditing: false,
                    isWidget: true,
                    titleColumnConfig: {width: 10, fixed: true}
                }
            };
        }
        else {
            this.rootField = {
                name: 'root', childrenNames: [], uiHint: {
                    builder: 'PropertyGridBuilder',
                    inlineEditing: false,
                    isWidget: true,
                    titleColumnConfig: {width: 110, fixed: true},
                    showCompleteText: Pan.base.util.createExtension(function (data, menuitem, col, record) {
                        if (col.showCompleteText) {
                            return col.showCompleteText(data, menuitem, col, record, this);
                        }
                        else {
                            arguments.callee.superFunction.apply(this, arguments);
                        }
                    }, Pan.base.grid.GridPanel.prototype.showCompleteText)
                }
            };
        }
        this.recordFormTitle = config.title;
        config.fields = [];
        config.fields.push(this.rootField);
        var info = config.data.data;
        var skipNat = true;
        if (info['flag-nat'] == 'yes') {
            skipNat = false;
        }
        if (info['reportid']) {
            info['reportid'] = info['reportid'] != "0" ? info['reportid'] : info['tid'];
        }
        var orderedFields = config.orderedFields;
        var fld;
        var boolFields = ["flag-pcap", "flag-nat", "flag-proxy", "flag-url-denied", "flag-decrypt-forwarded", "decrypt-mirror", "sym-return", "transaction", "captive-portal", "flag-mptcp-set", "pbf-c2s", "pbf-s2c", "client-to-server", "server-to-client", "flag-tunnel-inspected", "credential-detected", "flag-recon-excluded"];
        for (var i = 0; i < orderedFields.length; i++) {
            if (orderedFields[i]) {
                var fldname = orderedFields[i];
                var fldtitle = this.fieldsMaps[info.logtype][fldname];
                if (fldtitle) {
                    if (skipNat) {
                        var pattern = /^nat(\S)*/g;
                        if (pattern.test(fldname)) {
                            continue;
                        }
                    }
                    if (fldname == 'direction' && info['direction']) {
                        info[info['direction']] = "yes";
                        continue;
                    }
                    if (fldname == "vsys" && info['vsys']) {
                        var myserial = info["serial"];
                        var myvsys = info['vsys'];
                        if (Pan.global.isCms()) {
                            if (myserial) {
                                if (Pan.monitor.cmsVsys2DisplayNameMapping[myserial]) {
                                    var myserialobj = Pan.monitor.cmsVsys2DisplayNameMapping[myserial];
                                    if (myserialobj[myvsys]) {
                                        info['vsys'] = myserialobj[myvsys];
                                    }
                                }
                            }
                        }
                        else {
                            info['vsys'] = info['vsys_name'];
                        }
                    }
                    if (fldname == "catlink") {
                        if (info.logtype == Pan.monitor.log.LogType.Url) {
                            if (config.config.urlDB) {
                                var rcurl = config.config.urlDB == 'paloaltonetworks' ? 'http://urlfiltering.paloaltonetworks.com/testASite.aspx' : 'http://www.brightcloud.com/support/changerequest.php';
                                if (config.config.urlDB == 'paloaltonetworks' && !Pan.global.isCmsSelected()) {
                                    fld = {
                                        name: 'catlink',
                                        uiHint: {
                                            fieldLabel: '',
                                            columnConfig: {
                                                editor: {
                                                    xtype: 'propertygridlinkeditor',
                                                    onValueClick: function () {
                                                        return Pan.monitor.CategoryChangeViewer.showForm(info['url'], info['category']);
                                                    }
                                                }, renderer: Pan.renderer({
                                                    xtype: 'LabelRenderer', text: function () {
                                                        return '<em class="x-hyperlink">' + _T("Request Categorization Change") + '</em>';
                                                    }
                                                })
                                            }
                                        }
                                    };
                                }
                                else {
                                    fld = {
                                        name: 'catlink',
                                        uiHint: {
                                            fieldLabel: '',
                                            columnConfig: {
                                                editor: {
                                                    xtype: 'propertygridlinkeditor',
                                                    onValueClick: function () {
                                                        window.open(rcurl);
                                                    }
                                                }, renderer: Pan.renderer({
                                                    xtype: 'LabelRenderer', text: function () {
                                                        return '<em class="x-hyperlink">' + _T("Request Categorization Change") + '</em>';
                                                    }
                                                })
                                            }
                                        }
                                    };
                                }
                                config.fields.push(fld);
                                this.rootField.childrenNames.push(fld.name);
                            }
                        }
                        continue;
                    }
                    if (fldname == "view_parent_link") {
                        if ((info.logtype == Pan.monitor.log.LogType.Traffic || info.logtype == Pan.monitor.log.LogType.Threat || info.logtype == Pan.monitor.log.LogType.Data || info.logtype == Pan.monitor.log.LogType.WildFire || info.logtype == Pan.monitor.log.LogType.Url) && (Pan.base.Constants.otherTunnels.indexOf(info.tunnel) != -1)) {
                            fld = {
                                name: 'view_parent_link',
                                uiHint: {
                                    fieldLabel: '',
                                    columnConfig: {
                                        editor: {
                                            xtype: 'propertygridlinkeditor', onValueClick: function () {
                                                logDetailWidget.openParentSessionLog(info);
                                            }
                                        }, renderer: Pan.renderer({
                                            xtype: 'LabelRenderer', text: function () {
                                                return '<em class="x-hyperlink">' + _T("View Parent Session") + '</em>';
                                            }
                                        })
                                    }
                                }
                            };
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        continue;
                    }
                    if (fldname == "view_parent_tunnel_link") {
                        if (info.logtype == Pan.monitor.log.LogType.Tunnel && info['parent_session_id'] != 0) {
                            fld = {
                                name: 'view_parent_tunnel_link',
                                uiHint: {
                                    fieldLabel: '',
                                    columnConfig: {
                                        editor: {
                                            xtype: 'propertygridlinkeditor', onValueClick: function () {
                                                logDetailWidget.openParentSessionLog(info);
                                            }
                                        }, renderer: Pan.renderer({
                                            xtype: 'LabelRenderer', text: function () {
                                                return '<em class="x-hyperlink">' + _T("View Parent Session") + '</em>';
                                            }
                                        })
                                    }
                                }
                            };
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        continue;
                    }
                    if (fldname == "tunnelid" || fldname == "monitortag" || fldname == "parent_session_id" || fldname == "parent_start_time") {
                        if ((info.tunnel == 'tunnel') || Pan.base.Constants.otherTunnels.indexOf(info.tunnel) != -1) {
                            fld = {name: fldname, uiHint: {fieldLabel: fldtitle}};
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        continue;
                    }
                    if (fldname == "imei" || fldname == "imsi") {
                        if ((info.tunnel == 'GTP') || Pan.base.Constants.gtpTunnel.indexOf(info.tunnel) != -1) {
                            fld = {name: fldname, uiHint: {fieldLabel: fldtitle}};
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        continue;
                    }
                    if (fldname == "assoc_id" || fldname == "ppid" || fldname == "chunks" || fldname == "chunks_received" || fldname == "chunks_sent") {
                        if (Pan.global.CONTEXT.isSCTPEnabled) {
                            fld = {name: fldname, uiHint: {fieldLabel: fldtitle}};
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        continue;
                    }
                    if (fldname == "recipient-userid") {
                        if (info.logtype == Pan.monitor.log.LogType.WildFire) {
                            fld = {
                                name: 'recipient-userid', uiHint: {
                                    fieldLabel: _T('Recipient User-ID'), columnConfig: {
                                        wrap: false,
                                        columnActionsMode: "menu",
                                        doHTMLEncode: false,
                                        renderer: Pan.renderer({
                                            onClick: function (grid, config, e) {
                                                var target = e.getTarget();
                                                if (target.tagName == "DIV" || target.tagName == "TD") {
                                                    return;
                                                }
                                                var user = target.innerHTML;
                                                var params = {filter: {"key": "srcuser", "value": user}};
                                                if (grid.store.data && grid.store.data.get('recipient-userid') && grid.store.data.get('recipient-userid').get('valuefield')) {
                                                    var userRec = grid.store.data.get('recipient-userid').get('valuefield')[0];
                                                    if (userRec['is_group'] == 'yes') {
                                                        params = {filter: {"key": "srcusergroup", "value": user}};
                                                    }
                                                }
                                                var win = this.config.detailedlogwin;
                                                win.close();
                                                Pan.appframework.PanAppInterface.jumpToBranch('acc', info['vsys'], params);
                                            }
                                        }),
                                        spanCellRenderer: Pan.renderer({
                                            xtype: 'LabelRenderer', link: function (v) {
                                                if (v) {
                                                    var val = v['@name'];
                                                    return val;
                                                }
                                                return '';
                                            }
                                        })
                                    }
                                }
                            };
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        continue;
                    }
                    if (fldname == "recipient") {
                        if (info.logtype == Pan.monitor.log.LogType.WildFire) {
                            fld = {
                                name: 'recipient', uiHint: {
                                    fieldLabel: _T('Recipient Address'), columnConfig: {
                                        wrap: false, renderer: function (v) {
                                            if (v) {
                                                var ret = v.split(',');
                                                return ret;
                                            }
                                            return '';
                                        }
                                    }
                                }
                            };
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        continue;
                    }
                    if (boolFields.indexOf(fldname) > -1) {
                        fld = {
                            name: fldname,
                            uiHint: {
                                fieldLabel: fldtitle,
                                uitype: 'pan-checkbox',
                                renderer: 'panbooleancolumn',
                                editor: {xtype: 'panbooleancolumneditor'}
                            }
                        };
                    }
                    else if (fldname == 'loglinks') {
                        fld = {name: fldname, uiHint: {fieldLabel: fldtitle, columnConfig: {doHTMLEncode: false}}};
                    }
                    else if (fldname == 'misc' || fldname == 'url' || fldname == 'filename' || fldname == 'subject' || fldname == 'xff' || fldname == 'referer' || fldname == 'user_agent') {
                        fld = {name: fldname, uiHint: {fieldLabel: fldtitle, columnConfig: {wrap: false}}};
                    }
                    else if (fldname == 'http_headers') {
                        fld = {
                            name: fldname, uiHint: {
                                fieldLabel: fldtitle, columnConfig: {
                                    wrap: false, showCompleteText: function (data, menuitem, col, record, grid) {
                                        var headers = data.split('\n');
                                        var newData = "";
                                        for (var i = 0; i < headers.length - 1; i++) {
                                            newData += headers[i];
                                            newData += i % 2 === 0 ? ":" : ";";
                                        }
                                        Pan.base.grid.GridPanel.prototype.showCompleteText.call(grid, newData, menuitem, col, record);
                                    }
                                }
                            }
                        };
                    }
                    else if (fldname == 'sender') {
                        fld = {
                            name: fldname, uiHint: {
                                fieldLabel: fldtitle, columnConfig: {
                                    wrap: false, showCompleteText: function (data, menuitem, col, record, grid) {
                                        if (Ext.isArray(data)) {
                                            var newData = [];
                                            Ext.each(data, function (d) {
                                                newData.push(d['@name']);
                                            });
                                            data = newData.toString();
                                        }
                                        Pan.base.grid.GridPanel.prototype.showCompleteText.call(grid, data, menuitem, col, record);
                                    }
                                }
                            }
                        };
                    }
                    else if (!Pan.global.isCms() && (fldname == 'src_uuid' || fldname == 'dst_uuid') && !Pan.global.isPhoenixVM()) {
                        continue;
                    }
                    else if (fldname === 'threatid') {
                        fld = {
                            name: fldname, uiHint: {
                                fieldLabel: fldtitle, columnConfig: {
                                    renderer: function (v) {
                                        if (v && Pan.acc.threatNameResolve.id2threatNameLogViewer[v]) {
                                            return Pan.acc.threatNameResolve.id2threatNameLogViewer[v];
                                        }
                                        return v;
                                    }
                                }
                            }
                        };
                    }
                    else if (fldname === 'tid') {
                        fld = {
                            name: fldname, uiHint: {
                                fieldLabel: fldtitle, columnConfig: {
                                    renderer: function (v) {
                                        return v + " (<a target='_blank' href='" + Pan.base.Constants.THREAT_VAULT_API + v + "'>View in Threat Vault</a>)";
                                    }
                                }
                            }
                        };
                    }
                    else {
                        fld = {name: fldname, uiHint: {fieldLabel: fldtitle}};
                    }
                    config.fields.push(fld);
                    this.rootField.childrenNames.push(fld.name);
                }
            }
        }
    },
    initComponent: function () {
        Pan.monitor.log.CommonDetailedLogPropertyWidget.superclass.initComponent.apply(this, arguments);
    },
    listeners: {
        render: function (p) {
            var win = this.config.detailedlogwin;
            win.loadMasks = win.loadMasks || {};
            if (p.recordFormTitle == "HTTP Headers" || p.recordFormTitle == "Log Links" || (p.recordFormTitle == _T("Email Headers") && !Ext.isEmpty(p.data.get("recipient")))) {
                var mask, el = p.el;
                if (el) {
                    mask = new Pan.base.widgets.LoadMask(el, {msg: _T('Loading...')});
                    mask.show();
                    win.loadMasks[p.recordFormTitle] = mask;
                }
            }
        }
    },
    fieldsMaps: Pan.monitor.common.LogTypes.fieldsMaps,
    openParentSessionLog: function (info) {
        var windowX, windowY;
        if (this.config.detailedlogwin) {
            windowX = this.config.detailedlogwin.x;
            windowY = this.config.detailedlogwin.y;
        }
        var waitBox = Ext.MessageBox.show({
            title: 'Please wait',
            msg: 'Fetching parent log...Please wait',
            progressText: 'Loading...',
            width: 300,
            progress: true,
            closable: false
        });
        this.showProgressBar(waitBox);
        var queries = [];
        queries.push("(sessionid eq '" + info['parent_session_id'] + "')");
        queries.push("(start eq '" + info['parent_start_time'] + "')");
        queries = queries.join(' AND ');
        var config = {
            isInWindow: true,
            noTitle: true,
            treePath: "Monitor/Logs/Tunnel",
            identifier: 'viewerTab',
            query: queries
        };
        var logViewer = Pan.create(config);
        var parentLogsWindow = new Pan.base.container.Window({
            width: 1,
            height: 1,
            title: _T('View Parent Tunnel Logs'),
            layout: 'fit',
            autoHeight: true,
            closeAction: 'hide',
            border: false,
            modal: true,
            layoutConfig: {animate: true},
            items: [logViewer]
        });
        parentLogsWindow.show();
        parentLogsWindow.hide();
        var logStore = logViewer.store;
        logStore.addListener("load", function () {
            var isFin = false;
            if (logStore.responseText) {
                var xmlDoc = logStore.getXmlDoc(logStore.responseText);
                isFin = logStore.isXmlResultFIN(xmlDoc);
            }
            if (isFin) {
                waitBox.updateProgress(11, 'Loading...');
                waitBox.hide();
                if (logStore.getAt(0)) {
                    Pan.monitor.log.showDetailedLog('tunnel', logStore.getAt(0), '', logStore.responseText, logViewer, windowX + 20, windowY + 20);
                }
                else {
                    Pan.Msg.alert(_T('Error'), _T("No parent log found"));
                }
            }
        }, this);
    },
    progressBar: function (v, waitBox) {
        return function () {
            if (v == 10) {
                waitBox.hide();
            }
            else {
                var i = v / 9;
                waitBox.updateProgress(i, '');
            }
        };
    },
    showProgressBar: function (waitBox) {
        for (var i = 1; i < 11; i++) {
            setTimeout(this.progressBar(i, waitBox), i * 500);
        }
    }
});
Ext.reg('CommonDLogPropertyWidget', Pan.monitor.log.CommonDetailedLogPropertyWidget);
Ext.ns('Pan.monitor.log');
Pan.monitor.log.RelatedLogGridPanel = Ext.extend(Pan.base.grid.GridPanel, {
    initComponent: function () {
        var cols;
        if (Pan.monitor.common.LogTypes.columns[this.logtype]) {
            cols = Pan.monitor.common.LogTypes.columns[this.logtype];
        }
        else {
            cols = Pan.monitor.common.LogTypes.columns['default'];
        }
        Ext.apply(this, {
            xtype: "pan-grid",
            singleSelect: true,
            supportFastRender: false,
            hasAdjustColumnMenu: false,
            forceFit: true,
            columns: cols,
            store: {
                ztype: Pan.base.autorender.GridRecordStore,
                zconfig: {
                    sortInfo: {field: 'receive_time', direction: "ASC"},
                    fields: Pan.monitor.common.LogTypes.fields,
                    localStore: true,
                    reader: Ext.extend(Ext.data.JsonReader, {})
                }
            },
            hasGridFilter: false,
            miniCellRowLines: false,
            loadMask: true,
            stripeRows: true
        });
        Pan.monitor.log.RelatedLogGridPanel.superclass.initComponent.apply(this, arguments);
        this.getSelectionModel().addListener('rowselect', function (selModel, index) {
            if (!this.__onSelectDelayedTask) {
                this.__onSelectDelayedTask = new Ext.util.DelayedTask(this.onSelect, this);
            }
            if (selModel.lastMouseEvent && selModel.lastMouseEvent.rowIndex === index) {
                this.__onSelectDelayedTask.delay(0, this.onSelect, this, arguments);
            }
            else {
                this.__onSelectDelayedTask.delay(500, this.onSelect, this, arguments);
            }
        }, this);
        this.store.addListener("afterload", this.handleMask, this);
        this.queryData();
    }, handleMask: function () {
        if (this.relatedlogmask) {
            if (this.callsFinished) {
                this.relatedlogmask.hide();
                this.relatedlogmask.destroy();
            }
            else {
                this.relatedlogmask.show();
            }
        }
    }, onDestroy: function () {
        this.getSelectionModel().purgeListeners();
        Pan.monitor.log.RelatedLogGridPanel.superclass.onDestroy.apply(this, arguments);
    }, onSelect: function (selModel, index, rec) {
        var g = selModel.grid;
        var win = this.findParentByType(Pan.monitor.log.DetailedLogWin);
        var cont = win.findByItemId('DetailLogHolder');
        var type = (rec.data.subtype.toLowerCase() == "wildfire" || rec.data.subtype.toLowerCase() == "url") ? rec.data.subtype.toLowerCase() : rec.data.type.toLowerCase();
        var detailLogViewerID = cont.findByItemId('detail_log_viewer').id;
        cont.remove(detailLogViewerID, true);
        cont.insert(0, {
            xtype: 'detaillogviewer',
            itemId: 'detail_log_viewer',
            detailedlogwin: win,
            level: 2,
            logtype: type,
            data: rec,
            urlDB: win.urlDB,
            responseText: this.responseText
        });
        if (rec.data.subtype.toLowerCase() == "wildfire" && g.ownerCt.initialConfig.parent) {
            g.ownerCt.initialConfig.parent.retrieveEmailHdrUserIDs(rec);
        }
        cont.doLayout();
        if (this.ownerCt && this.ownerCt.setAlignAndShow) {
            this.ownerCt.setAlignAndShow();
        }
        for (var m in win.loadMasks) {
            if (win.loadMasks.hasOwnProperty(m)) {
                if (win.loadMasks[m]) {
                    win.loadMasks[m].hide();
                    win.loadMasks[m].destroy();
                }
            }
        }
    }, queryData: function () {
        var config = this;
        if (config.logtype === 'corr') {
            config.logtype = 'corr-detail';
        }
        if (config.level == 1) {
            var httpHeaderCorelation = [config.logtype, config.data];
            var params = {logtype: config.logtype, anchor: config.data.id, responseText: config.responseText};
            PanDirect.run('MonitorDirect.enqueueRelatedLogRequest', [params], function (jobids) {
                this.relatedlogmask = new Pan.base.widgets.LoadMask(this.getEl(), {msg: _T('Loading...')});
                this.relatedlogmask.show();
                this.pollRelatedLogs(jobids, httpHeaderCorelation, this.store);
            }, this);
        }
    }, pollRelatedLogs: function (result, httpHeaderCorelation, store) {
        var self = this;
        var win = this.findParentByType(Pan.monitor.log.DetailedLogWin);
        var pollJob = function (id, type) {
            if (!Ext.isNumber(id)) {
                var log = PanLogging.getLogger('device:setup:SetupHSMViewer');
                log.warn('*** pollLogRequest id is malformed');
                log.warn(id);
                return;
            }
            PanDirect.run('MonitorDirect.pollLogRequest', [id, {logtype: 'detail'}], function (xmlString) {
                var doc;
                try {
                    if (window.ActiveXObject) {
                        doc = new ActiveXObject("Microsoft.XMLDOM");
                        doc.async = "false";
                        doc.loadXML(xmlString);
                    }
                    else {
                        doc = new DOMParser().parseFromString(xmlString, "text/xml");
                    }
                }
                catch (e) {
                    Pan.base.msg.alert('Invalid XML response from server');
                    return;
                }
                var finish = false;
                var status = doc.getElementsByTagName("status");
                if (status && status[0] && status[0].childNodes && status[0].childNodes[0]) {
                    finish = status[0].childNodes[0].nodeValue == 'FIN';
                    if (!finish) {
                        (function () {
                            pollJob(id, type);
                        }).defer(5000);
                    }
                    else {
                        PanDirect.run('MonitorDirect.retrieveJSONLog', [xmlString], function (JSONLog) {
                            self.resultMap[id] = true;
                            self.callsFinished = _.every(self.resultMap, function (item) {
                                return item;
                            });
                            var relatedloggridstore = store;
                            relatedloggridstore.loadData(JSONLog, true);
                            relatedloggridstore.commitChanges();
                            if (httpHeaderCorelation[0] == 'threat' || httpHeaderCorelation[0] == 'wildfire') {
                                var returnedstorequery = relatedloggridstore.queryBy(function (record) {
                                    return (record.get('subtype') == "url" && record.get('url_idx') == httpHeaderCorelation[1].data.url_idx);
                                });
                                if (returnedstorequery) {
                                    if (returnedstorequery.items) {
                                        if (returnedstorequery.items[0]) {
                                            var referer = '', xff = '', user_agent = '';
                                            for (var i = 0; i < returnedstorequery.items.length; i++) {
                                                if (returnedstorequery.items[i].data.referer != '' || returnedstorequery.items[i].data.xff != '' || returnedstorequery.items[i].data.user_agent != '') {
                                                    referer = returnedstorequery.items[i].data.referer;
                                                    xff = returnedstorequery.items[i].data.xff;
                                                    user_agent = returnedstorequery.items[i].data.user_agent;
                                                    break;
                                                }
                                            }
                                            httpHeaderCorelation[1].data['referer'] = referer;
                                            httpHeaderCorelation[1].data['xff'] = xff;
                                            httpHeaderCorelation[1].data['user_agent'] = user_agent;
                                            var config = {};
                                            config.logtype = httpHeaderCorelation[0];
                                            config.data = httpHeaderCorelation[1];
                                            var cont = Ext.getCmp("detail_composite_container");
                                            cont.removeAll();
                                            cont.insert(0, {
                                                xtype: 'CommonDLogCompositeViewer',
                                                logtype: httpHeaderCorelation[0],
                                                data: httpHeaderCorelation[1],
                                                config: config
                                            });
                                            cont.doLayout();
                                        }
                                    }
                                }
                            }
                            if (self.callsFinished) {
                                for (var m in win.loadMasks) {
                                    if (win.loadMasks.hasOwnProperty(m)) {
                                        if (win.loadMasks[m]) {
                                            win.loadMasks[m].hide();
                                            win.loadMasks[m].destroy();
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
            });
        };
        self.resultMap = {};
        if (result && result[0]) {
            self.resultMap[result[0]] = false;
            pollJob(result[0], 'traffic');
        }
        if (result && result[1]) {
            self.resultMap[result[1]] = false;
            pollJob(result[1], 'content');
        }
    }
});
Ext.reg("Pan.monitor.log.RelatedLogGridPanel", Pan.monitor.log.RelatedLogGridPanel);
Pan.monitor.log.EffectiveQueries = Ext.extend(Pan.base.container.Window, {
    constructor: function (config) {
        config = config || {};
        this.config = config;
        var buttons = config.actions || [];
        buttons.push([{text: _T('OK'), cls: 'default-btn', handler: this.okhandler, scope: this}, {
            text: _T('Cancel'),
            xtype: 'pan-button',
            handler: this.cancelhandler,
            scope: this
        }]);
        this.setUp();
        Ext.apply(config, {
            layout: 'fit',
            width: 400,
            height: 350,
            title: _T('Show Effective Queries'),
            resizable: true,
            closeAction: 'close',
            modal: true,
            border: false,
            items: [this.effectiveQueriesGrid],
            buttons: buttons,
            shadow: false
        });
        Pan.monitor.log.EffectiveQueries.superclass.constructor.call(this, config);
    }, okhandler: function () {
        var state = this.sm.grid.getState();
        if (state && Ext.isArray(state['check']) && state['check'].length > 0) {
            this.sm.grid.saveState();
            var databases = this.submitChecked;
            this.config.logstore.completeReloadUsingDatabases(databases);
            this.config.logstore.baseParams.databases = databases;
            this.close();
        }
        else {
            Pan.Msg.alert(_T("Error"), _T('At least one log type must be selected.'));
        }
    }, cancelhandler: function () {
        this.close();
    }, setUp: function () {
        this.setupStore();
        this.setupGrid();
        this.getEffectiveQueries();
    }, setupStore: function () {
        this.effectiveQueriesstore = new Pan.base.autorender.GridRecordStore({
            localStore: true,
            data: [],
            fields: [{name: 'logtype'}, {name: 'filter'}]
        });
    }, setupGrid: function () {
        var that = this;
        this.effectiveQueriesGrid = {
            xtype: 'pan-grid',
            useCheckBoxSelection: true,
            checkBoxSelectionModelConfig: {
                listeners: {
                    'selectionchange': function (sm) {
                        that.sm = sm;
                    }
                }
            },
            itemId: 'effectiveQueriesGrid',
            getState: function () {
                var values = [];
                var sm = this.getSelectionModel();
                var s = sm.getSelections();
                Ext.each(s, function (r) {
                    values.push(r.data.logtype);
                });
                that.submitChecked = values;
                return {'check': values};
            },
            applyState: function (state) {
                if (state && Ext.isArray(state['check'])) {
                    this.initChecked = state['check'];
                }
            },
            listeners: {
                'afterrender': function (grid) {
                    (function () {
                        if (!grid.initChecked) {
                            grid.initChecked = that.config.all_databases;
                        }
                        if (grid.initChecked) {
                            var rows = [];
                            var s = grid.getStore();
                            var sm = grid.getSelectionModel();
                            Ext.each(grid.initChecked, function (logtype) {
                                var row = s.findExact('logtype', logtype);
                                if (row != -1) {
                                    rows.push(row);
                                }
                            });
                            sm.selectRows(rows);
                        }
                    }).defer(1000);
                }
            },
            hasGridFilter: false,
            stripeRows: false,
            cls: Pan.base.Constants.uiThemes[1],
            columns: [{header: _T('Log Type'), dataIndex: 'logtype'}, {header: _T('Filter'), dataIndex: 'filter'}],
            store: this.effectiveQueriesstore,
            loadMask: true,
            stateful: true,
            stateId: 'EFFECTIVE_QUERIES_STATE_ID'
        };
    }, getEffectiveQueries: function () {
        var that = this;
        var databases = that.config.all_databases;
        var requestParameters = {"query": this.config.query, "databases": databases};
        var data = [];
        for (var i = 0; i < databases.length; i++) {
            data.push({logtype: databases[i], filter: 'N/A'});
        }
        PanDirect.run('MonitorDirect.getEffectiveQueries', [requestParameters], function (result, t) {
            var entries = Pan.base.json.path(result, '$.result.effective-queries.entry');
            var status = Pan.base.json.path(result, '$.@status');
            if (status == 'success') {
                var entry;
                for (var k = 0; k < entries.length; k++) {
                    entry = entries[k];
                    var matchitem = _.find(data, function (dataitem) {
                        return dataitem['logtype'] == entry['@log-type'];
                    });
                    matchitem.filter = entry['query'];
                }
            } else {
                if (that.config.query.trim() != '') {
                    Pan.base.msg.error(_T('Effective queries could not be computed. Please check query.'));
                }
            }
            that.effectiveQueriesstore.loadData(data);
        });
    }
});
Pan.monitor.LogConfigDiff = Ext.extend(Pan.base.container.Panel, {
    autoScroll: true,
    cls: 'darkblue',
    lastInsertWhiteSpace: false,
    lastInsertClose: false,
    constructor: function (config) {
        config = config || {};
        var html = this.buildHTML(config.data);
        Ext.apply(config, {itemId: 'Pan.monitor.LogConfigDiff', layout: "fit", html: html, plain: true, noTitle: true});
        Pan.monitor.LogConfigDiff.superclass.constructor.call(this, config);
    },
    buildHTML: function (change) {
        if (!change || change.length == 0)
            return '';
        var result = '';
        var leftover = Ext.util.Format.trim(change);
        var numberOfBlock = 0;
        do {
            var openPos = leftover.search(/{/g);
            var closePos = leftover.search(/}/g);
            var maxPos = Math.max(openPos, closePos);
            if (maxPos >= 0) {
                var toBeAppended;
                if (openPos != -1 && (openPos < closePos || closePos < 0)) {
                    numberOfBlock++;
                    toBeAppended = Ext.util.Format.substr(leftover, 0, openPos - 1);
                    if (toBeAppended && Ext.util.Format.trim(toBeAppended).length > 0) {
                        if (this.lastInsertClose)
                            result += "&nbsp;&nbsp;&nbsp;";
                        result += toBeAppended + '</br>';
                        this.lastInsertWhiteSpace = false;
                    }
                    leftover = String(leftover).substring(openPos + 1);
                    result = this.insertWhiteSpace(result, numberOfBlock);
                    result += '{</br>';
                    this.lastInsertClose = false;
                    this.lastInsertWhiteSpace = false;
                    result = this.insertWhiteSpace(result, numberOfBlock);
                }
                else if (closePos >= 0) {
                    numberOfBlock--;
                    toBeAppended = Ext.util.Format.substr(leftover, 0, closePos - 1);
                    if (toBeAppended && Ext.util.Format.trim(toBeAppended).length > 0) {
                        if (this.lastInsertClose)
                            result += "&nbsp;&nbsp;&nbsp;";
                        result += toBeAppended + '</br>';
                        this.lastInsertWhiteSpace = false;
                    }
                    leftover = String(leftover).substring(closePos + 1);
                    result = this.insertWhiteSpace(result, numberOfBlock + 1);
                    result += '}</br>';
                    this.lastInsertClose = true;
                    this.lastInsertWhiteSpace = false;
                    result = this.insertWhiteSpace(result, numberOfBlock);
                }
            }
            else {
                result += leftover;
                break;
            }
        } while (leftover && leftover.length > 0);
        return '<div>' + result + '</div>';
    },
    insertWhiteSpace: function (result, numberOfBlock) {
        if ((this.lastInsertWhiteSpace === false) && numberOfBlock > 0) {
            var whiteSpaces = '';
            for (var i = 0; i < numberOfBlock; i++) {
                whiteSpaces += "&nbsp;&nbsp;&nbsp;";
            }
            result += whiteSpaces;
            this.lastInsertWhiteSpace = true;
        }
        return result;
    }
});
Pan.reg("Pan.monitor.LogConfigDiff", Pan.monitor.LogConfigDiff);
Ext.ns('Pan.monitor.log');
Pan.monitor.log.HIPObjectAppDetailsSchema = function () {
    Pan.schemaMkNode('$.injected.fake.app-details', {
        '@attr': {'node-type': 'array'},
        'entry': {
            '@attr': {'node-type': "sequence"},
            '@name': {'@attr': {'node-type': "attr-req", 'type': 'string', 'maxlen': "31", 'subtype': "object-name"}},
            'app-name': {'@attr': {'node-type': "element", 'type': 'string', 'maxlen': "64", 'subtype': "object-name"}},
            'package': {
                '@attr': {
                    'node-type': "element",
                    'type': 'string',
                    'maxlen': "128",
                    'optional': 'yes',
                    'subtype': "object-name"
                }
            },
            'version': {
                '@attr': {
                    'node-type': "element",
                    'type': 'string',
                    'maxlen': "64",
                    'optional': 'yes',
                    'subtype': "object-name"
                }
            },
            'hash': {
                '@attr': {
                    'node-type': "element",
                    'type': 'string',
                    'maxlen': "64",
                    'optional': 'yes',
                    'subtype': "object-name"
                }
            },
            'malware': {
                '@attr': {
                    'node-type': "element",
                    'type': 'string',
                    'maxlen': "64",
                    'optional': 'yes',
                    'subtype': "object-name"
                }
            },
            'hips': {
                '@attr': {'node-type': "array", 'optional': "true"},
                'entry': {
                    '@attr': {'node-type': "sequence"},
                    '@name': {
                        '@attr': {
                            'node-type': "attr-req",
                            'type': 'string',
                            'maxlen': "31",
                            'help-string': "HIP Objects",
                            'subtype': "object-name"
                        }
                    },
                    '@location': {
                        '@attr': {
                            'node-type': "attr-req",
                            'type': 'string',
                            'maxlen': "31",
                            'help-string': "HIP Object Location",
                            'subtype': "object-name"
                        }
                    },
                    'include-hash': {'@attr': {'node-type': "element", 'type': 'bool', 'optional': 'yes'}}
                }
            }
        }
    });
};
Pan.monitor.log.mygroups = function () {
    var myvsys = Pan.common.PanConfigStates.prototype.getVsysDataArray(true, true, false, false, true, false, false);
    var thisvsys, vsysid, vsysname;
    var grouparr = [];
    var unsorted = [];
    for (var i = 0; i < myvsys.length; i++) {
        thisvsys = myvsys[i];
        vsysid = thisvsys[0];
        vsysname = thisvsys[1];
        if (vsysid && vsysname) {
            unsorted.push(vsysid);
        }
    }
    var sorted = unsorted.sort();
    for (var mm = 0; mm < sorted.length; mm++) {
        for (var k = 0; k < myvsys.length; k++) {
            thisvsys = myvsys[k];
            vsysid = thisvsys[0];
            vsysname = thisvsys[1];
            if (vsysid && vsysname && vsysid == sorted[mm]) {
                var obj = {};
                obj.title = vsysname;
                obj.type = vsysid;
                grouparr.push(obj);
            }
        }
    }
    return grouparr;
};
Pan.monitor.log.getFields = function () {
    var fields = [{
        name: '$',
        childrenNames: ['$.app-name', '$.package', '$.version', '$.hash', '$.malware', '$.hips']
    }, {name: '$.app-name', uiHint: {fieldLabel: 'App Name: ', xtype: 'displaystoragefield'}}, {
        name: '$.package',
        uiHint: {fieldLabel: 'Package: ', xtype: 'displaystoragefield'}
    }, {name: '$.version', uiHint: {fieldLabel: 'Version: ', xtype: 'displaystoragefield'}}, {
        name: '$.hash',
        uiHint: {fieldLabel: 'Hash: ', xtype: 'displaystoragefield'}
    }, {
        name: '$.malware', uiHint: {
            fieldLabel: 'Malware: ', xtype: 'pan-linkbuttonfield', handler: function (element) {
                var malwareId = element.__pdefaults.__recordFormRecord.json['malware'];
                Pan.monitor.log.showMalwareInfo(malwareId);
            }
        }, dataMap: function (config) {
            if (this.store.additionalInput.malwarename)
                return this.store.additionalInput.malwarename;
            return config.__record['malware'];
        }, saveMap: undefined
    }, {
        name: '$.hips', uiHint: {
            fieldLabel: _T('Include'),
            builder: "FieldSetBuilder",
            avail: {
                availHide: true, match: {
                    evaluate: function () {
                        return Pan.base.admin.getPermission("'monitor/logs/hipmatch'");
                    }
                }
            },
            association: {
                listenToAfterInit: true, match: {evaluate: 'fieldEvt', field: '$.malware'}, exec: {
                    evaluate: function () {
                        var mymalware = this.__component.__pdefaults.__dataExtractor("$.malware");
                        if (mymalware) {
                            this.__component.setTitle('Exclude');
                        }
                        else {
                            this.__component.setTitle('Include');
                        }
                    }
                }
            }
        }
    }, {
        name: '$.hips.entry',
        uiHint: {
            hideLabel: true, hasGridFilter: false, zconfig: {
                listeners: {
                    update: function (store, record) {
                        if (record.data['$.hips.entry.*.@name']) {
                            var appToHipMapping = store.__pdefaults.__extraInfo;
                            if (appToHipMapping) {
                                if (record.data['$.hips.entry.*.@name'] == appToHipMapping.value) {
                                    record.set('$.hips.entry.*.@location', appToHipMapping.type);
                                }
                            }
                        }
                    }
                }
            }
        }
    }, {
        name: '$.hips.entry.*.@name',
        uiHint: {
            fieldLabel: _T('HIP Objects'),
            builder: 'HIPCompletionBuilder',
            completionConfig: {sendNoName: true},
            groups: Pan.monitor.log.mygroups()
        }
    }, {
        name: '$.hips.entry.*.@location',
        uiHint: {fieldLabel: _T('HIP Objects Location'), columnConfig: {editable: false}}
    }, {
        name: '$.hips.entry.*.include-hash',
        uiHint: {
            fieldLabel: _T('Hash'), columnConfig: {
                columnAvail: function (grid) {
                    return (grid.__pdefaults.__recordForm.store.additionalInput.showHashColumn === '1');
                }
            }
        }
    }];
    return fields;
};
Pan.monitor.log.HIPObjectAppDetailsViewer = Ext.extend(Pan.appframework.modelview.PanRecordFormViewer, {
    rbaPath: 'monitor/logs/hipmatch',
    storeConfigOverride: {autoLoad: false},
    storeInputs: {objectType: _T("App Details")},
    storeConfig: {ztype: Pan.appframework.modelview.PanGridStore},
    recordForm: {
        isInWindow: true,
        windowConfig: {title: _T('App Details'), modal: true, closeable: true, height: 500, width: 800},
        items: [{itemId: '$'}]
    },
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: "HIPObjectAppDetails",
            api: {
                readSchema: {
                    injectedSchema: Pan.monitor.log.HIPObjectAppDetailsSchema,
                    'device': "$.injected.fake.app-details.entry"
                }
            }
        },
        commandXPathTemplate: {
            getObjects: [{
                isCmsSelected: '${isCmsSelected}',
                appName: '${appName}',
                "package": '${package}',
                version: '${version}',
                hash: '${hash}',
                malware: '${malware}',
                malwarename: '${malwarename}',
                showHashColumn: '${showHashColumn}',
                argumentsAreJSON: true
            }], setObjects: [{isCmsSelected: '${isCmsSelected}', data: '${__data}', argumentsAreJSON: true}]
        },
        readCommandParts: ["getObjects", "isCmsSelected", "appName", "package", "version", "hash", "malware", "showHashColumn"],
        updateCommandParts: ["setObjects", "isCmsSelected", "data"]
    },
    constructor: function (config) {
        config.storeInputs = Ext.apply({}, config.storeInputs);
        Pan.monitor.log.HIPObjectAppDetailsViewer.superclass.constructor.call(this, config);
    },
    fields: Pan.monitor.log.getFields,
    afterUpdateRecord: function () {
        Pan.appframework.PanAppInterface.refresh();
    }
});
Pan.reg("Monitor/Log/HIPObjectAppDetailsViewer", Pan.monitor.log.HIPObjectAppDetailsViewer);
Pan.monitor.log.showHIPObjectAppDetails = function (appName, package1, version, hash, malware, malwarename, showHashColumn) {
    var action = new Pan.appframework.action.PanViewerWindowAction({
        treePath: 'Monitor/Log/HIPObjectAppDetailsViewer',
        storeConfigOverride: {
            additionalInput: {
                appName: appName,
                "package": package1,
                version: version,
                hash: hash,
                malware: malware,
                malwarename: malwarename,
                showHashColumn: showHashColumn
            }
        }
    });
    action.execute();
};
Pan.monitor.log.showMalwareInfo = function (malwareId) {
    if (!Ext.isEmpty(malwareId)) {
        var href = 'https://threatvault.paloaltonetworks.com/Home/VirusDetail/' + malwareId;
        window.open(href, '_blank');
    }
};
Ext.ns('Pan.monitor.ManageCustomReport');
Pan.monitor.FieldSelector = Ext.extend(Ext.ux.form.ItemSelector, {
    height: 104,
    scanFields: [_T('Top'), _T('Up'), _T('Down'), _T('Bottom'), _T('Available Columns'), _T('Selected Columns')],
    constructor: function (config) {
        var width = 120;
        Ext.applyIf(config, {
            colspan: 3,
            fieldLabel: _T('Columns'),
            imagePath: '/images/',
            iconLeft: "delete.png",
            iconRight: "add.png",
            drawUpIcon: false,
            drawDownIcon: false,
            drawTopIcon: false,
            drawBotIcon: false,
            multiselects: [{
                width: width,
                height: undefined,
                store: new Ext.data.ArrayStore({
                    autoDestroy: true,
                    data: config.data.slice(0),
                    sortInfo: {field: 'text', direction: "ASC"},
                    fields: ['value', 'text']
                }),
                displayField: 'text',
                valueField: 'value'
            }, {width: width, height: undefined, allowBlank: false, minSelections: 1, store: config.data.slice(0, 0)}]
        });
        Pan.monitor.FieldSelector.superclass.constructor.call(this, config);
    },
    collect: function (field) {
        return this.toMultiselect.view.store.collect(field);
    },
    fromTo: function () {
        Pan.monitor.FieldSelector.superclass.fromTo.apply(this, arguments);
        this.validate();
    },
    toFrom: function () {
        Pan.monitor.FieldSelector.superclass.toFrom.apply(this, arguments);
        this.validate();
    },
    reset: function () {
        Pan.monitor.FieldSelector.superclass.reset.apply(this, arguments);
        this.validate();
    },
    defaultFields: function (logtype, store) {
        return [];
    },
    reload: function (logtype, fields, reallogtype) {
        var previouslySelectedColumns = this.toMultiselect.store.data.items;
        var selectedColumnArray = [];
        for (var i = 0; i < previouslySelectedColumns.length; i++) {
            selectedColumnArray.push(previouslySelectedColumns[i].data.text);
        }
        var data = Pan.monitor.ManageCustomReport.columnsItemselect[reallogtype || logtype];
        this.reset();
        this.fromMultiselect.view.store.loadData(data);
        if (!fields) {
            fields = selectedColumnArray;
        }
        var idx = -1, idxtext = -1, idxValue = -1;
        if (fields.length > 0) {
            for (i = 0; i < fields.length; i++) {
                idx = -1;
                idxtext = this.fromMultiselect.view.store.findExact('text', fields[i]);
                idxValue = this.fromMultiselect.view.store.findExact('value', fields[i]);
                if (idxtext > -1) {
                    idx = idxtext;
                }
                if (idxValue > -1) {
                    idx = idxValue;
                }
                var record = this.fromMultiselect.view.store.getAt(idx);
                if (record) {
                    this.fromMultiselect.view.store.remove(record);
                    this.toMultiselect.view.store.add(record);
                }
                else {
                }
            }
            this.toMultiselect.view.refresh();
            this.fromMultiselect.view.refresh();
        }
        this.validate();
    },
    getErrors: function () {
        var errors = [];
        var fields = this.collect('value');
        var haveAggregateby = false;
        Ext.each(fields, function (field) {
            if (!(Pan.monitor.ManageCustomReport.valueMembers[field] || Pan.monitor.common.LogTypes.fieldIsFlag(field))) {
                haveAggregateby = true;
                return false;
            }
            return true;
        });
        if (!haveAggregateby) {
            errors.push(_T('Please select at least one aggregate field'));
        }
        return errors;
    }
});
Pan.monitor.ManageCustomReport.Helper = {
    getEstimatedReportMessage: function () {
        return _T('Estimated report run time is') + ' ';
    }, getActionMessage: function (toHidePickUpLaterLink) {
        if (toHidePickUpLaterLink) {
            return _T('You may choose to clear this report.');
        } else {
            return _T('You may choose to retrieve this report later.');
        }
    }, getPickupReportFinMessage: function () {
        return _T('Your background report has finished running. Please clear this report to schedule another background report');
    }, getEnabled: function (obj) {
        return Pan.base.json.path(obj.__record, '$.disabled') != 'yes';
    }, getScheduled: function (obj) {
        return (Pan.base.json.path(obj.__record, '$.frequency') == 'daily');
    }, getLogType: function (obj) {
        var type = Pan.base.json.path(obj.__record, '$.type');
        for (var n in type) {
            if (type.hasOwnProperty(n)) {
                type = n;
                break;
            }
        }
        var db = Pan.monitor.ManageCustomReport.databaseNewStore;
        for (var i = 0; i < db.length; i++) {
            if (db[i]['data'] == type) {
                return db[i]['displayName'] || type;
            }
        }
        return type;
    }, getSortBy: function (obj) {
        var type = Pan.base.json.path(obj.__record, '$.type');
        for (var n in type) {
            if (type.hasOwnProperty(n)) {
                type = n;
                break;
            }
        }
        var sb = Pan.base.json.path(obj.__record, '$.type.*.sortby');
        var db = Pan.monitor.ManageCustomReport.sortbyStore[type];
        if (db) {
            for (var i = 0; i < db.length; i++) {
                if (db[i][0] == sb) {
                    return db[i][1];
                }
            }
        }
        return sb;
    }, getGroupBy: function (obj) {
        return Pan.base.json.path(obj.__record, '$.type.*.group-by');
    }, getTimeFrame: function (obj) {
        var start = Pan.base.json.path(obj.__record, '$.start-time');
        var end = Pan.base.json.path(obj.__record, '$.end-time');
        if (start && end) {
            start = Date.parseDate(start, 'Y/m/d H:i:s');
            end = Date.parseDate(end, 'Y/m/d H:i:s');
            return start.format('Y/m/d h:ia') + ' - ' + end.format('Y/m/d h:ia');
        }
        else {
            var period = Pan.base.json.path(obj.__record, '$.period');
            return Pan.base.util.capitalize(period);
        }
    }
};
Pan.monitor.ManageCustomReport.TemplateGrid = Ext.extend(Pan.monitor.MonitorViewer, {
    supportLocalPaging: false,
    height: 300,
    useCheckBoxSelection: false,
    useRowActions: false,
    useToolbar: false,
    storeInputs: {objectType: _T("Predefined Report Template")},
    recordBinderOverride: {
        dataProxyAPI: {
            api: {
                read: PanDirect.runCallback('MonitorDirect.getManageCustomReportTemplate'),
                readSchema: Pan.appframework.schema.getSharedSchema("reports")
            }
        }
    },
    serverfields: [_T('Time Frame')],
    fields: [Pan.monitor.MonitorViewer.prototype.fieldConfig.createName(), 'caption', 'description', 'frequency', 'topn', 'period', 'query', {
        name: 'type',
        dataMap: Pan.monitor.ManageCustomReport.Helper.getLogType,
        saveMap: undefined
    }, {
        name: 'time-frame',
        dataMap: Pan.monitor.ManageCustomReport.Helper.getTimeFrame,
        saveMap: undefined
    }, {name: 'sortby', dataMap: Pan.monitor.ManageCustomReport.Helper.getSortBy, saveMap: undefined}],
    columns: [{
        width: 180,
        header: _T('Name'),
        sortable: true,
        autoExpandColumn: true,
        dataIndex: 'caption'
    }, {header: _T('Database'), sortable: true, dataIndex: 'type'}, {
        header: _T('Sort By'),
        width: 60,
        sortable: true,
        dataIndex: 'sortby'
    }, {header: _T('Query'), width: 260, sortable: true, dataIndex: 'query'}]
});
Pan.reg("Pan.monitor.ManageCustomReport.TemplateGrid", Pan.monitor.ManageCustomReport.TemplateGrid);
Pan.monitor.ManageCustomReport.TemplateWin = Ext.extend(Pan.base.container.Window, {
    loadTemplate: function () {
        var r = this.grid.getSelectionModel().getSelected();
        if (r) {
            this.close();
            var json = Pan.base.clone(r.json);
            this.caller.loadReport(json, true);
        }
    }, constructor: function (config) {
        var self = this;
        this.caller = config.caller;
        this.grid = new Pan.monitor.ManageCustomReport.TemplateGrid({
            rbaPath: 'monitor/custom-reports',
            treePath: "Pan.monitor.ManageCustomReport.TemplateGrid",
            theme: Pan.base.Constants.uiThemes[1]
        });
        Ext.apply(config, {
            title: _T('Report Template'),
            modal: true,
            border: null,
            width: 640,
            height: 350,
            resizable: false,
            autoHeight: true,
            buttons: [{text: _T('Load'), handler: this.loadTemplate.createDelegate(this)}, {
                text: _T('Cancel'),
                handler: function () {
                    self.close();
                }
            }],
            items: this.grid
        });
        Pan.monitor.ManageCustomReport.TemplateWin.superclass.constructor.call(this, config);
    }
});
Pan.monitor.ManageCustomReport.Editor = Ext.extend(Pan.base.container.TabPanel, {
    validate: function () {
        if (this.validatedOnce) {
            if (this.getCmp('scheduled').getValue()) {
                var tp = this.getCmp('time-frame').getValue();
                if (['last-calendar-day', 'last-7-calendar-days', 'last-calendar-week'].indexOf(tp) == -1) {
                    Pan.base.msg.warn(_T('Only Last Calendar Day, Last 7 Calendar Days and Last Calendar Week are supported for scheduled report'));
                    return false;
                }
            }
        }
        this.validatedOnce = true;
        return true;
    }, reloadColumns: function (logtype, fields, reallogtype) {
        this.getCmp('columns').reload(logtype, fields, reallogtype);
    }, reloadSortBy: function (logtype, newValue) {
        var data = Pan.monitor.ManageCustomReport.sortbyStore[logtype];
        var sb = this.getCmp('sort-by');
        newValue = newValue || sb.getValue();
        var value = '';
        if (newValue) {
            Ext.each(data, function (field) {
                if (field[0] == newValue) {
                    value = newValue;
                    return false;
                }
                return true;
            });
        }
        sb.getStore().loadData(data);
        sb.setValue(value);
    }, reloadGroupBy: function (logtype, newValue) {
        var data = Pan.monitor.ManageCustomReport.groupbyStore[logtype];
        var gb = this.getCmp('group-by');
        newValue = newValue || gb.getValue();
        var value = '';
        if (newValue) {
            Ext.each(data, function (field) {
                if (field[0] == newValue) {
                    value = newValue;
                    return false;
                }
                return true;
            });
        }
        gb.getStore().loadData(data);
        gb.setValue(value);
        var gbc = Ext.getCmp('group_by_container');
        gbc.show();
        gbc.doLayout();
    }, reloadQueryBuilder: function (logtype, newValue) {
        var gb = this.getCmp('query-builder');
        gb.changeLogtype(logtype);
    }, setValue: function (report) {
        this.record = report;
        var r = this.getRecord();
        if (r.phantom) {
            return;
        }
        this.loadReport(report);
    }, loadReport: function (report, skipCopyReport) {
        if (!skipCopyReport) {
            this.record = report;
        }
        var name = Pan.base.json.path(report, '$.@name', 'untitled');
        var topn = Pan.base.json.path(report, '$.topn', 5);
        var topm = Pan.base.json.path(report, '$.topm', 5);
        var obj = Pan.base.json.path(report, '$.type', {traffic: true});
        var reallogtype;
        for (var n in obj) {
            if (obj.hasOwnProperty(n)) {
                reallogtype = n;
                break;
            }
        }
        var logtype = reallogtype.replace('panorama-', '');
        this.findByItemId('name').setValue(name);
        this.getCmp('topn').setValue(topn);
        this.getCmp('topm').setValue(topm);
        this.getCmp('query').setValue(Pan.base.json.path(report, '$.query', ''));
        this.getCmp('description').setValue(Pan.base.json.path(report, '$.description', ''));
        var database = this.getCmp('database');
        database.setValue(reallogtype);
        var sortby = Pan.base.json.path(report, '$.type.*.sortby', '');
        this.reloadSortBy(reallogtype, sortby);
        var groupby = Pan.base.json.path(report, '$.type.*.group-by', '');
        this.reloadGroupBy(reallogtype, groupby);
        var afields = Pan.base.json.path(report, '$.type.*.aggregate-by.member', []);
        var vfields = Pan.base.json.path(report, '$.type.*.values.member', []);
        var fields = afields.concat(vfields);
        this.reloadColumns(logtype, fields, reallogtype);
        this.findByItemId('filterbuilderform').logtype = reallogtype;
        var isDaily = Pan.base.json.path(report, '$.frequency') == 'daily';
        this.getCmp('scheduled').setValue(isDaily);
        if (isDaily) {
            this.filterScheduledTimeFrame();
        }
        var period = Pan.base.json.path(report, '$.time-frame');
        if (period) {
            this.getCmp('time-frame').setSingleDateTimeDisplay(period);
        }
    }, isDirty: function () {
        return true;
    }, setScheduled: function () {
        if (this.getCmp('scheduled').getValue()) {
            this.record.frequency = 'daily';
        }
        else {
            delete this.record.frequency;
        }
    }, setDescription: function () {
        var descr = this.getCmp('description').getValue();
        if (descr) {
            this.record.description = descr;
        }
        else {
            delete this.record.description;
        }
    }, setTopMN: function () {
        var topn = this.getCmp('topn').getValue();
        var topm = this.getCmp('topm').getValue();
        if (topn) {
            this.record.topn = topn;
        }
        else {
            delete this.record.topn;
        }
        if (topm) {
            this.record.topm = topm;
        }
        else {
            delete this.record.topm;
        }
    }, setTimeFrame: function () {
        var v = this.getCmp('time-frame').getValue();
        if (Pan.base.Constants.predefinedTimePeriods.indexOf(v) == -1) {
            var fields = v.split(' - ');
            if (fields.length == 2) {
                var start = Date.parseDate(fields[0], 'Y/m/d h:ia');
                var end = Date.parseDate(fields[1], 'Y/m/d h:ia');
                if (start && end) {
                    this.record['start-time'] = start.format('Y/m/d H:i:s');
                    this.record['end-time'] = end.format('Y/m/d H:i:s');
                    delete(this.record['period']);
                    return;
                }
            }
        }
        v = Pan.base.util.decapitalize(v);
        delete(this.record['start-time']);
        delete(this.record['end-time']);
        this.record['period'] = v;
    }, setDbType: function () {
        var database = this.getCmp('database').getValue();
        if (!this.record.type) {
            this.record.type = {};
        }
        else {
            for (var n in this.record.type) {
                if (this.record.type.hasOwnProperty(n)) {
                    delete this.record.type[n];
                }
            }
        }
        this.record.type[database] = {};
        return database;
    }, setFields: function (database) {
        var self = this;
        delete this.record.type[database]['aggregate-by'];
        delete this.record.type[database]['values'];
        var aggregatebys = [];
        var values = [];
        var fields = this.getCmp('columns').collect('value');
        Ext.each(fields, function (field) {
            if (Pan.monitor.ManageCustomReport.valueMembers[field]) {
                values.push(field);
            }
            else if (field != self.record.type[database]['group-by']) {
                aggregatebys.push(field);
            }
        });
        if (values.length == 0 && this.record.type[database]['group-by']) {
            aggregatebys.splice(0, 0, this.record.type[database]['group-by']);
            delete this.record.type[database]['group-by'];
        }
        if (aggregatebys.length > 0) {
            this.record.type[database]['aggregate-by'] = {member: aggregatebys};
        }
        else if (this.record.type[database]['group-by']) {
            this.record.type[database]['aggregate-by'] = {member: [this.record.type[database]['group-by']]};
            delete this.record.type[database]['group-by'];
        }
        if (values.length > 0) {
            this.record.type[database]['values'] = {member: values};
        }
    }, setSortByGroupBy: function (database) {
        var sortby = this.getCmp('sort-by').getValue();
        var groupby = this.getCmp('group-by').getValue();
        if (sortby) {
            this.record.type[database]['sortby'] = sortby;
        }
        else {
            delete this.record.type[database]['sortby'];
        }
        if (groupby) {
            this.record.type[database]['group-by'] = groupby;
        }
        else {
            delete this.record.type[database]['group-by'];
        }
    }, setQuery: function () {
        var query = Ext.util.Format.trim(this.getCmp('query').getValue());
        if (!query) {
            delete this.record.query;
        }
        else {
            this.record.query = query;
        }
    }, customSave: true, getValue: function () {
        if (!this.record) {
            this.record = {};
        }
        if (!this.record["@__recordInfo"]) {
            this.record["@__recordInfo"] = {};
        }
        this.record["@__recordInfo"].xpathId = Pan.base.defaultXpathId();
        var database = this.setDbType();
        this.setTimeFrame();
        this.setDescription();
        this.setTopMN();
        this.setScheduled();
        this.setQuery();
        this.setSortByGroupBy(database);
        this.setFields(database);
        this.record.caption = this.findByItemId('name').getValue() || this.record['caption'] || this.record['@name'] || 'untitled';
        delete this.record.delta;
        delete this.record['ui-node'];
        return this.record;
    }, runReport: function () {
        var record = Pan.base.clone(this.getValue());
        var title = this.findByItemId('name').getValue() || record['caption'] || record['@name'] || 'untitled';
        delete record['@__recordInfo'];
        delete record['@name'];
        delete record['disabled'];
        delete record['frequency'];
        var re_invalid_xml = /[^a-zA-Z0-9_-]/;
        for (var m in record) {
            if (record.hasOwnProperty(m)) {
                if (m.match(re_invalid_xml)) {
                    delete record[m];
                }
            }
        }
        var query = record['query'] || '';
        delete record['query'];
        record['caption'] = title;
        var xml = json2xml(record);
        xml += Pan.acc2.query.generateDGTag();
        if (query.indexOf('<type>') != -1 && query.indexOf('</type>') != -1 && xml.indexOf('<type>') != -1 && xml.indexOf('</type>') != -1) {
            var startidx = xml.indexOf('<type>');
            var endidx = xml.indexOf('</type>') + '</type>'.length;
            xml = xml.substr(0, startidx) + query + xml.substr(endidx);
            query = '';
        }
        var tabid = 'tab_' + Ext.id();
        var mainpanel = new Ext.Panel({
            id: tabid,
            title: title + " (0%)",
            closable: true,
            layout: 'vbox',
            layoutConfig: {align: 'stretch'},
            html: '',
            stateful: true,
            stateId: 'ManageCustom_PickupLater_Report',
            getState: function () {
                var jobs = {jobid: this.jobid, jobreportdefinition: this.jobreportdefinition};
                return jobs;
            }
        });
        var reportpanel = new Ext.Panel({layout: 'fit', flex: 1, html: ''});
        var reportHeaderID = tabid + '_reportHeader';
        var self = this;
        self.reportHeaderID = reportHeaderID;
        self.mainpanel = mainpanel;
        var reportHeaderBanner;
        if (Pan.global.isCms()) {
            reportHeaderBanner = new Pan.base.container.Container({
                hidden: true,
                border: true,
                itemId: reportHeaderID,
                height: 45,
                layout: 'fit',
                style: 'padding: 10px; background-color: #fff0c8; color: black;',
                items: [{
                    xtype: 'pan-container',
                    layout: 'hbox',
                    items: [{
                        xtype: 'pan-label',
                        itemId: reportHeaderID + '_label',
                        style: 'padding: 5 8 0 0',
                        html: '',
                        flex: 1
                    }, {
                        fieldLabel: "&#160;",
                        xtype: 'pan-linkbutton',
                        itemId: 'pick_up_later',
                        text: _T("Pick up Later"),
                        width: 100,
                        handler: function (element) {
                            var mainpanel = this.findParentByType(Ext.Panel);
                            var msg;
                            msg = _T('This report will be run in the background. You can retrieve or clear the report at any time by clicking on the "Background Report" button at the bottom of the Manage Custom Report page. This report dialog can now be closed at any time. Would you like to continue?');
                            Pan.Msg.show({
                                title: _T("Pickup Report Later"),
                                msg: msg,
                                icon: Ext.Msg.WARNING,
                                closable: false,
                                defaultButton: 1,
                                buttons: Ext.Msg.YESNO,
                                fn: function (response) {
                                    if (response === 'yes') {
                                        Pan.Msg.hide();
                                        var recordform = mainpanel.findParentByInstanceof(Pan.base.container.Window).findByItemId('$');
                                        var name = recordform.findByItemId('name').getValue();
                                        var description = recordform.getCmp('description').getValue();
                                        var topn = recordform.getCmp('topn').getValue();
                                        var topm = recordform.getCmp('topm').getValue();
                                        var scheduled = recordform.getCmp('scheduled').getValue();
                                        var timeframe = recordform.getCmp('time-frame').getValue();
                                        var groupby = recordform.getCmp('group-by').getValue();
                                        var query = recordform.getCmp('query').getValue();
                                        var database = recordform.getCmp('database').getValue();
                                        var aggregatebys = [];
                                        var values = [];
                                        var fields = recordform.getCmp('columns').collect('value');
                                        Ext.each(fields, function (field) {
                                            if (Pan.monitor.ManageCustomReport.valueMembers[field]) {
                                                values.push(field);
                                            }
                                            else if (field != groupby) {
                                                aggregatebys.push(field);
                                            }
                                        });
                                        var sortby = recordform.getCmp('sort-by').getValue();
                                        var type = {};
                                        type[database] = {
                                            "aggregate-by": {"member": aggregatebys},
                                            "values": {"member": values},
                                            "sortby": sortby,
                                            "group-by": groupby
                                        };
                                        var json = {
                                            "@name": name,
                                            'time-frame': timeframe,
                                            'frequency': scheduled ? 'daily' : '',
                                            "description": description,
                                            "ui-node": "Dummy",
                                            "topn": topn,
                                            "topm": topm,
                                            "type": type,
                                            "query": query,
                                            "caption": "Pickup Later Report",
                                            "@__recordInfo": {"id": "dummy"}
                                        };
                                        mainpanel.jobreportdefinition = json;
                                        mainpanel.saveState();
                                        PanDirect.run('MonitorDirect.extendReportTimeout', [mainpanel.jobid], function () {
                                        });
                                        var customreportwindow = mainpanel.findParentByInstanceof(Pan.base.container.Window);
                                        var gridRecordForm = customreportwindow.gridRecordForm;
                                        gridRecordForm.stopMonitoring();
                                        var okButton = Ext.getCmp(gridRecordForm.id + gridRecordForm.okText);
                                        if (okButton) {
                                            okButton.disable();
                                        }
                                        var cancelButton = Ext.getCmp(gridRecordForm.id + gridRecordForm.cancelText);
                                        if (cancelButton) {
                                            cancelButton.disable();
                                        }
                                        this.removetask = new Ext.util.DelayedTask(function () {
                                            var backgroundReport = gridRecordForm ? gridRecordForm.scope.bottomToolbar.findByItemId('custom-pickup-report') : null;
                                            if (backgroundReport) {
                                                backgroundReport.show();
                                            }
                                            mainpanel.destroy();
                                            customreportwindow.hide();
                                        });
                                        this.removetask.delay(1000);
                                    }
                                }
                            });
                        }
                    }, {
                        fieldLabel: "&#160;",
                        xtype: 'pan-linkbutton',
                        text: _T('Clear Report'),
                        width: 100,
                        itemId: 'clear_report',
                        handler: function () {
                            var clearReportSelf = this;
                            Ext.Msg.show({
                                title: _T('Clear Report'),
                                msg: _T('Are you sure you want to clear this report? You will not be able to access this report anymore.'),
                                buttons: Ext.Msg.YESNO,
                                fn: function (result) {
                                    if (result === "yes") {
                                        var mainpanel = clearReportSelf.findParentByType(Ext.Panel);
                                        PanDirect.run('PanDirect.stopReport', [mainpanel.jobid]);
                                        if (Pan.monitor.ManageCustomReport.Editor.prototype.isPickupLaterReport(mainpanel.jobid)) {
                                            mainpanel.jobid = -1;
                                            mainpanel.jobreportdefinition = {};
                                            mainpanel.saveState();
                                        }
                                        var customreportwindow = mainpanel.findParentByInstanceof(Pan.base.container.Window);
                                        var backgroundReport = customreportwindow.gridRecordForm.scope.bottomToolbar.findByItemId('custom-pickup-report');
                                        if (backgroundReport) {
                                            backgroundReport.hide();
                                        }
                                        mainpanel.destroy();
                                        customreportwindow.hide();
                                    }
                                }
                            });
                        }
                    }]
                }]
            });
            mainpanel.add(reportHeaderBanner);
        }
        mainpanel.add(reportpanel);
        this.insert(1, mainpanel);
        this.activate(tabid);
        var panelmask = new Ext.LoadMask(reportpanel.body, {msg: "Please wait..."});
        panelmask.show();
        var uiObjs = {title: title, panelmask: panelmask, reportpanel: reportpanel, mainpanel: mainpanel};
        if (Pan.global.isCms()) {
            uiObjs.reportHeaderBanner = reportHeaderBanner;
        }
        this.runReportQueries(xml, query, uiObjs);
    }, runReportQueries: function (xml, query, uiObjs) {
        var customreportwindow = this.findParentByInstanceof(Pan.base.container.Window);
        if (customreportwindow.pickUpLater) {
            customreportwindow.pickUpLater = false;
            var pickupLaterReportFromPrefs = Ext.state.Manager.get('ManageCustom_PickupLater_Report');
            var jobid = pickupLaterReportFromPrefs.jobid;
            if (!isNaN(jobid)) {
                uiObjs.mainpanel.jobid = jobid;
                Pan.global.isCms() ? Pan.monitor.ManageCustomReport.Editor.prototype.polljob.defer(1500, this, [uiObjs, jobid, recordcnt, true]) : Pan.monitor.ManageCustomReport.Editor.prototype.polljob.defer(1500, this, [uiObjs, jobid]);
            }
            else {
                Pan.monitor.ManageCustomReport.Editor.prototype.resultCallback(uiObjs, null, true);
            }
        }
        else {
            var recordcnt = -1;
            PanDirect.run('MonitorDirect.enqueueCustomReport', [xml, query, Pan.monitor.vsysScope()], function (jobid, t) {
                jobid = parseInt(jobid, 10);
                if (!isNaN(jobid)) {
                    uiObjs.mainpanel.jobid = jobid;
                    Pan.global.isCms() ? Pan.monitor.ManageCustomReport.Editor.prototype.polljob.defer(1500, this, [uiObjs, jobid, recordcnt, false]) : Pan.monitor.ManageCustomReport.Editor.prototype.polljob.defer(1500, this, [uiObjs, jobid]);
                }
                else {
                    Pan.monitor.ManageCustomReport.Editor.prototype.resultCallback(uiObjs, null, false);
                }
            });
        }
    }, polljob: function (uiObjs, jobid, recordcnt, isBackgroundReport) {
        if (uiObjs.mainpanel.stoppoll) {
            return;
        }
        PanDirect.run('MonitorDirect.retrieveCustomReport', [jobid, recordcnt], function (result, t) {
            if (result !== false && result == jobid) {
                Pan.global.isCms() ? Pan.monitor.ManageCustomReport.Editor.prototype.polljob.defer(1500, this, [uiObjs, jobid, recordcnt, isBackgroundReport]) : Pan.monitor.ManageCustomReport.Editor.prototype.polljob.defer(1500, this, [uiObjs, jobid]);
            }
            else {
                if (Pan.global.isCms()) {
                    recordcnt = Pan.base.json.path(result, '$.result.job.recordcnt');
                }
                Pan.monitor.ManageCustomReport.Editor.prototype.resultCallback(uiObjs, result, isBackgroundReport);
                if (Pan.base.json.path(result, '$.result.job.status') == 'ACT') {
                    Pan.global.isCms() ? Pan.monitor.ManageCustomReport.Editor.prototype.polljob.defer(1500, this, [uiObjs, jobid, recordcnt, isBackgroundReport]) : Pan.monitor.ManageCustomReport.Editor.prototype.polljob.defer(1500, this, [uiObjs, jobid]);
                }
            }
        });
    }, resultCallback: function (uiObjs, result, isBackgroundReport) {
        var title = uiObjs.title;
        var panelmask = uiObjs.panelmask;
        var reportpanel = uiObjs.reportpanel;
        var mainpanel = uiObjs.mainpanel;
        var reportHeaderBanner = uiObjs.reportHeaderBanner;
        var reportErrorHTML = '<div style="text-align: center;vertical-align: middle;line-height:25;font-size:14px;">' + _T('Report Error') + '</div>';
        var noDataHTML = '<div style="text-align: center;vertical-align: middle;line-height:25;font-size:14px;">' + _T('No matching records') + '</div>';
        var startTime = new Date();
        var percentcomplete;
        var maxEstimatedReportTime = '';
        var maxEstimatedReportTimeInteger = 0;
        var status;
        var logger = PanLogging.getLogger('manage-custom-report');
        var endTime = new Date();
        var timeDiff = (endTime - startTime) / 1000;
        var seconds = Math.round(timeDiff % 60);
        var minutes = Math.round(timeDiff / 60);
        logger.info('report request took ' + minutes + ' minutes ' + seconds + ' seconds');
        if (result == false) {
            panelmask.hide();
            if (reportHeaderBanner) {
                reportHeaderBanner.hide();
            }
            mainpanel.setIconClass();
            reportpanel.el.dom.innerHTML = reportErrorHTML;
            mainpanel.doLayout();
            if (Pan.monitor.ManageCustomReport.Editor.prototype.isPickupLaterReport(mainpanel.jobid)) {
                mainpanel.jobid = -1;
                mainpanel.saveState();
            }
        }
        else {
            var pickUpLater, clearReport;
            if (reportHeaderBanner) {
                pickUpLater = reportHeaderBanner.findByItemId('pick_up_later');
                clearReport = reportHeaderBanner.findByItemId('clear_report');
                var toHidePickUpLaterLink = false;
                var pickupLaterReportFromPrefs = Ext.state.Manager.get('ManageCustom_PickupLater_Report');
                var pickupLaterReportExists = pickupLaterReportFromPrefs && pickupLaterReportFromPrefs.jobid && pickupLaterReportFromPrefs.jobid !== -1;
                if (isBackgroundReport) {
                    if (pickUpLater) {
                        toHidePickUpLaterLink = true;
                        pickUpLater.hide();
                    }
                } else {
                    if (!pickupLaterReportExists) {
                        if (clearReport) {
                            clearReport.hide();
                        }
                    }
                }
            }
            if (result && result.result && result.result.job && result.result.job.percent) {
                percentcomplete = parseInt(result.result.job.percent, 10);
            }
            if (result && result.result && result.result.job && result.result.job.status) {
                status = result.result.job.status;
            }
            maxEstimatedReportTime = result.result.job['eruntime'];
            if (reportHeaderBanner && maxEstimatedReportTime) {
                maxEstimatedReportTimeInteger = parseInt(maxEstimatedReportTime, 10);
                var runningNewReportWhilePickupLaterExists = !isBackgroundReport && pickupLaterReportExists;
                var showBanner = true;
                var label = reportHeaderBanner.findByItemId(reportHeaderBanner.itemId + '_label');
                if (label) {
                    var actionMessage = runningNewReportWhilePickupLaterExists ? '' : Pan.monitor.ManageCustomReport.Helper.getActionMessage(toHidePickUpLaterLink);
                    if (maxEstimatedReportTimeInteger > 0) {
                        var hrs = Math.floor(maxEstimatedReportTime / 3600);
                        var mins = Math.floor((maxEstimatedReportTime % 3600) / 60);
                        var secs = maxEstimatedReportTime % 60;
                        maxEstimatedReportTime = hrs + ":" + mins + ":" + secs;
                        label.setValue(Pan.monitor.ManageCustomReport.Helper.getEstimatedReportMessage() + maxEstimatedReportTime + ' ' + _T('hrs.') + ' ' + actionMessage);
                    } else {
                        label.setValue(actionMessage);
                    }
                }
                if (runningNewReportWhilePickupLaterExists) {
                    if (pickUpLater) {
                        pickUpLater.hide();
                    }
                    if (clearReport) {
                        clearReport.hide();
                    }
                    if (maxEstimatedReportTimeInteger <= 0) {
                        showBanner = false;
                    }
                }
                if (showBanner) {
                    reportHeaderBanner.show();
                }
                mainpanel.doLayout();
            }
            if (result && result.result && result.result.report && result.result.report.entry) {
                var grid = new Pan.monitor.ReportViewer({columnsHideable: true});
                reportpanel.add(grid);
                reportpanel.doLayout();
                grid.loadReport(result);
            }
            if (!percentcomplete) {
                percentcomplete = 0;
            }
            if (reportHeaderBanner && !reportHeaderBanner.hidden) {
                mainpanel.setTitle(title + " (" + percentcomplete + "%)", 'icon-warning');
            }
            else {
                mainpanel.setTitle(title + " (" + percentcomplete + "%)");
            }
            if (status == 'FIN') {
                panelmask.hide();
                if (Pan.monitor.ManageCustomReport.Editor.prototype.isPickupLaterReport(mainpanel.jobid) && label) {
                    label.setValue(Pan.monitor.ManageCustomReport.Helper.getPickupReportFinMessage());
                }
                else {
                    if (reportHeaderBanner) {
                        reportHeaderBanner.hide();
                    }
                }
                mainpanel.setIconClass();
                mainpanel.doLayout();
                if (result && result.result && result.result.report) {
                    if (!result.result.report.entry) {
                        reportpanel.update(noDataHTML);
                    }
                }
            }
        }
    }, filterScheduledTimeFrame: function () {
        this.getCmp('time-frame').addValidScheduledTimePeriodsFilter();
    }, unfilterScheduledTimeFrame: function () {
        this.getCmp('time-frame').removeValidScheduledTimePeriodsFilter();
    }, buildUI: function () {
        var self = this;
        var name = {itemId: 'name'};
        var description = {id: this.id('description'), itemId: 'description'};
        var timeframe = {id: this.id('time-frame'), itemId: 'time-frame', xtype: 'pan-customtimecombo'};
        var scheduled = {
            id: this.id('scheduled'), itemId: 'scheduled', handler: function (box, checked) {
                if (checked) {
                    self.filterScheduledTimeFrame();
                }
                else {
                    self.unfilterScheduledTimeFrame();
                }
            }
        };
        var topn = {
            id: this.id('topn'),
            itemId: 'topn',
            hideLabel: true,
            xtype: 'pan-selectbox',
            listeners: {
                'select': function (cb) {
                    if (cb.getValue() > 500) {
                        self.getCmp('group-by').setValue('');
                    }
                }
            },
            store: [[5, _T('Top 5')], [10, _T('Top 10')], [25, _T('Top 25')], [50, _T('Top 50')], [100, _T('Top 100')], [250, _T('Top 250')], [500, _T('Top 500')], [1000, _T('Top 1000')], [5000, _T('Top 5000')], [10000, _T('Top 10000')]]
        };
        var sortBySelect = {
            hideLabel: true,
            fieldLabel: _T('Sort By'),
            id: this.id('sort-by'),
            xtype: 'pan-selectbox',
            store: Pan.monitor.ManageCustomReport.sortbyStore[Pan.monitor.ManageCustomReport.databaseStore[0][0]]
        };
        var groupBySelect = {
            hideLabel: true,
            fieldLabel: _T('Group By'),
            id: this.id('group-by'),
            xtype: 'pan-selectbox',
            listeners: {
                'select': function (cb) {
                    if (cb.getValue()) {
                        var tn = self.getCmp('topn');
                        if (tn.getValue() > 500) {
                            tn.setValue(500);
                        }
                    }
                }
            },
            store: Pan.monitor.ManageCustomReport.groupbyStore[Pan.monitor.ManageCustomReport.databaseStore[0][0]]
        };
        var topm = {
            id: this.id('topm'),
            itemId: 'topm',
            hideLabel: true,
            xtype: 'pan-selectbox',
            store: [[5, _T('5 Groups')], [10, _T('10 Groups')], [25, _T('25 Groups')], [50, _T('50 Groups')]]
        };
        var itemSelect = new Pan.monitor.FieldSelector({
            itemId: 'itemSelect',
            flex: 1,
            region: 'center',
            id: this.id('columns'),
            data: Pan.monitor.ManageCustomReport.columnsItemselect[Pan.monitor.ManageCustomReport.databaseStore[0][0]]
        });
        var query = new Ext.form.TextArea({
            region: 'center',
            fieldLabel: _T('Query'),
            height: 80,
            flex: 1,
            emptyText: _T('Please type (or) add a filter using the filter builder'),
            id: this.id('query'),
            itemId: 'query'
        });
        var filterbuilderform = {
            itemId: 'filterbuilderform',
            flex: 2,
            title: _T('Query Builder'),
            xtype: 'pan-fieldset',
            layout: 'border',
            layoutConfig: {align: 'stretch'},
            items: [query, {
                region: 'east', xtype: 'pan-linkbutton', text: _T('Filter Builder'), handler: function () {
                    var win = new Pan.monitor.log.FilterBuilder({
                        logtype: this.ownerCt.logtype.replace('panorama-', ''),
                        target: query
                    });
                    win.show();
                }
            }]
        };
        var iData = [];
        if (Pan.monitor.isDGScope()) {
            var toCopy = true;
            for (var i = 0; i < Pan.monitor.ManageCustomReport.databaseNewStore.length; i++) {
                var item = Pan.monitor.ManageCustomReport.databaseNewStore[i];
                if (item.name == "Remote Device Data") {
                    toCopy = false;
                }
                else if (item.isRoot) {
                    toCopy = true;
                }
                if (toCopy) {
                    iData.push(item);
                }
            }
        }
        else {
            iData = Pan.monitor.ManageCustomReport.databaseNewStore;
        }
        var isGTPEnabled = Pan.global.CONTEXT.isGTPEnabled;
        if (!isGTPEnabled) {
            iData = _.filter(iData, function (logitem) {
                return logitem.name != 'GTP';
            });
        }
        var isSCTPEnabled = Pan.global.CONTEXT.isSCTPEnabled;
        if (!isSCTPEnabled) {
            iData = _.filter(iData, function (logitem) {
                return logitem.name != 'SCTP';
            });
        }
        var databaseSelect = {
            fieldLabel: _T('Database'),
            itemId: 'database',
            id: this.id('database'),
            xtype: 'pan-gCombo4MgmtCRpt',
            listeners: {
                'select': function (cb) {
                    var reallogtype = cb.getValue();
                    var logtype = reallogtype.replace('panorama-', '');
                    self.reloadSortBy(reallogtype);
                    self.reloadGroupBy(reallogtype);
                    self.reloadColumns(logtype, null, reallogtype);
                    self.findByItemId('filterbuilderform').logtype = reallogtype;
                    self.getCmp('query').setValue('');
                }
            },
            iData: iData
        };
        var tbar = [{
            iconCls: 'icon-open-report', width: 100, text: _T('Load Template'), handler: function () {
                var win = new Pan.monitor.ManageCustomReport.TemplateWin({caller: self});
                win.show();
            }
        }];
        tbar.push({
            iconCls: 'icon-run',
            itemId: 'run-now',
            width: 100,
            scope: this,
            handler: this.runReport,
            formBind: true,
            text: _T('Run Now')
        });
        var items = {
            layout: 'border',
            xtype: 'pan-panel',
            title: _T('Report Setting'),
            itemId: 'reportsetting',
            tbar: tbar,
            defaults: {style: 'padding: 5'},
            items: [{
                region: 'north',
                xtype: 'pan-container',
                layout: 'hbox',
                layoutConfig: {align: 'top'},
                defaults: {flex: 1},
                items: [{
                    margins: "5, 0, 0, 0",
                    xtype: 'pan-container',
                    rfLayoutConfig: Pan.base.autorender.layout.RFTableLayoutConfig,
                    items: [name, description, databaseSelect, scheduled, timeframe, {
                        hideLabel: false,
                        fieldLabel: _T('Sort By'),
                        xtype: 'pan-container',
                        layout: 'hbox',
                        defaults: {flex: 1},
                        height: 22,
                        items: [sortBySelect, {
                            xtype: 'pan-container',
                            layout: 'fit',
                            style: 'padding-left: 10',
                            items: topn
                        }]
                    }, {
                        hideLabel: false,
                        fieldLabel: _T('Group By'),
                        xtype: 'pan-container',
                        id: 'group_by_container',
                        itemId: 'group_by_container',
                        layout: 'hbox',
                        defaults: {flex: 1},
                        height: 22,
                        items: [groupBySelect, {
                            xtype: 'pan-container',
                            layout: 'fit',
                            style: 'padding-left: 10',
                            items: topm
                        }]
                    }]
                }, {
                    xtype: 'pan-panel',
                    layout: 'fit',
                    margins: "5, 5, 0, 5",
                    height: Pan.monitor.FieldSelector.prototype.height + 60,
                    items: [itemSelect],
                    listeners: {
                        'bodyresize': function (p, w) {
                            var width = (w - 20) / 2;
                            var ms;
                            ms = itemSelect;
                            if (ms && ms.fromMultiselect) {
                                var fs = ms.fromMultiselect.fs;
                                if (fs) {
                                    ms.fromMultiselect.setWidth(width);
                                    fs.setWidth(width);
                                }
                                fs = ms.toMultiselect.fs;
                                if (fs) {
                                    ms.toMultiselect.setWidth(width);
                                    fs.setWidth(width);
                                }
                            }
                        }
                    }
                }]
            }, {
                region: 'center',
                xtype: 'pan-container',
                layout: 'vbox',
                layoutConfig: {align: 'stretch'},
                items: filterbuilderform
            }, {
                region: 'south',
                xtype: 'pan-displayfield',
                hideLabel: true,
                hidden: !Pan.monitor.loggingServiceCustomReportMsg,
                cls: "x-form-help-string x-form-helptext",
                value: Pan.monitor.loggingServiceCustomReportMsg
            }]
        };
        Ext.apply(this, {activeTab: 0, bodyStyle: 'padding:0; margin:0', layoutOnTabChange: true, items: items});
    }, id: function (name) {
        return this.idPrefix + name;
    }, getCmp: function (name) {
        return Ext.getCmp(this.id(name));
    }, isPickupLaterReport: function (jobid) {
        var pickupLaterReportFromPrefs = Ext.state.Manager.get('ManageCustom_PickupLater_Report');
        return (pickupLaterReportFromPrefs && pickupLaterReportFromPrefs.jobid && jobid == pickupLaterReportFromPrefs.jobid);
    }, getPickUpLaterReportDefinition: function () {
        var pickupLaterReportFromPrefs = Ext.state.Manager.get('ManageCustom_PickupLater_Report');
        if (pickupLaterReportFromPrefs && pickupLaterReportFromPrefs.jobreportdefinition) {
            return pickupLaterReportFromPrefs.jobreportdefinition;
        }
    }, constructor: function () {
        var a = [];
        if (!Pan.global.CONTEXT.isGTPEnabled) {
            a = a.concat(Pan.monitor.query.expressions.gtpOnlyFields);
        }
        if (!Pan.global.CONTEXT.isSCTPEnabled) {
            a = a.concat(Pan.monitor.query.expressions.sctpOnlyFields);
        }
        if (a.length > 0) {
            $.each(Pan.monitor.ManageCustomReport.columnsItemselect, function (index, db) {
                $.each(a, function (index, column) {
                    for (var i = 0; i < db.length; i++) {
                        if (db[i][0] == column) {
                            db.splice(i, 1);
                            break;
                        }
                    }
                });
            });
        }
        this.enableTabScroll = true;
        window.editor = this;
        this.idPrefix = Ext.id();
        this.validatedOnce = false;
        this.buildUI();
        this.listeners = this.listeners || {};
        this.listeners['remove'] = function (tabpanel, removedtab) {
            removedtab.stoppoll = true;
            if (removedtab && removedtab.jobid) {
                if (!Pan.monitor.ManageCustomReport.Editor.prototype.isPickupLaterReport(removedtab.jobid) && removedtab.jobid != -1) {
                    PanDirect.run('PanDirect.stopReport', [removedtab.jobid]);
                }
            }
        };
        this.listeners['removed'] = function (tabpanel) {
            tabpanel.items.each(function (removedtab) {
                removedtab.stoppoll = true;
                if (removedtab && removedtab.jobid) {
                    setTimeout(function () {
                        if (!Pan.monitor.ManageCustomReport.Editor.prototype.isPickupLaterReport(removedtab.jobid) && removedtab.jobid != -1) {
                            PanDirect.run('PanDirect.stopReport', [removedtab.jobid]);
                        }
                    }, 1000);
                }
            });
        };
        Pan.monitor.ManageCustomReport.Editor.superclass.constructor.apply(this, arguments);
    }, initComponent: function () {
        this.addListener('afterrender', function () {
            var _db = this.getCmp('database');
            if (_db) {
                _db.fireEvent('select', _db);
            }
        }, this);
        Pan.monitor.ManageCustomReport.Editor.superclass.initComponent.call(this);
    }, isValidForAllFields: function (form) {
        var valid = true;
        form.items.each(function (f) {
            if (!f.isValid(true)) {
                valid = false;
                return false;
            }
        });
        return valid;
    }, afterRender: function () {
        Pan.monitor.ManageCustomReport.Editor.superclass.afterRender.call(this);
        var self = this;
        var formpanel = this.findParentByType('pan-window').get(0);
        var runnow = this.get(0).toolbars[0].get(1);
        formpanel.on('clientvalidation', function (evt, valid) {
            var validForRunNow = valid || self.isValidForAllFields(this.form);
            runnow.setDisabled(!validForRunNow);
        });
    }
});
Ext.applyIf(Pan.monitor.ManageCustomReport.Editor.prototype, Pan.base.autorender.GridRecordField.prototype);
Ext.reg('pan-managecustomreport-editor', Pan.monitor.ManageCustomReport.Editor);
Pan.monitor.ManageCustomReport.PickupLaterAction = Ext.extend(Pan.base.grid.AddRecordAction, {
    constructor: function (config) {
        Pan.monitor.ManageCustomReport.PickupLaterAction.superclass.constructor.call(this, Ext.apply({
            text: _T('Background Report'),
            itemId: 'custom-pickup-report',
            iconCls: 'icon-import',
            ref: '../pickUpLaterAction'
        }, config));
    }, action: function (element, config, event) {
        config = Ext.apply({}, {
            recordFormOverride: {
                recordFormPostLoadChangeConfig: this.initialConfig.recordFormPostLoadChangeConfig,
                recordFormPostLoadChangeCallback: function (gridRecordForm) {
                    var customreportwindow = gridRecordForm.findParentByInstanceof(Pan.base.container.Window);
                    var json = Pan.monitor.ManageCustomReport.Editor.prototype.getPickUpLaterReportDefinition();
                    if (json) {
                        gridRecordForm.findByItemId('$').loadReport(json, true);
                    }
                    customreportwindow.pickUpLater = true;
                    var runnowbutton = gridRecordForm.findByItemId('reportsetting').topToolbar.findByItemId('run-now');
                    runnowbutton.el.dom.click();
                }
            }
        }, config);
        config.grid.addRecord(element, config, event);
    }
});
Pan.areg("pickUpLaterAction", Pan.monitor.ManageCustomReport.PickupLaterAction);
Pan.monitor.ManageCustomReport.Viewer = Ext.extend(Pan.monitor.MonitorViewer, {
    storeInputs: {objectType: _T("Custom Report")},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: "ManageCustomReport",
            api: {readSchema: Pan.appframework.schema.getVsysOrDgSchema("reports")}
        }
    },
    fields: [{
        name: 'name',
        mapping: '@name',
        defaultValue: 'untitled'
    }, 'caption', 'description', 'disabled', 'frequency', 'topn', 'topm', 'start-time', 'end-time', 'period', {
        name: 'type',
        dataMap: Pan.monitor.ManageCustomReport.Helper.getLogType,
        saveMap: undefined
    }, {
        name: 'time-frame',
        dataMap: Pan.monitor.ManageCustomReport.Helper.getTimeFrame,
        saveMap: undefined
    }, {
        name: 'enabled',
        type: 'boolean',
        dataMap: Pan.monitor.ManageCustomReport.Helper.getEnabled,
        saveMap: undefined
    }, {
        name: 'scheduled',
        type: 'boolean',
        dataMap: Pan.monitor.ManageCustomReport.Helper.getScheduled,
        saveMap: undefined
    }, {name: 'sortby', dataMap: Pan.monitor.ManageCustomReport.Helper.getSortBy, saveMap: undefined}, {
        name: 'groupby',
        dataMap: Pan.monitor.ManageCustomReport.Helper.getGroupBy,
        saveMap: undefined
    }],
    columns: [Pan.monitor.MonitorViewer.prototype.columnConfig.name, {
        sortable: true,
        dataIndex: 'description'
    }, {header: _T('Database'), sortable: true, dataIndex: 'type'}, {
        width: 230,
        sortable: true,
        dataIndex: 'time-frame'
    }, {header: _T('Rows'), width: 40, sortable: true, dataIndex: 'topn'}, {
        header: _T('Sort By'),
        width: 60,
        sortable: true,
        dataIndex: 'sortby'
    }, {header: _T('Group By'), sortable: true, dataIndex: 'groupby'}, {
        width: 57,
        sortable: true,
        dataIndex: 'scheduled'
    }],
    recordForm: {
        readOnly: false,
        windowConfig: {width: 800, height: 500, minHeight: 500, maximizable: true, autoHeight: false},
        cls: 'darkblue-container',
        rfLayoutConfig: Pan.base.autorender.layout.RFTableLayoutConfig,
        items: [{itemId: '$', xtype: 'pan-managecustomreport-editor', vflex: true}, Pan.monitor._locationField],
        okCallback: function () {
            this.afterLoad();
            return true;
        },
        cancelCallback: function () {
            Pan.appframework.PanAppInterface.refresh();
            return true;
        }
    },
    setupBar: function (barType) {
        if (barType == 'bbar') {
            var insertIndex = this.bbar.indexOf('->');
            this.bbar.splice(insertIndex, 0, {atype: 'pickUpLaterAction'});
        }
        Pan.monitor.ManageCustomReport.Viewer.superclass.setupBar.apply(this, arguments);
    },
    afterLoad: function () {
        Pan.monitor.ManageCustomReport.Viewer.superclass.setupBar.apply(this, arguments);
        var pickupLaterReportFromPrefs = Ext.state.Manager.get('ManageCustom_PickupLater_Report');
        if (pickupLaterReportFromPrefs && pickupLaterReportFromPrefs.jobid && pickupLaterReportFromPrefs.jobid != -1) {
            this.bottomToolbar.findByItemId('custom-pickup-report').show();
        }
        else {
            this.bottomToolbar.findByItemId('custom-pickup-report').hide();
        }
    }
});
Pan.reg("Monitor/Manage Custom Reports", Pan.monitor.ManageCustomReport.Viewer);
Ext.ns('Pan.monitor.appscope');
Pan.monitor.appscope.SummaryScope = Ext.extend(Pan.base.container.Panel, {
    onResize: function (adjWidth, adjHeight, rawWidth, rawHeight) {
        var tmpHeight = 300;
        var tmpWidth = Ext.getBody().getViewSize().width / 2 - 117.5;
        if (tmpWidth < 500) {
            tmpWidth = 500;
        }
        var self = this;
        this.removeAll(true);
        this.add([{
            xtype: 'panel',
            height: 327,
            layout: {type: 'hbox', pack: 'start', align: 'stretch', padding: 0},
            bodyStyle: {"background-color": "#FBFCFC"},
            flex: 1,
            items: [{
                xtype: 'panel',
                flex: 1,
                id: 'chart_parent_container1',
                itemId: 'chart_parent_container1',
                padding: 0,
                margin: "0 0 0 0",
                autoHeight: false,
                autoWidth: false,
                height: 327,
                width: tmpWidth,
                title: _T('Top 5 Gainers (last 60 minutes vs yesterday)'),
                items: [{
                    xtype: 'panel',
                    id: 'chart_container1',
                    itemId: 'chart_container1',
                    height: 300,
                    width: tmpWidth,
                    listeners: {
                        afterRender: function () {
                            if (self.datamap['chart_container1']) {
                                self.renderChart(self.datamap['chart_container1'].functionality, 'chart_container1', tmpHeight, tmpWidth, self.datamap['chart_container1'].content);
                            }
                            else {
                                var config = {
                                    'page': 'change_monitor',
                                    'divid': 'chart_container1',
                                    'functionality': 'changescope',
                                    'appscope-data-source': '',
                                    'clear_report': 'yes',
                                    'debug': '',
                                    'period': 'last-hour',
                                    'topn': '5',
                                    'aggregate-by': 'app',
                                    'sortby': 'percentage',
                                    'sort': 'gainer',
                                    'yaxis': 'sessions',
                                    title: _T('Top 5 Gainers'),
                                    'from-end-time': 24 * 60 * 60,
                                    'chart_type': 'stacked_column'
                                };
                                self.callChart(self, config);
                            }
                        }
                    }
                }, {
                    xtype: 'container',
                    id: 'chart_container_print1',
                    itemId: 'chart_container_print1',
                    title: ''
                }, {xtype: 'container', id: 'chart_container_data1', itemId: 'chart_container_data1', title: ''}]
            }, {xtype: 'spacer', width: 10}, {
                xtype: 'panel',
                flex: 1,
                id: 'chart_parent_container2',
                itemId: 'chart_parent_container2',
                padding: 0,
                margin: "0 0 0 10",
                autoHeight: false,
                autoWidth: false,
                height: 327,
                width: tmpWidth,
                title: _T('Top 5 Losers (last 60 minutes vs yesterday)'),
                items: [{
                    xtype: 'panel',
                    id: 'chart_container2',
                    itemId: 'chart_container2',
                    height: 300,
                    width: tmpWidth,
                    listeners: {
                        afterRender: function () {
                            if (self.datamap['chart_container2']) {
                                self.renderChart(self.datamap['chart_container2'].functionality, 'chart_container2', tmpHeight, tmpWidth, self.datamap['chart_container2'].content);
                            }
                            else {
                                var config = {
                                    'page': 'change_monitor',
                                    'divid': 'chart_container2',
                                    'functionality': 'changescope',
                                    'appscope-data-source': '',
                                    'clear_report': 'yes',
                                    'debug': '',
                                    'period': 'last-hour',
                                    'topn': '5',
                                    'aggregate-by': 'app',
                                    'sortby': 'percentage',
                                    'sort': 'loser',
                                    'yaxis': 'sessions',
                                    title: _T('Top 5 Losers'),
                                    'from-end-time': 24 * 60 * 60,
                                    'chart_type': 'stacked_column'
                                };
                                self.callChart(self, config);
                            }
                        }
                    }
                }, {
                    xtype: 'container',
                    id: 'chart_container_print2',
                    itemId: 'chart_container_print2',
                    title: ''
                }, {xtype: 'container', id: 'chart_container_data2', itemId: 'chart_container_data2', title: ''}]
            }]
        }, {xtype: 'spacer', height: 10, width: 10}, {
            xtype: 'panel',
            height: 327,
            layout: {type: 'hbox', pack: 'start', align: 'stretch', padding: 0},
            bodyStyle: {"background-color": "#FBFCFC"},
            flex: 1,
            items: [{
                xtype: 'panel',
                flex: 1,
                id: 'chart_parent_container3',
                itemId: 'chart_parent_container3',
                padding: 0,
                margin: "0 0 0 10",
                autoHeight: false,
                autoWidth: false,
                height: 327,
                width: tmpWidth,
                title: _T('Top 5 Bandwidth Consuming Source (last 60 mins)'),
                items: [{
                    xtype: 'panel',
                    id: 'chart_container3',
                    itemId: 'chart_container3',
                    height: 300,
                    width: tmpWidth,
                    listeners: {
                        afterRender: function () {
                            if (self.datamap['chart_container3']) {
                                self.renderChart(self.datamap['chart_container3'].functionality, 'chart_container3', tmpHeight, tmpWidth, self.datamap['chart_container3'].content);
                            }
                            else {
                                var config = {
                                    'page': 'network_monitor',
                                    'divid': 'chart_container3',
                                    'functionality': 'bandwidthscope',
                                    'appscope-data-source': '',
                                    'clear_report': 'yes',
                                    'debug': '',
                                    'period': 'last-hour',
                                    'topn': '5',
                                    title: _T('Top 5 Bandwidth Consuming Source'),
                                    'aggregate-by': 'src',
                                    'sortby': 'bytes',
                                    'chart_type': 'stacked_column'
                                };
                                self.callChart(self, config);
                            }
                        }
                    }
                }, {
                    xtype: 'container',
                    id: 'chart_container_print3',
                    itemId: 'chart_container_print3',
                    title: ''
                }, {xtype: 'container', id: 'chart_container_data3', itemId: 'chart_container_data3', title: ''}]
            }, {xtype: 'spacer', width: 10}, {
                xtype: 'panel',
                flex: 1,
                id: 'chart_parent_container4',
                itemId: 'chart_parent_container4',
                padding: 0,
                margin: "0 0 0 10",
                autoHeight: false,
                autoWidth: false,
                height: 327,
                width: tmpWidth,
                title: _T('Top 5 Bandwidth Consuming Apps (last 24 hours)'),
                items: [{
                    xtype: 'panel',
                    id: 'chart_container4',
                    itemId: 'chart_container4',
                    height: 300,
                    width: tmpWidth,
                    listeners: {
                        afterRender: function () {
                            if (self.datamap['chart_container4']) {
                                self.renderChart(self.datamap['chart_container4'].functionality, 'chart_container4', tmpHeight, tmpWidth, self.datamap['chart_container4'].content);
                            }
                            else {
                                var config = {
                                    'page': 'network_monitor',
                                    'divid': 'chart_container4',
                                    'functionality': 'bandwidthscope',
                                    'appscope-data-source': '',
                                    'clear_report': 'yes',
                                    'debug': '',
                                    'period': 'last-24-hrs',
                                    'topn': '5',
                                    title: _T('Top 5 Bandwidth Consuming Apps'),
                                    'aggregate-by': 'app',
                                    'sortby': 'bytes',
                                    'chart_type': 'stacked_column'
                                };
                                self.callChart(self, config);
                            }
                        }
                    }
                }, {
                    xtype: 'container',
                    id: 'chart_container_print4',
                    itemId: 'chart_container_print4',
                    title: ''
                }, {xtype: 'container', id: 'chart_container_data4', itemId: 'chart_container_data4', title: ''}]
            }]
        }, {xtype: 'spacer', height: 10, width: 10}, {
            xtype: 'panel',
            height: 327,
            layout: {type: 'hbox', pack: 'start', align: 'stretch', padding: 0},
            bodyStyle: {"background-color": "#FBFCFC"},
            flex: 1,
            items: [{
                xtype: 'panel',
                flex: 1,
                id: 'chart_parent_container5',
                itemId: 'chart_parent_container5',
                padding: 0,
                margin: "0 0 0 10",
                autoHeight: false,
                autoWidth: false,
                height: 327,
                width: tmpWidth,
                title: _T('Top 5 Bandwidth Consuming App categories (last 24 hours)'),
                items: [{
                    xtype: 'panel',
                    id: 'chart_container5',
                    itemId: 'chart_container5',
                    height: 300,
                    width: tmpWidth,
                    listeners: {
                        afterRender: function () {
                            if (self.datamap['chart_container5']) {
                                self.renderChart(self.datamap['chart_container5'].functionality, 'chart_container5', tmpHeight, tmpWidth, self.datamap['chart_container5'].content);
                            }
                            else {
                                var config = {
                                    'page': 'network_monitor',
                                    'divid': 'chart_container5',
                                    'functionality': 'bandwidthscope',
                                    'appscope-data-source': '',
                                    'clear_report': 'yes',
                                    'debug': '',
                                    'period': 'last-24-hrs',
                                    'topn': '5',
                                    title: _T('Top 5 Bandwidth Consuming App categories'),
                                    'aggregate-by': 'category-of-name',
                                    'sortby': 'bytes',
                                    'chart_type': 'stacked_column'
                                };
                                self.callChart(self, config);
                            }
                        }
                    }
                }, {
                    xtype: 'container',
                    id: 'chart_container_print5',
                    itemId: 'chart_container_print5',
                    title: ''
                }, {xtype: 'container', id: 'chart_container_data5', itemId: 'chart_container_data5', title: ''}]
            }, {xtype: 'spacer', width: 10}, {
                xtype: 'panel',
                flex: 1,
                id: 'chart_parent_container6',
                itemId: 'chart_parent_container6',
                padding: 0,
                margin: "0 0 0 10",
                autoHeight: false,
                autoWidth: false,
                height: 327,
                width: tmpWidth,
                title: _T('Top 5 Threats (last 24 hours)'),
                items: [{
                    xtype: 'panel',
                    id: 'chart_container6',
                    itemId: 'chart_container6',
                    height: 300,
                    width: tmpWidth,
                    listeners: {
                        afterRender: function () {
                            if (self.datamap['chart_container6']) {
                                self.renderChart(self.datamap['chart_container6'].functionality, 'chart_container6', tmpHeight, tmpWidth, self.datamap['chart_container6'].content);
                            }
                            else {
                                var config = {
                                    'page': 'threat_monitor',
                                    'divid': 'chart_container6',
                                    'functionality': 'bandwidthscope',
                                    'appscope-data-source': '',
                                    'clear_report': 'yes',
                                    'debug': '',
                                    'period': 'last-24-hrs',
                                    title: _T('Top 5 Threats'),
                                    'topn': '5',
                                    'aggregate-by': 'threatid',
                                    'sortby': 'sessions',
                                    'chart_type': 'stacked_column'
                                };
                                self.callChart(self, config);
                            }
                        }
                    }
                }, {
                    xtype: 'container',
                    id: 'chart_container_print6',
                    itemId: 'chart_container_print6',
                    title: ''
                }, {xtype: 'container', id: 'chart_container_data6', itemId: 'chart_container_data6', title: ''}]
            }]
        }]);
        Pan.monitor.appscope.SummaryScope.superclass.onResize.call(this, adjWidth, adjHeight, rawWidth, rawHeight);
    }, onDestroy: function () {
        for (var i = 1; i <= 6; i++) {
            if (this['chart' + i] != null) {
                this['chart' + i].destroy();
            }
        }
    }, onExport: function (obj, checked) {
        if (this.chartCounter < 6) {
            Ext.Msg.alert('Export', 'Please wait for all charts to be generated');
            obj.toggle(false);
            return;
        }
        if (!checked) {
            return;
        }
        switch (obj.value) {
            case'exportpdf':
                this.isPrint = "pdf";
                this.generatepdf();
                this.isPrint = "";
                break;
            default:
        }
        obj.toggle(false);
    }, computeConfig: function (__config) {
        __config = __config || {};
        __config['vsys'] = Pan.monitor.vsysScope();
        if (Pan.global.isCms() && Ext.getCmp('appscope-data-source').value === "panorama") {
            __config['appscope-data-source'] = 'panorama';
        }
        else {
            __config['appscope-data-source'] = '';
        }
        var configArr = [];
        configArr[0] = __config;
        return configArr;
    }, buildExportForm: function () {
        if (!document.getElementById("appscope.export.form")) {
            var html = ['<form id="appscope.export.form" method="post" target="_blank" action="/php/monitor/appscope.export.php">', '</form>'].join('');
            var el = new Ext.Element(document.createElement('div'));
            el.dom.innerHTML = html;
            el.appendTo(document.body);
        }
        return document.getElementById("appscope.export.form");
    }, generatepdf: function () {
        Ext.MessageBox.show({
            msg: 'Exporting, please wait...',
            progressText: 'Exporting, please wait...',
            width: 300,
            wait: true,
            waitConfig: {interval: 200}
        });
        for (var i = 1; i <= 6; i++) {
            if (Ext.get('chart_parent_container' + i) != null) {
                if (this['chart' + i] != null && this.datamap['chart_container' + i]) {
                    this.renderChart(this.datamap['chart_container' + i].functionality, 'chart_container_print' + i, 650, 1100, this.datamap['chart_container' + i].content);
                }
            }
        }
        setTimeout(function () {
            var obj = {};
            var objArr = [];
            for (var i = 1; i <= 6; i++) {
                if (Ext.get('chart_container_data' + i) != null) {
                    var img = $('#chart_container_data' + i).html();
                    var title = $("#chart_parent_container" + i).children(":first").children(":first").html();
                    if (img.length > 0) {
                        var indobj = {'img': img, 'title': title};
                        objArr.push(indobj);
                    }
                    $('#chart_container_print' + i).html("");
                    $('#chart_container_data' + i).html("");
                }
            }
            obj = [{'objArr': objArr}];
            PanDirect.run('BandwidthScope.createsummarypdf', obj, function (response) {
                Ext.MessageBox.hide();
                if (response) {
                    var url = '/php/monitor/appscope.export.php';
                    Ext.Msg.show({
                        title: _T('Report'),
                        width: 300,
                        msg: "Download Report",
                        buttons: Ext.Msg.YESNO,
                        fn: function (result) {
                            if (result === "yes") {
                                window.open(url);
                            }
                            return;
                        }
                    });
                }
            });
            Ext.MessageBox.hide();
        }, 3000);
    }, makeCalls: function (__this, nowconfig) {
        var log = PanLogging.getLogger('monitor:SummaryScope');
        var realstatus;
        var jobid = null;
        var jobidsArray = null;
        var content;
        var functionality = nowconfig[0]['functionality'];
        var divid = nowconfig[0]['divid'];
        if (functionality == 'changescope') {
            PanDirect.run('ChangeMonitorScope.startReportJob', nowconfig, function (response) {
                jobidsArray = response;
                if (jobidsArray != null) {
                    if (jobidsArray.length == 2) {
                        nowconfig[0].jobid1 = jobidsArray[0];
                        nowconfig[0].jobid2 = jobidsArray[1];
                        Pan.mainui.tasks.addDescription('reportjob', parseInt(nowconfig[0].jobid1, 10), nowconfig[0]['title']);
                        Pan.mainui.tasks.addDescription('reportjob', parseInt(nowconfig[0].jobid2, 10), nowconfig[0]['title']);
                        var pollReportFn = function (delayGradualBackOffValue) {
                            if (!delayGradualBackOffValue) {
                                delayGradualBackOffValue = 1000;
                            }
                            else if (delayGradualBackOffValue < 4000) {
                                delayGradualBackOffValue += 1000;
                            }
                            try {
                                PanDirect.run('ChangeMonitorScope.pollReport', nowconfig, function (response) {
                                    realstatus = Pan.base.json.path(response, '$.status');
                                    content = Pan.base.json.path(response, '$.content');
                                    if (realstatus == 'FIN') {
                                        var height = Ext.get(divid).dom.parentElement.offsetHeight;
                                        var width = Ext.get(divid).dom.parentElement.offsetWidth;
                                        if (content != null && content.plotdata != null && content.xaxisdata.length > 0) {
                                            var myobj = {};
                                            myobj.content = content;
                                            content = __this.convertStrArrayToFloatArray(content);
                                            myobj.functionality = functionality;
                                            __this.datamap[divid] = myobj;
                                            __this.renderChart(functionality, divid, height, width, content);
                                        }
                                        else {
                                            var chart_container_panel = Ext.getCmp(divid);
                                            chart_container_panel.getEl().update(Pan.monitor.emptyMsg);
                                            chart_container_panel.doLayout();
                                        }
                                        __this.loadMask.hide();
                                        __this.loadMask.destroy();
                                        __this.chartCounter++;
                                    }
                                    else if (realstatus == 'ACT' || realstatus == 'PEND') {
                                        pollReportFn.createCallback(delayGradualBackOffValue).defer(Pan.acc.randomDelay(delayGradualBackOffValue));
                                    }
                                    else {
                                        log.warn("Neither FIN nor ACT - skipping");
                                    }
                                });
                            }
                            catch (e) {
                                log.error(e);
                            }
                        };
                        pollReportFn();
                    }
                }
                else {
                    var msg = Pan.base.Constants.transportErrorMsg;
                    Ext.MessageBox.alert("Error", msg);
                    __this.loadMask.hide();
                    __this.loadMask.destroy();
                }
            });
        }
        else if (functionality == 'bandwidthscope') {
            PanDirect.run('BandwidthScope.startReportJob', nowconfig, function (response) {
                jobid = response;
                Pan.mainui.tasks.addDescription('reportjob', parseInt(jobid, 10), nowconfig[0]['title']);
                if (jobid != null) {
                    nowconfig[0].jobid = jobid;
                    var pollReportFn = function (delayGradualBackOffValue) {
                        try {
                            if (!delayGradualBackOffValue) {
                                delayGradualBackOffValue = 1000;
                            }
                            else if (delayGradualBackOffValue < 4000) {
                                delayGradualBackOffValue += 1000;
                            }
                            PanDirect.run('BandwidthScope.pollReport', nowconfig, function (response) {
                                realstatus = Pan.base.json.path(response, '$.status');
                                content = Pan.base.json.path(response, '$.content');
                                if (realstatus == 'FIN') {
                                    var height = Ext.get(divid).dom.parentElement.offsetHeight;
                                    var width = Ext.get(divid).dom.parentElement.offsetWidth;
                                    if (content != null && content.plotdata != null && content.xaxisdata.length > 0) {
                                        var myobj = {};
                                        myobj.content = content;
                                        content = __this.convertStrArrayToFloatArray(content);
                                        myobj.functionality = functionality;
                                        __this.datamap[divid] = myobj;
                                        __this.renderChart(functionality, divid, height, width, content);
                                    }
                                    else {
                                        var chart_container_panel = Ext.getCmp(divid);
                                        chart_container_panel.getEl().update(Pan.monitor.emptyMsg);
                                        chart_container_panel.doLayout();
                                    }
                                    __this.loadMask.hide();
                                    __this.loadMask.destroy();
                                    __this.chartCounter++;
                                }
                                else if (realstatus == 'ACT' || realstatus == 'PEND') {
                                    pollReportFn.createCallback(delayGradualBackOffValue).defer(Pan.acc.randomDelay(delayGradualBackOffValue));
                                }
                                else {
                                    log.warn("Neither FIN nor ACT - skipping");
                                }
                            });
                        }
                        catch (e) {
                            log.error(e);
                        }
                    };
                    pollReportFn();
                }
                else {
                    var msg = Pan.base.Constants.transportErrorMsg;
                    Ext.MessageBox.alert("Error", msg);
                    __this.loadMask.hide();
                    __this.loadMask.destroy();
                }
            });
        }
        else {
            log.warn('No functionality specified');
        }
    }, callChart: function (__this, __config) {
        this.loadMask = new Pan.base.widgets.LoadMask(this.getEl(), {msg: _T('Loading...')});
        this.loadMask.show();
        var nowconfig = __this.computeConfig(__config);
        __this.makeCalls(__this, nowconfig);
    }, convertStrArrayToFloatArray: function (mycats) {
        if (mycats) {
            var plotdata = mycats.plotdata;
            if (plotdata) {
                var tempItem, tempItemData;
                for (var i = 0; i < plotdata.length; i++) {
                    tempItem = plotdata[i];
                    if (tempItem) {
                        tempItemData = tempItem.data;
                        if (tempItemData) {
                            for (var j = 0; j < tempItemData.length; j++) {
                                tempItemData[j] = parseFloat(tempItemData[j]);
                            }
                        }
                    }
                }
            }
        }
        return mycats;
    }, renderChart: function (functionality, id, height, width, response) {
        var log = PanLogging.getLogger('monitor:SummaryScope');
        var myprintflag = this.isPrint;
        var mycats = response.plotdata;
        var myindex = id.substr(id.length - 1, 1);
        if (this.chartType == 'stacked_column') {
            if (functionality == 'changescope') {
                this['chart' + myindex] = new Highcharts.Chart({
                    chart: {zoomType: 'x', renderTo: id, type: 'column', height: height, width: width},
                    credits: {enabled: false},
                    title: {text: ''},
                    subtitle: {text: ''},
                    exporting: {enabled: false},
                    xAxis: {
                        categories: response.xaxisdata,
                        labels: {y: 20, align: 'right', style: {fontSize: '10px', fontFamily: 'Verdana, sans-serif'}}
                    },
                    yAxis: [{
                        title: {text: response.yaxisname1, style: {color: '#89A54E'}},
                        labels: {style: {color: '#89A54E'}}
                    }, {
                        title: {text: response.yaxisname2, style: {color: '#AA4643'}},
                        labels: {style: {color: '#AA4643'}},
                        opposite: true
                    }],
                    legend: {
                        align: 'center',
                        style: {fontSize: '10px', fontFamily: 'Verdana, sans-serif'},
                        margin: 30,
                        maxHeight: ((myprintflag == "pdf" || myprintflag == "img")) ? undefined : 45,
                        x: 0,
                        verticalAlign: 'bottom',
                        y: 0,
                        floating: false,
                        backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColorSolid) || 'white',
                        borderColor: '#CCC',
                        borderWidth: 1,
                        shadow: false
                    },
                    tooltip: {
                        formatter: function () {
                            return '<b>' + this.x + '</b><br/>' +
                                this.series.name + ': ' + this.y;
                        }
                    },
                    plotOptions: {
                        series: {
                            cursor: 'pointer', point: {
                                events: {
                                    click: function () {
                                        if (Pan.global.SDBGENERAL['cfg.vm-license-type'] !== 'vm50l') {
                                            for (var k = 0; k < mycats.length; k++) {
                                                if (mycats[k].type == this.series.type) {
                                                    self.location = mycats[k].link[this.x];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }, column: {stacking: 'normal', dataLabels: {enabled: false}}
                    },
                    series: mycats
                }, function () {
                    if (myprintflag == "pdf") {
                        setTimeout(function () {
                            var svgData = $('#' + id).children(":first").html();
                            var canvas = document.createElement("canvas");
                            canvg(canvas, svgData, {
                                renderCallback: function () {
                                    var PNGimg = canvas.toDataURL("image/png");
                                    Ext.getCmp('chart_container_data' + myindex).update(PNGimg);
                                }
                            });
                        }, 3000);
                    }
                });
            }
            else if (functionality == 'bandwidthscope') {
                this['chart' + myindex] = new Highcharts.Chart({
                    chart: {zoomType: 'x', renderTo: id, type: 'column', height: height, width: width},
                    credits: {enabled: false},
                    title: {text: ''},
                    subtitle: {text: ''},
                    exporting: {enabled: false},
                    xAxis: {
                        categories: response.xaxisdata,
                        labels: {
                            y: 20,
                            rotation: -90,
                            align: 'right',
                            style: {fontSize: '10px', fontFamily: 'Verdana, sans-serif'}
                        }
                    },
                    yAxis: {min: 0, title: {text: response.yaxisname}, stackLabels: {enabled: false}},
                    legend: {
                        align: 'center',
                        style: {fontSize: '10px', fontFamily: 'Verdana, sans-serif'},
                        margin: 30,
                        maxHeight: ((myprintflag == "pdf" || myprintflag == "img")) ? undefined : 45,
                        x: 0,
                        verticalAlign: 'bottom',
                        y: 0,
                        floating: false,
                        backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColorSolid) || 'white',
                        borderColor: '#CCC',
                        borderWidth: 1,
                        shadow: false
                    },
                    tooltip: {
                        formatter: function () {
                            var y = Pan.base.util.prettyPrintNumber(this.y, Pan.common.Constants.noOf1KBytes, 2);
                            var total = Pan.base.util.prettyPrintNumber(this.point.stackTotal, Pan.common.Constants.noOf1KBytes, 2);
                            return '<b>' + this.x + '</b><br/>' +
                                this.series.name + ': ' + y + '<br/>' + 'Total: ' + total;
                        }
                    },
                    plotOptions: {
                        series: {
                            cursor: 'pointer', point: {
                                events: {
                                    click: function () {
                                        if (Pan.global.SDBGENERAL['cfg.vm-license-type'] !== 'vm50l') {
                                            for (var k = 0; k < mycats.length; k++) {
                                                if (mycats[k].name == this.series.name) {
                                                    self.location = mycats[k].link[this.x];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }, column: {stacking: 'normal', dataLabels: {enabled: false}}
                    },
                    series: mycats
                }, function () {
                    if (myprintflag == "pdf") {
                        setTimeout(function () {
                            var svgData = $('#' + id).children(":first").html();
                            var canvas = document.createElement("canvas");
                            canvg(canvas, svgData, {
                                renderCallback: function () {
                                    var PNGimg = canvas.toDataURL("image/png");
                                    Ext.getCmp('chart_container_data' + myindex).update(PNGimg);
                                }
                            });
                        }, 3000);
                    }
                });
            }
        }
        else {
            log.warn("No proper chart type");
        }
    }, constructor: function (config) {
        Ext.applyIf(this, config);
        Pan.monitor.appscope.SummaryScope.superclass.constructor.call(this);
    }, initComponent: function () {
        this.chartCounter = 0;
        this.datamap = {};
        this.chart1 = null;
        this.chart2 = null;
        this.chart3 = null;
        this.chart4 = null;
        this.chart5 = null;
        this.chart6 = null;
        this.chartType = 'stacked_column';
        this.isPrint = "";
        var tbar = new Ext.Toolbar({cls: Pan.base.Constants.uiThemes[0]});
        if (Modernizr.canvas) {
            tbar.add('-', _T('Export') + ': ', {
                value: 'exportpdf',
                toggleGroup: 'export',
                enableToggle: false,
                pressed: false,
                scope: this,
                toggleHandler: this.onExport,
                iconCls: 'icon-downpdf',
                cls: 'x-btn-icon',
                tooltip: _T('PDF')
            });
        }
        Ext.apply(this, {
            id: 'chartParentContainer',
            itemId: 'chartParentContainer',
            defaults: {border: false},
            tbar: tbar,
            layout: {type: 'vbox', align: 'stretch', pack: 'start', padding: 10},
            listeners: {
                render: function () {
                    setTimeout(function () {
                        var scrolldiv = $('#chartParentContainer > div:eq(0) > div:eq(1) > div:eq(0)');
                        scrolldiv[0].style.overflowY = "scroll";
                    }, 3000);
                }
            },
            bodyStyle: {"background-color": "#FBFCFC"},
            items: []
        });
        Pan.monitor.appscope.SummaryScope.superclass.initComponent.call(this);
    }
});
Pan.reg("Monitor/App Scope/Summary", Pan.monitor.appscope.SummaryScope);
Ext.ns('Pan.monitor.appscope');
Pan.monitor.appscope.ChangeScope = Ext.extend(Pan.base.container.Panel, {
    onResize: function (adjWidth, adjHeight, rawWidth, rawHeight) {
        var tmpHeight = Ext.getBody().getViewSize().height - 180;
        var tmpWidth = Ext.getBody().getViewSize().width - 210;
        if (this['chart'] != null) {
            this.renderChart('chart_container', tmpHeight, tmpWidth, this.datamap['chart_container'].content);
        }
        Pan.monitor.appscope.ChangeScope.superclass.onResize.call(this, adjWidth, adjHeight, rawWidth, rawHeight);
    }, getCheckedItem: function (menu) {
        var collection = menu && menu.items && menu.items.items;
        if (collection) {
            for (var i = 0; i < collection.length; i++) {
                if (collection[i].checked) {
                    return collection[i];
                }
            }
        }
        return null;
    }, onDestroy: function () {
        if (this.chart != null) {
            this.chart.destroy();
        }
    }, onCriteriaToggle: function (obj, checked) {
        if (!checked) {
            return;
        }
        if (obj.parentMenu && obj.parentMenu.parentButton) {
            obj.parentMenu.parentButton.setText(obj.text);
        }
        var config = {};
        config[obj['group'] || obj['toggleGroup']] = obj['value'];
        var disable = obj['value'] != 'app';
        if (disable) {
            this.appCategoryBtn.disable();
        }
        else {
            this.appCategoryBtn.enable();
        }
        this.callChart(this, config);
    }, onItemToggle: function (obj, checked) {
        if (!checked) {
            return;
        }
        if (obj.parentMenu && obj.parentMenu.parentButton) {
            obj.parentMenu.parentButton.setText(obj.text);
        }
        var config = {};
        config[obj['group'] || obj['toggleGroup']] = obj['value'];
        this.callChart(this, config);
    }, onExport: function (obj, checked) {
        if (!checked) {
            return;
        }
        switch (obj.value) {
            case'exportimage':
                this.isPrint = "img";
                this.generateimage();
                this.isPrint = "";
                break;
            case'exportpdf':
                this.isPrint = "pdf";
                this.generatepdf();
                this.isPrint = "";
                break;
            default:
        }
        obj.toggle(false);
    }, computeConfig: function (__config) {
        __config = __config || {};
        __config['vsys'] = Pan.monitor.vsysScope();
        if (Pan.global.isCms() && Ext.getCmp('appscope-data-source').value === "panorama") {
            __config['appscope-data-source'] = 'panorama';
        }
        else {
            __config['appscope-data-source'] = '';
        }
        Ext.apply(this.currentconfig, __config);
        var configArr = [];
        configArr[0] = this.currentconfig;
        return configArr;
    }, onChartCheck: function (item, checked) {
        if (!checked) {
            return;
        }
        var chartType = item['value'];
        this.chartType = chartType;
        this.callChart(this, {});
    }, intervalChangeHandler: function (obj, checked) {
        if (!checked) {
            return;
        }
        if (obj.parentMenu && obj.parentMenu.parentButton) {
            obj.parentMenu.parentButton.setText(obj.text);
        }
        var interval = obj.parentMenu == this.intervalMenu ? obj : this.getCheckedItem(this.intervalMenu);
        var period = obj.parentMenu == this.periodMenu ? obj : this.getCheckedItem(this.periodMenu);
        var from_end_time;
        switch (interval.selectedIndex) {
            case 1:
                from_end_time = 7 * 24 * 60 * 60;
                break;
            case 2:
                from_end_time = 4 * 7 * 24 * 60 * 60;
                break;
            default:
                from_end_time = 24 * 60 * 60;
                break;
        }
        var config = {'period': period['value'], 'from-end-time': from_end_time};
        this.callChart(this, config);
    }, buildExportForm: function () {
        if (!document.getElementById("appscope.export.form")) {
            var html = ['<form id="appscope.export.form" method="post" target="_blank" action="/php/monitor/appscope.export.php">', '</form>'].join('');
            var el = new Ext.Element(document.createElement('div'));
            el.dom.innerHTML = html;
            el.appendTo(document.body);
        }
        return document.getElementById("appscope.export.form");
    }, generateimage: function () {
        if (this.datamap['chart_container']) {
            this.renderChart('chart_container_print', 670, 1100, this.datamap['chart_container'].content);
        }
        else {
            Ext.MessageBox.alert('Status', 'Nothing to export');
        }
    }, generatepdf: function () {
        if (this.datamap['chart_container']) {
            this.renderChart('chart_container_print', 670, 1100, this.datamap['chart_container'].content);
        }
        else {
            Ext.MessageBox.alert('Status', 'Nothing to export');
        }
    }, makeCalls: function (__this, nowconfig) {
        var log = PanLogging.getLogger('monitor:ChangeScope');
        var realstatus;
        var jobidsArray = null;
        var content;
        PanDirect.run('ChangeMonitorScope.startReportJob', nowconfig, function (response) {
            jobidsArray = response;
            if (jobidsArray != null) {
                if (jobidsArray.length == 2) {
                    nowconfig[0].jobid1 = jobidsArray[0];
                    nowconfig[0].jobid2 = jobidsArray[1];
                    Pan.mainui.tasks.addDescription('reportjob', parseInt(nowconfig[0].jobid1, 10), _T('Change monitor report'));
                    Pan.mainui.tasks.addDescription('reportjob', parseInt(nowconfig[0].jobid2, 10), _T('Change monitor report'));
                    var pollReportFn = function (delayGradualBackOffValue) {
                        if (!delayGradualBackOffValue) {
                            delayGradualBackOffValue = 1000;
                        }
                        else if (delayGradualBackOffValue < 4000) {
                            delayGradualBackOffValue += 1000;
                        }
                        try {
                            PanDirect.run('ChangeMonitorScope.pollReport', nowconfig, function (response) {
                                realstatus = Pan.base.json.path(response, '$.status');
                                content = Pan.base.json.path(response, '$.content');
                                if (realstatus == 'FIN') {
                                    var height = Ext.get('chart_container').dom.parentElement.offsetHeight;
                                    var width = Ext.get('chart_container').dom.parentElement.offsetWidth;
                                    if (content != null && content.plotdata != null && content.xaxisdata.length > 0) {
                                        var myobj = {};
                                        myobj.content = content;
                                        content = __this.convertStrArrayToFloatArray(content);
                                        __this.datamap['chart_container'] = myobj;
                                        __this.renderChart('chart_container', height, width, content);
                                    }
                                    else {
                                        var chart_container_panel = Ext.getCmp('chart_container');
                                        chart_container_panel.getEl().update(Pan.monitor.emptyMsg);
                                        chart_container_panel.doLayout();
                                    }
                                    __this.loadMask.hide();
                                    __this.loadMask.destroy();
                                }
                                else if (realstatus == 'ACT' || realstatus == 'PEND') {
                                    pollReportFn.createCallback(delayGradualBackOffValue).defer(Pan.acc.randomDelay(delayGradualBackOffValue));
                                }
                                else {
                                    log.warn("Neither FIN nor ACT - skipping");
                                }
                            });
                        }
                        catch (e) {
                            log.error(e);
                        }
                    };
                    pollReportFn();
                }
            }
            else {
                var msg = Pan.base.Constants.transportErrorMsg;
                Ext.MessageBox.alert("Error", msg);
                __this.loadMask.hide();
                __this.loadMask.destroy();
            }
        });
    }, callChart: function (__this, __config) {
        this.loadMask = new Pan.base.widgets.LoadMask(this.getEl(), {msg: _T('Loading...')});
        this.loadMask.show();
        var nowconfig = __this.computeConfig(__config);
        __this.makeCalls(__this, nowconfig);
    }, convertStrArrayToFloatArray: function (mycats) {
        if (mycats) {
            var plotdata = mycats.plotdata;
            if (plotdata) {
                var tempItem, tempItemData;
                for (var i = 0; i < plotdata.length; i++) {
                    tempItem = plotdata[i];
                    if (tempItem) {
                        tempItemData = tempItem.data;
                        if (tempItemData) {
                            for (var j = 0; j < tempItemData.length; j++) {
                                tempItemData[j] = parseFloat(tempItemData[j]);
                            }
                        }
                    }
                }
            }
        }
        return mycats;
    }, renderChart: function (id, height, width, response) {
        var log = PanLogging.getLogger('monitor:ChangeScope');
        var selfone = this;
        var myprintflag = this.isPrint;
        if (myprintflag == "pdf" || myprintflag == "img") {
            Ext.MessageBox.show({
                msg: 'Exporting, please wait...',
                progressText: 'Exporting, please wait...',
                width: 300,
                wait: true,
                waitConfig: {interval: 200}
            });
            id = 'chart_container_print';
        }
        var mycats = response.plotdata;
        if (this.chartType == 'stacked_column') {
            this.chart = new Highcharts.Chart({
                chart: {zoomType: 'x', renderTo: id, height: height, width: width},
                credits: {enabled: false},
                title: {text: ''},
                subtitle: {text: ''},
                exporting: {enabled: false},
                xAxis: {categories: response.xaxisdata},
                yAxis: [{
                    title: {text: response.yaxisname1, style: {color: '#72A392'}},
                    labels: {style: {color: '#72A392'}}
                }, {
                    title: {text: response.yaxisname2, style: {color: '#CD383F'}},
                    labels: {style: {color: '#CD383F'}},
                    opposite: true
                }],
                legend: {
                    align: 'center',
                    width: 600,
                    maxHeight: ((myprintflag == "pdf" || myprintflag == "img")) ? undefined : 100,
                    x: 0,
                    verticalAlign: 'bottom',
                    y: 0,
                    floating: false,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColorSolid) || 'white',
                    borderColor: '#CCC',
                    borderWidth: 1,
                    shadow: false
                },
                tooltip: {
                    formatter: function () {
                        return '<b>' + this.x + '</b><br/>' +
                            this.series.name + ': ' + this.y;
                    }
                },
                plotOptions: {
                    series: {
                        cursor: 'pointer', point: {
                            events: {
                                click: function () {
                                    if (Pan.global.SDBGENERAL['cfg.vm-license-type'] !== 'vm50l') {
                                        for (var k = 0; k < mycats.length; k++) {
                                            if (mycats[k].type == this.series.type) {
                                                self.location = mycats[k].link[this.x];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }, column: {stacking: 'normal', dataLabels: {enabled: false}}
                },
                series: mycats
            }, function () {
                if (myprintflag == "pdf") {
                    setTimeout(function () {
                        var svgData = $("#chart_container_print").children(":first").html();
                        svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                        var canvas = document.createElement("canvas");
                        canvg(canvas, svgData, {
                            renderCallback: function () {
                                var img = canvas.toDataURL("image/png");
                                PanDirect.run('ChangeMonitorScope.createpdf', [{
                                    'img': img,
                                    'filters': selfone.currentconfig
                                }], function (response) {
                                    if (response) {
                                        var url = '/php/monitor/appscope.export.php';
                                        Ext.Msg.show({
                                            title: _T('Report'),
                                            width: 300,
                                            msg: "Download Report",
                                            buttons: Ext.Msg.YESNO,
                                            fn: function (result) {
                                                if (result === "yes") {
                                                    window.open(url);
                                                }
                                                return;
                                            }
                                        });
                                    }
                                });
                                Ext.MessageBox.hide();
                                $("#chart_container_print").children(":first").html('');
                            }
                        });
                    }, 3000);
                }
                else if (myprintflag == "img") {
                    setTimeout(function () {
                        var svgData = $("#chart_container_print").children(":first").html();
                        svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                        var canvas = document.createElement("canvas");
                        canvg(canvas, svgData, {
                            renderCallback: function () {
                                Ext.MessageBox.hide();
                                var win = window.open();
                                win.document.write('<img src="' + canvas.toDataURL("image/png") + '"/>');
                                $("#chart_container_print").children(":first").html('');
                            }
                        });
                    }, 3000);
                }
            });
        }
        else {
            log.warn("No proper chart type");
        }
    }, constructor: function (config) {
        this.filterButtons = [];
        Ext.applyIf(this, config);
        Pan.monitor.appscope.ChangeScope.superclass.constructor.call(this);
    }, initComponent: function () {
        this.currentconfig = {
            'page': 'changescope_monitor',
            'appscope-data-source': '',
            'clear_report': 'yes',
            'debug': '',
            'period': 'last-hour',
            'topn': '10',
            'aggregate-by': 'app',
            'sortby': 'percentage',
            'sort': 'gainer',
            'yaxis': 'sessions',
            'from-end-time': 24 * 60 * 60,
            'chart_type': 'stacked_column'
        };
        this.datamap = {};
        this.chart = null;
        this.chartType = 'stacked_column';
        this.isPrint = "";
        var i, n;
        var topnitems = [10, 25, 50, 75, 100];
        for (i = 0; i < topnitems.length; i++) {
            n = topnitems[i];
            topnitems[i] = new Ext.menu.CheckItem({
                value: n,
                text: _T('Top {Nth}', {Nth: n}),
                checked: i == 0,
                group: 'topn',
                scope: this,
                checkHandler: this.onItemToggle
            });
        }
        var topnMenu = new Ext.menu.Menu({id: 'topnMenu', items: topnitems});
        var criteriaMenu = new Ext.menu.Menu({
            id: 'criteriaMenu',
            items: [new Ext.menu.CheckItem({
                value: 'app',
                text: _T('Application'),
                checked: true,
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'category-of-name',
                text: _T('Application Category'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'src',
                text: _T('Source Address'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'srcuser',
                text: _T('Source User'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'dst',
                text: _T('Destination Address'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'dstuser',
                text: _T('Destination User'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            })]
        });
        var appCategoryMenu = new Ext.menu.Menu({
            id: 'appCategoryMenu',
            items: [new Ext.menu.CheckItem({
                value: '',
                text: _T('None'),
                group: 'category-of-name',
                checked: true,
                scope: this,
                checkHandler: this.onItemToggle
            }), new Ext.menu.CheckItem({
                value: 'business-systems',
                text: _T('Business Systems'),
                group: 'category-of-name',
                scope: this,
                checkHandler: this.onItemToggle
            }), new Ext.menu.CheckItem({
                value: 'collaboration',
                text: _T('Collaboration'),
                group: 'category-of-name',
                scope: this,
                checkHandler: this.onItemToggle
            }), new Ext.menu.CheckItem({
                value: 'general-internet',
                text: _T('General Internet'),
                group: 'category-of-name',
                scope: this,
                checkHandler: this.onItemToggle
            }), new Ext.menu.CheckItem({
                value: 'media',
                text: _T('Media'),
                group: 'category-of-name',
                scope: this,
                checkHandler: this.onItemToggle
            }), new Ext.menu.CheckItem({
                value: 'networking',
                text: _T('Networking'),
                group: 'category-of-name',
                scope: this,
                checkHandler: this.onItemToggle
            }), new Ext.menu.CheckItem({
                value: 'unknown',
                text: _T('Unknown'),
                group: 'category-of-name',
                scope: this,
                checkHandler: this.onItemToggle
            })]
        });
        this.intervalMenu = new Ext.menu.Menu({
            id: 'intervalMenu',
            items: [new Ext.menu.CheckItem({
                selectedIndex: 0,
                text: _T('24 hours'),
                checked: true,
                group: 'interval',
                scope: this,
                checkHandler: this.intervalChangeHandler
            }), new Ext.menu.CheckItem({
                selectedIndex: 1,
                text: _T('7 days'),
                group: 'interval',
                scope: this,
                checkHandler: this.intervalChangeHandler
            }), new Ext.menu.CheckItem({
                selectedIndex: 2,
                text: _T('4 weeks'),
                group: 'interval',
                scope: this,
                checkHandler: this.intervalChangeHandler
            })]
        });
        this.periodMenu = new Ext.menu.Menu({
            id: 'periodMenu',
            items: [new Ext.menu.CheckItem({
                selectedIndex: 0,
                value: 'last-15-minutes',
                text: _T('last 15 minutes'),
                group: 'period',
                scope: this,
                checkHandler: this.intervalChangeHandler
            }), new Ext.menu.CheckItem({
                selectedIndex: 1,
                value: 'last-hour',
                text: _T('last hour'),
                checked: true,
                group: 'period',
                scope: this,
                checkHandler: this.intervalChangeHandler
            }), new Ext.menu.CheckItem({
                selectedIndex: 2,
                value: 'last-12-hrs',
                text: _T('last 12 hours'),
                group: 'period',
                scope: this,
                checkHandler: this.intervalChangeHandler
            }), new Ext.menu.CheckItem({
                selectedIndex: 3,
                value: 'last-24-hrs',
                text: _T('last 24 hours'),
                group: 'period',
                scope: this,
                checkHandler: this.intervalChangeHandler
            })]
        });
        var periodBtn = new Ext.Toolbar.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'icon-s',
            text: _T('last hour'),
            menu: this.periodMenu
        });
        this.periodMenu.parentButton = periodBtn;
        var intervalBtn = new Ext.Toolbar.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'icon-s',
            text: _T('24 hours'),
            menu: this.intervalMenu
        });
        this.intervalMenu.parentButton = intervalBtn;
        this.appCategoryBtn = new Ext.Toolbar.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'icon-dlp-data-filter',
            text: _T('None'),
            menu: appCategoryMenu
        });
        appCategoryMenu.parentButton = this.appCategoryBtn;
        var topnBtn = new Ext.Toolbar.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'icon-shape-align-bottom',
            text: _T('Top 10'),
            menu: topnMenu
        });
        topnMenu.parentButton = topnBtn;
        var criteriaBtn = new Ext.Toolbar.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'icon-page-white-wrench',
            text: _T('Application'),
            menu: criteriaMenu
        });
        criteriaMenu.parentButton = criteriaBtn;
        var bbar = new Ext.Toolbar({cls: Pan.base.Constants.uiThemes[0]});
        bbar.add(_T('Compare') + ' ', periodBtn, _T('to the same period ending'), intervalBtn, " " + _T("ago"));
        var tbar = new Ext.Toolbar({cls: Pan.base.Constants.uiThemes[0]});
        tbar.add(topnBtn, criteriaBtn, '-', {
            cls: 'x-btn-text-icon',
            iconCls: 'icon-gainer',
            text: _T('Gainers'),
            value: 'gainer',
            toggleGroup: 'sort',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            pressed: true,
            tooltip: _T('Show biggest gainers')
        }, {
            cls: 'x-btn-text-icon',
            iconCls: 'icon-losers',
            text: _T('Losers'),
            value: 'loser',
            toggleGroup: 'sort',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            pressed: false,
            tooltip: _T('Show biggest losers')
        }, {
            cls: 'x-btn-text-icon',
            iconCls: 'icon-new-apps',
            text: _T('New'),
            value: 'new',
            toggleGroup: 'sort',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            tooltip: _T('Show new members')
        }, {
            cls: 'x-btn-text-icon',
            iconCls: 'icon-dropout',
            text: _T('Dropped'),
            value: 'dropped',
            toggleGroup: 'sort',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            pressed: false,
            tooltip: _T('Show dropped members')
        }, '-', _T('Filter') + ' ', this.appCategoryBtn, '-', {
            value: 'sessions',
            toggleGroup: 'yaxis',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            pressed: true,
            cls: 'x-btn-icon',
            iconCls: 'icon-sessions',
            tooltip: _T('Count sessions')
        }, {
            value: 'bytes',
            toggleGroup: 'yaxis',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            cls: 'x-btn-icon',
            iconCls: 'icon-bytes',
            tooltip: _T('Count bytes')
        }, '-', _T('Sort') + ': ', {
            value: "percentage",
            toggleGroup: 'sortby',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            pressed: true,
            iconCls: 'icon-percentage',
            cls: 'x-btn-icon',
            tooltip: _T('Sort by percentage growth')
        }, {
            value: "raw",
            toggleGroup: 'sortby',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            iconCls: 'icon-number',
            cls: 'x-btn-icon',
            tooltip: _T('Sort by raw growth')
        });
        if (Modernizr.canvas) {
            tbar.add('-', _T('Export') + ': ', {
                value: 'exportimage',
                toggleGroup: 'export',
                enableToggle: false,
                pressed: false,
                scope: this,
                toggleHandler: this.onExport,
                iconCls: 'icon-downimg',
                cls: 'x-btn-icon',
                tooltip: _T('PNG')
            }, {
                value: 'exportpdf',
                toggleGroup: 'export',
                enableToggle: false,
                pressed: false,
                scope: this,
                toggleHandler: this.onExport,
                iconCls: 'icon-downpdf',
                cls: 'x-btn-icon',
                tooltip: _T('PDF')
            });
        }
        if (window['debug_xml']) {
            tbar.add({
                text: _T('show xml'), handler: function () {
                    this.chart.openDebugWindow({debug: "yes"});
                }
            });
        }
        this.chartContainer = new Ext.Container();
        var self = this;
        Ext.apply(this, {
            layout: 'fit',
            defaults: {border: false},
            bbar: bbar,
            tbar: tbar,
            id: 'chart_container_parent',
            itemId: 'chart_container_parent',
            bodyStyle: {"background-color": "#FBFCFC"},
            items: [{
                xtype: 'panel',
                id: 'chart_container',
                itemId: 'chart_container',
                title: '',
                listeners: {
                    afterRender: function () {
                        self.callChart(self, null);
                    }
                }
            }, {xtype: 'panel', id: 'chart_container_print', itemId: 'chart_container_print', title: ''}]
        });
        Pan.monitor.appscope.ChangeScope.superclass.initComponent.call(this);
    }
});
Pan.reg("Monitor/App Scope/Change Monitor", Pan.monitor.appscope.ChangeScope);
Ext.ns('Pan.monitor.appscope');
Pan.monitor.appscope.ThreatScope = Ext.extend(Pan.base.container.Panel, {
    resolveThreatNamesInProgress: false, onResize: function (adjWidth, adjHeight, rawWidth, rawHeight) {
        var tmpHeight = Ext.getBody().getViewSize().height - 180;
        var tmpWidth = Ext.getBody().getViewSize().width - 210;
        if (this['chart'] != null) {
            this.renderChart('chart_container', tmpHeight, tmpWidth, this.datamap['chart_container'].content);
        }
        Pan.monitor.appscope.ThreatScope.superclass.onResize.call(this, adjWidth, adjHeight, rawWidth, rawHeight);
    }, onDestroy: function () {
        if (this.chart != null) {
            this.chart.destroy();
        }
    }, disableFilter: function (disable) {
        for (var i = 0; i < this.filterButtons.length; i++) {
            if (disable) {
                this.filterButtons[i].disable();
            }
            else {
                this.filterButtons[i].enable();
            }
        }
    }, onCriteriaToggle: function (obj, checked) {
        if (!checked) {
            return;
        }
        if (obj.parentMenu && obj.parentMenu.parentButton) {
            obj.parentMenu.parentButton.setText(obj.text);
        }
        var config = {};
        config[obj['group'] || obj['toggleGroup']] = obj['value'];
        var disable = obj['value'] == 'subtype';
        this.disableFilter.createDelegate(this, [disable]).defer(50);
        this.callChart(this, config);
    }, onItemToggle: function (obj, checked) {
        if (!checked) {
            return;
        }
        if (obj.parentMenu && obj.parentMenu.parentButton) {
            obj.parentMenu.parentButton.setText(obj.text);
        }
        var config = {};
        config[obj['group'] || obj['toggleGroup']] = obj['value'];
        this.callChart(this, config);
    }, onExport: function (obj, checked) {
        if (!checked) {
            return;
        }
        switch (obj.value) {
            case'exportimage':
                this.isPrint = "img";
                this.generateimage();
                this.isPrint = "";
                break;
            case'exportpdf':
                this.isPrint = "pdf";
                this.generatepdf();
                this.isPrint = "";
                break;
            default:
        }
        obj.toggle(false);
    }, computeConfig: function (__config) {
        __config = __config || {};
        __config['vsys'] = Pan.monitor.vsysScope();
        if (Pan.global.isCms() && Ext.getCmp('appscope-data-source').value === "panorama") {
            __config['appscope-data-source'] = 'panorama';
        }
        else {
            __config['appscope-data-source'] = '';
        }
        Ext.apply(this.currentconfig, __config);
        var configArr = [];
        configArr[0] = this.currentconfig;
        return configArr;
    }, onChartCheck: function (item, checked) {
        if (!checked) {
            return;
        }
        var chartType = item['value'];
        this.chartType = chartType;
        this.callChart(this, {});
    }, buildExportForm: function () {
        if (!document.getElementById("appscope.export.form")) {
            var html = ['<form id="appscope.export.form" method="post" target="_blank" action="/php/monitor/appscope.export.php">', '</form>'].join('');
            var el = new Ext.Element(document.createElement('div'));
            el.dom.innerHTML = html;
            el.appendTo(document.body);
        }
        return document.getElementById("appscope.export.form");
    }, generateimage: function () {
        if (this.datamap['chart_container']) {
            this.renderChart('chart_container_print', 670, 1100, this.datamap['chart_container'].content);
        }
        else {
            Ext.MessageBox.alert('Status', 'Nothing to export');
        }
    }, generatepdf: function () {
        if (this.datamap['chart_container']) {
            this.renderChart('chart_container_print', 670, 1100, this.datamap['chart_container'].content);
        }
        else {
            Ext.MessageBox.alert('Status', 'Nothing to export');
        }
    }, callChart: function (__this, __config) {
        this.loadMask = new Pan.base.widgets.LoadMask(this.getEl(), {msg: _T('Loading...')});
        this.loadMask.show();
        var jobid = null;
        var nowconfig = __this.computeConfig(__config);
        var realstatus;
        var content;
        PanDirect.run('BandwidthScope.startReportJob', nowconfig, function (response) {
            var log = PanLogging.getLogger('monitor:ThreatScope');
            jobid = response;
            Pan.mainui.tasks.addDescription('reportjob', parseInt(jobid, 10), _T('Threat monitor report'));
            if (jobid != null) {
                nowconfig[0].jobid = jobid;
                var pollReportFn = function (delayGradualBackOffValue) {
                    if (!delayGradualBackOffValue) {
                        delayGradualBackOffValue = 1000;
                    }
                    else if (delayGradualBackOffValue < 4000) {
                        delayGradualBackOffValue += 1000;
                    }
                    try {
                        PanDirect.run('BandwidthScope.pollReport', nowconfig, function (response) {
                            realstatus = Pan.base.json.path(response, '$.status');
                            content = Pan.base.json.path(response, '$.content');
                            if (realstatus == 'FIN') {
                                var height = Ext.get('chart_container').dom.parentElement.offsetHeight;
                                var width = Ext.get('chart_container').dom.parentElement.offsetWidth;
                                if (content != null && content.plotdata != null && content.xaxisdata.length > 0) {
                                    var myobj = {};
                                    myobj.content = content;
                                    __this.convertStrArrayToFloatArray(content);
                                    __this.datamap['chart_container'] = myobj;
                                    __this.renderChart('chart_container', height, width, content);
                                }
                                else {
                                    var chart_container_panel = Ext.getCmp('chart_container');
                                    chart_container_panel.getEl().update(Pan.monitor.emptyMsg);
                                    chart_container_panel.doLayout();
                                }
                                __this.loadMask.hide();
                                __this.loadMask.destroy();
                            }
                            else if (realstatus == 'ACT' || realstatus == 'PEND') {
                                pollReportFn.createCallback(delayGradualBackOffValue).defer(Pan.acc.randomDelay(delayGradualBackOffValue));
                            }
                            else {
                                log.warn("Neither FIN nor ACT - skipping");
                            }
                        });
                    } catch (e) {
                        log.error(e);
                    }
                };
                pollReportFn();
            }
            else {
                var msg = Pan.base.Constants.transportErrorMsg;
                Ext.MessageBox.alert("Error", msg);
                __this.loadMask.hide();
                __this.loadMask.destroy();
            }
        });
    }, convertStrArrayToFloatArray: function (mycats) {
        if (mycats) {
            var plotdata = mycats.plotdata;
            if (plotdata) {
                var tempItem, tempItemData;
                for (var i = 0; i < plotdata.length; i++) {
                    tempItem = plotdata[i];
                    if (tempItem) {
                        tempItemData = tempItem.data;
                        if (tempItemData) {
                            for (var j = 0; j < tempItemData.length; j++) {
                                tempItemData[j] = parseFloat(tempItemData[j]);
                            }
                        }
                    }
                }
            }
        }
        return mycats;
    }, renderChart: function (id, height, width, response) {
        var log = PanLogging.getLogger('monitor:ThreatScope');
        var selfone = this;
        var myprintflag = this.isPrint;
        if (myprintflag == "pdf" || myprintflag == "img") {
            Ext.MessageBox.show({
                msg: 'Exporting, please wait...',
                progressText: 'Exporting, please wait...',
                width: 300,
                wait: true,
                waitConfig: {interval: 200}
            });
            id = 'chart_container_print';
        }
        var mycats = response.plotdata;
        var toBeResolved = "", tempName;
        for (var k = 0; k < mycats.length; k++) {
            tempName = mycats[k]["name"];
            if (tempName && !isNaN(tempName) && !Pan.acc.threatNameResolve.id2threatNameLogViewer[tempName] && !Pan.acc.threatNameResolve.id2threatNameAppScope[tempName]) {
                toBeResolved += (Ext.isEmpty(toBeResolved) ? "" : ",") + mycats[k]["name"];
            }
            else if (!isNaN(tempName)) {
                mycats[k]["name"] = Pan.acc.threatNameResolve.id2threatNameLogViewer[tempName] || Pan.acc.threatNameResolve.id2threatNameAppScope[tempName];
            }
        }
        if (!Ext.isEmpty(toBeResolved) && toBeResolved !== ",") {
            if (toBeResolved[toBeResolved.length - 1] === ",") {
                toBeResolved = toBeResolved.substring(0, toBeResolved.length - 1);
            }
            Pan.monitor.appscope.ThreatScope.resolveThreatNamesInProgress = true;
            PanDirect.run('PanDirect.resolveTidToThreatName', [toBeResolved], function (result) {
                Pan.monitor.appscope.ThreatScope.resolveThreatNamesInProgress = false;
                if (result["result"] && Ext.isArray(result["result"]["entry"])) {
                    var entries = result["result"]["entry"];
                    for (var i = 0; i < entries.length; i++) {
                        if (entries[i]["@name"] !== "Unknown") {
                            Pan.acc.threatNameResolve.id2threatNameAppScope[entries[i]["@id"]] = entries[i]["@name"];
                        }
                        else {
                            Pan.acc.threatNameResolve.id2threatNameAppScope[entries[i]["@id"]] = entries[i]["@id"];
                        }
                    }
                }
                selfone.renderChart(id, height, width, response);
            });
        }
        var itemname = null;
        if (this.chartType == 'stacked_column') {
            this.chart = new Highcharts.Chart({
                chart: {zoomType: 'xy', renderTo: id, type: 'column', height: height, width: width},
                credits: {enabled: false},
                title: {text: ''},
                subtitle: {text: ''},
                exporting: {enabled: false},
                xAxis: {categories: response.xaxisdata},
                yAxis: {min: 0, title: {text: response.yaxisname}, stackLabels: {enabled: false}},
                legend: {
                    align: 'center',
                    width: 600,
                    maxHeight: ((myprintflag == "pdf" || myprintflag == "img")) ? undefined : 100,
                    x: 0,
                    verticalAlign: 'bottom',
                    y: 0,
                    floating: false,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColorSolid) || 'white',
                    borderColor: '#CCC',
                    borderWidth: 1,
                    shadow: false
                },
                tooltip: {
                    formatter: function () {
                        return '<b>' + this.x + '</b><br/>' +
                            this.series.name + ': ' + this.y + '<br/>' + 'Total: ' + this.point.stackTotal;
                    }
                },
                plotOptions: {
                    series: {
                        cursor: 'pointer', point: {
                            events: {
                                click: function () {
                                    if (Pan.global.SDBGENERAL['cfg.vm-license-type'] !== 'vm50l') {
                                        for (var k = 0; k < mycats.length; k++) {
                                            if (mycats[k].name == this.series.name) {
                                                self.location = mycats[k].link[this.x];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }, column: {stacking: 'normal', dataLabels: {enabled: false}}
                },
                series: mycats
            }, function (chart) {
                if (myprintflag == "pdf") {
                    setTimeout(function () {
                        var svgData = $("#chart_container_print").children(":first").html();
                        svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                        var canvas = document.createElement("canvas");
                        canvg(canvas, svgData, {
                            renderCallback: function () {
                                var img = canvas.toDataURL("image/png");
                                PanDirect.run('BandwidthScope.createpdf', [{
                                    'img': img,
                                    'type': 'threatScope',
                                    'filters': selfone.currentconfig
                                }], function (response) {
                                    if (response) {
                                        var url = '/php/monitor/appscope.export.php';
                                        Ext.Msg.show({
                                            title: _T('Report'),
                                            width: 300,
                                            msg: "Download Report",
                                            buttons: Ext.Msg.YESNO,
                                            fn: function (result) {
                                                if (result === "yes") {
                                                    window.open(url);
                                                }
                                                return;
                                            }
                                        });
                                    }
                                });
                                Ext.MessageBox.hide();
                                $("#chart_container_print").children(":first").html('');
                            }
                        });
                    }, 3000);
                }
                else if (myprintflag == "img") {
                    setTimeout(function () {
                        var svgData = $("#chart_container_print").children(":first").html();
                        svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                        var canvas = document.createElement("canvas");
                        canvg(canvas, svgData, {
                            renderCallback: function () {
                                Ext.MessageBox.hide();
                                var win = window.open();
                                win.document.write('<img src="' + canvas.toDataURL("image/png") + '"/>');
                                $("#chart_container_print").children(":first").html('');
                            }
                        });
                    }, 3000);
                }
            });
        }
        else if (this.chartType == 'stacked_area') {
            this.chart = new Highcharts.Chart({
                chart: {zoomType: 'xy', renderTo: id, type: 'area', height: height, width: width},
                credits: {enabled: false},
                title: {text: ''},
                subtitle: {text: ''},
                exporting: {enabled: false},
                xAxis: {categories: response.xaxisdata, tickmarkPlacement: 'on', title: {enabled: false}},
                yAxis: {min: 0, title: {text: response.yaxisname}, stackLabels: {enabled: false}},
                legend: {
                    align: 'center',
                    width: 600,
                    maxHeight: ((myprintflag == "pdf" || myprintflag == "img")) ? undefined : 100,
                    x: 0,
                    verticalAlign: 'bottom',
                    y: 0,
                    floating: false,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColorSolid) || 'white',
                    borderColor: '#CCC',
                    borderWidth: 1,
                    shadow: false
                },
                tooltip: {
                    formatter: function () {
                        return '<b>' + this.x + '</b><br/>' +
                            this.series.name + ': ' + this.y + '<br/>' + 'Total: ' + this.point.stackTotal;
                    }
                },
                plotOptions: {
                    series: {
                        cursor: 'pointer',
                        stacking: 'normal',
                        lineColor: '#666666',
                        lineWidth: 1,
                        marker: {lineWidth: 1, lineColor: '#666666'},
                        point: {
                            events: {
                                click: function () {
                                    if (Pan.global.SDBGENERAL['cfg.vm-license-type'] !== 'vm50l') {
                                        for (var k = 0; k < mycats.length; k++) {
                                            if (mycats[k].name == this.series.name) {
                                                self.location = mycats[k].link[this.x];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                series: mycats
            }, function (chart) {
                if (myprintflag == "pdf") {
                    setTimeout(function () {
                        log.info('in callback of chart loaded');
                        var svgData = $("#chart_container_print").children(":first").html();
                        svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                        var canvas = document.createElement("canvas");
                        canvg(canvas, svgData, {
                            renderCallback: function () {
                                var img = canvas.toDataURL("image/png");
                                PanDirect.run('BandwidthScope.createpdf', [{
                                    'img': img,
                                    'type': 'threatScope',
                                    'filters': selfone.currentconfig
                                }], function (response) {
                                    if (response) {
                                        var url = '/php/monitor/appscope.export.php';
                                        Ext.Msg.show({
                                            title: _T('Report'),
                                            width: 300,
                                            msg: "Download Report",
                                            buttons: Ext.Msg.YESNO,
                                            fn: function (result) {
                                                if (result === "yes") {
                                                    window.open(url);
                                                }
                                                return;
                                            }
                                        });
                                    }
                                });
                                Ext.MessageBox.hide();
                                $("#chart_container_print").children(":first").html('');
                            }
                        });
                    }, 3000);
                }
                else if (myprintflag == "img") {
                    setTimeout(function () {
                        log.info('in callback of chart loaded');
                        var svgData = $("#chart_container_print").children(":first").html();
                        svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                        var canvas = document.createElement("canvas");
                        canvg(canvas, svgData, {
                            renderCallback: function () {
                                Ext.MessageBox.hide();
                                var win = window.open();
                                win.document.write('<img src="' + canvas.toDataURL("image/png") + '"/>');
                                $("#chart_container_print").children(":first").html('');
                            }
                        });
                    }, 3000);
                }
            });
        }
        else {
            log.warn("No proper chart type");
        }
    }, constructor: function (config) {
        this.filterButtons = [];
        Ext.applyIf(this, config);
        Pan.monitor.appscope.ThreatScope.superclass.constructor.call(this);
    }, initComponent: function () {
        this.currentconfig = {
            'page': 'threat_monitor',
            'appscope-data-source': '',
            'clear_report': 'yes',
            'debug': '',
            'period': 'last-6-hrs',
            'topn': '10',
            'aggregate-by': 'threatid',
            'sortby': 'sessions',
            'chart_type': 'stacked_column'
        };
        this.datamap = {};
        this.chart = null;
        this.chartType = 'stacked_column';
        this.isPrint = "";
        var i, n;
        var topnitems = [10, 25];
        for (i = 0; i < topnitems.length; i++) {
            n = topnitems[i];
            topnitems[i] = new Ext.menu.CheckItem({
                value: n,
                text: _T('Top {Nth}', {Nth: n}),
                checked: i == 0,
                group: 'topn',
                scope: this,
                checkHandler: this.onItemToggle
            });
        }
        var topnMenu = new Ext.menu.Menu({id: 'topnMenu', items: topnitems});
        var criteriaMenu = new Ext.menu.Menu({
            id: 'criteriaMenu',
            items: [new Ext.menu.CheckItem({
                value: 'threatid',
                text: _T('Threat'),
                checked: true,
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'subtype',
                text: _T('Threat Category'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'src',
                text: _T('Source Address'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'srcuser',
                text: _T('Source User'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'dst',
                text: _T('Destination Address'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'dstuser',
                text: _T('Destination User'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            })]
        });
        var bbar = new Ext.Toolbar({cls: Pan.base.Constants.uiThemes[0]});
        var timeitems = [["last-6-hrs", _T('Last 6 hours')], ["last-12-hrs", _T('Last 12 hours')], ["last-24-hrs", _T('Last 24 hours')], ["last-7-days", _T('Last 7 days')], ["last-30-days", _T('Last 30 days')]];
        for (i = 0; i < timeitems.length; i++) {
            n = timeitems[i];
            bbar.add({
                value: n[0],
                text: n[1],
                toggleGroup: 'period',
                enableToggle: true,
                toggleHandler: this.onItemToggle,
                scope: this,
                pressed: i == 0
            });
        }
        var topnBtn = new Ext.Toolbar.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'icon-shape-align-bottom',
            text: _T('Top 10'),
            menu: topnMenu
        });
        topnMenu.parentButton = topnBtn;
        var criteriaBtn = new Ext.Toolbar.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'icon-page-white-wrench',
            text: _T('Threat'),
            menu: criteriaMenu
        });
        criteriaMenu.parentButton = criteriaBtn;
        var filterBtnConfigs = [{
            value: '',
            toggleGroup: 'subtype',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            pressed: true,
            iconCls: 'icon-threatshield',
            cls: 'x-btn-icon',
            tooltip: _T('Show all threat types')
        }, {
            value: 'virus',
            toggleGroup: 'subtype',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            iconCls: 'icon-virus',
            cls: 'x-btn-icon',
            tooltip: _T('Show viruses')
        }, {
            value: 'spyware',
            toggleGroup: 'subtype',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            iconCls: 'icon-spyware',
            cls: 'x-btn-icon',
            tooltip: _T('Show spyware')
        }, {
            value: 'vulnerability',
            toggleGroup: 'subtype',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            iconCls: 'icon-vulnerability',
            cls: 'x-btn-icon',
            tooltip: _T('Show vulnerabilities')
        }, {
            value: 'file',
            toggleGroup: 'subtype',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            iconCls: 'icon-fileblocking',
            cls: 'x-btn-icon',
            tooltip: _T('Show file')
        }];
        for (i = 0; i < filterBtnConfigs.length; i++) {
            this.filterButtons.push(new Ext.Toolbar.Button(filterBtnConfigs[i]));
        }
        var tbar = new Ext.Toolbar({cls: Pan.base.Constants.uiThemes[0]});
        tbar.add(topnBtn, criteriaBtn, '-', _T('Filter'), ' ', this.filterButtons);
        if (Modernizr.canvas) {
            tbar.add('-', _T('Export') + ': ', {
                value: 'exportimage',
                toggleGroup: 'export',
                enableToggle: false,
                pressed: false,
                scope: this,
                toggleHandler: this.onExport,
                iconCls: 'icon-downimg',
                cls: 'x-btn-icon',
                tooltip: _T('PNG')
            }, {
                value: 'exportpdf',
                toggleGroup: 'export',
                enableToggle: false,
                pressed: false,
                scope: this,
                toggleHandler: this.onExport,
                iconCls: 'icon-downpdf',
                cls: 'x-btn-icon',
                tooltip: _T('PDF')
            });
        }
        if (window['debug_xml']) {
            tbar.add({
                text: _T('show xml'), handler: function () {
                    this.chart.openDebugWindow({debug: "yes"});
                }
            });
        }
        tbar.add('->', {
            value: "stacked_column",
            toggleGroup: 'chart',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onChartCheck,
            pressed: true,
            iconCls: 'icon-column-chart',
            cls: 'x-btn-icon',
            tooltip: _T('Stacked column chart')
        }, {
            value: "stacked_area",
            toggleGroup: 'chart',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onChartCheck,
            iconCls: 'icon-area-chart',
            cls: 'x-btn-icon',
            tooltip: _T('Stacked area chart')
        });
        this.chartContainer = new Ext.Container();
        var self = this;
        Ext.apply(this, {
            layout: 'fit',
            defaults: {border: false},
            bbar: bbar,
            tbar: tbar,
            id: 'chart_container_parent',
            itemId: 'chart_container_parent',
            items: [{
                xtype: 'panel',
                id: 'chart_container',
                itemId: 'chart_container',
                title: '',
                listeners: {
                    afterRender: function () {
                        self.callChart(self, null);
                    }
                }
            }, {xtype: 'panel', id: 'chart_container_print', itemId: 'chart_container_print', title: ''}]
        });
        Pan.monitor.appscope.ThreatScope.superclass.initComponent.call(this);
    }
});
Pan.reg("Monitor/App Scope/Threat Monitor", Pan.monitor.appscope.ThreatScope);
Ext.ns('Pan.monitor.appscope');
Pan.monitor.appscope.BandwidthScope = Ext.extend(Pan.base.container.Panel, {
    onResize: function (adjWidth, adjHeight, rawWidth, rawHeight) {
        var tmpHeight = Ext.getBody().getViewSize().height - 180;
        var tmpWidth = Ext.getBody().getViewSize().width - 210;
        if (this['chart'] != null) {
            this.renderChart('chart_container', tmpHeight, tmpWidth, this.datamap['chart_container'].content);
        }
        Pan.monitor.appscope.BandwidthScope.superclass.onResize.call(this, adjWidth, adjHeight, rawWidth, rawHeight);
    }, onDestroy: function () {
        if (this.chart != null) {
            this.chart.destroy();
        }
    }, onCriteriaToggle: function (obj, checked) {
        if (!checked) {
            return;
        }
        if (obj.parentMenu && obj.parentMenu.parentButton) {
            obj.parentMenu.parentButton.setText(obj.text);
        }
        var config = {};
        config[obj['group'] || obj['toggleGroup']] = obj['value'];
        this.callChart(this, config);
        var disable = obj['value'] != 'app';
        if (disable) {
            this.appCategoryBtn.disable();
        }
        else {
            this.appCategoryBtn.enable();
        }
    }, onItemToggle: function (obj, checked) {
        if (!checked) {
            return;
        }
        if (obj.parentMenu && obj.parentMenu.parentButton) {
            obj.parentMenu.parentButton.setText(obj.text);
        }
        var config = {};
        config[obj['group'] || obj['toggleGroup']] = obj['value'];
        this.callChart(this, config);
    }, onExport: function (obj, checked) {
        if (!checked) {
            return;
        }
        switch (obj.value) {
            case'exportimage':
                this.isPrint = "img";
                this.generateimage();
                this.isPrint = "";
                break;
            case'exportpdf':
                this.isPrint = "pdf";
                this.generatepdf();
                this.isPrint = "";
                break;
            default:
        }
        obj.toggle(false);
    }, computeConfig: function (__config) {
        __config = __config || {};
        __config['vsys'] = Pan.monitor.vsysScope();
        if (Pan.global.isCms() && Ext.getCmp('appscope-data-source').value === "panorama") {
            __config['appscope-data-source'] = 'panorama';
        }
        else {
            __config['appscope-data-source'] = '';
        }
        Ext.apply(this.currentconfig, __config);
        var configArr = [];
        configArr[0] = this.currentconfig;
        return configArr;
    }, onChartCheck: function (item, checked) {
        if (!checked) {
            return;
        }
        var chartType = item['value'];
        this.chartType = chartType;
        this.callChart(this, {});
    }, buildExportForm: function () {
        if (!document.getElementById("appscope.export.form")) {
            var html = ['<form id="appscope.export.form" method="post" target="_blank" action="/php/monitor/appscope.export.php">', '</form>'].join('');
            var el = new Ext.Element(document.createElement('div'));
            el.dom.innerHTML = html;
            el.appendTo(document.body);
        }
        return document.getElementById("appscope.export.form");
    }, generateimage: function () {
        if (this.datamap['chart_container']) {
            this.renderChart('chart_container_print', 670, 1100, this.datamap['chart_container'].content);
        }
        else {
            Ext.MessageBox.alert('Status', 'Nothing to export');
        }
    }, generatepdf: function () {
        if (this.datamap['chart_container']) {
            this.renderChart('chart_container_print', 670, 1100, this.datamap['chart_container'].content);
        }
        else {
            Ext.MessageBox.alert('Status', 'Nothing to export');
        }
    }, callChart: function (__this, __config) {
        this.loadMask = new Pan.base.widgets.LoadMask(this.getEl(), {msg: _T('Loading...')});
        this.loadMask.show();
        var jobid = null;
        var nowconfig = __this.computeConfig(__config);
        var realstatus;
        var content;
        var log = PanLogging.getLogger('monitor.BandwidthScope');
        PanDirect.run('BandwidthScope.startReportJob', nowconfig, function (response) {
            jobid = response;
            Pan.mainui.tasks.addDescription('reportjob', parseInt(jobid, 10), _T('Network monitor report'));
            if (jobid != null) {
                nowconfig[0].jobid = jobid;
                var pollReportFn = function (delayGradualBackOffValue) {
                    if (!delayGradualBackOffValue) {
                        delayGradualBackOffValue = 1000;
                    }
                    else if (delayGradualBackOffValue < 4000) {
                        delayGradualBackOffValue += 1000;
                    }
                    try {
                        PanDirect.run('BandwidthScope.pollReport', nowconfig, function (response) {
                            realstatus = Pan.base.json.path(response, '$.status');
                            content = Pan.base.json.path(response, '$.content');
                            if (realstatus == 'FIN') {
                                var height = Ext.get('chart_container').dom.parentElement.offsetHeight;
                                var width = Ext.get('chart_container').dom.parentElement.offsetWidth;
                                if (content != null && content.plotdata != null && content.xaxisdata.length > 0) {
                                    var myobj = {};
                                    myobj.content = content;
                                    content = __this.convertStrArrayToFloatArray(content);
                                    __this.datamap['chart_container'] = myobj;
                                    __this.renderChart('chart_container', height, width, content);
                                }
                                else {
                                    var chart_container_panel = Ext.getCmp('chart_container');
                                    chart_container_panel.getEl().update(Pan.monitor.emptyMsg);
                                    chart_container_panel.doLayout();
                                }
                                __this.loadMask.hide();
                                __this.loadMask.destroy();
                            }
                            else if (realstatus == 'ACT' || realstatus == 'PEND') {
                                pollReportFn.createCallback(delayGradualBackOffValue).defer(Pan.acc.randomDelay(delayGradualBackOffValue));
                            }
                            else {
                                log.info("Neither FIN nor ACT - skipping");
                            }
                        });
                    }
                    catch (e) {
                        log.error(e);
                    }
                };
                pollReportFn();
            }
            else {
                var msg = Pan.base.Constants.transportErrorMsg;
                Ext.MessageBox.alert("Error", msg);
                __this.loadMask.hide();
                __this.loadMask.destroy();
            }
        });
    }, convertStrArrayToFloatArray: function (mycats) {
        if (mycats) {
            var plotdata = mycats.plotdata;
            if (plotdata) {
                var tempItem, tempItemData;
                for (var i = 0; i < plotdata.length; i++) {
                    tempItem = plotdata[i];
                    if (tempItem) {
                        tempItemData = tempItem.data;
                        if (tempItemData) {
                            for (var j = 0; j < tempItemData.length; j++) {
                                tempItemData[j] = parseFloat(tempItemData[j]);
                            }
                        }
                    }
                }
            }
        }
        return mycats;
    }, renderChart: function (id, height, width, response) {
        var selfone = this;
        var myprintflag = this.isPrint;
        var log = PanLogging.getLogger('monitor.BandwidthScope');
        if (myprintflag == "pdf" || myprintflag == "img") {
            Ext.MessageBox.show({
                msg: 'Exporting, please wait...',
                progressText: 'Exporting, please wait...',
                width: 300,
                wait: true,
                waitConfig: {interval: 200}
            });
            id = 'chart_container_print';
        }
        var mycats = response.plotdata;
        if (this.chartType == 'stacked_column') {
            this.chart = new Highcharts.Chart({
                chart: {zoomType: 'xy', renderTo: id, type: 'column', height: height, width: width},
                credits: {enabled: false},
                title: {text: ''},
                subtitle: {text: ''},
                exporting: {enabled: false},
                xAxis: {categories: response.xaxisdata},
                yAxis: {min: 0, title: {text: response.yaxisname}, stackLabels: {enabled: false}},
                legend: {
                    align: 'center',
                    maxHeight: ((myprintflag == "pdf" || myprintflag == "img")) ? undefined : 100,
                    x: 0,
                    verticalAlign: 'bottom',
                    y: 0,
                    floating: false,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColorSolid) || 'white',
                    borderColor: '#CCC',
                    borderWidth: 1,
                    shadow: false
                },
                tooltip: {
                    formatter: function () {
                        var y = this.series.yAxis.userOptions.title.text === "Bytes" ? Pan.base.util.prettyPrintNumber(this.y, Pan.common.Constants.noOf1KBytes, 2) : this.y;
                        var total = this.series.yAxis.userOptions.title.text === "Bytes" ? Pan.base.util.prettyPrintNumber(this.point.stackTotal, Pan.common.Constants.noOf1KBytes, 2) : this.point.stackTotal;
                        return '<b>' + this.x + '</b><br/>' +
                            this.series.name + ': ' + y + '<br/>' + 'Total: ' + total;
                    }
                },
                plotOptions: {
                    series: {
                        cursor: 'pointer', point: {
                            events: {
                                click: function () {
                                    if (Pan.global.SDBGENERAL['cfg.vm-license-type'] !== 'vm50l') {
                                        for (var k = 0; k < mycats.length; k++) {
                                            if (mycats[k].name == this.series.name) {
                                                self.location = mycats[k].link[this.x];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }, column: {stacking: 'normal', dataLabels: {enabled: false}}
                },
                series: mycats
            }, function () {
                if (myprintflag == "pdf") {
                    setTimeout(function () {
                        var svgData = $("#chart_container_print").children(":first").html();
                        svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                        var canvas = document.createElement("canvas");
                        canvg(canvas, svgData, {
                            renderCallback: function () {
                                var img = canvas.toDataURL("image/png");
                                PanDirect.run('BandwidthScope.createpdf', [{
                                    'img': img,
                                    'filters': selfone.currentconfig
                                }], function (response) {
                                    if (response) {
                                        var url = '/php/monitor/appscope.export.php';
                                        Ext.Msg.show({
                                            title: _T('Report'),
                                            width: 300,
                                            msg: "Download Report",
                                            buttons: Ext.Msg.YESNO,
                                            fn: function (result) {
                                                if (result === "yes") {
                                                    window.open(url);
                                                }
                                                return;
                                            }
                                        });
                                    }
                                });
                                Ext.MessageBox.hide();
                                $("#chart_container_print").children(":first").html('');
                            }
                        });
                    }, 3000);
                }
                else if (myprintflag == "img") {
                    setTimeout(function () {
                        var svgData = $("#chart_container_print").children(":first").html();
                        svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                        var canvas = document.createElement("canvas");
                        canvg(canvas, svgData, {
                            renderCallback: function () {
                                Ext.MessageBox.hide();
                                var win = window.open();
                                win.document.write('<img src="' + canvas.toDataURL("image/png") + '"/>');
                                $("#chart_container_print").children(":first").html('');
                            }
                        });
                    }, 3000);
                }
            });
        }
        else if (this.chartType == 'stacked_area') {
            this.chart = new Highcharts.Chart({
                chart: {zoomType: 'xy', renderTo: id, type: 'area', height: height, width: width},
                credits: {enabled: false},
                title: {text: ''},
                subtitle: {text: ''},
                exporting: {enabled: false},
                xAxis: {categories: response.xaxisdata, tickmarkPlacement: 'on', title: {enabled: false}},
                yAxis: {min: 0, title: {text: response.yaxisname}, stackLabels: {enabled: false}},
                legend: {
                    align: 'center',
                    maxHeight: ((myprintflag == "pdf" || myprintflag == "img")) ? undefined : 100,
                    x: 0,
                    verticalAlign: 'bottom',
                    y: 0,
                    floating: false,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColorSolid) || 'white',
                    borderColor: '#CCC',
                    borderWidth: 1,
                    shadow: false
                },
                tooltip: {
                    formatter: function () {
                        var y = this.series.yAxis.userOptions.title.text === "Bytes" ? Pan.base.util.prettyPrintNumber(this.y, Pan.common.Constants.noOf1KBytes, 2) : this.y;
                        var total = this.series.yAxis.userOptions.title.text === "Bytes" ? Pan.base.util.prettyPrintNumber(this.point.stackTotal, Pan.common.Constants.noOf1KBytes, 2) : this.point.stackTotal;
                        return '<b>' + this.x + '</b><br/>' +
                            this.series.name + ': ' + y + '<br/>' + 'Total: ' + total;
                    }
                },
                plotOptions: {
                    series: {
                        cursor: 'pointer',
                        stacking: 'normal',
                        lineColor: '#666666',
                        lineWidth: 1,
                        marker: {lineWidth: 1, lineColor: '#666666'},
                        point: {
                            events: {
                                click: function () {
                                    if (Pan.global.SDBGENERAL['cfg.vm-license-type'] !== 'vm50l') {
                                        for (var k = 0; k < mycats.length; k++) {
                                            if (mycats[k].name == this.series.name) {
                                                self.location = mycats[k].link[this.x];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                series: mycats
            }, function () {
                if (myprintflag == "pdf") {
                    setTimeout(function () {
                        var svgData = $("#chart_container_print").children(":first").html();
                        svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                        var canvas = document.createElement("canvas");
                        canvg(canvas, svgData, {
                            renderCallback: function () {
                                var img = canvas.toDataURL("image/png");
                                PanDirect.run('BandwidthScope.createpdf', [{
                                    'img': img,
                                    'filters': selfone.currentconfig
                                }], function (response) {
                                    if (response) {
                                        var url = '/php/monitor/appscope.export.php';
                                        Ext.Msg.show({
                                            title: _T('Report'),
                                            width: 300,
                                            msg: "Download Report",
                                            buttons: Ext.Msg.YESNO,
                                            fn: function (result) {
                                                if (result === "yes") {
                                                    window.open(url);
                                                }
                                                return;
                                            }
                                        });
                                    }
                                });
                                Ext.MessageBox.hide();
                                $("#chart_container_print").children(":first").html('');
                            }
                        });
                    }, 3000);
                }
                else if (myprintflag == "img") {
                    setTimeout(function () {
                        var svgData = $("#chart_container_print").children(":first").html();
                        svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
                        var canvas = document.createElement("canvas");
                        canvg(canvas, svgData, {
                            renderCallback: function () {
                                Ext.MessageBox.hide();
                                var win = window.open();
                                win.document.write('<img src="' + canvas.toDataURL("image/png") + '"/>');
                                $("#chart_container_print").children(":first").html('');
                            }
                        });
                    }, 3000);
                }
            });
        }
        else {
            log.info("No proper chart type");
        }
    }, constructor: function (config) {
        Ext.applyIf(this, config);
        Pan.monitor.appscope.BandwidthScope.superclass.constructor.call(this);
    }, initComponent: function () {
        this.currentconfig = {
            'page': 'network_monitor',
            'appscope-data-source': '',
            'clear_report': 'yes',
            'debug': '',
            'period': 'last-6-hrs',
            'topn': '10',
            'aggregate-by': 'app',
            'sortby': 'bytes',
            'chart_type': 'stacked_column'
        };
        this.datamap = {};
        this.chart = null;
        this.chartType = 'stacked_column';
        this.isPrint = "";
        var i, n;
        var topnitems = [10, 25, 50, 100];
        for (i = 0; i < topnitems.length; i++) {
            n = topnitems[i];
            topnitems[i] = new Ext.menu.CheckItem({
                value: n,
                text: _T('Top {Nth}', {Nth: n}),
                checked: i == 0,
                group: 'topn',
                scope: this,
                checkHandler: this.onItemToggle
            });
        }
        var topnMenu = new Ext.menu.Menu({id: 'topnMenu', items: topnitems});
        var criteriaMenu = new Ext.menu.Menu({
            id: 'criteriaMenu',
            items: [new Ext.menu.CheckItem({
                value: 'app',
                text: _T('Application'),
                checked: true,
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'category-of-name',
                text: _T('Application Category'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'src',
                text: _T('Source Address'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'srcuser',
                text: _T('Source User'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'dst',
                text: _T('Destination Address'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            }), new Ext.menu.CheckItem({
                value: 'dstuser',
                text: _T('Destination User'),
                group: 'aggregate-by',
                scope: this,
                checkHandler: this.onCriteriaToggle
            })]
        });
        var appCategoryMenu = new Ext.menu.Menu({
            id: 'appCategoryMenu',
            items: [new Ext.menu.CheckItem({
                value: '',
                text: _T('None'),
                group: 'category-of-name',
                checked: true,
                scope: this,
                checkHandler: this.onItemToggle
            }), new Ext.menu.CheckItem({
                value: 'business-systems',
                text: _T('Business Systems'),
                group: 'category-of-name',
                scope: this,
                checkHandler: this.onItemToggle
            }), new Ext.menu.CheckItem({
                value: 'collaboration',
                text: _T('Collaboration'),
                group: 'category-of-name',
                scope: this,
                checkHandler: this.onItemToggle
            }), new Ext.menu.CheckItem({
                value: 'general-internet',
                text: _T('General Internet'),
                group: 'category-of-name',
                scope: this,
                checkHandler: this.onItemToggle
            }), new Ext.menu.CheckItem({
                value: 'media',
                text: _T('Media'),
                group: 'category-of-name',
                scope: this,
                checkHandler: this.onItemToggle
            }), new Ext.menu.CheckItem({
                value: 'networking',
                text: _T('Networking'),
                group: 'category-of-name',
                scope: this,
                checkHandler: this.onItemToggle
            }), new Ext.menu.CheckItem({
                value: 'unknown',
                text: _T('Unknown'),
                group: 'category-of-name',
                scope: this,
                checkHandler: this.onItemToggle
            })]
        });
        var bbar = new Ext.Toolbar({cls: Pan.base.Constants.uiThemes[0]});
        var timeitems = [["last-6-hrs", _T('Last 6 hours')], ["last-12-hrs", _T('Last 12 hours')], ["last-24-hrs", _T('Last 24 hours')], ["last-7-days", _T('Last 7 days')], ["last-30-days", _T('Last 30 days')]];
        for (i = 0; i < timeitems.length; i++) {
            n = timeitems[i];
            bbar.add({
                value: n[0],
                text: n[1],
                toggleGroup: 'period',
                enableToggle: true,
                toggleHandler: this.onItemToggle,
                scope: this,
                pressed: i == 0
            });
        }
        var topnBtn = new Ext.Toolbar.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'icon-shape-align-bottom',
            text: _T('Top 10'),
            menu: topnMenu
        });
        topnMenu.parentButton = topnBtn;
        var criteriaBtn = new Ext.Toolbar.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'icon-page-white-wrench',
            text: _T('Application'),
            menu: criteriaMenu
        });
        criteriaMenu.parentButton = criteriaBtn;
        this.appCategoryBtn = new Ext.Toolbar.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'icon-dlp-data-filter',
            text: _T('None'),
            menu: appCategoryMenu
        });
        appCategoryMenu.parentButton = this.appCategoryBtn;
        var tbar = new Ext.Toolbar({cls: Pan.base.Constants.uiThemes[0]});
        tbar.add(topnBtn, criteriaBtn, '-', _T('Filter'), ' ', this.appCategoryBtn, '-', {
            value: 'sessions',
            toggleGroup: 'sortby',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            cls: 'x-btn-icon',
            iconCls: 'icon-sessions',
            tooltip: _T('Count sessions')
        }, {
            value: 'bytes',
            toggleGroup: 'sortby',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            pressed: true,
            cls: 'x-btn-icon',
            iconCls: 'icon-bytes',
            tooltip: _T('Count bytes')
        });
        if (Modernizr.canvas) {
            tbar.add('-', _T('Export') + ': ', {
                value: 'exportimage',
                toggleGroup: 'export',
                enableToggle: false,
                pressed: false,
                scope: this,
                toggleHandler: this.onExport,
                iconCls: 'icon-downimg',
                cls: 'x-btn-icon',
                tooltip: _T('PNG')
            }, {
                value: 'exportpdf',
                toggleGroup: 'export',
                enableToggle: false,
                pressed: false,
                scope: this,
                toggleHandler: this.onExport,
                iconCls: 'icon-downpdf',
                cls: 'x-btn-icon',
                tooltip: _T('PDF')
            });
        }
        if (window['debug_xml']) {
            tbar.add({
                text: _T('show xml'), handler: function () {
                    this.chart.openDebugWindow({debug: "yes"});
                }
            });
        }
        tbar.add('->', {
            value: "stacked_column",
            toggleGroup: 'chart',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onChartCheck,
            pressed: true,
            iconCls: 'icon-column-chart',
            cls: 'x-btn-icon',
            tooltip: _T('Stacked column chart')
        }, {
            value: "stacked_area",
            toggleGroup: 'chart',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onChartCheck,
            iconCls: 'icon-area-chart',
            cls: 'x-btn-icon',
            tooltip: _T('Stacked area chart')
        });
        this.chartContainer = new Ext.Container();
        var self = this;
        Ext.apply(this, {
            layout: 'fit',
            defaults: {border: false},
            bbar: bbar,
            tbar: tbar,
            id: 'chart_container_parent',
            itemId: 'chart_container_parent',
            bodyStyle: {"background-color": "#FBFCFC"},
            items: [{
                xtype: 'panel',
                id: 'chart_container',
                itemId: 'chart_container',
                title: '',
                listeners: {
                    afterRender: function () {
                        self.callChart(self, null);
                    }
                }
            }, {xtype: 'panel', id: 'chart_container_print', itemId: 'chart_container_print', title: ''}]
        });
        Pan.monitor.appscope.BandwidthScope.superclass.initComponent.call(this);
    }
});
Highcharts.getOptions().colors = ["#72A392", "#C2D1D3", "#C9D6A6", "#8AD3DF", "#918A75", "#80A1B6", "#72A392", "#569BBD", "#C2D1D3", "#EBD722", "#C27D2A", "#FF6A00", "#7D3953", "#5B6F7B", "#C9D6A6", "#8AD3DF", "#C2D1D3", "#80A1B6", "#C1D72F", "#000000", "#FFC425", "#918A75", "#5B6F7B", "#C9D6A6", "#CD383F"];
Pan.reg("Monitor/App Scope/Network Monitor", Pan.monitor.appscope.BandwidthScope);
Ext.ns('Pan.monitor.appscope');
Pan.monitor.appscope.ThreatScope = Ext.extend(Pan.base.container.Panel, {
    onResize: function (adjWidth, adjHeight, rawWidth, rawHeight) {
        var tmpHeight = Ext.getBody().getViewSize().height - 180;
        var tmpWidth = Ext.getBody().getViewSize().width - 210;
        if (this['chart'] != null) {
            this.renderChart('chart_container', tmpHeight, tmpWidth, this.datamap['chart_container'].content);
        }
        Pan.monitor.appscope.ThreatScope.superclass.onResize.call(this, adjWidth, adjHeight, rawWidth, rawHeight);
    }, onItemToggle: function (obj, checked) {
        if (!checked) {
            return;
        }
        if (obj.parentMenu && obj.parentMenu.parentButton) {
            obj.parentMenu.parentButton.setText(obj.text);
        }
        var config = {};
        config[obj['group'] || obj['toggleGroup']] = obj['value'];
        this.callChart(this, config);
    }, onExport: function (obj, checked) {
        if (!checked) {
            return;
        }
        switch (obj.value) {
            case'exportimage':
                this.generateimage();
                break;
            case'exportpdf':
                this.generatepdf();
                break;
            default:
        }
        obj.toggle(false);
    }, computeConfig: function (__config) {
        __config = __config || {};
        __config['vsys'] = Pan.monitor.vsysScope();
        if (Pan.global.isCms() && Ext.getCmp('appscope-data-source').value === "panorama") {
            __config['appscope-data-source'] = 'panorama';
        }
        else {
            __config['appscope-data-source'] = '';
        }
        Ext.apply(this.currentconfig, __config);
        var configArr = [];
        configArr[0] = this.currentconfig;
        return configArr;
    }, buildExportForm: function () {
        if (!document.getElementById("appscope.export.form")) {
            var html = ['<form id="appscope.export.form" method="post" target="_blank" action="/php/monitor/appscope.export.php">', '</form>'].join('');
            var el = new Ext.Element(document.createElement('div'));
            el.dom.innerHTML = html;
            el.appendTo(document.body);
        }
        return document.getElementById("appscope.export.form");
    }, generateimage: function () {
        if (this.datamap['chart_container']) {
            this.renderPrintChart('chart_container_print', 401, 1000, this.datamap['chart_container'].content);
            var svgData = $("#chart_container_print").html().split('<div')[0];
            svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
            svgData = svgfix(svgData);
            var canvas = document.createElement("canvas");
            canvg(canvas, svgData, {
                renderCallback: function () {
                    Ext.MessageBox.hide();
                    var win = window.open();
                    win.document.write('<img src="' + canvas.toDataURL("image/png") + '"/>');
                }
            });
        }
        else {
            Ext.MessageBox.alert('Status', 'Nothing to export');
        }
    }, generatepdf: function () {
        if (this.datamap['chart_container']) {
            var self = this;
            this.renderPrintChart('chart_container_print', 401, 1000, this.datamap['chart_container'].content);
            var svgData = $("#chart_container_print").html().split('<div')[0];
            svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
            svgData = svgfix(svgData);
            var canvas = document.createElement("canvas");
            canvg(canvas, svgData, {
                renderCallback: function () {
                    var img = canvas.toDataURL("image/png");
                    PanDirect.run('ThreatScope.createpdf', [{
                        'img': img,
                        'filters': self.currentconfig
                    }], function (response) {
                        if (response) {
                            var url = '/php/monitor/appscope.export.php';
                            Ext.Msg.show({
                                title: _T('Report'),
                                width: 300,
                                msg: "Download Report",
                                buttons: Ext.Msg.YESNO,
                                fn: function (result) {
                                    if (result === "yes") {
                                        window.open(url);
                                    }
                                    return;
                                }
                            });
                        }
                    });
                    Ext.MessageBox.hide();
                }
            });
        }
        else {
            Ext.MessageBox.alert('Status', 'Nothing to export');
        }
    }, callChart: function (__this, __config) {
        this.loadMask = new Pan.base.widgets.LoadMask(this.getEl(), {msg: _T('Loading...')});
        this.loadMask.show();
        var jobid = null;
        var nowconfig = __this.computeConfig(__config);
        var realstatus;
        var content;
        PanDirect.run('ThreatScope.startReportJob', nowconfig, function (response) {
            var log = PanLogging.getLogger('monitor:ThreatMap');
            jobid = response;
            if (jobid != null) {
                nowconfig[0].jobid = jobid;
                var pollReportFn = function (delayGradualBackOffValue) {
                    if (!delayGradualBackOffValue) {
                        delayGradualBackOffValue = 1000;
                    }
                    else if (delayGradualBackOffValue < 4000) {
                        delayGradualBackOffValue += 1000;
                    }
                    try {
                        PanDirect.run('ThreatScope.pollReport', nowconfig, function (response) {
                            realstatus = Pan.base.json.path(response, '$.status');
                            content = Pan.base.json.path(response, '$.content');
                            if (realstatus == 'FIN') {
                                var height = Ext.getBody().getViewSize().height - 180;
                                var width = Ext.getBody().getViewSize().width - 208;
                                if (content != null) {
                                    var myobj = {};
                                    myobj.content = content;
                                    __this.datamap['chart_container'] = myobj;
                                    __this.renderChart('chart_container', height, width, content);
                                }
                                else {
                                    var chart_container_panel = Ext.getCmp('chart_container');
                                    chart_container_panel.getEl().update('<table align=center><tr><td height="70"><font color=red><B>- - - NO DATA TO DISPLAY - - -</B></font></td></tr></table>');
                                    chart_container_panel.doLayout();
                                }
                                __this.loadMask.hide();
                                __this.loadMask.destroy();
                            }
                            else if (realstatus == 'ACT' || realstatus == 'PEND') {
                                pollReportFn.createCallback(delayGradualBackOffValue).defer(Pan.acc.randomDelay(delayGradualBackOffValue));
                            }
                            else {
                                log.warn("Neither FIN nor ACT - skipping");
                            }
                        });
                    } catch (e) {
                        log.error(e);
                    }
                };
                pollReportFn();
            }
            else {
                var msg = Pan.base.Constants.transportErrorMsg;
                Ext.MessageBox.alert("Error", msg);
                __this.loadMask.hide();
                __this.loadMask.destroy();
            }
        });
    }, animateOver: function () {
        if (this.data("hoverFill")) {
            this.attr("fill", this.data("hoverFill"));
        }
    }, animateOut: function () {
        if (this.data("fill")) {
            this.attr("fill", this.data("fill"));
        }
    }, findZoomFactor: function (mychartwidth) {
        var myzoomfactor = (mychartwidth - 1024) * 0.012;
        if (myzoomfactor < 0) {
            myzoomfactor = 0;
        }
        else if (myzoomfactor > 6) {
            myzoomfactor = 6;
        }
        return myzoomfactor;
    }, renderChart: function (id, chartHeight, chartWidth, response) {
        if (this.chartType == 'stacked_column') {
            this.chart = {populated: true};
            if (this.paper != null) {
                var paperDom = this.paper.canvas;
                paperDom.parentNode.removeChild(paperDom);
            }
            this.paper = Raphael(id, chartWidth, chartHeight);
            var zoomfactor = this.findZoomFactor(chartWidth);
            this.panZoom = this.paper.panzoom({
                minZoom: zoomfactor,
                maxZoom: zoomfactor + (0.05 * 200),
                initialZoom: zoomfactor,
                initialPosition: {x: 0, y: 0}
            });
            this.panZoom.enable();
            this.paper.safari();
            var attributes = {stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linejoin': 'round'};
            this.paper.rect(0, 0, chartWidth, chartHeight, 0).attr({stroke: "none", fill: "0-#9bb7cb-#adc8da"});
            var textattr = {
                'font-size': 12,
                fill: '#FFF',
                stroke: '',
                'font-family': 'Arial,Helvetica,sans-serif',
                'font-weight': 800
            };
            this.paper.setStart();
            for (var country in worldmap.shapes) {
                if (!worldmap.shapes.hasOwnProperty(country) || !worldmap.color[country]) {
                    continue;
                }
                var shape = this.paper.path(worldmap.shapes[country]).attr({
                    stroke: "black",
                    "stroke-width": "2px",
                    fill: worldmap.color[country],
                    "stroke-opacity": 0.6
                });
                $(shape.node).qtip({
                    content: {text: worldmap.names[country]},
                    style: {background: '#000000', color: '#ffffff', border: {width: 2, radius: 3, color: '#000000'}},
                    position: {target: 'mouse', adjust: {mouse: true, x: 5, y: 5}}
                });
                shape.attr(attributes);
                shape.data("hoverFill", "#3e5f43");
                shape.data("fill", worldmap.color[country]);
                shape.hover(this.animateOver, this.animateOut);
            }
            var world = this.paper.setFinish();
            world.getXY = function (lat, lon) {
                var xfactor = 2.752;
                var xoffset = 473.75;
                var x = (lon * xfactor) + xoffset;
                var yfactor = -2.753;
                var yoffset = 231;
                var y = (lat * yfactor) + yoffset;
                return {cx: x, cy: y};
            };
            world.getLatLon = function (x, y) {
                var xfactor = 2.752;
                var xoffset = 473.75;
                var lon = (x - xoffset) / xfactor;
                var yfactor = -2.753;
                var yoffset = 231;
                var lat = (y - yoffset) / yfactor;
                return {lat: lat, lon: lon};
            };
            var latlonrg = /(\d+(?:\.\d+)?)[\xb0\s]?\s*(?:(\d+(?:\.\d+)?)['\u2019\u2032\s])?\s*(?:(\d+(?:\.\d+)?)["\u201d\u2033\s])?\s*([SNEW])?/i;
            world.parseLatLon = function (latlon) {
                var l = latlon.split(",");
                return this.getXY(l[0], l[1]);
            };
            var dot = this.paper.circle().attr({
                fill: "r#FE7727:50-#F57124:100",
                stroke: "#fff",
                "stroke-width": 2,
                r: 0
            });
            var mouseover = function (event) {
                this.g = this.glow({color: "red", width: 8});
            };
            var mouseout = function (event) {
                this.g.remove();
            };
            var draw = function go(myobj, myself) {
                if (myobj.type == 'point') {
                    var array = myobj.loc.split(',');
                    var latitude = Math.round(array[0]);
                    var longitude = Math.round(array[1]);
                    var myitem = latitude + "," + longitude;
                    var myattr = world.parseLatLon(myitem);
                    if (myattr.cx && myattr.cy) {
                        if (myobj.data) {
                            var dot = myself.paper.circle(myattr.cx, myattr.cy, myobj.size).attr
                            ({
                                fill: '#' + worldmap.riskcolors[myobj.data],
                                stroke: "#fff",
                                'stroke-width': 1,
                                cursor: "pointer",
                                "fill-opacity": 1
                            });
                            dot.node.onclick = function () {
                                $(".qtip").remove();
                                if (Pan.global.SDBGENERAL['cfg.vm-license-type'] === 'vm50l' && myobj.url.indexOf('/#acc') === 0) {
                                    return;
                                }
                                window.location.href = myobj.url;
                            };
                            $(dot.node).qtip({
                                content: {text: myobj.name},
                                style: {
                                    background: '#000000',
                                    color: '#ffffff',
                                    border: {width: 2, radius: 3, color: '#000000'}
                                },
                                position: {target: 'mouse', adjust: {mouse: true, x: 5, y: 5}}
                            });
                            dot.hover(mouseover, mouseout);
                        }
                        else {
                            var img = myself.paper.image("/images/panimage.png", myattr.cx, myattr.cy, 263 / 3, 74 / 3);
                            $(img.node).qtip({
                                content: {text: myobj.name},
                                style: {
                                    background: '#000000',
                                    color: '#ffffff',
                                    border: {width: 2, radius: 3, color: '#000000'}
                                },
                                position: {target: 'mouse', adjust: {mouse: true, x: 5, y: 5}}
                            });
                        }
                    }
                }
                else if (myobj.type == 'arc') {
                    var start_array = myobj.start.split(',');
                    var start_latitude = Math.round(start_array[0]);
                    var start_longitude = Math.round(start_array[1]);
                    var start_myitem = start_latitude + "," + start_longitude;
                    var start_myattr = world.parseLatLon(start_myitem);
                    var stop_array = myobj.stop.split(',');
                    var stop_latitude = Math.round(stop_array[0]);
                    var stop_longitude = Math.round(stop_array[1]);
                    var stop_myitem = stop_latitude + "," + stop_longitude;
                    var stop_myattr = world.parseLatLon(stop_myitem);
                    if (start_myattr.cx && start_myattr.cy && stop_myattr.cx && stop_myattr.cy) {
                        var mypath = "M" + start_myattr.cx + " " + start_myattr.cy
                            + ",A600,600,0,0,1,"
                            + stop_myattr.cx + " " + stop_myattr.cy;
                        var arc = myself.paper.path(mypath).attr({
                            stroke: '#' + worldmap.riskcolors[myobj.data],
                            'stroke-width': 2
                        });
                    }
                }
            };
            var myobj = null;
            for (var i = 0; i < response.length; i++) {
                myobj = response[i];
                draw(myobj, this);
            }
        }
    }, renderPrintChart: function (id, chartHeight, chartWidth, response) {
        if (this.chartType == 'stacked_column') {
            if (this.printpaper != null) {
                var paperDom = this.printpaper.canvas;
                paperDom.parentNode.removeChild(paperDom);
            }
            this.printpaper = Raphael(id, chartWidth, chartHeight);
            this.printpaper.safari();
            var attributes = {stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linejoin': 'round'};
            this.printpaper.rect(0, 0, chartWidth, chartHeight, 0).attr({stroke: "none", fill: "0-#9bb7cb-#adc8da"});
            var textattr = {
                'font-size': 12,
                fill: '#FFF',
                stroke: '',
                'font-family': 'Arial,Helvetica,sans-serif',
                'font-weight': 800
            };
            this.printpaper.setStart();
            for (var country in worldmap.shapes) {
                if (!worldmap.shapes.hasOwnProperty(country) || !worldmap.color[country]) {
                    continue;
                }
                var shape = this.printpaper.path(worldmap.shapes[country]).attr({
                    stroke: "black",
                    "stroke-width": "2px",
                    fill: worldmap.color[country],
                    "stroke-opacity": 0.6
                });
                $(shape.node).qtip({
                    content: {text: worldmap.names[country]},
                    style: {background: '#000000', color: '#ffffff', border: {width: 2, radius: 3, color: '#000000'}},
                    position: {target: 'mouse', adjust: {mouse: true, x: 5, y: 5}}
                });
                shape.attr(attributes);
                shape.data("hoverFill", "#3e5f43");
                shape.data("fill", worldmap.color[country]);
                shape.hover(this.animateOver, this.animateOut);
            }
            var world = this.printpaper.setFinish();
            Ext.MessageBox.show({
                msg: 'Exporting, please wait...',
                progressText: 'Exporting, please wait...',
                width: 300,
                wait: true,
                waitConfig: {interval: 200}
            });
            world.getXY = function (lat, lon) {
                return {cx: lon * 2.6938 + 465.4, cy: lat * -2.6938 + 227.066};
            };
            world.getLatLon = function (x, y) {
                return {lat: (y - 227.066) / -2.6938, lon: (x - 465.4) / 2.6938};
            };
            var latlonrg = /(\d+(?:\.\d+)?)[\xb0\s]?\s*(?:(\d+(?:\.\d+)?)['\u2019\u2032\s])?\s*(?:(\d+(?:\.\d+)?)["\u201d\u2033\s])?\s*([SNEW])?/i;
            world.parseLatLon = function (latlon) {
                var l = latlon.split(",");
                return this.getXY(l[0], l[1]);
            };
            var dot = this.printpaper.circle().attr({
                fill: "r#FE7727:50-#F57124:100",
                stroke: "#fff",
                "stroke-width": 2,
                r: 0
            });
            var mouseover = function (event) {
                this.g = this.glow({color: "red", width: 8});
            };
            var mouseout = function (event) {
                this.g.remove();
            };
            var draw = function go(myobj, myself) {
                if (myobj.type == 'point') {
                    var array = myobj.loc.split(',');
                    var latitude = Math.round(array[0]);
                    var longitude = Math.round(array[1]);
                    var myitem = latitude + "," + longitude;
                    var myattr = world.parseLatLon(myitem);
                    if (myattr.cx && myattr.cy) {
                        if (myobj.data) {
                            var dot = myself.printpaper.circle(myattr.cx, myattr.cy, myobj.size).attr
                            ({
                                fill: '#' + worldmap.riskcolors[myobj.data],
                                stroke: "#fff",
                                'stroke-width': 1,
                                cursor: "pointer",
                                "fill-opacity": 1
                            });
                            $(dot.node).qtip({
                                content: {text: myobj.name},
                                style: {
                                    background: '#000000',
                                    color: '#ffffff',
                                    border: {width: 2, radius: 3, color: '#000000'}
                                },
                                position: {target: 'mouse', adjust: {mouse: true, x: 5, y: 5}}
                            });
                            dot.hover(mouseover, mouseout);
                        }
                        else {
                            var img = myself.printpaper.image("/images/panimage.png", myattr.cx, myattr.cy, 263 / 3, 74 / 3);
                            $(img.node).qtip({
                                content: {text: myobj.name},
                                style: {
                                    background: '#000000',
                                    color: '#ffffff',
                                    border: {width: 2, radius: 3, color: '#000000'}
                                },
                                position: {target: 'mouse', adjust: {mouse: true, x: 5, y: 5}}
                            });
                        }
                    }
                }
                else if (myobj.type == 'arc') {
                    var start_array = myobj.start.split(',');
                    var start_latitude = Math.round(start_array[0]);
                    var start_longitude = Math.round(start_array[1]);
                    var start_myitem = start_latitude + "," + start_longitude;
                    var start_myattr = world.parseLatLon(start_myitem);
                    var stop_array = myobj.stop.split(',');
                    var stop_latitude = Math.round(stop_array[0]);
                    var stop_longitude = Math.round(stop_array[1]);
                    var stop_myitem = stop_latitude + "," + stop_longitude;
                    var stop_myattr = world.parseLatLon(stop_myitem);
                    if (start_myattr.cx && start_myattr.cy && stop_myattr.cx && stop_myattr.cy) {
                        var mypath = "M" + start_myattr.cx + " " + start_myattr.cy
                            + ",A600,600,0,0,1,"
                            + stop_myattr.cx + " " + stop_myattr.cy;
                        var arc = myself.printpaper.path(mypath).attr({
                            stroke: '#' + worldmap.riskcolors[myobj.data],
                            'stroke-width': 2
                        });
                    }
                }
            };
            var myobj = null;
            for (var i = 0; i < response.length; i++) {
                myobj = response[i];
                draw(myobj, this);
            }
        }
    }, constructor: function (config) {
        this.filterButtons = [];
        Ext.applyIf(this, config);
        Pan.monitor.appscope.ThreatScope.superclass.constructor.call(this);
    }, initComponent: function () {
        this.currentconfig = {
            'page': 'threat_map',
            'appscope-data-source': '',
            'clear_report': 'yes',
            'debug': '',
            'period': 'last-6-hrs',
            'topn': '10',
            'aggregate-by': 'incoming',
            'subtype': '',
            'sortby': 'sessions',
            'chart_type': 'map'
        };
        this.datamap = {};
        this.chart = null;
        this.paper = null;
        this.printpaper = null;
        this.panZoom = null;
        this.chartType = 'stacked_column';
        var i, n;
        var topnitems = [10, 25, 50, 100];
        for (i = 0; i < topnitems.length; i++) {
            n = topnitems[i];
            topnitems[i] = new Ext.menu.CheckItem({
                value: n,
                text: _T('Top {Nth}', {Nth: n}),
                checked: i == 0,
                group: 'topn',
                scope: this,
                checkHandler: this.onItemToggle
            });
        }
        var topnMenu = new Ext.menu.Menu({id: 'topnMenu', items: topnitems});
        var bbar = new Ext.Toolbar({cls: Pan.base.Constants.uiThemes[0]});
        var timeitems = [["last-6-hrs", _T('Last 6 hours')], ["last-12-hrs", _T('Last 12 hours')], ["last-24-hrs", _T('Last 24 hours')], ["last-7-days", _T('Last 7 days')], ["last-30-days", _T('Last 30 days')]];
        for (i = 0; i < timeitems.length; i++) {
            n = timeitems[i];
            bbar.add({
                value: n[0],
                text: n[1],
                toggleGroup: 'period',
                enableToggle: true,
                toggleHandler: this.onItemToggle,
                scope: this,
                pressed: i == 0
            });
        }
        var topnBtn = new Ext.Toolbar.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'icon-shape-align-bottom',
            text: _T('Top 10'),
            menu: topnMenu
        });
        topnMenu.parentButton = topnBtn;
        var filterBtnConfigs = [{
            value: '',
            toggleGroup: 'subtype',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            pressed: true,
            iconCls: 'icon-threatshield',
            cls: 'x-btn-icon',
            tooltip: _T('Show all threat types')
        }, {
            value: 'virus',
            toggleGroup: 'subtype',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            iconCls: 'icon-virus',
            cls: 'x-btn-icon',
            tooltip: _T('Show viruses')
        }, {
            value: 'spyware',
            toggleGroup: 'subtype',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            iconCls: 'icon-spyware',
            cls: 'x-btn-icon',
            tooltip: _T('Show spyware')
        }, {
            value: 'vulnerability',
            toggleGroup: 'subtype',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            iconCls: 'icon-vulnerability',
            cls: 'x-btn-icon',
            tooltip: _T('Show vulnerabilities')
        }, {
            value: 'file',
            toggleGroup: 'subtype',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            iconCls: 'icon-fileblocking',
            cls: 'x-btn-icon',
            tooltip: _T('Show file')
        }];
        for (i = 0; i < filterBtnConfigs.length; i++) {
            this.filterButtons.push(new Ext.Toolbar.Button(filterBtnConfigs[i]));
        }
        var tbar = new Ext.Toolbar({cls: Pan.base.Constants.uiThemes[0]});
        tbar.add(topnBtn, '-', {
            value: 'incoming',
            toggleGroup: 'aggregate-by',
            enableToggle: true,
            pressed: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            text: _T('Incoming threats')
        }, {
            value: 'outgoing',
            toggleGroup: 'aggregate-by',
            enableToggle: true,
            pressed: false,
            scope: this,
            toggleHandler: this.onItemToggle,
            text: _T('Outgoing threats')
        }, ' ', '-', 'Filter', ' ', this.filterButtons, '-', {
            value: 'zoomin',
            toggleGroup: 'zoom',
            enableToggle: true,
            pressed: false,
            scope: this,
            toggleHandler: function () {
                this.panZoom.zoomIn(1);
            },
            text: _T('Zoom In')
        }, {
            value: 'zoomout',
            toggleGroup: 'zoom',
            enableToggle: true,
            pressed: false,
            scope: this,
            toggleHandler: function () {
                this.panZoom.zoomOut(1);
            },
            text: _T('Zoom Out')
        });
        if (Modernizr.canvas) {
            tbar.add('-', _T('Export') + ': ', {
                value: 'exportimage',
                toggleGroup: 'export',
                enableToggle: false,
                pressed: false,
                scope: this,
                toggleHandler: this.onExport,
                iconCls: 'icon-downimg',
                cls: 'x-btn-icon',
                tooltip: _T('PNG')
            }, {
                value: 'exportpdf',
                toggleGroup: 'export',
                enableToggle: false,
                pressed: false,
                scope: this,
                toggleHandler: this.onExport,
                iconCls: 'icon-downpdf',
                cls: 'x-btn-icon',
                tooltip: _T('PDF')
            });
        }
        this.chartContainer = new Ext.Container();
        var self = this;
        Ext.apply(this, {
            layout: 'fit',
            defaults: {border: false},
            bbar: bbar,
            tbar: tbar,
            id: 'chart_container_parent',
            itemId: 'chart_container_parent',
            bodyStyle: {"background-color": "#FBFCFC"},
            items: [{
                xtype: 'panel',
                id: 'chart_container',
                itemId: 'chart_container',
                title: '',
                listeners: {
                    afterRender: function () {
                        self.callChart(self, null);
                    }
                }
            }, {xtype: 'panel', id: 'chart_container_print', itemId: 'chart_container_print', title: ''}]
        });
        Pan.monitor.appscope.ThreatScope.superclass.initComponent.call(this);
    }
});
Pan.reg("Monitor/App Scope/Threat Map", Pan.monitor.appscope.ThreatScope);
Ext.ns('Pan.monitor.appscope');
Pan.monitor.appscope.TrafficScope = Ext.extend(Pan.base.container.Panel, {
    onResize: function (adjWidth, adjHeight, rawWidth, rawHeight) {
        var tmpHeight = Ext.getBody().getViewSize().height - 180;
        var tmpWidth = Ext.getBody().getViewSize().width - 210;
        if (this['chart'] != null) {
            this.renderChart('chart_container', tmpHeight, tmpWidth, this.datamap['chart_container'].content);
        }
        Pan.monitor.appscope.TrafficScope.superclass.onResize.call(this, adjWidth, adjHeight, rawWidth, rawHeight);
    }, onItemToggle: function (obj, checked) {
        if (!checked) {
            return;
        }
        if (obj.parentMenu && obj.parentMenu.parentButton) {
            obj.parentMenu.parentButton.setText(obj.text);
        }
        var config = {};
        config[obj['group'] || obj['toggleGroup']] = obj['value'];
        this.callChart(this, config);
    }, onExport: function (obj, checked) {
        if (!checked) {
            return;
        }
        switch (obj.value) {
            case'exportimage':
                this.generateimage();
                break;
            case'exportpdf':
                this.generatepdf();
                break;
            default:
        }
        obj.toggle(false);
    }, computeConfig: function (__config) {
        __config = __config || {};
        __config['vsys'] = Pan.monitor.vsysScope();
        if (Pan.global.isCms() && Ext.getCmp('appscope-data-source').value === "panorama") {
            __config['appscope-data-source'] = 'panorama';
        }
        else {
            __config['appscope-data-source'] = '';
        }
        Ext.apply(this.currentconfig, __config);
        var configArr = [];
        configArr[0] = this.currentconfig;
        return configArr;
    }, buildExportForm: function () {
        if (!document.getElementById("appscope.export.form")) {
            var html = ['<form id="appscope.export.form" method="post" target="_blank" action="/php/monitor/appscope.export.php">', '</form>'].join('');
            var el = new Ext.Element(document.createElement('div'));
            el.dom.innerHTML = html;
            el.appendTo(document.body);
        }
        return document.getElementById("appscope.export.form");
    }, generateimage: function () {
        if (this.datamap['chart_container']) {
            this.renderPrintChart('chart_container_print', 401, 1000, this.datamap['chart_container'].content);
            var svgData = $("#chart_container_print").html().split('<div')[0];
            svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
            svgData = svgfix(svgData);
            var canvas = document.createElement("canvas");
            canvg(canvas, svgData, {
                renderCallback: function () {
                    Ext.MessageBox.hide();
                    var win = window.open();
                    win.document.write('<img src="' + canvas.toDataURL("image/png") + '"/>');
                }
            });
        }
        else {
            Ext.MessageBox.alert('Status', 'Nothing to export');
        }
    }, generatepdf: function () {
        if (this.datamap['chart_container']) {
            var self = this;
            this.renderPrintChart('chart_container_print', 401, 1000, this.datamap['chart_container'].content);
            var svgData = $("#chart_container_print").html().split('<div')[0];
            svgData = svgData.replace(/xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, '');
            svgData = svgfix(svgData);
            var canvas = document.createElement("canvas");
            canvg(canvas, svgData, {
                renderCallback: function () {
                    var img = canvas.toDataURL("image/png");
                    PanDirect.run('TrafficScope.createpdf', [{
                        'img': img,
                        'filters': self.currentconfig
                    }], function (response) {
                        if (response) {
                            var url = '/php/monitor/appscope.export.php';
                            Ext.Msg.show({
                                title: _T('Report'),
                                width: 300,
                                msg: "Download Report",
                                buttons: Ext.Msg.YESNO,
                                fn: function (result) {
                                    if (result === "yes") {
                                        window.open(url);
                                    }
                                    return;
                                }
                            });
                        }
                    });
                    Ext.MessageBox.hide();
                }
            });
        }
        else {
            Ext.MessageBox.alert('Status', 'Nothing to export');
        }
    }, callChart: function (__this, __config) {
        this.loadMask = new Pan.base.widgets.LoadMask(this.getEl(), {msg: _T('Loading...')});
        this.loadMask.show();
        var jobid = null;
        var nowconfig = __this.computeConfig(__config);
        var realstatus;
        var content;
        PanDirect.run('TrafficScope.startReportJob', nowconfig, function (response) {
            var log = PanLogging.getLogger('monitor:TrafficMap');
            jobid = response;
            if (jobid != null) {
                nowconfig[0].jobid = jobid;
                var pollReportFn = function (delayGradualBackOffValue) {
                    if (!delayGradualBackOffValue) {
                        delayGradualBackOffValue = 1000;
                    }
                    else if (delayGradualBackOffValue < 4000) {
                        delayGradualBackOffValue += 1000;
                    }
                    try {
                        PanDirect.run('TrafficScope.pollReport', nowconfig, function (response) {
                            realstatus = Pan.base.json.path(response, '$.status');
                            content = Pan.base.json.path(response, '$.content');
                            if (realstatus == 'FIN') {
                                var height = Ext.getBody().getViewSize().height - 180;
                                var width = Ext.getBody().getViewSize().width - 208;
                                if (content != null) {
                                    var myobj = {};
                                    myobj.content = content;
                                    __this.datamap['chart_container'] = myobj;
                                    __this.renderChart('chart_container', height, width, content);
                                }
                                else {
                                    var chart_container_panel = Ext.getCmp('chart_container');
                                    chart_container_panel.getEl().update('<table align=center><tr><td height="70"><font color=red><B>- - - NO DATA TO DISPLAY - - -</B></font></td></tr></table>');
                                    chart_container_panel.doLayout();
                                }
                                __this.loadMask.hide();
                                __this.loadMask.destroy();
                            }
                            else if (realstatus == 'ACT' || realstatus == 'PEND') {
                                pollReportFn.createCallback(delayGradualBackOffValue).defer(Pan.acc.randomDelay(delayGradualBackOffValue));
                            }
                            else {
                                log.warn("Neither FIN nor ACT - skipping");
                            }
                        });
                    } catch (e) {
                        log.error(e);
                    }
                };
                pollReportFn();
            }
            else {
                var msg = Pan.base.Constants.transportErrorMsg;
                Ext.MessageBox.alert("Error", msg);
                __this.loadMask.hide();
                __this.loadMask.destroy();
            }
        });
    }, animateOver: function () {
        if (this.data("hoverFill")) {
            this.attr("fill", this.data("hoverFill"));
        }
    }, animateOut: function () {
        if (this.data("fill")) {
            this.attr("fill", this.data("fill"));
        }
    }, findZoomFactor: function (mychartwidth) {
        var myzoomfactor = (mychartwidth - 1024) * 0.012;
        if (myzoomfactor < 0) {
            myzoomfactor = 0;
        }
        else if (myzoomfactor > 6) {
            myzoomfactor = 6;
        }
        return myzoomfactor;
    }, renderChart: function (id, chartHeight, chartWidth, response) {
        if (this.chartType == 'stacked_column') {
            this.chart = {populated: true};
            if (this.paper != null) {
                var paperDom = this.paper.canvas;
                paperDom.parentNode.removeChild(paperDom);
            }
            this.paper = Raphael(id, chartWidth, chartHeight);
            var zoomfactor = this.findZoomFactor(chartWidth);
            this.panZoom = this.paper.panzoom({
                minZoom: zoomfactor,
                maxZoom: zoomfactor + (0.05 * 200),
                initialZoom: zoomfactor,
                initialPosition: {x: 0, y: 0}
            });
            this.panZoom.enable();
            this.paper.safari();
            var attributes = {stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linejoin': 'round'};
            this.paper.rect(0, 0, chartWidth, chartHeight, 0).attr({stroke: "none", fill: "0-#9bb7cb-#adc8da"});
            var textattr = {
                'font-size': 12,
                fill: '#FFF',
                stroke: '',
                'font-family': 'Arial,Helvetica,sans-serif',
                'font-weight': 800
            };
            this.paper.setStart();
            for (var country in worldmap.shapes) {
                if (!worldmap.shapes.hasOwnProperty(country) || !worldmap.color[country]) {
                    continue;
                }
                var shape = this.paper.path(worldmap.shapes[country]).attr({
                    stroke: "black",
                    "stroke-width": "2px",
                    fill: worldmap.color[country],
                    "stroke-opacity": 0.6
                });
                $(shape.node).qtip({
                    content: {text: worldmap.names[country]},
                    style: {background: '#000000', color: '#ffffff', border: {width: 2, radius: 3, color: '#000000'}},
                    position: {target: 'mouse', adjust: {mouse: true, x: 5, y: 5}}
                });
                shape.attr(attributes);
                shape.data("hoverFill", "#3e5f43");
                shape.data("fill", worldmap.color[country]);
                shape.hover(this.animateOver, this.animateOut);
            }
            var world = this.paper.setFinish();
            world.getXY = function (lat, lon) {
                var xfactor = 2.752;
                var xoffset = 473.75;
                var x = (lon * xfactor) + xoffset;
                var yfactor = -2.753;
                var yoffset = 231;
                var y = (lat * yfactor) + yoffset;
                return {cx: x, cy: y};
            };
            world.getLatLon = function (x, y) {
                var xfactor = 2.752;
                var xoffset = 473.75;
                var lon = (x - xoffset) / xfactor;
                var yfactor = -2.753;
                var yoffset = 231;
                var lat = (y - yoffset) / yfactor;
                return {lat: lat, lon: lon};
            };
            var latlonrg = /(\d+(?:\.\d+)?)[\xb0\s]?\s*(?:(\d+(?:\.\d+)?)['\u2019\u2032\s])?\s*(?:(\d+(?:\.\d+)?)["\u201d\u2033\s])?\s*([SNEW])?/i;
            world.parseLatLon = function (latlon) {
                var l = latlon.split(",");
                return this.getXY(l[0], l[1]);
            };
            var dot = this.paper.circle().attr({
                fill: "r#FE7727:50-#F57124:100",
                stroke: "#fff",
                "stroke-width": 2,
                r: 0
            });
            var mouseover = function (event) {
                this.g = this.glow({color: "red", width: 8});
            };
            var mouseout = function (event) {
                this.g.remove();
            };
            var draw = function go(myobj, myself) {
                if (myobj.type == 'point') {
                    var array = myobj.loc.split(',');
                    var latitude = Math.round(array[0]);
                    var longitude = Math.round(array[1]);
                    var myitem = latitude + "," + longitude;
                    var myattr = world.parseLatLon(myitem);
                    if (myattr.cx && myattr.cy) {
                        if (myobj.data) {
                            var dot = myself.paper.circle(myattr.cx, myattr.cy, myobj.size).attr
                            ({
                                fill: '#' + worldmap.riskcolors[myobj.data],
                                stroke: "#fff",
                                'stroke-width': 1,
                                cursor: "pointer",
                                "fill-opacity": 1
                            });
                            dot.node.onclick = function () {
                                $(".qtip").remove();
                                if (Pan.global.SDBGENERAL['cfg.vm-license-type'] === 'vm50l' && myobj.url.indexOf('/#acc') === 0) {
                                    return;
                                }
                                window.location.href = myobj.url;
                            };
                            $(dot.node).qtip({
                                content: {text: myobj.name},
                                style: {
                                    background: '#000000',
                                    color: '#ffffff',
                                    border: {width: 2, radius: 3, color: '#000000'}
                                },
                                position: {target: 'mouse', adjust: {mouse: true, x: 5, y: 5}}
                            });
                            dot.hover(mouseover, mouseout);
                        }
                        else {
                            var img = myself.paper.image("/images/panimage.png", myattr.cx, myattr.cy, 263 / 3, 74 / 3);
                            $(img.node).qtip({
                                content: {text: myobj.name},
                                style: {
                                    background: '#000000',
                                    color: '#ffffff',
                                    border: {width: 2, radius: 3, color: '#000000'}
                                },
                                position: {target: 'mouse', adjust: {mouse: true, x: 5, y: 5}}
                            });
                        }
                    }
                }
                else if (myobj.type == 'arc') {
                    var start_array = myobj.start.split(',');
                    var start_latitude = Math.round(start_array[0]);
                    var start_longitude = Math.round(start_array[1]);
                    var start_myitem = start_latitude + "," + start_longitude;
                    var start_myattr = world.parseLatLon(start_myitem);
                    var stop_array = myobj.stop.split(',');
                    var stop_latitude = Math.round(stop_array[0]);
                    var stop_longitude = Math.round(stop_array[1]);
                    var stop_myitem = stop_latitude + "," + stop_longitude;
                    var stop_myattr = world.parseLatLon(stop_myitem);
                    if (start_myattr.cx && start_myattr.cy && stop_myattr.cx && stop_myattr.cy) {
                        var mypath = "M" + start_myattr.cx + " " + start_myattr.cy
                            + ",A600,600,0,0,1,"
                            + stop_myattr.cx + " " + stop_myattr.cy;
                        var arc = myself.paper.path(mypath).attr({
                            stroke: '#' + worldmap.riskcolors[myobj.data],
                            'stroke-width': 2
                        });
                    }
                }
            };
            var myobj = null;
            for (var i = 0; i < response.length; i++) {
                myobj = response[i];
                draw(myobj, this);
            }
        }
    }, renderPrintChart: function (id, chartHeight, chartWidth, response) {
        if (this.chartType == 'stacked_column') {
            if (this.printpaper != null) {
                var paperDom = this.printpaper.canvas;
                paperDom.parentNode.removeChild(paperDom);
            }
            this.printpaper = Raphael(id, chartWidth, chartHeight);
            this.printpaper.safari();
            var attributes = {stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linejoin': 'round'};
            this.printpaper.rect(0, 0, chartWidth, chartHeight, 0).attr({stroke: "none", fill: "0-#9bb7cb-#adc8da"});
            var textattr = {
                'font-size': 12,
                fill: '#FFF',
                stroke: '',
                'font-family': 'Arial,Helvetica,sans-serif',
                'font-weight': 800
            };
            this.printpaper.setStart();
            for (var country in worldmap.shapes) {
                if (!worldmap.shapes.hasOwnProperty(country) || !worldmap.color[country]) {
                    continue;
                }
                var shape = this.printpaper.path(worldmap.shapes[country]).attr({
                    stroke: "black",
                    "stroke-width": "2px",
                    fill: worldmap.color[country],
                    "stroke-opacity": 0.6
                });
                $(shape.node).qtip({
                    content: {text: worldmap.names[country]},
                    style: {background: '#000000', color: '#ffffff', border: {width: 2, radius: 3, color: '#000000'}},
                    position: {target: 'mouse', adjust: {mouse: true, x: 5, y: 5}}
                });
                shape.attr(attributes);
                shape.data("hoverFill", "#3e5f43");
                shape.data("fill", worldmap.color[country]);
                shape.hover(this.animateOver, this.animateOut);
            }
            var world = this.printpaper.setFinish();
            Ext.MessageBox.show({
                msg: 'Exporting, please wait...',
                progressText: 'Exporting, please wait...',
                width: 300,
                wait: true,
                waitConfig: {interval: 200}
            });
            world.getXY = function (lat, lon) {
                return {cx: lon * 2.6938 + 465.4, cy: lat * -2.6938 + 227.066};
            };
            world.getLatLon = function (x, y) {
                return {lat: (y - 227.066) / -2.6938, lon: (x - 465.4) / 2.6938};
            };
            var latlonrg = /(\d+(?:\.\d+)?)[\xb0\s]?\s*(?:(\d+(?:\.\d+)?)['\u2019\u2032\s])?\s*(?:(\d+(?:\.\d+)?)["\u201d\u2033\s])?\s*([SNEW])?/i;
            world.parseLatLon = function (latlon) {
                var l = latlon.split(",");
                return this.getXY(l[0], l[1]);
            };
            var dot = this.printpaper.circle().attr({
                fill: "r#FE7727:50-#F57124:100",
                stroke: "#fff",
                "stroke-width": 2,
                r: 0
            });
            var mouseover = function (event) {
                this.g = this.glow({color: "red", width: 8});
            };
            var mouseout = function (event) {
                this.g.remove();
            };
            var draw = function go(myobj, myself) {
                if (myobj.type == 'point') {
                    var array = myobj.loc.split(',');
                    var latitude = Math.round(array[0]);
                    var longitude = Math.round(array[1]);
                    var myitem = latitude + "," + longitude;
                    var myattr = world.parseLatLon(myitem);
                    if (myattr.cx && myattr.cy) {
                        if (myobj.data) {
                            var dot = myself.printpaper.circle(myattr.cx, myattr.cy, myobj.size).attr
                            ({
                                fill: '#' + worldmap.riskcolors[myobj.data],
                                stroke: "#fff",
                                'stroke-width': 1,
                                cursor: "pointer",
                                "fill-opacity": 1
                            });
                            $(dot.node).qtip({
                                content: {text: myobj.name},
                                style: {
                                    background: '#000000',
                                    color: '#ffffff',
                                    border: {width: 2, radius: 3, color: '#000000'}
                                },
                                position: {target: 'mouse', adjust: {mouse: true, x: 5, y: 5}}
                            });
                            dot.hover(mouseover, mouseout);
                        }
                        else {
                            var img = myself.printpaper.image("/images/panimage.png", myattr.cx, myattr.cy, 263 / 3, 74 / 3);
                            $(img.node).qtip({
                                content: {text: myobj.name},
                                style: {
                                    background: '#000000',
                                    color: '#ffffff',
                                    border: {width: 2, radius: 3, color: '#000000'}
                                },
                                position: {target: 'mouse', adjust: {mouse: true, x: 5, y: 5}}
                            });
                        }
                    }
                }
                else if (myobj.type == 'arc') {
                    var start_array = myobj.start.split(',');
                    var start_latitude = Math.round(start_array[0]);
                    var start_longitude = Math.round(start_array[1]);
                    var start_myitem = start_latitude + "," + start_longitude;
                    var start_myattr = world.parseLatLon(start_myitem);
                    var stop_array = myobj.stop.split(',');
                    var stop_latitude = Math.round(stop_array[0]);
                    var stop_longitude = Math.round(stop_array[1]);
                    var stop_myitem = stop_latitude + "," + stop_longitude;
                    var stop_myattr = world.parseLatLon(stop_myitem);
                    if (start_myattr.cx && start_myattr.cy && stop_myattr.cx && stop_myattr.cy) {
                        var mypath = "M" + start_myattr.cx + " " + start_myattr.cy
                            + ",A600,600,0,0,1,"
                            + stop_myattr.cx + " " + stop_myattr.cy;
                        var arc = myself.printpaper.path(mypath).attr({
                            stroke: '#' + worldmap.riskcolors[myobj.data],
                            'stroke-width': 2
                        });
                    }
                }
            };
            var myobj = null;
            for (var i = 0; i < response.length; i++) {
                myobj = response[i];
                draw(myobj, this);
            }
        }
    }, constructor: function (config) {
        Ext.applyIf(this, config);
        Pan.monitor.appscope.TrafficScope.superclass.constructor.call(this);
    }, initComponent: function () {
        this.currentconfig = {
            'page': 'traffic_map',
            'appscope-data-source': '',
            'clear_report': 'yes',
            'debug': '',
            'period': 'last-6-hrs',
            'topn': '10',
            'aggregate-by': 'incoming',
            'sortby': 'bytes',
            'chart_type': 'map'
        };
        this.datamap = {};
        this.chart = null;
        this.paper = null;
        this.printpaper = null;
        this.panZoom = null;
        this.chartType = 'stacked_column';
        var i, n;
        var topnitems = [10, 25, 50, 100];
        for (i = 0; i < topnitems.length; i++) {
            n = topnitems[i];
            topnitems[i] = new Ext.menu.CheckItem({
                value: n,
                text: _T('Top {Nth}', {Nth: n}),
                checked: i == 0,
                group: 'topn',
                scope: this,
                checkHandler: this.onItemToggle
            });
        }
        var topnMenu = new Ext.menu.Menu({id: 'topnMenu', items: topnitems});
        var bbar = new Ext.Toolbar({cls: Pan.base.Constants.uiThemes[0]});
        var timeitems = [["last-6-hrs", _T('Last 6 hours')], ["last-12-hrs", _T('Last 12 hours')], ["last-24-hrs", _T('Last 24 hours')], ["last-7-days", _T('Last 7 days')], ["last-30-days", _T('Last 30 days')]];
        for (i = 0; i < timeitems.length; i++) {
            n = timeitems[i];
            bbar.add({
                value: n[0],
                text: n[1],
                toggleGroup: 'period',
                enableToggle: true,
                toggleHandler: this.onItemToggle,
                scope: this,
                pressed: i == 0
            });
        }
        var topnBtn = new Ext.Toolbar.Button({
            cls: 'x-btn-text-icon',
            iconCls: 'icon-shape-align-bottom',
            text: _T('Top 10'),
            menu: topnMenu
        });
        topnMenu.parentButton = topnBtn;
        var tbar = new Ext.Toolbar({cls: Pan.base.Constants.uiThemes[0]});
        tbar.add(topnBtn, '-', {
            value: 'incoming',
            toggleGroup: 'aggregate-by',
            enableToggle: true,
            pressed: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            text: _T('Incoming traffic')
        }, {
            value: 'outgoing',
            toggleGroup: 'aggregate-by',
            enableToggle: true,
            pressed: false,
            scope: this,
            toggleHandler: this.onItemToggle,
            text: _T('Outgoing traffic')
        }, ' ', '-', {
            value: 'sessions',
            toggleGroup: 'sortby',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            cls: 'x-btn-icon',
            iconCls: 'icon-sessions',
            tooltip: _T('Count sessions')
        }, {
            value: 'bytes',
            toggleGroup: 'sortby',
            enableToggle: true,
            scope: this,
            toggleHandler: this.onItemToggle,
            pressed: true,
            cls: 'x-btn-icon',
            iconCls: 'icon-bytes',
            tooltip: _T('Count bytes')
        }, '-', {
            value: 'zoomin',
            toggleGroup: 'zoom',
            enableToggle: true,
            pressed: false,
            scope: this,
            toggleHandler: function () {
                this.panZoom.zoomIn(1);
            },
            text: _T('Zoom In')
        }, {
            value: 'zoomout',
            toggleGroup: 'zoom',
            enableToggle: true,
            pressed: false,
            scope: this,
            toggleHandler: function () {
                this.panZoom.zoomOut(1);
            },
            text: _T('Zoom Out')
        });
        if (Modernizr.canvas) {
            tbar.add('-', _T('Export') + ': ', {
                value: 'exportimage',
                toggleGroup: 'export',
                enableToggle: false,
                pressed: false,
                scope: this,
                toggleHandler: this.onExport,
                iconCls: 'icon-downimg',
                cls: 'x-btn-icon',
                tooltip: _T('PNG')
            }, {
                value: 'exportpdf',
                toggleGroup: 'export',
                enableToggle: false,
                pressed: false,
                scope: this,
                toggleHandler: this.onExport,
                iconCls: 'icon-downpdf',
                cls: 'x-btn-icon',
                tooltip: _T('PDF')
            });
        }
        this.chartContainer = new Ext.Container();
        var self = this;
        Ext.apply(this, {
            layout: 'fit',
            defaults: {border: false},
            bbar: bbar,
            tbar: tbar,
            id: 'chart_container_parent',
            itemId: 'chart_container_parent',
            bodyStyle: {"background-color": "#FBFCFC"},
            items: [{
                xtype: 'panel',
                id: 'chart_container',
                itemId: 'chart_container',
                title: '',
                listeners: {
                    afterRender: function () {
                        self.callChart(self, null);
                    }
                }
            }, {xtype: 'panel', id: 'chart_container_print', itemId: 'chart_container_print', title: ''}]
        });
        Pan.monitor.appscope.TrafficScope.superclass.initComponent.call(this);
    }
});
Pan.reg("Monitor/App Scope/Traffic Map", Pan.monitor.appscope.TrafficScope);
Ext.ns("Pan.monitor");
Ext.ns("Pan.monitor.CategoryChangeViewer");
Pan.monitor.CategoryChangeViewer.showForm = function (url, logCat) {
    this.task = new Ext.util.DelayedTask(function () {
        Pan.Msg.hide();
    });
    this.task.delay(120000);
    Pan.Msg.wait(_T("Connecting to the cloud..."));
    PanDirect.run('MonitorDirect.testURL', [{url: url}], function (response) {
        Pan.Msg.hide();
        this.task.cancel();
        if (Pan.base.json.path(response, '$.@status') != 'success' || !response.entries) {
            var msg = Pan.base.extractJsonText(response || {});
            if (msg) {
                Pan.Msg.alert("", msg);
                return;
            }
        }
        else {
            var currCat = '';
            Ext.each(response.entries, function (entry) {
                if (entry.indexOf('Cloud db') >= 0) {
                    var tokens = entry.split(' ');
                    currCat = tokens[1];
                    return false;
                }
            });
            if (response.entries.length < 2 || currCat == "cloud-unavailable") {
                Pan.Msg.alert(_T("Error"), _T("Error connecting to the server, please try again later. If this problem persists, you may have a connection issue."));
                return;
            }
            var urlParts = url.split('/');
            var urlData = [];
            var urlSubStr = '';
            Ext.each(urlParts, function (d) {
                urlSubStr = Ext.isEmpty(urlSubStr) ? d : urlSubStr + '/' + d;
                urlData.push([urlSubStr]);
            });
            var ok_handler = function () {
                var changeWin = this.findParentByType('pan-window');
                var fp = changeWin.findByItemId('requestForm').getForm();
                var rurl = changeWin.findByItemId('urlTxt').getValue()[0];
                var remail = changeWin.findByItemId('emailTxt').getValue();
                var rcomments = changeWin.findByItemId('comments').getValue();
                var sugCat = changeWin.findByItemId('suggestedCat').getValue();
                var currCat = changeWin.findByItemId('currentCat').getValue();
                if (sugCat == currCat) {
                    Pan.Msg.alert("", _T('Suggested category is the same as current category.'));
                    return;
                }
                if (fp.isValid()) {
                    var mask = new Pan.base.widgets.LoadMask(changeWin.el, {});
                    mask.show();
                    var params = {
                        urlText: rurl,
                        email: remail,
                        comments: rcomments,
                        currentCategory: currCat,
                        suggestedCategory: sugCat
                    };
                    PanDirect.run('MonitorDirect.requestCategoryChange', [params], function (result) {
                        mask.hide();
                        var msg = Pan.base.extractJsonText(result || {});
                        if (Pan.base.json.path(result, '$.@status') != 'success') {
                            if (!msg) {
                                msg = _T("Error in processing request");
                            }
                        }
                        else {
                            changeWin.close();
                        }
                        if (msg) {
                            Pan.Msg.alert(_T("Request Submitted"), msg);
                        }
                    });
                }
            };
            var catChangeWindow = new Pan.base.container.Window({
                width: 500,
                layout: 'fit',
                title: _T('Request Categorization Change'),
                closeAction: 'close',
                modal: true,
                border: false,
                items: {
                    xtype: 'pan-form',
                    cls: 'darkblue',
                    frame: false,
                    border: false,
                    labelWidth: 110,
                    monitorValid: true,
                    itemId: 'requestForm',
                    autoHeight: true,
                    defaults: {anchor: '100%'},
                    layoutConfig: {trackLabels: true},
                    bodyStyle: 'padding:5px 10px 10px;',
                    items: [{
                        xtype: 'pan-combo',
                        fieldLabel: _T("URL"),
                        itemId: 'urlTxt',
                        value: urlData[0],
                        mode: 'local',
                        triggerAction: 'all',
                        selectOnFocus: true,
                        typeAhead: true,
                        forceSelection: true,
                        displayField: 'value',
                        valueField: 'value',
                        store: new Ext.data.SimpleStore({fields: ['value'], data: urlData})
                    }, {
                        xtype: 'pan-textfield',
                        disabled: true,
                        itemId: 'logCat',
                        fieldLabel: _T("Log Category"),
                        value: logCat
                    }, {
                        xtype: 'pan-textfield',
                        hidden: logCat == currCat,
                        disabled: true,
                        itemId: 'currentCat',
                        fieldLabel: _T("Current Category"),
                        plugins: [new Ext.ux.FieldHelp(_T("Categorization on the server has been updated since this log entry was generated"))],
                        value: currCat
                    }, {
                        xtype: 'pan-compositefield',
                        combineErrors: false,
                        labelWidth: 110,
                        fieldLabel: _T("Suggested Category"),
                        itemId: 'suggestedCat',
                        items: [{
                            xtype: 'pan-directselectbox',
                            allowBlank: false,
                            hideLabel: true,
                            flex: 1,
                            forceSelection: false,
                            createFilterFn: function (property) {
                                return function (r) {
                                    if (r.data[property].match('not-resolved') || r.data[property].match('unknown') || r.data[property].match("private-ip-addresses") || r.data['type'].match('custom-url-category')) {
                                        return false;
                                    }
                                    else {
                                        return true;
                                    }
                                };
                            },
                            directFn: PanDirect.runCallback('MonitorDirect.getURLCategories')
                        }, {
                            xtype: 'pan-linkbutton',
                            style: 'padding-bottom: 0px',
                            text: _T('get descriptions'),
                            handler: function () {
                                var lp = Pan.common.Constants.PAN_CATEGORY_DESCRIPTIONS;
                                window.open(lp, '_blank');
                            }
                        }],
                        getValue: function () {
                            return this.items.itemAt(0).getValue();
                        }
                    }, {
                        xtype: 'pan-passwordverify',
                        maxLength: 128,
                        itemId: 'emailTxt',
                        allowBlank: true,
                        inputType: 'text',
                        vtype: 'email',
                        fieldLabel: _T("Email")
                    }, {
                        xtype: 'pan-textarea',
                        itemId: 'comments',
                        maxLength: 500,
                        fieldLabel: _T("Comments"),
                        regex: /^[^;|`&'\\"]*$/,
                        regexText: _T('Comments contain unsupported character(s)'),
                        plugins: [new Ext.ux.FieldHelp(_T("The following characters are not supported:\";|`&'\\."))]
                    }],
                    buttons: [{
                        text: _T('Send'),
                        xtype: 'pan-button',
                        formBind: true,
                        cls: 'default-btn',
                        handler: ok_handler
                    }, {
                        text: _T('Cancel'), xtype: 'pan-button', handler: function () {
                            this.findParentByType('pan-window').close();
                        }
                    }]
                }
            });
            catChangeWindow.show();
        }
    }, this);
};
Ext.namespace('Pan.monitor.session');
Pan.monitor.session.RowExpander = Ext.extend(Ext.ux.grid.RowExpander, {
    beforeExpand: function (record, body) {
        var loadMask = Pan.base.util.LoadMaskMgr.lookup(this.loadMaskId);
        if (loadMask) {
            if (!loadMask.el || !loadMask.el.dom) {
                Pan.base.util.LoadMaskMgr.unregister(this.loadMaskId);
                loadMask = null;
            }
        }
        if (!loadMask) {
            loadMask = new Pan.base.widgets.LoadMask(this.loadMaskId, {msg: _T("Please wait...")});
            if (loadMask)
                Pan.base.util.LoadMaskMgr.register(loadMask);
        }
        if (loadMask)
            loadMask.show();
        this.contentUpdater = {body: body, loadMask: loadMask};
        this.sessionId = record.data.id;
        PanDirect.run('MonitorDirect.getSessionById', [record.data.id], this.getSessionInfo.createDelegate(this));
        return Pan.monitor.session.RowExpander.superclass.beforeExpand.apply(this, arguments);
    }, getSessionInfo: function (data) {
        if (!this.contentUpdater)
            return;
        this.contentUpdater.loadMask.hide();
        this.contentUpdater.body.innerHTML = "<p>" + _T("Please wait") + " ...</p>";
        if (data && data.result) {
            var s = data.result;
            this.contentUpdater.body.innerHTML = this.applyTemplate(s);
        }
        else {
            this.contentUpdater.body.innerHTML = "<p>" + _T("No data available") + "</p>";
        }
    }, applyTemplate: function (session) {
        if (!this.contentTpl) {
            this.contentTpl = new Ext.XTemplate('<table style="padding-left: 20px;">', '<tr><th colspan=2><h2>' + _T('Detail') + '</h2></th><th colspan=2><h2>Flow 1</h2></th><th colspan=2><h2>Flow 2</h2></th></tr>', '<tr>', '<td style="width:175px;">', '<tpl for="detail">', '<tpl if="this.hasValue(value)">', '<div><strong>{name}</strong></div>', '</tpl>', '</tpl>', '</td>', '<td style="width:175px;">', '<tpl for="detail">', '<tpl if="this.hasValue(value)">', '<div>{value}</div>', '</tpl>', '</tpl>', '</td>', '<td style="width:100px;">', '<tpl for="flow1">', '<tpl if="this.hasValue(value)">', '<div><strong>{name}</strong></div>', '</tpl>', '</tpl>', '</td>', '<td style="width:120px;">', '<tpl for="flow1">', '<tpl if="this.hasValue(value)">', '<div>{value}</div>', '</tpl>', '</tpl>', '</td>', '<td style="width:100px;">', '<tpl for="flow2">', '<tpl if="this.hasValue(value)">', '<div><strong>{name}</strong></div>', '</tpl>', '</tpl>', '</td>', '<td style="width:120px;">', '<tpl for="flow2">', '<tpl if="this.hasValue(value)">', '<div>{value}</div>', '</tpl>', '</tpl>', '</td>', '</tr>', '</table>', {
                hasValue: function (value) {
                    return !Ext.isEmpty(value);
                }
            });
            this.contentTpl.compile();
        }
        var d = session;
        var f1 = session['c2s'];
        var f2 = session['s2c'];
        var start_time = d.start_time;
        var dt = Date.parseDate(start_time, "D M  j H:i:s Y\n");
        if (dt)
            start_time = dt.format('m/d H:i:s');
        var vsys = d.vsys;
        var map = Pan.global.getAccessibleLocList(true, true, true);
        var vsysName = map[vsys];
        var detail = [{name: _T('Session ID'), value: this.sessionId}, {
            name: _T('Timeout'),
            value: d.timeout
        }, {name: _T('Time To Live'), value: d.ttl}, {
            name: _T('Byte Count'),
            value: d.octets
        }, {name: _T('Layer 7 Packet'), value: d.packets}, {
            name: _T('Virtual System'),
            value: vsysName || vsys
        }, {name: _T('Application'), value: d.application}, {
            name: _T('Protocol'),
            value: f1.proto || f2.proto
        }, {name: _T('Tunnel ID'), value: d['tunnel-id']}, {
            name: _T('Security Rule'),
            value: d.rule
        }, {name: _T('Authentication Rule'), value: d['authentication-rule']}, {
            name: _T('NAT Source'),
            value: d['nat-src']
        }, {name: _T('NAT Destination'), value: d['nat-dst']}, {
            name: _T('NAT Rule'),
            value: d['nat-rule']
        }, {name: _T('URL Category'), value: d['url-cat']}, {
            name: _T('QoS Rule'),
            value: d['qos-rule']
        }, {name: _T('QoS Class'), value: d['qos-class']}, {
            name: _T('Prediction By'),
            value: d['predict-by']
        }, {name: _T('Prediction Match Once'), value: d['predict-once']}, {
            name: _T('Prediction By Source'),
            value: d['predict-src']
        }, {name: _T('Use Parent Policy'), value: d['parent-policy']}, {
            name: _T('Parent Session'),
            value: d['parent-session']
        }, {name: _T('Refresh Parent'), value: d['parent-norefresh']}, {
            name: _T('Created By Syn Cookie'),
            value: d['syncookie']
        }, {name: _T('To Host Session'), value: d['host-session']}, {
            name: _T('Traverse Tunnel'),
            value: d['tunnel-session']
        }, {name: _T('Captive Portal'), value: d['captive-portal']}, {
            name: _T('DSCP Marking'),
            value: d['ds-dscp']
        }, {name: _T('IP Precedence Marking'), value: d['ds-prec']}, {
            name: _T('DSCP/TOS'),
            value: d['dscp-prec-name']
        }, {name: _T('Proxy Status'), value: d['prxy-status']}, {
            name: _T('Session End Log'),
            value: d['sess-log']
        }, {name: _T('Session In Ager'), value: d['sess-ager']}, {
            name: _T('Session From HA'),
            value: d['sess-ha-sync']
        }];
        var flow1 = [{name: _T('Direction'), value: 'c2s'}, {
            name: _T('From Zone'),
            value: f1['source-zone']
        }, {name: _T('Source'), value: f1.source}, {name: _T('Destination'), value: f1.dst}, {
            name: _T('From Port'),
            value: f1.sport
        }, {name: _T('To Port'), value: f1.dport}, {name: _T('From User'), value: f1['src-user']}, {
            name: _T('To User'),
            value: f1['dst-user']
        }, {name: _T('State'), value: f1.state}, {name: _T('Type'), value: f1.type}];
        var flow2 = [{name: _T('Direction'), value: 's2c'}, {
            name: _T('From Zone'),
            value: f2['source-zone']
        }, {name: _T('Source'), value: f2.source}, {name: _T('Destination'), value: f2.dst}, {
            name: _T('From Port'),
            value: f2.sport
        }, {name: _T('To Port'), value: f2.dport}, {name: _T('From User'), value: f2['src-user']}, {
            name: _T('To User'),
            value: f2['dst-user']
        }, {name: _T('State'), value: f2.state}, {name: _T('Type'), value: f2.type}];
        return this.contentTpl.apply({detail: detail, flow1: flow1, flow2: flow2});
    }
});
Ext.reg('session-rowexpander', Pan.monitor.session.RowExpander);
Ext.namespace('Pan.monitor.session');
Pan.monitor.session.FilterPanel = Ext.extend(Ext.grid.PropertyGrid, {
    constructor: function (cfg) {
        Pan.monitor.session.FilterPanel.superclass.constructor.call(this, Ext.apply(cfg, {
            browserView: cfg.browserView,
            loadMaskId: cfg.loadMaskId,
            source: Ext.apply(cfg.browserView.getDefaultFilters(), cfg.filters),
            propertyNames: cfg.browserView.getFilterTitles()
        }));
    }, initComponent: function () {
        Ext.apply(this, {
            stripeRows: true,
            frame: true,
            height: 500,
            viewConfig: {forceFit: true, scrollOffset: Pan.base.Constants.scrollOffset}
        });
        Pan.monitor.session.FilterPanel.superclass.initComponent.apply(this, arguments);
        this.browserView.on({
            scope: this,
            addfilter: this.onAddFilter,
            addfilters: this.onAddFilters,
            clearfilters: this.onClearFilters
        });
    }, onAddFilter: function (view, filter, key, value) {
        var source = this.getSource();
        if (source) {
            source[filter] = value;
            this.setSource(source);
        }
    }, onAddFilters: function (view, filters) {
        var source = this.browserView.getDefaultFilters();
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                source[key] = "";
                if (!Ext.isEmpty(filters[key])) {
                    source[key] = filters[key];
                }
            }
        }
        this.setSource(source);
    }, onClearFilters: function () {
        var source = this.browserView.getDefaultFilters();
        this.setSource(source);
    }
});
Ext.reg('session-filters', Pan.monitor.session.FilterPanel);
Ext.namespace('Pan.monitor.session');
(function () {
    Ext.apply(Pan.monitor.session, {
        filterRenderer: function (val, column, record) {
            var vsys = record.get('vsys');
            if (val == 'True') val = 'yes';
            if (val == 'False') val = 'no';
            var template = '<a class="subtle x-hyperlink" onclick="Pan.monitor.session.addFilter(\'{0}\', \'{1}\', \'{2}\');"><span>{1}</span></a>';
            return String.format(template, this.dataIndex, val, vsys);
        }, zoneRenderer: function (val, column, record) {
            var selectedVsys = Pan.global.getLoc().val;
            var vsys = record.get('vsys');
            var template;
            if (selectedVsys != "") {
                template = '<a class="subtle x-hyperlink" onclick="Pan.monitor.session.addFilter(\'{0}\', \'{1}\', \'{2}\');"><span>{1}</span></a>';
            }
            else {
                template = '<span>{1}</span>';
            }
            return String.format(template, this.dataIndex, val, vsys);
        }, vsysRenderer: function (val) {
            var vsys = val;
            var map = Pan.global.getAccessibleLocList(true, true, true);
            var vsysName = map[vsys];
            return vsysName || vsys;
        }, killSessionRenderer: function (sessionId) {
            var tooltips = _T("Clear session");
            var img = "../images/x_blue.gif";
            var tpl = ''
                + '<div id="session_{0}" style="text-align:center;height:13px;overflow:visible">'
                + '<a class="x-hyperlink" onclick="Pan.monitor.session.killSession({1})">'
                + '<img title="{2}" style="vertical-align:-3px" src="{3}" />'
                + '</div></a>';
            if (Pan.base.admin.getPermission('monitor/session-browser') === 'enable') {
                return String.format(tpl, sessionId, sessionId, tooltips, img);
            }
            return '';
        }, killSession: function (sid) {
            PanDirect.run('MonitorDirect.killSessionById', [sid]);
            var id = "session_" + sid;
            var el = Ext.get(id);
            if (el && el.setVisible) {
                el.setVisible(false);
            }
        }
    });
})();
Pan.monitor.session.Browser = Ext.extend(Pan.base.component.Browser, {
    constructor: function (cfg) {
        var expander = new Pan.monitor.session.RowExpander({
            loadMaskId: cfg.loadMaskId, tpl: new Ext.Template('<p>' +
                _T('Retrieving session information for <b>{id}</b>, please wait...') + '</p>')
        });
        Pan.monitor.session.Browser.superclass.constructor.call(this, Ext.apply(cfg, {
            loadMaskId: cfg.loadMaskId,
            itemId: 'session-browser',
            gridPlugins: expander,
            columnModel: {
                columns: [expander, {
                    header: _T('Start Time'),
                    width: 95,
                    dataIndex: 'start-time',
                    xtype: 'datecolumn',
                    format: 'm/d H:i:s'
                }, {
                    header: _T('From Zone'),
                    width: 70,
                    dataIndex: 'from',
                    renderer: Pan.monitor.session.zoneRenderer
                }, {
                    header: _T('To Zone'),
                    width: 60,
                    dataIndex: 'to',
                    renderer: Pan.monitor.session.zoneRenderer
                }, {
                    header: _T('Source'),
                    width: 80,
                    dataIndex: 'source',
                    renderer: Pan.monitor.session.filterRenderer
                }, {
                    header: _T('Destination'),
                    width: 80,
                    dataIndex: 'dst',
                    renderer: Pan.monitor.session.filterRenderer
                }, {
                    header: _T('From Port'),
                    width: 70,
                    dataIndex: 'sport',
                    renderer: Pan.monitor.session.filterRenderer
                }, {
                    header: _T('To Port'),
                    width: 60,
                    dataIndex: 'dport',
                    renderer: Pan.monitor.session.filterRenderer
                }, {
                    header: _T('Protocol'),
                    width: 65,
                    dataIndex: 'proto',
                    renderer: Pan.monitor.session.filterRenderer
                }, {
                    header: _T('Application'),
                    width: 75,
                    dataIndex: 'application',
                    renderer: Pan.monitor.session.filterRenderer
                }, {
                    header: _T('State'),
                    width: 60,
                    dataIndex: 'state',
                    renderer: Pan.monitor.session.filterRenderer,
                    hidden: true
                }, {
                    header: _T('Rule'),
                    width: 60,
                    dataIndex: 'security-rule',
                    renderer: Pan.monitor.session.filterRenderer
                }, {
                    header: _T('Ingress I/F'),
                    width: 75,
                    dataIndex: 'ingress',
                    renderer: Pan.monitor.session.filterRenderer
                }, {
                    header: _T('Egress I/F'),
                    width: 75,
                    dataIndex: 'egress',
                    renderer: Pan.monitor.session.filterRenderer
                }, {
                    header: _T('Decrypted'),
                    width: 50,
                    dataIndex: 'proxy',
                    renderer: Pan.monitor.session.filterRenderer,
                    align: 'right',
                    hidden: true
                }, {
                    header: _T('Decrypt Mirror'),
                    width: 50,
                    dataIndex: 'decrypt-mirror',
                    renderer: Pan.monitor.session.filterRenderer,
                    align: 'center',
                    hidden: true
                }, {
                    header: _T('Bytes'),
                    width: 50,
                    dataIndex: 'total-byte-count',
                    renderer: Pan.monitor.session.filterRenderer,
                    align: 'center'
                }, {
                    header: _T('Virtual System'),
                    width: 100,
                    dataIndex: 'vsys',
                    renderer: Pan.monitor.session.vsysRenderer,
                    id: 'vsys'
                }, {
                    header: _T('Clear'),
                    width: 40,
                    dataIndex: 'id',
                    renderer: Pan.monitor.session.killSessionRenderer,
                    menuDisabled: true
                }], defaults: {sortable: false, menuDisabled: false}, viewConfig: {forceFit: false}
            },
            recordFields: [{name: 'id', mapping: 'idx'}, {name: 'start-time', mapping: 'start-time'}, {
                name: 'from',
                mapping: 'from'
            }, {name: 'to', mapping: 'to'}, {name: 'source', mapping: 'source'}, {
                name: 'dst',
                mapping: 'dst'
            }, {name: 'sport', mapping: 'sport'}, {name: 'dport', mapping: 'dport'}, {
                name: 'proto',
                mapping: 'proto'
            }, {name: 'application', mapping: 'application'}, {name: 'state', mapping: 'state'}, {
                name: 'security-rule',
                mapping: 'security-rule'
            }, {name: 'ingress', mapping: 'ingress'}, {name: 'egress', mapping: 'egress'}, {
                name: 'proxy',
                mapping: 'proxy'
            }, {name: 'decrypt-mirror', mapping: 'decrypt-mirror'}, {
                name: 'total-byte-count',
                mapping: 'total-byte-count'
            }, {name: 'vsys', mapping: 'vsys'}]
        }));
    }
});
Ext.reg('session-browser', Pan.monitor.session.Browser);
Ext.namespace('Pan.monitor.session');
Pan.monitor.session.SessionBrowserViewer = Ext.extend(Pan.base.container.Panel, {
    FILTERS: {
        'ingress-interface': {title: _T('Ingress I/F'), value: '', mapping: ['ingress']},
        'egress-interface': {title: _T('Egress I/F'), value: '', mapping: ['egress']},
        'from': {title: _T('From Zone'), value: '', mapping: ['from']},
        'to': {title: _T('To Zone'), value: '', mapping: ['to']},
        'source': {title: _T('Source'), value: '', mapping: ['source']},
        'source-port': {title: _T('From Port'), value: '', mapping: ['sport']},
        'source-user': {title: _T('From User'), value: '', mapping: ['src_user']},
        'destination': {title: _T('Destination'), value: '', mapping: ['dst']},
        'destination-port': {title: _T('To Port'), value: '', mapping: ['dport']},
        'destination-user': {title: _T('To User'), value: '', mapping: ['dst_user']},
        'application': {title: _T('Application'), value: '', mapping: ['application']},
        'protocol': {title: _T('Protocol'), value: '', mapping: ['proto']},
        'min-kb': {title: _T('Minimum KB'), value: '', mapping: ['total-byte-count']},
        'type': {title: _T('Flow Type'), value: '', mapping: []},
        'state': {title: _T('State'), value: '', mapping: ['state']},
        'qos-node-id': {title: _T('QoS Node ID'), value: '', mapping: []},
        'qos-class': {title: _T('QoS Class'), value: '', mapping: []},
        'ssl-decrypt': {title: _T('Decrypted'), value: '', mapping: ['proxy']},
        'decrypt-mirror': {title: _T('Decrypt Mirror'), value: '', mapping: []},
        'nat': {title: _T('NAT'), value: '', mapping: []},
        'nat-rule': {title: _T('NAT Rule'), value: '', mapping: []},
        'rule': {title: _T('Rule'), value: '', mapping: ['security-rule']},
        'qos-rule': {title: _T('QoS Rule'), value: '', mapping: []},
        'pbf-rule': {title: _T('PBF Rule'), value: '', mapping: []}
    }, constructor: function (cfg) {
        this.addEvents("addfilter", "addfilters", "clearfilters");
        Pan.monitor.session.SessionBrowserViewer.superclass.constructor.call(this, Ext.apply(cfg, {filters: cfg.filters || {}}));
    }, initComponent: function () {
        var sessionBrowserID = 'sessionBrowser';
        this.loadMaskId = sessionBrowserID;
        Ext.apply(this, {
            layout: 'border', items: [{
                region: 'center',
                id: 'browser-panel',
                xtype: 'panel',
                border: false,
                layout: 'fit',
                items: {
                    xtype: 'session-browser',
                    useToolbarExportGridAction: true,
                    exportMenu: {
                        iconCls: "icon-export-pdv-csv",
                        tooltip: _T('Export table'),
                        text: _T('PDF/CSV'),
                        scope: this,
                        handler: function () {
                            var grid = Ext.getCmp('sessionBrowser');
                            var headers = [];
                            var columns = [];
                            var excludedColumnDataIndex = ['id', ''];
                            var storeName = 'sessionstore';
                            var filterString = Ext.getCmp('filterStr').getValue() || '';
                            _.forEach(grid.columnModel.columns, function (column) {
                                if ((_.isUndefined(column.hidden) || column.hidden === false) && (_.indexOf(excludedColumnDataIndex, column.dataIndex) == -1)) {
                                    headers.push(column.header);
                                    columns.push(column.dataIndex);
                                }
                            });
                            var options = {
                                headers: headers,
                                columns: columns,
                                sourceStore: storeName,
                                dataLoaded: true,
                                filterString: filterString
                            };
                            var panExportWindow = Pan.common.exporter.view.ExportWindow;
                            panExportWindow.createStoreExportWindow(options);
                        }
                    },
                    id: sessionBrowserID,
                    name: 'sessionBrowser',
                    loadMaskId: this.loadMaskId,
                    storeId: 'sessionstore'
                },
                tbar: {
                    cls: Pan.base.Constants.uiThemes[0],
                    items: [{xtype: 'tbspacer'}, {xtype: "tbtext", text: _T("Filters"), width: 40}, {
                        xtype: "textfield", width: 750, id: 'filterStr', listeners: {
                            scope: this, change: function (textField, newValue) {
                                try {
                                    this.filters = this.parseFilters(newValue);
                                    this.applyFilters(this.filters);
                                    this.fireEvent('addfilters', this, this.filters);
                                }
                                catch (e) {
                                    textField.markInvalid(e);
                                    this.filters = {};
                                    this.applyFilters(this.filters);
                                    this.fireEvent("clearfilters", this);
                                }
                            }, specialkey: function (textField, e) {
                                if (e.getKey() == e.ENTER) {
                                    try {
                                        var line = textField.getValue();
                                        this.filters = this.parseFilters(line);
                                        this.applyFilters(this.filters);
                                        this.fireEvent('addfilters', this, this.filters);
                                    }
                                    catch (ex) {
                                        textField.markInvalid(ex);
                                        this.filters = {};
                                        this.applyFilters(this.filters);
                                        this.fireEvent("clearfilters", this);
                                    }
                                }
                            }
                        }
                    }, {xtype: 'tbspacer'}, {
                        xtype: 'tbbutton', iconCls: 'icon-run', scope: this, handler: function () {
                            var field = Ext.getCmp('filterStr');
                            var line = field.getValue();
                            var values = this.parseFilters(line);
                            this.applyFilters(values);
                            this.fireEvent('addfilters', this, values);
                        }
                    }, {
                        xtype: 'tbbutton', iconCls: 'icon-clear', scope: this, handler: function () {
                            this.fireEvent("clearfilters", this);
                            var field = Ext.getCmp('filterStr');
                            field.setValue('');
                            this.filters = {};
                            this.applyFilters(this.filters);
                        }
                    }, {
                        xtype: 'tbbutton', iconCls: 'icon-add', scope: this, handler: function () {
                            var eastPanel = Ext.getCmp('east-panel');
                            eastPanel.toggleCollapse(true);
                        }
                    }]
                }
            }, {
                region: 'east',
                split: true,
                id: 'east-panel',
                collapseMode: 'mini',
                width: 210,
                minSize: 175,
                maxSize: 210,
                collapsible: true,
                collapsed: true,
                items: {
                    xtype: "session-filters",
                    title: _T('Filters'),
                    id: 'filters-grid',
                    browserView: this,
                    filters: this.filters,
                    loadMaskId: this.loadMaskId,
                    bbar: [{
                        text: _T('Run'),
                        iconCls: 'icon-run',
                        tooltip: _T('Get sessions'),
                        scope: this,
                        handler: function () {
                            var filtergrid = Ext.getCmp("filters-grid");
                            var values = filtergrid.getSource();
                            this.applyFilters(values);
                        }
                    }]
                }
            }]
        });
        Pan.monitor.session.SessionBrowserViewer.superclass.initComponent.apply(this, arguments);
        Pan.monitor.session.addFilter = this.addFilter.createDelegate(this);
        this.filters = {};
        var statefilter = Ext.state.Manager.get('session_browser_filter_field');
        if (statefilter && statefilter.value) {
            this.filters = statefilter.value;
        }
        this.setFilterValues();
        var filtersStr = this.convertFilters2String(this.filters);
        var vsys;
        if (Pan.global.isMultiVsys()) {
            vsys = Pan.global.getLoc().val;
            if (vsys.indexOf('localhost.localdomain') >= 0 || vsys == '') {
                vsys = 'any';
            }
        }
        PanDirect.run('MonitorDirect.getSessionAll', [filtersStr, vsys], this.getSessionSummary.createDelegate(this));
    }, getSessionSummary: function (data) {
        var sessionStore = Ext.StoreMgr.get('sessionstore');
        if (!sessionStore || !data) {
            return;
        }
        if (data["@status"] === "error") {
            if (Ext.isDefined(data.msg)) {
                var error = "";
                if (Ext.isString(data.msg) || (Ext.isObject(data.msg) && Ext.isString(data.msg.line))) {
                    error = data.msg.line || data.msg;
                }
                else if (Ext.isArray(data.msg) || (Ext.isObject(data.msg) && Ext.isString(data.msg.line))) {
                    error = "<ul>";
                    Ext.each(data.msg.line || data.msg, function (line) {
                        error += "<li>" + line + "</li>";
                    });
                    error += "</ul>";
                }
                if (!Ext.isEmpty(error)) {
                    var field = Ext.getCmp('filterStr');
                    if (!Ext.isEmpty(field.getValue()))
                        field.markInvalid(error);
                    Pan.base.msg.error(error);
                }
                else {
                    Pan.base.msg.error(_T("An error occurred while retrieving the sessions."));
                }
            }
        }
        var sessions = [];
        if (data && data.result) {
            sessions = data.result['entry'] ? data.result['entry'] : [];
            sessions = sessions.session ? [sessions.session] : sessions;
        }
        sessionStore.loadData(sessions);
    }, convertFilters2String: function (values) {
        Ext.state.Manager.set("session_browser_filter_field", {value: values});
        var filtersStr = '';
        var template = '<{0}>{1}</{0}>';
        for (var key in values) {
            if (values.hasOwnProperty(key)) {
                var value = values[key];
                if (value) {
                    filtersStr += String.format(template, key, value);
                }
            }
        }
        if (Pan.global.isMultiVsys()) {
            var vsys = Pan.global.getLoc().val;
            if (vsys.indexOf('localhost.localdomain') >= 0 || vsys == '') {
                vsys = 'any';
            }
            if (!Ext.isEmpty(vsys)) {
                filtersStr += String.format(template, 'vsys-name', vsys);
            }
        }
        return filtersStr;
    }, parseFilters: function (line) {
        var items = line.split(/\s+and\s+/);
        var values = {};
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (Ext.isEmpty(item))
                continue;
            item = item.replace(/['()]/g, '');
            var filter = item.split(/\s+eq\s+/);
            if (filter.length > 1) {
                values[filter[0]] = filter[1];
            }
        }
        return values;
    }, applyFilters: function (values) {
        var filtersStr = this.convertFilters2String(values);
        var vsys;
        if (Pan.global.isMultiVsys()) {
            vsys = Pan.global.getLoc().val;
            if (vsys.indexOf('localhost.localdomain') >= 0 || vsys == '') {
                vsys = 'any';
            }
        }
        PanDirect.run('MonitorDirect.getSessionAll', [filtersStr, vsys], this.getSessionSummary.createDelegate(this));
    }, setFilterValues: function () {
        var template = "({0} eq '{1}')";
        var str = '';
        for (var att in this.filters) {
            if (this.filters.hasOwnProperty(att)) {
                if (!Ext.isEmpty(str))
                    str += ' and ';
                str += String.format(template, att, this.filters[att]);
            }
        }
        var field = Ext.getCmp('filterStr');
        field.setValue(str);
    }, addFilter: function (key, value) {
        var filter = this.getMappingFilter(key);
        if (filter == 'min-kb') {
            value = Math.floor(value / 1024);
            value = (value == 0 ? 1 : value);
        }
        this.filters[filter] = (filter == 'state') ? Ext.util.Format.lowercase(value) : value;
        this.setFilterValues();
        this.fireEvent("addfilter", this, filter, key, value);
        var field = Ext.getCmp('filterStr');
        field.focus();
    }, getDefaultFilters: function () {
        var ret = {};
        for (var key in this.FILTERS) {
            if (this.FILTERS.hasOwnProperty(key)) {
                var item = this.FILTERS[key];
                ret[key] = item.value;
            }
        }
        return ret;
    }, getFilterTitles: function () {
        var ret = {};
        for (var key in this.FILTERS) {
            if (this.FILTERS.hasOwnProperty(key)) {
                var item = this.FILTERS[key];
                ret[key] = item.title;
            }
        }
        return ret;
    }, getMappingFilter: function (key) {
        for (var filter in this.FILTERS) {
            if (this.FILTERS.hasOwnProperty(filter)) {
                var item = this.FILTERS[filter];
                var mapping = item.mapping;
                if (mapping.indexOf(key) != -1)
                    return filter;
            }
        }
        return key;
    }
});
Pan.reg("Monitor/Session Browser", Pan.monitor.session.SessionBrowserViewer);
Ext.ns('Pan.monitor.pcap', 'Pan.monitor.pcap.action');
Pan.reg("filterFormEnable", Pan.appframework.modelview.PanToggleFieldViewer, {
    rbaPath: 'monitor/packet-capture',
    storeInputs: {objectType: _T('Filter Form Enable')},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: 'FilterFormEnable',
            api: {readSchema: "$.ops.operations.debug.dataplane.packet-diag.set.filter"}
        }
    },
    fields: [{name: "name", mapping: "@name"}],
    recordForm: {
        hideLabels: true,
        width: 150,
        items: [{
            itemId: "$.on",
            xtype: 'pan-togglefield',
            hideLabel: true,
            onText: _T("ON"),
            offText: _T("OFF"),
            resizeHandle: true,
            avail: Pan.appframework.action.ActionMgr.getPermissionAvail()
        }]
    }
});
Pan.reg("preparseFormEnable", Pan.appframework.modelview.PanToggleFieldViewer, {
    rbaPath: 'monitor/packet-capture',
    storeInputs: {objectType: _T("Enable Filter Pre-Parse")},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: 'FilterFormPreParse',
            api: {readSchema: "$.ops.operations.debug.dataplane.packet-diag.set.filter"}
        }
    },
    fields: [{name: "name", mapping: "@name"}],
    recordForm: {
        hideLabels: true,
        width: 150,
        items: [{
            itemId: '$.pre-parse-match',
            xtype: 'pan-togglefield',
            hideLabel: true,
            onText: _T("ON"),
            offText: _T("OFF"),
            resizeHandle: true,
            avail: Pan.appframework.action.ActionMgr.getPermissionAvail()
        }]
    }
});
Pan.monitor.pcap.FilterEdit = Ext.extend(Pan.appframework.modelview.PanRecordFormViewer, {
    hasGridFilter: false,
    rbaPath: 'monitor/packet-capture',
    storeInputs: {nameIdProperty: "name", objectType: _T('Packet Capture Filter')},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: 'PcapPacketDiagConfigFilter',
            api: {readSchema: "$.ops.operations.debug.dataplane.packet-diag.set.filter"}
        }
    },
    fields: [{name: "name", mapping: "index.entry.@name"}, {
        name: "$.index.entry",
        uiHint: {
            allowBlank: true,
            height: 150,
            bbar: ["addRecordAction", "deleteRecordAction", 'setPacketCaptureFilterAction']
        }
    }, {
        name: "$.index.entry.*.@name",
        uiHint: {
            fieldLabel: _T("Id"), builder: 'PanCompletionBuilder', completion: function () {
                return PanDirect.runCallback('MonitorDirect.completePcapFilterIds');
            }, width: 50
        }
    }, {
        name: "$.index.entry.*.match.ingress-interface",
        uiHint: {
            fieldLabel: _T("Ingress Interface"), builder: 'PanCompletionBuilder', completion: function () {
                return PanDirect.runCallback('MonitorDirect.completePcapInterface');
            }, width: 120
        }
    }, {
        name: "$.index.entry.*.match.source",
        uiHint: {fieldLabel: _T("Source"), width: 172}
    }, {
        name: "$.index.entry.*.match.destination",
        uiHint: {fieldLabel: _T("Destination"), width: 172}
    }, {
        name: "$.index.entry.*.match.source-port",
        uiHint: {fieldLabel: _T("Src Port"), width: 70}
    }, {
        name: "$.index.entry.*.match.destination-port",
        uiHint: {fieldLabel: _T("Dest Port"), width: 70}
    }, {
        name: "$.index.entry.*.match.protocol",
        uiHint: {fieldLabel: _T("Proto"), width: 80}
    }, {
        name: "$.index.entry.*.match.non-ip",
        uiHint: {fieldLabel: _T("Non-IP"), width: 75}
    }, {name: "$.index.entry.*.match.ipv6-only", uiHint: {fieldLabel: _T("IPv6"), width: 60}}],
    storeConfig: {ztype: Pan.appframework.modelview.PanGridStore},
    recordFormTitle: _T('Packet Capture Filter'),
    recordForm: {
        items: [{itemId: '$.index.entry', hasGridFilter: false}],
        windowConfig: {height: 500, width: 800, iconCls: undefined},
        afterUpdateRecord: function () {
            Pan.appframework.PanAppInterface.refresh();
        }
    }
});
Pan.reg("Monitor/Packet Capture/Filter Edit", Pan.monitor.pcap.FilterEdit);
Pan.monitor.pcap.fileRegexText = _T("File name should begin with a letter and can have letters, digits, '.' , ' _' , and '-'.");
Pan.monitor.pcap.clearAllUtil = {
    clearAll: function () {
        Pan.Msg.confirm(_T("Clear All Settings"), _T("Are you sure you want to clear all packet capture settings?"), function (btn) {
            if (btn == 'yes') {
                PanDirect.run('MonitorDirect.pcapClearAllSettings', ["dummy"], function (result) {
                    Pan.appframework.PanAppInterface.refresh();
                    if (Pan.base.json.path(result, '$.@status') == 'success') {
                        Pan.base.msg.info(_T('PCAP settings cleared'));
                    }
                    else {
                        Pan.base.msg.error(_T('Error clearing PCAP settings'));
                    }
                });
            }
            else {
            }
        });
    }
};
Pan.monitor.pcap.PcapPacketDiagClearAllPanelViewer = Ext.extend(Pan.base.container.Panel, {
    padding: 10,
    rbaPath: 'monitor/packet-capture',
    layout: "form",
    title: _T('Settings'),
    initComponent: function () {
        Ext.apply(this, {
            items: [{
                xtype: "pan-form",
                border: false,
                afterinitCompleted: true,
                items: [{
                    xtype: 'pan-linkbutton',
                    text: _T('Clear All Settings'),
                    iconCls: 'icon-setup',
                    handler: function (element, config, event) {
                        return Pan.monitor.pcap.clearAllUtil.clearAll(element, config, event);
                    }
                }]
            }]
        });
        Pan.monitor.pcap.PcapPacketDiagClearAllPanelViewer.superclass.initComponent.apply(this, arguments);
    }
});
Pan.reg('PcapPacketDiagClearAllPanelViewer', Pan.monitor.pcap.PcapPacketDiagClearAllPanelViewer);
Pan.monitor.pcap.PcapPacketDiagFilteringViewer = Ext.extend(Pan.base.container.Panel, {
    padding: 10,
    rbaPath: 'monitor/packet-capture',
    layout: "form",
    cls: 'white',
    title: _T('Configure Filtering'),
    initComponent: function () {
        Ext.apply(this, {
            items: [{
                xtype: 'pan-container',
                layout: 'column',
                align: 'left',
                items: [{
                    xtype: "pan-linkbutton",
                    text: _T("Manage Filters"),
                    iconCls: 'icon-setup',
                    atype: 'panViewerWindowAction',
                    treePath: "Monitor/Packet Capture/Filter Edit",
                    columnWidth: 0.20
                }, {
                    xtype: "label",
                    text: _T("Loading..."),
                    labelSeparator: "",
                    itemId: "filtercount",
                    id: "filtercount",
                    style: 'padding:7px;',
                    columnWidth: 0.80
                }]
            }, {
                xtype: 'pan-container',
                layout: 'toolbar',
                align: 'left',
                items: [{xtype: 'label', text: _T('Filtering')}, {
                    xtype: "spacer",
                    width: 5
                }, Pan.create({treePath: "filterFormEnable", width: 70}), {xtype: "spacer", width: 5}, {
                    xtype: 'label',
                    text: _T('Pre-Parse Match')
                }, {xtype: "spacer", width: 5}, Pan.create({treePath: "preparseFormEnable", width: 65})]
            }], listeners: {
                'render': function () {
                    PanDirect.run('MonitorDirect.getFilterCount', ["dummy"], function (result, t) {
                        this.addEvents("countloaded");
                        this.addListener("countloaded", function (result) {
                            var filterCount = this.findByItemId('filtercount');
                            if (filterCount) {
                                if (Pan.base.json.path(result, '$.@status') == 'success') {
                                    filterCount.setText("[" + result.result.entry[0].text + "]");
                                }
                                else {
                                    filterCount.setText("Error in getting filter counts");
                                }
                            }
                        }, this);
                        this.fireEvent("countloaded", result, t);
                    }, this);
                }, scope: this
            }
        });
        Pan.monitor.pcap.PcapPacketDiagFilteringViewer.superclass.initComponent.apply(this, arguments);
    }
});
Pan.reg('PcapPacketDiagFilteringViewer', Pan.monitor.pcap.PcapPacketDiagFilteringViewer);
Pan.reg("captureFormEnable", Pan.appframework.modelview.PanToggleFieldViewer, {
    rbaPath: 'monitor/packet-capture',
    cls: "white",
    storeInputs: {objectType: _T('Capture Form Enable')},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: 'CaptureFormEnable',
            api: {readSchema: "$.ops.operations.debug.dataplane.packet-diag.set.filter"}
        }
    },
    fields: [{name: "name", mapping: "@name"}],
    recordForm: {
        hideLabels: true,
        width: 150,
        items: [{
            itemId: '$.on',
            xtype: 'pan-togglefield',
            hideLabel: true,
            onText: _T("ON"),
            offText: _T("OFF"),
            resizeHandle: true,
            avail: Pan.appframework.action.ActionMgr.getPermissionAvail()
        }],
        showConfirmationOnOK: function (recordForm, okFunc, cancelFunc) {
            var val = recordForm.findByItemId("$.on").getValue();
            if (val) {
                var pcapViewer = this.findParentByInstanceof(Pan.monitor.pcap.PcapViewer);
                var filterEnabled = pcapViewer.findByItemId("PcapPacketDiagFilteringViewer").findByItemId("$.on").getValue();
                var filterCount = Ext.get('filtercount');
                if (filterCount) {
                    var msg;
                    var title = _T("Packet Capture Warning");
                    var filterText = filterCount.dom.innerHTML;
                    var filterRealCount = filterText.substring(filterText.indexOf('[') + 1, filterText.indexOf("/"));
                    var filterRealCountInt = parseInt(filterRealCount, 10);
                    if (filterRealCountInt <= 0 || !filterEnabled) {
                        msg = _T("Packet Capture is for troubleshooting only. This feature can cause the system performance to degrade and should be used only when necessary.") + "<br /> <br /><B>" +
                            _T("Packet Capture without a filter will cause all traffic to be captured. This can cause the system performance to degrade drastically.") + "</B><br /><br /> " +
                            _T("After the capture is complete, please remember to disable the feature.") + "<br /><br />" + _T("Do you want to continue?");
                        Pan.Msg.showConfirmationOnOKDialog({
                            title: title,
                            msg: msg,
                            buttons: Ext.Msg.OKCANCEL,
                            scope: recordForm,
                            onOk: okFunc,
                            onCancel: cancelFunc
                        });
                    }
                    else {
                        msg = _T("Packet Capture is for troubleshooting only. This feature can cause the system performance to degrade and should be used only when necessary.") + "<br /> <br />" +
                            _T("After the capture is complete, please remember to disable the feature.") + " <br /> <br />" + _T("Do you want to continue?");
                        Pan.Msg.showConfirmationOnOKDialog({
                            title: title,
                            msg: msg,
                            scope: recordForm,
                            buttons: Ext.Msg.OKCANCEL,
                            onOk: okFunc,
                            onCancel: cancelFunc
                        });
                    }
                }
            }
            else {
                return okFunc.call(recordForm);
            }
        }
    }
});
Pan.monitor.pcap.PcapPacketDiagCapturingViewer = Ext.extend(Pan.monitor.MonitorViewer, {
    theme: Pan.base.Constants.uiThemes[1],
    rbaPath: 'monitor/packet-capture',
    layout: "form",
    useToolbarCloneAction: false,
    storeInputs: {nameIdProperty: "name", objectType: _T('Stage')},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: 'PcapPacketDiagConfigStage',
            api: {readSchema: "$.ops.operations.debug.dataplane.packet-diag.set.capture.stage.entry"}
        }
    },
    fields: [Ext.applyIf({}, Pan.monitor.MonitorViewer.prototype.fieldConfig.createName()), {
        name: "$.file",
        uiHint: {regexText: Pan.monitor.pcap.fileRegexText, showHelpString: Pan.monitor.pcap.fileRegexText}
    }, {
        name: "@name", uiHint: {
            fieldLabel: _T("Stage"), builder: 'PanCompletionBuilder', completion: function () {
                return PanDirect.runCallback('MonitorDirect.completePcapStageNames');
            }
        }
    }],
    columns: [Ext.applyIf({header: _T('Stage')}, Pan.monitor.MonitorViewer.prototype.columnConfig.name), {
        dataIndex: "$.file",
        width: 400
    }, {dataIndex: "$.byte-count", width: 100}, {dataIndex: "$.packet-count", width: 100}],
    recordFormTitle: _T('Packet Capture Stage'),
    recordForm: {items: [{itemId: '$', hasGridFilter: false}]}
});
Pan.reg("PcapPacketDiagCapturingViewer", Pan.monitor.pcap.PcapPacketDiagCapturingViewer);
Pan.monitor.pcap.PcapPacketDiagCapturingPanelViewer = Ext.extend(Pan.base.container.Panel, {
    rbaPath: 'monitor/packet-capture',
    layout: "form",
    bodyStyle: "background-color: #fff",
    title: _T('Configure Capturing'),
    initComponent: function () {
        Ext.apply(this, {
            items: [{
                xtype: 'pan-container',
                align: 'left',
                items: [{xtype: 'spacer', height: '10'}, {
                    xtype: 'pan-container',
                    layout: 'hbox',
                    align: 'left',
                    items: [{xtype: 'spacer', width: '10'}, {
                        xtype: 'label',
                        text: _T('Packet Capture')
                    }, {xtype: 'spacer', width: '5'}, Pan.create({treePath: "captureFormEnable", width: 100})]
                }, {xtype: 'spacer', height: '10'}, Pan.create({treePath: "PcapPacketDiagCapturingViewer"})]
            }]
        });
        Pan.monitor.pcap.PcapPacketDiagCapturingPanelViewer.superclass.initComponent.apply(this, arguments);
    }
});
Pan.reg("PcapPacketDiagCapturingPanelViewer", Pan.monitor.pcap.PcapPacketDiagCapturingPanelViewer);
Pan.monitor.pcap.Files = Ext.extend(Pan.monitor.MonitorViewer, {
    theme: Pan.base.Constants.uiThemes[1],
    rbaPath: 'monitor/packet-capture',
    layout: "form",
    title: _T('Captured Files'),
    showLocalPagingBarOnDemand: false,
    useToolbarCloneAction: false,
    useToolbarAddAction: false,
    useRowActions: false,
    storeInputs: {objectType: _T('Packet Capture File')},
    recordBinderOverride: {dataProxyAPI: {remoteClass: 'PcapFiles'}},
    fields: [{name: "name", mapping: '["@name"]'}, {name: "date", mapping: "['date']"}, {
        name: "size",
        mapping: "['size']"
    }],
    columns: [{
        header: _T("File Name"),
        dataIndex: "name",
        width: 154,
        renderer: Pan.renderer({
            xtype: 'LabelRenderer',
            pre: '<em class="x-hyperlink">',
            post: '</em>',
            text: function (value) {
                return value;
            },
            onClick: function (grid, config) {
                var url = "/php/monitor/pcapPacketDiagFileDownload.php?" + Ext.urlEncode({file: config.record.data.name});
                window.open(url);
            }
        })
    }, {header: _T("Date"), dataIndex: "date", width: 80}, {header: _T("Size(MB)"), dataIndex: "size", width: 70}]
});
Pan.reg("pcap-files", Pan.monitor.pcap.Files);
Pan.monitor.pcap.PcapViewer = Ext.extend(Pan.appframework.modelview.PanCompositeViewer, {
    viewerConfigs: [[{
        treePath: 'PcapPacketDiagFilteringViewer',
        isPortlet: false
    }, {xtype: 'spacer', width: '5'}, {
        treePath: 'PcapPacketDiagCapturingPanelViewer',
        isPortlet: false
    }, {xtype: 'spacer', width: '5'}, {
        treePath: 'PcapPacketDiagClearAllPanelViewer',
        isPortlet: false,
        cls: 'white'
    }], [{treePath: 'pcap-files', isPortlet: false}]]
});
Pan.reg("Monitor/Packet Capture", Pan.monitor.pcap.PcapViewer);
Pan.monitor.pcap.FilterDetail = Ext.extend(Pan.appframework.modelview.PanRecordFormViewer, {
    hasGridFilter: false,
    rbaPath: 'monitor/packet-capture',
    storeInputs: {nameIdProperty: "name", objectType: _T('Packet Capture Filter')},
    recordBinderOverride: {
        dataProxyAPI: {
            remoteClass: 'PcapPacketDiagConfigFilter',
            api: {readSchema: "$.ops.operations.debug.dataplane.packet-diag.set.filter.index.entry"}
        }
    },
    fields: [{
        name: "$.match",
        childrenNames: ['$.match.source', '$.match.destination', '$.match.source-port', '$.match.destination-port', '$.match.protocol', '$.match.non-ip', '$.match.ipv6-only']
    }, {name: "$.index.entry.*.match.non-ip", uiHint: {fieldLabel: _T("Non-IP")}}, {
        name: "$.match.ipv6-only",
        uiHint: {fieldLabel: _T("IPv6")}
    }, {name: "$", childrenNames: ['$.match']}],
    storeConfig: {ztype: Pan.appframework.modelview.PanGridStore},
    recordFormTitle: _T('Filter Details'),
    recordForm: {
        items: [{itemId: '$'}],
        windowConfig: {height: 500, width: 400, iconCls: undefined},
        okCallback: function (recordForm) {
            var data = ['match.source', 'match.destination', 'match.source-port', 'match.destination-port', 'match.protocol', 'match.non-ip', 'match.ipv6-only'];
            for (var i = 0; i < data.length; i++) {
                var val = recordForm.findByItemId("$." + data[i]).getValue();
                for (var j = 0; j < this.selectedConfig.records.length; j++) {
                    this.selectedConfig.records[j].set('$.index.entry.*.' + data[i], val);
                }
            }
            recordForm.ownerCt.close();
            return false;
        }
    }
});
Pan.reg("Monitor/Packet Capture/Filter Detail", Pan.monitor.pcap.FilterDetail);
Pan.monitor.pcap.ShowFilterDetailDialog = function (element, records, grid) {
    new Pan.appframework.action.PanViewerWindowAction({
        title: _T('Filter Details'),
        treePath: "Monitor/Packet Capture/Filter Detail",
        selectedConfig: {records: records, grid: grid}
    }).execute();
};
Pan.monitor.pcap.action.SetPacketCaptureFilterAction = Ext.extend(Pan.base.action.RemoteAction, {
    constructor: function (config) {
        var cfg = Ext.apply({
            text: _T('Set Selected Packet Capture Filter'),
            iconCls: '',
            ref: '../setPacketCaptureFilterAction',
            handler: this.action.createDelegate(this)
        }, config);
        cfg.availConfig = Pan.base.util.integrateArray({
            type: 'HasSelectionAvail',
            hasSelectionMethod: config.hasSelectionMethod
        }, cfg.availConfig);
        Pan.monitor.pcap.action.SetPacketCaptureFilterAction.superclass.constructor.call(this, cfg);
    }, action: function (element, config) {
        if (!config.record || config.record.length < 1) {
            Pan.Msg.alert(_T("Select Interface"), _T('Select the interfaces.'));
            return;
        }
        try {
            if (config.record && config.record.length > 0) {
                var services = [];
                for (var i = 0; i < config.record.length; i++) {
                    services.push(config.record[i]);
                }
                Pan.monitor.pcap.ShowFilterDetailDialog(element, services, config.grid);
            }
        }
        catch (err) {
            Pan.Msg.alert(_T('Error'), err);
        }
    }
});
Pan.areg("setPacketCaptureFilterAction", Pan.monitor.pcap.action.SetPacketCaptureFilterAction, Pan.appframework.action.ActionMgr.getPermissionAvail());
Ext.ns('Pan.monitor.correlation', 'Pan.monitor.correlation.renderers');
Pan.monitor.correlation.CorrelationSchema = function () {
    Pan.schemaMkNode('$.injected.correlation', {
        '@attr': {'node-type': 'array'},
        'entry': {
            '@attr': {'node-type': 'sequence'},
            '@name': {
                '@attr': {
                    'uiHint': {isKeyField: true, allowBlank: false},
                    'maxlen': '31',
                    'node-type': 'attr-req',
                    'type': 'string',
                    'subtype': 'object-name'
                }
            },
            '@id': {'@attr': {'optional': false, 'allowBlank': false, 'node-type': 'element', 'type': 'string'}},
            'state': {
                '@attr': {
                    'optional': false,
                    'allowBlank': false,
                    'maxlen': '31',
                    'node-type': 'element',
                    'type': 'string'
                }
            },
            'category': {'@attr': {'optional': false, 'allowBlank': false, 'node-type': 'element', 'type': 'string'}},
            'description': {'@attr': {'allowBlank': true, 'node-type': 'element', 'type': 'string'}},
            'detailed-description': {'@attr': {'allowBlank': true, 'node-type': 'element', 'type': 'string'}}
        }
    });
};
Pan.monitor.correlation.action = (function () {
    var readOnlyAvail = {
        processAfterRender: true, availHide: false, match: {
            evaluate: function () {
                var selected = this.__component.ownerCt.ownerCt.getSelectionModel().selections.items;
                var record;
                if (selected.length === 1) {
                    record = selected[0];
                    var recordInfo = record.json['@__recordInfo'];
                    return recordInfo['permission'] != 'readonly';
                }
                return false;
            }
        }
    };
    var activateAvail = {
        processAfterRender: true, availHide: false, match: {
            evaluate: function () {
                if (Pan.global.CONTEXT.role === 'superuser' && (!Pan.global.isMultiVsys() || Pan.global.getLocVal() === '')) {
                    var selected = this.__component.ownerCt.ownerCt.getSelectionModel().selections.items;
                    var record;
                    if (selected.length === 1) {
                        record = selected[0];
                        return record.get('$.state') != 'active';
                    }
                }
                return false;
            }
        }
    };
    var deactivateAvail = {
        processAfterRender: true, availHide: false, match: {
            evaluate: function () {
                if (Pan.global.CONTEXT.role === 'superuser' && (!Pan.global.isMultiVsys() || Pan.global.getLocVal() === '')) {
                    var selected = this.__component.ownerCt.ownerCt.getSelectionModel().selections.items;
                    var record;
                    if (selected.length === 1) {
                        record = selected[0];
                        return record.get('$.state') != 'disable';
                    }
                }
                return false;
            }
        }
    };
    return {
        availForReadOnly: function () {
            return readOnlyAvail;
        }, availForActivate: function () {
            return activateAvail;
        }, availForDeactivate: function () {
            return deactivateAvail;
        }
    };
}());
Pan.monitor.correlation.EnableCorrelationObjectAction = Ext.extend(Pan.appframework.action.GridRemoteAction, {
    constructor: function (config) {
        var cfg = Ext.apply({
            text: _T('Enable'),
            iconCls: 'icon-enable',
            ref: '../enableCorrelationObjectAction',
            api: PanDirect.runCallback('MonitorDirect.enableCorrelationObjects')
        }, config);
        Pan.monitor.correlation.EnableCorrelationObjectAction.superclass.constructor.call(this, cfg);
        this.addAvail(Pan.monitor.correlation.action.availForReadOnly());
        this.addAvail(Pan.monitor.correlation.action.availForActivate());
    }
});
Pan.areg("EnableCorrelationObjectAction", Pan.monitor.correlation.EnableCorrelationObjectAction);
Pan.monitor.correlation.DisableCorrelationObjectAction = Ext.extend(Pan.appframework.action.GridRemoteAction, {
    constructor: function (config) {
        var cfg = Ext.apply({
            text: _T('Disable'),
            iconCls: 'icon-disable',
            ref: '../disableCorrelationObjectAction',
            api: PanDirect.runCallback('MonitorDirect.disableCorrelationObjects')
        }, config);
        Pan.monitor.correlation.DisableCorrelationObjectAction.superclass.constructor.call(this, cfg);
        this.addAvail(Pan.monitor.correlation.action.availForReadOnly());
        this.addAvail(Pan.monitor.correlation.action.availForDeactivate());
    }
});
Pan.areg("DisableCorrelationObjectAction", Pan.monitor.correlation.DisableCorrelationObjectAction);
(function () {
    Ext.apply(Pan.monitor.correlation.renderers, {
        text_type: Pan.renderer({
            fn: function (value, metadata, record, row, col, store, grid) {
                var pre = '<span class="{0}">', post = '</span>', disablecls = "";
                var disableItemId = grid.disableItemId;
                if (disableItemId) {
                    var dv = record.get(disableItemId);
                    if (dv === "disable") {
                        disablecls = " x-pan-disabled";
                    }
                }
                pre = String.format(pre, disablecls);
                return pre + value + post;
            }
        }), link_type: Pan.renderer({
            fn: function (value, metadata, record, row, col, store, grid) {
                value = String.format('<em class="x-hyperlink">{0}</em>', value);
                var pre = '<span class="{0}">', post = '</span>', disablecls = "";
                var disableItemId = grid.disableItemId;
                if (disableItemId) {
                    var dv = record.get(disableItemId);
                    if (dv === "disable") {
                        disablecls = " x-pan-disabled";
                    }
                }
                pre = String.format(pre, disablecls);
                return pre + value + post;
            }, onClick: function (panel, obj) {
                if (obj && obj.record && obj.record.data && obj.record.data.name) {
                    var dom = Pan.appframework.PredefinedContent.getDOM();
                    var xml = $("predefined correlation-object objects entry[name='" + obj.record.data.name + "']", dom);
                    var xmlString = (new XMLSerializer()).serializeToString(xml[0]);
                    var win = new Pan.base.container.Window({
                        layout: 'fit',
                        width: 600,
                        height: 650,
                        title: _T("Correlation Object"),
                        border: false,
                        modal: true,
                        closable: true,
                        maximizable: true,
                        items: {xtype: 'pan-xmleditor', autoFormat: true, readOnly: true, value: xmlString}
                    });
                    win.show();
                }
            }
        })
    });
}());
Pan.monitor.correlation.CorrelationObjectsViewer = Ext.extend(Pan.appframework.modelview.PanHLGridViewer, {
    hasGridFilter: false,
    miniCellRowLines: false,
    useCheckBoxSelection: true,
    useRowActions: false,
    useToolbarAddAction: false,
    useToolbarDeleteAction: false,
    useToolbarCloneAction: false,
    supportLocalPaging: false,
    disableItemId: '$.state',
    storeInputs: {objectType: _T('Correlation Object')},
    recordBinderOverride: {
        dataProxyAPI: {
            api: {
                read: PanDirect.runCallback('MonitorDirect.getCorrelationObjects'),
                readSchema: {
                    injectedSchema: Pan.monitor.correlation.CorrelationSchema,
                    device: "$.injected.correlation.entry",
                    cms: "$.injected.correlation.entry"
                }
            }
        }
    },
    commonFields: [{name: 'name', mapping: '@name'}, {name: 'id', mapping: '@id'}],
    columns: [{
        header: _T('Name'),
        dataIndex: 'name',
        width: 120,
        renderer: Pan.monitor.correlation.renderers.link_type,
        hidden: true
    }, {
        header: _T('ID'),
        dataIndex: 'id',
        align: 'right',
        width: 65,
        renderer: Pan.monitor.correlation.renderers.text_type,
        hidden: true
    }, {
        header: _T('Title'),
        dataIndex: '$.description',
        align: 'left',
        enableGlobalFind: true,
        width: 150,
        renderer: Pan.monitor.correlation.renderers.text_type
    }, {
        header: _T('Category'),
        dataIndex: '$.category',
        align: 'left',
        width: 120,
        renderer: Pan.monitor.correlation.renderers.text_type
    }, {
        header: _T('State'),
        dataIndex: '$.state',
        align: 'left',
        width: 85,
        renderer: Pan.monitor.correlation.renderers.text_type
    }, {
        header: _T('Description'),
        dataIndex: '$.detailed-description',
        align: 'left',
        width: 350,
        renderer: Pan.monitor.correlation.renderers.text_type
    }],
    constructor: function (config) {
        Pan.monitor.correlation.CorrelationObjectsViewer.superclass.constructor.call(this, config);
    },
    setupRecord: function () {
        var recStruct = Pan.monitor.correlation.CorrelationObjectsViewer.superclass.setupRecStruct.apply(this, arguments);
        return recStruct;
    },
    setupToolBar: function () {
        Pan.monitor.correlation.CorrelationObjectsViewer.superclass.setupToolBar.apply(this, arguments);
        this.bbarStrings = this.bbarStrings || [];
        this.bbarStrings.push({
            atype: 'EnableCorrelationObjectAction', hasSelectionMethod: function () {
                if (this.__listenField) {
                    var selections = this.__listenField.getSelections();
                    if (selections.length == 1) {
                        var r = selections[0];
                        if (r.json && r.json['@__recordInfo'] && r.json['@__recordInfo'].permission === 'readonly') {
                            return false;
                        }
                        var state = r.get('$.state');
                        return (state == 'active');
                    }
                }
                return false;
            }
        }, {
            atype: 'DisableCorrelationObjectAction', hasSelectionMethod: function () {
                if (this.__listenField) {
                    var selections = this.__listenField.getSelections();
                    if (selections.length == 1) {
                        var r = selections[0];
                        if (r.json && r.json['@__recordInfo'] && r.json['@__recordInfo'].permission === 'readonly') {
                            return false;
                        }
                        var state = r.get('$.state');
                        return (state != 'active');
                    }
                }
                return false;
            }
        });
    }
});
Pan.reg("Monitor/Automated Correlation Engine/Correlation Objects", Pan.monitor.correlation.CorrelationObjectsViewer);
Ext.ns('Pan.monitor.correlation');
Pan.monitor.correlation.MatchesDetailedLogPanel = Ext.extend(Pan.base.container.Panel, {
    constructor: function (config) {
        config = config || {};
        Ext.applyIf(this, {
            layout: 'fit',
            itemId: 'MatchesDetailedLogPanel',
            id: 'MatchesDetailedLogPanel',
            minHeight: 560,
            items: {
                autoScroll: false,
                xtype: 'pan-tabpanel',
                stateEvents: ['tabchange'],
                activeTab: 0,
                itemId: 'MatchesDetailedLogTabPanel',
                stateId: 'Match_Tab_Id',
                stateful: true,
                bodyPadding: 0,
                padding: 0,
                border: 0,
                extraComponentConfig: config.extraComponentConfig,
                items: [{
                    xtype: 'pan-container',
                    hideBorders: true,
                    layout: 'fit',
                    title: _T('Match Information'),
                    items: {
                        xtype: 'CorrCommonDLogCompositeViewer',
                        logtype: config.logtype,
                        data: config.data,
                        config: config,
                        useList: true
                    }
                }, {
                    title: _T('Match Evidence'),
                    xtype: 'pan-container',
                    layout: 'border',
                    items: [{
                        id: 'DetailLogHolder',
                        region: 'center',
                        minHeight: 150,
                        autoHeight: false,
                        xtype: 'pan-container',
                        layout: 'fit',
                        items: {id: 'detail_log_viewer'}
                    }, {
                        region: 'south',
                        collapseMode: 'mini',
                        stateful: true,
                        split: true,
                        itemId: config.logtype + '_detail_log_viewer_south',
                        id: "corr_detail_log_viewer_south",
                        height: 150,
                        xtype: "Pan.monitor.log.correlation.RelatedLogGridPanel",
                        level: 1,
                        logtype: config.logtype,
                        data: config.data,
                        responseText: config.responseText
                    }]
                }]
            }
        });
        Pan.monitor.correlation.MatchesDetailedLogPanel.superclass.constructor.call(this, config);
    }, initComponent: function () {
        Pan.monitor.correlation.MatchesDetailedLogPanel.superclass.initComponent.call(this, arguments);
    }
});
Ext.reg("MatchesDetailedLogPanel", Pan.monitor.correlation.MatchesDetailedLogPanel);
Pan.monitor.correlation.MatchesDetailedLogWin = Ext.extend(Pan.base.container.Window, {
    constructor: function (config) {
        config = config || {};
        Ext.apply(config, {
            id: 'Pan.monitor.correlation.MatchesDetailedLogWin',
            title: _T('Detailed Log View'),
            closeable: false,
            minWidth: 800,
            minHeight: 560,
            stateful: true,
            maximizable: true,
            modal: true,
            autoScroll: false,
            layout: 'fit',
            items: {
                xtype: 'MatchesDetailedLogPanel',
                data: config.data,
                logtype: config.logtype,
                responseText: config.responseText
            },
            plain: true,
            buttonAlign: 'left',
            buttons: ["->", {text: _T('Close'), handler: this.close, scope: this}]
        });
        Pan.monitor.correlation.MatchesDetailedLogWin.superclass.constructor.call(this, config);
    }, initComponent: function () {
        this.initLaunch = Ext.isEmpty(Ext.state.Manager.get(this.id));
        var fnHandler = function (w) {
            var detailviewer = w.find('id', 'detail_log_viewer')[0];
            if (detailviewer) {
                if (this.initLaunch) {
                    var dHeight = detailviewer.getHeight() + 560;
                    if (dHeight > this.maxHeight) {
                        this.setHeight(this.maxHeight);
                    }
                    else {
                        this.setHeight(dHeight);
                    }
                    if (this.getWidth() < this.minWidth) {
                        this.setWidth(this.minWidth);
                    }
                }
                detailviewer.fireEvent('show');
            }
            w.center();
        };
        var fnHandler4R = function (w) {
            var detailviewer = w.find('id', 'detail_log_viewer')[0];
            if (detailviewer) {
                detailviewer.fireEvent('show');
            }
        };
        this.on({'afterrender': fnHandler, 'resize': fnHandler4R, scope: this, buffer: 200});
        Pan.monitor.correlation.MatchesDetailedLogWin.superclass.initComponent.call(this, arguments);
    }
});
Pan.monitor.correlation.showDetailedLog = function (logtype, rs, responseText, parent) {
    var win = Ext.getCmp('Pan.monitor.correlation.MatchesDetailedLogWin');
    if (!win) {
        win = new Pan.monitor.correlation.MatchesDetailedLogWin({
            data: rs,
            logtype: logtype,
            responseText: responseText,
            parent: parent
        });
    }
    win.show();
};
Pan.monitor.correlation.CorrelatedEventsViewer = Ext.extend(Pan.monitor.log.Viewer, {
    constructor: function (config) {
        Pan.monitor.correlation.CorrelatedEventsViewer.superclass.constructor.call(this, config);
    }, initComponent: function () {
        Pan.monitor.correlation.CorrelatedEventsViewer.superclass.initComponent.apply(this, arguments);
    }, onCellClick: function (grid, rowIdx, colIdx, evt) {
        var fieldName = grid.getColumnModel().getDataIndex(colIdx);
        var isValidTarget = function () {
            var target = evt.getTarget();
            if (!(target.tagName == "A" || target.className == 'resolved-log-address' || target.tagName == "IMG" || target.tagName == "EM")) {
                return false;
            }
            if (fieldName == 'pktlog' || fieldName == 'pcap-file' || fieldName == 'pcap_id' || fieldName == 'external_link') {
                return false;
            }
            return true;
        };
        if (!isValidTarget()) {
            return;
        }
        var record = grid.getStore().getAt(rowIdx);
        var isThreatIDField = (fieldName == 'threatid' && record && record.data && record.data.tid);
        var isDetailIcon = (fieldName == 'details' && record && record.data);
        var isObjectName = (fieldName == 'objectname' && record && record.data);
        var schema = null;
        if (isThreatIDField) {
            this.showThreatDetail(record);
        }
        else if (isDetailIcon) {
            schema = Pan.acc2.logs.AccCorrelationLogViewerUtils.getSchemaForObject(record.data.objectid);
            if (schema) {
                record.data["@name"] = schema["@name"];
                record.data["@id"] = schema["@id"];
                record.data["description"] = schema["description"];
                record.data["detailed-description"] = schema["detailed-description"];
                record.data["category"] = schema["category"];
            }
            Pan.monitor.correlation.showDetailedLog(this.logtype, record, this.store.responseText, this);
        }
        else if (isObjectName) {
            schema = Pan.acc2.logs.AccCorrelationLogViewerUtils.getSchemaForObject(record.data.objectid);
            if (schema) {
                record.data["objectname"] = schema["description"];
            }
            this.addFilterOnClick(record, fieldName);
        }
        else {
            this.addFilterOnClick(record, fieldName);
        }
    }
});
Pan.reg("Monitor/Automated Correlation Engine/Correlated Events", Pan.monitor.correlation.CorrelatedEventsViewer);
Ext.ns('Pan.monitor.log.correlation');
Pan.monitor.log.correlation.CorrDetailViewer = Ext.extend(Pan.base.container.Container, {
    constructor: function (config) {
        config = config || {};
        Ext.apply(config, {
            layout: 'fit',
            cls: 'x-log-detail',
            items: [{
                xtype: "pan-tabpanel",
                id: "toptabpanel",
                listeners: {
                    afterRender: function () {
                        if (config.logtype != Pan.monitor.log.LogType.WildFire) {
                            this.hideTabStripItem(0);
                            $('#detail_log_viewer .x-tab-panel-header').css('display', 'none');
                            $('#detail_log_viewer .x-tab-panel-bwrap').children(":first").removeClass('x-tab-panel-body');
                            $('#detail_log_viewer').css('margin', '1px');
                        }
                    }
                },
                activeTab: 0,
                bodyPadding: 0,
                padding: 0,
                border: 0,
                items: [{
                    xtype: 'pan-container',
                    title: _T('Log Info'),
                    layout: 'fit',
                    id: 'detail_composite_container',
                    items: [{
                        xtype: 'CorrCommonDLogCompositeViewer',
                        logtype: config.logtype,
                        data: config.data,
                        config: config,
                        useList: true
                    }]
                }]
            }]
        });
        Pan.monitor.log.correlation.CorrDetailViewer.superclass.constructor.call(this, config);
    }, initComponent: function () {
        Pan.monitor.log.correlation.CorrDetailViewer.superclass.initComponent.call(this, arguments);
        if (this.logtype === 'wildfire') {
            this.showWildfireReport(this.data);
            this.retrieveEmailHdrUserIDs(this.data);
        }
    }, showWildfireReport: function (record) {
        var self = this;
        var serial = record.data.serial;
        var reportid = record.data.reportid != "0" ? record.data.reportid : record.data.tid;
        if (record.data.filedigest && record.data.cloud) {
            var filedigest = record.data.filedigest;
            var cloud = record.data.cloud;
            var flagWfChannel = record.data['flag-wf-channel'];
            PanDirect.run('LogData.wildfireReportV6Link', [serial, reportid, filedigest, cloud, flagWfChannel], function (url) {
                self.showWildfireReportAjaxCallback(record, url);
            });
        }
        else {
            PanDirect.run('LogData.wildfireReportV5Link', [serial, reportid], function (url) {
                self.showWildfireReportAjaxCallback(record, url);
            });
        }
    }, showWildfireReportAjaxCallback: function (record, url) {
        var wndsize = function () {
            var w = 0;
            var h = 0;
            if (!window.innerWidth) {
                if (document.documentElement.clientWidth != 0) {
                    w = document.documentElement.clientWidth;
                    h = document.documentElement.clientHeight;
                }
                else {
                    w = document.body.clientWidth;
                    h = document.body.clientHeight;
                }
            }
            else {
                w = window.innerWidth;
                h = window.innerHeight;
            }
            return {width: w, height: h};
        };
        var dimension = wndsize();
        var tabs = Ext.getCmp('toptabpanel');
        var wheight = Math.min(dimension.height - 50, 650);
        var windowsTabHeightDiff = 123;
        var wildfirereportiframe = tabs.add({
            height: wheight - windowsTabHeightDiff,
            id: 'wildfirereport123',
            width: '100%',
            xtype: 'iframepanel',
            title: _T('WildFire Analysis Report'),
            closeable: true,
            loadMask: true,
            defaultSrc: url
        });
        var w = Ext.getCmp('Pan.monitor.correlation.MatchesDetailedLogWin');
        tabs.on('tabchange', function (tabpanel, tab) {
            if ((tab.id == 'wildfirereport123')) {
                w.body.applyStyles("overflow-x:hidden;overflow-y:hidden");
                wildfirereportiframe.setHeight(w.getHeight() - windowsTabHeightDiff);
            }
            else {
                w.body.applyStyles("overflow-x:auto;overflow-y:auto");
                w.restore();
            }
            tabs.doLayout();
        });
    }, retrieveEmailHdrUserIDs: function (record) {
        var self = this;
        var emails = record.data.recipient;
        if (Ext.isEmpty(emails)) {
            var win = Ext.getCmp('Pan.monitor.correlation.MatchesDetailedLogWin');
            var mask = win && win.loadMasks && win.loadMasks["Email Headers"];
            if (mask) {
                mask.hide();
                mask.destroy();
            }
            return;
        }
        var myvsys = record.data['vsys'];
        var serial = record.data['serial'];
        var allvsys = {};
        if (!Pan.global.isCms()) {
            allvsys = Pan.global.CONTEXT.accessibleVsys;
        }
        else {
            if (serial) {
                if (Pan.monitor.cmsVsys2DisplayNameMapping[serial]) {
                    allvsys = Pan.monitor.cmsVsys2DisplayNameMapping[serial];
                }
            }
        }
        for (var m in allvsys) {
            if (allvsys.hasOwnProperty(m)) {
                if (allvsys[m] == myvsys) {
                    myvsys = m;
                    break;
                }
            }
        }
        PanDirect.run('LogData.retrieveEmailHdrUserIDs', [emails, myvsys, serial], function (resp) {
            self.retrieveEmailHdrUserIDsAjaxCallback(record, resp);
        });
    }, retrieveEmailHdrUserIDsAjaxCallback: function (record, resp) {
        if (resp && resp['result'] && resp['result']['result']['entry']) {
            record.set('recipient-userid', resp['result']['result']['entry']);
            var config = {};
            config.logtype = "wildfire";
            config.data = record;
            var cont = Ext.getCmp("detail_composite_container");
            cont.removeAll();
            cont.insert(0, {xtype: 'CommonDLogCompositeViewer', logtype: "wildfire", data: record, config: config});
            cont.doLayout();
        }
        var win = Ext.getCmp('Pan.monitor.log.DetailedLogWin');
        for (var m in win.loadMasks) {
            if (win.loadMasks.hasOwnProperty(m)) {
                if (win.loadMasks[m]) {
                    win.loadMasks[m].hide();
                    win.loadMasks[m].destroy();
                }
            }
        }
    }
});
Ext.reg("corrdetaillogviewer", Pan.monitor.log.correlation.CorrDetailViewer);
Pan.monitor.log.correlation.CommonDetailedLogCompositeViewer = Ext.extend(Pan.monitor.log.CommonDetailedLogCompositeViewer, {
    initComponent: function () {
        Pan.monitor.log.correlation.CommonDetailedLogCompositeViewer.superclass.initComponent.apply(this, arguments);
    }, populateViewConfigs: function () {
        this.viewerConfigs = [];
        var widgets = this.fieldsOrder[this.logtype];
        var logDetailWindow = Ext.getCmp('Pan.monitor.correlation.MatchesDetailedLogWin');
        var accCorrWidget = Ext.getCmp("AccCorrelationLogViewerWidget");
        var loglinks = [];
        if (logDetailWindow) {
            loglinks = logDetailWindow.initialConfig.parent.loglinks;
        }
        else if (accCorrWidget) {
            loglinks = accCorrWidget.loglinks;
        }
        if (Ext.isArray(loglinks) && loglinks.length == 0) {
            delete widgets["Log Links"];
        }
        else {
            this.populateLogLinks(loglinks, this.config.data, this.logtype);
        }
        this.viewerConfigs.push([]);
        if (this.logtype === 'auth') {
            this.viewerConfigs.push([]);
        }
        else if (this.logtype !== 'corr' && this.logtype !== 'auth') {
            this.viewerConfigs.push([]);
            this.viewerConfigs.push([]);
        }
        var col = 0;
        for (var prop in widgets) {
            if (widgets.hasOwnProperty(prop)) {
                var val = widgets[prop];
                if (val) {
                    this.viewerConfigs[col].push({
                        xtype: 'CorrCommonDLogPropertyWidget',
                        isPortlet: false,
                        useList: true,
                        title: prop,
                        data: this.data,
                        config: this.config,
                        orderedFields: val
                    });
                }
            }
            col++;
            if (this.logtype == 'wildfire' || this.logtype == 'url' || this.logtype == 'corr') {
                if (col == 3) {
                    col = 0;
                }
            }
            else if (this.logtype == 'auth') {
                if (col == 2) {
                    col = 1;
                }
            }
            else {
                if (col == 3) {
                    col = 1;
                }
            }
            if (this.logtype == 'corr') {
                if (col == 1) {
                    col = 0;
                }
            }
        }
    }
});
Ext.reg('CorrCommonDLogCompositeViewer', Pan.monitor.log.correlation.CommonDetailedLogCompositeViewer);
Pan.monitor.log.correlation.CommonDetailedLogPropertyWidget = Ext.extend(Pan.appframework.modelview.PanPortletViewer, {
    rbaPath: ['monitor/logs'],
    recordForm: {items: [{itemId: 'root'}]},
    storeInputs: {objectType: _T("Logs")},
    storeConfig: {ztype: Pan.appframework.modelview.PanGridStore, autoLoad: false},
    populate: function () {
        var info = this.data.data;
        var data = {'root': info};
        var rec = new this.store.recordType();
        rec.data = data;
        var basicForm = this.getForm();
        basicForm.loadRecord(rec);
    },
    constructor: function (config) {
        this.addFields(config);
        Pan.monitor.log.correlation.CommonDetailedLogPropertyWidget.superclass.constructor.apply(this, arguments);
    },
    addFields: function (config) {
        if (config.title == 'Log Links') {
            this.rootField = {
                name: 'root',
                childrenNames: [],
                uiHint: {
                    builder: 'PropertyGridBuilder',
                    inlineEditing: false,
                    isWidget: true,
                    titleColumnConfig: {width: 10, fixed: true}
                }
            };
        }
        else {
            if (config.config.logtype === "corr") {
                this.rootField = {
                    name: 'root', childrenNames: [], uiHint: {
                        builder: 'PropertyGridBuilder',
                        inlineEditing: false,
                        isWidget: true,
                        useList: true,
                        titleColumnConfig: {width: 0.15, fixed: true},
                        showCompleteText: Pan.base.util.createExtension(function (data, menuitem, col, record) {
                            if (col.showCompleteText) {
                                return col.showCompleteText(data, menuitem, col, record, this);
                            }
                            else {
                                arguments.callee.superFunction.apply(this, arguments);
                            }
                        }, Pan.base.grid.GridPanel.prototype.showCompleteText)
                    }
                };
            }
            else {
                this.rootField = {
                    name: 'root', childrenNames: [], uiHint: {
                        builder: 'PropertyGridBuilder',
                        inlineEditing: false,
                        isWidget: true,
                        titleColumnConfig: {width: 110, fixed: true},
                        showCompleteText: Pan.base.util.createExtension(function (data, menuitem, col, record) {
                            if (col.showCompleteText) {
                                return col.showCompleteText(data, menuitem, col, record, this);
                            }
                            else {
                                arguments.callee.superFunction.apply(this, arguments);
                            }
                        }, Pan.base.grid.GridPanel.prototype.showCompleteText)
                    }
                };
            }
        }
        this.recordFormTitle = config.title;
        config.fields = [];
        config.fields.push(this.rootField);
        var info = config.data.data;
        var skipNat = true;
        if (info['flag-nat'] && info['flag-nat'] == 'yes') {
            skipNat = false;
        }
        if (info['reportid']) {
            info['reportid'] = info['reportid'] != "0" ? info['reportid'] : info['tid'];
        }
        var orderedFields = config.orderedFields;
        var fld;
        var boolFields = ["flag-pcap", "flag-nat", "flag-proxy", "flag-url-denied", "decrypt-mirror", "sym-return", "transaction", "captive-portal", "pbf-c2s", "pbf-s2c", "client-to-server", "server-to-client"];
        for (var i = 0; i < orderedFields.length; i++) {
            if (orderedFields[i]) {
                var fldname = orderedFields[i];
                var fldtitle = this.fieldsMaps[config.config.logtype][fldname];
                if (fldtitle) {
                    if (skipNat) {
                        var pattern = /^nat(\S)*/g;
                        if (pattern.test(fldname)) {
                            continue;
                        }
                    }
                    if (fldname == 'direction' && info['direction']) {
                        info[info['direction']] = "yes";
                        continue;
                    }
                    if (fldname == "vsys" && info['vsys']) {
                        var myserial = info["serial"];
                        var myvsys = info['vsys'];
                        if (Pan.global.isCms()) {
                            if (myserial) {
                                if (Pan.monitor.cmsVsys2DisplayNameMapping[myserial]) {
                                    var myserialobj = Pan.monitor.cmsVsys2DisplayNameMapping[myserial];
                                    if (myserialobj[myvsys]) {
                                        info['vsys'] = myserialobj[myvsys];
                                    }
                                }
                            }
                        }
                        else {
                            if (Pan.monitor.vsys2DisplayNameMapping[myvsys]) {
                                info['vsys'] = Pan.monitor.vsys2DisplayNameMapping[myvsys];
                            }
                        }
                    }
                    if (fldname == "catlink") {
                        if (config.config.logtype == Pan.monitor.log.LogType.Url) {
                            var urlDB = config.config.urlDB;
                            if (urlDB) {
                                var rcurl = urlDB == 'paloaltonetworks' ? 'http://urlfiltering.paloaltonetworks.com/testASite.aspx' : 'http://www.brightcloud.com/support/changerequest.php';
                                if (urlDB == 'paloaltonetworks' && !Pan.global.isCmsSelected()) {
                                    fld = {
                                        name: 'catlink',
                                        uiHint: {
                                            fieldLabel: '',
                                            columnConfig: {
                                                editor: {
                                                    xtype: 'propertygridlinkeditor',
                                                    onValueClick: function () {
                                                        return Pan.monitor.CategoryChangeViewer.showForm(info['url'], info['category']);
                                                    }
                                                }, renderer: Pan.renderer({
                                                    xtype: 'LabelRenderer', text: function () {
                                                        return '<em class="x-hyperlink">' + _T("Request Categorization Change") + '</em>';
                                                    }
                                                })
                                            }
                                        }
                                    };
                                }
                                else {
                                    fld = {
                                        name: 'catlink',
                                        uiHint: {
                                            fieldLabel: '',
                                            columnConfig: {
                                                editor: {
                                                    xtype: 'propertygridlinkeditor',
                                                    onValueClick: function () {
                                                        window.open(rcurl);
                                                    }
                                                }, renderer: Pan.renderer({
                                                    xtype: 'LabelRenderer', text: function () {
                                                        return '<em class="x-hyperlink">' + _T("Request Categorization Change") + '</em>';
                                                    }
                                                })
                                            }
                                        }
                                    };
                                }
                                config.fields.push(fld);
                                this.rootField.childrenNames.push(fld.name);
                            }
                        }
                        continue;
                    }
                    if (fldname == "view_parent_link") {
                        if ((info.logtype == Pan.monitor.log.LogType.Traffic || info.logtype == Pan.monitor.log.LogType.Threat || info.logtype == Pan.monitor.log.LogType.Data || info.logtype == Pan.monitor.log.LogType.WildFire || info.logtype == Pan.monitor.log.LogType.Url) && (Pan.base.Constants.otherTunnels.indexOf(info.tunnel) != -1)) {
                            fld = {
                                name: 'view_parent_link',
                                uiHint: {
                                    fieldLabel: '',
                                    columnConfig: {
                                        editor: {
                                            xtype: 'propertygridlinkeditor', onValueClick: function () {
                                                var queries = [];
                                                queries.push("(sessionid eq '" + info['parent_session_id'] + "')");
                                                queries.push("(start eq '" + info['parent_start_time'] + "')");
                                                queries = queries.join(' AND ');
                                                var nodeconfig = {query: queries};
                                                var vsys = Pan.monitor.vsysScope();
                                                var rbapath = 'monitor/logs/tunnel';
                                                logDetailWidget.findParentByInstanceof(Pan.base.container.Window).close();
                                                Pan.appframework.PanAppInterface.jumpToBranch(rbapath, vsys, nodeconfig);
                                            }
                                        }, renderer: Pan.renderer({
                                            xtype: 'LabelRenderer', text: function () {
                                                return '<em class="x-hyperlink">' + _T("View Parent Session") + '</em>';
                                            }
                                        })
                                    }
                                }
                            };
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        continue;
                    }
                    if (fldname == "tunnelid" || fldname == "monitortag" || fldname == "parent_session_id" || fldname == "parent_start_time") {
                        if ((info.tunnel == 'TUNNEL') || Pan.base.Constants.otherTunnels.indexOf(info.tunnel) != -1) {
                            fld = {name: fldname, uiHint: {fieldLabel: fldtitle}};
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        else {
                            continue;
                        }
                    }
                    if (fldname == "imei" || fldname == "imsi") {
                        if ((info.tunnel == 'GTP') || Pan.base.Constants.gtpTunnel.indexOf(info.tunnel) != -1) {
                            fld = {name: fldname, uiHint: {fieldLabel: fldtitle}};
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        else {
                            continue;
                        }
                    }
                    if (fldname == "recipient-userid") {
                        if (config.config.logtype == Pan.monitor.log.LogType.WildFire) {
                            fld = {
                                name: 'recipient-userid', uiHint: {
                                    fieldLabel: _T('Recipient User-ID'), columnConfig: {
                                        wrap: false,
                                        columnActionsMode: "menu",
                                        doHTMLEncode: false,
                                        renderer: Pan.renderer({
                                            onClick: function (grid, config, e) {
                                                var target = e.getTarget();
                                                if (target.tagName == "DIV" || target.tagName == "TD") {
                                                    return;
                                                }
                                                var user = target.innerHTML;
                                                var params = {filter: {"key": "srcuser", "value": user}};
                                                var win = Ext.getCmp('MatchesDetailedLogPanel');
                                                win.close();
                                                Pan.appframework.PanAppInterface.jumpToBranch('acc', info['vsys'], params);
                                            }
                                        }),
                                        spanCellRenderer: Pan.renderer({
                                            xtype: 'LabelRenderer', link: function (v) {
                                                if (v) {
                                                    var val = v['@name'] && v['is_group'] == 'no' ? v['@name'] : '';
                                                    return val;
                                                }
                                                return '';
                                            }, text: function (v) {
                                                if (Ext.isObject(v)) {
                                                    var val = v['@name'] && v['is_group'] == 'yes' ? v['@name'] : '';
                                                    return val;
                                                }
                                                return v;
                                            }
                                        })
                                    }
                                }
                            };
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        continue;
                    }
                    if (fldname == "recipient") {
                        if (config.config.logtype == Pan.monitor.log.LogType.WildFire) {
                            fld = {
                                name: 'recipient', uiHint: {
                                    fieldLabel: _T('Recipient Address'), columnConfig: {
                                        wrap: false, renderer: function (v) {
                                            if (v) {
                                                var ret = v.split(',');
                                                return ret;
                                            }
                                            return '';
                                        }
                                    }
                                }
                            };
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        continue;
                    }
                    if (fldname === "severity") {
                        if (config.config.logtype == Pan.monitor.log.LogType.Correlation) {
                            fld = {
                                name: 'severity', uiHint: {
                                    fieldLabel: _T('Severity'), columnConfig: {
                                        doHTMLEncode: false, wrap: false, renderer: function (v) {
                                            var severity = v;
                                            var str = severity ? severity.toString() : "";
                                            str = Pan.base.htmlEncode(str);
                                            if (str.match(/^(1|2|3|4|5|critical|high|informational|low|medium)$/)) {
                                                return '<img style="vertical-align:middle" border=0 src="/images/threat_' + str + '.gif"/>';
                                            }
                                            return severity;
                                        }
                                    }
                                }
                            };
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        else {
                            fld = {name: fldname, uiHint: {fieldLabel: fldtitle}};
                        }
                    }
                    if (fldname === "summary") {
                        if (config.config.logtype == Pan.monitor.log.LogType.Correlation) {
                            fld = {
                                name: 'summary',
                                uiHint: {
                                    fieldLabel: _T('Summary'), columnConfig: {
                                        renderer: function (v) {
                                            return v;
                                        }
                                    }
                                }
                            };
                            config.fields.push(fld);
                            this.rootField.childrenNames.push(fld.name);
                        }
                        continue;
                    }
                    if (boolFields.indexOf(fldname) > -1) {
                        fld = {
                            name: fldname,
                            uiHint: {
                                fieldLabel: fldtitle,
                                uitype: 'pan-checkbox',
                                renderer: 'panbooleancolumn',
                                editor: {xtype: 'panbooleancolumneditor'}
                            }
                        };
                    }
                    else if (fldname == 'loglinks') {
                        fld = {name: fldname, uiHint: {fieldLabel: fldtitle, columnConfig: {doHTMLEncode: false}}};
                    }
                    else if (fldname == 'misc' || fldname == 'url' || fldname == 'subject' || fldname == 'xff' || fldname == 'referer' || fldname == 'user_agent') {
                        fld = {name: fldname, uiHint: {fieldLabel: fldtitle, columnConfig: {wrap: false}}};
                    }
                    else if (fldname == 'sender') {
                        fld = {
                            name: fldname, uiHint: {
                                fieldLabel: fldtitle, columnConfig: {
                                    wrap: false, showCompleteText: function (data, menuitem, col, record, grid) {
                                        if (Ext.isArray(data)) {
                                            var newData = [];
                                            Ext.each(data, function (d) {
                                                newData.push(d['@name']);
                                            });
                                            data = newData.toString();
                                        }
                                        Pan.base.grid.GridPanel.prototype.showCompleteText.call(grid, data, menuitem, col, record);
                                    }
                                }
                            }
                        };
                    }
                    else if (fldname == 'desc') {
                        fld = {name: fldname, uiHint: {fieldLabel: fldtitle, columnConfig: {wrap: false}}};
                    }
                    else if (!Pan.global.isCms() && (fldname == 'src_uuid' || fldname == 'dst_uuid') && !Pan.global.isPhoenixVM()) {
                        continue;
                    }
                    else {
                        fld = {name: fldname, uiHint: {fieldLabel: fldtitle}};
                    }
                    config.fields.push(fld);
                    this.rootField.childrenNames.push(fld.name);
                }
            }
        }
    },
    initComponent: function () {
        Pan.monitor.log.correlation.CommonDetailedLogPropertyWidget.superclass.initComponent.apply(this, arguments);
    },
    listeners: {
        render: function () {
        }
    },
    fieldsMaps: Pan.monitor.common.LogTypes.fieldsMaps
});
Ext.reg('CorrCommonDLogPropertyWidget', Pan.monitor.log.correlation.CommonDetailedLogPropertyWidget);
Pan.monitor.log.correlation.RelatedLogGridPanel = Ext.extend(Pan.base.grid.GridPanel, {
    initComponent: function () {
        Ext.apply(this, {
            xtype: "pan-grid",
            singleSelect: true,
            supportFastRender: false,
            hasAdjustColumnMenu: false,
            forceFit: true,
            columns: [{header: _T("Receive Time"), dataIndex: 'time_generated', width: 50, sortable: true}, {
                header: _T("Log"), dataIndex: 'logtype', width: 50, sortable: true, renderer: function (val) {
                    var result = '';
                    switch (val) {
                        case"panflex/Traps_ESM/THREAT":
                            result = "Traps ESM Threat";
                            break;
                        case"panflex/Traps_ESM/SYSTEM":
                            result = "Traps ESM System";
                            break;
                        case"panflex/Traps_ESM/POLICY2":
                            result = "Traps ESM Policy";
                            break;
                        default:
                            result = val;
                    }
                    return result;
                }
            }, {header: _T("Device Name"), dataIndex: 'device_name', width: 50, sortable: true}, {
                header: _T("URL"),
                dataIndex: 'url',
                width: 80,
                hidden: true,
                sortable: true
            }, {
                header: _T("Evidence"),
                dataIndex: 'evidence',
                width: 180,
                sortable: true,
                renderer: function (val, meta, rec) {
                    var excludeFields = ["time_generated", "device_name", "logtype", "seqno", "serial", "sessionid", "threatid", "hostname", "record_type", "vendor_id"];
                    var result = "";
                    var logType = rec.json.logtype;
                    var label, text;
                    var spyware = Pan.appframework.PanPredefinedCache.getCacheType("spyware").getData();
                    var vulnerability = Pan.appframework.PanPredefinedCache.getCacheType("vulnerability").getData();
                    if (rec.json.threatid && logType !== "data") {
                        var threatid = rec.json.threatid;
                        var threat = _.find(spyware, function (threat) {
                            return threat['@name'] == threatid;
                        }) ? _.find(spyware, function (threat) {
                            return threat['@name'] == threatid;
                        }) : _.find(vulnerability, function (threat) {
                            return threat['@name'] == threatid;
                        });
                        label = _.find(spyware, function (threat) {
                            return threat['@name'] == threatid;
                        }) ? "Spyware signature name" : "Threat signature name";
                        if (threat && label) {
                            result = label + ": " + threat.threatname;
                        }
                        else {
                            result = "Threat ID: " + threatid;
                        }
                    }
                    if (!rec.json.evidence) {
                        for (var key in rec.json) {
                            label = key;
                            if (logType === "auth" && key === "event") {
                                if (Pan.monitor.common.LogTypes.authEventEnum[rec.json[key]]) {
                                    text = Pan.monitor.common.LogTypes.authEventEnum[rec.json[key]];
                                }
                                else {
                                    text = Ext.isString(rec.json[key]) ? rec.json[key] : "none";
                                }
                            }
                            else {
                                text = Ext.isString(rec.json[key]) ? rec.json[key] : "none";
                            }
                            if ((excludeFields.indexOf(key) === -1 || (logType === "data" && key === "threatid")) && !Ext.isEmpty(rec.json[key])) {
                                if (Pan.monitor.common.LogTypes.fieldsMaps.evidence[key]) {
                                    label = Pan.monitor.common.LogTypes.fieldsMaps.evidence[key];
                                }
                                else if (Pan.monitor.common.LogTypes.fieldsMaps[logType] && Pan.monitor.common.LogTypes.fieldsMaps[logType][key]) {
                                    label = Pan.monitor.common.LogTypes.fieldsMaps[logType][key];
                                }
                                else if (Pan.monitor.common.LogTypes.fieldsMaps.common[key]) {
                                    label = Pan.monitor.common.LogTypes.fieldsMaps.common[key];
                                }
                                result += result.length !== 0 ? ", " : "";
                                result += label + ": " + text;
                                rec.json.evidence = result;
                            }
                        }
                    }
                    else {
                        result = rec.json.evidence;
                    }
                    return result;
                }
            }],
            store: {
                ztype: Pan.base.autorender.GridRecordStore,
                zconfig: {
                    sortInfo: {field: 'receive_time', direction: "ASC"},
                    fields: Pan.monitor.common.LogTypes.fields,
                    localStore: true,
                    reader: Ext.extend(Ext.data.JsonReader, {})
                }
            },
            hasGridFilter: false,
            miniCellRowLines: false,
            loadMask: true,
            stripeRows: true,
            listeners: {
                'afterrender': function () {
                    var selModel = Ext.getCmp("corr_detail_log_viewer_south").selModel;
                    selModel.selectFirstRow();
                }
            }
        });
        Pan.monitor.log.correlation.RelatedLogGridPanel.superclass.initComponent.apply(this, arguments);
        this.getSelectionModel().addListener('rowselect', function (selModel, index) {
            if (!this.__onSelectDelayedTask) {
                this.__onSelectDelayedTask = new Ext.util.DelayedTask(this.onSelect, this);
            }
            if (selModel.lastMouseEvent && selModel.lastMouseEvent.rowIndex === index) {
                this.__onSelectDelayedTask.delay(0, this.onSelect, this, arguments);
            }
            else {
                this.__onSelectDelayedTask.delay(500, this.onSelect, this, arguments);
            }
        }, this);
        this.queryData();
    }, onDestroy: function () {
        this.getSelectionModel().purgeListeners();
        Pan.monitor.log.correlation.RelatedLogGridPanel.superclass.onDestroy.apply(this, arguments);
    }, getDetailedLogQuery: function (rec) {
        var str, query = '';
        var commonFields = ['serial', 'seqno', 'time_generated', 'filedigest', 'hash'];
        commonFields.forEach(function (field) {
            if (rec[field] && Ext.isString(rec[field])) {
                str = '(' + field + ' eq \'' + rec[field] + '\')';
                query += query === '' ? str : ' and ' + str;
            }
        });
        return query;
    }, pollCorrEvidenceLogs: function (result, rec) {
        var pollJob = function (id, type) {
            var log = PanLogging.getLogger('device:setup:SetupHSMViewer');
            if (!Ext.isNumber(id)) {
                log.warn('*** pollLogRequest id is malformed');
                log.warn(id);
                return;
            }
            PanDirect.run('MonitorDirect.pollLogRequest', [id, {logtype: rec.json.logtype}], function (xmlString) {
                var doc;
                try {
                    if (window.ActiveXObject) {
                        doc = new ActiveXObject("Microsoft.XMLDOM");
                        doc.async = "false";
                        doc.loadXML(xmlString);
                    }
                    else {
                        doc = new DOMParser().parseFromString(xmlString, "text/xml");
                    }
                }
                catch (e) {
                    Pan.base.msg.alert('Invalid XML response from server');
                    return;
                }
                var finish = false;
                var status = doc.getElementsByTagName("status");
                if (status && status[0] && status[0].childNodes && status[0].childNodes[0]) {
                    finish = status[0].childNodes[0].nodeValue == 'FIN';
                    if (!finish) {
                        (function () {
                            pollJob(id, type);
                        }).defer(5000);
                    }
                    else {
                        this.lastJobId = null;
                        var urlDB = doc.getElementsByTagName("logs")[0].getAttribute("urlDB");
                        PanDirect.run('MonitorDirect.retrieveJSONLog', [xmlString], function (JSONLog) {
                            if (rec.json.url) {
                                rec.json.misc = rec.json.url;
                            }
                            var data = {data: Ext.apply(rec.json, Ext.isDefined(JSONLog[0]) ? JSONLog[0] : {})};
                            var cont = Ext.getCmp('DetailLogHolder');
                            var type = rec.data.logtype.toLowerCase();
                            if (cont) {
                                cont.remove('detail_log_viewer', true);
                                cont.insert(0, {
                                    xtype: 'corrdetaillogviewer',
                                    level: 2,
                                    id: 'detail_log_viewer',
                                    logtype: type,
                                    urlDB: urlDB,
                                    data: data,
                                    responseText: ''
                                });
                                cont.doLayout();
                            }
                            cont = Ext.getCmp('DetailLogHolder');
                            var mask = new Pan.base.widgets.LoadMask(cont.el, {msg: _T('Generating...')});
                            mask.hide();
                        }, this);
                    }
                }
            }, this);
        };
        pollJob(result, rec.json.logtype);
    }, onSelect: function (selModel, index, rec) {
        if (this.lastJobId) {
            PanDirect.run("MonitorDirect.stopUserActivityReportJob", [this.lastJobId], function () {
                this.lastJobId = null;
            });
        }
        var query = this.getDetailedLogQuery(rec.json);
        PanDirect.run("MonitorDirect.enqueueCorrEvidenceLogRequest", [{
            logtype: rec.json.logtype,
            query: query
        }], function (jobId) {
            var cont = Ext.getCmp('DetailLogHolder');
            var mask = new Pan.base.widgets.LoadMask(cont.el, {msg: _T('Generating...')});
            mask.show();
            this.lastJobId = jobId;
            this.pollCorrEvidenceLogs(jobId, rec, this.store);
        }, this);
        if (this.ownerCt && this.ownerCt.setAlignAndShow) {
            this.ownerCt.setAlignAndShow();
        }
        var win = Ext.getCmp('MatchesDetailedLogPanel');
        for (var m in win.loadMasks) {
            if (win.loadMasks.hasOwnProperty(m)) {
                if (win.loadMasks[m]) {
                    win.loadMasks[m].hide();
                    win.loadMasks[m].destroy();
                }
            }
        }
        var cont = Ext.getCmp('DetailLogHolder');
        var mask = new Pan.base.widgets.LoadMask(cont.el, {msg: _T('Generating...')});
        mask.hide();
    }, retrieveEmailHdrUserIDsAjaxCallback: function (record, resp) {
        if (resp && resp['result']) {
            record.set('recipient-userid', resp['result']);
            var config = {};
            config.logtype = "wildfire";
            config.data = record;
            var cont = Ext.getCmp("detail_composite_container");
            cont.removeAll();
            cont.insert(0, {
                xtype: 'CorrCommonDLogCompositeViewer',
                logtype: "wildfire",
                useList: true,
                data: record,
                config: config
            });
            cont.doLayout();
        }
        var win = Ext.getCmp('Pan.monitor.log.DetailedLogWin');
        for (var m in win.loadMasks) {
            if (win.loadMasks.hasOwnProperty(m)) {
                if (win.loadMasks[m]) {
                    win.loadMasks[m].hide();
                    win.loadMasks[m].destroy();
                }
            }
        }
    }, retrieveEmailHdrUserIDs: function (record) {
        var self = this;
        var emails = record.data.recipient;
        if (Ext.isEmpty(emails)) {
            var win = Ext.getCmp('Pan.monitor.log.DetailedLogWin');
            var mask = win && win.loadMasks && win.loadMasks["Email Headers"];
            if (mask) {
                mask.hide();
                mask.destroy();
            }
            return;
        }
        var myvsys = record.data['vsys'];
        var serial = record.data['serial'];
        var allvsys = {};
        if (!Pan.global.isCms()) {
            allvsys = Pan.global.CONTEXT.accessibleVsys;
        }
        else {
            if (serial) {
                if (Pan.monitor.cmsVsys2DisplayNameMapping[serial]) {
                    allvsys = Pan.monitor.cmsVsys2DisplayNameMapping[serial];
                }
            }
        }
        for (var m in allvsys) {
            if (allvsys.hasOwnProperty(m)) {
                if (allvsys[m] == myvsys) {
                    myvsys = m;
                    break;
                }
            }
        }
        PanDirect.run('LogData.retrieveEmailHdrUserIDs', [emails, myvsys, serial], function (resp) {
            self.retrieveEmailHdrUserIDsAjaxCallback(record, resp);
        });
    }, queryData: function () {
        var config = this;
        if (config.logtype === 'corr') {
            config.logtype = 'corr-detail';
        }
        if (config.level == 1) {
            var httpHeaderCorelation = [config.logtype, config.data];
            var params = {
                logtype: config.logtype,
                anchor: config.data.id,
                responseText: config.responseText,
                data: config.data.data
            };
            PanDirect.run('MonitorDirect.enqueueRelatedLogRequest', [params], function (jobids) {
                if (Ext.isArray(jobids) && jobids.length == 3) {
                    jobids.splice(0, 1);
                }
                this.pollRelatedLogs(jobids, httpHeaderCorelation, this.store);
            }, this);
        }
    }, pollRelatedLogs: function (result, httpHeaderCorelation, store) {
        var insertedEntry = null;
        if (this.data.data.objectname === "wildfire-c2") {
            var re = new RegExp(/\(sha256\:(.*?)\)/);
            var summary = this.data.data.summary;
            var sha256 = re.exec(summary)[1];
            insertedEntry = {"logtype": "wildfire", "filedigest": sha256};
        }
        var pollJob = function (id, type, insertedEntry) {
            if (!Ext.isNumber(id)) {
                var log = PanLogging.getLogger('device:setup:SetupHSMViewer');
                log.warn('*** pollLogRequest id is malformed');
                log.warn(id);
                return;
            }
            PanDirect.run('MonitorDirect.pollCorrLogRequest', [id, {logtype: 'corr-detail'}, insertedEntry], function (xmlString) {
                var doc;
                try {
                    if (window.ActiveXObject) {
                        doc = new ActiveXObject("Microsoft.XMLDOM");
                        doc.async = "false";
                        doc.loadXML(xmlString);
                    }
                    else {
                        doc = new DOMParser().parseFromString(xmlString, "text/xml");
                    }
                }
                catch (e) {
                    Pan.base.msg.alert('Invalid XML response from server');
                    return;
                }
                var finish = false;
                var status = doc.getElementsByTagName("status");
                if (status && status[0] && status[0].childNodes && status[0].childNodes[0]) {
                    finish = status[0].childNodes[0].nodeValue == 'FIN';
                    if (!finish) {
                        (function () {
                            pollJob(id, type, insertedEntry);
                        }).defer(5000);
                    }
                    else {
                        PanDirect.run('MonitorDirect.retrieveCorrJsonLog', [xmlString, insertedEntry], function (JSONLog) {
                            var relatedloggridstore = store;
                            if (insertedEntry) {
                                JSONLog.push(insertedEntry);
                            }
                            relatedloggridstore.loadData(JSONLog, true);
                            relatedloggridstore.commitChanges();
                            var selModel = Ext.getCmp("corr_detail_log_viewer_south").selModel;
                            selModel.selectFirstRow();
                            if (httpHeaderCorelation[0] == 'threat' || httpHeaderCorelation[0] == 'wildfire') {
                                var returnedstorequery = relatedloggridstore.queryBy(function (record) {
                                    return (record.get('subtype') == "url" && record.get('url_idx') == httpHeaderCorelation[1].data.url_idx);
                                });
                                if (returnedstorequery) {
                                    if (returnedstorequery.items) {
                                        if (returnedstorequery.items[0]) {
                                            var referer = '', xff = '', user_agent = '';
                                            for (var i = 0; i < returnedstorequery.items.length; i++) {
                                                if (returnedstorequery.items[i].data.referer != '' || returnedstorequery.items[i].data.xff != '' || returnedstorequery.items[i].data.user_agent != '') {
                                                    referer = returnedstorequery.items[i].data.referer;
                                                    xff = returnedstorequery.items[i].data.xff;
                                                    user_agent = returnedstorequery.items[i].data.user_agent;
                                                    break;
                                                }
                                            }
                                            httpHeaderCorelation[1].data['referer'] = referer;
                                            httpHeaderCorelation[1].data['xff'] = xff;
                                            httpHeaderCorelation[1].data['user_agent'] = user_agent;
                                            var config = {};
                                            config.logtype = httpHeaderCorelation[0];
                                            config.data = httpHeaderCorelation[1];
                                            var cont = Ext.getCmp("detail_composite_container");
                                            cont.removeAll();
                                            cont.insert(0, {
                                                xtype: 'CorrCommonDLogCompositeViewer',
                                                logtype: httpHeaderCorelation[0],
                                                data: httpHeaderCorelation[1],
                                                config: config,
                                                useList: true
                                            });
                                            cont.doLayout();
                                        }
                                    }
                                }
                            }
                        }, this);
                    }
                }
            }, this);
        };
        if (result && result[0]) {
            pollJob(result[0], 'traffic', insertedEntry);
        }
        if (result && result[1]) {
            pollJob(result[1], 'content', insertedEntry);
        }
    }
});
Ext.reg("Pan.monitor.log.correlation.RelatedLogGridPanel", Pan.monitor.log.correlation.RelatedLogGridPanel);