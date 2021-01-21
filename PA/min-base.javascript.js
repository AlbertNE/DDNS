umd.require.config({paths: {'pan': 'Pan', 'underscore': '_'}});
var Pbase = (function (modules) {
    var installedModules = {};

    function __webpack_require__(moduleId) {
        if (installedModules[moduleId])
            return installedModules[moduleId].exports;
        var module = installedModules[moduleId] = {i: moduleId, l: false, exports: {}};
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
        module.l = true;
        return module.exports;
    }

    __webpack_require__.m = modules;
    __webpack_require__.c = installedModules;
    __webpack_require__.i = function (value) {
        return value;
    };
    __webpack_require__.d = function (exports, name, getter) {
        if (!__webpack_require__.o(exports, name)) {
            Object.defineProperty(exports, name, {configurable: false, enumerable: true, get: getter});
        }
    };
    __webpack_require__.n = function (module) {
        var getter = module && module.__esModule ? function getDefault() {
            return module['default'];
        } : function getModuleExports() {
            return module;
        };
        __webpack_require__.d(getter, 'a', getter);
        return getter;
    };
    __webpack_require__.o = function (object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    };
    __webpack_require__.p = "";
    return __webpack_require__(__webpack_require__.s = 4);
})
([(function (module, exports, __webpack_require__) {
    var _ = __webpack_require__(3);
    var optionUtility = {
        inject: function (target, source, options) {
            if (arguments.length === 2) {
                options = arguments[1];
                source = arguments[0];
                target = {};
            }
            var name;
            for (name in source) {
                if (source.hasOwnProperty(name)) {
                    target[name] = source[name];
                }
            }
            for (name in options) {
                if (options.hasOwnProperty(name)) {
                    var property = options[name];
                    if (property == null)
                        continue;
                    if (_.isPlainObject(property)) {
                        target[name] = this.inject(target[name], property);
                    }
                    else {
                        target[name] = property;
                    }
                }
            }
            return target;
        }
    };
    module.exports = optionUtility;
}), (function (module, exports) {
    Ext.ns('Ext.PanDirect');
    Ext.PanDirect.REMOTING_API = {
        'url': '/php/utils/router.php',
        'type': 'remoting',
        'enableBuffer': false,
        'actions': {'PanDirect': [{'name': 'run', 'len': 2}, {'name': 'execute', 'len': 2}]}
    };
    Ext.Direct.addProvider(Ext.PanDirect.REMOTING_API);
    Ext.apply(window.PanDirect, {
        runCallback: function (method) {
            var fn = function () {
                var args = [];
                for (var i = 0; i < arguments.length - 1; i++) {
                    if (Ext.isFunction(arguments[i])) {
                        break;
                    }
                    args.push(arguments[i]);
                }
                var realArgs = [method, args];
                for (var j = i; j < arguments.length; j++) {
                    realArgs.push(arguments[j]);
                }
                return PanDirect.run.apply(undefined, realArgs);
            };
            fn.directCfg = Ext.apply({}, PanDirect.run.directCfg);
            return fn;
        }
    });
    module.exports = window.PanDirect;
}), (function (module, exports) {
    module.exports = Ext;
}), (function (module, exports) {
    module.exports = _;
}), (function (module, exports, __webpack_require__) {
    "use strict";
    __webpack_require__(2);
    var direct = __webpack_require__(1);
    exports.direct = direct;
    var optionUtility = __webpack_require__(0);
    exports.optionUtility = optionUtility;
})]);
(function () {
    Ext.ns('Pan');
    Pan.direct = Pbase.direct;
})();
Ext.ns('Pan.base');
Pan.base.optionUtility = Pbase.optionUtility;
(function () {
    var util = {
        findComponentWithProperty: Pan.ext.util.findComponentWithProperty,
        findOwnerCtBy: Pan.ext.util.findOwnerCtBy,
        findOwnerCtByXtype: Pan.ext.util.findOwnerCtByXtype,
        xmlEncode: PanXml.escape,
        getNumericSuffix: function (number) {
            if (isNaN(number)) {
                return "";
            }
            number = Math.abs(parseInt(number, 10));
            switch (number % 10) {
                case 1:
                    return _T("st");
                case 2:
                    return _T("nd");
                case 3:
                    return _T("rd");
                default:
                    return _T("th");
            }
        },
        xmlFormat: PanXml.prettify,
        selectiveApply: function (listOfProperties, o, c, defaults) {
            if (defaults) {
                util.selectiveApply(listOfProperties, o, defaults);
            }
            if (o && c && typeof c == 'object') {
                for (var p in c) {
                    if (c.hasOwnProperty(p)) {
                        if (listOfProperties.indexOf(p) >= 0) {
                            o[p] = c[p];
                        }
                    }
                }
            }
            return o;
        },
        selectiveApplyIf: function (listOfProperties, o, c) {
            if (o) {
                for (var p in c) {
                    if (c.hasOwnProperty(p)) {
                        if (!Ext.isDefined(o[p]) && listOfProperties.indexOf(p) >= 0) {
                            o[p] = c[p];
                        }
                    }
                }
            }
            return o;
        },
        capitalize: function (val) {
            val = val || '';
            val = val.replace(/-/g, ' ');
            val = val.replace(/^[@]/g, '');
            return val.replace(/(^|\s)([a-z])/g, function (m, p1, p2) {
                return p1 + p2.toUpperCase();
            });
        },
        decapitalize: function (val) {
            val = val || '';
            return val.replace(/ /g, '-').toLowerCase();
        },
        prettyPrintNumber: function (count, base, decimalPlaces) {
            if (!decimalPlaces) decimalPlaces = 1;
            if (!base) {
                base = 1000;
            }
            if (count < base) {
                return count;
            }
            var units = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
            for (var i = 0; i < units.length; i++) {
                if (count < Math.pow(base, i + 2)) {
                    break;
                }
            }
            if (i >= units.length) {
                i = units.length - 1;
            }
            return (count / (0.0 + Math.pow(base, i + 1))).toFixed(decimalPlaces) + units[i];
        },
        numberFormat: function (v) {
            var whole = String(v);
            var r = /(\d+)(\d{3})/;
            while (r.test(whole)) {
                whole = whole.replace(r, '$1' + ',' + '$2');
            }
            return whole;
        },
        contains: function (a, e) {
            for (var j = 0; j < a.length; j++) {
                if (a[j] == e) {
                    return true;
                }
            }
            return false;
        },
        unique: function (a) {
            var temp = [];
            for (var i = 0; i < a.length; i++) {
                if (!util.contains(temp, a[i])) {
                    temp.length += 1;
                    temp[temp.length - 1] = a[i];
                }
            }
            return temp;
        },
        createExtension: function (func, superFunc, scope) {
            var rv = function () {
                var me = scope || this || window;
                return func.apply(me, arguments);
            };
            func.scope = scope;
            func.superFunction = superFunc;
            rv.scope = scope;
            rv.superFunction = superFunc;
            return rv;
        },
        createFirstIntercept: function (firstInterceptFunc, nthTimeFunc, scope) {
            var func = firstInterceptFunc;
            return function () {
                var that = scope || this || window;
                var result = func.apply(that, arguments);
                func = nthTimeFunc;
                return result;
            };
        },
        cextend: (function () {
            var oc = Object.prototype.constructor;
            var isUseSuperClass = function (useSuperClass, scope, config) {
                if (Ext.isBoolean(useSuperClass)) {
                    return useSuperClass;
                }
                else if (Ext.isFunction(useSuperClass)) {
                    return useSuperClass.call(scope);
                }
                else if (Ext.isString(useSuperClass)) {
                    if (Ext.isObject(config)) {
                        if (Ext.isBoolean(config[useSuperClass])) {
                            return config[useSuperClass];
                        }
                    }
                    var m = scope[useSuperClass];
                    if (m != undefined) {
                        return isUseSuperClass(m, scope, undefined);
                    }
                }
                return false;
            };
            return function (ownClass, superClass, useSuperClass, overrides) {
                if (Ext.isObject(useSuperClass)) {
                    overrides = useSuperClass;
                    useSuperClass = superClass;
                    superClass = ownClass;
                    ownClass = overrides.constructor != oc ? overrides.constructor : null;
                }
                var ctor = function (config) {
                    var me = arguments.callee;
                    this.__isUseSuperClass = isUseSuperClass(me.useSuperClass, this, config);
                    var callFunction = me.ownClass;
                    if (!callFunction) {
                        if (!this.__isUseSuperClass) {
                            callFunction = me.superClass.superclass.constructor;
                        }
                        else {
                            callFunction = me.superClass;
                        }
                    }
                    return callFunction.apply(this, arguments);
                };
                ctor.superClass = superClass;
                ctor.ownClass = ownClass;
                ctor.useSuperClass = useSuperClass;
                var hasSeenConstructor = false;
                for (var m in superClass.prototype) {
                    if (m === 'constructor') {
                        hasSeenConstructor = true;
                    }
                    util.setupCExtendIntercept(superClass, m);
                }
                if (!hasSeenConstructor) {
                    util.setupCExtendIntercept(superClass, 'constructor');
                }
                var extExtendResult = Ext.extend(ctor, superClass, overrides);
                extExtendResult.prototype.constructor = extExtendResult;
                return extExtendResult;
            };
        })(),
        setupCExtendIntercept: function (superClass, m) {
            if (superClass.prototype.hasOwnProperty(m)) {
                var original = superClass.prototype[m];
                if (Ext.isFunction(original)) {
                    var newFunc = function () {
                        var me = arguments.callee;
                        if (this.__isUseSuperClass) {
                            return me.superFunction.apply(this, arguments);
                        }
                        else {
                            if (me.superFunction.superFunction) {
                                return me.superFunction.superFunction.apply(this, arguments);
                            }
                            else {
                                throw"util.cextend: superFunction.superFunction does not exist!";
                            }
                        }
                    };
                    newFunc.superFunction = original;
                    newFunc.superFunction.superFunction = superClass.superclass[m];
                    superClass.prototype[m] = newFunc;
                }
            }
        },
        invokeLater: function (delayInMilliSeconds, func, scope, args) {
            if (!delayInMilliSeconds) {
                delayInMilliSeconds = 0;
            }
            var task = new Ext.util.DelayedTask(func, scope, args);
            task.delay(delayInMilliSeconds);
        },
        yes2TrueFn: function (value) {
            return value === "yes";
        },
        integrateArray: function (master, entry) {
            if (master) {
                if (!Ext.isArray(master)) {
                    master = [master];
                }
                else {
                    master = master.slice(0);
                }
                if (Ext.isArray(entry)) {
                    for (var i = 0; i < entry.length; i++) {
                        master.push(entry[i]);
                    }
                }
                else if (entry) {
                    master.push(entry);
                }
            }
            else if (Ext.isArray(entry)) {
                master = entry.slice(0);
            }
            else {
                master = [entry];
            }
            return master;
        },
        getFileNameFromFullPath: function (fullPath) {
            var theFileName = '';
            var fileName = Ext.util.Format.trim(fullPath);
            if (fileName.length === 0)
                return theFileName;
            var idx = fileName.lastIndexOf("/");
            if (idx >= 0) {
                theFileName = fileName.substring(idx + 1);
            }
            else {
                idx = fileName.lastIndexOf("\\");
                if (idx >= 0) {
                    theFileName = fileName.substring(idx + 1);
                }
                else {
                    theFileName = fileName;
                }
            }
            return theFileName;
        },
        openModalWindow: function (url, name, width, height) {
            var newWin;
            if (window.showModalDialog) {
                var myObject = {};
                myObject.openerWindow = window;
                myObject.windowName = name;
                try {
                    window.showModalDialog(url, myObject, "dialogHeight:" + height + " px;dialogWidth:" + width + " px;center:yes;resizable:yes;scroll:yes;status:no;help:no;edge:sunken;unadorned:yes");
                }
                catch (e) {
                    alert("Cannot open popup dialog. Please check browser settings.");
                }
            }
            else {
                newWin = window.open(url, name, "height=" + height + ",width=" + width + ",center=yes,resizable=yes,toolbar=no,directories=no,status=no,linemenubar=no,scrollbars=yes,modal=yes");
                if (!newWin) {
                    alert("Cannot open popup dialog. Please check browser settings.");
                    return;
                }
                newWin.focus();
            }
        },
        stripHtmlAndEncode: function (data) {
            if (Ext.isArray(data)) {
                var lines = data.slice(0);
                for (var i = 0; i < lines.length; i++) {
                    if (Ext.isString(lines[i])) {
                        var line = Pan.base.htmlEncode(((lines[i]).replace(/<[^>]*>/g, '\n')));
                        lines[i] = line.trim().replace(/\n\s*/g, ' ');
                    }
                    else {
                        lines[i] = "";
                    }
                }
                return lines;
            }
            else if (Ext.isString(data)) {
                return Pan.base.util.stripHtmlAndEncode([data])[0];
            }
            else if (Ext.isObject(data)) {
                return "";
            }
            else {
                return data;
            }
        },
        array2HTMLList: function (data, listStyle) {
            var lines = [];
            if (Ext.isArray(data)) {
                lines = data;
            }
            else if (data) {
                lines = [data];
            }
            var htmlList = '<ul>';
            for (var i = 0; i < lines.length; i++) {
                if (Ext.isEmpty(lines[i]))
                    htmlList += '<li/>'; else if (lines.length == 1 || lines[i].indexOf('<div>') == 0 || lines[i].trim().length == 0)
                    htmlList += '<li>' + lines[i] + '</li>'; else {
                    htmlList += '<li>';
                    if (listStyle !== "none") {
                        htmlList += '<b>. </b>';
                    }
                    htmlList += lines[i] + '</li>';
                }
            }
            htmlList += '</ul>';
            return htmlList;
        },
        array2IndentedHTMLList: function (data) {
            if (Ext.isArray(data) && data.length == 1) {
                return '<ul><li><b>. </b>' + data[0] + '</li></ul>';
            }
            return util.array2HTMLList(data);
        },
        splitByLength: function (str, length, separator) {
            if (str && str.length > length) {
                if (!Ext.isDefined(separator)) {
                    separator = "\n";
                }
                var collection = [];
                while (str.length > length) {
                    collection.push(str.substr(0, length));
                    str = str.substr(length);
                }
                if (str.length > 0) {
                    collection.push(str);
                }
                return collection.join(separator);
            }
            else {
                return str;
            }
        },
        epoch: function (arg) {
            var newDateLong = function (year, month, date, hour, minute, second, millisecond) {
                return new Date(year, month, date, hour, minute, second, millisecond);
            };
            var d;
            if (arguments.length > 1) {
                d = newDateLong.apply(null);
            }
            else if (arguments.length == 1) {
                d = new Date(arg);
            }
            else {
                d = new Date();
            }
            return Math.round(d.getTime() / 1000.0);
        },
        naturalSortObjectArray: function (arr, sortProperty) {
            if (arr && arr.sort && sortProperty) {
                arr.sort(function (a, b) {
                    var ca = util.jsonPathOutputToString(a, sortProperty);
                    var cb = util.jsonPathOutputToString(b, sortProperty);
                    return util.naturalSortCmp.call(null, ca, cb);
                });
            }
        },
        jsonPathOutputToString: function (obj, sortProperty) {
            var v = jsonPath(obj, '$.' + sortProperty);
            if (Ext.isArray(v)) v = v[0];
            if (_.isNumber(v)) {
                return v.toString();
            }
            else if (v) {
                return v;
            }
            else {
                return '';
            }
        },
        naturalSort: function (arr) {
            arr.sort(util.naturalSortCmp);
        },
        naturalSortCmp: function (a, b) {
            a = util.stringSortTypeFunction(a);
            b = util.stringSortTypeFunction(b);
            if (a === b) {
                return 0;
            }
            else if (a < b) {
                return -1;
            }
            else {
                return +1;
            }
        },
        stringSortTypeFunction: function (s) {
            var a = s.toLowerCase().match(/(\d+|[^\d]+)/g);
            if (a && a.length > 0) {
                var index = 0;
                if (isNaN(parseInt(a[0], 10))) {
                    index++;
                }
                for (var i = index; i < a.length; i += 2) {
                    a[i] = util.padLeadingString(a[i], 10, "0000000000");
                }
                return a.join("");
            }
            return s;
        },
        padLeadingString: function (n, len, padString) {
            var s = n.toString();
            if (s.length < len) {
                s = (padString + s).slice(-len);
            }
            return s;
        },
        getLeafNodes: function (o, withKey) {
            var leaves = [];

            function js_traverse(obj, key) {
                var type = typeof obj;
                if (type == "object") {
                    for (var n in obj) {
                        if (obj.hasOwnProperty(n)) {
                            js_traverse(obj[n], n);
                        }
                    }
                }
                else {
                    if (withKey == true) {
                        leaves.push([key, obj]);
                    }
                    else {
                        leaves.push(obj);
                    }
                }
            }

            js_traverse(o);
            return leaves;
        },
        findRootOwnerCt: function (component) {
            var ownerCt = component;
            while (ownerCt.ownerCt) {
                ownerCt = ownerCt.ownerCt;
            }
            return ownerCt;
        },
        getAllChildItems: function (container, filter) {
            var results = [];

            function getAllChildItemsHelper(container, filter) {
                var items = null;
                if (container.items && container.items.items) {
                    items = container.items.items;
                }
                if (items) {
                    items = items.filter(function (item) {
                        return typeof item === 'object' && item.id && item.id.indexOf('ext-comp') === 0;
                    });
                    if (filter && Ext.isFunction(filter))
                        items = items.filter(filter);
                    for (var i = 0; i < items.length; i++) {
                        var currentItem = items[i];
                        if (currentItem.items && currentItem.items.items)
                            Array.prototype.push.apply(results, getAllChildItemsHelper(currentItem, filter)); else
                            results.push(currentItem);
                    }
                }
            }

            getAllChildItemsHelper(container, filter);
            return results;
        },
        needWrapParenthesis: function (str) {
            var len = str.length, i, c;
            if (!len) {
                return false;
            }
            var count = 0;
            var hasp = false;
            for (i = 0; i < len; i++) {
                c = str.charAt(i);
                if (c == '(') {
                    count++;
                    hasp = true;
                }
                else if (c == ')') {
                    count--;
                    hasp = true;
                }
                if (count == 0 && i != len - 1 && hasp) {
                    return true;
                }
            }
            return false;
        },
        convertToString: function (obj) {
            var exp;
            if (obj['k'] != undefined && obj['op'] != undefined && obj['v'] != undefined) {
                exp = ['(', obj['k'], ' ', obj['op'], ' \'', obj['v'], '\')'].join('');
                return !obj.__negate ? exp : 'not ' + exp;
            }
            if (obj.l && obj.r) {
                exp = ['(', util.convertToString(obj.l), ' or ', util.convertToString(obj.r), ')'].join('');
                return !obj.__negate ? exp : 'not ' + exp;
            }
            if (Ext.isArray(obj)) {
                var arr = [];
                for (var i = 0; i < obj.length; i++) {
                    arr.push(util.convertToString(obj[i]));
                }
                return !obj.__negate ? arr.join(' and ') : 'not (' + arr.join(' and ') + ')';
            }
        },
        optimize: function (obj) {
            if (obj['k']) return obj;
            if (obj.l && obj.r) {
                return {l: util.optimize(obj.l), r: util.optimize(obj.r)};
            }
            var changed = false;
            if (Ext.isArray(obj)) {
                var i, j, len = obj.length;
                for (i = 0; i < len; i++) {
                    if (obj[i].__negate == true) {
                        for (j = len - 1; j >= 0; j--) {
                            if (i != j) {
                                var left = obj[j].l;
                                var right = obj[j].r;
                                if (left) {
                                    left.__negate = true;
                                    if (JSON.stringify(left) == JSON.stringify(obj[i])) {
                                        delete left.__negate;
                                        delete obj[j].l;
                                        obj[j] = obj[j].r;
                                        changed = true;
                                    }
                                    else {
                                        delete left.__negate;
                                    }
                                }
                                if (right) {
                                    right.__negate = true;
                                    if (JSON.stringify(right) == JSON.stringify(obj[i])) {
                                        delete right.__negate;
                                        delete obj[j].r;
                                        obj[j] = obj[j].l;
                                        changed = true;
                                    }
                                    else {
                                        delete right.__negate;
                                    }
                                }
                                if (!obj[j]) {
                                    obj.splice(j, 1);
                                }
                            }
                        }
                    }
                }
            }
            if (changed) {
                return util.optimize(obj);
            }
            else {
                return obj;
            }
        },
        getAttributeWidthValue: function (html) {
            var w = 0;
            if (Ext.isString(html)) {
                var newHtml = String(html).replace('&#160;', ' ');
                newHtml = String(newHtml).replace('&nbsp;', ' ');
                var element = $(newHtml);
                $(element[0] && element[0].attributes).each(function () {
                    if (this.nodeName === 'width') {
                        w += parseInt(this.nodeValue);
                    }
                });
            }
            return w;
        },
        textWidthCalculator: function (el) {
            var cellTextWidthMap = {};
            cellTextWidthMap[32] = el.getTextWidth("&#160;");
            for (var i = 33; i < 127; i++) {
                cellTextWidthMap[i] = el.getTextWidth(String.fromCharCode(i));
            }
            var stripDisplayNone = function (html) {
                if (Ext.isString(html)) {
                    var end, start = html.indexOf('<span style="display:none">');
                    if (start != -1) {
                        end = html.indexOf('</span>', start);
                        if (end != -1) {
                            html = html.substr(0, start) + html.substr(end);
                        }
                    }
                }
                return html;
            };
            return function (html) {
                if (!html) {
                    return 0;
                }
                var width = 0;
                var text = Ext.util.Format.stripTags(stripDisplayNone(html));
                text = String(text).replace('&#160;', ' ');
                text = String(text).replace('&nbsp;', ' ');
                for (var i = 0; i < text.length; i++) {
                    var current = cellTextWidthMap[text.charCodeAt(i)];
                    current = Ext.isNumber(current) ? current : cellTextWidthMap[37];
                    width += current;
                }
                if (typeof(html) == 'string') {
                    html.replace(/<img/g, function (match, offset, wholeString) {
                        var i = wholeString.indexOf('>', offset);
                        var w = Pan.base.util.getAttributeWidthValue(wholeString.substring(offset, i + 1));
                        if (w <= 0) {
                            w = 16;
                        }
                        width += w;
                        return '';
                    });
                    html.replace(/<div class="icon-tag/g, function () {
                        width += 12;
                        return '';
                    });
                    html.replace(/padding-right *: *[0-9]*/g, function (a) {
                        var parts = a.split(":");
                        if (parts.length > 1) {
                            var w = parseInt(parts[1]);
                            if (Ext.isNumber(w)) {
                                width += w;
                            }
                        }
                        return '';
                    });
                }
                return width;
            };
        },
        isEmpty: function (obj, allowBlank) {
            if (Ext.isObject(obj)) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        return false;
                    }
                }
                return true;
            }
            else {
                return Ext.isEmpty(obj, allowBlank);
            }
        },
        isSemanticTrue: function (value) {
            return Ext.isObject(value) || value === true || value === 'true' || value === 1 || value === 'yes';
        },
        diff: function (o1, o2) {
            return Ext.encode(o1) !== Ext.encode(o2);
        },
        ordinalNumberSuffix: function (num) {
            var tenth = num % 10;
            var hundredth = num % 100;
            if (tenth == 1 && hundredth != 11) {
                return num + "st";
            }
            else if (tenth == 2 && hundredth != 12) {
                return num + "nd";
            }
            else if (tenth == 3 && hundredth != 13) {
                return num + "rd";
            }
            else {
                return num + "th";
            }
        }
    };
    var base = Ext.ns('Pan.base');
    base.isEmpty = util.isEmpty;
    base.util = util;
}());
(function () {
    Ext.ns('Pan.base');
    var msgCt;

    function createBox(s) {
        return ['<div class="msg">', '<div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>', '<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc">', s, '</div></div></div>', '<div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>', '</div>'].join('');
    }

    var msg = function () {
        var title = '';
        if (!msgCt) {
            msgCt = Ext.DomHelper.insertFirst(document.body, {id: 'pan-base-msg-div'}, true);
        }
        msgCt.alignTo(document, 't-t');
        var s = String.format.apply(String, Array.prototype.slice.call(arguments, 0));
        var m = Ext.DomHelper.append(msgCt, {html: createBox(s, title)}, true);
        m.slideIn('t').pause(2).ghost("t", {remove: true});
    };
    Ext.apply(msg, {
        error: function (msg) {
            msg = String.format.apply(null, arguments);
            Pan.Msg.show({msg: msg, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.ERROR});
        }, warn: function (msg) {
            msg = String.format.apply(null, arguments);
            Pan.Msg.show({msg: msg, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING});
        }, alert: function (msg) {
            msg = String.format.apply(null, arguments);
            Pan.Msg.show({msg: msg, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.WARNING});
        }, info: function () {
            var msg = String.format.apply(null, arguments);
            Pan.Msg.show({msg: msg, buttons: Ext.MessageBox.OK, icon: Ext.MessageBox.INFO});
        }
    });
    Pan.base.msg = msg;
}());
(function () {
    var admin = _.extend(Pan.base.admin, {
        isVsysAdmin: function () {
            return (admin.role.indexOf('vsys') === 0 || (admin.role === 'custom' && admin.profileType === 'vsys'));
        }, isDeviceAdmin: function () {
            return admin.role.indexOf('device') === 0;
        }, isPanoramaAdmin: function () {
            return admin.role.indexOf('panorama') === 0 || (admin.role === 'custom' && admin.profileType === 'panorama');
        }, isSecurityAdmin: function () {
            return admin.profile === 'securityadmin' && admin.profileType === 'device' && admin.role === 'custom';
        }, isCryptoAdmin: function () {
            return admin.profile === 'cryptoadmin' && admin.profileType === 'device' && admin.role === 'custom';
        }, isAuditAdmin: function () {
            return admin.profile === 'auditadmin' && admin.profileType === 'device' && admin.role === 'custom';
        }, isDeviceGroupAdmin: function () {
            return Pan.global.isCmsSelected() && admin.profileType === 'device-group' && admin.role === 'custom';
        }, isDynamicReadOnlyUser: function () {
            return (admin.role.indexOf('reader') > 0);
        }, isSuperUser: function () {
            return (admin.role === 'superuser');
        }, getPermissionOne: function (xpath) {
            if (admin.isSuperUser()) {
                return 'enable';
            }
            if (xpath.indexOf('$') !== 0) {
                xpath = '$.' + xpath.replace(/\//g, '.');
            }
            if (xpath === '$.permission-all' && !admin.isDynamicReadOnlyUser()) {
                return 'enable';
            }
            if (Pan.global.isCmsSelected() && xpath === '$.device.password-profiles') {
                return admin.getPermission('device/administrators');
            }
            var permission = Pan.base.json.path(admin.permission, xpath);
            if (!permission || permission === 'disable') {
                return false;
            }
            if (xpath === '$.monitor.custom-reports') {
                for (var n in permission) {
                    if (permission[n] === 'enable') {
                        return 'enable';
                    }
                }
                return false;
            }
            if (admin.isVsysAdmin()) {
                switch (xpath) {
                    case'$.device.administrators':
                        return false;
                    case'$.device.access-domain':
                        return false;
                    default:
                        break;
                }
            }
            if (admin.isDeviceAdmin()) {
                switch (xpath) {
                    case'$.device.virtual-systems':
                        return false;
                    default:
                        break;
                }
            }
            return permission;
        }, getPermission: function (xpath) {
            if (Ext.isArray(xpath)) {
                var permission = false;
                for (var i = 0; i < xpath.length; i++) {
                    permission = admin.getPermissionOne(xpath[i]);
                    if (permission != false) {
                        return permission;
                    }
                }
                return permission;
            }
            return admin.getPermissionOne(xpath);
        }
    });
    Pan.base.admin = admin;
}());
(function () {
    var CONTEXT = Pan.global.CONTEXT;
    var SDBGENERAL = Pan.global.SDBGENERAL;
    var util = Pan.base.util;
    var msg = Pan.base.msg;
    var admin = Pan.base.admin;
    Ext.BLANK_IMAGE_URL = '/images/s.gif';
    var contextLoc = CONTEXT.loc;
    delete CONTEXT.loc;
    var __loc;
    var firstPossibleLoc;
    var evaluateAccessibleObjects = function (accessibleObjects) {
        if (contextLoc === '') {
            __loc = contextLoc;
            return;
        }
        if (!Ext.isDefined(__loc) && Ext.isObject(accessibleObjects)) {
            if (accessibleObjects[contextLoc]) {
                __loc = contextLoc;
            }
            if (!Ext.isDefined(firstPossibleLoc)) {
                var possibleLoc;
                for (possibleLoc in accessibleObjects) {
                    if (accessibleObjects.hasOwnProperty(possibleLoc)) {
                        firstPossibleLoc = possibleLoc;
                        break;
                    }
                }
            }
        }
    };
    evaluateAccessibleObjects(CONTEXT.accessibleDg);
    evaluateAccessibleObjects(CONTEXT.accessibleVsys);
    evaluateAccessibleObjects(CONTEXT.accessibleSg);
    if (!Ext.isDefined(__loc) && Ext.isDefined(firstPossibleLoc)) {
        __loc = firstPossibleLoc;
    }
    var PanGlobal = {
        CONTEXT: CONTEXT, SDBGENERAL: SDBGENERAL, isMultiVsys: function () {
            var settings = PanGlobal.getSettingsForCurrentTemplate();
            if (!util.isEmpty(settings) && Ext.isDefined(settings['isMultiVsys'])) {
                CONTEXT.isMultiVsys = settings['isMultiVsys'];
            }
            return CONTEXT.isMultiVsys;
        }, isCmsSelected: function () {
            return CONTEXT.isCmsSelected;
        }, isCms: function () {
            return CONTEXT.isCms;
        }, isCmsRemoteSession: function () {
            return CONTEXT.cmsRemoteSession;
        }, isMerlin: function () {
            return CONTEXT.family === '200';
        }, isKingfisher: function () {
            return CONTEXT.family === '220';
        }, isPhoenixVM: function () {
            return CONTEXT.family === 'vm';
        }, isPanoramaVM: function () {
            return CONTEXT.family === 'pc';
        }, isPeregrine: function () {
            return CONTEXT.family === '500';
        }, isMillennium: function () {
            return CONTEXT.family === '800';
        }, isKestrel: function () {
            return CONTEXT.family === '2000';
        }, isOsprey: function () {
            return CONTEXT.family === '3000';
        }, isFalcon: function () {
            return CONTEXT.family === '4000';
        }, isHawk: function () {
            return CONTEXT.family === '5000';
        }, isCondor: function () {
            return CONTEXT.family === '7000';
        }, isHighSpeedLogFwdEnabled: function () {
            return CONTEXT.isHighSpeedLogFwdEnabled === 'yes';
        }, isGryphon: function () {
            return CONTEXT.family === '5200';
        }, isMDM: function () {
            return CONTEXT.product === 'mdm';
        }, isMSeries: function () {
            return CONTEXT.family === 'm';
        }, isCMSM100: function () {
            return CONTEXT.model === 'M-100';
        }, isCMSM200: function () {
            return CONTEXT.model === 'M-200';
        }, isCMSM600: function () {
            return CONTEXT.model === 'M-600';
        }, isCMSM500: function () {
            return CONTEXT.model === 'M-500';
        }, isTagChanged: function () {
            return !Ext.isDefined(Pan.global.getTemplate()) && (CONTEXT.tagChanged === true);
        }, isVPNDisabled: function () {
            var vpnDisableMode;
            if (PanGlobal.getTemplate()) {
                var mode = Ext.state.Manager.get(PanGlobal.getTemplateControlName());
                if (mode && mode.value)
                    vpnDisableMode = !!(mode.value['disable-vpn']);
            }
            return vpnDisableMode;
        }, isPhoenixVMinAWSMode: function () {
            return CONTEXT.family === 'vm' && parseInt(CONTEXT.vmMode, 10) === Pan.base.Constants.vmMode.XEN_AWS;
        }, isAWSAMI: function () {
            return CONTEXT.family === 'vm' && this.isPhoenixVMinAWSMode() && CONTEXT.vmModeType === '1';
        }, isAzure: function () {
            return CONTEXT.family === 'vm' && parseInt(CONTEXT.vmMode, 10) === Pan.base.Constants.vmMode.AZR;
        }, isAzurePAYG: function () {
            return CONTEXT.family === 'vm' && this.isAzure() && CONTEXT.vmModeType === '1';
        }, isVMMode: function (mode) {
            return parseInt(CONTEXT.vmMode, 10) === mode;
        }, isCloudVm: function () {
            return CONTEXT.isCloudVm;
        }, isVMFirewallInCloudMode: function () {
            return CONTEXT.isCloudVm && !CONTEXT.isCms;
        }, resetTagChanged: function () {
            CONTEXT.tagChanged = false;
        }, getAllTags: function () {
            return CONTEXT.allTags;
        }, canEditShared: function () {
            if (admin.isDeviceGroupAdmin()) {
                return (PanGlobal.getSharedAccess() === 'write' || PanGlobal.getSharedAccess() === 'shared-only');
            }
            return CONTEXT.editShared;
        }, canEditCmsPrivate: function () {
            return CONTEXT.editShared;
        }, getLoc: function () {
            var type;
            var val = __loc;
            if (this.isCmsSelected() && !Pan.common.PanConfigStates.prototype.isShowingTemplateComboOnTop()) {
                type = 'dg';
                if (val === 'shared') {
                    type = 'shared';
                }
            }
            else {
                if (val && val.substr(0, 2) === 'sg')
                    type = 'sg'; else if (val && val.substr(0, 4) === 'vsys')
                    type = 'vsys'; else
                    type = 'unknown';
            }
            return {type: type, val: val};
        }, getLocVal: function () {
            return __loc;
        }, getLocTypeFromName: function (val) {
            var type;
            if (this.isCmsSelected() && !Pan.common.PanConfigStates.prototype.isShowingTemplateComboOnTop()) {
                type = 'dg';
            }
            else {
                if (val.substr(0, 2) === 'sg')
                    type = 'sg'; else if (val.substr(0, 4) === 'vsys')
                    type = 'vsys'; else
                    type = 'unknown';
            }
            return type;
        }, setLoc: function (vsysOrSharedGatewayOrDeviceGroup) {
            __loc = vsysOrSharedGatewayOrDeviceGroup;
            var oldLoc = CONTEXT.currentVsys;
            CONTEXT.currentVsys = vsysOrSharedGatewayOrDeviceGroup;
            if (oldLoc !== CONTEXT.currentVsys) {
                PanGlobal.ContextVariables.fireEvent('contextlocationchanged', oldLoc, CONTEXT.currentVsys);
            }
        }, getDevice: function () {
            return CONTEXT.device;
        }, setDevice: function (device) {
            CONTEXT.dloc = device;
            CONTEXT.isCmsSelected = (CONTEXT.dloc === 'panorama');
        }, getTemplateComboName: function () {
            return 'template-combo';
        }, getTemplateControlName: function () {
            return 'template-mode';
        }, getTemplateState: function () {
            var templateCombo = Ext.getCmp(PanGlobal.getTemplateComboName());
            var state;
            if (templateCombo) {
                state = templateCombo.getState();
            }
            else {
                state = Ext.state.Manager.get(this.getTemplateComboName());
            }
            return state && state.templateState;
        }, getTemplateName: function () {
            return Pan.base.htmlEncode(CONTEXT.templateName);
        }, getSharedAccess: function () {
            return CONTEXT.sharedAccess;
        }, isSharedOnlyAccess: function () {
            return CONTEXT.sharedAccess === 'shared-only';
        }, getTemplate: function () {
            if (PanGlobal.isShowingGlobalFindPreview()) {
                return PanGlobal.getGlobalFindPreviewTemplate();
            }
            else if (Pan.common.PanConfigStates.prototype.isShowingTemplateComboOnTop()) {
                return CONTEXT.template;
            }
        }, getTemplateStack: function () {
            var template = PanGlobal.getTemplate();
            if (template && PanGlobal.getTemplateStackList().indexOf(template) >= 0) {
                return template;
            }
        }, setTemplate: function (template) {
            CONTEXT.template = template;
        }, getGlobalFindPreviewTemplate: function () {
            return PanGlobal.globalFindPreviewTemplate;
        }, setGlobalFindPreviewTemplate: function (template) {
            PanGlobal.globalFindPreviewTemplate = template;
            return PanGlobal.getGlobalFindPreviewTemplate();
        }, isShowingGlobalFindPreview: function () {
            return PanGlobal.showingGlobalFindPreview;
        }, setShowingGlobalFindPreview: function (isShowing) {
            PanGlobal.showingGlobalFindPreview = isShowing;
            return PanGlobal.isShowingGlobalFindPreview();
        }, getTemplateList: function () {
            return CONTEXT.templateList;
        }, getTemplateStackList: function (returnAsMap) {
            var stacks = CONTEXT.templateStackList;
            if (returnAsMap) {
                return stacks;
            }
            var list = [];
            for (var i = 0; i < stacks.length; i++) {
                list.push(stacks[i].name);
            }
            return list;
        }, getDeviceGroupHierarchy: function () {
            var ret = [];
            var dgHierObj = PanGlobal.ContextVariables.get('dgHierarchy');
            var dg;
            for (dg in dgHierObj) {
                if (dgHierObj.hasOwnProperty(dg)) {
                    ret.push([dgHierObj[dg]['@name'], dgHierObj[dg]['@name'], dgHierObj[dg]['parent-dg'] ? dgHierObj[dg]['parent-dg'] : 'Shared']);
                }
            }
            return ret;
        }, isTemplateStackSelected: function () {
            var template = PanGlobal.getTemplate();
            if (template && PanGlobal.getTemplateStackList().indexOf(template) >= 0) {
                return true;
            }
            return false;
        }, isCorrelationLogEnabled: function () {
            return (CONTEXT.correlationLogEnabled === true ? Pan.appframework.PredefinedContent.getHasCorrelationObject() : false);
        }, getCombinedTemplateLists: function () {
            return CONTEXT.templateList.concat(CONTEXT.templateStackList);
        }, getTemplateInfoMap: function () {
            return CONTEXT.templateInfoMap;
        }, setTemplateInfoMapForCurrentTemplate: function (selected, data) {
            Pan.global.CONTEXT.templateInfoMap = Pan.global.CONTEXT.templateInfoMap || {};
            var defaultVsys = data['settings']['default-vsys'];
            data['settings'] = Ext.apply({'default-vsys': defaultVsys}, Pan.global.getSettingsForCurrentTemplate());
            Pan.global.CONTEXT.templateInfoMap[selected] = data;
            PanGlobal.ContextVariables.fireEvent('currentTemplateDefaultVsysChanged', defaultVsys);
        }, getCurrentTemplateDefaultVsys: function () {
            var template = PanGlobal.getTemplate();
            var templateInfoMap = PanGlobal.getTemplateInfoMap();
            if (templateInfoMap) {
                var config = templateInfoMap[template];
                if (config && config['settings']['default-vsys']) {
                    return config['settings']['default-vsys'];
                }
            }
        }, getCurrentSkipDisplayString: function () {
            var list, loc, val = null;
            var skipDisplayStringList = (Pan.global.CONTEXT.skipDisplayString || '').trim().split(',');
            skipDisplayStringList = _.map(skipDisplayStringList, function (skip) {
                return skip.trim();
            });
            if (Pan.common.PanConfigStates.prototype.isShowingTemplateComboOnTop()) {
                loc = Pan.global.getTemplate();
                list = Pan.global.CONTEXT.skipDisplayTemplate || [];
            }
            else {
                loc = Pan.global.getLocVal();
                list = Pan.global.CONTEXT.skipDisplayDg || [];
            }
            if (list.indexOf(loc) > -1) {
                val = skipDisplayStringList;
            }
            return val;
        }, getVsysForTemplate: function (template) {
            var ret = {};
            if (template) {
                var map = PanGlobal.getTemplateInfoMap();
                if (!util.isEmpty(map)) {
                    var info = map[template];
                    if (!util.isEmpty(info)) {
                        ret = info['vsysList'];
                    }
                }
            }
            return ret;
        }, getSchemaPruneOn: function (isMultiVsys, deviceOperationalMode, vpnDisableMode) {
            var pruneons = [];
            if (isMultiVsys === true) {
                pruneons.push('multi-vsys-mode');
            }
            else {
                pruneons.push('single-vsys-mode');
            }
            if (deviceOperationalMode === Pan.base.Constants.DEVICE_OP_MODE_0) {
                pruneons.push('non-fips-mode', 'non-cc-only-mode');
            }
            else if (deviceOperationalMode === Pan.base.Constants.DEVICE_OP_MODE_1) {
                pruneons.push('fips-mode', 'non-cc-only-mode');
            }
            else if (deviceOperationalMode === Pan.base.Constants.DEVICE_OP_MODE_2) {
                pruneons.push('fips-mode', 'cc-only-mode');
            }
            if (vpnDisableMode) {
                pruneons.push('vpn-disable-mode');
            }
            else {
                pruneons.push('non-vpn-disable-mode');
            }
            if (this.getCurrentSkipDisplayString()) {
                pruneons = pruneons.concat(this.getCurrentSkipDisplayString());
            }
            return pruneons;
        }, getSettingsForCurrentTemplate: function () {
            if (!PanGlobal.isCms() || !PanGlobal.getTemplate()) {
                return [];
            }
            var settings = {};
            var isMultiVsys = true;
            var vpnDisableMode = false;
            var deviceOperationalMode = 'normal';
            var pruneons = [];
            var cmp = Ext.getCmp(PanGlobal.getTemplateControlName());
            if (cmp && cmp.modeValue) {
                isMultiVsys = !!(cmp.modeValue['virtual-system']);
                vpnDisableMode = !!(cmp.modeValue['disable-vpn']);
                deviceOperationalMode = (cmp.modeValue['operation-mode'] || 'normal');
            }
            pruneons = PanGlobal.getSchemaPruneOn(isMultiVsys, deviceOperationalMode, vpnDisableMode);
            settings['isMultiVsys'] = isMultiVsys;
            settings['deviceOperationalMode'] = deviceOperationalMode;
            settings['vpnDisableMode'] = vpnDisableMode;
            settings['schemaPruneOn'] = pruneons;
            return settings;
        }, getVsysForCurrentTemplate: function () {
            return PanGlobal.getVsysForTemplate(PanGlobal.getTemplate());
        }, getSerialNumber: function () {
            return CONTEXT.serialNumber;
        }, getAccessibleLocList: function (inclVsys, inclSg, inclDg, inclSharedDg) {
            var ret = {};
            if (inclVsys) {
                if (!util.isEmpty(CONTEXT.accessibleVsys)) {
                    Ext.apply(ret, CONTEXT.accessibleVsys);
                }
                if (Pan.common.PanConfigStates.prototype.isShowingTemplateComboOnTop()) {
                    var template = PanGlobal.getTemplate();
                    Ext.apply(ret, PanGlobal.getVsysForTemplate(template));
                    if (Ext.isDefined(inclSg) && !inclSg) {
                        for (var name in ret) {
                            if (ret.hasOwnProperty(name) && ret[name].indexOf('sg') === 0) {
                                delete ret[name];
                            }
                        }
                    }
                }
            }
            if ((!(PanGlobal.isCms() || PanGlobal.isCmsRemoteSession()) || CONTEXT.editShared) && inclSg && !util.isEmpty(CONTEXT.accessibleSg)) {
                Ext.apply(ret, CONTEXT.accessibleSg);
            }
            if (inclDg && !util.isEmpty(CONTEXT.accessibleDg)) {
                Ext.apply(ret, CONTEXT.accessibleDg);
                if (inclSharedDg) {
                    if (CONTEXT.role === 'custom') {
                        inclSharedDg = (admin.profileType === 'panorama');
                    }
                    else {
                        inclSharedDg = ['superuser', 'superreader', 'panorama-admin'].indexOf(CONTEXT.role) >= 0;
                    }
                    if (inclSharedDg) {
                        Ext.apply(ret, {'shared': _T('Shared')});
                    }
                }
            }
            return ret;
        }, getAccessibleDeviceList: function () {
            var ret = {};
            if (PanGlobal.isCms()) {
                Ext.apply(ret, CONTEXT.accessibleDevices);
            }
            return ret;
        }, getDeviceSoftwareVersion: function (device) {
            var ret = '';
            if (PanGlobal.isCms()) {
                if (device === 'panorama') {
                    ret = CONTEXT.version;
                }
                else {
                    var devices = this.getAccessibleDeviceList();
                    if (device in devices) {
                        ret = devices[device].swVersion;
                    }
                }
            }
            else {
                ret = CONTEXT.version;
            }
            return ret;
        }, redirectToProperWindowLocation: function (device, page) {
            Ext.Ajax.request({
                url: '/php/utils/CmsGetDeviceSoftwareVersion.php?device=' + device,
                scope: this,
                success: function (response) {
                    var swVersion = Ext.decode(Ext.util.Format.trim(response.responseText));
                    PanGlobal.postRedirectToProperWindowLocation(swVersion, page);
                },
                failure: function () {
                    msg.alert('Could not get software version for device ' + device + ' from Panorama');
                }
            });
        }, postRedirectToProperWindowLocation: function (swVersion, page) {
            var swArray = swVersion.split('.');
            var mainVersion = swArray[0] - 0;
            var minorVersion = swArray[1] - 0;
            var oldMainVersion = 3;
            var loc = '';
            if (mainVersion <= oldMainVersion) {
                var espPage = page + '.esp';
                loc = '/esp/' + espPage;
            }
            else if (mainVersion === 4 && minorVersion === 0) {
                loc = '/' + page;
            }
            else {
                loc = '/';
            }
            window.location = loc;
        }, getXPathPrefix: function (type, val) {
            var ret = '';
            if (type === 'vsys') {
                ret = String.format('/config/devices/entry[@name="localhost.localdomain"]/vsys/entry[@name="{0}"]', val);
            }
            else if (type === 'sg') {
                ret = String.format('/config/devices/entry[@name="localhost.localdomain"]/network/shared-gateway/entry[@name="{0}"]', val);
            }
            else if (type === 'dg') {
                ret = String.format('/config/devices/entry[@name="localhost.localdomain"]/device-group/entry[@name="{0}"]', val);
            }
            return ret;
        }, getLocXPathPrefix: function () {
            var locObj = this.getLoc();
            return this.getXPathPrefix(locObj.type, locObj.val);
        }, isFIPSMode: function () {
            var settings = PanGlobal.getSettingsForCurrentTemplate();
            if (!util.isEmpty(settings)) {
                return (settings['deviceOperationalMode'] === Pan.base.Constants.DEVICE_OP_MODE_1);
            }
            return CONTEXT.fipsMode;
        }, isCCMode: function () {
            var settings = PanGlobal.getSettingsForCurrentTemplate();
            if (!util.isEmpty(settings)) {
                return (settings['deviceOperationalMode'] === Pan.base.Constants.DEVICE_OP_MODE_2);
            }
            return CONTEXT.deviceOperationalMode === Pan.base.Constants.DEVICE_OP_MODE_2;
        }, isSVMMode: function () {
            return (parseInt(SDBGENERAL['cfg.general.vm-mode'], 10) === Pan.base.Constants.vmMode.VMWARE_HYPERVISOR);
        }, isAWSMode: function () {
            return (parseInt(SDBGENERAL['cfg.general.vm-mode'], 10) === Pan.base.Constants.vmMode.XEN_AWS);
        }, isAzureMode: function () {
            return (parseInt(SDBGENERAL['cfg.general.vm-mode'], 10) === Pan.base.Constants.vmMode.AZR);
        }, isSecureOperationalMode: function () {
            return (PanGlobal.isFIPSMode() || PanGlobal.isCCMode());
        }, getMinPasswordLength: function () {
            return PanGlobal.isSecureOperationalMode() ? 6 : 0;
        }, isHAActiveActiveEnable: function (forPolicyPage) {
            if (CONTEXT.haEnabled && CONTEXT.haMode === 'active-active')
                return true;
            if (forPolicyPage) {
                return PanGlobal.isCmsSelected();
            }
            if (PanGlobal.isCmsSelected() && CONTEXT.template) {
                var template = CONTEXT.template;
                if (template && CONTEXT.templateInfoMap && CONTEXT.templateInfoMap[template]) {
                    return CONTEXT.templateInfoMap[template].haSettings.haEnabled && CONTEXT.templateInfoMap[template].haSettings.haMode === 'active-active';
                }
            }
            return false;
        }, getDeviceCapability: function (key) {
            return CONTEXT['deviceCapability'][key];
        }, schemaPruneOn: function () {
            var settings = PanGlobal.getSettingsForCurrentTemplate();
            if (!util.isEmpty(settings) && settings['schemaPruneOn']) {
                CONTEXT.schemaPruneOn = settings['schemaPruneOn'];
            }
            return CONTEXT.schemaPruneOn;
        }, resolveDeviceDisplayName: function (value, store) {
            if (!value || value === '')
                return '';
            var displayString = value;
            var foundInStore = false;
            if (store.__extraInfo && store.__extraInfo.deviceNameMap) {
                var deviceNameMap = store.__extraInfo.deviceNameMap;
                if (deviceNameMap && deviceNameMap[value]) {
                    displayString = deviceNameMap[value];
                    foundInStore = true;
                }
            }
            if (!foundInStore) {
                var deviceObj = CONTEXT.accessibleDevices[value];
                if (deviceObj) {
                    var name = deviceObj['name'];
                    if (name && name !== '')
                        displayString = name;
                }
            }
            return displayString;
        }, isPreNegotionAvail: function () {
            return Pan.global.CONTEXT.haEnabled && Pan.global.CONTEXT.haMode === 'active-passive' || Pan.global.isCmsSelected();
        }, ContextVariables: (function () {
            var ContextVarsClass = Ext.extend(Ext.util.Observable, {
                constructor: function () {
                    this.addEvents('contextvsysinfochanged', 'contextlocationchanged', 'contexttemplatechanged', 'contextdatareadychanged', 'contextHaLocalStatechanged', 'currentTemplateDefaultVsysChanged', 'contextNumLockChanged');
                    this.on('contexttemplatechanged', function (state, callback) {
                        CONTEXT.isMultiVsys = state['virtual-system'];
                        CONTEXT.deviceOperationalMode = state['operation-mode'];
                        CONTEXT.fipsMode = (state['operation-mode'] === Pan.base.Constants.DEVICE_OP_MODE_1);
                        CONTEXT.vpnDisableMode = state['disable-vpn'];
                        CONTEXT.schemaPruneOn = PanGlobal.getSchemaPruneOn(state['virtual-system'], state['operation-mode'], state['disable-vpn']);
                        if (Ext.isFunction(callback)) {
                            callback();
                        }
                    });
                }, get: function (key) {
                    return CONTEXT[key];
                }, retrieve: function (callback) {
                    PanDirect.run('PanDirect.getContextVariables', ['array'], function (result, e) {
                        this.afterDataReceived(result, e);
                        if (Ext.isFunction(callback)) {
                            callback();
                        }
                    }, this);
                }, onDgUpdate: function () {
                    PanDirect.run('PanDirect.getContextVariables', ['array'], this.afterDgUpdate, this);
                }, retrieveConfigChangePending: function () {
                    if (!Pan.appframework.PanNotificationHandler.getInstance().isAvailable()) {
                        this.doRetrieveConfigChangePending();
                    }
                }, doRetrieveConfigChangePending: function () {
                    if (!admin.getPermission('commit') && !admin.getPermission('validate')) {
                        return;
                    }
                    PanDirect.run('PanDirect.getConfigChangePending', [''], this.afterDataReceivedConfigChangePending);
                }, diffVsysInfo: function (currentContext, newContext) {
                    return (util.diff(currentContext['accessibleVsys'], newContext['accessibleVsys']) || util.diff(currentContext['accessibleDg'], newContext['accessibleDg']) || util.diff(currentContext['accessibleSg'], newContext['accessibleSg']));
                }, diffLocationChanged: function (currentContext, newContext) {
                    return util.diff(currentContext['loc'], newContext['loc']);
                }, diffTemplateInfo: function (currentContext, newContext) {
                    return (util.diff(currentContext['templateList'].sort(), newContext['templateList'].sort()) || util.diff(currentContext['templateStackList'], newContext['templateStackList']));
                }, diffDataReady: function (currentContext, newContext) {
                    return util.diff(currentContext['dataPlaneStatus'], newContext['dataPlaneStatus']);
                }, diffDataHaLocalState: function (currentContext, newContext) {
                    return util.diff(currentContext['haLocalState'], newContext['haLocalState']);
                }, adjustToObjectIfEmpty: function (result, list) {
                    for (var i = 0; i < list.length; i++) {
                        if (Ext.isArray(result[list[i]]) && result[list[i]].length <= 0) {
                            result[list[i]] = {};
                        }
                    }
                }, adjustResult: function (result) {
                    delete result.loc;
                    this.adjustToObjectIfEmpty(result, ['accessibleVsys', 'accessibleSg', 'accessibleDevices', 'accessibleDg', 'accessibleTemplates', 'templateInfoMap']);
                    if (result.templateInfoMap) {
                        for (var m in result.templateInfoMap) {
                            if (result.templateInfoMap.hasOwnProperty(m)) {
                                this.adjustToObjectIfEmpty(result.templateInfoMap[m], ['vsysList']);
                            }
                        }
                    }
                }, afterDgUpdate: function (result) {
                    if (result) {
                        this.adjustResult(result);
                        Ext.apply(CONTEXT, result);
                        this.processConfigChangePending();
                    }
                }, afterDataReceived: function (result) {
                    if (result) {
                        this.adjustResult(result);
                        var fireContextVsysInfoChanged = this.diffVsysInfo(CONTEXT, result);
                        var fireContextLocationChanged = this.diffLocationChanged(CONTEXT, result);
                        var fireContextDataReadyChanged = this.diffDataReady(CONTEXT, result);
                        var fireContextTemplateChanged = this.diffTemplateInfo(CONTEXT, result);
                        var fireContextHaLocalStateChanged = this.diffDataHaLocalState(CONTEXT, result);
                        var fireContextNumLockChanged = CONTEXT.numCommitLocks + CONTEXT.numConfigLocks !== result.numCommitLocks + result.numConfigLocks;
                        Ext.apply(CONTEXT, result);
                        if (fireContextVsysInfoChanged) {
                            this.fireEvent('contextvsysinfochanged', this);
                        }
                        if (fireContextLocationChanged) {
                            this.fireEvent('contextlocationchanged', this);
                        }
                        if (fireContextTemplateChanged) {
                            this.fireEvent('contexttemplatechanged', this);
                        }
                        if (fireContextDataReadyChanged) {
                            this.fireEvent('contextdatareadychanged', this);
                        }
                        if (fireContextHaLocalStateChanged) {
                            this.fireEvent('contextHaLocalStatechanged', this);
                        }
                        if (fireContextNumLockChanged) {
                            this.fireEvent('contextNumLockChanged', this);
                        }
                        this.processConfigChangePending();
                    }
                }, afterDataReceivedConfigChangePending: function (result) {
                    if (result) {
                        var fireContextNumLockChanged = CONTEXT.numCommitLocks + CONTEXT.numConfigLocks !== result.numCommitLocks + result.numConfigLocks;
                        Ext.apply(CONTEXT, result);
                        if (fireContextNumLockChanged) {
                            PanGlobal.ContextVariables.fireEvent('contextNumLockChanged', PanGlobal.ContextVariables);
                        }
                    }
                    PanGlobal.ContextVariables.processConfigChangePending();
                }, processConfigChangePending: function () {
                    var commitButton = $('#dCommitImg button')[0];
                    if (commitButton) {
                        if (admin.getPermission('commit') === 'enable' || admin.getPermission('validate') === 'enable') {
                            if (CONTEXT.configChangePending) {
                                $(commitButton).addClass('icon-commit').removeClass('icon-commit-grey').css('color', '').attr('title', 'There are pending configuration changes, please commit.');
                            }
                            else {
                                $(commitButton).addClass('icon-commit-grey').removeClass('icon-commit').css('color', '#808080').attr('title', 'There are no pending configuration changes');
                            }
                        }
                    }
                }, set: function (key, value) {
                    CONTEXT[key] = value;
                }, setHaLocalState: function (value) {
                    var currentValue = this.get('haLocalState');
                    this.set('haLocalState', value);
                    if (util.diff(currentValue, value)) {
                        this.fireEvent('contextHaLocalStatechanged', this);
                    }
                }, clear: function () {
                    PanGlobal.CONTEXT = {};
                }
            });
            var rv = new ContextVarsClass();
            if (CONTEXT) {
                rv.adjustResult(CONTEXT);
            }
            return rv;
        }()), createPruneOnValidator: function () {
            var schemaPruneOn = PanGlobal.schemaPruneOn();
            var sdbGeneral = PanGlobal.SDBGENERAL;
            return {
                schemaPruneOn: schemaPruneOn, shouldPrune: function (pruneOnMode, pruneOnSDB) {
                    var shouldPrune = false;
                    var a, i;
                    if (pruneOnMode) {
                        a = pruneOnMode.split(/[ ,]/);
                        if (schemaPruneOn.length > 0) {
                            for (i = 0; i < a.length; i++) {
                                if (schemaPruneOn.indexOf(a[i]) >= 0) {
                                    shouldPrune = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (!shouldPrune && pruneOnSDB) {
                        a = pruneOnSDB.split(/[ ,]/);
                        for (i = 0; i < a.length; i++) {
                            var aa = a[i].split(/[=]/);
                            if (aa.length >= 2) {
                                if (sdbGeneral[aa[0].trim()] === aa[1].trim()) {
                                    shouldPrune = true;
                                    break;
                                }
                            }
                            else if (sdbGeneral[a[i].trim()] === 'True') {
                                shouldPrune = true;
                                break;
                            }
                        }
                    }
                    return shouldPrune;
                }
            };
        }, showHighSpeedLogFwdMessage: function (cmp) {
            var logMsg = Ext.getCmp('high-speed-log-fwd');
            var xPos = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) - 300;
            if (!logMsg) {
                logMsg = new Ext.Window({
                    width: 250,
                    y: 160,
                    id: 'high-speed-log-fwd',
                    x: xPos,
                    baseCls: 'x-window-simple-message',
                    style: 'border: 1px solid #707980; background: #fff0c8',
                    resizable: false,
                    border: true,
                    autoHeight: true,
                    showHelp: false,
                    modal: false,
                    closable: true,
                    items: [{
                        xtype: 'pan-container',
                        style: 'padding: 10px 10px 10px 10px',
                        items: [{
                            xtype: 'pan-label',
                            text: _T('This device is using High Speed Forwarding Mode. Logs can only be viewed from Panorama.')
                        }]
                    }]
                });
            }
            else {
                logMsg.setPosition(xPos, 160);
            }
            logMsg.show();
            cmp.on('destroy', function () {
                if (logMsg && logMsg.isVisible()) {
                    logMsg.hide();
                }
            });
            if (!Pan.global.hslfTask) {
                Pan.global.hslfTask = new Ext.util.DelayedTask(function () {
                    if (this && this.getEl() && this.isVisible()) {
                        this.getEl().fadeOut({endOpacity: 0, easing: 'easeOut', duration: 0.7, remove: false});
                    }
                }, logMsg);
            }
            Pan.global.hslfTask.delay(30000);
        }, hideHighSpeedLogFwdMessage: function () {
            var logMsg = Ext.getCmp('high-speed-log-fwd');
            if (!logMsg) {
                return;
            }
            else {
                logMsg.hide();
            }
        }
    };
    Pan.global = Ext.apply(Pan.global, PanGlobal);
}());
(function () {
    Ext.BLANK_IMAGE_URL = '/images/s.gif';
    var isTxtNode = function ($node) {
        return $node.nodeType === 3 || $node.nodeType === 4;
    };
    window.checkPendingConfigChanges = function () {
        Pan.global.ContextVariables.retrieveConfigChangePending();
    };
    var base = Ext.ns('Pan.base');
    Ext.apply(base, {
        count: function (obj) {
            if (Ext.isObject(obj)) {
                var count = 0;
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        count++;
                    }
                }
                return count;
            }
            else if (Ext.isArray(obj)) {
                return obj.length;
            }
            else {
                return 0;
            }
        }, getText: function (node) {
            return Ext.isIE ? node.text : node.textContent;
        }, isValidObjectName: function (str) {
            return !(str.match(/^[0-9a-zA-Z]{1}([0-9a-zA-Z_-]|[ ]|[.])*$/) == null);
        }, objectKeys: function (o, sort) {
            var keys = [];
            for (var key in o) {
                if (o.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            if (sort) {
                Pan.base.util.naturalSort(keys);
            }
            return keys;
        }, iterateObject: function (obj, callback, before) {
            var iter = function (obj, callback, before, fieldname) {
                if (!before.callback || before.callback(obj, fieldname)) {
                    callback(obj);
                }
                var i;
                if (Ext.isArray(obj)) {
                    for (i = 0; i < obj.length; i++) {
                        if (!before.iterate || before.iterate(obj[i], i)) {
                            iter(obj[i], callback, before);
                        }
                    }
                }
                else if (Ext.isObject(obj)) {
                    for (i in obj) {
                        if (obj.hasOwnProperty(i)) {
                            if (!before.iterate || before.iterate(obj[i], i)) {
                                iter(obj[i], callback, before, i);
                            }
                        }
                    }
                }
            };
            before = before || {};
            if (typeof before == "function") {
                var fn = before;
                before = {callback: fn, validation: fn};
            }
            iter(obj, callback, before);
        }, clone: function (obj) {
            var dup = function (obj) {
                var rv = obj;
                if (rv !== undefined && rv !== null) {
                    rv = obj.__clone__;
                    if (!Ext.isDefined(rv)) {
                        if (Ext.isArray(obj)) {
                            obj.__clone__ = rv = obj.slice(0);
                            for (var i = 0; i < rv.length; i++) {
                                rv[i] = dup(rv[i]);
                            }
                        }
                        else if (Ext.isObject(obj) && obj.__cloneable__ !== false) {
                            rv = {};
                            for (var m in obj) {
                                if (obj.hasOwnProperty(m)) {
                                    rv[m] = dup(obj[m]);
                                }
                            }
                            obj.__clone__ = rv;
                        }
                        else {
                            rv = obj;
                        }
                    }
                }
                return rv;
            };
            var rv = dup(obj);
            var cleanup = function (obj) {
                if (obj !== undefined && obj !== null) {
                    if (Ext.isDefined(obj.__clone__)) {
                        delete obj.__clone__;
                    }
                    if (Ext.isArray(obj)) {
                        for (var i = 0; i < obj.length; i++) {
                            cleanup(obj[i]);
                        }
                    }
                    else if (Ext.isObject(obj) && obj.__cloneable__ !== false) {
                        for (var m in obj) {
                            if (obj.hasOwnProperty(m)) {
                                cleanup(obj[m]);
                            }
                        }
                    }
                }
            };
            cleanup(obj);
            return rv;
        }, eachNumberedProperty: function (obj, func) {
            var keys = [];
            for (var n in obj) {
                if (obj.hasOwnProperty(n)) {
                    if (typeof n == "number" || !isNaN(parseInt(n, 10))) {
                        keys.push(n);
                    }
                }
            }
            keys.sort(function (x, y) {
                var a = parseInt(x, 10), b = parseInt(y, 10);
                return a > b ? 1 : a < b ? -1 : 0;
            });
            for (var i = 0; i < keys.length; i++) {
                var rc = func.call(null, obj[keys[i]], keys[i], keys.length);
                if (rc === false) {
                    break;
                }
            }
        }, encodeURIComponentPair: function (k, v) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(v);
        }, collectXmlTextNodes: function (x, separator) {
            if (!separator) {
                separator = "\n";
            }
            if (x && x.documentElement) {
                return Pan.base.collectXmlTextNodes(x.documentElement, separator);
            }
            if (x && x.nodeType == 3) {
                return Pan.base.htmlEncode(x.data);
            }
            else if (x && x.nodeType == 1) {
                var arr = [];
                for (var i = 0; i < x.childNodes.length; i = i + 1) {
                    var result = Pan.base.collectXmlTextNodes(x.childNodes[i], separator);
                    if (result !== '') {
                        arr.push(result);
                    }
                }
                return arr.join(separator);
            }
            else {
                return '';
            }
        }, extractJsonText: function (simpleObject) {
            var value, values;
            switch (Ext.type(simpleObject)) {
                case'object':
                    values = [];
                    for (var p in simpleObject) {
                        if (simpleObject.hasOwnProperty)
                            if (simpleObject.hasOwnProperty(p))
                                if (p.indexOf('@') != 0) {
                                    value = Pan.base.extractJsonText(simpleObject[p]);
                                    if (value !== false) {
                                        values.push(value);
                                    }
                                }
                    }
                    return values.join("\n");
                case'array':
                    values = [];
                    for (var i = 0, len = simpleObject.length; i < len; i++) {
                        value = Pan.base.extractJsonText(simpleObject[i]);
                        if (value !== false) {
                            values.push(value);
                        }
                    }
                    return values.join("\n");
                case'number':
                    return '' + simpleObject;
                case'string':
                    return Pan.base.htmlEncode(simpleObject);
                default:
                    return false;
            }
        }, param: function (name) {
            var match = (new RegExp('[?&]' + name + '=([^&]*)')).exec(window.location.search);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        }, urlencode: function (query, doseq) {
            var str = function (stuff) {
                return '' + stuff;
            };
            var k, v;
            var l = [];
            if (!doseq) {
                for (k in query) {
                    if (query.hasOwnProperty(k)) {
                        v = query[k];
                        k = encodeURIComponent(str(k));
                        v = encodeURIComponent(str(v));
                        l.push(k + '=' + v);
                    }
                }
            }
            else {
                for (k in query) {
                    if (query.hasOwnProperty(k)) {
                        v = query[k];
                        k = encodeURIComponent(str(k));
                        if (typeof v == 'string' || v.length == undefined) {
                            v = encodeURIComponent(v);
                            l.push(k + '=' + v);
                        }
                        else {
                            var x = v.length;
                            for (var i = 0; i < x; i++) {
                                var elt = v[i];
                                l.push(k + '=' + encodeURIComponent(str(elt)));
                            }
                        }
                    }
                }
            }
            return l.join('&');
        }, escapeHTML: function (str) {
            var div = document.createElement('div');
            var text = document.createTextNode(str);
            div.appendChild(text);
            return div.innerHTML;
        }, escapeXML: function (str) {
            str += '' + '';
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/'/gm, "&#39;");
        }, serializeObject: function (_obj) {
            if (_obj && typeof _obj.toSource !== 'undefined' && typeof _obj.callee === 'undefined') {
                return _obj.toSource();
            }
            switch (typeof _obj) {
                case'number':
                case'boolean':
                case'function':
                    return _obj;
                case'string':
                    return "'" + _obj.replace(/\\/, "\\\\").replace(/'/, "\\'") + "'";
                case'object':
                    var str;
                    if (_obj == null) return "null";
                    if (_obj.constructor === Array || typeof _obj.callee !== 'undefined') {
                        str = '[';
                        var i, len = _obj.length;
                        for (i = 0; i < len - 1; i++) {
                            str += Pan.base.serializeObject(_obj[i]) + ',';
                        }
                        str += Pan.base.serializeObject(_obj[i]) + ']';
                    }
                    else {
                        str = '{';
                        var key;
                        for (key in _obj) {
                            if (_obj.hasOwnProperty(key)) {
                                str += key + ':' + Pan.base.serializeObject(_obj[key]) + ',';
                            }
                        }
                        str = str.replace(/,$/, '') + '}';
                    }
                    return str;
                default:
                    return "'" + typeof _obj + "'";
            }
        }, emptyTextFormat: function (defaultValue, min, max) {
            var rv = '';
            if (Ext.isDefined(defaultValue)) {
                rv = defaultValue + ' ';
            }
            if (Ext.isDefined(min) && Ext.isDefined(max)) {
                rv += '[' + min + ' - ' + max + ']';
            }
            else if (Ext.isDefined(min)) {
                rv += '[>= ' + min + ']';
            }
            else if (Ext.isDefined(max)) {
                rv += '[<= ' + max + ']';
            }
            return rv;
        }, htmlEncode: function (object) {
            if (Ext.isArray(object)) {
                Ext.each(object, function (value, index, array) {
                    array[index] = Pan.base.htmlEncode(value);
                });
                return object;
            }
            else if (Ext.isObject(object)) {
                for (var property in object) {
                    if (object.hasOwnProperty(property)) {
                        var value = object[property];
                        object[property] = Pan.base.htmlEncode(value);
                    }
                }
                return object;
            }
            else if (Ext.isString(object)) {
                return Ext.util.Format.htmlEncode(object);
            }
            else if (object === null || object === undefined) {
                return object;
            }
            else {
                return object;
            }
        }, safeHtmlEncode: function (object) {
            if (Ext.isArray(object)) {
                Ext.each(object, function (value, index, array) {
                    array[index] = Pan.base.safeHtmlEncode(value);
                });
                return object;
            }
            else if (Ext.isObject(object)) {
                for (var property in object) {
                    if (object.hasOwnProperty(property)) {
                        var value = object[property];
                        object[property] = Pan.base.safeHtmlEncode(value);
                    }
                }
                return object;
            }
            else if (Ext.isString(object)) {
                var results = [];
                var whitelist = ["a", "abbr", "acronym", "b", "basefont", "big", "blockquote", "br", "button", "center", "cite", "code", "col", "dd", "div", "dl", "dt", "em", "fieldset", "font", "form", "hr", "i", "img", "input", "label", "li", "menu", "ol", "p", "pre", "q", "s", "samp", "select", "small", "span", "strike", "strong", "sub", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "tr", "tt", "u"];
                HTMLParser(object, {
                    start: function (tag, attrs, unary) {
                        tag = tag.toLowerCase();
                        if (whitelist.indexOf(tag) >= 0) {
                            results.push("<" + tag);
                            for (var i = 0; i < attrs.length; i++) {
                                var attributeName = attrs[i].name.toLowerCase();
                                var attributeValue = attrs[i].escaped.toLowerCase();
                                switch (attributeName) {
                                    case'style':
                                        break;
                                    case'href':
                                        if (attributeValue.indexOf('script') == -1) {
                                            results.push(" " + attrs[i].name + '="' + attrs[i].escaped + '"');
                                        }
                                        break;
                                    default:
                                        if (attributeName.indexOf('on') != 0) {
                                            if (attributeValue.indexOf('http') == -1 && attributeValue.indexOf('script') == -1) {
                                                results.push(" " + attrs[i].name + '="' + attrs[i].escaped + '"');
                                            }
                                        }
                                        break;
                                }
                            }
                            results.push((unary ? "/" : '') + ">");
                        }
                    }, end: function (tag) {
                        tag = tag.toLowerCase();
                        if (whitelist.indexOf(tag) >= 0) {
                            results.push("</" + tag + ">");
                        }
                    }, chars: function (text) {
                        results.push(Ext.util.Format.htmlEncode(text));
                    }, comment: function (_text) {
                    }
                });
                return results.join('');
            }
            else {
                return object;
            }
        }
    });
    Ext.apply(base, {
        NETWORK_XPATH: "/config/devices/entry[@name='localhost.localdomain']/network/",
        VSYS_XPATH: "/config/devices/entry[@name='localhost.localdomain']/vsys/",
        SPAN_SLOT: "___SPAN___",
        isLoginPage: function (response) {
            return (response.responseText.indexOf("__LOGIN_PAGE__") >= 0);
        },
        checkUnauthorized: function (message) {
            if (message && message.startsWith('unauthorized')) {
                var isCmsSelected = Pan.global.isCmsSelected();
                var isCmsRemoteSession = Pan.global.isCmsRemoteSession();
                var redirect = false;
                if (message === 'unauthorized' && !isCmsSelected && !isCmsRemoteSession) {
                    redirect = true;
                }
                else {
                    var result = message.split(":");
                    if (result && result.length > 1) {
                        if (isCmsRemoteSession) {
                            redirect = result[1] === "isCmsRemoteSession";
                        }
                        else if (isCmsSelected) {
                            redirect = result[1] === "isCmsSelected";
                        }
                    }
                }
                if (redirect) {
                    Pan.base.redirectToLogout();
                }
            }
        },
        redirectToLogout: function () {
            if (!Pan.inProcessRedirecting) {
                Pan.inProcessRedirecting = true;
                window.top.location = "/php/logout.php";
                Pan.appframework.PanNotificationHandler.getInstance().close();
            }
            return false;
        },
        redirectIfExpired: function (response) {
            if (Pan.base.isLoginPage(response)) {
                Pan.base.redirectToLogout();
                return false;
            }
            return true;
        },
        showSystemAlarmViewer: function () {
            var win = Pan.AlarmMgr.getAlarmViewer();
            win.show(true);
        },
        defaultXpathId: function () {
            if (Pan.global.getLoc().val == '') {
                return 'shared';
            }
            else {
                return 'vsys';
            }
        },
        checkValidObjectName: function (name, objType) {
            var ret = Pan.base.isValidObjectName(name);
            if (!ret) {
                var message = _T("A valid {type} object name must start with an alphanumeric character and can contain zero or more alphanumeric characters, underscore '_', hyphen '-', dot '.' or spaces.", {type: objType || ''});
                Pan.Msg.alert("Error", message);
            }
            return ret;
        },
        showConfigError: function (a) {
            var errors = ["Configuration failed!<br/>"];
            if (a && a.result && a.result.errors) {
                for (var i = 0; i < a.result.errors.length; i++) {
                    errors.push(Pan.base.htmlEncode(a.result.errors[i].line));
                }
            }
            Pan.Msg.alert("Warning", errors.join("<br/>"));
        },
        setRolebaseAdminAccess: function (path, buttons) {
            var permission = Pan.rolebasePermission(path);
            var role = Pan.getUserRole();
            var isReadonly = permission == 'read-only' || role.indexOf('reader') != -1;
            var isVsysAdmin = Pan.isVsysAdmin();
            var networkDisable = isReadonly || isVsysAdmin;
            if (networkDisable) {
                for (var i = 0; i < buttons.length; i++) {
                    buttons[i].setVisible(false);
                }
            }
        },
        isMgmtSuccessResponse: function (root) {
            return Ext.DomQuery.selectNode('response[status=success]', root);
        },
        extractMgmtErrmsg: function (root) {
            var errmsg = [];
            var textnodes = function (nodename) {
                var msgs = Ext.DomQuery.select(nodename, root);
                for (var i = 0; i < msgs.length; i++) {
                    var n = msgs[i];
                    if (n.firstChild && n.firstChild.nodeType == 3)
                        errmsg.push(n.firstChild.nodeValue);
                }
            };
            textnodes('line');
            textnodes('msg');
            textnodes('result');
            return (Pan.base.htmlEncode(errmsg).join('\n'));
        },
        isJsonSuccessResponse: function (root) {
            return Pan.base.json.path(root, '$.@status') == 'success';
        },
        extractJsonMsg: function (root) {
            if (!root) {
                return '';
            }
            var msgs = [];
            var xpaths = ['$..line', '$..msg', '$..result', '$..member'];
            Ext.each(xpaths, function (xpath) {
                var texts = jsonPath(root, xpath);
                Ext.each(texts, function (text) {
                    if (Ext.isString(text)) {
                        msgs.push(Pan.base.htmlEncode(text));
                    }
                    else if (Ext.isArray(text)) {
                        Ext.each(text, function (txt) {
                            if (Ext.isString(txt)) {
                                msgs.push(Pan.base.htmlEncode(txt));
                            }
                        });
                    }
                });
            });
            return (msgs.join('\n'));
        },
        genLabel: function (comp, v) {
            v = v || '';
            if (comp && comp.unitText) {
                v += ' (' + comp.unitText + ')';
            }
            return v;
        },
        genHelpTip: function (comp, hidden) {
            var helpTip = comp && comp.helpTip;
            if (helpTip) {
                helpTip = helpTip === true ? comp.helpstring : helpTip;
                if (comp.columnConfig && comp.columnConfig.doHTMLEncode === false) {
                }
                else {
                    helpTip = Pan.base.htmlEncode(helpTip);
                }
                return "<span class='x-form-item-label-help" + (hidden ? " x-hide-display" : '') + "' ext:qtip='" + helpTip + "'" + (comp.helpTipWidth ? " ext:qwidth='" + comp.helpTipWidth : '') + ">&nbsp;</span>";
            }
            return false;
        },
        genEmptyText: function (component, field, doEncoding) {
            var returnValue;
            if (component.rangeText === false) {
                returnValue = '';
            }
            else if (component.emptyText) {
                returnValue = component.emptyText;
            }
            else if (component.useHelpStringAsDisplay) {
                returnValue = (component.helpStrings ? component.helpStrings[field.defaultValue] : field.defaultValue) + ' ';
            }
            else if (component.rangeText && component.rangeText !== true) {
                returnValue = component.rangeText;
            }
            else {
                returnValue = base.emptyTextFormat(doEncoding ? base.htmlEncode(field.defaultValue) : field.defaultValue, component.minValue, component.maxValue);
            }
            return returnValue;
        },
        getStoreFilterCount: function (store) {
            return {
                totalCount: store.isLiveGrid ? store.__prefilterTotalCount || store.getTotalCount() : store.getSnapshot ? store.getSnapshot().length : (store.snapshot || store.data).length,
                filteredCount: (store.isLiveGrid || store.supportLocalPaging) ? store.getTotalCount() || store.getCount() : store.getCount()
            };
        },
        getStoreFilterCountString: function (store) {
            var getStoreFilterCount = store.getStoreFilterCount || Pan.base.getStoreFilterCount;
            var result = getStoreFilterCount(store);
            if (result.totalCount === result.filteredCount) {
                return _T("{filteredCount} item{plural}", {
                    plural: (result.filteredCount === 1) ? '' : "s",
                    filteredCount: result.filteredCount
                });
            }
            else {
                return _T("{filteredCount} / {totalCount}", {
                    totalCount: result.totalCount,
                    filteredCount: result.filteredCount
                });
            }
        },
        getStoreFilterCountTip: function (store, sm, fn) {
            var getStoreFilterCount = store.getStoreFilterCount || Pan.base.getStoreFilterCount;
            var result = getStoreFilterCount(store);
            var tips = [];
            if (result.filteredCount != result.totalCount) {
                tips.push(_T("{filteredCount} matched", {filteredCount: result.filteredCount}));
            }
            tips.push(_T("{totalCount} total", {totalCount: result.totalCount}));
            var totalSelected, inStoreSelectedTotal, totalSelectedTip, resultCount;
            if (sm || Ext.isFunction(fn)) {
                if (sm) {
                    if (sm.getResultCount) {
                        resultCount = sm.getResultCount();
                        totalSelected = resultCount.total;
                        inStoreSelectedTotal = resultCount.inStoreTotal;
                    }
                    else {
                        totalSelected = sm.getCount();
                    }
                }
                else {
                    resultCount = fn();
                    totalSelected = resultCount.total;
                    inStoreSelectedTotal = resultCount.inStoreTotal;
                }
                totalSelectedTip = _T("{totalSelected} selected", {totalSelected: totalSelected});
                if (Ext.isDefined(inStoreSelectedTotal) && inStoreSelectedTotal != totalSelected) {
                    totalSelectedTip += " (" + _T("{totalShown} shown", {totalShown: inStoreSelectedTotal}) + ")";
                }
                tips.push(totalSelectedTip);
            }
            return Pan.base.htmlEncode(tips).join("<br>");
        },
        serverTokenGen: function (st) {
            var cookie;
            for (var m in st.st) {
                if (st.st.hasOwnProperty(m)) {
                    cookie = Pan.st.st[m];
                    break;
                }
            }
            return function (tid) {
                if (!Ext.isDefined(tid)) {
                    var t = new Ext.Direct.Transaction();
                    tid = t.tid;
                }
                return {'___token': MD5(cookie + tid), '___tid': tid};
            };
        },
        dom2array: function ($node, $safeAttribute, $replaceDashes, $options) {
            var $idx = 0;
            var $res = {};
            var $children = null, $i = null, $child = null;
            var $len;
            if (isTxtNode($node)) {
                $res.push($node.nodeValue);
            }
            else if ($node.nodeType == 1) {
                var $alwaysCreateArray = false;
                if ($node.hasAttributes()) {
                    var $attributes = $node.attributes;
                    if ($attributes) {
                        var $keepSrcAttribute = false;
                        if ($options && $options['keepSrcAttribute']) {
                            $keepSrcAttribute = $options['keepSrcAttribute'];
                        }
                        else if ($options && $options['keepSrcAttributeIfIsElement'] && $options['keepSrcAttributeIfIsElement'] === true) {
                            $alwaysCreateArray = true;
                            if ($node.hasChildNodes()) {
                                $children = $node.childNodes;
                                for ($i = 0; $i < $children.length; $i++) {
                                    $child = $children.item($i);
                                    if ($child.nodeType == 1) {
                                        $keepSrcAttribute = true;
                                        break;
                                    }
                                }
                            }
                        }
                        else {
                            $keepSrcAttribute = $node.hasAttribute('__recordInfo');
                        }
                        for ($i = 0, $len = $attributes.length; $i < $len; ++$i) {
                            var $attr = $attributes.item($i);
                            if ($attr.name == "dirty" || $attr.name == "admin" || $attr.name == "dirtyId" || $attr.name == "minver" || $attr.name == "maxver" || $attr.name == "platform" || $attr.name == "time") {
                                continue;
                            }
                            if (!$keepSrcAttribute && ($attr.name == "src")) {
                                continue;
                            }
                            var $attrName = '@' + $attr.name;
                            $attrName = $safeAttribute ? '_' + $attrName : $attrName;
                            $attrName = $replaceDashes ? $attrName.replace('-', '_') : $attrName;
                            $res[$attrName] = $attr.value;
                        }
                    }
                }
                if ($node.hasChildNodes()) {
                    $children = $node.childNodes;
                    var $is_array_children = false;
                    var $firstChild = $children.item(0);
                    if ($firstChild.nodeType == 1) {
                        if ($firstChild.nodeName == "entry" || $firstChild.nodeName == "member" || $firstChild.nodeName == "completion") {
                            $is_array_children = true;
                        }
                        else if ($children.length > 1) {
                            var $secondChild = $children.item(1);
                            $is_array_children = ($secondChild.nodeType == 1) && ($firstChild.nodeName == $secondChild.nodeName);
                        }
                    }
                    for ($i = 0; $i < $children.length; $i++) {
                        $child = $children.item($i);
                        if ($child.nodeType == 1) {
                            if ($is_array_children) {
                                if ($child.nodeName == "member" || $child.nodeName == "entry" || $alwaysCreateArray) {
                                    if (!$res[$child.nodeName]) {
                                        $res[$child.nodeName] = [];
                                    }
                                    $res[$child.nodeName].push(Pan.base.dom2array($child, $safeAttribute, $replaceDashes, $options));
                                }
                                else {
                                    $res[$idx++] = Pan.base.dom2array($child, $safeAttribute, $replaceDashes, $options);
                                }
                            }
                            else {
                                var $nodeName = $replaceDashes ? $child.nodeName.replace("-", "_") : $child.nodeName;
                                $res[$nodeName] = Pan.base.dom2array($child, $safeAttribute, $replaceDashes, $options);
                            }
                        }
                        else if (isTxtNode($child)) {
                            if (Pan.base.isEmpty($res) && $children.length === 1) {
                                $res = $child.nodeValue;
                            }
                            else {
                            }
                        }
                    }
                }
            }
            return $res;
        }
    });
    Pan.base = base;
}());
Ext.ns('Pan.base');
(function () {
    var getURIParam = Pan.base.param;
    var I18n = function (locale) {
        var labelSeparator = Ext.layout.FormLayout.prototype.labelSeparator;
        var reverseLookup = {};
        var reverseLookupError = {};
        var scope;
        scope = {
            init: function (newLocale) {
                this.switchLocale(newLocale);
                Ext.Panel.prototype.afterRender = Ext.Panel.prototype.afterRender.createSequence(function () {
                    if (this.el) {
                        scope.replace(this, '.x-grid3-hd-inner,.x-form-cb-label,.x-btn-text,.x-window-header-text,.x-panel-header-text,.xtb-text,.x-tab-strip-text');
                        scope.replace(this, '.x-form-item-label', labelSeparator);
                    }
                });
                Ext.tree.TreePanel.prototype.renderRoot = Ext.tree.TreePanel.prototype.renderRoot.createSequence(function () {
                    if (this.el) {
                        scope.replace(this, '.x-tree-node-anchor');
                    }
                });
                Ext.MessageBox.show = Ext.MessageBox.show.createSequence(function () {
                    if (this.getDialog().el) {
                        scope.replace(this.getDialog(), '.x-window-header-text');
                    }
                });
            }, replace: function (c, cls, labelSeparator) {
                var i, e, l, text;
                var labels = c.el.select(cls);
                for (i = 0; i < labels.elements.length; i++) {
                    e = labels.elements[i];
                    if (e) {
                        if (e.innerHTML.indexOf(locale.errorPreTag) < 0 && e.innerHTML.indexOf(locale.errorPreTagAlt) < 0) {
                            text = e.textContent || e.innerText || '';
                            if (Ext.util.Format.trim(text)) {
                                if (labelSeparator) {
                                    l = this.lookup(text.substr(0, text.length - 1), undefined, undefined, true);
                                    e.innerHTML = e.innerHTML.replace(text, l + labelSeparator);
                                }
                                else {
                                    l = this.lookup(text, undefined, undefined, true);
                                    if (text !== l) {
                                        e.innerHTML = e.innerHTML.replace(text, l);
                                    }
                                }
                            }
                        }
                    }
                }
            }, switchLocale: function (newLocale) {
                if (newLocale) {
                    locale = newLocale;
                }
            }, lookup: function (key, args, withError, isInternal) {
                var value = key;
                if (args || (!reverseLookup[key] && !reverseLookupError[key])) {
                    value = locale.lookup[key];
                    if (!value) {
                        value = '';
                        if (getURIParam('highlight-locale')) {
                            if (isInternal) {
                                value = locale.errorPreTag;
                            }
                            else {
                                value = locale.errorPreTagAlt;
                            }
                        }
                        value += key;
                        if (getURIParam('highlight-locale')) {
                            if (isInternal) {
                                value += locale.errorPostTag;
                            }
                            else {
                                value += locale.errorPostTagAlt;
                            }
                        }
                        reverseLookupError[value] = key;
                        if (withError) {
                            throw'I18n: Missing ' + key;
                        }
                    }
                    else {
                        if (!args) {
                            reverseLookup[value] = key;
                        }
                    }
                    if (args) {
                        value = value.replace(/\{[^{}]*\}/g, function (toBeReplaced) {
                            var subject = toBeReplaced.substring(1, toBeReplaced.length - 1);
                            if (args.hasOwnProperty(subject)) {
                                return args[subject];
                            }
                            else {
                                if (withError) {
                                    throw'I18n: ' + key + ' missing arg ' + subject;
                                }
                                else {
                                    return '___' + subject + '___';
                                }
                            }
                        });
                    }
                }
                return value;
            }
        };
        return scope;
    };
    var i18n = I18n(Pan.locale.mapping);
    i18n.init(Pan.locale[Pan.global.CONTEXT.locale]);
    Ext.ns('Pan.base');
    Pan.base.I18n = i18n;
    window._T = Pan.i18n = i18n.lookup;
}());
Pan.base.Constants = {
    treeRendererUseArrows: true,
    liveGridNearLimit: 100,
    liveGridBufferSize: 200,
    defaultComboDisplayCount: 500,
    maxTreeNodeChildrenCount: 500,
    transportErrorMsg: "Unable to connect to the webserver.",
    showGlobalLoadingIndicatorClass: 'show-global-loading-indicator',
    loadMaskDisplayerClass: 'load-mask-displayer',
    defaultGridLocalPagingSize: 2500,
    showGridFilterLimit: 10,
    scrollOffset: 18,
    gridLayoutMarginBottomOffset: 4,
    generatedGridMarginBottom: '4px',
    minimumInitialColumnWidthForArray: 145,
    defaultEditorGridHeight: 250,
    defaultGridEditorHeight: 180,
    defaultCompletionGridHeight: 180,
    defaultCompletionGridEditorHeight: 150,
    mainFrameHeaderAndFooterHeight: 106,
    liveGridMiniRowHeight: 22,
    datetimeFmtstr: 'Y/n/j G:i:s',
    dateFmtstr: 'Y/n/j',
    uiThemes: ['gold', 'lightgrey', 'white', 'pangrey'],
    formThemes: ['darkblue', 'grey', 'darkblue-container', 'darkgray'],
    nonestr: 'None',
    selectstr: _T('select'),
    minWindowWidth: 400,
    minWindowHeight: 150,
    maxWindowWidth: 800,
    maxWindowHeight: 500,
    loginScreenImageWidth: 440,
    loginScreenImageHeight: 345,
    mainUIImageWidth: 158,
    mainUIImageHeight: 40,
    pdfHeaderImageWidth: 182,
    pdfHeaderImageHeight: 154,
    pdfFooterImageWidth: 78,
    pdfFooterImageHeight: 22,
    nearOperatorThreshold: 10,
    countDownTimeForDialog: 5,
    predefinedTimePeriods: ["last-15-minutes", "last-hour", "last-6-hrs", "last-12-hrs", "last-24-hrs", "last-calendar-day", "last-7-days", "last-7-calendar-days", "last-calendar-week", "last-30-days", "last-30-calendar-days", "last-calendar-month"],
    predefinedTimePeriodsStartingWith15Mins: ["last-15-minutes", "last-hour", "last-6-hrs", "last-12-hrs", "last-24-hrs", "last-calendar-day", "last-7-days", "last-7-calendar-days", "last-calendar-week", "last-30-days", "last-30-calendar-days", "last-calendar-month"],
    validScheduledTimePeriods: ["last-calendar-day", "last-7-days", "last-7-calendar-days", "last-calendar-week", "last-30-days", "last-30-calendar-days", "last-calendar-month"],
    DEFAULT_ACK_TIME: '1970/01/02',
    DEFAULT_CONTENT_POLLING_INTERVAL: 300000,
    DEFAULT_ALARM_POLLING_INTERVAL: 15000,
    unit: {
        second: _T('sec'),
        seconds: _T('sec'),
        minutes: _T('min'),
        minute: _T('min'),
        hours: _T('hours'),
        hour: _T('hour'),
        days: _T('days'),
        percent: "%",
        milliseconds: _T('ms'),
        mb: _T('MB'),
        kb: _T('KB'),
        pkts: _T("packets"),
        number: _T("number")
    },
    msg: {
        'GlobalProtect Gateway license required for feature to function': _T('GlobalProtect Gateway license required for feature to function'),
        'GlobalProtect Gateway license expired': _T('GlobalProtect Gateway license expired'),
        'GlobalProtect Portal license expired': _T('GlobalProtect Portal license expired'),
        'GlobalProtect Portal license required for feature to function': _T('GlobalProtect Portal license required for feature to function')
    },
    swUpgradeWarning: _T("is a feature release upgrade from the version currently running. Please review the release notes for a list of new features and to understand any changes to default behavior. Because this is a feature release, portions of the configuration may be migrated to new formats. Please consider backing up the configuration before upgrading as the migrated configuration may not be compatible if attempting to downgrade."),
    deactivateVMWarning: _T("By deactivating this VM, you will be removing the following licenses and entitlements from this device."),
    deactivateVMInfo: _T("Once these licenses have been removed, the VM-Series will retain its configuration but reboot into an unlicensed state. In order to return the VM-Series to production, a new license will need to be applied.") + "<br/><br/>" + _T("Click Continue and PanOS will remove licenses and register change with the license server.") + "<br/><br/>" + _T("Click Complete Manually if PanOS does not have access to the license server. A license removal file will be created and you will be prompted to save it to a machine that can access the license server."),
    deactivateVMManualMsg: _T("The license removal file was created and the licenses were successfully removed. Please bring the license removal file to support.paloaltonetworks.com to complete the deactivation process. Please reboot the VM once you export the file."),
    Panorama_deactivateVMWarning: _T("By deactivating these VMs you will be removing all licenses and entitlements from these devices. Once these licenses have been removed the VM-series will retain its configuration but reboot into an unlicensed state. In order to return the VM-series to production, a new license will need to be applied.") + "<br/><br/>" + _T("Click Continue and Panorama will remove licenses and register change with the license server.") + "<br/><br/>" + _T("Click Complete Manually if Panorama does not have access to the license server. A license removal file will be created and you will be prompted to save it to a machine that can access the license server."),
    upgradeVMInfo: _T("Upon upgrading the VM-Y will retain all the configurations of VM-X and would have higher capacity. Identical subscriptions should be applied for VM-Y for maintaining firewall functionality available from those subscriptions.") + "<br/><br/>" + _T("Click Continue and PanOS will upgrade to VM-Y.") + "<br/><br/>" + _T("Click Complete Manually if PanOS does not have access to the license server. A license upgrade file will be created and you will be prompted to save it to a machine that can access the license server."),
    upgradeVMManualMsg: _T("The license upgrade file was created and the current license was successfully removed. Please bring the license upgrade file to support.paloaltonetworks.com to complete the upgrade process.") + "<br/><br/>" + _T("PAN services are being restarted. Please refresh the UI after the services are up."),
    threatRanges: [["250000-251000 (Threat Prevention - JavaScript)", "250000-251000"], ["280000-282000 (Threat Prevention - PDF)", "280000-282000"], ["1000000-1010000 (Threat Prevention - APK)", "1000000-1010000"], ["1050000-1051000 (Threat Prevention - PKG)", "1050000-1051000"], ["1060000-1062000 (Threat Prevention - MACHO)", "1060000-1062000"], ["1070000-1071000 (Threat Prevention - APP)", "1070000-1071000"], ["1200000-1202000 (Threat Prevention - Office2003/RTF)", "1200000-1202000"], ["1210000-1211000 (Threat Prevention - Office2007+)", "1210000-1211000"], ["1250000-1253000 (Threat Prevention - JAVA Class)", "1250000-1253000"], ["1270000-1273000 (Threat Prevention - Flash)", "1270000-1273000"], ["1480000-1504000 (Threat Prevention - RAR)", "1480000-1504000"], ["1560000-1560500 (Threat Prevention - 7Z)", "1560000-1560500"], ["2000000-3000000 (Threat Prevention - PE)", "2000000-3000000"], ["4000000-4100000 (Threat Prevention - DNS)", "4000000-4100000"], ["6000000-6000500 (Threat Prevention - SWFZWS)", "6000000-6000500"], ["6010000-6015000 (Threat Prevention - DMG)", "6010000-6015000"], ["3000000-3100000 (WildFire Public Cloud - PE)", "3000000-3100000"], ["3100000-3101000 (WildFire Public Cloud - PDF)", "3100000-3101000"], ["3110000-3111000 (WildFire Public Cloud - APK)", "3110000-3111000"], ["3130000-3131000 (WildFire Public Cloud - Office2003/RTF)", "3130000-3131000"], ["3140000-3141000 (WildFire Public Cloud - JAVA Class)", "3140000-3141000"], ["3150000-3151000 (WildFire Public Cloud - Flash)", "3150000-3151000"], ["3160000-3161000 (WildFire Public Cloud - Office2007+)", "3160000-3161000"], ["3170000-3171000 (WildFire Public Cloud - RAR)", "3170000-3171000"], ["3180000-3180500 (WildFire Public Cloud - 7Z)", "3180000-3180500"], ["3400000-3400500 (WildFire Public Cloud - PKG)", "3400000-3400500"], ["3402000-3402500 (WildFire Public Cloud - MACHO)", "3402000-3402500"], ["3404000-3404500 (WildFire Public Cloud - APP)", "3404000-3404500"], ["3800000-3804000 (WildFire Public Cloud - DNS)", "3800000-3804000"], ["6200000-6200500 (WildFire Public Cloud - SWFZWS)", "6200000-6200500"], ["6205000-6206000 (WildFire Public Cloud - DMG)", "6205000-6206000"], ["5000000-5100000 (WildFire Private Cloud - PE)", "5000000-5100000"], ["5200000-5300000 (WildFire Private Cloud - PDF)", "5200000-5300000"], ["5300000-5400000 (WildFire Private Cloud - PDF)", "5300000-5400000"], ["5400000-5500000 (WildFire Private Cloud - Office)", "5400000-5500000"], ["5500000-5600000 (WildFire Private Cloud - OfficeX)", "5500000-5600000"], ["5600000-5650000 (WildFire Private Cloud - RTF)", "5600000-5650000"], ["5650000-5700000 (WildFire Private Cloud - JAVA Class)", "5650000-5700000"], ["5800000-6000000 (WildFire Private Cloud - DNS)", "5800000-6000000"]],
    unifiedLogDefaultDatabases: ['traffic', 'threat', 'url', 'data', 'wildfire', 'gtp', 'sctp', 'tunnel', 'auth'],
    logSettingsDatabases: [{logtype: 'system', logtitle: _T('System'), autoGen: 'System'}, {
        logtype: 'config',
        logtitle: _T('Configuration'),
        autoGen: 'Config'
    }, {logtype: 'hipmatch', logtitle: _T('HIP Match'), autoGen: 'HIPMatch'}, {
        logtype: 'traffic',
        logtitle: _T('Traffic'),
        autoGen: 'Traffic'
    }, {logtype: 'threat', logtitle: _T('Threat'), autoGen: 'Threat'}, {
        logtype: 'url',
        logtitle: _T('URL'),
        autoGen: 'URL'
    }, {logtype: 'data', logtitle: _T('Data'), autoGen: 'Data'}, {
        logtype: 'wildfire',
        logtitle: _T('WildFire'),
        autoGen: 'WildFire'
    }, {logtype: 'correlation', logtitle: _T('Correlation'), autoGen: 'Correlation'}, {
        logtype: 'gtp',
        logtitle: _T('GTP'),
        autoGen: 'GTP'
    }, {logtype: 'sctp', logtitle: _T('SCTP'), autoGen: 'SCTP'}, {
        logtype: 'auth',
        logtitle: _T('Authentication'),
        autoGen: 'Authentication'
    }, {logtype: 'userid', logtitle: _T('User-ID'), autoGen: 'UserID', permission: 'user-id'}, {
        logtype: 'tunnel',
        logtitle: _T('Tunnel'),
        autoGen: 'Tunnel'
    }],
    DEVICE_OP_MODE_0: 'normal',
    DEVICE_OP_MODE_1: 'fips',
    DEVICE_OP_MODE_2: 'fips-cc',
    AUTO_FOCUS_API: 'https://autofocus.paloaltonetworks.com/panos-to-af?src=',
    THREAT_VAULT_API: 'https://threatvault.paloaltonetworks.com?query=',
    gtpTunnel: ['GTP-U'],
    otherTunnels: ['GRE', 'IPSEC', 'GTP-U-TCI'],
    secureConnClient: _T('Secure Client Communication'),
    secureConnServer: _T('Secure Server Communication'),
    customizeSecureConnServer: _T('Customize Secure Server Communication'),
    WELL_KNOWN_LOCATION_TYPES: {
        'Device Groups': _T('Device Groups'),
        'Templates': _T('Templates'),
        'Template Stacks': _T('Template Stacks'),
        'Collector Groups': _T('Collector Groups'),
        'Managed Collectors': _T('Managed Collectors'),
        'WildFire Appliances': _T('WildFire Appliances'),
        'WildFire Appliance Clusters': _T('WildFire Appliance Clusters'),
        'Virtual Systems': _T('Virtual Systems')
    },
    FULL_COMMIT_MESSAGES: {
        'START_FROM_COMMIT': _T('Only a full commit is available at the current time. You may preview changes or validate the configuration or add a description to the commit.'),
        'START_FROM_SAVE': _T('Currently partial save operations are unavailable. Save operations may be performed from Setup -> Operations. Partial operations shall be available after a full commit.'),
        'START_FROM_REVERT': _T('Currently partial revert operations are unavailable. Revert operations may be performed from Setup -> Operations. Partial operations shall be available after a full commit.')
    },
    TREE_NODE_XPATH_COUNT_MAP_KEY_SUFFIX: '-config-xpath-map',
    PANORAMA_SOFTWARE_NODE_COUNT_CACHE_KEY: 'panorama-software-node-count',
    PANORAMA_DEVICE_SUMMARY_NODE_COUNT_CACHE_KEY: 'panorama-device-summary-node-count',
    VARIABLE_VALUE_NOT_FOUND_TEXT: 'value not found',
    vmMode: {GATEWAY: 0, VMWARE_HYPERVISOR: 1, XEN_SDX: 2, KVM: 3, XEN_AWS: 4, HPV: 5, AZR: 6, GCE: 7, UNKNOWN: 100},
    panoramaLicense: {VALID: "0", NOT_SUFFICIENT: "1", NO_LICENSE: "2"},
    contentUpdateAppThresholdFS: _T("Allow Extra Time to Review New App-IDs"),
    contentUpdateAppThreshold: _T("New App-ID Threshold"),
    contentUpdateAppThresholdHelpStr: _T('Set the amount of time the firewall waits before installing content updates that contain new App-IDs. You can use this wait period to assess and adjust your security policy based on the new App-IDs.')
};
Pan.base.PasswordPrompt = function () {
    var dlg, opt, mask, waitTimer, bodyEl, msgEl, textboxEl, textareaEl, progressBar, pp, iconEl, spacerEl, buttons,
        activeTextEl, bwidth, bufferIcon = '', iconCls = '', buttonNames = ['ok', 'yes', 'no', 'cancel'];
    var handleButton = function (button) {
        buttons[button].blur();
        if (dlg.isVisible()) {
            dlg.hide();
            handleHide();
            Ext.callback(opt.fn, opt.scope || window, [button, activeTextEl.dom.value, opt], 1);
        }
    };
    var handleHide = function () {
        if (opt && opt.cls) {
            dlg.el.removeClass(opt.cls);
        }
        progressBar.reset();
    };
    var handleEsc = function (d, k, e) {
        if (opt && opt.closable !== false) {
            dlg.hide();
            handleHide();
        }
        if (e) {
            e.stopEvent();
        }
    };
    var updateButtons = function (b) {
        var width = 0, cfg;
        if (!b) {
            Ext.each(buttonNames, function (name) {
                buttons[name].hide();
            });
            return width;
        }
        dlg.footer.dom.style.display = '';
        Ext.iterate(buttons, function (name, btn) {
            cfg = b[name];
            if (cfg) {
                btn.show();
                btn.setText(Ext.isString(cfg) ? cfg : Pan.base.PasswordPrompt.buttonText[name]);
                width += btn.getEl().getWidth() + 15;
            } else {
                btn.hide();
            }
        });
        return width;
    };
    return {
        getDialog: function (titleText) {
            if (!dlg) {
                var btns = [];
                buttons = {};
                Ext.each(buttonNames, function (name) {
                    btns.push(buttons[name] = new Ext.Button({
                        text: this.buttonText[name],
                        handler: handleButton.createCallback(name),
                        hideMode: 'offsets'
                    }));
                }, this);
                dlg = new Ext.Window({
                    autoCreate: true,
                    title: titleText,
                    resizable: false,
                    constrain: true,
                    constrainHeader: true,
                    minimizable: false,
                    maximizable: false,
                    stateful: false,
                    modal: true,
                    shim: true,
                    buttonAlign: "center",
                    width: 400,
                    height: 100,
                    minHeight: 80,
                    plain: true,
                    footer: true,
                    closable: true,
                    close: function () {
                        if (opt && opt.buttons && opt.buttons.no && !opt.buttons.cancel) {
                            handleButton("no");
                        } else {
                            handleButton("cancel");
                        }
                    },
                    fbar: new Ext.Toolbar({items: btns, enableOverflow: false})
                });
                dlg.render(document.body);
                dlg.getEl().addClass('x-window-dlg');
                mask = dlg.mask;
                bodyEl = dlg.body.createChild({html: '<div class="ext-mb-icon"></div><div class="ext-mb-content"><span class="ext-mb-text"></span><br /><div class="ext-mb-fix-cursor"><input type="password" class="ext-mb-input" /><textarea class="ext-mb-textarea"></textarea></div></div>'});
                iconEl = Ext.get(bodyEl.dom.firstChild);
                var contentEl = bodyEl.dom.childNodes[1];
                msgEl = Ext.get(contentEl.firstChild);
                textboxEl = Ext.get(contentEl.childNodes[2].firstChild);
                textboxEl.enableDisplayMode();
                textboxEl.addKeyListener([10, 13], function () {
                    if (dlg.isVisible() && opt && opt.buttons) {
                        if (opt.buttons.ok) {
                            handleButton("ok");
                        } else if (opt.buttons.yes) {
                            handleButton("yes");
                        }
                    }
                });
                textareaEl = Ext.get(contentEl.childNodes[2].childNodes[1]);
                textareaEl.enableDisplayMode();
                progressBar = new Ext.ProgressBar({renderTo: bodyEl});
                bodyEl.createChild({cls: 'x-clear'});
            }
            return dlg;
        },
        updateText: function (text) {
            if (!dlg.isVisible() && !opt.width) {
                dlg.setSize(this.maxWidth, 100);
            }
            msgEl.update(text || '&#160;');
            var iw = iconCls != '' ? (iconEl.getWidth() + iconEl.getMargins('lr')) : 0,
                mw = msgEl.getWidth() + msgEl.getMargins('lr'), fw = dlg.getFrameWidth('lr'),
                bw = dlg.body.getFrameWidth('lr'), w;
            if (Ext.isIE && iw > 0) {
                iw += 3;
            }
            w = Math.max(Math.min(opt.width || iw + mw + fw + bw, opt.maxWidth || this.maxWidth), Math.max(opt.minWidth || this.minWidth, bwidth || 0));
            if (opt.prompt === true) {
                activeTextEl.setWidth(w - iw - fw - bw);
            }
            if (opt.progress === true || opt.wait === true) {
                progressBar.setSize(w - iw - fw - bw);
            }
            if (Ext.isIE && w == bwidth) {
                w += 4;
            }
            dlg.setSize(w, 'auto').center();
            return this;
        },
        updateProgress: function (value, progressText, msg) {
            progressBar.updateProgress(value, progressText);
            if (msg) {
                this.updateText(msg);
            }
            return this;
        },
        isVisible: function () {
            return dlg && dlg.isVisible();
        },
        hide: function () {
            var proxy = dlg ? dlg.activeGhost : null;
            if (this.isVisible() || proxy) {
                dlg.hide();
                handleHide();
                if (proxy) {
                    dlg.unghost(false, false);
                }
            }
            return this;
        },
        show: function (options) {
            if (this.isVisible()) {
                this.hide();
            }
            opt = options;
            var d = this.getDialog(opt.title || "&#160;");
            d.setTitle(opt.title || "&#160;");
            var allowClose = (opt.closable !== false && opt.progress !== true && opt.wait !== true);
            d.tools.close.setDisplayed(allowClose);
            activeTextEl = textboxEl;
            opt.prompt = opt.prompt || (opt.multiline ? true : false);
            if (opt.prompt) {
                if (opt.multiline) {
                    textboxEl.hide();
                    textareaEl.show();
                    textareaEl.setHeight(Ext.isNumber(opt.multiline) ? opt.multiline : this.defaultTextHeight);
                    activeTextEl = textareaEl;
                } else {
                    textboxEl.show();
                    textareaEl.hide();
                }
            } else {
                textboxEl.hide();
                textareaEl.hide();
            }
            activeTextEl.dom.value = opt.value || "";
            if (opt.prompt) {
                d.focusEl = activeTextEl;
            } else {
                var bs = opt.buttons;
                var db = null;
                if (bs && bs.ok) {
                    db = buttons["ok"];
                } else if (bs && bs.yes) {
                    db = buttons["yes"];
                }
                if (db) {
                    d.focusEl = db;
                }
            }
            if (opt.iconCls) {
                d.setIconClass(opt.iconCls);
            }
            this.setIcon(Ext.isDefined(opt.icon) ? opt.icon : bufferIcon);
            bwidth = updateButtons(opt.buttons);
            progressBar.setVisible(opt.progress === true || opt.wait === true);
            this.updateProgress(0, opt.progressText);
            this.updateText(opt.msg);
            if (opt.cls) {
                d.el.addClass(opt.cls);
            }
            d.proxyDrag = opt.proxyDrag === true;
            d.modal = opt.modal !== false;
            d.mask = opt.modal !== false ? mask : false;
            if (!d.isVisible()) {
                document.body.appendChild(dlg.el.dom);
                d.setAnimateTarget(opt.animEl);
                d.on('show', function () {
                    if (allowClose === true) {
                        d.keyMap.enable();
                    } else {
                        d.keyMap.disable();
                    }
                }, this, {single: true});
                d.show(opt.animEl);
            }
            if (opt.wait === true) {
                progressBar.wait(opt.waitConfig);
            }
            return this;
        },
        setIcon: function (icon) {
            if (!dlg) {
                bufferIcon = icon;
                return this;
            }
            bufferIcon = undefined;
            if (icon && icon != '') {
                iconEl.removeClass('x-hidden');
                iconEl.replaceClass(iconCls, icon);
                bodyEl.addClass('x-dlg-icon');
                iconCls = icon;
            } else {
                iconEl.replaceClass(iconCls, 'x-hidden');
                bodyEl.removeClass('x-dlg-icon');
                iconCls = '';
            }
            return this;
        },
        progress: function (title, msg, progressText) {
            this.show({
                title: title,
                msg: msg,
                buttons: false,
                progress: true,
                closable: false,
                minWidth: this.minProgressWidth,
                progressText: progressText
            });
            return this;
        },
        wait: function (msg, title, config) {
            this.show({
                title: title,
                msg: msg,
                buttons: false,
                closable: false,
                wait: true,
                modal: true,
                minWidth: this.minProgressWidth,
                waitConfig: config
            });
            return this;
        },
        alert: function (title, msg, fn, scope) {
            this.show({title: title, msg: msg, buttons: this.OK, fn: fn, scope: scope, minWidth: this.minWidth});
            return this;
        },
        confirm: function (title, msg, fn, scope) {
            this.show({
                title: title,
                msg: msg,
                buttons: this.YESNO,
                fn: fn,
                scope: scope,
                icon: this.QUESTION,
                minWidth: this.minWidth
            });
            return this;
        },
        prompt: function (title, msg, fn, scope, multiline, value) {
            this.show({
                title: title,
                msg: msg,
                buttons: this.OKCANCEL,
                fn: fn,
                minWidth: this.minPromptWidth,
                scope: scope,
                prompt: true,
                multiline: multiline,
                value: value
            });
            return this;
        },
        OK: {ok: true},
        CANCEL: {cancel: true},
        OKCANCEL: {ok: true, cancel: true},
        YESNO: {yes: true, no: true},
        YESNOCANCEL: {yes: true, no: true, cancel: true},
        INFO: 'ext-mb-info',
        WARNING: 'ext-mb-warning',
        QUESTION: 'ext-mb-question',
        ERROR: 'ext-mb-error',
        defaultTextHeight: 75,
        maxWidth: 600,
        minWidth: 100,
        minProgressWidth: 250,
        minPromptWidth: 250,
        buttonText: {ok: "OK", cancel: "Cancel", yes: "Yes", no: "No"}
    };
}();
Ext.ns('Pan.base.validation');
Ext.apply(Pan.base.validation, {
    quoteIfNecessary: function (val, field) {
        if ((!Ext.isString(val) && !Ext.isNumber(val)) || val === '') {
            return "''";
        }
        if (Ext.isString(val) && val != '' && (!val.match(/^[0-9a-zA-Z_.-]+$/) || (field && (field == 'srcloc' || field == 'dstloc')))) {
            return "'" + val.replace(/'/g, "\\'") + "'";
        } else {
            return val;
        }
    }, isObjectName: function (str) {
        return !!str.match(/^[0-9a-zA-Z]{1}([0-9a-zA-Z_-]|[ ]|[.])*$/);
    }, isValidAdminName: function (str) {
        return str.match(/^[0-9a-zA-Z]{1}([{}`[\]()0-9a-zA-Z\/!&$._~#@%^*<>\\-])*$/);
    }, isInterface: function (str) {
        return str.match(/^([ 0-9a-zA-Z:@.\/_-])+$/);
    }, isNumber: function (str, min, max) {
        return Pan.base.validation.inRange(str, min, max);
    }, inRange: function (str, min, max) {
        var n = Number(str);
        if (isNaN(n))
            return false;
        if (str.match(/^([0-9])+$/) == null) {
            return false;
        }
        if (min != undefined && n < min)
            return false;
        return !(max != undefined && n > max);
    }, isRiskValue: function (val) {
        if (Ext.isNumber(val)) {
            return val >= 1 && val <= 5;
        } else {
            return !!val.match(/^(1|2|3|4|5)$/);
        }
    }, isIpV4Address: function (str) {
        var i;
        var matches = str.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
        if (!matches) return false;
        for (i = 1; i <= 4; i++) {
            var n = parseInt(matches[i], 10);
            if (isNaN(n)) return false;
            if (!(n >= 0 && n <= 255)) return false;
        }
        matches.shift();
        for (i = 0; i < matches.length; i++)
            matches[i] = parseInt(matches[i], 10);
        return {ip: Pan.base.validation.octectsToLong.apply(null, matches), octects: matches};
    }, isIpV4AddressMask: function (str, requireMask) {
        var matches = str.match(/^([^\/]+)\/([^\/]+)$/);
        if (!requireMask && !matches) return Pan.base.validation.isIpV4Address(str);
        if (matches) {
            var n = parseInt(matches[2], 10);
            return (n >= 0 && n <= 32 && Pan.base.validation.isIpV4Address(matches[1]));
        }
        return Pan.base.validation.isIpV4Address(str);
    }, is2ToPowerNMinusOne: function (n) {
        return (n & (n + 1)) == 0;
    }, isIpV4NetmaskLongValue: function (n) {
        return Pan.base.validation.is2ToPowerNMinusOne(~n);
    }, octectsToLong: function (a, b, c, d) {
        return a * (1 << 24) + b * (1 << 16) + c * (1 << 8) + d;
    }, isIpV4Netmask: function (str) {
        var cidr;
        var result = Pan.base.validation.isIpV4Address(str);
        if (result) {
            if (!Pan.base.validation.isIpV4NetmaskLongValue(result.ip)) return false;
            var bit = 0x80000000;
            cidr = 0;
            while (bit & result.ip) {
                cidr++;
                bit >>>= 1;
            }
            return {mask: result.ip, cidr: cidr};
        } else {
            cidr = parseInt(str, 10);
            if (isNaN(cidr)) return false;
            if (cidr < 0 || cidr > 32) return false;
            var mask = 0xffffffff;
            var bits = cidr;
            while (bits > 0) {
                mask >>>= 1;
                bits--;
            }
            return {mask: ~mask, cidr: cidr};
        }
    }, isIpV6Address: function (str) {
        return !!str.match(/^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$/);
    }, isIpV6Netmask: function (str) {
        return Pan.base.validation.inRange(str, 3, 128);
    }, isIpV6AddressMask: function (str, requireMask) {
        if (str === "::/0")
            return true;
        var arr = str.split("/");
        if (!requireMask && arr.length == 1) {
            return Pan.base.validation.isIpV6Address(arr[0]);
        } else if (arr.length == 2) {
            return Pan.base.validation.isIpV6Netmask(arr[1]) && Pan.base.validation.isIpV6Address(arr[0]);
        }
        return false;
    }, isIpAddress: function (str) {
        return Pan.base.validation.isIpV4Address(str) || Pan.base.validation.isIpV6Address(str);
    }, isIpAddressMask: function (str, requireMask) {
        return Pan.base.validation.isIpV4AddressMask(str, requireMask) || Pan.base.validation.isIpV6AddressMask(str, requireMask);
    }, isCustomCpValueMask: function (str, requireMask) {
        return !!str.match(/^([0-1]{6})$/);
    }, isMacAddress: function (mac) {
        var COLON = ":";
        var seg;
        var charDomain = "0123456789abcdefABCDEF:";
        var i = 0;
        var j = 0;
        var c;
        mac = mac.trim();
        if (mac.length < 11)
            return false;
        for (i = 0; i < mac.length; i++) {
            c = mac.charAt(i);
            if (charDomain.indexOf(c) < 0)
                return false;
        }
        seg = mac.split(COLON);
        if (seg.length != 6)
            return false;
        for (i = 0; i < 6; i++) {
            if (seg[i].length < 1 || seg[i].length > 2)
                return false;
            j = parseInt(seg[i], 16);
            if (j < 0 || j > 255)
                return false;
        }
        return true;
    }, validNumber: function (str, min, max) {
        var n = Number(str);
        if (isNaN(n)) {
            return false;
        }
        if (str.match(/^([0-9])+$/) == null) {
            return false;
        }
        if (min != undefined && n < min) {
            return false;
        }
        if (max != undefined && n > max) {
            return false;
        }
        return true;
    }, validNumberRangeList: function (str, min, max) {
        var tokensArray = str.split(",");
        for (var i = 0; i < tokensArray.length; i++) {
            if (tokensArray[i].charAt(tokensArray[i].length - 1) == '-') {
                return false;
            }
            if (tokensArray[i].charAt(0) == '-') {
                if (!Pan.base.validation.validNumber(tokensArray[i], min, max)) {
                    return false;
                }
            } else {
                var numbersArray = tokensArray[i].split("-");
                for (var j = 0; j < numbersArray.length; j++) {
                    if (!Pan.base.validation.validNumber(numbersArray[j], min, max)) {
                        return false;
                    }
                }
                if (numbersArray.length == 2) {
                    var num1 = numbersArray[0] - 0;
                    var num2 = numbersArray[1] - 0;
                    if (num1 > num2) {
                        return false;
                    }
                }
            }
        }
        return true;
    }, objectNameValidationMap: {"^[a-zA-Z0-9_-]+$": "objectNameWithoutSpaceAndDot"}
});
Ext.apply(Ext.form.VTypes, {
    skipValidation: function (v) {
        return true;
    },
    objectNameVal: /^[0-9a-zA-Z]{1}(([0-9a-zA-Z_-]|[ ]|[.])*([0-9a-zA-Z_-]|[.]))?$/,
    objectNameText: _T("A valid object name must start with an alphanumeric character and can contain zero or more alphanumeric characters, underscore '_', hyphen '-', dot '.' or spaces"),
    objectName: function (v) {
        return Ext.form.VTypes['objectNameVal'].test(v);
    },
    strictHostNameVal: /^(([0-9a-z]+)|([0-9a-z]{1}[0-9a-z-]*[0-9a-z]{1}))$/,
    strictHostNameText: _T("A valid Hostname must start and end with an alphanumeric character and can contain zero or more alphanumeric characters, hyphen '-'"),
    strictHostName: function (v) {
        return Ext.form.VTypes['strictHostNameVal'].test(v);
    },
    accViewNameVal: /^[0-9a-zA-Z]{1}(([0-9a-zA-Z_-]|[ ]|[.])*([0-9a-zA-Z_-]|[.]))?$/,
    accViewNameText: _T("A valid tab name must start with an alphanumeric character and can contain zero or more alphanumeric characters, underscore '_', hyphen '-', dot '.' or spaces"),
    accViewName: function (v) {
        return Ext.form.VTypes['accViewNameVal'].test(v);
    },
    objectNameWithoutSpaceAndDotVal: /^[a-zA-Z0-9_-]+$/,
    objectNameWithoutSpaceAndDotText: _T("A valid object name must start with an alphanumeric character and can contain zero or more alphanumeric characters, underscore '_' or hyphen '-'.") + '<br>' + _T("No dot '.' or space is allowed.") + '<br>' + _T("Leading underscore '_' or hyphen '-' is allowed"),
    objectNameWithoutSpaceAndDot: function (v) {
        return Ext.form.VTypes['objectNameWithoutSpaceAndDotVal'].test(v);
    },
    riskText: _T("Risk value should be 1 to 5"),
    risk: function (val) {
        if (Ext.isNumber(val)) {
            return val >= 1 && val <= 5;
        } else {
            return !!val.match(/^(1|2|3|4|5)$/);
        }
    },
    ipVal: /^([1-9][0-9]{0,1}|1[013-9][0-9]|12[0-689]|2[01][0-9]|22[0-3])([.]([1-9]{0,1}[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){2}[.]([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-4])$/,
    ipText: _T("1.0.0.1 - 223.255.255.254 excluding 127.x.x.x"),
    ipMask: /[.0-9]/,
    ip: function (v) {
        return Ext.form.VTypes["ipVal"].test(v);
    },
    netmaskVal: /^(128|192|224|24[08]|25[245].0.0.0)|(255.(0|128|192|224|24[08]|25[245]).0.0)|(255.255.(0|128|192|224|24[08]|25[245]).0)|(255.255.255.(0|128|192|224|24[08]|252))$/,
    netmaskText: "128.0.0.0 - 255.255.255.252",
    netmaskMask: /[.0-9]/,
    netmask: function (v) {
        return Ext.form.VTypes["netmaskVal"].test(v);
    },
    multicastVal: /^((22[4-9]|23[0-9])([.](0|[1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|(224[.]([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])([.](0|[1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])){2})|(224[.]0[.]([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])([.](0|[1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-5])))$/,
    multicastText: _T("Valid multicast addresses range from 224.0.0.0 to 239.255.255.255"),
    multicastMask: /[.0-9\/]/,
    multicast: function (v) {
        var result = Pan.base.validation.isIpV4AddressMask(v);
        if (!result)
            return false;
        var arr = v.split("/");
        return Ext.form.VTypes["multicastVal"].test(arr[0]);
    },
    portVal: /^(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
    portText: "0 - 65535",
    portMask: /[0-9]/,
    port: function (v) {
        return Ext.form.VTypes["portVal"].test(v);
    },
    portList: function (value) {
        var values = value.split(',').map(function (x) {
            return x.trim();
        });
        return values.reduce(function (p, v) {
            return p && Ext.form.VTypes.port(v);
        }, true);
    },
    portListMask: /[0-9,]/,
    portListText: _T('port numbers separated by commas'),
    ipAndIntegerSubnetMaskV4orV6SubnetMaskRequiredText: _T("Invalid IP address and mask"),
    ipAndIntegerSubnetMaskV4orV6SubnetMaskRequiredMask: /[.0-9A-Fa-f:\/]/,
    ipAndIntegerSubnetMaskV4orV6SubnetMaskRequired: function (v) {
        return Pan.base.validation.isIpAddressMask(v, true);
    },
    ipAndIntegerSubnetMaskV4orV6Text: _T("Invalid IP address"),
    ipAndIntegerSubnetMaskV4orV6Mask: /[.0-9A-Fa-f:\/]/,
    ipAndIntegerSubnetMaskV4orV6: function (v) {
        return Pan.base.validation.isIpAddressMask(v);
    },
    ipAndIntegerSubnetMaskV4Text: _T("Invalid IPv4 address"),
    ipAndIntegerSubnetMaskV4Mask: /[.0-9\/]/,
    ipAndIntegerSubnetMaskV4: function (v) {
        return Pan.base.validation.isIpV4AddressMask(v);
    },
    ipAndIntegerSubnetMaskV6Text: _T("Invalid IPv6 address"),
    ipAndIntegerSubnetMaskV6Mask: /[0-9A-Fa-f:\/]/,
    ipAndIntegerSubnetMaskV6: function (v) {
        return Pan.base.validation.isIpV6AddressMask(v);
    },
    ipRangeText: _T("Invalid IP address range"),
    ipRangeMask: /[.0-9A-Fa-f\-:\/]/,
    ipRange: function (v) {
        var arr = v.split("-");
        if (arr.length != 2)
            return false;
        return (Pan.base.validation.isIpAddressMask(arr[0]) && Pan.base.validation.isIpAddressMask(arr[1]));
    },
    rangeListText: _T("Invalid range"),
    rangeListMask: /[.0-9,\-]/,
    rangeList: function (v, comp) {
        var min = Ext.isDefined(comp.minValue) ? comp.minValue : 0;
        var max = Ext.isDefined(comp.maxValue) ? comp.maxValue : 65535;
        return Pan.base.validation.validNumberRangeList(v, min, max);
    },
    rangeThreatText: _T("Invalid threat range"),
    rangeThreatMask: /[.0-9,\-]/,
    rangeThreat: function (v, comp) {
        v = v.split(' (');
        v = v[0];
        var result = false;
        var min = Ext.isDefined(comp.minValue) ? comp.minValue : 0;
        var max = Ext.isDefined(comp.maxValue) ? comp.maxValue : 9000000;
        var arr = v.split("-");
        if (arr.length == 2) {
            result = (Pan.base.validation.validNumber(arr[0], min, max) && Pan.base.validation.validNumber(arr[1], min, max));
        } else {
            result = Pan.base.validation.validNumberRangeList(v, min, max);
        }
        return result;
    },
    rangePortVal: /^(0|[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
    rangePortText: _T("Invalid port range, 0 - 65535"),
    rangePortMask: /[.0-9,\-]/,
    rangePort: function (v, comp) {
        var result = false;
        var min = Ext.isDefined(comp.minValue) ? comp.minValue : 0;
        var max = Ext.isDefined(comp.maxValue) ? comp.maxValue : 65535;
        var arr = v.split("-");
        if (arr.length == 2) {
            result = (Pan.base.validation.validNumber(arr[0], min, max) && Pan.base.validation.validNumber(arr[1], min, max));
        } else {
            result = Pan.base.validation.validNumberRangeList(v, min, max);
        }
        return result;
    },
    customCpValueText: _T("codepoint in format 'xxxxxx' where x is {0|1}"),
    customCpValuetMask: /^([0-1]{6})$/,
    customCpValue: function (v) {
        return Pan.base.validation.isCustomCpValueMask(v);
    },
    macAddressText: _T("Invalid MAC address"),
    macAddressMask: /[.0-9A-Fa-f:\/]/,
    macAddress: function (v) {
        return Pan.base.validation.isMacAddress(v);
    },
    rangedInt: function (value, comp, validationInfo) {
        if (validationInfo && validationInfo) {
            var num = parseInt(value, 10);
            if (isNaN(num)) {
                comp.vtypeText = String.format(Ext.form.NumberField.prototype.nanText, value);
                return false;
            }
            if (value != num || value.toString() != num.toString()) {
                comp.vtypeText = "" + value + " " + _T("is not a valid integer");
                return false;
            }
            if (num < validationInfo.minValue) {
                comp.vtypeText = String.format(Ext.form.NumberField.prototype.minText, validationInfo.minValue);
                return false;
            }
            if (num > validationInfo.maxValue) {
                comp.vtypeText = String.format(Ext.form.NumberField.prototype.maxText, validationInfo.maxValue);
                return false;
            }
        }
        return true;
    },
    isInt: function (value, comp) {
        var num = parseInt(value, 10);
        if (isNaN(num)) {
            comp.vtypeText = String.format(Ext.form.NumberField.prototype.nanText, value);
            return false;
        }
        if (value != num || value.toString() != num.toString()) {
            comp.vtypeText = "" + value + " " + _T("is not a valid integer");
            return false;
        }
        if (comp.validationInfo) {
            if (num < comp.validationInfo.minValue) {
                comp.vtypeText = String.format(Ext.form.NumberField.prototype.minText, comp.validationInfo.minValue);
                return false;
            }
            if (num > comp.validationInfo.maxValue) {
                comp.vtypeText = String.format(Ext.form.NumberField.prototype.maxText, comp.validationInfo.maxValue);
                return false;
            }
        }
        return true;
    },
    ipListVtype: function (v, comp) {
        comp.vtypeText = undefined;
        var a = v.split(/[ ;,\t\r\n]/);
        if (a.length > 1) {
            for (var i = 0; i < a.length; i++) {
                var s = a[i].trim();
                if (s && !Ext.form.VTypes.ipRange(s) && !Ext.form.VTypes.ipAndIntegerSubnetMaskV4orV6(s)) {
                    comp.vtypeText = "Invalid IP: " + s;
                    break;
                }
            }
        }
        return !comp.vtypeText;
    },
    isInFieldValueList: function (value, comp, validationInfo) {
        if (Ext.isArray(validationInfo.fieldValueList) && validationInfo.fieldValueList.indexOf(value) !== -1) {
            comp.vtypeText = undefined;
        } else {
            comp.vtypeText = _T("Value is not in the allowed list.");
        }
        return !comp.vtypeText;
    },
    multiVtype: function (value, comp) {
        var vtypeText = comp.vtypeText = undefined;
        if (comp.__field && comp.store && comp.__field.autoComplete && comp.store.isStoreLoaded === false) {
            return;
        }
        if (comp.__field && comp.__field.multitypes) {
            var enumValues = comp.__field.multitypes['enum'];
            if (enumValues) {
                for (var j = 0; j < enumValues.length; j++) {
                    if (enumValues[j][0] === value) {
                        return;
                    }
                }
            }
        }
        var vt = Ext.form.VTypes;
        var multiValidationInfo = comp.multiValidationInfo;
        for (var i = 0; i < multiValidationInfo.length; i++) {
            var validationInfo = multiValidationInfo[i];
            var vtype = validationInfo.vtype;
            if (vtype) {
                var compVtypeText = comp.vtypeText;
                if (!vt[vtype](value, comp, validationInfo)) {
                    var newVtypeText = undefined;
                    if (comp.vtypeText != compVtypeText) {
                        newVtypeText = comp.vtypeText;
                    } else {
                        newVtypeText = vt[vtype + 'Text'];
                    }
                    if (!vtypeText) {
                        vtypeText = newVtypeText;
                    } else {
                        vtypeText += ", " + _T("or") + "<br>" + newVtypeText;
                    }
                } else {
                    vtypeText = undefined;
                    break;
                }
            } else if (validationInfo.regex) {
                if (comp.regex) {
                    if (value.match(comp.regex)) {
                        vtypeText = undefined;
                        break;
                    } else {
                        if (comp.regexText) {
                            vtypeText = comp.regexText;
                        } else {
                            vtypeText = _T("Value does not conform to regular expression check");
                        }
                    }
                }
                else if (!validationInfo.regex.test(value)) {
                    if (comp.regexText) {
                        vtypeText = comp.regexText;
                    } else {
                        vtypeText = _T("Value does not conform to regular expression check: {regex}", {regex: validationInfo.regex.source});
                    }
                } else {
                    vtypeText = undefined;
                    break;
                }
            } else {
                vtypeText = undefined;
                break;
            }
        }
        comp.vtypeText = vtypeText;
        return !comp.vtypeText;
    },
    customText: _T("Invalid value"),
    customVtype: function (v, comp) {
        if (Ext.isEmpty(v))
            return;
        comp.vtypeText = undefined;
        if (comp.regex) {
            if (!v.match(comp.regex)) {
                if (comp.regexText) {
                    comp.vtypeText = comp.regexText;
                } else {
                    comp.vtypeText = _T("Value does not conform to regular expression check");
                }
                return !comp.vtypeText;
            }
        }
        if (!Ext.isFunction(comp.fnCustomValidation)) {
            comp.vtypeText = _T("Custom validation is not defined");
        }
        return comp.fnCustomValidation(v, comp);
    }
});
Ext.ns('Pan', 'Pan.base', 'Pan.base.cookie');
Ext.apply(Pan.base.cookie, {
    set: function (name, value, days, path) {
        var expires = -1;
        if (typeof days == "number" && days >= 0) {
            var d = new Date();
            d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = d.toGMTString();
        }
        value = escape(value);
        document.cookie = name + "=" + value + ";"
            + (expires != -1 ? " expires=" + expires + ";" : "")
            + "path=" + (path || "/");
    }, get: function (name) {
        var idx = document.cookie.indexOf(name + '=');
        if (idx == -1) {
            return null;
        }
        var value = document.cookie.substring(idx + name.length + 1);
        var end = value.indexOf(';');
        if (end == -1) {
            end = value.length;
        }
        value = value.substring(0, end);
        value = unescape(value);
        return value;
    }, remove: function (name) {
        this.set(name, "-", 0);
    }, setObject: function (name, obj, days, path, clearCurrent) {
        var pairs = [], cookie, value = "";
        if (!clearCurrent) {
            cookie = this.getObject(name);
        }
        if (days >= 0) {
            if (!cookie) {
                cookie = {};
            }
            var prop;
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    if (prop == null) {
                        delete cookie[prop];
                    } else if (typeof obj[prop] == "string" || typeof obj[prop] == "number") {
                        cookie[prop] = obj[prop];
                    }
                }
            }
            for (prop in cookie) {
                if (cookie.hasOwnProperty(prop)) {
                    pairs.push(escape(prop) + "=" + escape(cookie[prop]));
                }
            }
            value = pairs.join("&");
        }
        this.set(name, value, days, path);
    }, getObject: function (name) {
        var values = null, cookie = this.get(name);
        if (cookie) {
            values = {};
            var pairs = cookie.split("&");
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split("=");
                var value = pair[1];
                if (isNaN(value)) {
                    value = unescape(pair[1]);
                }
                values[unescape(pair[0])] = value;
            }
        }
        return values;
    }, isCookieSupported: function () {
        if (typeof navigator.cookieEnabled != "boolean") {
            this.set("__TestingYourBrowserForCookieSupport__", "CookiesAllowed", 90, null);
            var cookieVal = this.get("__TestingYourBrowserForCookieSupport__");
            navigator.cookieEnabled = (cookieVal == "CookiesAllowed");
            if (navigator.cookieEnabled) {
                this.deleteCookie("__TestingYourBrowserForCookieSupport__");
            }
        }
        return navigator.cookieEnabled;
    }
});
umd(function (define) {
    define({
        path: function (obj, path, defaultValue) {
            if (obj) {
                var result = jsonPath(obj, path);
                if (result) {
                    return result[0];
                }
            }
            return defaultValue;
        }, paths: function (obj, path, arg) {
            var result = jsonPath(obj, path, arg);
            if (result === false)
                return [];
            return result;
        }
    });
}, "Pan.base.json", require, exports, module);
(function () {
    var base = Pan.base;
    var PanDecode = {
        panValue: jsonPath, panPathString: function (o, e) {
            var result = jsonPath(o, e, {resultType: "PATH"});
            if (result) {
                result = result[0].split("$");
                if (result && result.length > 1) {
                    return result[1];
                } else {
                    result = false;
                }
            }
            return result;
        }, panPathArray: function (o, e, removeQuotes) {
            var result = jsonPath(o, e, {resultType: "PATH"});
            if (result) {
                result = result[0].split('][');
                if (result && result.length > 0) {
                    result[0] = result[0].slice(2);
                    var last = result[result.length - 1];
                    result[result.length - 1] = last.slice(0, last.length - 1);
                    if (removeQuotes) {
                        for (var i = 0; i < result.length; i++) {
                            result[i] = result[i].replace(/^[']|[']$/g, "");
                        }
                    }
                } else {
                    result = false;
                }
            }
            return result;
        }, eq: function (a, b) {
            return a == b;
        }, compare: function (a, b) {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return +1;
            }
            return 0;
        }, arraySubtract: function (a, b, compare) {
            if (!compare) {
                compare = this.compare;
            }
            a = a.slice(0).sort();
            for (var i = 0; i < b.length; i++) {
                for (var j = 0; j < a.length; j++) {
                    var result = compare(a[j], b[i]);
                    if (result == 0) {
                        a.splice(j, 1);
                    }
                    if (result >= 0) {
                        break;
                    }
                }
            }
            return a;
        }, deleteAllChildren: function (o) {
            for (var m in o) {
                if (o.hasOwnProperty(m)) {
                    delete o[m];
                }
            }
        }, createMutator: function (expr) {
            if (expr) {
                expr = String(expr).replace(/['"]*[\]][\[]['"]*|['"]*[\]][.]*|[.]*[\[]['"]*/g, ".");
                expr = expr.replace(/^[.]*|[.]*$/g, "");
            }
            var parts = String(expr).split(".");
            if (parts.length > 0) {
                return function (obj, value, recreate, startPathIndex, merge) {
                    var i = (Ext.isNumber(startPathIndex) ? startPathIndex : 0);
                    if (recreate) {
                        if (obj[parts[i]]) {
                            delete obj[parts[i]];
                        }
                    }
                    for (; i < parts.length - 1; i++) {
                        if (value !== undefined) {
                            obj = obj[parts[i]] = obj[parts[i]] || {};
                        } else {
                            if (obj[parts[i]]) {
                                obj = obj[parts[i]];
                            } else {
                                break;
                            }
                        }
                    }
                    if (value === undefined) {
                        if (i == parts.length - 1) {
                            delete obj[parts[i]];
                        }
                    } else {
                        if (merge) {
                            Ext.apply(obj, value);
                        } else {
                            obj[parts[i]] = value;
                        }
                    }
                    return obj;
                };
            }
            return function (obj, value) {
                if (value === undefined) {
                    if (obj[expr]) {
                        delete obj[expr];
                    }
                    return obj;
                }
                obj[expr] = value;
                return obj;
            };
        }, setValue: function (object, expr, value, recreate, startPathIndex) {
            return this.createMutator(expr)(object, value, recreate, startPathIndex);
        }, createAccessor: function (expr) {
            if (expr) {
                expr = String(expr).replace(/['"]*[\]][\[]['"]*|['"]*[\]][.]*|[.]*[\[]['"]*/g, ".");
                expr = expr.replace(/^[.]*|[.]*$/g, "");
            }
            var parts = String(expr).split(".");
            if (parts.length > 0) {
                return function (o, startPathIndex) {
                    if (o) {
                        for (var i = startPathIndex || 0; i < parts.length; i++) {
                            o = o[parts[i]];
                            if (o !== 0 && !o) {
                                return undefined;
                            }
                        }
                    }
                    return o;
                };
            } else {
                return function (o) {
                    if (o) {
                        return o[expr];
                    } else {
                        return o;
                    }
                };
            }
        }, callChain: function (field, callChain, args) {
            var log = PanLogging.getLogger('base:PanDecode');
            var parts = [];
            if (callChain.match(/\.*\)/)) {
                args = {multiOperands: []};
                var funcSplitParts = callChain.split(/[()]/g);
                if (funcSplitParts.length % 2 === 1) {
                    for (var j = 0; j < funcSplitParts.length;) {
                        var subparts = funcSplitParts[j++].split(".");
                        for (var k = 0; k < subparts.length; k++) {
                            if (subparts[k] !== "") {
                                parts[parts.length] = subparts[k];
                            }
                        }
                        if (j < funcSplitParts.length) {
                            var argparts = funcSplitParts[j++].split(",");
                            args.multiOperands.push(argparts);
                            for (var l = 0; l < argparts.length; l++) {
                                if (argparts[l] === "") {
                                    argparts[l] = undefined;
                                } else {
                                    try {
                                        argparts[l] = Ext.decode(argparts[l]);
                                    } catch (ex) {
                                        log.error("Unable to evaluate " + callChain);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                parts = String(callChain).split(".");
            }
            if (!Ext.isDefined(args)) {
                args = [];
            } else if (Ext.isArray(args.multiOperands)) {
                args = args.multiOperands;
            } else {
                args = [args];
            }
            var argsIndex = 0;
            var json = field;
            if (parts.length > 0) {
                for (var i = 0; json && i < parts.length; i++) {
                    var scope = json;
                    json = json[parts[i]];
                    while (Ext.isFunction(json)) {
                        var a = [];
                        if (argsIndex < args.length) {
                            a = args[argsIndex++];
                        }
                        json = json.apply(scope, a);
                    }
                }
            }
            return json;
        }
    };
    Pan.setValue = PanDecode.setValue;
    Pan.createMutator = PanDecode.createMutator;
    Pan.createAccessor = PanDecode.createAccessor;
    Pan.callChain = PanDecode.callChain;
    Pan.base.PanDecode = PanDecode;
}());
Pan.base.Evaluation = function () {
    return {
        visit: function (o, visitFunction, scope) {
            var args = Array.prototype.slice.call(arguments).slice(0);
            if (o instanceof Array) {
                for (var i = 0, n = o.length; i < n; i++) {
                    args[0] = i;
                    args[1] = o;
                    visitFunction.apply(scope, args);
                    args[0] = o[i];
                    args[1] = visitFunction;
                    Pan.base.Evaluation.visit.apply(this, args);
                }
            } else if (typeof o === "object") {
                for (var m in o) {
                    if (o.hasOwnProperty(m)) {
                        args[0] = m;
                        args[1] = o;
                        visitFunction.apply(scope, args);
                        args[0] = o[m];
                        args[1] = visitFunction;
                        Pan.base.Evaluation.visit.apply(this, args);
                    }
                }
            }
        }, visitAndEvaluate: function (o, argumentHash) {
            var log = PanLogging.getLogger('base:Evaluation');
            var applyArguments = function (memberIndex, parent, scope, argumentHash) {
                try {
                    parent[memberIndex] = Pan.base.Evaluation.evaluateInternal(parent[memberIndex], argumentHash);
                } catch (e) {
                    log.error(e);
                }
            };
            this.visit(o, applyArguments, this, argumentHash);
            Pan.base.EvalResults.clear();
        }, evaluate: function (subject, argumentHash) {
            var log = PanLogging.getLogger('base:Evaluation');
            try {
                subject = Pan.base.Evaluation.evaluateInternal(subject, argumentHash);
            } catch (e) {
                log.error(e);
            }
            Pan.base.EvalResults.clear();
            return subject;
        }, evaluateInternal: function (subject, argumentHash) {
            if (typeof subject === "function") {
                subject = subject(argumentHash);
            } else if (typeof subject === "string") {
                var replaceFunction = function (toBeReplaced) {
                    var subject = toBeReplaced.substring(2, toBeReplaced.length - 1);
                    if (!argumentHash.hasOwnProperty(subject)) {
                        try {
                            argumentHash[subject] = Ext.util.JSON.decode(subject);
                        } catch (ex) {
                            argumentHash[subject] = undefined;
                        }
                    }
                    if (typeof argumentHash[subject] === "object") {
                        var resultIndex = Pan.base.EvalResults.append(argumentHash[subject]);
                        return "Pan.base.EvalResults.get(" + resultIndex + ")";
                    } else {
                        return argumentHash[subject];
                    }
                };
                if (subject.match(/^\$\{[^{}]*\}$/)) {
                    subject = replaceFunction(subject);
                    if (typeof subject === "string" && subject.indexOf("Pan.base.EvalResults.get(") == 0) {
                        subject = Ext.util.JSON.decode(subject);
                    }
                } else {
                    subject = subject.replace(/\$\{[^{}]*\}/g, replaceFunction);
                    if (subject.indexOf("${") >= 0) {
                        subject = Pan.base.Evaluation.evaluateInternal(subject, argumentHash);
                    }
                }
            }
            return subject;
        }
    };
}();
Pan.base.EvalResults = function () {
    var evalResultArray = [];
    return {
        getCurrentEvalResultIndex: function () {
            return evalResultArray.length - 1;
        }, get: function (index) {
            return evalResultArray[index];
        }, first: function () {
            return evalResultArray[0];
        }, last: function () {
            return evalResultArray[evalResultArray.length - 1];
        }, append: function (v) {
            return evalResultArray.push(v) - 1;
        }, clear: function () {
            evalResultArray.splice(0, evalResultArray.length);
        }
    };
}();
Pan.base.throwError = function (message, t) {
    t = t || this || {};
    t.name = "SyntaxError";
    t.message = message;
    throw t;
};
String.prototype.tokens = function (prefix, suffix) {
    var c;
    var from;
    var i = 0;
    var length = this.length;
    var n;
    var q;
    var str;
    var result = [];
    var make = function (type, value) {
        return {type: type, value: value, from: from, to: i};
    };
    if (!this) {
        return;
    }
    if (typeof prefix !== 'string') {
        prefix = '<>+-&';
    }
    if (typeof suffix !== 'string') {
        suffix = '=>&:';
    }
    c = this.charAt(i);
    while (c) {
        from = i;
        if (c <= ' ') {
            i += 1;
            c = this.charAt(i);
        } else if (c >= '0' && c <= '9' || c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z') {
            str = c;
            i += 1;
            for (; ;) {
                c = this.charAt(i);
                if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '_' || c === '-' || c === '.' || c === '~' || c === '`' || c === '!' || c === '@' || c === '#' || c === '$' || c === '%' || c === '^' || c === '&' || c === '*' || c === '=' || c === '+' || c === '{' || c === '}' || c === '[' || c === ']' || c === '|' || c === ';' || c === ':' || c === '<' || c === '>' || c === ',' || c === '?' || c === '/') {
                    str += c;
                    i += 1;
                } else {
                    break;
                }
            }
            result.push(make('string', str));
        } else if (c === '\'' || c === '"') {
            str = '';
            q = c;
            i += 1;
            for (; ;) {
                c = this.charAt(i);
                if (c < ' ') {
                    Pan.base.throwError(c === '\n' || c === '\r' || c === '' ? "Unterminated string." : "Control character in string.", make('', str));
                }
                if (c === q) {
                    break;
                }
                str += c;
                i += 1;
            }
            i += 1;
            result.push(make('string', str));
            c = this.charAt(i);
        } else {
            i += 1;
            result.push(make('operator', c));
            c = this.charAt(i);
        }
    }
    return result;
};
Pan.base.parseQuery = (function () {
    var token;
    var tokens;
    var token_nr;
    var peek_token = function () {
        if (token_nr >= tokens.length) {
            return {value: "(end)", id: "(end)", type: "(end)"};
        }
        token = tokens[token_nr];
        return token;
    };
    var next_token = function () {
        token = peek_token();
        token_nr += 1;
        return token;
    };
    var assert_token = function (condition, msg) {
        if (!condition) {
            throw msg;
        }
    };
    var expression = function (left) {
        var t = peek_token();
        var upper = t.value.toUpperCase();
        if (t.type == '(end)') {
            return left;
        } else if (t.value == '(') {
            return expression(parenthesized_expression());
        } else if (upper == 'AND' || upper == 'OR') {
            assert_token(left, 'expression left is missing');
            return expression(compound_op(left));
        } else if (upper == ')') {
            return left;
        } else {
            assert_token(!left, 'do not expect expression to the left');
            return expression(simple_op());
        }
    };
    var compound_op = function (left) {
        var t = next_token();
        var o = {};
        o.op = t.value.toUpperCase();
        var right = expression();
        if (right.op == o.op) {
            right.args.splice(0, 0, left);
            return right;
        } else {
            o.args = [left, right];
            return o;
        }
    };
    var simple_op = function () {
        var o = {};
        o.args = [next_token().value];
        o.op = next_token().value;
        o.args.push(next_token().value);
        return o;
    };
    var parenthesized_expression = function () {
        var open = next_token();
        var e = expression();
        var close = next_token();
        assert_token(close.value == ')', 'expecting close parenthesis');
        return e;
    };
    return function (source) {
        tokens = source.tokens();
        token_nr = 0;
        return expression();
    };
})();
Pan.base.RecordQuery = function () {
    var operator = 'op';
    var operands = 'args';
    return {
        isRecordQueryString: function (s) {
            var matchString = "";
            for (var m in Pan.base.RecordQuery) {
                if (Pan.base.RecordQuery.hasOwnProperty(m)) {
                    if (matchString) {
                        matchString += "| " + m + " ";
                    } else {
                        matchString += "/ " + m + " ";
                    }
                }
            }
            matchString += " /";
            return s.match(matchString);
        }, evaluateRecord: function (expressionTree, record, header2FieldMap, index) {
            var args = expressionTree[operands];
            if (args) {
                var newArgs = new Array(args.length);
                for (var i = 0; i < args.length; i++) {
                    newArgs[i] = Pan.base.RecordQuery.evaluateRecord(args[i], record, header2FieldMap, i);
                }
                args = newArgs;
            }
            var rv;
            var op = expressionTree[operator];
            if (op) {
                rv = Pan.base.RecordQuery[op.toLowerCase()].apply(Pan.base.RecordQuery, args);
            } else {
                var filterField;
                if (Ext.isNumber(index) && index == 0) {
                    filterField = header2FieldMap[expressionTree.toLowerCase()];
                }
                if (filterField) {
                    rv = function (testFn, b) {
                        filterField.valueMatcher = {
                            test: function (a) {
                                if (Ext.isString(a)) {
                                    a = a.toLowerCase();
                                    b = String(b).toLowerCase();
                                } else if (Ext.isBoolean(a)) {
                                    b = String(b).toLowerCase();
                                    if (b == 'true') {
                                        b = true;
                                    } else if (b == 'false') {
                                        b = false;
                                    }
                                }
                                return testFn(a, b);
                            }
                        };
                        return filterField.fn.call(filterField.scope || window, record);
                    };
                } else {
                    rv = expressionTree;
                }
            }
            return rv;
        }, 'eq': function (a, b) {
            if (Ext.isFunction(a)) {
                return a(arguments.callee, b);
            } else {
                return a == b;
            }
        }, 'leq': function (a, b) {
            if (Ext.isFunction(a)) {
                return a(arguments.callee, b);
            } else {
                return Number(a) <= Number(b);
            }
        }, 'geq': function (a, b) {
            if (Ext.isFunction(a)) {
                return a(arguments.callee, b);
            } else {
                return Number(a) >= Number(b);
            }
        }, 'neq': function (a, b) {
            if (Ext.isFunction(a)) {
                return a(arguments.callee, b);
            } else {
                return a != b;
            }
        }, 'contains': function (a, b) {
            if (Ext.isFunction(a)) {
                return a(arguments.callee, b);
            } else {
                return a.indexOf(b) >= 0;
            }
        }, 'and': function () {
            var result = arguments[0];
            if (result) {
                for (var i = 1; i < arguments.length; i++) {
                    result = result && arguments[i];
                    if (!result) {
                        break;
                    }
                }
            }
            return result;
        }, 'or': function () {
            var result = arguments[0];
            if (!result) {
                for (var i = 1; i < arguments.length; i++) {
                    result = result || arguments[i];
                    if (result) {
                        break;
                    }
                }
            }
            return result;
        }
    };
}();
Ext.ns('Pan.base.ajax');
Ext.apply(Pan.base.ajax, {
    allSources: null, lastMatched: [], javascriptsLoadedViaConsole: {}, loadJavascript: function (path, callback) {
        Pan.base.ajax.removeJavascriptSource(path);
        var script = document.createElement('script');
        script.setAttribute("type", "text/javascript");
        script.setAttribute("src", path);
        if (!callback && console && console.log) {
            callback = function () {
                console.log(path + " loaded");
            };
        }
        if (callback) {
            script.onload = callback;
            script.onreadystatechange = function () {
                if (this.readyState == 'complete') {
                    callback();
                }
            };
        }
        document.getElementsByTagName('head')[0].appendChild(script);
    }, removeJavascriptSource: function (toberemoved) {
        var scripts = document.getElementsByTagName('script');
        Ext.each(scripts, function (script) {
            var src = script.getAttribute('src');
            if (src && src.indexOf(toberemoved) != -1) {
                script.parentNode.removeChild(script);
                return false;
            }
            return true;
        });
    }, getAllJavascriptSources: function () {
        var scripts = document.getElementsByTagName('script');
        Pan.base.ajax.allSources = {};
        Ext.each(scripts, function (script) {
            var src = script.getAttribute('src');
            if (src) {
                src = src.replace(/\?.*/, '');
                var basename = src.replace(/.*\//, '');
                Pan.base.ajax.allSources[src] = basename;
            }
        });
    }, loadJavascriptLastMatched: function (index, callback) {
        if (index < Pan.base.ajax.lastMatched.length) {
            Pan.base.ajax.loadJavascript(Pan.base.ajax.lastMatched[index], callback);
            return [Pan.base.ajax.lastMatched[index]];
        }
        return null;
    }, loadJavascriptRegex: function (pattern, loadAllMatched) {
        var regex, stringInput = false;
        if (pattern instanceof RegExp) {
            regex = pattern;
            pattern = regex.toString();
        } else if (Ext.isString(pattern)) {
            stringInput = true;
            regex = new RegExp(pattern);
        } else {
            console.log("Invalid input " + pattern);
            return null;
        }
        if (!Pan.base.ajax.allSources) {
            Pan.base.ajax.getAllJavascriptSources();
        }
        var bestMatched = [];
        var allMatched = [];
        for (var fullpath in Pan.base.ajax.allSources) {
            if (Pan.base.ajax.allSources.hasOwnProperty(fullpath)) {
                var basename = Pan.base.ajax.allSources[fullpath];
                if (basename.match(regex)) {
                    bestMatched.push(fullpath);
                }
                if (fullpath.match(regex)) {
                    allMatched.push(fullpath);
                }
            }
        }
        if (loadAllMatched && allMatched.length > 0) {
            Ext.each(allMatched, function (src, idx) {
                Pan.base.ajax.loadJavascript(src);
            });
            return allMatched;
        } else {
            var matched = null;
            if (bestMatched.length == 1) {
                matched = bestMatched[0];
            } else if (allMatched.length == 1) {
                matched = allMatched[0];
            } else if (allMatched.length > 1) {
                console.log("More than one files matched the pattern");
                Pan.base.ajax.lastMatched = [];
                Ext.each(allMatched, function (src, idx) {
                    Pan.base.ajax.lastMatched.push(src);
                    console.log(idx, src);
                });
            } else {
                if (stringInput) {
                    regex = new RegExp(pattern, "i");
                    Pan.base.ajax.loadJavascriptRegex(regex);
                } else {
                    console.log("No filename matching the pattern");
                }
            }
            if (matched) {
                Pan.base.ajax.loadJavascript(matched);
                return [matched];
            }
            return null;
        }
    }, changeLoc: function (loc, callback) {
        if (this.loc === loc) {
            if (callback) {
                callback();
            }
            return;
        }
        this.loc = loc;
        Ext.Ajax.request({
            url: "/php/setLocAndDloc.php?loc=" + loc + "&dloc=" + Pan.global.getDevice(),
            scope: this,
            success: function (response) {
                var resp = Ext.decode(Ext.util.Format.trim(response.responseText));
                if (resp.success) {
                    Pan.global.setLoc(loc);
                    if (callback) callback();
                } else {
                    Pan.base.msg.alert(resp.errMsg ? resp.errMsg : resp);
                }
            },
            failure: function (response) {
                var log = PanLogging.getLogger('base:ajax');
                log.warn("Could not set the session location.");
            }
        });
    }, changeDevice: function (device, callback, page) {
        var dlocStr = "8:" + device;
        Ext.Ajax.request({
            url: "/esp/cms_changeDeviceContext.esp?device=" + dlocStr,
            scope: this,
            success: function (response) {
                var msg = Ext.util.Format.trim(response.responseText);
                var startToken = "@start@";
                var endToken = "@end@";
                var startIdx = msg.indexOf(startToken);
                if (startIdx >= 0) {
                    var endIdx = msg.indexOf(endToken);
                    var deviceChangeMsg = msg.substring(startIdx + startToken.length, endIdx);
                    if (deviceChangeMsg == "Success" || deviceChangeMsg == "success") {
                        Pan.global.setDevice(device);
                        Ext.Ajax.request({
                            url: "/esp/showSessionVars.esp", success: function (response) {
                                if (callback) callback(device, page);
                            }, failure: function (response) {
                                Pan.base.msg.alert("Could not call showSessionVars.esp");
                            }
                        });
                    } else {
                        Pan.base.msg.alert(deviceChangeMsg);
                    }
                } else {
                    Pan.base.msg.alert("Could not find start token '@start@'");
                }
            },
            failure: function (response) {
                Pan.base.msg.alert("Could not set the session device");
            }
        });
    }, cmsGetAccessibleDevices: function (cmsComboObj) {
        Ext.Ajax.request({
            url: "/php/utils/CmsGetAccessibleDevices.php", scope: this, success: function (response) {
                var resp = Ext.decode(Ext.util.Format.trim(response.responseText));
                var data = [];
                var selectedDevice = 'panorama';
                for (var prop in resp) {
                    if (resp.hasOwnProperty(prop)) {
                        var name = resp[prop].name || prop;
                        var family = resp[prop]['family'] || '';
                        var connected = resp[prop]['connected'];
                        var tmpArray = [prop, name, family, connected];
                        if (resp[prop].currentlySelected)
                            selectedDevice = prop;
                        data.push(tmpArray);
                    }
                }
                if (Pan.global.isCmsRemoteSession() && selectedDevice == 'panorama') {
                    Pan.Msg.alert('Error', 'The current device may have been disconnected - switching to Panorama context');
                    Pan.base.ajax.changeDevice('panorama', Pan.global.redirectToProperWindowLocation, 'dashboard');
                } else {
                    cmsComboObj.store.loadData(data);
                    cmsComboObj.setValue(selectedDevice);
                    Pan.global.CONTEXT.accessibleDevices = resp;
                    Pan.global.setDevice(selectedDevice);
                }
            }, failure: function (response) {
            }
        });
    }
});
(function () {
    window.lj = function (arg) {
        if (arguments.length == 0) {
            for (arg in Pan.base.ajax.javascriptsLoadedViaConsole) {
                if (Pan.base.ajax.javascriptsLoadedViaConsole.hasOwnProperty(arg)) {
                    Pan.base.ajax.loadJavascript(arg);
                }
            }
        } else {
            var files;
            if (Ext.isNumber(arg)) {
                files = Pan.base.ajax.loadJavascriptLastMatched(arg);
            } else {
                files = Pan.base.ajax.loadJavascriptRegex.apply(null, arguments);
            }
            if (files) {
                Ext.each(files, function (file) {
                    Pan.base.ajax.javascriptsLoadedViaConsole[file] = true;
                });
            }
        }
    };
})();
Ext.ns('Pan.base.preference');
Ext.apply(Pan.base.preference, {
    get: function (key, defaultValue) {
        var val = Pan.base.preference.__cache[key];
        return val === undefined ? defaultValue : val;
    }, set: function (key, value) {
        Pan.base.preference.__cache[key] = value;
        PanDirect.run('PanDirect.setPreference', [key, value]);
    }
});
umd(function (define) {
    define(function (require) {
        var Ext = require('Ext');

        function mapInternal(value, config, source) {
            var shouldExclude = Ext.isFunction(config.exclude) ? config.exclude(value) : config.exclude;
            if (!shouldExclude) {
                var result = {};
                var exclusive, propertyName, shouldExcludeProperty, propertyValue;
                if (Ext.isDefined(config.base)) {
                    result = Ext.isObject(config.base) ? Ext.apply({}, config.base) : config.base;
                }
                if (Ext.isFunction(config)) {
                    result = config(value);
                } else if (Ext.isFunction(config.map)) {
                    result = config.map(value, source, result);
                }
                else if (Ext.isObject(config.map)) {
                    for (var specName in config.map) {
                        if (!config.map.hasOwnProperty(specName)) continue;
                        fillValue(result, value, specName, config);
                    }
                    exclusive = config.mode === objectMapper.modes.exclusive;
                    if (!exclusive) {
                        for (propertyName in value) {
                            if (!value.hasOwnProperty(propertyName) || config.map.hasOwnProperty(propertyName)) continue;
                            propertyValue = value[propertyName];
                            shouldExcludeProperty = Ext.isFunction(config.defaultExclude) ? config.defaultExclude(propertyValue) : config.defaultExclude;
                            if (!shouldExcludeProperty) {
                                if (Ext.isFunction(config.defaultMap)) {
                                    propertyValue = config.defaultMap(propertyValue);
                                }
                                result[propertyName] = propertyValue;
                            }
                        }
                    }
                }
                else if (Ext.isObject(value)) {
                    exclusive = config.mode === objectMapper.modes.exclusive;
                    if (!exclusive) {
                        for (propertyName in value) {
                            if (!value.hasOwnProperty(propertyName)) continue;
                            propertyValue = value[propertyName];
                            shouldExcludeProperty = Ext.isFunction(config.defaultExclude) ? config.defaultExclude(propertyValue) : config.defaultExclude;
                            if (!shouldExcludeProperty) {
                                if (Ext.isFunction(config.defaultMap)) {
                                    propertyValue = config.defaultMap(propertyValue);
                                }
                                result[propertyName] = propertyValue;
                            }
                        }
                    }
                }
                else {
                    result = value;
                }
                return result;
            }
        }

        function fillValue(result, source, specName, config) {
            var value = source[specName];
            var spec = config.map[specName] || {path: specName};
            var shouldExclude = false;
            if (Ext.isFunction(spec.exclude)) {
                shouldExclude = spec.exclude(value);
            }
            else if (Ext.isDefined(spec.exclude)) {
                shouldExclude = spec.exclude;
            }
            else if (Ext.isFunction(config.defaultExclude)) {
                shouldExclude = config.defaultExclude(value);
            }
            else if (Ext.isDefined(config.defaultExclude)) {
                shouldExclude = config.defaultExclude;
            }
            if (!shouldExclude) {
                var path = typeof spec === "string" ? spec : spec.path || specName;
                var mapFunction = spec.map || config.defaultMap;
                if (Ext.isDefined(config.base)) {
                    result = Ext.isObject(config.base) ? Ext.apply({}, config.base) : config.base;
                }
                if (Ext.isFunction(spec)) {
                    value = spec(value, source, result);
                } else if (!Ext.isObject(spec)) {
                    value = spec;
                }
                else if (Ext.isDefined(spec.base)) {
                    value = Ext.isObject(spec.base) ? Ext.apply({}, spec.base) : spec.base;
                }
                else if (Ext.isFunction(mapFunction)) {
                    value = mapFunction(value, source, result);
                }
                else if (Ext.isDefined(spec.map)) {
                    value = mapInternal(value, spec, source);
                }
                objectMapper.setValue(result, path, value);
            }
        }

        var objectMapper = {
            predefined: {
                exclude: {
                    isEmpty: function (value) {
                        return Ext.isEmpty(value);
                    }
                }, map: {
                    boolToYesNo: function (value) {
                        return value === "true" ? "yes" : "no";
                    }
                }
            }, map: function (source, config) {
                return mapInternal(source, config, source);
            }, modes: {exclusive: "exclusive", inclusive: "inclusive"}, setValue: function (target, expr, value) {
                expr = String(expr).replace(/['"]*[\]][\[]['"]*|['"]*[\]][.]*|[.]*[\[]['"]*/g, ".");
                expr = expr.replace(/^[.]*|[.]*$/g, "");
                var paths = expr.split(".");
                var site = target;
                while (paths.length > 1) {
                    var p = paths.shift();
                    site = site[p] = site[p] || {};
                }
                site[paths.shift()] = value;
            }
        };
        return objectMapper;
    });
}, "Pan.base.objectMapper", require, exports, module);
umd(function (define) {
    define(function (require) {
        var Ext = require('Ext');
        var direct = require('pan/direct');
        var base = require('pan/base');
        var CONTEXT = require('pan/global/CONTEXT');
        var mapping = require('pan/locale/mapping');
        var locale = {
            mapping: mapping, isPredefinedLocale: function (locale) {
                if (!locale) {
                    locale = mapping && mapping.locale;
                }
                if (['en', 'ja', 'es', 'fr', 'zh_CN', 'zh_TW'].indexOf(locale) >= 0) {
                    return locale;
                }
                return false;
            }, convertLocaleToDisplayString: function (val) {
                var map = {
                    'en': 'English',
                    'es': 'Español',
                    'fr': 'Français',
                    'ja': '日本語',
                    'zh_CN': '简体中文',
                    'zh_TW': '繁體中文'
                };
                return map[val] || val;
            }, changeLocale: function () {
                var w = new base.container.Window({
                    helpTopic: 'language',
                    title: _T('Language Preference'),
                    width: 430,
                    height: 170,
                    layout: 'fit',
                    items: {
                        xtype: 'pan-form',
                        cls: 'darkblue',
                        defaultType: 'pan-displayfield',
                        buttonAlign: 'left',
                        buttons: ['->', {
                            text: _T('OK'), xtype: 'pan-button', cls: 'default-btn', handler: function () {
                                var mask = new base.widgets.LoadMask(w.body, {});
                                mask.show();
                                var localeValue = w.items.items[0].form.items.items[1].getValue();
                                direct.run('PanDirect.uiLocaleChange', [localeValue], function (result) {
                                    if (base.isJsonSuccessResponse(result)) {
                                        var location = window.location.href;
                                        var cleanedurl = location.match(/^[^#]+/);
                                        if (cleanedurl && cleanedurl[0]) {
                                            window.location.href = cleanedurl[0];
                                        }
                                        else {
                                            window.location.href = window.location.href;
                                        }
                                    }
                                    else {
                                        mask.hide();
                                        mask.destroy();
                                        base.msg.alert(base.extractJsonText(result) || _T('Unknown error'));
                                    }
                                });
                            }
                        }, {
                            text: _T('Cancel'), xtype: 'pan-button', handler: function () {
                                w.close();
                            }
                        }],
                        items: [{
                            style: 'padding: 5px;margin-bottom:4px;',
                            fieldLabel: '',
                            value: ''
                        }, {
                            fieldLabel: _T('Language'),
                            value: locale.convertLocaleToDisplayString(CONTEXT.locale),
                            xtype: 'pan-directselectbox',
                            anchor: '-10',
                            name: 'locale',
                            allowBlank: false,
                            displayField: 'help-string',
                            useHelpStringAsDisplay: true,
                            directFn: direct.runCallback('PanDirect.uiLocaleCompletion'),
                            jsonReader: new Ext.data.JsonReader({
                                root: 'completions',
                                fields: [{name: 'help-string', mapping: '@help-string', type: 'string'}, {
                                    name: 'value',
                                    mapping: '@value',
                                    type: 'string',
                                    convert: locale.convertLocaleToDisplayString
                                }]
                            })
                        }, {
                            style: 'padding: 5px;margin-bottom:4px;',
                            fieldLabel: '',
                            cls: 'x-form-helptext',
                            value: _T('Web interface will reload after updating language preference.')
                        }]
                    }
                });
                w.show();
            }
        };
        return locale;
    });
}, 'Pan.locale', require, exports, module);
(function () {
    var util = {
        getErrorMessageText: function (notSuccess) {
            if (!Ext.isObject(notSuccess) || !notSuccess.msg)
                return '';
            return Pan.base.json.paths(notSuccess, "$.msg.line.line").join('') || Pan.base.json.paths(notSuccess, "$.msg.line").join('') || Pan.base.json.paths(notSuccess, "$.msg.*").join('') || Pan.base.json.paths(notSuccess, "$.msg").join('');
        }
    };
    Ext.ns('Pan.common');
    Pan.common.util = util;
}());
Ext.ns('Pan.common');
Ext.apply(Pan.common, {
    switchTab: function (tabKey) {
        Pan.appframework.PanAppInterface.setPage(tabKey);
    }, getChangeLoc: function (changeLoc, accessibleList) {
        if (Ext.isDefined(changeLoc)) {
            var found = false;
            for (var i = 0; i < accessibleList.length; i++) {
                if (accessibleList[i][0] == changeLoc) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                changeLoc = undefined;
            }
        }
        return changeLoc;
    }, getDefaultLoc: function (tabKey) {
        var vState = Ext.state.Manager.get('vsys');
        var changeLoc = undefined;
        var accessibleList = [];
        var includeSharedGateway = tabKey == 'policies' || tabKey == 'objects';
        if (Pan.global.isCms()) {
            if ((tabKey == 'monitor' && ['superuser', 'superreader', 'deviceadmin', 'devicereader'].indexOf(Pan.global.CONTEXT.role) >= 0) || tabKey == 'acc' || tabKey == 'dashboard') {
                accessibleList = Pan.common.PanConfigStates.prototype.getVsysDataArray(true, false, false, true, false);
                if (vState) {
                    if (vState.vsysAllState) {
                        if (vState.vsysAllState === 'All') {
                            changeLoc = '';
                        } else {
                            changeLoc = vState.vsysAllState;
                        }
                    } else {
                        changeLoc = vState.vsysState;
                    }
                } else {
                    changeLoc = '';
                }
            } else if (tabKey == 'device') {
                accessibleList = Pan.common.PanConfigStates.prototype.getVsysDataArray(false, false, false, true, true);
            } else {
                var includeShared = (tabKey == 'policies');
                if (vState) {
                    if (includeShared && vState.vsysSharedState) {
                        changeLoc = vState.vsysSharedState;
                    } else if (vState.vsysState) {
                        changeLoc = vState.vsysState;
                    }
                }
                accessibleList = Pan.common.PanConfigStates.prototype.getVsysDataArray(false, false, false, true, includeShared);
            }
        } else if (!Pan.global.isMultiVsys()) {
            if (tabKey == 'monitor' || tabKey == 'acc') {
                changeLoc = '';
            } else if (tabKey == 'dashboard' || tabKey == 'network' || tabKey == 'device') {
                accessibleList = Pan.common.PanConfigStates.prototype.getVsysDataArray(false, true, false, false, false);
            } else {
                accessibleList = Pan.common.PanConfigStates.prototype.getVsysDataArray(false, true, true, false, false);
            }
        } else if (tabKey == 'dashboard' || tabKey == 'network' || tabKey == 'device') {
            accessibleList = Pan.common.PanConfigStates.prototype.getVsysDataArray(false, true, false, false, true);
        } else {
            var canBeAll = (tabKey == 'monitor' && ['superuser', 'superreader', 'deviceadmin', 'devicereader'].indexOf(Pan.global.CONTEXT.role) >= 0) || tabKey == 'acc';
            if (vState) {
                if (tabKey == 'monitor' || tabKey == 'acc') {
                    accessibleList = Pan.common.PanConfigStates.prototype.getVsysDataArray(canBeAll, true, includeSharedGateway, false, false);
                    if (vState.vsysAllState) {
                        if (vState.vsysAllState === 'All') {
                            if (canBeAll) {
                                changeLoc = '';
                            } else if (vState.vsysState) {
                                changeLoc = vState.vsysState;
                            }
                        } else {
                            changeLoc = vState.vsysAllState;
                        }
                    }
                } else {
                    accessibleList = Pan.common.PanConfigStates.prototype.getVsysDataArray(false, true, includeSharedGateway, false, false);
                    if (vState.vsysState) {
                        changeLoc = vState.vsysState;
                    }
                }
            } else if (canBeAll) {
                changeLoc = '';
            } else {
                accessibleList = Pan.common.PanConfigStates.prototype.getVsysDataArray(false, true, includeSharedGateway, false, false);
            }
        }
        if (!Ext.isEmpty(accessibleList)) {
            changeLoc = this.getChangeLoc(changeLoc, accessibleList);
            if (!Ext.isDefined(changeLoc)) {
                changeLoc = accessibleList[0][0];
            }
        }
        return changeLoc;
    }, changeLocation: function (changeLoc) {
        if (changeLoc === undefined) {
            changeLoc = Pan.common.getDefaultLoc(Pan.appframework.PanAppInterface.getPage());
        }
        if (changeLoc !== undefined) {
            Pan.global.setLoc(changeLoc);
            Pan.base.ajax.changeLoc(changeLoc, function () {
                Pan.global.ContextVariables.retrieve();
            });
            return changeLoc;
        }
    }, changeTemplate: function (template) {
        Pan.global.setTemplate(template);
    }, dotHiddenFormExport: function (url, items) {
        var formPannel = {
            xtype: 'pan-form',
            method: 'POST',
            url: url,
            itemId: 'fileExportForm',
            cls: 'darkblue',
            bodyStyle: 'padding: 10px;',
            autoHeight: true,
            standardSubmit: true,
            defaults: {anchor: '100%'},
            labelWidth: 110,
            items: items,
            buttons: [{
                text: _T('Cancel'), handler: function () {
                    var fp = this.ownerCt.ownerCt.ownerCt.findByItemId('fileExportForm');
                    fp.ownerCt.close();
                }
            }]
        };
        var win = new Pan.base.container.Window({
            layout: 'form',
            width: 420,
            autoHeight: true,
            title: _T("Export"),
            border: false,
            modal: true,
            items: [formPannel]
        });
        win.show();
        var fp = win.findByItemId('fileExportForm');
        fp.getForm().submit();
        fp.ownerCt.close();
    }, domainNameRenderer: function (value, cfg, record, row, col, store) {
        var user = value;
        if (Ext.isEmpty(value)) {
            user = _T('none');
        } else if (!Pan.base.isEmpty(store.domainMapping)) {
            var input = value.toLowerCase();
            var dc = '';
            input.replace(/dc=.*/, function (a) {
                dc = a;
                return '';
            });
            if (!Ext.isEmpty(dc)) {
                var mapping = store.domainMapping[dc];
                if (mapping) {
                    input = value.toLowerCase();
                    var cn = '';
                    var test = input.match(/cn=(.*?)\,( )*(cn|o|ou|l|st|dc|dn|c)=/i);
                    if (Ext.isArray(test) && test.length >= 1) {
                        cn = test[1];
                    } else {
                        input.replace(/cn=[^,]*/, function (a) {
                            if (a && !cn) {
                                cn = a.replace('cn=', '');
                            }
                            return '';
                        });
                    }
                    if (!cn) {
                        cn = input.replace(/([^=]*=)/, "").replace(/,.*/, "");
                    }
                    if (cn) {
                        user = mapping.netbios + '\\' + cn.replace("\\", "");
                    }
                }
            }
        }
        return String.format('<em class="x-hyperlink">{0}</em>', user);
    }, resolveFQDN: function (fqdn, callerTreeNode, resolverLoc, fqdnObj) {
        var title = _T("FQDN");
        PanDirect.run("NetworkDirect.resolveFQDN", [{
            value: fqdn,
            from: callerTreeNode,
            resolverLoc: resolverLoc,
            addressObj: fqdnObj
        }], function (resp) {
            if (Pan.base.json.path(resp, '$.@status') == 'success') {
                var data = [];
                if (!_.isEmpty(resp.result)) {
                    data = resp.result;
                    if (Ext.isObject(resp.result.value)) {
                        data = [];
                        data.push(resp.result.value);
                    }
                }
                if (!_.isArray(data)) {
                    data = [];
                    data.push({text: _T("There is no value for the selected item")});
                }
                var store = new Pan.base.autorender.GridRecordStore({
                    fields: [{name: 'text'}],
                    localStore: true,
                    data: data
                });
                var listHeight = (data.length <= 8 ? data.length : 8) * 22 + 30;
                var formPanel = {
                    xtype: 'pan-form',
                    cls: 'darkblue',
                    autoHeight: true,
                    bodyStyle: 'padding:5px',
                    defaults: {anchor: '100%'},
                    items: [{
                        xtype: 'pan-list',
                        height: listHeight,
                        cls: "lightgrey",
                        store: store,
                        deferEmptyText: false,
                        columns: [{dataIndex: 'text', header: _T("IP")}]
                    }],
                    buttons: [{
                        text: _T('Cancel'), handler: function () {
                            this.findParentByType('pan-window').close();
                        }
                    }]
                };
                var showWindow = new Pan.base.container.Window({
                    width: 400,
                    title: title + ' - ' + fqdn,
                    layout: 'form',
                    autoHeight: true,
                    closeAction: 'hide',
                    border: false,
                    modal: true,
                    layoutConfig: {animate: true},
                    items: [formPanel]
                });
                showWindow.show();
            } else {
                var errMsg = Pan.base.json.path(resp, '$.msg.*');
                if (errMsg) {
                    Pan.Msg.alert(_T('Error'), errMsg);
                }
            }
        });
    }
});
Pan.common.Constants = Ext.applyIf({
    defaultLogForwardingProfileName: 'default',
    defaultSecurityProfileGroupName: 'default',
    noOf1KBytes: 1000,
    singletonId: 'singleton',
    portalDDGroup: 'Portal',
    templatePath: '$.config.devices.entry.template.entry',
    dgPath: '$.config.devices.entry.device-group.entry',
    templateRecordSuffix: '---template',
    srcTemplate: 'tpl',
    attrSrc: '@src',
    attrOverrides: '@overrides',
    attrLoc: '@loc',
    attrPtpl: "@ptpl",
    setupPageListTitleColumnWidth: 0.6,
    setupPageListTitleColumnWidth2: 0.5,
    predefinedThreatTypes: ['vulnerability', 'spyware'],
    predefinedThreatPage: 500,
    PAN_TEST_A_SITE_LANDING_PAGE: 'https://urlfiltering.paloaltonetworks.com',
    BC_TEST_A_SITE_LANDING_PAGE: 'http://www.brightcloud.com/support/lookup.php?dfa51120',
    PAN_CATEGORY_DESCRIPTIONS: 'http://urlfiltering.paloaltonetworks.com/CategoryList.aspx',
    DEFAULT_IDLE_TIMEOUT: 60,
    DEFAULT_PANORAMA_TCP_RECEIVE_TIMEOUT: 240,
    DEFAULT_PANORAMA_TCP_SEND_TIMEOUT: 240,
    DEFAULT_PANORAMA_SSL_SEND_RETRIES: 25,
    DEFAULT_MAX_ROWS_IN_CSV_EXPORT: 65536,
    DEFAULT_MAX_VERSION_CONFIG_AUDIT: 100,
    DEFAULT_MAX_ROWS_IN_PDF_REPORT: 5000,
    CMS_TRAFFIC_DB_PCT: 25.0,
    CMS_THREAT_DB_PCT: 25.0,
    CMS_SYSTEM_DB_PCT: 8.0,
    CMS_CONFIG_DB_PCT: 8.0,
    CMS_APPSTAT_DB_PCT: 10.0,
    CMS_TRSUM_DB_PCT: 5.0,
    CMS_HOURLYTRSUM_DB_PCT: 1.0,
    CMS_DAILYTRSUM_DB_PCT: 1.0,
    CMS_WEEKLYTRSUM_DB_PCT: 1.0,
    CMS_THSUM_DB_PCT: 5.0,
    CMS_HOURLYTHSUM_DB_PCT: 1.0,
    CMS_DAILYTHSUM_DB_PCT: 1.0,
    CMS_WEEKLYTHSUM_DB_PCT: 1.0,
    CMS_ALARM_DB_PCT: 3.0,
    CMS_HIPMATCH_DB_PCT: 3.0,
    CMS_APPLICATION_PCAPS_PCT: 0.0,
    CMS_THREAT_PCAPS_PCT: 0.0,
    CMS_DEBUG_FILTER_PCAPS_PCT: 0.0,
    CMS_DLP_LOGS_PCT: 0.0,
    CMS_HIP_REPORTS_PCT: 0.0,
    CMS_USERID_PCT: 0.0,
    F200_TRAFFIC_DB_PCT: 32.0,
    F200_THREAT_DB_PCT: 16.0,
    F200_SYSTEM_DB_PCT: 4.0,
    F200_CONFIG_DB_PCT: 4.0,
    F200_APPSTAT_DB_PCT: 6.0,
    F200_TRSUM_DB_PCT: 7.0,
    F200_HOURLYTRSUM_DB_PCT: 1.5,
    F200_DAILYTRSUM_DB_PCT: 1.5,
    F200_WEEKLYTRSUM_DB_PCT: 1.5,
    F200_THSUM_DB_PCT: 2.0,
    F200_HOURLYTHSUM_DB_PCT: 1.5,
    F200_DAILYTHSUM_DB_PCT: 1.5,
    F200_WEEKLYTHSUM_DB_PCT: 1.5,
    F200_ALARM_DB_PCT: 3.0,
    F200_HIPMATCH_DB_PCT: 3.0,
    F200_APPLICATION_PCAPS_PCT: 1.5,
    F200_THREAT_PCAPS_PCT: 1.5,
    F200_DEBUG_FILTER_PCAPS_PCT: 1.5,
    F200_DLP_LOGS_PCT: 1.5,
    F200_HIP_REPORTS_PCT: 1.5,
    F200_USERID_PCT: 1.5,
    TRAFFIC_DB_PCT: 32.0,
    THREAT_DB_PCT: 16.0,
    SYSTEM_DB_PCT: 4.0,
    CONFIG_DB_PCT: 4.0,
    APPSTAT_DB_PCT: 12.0,
    TRSUM_DB_PCT: 7.0,
    HOURLYTRSUM_DB_PCT: 3.0,
    DAILYTRSUM_DB_PCT: 1.0,
    WEEKLYTRSUM_DB_PCT: 1.0,
    THSUM_DB_PCT: 2.0,
    HOURLYTHSUM_DB_PCT: 1.0,
    DAILYTHSUM_DB_PCT: 1.0,
    WEEKLYTHSUM_DB_PCT: 1.0,
    ALARM_DB_PCT: 3.0,
    HIPMATCH_DB_PCT: 3.0,
    APPLICATION_PCAPS_PCT: 1.0,
    THREAT_PCAPS_PCT: 1.0,
    DEBUG_FILTER_PCAPS_PCT: 1.0,
    DLP_LOGS_PCT: 1.0,
    HIP_REPORTS_PCT: 1.0,
    USERID_PCT: 1.0,
    NONE_DEVICE_GROUP: '~~~~~~~~~',
    NONE_COLLECTOR_GROUP: '~~~~~~~~~',
    NONE_CLUSTER: '~~~~~~~~~',
    SEVERITY_MAPPING: {"5": "critical", "4": "high", "3": "medium", "2": "low", "1": "informational"}
}, Pan.base.Constants);
Ext.apply(Pan.base.Constants, {transportErrorMsg: Pan.global.isCmsSelected() ? _T("Unable to connect to Panorama.") : _T("Unable to connect to the device.")});
Pan.common.Acronym = function (acronym) {
    var map = acronym.lookup;
    return {
        lookup: function (val, isCapitalizeFirstLetter, isFromSchema) {
            if (val) {
                if (isFromSchema) {
                    val = val.replace(/-/g, ' ').replace(/^[@]/g, '');
                }
                val = val.replace(/\b([a-zA-Z])(\w*)\b/g, function (s, firstLetter, rest) {
                    var converted = map[s.toLowerCase()];
                    if (converted) {
                        return converted;
                    }
                    if (isCapitalizeFirstLetter) {
                        return firstLetter.toUpperCase() + rest;
                    }
                    return s;
                });
            }
            return val;
        }
    };
}(Pan.common.PanAcronyms);
Pan.acronym = Pan.common.Acronym.lookup;
window._T = Pan.i18n;
window._TT = Pan.i18n;
window._TC = function (str, args, isCapitalizeFirstLetter, isFromSchema) {
    if (arguments.length === 1) {
        str = Pan.acronym(str, true, true);
    } else {
        str = Pan.acronym(str, isCapitalizeFirstLetter, isFromSchema);
    }
    return Pan.i18n(str, args);
};
window._C = function (str, isCapitalizeFirstLetter, isFromSchema) {
    if (arguments.length === 1) {
        return Pan.acronym(str, true, true);
    } else {
        return Pan.acronym(str, isCapitalizeFirstLetter, isFromSchema);
    }
};
Pan.common.AssociationHelpers = {
    associationOfDependentField: function (assocConfig) {
        return {
            listenToAfterInit: false, match: {evaluate: 'fieldEvt', event: assocConfig.event}, exec: {
                evaluate: function () {
                    if (this.__component.startValue) {
                        var store = this.__component.__pdefaults.__dataExtractor(assocConfig.dependentField, 'store');
                        if (!store) {
                            return;
                        }
                        if (store.data && store.data.length > 0 && this.__component.value != this.__component.startValue) {
                            Pan.Msg.confirm(_T("Confirm Change"), _T("Changing this selection will remove any data added for previous selection. Are you sure?"), function (btn) {
                                if (btn === "yes") {
                                    store.removeAll();
                                }
                                else {
                                    this.__component.setValue(this.__component.startValue);
                                    this.__component.value = this.__component.startValue;
                                }
                            }, this);
                        }
                    }
                }
            }
        };
    }, availForCheckBoxListenField: function (listenToField, availHide) {
        return {
            availHide: availHide || false,
            match: {evaluate: 'fieldFn', operands: [{field: listenToField, fn: 'getValue'}]}
        };
    }, syncValue: function (listenToField) {
        return {
            listenToAfterInit: false, match: {field: listenToField}, exec: {
                evaluate: function () {
                    var newValue = this.__component.__pdefaults.__dataExtractor(listenToField);
                    var currentValue = this.__component.getValue();
                    if (newValue != currentValue) {
                        this.__component.setValue(newValue);
                    }
                }
            }
        };
    }
};
umd(function (define) {
    define(function () {
        function Exception(message, innerException) {
            if (!(this instanceof Exception)) return new Exception(message, innerException);
            Error.call(this);
            if (typeof Error.captureStackTrace === 'function') {
                Error.captureStackTrace(this, arguments.callee);
            }
            this.name = "Exception";
            this.message = message;
            this.innerException = innerException instanceof Error ? innerException : new Error(innerException);
        }

        Exception.prototype.__proto__ = Error.prototype;
        Exception.prototype.toString = function () {
            var message = this.name + ": " + this.message;
            if (this.innerException) {
                message += ', innerException: \n' + this.innerException.toString();
            }
            return message;
        };
        return Exception;
    });
}, "Pan.common.Exception", require, exports, module);