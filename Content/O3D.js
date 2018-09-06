// $begin{copyright}
//
// This file is part of WebSharper
//
// Copyright (c) 2008-2016 IntelliFactory
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You may
// obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.
//
// $end{copyright}

IntelliFactory = {
    Runtime: {
        Ctor: function (ctor, typeFunction) {
            ctor.prototype = typeFunction.prototype;
            return ctor;
        },

        Class: function (members, base, statics) {
            var proto = members;
            if (base) {
                proto = new base();
                for (var m in members) { proto[m] = members[m] }
            }
            var typeFunction = function (copyFrom) {
                if (copyFrom) {
                    for (var f in copyFrom) { this[f] = copyFrom[f] }
                }
            }
            typeFunction.prototype = proto;
            if (statics) {
                for (var f in statics) { typeFunction[f] = statics[f] }
            }
            return typeFunction;
        },

        Clone: function (obj) {
            var res = {};
            for (var p in obj) { res[p] = obj[p] }
            return res;
        },

        NewObject:
            function (kv) {
                var o = {};
                for (var i = 0; i < kv.length; i++) {
                    o[kv[i][0]] = kv[i][1];
                }
                return o;
            },

        DeleteEmptyFields:
            function (obj, fields) {
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    if (obj[f] === void (0)) { delete obj[f]; }
                }
                return obj;
            },

        GetOptional:
            function (value) {
                return (value === void (0)) ? null : { $: 1, $0: value };
            },

        SetOptional:
            function (obj, field, value) {
                if (value) {
                    obj[field] = value.$0;
                } else {
                    delete obj[field];
                }
            },

        SetOrDelete:
            function (obj, field, value) {
                if (value === void (0)) {
                    delete obj[field];
                } else {
                    obj[field] = value;
                }
            },

        Apply: function (f, obj, args) {
            return f.apply(obj, args);
        },

        Bind: function (f, obj) {
            return function () { return f.apply(this, arguments) };
        },

        CreateFuncWithArgs: function (f) {
            return function () { return f(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithOnlyThis: function (f) {
            return function () { return f(this) };
        },

        CreateFuncWithThis: function (f) {
            return function () { return f(this).apply(null, arguments) };
        },

        CreateFuncWithThisArgs: function (f) {
            return function () { return f(this)(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithRest: function (length, f) {
            return function () { return f(Array.prototype.slice.call(arguments, 0, length).concat([Array.prototype.slice.call(arguments, length)])) };
        },

        CreateFuncWithArgsRest: function (length, f) {
            return function () { return f([Array.prototype.slice.call(arguments, 0, length), Array.prototype.slice.call(arguments, length)]) };
        },

        BindDelegate: function (func, obj) {
            var res = func.bind(obj);
            res.$Func = func;
            res.$Target = obj;
            return res;
        },

        CreateDelegate: function (invokes) {
            if (invokes.length == 0) return null;
            if (invokes.length == 1) return invokes[0];
            var del = function () {
                var res;
                for (var i = 0; i < invokes.length; i++) {
                    res = invokes[i].apply(null, arguments);
                }
                return res;
            };
            del.$Invokes = invokes;
            return del;
        },

        CombineDelegates: function (dels) {
            var invokes = [];
            for (var i = 0; i < dels.length; i++) {
                var del = dels[i];
                if (del) {
                    if ("$Invokes" in del)
                        invokes = invokes.concat(del.$Invokes);
                    else
                        invokes.push(del);
                }
            }
            return IntelliFactory.Runtime.CreateDelegate(invokes);
        },

        DelegateEqual: function (d1, d2) {
            if (d1 === d2) return true;
            if (d1 == null || d2 == null) return false;
            var i1 = d1.$Invokes || [d1];
            var i2 = d2.$Invokes || [d2];
            if (i1.length != i2.length) return false;
            for (var i = 0; i < i1.length; i++) {
                var e1 = i1[i];
                var e2 = i2[i];
                if (!(e1 === e2 || ("$Func" in e1 && "$Func" in e2 && e1.$Func === e2.$Func && e1.$Target == e2.$Target)))
                    return false;
            }
            return true;
        },

        ThisFunc: function (d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args);
            };
        },

        ThisFuncOut: function (f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args);
            };
        },

        ParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return d.apply(null, args.slice(0, length).concat([args.slice(length)]));
            };
        },

        ParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(null, args.slice(0, length).concat(args[length]));
            };
        },

        ThisParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args.slice(0, length + 1).concat([args.slice(length + 1)]));
            };
        },

        ThisParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args.slice(0, length).concat(args[length]));
            };
        },

        Curried: function (f, n, args) {
            args = args || [];
            return function (a) {
                var allArgs = args.concat([a === void (0) ? null : a]);
                if (n == 1)
                    return f.apply(null, allArgs);
                if (n == 2)
                    return function (a) { return f.apply(null, allArgs.concat([a === void (0) ? null : a])); }
                return IntelliFactory.Runtime.Curried(f, n - 1, allArgs);
            }
        },

        Curried2: function (f) {
            return function (a) { return function (b) { return f(a, b); } }
        },

        Curried3: function (f) {
            return function (a) { return function (b) { return function (c) { return f(a, b, c); } } }
        },

        UnionByType: function (types, value, optional) {
            var vt = typeof value;
            for (var i = 0; i < types.length; i++) {
                var t = types[i];
                if (typeof t == "number") {
                    if (Array.isArray(value) && (t == 0 || value.length == t)) {
                        return { $: i, $0: value };
                    }
                } else {
                    if (t == vt) {
                        return { $: i, $0: value };
                    }
                }
            }
            if (!optional) {
                throw new Error("Type not expected for creating Choice value.");
            }
        },

        ScriptBasePath: "./",

        ScriptPath: function (a, f) {
            return this.ScriptBasePath + (this.ScriptSkipAssemblyDir ? "" : a + "/") + f;
        },

        OnLoad:
            function (f) {
                if (!("load" in this)) {
                    this.load = [];
                }
                this.load.push(f);
            },

        Start:
            function () {
                function run(c) {
                    for (var i = 0; i < c.length; i++) {
                        c[i]();
                    }
                }
                if ("load" in this) {
                    run(this.load);
                    this.load = [];
                }
            },
    }
}

IntelliFactory.Runtime.OnLoad(function () {
    if (self.WebSharper && WebSharper.Activator && WebSharper.Activator.Activate)
        WebSharper.Activator.Activate()
});

// Polyfill

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

if (!Math.trunc) {
    Math.trunc = function (x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    }
}

if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function (obj, proto) {
    obj.__proto__ = proto;
    return obj;
  }
}

function ignore() { };
function id(x) { return x };
function fst(x) { return x[0] };
function snd(x) { return x[1] };
function trd(x) { return x[2] };

if (!console) {
    console = {
        count: ignore,
        dir: ignore,
        error: ignore,
        group: ignore,
        groupEnd: ignore,
        info: ignore,
        log: ignore,
        profile: ignore,
        profileEnd: ignore,
        time: ignore,
        timeEnd: ignore,
        trace: ignore,
        warn: ignore
    }
};
// o3d-webgl
var o3d=o3d||{};var goog=goog||{};goog.typedef=true;o3d.global=this;o3d.basePath='';if(!Object.prototype.__defineSetter__){Object.prototype.__defineSetter__=function(){}
Object.prototype.__defineGetter__=function(){}}
o3d.findBasePath_=function(){var doc=o3d.global.document;if(typeof doc=='undefined'){return;}
if(o3d.global.BASE_PATH){o3d.basePath=o3d.global.BASE_PATH;return;}else{o3d.global.BASE_PATH=null;}
var scripts=doc.getElementsByTagName('script');for(var script,i=0;script=scripts[i];i++){var src=script.src;var l=src.length;var s='o3d-webgl/base.js';var sl=s.length;if(src.substr(l-sl)==s){o3d.basePath=src.substr(0,l-sl)+'o3d-webgl/';return;}}};o3d.writeScriptTag_=function(src){var doc=o3d.global.document;if(typeof doc!='undefined'){doc.write('<script type="text/javascript" src="'+
src+'"></'+'script>');}};o3d.filterTypeName_=function(type_name){if(type_name.length>=4&&type_name.substr(0,4)=='o3d.'){type_name=type_name.substr(4);}
return type_name;};o3d.include=function(rule){var parts=rule.split('.');var path=parts[parts.length-1]+'.js';o3d.writeScriptTag_(o3d.basePath+path);};o3d.inherit=function(subClassName,superClassName){var superClass=o3d.global.o3d[superClassName];var subClass=o3d.global.o3d[subClassName];if(!superClass)
throw('Invalid superclass: '+superClassName);if(!subClass)
throw('Invalid subclass: '+subClassName);subClass.prototype=new superClass;subClass.prototype.superClassName=superClassName;subClass.prototype.superClass=superClass;subClass.prototype.className=subClassName;};o3d.removeFromArray=function(array,object){var i=array.indexOf(object);if(i>=0){array.splice(i,1);}};o3d.isArray_=function(value){var valueAsObject=(value);return typeof(value)==='object'&&value!==null&&'length'in valueAsObject&&'splice'in valueAsObject;};o3d.clone=function(object){var result=o3d.isArray_(object)?[]:{};for(var name in object){var property=object[name];if(typeof property=='Object'){result[name]=o3d.clone(property);}else{result[name]=property;}}
return result;};o3d.notImplemented=function(){debugger;throw'Not implemented.';};o3d.findBasePath_();o3d.ObjectBase=function(){};o3d.ObjectBase.prototype.className='o3d.ObjectBase';o3d.ObjectBase.prototype.superClass=null;o3d.ObjectBase.prototype.isAClassName=function(class_type_name){class_type_name=o3d.filterTypeName_(class_type_name);var object=this;while(object!=undefined){if(object.className==class_type_name){return true;}
object=object.superClass&&object.superClass.prototype;}
return false;};o3d.NamedObjectBase=function(){o3d.ObjectBase.call(this);};o3d.inherit('NamedObjectBase','ObjectBase');o3d.NamedObjectBase.prototype.name="";o3d.NamedObject=function(){o3d.NamedObjectBase.call(this);};o3d.inherit('NamedObject','NamedObjectBase');o3d.NamedObject.prototype.name='';o3d.ParamObject=function(){o3d.NamedObject.call(this);this.params_={};};o3d.inherit('ParamObject','NamedObject');o3d.ParamObject.prototype.__defineGetter__('params',function(){var paramList=[];for(name in this.params_){paramList.push(this.params_[name]);}
return paramList;});o3d.ParamObject.prototype.__defineSetter__('params',function(){});o3d.ParamObject.O3D_PREFIX_='o3d.';o3d.ParamObject.prototype.createParam=function(param_name,param_type_name){if(this.params_[param_name])
return null;param_type_name=o3d.filterTypeName_(param_type_name);if(!o3d.global.o3d[param_type_name])
throw('Invalid param type name: '+param_type_name);var param=new o3d.global.o3d[param_type_name];param.gl=this.gl;param.owner_=this;param.name=param_name;this.params_[param_name]=param;return this.filterResult_(this.params_[param_name]);};o3d.ParamObject.prototype.getParam=function(param_name){var result=this.params_[param_name];var o3d_name;if(!result){o3d_name=o3d.ParamObject.O3D_PREFIX_+param_name;result=this.params_[o3d_name];}
if(!result){var lazyParamMap=this.lazyParamMap_;if(lazyParamMap){var name=param_name;var param_type=this.lazyParamMap_[name];if(!param_type){name=o3d_name;param_type=this.lazyParamMap_[name];}
if(param_type){result=this.createParam(name,param_type);}}}
return this.filterResult_(result);};o3d.ParamObject.prototype.removeParam=function(param){for(var i in this.params_){if(this.params_[i]==param){delete this.params_[i];}}};o3d.ParamObject.prototype.params_={};o3d.ParamObject.prototype.copyParams=function(source_param_object){for(name in source_param_object.params_){var param=source_param_object.params_[name];this.createParam(name,param.className);this.getParam(name).value=param.value;}};o3d.ParamObject.prototype.filterResult_=function(result){return(result?result:null);};o3d.ParamObject.setUpO3DParam_=function(constructor,fieldName,paramType){var o3dParamName=o3d.ParamObject.O3D_PREFIX_+fieldName;var lazyParamMap=constructor.prototype.lazyParamMap_;if(!lazyParamMap){lazyParamMap={};constructor.prototype.lazyParamMap_=lazyParamMap;}
lazyParamMap[o3dParamName]=paramType;constructor.prototype.__defineGetter__(fieldName,function(){var param=this.getParam(o3dParamName);return param.value;});constructor.prototype.__defineSetter__(fieldName,function(v){var param=this.getParam(o3dParamName);param.value=v;});};o3d.ParamArray=function(){o3d.NamedObject.call(this);this.params_=[];};o3d.inherit('ParamArray','NamedObject');o3d.ParamArray.prototype.createParam=function(index,param_type_name){param_type_name=o3d.filterTypeName_(param_type_name);if(!o3d.global.o3d[param_type_name])
throw('Invalid param type name: '+param_type_name);if(index>=this.params_.length){this.resize(index+1,param_type_name);}else{var param=new o3d.global.o3d[param_type_name];param.gl=this.gl;param.owner_=this;this.params_[index]=param;}
return this.filterResult_(this.params_[index]);};o3d.ParamArray.prototype.getParam=function(index){var result=this.params_[index];return this.filterResult_(result);};o3d.ParamArray.prototype.removeParams=function(start_index,num_to_remove){var paramsNew=[];var j=0;for(var i=0;i<this.params_.length;i++){if(i>=start_index&&i<start_index+num_to_remove){}else{paramsNew[j]=this.params_[i];j++;}}
this.params_=paramsNew;};o3d.ParamArray.prototype.resize=function(num_params,param_type_name){param_type_name=o3d.filterTypeName_(param_type_name);if(!o3d.global.o3d[param_type_name])
throw('Invalid param type name: '+param_type_name);for(var i=this.params_.length;i<num_params;i++){var param=new o3d.global.o3d[param_type_name];param.gl=this.gl;param.owner_=this;this.params_[i]=param;}};o3d.ParamArray.prototype.params_=[];o3d.ParamArray.prototype.__defineGetter__('params',function(){var params=[];for(var i=0;i<this.length;i++){params[i]=this.params_[i];}
return params;});o3d.ParamArray.prototype.__defineGetter__('length',function(){return this.params_.length;});o3d.ParamArray.prototype.filterResult_=function(result){return(result?result:null);};o3d.Param=function(param_type_name){o3d.Param.prototype.output_connections=[];this.outputConnections=[];}
o3d.inherit('Param','NamedObject');o3d.Param.prototype.update_input=true;o3d.Param.prototype.inputConnection=null;o3d.Param.prototype.outputConnections=[];o3d.Param.prototype.owner_=null;o3d.Param.prototype.value_=null;o3d.Param.prototype.__defineSetter__('value',function(v){if(this.inputConnection){throw('Tried to set bound parameter.');}else{if(this.value_!=undefined&&(typeof this.value_!=typeof v||(this.value_.length_!==undefined&&(this.value_.length_!=v.length)))){this.gl.client.error_callback('Param type error.');}
this.value_=v;}});o3d.Param.prototype.__defineGetter__('value',function(){if(this.inputConnection){return this.inputConnection.value;}else{return this.value_;}});o3d.Param.prototype.bind=function(source_param){source_param.outputConnections.push(this);this.inputConnection=source_param;};o3d.Param.prototype.unbindInput=function(){o3d.notImplemented();};o3d.Param.prototype.unbindOutput=function(destination_param){o3d.notImplemented();};o3d.Param.prototype.unbindOutputs=function(){o3d.notImplemented();};o3d.Param.prototype.read_only_=false;o3d.ParamBoolean=function(){o3d.Param.call(this);this.value=false;};o3d.inherit('ParamBoolean','Param');o3d.ParamBoundingBox=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamBoundingBox','Param');o3d.ParamBoundingBox.prototype.__defineSetter__('value',function(v){if(this.inputConnection){throw('Tried to set bound parameter.');}else{if(!v){v=new o3d.BoundingBox();}else if(v.length!==undefined){if(v.length==0){v=new o3d.BoundingBox();}else if(v.length==2){for(var ii=0;ii<2;++ii){if(v[ii].length!=3){throw('Expected sub-array of length 3 at index '+ii+', got '+v[ii].length);}}
v=new o3d.BoundingBox(v[0],v[1]);}else{throw'Expected array of length 2';}}
this.value_=v;}});o3d.ParamBoundingBox.prototype.__defineGetter__('value',function(){if(this.inputConnection){return this.inputConnection.value;}else{return this.value_;}});o3d.ParamDrawContext=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamDrawContext','Param');o3d.ParamDrawList=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamDrawList','Param');o3d.ParamEffect=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamEffect','Param');o3d.ParamFloat=function(){o3d.Param.call(this);this.value=0.0;};o3d.inherit('ParamFloat','Param');o3d.ParamFloat2=function(){o3d.Param.call(this);this.value=[0.0,0.0];};o3d.inherit('ParamFloat2','Param');o3d.ParamFloat3=function(){o3d.Param.call(this);this.value=[0.0,0.0,0.0];};o3d.inherit('ParamFloat3','Param');o3d.ParamFloat4=function(){o3d.Param.call(this);this.value=[0.0,0.0,0.0,0.0];};o3d.inherit('ParamFloat4','Param');o3d.ParamFunction=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamFunction','Param');o3d.ParamInteger=function(){o3d.Param.call(this);this.value=0;};o3d.inherit('ParamInteger','Param');o3d.ParamMaterial=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamMaterial','Param');o3d.ParamMatrix4=function(){o3d.Param.call(this);this.value=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];};o3d.inherit('ParamMatrix4','Param');o3d.ParamParamArray=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamParamArray','Param');o3d.ParamParamArrayOutput=function(){o3d.ParamParamArray.call(this);};o3d.inherit('ParamParamArrayOutput','ParamParamArray');o3d.ParamParamArrayOutput.prototype.__defineGetter__("value",function(){this.owner_.updateOutputs(this);return this.value_;});o3d.ParamParamArrayOutput.prototype.__defineSetter__("value",function(value){this.value_=value;});o3d.ParamRenderSurface=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamRenderSurface','Param');o3d.ParamRenderDepthStencilSurface=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamRenderDepthStencilSurface','Param');o3d.ParamSampler=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamSampler','Param');o3d.ParamSkin=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamSkin','Param');o3d.ParamSteamBank=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamSteamBank','Param');o3d.ParamState=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamState','Param');o3d.ParamStreamBank=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamStreamBank','Param');o3d.ParamString=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamString','Param');o3d.ParamTexture=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamTexture','Param');o3d.ParamTransform=function(){o3d.Param.call(this);this.value=null;};o3d.inherit('ParamTransform','Param');o3d.ParamVertexBufferStream=function(){o3d.Param.call(this);this.stream=null;};o3d.inherit('ParamVertexBufferStream','Param');o3d.CompositionParamMatrix4=function(){o3d.ParamMatrix4.call(this);this.matrix_names_=[];};o3d.inherit('CompositionParamMatrix4','ParamMatrix4');o3d.CompositionParamMatrix4.prototype.matrix_names_=[];o3d.CompositionParamMatrix4.prototype.inverse_=false;o3d.CompositionParamMatrix4.prototype.transpose_=false;o3d.CompositionParamMatrix4.prototype.__defineGetter__('value',function(){var product=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];for(var i=0;i<this.matrix_names_.length;++i){o3d.Transform.compose(product,o3d.Param.SAS[this.matrix_names_[i]]);}
if(this.inverse_){o3d.Transform.inverse(product);}
if(this.transpose_){o3d.Transform.transpose(product);}
return product;});o3d.CompositionParamMatrix4.prototype.__defineSetter__('value',function(value){});o3d.ProjectionParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['projection'];};o3d.inherit('ProjectionParamMatrix4','CompositionParamMatrix4');o3d.ProjectionInverseParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['projection'];this.inverse_=true;};o3d.inherit('ProjectionInverseParamMatrix4','CompositionParamMatrix4');o3d.ProjectionTransposeParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['projection'];this.transpose_=true;};o3d.inherit('ProjectionTransposeParamMatrix4','CompositionParamMatrix4');o3d.ProjectionInverseTransposeParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['projection'];this.inverse_=true;this.transpose_=true;};o3d.inherit('ProjectionInverseTransposeParamMatrix4','CompositionParamMatrix4');o3d.ViewParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['view'];};o3d.inherit('ViewParamMatrix4','CompositionParamMatrix4');o3d.ViewInverseParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['view'];this.inverse_=true;};o3d.inherit('ViewInverseParamMatrix4','CompositionParamMatrix4');o3d.ViewTransposeParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['view'];this.transpose_=true;};o3d.inherit('ViewTransposeParamMatrix4','CompositionParamMatrix4');o3d.ViewInverseTransposeParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['view'];this.inverse_=true;this.transpose_=true;};o3d.inherit('ViewInverseTransposeParamMatrix4','CompositionParamMatrix4');o3d.ViewProjectionParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['viewProjection'];};o3d.inherit('ViewProjectionParamMatrix4','CompositionParamMatrix4');o3d.ViewProjectionInverseParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['viewProjection'];this.inverse_=true;};o3d.inherit('ViewProjectionInverseParamMatrix4','CompositionParamMatrix4');o3d.ViewProjectionTransposeParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['viewProjection'];this.transpose_=true;};o3d.inherit('ViewProjectionTransposeParamMatrix4','CompositionParamMatrix4');o3d.ViewProjectionInverseTransposeParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['viewProjection'];this.inverse_=true;this.transpose_=true;};o3d.inherit('ViewProjectionInverseTransposeParamMatrix4','CompositionParamMatrix4');o3d.WorldParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['world'];};o3d.inherit('WorldParamMatrix4','CompositionParamMatrix4');o3d.WorldInverseParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['world'];this.inverse_=true;};o3d.inherit('WorldInverseParamMatrix4','CompositionParamMatrix4');o3d.WorldTransposeParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['world'];this.transpose_=true;};o3d.inherit('WorldTransposeParamMatrix4','CompositionParamMatrix4');o3d.WorldInverseTransposeParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['world'];this.inverse_=true;this.transpose_=true;};o3d.inherit('WorldInverseTransposeParamMatrix4','CompositionParamMatrix4');o3d.WorldViewParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['view','world'];};o3d.inherit('WorldViewParamMatrix4','CompositionParamMatrix4');o3d.WorldViewInverseParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['view','world'];this.inverse_=true;};o3d.inherit('WorldViewInverseParamMatrix4','CompositionParamMatrix4');o3d.WorldViewTransposeParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['view','world'];this.transpose_=true;};o3d.inherit('WorldViewTransposeParamMatrix4','CompositionParamMatrix4');o3d.WorldViewInverseTransposeParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['view','world'];this.inverse_=true;this.transpose_=true;};o3d.inherit('WorldViewInverseTransposeParamMatrix4','CompositionParamMatrix4');o3d.WorldViewProjectionParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['worldViewProjection'];};o3d.inherit('WorldViewProjectionParamMatrix4','CompositionParamMatrix4');o3d.WorldViewProjectionInverseParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['worldViewProjection'];this.inverse_=true;};o3d.inherit('WorldViewProjectionInverseParamMatrix4','CompositionParamMatrix4');o3d.WorldViewProjectionTransposeParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['worldViewProjection'];this.transpose_=true;};o3d.inherit('WorldViewProjectionTransposeParamMatrix4','CompositionParamMatrix4');o3d.WorldViewProjectionInverseTransposeParamMatrix4=function(){o3d.CompositionParamMatrix4.call(this);this.matrix_names_=['worldViewProjection'];this.inverse_=true;this.transpose_=true;};o3d.inherit('WorldViewProjectionInverseTransposeParamMatrix4','CompositionParamMatrix4');o3d.ParamInteger.prototype.applyToLocation=function(gl,location){gl.uniform1i(location,this.value);};o3d.ParamBoolean.prototype.applyToLocation=function(gl,location){gl.uniform1i(location,this.value);};o3d.ParamFloat.prototype.applyToLocation=function(gl,location){gl.uniform1f(location,this.value);};o3d.ParamFloat2.prototype.applyToLocation=function(gl,location){gl.uniform2fv(location,this.value);};o3d.ParamFloat3.prototype.applyToLocation=function(gl,location){gl.uniform3fv(location,this.value);};o3d.ParamFloat4.prototype.applyToLocation=function(gl,location){gl.uniform4fv(location,this.value);};o3d.ParamMatrix4.prototype.applyToLocation=function(gl,location){gl.uniformMatrix4fv(location,false,o3d.Transform.flattenMatrix4(this.value));};o3d.ParamParamArray.prototype.applyToLocations=function(gl,locationArray){var computedValue=this.value;if(locationArray.length!=computedValue.length){gl.client.error_callback('Invalid uniform param array: incorrect number of elements.');}
for(var i=0;i<computedValue.length;i++){computedValue.getParam(i).applyToLocation(gl,locationArray[i]);}};o3d.Param.texture_index_=0;o3d.ParamSampler.prototype.applyToLocation=function(gl,location,opt_isCube){var i=o3d.Param.texture_index_;gl.activeTexture(gl.TEXTURE0+i);var value=null;var target=0;var sampler=null;if(this.value){sampler=this.value;}else{o3d.Sampler.defaultSampler_.gl=gl;sampler=o3d.Sampler.defaultSampler_;if(gl.client.reportErrors_()){gl.client.error_callback("Missing Sampler for ParamSampler "+this.name);}}
sampler.bindAndSetParameters_(opt_isCube);gl.uniform1i(location,i);o3d.Param.texture_index_++;};o3d.ParamSampler.defaultParamSampler_=new o3d.ParamSampler();o3d.Param.SAS=new o3d.ParamObject;o3d.Param.sasTypes_={'world':'WorldParamMatrix4','view':'ViewParamMatrix4','projection':'ProjectionParamMatrix4','worldView':'WorldViewParamMatrix4','viewProjection':'ViewProjectionParamMatrix4','worldViewProjection':'WorldViewProjectionParamMatrix4','worldInverse':'WorldInverseParamMatrix4','viewInverse':'ViewInverseParamMatrix4','projectionInverse':'ProjectionInverseParamMatrix4','worldViewInverse':'WorldViewInverseParamMatrix4','viewProjectionInverse':'ViewProjectionInverseParamMatrix4','worldViewProjectionInverse':'WorldViewProjectionInverseParamMatrix4','worldTranspose':'WorldTransposeParamMatrix4','viewTranspose':'ViewTransposeParamMatrix4','projectionTranspose':'ProjectionTransposeParamMatrix4','worldViewTranspose':'WorldViewTransposeParamMatrix4','viewProjectionTranspose':'ViewProjectionTransposeParamMatrix4','worldViewProjectionTranspose':'WorldViewProjectionTransposeParamMatrix4','worldInverseTranspose':'WorldInverseTransposeParamMatrix4','viewInverseTranspose':'ViewInverseTransposeParamMatrix4','projectionInverseTranspose':'ProjectionInverseTransposeParamMatrix4','worldViewInverseTranspose':'WorldViewInverseTransposeParamMatrix4','viewProjectionInverseTranspose':'ViewProjectionInverseTransposeParamMatrix4','worldViewProjectionInverseTranspose':'WorldViewProjectionInverseTransposeParamMatrix4'};for(name in o3d.Param.sasTypes_){o3d.Param.SAS.createParam(name,o3d.Param.sasTypes_[name]);}
o3d.Param.SAS.setWorld=function(world){this['world']=world;};o3d.Param.SAS.setView=function(view){this['view']=view;};o3d.Param.SAS.setProjection=function(projection){this['projection']=projection;};o3d.Param.SAS.setViewProjection=function(viewProjection){this['viewProjection']=viewProjection;};o3d.Param.SAS.setWorldViewProjection=function(worldViewProjection){this['worldViewProjection']=worldViewProjection;};o3d.Event=function(){o3d.ObjectBase.call(this);};o3d.inherit('Event','ObjectBase');o3d.Event.Type=goog.typedef;o3d.Event.TYPE_INVALID=0;o3d.Event.TYPE_CLICK=1;o3d.Event.TYPE_DBLCLICK=2;o3d.Event.TYPE_MOUSEDOWN=3;o3d.Event.TYPE_MOUSEMOVE=4;o3d.Event.TYPE_MOUSEUP=5;o3d.Event.TYPE_WHEEL=6;o3d.Event.TYPE_KEYDOWN=7;o3d.Event.TYPE_KEYPRESS=8;o3d.Event.TYPE_KEYUP=9;o3d.Event.TYPE_RESIZE=10;o3d.Event.prototype.type=o3d.Event.TYPE_INVALID;o3d.Event.Button=goog.typedef;o3d.Event.BUTTON_LEFT=0;o3d.Event.BUTTON_MIDDLE=1;o3d.Event.BUTTON_RIGHT=2;o3d.Event.BUTTON_4=3;o3d.Event.BUTTON_5=4;o3d.Event.prototype.button=o3d.Event.BUTTON_LEFT;o3d.Event.prototype.ctrl_key=false;o3d.Event.prototype.alt_key=false;o3d.Event.prototype.shift_key=false;o3d.Event.prototype.meta_key=false;o3d.Event.prototype.key_code=0;o3d.Event.prototype.char_code=0;o3d.Event.prototype.x=0;o3d.Event.prototype.y=0;o3d.Event.prototype.screenX=0;o3d.Event.prototype.screenY=0;o3d.Event.prototype.deltaX=0;o3d.Event.prototype.deltaY=0;o3d.Event.prototype.width=0;o3d.Event.prototype.height=0;o3d.Event.prototype.fullscreen=false;o3d.RenderEvent=function(){o3d.Event.call(this);};o3d.inherit('RenderEvent','Event');o3d.RenderEvent.prototype.elapsedTime=0;o3d.TickEvent=function(){o3d.Event.call(this);};o3d.inherit('RenderEvent','Event');o3d.TickEvent.prototype.elapsedTime=0;o3d.RawData=function(){o3d.NamedObject.call(this);};o3d.inherit('RawData','NamedObject');o3d.RawData.prototype.stringValue='';o3d.RawData.prototype.image_=null;o3d.RawData.prototype.uri='';o3d.RawData.prototype.length=0;o3d.RawData.prototype.discard=function(){o3d.notImplemented();};o3d.RawData.prototype.flush=function(){o3d.notImplemented();};o3d.Texture=function(){o3d.ParamObject.call(this);this.format=o3d.Texture.UNKNOWN_FORMAT;this.levels=1;this.alphaIsOne=true;this.texture_=null;this.texture_target_=0;this.texture_width_=0;this.texture_height_=0;this.parameter_cache_={};};o3d.inherit('Texture','ParamObject');o3d.Texture.Format=goog.typedef;o3d.Texture.UNKNOWN_FORMAT=0;o3d.Texture.XRGB8=1;o3d.Texture.ARGB8=2;o3d.Texture.ABGR16F=3;o3d.Texture.R32F=4;o3d.Texture.ABGR32F=5;o3d.Texture.DXT1=6;o3d.Texture.DXT3=7;o3d.Texture.DXT5=8;o3d.Texture.prototype.generateMips=function(source_level,num_levels){this.gl.bindTexture(this.texture_target_,this.texture_);this.gl.generateMipmap(this.texture_target_);this.levels=num_levels;};o3d.Texture.isPowerOfTwo_=function(value){return(value&(value-1))==0;};o3d.Texture.nextHighestPowerOfTwo_=function(value){var r=1;while(r<value){r*=2;}
return r;};o3d.Texture.prototype.getGLTextureFormat_=function(){switch(this.format){case o3d.Texture.XRGB8:return this.gl.RGB;case o3d.Texture.ARGB8:case o3d.Texture.ABGR16F:case o3d.Texture.ABGR32F:return this.gl.RGBA;case o3d.Texture.R32F:case o3d.Texture.DXT1:case o3d.Texture.DXT3:case o3d.Texture.DXT5:default:o3d.notImplemented();return 0;}}
o3d.Texture.prototype.getTexImage2DTarget_=function(opt_face){if(this.texture_target_==this.gl.TEXTURE_CUBE_MAP){return this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+opt_face;}else{return this.gl.TEXTURE_2D;}};o3d.Texture.maxLevels_=function(width,height){if(width==0||height==0){return 0;}
var max=Math.max(width,height);var levels=0;while(max>0){++levels;max=max>>1;}
return levels;};var g_counter=0;o3d.Texture.prototype.setFromCanvas_=function(canvas,resize_to_pot,flip,generate_mips,opt_face){var gl=this.gl;if(resize_to_pot&&(!o3d.Texture.isPowerOfTwo_(canvas.width)||!o3d.Texture.isPowerOfTwo_(canvas.height))){var scratch=o3d.Bitmap.getScratchCanvas_();scratch.width=o3d.Texture.nextHighestPowerOfTwo_(canvas.width);scratch.height=o3d.Texture.nextHighestPowerOfTwo_(canvas.height);scratch.getContext("2d").drawImage(canvas,0,0,canvas.width,canvas.height,0,0,scratch.width,scratch.height);canvas=scratch;}
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);gl.bindTexture(this.texture_target_,this.texture_);gl.texImage2D(this.getTexImage2DTarget_(opt_face),0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);this.texture_width_=canvas.width;this.texture_height_=canvas.height;if(generate_mips){this.gl.generateMipmap(this.texture_target_);this.levels=o3d.Texture.maxLevels_(this.texture_width_,this.texture_height_);}
g_counter++;};o3d.Texture.prototype.drawImageFromCanvas_=function(source_canvas,source_x,source_y,source_width,source_height,dest_mip,dest_x,dest_y,dest_width,dest_height,opt_face){var canvas=o3d.Bitmap.getScratchCanvas_();canvas.width=dest_width;canvas.height=dest_height;var context=canvas.getContext('2d');context.save();context.translate(-source_x,-source_y);context.scale(dest_width/source_width,dest_height/source_height);context.drawImage(source_canvas,0,0,source_canvas.width,source_canvas.height);var gl=this.gl;gl.bindTexture(this.texture_target_,this.texture_);var format=this.getGLTextureFormat_();gl.texImage2D(this.getTexImage2DTarget_(opt_face),dest_mip,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);this.texture_width_=canvas.width;this.texture_height_=canvas.height;context.restore();};o3d.Texture.prototype.setValues_=function(level,values,opt_face){var pixels=new Uint8Array(values.length);for(var i=0;i<values.length;++i){pixels[i]=Math.min(255,Math.max(0,values[i]*256.0));}
var format=this.getGLTextureFormat_();this.gl.bindTexture(this.texture_target_,this.texture_);this.gl.texSubImage2D(this.getTexImage2DTarget_(opt_face),level,0,0,this.texture_width_,this.texture_height_,format,this.gl.UNSIGNED_BYTE,pixels);};o3d.Texture.prototype.initWithTarget_=function(texture_target,width,height,format,levels,enable_render_surfaces,debug){this.width=width;this.height=height;this.format=format;this.levels=levels;this.texture_=this.gl.createTexture();this.texture_target_=texture_target;if(width!=undefined&&height!=undefined){this.gl.bindTexture(this.texture_target_,this.texture_);var format=this.getGLTextureFormat_();var pixels=new Uint8Array(width*height*4);var canvas=o3d.Bitmap.getScratchCanvas_();canvas.width=width;canvas.height=height;var numFaces=1;if(this.texture_target_==this.gl.TEXTURE_CUBE_MAP){numFaces=6;}
for(var face=0;face<numFaces;++face){this.gl.texImage2D(this.getTexImage2DTarget_(face),0,format,width,height,0,format,this.gl.UNSIGNED_BYTE,pixels);}
this.texture_width_=width;this.texture_height_=height;}};o3d.Texture2D=function(opt_width,opt_height){o3d.Texture.call(this);this.width=opt_width||0;this.height=opt_height||0;this.renderSurfaces_=[];};o3d.inherit('Texture2D','Texture');o3d.ParamObject.setUpO3DParam_(o3d.Texture2D,'width','ParamInteger');o3d.ParamObject.setUpO3DParam_(o3d.Texture2D,'height','ParamInteger');o3d.Texture2D.prototype.init_=function(width,height,format,levels,enable_render_surfaces){this.initWithTarget_(this.gl.TEXTURE_2D,width,height,format,levels,enable_render_surfaces);};o3d.Texture2D.prototype.getRenderSurface=function(mip_level){if(!this.renderSurfaces_[mip_level]){var renderSurface=new o3d.RenderSurface();renderSurface.gl=this.gl;renderSurface.initWithTexture(this,mip_level);this.renderSurfaces_[mip_level]=renderSurface;}
return this.renderSurfaces_[mip_level];};o3d.Texture2D.prototype.set=function(level,values){this.setValues_(level,values);};o3d.Texture2D.prototype.setRect=function(level,destination_x,destination_y,source_width,values){var format=this.getGLTextureFormat_();var numChannels=(format==this.gl.RGB?3:4);var source_height=(values.length/numChannels)/source_width;if(destination_x>this.width||destination_y>this.height||destination_x+source_width<0||destination_y+source_height<0){return;}
var size_x=source_width;if(destination_x<0){size_x+=destination_x;}
if(destination_x+source_width>this.width){size_x-=(destination_x+source_width)-this.width;}
var size_y=source_height;if(destination_y<0){size_y+=destination_y;}
if(destination_y+source_height>this.height){size_y-=(destination_y+source_height)-this.height;}
var start_x=(destination_x<0)?Math.abs(destination_x):0;var start_y=(destination_y<0)?Math.abs(destination_y):0;var keptPixels=new Uint8Array(size_x*size_y*numChannels);var count=0;for(var y=0;y<size_y;++y){for(var x=0;x<size_x;++x){var t=(((start_y+y)*source_width)+(start_x+x))*numChannels;keptPixels[count++]=Math.min(255,Math.max(0,values[t]*256.0));keptPixels[count++]=Math.min(255,Math.max(0,values[t+1]*256.0));keptPixels[count++]=Math.min(255,Math.max(0,values[t+2]*256.0));keptPixels[count++]=Math.min(255,Math.max(0,values[t+3]*256.0));}}
var where_x=Math.max(destination_x,0);var where_y=this.height-(Math.max(destination_y,0)+size_y);this.gl.bindTexture(this.texture_target_,this.texture_);this.gl.texSubImage2D(this.gl.TEXTURE_2D,level,where_x,where_y,size_x,size_y,format,this.gl.UNSIGNED_BYTE,keptPixels);};o3d.Texture2D.prototype.getRect=function(level,x,y,width,height){o3d.notImplemented();};o3d.Texture2D.prototype.setFromBitmap=function(bitmap){var resize_to_pot=bitmap.defer_mipmaps_to_texture_;this.setFromCanvas_(bitmap.canvas_,resize_to_pot,bitmap.defer_flip_vertically_to_texture_,bitmap.defer_mipmaps_to_texture_);};o3d.Texture2D.prototype.drawImage=function(source_img,source_mip,source_x,source_y,source_width,source_height,dest_mip,dest_x,dest_y,dest_width,dest_height){this.drawImageFromCanvas_(source_img.canvas_,source_x,source_y,source_width,source_height,dest_mip,dest_x,dest_y,dest_width,dest_height);};o3d.TextureCUBE=function(){o3d.Texture.call(this);this.edgeLength=0;this.faces_set_={0:false,1:false,2:false,3:false,4:false,5:false};};o3d.inherit('TextureCUBE','Texture');o3d.TextureCUBE.CubeFace=goog.typedef;o3d.TextureCUBE.FACE_POSITIVE_X=0;o3d.TextureCUBE.FACE_NEGATIVE_X=1;o3d.TextureCUBE.FACE_POSITIVE_Y=2;o3d.TextureCUBE.FACE_NEGATIVE_Y=3;o3d.TextureCUBE.FACE_POSITIVE_Z=4;o3d.TextureCUBE.FACE_NEGATIVE_Z=5;o3d.ParamObject.setUpO3DParam_(o3d.TextureCUBE,'edgeLength','ParamInteger');o3d.TextureCUBE.prototype.init_=function(edgeLength,format,levels,enable_render_surfaces,debug){this.initWithTarget_(this.gl.TEXTURE_CUBE_MAP,edgeLength,edgeLength,format,levels,enable_render_surfaces,debug);};o3d.TextureCUBE.prototype.getRenderSurface=function(face,mip_level,opt_pack){o3d.notImplemented();};o3d.TextureCUBE.prototype.set=function(face,level,values){this.setValues_(level,values,face);this.faces_set_[face]=true;};o3d.TextureCUBE.prototype.setRect=function(face,level,destination_x,destination_y,source_width,values){o3d.notImplemented();};o3d.TextureCUBE.prototype.getRect=function(face,level,x,y,width,height){o3d.notImplemented();};o3d.TextureCUBE.prototype.setFromBitmap=function(face,bitmap){var generate_mipmaps=bitmap.defer_mipmaps_to_texture_;for(var f in this.faces_set_){generate_mipmaps=generate_mipmaps&&(this.faces_set_[f]||f==face);}
var resize_to_pot=bitmap.defer_mipmaps_to_texture_;this.setFromCanvas_(bitmap.canvas_,resize_to_pot,false,generate_mipmaps,face);this.faces_set_[face]=true;};o3d.TextureCUBE.prototype.drawImage=function(source_img,source_mip,source_x,source_y,source_width,source_height,face,dest_mip,dest_x,dest_y,dest_width,dest_height){this.drawImageFromCanvas_(source_img.canvas_,source_x,source_y,source_width,source_height,dest_mip,dest_x,dest_y,dest_width,dest_height,face);};o3d.Texture.prototype.bindAndSetParameters_=function(addressModeU,addressModeV,minFilter,magFilter){var target=this.texture_target_;this.gl.bindTexture(target,this.texture_);if(!(o3d.Texture.isPowerOfTwo_(this.texture_width_)&&o3d.Texture.isPowerOfTwo_(this.texture_height_))||this.texture_target_==this.gl.TEXTURE_CUBE_MAP){addressModeU=addressModeV=this.gl.CLAMP_TO_EDGE;}
if(this.parameter_cache_.addressModeU!=addressModeU){this.gl.texParameteri(target,this.gl.TEXTURE_WRAP_S,addressModeU);this.parameter_cache_.addressModeU=addressModeU;}
if(this.parameter_cache_.addressModeV!=addressModeV){this.gl.texParameteri(target,this.gl.TEXTURE_WRAP_T,addressModeV);this.parameter_cache_.addressModeV=addressModeV;}
if(this.parameter_cache_.minFilter!=minFilter){this.gl.texParameteri(target,this.gl.TEXTURE_MIN_FILTER,minFilter);this.parameter_cache_.minFilter=minFilter;}
if(this.parameter_cache_.magFilter!=magFilter){this.gl.texParameteri(target,this.gl.TEXTURE_MAG_FILTER,magFilter);this.parameter_cache_.magFilter=magFilter;}};o3d.Bitmap=function(){o3d.ParamObject.call(this);};o3d.inherit('Bitmap','ParamObject');o3d.Bitmap.Semantic=goog.typedef;o3d.Bitmap.FACE_POSITIVE_X=0;o3d.Bitmap.FACE_NEGATIVE_X=1;o3d.Bitmap.FACE_POSITIVE_Y=2;o3d.Bitmap.FACE_NEGATIVE_Y=3;o3d.Bitmap.FACE_POSITIVE_Z=4;o3d.Bitmap.FACE_NEGATIVE_Z=5;o3d.Bitmap.IMAGE=6;o3d.Bitmap.SLICE=7;o3d.Bitmap.scratch_canvas_=null;o3d.Bitmap.getScratchCanvas_=function(){if(!o3d.Bitmap.scratch_canvas_)
o3d.Bitmap.scratch_canvas_=document.createElement('CANVAS');return o3d.Bitmap.scratch_canvas_;}
o3d.Bitmap.prototype.canvas_=null;o3d.Bitmap.prototype.flipVertically=function(){var temp_canvas=document.createElement('CANVAS');temp_canvas.width=this.width;temp_canvas.height=this.height;var context=temp_canvas.getContext('2d');context.translate(0,this.height);context.scale(1,-1);context.drawImage(this.canvas_,0,0,this.width,this.height);this.canvas_=temp_canvas;};o3d.Bitmap.prototype.flipVerticallyLazily_=function(){this.defer_flip_vertically_to_texture_=true;};o3d.Bitmap.prototype.generateMips=function(source_level,num_levels){this.defer_mipmaps_to_texture_=true;};o3d.Bitmap.prototype.width=0;o3d.Bitmap.prototype.height=0;o3d.Bitmap.prototype.defer_mipmaps_to_texture_=false;o3d.Bitmap.prototype.defer_flip_vertically_to_texture_=false;o3d.Bitmap.prototype.format=o3d.Texture.UNKNOWN_FORMAT;o3d.Bitmap.prototype.numMipmaps=1;o3d.Bitmap.prototype.semantic=o3d.Bitmap.UNKNOWN_SEMANTIC;o3d.FileRequest=function(){this.method_="";this.async_=true;this.request_=new XMLHttpRequest();var fileRequest=this;this.request_.onreadystatechange=function(){fileRequest.readyState=this.readyState;fileRequest.done=fileRequest.done||this.done;if(this.readyState==4){if(this.responseText){fileRequest.success=true;}
fileRequest.done=true;}
fileRequest.data=this.responseText;if(fileRequest.onreadystatechange)
fileRequest.onreadystatechange.apply(fileRequest,arguments);}};o3d.inherit('FileRequest','NamedObject');o3d.FileRequest.prototype.onreadystatechange=null;o3d.FileRequest.prototype.uri='';o3d.FileRequest.prototype.data=null;o3d.FileRequest.prototype.readyState=0;o3d.FileRequest.prototype.done=false;o3d.FileRequest.prototype.success=false;o3d.FileRequest.prototype.image_=null;o3d.FileRequest.prototype.error='';o3d.FileRequest.prototype.isImageUrl_=function(url){var extension=url.substring(url.length-4);return(extension=='.png'||extension=='.jpg');};o3d.FileRequest.prototype.imageLoaded_=function(){if(this.image_.complete){this.success=true;this.done=true;this.readyState=4;this.data=new o3d.RawData();this.data.image_=this.image_;}
this.onreadystatechange.apply(this,arguments);};o3d.FileRequest.prototype.open=function(method,uri,async){this.uri=uri;this.method_=method;this.async_=async;};o3d.FileRequest.prototype.send=function(){if(this.isImageUrl_(this.uri)){this.image_=new Image();var that=this;this.image_.onload=function(){that.imageLoaded_.call(that);}
this.image_.src=this.uri;}else{this.request_.open(this.method_,this.uri,this.async_);}};o3d.Renderer={};o3d.Renderer.InitStatus=goog.typedef;o3d.Renderer.UNINITIALIZED=0;o3d.Renderer.SUCCESS=1;o3d.Renderer.GPU_NOT_UP_TO_SPEC=2;o3d.Renderer.OUT_OF_RESOURCES=3;o3d.Renderer.INITIALIZATION_ERROR=4;o3d.Renderer.DisplayMode=goog.typedef;o3d.Renderer.DISPLAY_MODE_DEFAULT=0;o3d.Renderer.render_callback_interval_=null;o3d.Renderer.clients_=[];o3d.Renderer.renderClients=function(){for(var i=0;i<o3d.Renderer.clients_.length;++i){var client=o3d.Renderer.clients_[i];client.counter_manager_.tick();if(client.renderMode==o3d.Client.RENDERMODE_CONTINUOUS){client.render();}}};o3d.Renderer.installRenderInterval=function(){o3d.Renderer.render_callback_interval_=setInterval("o3d.Renderer.renderClients()",1000.0/60.0);};o3d.ClientInfo=function(){o3d.NamedObject.call(this);};o3d.inherit('ClientInfo','NamedObject');o3d.ClientInfo.prototype.num_objects=0;o3d.ClientInfo.prototype.texture_memory_used=0;o3d.ClientInfo.prototype.buffer_memory_used=0;o3d.ClientInfo.prototype.software_renderer=false;o3d.ClientInfo.prototype.non_power_of_two_textures=true;o3d.ClientInfo.prototype.glsl=true;o3d.Client=function(){o3d.NamedObject.call(this);var tempPack=this.createPack();this.root=tempPack.createObject('Transform');this.renderGraphRoot=tempPack.createObject('RenderNode');this.clientId=o3d.Client.nextId++;this.packs_=[tempPack];this.clientInfo=tempPack.createObject('ClientInfo');this.counter_manager_=new o3d.CounterManager;if(o3d.Renderer.clients_.length==0)
o3d.Renderer.installRenderInterval();o3d.Renderer.clients_.push(this);this.stateMapStack_=[];this.stateVariableStacks_={};};o3d.inherit('Client','NamedObject');o3d.Client.RenderCallback=goog.typedef;o3d.Client.TickCallback=goog.typedef;o3d.Client.ErrorCallback=goog.typedef;o3d.Client.prototype.renderGraphRoot=null;o3d.Client.nextId=0;o3d.Client.prototype.then_=0;o3d.Client.prototype.root=null;o3d.Client.prototype.packs_=[];o3d.Client.prototype.counter_manager_=null;o3d.Client.prototype.normalizeClearColorAlpha=true;o3d.Client.prototype.error_callback=function(error_message){alert(error_message);};o3d.Client.prototype.render_callback=function(render_event){};o3d.Client.prototype.tick_callback=function(tick_event){};o3d.Client.prototype.cleanup=function(){this.clearRenderCallback();this.clearTickCallback();this.clearErrorCallback();};o3d.Client.prototype.createPack=function(){var pack=new o3d.Pack;pack.client=this;pack.gl=this.gl;this.packs_.push(pack);return pack;};o3d.Client.prototype.destroyPack=function(pack){o3d.removeFromArray(this.packs_,pack);};o3d.Client.prototype.getObjectById=function(id){o3d.notImplemented();};o3d.Client.prototype.getObjects=function(name,class_name){var objects=[];for(var i=0;i<this.packs_.length;++i){var pack=this.packs_[i];objects=objects.concat(pack.getObjects(name,class_name));}
return objects;};o3d.Client.prototype.getObjectsByClassName=function(class_name){var objects=[];for(var i=0;i<this.packs_.length;++i){var pack=this.packs_[i];objects=objects.concat(pack.getObjectsByClassName(class_name));}
return objects;};o3d.Client.RenderMode=goog.typedef;o3d.Client.RENDERMODE_CONTINUOUS=0;o3d.Client.RENDERMODE_ON_DEMAND=1;o3d.Client.prototype.renderMode=o3d.Client.RENDERMODE_CONTINUOUS;o3d.Client.prototype.render=function(){if(!this.gl){return;}
var render_event=new o3d.RenderEvent;this.counter_manager_.advanceRenderFrameCounters();this.clearStateStack_();var now=(new Date()).getTime()*0.001;if(this.then_==0.0)
render_event.elapsedTime=0.0;else
render_event.elapsedTime=now-this.then_;if(this.render_callback){for(var stat in this.render_stats_){render_event[stat]=this.render_stats_[stat];}
this.render_callback(render_event);}
this.then_=now;this.gl.colorMask(true,true,true,true);this.renderTree(this.renderGraphRoot);if(this.normalizeClearColorAlpha){this.gl.colorMask(false,false,false,true);this.gl.clearColor(0.0,0.0,0.0,1.0);this.gl.clear(this.gl.COLOR_BUFFER_BIT);}};o3d.Client.prototype.render_stats={}
o3d.Client.prototype.renderTree=function(render_node){this.render_stats_={drawElementsCulled:0,drawElementsProcessed:0,drawElementsRendered:0,primitivesRendered:0,transformsCulled:0,transformsProcessed:0};render_node.render();};o3d.Client.prototype.getDisplayModes=[];o3d.Client.prototype.setFullscreenClickRegion=function(x,y,width,height,mode_id){o3d.notImplemented();};o3d.Client.prototype.clearFullscreenClickRegion=function(){o3d.notImplemented();};o3d.Client.prototype.cancelFullscreenDisplay=function(){render_node.render();};o3d.Client.prototype.client_info=null;o3d.Client.prototype.fullscreen=false;o3d.Client.prototype.__defineGetter__('width',function(){return this.gl.hack_canvas.width;});o3d.Client.prototype.__defineSetter__('width',function(x){this.gl.hack_canvas.width=x;});o3d.Client.prototype.__defineGetter__('height',function(){return this.gl.hack_canvas.height;});o3d.Client.prototype.__defineSetter__('height',function(x){this.gl.hack_canvas.height=x;});o3d.Client.prototype.initWithCanvas=function(canvas){var gl;var standard_attributes={alpha:true,depth:true,stencil:true,antialias:true,premultipliedAlpha:true};if(!canvas||!canvas.getContext){return false;}
var names=["webgl","experimental-webgl","moz-webgl"];for(var ii=0;ii<names.length;++ii){try{gl=canvas.getContext(names[ii],standard_attributes)}catch(e){}
if(gl){break;}}
if(!gl){return false;}
gl.hack_canvas=canvas;this.gl=gl;this.root.gl=gl;this.renderGraphRoot.gl=gl;gl.client=this;gl.displayInfo={width:canvas.width,height:canvas.height};o3d.State.createDefaultState_(gl).push_();this.initErrorTextures_();return true;}
o3d.Client.prototype.initErrorTextures_=function(){var r=[1,0,0,1];var Y=[1,1,0,1];var error=[r,r,r,r,r,r,r,r,r,r,Y,Y,Y,Y,r,r,r,Y,r,r,r,Y,Y,r,r,Y,r,r,Y,r,Y,r,r,Y,r,Y,r,r,Y,r,r,Y,Y,r,r,r,Y,r,r,r,Y,Y,Y,Y,r,r,r,r,r,r,r,r,r,r];var pixels=[];for(var i=0;i<error.length;i++){for(var j=0;j<4;j++){pixels[i*4+j]=error[i][j];}}
var defaultTextureCube=new o3d.TextureCUBE();defaultTextureCube.gl=this.gl;defaultTextureCube.init_(8,o3d.Texture.ARGB8,1,false,true);for(var i=0;i<6;++i){defaultTextureCube.set(i,0,pixels);}
defaultTextureCube.name='DefaultTextureCube';this.error_texture_cube_=defaultTextureCube;this.fallback_error_texture_cube_=defaultTextureCube;var defaultTexture=new o3d.Texture2D();defaultTexture.gl=this.gl;defaultTexture.init_(8,8,o3d.Texture.ARGB8,1,false);defaultTexture.set(0,pixels);defaultTexture.name='DefaultTexture';this.error_texture_=defaultTexture;this.fallback_error_texture_=defaultTexture;};o3d.Client.prototype.setRenderCallback=function(render_callback){if(this.render_callback){this.clearRenderCallback();}
this.render_callback=render_callback;};o3d.Client.prototype.clearRenderCallback=function(){clearInterval(this.render_callback_interval_);this.render_callback=null;};o3d.Client.prototype.setPostRenderCallback=function(post_render_callback){this.postRenderCallback=post_render_callback;};o3d.Client.prototype.clearPostRenderCallback=function(){this.postRenderCallback=null;};o3d.Client.prototype.setLostResourcesCallback=function(lost_resources_callback){this.lostResourcesCallback=lost_resources_callback;};o3d.Client.prototype.clearLostResourcesCallback=function(){this.lostResourcesCallback=null;};o3d.Client.getEvent_=function(event){return event?event:window.event;};o3d.Client.getEventInfo_=function(event){var elem=event.target?event.target:event.srcElement;var name=elem.id?elem.id:('->'+elem.toString());var wheel=event.detail?event.detail:-event.wheelDelta;return{event:event,element:elem,name:name,wheel:wheel};};o3d.Client.getAbsolutePosition_=function(element){var r={x:0,y:0};for(var e=element;e;e=e.offsetParent){r.x+=e.offsetLeft;r.y+=e.offsetTop;}
return r;};o3d.Client.getLocalXY_=function(eventInfo){var event=eventInfo.event;var p=o3d.Client.getAbsolutePosition_(eventInfo.element);return{x:event.pageX-p.x,y:event.pageY-p.y};};o3d.Client.wrapEventCallback_=function(handler,doCancelEvent){return function(event){event=o3d.Client.getEvent_(event);var originalEvent=event;var info=o3d.Client.getEventInfo_(event);var relativeCoords=o3d.Client.getLocalXY_(info);event=o3d.clone(event);event.x=relativeCoords.x;event.y=relativeCoords.y;event.deltaY=-info.wheel;handler(event);if(doCancelEvent){o3djs.event.cancel(originalEvent);}};};o3d.Client.prototype.setEventCallback=function(type,handler){var listener=this.gl.hack_canvas;var isWheelEvent=type=='wheel';var forKeyEvent=type.substr(0,3)=='key';if(forKeyEvent){listener=document;}else{handler=o3d.Client.wrapEventCallback_(handler,isWheelEvent);}
if(isWheelEvent){listener.addEventListener('DOMMouseScroll',handler,true);listener.addEventListener('mousewheel',handler,true);}else{listener.addEventListener(type,handler,true);}};o3d.Client.prototype.clearEventCallback=function(type){var listener=this.gl.hack_canvas;var isWheelEvent=type=='wheel';var forKeyEvent=type.substr(0,3)=='key';if(forKeyEvent){listener=document;}
if(isWheelEvent){listener.removeEventListener('DOMMouseScroll');listener.removeEventListener('mousewheel');}else{listener.removeEventListener(type);}};o3d.Client.prototype.setErrorTexture=function(texture){this.error_texture_=texture;};o3d.Client.prototype.setErrorTextureCube=function(texture){this.error_texture_cube_map_=texture;};o3d.Client.prototype.setTickCallback=function(tick_callback){this.tickCallback=tick_callback;};o3d.Client.prototype.clearTickCallback=function(){this.tickCallback=null;};o3d.Client.prototype.setErrorCallback=function(error_callback){if(error_callback){this.error_callback=this.wrapErrorCallback_(error_callback);}else{this.error_callback=function(string){this.last_error_=string;};}};o3d.Client.prototype.wrapErrorCallback_=function(error_callback){return function(string){this.last_error_=string;error_callback(string);}}
o3d.Client.prototype.clearErrorCallback=function(){this.setErrorCallback(null);};o3d.Client.prototype.invalidateAllParameters=function(){o3d.notImplemented();};o3d.Client.prototype.toDataURL=function(opt_mime_type){o3d.notImplemented();};o3d.Client.prototype.clearStateStack_=function(){this.stateMapStack_=[];for(var name in this.stateVariableStacks_){var l=this.stateVariableStacks_[name];if(l.length!=1){this.stateVariableStacks_[name]=l.slice(0,1);}}};o3d.Client.prototype.pushState_=function(variable_map){this.stateMapStack_.push(variable_map);for(var name in variable_map){var value=variable_map[name];if(this.stateVariableStacks_[name]==undefined){this.stateVariableStacks_[name]=[];}
this.stateVariableStacks_[name].push(value);}
o3d.State.setVariables_(this.gl,variable_map);};o3d.Client.prototype.popState_=function(){var variable_map=this.stateMapStack_.pop();for(var name in variable_map){var stack=this.stateVariableStacks_[name];stack.pop();variable_map[name]=stack.length?stack[stack.length-1]:o3d.State.stateVariableInfos_[name]['defaultValue'];}
o3d.State.setVariables_(this.gl,variable_map);};o3d.Client.prototype.getState_=function(name){var stack=this.stateVariableStacks_[name];return stack.length?stack[stack.length-1]:o3d.State.stateVariableInfos_[name]['defaultValue'];};o3d.Client.prototype.renderer_init_status=0;o3d.Client.prototype.cursor=null;o3d.Client.prototype.error_texture_=null;o3d.Client.prototype.error_texture_cube_=null;o3d.Client.prototype.fallback_error_texture_=null;o3d.Client.prototype.fallback_error_texture_cube_=null;o3d.Client.prototype.last_error_='';o3d.Client.prototype.__defineGetter__('lastError',function(){return this.last_error_;});o3d.Client.prototype.reportErrors_=function(){return(this.error_texture_==null);}
o3d.Client.prototype.objects=[];o3d.Client.prototype.clearLastError=function(){this.last_error_='';};o3d.Client.prototype.profileReset=function(){o3d.notImplemented();};o3d.Client.prototype.profileToString=function(){o3d.notImplemented();};o3d.Client.prototype.clientId=0;o3d.Client.prototype.clientInfo=null;o3d.Client.prototype.canvas=null;o3d.RenderNode=function(opt_priority,opt_active){o3d.ParamObject.call(this);this.priority=opt_priority||0;this.children=[];this.active=opt_active||true;this.parent=null;};o3d.inherit('RenderNode','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.RenderNode,'priority','ParamFloat');o3d.ParamObject.setUpO3DParam_(o3d.RenderNode,'active','ParamBoolean');o3d.RenderNode.prototype.__defineSetter__('parent',function(p){if(this.parent_){this.parent_.removeChild(this);}
this.parent_=p;if(this.parent_){if(!this.parent_.addChild){throw('Parent of render node must be render node or null.');}
this.parent_.addChild(this);}});o3d.RenderNode.prototype.__defineGetter__('parent',function(p){return this.parent_;});o3d.RenderNode.prototype.addChild=function(child){this.children.push(child);};o3d.RenderNode.prototype.removeChild=function(child){o3d.removeFromArray(this.children,child);};o3d.RenderNode.prototype.getRenderNodesInTree=function(){o3d.notImplemented();};o3d.RenderNode.prototype.getRenderNodesByNameInTree=function(name){o3d.notImplemented();};o3d.RenderNode.prototype.getRenderNodesByClassNameInTree=function(class_name){o3d.notImplemented();};o3d.RenderNode.prototype.render=function(){function compare(a,b){return a.priority-b.priority;}
this.children.sort(compare);var children=this.children;this.before();for(var i=0;i<children.length;++i){children[i].render();}
this.after();};o3d.RenderNode.prototype.before=function(){};o3d.RenderNode.prototype.after=function(){};o3d.ClearBuffer=function(){o3d.RenderNode.call(this);this.clearColor=[0,0,0,1];this.clearColorFlag=true;this.clearDepth=1;this.clearDepthFlag=true;this.clearStencil=0;this.clearStencilFlag=true;};o3d.inherit('ClearBuffer','RenderNode');o3d.ParamObject.setUpO3DParam_(o3d.ClearBuffer,'clearColor','ParamFloat4');o3d.ParamObject.setUpO3DParam_(o3d.ClearBuffer,'clearColorFlag','ParamBoolean');o3d.ParamObject.setUpO3DParam_(o3d.ClearBuffer,'clearDepth','ParamFloat');o3d.ParamObject.setUpO3DParam_(o3d.ClearBuffer,'clearDepthFlag','ParamBoolean');o3d.ParamObject.setUpO3DParam_(o3d.ClearBuffer,'clearStencil','ParamInteger');o3d.ParamObject.setUpO3DParam_(o3d.ClearBuffer,'clearStencilFlag','ParamBoolean');o3d.ClearBuffer.prototype.before=function(){var flags=0;this.gl.clearColor(this.clearColor[0],this.clearColor[1],this.clearColor[2],this.clearColor[3]);this.gl.clearDepth(this.clearDepth);this.gl.clearStencil(this.clearStencil);if(this.clearColorFlag)
flags=flags|this.gl.COLOR_BUFFER_BIT;if(this.clearDepthFlag)
flags=flags|this.gl.DEPTH_BUFFER_BIT;if(this.clearStencilFlag)
flags=flags|this.gl.STENCIL_BUFFER_BIT;this.gl.clear(flags);};o3d.StateSet=function(opt_state){o3d.RenderNode.call(this);this.state=opt_state||null;};o3d.inherit('StateSet','RenderNode');o3d.ParamObject.setUpO3DParam_(o3d.StateSet,'state','ParamState');o3d.StateSet.prototype.before=function(){if(this.state){this.state.push_();}};o3d.StateSet.prototype.after=function(){if(this.state){this.state.pop_();}};o3d.Viewport=function(opt_viewport,opt_depthRange){o3d.RenderNode.call(this);this.viewport=opt_viewport||[0.0,0.0,1.0,1.0];this.depthRange=opt_depthRange||[0.0,1.0];};o3d.inherit('Viewport','RenderNode');o3d.ParamObject.setUpO3DParam_(o3d.Viewport,'viewport','ParamFloat4');o3d.ParamObject.setUpO3DParam_(o3d.Viewport,'depthRange','ParamFloat2');o3d.Viewport.prototype.before=function(){var x=this.viewport[0]*this.gl.displayInfo.width;var y=(1-this.viewport[1]-this.viewport[3])*this.gl.displayInfo.height;var width=this.viewport[2]*this.gl.displayInfo.width;var height=this.viewport[3]*this.gl.displayInfo.height;this.gl.viewport(x,y,width,height);if(x!=0||y!=0||this.viewport[2]!=1||this.viewport[3]!=1){this.gl.enable(this.gl.SCISSOR_TEST);this.gl.scissor(x,y,width,height);}else{this.gl.disable(this.gl.SCISSOR_TEST);}};o3d.TreeTraversal=function(opt_transform){o3d.RenderNode.call(this);this.transform=opt_transform||null;this.drawLists_=[];this.drawListsToReset_=[];};o3d.inherit('TreeTraversal','RenderNode');o3d.ParamObject.setUpO3DParam_(o3d.TreeTraversal,'transform','ParamTransform');o3d.TreeTraversal.prototype.registerDrawList=function(draw_list,draw_context,reset){if(reset==undefined||reset){this.drawListsToReset_.push(draw_list);}
this.drawLists_.push({list:draw_list,context:draw_context});};o3d.TreeTraversal.prototype.unregisterDrawList=function(draw_list){o3d.notImplemented();};o3d.TreeTraversal.prototype.before=function(){for(var i=0;i<this.drawListsToReset_.length;++i){this.drawListsToReset_[i].list_=[];}
this.transform.traverse(this.drawLists_);};o3d.DrawList=function(){o3d.NamedObject.call(this);this.list_=[];};o3d.inherit('DrawList','NamedObject');this.list_=[];o3d.DrawList.SortMethod=goog.typedef;o3d.DrawList.BY_PERFORMANCE=0;o3d.DrawList.BY_Z_ORDER=1;o3d.DrawList.BY_PRIORITY=2;o3d.DrawList.comparePriority_=function(drawElementInfoA,drawElementInfoB){return drawElementInfoA.drawElement.owner.priority-
drawElementInfoB.drawElement.owner.priority;};o3d.DrawList.compareZ_=function(drawElementInfoA,drawElementInfoB){return o3d.Transform.transformPointZOnly(drawElementInfoB.worldViewProjection,drawElementInfoB.drawElement.owner.zSortPoint)-
o3d.Transform.transformPointZOnly(drawElementInfoA.worldViewProjection,drawElementInfoA.drawElement.owner.zSortPoint);};o3d.DrawList.prototype.sort_=function(sort_method){switch(sort_method){case o3d.DrawList.BY_PRIORITY:this.list_.sort(o3d.DrawList.comparePriority_);break;case o3d.DrawList.BY_Z_ORDER:this.list_.sort(o3d.DrawList.compareZ_);break;case o3d.DrawList.BY_PERFORMANCE:default:break;}};o3d.DrawList.prototype.render=function(){for(var i=0;i<this.list_.length;++i){var drawElementInfo=this.list_[i];var world=drawElementInfo.world;var view=drawElementInfo.view;var viewProjection=drawElementInfo.viewProjection;var worldViewProjection=drawElementInfo.worldViewProjection;var projection=drawElementInfo.projection;var transform=drawElementInfo.transform;var drawElement=drawElementInfo.drawElement;var element=drawElement.owner;var material=drawElement.material||element.material;var effect=material.effect;o3d.Param.SAS.setWorld(world);o3d.Param.SAS.setView(view);o3d.Param.SAS.setProjection(projection);o3d.Param.SAS.setViewProjection(viewProjection);o3d.Param.SAS.setWorldViewProjection(worldViewProjection);var paramObjects=[transform,drawElement,element];if(element.streamBank){paramObjects.push(element.streamBank);}
paramObjects.push(material,effect,o3d.Param.SAS);effect.searchForParams_(paramObjects);var state_on=(material.state!=undefined);if(state_on){material.state.push_();}
element.render();if(state_on){material.state.pop_();}}};o3d.DrawPass=function(opt_drawList,opt_sortMethod){o3d.RenderNode.call(this);this.drawList=opt_drawList||null;this.sortMethod=opt_sortMethod||o3d.DrawList.BY_PERFORMANCE;};o3d.inherit('DrawPass','RenderNode');o3d.DrawPass.SortMethod=goog.typedef;o3d.ParamObject.setUpO3DParam_(o3d.DrawPass,'drawList','ParamDrawList');o3d.ParamObject.setUpO3DParam_(o3d.DrawPass,'sortMethod','ParamInteger');o3d.DrawPass.prototype.before=function(){if(this.drawList){this.drawList.sort_(this.sortMethod);this.drawList.render();}};
o3d.RenderSurfaceSet=function(opt_renderSurface,opt_renderDepthStencilSurface){o3d.RenderNode.call(this);this.renderSurface=opt_renderSurface||null;this.renderDepthStencilSurface=opt_renderDepthStencilSurface||null;};o3d.inherit('RenderSurfaceSet','RenderNode');o3d.ParamObject.setUpO3DParam_(o3d.RenderSurfaceSet,'renderSurface','ParamRenderSurface');o3d.ParamObject.setUpO3DParam_(o3d.RenderSurfaceSet,'renderDepthStencilSurface','ParamRenderDepthStencilSurface');o3d.RenderSurfaceSet.prototype.clearFramebufferObjects_=function(){this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,this.renderSurface.framebuffer_);this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.RENDERBUFFER,null);this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,null);this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null);};o3d.RenderSurfaceSet.prototype.installFramebufferObjects_=function(){this.clearFramebufferObjects_();this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,this.renderSurface.framebuffer_);if(this.renderSurface){var texture=this.renderSurface.texture.texture_;var level=this.renderSurface.level;this.gl.bindTexture(this.gl.TEXTURE_2D,texture);this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_2D,texture,level);}
if(this.renderDepthStencilSurface){var depth_stencil_buffer=this.renderDepthStencilSurface.depth_stencil_buffer_;this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,depth_stencil_buffer);this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,depth_stencil_buffer);}};o3d.RenderSurfaceSet.prototype.before=function(){this.installFramebufferObjects_();this.previousHeight=this.gl.displayInfo.height;this.previousWidth=this.gl.displayInfo.width;this.previousRenderSurfaceSet=this.gl.currentRenderSurfaceSet;this.gl.displayInfo.height=this.renderSurface.height;this.gl.displayInfo.width=this.renderSurface.width;this.gl.currentRenderSurfaceSet=this;};o3d.RenderSurfaceSet.prototype.after=function(){this.clearFramebufferObjects_();this.gl.displayInfo.height=this.previousHeight;this.gl.displayInfo.width=this.previousWidth;this.gl.currentRenderSurfaceSet=this.previousRenderSurfaceSet;};o3d.RenderSurfaceBase=function(width,height,texture){o3d.ParamObject.call(this);this.width=width||0;this.height=height||0;this.texture=texture||null;this.level=0;this.framebuffer_=null;};o3d.inherit('RenderSurfaceBase','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.RenderSurfaceBase,'width','ParamInteger');o3d.ParamObject.setUpO3DParam_(o3d.RenderSurfaceBase,'height','ParamInteger');o3d.RenderSurface=function(){o3d.RenderSurfaceBase.call(this);};o3d.inherit('RenderSurface','RenderSurfaceBase');o3d.RenderSurface.prototype.initWithTexture=function(texture,level){this.framebuffer_=this.gl.createFramebuffer();this.texture=texture;this.level=level;this.width=texture.width;this.height=texture.height;};o3d.RenderDepthStencilSurface=function(){o3d.RenderSurfaceBase.call(this);this.depth_stencil_buffer_=null;};o3d.inherit('RenderDepthStencilSurface','RenderSurfaceBase');o3d.RenderDepthStencilSurface.prototype.initWithSize_=function(width,height){this.depth_stencil_buffer_=this.gl.createRenderbuffer();this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depth_stencil_buffer_);this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,width,height);this.width=width;this.height=height;};o3d.State=function(){o3d.ParamObject.call(this);this.state_params_={};o3d.State.stateVariableInfos_=o3d.State.stateVariableInfos_||{'AlphaBlendEnable':{paramType:'ParamBoolean',defaultValue:false},'AlphaComparisonFunction':{paramType:'ParamInteger',defaultValue:o3d.State.CMP_ALWAYS},'AlphaReference':{paramType:'ParamFloat',defaultValue:0},'AlphaTestEnable':{paramType:'ParamBoolean',defaultValue:false},'BlendAlphaEquation':{paramType:'ParamInteger',defaultValue:o3d.State.BLEND_ADD},'BlendEquation':{paramType:'ParamInteger',defaultValue:o3d.State.BLEND_ADD},'CCWStencilComparisonFunction':{paramType:'ParamInteger',defaultValue:o3d.State.CMP_ALWAYS},'CCWStencilFailOperation':{paramType:'ParamInteger',defaultValue:o3d.State.STENCIL_KEEP},'CCWStencilPassOperation':{paramType:'ParamInteger',defaultValue:o3d.State.STENCIL_KEEP},'CCWStencilZFailOperation':{paramType:'ParamInteger',defaultValue:o3d.State.STENCIL_KEEP},'ColorWriteEnable':{paramType:'ParamInteger',defaultValue:15},'CullMode':{paramType:'ParamInteger',defaultValue:o3d.State.CULL_CW},'DestinationBlendAlphaFunction':{paramType:'ParamInteger',defaultValue:o3d.State.BLENDFUNC_ZERO},'DestinationBlendFunction':{paramType:'ParamInteger',defaultValue:o3d.State.BLENDFUNC_ZERO},'DitherEnable':{paramType:'ParamBoolean',defaultValue:false},'FillMode':{paramType:'ParamInteger',defaultValue:o3d.State.SOLID},'LineSmoothEnable':{paramType:'ParamBoolean',defaultValue:false},'PointSize':{paramType:'ParamFloat',defaultValue:0},'PointSpriteEnable':{paramType:'ParamBoolean',defaultValue:false},'PolygonOffset1':{paramType:'ParamFloat',defaultValue:0},'PolygonOffset2':{paramType:'ParamFloat',defaultValue:0},'SeparateAlphaBlendEnable':{paramType:'ParamBoolean',defaultValue:false},'SourceBlendAlphaFunction':{paramType:'ParamInteger',defaultValue:o3d.State.BLENDFUNC_ONE},'SourceBlendFunction':{paramType:'ParamInteger',defaultValue:o3d.State.BLENDFUNC_ONE},'StencilComparisonFunction':{paramType:'ParamInteger',defaultValue:o3d.State.CMP_ALWAYS},'StencilEnable':{paramType:'ParamBoolean',defaultValue:false},'StencilFailOperation':{paramType:'ParamInteger',defaultValue:o3d.State.STENCIL_KEEP},'StencilMask':{paramType:'ParamInteger',defaultValue:255},'StencilPassOperation':{paramType:'ParamInteger',defaultValue:o3d.State.STENCIL_KEEP},'StencilReference':{paramType:'ParamInteger',defaultValue:0},'StencilWriteMask':{paramType:'ParamInteger',defaultValue:255},'StencilZFailOperation':{paramType:'ParamInteger',defaultValue:o3d.State.STENCIL_KEEP},'TwoSidedStencilEnable':{paramType:'ParamBoolean',defaultValue:false},'ZComparisonFunction':{paramType:'ParamInteger',defaultValue:o3d.State.CMP_LESS},'ZEnable':{paramType:'ParamBoolean',defaultValue:true},'ZWriteEnable':{paramType:'ParamBoolean',defaultValue:true}};};o3d.inherit('State','ParamObject');o3d.State.prototype.state_params_={};o3d.State.CMP_NEVER=0;o3d.State.CMP_LESS=1;o3d.State.CMP_EQUAL=2;o3d.State.CMP_LEQUAL=3;o3d.State.CMP_GREATER=4;o3d.State.CMP_NOTEQUAL=5;o3d.State.CMP_GEQUAL=6;o3d.State.CMP_ALWAYS=7;o3d.Cull=goog.typedef;o3d.State.CULL_NONE=0;o3d.State.CULL_CW=1;o3d.State.CULL_CCW=2;o3d.State.POINT=0;o3d.State.WIREFRAME=1;o3d.State.SOLID=2;o3d.State.BLENDFUNC_ZERO=0;o3d.State.BLENDFUNC_ONE=1;o3d.State.BLENDFUNC_SOURCE_COLOR=2;o3d.State.BLENDFUNC_INVERSE_SOURCE_COLOR=3;o3d.State.BLENDFUNC_SOURCE_ALPHA=4;o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA=5;o3d.State.BLENDFUNC_DESTINATION_ALPHA=6;o3d.State.BLENDFUNC_INVERSE_DESTINATION_ALPHA=7;o3d.State.BLENDFUNC_DESTINATION_COLOR=8;o3d.State.BLENDFUNC_INVERSE_DESTINATION_COLOR=9;o3d.State.BLENDFUNC_SOURCE_ALPHA_SATUTRATE=10;o3d.State.BLEND_ADD=0;o3d.State.BLEND_SUBTRACT=1;o3d.State.BLEND_REVERSE_SUBTRACT=2;o3d.State.BLEND_MIN=3;o3d.State.BLEND_MAX=4;o3d.State.STENCIL_KEEP=0;o3d.State.STENCIL_ZERO=1;o3d.State.STENCIL_REPLACE=2;o3d.State.STENCIL_INCREMENT_SATURATE=3;o3d.State.STENCIL_DECREMENT_SATURATE=4;o3d.State.STENCIL_INVERT=5;o3d.State.STENCIL_INCREMENT=6;o3d.State.STENCIL_DECREMENT=7;o3d.State.prototype.getStateParam=function(state_name){if(!this.state_params_[state_name]){var info=o3d.State.stateVariableInfos_[state_name];var param=new o3d.global.o3d[info.paramType];param.value=info.defaultValue;this.state_params_[state_name]=param;}
return this.state_params_[state_name];};o3d.State.createDefaultState_=function(gl){var state=new o3d.State;state.gl=gl;var infos=o3d.State.stateVariableInfos_;for(name in infos){var info=infos[name];state.getStateParam(name).value=info.defaultValue;}
return state;};o3d.State.convertCmpFunc_=function(gl,cmp){switch(cmp){case o3d.State.CMP_ALWAYS:return gl.ALWAYS;case o3d.State.CMP_NEVER:return gl.NEVER;case o3d.State.CMP_LESS:return gl.LESS;case o3d.State.CMP_GREATER:return gl.GREATER;case o3d.State.CMP_LEQUAL:return gl.LEQUAL;case o3d.State.CMP_GEQUAL:return gl.GEQUAL;case o3d.State.CMP_EQUAL:return gl.EQUAL;case o3d.State.CMP_NOTEQUAL:return gl.NOTEQUAL;default:break;}
return gl.ALWAYS;};o3d.State.convertBlendFunc_=function(gl,blend_func){switch(blend_func){case o3d.State.BLENDFUNC_ZERO:return gl.ZERO;case o3d.State.BLENDFUNC_ONE:return gl.ONE;case o3d.State.BLENDFUNC_SOURCE_COLOR:return gl.SRC_COLOR;case o3d.State.BLENDFUNC_INVERSE_SOURCE_COLOR:return gl.ONE_MINUS_SRC_COLOR;case o3d.State.BLENDFUNC_SOURCE_ALPHA:return gl.SRC_ALPHA;case o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA:return gl.ONE_MINUS_SRC_ALPHA;case o3d.State.BLENDFUNC_DESTINATION_ALPHA:return gl.DST_ALPHA;case o3d.State.BLENDFUNC_INVERSE_DESTINATION_ALPHA:return gl.ONE_MINUS_DST_ALPHA;case o3d.State.BLENDFUNC_DESTINATION_COLOR:return gl.DST_COLOR;case o3d.State.BLENDFUNC_INVERSE_DESTINATION_COLOR:return gl.ONE_MINUS_DST_COLOR;case o3d.State.BLENDFUNC_SOURCE_ALPHA_SATUTRATE:return gl.SRC_ALPHA_SATURATE;default:break;}
return gl.ONE;};o3d.State.convertBlendEquation_=function(gl,blend_equation){switch(blend_equation){case o3d.State.BLEND_ADD:return gl.FUNC_ADD;case o3d.State.BLEND_SUBTRACT:return gl.FUNC_SUBTRACT;case o3d.State.BLEND_REVERSE_SUBTRACT:return gl.FUNC_REVERSE_SUBTRACT;case o3d.State.BLEND_MIN:return gl.MIN;case o3d.State.BLEND_MAX:return gl.MAX;default:break;}
return gl.FUNC_ADD;};o3d.State.prototype.push_=function(){this.gl.client.pushState_(this.getVariableMap_());};o3d.State.prototype.pop_=function(){this.gl.client.popState_();};o3d.State.prototype.getVariableMap_=function(){var m={};var stateParams=this.state_params_;for(var name in stateParams){m[name]=stateParams[name].value;}
return m;};o3d.State.relevantValues_=function(gl,names,variable_map,target_map){var found=false;for(var i=0;i<names.length;++i){var name=names[i];if(variable_map[name]!==undefined){found=true;break;}}
if(found){for(var i=0;i<names.length;++i){var name=names[i];var value=variable_map[name];if(value===undefined){value=gl.client.getState_(name);}
target_map[name]=value;}}
return found;};o3d.State.setVariables_=function(gl,variable_map){var v={};if(this.relevantValues_(gl,['AlphaBlendEnable'],variable_map,v)){if(v['AlphaBlendEnable']){gl.enable(gl.BLEND);}else{gl.disable(gl.BLEND);}}
if(this.relevantValues_(gl,['SeparateAlphaBlendEnable','SourceBlendFunction','SourceBlendAlphaFunction','DestinationBlendAlphaFunction','BlendEquation','BlendAlphaEquation'],variable_map,v)){if(v['SeparateAlphaBlendEnable']){gl.blendFuncSeparate(o3d.State.convertBlendFunc_(gl,v['SourceBlendFunction']),o3d.State.convertBlendFunc_(gl,v['DestinationBlendFunction']),o3d.State.convertBlendFunc_(gl,v['SourceBlendAlphaFunction']),o3d.State.convertBlendFunc_(gl,v['DestinationBlendAlphaFunction']));gl.blendEquationSeparate(o3d.State.convertBlendEquation_(gl,v['BlendEquation']),o3d.State.convertBlendEquation_(gl,v['BlendAlphaEquation']));}}
if(this.relevantValues_(gl,['SourceBlendFunction','DestinationBlendFunction'],variable_map,v)){gl.blendFunc(o3d.State.convertBlendFunc_(gl,v['SourceBlendFunction']),o3d.State.convertBlendFunc_(gl,v['DestinationBlendFunction']));}
if(this.relevantValues_(gl,['BlendEquation'],variable_map,v)){gl.blendEquation(o3d.State.convertBlendEquation_(gl,v['BlendEquation']));}
if(this.relevantValues_(gl,['CullMode'],variable_map,v)){switch(v['CullMode']){case o3d.State.CULL_CW:gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);break;case o3d.State.CULL_CCW:gl.enable(gl.CULL_FACE);gl.cullFace(gl.FRONT);break;default:gl.disable(gl.CULL_FACE);break;}}
if(this.relevantValues_(gl,['DitherEnable'],variable_map,v)){if(v['DitherEnable']){gl.enable(gl.DITHER);}else{gl.disable(gl.DITHER);}}
if(this.relevantValues_(gl,['ZEnable','ZComparisonFunction'],variable_map,v)){if(v['ZEnable']){gl.enable(gl.DEPTH_TEST);gl.depthFunc(this.convertCmpFunc_(gl,v['ZComparisonFunction']));}else{gl.disable(gl.DEPTH_TEST);}}
if(this.relevantValues_(gl,['ZWriteEnable'],variable_map,v)){gl.depthMask(v['ZWriteEnable']);}
if(this.relevantValues_(gl,['StencilEnable','StencilComparisonFunction'],variable_map,v)){if(v['StencilEnable']){gl.enable(gl.STENCIL_TEST);gl.stencilFunc(this.convertCmpFunc_(gl,v['StencilComparisonFunction']));}else{gl.disable(gl.STENCIL_TEST);}}
if(this.relevantValues_(gl,['PolygonOffset1','PolygonOffset2'],variable_map,v)){var polygon_offset_factor=v['PolygonOffset1']||0;var polygon_offset_bias=v['PolygonOffset2']||0;if(polygon_offset_factor||polygon_offset_bias){gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(polygon_offset_factor,polygon_offset_bias);}else{gl.disable(gl.POLYGON_OFFSET_FILL);}}
if(this.relevantValues_(gl,['FillMode'],variable_map,v)){gl.fillMode_=v['FillMode'];}};o3d.DrawContext=function(opt_view,opt_projection){o3d.ParamObject.call(this);this.view=opt_view||[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];this.projection=opt_projection||[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];};o3d.inherit('DrawContext','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.DrawContext,'view','ParamMatrix4');o3d.ParamObject.setUpO3DParam_(o3d.DrawContext,'projection','ParamMatrix4');o3d.RayIntersectionInfo=function(){o3d.NamedObject.call(this);o3d.RayIntersectionInfo.prototype.position=[0,0,0];};o3d.inherit('RayIntersectionInfo','NamedObject');o3d.RayIntersectionInfo.prototype.valid=false;o3d.RayIntersectionInfo.prototype.inside=false;o3d.RayIntersectionInfo.prototype.intersected=false;o3d.RayIntersectionInfo.prototype.position=[0,0,0];o3d.RayIntersectionInfo.prototype.primitiveIndex=-1;o3d.Sampler=function(){o3d.ParamObject.call(this);this.addressModeU=o3d.Sampler.WRAP;this.addressModeV=o3d.Sampler.WRAP;this.addressModeW=o3d.Sampler.WRAP;this.magFilter=o3d.Sampler.LINEAR;this.minFilter=o3d.Sampler.LINEAR;this.mipFilter=o3d.Sampler.LINEAR;this.borderColor=[0,0,0,0];this.maxAnisotropy=1;this.texture=null;};o3d.inherit('Sampler','ParamObject');o3d.Sampler.AddressMode=goog.typedef;o3d.Sampler.WRAP=0;o3d.Sampler.MIRROR=1;o3d.Sampler.CLAMP=2;o3d.Sampler.BORDER=3;o3d.Sampler.FilterType=goog.typedef;o3d.Sampler.NONE=0;o3d.Sampler.POINT=1;o3d.Sampler.LINEAR=2;o3d.Sampler.ANISOTROPIC=3;o3d.ParamObject.setUpO3DParam_(o3d.Sampler,'addressModeU','ParamInteger');o3d.ParamObject.setUpO3DParam_(o3d.Sampler,'addressModeV','ParamInteger');o3d.ParamObject.setUpO3DParam_(o3d.Sampler,'addressModeW','ParamInteger');o3d.ParamObject.setUpO3DParam_(o3d.Sampler,'magFilter','ParamInteger');o3d.ParamObject.setUpO3DParam_(o3d.Sampler,'minFilter','ParamInteger');o3d.ParamObject.setUpO3DParam_(o3d.Sampler,'mipFilter','ParamInteger');o3d.ParamObject.setUpO3DParam_(o3d.Sampler,'borderColor','ParamFloat4');o3d.ParamObject.setUpO3DParam_(o3d.Sampler,'maxAnisotropy','ParamInteger');o3d.ParamObject.setUpO3DParam_(o3d.Sampler,'texture','ParamTexture');o3d.Sampler.prototype.convertAddressMode_=function(o3d_mode){var gl_mode=this.gl.REPEAT;switch(o3d_mode){case o3d.Sampler.WRAP:gl_mode=this.gl.REPEAT;break;case o3d.Sampler.MIRROR:gl_mode=this.gl.MIRRORED_REPEAT;break;case o3d.Sampler.CLAMP:gl_mode=this.gl.CLAMP_TO_EDGE;break;case o3d.Sampler.BORDER:default:this.gl.client.error_callback("Unknown/Unavailable Address mode");break;}
return gl_mode;}
o3d.Sampler.prototype.convertMinFilter_=function(o3d_filter,mip_filter){switch(o3d_filter){case o3d.Sampler.NONE:return this.gl.NEAREST;case o3d.Sampler.POINT:if(mip_filter==o3d.Sampler.NONE){return this.gl.NEAREST;}else if(mip_filter==o3d.Sampler.POINT){return this.gl.NEAREST_MIPMAP_NEAREST;}else if(mip_filter==o3d.Sampler.LINEAR){return this.gl.NEAREST_MIPMAP_LINEAR;}else if(mip_filter==o3d.Sampler.ANISOTROPIC){return this.gl.NEAREST_MIPMAP_LINEAR;}
case o3d.Sampler.ANISOTROPIC:case o3d.Sampler.LINEAR:if(mip_filter==o3d.Sampler.NONE){return this.gl.LINEAR;}else if(mip_filter==o3d.Sampler.POINT){return this.gl.LINEAR_MIPMAP_NEAREST;}else if(mip_filter==o3d.Sampler.LINEAR){return this.gl.LINEAR_MIPMAP_LINEAR;}else if(mip_filter==o3d.Sampler.ANISOTROPIC){return this.gl.LINEAR_MIPMAP_LINEAR;}}
this.gl.client.error_callback("Unknown filter.");return this.gl.NONE;}
o3d.Sampler.prototype.convertMagFilter_=function(o3d_filter){switch(o3d_filter){case o3d.Sampler.NONE:case o3d.Sampler.POINT:return this.gl.NEAREST;case o3d.Sampler.LINEAR:case o3d.Sampler.ANISOTROPIC:return this.gl.LINEAR;}
this.gl.client.error_callback("Unknown filter.");return this.gl.LINEAR;}
o3d.Sampler.defaultSampler_=new o3d.Sampler();o3d.Sampler.defaultSampler_.magFilter=o3d.Sampler.POINT;o3d.Sampler.prototype.bindAndSetParameters_=function(opt_isCube){var currentTexture=null;if(this.texture){currentTexture=this.texture;}else if(!this.gl.client.reportErrors_()){if(opt_isCube){currentTexture=this.gl.client.error_texture_cube_;}else{currentTexture=this.gl.client.error_texture_;}}else{currentTexture=this.gl.client.fallback_error_texture_;this.gl.client.error_callback("Missing texture for sampler "+this.name);}
var mip_filter=this.mipFilter;if(currentTexture.levels==1){mip_filter=o3d.Sampler.NONE;}
currentTexture.bindAndSetParameters_(this.convertAddressMode_(this.addressModeU),this.convertAddressMode_(this.addressModeV),this.convertMinFilter_(this.minFilter,mip_filter),this.convertMagFilter_(this.magFilter));}
o3d.Transform=function(opt_localMatrix,opt_worldMatrix,opt_visible,opt_boundingBox,opt_cull){o3d.ParamObject.call(this);this.localMatrix=opt_localMatrix||[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];this.worldMatrix=opt_worldMatrix||[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];this.parent=null;this.visible=opt_visible||true;this.boundingBox=opt_boundingBox||new o3d.BoundingBox([-1,-1,-1],[1,1,1]);this.cull=opt_cull||false;this.children=[];this.shapes=[];};o3d.inherit('Transform','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.Transform,'visible','ParamBoolean');o3d.ParamObject.setUpO3DParam_(o3d.Transform,'worldMatrix','ParamMatrix4');o3d.ParamObject.setUpO3DParam_(o3d.Transform,'localMatrix','ParamMatrix4');o3d.ParamObject.setUpO3DParam_(o3d.Transform,'cull','ParamBoolean');o3d.ParamObject.setUpO3DParam_(o3d.Transform,'boundingBox','ParamBoundingBox');o3d.Transform.prototype.__defineSetter__('parent',function(p){if(this.parent_!=null){o3d.removeFromArray(this.parent_.children,this);}
this.parent_=p;if(p){p.addChild(this);}});o3d.Transform.prototype.__defineGetter__('parent',function(p){return this.parent_;});o3d.Transform.prototype.addChild=function(child){this.children.push(child);};o3d.Transform.prototype.getTransformsInTree=function(){var result=[];o3d.Transform.getTransformInTreeRecursive_(this,result);return result;};o3d.Transform.getTransformInTreeRecursive_=function(treeRoot,children){children.push(treeRoot);var childrenArray=treeRoot.children;for(var ii=0;ii<childrenArray.length;++ii){o3d.Transform.getTransformInTreeRecursive_(childrenArray[ii],children);}};o3d.Transform.prototype.getTransformsByNameInTree=function(name){o3d.notImplemented();};o3d.Transform.prototype.getUpdatedWorldMatrix=function(){var parentWorldMatrix;if(!this.parent){parentWorldMatrix=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];}else{parentWorldMatrix=this.parent.getUpdatedWorldMatrix();}
o3d.Transform.compose(parentWorldMatrix,this.localMatrix,this.worldMatrix);return this.worldMatrix;};o3d.Transform.prototype.addShape=function(shape){this.shapes.push(shape);};o3d.Transform.prototype.removeShape=function(shape){o3d.removeFromArray(this.shapes,shape);};o3d.Transform.prototype.createDrawElements=function(pack,material){var children=this.children;var shapes=this.shapes;for(var i=0;i<shapes.length;++i){shapes[i].createDrawElements(pack,material);}
for(var i=0;i<children.length;++i){children[i].createDrawElements(pack,material);}};o3d.Transform.prototype.identity=function(){var m=this.localMatrix;for(var i=0;i<4;++i){for(var j=0;j<4;++j){m[i][j]=i==j?1:0;}}};o3d.Transform.compose=function(a,b,opt_target){var t=opt_target||a;var a0=a[0];var a1=a[1];var a2=a[2];var a3=a[3];var b0=b[0];var b1=b[1];var b2=b[2];var b3=b[3];var a00=a0[0];var a01=a0[1];var a02=a0[2];var a03=a0[3];var a10=a1[0];var a11=a1[1];var a12=a1[2];var a13=a1[3];var a20=a2[0];var a21=a2[1];var a22=a2[2];var a23=a2[3];var a30=a3[0];var a31=a3[1];var a32=a3[2];var a33=a3[3];var b00=b0[0];var b01=b0[1];var b02=b0[2];var b03=b0[3];var b10=b1[0];var b11=b1[1];var b12=b1[2];var b13=b1[3];var b20=b2[0];var b21=b2[1];var b22=b2[2];var b23=b2[3];var b30=b3[0];var b31=b3[1];var b32=b3[2];var b33=b3[3];t[0].splice(0,4,a00*b00+a10*b01+a20*b02+a30*b03,a01*b00+a11*b01+a21*b02+a31*b03,a02*b00+a12*b01+a22*b02+a32*b03,a03*b00+a13*b01+a23*b02+a33*b03);t[1].splice(0,4,a00*b10+a10*b11+a20*b12+a30*b13,a01*b10+a11*b11+a21*b12+a31*b13,a02*b10+a12*b11+a22*b12+a32*b13,a03*b10+a13*b11+a23*b12+a33*b13);t[2].splice(0,4,a00*b20+a10*b21+a20*b22+a30*b23,a01*b20+a11*b21+a21*b22+a31*b23,a02*b20+a12*b21+a22*b22+a32*b23,a03*b20+a13*b21+a23*b22+a33*b23);t[3].splice(0,4,a00*b30+a10*b31+a20*b32+a30*b33,a01*b30+a11*b31+a21*b32+a31*b33,a02*b30+a12*b31+a22*b32+a32*b33,a03*b30+a13*b31+a23*b32+a33*b33);};o3d.Transform.matricesEqual=function(a,b){if(a==b){return true;}
for(var i=0;i<4;++i){for(var j=0;j<4;++j){if(a[i][j]!=b[i][j]){return false;}}}
return true;};o3d.Transform.transpose=function(m,opt_target){var t=opt_target||m;var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m00=m0[0];var m01=m0[1];var m02=m0[2];var m03=m0[3];var m10=m1[0];var m11=m1[1];var m12=m1[2];var m13=m1[3];var m20=m2[0];var m21=m2[1];var m22=m2[2];var m23=m2[3];var m30=m3[0];var m31=m3[1];var m32=m3[2];var m33=m3[3];t[0].splice(0,4,m00,m10,m20,m30);t[1].splice(0,4,m01,m11,m21,m31);t[2].splice(0,4,m02,m12,m22,m32);t[3].splice(0,4,m03,m13,m23,m33);};o3d.Transform.inverse=function(m,opt_target){var t=opt_target||m;var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m00=m0[0];var m01=m0[1];var m02=m0[2];var m03=m0[3];var m10=m1[0];var m11=m1[1];var m12=m1[2];var m13=m1[3];var m20=m2[0];var m21=m2[1];var m22=m2[2];var m23=m2[3];var m30=m3[0];var m31=m3[1];var m32=m3[2];var m33=m3[3];var tmp_0=m22*m33;var tmp_1=m32*m23;var tmp_2=m12*m33;var tmp_3=m32*m13;var tmp_4=m12*m23;var tmp_5=m22*m13;var tmp_6=m02*m33;var tmp_7=m32*m03;var tmp_8=m02*m23;var tmp_9=m22*m03;var tmp_10=m02*m13;var tmp_11=m12*m03;var tmp_12=m20*m31;var tmp_13=m30*m21;var tmp_14=m10*m31;var tmp_15=m30*m11;var tmp_16=m10*m21;var tmp_17=m20*m11;var tmp_18=m00*m31;var tmp_19=m30*m01;var tmp_20=m00*m21;var tmp_21=m20*m01;var tmp_22=m00*m11;var tmp_23=m10*m01;var t0=(tmp_0*m11+tmp_3*m21+tmp_4*m31)-
(tmp_1*m11+tmp_2*m21+tmp_5*m31);var t1=(tmp_1*m01+tmp_6*m21+tmp_9*m31)-
(tmp_0*m01+tmp_7*m21+tmp_8*m31);var t2=(tmp_2*m01+tmp_7*m11+tmp_10*m31)-
(tmp_3*m01+tmp_6*m11+tmp_11*m31);var t3=(tmp_5*m01+tmp_8*m11+tmp_11*m21)-
(tmp_4*m01+tmp_9*m11+tmp_10*m21);var d=1.0/(m00*t0+m10*t1+m20*t2+m30*t3);t[0].splice(0,4,d*t0,d*t1,d*t2,d*t3);t[1].splice(0,4,d*((tmp_1*m10+tmp_2*m20+tmp_5*m30)-
(tmp_0*m10+tmp_3*m20+tmp_4*m30)),d*((tmp_0*m00+tmp_7*m20+tmp_8*m30)-
(tmp_1*m00+tmp_6*m20+tmp_9*m30)),d*((tmp_3*m00+tmp_6*m10+tmp_11*m30)-
(tmp_2*m00+tmp_7*m10+tmp_10*m30)),d*((tmp_4*m00+tmp_9*m10+tmp_10*m20)-
(tmp_5*m00+tmp_8*m10+tmp_11*m20)));t[2].splice(0,4,d*((tmp_12*m13+tmp_15*m23+tmp_16*m33)-
(tmp_13*m13+tmp_14*m23+tmp_17*m33)),d*((tmp_13*m03+tmp_18*m23+tmp_21*m33)-
(tmp_12*m03+tmp_19*m23+tmp_20*m33)),d*((tmp_14*m03+tmp_19*m13+tmp_22*m33)-
(tmp_15*m03+tmp_18*m13+tmp_23*m33)),d*((tmp_17*m03+tmp_20*m13+tmp_23*m23)-
(tmp_16*m03+tmp_21*m13+tmp_22*m23)));t[3].splice(0,4,d*((tmp_14*m22+tmp_17*m32+tmp_13*m12)-
(tmp_16*m32+tmp_12*m12+tmp_15*m22)),d*((tmp_20*m32+tmp_12*m02+tmp_19*m22)-
(tmp_18*m22+tmp_21*m32+tmp_13*m02)),d*((tmp_18*m12+tmp_23*m32+tmp_15*m02)-
(tmp_22*m32+tmp_14*m02+tmp_19*m12)),d*((tmp_22*m22+tmp_16*m02+tmp_21*m12)-
(tmp_20*m12+tmp_23*m22+tmp_17*m02)));};o3d.Transform.prototype.translate=function(){var v;if(arguments.length==3){v=arguments;}else{v=arguments[0];}
var m=this.localMatrix;var v0=v[0];var v1=v[1];var v2=v[2];var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m00=m0[0];var m01=m0[1];var m02=m0[2];var m03=m0[3];var m10=m1[0];var m11=m1[1];var m12=m1[2];var m13=m1[3];var m20=m2[0];var m21=m2[1];var m22=m2[2];var m23=m2[3];var m30=m3[0];var m31=m3[1];var m32=m3[2];var m33=m3[3];m3.splice(0,4,m00*v0+m10*v1+m20*v2+m30,m01*v0+m11*v1+m21*v2+m31,m02*v0+m12*v1+m22*v2+m32,m03*v0+m13*v1+m23*v2+m33);};o3d.Transform.prototype.rotateX=function(angle){var m=this.localMatrix;var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m10=m1[0];var m11=m1[1];var m12=m1[2];var m13=m1[3];var m20=m2[0];var m21=m2[1];var m22=m2[2];var m23=m2[3];var c=Math.cos(angle);var s=Math.sin(angle);m1.splice(0,4,c*m10+s*m20,c*m11+s*m21,c*m12+s*m22,c*m13+s*m23);m2.splice(0,4,c*m20-s*m10,c*m21-s*m11,c*m22-s*m12,c*m23-s*m13);};o3d.Transform.transformPoint=function(m,v){var v0=v[0];var v1=v[1];var v2=v[2];var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var d=v0*m0[3]+v1*m1[3]+v2*m2[3]+m3[3];return[(v0*m0[0]+v1*m1[0]+v2*m2[0]+m3[0])/d,(v0*m0[1]+v1*m1[1]+v2*m2[1]+m3[1])/d,(v0*m0[2]+v1*m1[2]+v2*m2[2]+m3[2])/d];};o3d.Transform.multiplyVector=function(m,v){var v0=v[0];var v1=v[1];var v2=v[2];var v3=v[3];var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];return[(v0*m0[0]+v1*m1[0]+v2*m2[0]+v3*m3[0]),(v0*m0[1]+v1*m1[1]+v2*m2[1]+v3*m3[1]),(v0*m0[2]+v1*m1[2]+v2*m2[2]+v3*m3[2]),(v0*m0[3]+v1*m1[3]+v2*m2[3]+v3*m3[3])];};o3d.Transform.transformPointZOnly=function(m,v){var v0=v[0];var v1=v[1];var v2=v[2];var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];return(v0*m0[2]+v1*m1[2]+v2*m2[2]+m3[2])/(v0*m0[3]+v1*m1[3]+v2*m2[3]+m3[3]);};o3d.Transform.prototype.rotateY=function(angle){var m=this.localMatrix;var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m00=m0[0];var m01=m0[1];var m02=m0[2];var m03=m0[3];var m20=m2[0];var m21=m2[1];var m22=m2[2];var m23=m2[3];var c=Math.cos(angle);var s=Math.sin(angle);m0.splice(0,4,c*m00-s*m20,c*m01-s*m21,c*m02-s*m22,c*m03-s*m23);m2.splice(0,4,c*m20+s*m00,c*m21+s*m01,c*m22+s*m02,c*m23+s*m03);};o3d.Transform.prototype.rotateZ=function(angle){var m=this.localMatrix;var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m00=m0[0];var m01=m0[1];var m02=m0[2];var m03=m0[3];var m10=m1[0];var m11=m1[1];var m12=m1[2];var m13=m1[3];var c=Math.cos(angle);var s=Math.sin(angle);m0.splice(0,4,c*m00+s*m10,c*m01+s*m11,c*m02+s*m12,c*m03+s*m13);m1.splice(0,4,c*m10-s*m00,c*m11-s*m01,c*m12-s*m02,c*m13-s*m03);};o3d.Transform.prototype.rotateZYX=function(v){var m=this.localMatrix;var sinX=Math.sin(v[0]);var cosX=Math.cos(v[0]);var sinY=Math.sin(v[1]);var cosY=Math.cos(v[1]);var sinZ=Math.sin(v[2]);var cosZ=Math.cos(v[2]);var cosZSinY=cosZ*sinY;var sinZSinY=sinZ*sinY;var r00=cosZ*cosY;var r01=sinZ*cosY;var r02=-sinY;var r10=cosZSinY*sinX-sinZ*cosX;var r11=sinZSinY*sinX+cosZ*cosX;var r12=cosY*sinX;var r20=cosZSinY*cosX+sinZ*sinX;var r21=sinZSinY*cosX-cosZ*sinX;var r22=cosY*cosX;var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m00=m0[0];var m01=m0[1];var m02=m0[2];var m03=m0[3];var m10=m1[0];var m11=m1[1];var m12=m1[2];var m13=m1[3];var m20=m2[0];var m21=m2[1];var m22=m2[2];var m23=m2[3];var m30=m3[0];var m31=m3[1];var m32=m3[2];var m33=m3[3];m0.splice(0,4,r00*m00+r01*m10+r02*m20,r00*m01+r01*m11+r02*m21,r00*m02+r01*m12+r02*m22,r00*m03+r01*m13+r02*m23);m1.splice(0,4,r10*m00+r11*m10+r12*m20,r10*m01+r11*m11+r12*m21,r10*m02+r11*m12+r12*m22,r10*m03+r11*m13+r12*m23);m2.splice(0,4,r20*m00+r21*m10+r22*m20,r20*m01+r21*m11+r22*m21,r20*m02+r21*m12+r22*m22,r20*m03+r21*m13+r22*m23);};o3d.Transform.prototype.axisRotate=function(axis,angle){o3d.Transform.axisRotateMatrix(this.localMatrix,axis,angle);};o3d.Transform.axisRotateMatrix=function(m,axis,angle,opt_target){opt_target=opt_target||m;var x=axis[0];var y=axis[1];var z=axis[2];var n=Math.sqrt(x*x+y*y+z*z);x/=n;y/=n;z/=n;var xx=x*x;var yy=y*y;var zz=z*z;var c=Math.cos(angle);var s=Math.sin(angle);var oneMinusCosine=1-c;var r00=xx+(1-xx)*c;var r01=x*y*oneMinusCosine+z*s;var r02=x*z*oneMinusCosine-y*s;var r10=x*y*oneMinusCosine-z*s;var r11=yy+(1-yy)*c;var r12=y*z*oneMinusCosine+x*s;var r20=x*z*oneMinusCosine+y*s;var r21=y*z*oneMinusCosine-x*s;var r22=zz+(1-zz)*c;var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m00=m0[0];var m01=m0[1];var m02=m0[2];var m03=m0[3];var m10=m1[0];var m11=m1[1];var m12=m1[2];var m13=m1[3];var m20=m2[0];var m21=m2[1];var m22=m2[2];var m23=m2[3];var m30=m3[0];var m31=m3[1];var m32=m3[2];var m33=m3[3];opt_target[0].splice(0,4,r00*m00+r01*m10+r02*m20,r00*m01+r01*m11+r02*m21,r00*m02+r01*m12+r02*m22,r00*m03+r01*m13+r02*m23);opt_target[1].splice(0,4,r10*m00+r11*m10+r12*m20,r10*m01+r11*m11+r12*m21,r10*m02+r11*m12+r12*m22,r10*m03+r11*m13+r12*m23);opt_target[2].splice(0,4,r20*m00+r21*m10+r22*m20,r20*m01+r21*m11+r22*m21,r20*m02+r21*m12+r22*m22,r20*m03+r21*m13+r22*m23);opt_target[3].splice(0,4,m30,m31,m32,m33);};o3d.Transform.prototype.quaternionRotate=function(q){var m=this.localMatrix;var qX=q[0];var qY=q[1];var qZ=q[2];var qW=q[3];var qWqW=qW*qW;var qWqX=qW*qX;var qWqY=qW*qY;var qWqZ=qW*qZ;var qXqW=qX*qW;var qXqX=qX*qX;var qXqY=qX*qY;var qXqZ=qX*qZ;var qYqW=qY*qW;var qYqX=qY*qX;var qYqY=qY*qY;var qYqZ=qY*qZ;var qZqW=qZ*qW;var qZqX=qZ*qX;var qZqY=qZ*qY;var qZqZ=qZ*qZ;var d=qWqW+qXqX+qYqY+qZqZ;o3d.Transform.compose(this.localMatrix,[[(qWqW+qXqX-qYqY-qZqZ)/d,2*(qWqZ+qXqY)/d,2*(qXqZ-qWqY)/d,0],[2*(qXqY-qWqZ)/d,(qWqW-qXqX+qYqY-qZqZ)/d,2*(qWqX+qYqZ)/d,0],[2*(qWqY+qXqZ)/d,2*(qYqZ-qWqX)/d,(qWqW-qXqX-qYqY+qZqZ)/d,0],[0,0,0,1]]);};o3d.Transform.prototype.scale=function(){var v;if(arguments.length==3){v=arguments;}else{v=arguments[0];}
var m=this.localMatrix;var v0=v[0];var v1=v[1];var v2=v[2];var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];m0.splice(0,4,v0*m0[0],v0*m0[1],v0*m0[2],v0*m0[3]);m1.splice(0,4,v1*m1[0],v1*m1[1],v1*m1[2],v1*m1[3]);m2.splice(0,4,v2*m2[0],v2*m2[1],v2*m2[2],v2*m2[3]);};o3d.Transform.flattenMatrix4=function(m){var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];return[m0[0],m0[1],m0[2],m0[3],m1[0],m1[1],m1[2],m1[3],m2[0],m2[1],m2[2],m2[3],m3[0],m3[1],m3[2],m3[3]];};o3d.Transform.prototype.traverse=function(drawListInfos,opt_parentWorldMatrix){this.gl.client.render_stats_['transformsProcessed']++;if(drawListInfos.length==0||!this.visible){return;}
opt_parentWorldMatrix=opt_parentWorldMatrix||[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];o3d.Transform.compose(opt_parentWorldMatrix,this.localMatrix,this.worldMatrix);var remainingDrawListInfos=[];if(this.cull){if(this.boundingBox){for(var i=0;i<drawListInfos.length;++i){var drawListInfo=drawListInfos[i];var worldViewProjection=[[],[],[],[]];o3d.Transform.compose(drawListInfo.context.view,this.worldMatrix,worldViewProjection);o3d.Transform.compose(drawListInfo.context.projection,worldViewProjection,worldViewProjection);if(this.boundingBox.inFrustum(worldViewProjection)){remainingDrawListInfos.push(drawListInfo);}}}}else{remainingDrawListInfos=drawListInfos;}
if(remainingDrawListInfos.length==0){this.gl.client.render_stats_['transformsCulled']++;return;}
var children=this.children;var shapes=this.shapes;for(var i=0;i<shapes.length;++i){shapes[i].writeToDrawLists(remainingDrawListInfos,this.worldMatrix,this);}
for(var i=0;i<children.length;++i){children[i].traverse(remainingDrawListInfos,this.worldMatrix);}};o3d.Pack=function(){o3d.NamedObject.call(this);this.objects_=[];};o3d.inherit('Pack','NamedObject');o3d.Pack.prototype.destroy=function(){this.objects_=[];this.client.destroyPack(this);};o3d.Pack.prototype.removeObject=function(object){o3d.removeFromArray(this.objects_,object);};o3d.Pack.prototype.createObject=function(type_name){var foo=o3d.global.o3d[o3d.filterTypeName_(type_name)];if(typeof foo!='function'){throw'cannot find type in o3d namespace: '+type_name}
var object=new foo();object.gl=this.gl;object.clientId=o3d.Client.nextId++;this.objects_.push(object);return object;};o3d.Pack.prototype.createTexture2D=function(width,height,format,levels,enable_render_surfaces){var texture=this.createObject('Texture2D');texture.init_(width,height,format,levels,enable_render_surfaces);return texture;};o3d.Pack.prototype.createTextureCUBE=function(edgeLength,format,levels,enableRenderSurfaces){var textureCube=this.createObject('TextureCUBE');textureCube.init_(edgeLength,format,levels,enableRenderSurfaces);return textureCube;};o3d.Pack.prototype.createDepthStencilSurface=function(width,height){var surface=this.createObject("RenderDepthStencilSurface");surface.initWithSize_(width,height);return surface;};o3d.Pack.prototype.getObjects=function(name,class_type_name){class_type_name=o3d.filterTypeName_(class_type_name);var found=[];for(var i=0;i<this.objects_.length;++i){var object=this.objects_[i];if(object.isAClassName(class_type_name)&&object.name==name){found.push(object);}}
return found;};o3d.Pack.prototype.getObjectsByClassName=function(class_type_name){class_type_name=o3d.filterTypeName_(class_type_name);var found=[];for(var i=0;i<this.objects_.length;++i){var object=this.objects_[i];if(object.isAClassName(class_type_name)){found.push(object);}}
return found;};o3d.Pack.prototype.objects_=[];o3d.Pack.prototype.createFileRequest=function(type){return this.createObject('FileRequest');};o3d.Pack.prototype.createArchiveRequest=function(){return this.createObject('ArchiveRequest');};o3d.Pack.prototype.createBitmapsFromRawData=function(raw_data){var bitmap=this.createObject('Bitmap')
if(!raw_data.image_){throw('Cannot create bitmap from non-image data.');return[];}
bitmap.height=raw_data.image_.height;bitmap.width=raw_data.image_.width;var canvas=document.createElement('CANVAS');canvas.width=bitmap.width;canvas.height=bitmap.height;var context=canvas.getContext('2d');context.drawImage(raw_data.image_,0,0,bitmap.width,bitmap.height);bitmap.canvas_=canvas;bitmap.flipVerticallyLazily_();bitmap.format=o3d.Texture.ARGB8;bitmap.numMipmaps=1;return[bitmap];};o3d.Pack.prototype.createRawDataFromDataURL=function(data_url){o3d.notImplemented();};o3d.BoundingBox=function(opt_minExtent,opt_maxExtent){o3d.ParamObject.call(this);var minExtent=opt_minExtent||[0,0,0];var maxExtent=opt_maxExtent||[0,0,0];this.minExtent=[minExtent[0],minExtent[1],minExtent[2]];this.maxExtent=[maxExtent[0],maxExtent[1],maxExtent[2]];if(opt_minExtent&&opt_maxExtent){this.valid=true;}};o3d.inherit('BoundingBox','ParamObject');o3d.BoundingBox.prototype.corners_=function(){var result=[];var m=[this.minExtent,this.maxExtent];for(var i=0;i<2;++i){for(var j=0;j<2;++j){for(var k=0;k<2;++k){result.push([m[i][0],m[j][1],m[k][2]]);}}}
return result;};o3d.BoundingBox.fitBoxToPoints_=function(points,opt_targetBox){var target=opt_targetBox||new o3d.BoundingBox();for(var index=0;index<3;++index){target.maxExtent[index]=target.minExtent[index]=points[0][index];for(var i=1;i<points.length;++i){var point=points[i];target.minExtent[index]=Math.min(target.minExtent[index],point[index]);target.maxExtent[index]=Math.max(target.maxExtent[index],point[index]);}}
target.valid=true;return target;};o3d.BoundingBox.prototype.valid=false;o3d.BoundingBox.prototype.minExtent=[0,0,0];o3d.BoundingBox.prototype.maxExtent=[0,0,0];o3d.BoundingBox.prototype.mul=function(matrix){var corners=this.corners_();var new_corners=[];for(var i=0;i<corners.length;++i){new_corners.push(o3d.Transform.transformPoint(matrix,corners[i]));}
return o3d.BoundingBox.fitBoxToPoints_(new_corners);};o3d.BoundingBox.prototype.add=function(box){return new o3d.BoundingBox([Math.min(box.minExtent[0],this.minExtent[0]),Math.min(box.minExtent[1],this.minExtent[1]),Math.min(box.minExtent[2],this.minExtent[2])],[Math.max(box.maxExtent[0],this.maxExtent[0]),Math.max(box.maxExtent[1],this.maxExtent[1]),Math.max(box.maxExtent[2],this.maxExtent[2])]);};o3d.BoundingBox.prototype.intersectRay=function(start,end){if(arguments.length==6){start=[arguments[0],arguments[1],arguments[2]];end=[arguments[3],arguments[4],arguments[5]];}
var result=new o3d.RayIntersectionInfo;if(this.valid){result.valid=true;result.intersected=true;var kNumberOfDimensions=3;var kRight=0;var kLeft=1;var kMiddle=2;var direction=[end[0]-start[0],end[1]-start[1],end[2]-start[2]];var coord=[0,0,0];var inside=true;var quadrant=[];var max_t=[];var candidate_plane=[];for(var i=0;i<kNumberOfDimensions;++i){quadrant.push(0.0);max_t.push(0.0);candidate_plane.push(0,0);}
var which_plane;for(var i=0;i<kNumberOfDimensions;++i){if(start[i]<this.minExtent[i]){quadrant[i]=kLeft;candidate_plane[i]=this.minExtent[i];inside=false;}else if(start[i]>this.maxExtent[i]){quadrant[i]=kRight;candidate_plane[i]=this.maxExtent[i];inside=false;}else{quadrant[i]=kMiddle;}}
if(inside){result.position=start;result.inside=true;}else{for(var i=0;i<kNumberOfDimensions;++i){if(quadrant[i]!=kMiddle&&direction[i]!=0.0){max_t[i]=(candidate_plane[i]-start[i])/direction[i];}else{max_t[i]=-1.0;}}
which_plane=0;for(var i=1;i<kNumberOfDimensions;++i){if(max_t[which_plane]<max_t[i]){which_plane=i;}}
if(max_t[which_plane]<0.0){result.intersected=false;}else{for(var i=0;i<kNumberOfDimensions;++i){if(which_plane!=i){coord[i]=start[i]+max_t[which_plane]*direction[i];if(coord[i]<this.minExtent[i]||coord[i]>this.maxExtent[i]){result.intersected=false;break;}}else{coord[i]=candidate_plane[i];}}
result.position=coord;}}}
return result;};o3d.BoundingBox.prototype.inFrustum=function(matrix){var corners=this.corners_();var bb_test=0x3f;for(var i=0;i<corners.length;++i){var corner=corners[i];var p=o3d.Transform.transformPoint(matrix,corner);bb_test&=(((p[0]>1.0)<<0)|((p[0]<-1.0)<<1)|((p[1]>1.0)<<2)|((p[1]<-1.0)<<3)|((p[2]>1.0)<<4)|((p[2]<0.0)<<5));if(bb_test==0){return true;}}
return(bb_test==0);};o3d.DrawElement=function(opt_material){o3d.ParamObject.call(this);this.material=opt_material||null;this.owner_=null;};o3d.inherit('DrawElement','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.DrawElement,'material','ParamMaterial');o3d.Element=function(opt_material,opt_boundingBox,opt_zSortPoint,opt_cull){o3d.ParamObject.call(this);this.material=opt_material;this.boundingBox=opt_boundingBox||new o3d.BoundingBox([-1,-1,-1],[1,1,1]);this.zSortPoint=opt_zSortPoint||[0,0,0];this.priority=0;this.cull=opt_cull||false;this.owner_=null;this.drawElements=[];};o3d.inherit('Element','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.Element,'material','ParamMaterial');o3d.ParamObject.setUpO3DParam_(o3d.Element,'boundingBox','ParamBoundingBox');o3d.ParamObject.setUpO3DParam_(o3d.Element,'zSortPoint','ParamFloat3');o3d.ParamObject.setUpO3DParam_(o3d.Element,'priority','ParamFloat');o3d.ParamObject.setUpO3DParam_(o3d.Element,'cull','ParamBoolean');o3d.Element.prototype.__defineSetter__('owner',function(o){this.owner_=o;o.addElement(this);});o3d.Element.prototype.__defineGetter__('owner',function(){return this.owner_;});o3d.Element.prototype.createDrawElement=function(pack,material){drawElement=pack.createObject('DrawElement');drawElement.owner=this;drawElement.material=material;this.drawElements.push(drawElement);return drawElement;};o3d.Element.prototype.intersectRay=function(position_stream_index,cull,start,end){o3d.notImplemented();};o3d.Element.prototype.getBoundingBox=function(position_stream_index){return this.boundingBox;};o3d.Element.prototype.render=function(){};o3d.Field=function(){o3d.NamedObject.call(this);};o3d.inherit('Field','NamedObject');o3d.Field.prototype.numComponents=0;o3d.Field.prototype.buffer=null;o3d.Field.prototype.offset_=0;o3d.Field.prototype.size=0;o3d.Field.prototype.setAt=function(start_index,values){this.buffer.lock();var l=values.length/this.numComponents;for(var i=0;i<l;++i){for(var c=0;c<this.numComponents;++c){this.buffer.array_[(start_index+i)*this.buffer.totalComponents+this.offset_+c]=values[this.numComponents*i+c];}}
this.buffer.unlock();return true;};o3d.Field.prototype.getAt=function(start_index,num_elements){return this.buffer.getAtHelper_(start_index,num_elements,this.offset_,this.numComponents);};o3d.FloatField=function(){o3d.Field.call(this);};o3d.inherit('FloatField','Field');o3d.UInt32Field=function(){o3d.Field.call(this);};o3d.inherit('UInt32Field','Field');o3d.UByteNField=function(){o3d.Field.call(this);};o3d.inherit('UByteNField','Field');o3d.Buffer=function(){this.fields=[];this.array_=null;};o3d.inherit('Buffer','NamedObject');o3d.Buffer.prototype.fields=[];o3d.Buffer.prototype.totalComponents=0;o3d.Buffer.prototype.gl_buffer_=0;o3d.Buffer.prototype.createArray=function(numElements){return new Float32Array(numElements);};o3d.Buffer.prototype.__defineGetter__('numElements',function(){return(!this.array_)?0:this.array_.length/this.totalComponents;});o3d.Buffer.prototype.updateTotalComponents_=function(){var total=0;for(var i=0;i<this.fields.length;++i){this.fields[i].offset_=total;total+=this.fields[i].numComponents;}
this.totalComponents=total;};o3d.Buffer.prototype.allocateElements=function(numElements){this.updateTotalComponents_();this.resize(numElements*this.totalComponents);};o3d.Buffer.prototype.resize=function(numElements){this.gl_buffer_=this.gl.createBuffer();this.array_=this.createArray(Math.floor(numElements));};o3d.Buffer.prototype.createField=function(fieldType,numComponents){var alreadyAllocated=this.array_&&this.array_.length>0;var savedData=[];var numElements=this.numElements;if(alreadyAllocated){for(var i=0;i<this.fields.length;i++){savedData[i]=this.fields[i].getAt(0,numElements);}}
var f=new o3d.Field();f.buffer=this;f.numComponents=numComponents;f.size=numComponents*(fieldType=='UByteNField'?1:4);this.fields.push(f);this.updateTotalComponents_();if(alreadyAllocated){this.allocateElements(numElements);for(var i=0;i<this.fields.length;i++){var fieldData=savedData[i];if(fieldData){this.fields[i].setAt(0,fieldData);}}}
return f;};o3d.Buffer.prototype.removeField=function(field){o3d.removeFromArray(this.fields,field);this.updateTotalComponents_();};o3d.Buffer.prototype.getAtHelper_=function(start_index,num_elements,offset,num_components){var values=[];for(var i=0;i<num_elements;++i){for(var c=0;c<num_components;++c){values.push(this.array_[(start_index+i)*this.totalComponents+offset+c]);}}
return values;};o3d.Buffer.prototype.lock=function(){};o3d.Buffer.prototype.unlock=function(){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.gl_buffer_);this.gl.bufferData(this.gl.ARRAY_BUFFER,this.array_,this.gl.STATIC_DRAW);};o3d.Buffer.prototype.set=function(values){if(!values.length){o3d.notImplemented();}
if(this.array_==null||this.array_.length!=values.length){this.resize(values.length);}
this.lock();for(var i=0;i<values.length;++i){this.array_[i]=values[i];}
this.unlock();};o3d.VertexBufferBase=function(){o3d.Buffer.call(this);};o3d.inherit('VertexBufferBase','Buffer');o3d.VertexBufferBase.prototype.get=function(){return this.getAtHelper_(0,this.numElements,0,this.totalComponents);};o3d.VertexBufferBase.prototype.getAt=function(start_index,num_elements){return this.getAtHelper_(start_index,num_elements,0,this.totalComponents);};o3d.VertexBuffer=function(){o3d.Buffer.call(this);};o3d.inherit('VertexBuffer','Buffer');o3d.VertexBuffer.prototype.className="o3d.VertexBuffer";o3d.SourceBuffer=function(){o3d.Buffer.call(this);};o3d.inherit('SourceBuffer','Buffer');o3d.IndexBuffer=function(){o3d.Buffer.call(this);};o3d.inherit('IndexBuffer','Buffer');o3d.IndexBuffer.prototype.createArray=function(numElements){return new Uint16Array(numElements);};o3d.IndexBuffer.prototype.unlock=function(){this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,this.gl_buffer_);this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,this.array_,this.gl.STATIC_DRAW);};o3d.Stream=function(semantic,semantic_index,field,start_index){o3d.NamedObject.call(this);this.semantic=semantic;this.semanticIndex=semantic_index;this.field=field;this.startIndex=start_index;};o3d.inherit('Stream','NamedObject');o3d.Stream.Semantic=goog.typedef;o3d.Stream.UNKNOWN_SEMANTIC=0;o3d.Stream.POSITION=1;o3d.Stream.NORMAL=2;o3d.Stream.TANGENT=3;o3d.Stream.BINORMAL=4;o3d.Stream.COLOR=5;o3d.Stream.TEXCOORD=6;o3d.Stream.INFLUENCE_WEIGHTS=7;o3d.Stream.INFLUENCE_INDICES=8;o3d.Stream.prototype.field=null;o3d.Stream.prototype.semantic=o3d.Stream.UNKNOWN_SEMANTIC;o3d.Stream.prototype.semanticIndex=0;o3d.Stream.prototype.startIndex=0;o3d.Stream.prototype.getMaxVertices_=function(){var buffer=this.field.buffer;if(!buffer)
return 0;var num_elements=buffer.numElements;if(this.startIndex>num_elements)
return 0;return num_elements-this.startIndex;};
o3d.VertexSource=function(){o3d.ParamObject.call(this);};o3d.inherit('VertexSource','ParamObject');o3d.VertexSource.prototype.bindStream=function(source,semantic,semantic_index){if(source){var source_param=source.getVertexStreamParam(semantic,semantic_index);var dest_param=this.getVertexStreamParam(semantic,semantic_index);if(source_param&&dest_param&&source_param.stream.field.className==dest_param.stream.field.className&&source_param.stream.field.numComponents==dest_param.stream.field.numComponents){dest_param.bind(source_param);source.streamWasBound_(this,semantic,semantic_index);return true;}}
return false;};o3d.VertexSource.prototype.unbindStream=function(semantic,semantic_index){var dest_param=this.getVertexStreamParam(semantic,semantic_index);if(dest_param&&dest_param.inputConnection!=null){dest_param.unbindInput();return true;}
return false;};o3d.VertexSource.prototype.getVertexStreamParam=function(semantic,semantic_index){o3d.notImplemented();};o3d.VertexSource.prototype.streamWasBound_=function(dest,semantic,semantic_index){};o3d.StreamBank=function(){o3d.VertexSource.call(this);this.vertex_streams_=[];};o3d.inherit('StreamBank','VertexSource');o3d.StreamBank.prototype.vertex_streams_=[];o3d.StreamBank.prototype.__defineGetter__('vertexStreams',function(){var result=[];for(var i=0;i<this.vertex_streams_.length;++i){var stream_array=this.vertex_streams_[i];if(stream_array&&stream_array.length){for(var j=0;j<stream_array.length;++j){var stream=stream_array[j];if(stream){result.push(stream.stream);}}}}
return result;});o3d.StreamBank.prototype.setVertexStream=function(semantic,semantic_index,field,start_index){if(this.vertex_streams_[semantic]==undefined){this.vertex_streams_[semantic]=[];}
var stream=new o3d.Stream(semantic,semantic_index,field,start_index);var stream_param=new o3d.ParamVertexBufferStream;stream_param.stream=stream;stream_param.owner_=this;this.vertex_streams_[semantic][semantic_index]=stream_param;};o3d.StreamBank.prototype.getVertexStream=function(semantic,semantic_index){if(this.vertex_streams_[semantic]==undefined){return null;}
if(!this.vertex_streams_[semantic][semantic_index]){return null;}
return this.vertex_streams_[semantic][semantic_index].stream;};o3d.StreamBank.prototype.getVertexStreamParam=function(semantic,semantic_index){if(this.vertex_streams_[semantic]==undefined){return null;}
return this.vertex_streams_[semantic][semantic_index];};o3d.StreamBank.prototype.removeVertexStream=function(semantic,semantic_index){if(this.vertex_streams_[semantic]==undefined){return false;}
delete this.vertex_streams_[semantic][semantic_index];return true;};o3d.Primitive=function(opt_streamBank){o3d.Element.call(this);this.indexBuffer=null;this.streamBank=opt_streamBank||null;this.primitiveType=o3d.Primitive.TRIANGLELIST;this.numberVertices=0;this.numberPrimitives=0;this.startIndex=0;this.wireframeIndexBuffer_=null;};o3d.inherit('Primitive','Element');o3d.Primitive.Type=goog.typedef;o3d.Primitive.POINTLIST=1;o3d.Primitive.LINELIST=2;o3d.Primitive.LINESTRIP=3;o3d.Primitive.TRIANGLELIST=4;o3d.Primitive.TRIANGLESTRIP=5;o3d.Primitive.TRIANGLEFAN=6;o3d.ParamObject.setUpO3DParam_(o3d.Primitive,'streamBank','ParamStreamBank');o3d.Primitive.prototype.render=function(){var streamBank=this.streamBank;var indexBuffer=this.indexBuffer;var enabled_attribs=[];for(var semantic=0;semantic<streamBank.vertex_streams_.length;++semantic){var streams=streamBank.vertex_streams_[semantic];if(streams&&streams.length){for(var semantic_index=0;semantic_index<streams.length;++semantic_index){var gl_index=o3d.Effect.reverseSemanticMap_[semantic][semantic_index];var stream=streams[semantic_index].stream;var field=stream.field;var buffer=field.buffer;if(gl_index==undefined){this.gl.client.error_callback('uknown semantic');}
var stream_param=streams[semantic_index];while(!stream_param.owner_.updateStreams&&stream_param.inputConnection){stream_param=stream_param.inputConnection;}
if(stream_param.owner_.updateStreams){stream_param.owner_.updateStreams();}
this.gl.bindBuffer(this.gl.ARRAY_BUFFER,buffer.gl_buffer_);this.gl.enableVertexAttribArray(gl_index);enabled_attribs.push(gl_index);var kFloatSize=Float32Array.BYTES_PER_ELEMENT;this.gl.vertexAttribPointer(gl_index,field.numComponents,this.gl.FLOAT,false,buffer.totalComponents*kFloatSize,field.offset_*kFloatSize);}}}
this.gl.client.render_stats_['primitivesRendered']+=this.numberPrimitives;var glMode;var glNumElements;switch(this.primitiveType){case o3d.Primitive.POINTLIST:glMode=this.gl.POINTS;glNumElements=this.numberPrimitives;break;case o3d.Primitive.LINELIST:glMode=this.gl.LINES;glNumElements=this.numberPrimitives*2;break;case o3d.Primitive.LINESTRIP:glMode=this.gl.LINE_STRIP;glNumElements=this.numberPrimitives+1;break;case o3d.Primitive.TRIANGLELIST:glMode=this.gl.TRIANGLES;glNumElements=this.numberPrimitives*3;break;case o3d.Primitive.TRIANGLESTRIP:glMode=this.gl.TRIANGLE_STRIP;glNumElements=this.numberPrimitives+2;break;case o3d.Primitive.TRIANGLEFAN:glMode=this.gl.TRIANGLE_FAN;glNumElements=this.numberPrimitives+2;break;case o3d.Primitive.TRIANGLELIST:default:glMode=this.gl.TRIANGLES;glNumElements=this.numberPrimitives*3;break;}
var use_wireframe_indices=false;if(this.gl.fillMode_==o3d.State.POINT){glMode=this.gl.POINTS;}else if(this.gl.fillMode_==o3d.State.WIREFRAME){if(this.primitiveType==o3d.Primitive.TRIANGLELIST||this.primitiveType==o3d.Primitive.TRIANGLEFAN||this.primitiveType==o3d.Primitive.TRIANGLESTRIP){use_wireframe_indices=true;glMode=this.gl.LINES;this.computeWireframeIndices_();}}
if(use_wireframe_indices){indexBuffer=this.wireframeIndexBuffer_;switch(this.primitiveType){default:case o3d.Primitive.TRIANGLELIST:glNumElements=this.numberPrimitives*6;break;case o3d.Primitive.TRIANGLESTRIP:case o3d.Primitive.TRIANGLEFAN:glNumElements=(this.numberPrimitives==0)?0:this.numberPrimitives*4+2;break;}}
if(!indexBuffer){this.gl.drawArrays(glMode,0,glNumElements);}else{this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,indexBuffer.gl_buffer_);this.gl.drawElements(glMode,glNumElements,this.gl.UNSIGNED_SHORT,0);}
for(var i=0;i<enabled_attribs.length;++i){this.gl.disableVertexAttribArray(enabled_attribs[i]);}};o3d.Primitive.prototype.getIndex_=function(n){if(this.indexBuffer){return this.indexBuffer.array_[n]}
return n;};o3d.Primitive.prototype.computeWireframeIndices_=function(){this.wireframeIndexBuffer_=new o3d.IndexBuffer;this.wireframeIndexBuffer_.gl=this.gl;var numTriangles=this.numberPrimitives;var numLines=(this.primitiveType==o3d.Primitive.TRIANGLELIST)?(3*numTriangles):(2*numTriangles+1);this.wireframeIndexBuffer_.resize(2*numLines);var j=0;switch(this.primitiveType){default:case o3d.Primitive.TRIANGLELIST:{var wireframeIndices=this.wireframeIndexBuffer_.array_;this.wireframeIndexBuffer_.lock();for(var i=0;i<numTriangles;++i){var a=this.getIndex_(3*i);var b=this.getIndex_(3*i+1);var c=this.getIndex_(3*i+2);wireframeIndices[j++]=a;wireframeIndices[j++]=b;wireframeIndices[j++]=b;wireframeIndices[j++]=c;wireframeIndices[j++]=c;wireframeIndices[j++]=a;}
this.wireframeIndexBuffer_.unlock();}
break;case o3d.Primitive.TRIANGLEFAN:{var wireframeIndices=this.wireframeIndexBuffer_.array_;this.wireframeIndexBuffer_.lock();var z;if(numTriangles>0){z=this.getIndex_(0);wireframeIndices[j++]=z;wireframeIndices[j++]=this.getIndex_(1);}
for(var i=2;i<numTriangles+2;++i){var a=this.getIndex_(i);wireframeIndices[j++]=z;wireframeIndices[j++]=a;wireframeIndices[j++]=a;wireframeIndices[j++]=this.getIndex_(i-1);}
this.wireframeIndexBuffer_.unlock();}
break;case o3d.Primitive.TRIANGLESTRIP:{var wireframeIndices=this.wireframeIndexBuffer_.array_;this.wireframeIndexBuffer_.lock();var a;var b;if(numTriangles>0){a=this.getIndex_(0);b=this.getIndex_(1);wireframeIndices[j++]=a;wireframeIndices[j++]=b;}
for(var i=2;i<numTriangles+2;++i){var c=this.getIndex_(i);wireframeIndices[j++]=b;wireframeIndices[j++]=c;wireframeIndices[j++]=c;wireframeIndices[j++]=a;a=b;b=c;}
this.wireframeIndexBuffer_.unlock();}
break;}};o3d.Primitive.prototype.computeTriangleIndices_=function(n){var indices;switch(this.primitiveType){case o3d.Primitive.TRIANGLESTRIP:if(n%2==0){indices=[n,n+1,n+2];}else{indices=[n+1,n,n+2];}
break;case o3d.Primitive.TRIANGLEFAN:indices=[0,n+1,n+2];break;case o3d.Primitive.TRIANGLELIST:default:indices=[3*n,3*n+1,3*n+2];break;}
if(this.indexBuffer){var buffer=this.indexBuffer.array_;return[buffer[indices[0]],buffer[indices[1]],buffer[indices[2]]];}else{return indices;}};o3d.Primitive.prototype.intersectRay=function(position_stream_index,cull,start,end){var result=new o3d.RayIntersectionInfo;result.valid=true;var streamBank=this.streamBank;var indexBuffer=this.indexBuffer;var positionStreams=this.streamBank.vertex_streams_[o3d.Stream.POSITION];var stream=positionStreams[position_stream_index].stream;var field=stream.field;var buffer=field.buffer;var numPoints=buffer.array_.length/buffer.totalComponents;var elements=field.getAt(0,numPoints);var x=end[0]-start[0];var y=end[1]-start[1];var z=end[2]-start[2];var direction=[x,y,z];var ux=-y;var uy=x;var uz=0;if(x*x+y*y<z*z){ux=-z;uy=0;uz=x;}
var vx=y*uz-z*uy;var vy=z*ux-x*uz;var vz=x*uy-y*ux;var udotstart=ux*start[0]+uy*start[1]+uz*start[2];var vdotstart=vx*start[0]+vy*start[1]+vz*start[2];var min_distance=0;var numIndices=indexBuffer?indexBuffer.array_.length:numPoints;switch(this.primitiveType){case o3d.Primitive.TRIANGLESTRIP:numTriangles=numIndices-2;break;case o3d.Primitive.TRIANGLEFAN:numTriangles=numIndices-2;break;case o3d.Primitive.TRIANGLELIST:default:numTriangles=numIndices/3;break;}
for(var i=0;i<numTriangles;++i){var indices=this.computeTriangleIndices_(i);var u_sides=[false,false,false];var v_sides=[false,false,false];for(var j=0;j<3;++j){var t=3*indices[j];var r=elements.slice(t,t+3);u_sides[j]=ux*r[0]+uy*r[1]+uz*r[2]-udotstart>0;v_sides[j]=vx*r[0]+vy*r[1]+vz*r[2]-vdotstart>0;}
if(((u_sides[0]==u_sides[1])&&(u_sides[0]==u_sides[2]))||((v_sides[0]==v_sides[1])&&(v_sides[0]==v_sides[2]))){continue;}
var t;t=3*indices[0];var m00=elements[t]-start[0];var m01=elements[t+1]-start[1];var m02=elements[t+2]-start[2];t=3*indices[1];var m10=elements[t]-start[0];var m11=elements[t+1]-start[1];var m12=elements[t+2]-start[2];t=3*indices[2];var m20=elements[t]-start[0];var m21=elements[t+1]-start[1];var m22=elements[t+2]-start[2];var t00=m11*m22-m12*m21;var t10=m01*m22-m02*m21;var t20=m01*m12-m02*m11;var d=m00*t00-m10*t10+m20*t20;if((cull==o3d.State.CULL_CW&&d<0)||(cull==o3d.State.CULL_CCW&&d>0)){continue;}
var v0=(t00*x-
(m10*m22-m12*m20)*y+
(m10*m21-m11*m20)*z)/d;var v1=(-t10*x+
(m00*m22-m02*m20)*y-
(m00*m21-m01*m20)*z)/d;var v2=(t20*x-
(m00*m12-m02*m10)*y+
(m00*m11-m01*m10)*z)/d;if(v0>=0&&v1>=0&&v2>=0&&(v0+v1+v2>0)){var one_norm=v0+v1+v2;v0/=one_norm;v1/=one_norm;v2/=one_norm;var px=m00*v0+m10*v1+m20*v2;var py=m01*v0+m11*v1+m21*v2;var pz=m02*v0+m12*v1+m22*v2;var distance=px*px+py*py+pz*pz;if(!result.intersected||distance<min_distance){min_distance=distance;result.position[0]=px+start[0];result.position[1]=py+start[1];result.position[2]=pz+start[2];result.primitiveIndex=i;}
result.intersected=true;}}
return result;};o3d.Primitive.prototype.getBoundingBox=function(position_stream_index){var streamBank=this.streamBank;var indexBuffer=this.indexBuffer;var stream=this.streamBank.getVertexStream(o3d.Stream.POSITION,position_stream_index);var points=[];var field=stream.field;var buffer=field.buffer;var numPoints=buffer.array_.length/buffer.totalComponents;var elements=field.getAt(0,numPoints);for(var index=0;index<numPoints;++index){var p=[0,0,0];for(var i=0;i<field.numComponents;++i){p[i]=elements[field.numComponents*index+i];}
points.push(p);}
o3d.BoundingBox.fitBoxToPoints_(points,this.boundingBox);return this.boundingBox;};o3d.Shape=function(){o3d.ParamObject.call(this);this.elements=[];};o3d.inherit('Shape','ParamObject');o3d.Shape.prototype.elements=[];o3d.Shape.findDrawElementWithMaterial_=function(drawElements,material){for(var j=0;j<drawElements.length;++j){if(drawElements[j].material==material){return drawElements[j];}}
return null;};o3d.Shape.prototype.createDrawElements=function(pack,material){var elements=this.elements;for(var i=0;i<elements.length;++i){var element=elements[i];if(!o3d.Shape.findDrawElementWithMaterial_(element.drawElements,material)){element.createDrawElement(pack,material);}}};o3d.Shape.prototype.addElement=function(element){this.elements.push(element);};o3d.Shape.prototype.removeElement=function(element){o3d.removeFromArray(this.elements,element);};o3d.Shape.prototype.writeToDrawLists=function(drawListInfos,world,transform){var elements=this.elements;for(var i=0;i<elements.length;++i){var element=elements[i];for(var j=0;j<element.drawElements.length;++j){this.gl.client.render_stats_['drawElementsProcessed']++;var drawElement=element.drawElements[j];var material=drawElement.material||drawElement.owner.material;var materialDrawList=material.drawList;var rendered=false;for(var k=0;k<drawListInfos.length;++k){var drawListInfo=drawListInfos[k];var list=drawListInfo.list;if(materialDrawList==list){var context=drawListInfo.context;var view=context.view;var projection=context.projection;var worldViewProjection=[[],[],[],[]];var viewProjection=[[],[],[],[]];o3d.Transform.compose(projection,view,viewProjection);o3d.Transform.compose(viewProjection,world,worldViewProjection);if(element.cull&&element.boundingBox){if(!element.boundingBox.inFrustum(worldViewProjection)){continue;}}
rendered=true;list.list_.push({view:view,projection:projection,world:world,viewProjection:viewProjection,worldViewProjection:worldViewProjection,transform:transform,drawElement:drawElement});}}
if(rendered){this.gl.client.render_stats_['drawElementsRendered']++;}else{this.gl.client.render_stats_['drawElementsCulled']++;}}}};o3d.EffectParameterInfo=function(name,className,numElements,semantic,sasClassName){this.name=name||'';this.className=className||'';this.numElements=numElements||0;this.semantic=semantic||'';this.sasClassName=sasClassName||'';};o3d.inherit('EffectParameterInfo','NamedObject');o3d.EffectStreamInfo=function(opt_semantic,opt_semantic_index){o3d.NamedObject.call(this);if(!opt_semantic){opt_semantic=o3d.Stream.UNKNOWN_SEMANTIC;}
if(!opt_semantic_index){opt_semantic_index=0;}
this.semantic=opt_semantic;this.opt_semantic_index=opt_semantic_index;};o3d.inherit('EffectStreamInfo','NamedObject');o3d.EffectStreamInfo.prototype.semantic=o3d.Stream.UNKNOWN_SEMANTIC;o3d.EffectStreamInfo.prototype.semanticIndex=0;o3d.Effect=function(){o3d.ParamObject.call(this);this.program_=null;this.uniforms_={};this.attributes_={};};o3d.inherit('Effect','ParamObject');o3d.Effect.HELPER_CONSTANT_NAME='dx_clipping';o3d.Effect.prototype.uniforms_={};o3d.Effect.prototype.attributes_={};o3d.Effect.prototype.vertexShaderLoaded_=false;o3d.Effect.prototype.fragmentShaderLoaded_=false;o3d.Effect.prototype.bindAttributesAndLinkIfReady=function(){if(this.vertexShaderLoaded_&&this.fragmentShaderLoaded_){var semanticMap=o3d.Effect.semanticMap_;for(var name in semanticMap){this.gl.bindAttribLocation(this.program_,semanticMap[name].gl_index,name);}
this.gl.linkProgram(this.program_);if(!this.gl.getProgramParameter(this.program_,this.gl.LINK_STATUS)){var log=this.gl.getShaderInfoLog(this.program_);this.gl.client.error_callback('Program link failed with error log:\n'+log);}
this.getUniforms_();this.getAttributes_();}};o3d.Effect.prototype.loadShaderFromString=function(shaderString,type){if(!this.program_){this.program_=this.gl.createProgram();}
var success=true;var shader=this.gl.createShader(type);this.gl.shaderSource(shader,"#ifdef GL_ES\nprecision highp float;\n#endif\n"+shaderString);this.gl.compileShader(shader);if(!this.gl.getShaderParameter(shader,this.gl.COMPILE_STATUS)){success=false;var log=this.gl.getShaderInfoLog(shader);this.gl.client.error_callback('Shader compile failed with error log:\n'+log);}
this.gl.attachShader(this.program_,shader);return success;};o3d.Effect.prototype.loadVertexShaderFromString=function(shaderString){var success=this.loadShaderFromString(shaderString,this.gl.VERTEX_SHADER);this.vertexShaderLoaded_=success;o3d.Effect.prototype.bindAttributesAndLinkIfReady();return success;};o3d.Effect.prototype.loadPixelShaderFromString=function(shaderString){var success=this.loadShaderFromString(shaderString,this.gl.FRAGMENT_SHADER);this.fragmentShaderLoaded_=success;this.bindAttributesAndLinkIfReady();return success;};o3d.Effect.prototype.loadFromFXString=function(shaderString){var splitIndex=shaderString.indexOf('// #o3d SplitMarker');return this.loadVertexShaderFromString(shaderString.substr(0,splitIndex))&&this.loadPixelShaderFromString(shaderString.substr(splitIndex));};o3d.Effect.prototype.getParamArrayNames_=function(base,size){var names=[];for(var i=0;i<size;i++){names[i]=base+'['+i+']';}
return names;}
o3d.Effect.prototype.getUniforms_=function(){this.uniforms_={};var numUniforms=this.gl.getProgramParameter(this.program_,this.gl.ACTIVE_UNIFORMS);for(var i=0;i<numUniforms;++i){var info=this.gl.getActiveUniform(this.program_,i);var name=info.name;if(name.indexOf('[')!=-1){var baseName=info.name.substring(0,info.name.indexOf('['));var names=this.getParamArrayNames_(baseName,info.size);var locations=[];for(var j=0;j<names.length;j++){locations[j]=this.gl.getUniformLocation(this.program_,names[j]);}
this.uniforms_[baseName]={info:{name:baseName,size:info.size,type:info.type},kind:o3d.Effect.ARRAY,locations:locations};}else{this.uniforms_[name]={info:info,kind:o3d.Effect.ELEMENT,location:this.gl.getUniformLocation(this.program_,name)};}}};o3d.Effect.prototype.getAttributes_=function(){this.attributes_={};var numAttributes=this.gl.getProgramParameter(this.program_,this.gl.ACTIVE_ATTRIBUTES);for(var i=0;i<numAttributes;++i){var info=this.gl.getActiveAttrib(this.program_,i);this.attributes_[info.name]={info:info,location:this.gl.getAttribLocation(this.program_,info.name)};}};o3d.Effect.paramTypes_=null;o3d.Effect.getParamTypes_=function(gl){if(!o3d.Effect.paramTypes_){o3d.Effect.paramTypes_={};o3d.Effect.paramTypes_[gl.FLOAT]='ParamFloat';o3d.Effect.paramTypes_[gl.FLOAT_VEC2]='ParamFloat2';o3d.Effect.paramTypes_[gl.FLOAT_VEC3]='ParamFloat3';o3d.Effect.paramTypes_[gl.FLOAT_VEC4]='ParamFloat4';o3d.Effect.paramTypes_[gl.INT]='ParamInteger';o3d.Effect.paramTypes_[gl.BOOL]='ParamBoolean';o3d.Effect.paramTypes_[gl.FLOAT_MAT4]='ParamMatrix4';o3d.Effect.paramTypes_[gl.SAMPLER_2D]='ParamSampler';o3d.Effect.paramTypes_[gl.SAMPLER_CUBE]='ParamSampler';}
return o3d.Effect.paramTypes_;}
o3d.Effect.semanticMap_={'position':{semantic:o3d.Stream.POSITION,index:0,gl_index:0},'normal':{semantic:o3d.Stream.NORMAL,index:0,gl_index:1},'tangent':{semantic:o3d.Stream.TANGENT,index:0,gl_index:2},'binormal':{semantic:o3d.Stream.BINORMAL,index:0,gl_index:3},'color':{semantic:o3d.Stream.COLOR,index:0,gl_index:4},'texCoord0':{semantic:o3d.Stream.TEXCOORD,index:0,gl_index:5},'texCoord1':{semantic:o3d.Stream.TEXCOORD,index:1,gl_index:6},'texCoord2':{semantic:o3d.Stream.TEXCOORD,index:2,gl_index:7},'texCoord3':{semantic:o3d.Stream.TEXCOORD,index:3,gl_index:8},'texCoord4':{semantic:o3d.Stream.TEXCOORD,index:4,gl_index:9},'texCoord5':{semantic:o3d.Stream.TEXCOORD,index:5,gl_index:10},'texCoord6':{semantic:o3d.Stream.TEXCOORD,index:6,gl_index:11},'texCoord7':{semantic:o3d.Stream.TEXCOORD,index:7,gl_index:12},'influenceWeights':{semantic:o3d.Stream.INFLUENCE_WEIGHTS,index:0,gl_index:13},'influenceIndices':{semantic:o3d.Stream.INFLUENCE_INDICES,index:0,gl_index:14}};o3d.Effect.reverseSemanticMap_=[];(function(){var revmap=o3d.Effect.reverseSemanticMap_;for(var key in o3d.Effect.semanticMap_){var value=o3d.Effect.semanticMap_[key];revmap[value.semantic]=revmap[value.semantic]||[];revmap[value.semantic][value.index]=value.gl_index;}})();o3d.Effect.prototype.createUniformParameters=function(param_object){var sasTypes=o3d.Param.sasTypes_;var paramTypes=o3d.Effect.getParamTypes_(this.gl);for(var name in this.uniforms_){var uniformData=this.uniforms_[name];if(!sasTypes[name]){switch(uniformData.kind){case o3d.Effect.ARRAY:var param=param_object.createParam(name,'ParamParamArray');var array=new o3d.ParamArray;array.gl=this.gl;array.resize(uniformData.info.size,paramTypes[uniformData.info.type]);param.value=array;break;case o3d.Effect.STRUCT:o3d.notImplemented();break;case o3d.Effect.ELEMENT:default:param_object.createParam(name,paramTypes[uniformData.info.type]);break;}}}};o3d.Effect.prototype.createSASParameters=function(param_object){var sasTypes=o3d.Param.sasTypes_;for(var name in this.uniforms_){var info=this.uniforms_[name].info;var sasType=sasTypes[name];if(sasType){param_object.createParam(info.name,sasType);}}};o3d.Effect.prototype.getParameterInfo=function(){var infoArray=[];var sasTypes=o3d.Param.sasTypes_;var semanticMap=o3d.Effect.semanticMap_;var paramTypes=o3d.Effect.getParamTypes_(this.gl);for(var name in this.uniforms_){var uniformData=this.uniforms_[name];var sasClassName=sasTypes[name]||'';var dataType=paramTypes[uniformData.info.type]||'';var numElements=(uniformData.kind==o3d.Effect.ARRAY)?uniformData.info.size:0;var semantic=semanticMap[name]?name:'';infoArray.push(new o3d.EffectParameterInfo(name,dataType,numElements,semantic.toUpperCase(),sasClassName));}
return infoArray;};o3d.Effect.prototype.getStreamInfo=function(){var infoList=[];for(var name in this.attributes_){var semantic_index_pair=o3d.Effect.semanticMap_[name];infoList.push(new o3d.EffectStreamInfo(semantic_index_pair.semantic,semantic_index_pair.index));}
return infoList;};o3d.Effect.prototype.searchForParams_=function(object_list){var unfilledMap={};for(var uniformName in this.uniforms_){unfilledMap[uniformName]=true;}
this.gl.useProgram(this.program_);o3d.Param.texture_index_=0;var object_list_length=object_list.length;for(var i=0;i<object_list_length;++i){var obj=object_list[i];for(var name in this.uniforms_){if(unfilledMap[name]){var uniformInfo=this.uniforms_[name];var param=obj.getParam(name);if(param){if(uniformInfo.kind==o3d.Effect.ARRAY){param.applyToLocations(this.gl,uniformInfo.locations);}else{param.applyToLocation(this.gl,uniformInfo.location);}
delete unfilledMap[name];}}}}
this.updateHelperConstants_(this.gl.displayInfo.width,this.gl.displayInfo.height);delete unfilledMap[o3d.Effect.HELPER_CONSTANT_NAME];for(var name in unfilledMap){if(this.uniforms_[name].info.type==this.gl.SAMPLER_2D){if(this.gl.client.reportErrors_()){this.gl.client.error_callback("Missing ParamSampler");}
var defaultParamSampler=o3d.ParamSampler.defaultParamSampler_;defaultParamSampler.gl=this.gl;defaultParamSampler.applyToLocation(this.gl,this.uniforms_[name].location);}else{throw('Uniform param not filled: "'+name+'"');}}};o3d.Effect.prototype.updateHelperConstants_=function(width,height){var uniformInfo=this.uniforms_[o3d.Effect.HELPER_CONSTANT_NAME];var dx_clipping=[0.0,0.0,0.0,0.0];if(uniformInfo){dx_clipping[0]=1.0/width;dx_clipping[1]=-1.0/height;dx_clipping[2]=2.0;if(this.gl.currentRenderSurfaceSet){dx_clipping[3]=-1.0;}else{dx_clipping[3]=1.0;}
this.gl.uniform4f(uniformInfo.location,dx_clipping[0],dx_clipping[1],dx_clipping[2],dx_clipping[3]);}};o3d.Effect.MatrixLoadOrder=goog.typedef;o3d.Effect.ROW_MAJOR=0;o3d.Effect.COLUMN_MAJOR=1;o3d.Effect.ELEMENT=0;o3d.Effect.ARRAY=1;o3d.Effect.STRUCT=2;o3d.Effect.prototype.matrix_load_order_=o3d.Effect.ROW_MAJOR;o3d.Effect.prototype.source_='';o3d.Material=function(opt_state,opt_effect,opt_draw_list){o3d.ParamObject.call(this);this.state=opt_state||null;this.effect=opt_effect||null;this.drawList=opt_draw_list||null;};o3d.inherit('Material','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.Material,'effect','ParamEffect');o3d.ParamObject.setUpO3DParam_(o3d.Material,'state','ParamState');o3d.ParamObject.setUpO3DParam_(o3d.Material,'drawList','ParamDrawList');if(!this.JSON){this.JSON={};}
(function(){function f(n){return n<10?'0'+n:n;}
if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+
f(this.getUTCMonth()+1)+'-'+
f(this.getUTCDate())+'T'+
f(this.getUTCHours())+':'+
f(this.getUTCMinutes())+':'+
f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}
var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
if(typeof rep==='function'){value=rep.call(holder,key,value);}
switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
v=partial.length===0?'[]':gap?'[\n'+gap+
partial.join(',\n'+gap)+'\n'+
mind+']':'['+partial.join(',')+']';gap=mind;return v;}
if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==='string'){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+
mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
return str('',{'':value});};}
if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
return reviver.call(holder,key,value);}
text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+
('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
throw new SyntaxError('JSON.parse');};}}());o3d.ArchiveRequest=function(){o3d.ObjectBase.call(this);this.method_=null;};o3d.inherit('ArchiveRequest','ObjectBase');o3d.ArchiveRequest.prototype.uri='';o3d.ArchiveRequest.prototype.open=function(method,uri){this.uri=uri;var parentURI=uri;var lastSlash=uri.lastIndexOf('/');if(lastSlash!=-1){parentURI=parentURI.substring(0,lastSlash+1);}
this.parentURI_=parentURI;};o3d.ArchiveRequest.prototype.send=function(){var that=this;this.done=false;this.success=true;this.error=null;var callback=function(sourceJSON,exc){var filteredJSON=JSON.stringify(JSON.parse(sourceJSON));var rawData=new o3d.RawData();rawData.uri='scene.json';rawData.stringValue=filteredJSON;var uriRegex=/\"([^\"]*\.(fx|png|jpg))\"/g;var matchArray;var uris=[];while((matchArray=uriRegex.exec(sourceJSON))!=null){uris.push(matchArray[1]);}
that.pendingRequests_=uris.length+1;for(var ii=0;ii<uris.length;++ii){if(that.stringEndsWith_(uris[ii],".fx")){var func=function(uri){var completion=function(value,exc){var rawData=null;if(exc==null){rawData=new o3d.RawData();rawData.uri=uri;rawData.stringValue=value;}
that.resolvePendingRequest_(rawData,exc);};o3djs.io.loadTextFile(that.relativeToAbsoluteURI_(uri),completion);};func(uris[ii]);}else if(that.stringEndsWith_(uris[ii],".png")||that.stringEndsWith_(uris[ii],".jpg")){var func=function(uri){var image=new Image();image.onload=function(){var rawData=new o3d.RawData();rawData.uri=uri;rawData.image_=image;that.resolvePendingRequest_(rawData,exc);};image.onerror=function(){that.resolvePendingRequest_(null,exc);}
image.src=that.relativeToAbsoluteURI_(uri);};func(uris[ii]);}}
that.resolvePendingRequest_(rawData);};o3djs.io.loadTextFile(this.uri,callback);};o3d.ArchiveRequest.prototype.onreadystatechange=null;o3d.ArchiveRequest.prototype.onfileavailable=null;o3d.ArchiveRequest.prototype.relativeToAbsoluteURI_=function(relativeURI){return this.parentURI_+relativeURI;};o3d.ArchiveRequest.prototype.stringEndsWith_=function(string,suffix){return string.substring(string.length-suffix.length)==suffix;};o3d.ArchiveRequest.prototype.resolvePendingRequest_=function(rawData,opt_exc){this.success=this.success&&rawData&&(!opt_exc);if(opt_exc!=null){this.error=""+opt_exc;}
if(rawData&&this.onfileavailable){this.onfileavailable(rawData);}
if(--this.pendingRequests_==0){this.done=true;if(this.onreadystatechange){this.onreadystatechange();}}};o3d.ParamFloatOutput=function(){o3d.ParamFloat.call(this);};o3d.inherit('ParamFloatOutput','ParamFloat');o3d.ParamFloatOutput.prototype.__defineGetter__("value",function(){return this.owner_.updateOutputs();});o3d.ParamFloatOutput.prototype.__defineSetter__("value",function(value){});o3d.ParamFloat2Output=function(){o3d.ParamFloat2.call(this);};o3d.inherit('ParamFloat2Output','ParamFloat2');o3d.ParamFloat2Output.prototype.__defineGetter__("value",function(){return this.owner_.updateOutputs();});o3d.ParamFloat2Output.prototype.__defineSetter__("value",function(value){});o3d.ParamFloat3Output=function(){o3d.ParamFloat3.call(this);};o3d.inherit('ParamFloat3Output','ParamFloat3');o3d.ParamFloat3Output.prototype.__defineGetter__("value",function(){return this.owner_.updateOutputs();});o3d.ParamFloat3Output.prototype.__defineSetter__("value",function(value){});o3d.ParamFloat4Output=function(){o3d.ParamFloat4.call(this);};o3d.inherit('ParamFloat4Output','ParamFloat4');o3d.ParamFloat4Output.prototype.__defineGetter__("value",function(){return this.owner_.updateOutputs();});o3d.ParamFloat4Output.prototype.__defineSetter__("value",function(value){});o3d.ParamMatrix4Output=function(){o3d.ParamMatrix4.call(this);};o3d.inherit('ParamMatrix4Output','ParamMatrix4');o3d.ParamMatrix4Output.prototype.__defineGetter__("value",function(){return this.owner_.updateOutputs();});o3d.ParamMatrix4Output.prototype.__defineSetter__("value",function(value){});o3d.ParamOp2FloatsToFloat2=function(){o3d.ParamObject.call(this);this.last_output_value_=[0,0];};o3d.inherit('ParamOp2FloatsToFloat2','ParamObject');(function(){for(var i=0;i<2;i++){o3d.ParamObject.setUpO3DParam_(o3d.ParamOp2FloatsToFloat2,"input"+i,"ParamFloat");}
o3d.ParamObject.setUpO3DParam_(o3d.ParamOp2FloatsToFloat2,"output","ParamMatrix4Output");})();o3d.ParamOp2FloatsToFloat2.prototype.updateOutputs=function(){this.last_output_value_[0]=this.getParam("input0").value;this.last_output_value_[1]=this.getParam("input1").value;return this.last_output_value_;};o3d.ParamOp3FloatsToFloat3=function(){o3d.ParamObject.call(this);this.last_output_value_=[0,0,0];};o3d.inherit('ParamOp3FloatsToFloat3','ParamObject');(function(){for(var i=0;i<3;i++){o3d.ParamObject.setUpO3DParam_(o3d.ParamOp3FloatsToFloat3,"input"+i,"ParamFloat");}
o3d.ParamObject.setUpO3DParam_(o3d.ParamOp3FloatsToFloat3,"output","ParamMatrix4Output");})();o3d.ParamOp3FloatsToFloat3.prototype.updateOutputs=function(){this.last_output_value_[0]=this.getParam("input0").value;this.last_output_value_[1]=this.getParam("input1").value;this.last_output_value_[2]=this.getParam("input2").value;return this.last_output_value_;};o3d.ParamOp4FloatsToFloat4=function(){o3d.ParamObject.call(this);this.last_output_value_=[0,0,0,0];};o3d.inherit('ParamOp4FloatsToFloat4','ParamObject');(function(){for(var i=0;i<4;i++){o3d.ParamObject.setUpO3DParam_(o3d.ParamOp4FloatsToFloat4,"input"+i,"ParamFloat");}
o3d.ParamObject.setUpO3DParam_(o3d.ParamOp4FloatsToFloat4,"output","ParamMatrix4Output");})();o3d.ParamOp4FloatsToFloat4.prototype.updateOutputs=function(){this.last_output_value_[0]=this.getParam("input0").value;this.last_output_value_[1]=this.getParam("input1").value;this.last_output_value_[2]=this.getParam("input2").value;this.last_output_value_[3]=this.getParam("input3").value;return this.last_output_value_;};o3d.ParamOp16FloatsToMatrix4=function(){o3d.ParamObject.call(this);this.last_output_value_=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];};o3d.inherit('ParamOp16FloatsToMatrix4','ParamObject');(function(){for(var i=0;i<16;i++){o3d.ParamObject.setUpO3DParam_(o3d.ParamOp16FloatsToMatrix4,"input"+i,"ParamFloat");}
o3d.ParamObject.setUpO3DParam_(o3d.ParamOp16FloatsToMatrix4,"output","ParamMatrix4Output");})();o3d.ParamOp16FloatsToMatrix4.prototype.updateOutputs=function(){for(var i=0;i<16;i++){this.last_output_value_[Math.floor(i/4)][i%4]=this.getParam("input"+i).value;}
return this.last_output_value_;};o3d.TRSToMatrix4=function(){o3d.ParamObject.call(this);this.rotateX=0;this.rotateY=0;this.rotateZ=0;this.translateX=0;this.translateY=0;this.translateZ=0;this.scaleX=1;this.scaleY=1;this.scaleZ=1;this.last_output_value_=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];};o3d.inherit('TRSToMatrix4','ParamObject');(function(){var proplist=["rotateX","rotateY","rotateZ","translateX","translateY","translateZ","scaleX","scaleY","scaleZ"];for(var i=0;i<proplist.length;i++){o3d.ParamObject.setUpO3DParam_(o3d.TRSToMatrix4,proplist[i],"ParamFloat");}
o3d.ParamObject.setUpO3DParam_(o3d.TRSToMatrix4,"output","ParamMatrix4Output");})();o3d.TRSToMatrix4.prototype.updateOutputs=function(){var ret=this.last_output_value_;var rX=this.rotateX;var rY=this.rotateY;var rZ=this.rotateZ;var sX=this.scaleX;var sY=this.scaleY;var sZ=this.scaleZ;var sinX=Math.sin(rX);var cosX=Math.cos(rX);var sinY=Math.sin(rY);var cosY=Math.cos(rY);var sinZ=Math.sin(rZ);var cosZ=Math.cos(rZ);var cosZSinY=cosZ*sinY;var sinZSinY=sinZ*sinY;ret[0].splice(0,4,cosZ*cosY*sX,sinZ*cosY*sX,-sinY*sX,0);ret[1].splice(0,4,(cosZSinY*sinX-sinZ*cosX)*sY,(sinZSinY*sinX+cosZ*cosX)*sY,cosY*sinX*sY,0);ret[2].splice(0,4,(cosZSinY*cosX+sinZ*sinX)*sZ,(sinZSinY*cosX-cosZ*sinX)*sZ,cosY*cosX*sZ,0);ret[3].splice(0,4,this.translateX,this.translateY,this.translateZ,1);return ret;};o3d.Matrix4Composition=function(){o3d.ParamObject.call(this);this.last_output_value_=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];};o3d.inherit('Matrix4Composition','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.Matrix4Composition,"inputMatrix","ParamMatrix4");o3d.ParamObject.setUpO3DParam_(o3d.Matrix4Composition,"localMatrix","ParamMatrix4");o3d.ParamObject.setUpO3DParam_(o3d.Matrix4Composition,"outputMatrix","ParamMatrix4Output");o3d.Matrix4Composition.prototype.updateOutputs=function(){var input=this.getParam("inputMatrix").value;var local=this.getParam("localMatrix").value;o3d.Transform.compose(input,local,this.last_output_value_);return this.last_output_value_;};o3d.Matrix4AxisRotation=function(){o3d.ParamObject.call(this);this.last_output_value_=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];};o3d.inherit('Matrix4AxisRotation','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.Matrix4AxisRotation,"inputMatrix","ParamMatrix4");o3d.ParamObject.setUpO3DParam_(o3d.Matrix4AxisRotation,"axis","ParamFloat3");o3d.ParamObject.setUpO3DParam_(o3d.Matrix4AxisRotation,"angle","ParamFloat");o3d.ParamObject.setUpO3DParam_(o3d.Matrix4AxisRotation,"outputMatrix","ParamMatrix4Output");o3d.Matrix4AxisRotation.prototype.updateOutputs=function(){var input=this.getParam("inputMatrix").value;var axis=this.getParam("axis").value;var angle=this.getParam("angle").value;o3d.Transform.axisRotateMatrix(input,axis,angle,this.last_output_value_);return this.last_output_value_;};o3d.Matrix4Scale=function(){o3d.ParamObject.call(this);this.last_output_value_=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];};o3d.inherit('Matrix4Scale','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.Matrix4Scale,"inputMatrix","ParamMatrix4");o3d.ParamObject.setUpO3DParam_(o3d.Matrix4Scale,"scale","ParamFloat3");o3d.ParamObject.setUpO3DParam_(o3d.Matrix4Scale,"outputMatrix","ParamMatrix4Output");o3d.Matrix4Scale.prototype.updateOutputs=function(){var m=this.getParam("inputMatrix").value;var ret=this.last_output_value_;var v=this.getParam("scale").value;var v0=v[0];var v1=v[1];var v2=v[2];var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];ret[0].splice(0,4,v0*m0[0],v0*m0[1],v0*m0[2],v0*m0[3]);ret[1].splice(0,4,v1*m1[0],v1*m1[1],v1*m1[2],v1*m1[3]);ret[2].splice(0,4,v2*m2[0],v2*m2[1],v2*m2[2],v2*m2[3]);ret[3]=m3.slice(0);return ret;};o3d.Matrix4Translation=function(){o3d.ParamObject.call(this);this.last_output_value_=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];};o3d.inherit('Matrix4Translation','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.Matrix4Translation,"inputMatrix","ParamMatrix4");o3d.ParamObject.setUpO3DParam_(o3d.Matrix4Translation,"translation","ParamFloat3");o3d.ParamObject.setUpO3DParam_(o3d.Matrix4Translation,"outputMatrix","ParamMatrix4Output");o3d.Matrix4Translation.prototype.updateOutputs=function(){var m=this.getParam("inputMatrix").value;var ret=this.last_output_value_;var v=this.getParam("translation").value;var v0=v[0];var v1=v[1];var v2=v[2];var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];ret[0]=m0.slice(0);ret[1]=m1.slice(0);ret[2]=m2.slice(0);ret[3].splice(0,4,m0[0]*v0+m1[0]*v1+m2[0]*v2+m3[0],m0[1]*v0+m1[1]*v1+m2[1]*v2+m3[1],m0[2]*v0+m1[2]*v1+m2[2]*v2+m3[2],m0[3]*v0+m1[3]*v1+m2[3]*v2+m3[3]);return ret;};o3d.Function=function(opt_func){o3d.NamedObject.call(this);this.func_=opt_func;};o3d.inherit('Function','NamedObject');o3d.Function.prototype.evaluate=function(input,opt_context){this.func_.call(this,input,opt_context);};o3d.FunctionEval=function(){o3d.ParamObject.call(this);this.input_param_=this.getParam("input");this.func_param_=this.getParam("functionObject");this.output_param_=this.getParam("output");this.func_context_={};this.last_input_value_=null;this.last_output_value_=null;};o3d.inherit('FunctionEval','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.FunctionEval,"output","ParamFloatOutput");o3d.ParamObject.setUpO3DParam_(o3d.FunctionEval,"input","ParamFloat");o3d.ParamObject.setUpO3DParam_(o3d.FunctionEval,"functionObject","ParamFunction");o3d.FunctionEval.prototype.updateOutputs=function(){var new_input_value=this.input_param_.value;if(this.last_input_value_!=new_input_value){this.last_output_value_=this.func_param_.value.evaluate(this.last_input_value_,this.func_context_);this.last_input_value_=new_input_value;}
return this.last_output_value_;};o3d.CounterManager=function(){this.counterMap_={};};o3d.CounterManager.prototype.lastUpdated=null;o3d.CounterManager.prototype.advanceCounters=function(type,amount){var counterArrayRef=this.counterMap_[type];if(!counterArrayRef)
return;var length=counterArrayRef.length;var counterArray=[];for(var i=0;i<length;i++){counterArray[i]=counterArrayRef[i];}
for(var i=0;i<length;++i){if(counterArray[i].running){counterArray[i].advance(amount);}}};o3d.CounterManager.prototype.tick=function(){this.advanceCounters("TickCounter",1.0);var now=new Date();var deltaSeconds=0;if(this.lastUpdated!=null){deltaSeconds=(now-this.lastUpdated)/1000.0;}
this.lastUpdated=now;this.advanceCounters("SecondCounter",deltaSeconds);};o3d.CounterManager.prototype.advanceRenderFrameCounters=function(){this.advanceCounters("RenderFrameCounter",1.0);};o3d.CounterManager.prototype.registerCounter=function(counter){var type=counter.counter_type_;var arr=this.counterMap_[type];if(!arr){arr=this.counterMap_[type]=[];}
arr.push(counter);};o3d.CounterManager.prototype.unregisterCounter=function(counter){var type=counter.counter_type_;var arr=this.counterMap_[type];if(arr){o3d.removeFromArray(arr,counter);}};o3d.Counter=function(){o3d.ParamObject.call(this);this.next_callback_=-1;this.prev_callback_=-1;this.old_count_=0;this.last_call_callbacks_end_count_=0;this.callbacks_=[];this.counter_manager_=null;this.running_param_=this.createParam("running","ParamBoolean");this.count_param_=this.createParam("count","ParamFloat");this.multiplier=1.0;this.forward=true;this.countMode=o3d.Counter.CONTINUOUS;};o3d.inherit('Counter','ParamObject');o3d.ParamObject.setUpO3DParam_(o3d.Counter,"forward","ParamBoolean");o3d.ParamObject.setUpO3DParam_(o3d.Counter,"start","ParamFloat");o3d.ParamObject.setUpO3DParam_(o3d.Counter,"end","ParamFloat");o3d.ParamObject.setUpO3DParam_(o3d.Counter,"countMode","ParamInteger");o3d.ParamObject.setUpO3DParam_(o3d.Counter,"multiplier","ParamFloat");o3d.Counter.prototype.__defineSetter__("running",function(newRunning){var oldRunning=this.running_param_.value;if(this.counter_manager_&&oldRunning!=newRunning){if(newRunning==false){this.counter_manager_.unregisterCounter(this);}else{this.counter_manager_.registerCounter(this);}}
this.running_param_.value=newRunning;});o3d.Counter.prototype.__defineGetter__("running",function(){return this.running_param_.value;});o3d.Counter.prototype.__defineSetter__("count",function(value){this.setCount(value);});o3d.Counter.prototype.__defineGetter__("count",function(){return this.count_param_.value;});o3d.Counter.prototype.__defineSetter__("gl",function(new_gl){var old_running=this.running;this.running=false;this.gl_=new_gl;if(this.gl_&&this.gl_.client){this.counter_manager_=this.gl_.client.counter_manager_;}
this.running=old_running;});o3d.Counter.prototype.__defineGetter__("gl",function(){return this.gl_;});o3d.Counter.CountMode=goog.typedef;o3d.Counter.CONTINUOUS=0;o3d.Counter.ONCE=1;o3d.Counter.CYCLE=2;o3d.Counter.OSCILLATE=3;o3d.Counter.prototype.counter_type_="Counter";o3d.Counter.prototype.reset=function(){this.setCount(this.forward?this.start:this.end);};o3d.Counter.prototype.setCount=function(value){this.count_param_.value=value;this.old_count_=value;this.next_callback_=-1;this.prev_callback_=-1;};o3d.Counter.prototype.advance=function(advance_amount){var queue=[];var old_count=this.count_param_.value;if(this.count_param_.inputConnection){this.callCallbacks_(this.old_count_,old_count,queue);}else{var direction=this.forward;var start_count=this.start;var end_count=this.end;var multiplier=this.multiplier;var delta=(direction?advance_amount:-advance_amount)*multiplier;var period=end_count-start_count;var mode=this.countMode;if(period>=0.0){var new_count=old_count+delta;if(delta>=0.0){switch(mode){case o3d.Counter.ONCE:{if(new_count>=end_count){new_count=end_count;this.running=false;}
break;}
case o3d.Counter.CYCLE:{while(new_count>=end_count){this.callCallbacks_(old_count,end_count,queue);if(period==0.0){break;}
old_count=start_count;new_count-=period;}
break;}
case o3d.Counter.OSCILLATE:{while(delta>0.0){new_count=old_count+delta;if(new_count<end_count){break;}
this.callCallbacks_(old_count,end_count,queue);direction=!direction;var amount=end_count-old_count;delta-=amount;old_count=end_count;new_count=end_count;if(delta<=0.0||period==0.0){break;}
new_count-=delta;if(new_count>start_count){break;}
this.callCallbacks_(old_count,start_count,queue);direction=!direction;amount=old_count-start_count;delta-=amount;old_count=start_count;new_count=start_count;}
this.forward=direction;break;}
case o3d.Counter.CONTINUOUS:default:break;}
this.callCallbacks_(old_count,new_count,queue);this.count_param_.value=new_count;}else if(delta<0.0){switch(mode){case o3d.Counter.ONCE:{if(new_count<=start_count){new_count=start_count;this.running=false;}
break;}
case o3d.Counter.CYCLE:{while(new_count<=start_count){this.callCallbacks_(old_count,start_count,queue);if(period==0.0){break;}
old_count=end_count;new_count+=period;}
break;}
case o3d.Counter.OSCILLATE:{while(delta<0.0){new_count=old_count+delta;if(new_count>start_count){break;}
this.callCallbacks_(old_count,start_count,queue);direction=!direction;var amount=old_count-start_count;delta+=amount;old_count=start_count;new_count=start_count;if(delta>=0.0||period==0.0){break;}
new_count-=delta;if(new_count<end_count){break;}
this.callCallbacks_(old_count,end_count,queue);direction=!direction;amount=end_count-old_count;delta+=amount;old_count=end_count;new_count=end_count;}
this.forward=direction;break;}
case o3d.Counter.CONTINUOUS:default:break;}
this.callCallbacks_(old_count,new_count,queue);this.count_param_.value=new_count;}}else if(period<0.0){period=-period;var new_count=old_count-delta;if(delta>0.0){switch(mode){case o3d.Counter.ONCE:{if(new_count<=end_count){new_count=end_count;this.running=false;}
break;}
case o3d.Counter.CYCLE:{while(new_count<=end_count){this.callCallbacks_(old_count,end_count,queue);old_count=start_count;new_count+=period;}
break;}
case o3d.Counter.OSCILLATE:{while(delta>0.0){new_count=old_count-delta;if(new_count>end_count){break;}
this.callCallbacks_(old_count,end_count,queue);direction=!direction;var amount=old_count-end_count;delta-=amount;old_count=end_count;new_count=end_count;if(delta<=0.0){break;}
new_count+=delta;if(new_count<start_count){break;}
this.callCallbacks_(old_count,start_count,queue);direction=!direction;amount=start_count-old_count;delta-=amount;old_count=start_count;new_count=start_count;}
this.forward=direction;break;}
case o3d.Counter.CONTINUOUS:default:break;}
this.callCallbacks_(old_count,new_count,queue);this.count_param_.value=new_count;}else if(delta<0.0){switch(mode){case o3d.Counter.ONCE:{if(new_count>=start_count){new_count=start_count;this.running=false;}
break;}
case o3d.Counter.CYCLE:{while(new_count>=start_count){this.callCallbacks_(old_count,start_count,queue);old_count=end_count;new_count-=period;}
break;}
case o3d.Counter.OSCILLATE:{while(delta<0.0){new_count=old_count-delta;if(new_count<start_count){break;}
this.callCallbacks_(old_count,start_count,queue);direction=!direction;var amount=start_count-old_count;delta+=amount;old_count=start_count;new_count=start_count;if(delta>=0.0){break;}
new_count+=delta;if(new_count>end_count){break;}
this.callCallbacks_(old_count,end_count,queue);direction=!direction;amount=old_count-end_count;delta+=amount;old_count=end_count;new_count=end_count;}
this.forward=direction;break;}
case o3d.Counter.CONTINUOUS:default:break;}
this.callCallbacks_(old_count,new_count,queue);this.count_param_.value=new_count;}}}
this.old_count_=old_count;for(var i=0;i<queue.length;i++){queue[i]();}};o3d.Counter.prototype.callCallbacks_=function(start_count,end_count,queue){if(end_count>start_count){if(this.next_callback_<0||start_count!=this.last_call_callbacks_end_count_){this.next_callback_=0;while(this.next_callback_!=this.callbacks_.length&&this.callbacks_[this.next_callback_].count<start_count){++this.next_callback_;}}
while(this.next_callback_<this.callbacks_.length){if(this.callbacks_[this.next_callback_].count>end_count){break;}
queue.push(this.callbacks_[this.next_callback_].callback);++this.next_callback_;}
this.prev_callback_=-1;this.last_call_callbacks_end_count_=end_count;}else if(end_count<start_count){if(this.prev_callback_<0||start_count!=this.last_call_callbacks_end_count_){this.prev_callback_=this.callbacks_.length-1;while(this.prev_callback_>=0&&this.callbacks_[this.prev_callback_].count>start_count){--this.prev_callback_;}}
while(this.prev_callback_>=0){if(this.callbacks_[this.prev_callback_].count<end_count){break;}
queue.push(this.callbacks_[this.prev_callback_].callback);--this.prev_callback_;}
this.next_callback_=-1;this.last_call_callbacks_end_count_=end_count;}};o3d.Counter.prototype.addCallback=function(count,callback){this.next_callback_=-1;this.prev_callback_=-1;var end=this.callbacks_.length;var iter=0;while(iter!=end){var current=this.callbacks_[iter];if(current.count==count){current.callback=callback;return;}else if(current.count>count){break;}
++iter;}
var rest=this.callbacks_.splice(iter,this.callbacks_.length-iter);this.callbacks_.push(new o3d.Counter.CallbackInfo(count,callback));this.callbacks_.push.apply(this.callbacks_,rest);};o3d.Counter.prototype.removeCallback=function(count){var end=this.callbacks_.length;for(var iter=0;iter!=end;++iter){if(this.callbacks_[iter].count==count){this.next_callback_=-1;this.prev_callback_=-1;this.callbacks_.splice(iter,1);return true;}}
return false;};o3d.Counter.prototype.removeAllCallbacks=function(){this.callbacks_=[];this.next_callback_=-1;this.prev_callback_=-1;};o3d.Counter.CallbackInfo=function(count,callback){this.count=count;this.callback=callback;this.called_=false;};o3d.Counter.CallbackInfo.prototype.run=function(){if(!this.called_){this.called_=true;this.callback();this.called_=false;}};o3d.SecondCounter=function(){o3d.Counter.call(this);this.running=true;};o3d.inherit("SecondCounter","Counter");o3d.SecondCounter.prototype.counter_type_="SecondCounter";o3d.RenderFrameCounter=function(){o3d.Counter.call(this);this.running=true;};o3d.inherit("RenderFrameCounter","Counter");o3d.RenderFrameCounter.prototype.counter_type_="RenderFrameCounter";o3d.TickCounter=function(){o3d.Counter.call(this);this.running=true;};o3d.inherit("TickCounter","Counter");o3d.TickCounter.prototype.counter_type_="TickCounter";o3d.CurveKey=function(owner){o3d.ObjectBase.call(this);this.owner_=owner;this.input_=0;this.output_=0;};o3d.inherit('CurveKey','ObjectBase');o3d.CurveKey.prototype.destroy=function(){o3d.removeFromArray(this.owner_.keys,this);this.owner_.invalidateCache_();};o3d.CurveKey.prototype.getOutputAtOffset=function(offset,next_key){var input_span=next_key.input-this.input;var output_span=next_key.output-this.output;return this.output+offset/input_span*output_span;};o3d.CurveKey.prototype.__defineGetter__("input",function(){return this.input_;});o3d.CurveKey.prototype.__defineSetter__("input",function(new_input){if(new_input!=this.input_){this.input_=new_input;this.owner_.invalidateCache_();}});o3d.CurveKey.prototype.__defineGetter__("output",function(){return this.output_;});o3d.CurveKey.prototype.__defineSetter__("output",function(new_output){if(new_output!=this.output_){this.output_=new_output;this.owner_.invalidateCache_();}});o3d.StepCurveKey=function(owner){o3d.CurveKey.call(this,owner);owner.num_step_keys_++;};o3d.inherit('StepCurveKey','CurveKey');o3d.StepCurveKey.prototype.getOutputAtOffset=function(offset,next_key){return this.output;};o3d.StepCurveKey.prototype.destroy=function(){o3d.CurveKey.prototype.destroy.call(this);this.owner_.num_step_keys_--;};o3d.LinearCurveKey=function(owner){o3d.CurveKey.call(this,owner);};o3d.inherit('LinearCurveKey','CurveKey');o3d.BezierCurveKey=function(owner){o3d.CurveKey.call(this,owner);this.in_tangent_=[0,0];this.out_tangent_=[0,0];};o3d.inherit('BezierCurveKey','CurveKey');o3d.BezierCurveKey.prototype.__defineGetter__("inTangent",function(){return this.in_tangent_;});o3d.BezierCurveKey.prototype.__defineSetter__("inTangent",function(new_t){if(new_t!=this.in_tangent_){this.in_tangent_=new_t;this.owner_.invalidateCache_();}});o3d.BezierCurveKey.prototype.__defineGetter__("outTangent",function(){return this.out_tangent_;});o3d.BezierCurveKey.prototype.__defineSetter__("outTangent",function(new_t){if(new_t!=this.out_tangent_){this.out_tangent_=new_t;this.owner_.invalidateCache_();}});o3d.BezierCurveKey.findT_=function(control_point_0_x,control_point_1_x,control_point_2_x,control_point_3_x,input,initial_guess){var local_tolerance=0.001;var high_t=1.0;var low_t=0.0;var mid_t=0.5;if(initial_guess<=0.1){mid_t=0.1;}else if(initial_guess>=0.9){mid_t=0.9;}else{mid_t=initial_guess;}
var once=true;while((high_t-low_t)>local_tolerance){if(once){once=false;}else{mid_t=(high_t-low_t)/2.0+low_t;}
var ti=1.0-mid_t;var calculated_time=control_point_0_x*ti*ti*ti+
3*control_point_1_x*mid_t*ti*ti+
3*control_point_2_x*mid_t*mid_t*ti+
control_point_3_x*mid_t*mid_t*mid_t;if(Math.abs(calculated_time-input)<=local_tolerance){break;}
if(calculated_time>input){high_t=mid_t;}else{low_t=mid_t;}}
return mid_t;};o3d.BezierCurveKey.prototype.getOutputAtOffset=function(offset,next_key){var input_span=next_key.input-this.input;var output_span=next_key.output-this.output;var in_tangent;if(next_key.inTangent){in_tangent=next_key.inTangent;}else{in_tangent=[next_key.input-input_span/3.0,next_key.output-output_span/3.0];}
var t=offset/input_span;t=o3d.BezierCurveKey.findT_(this.input,this.outTangent[0],in_tangent[0],next_key.input,this.input+offset,t);var b=this.outTangent[1];var c=in_tangent[1];var ti=1.0-t;var br=3.0;var cr=3.0;return this.output*ti*ti*ti+br*b*ti*ti*t+
cr*c*ti*t*t+next_key.output*t*t*t;};o3d.Curve=function(){o3d.Function.call(this,this.evaluate);this.preInfinity=o3d.Curve.CONSTANT;this.postInfinity=o3d.Curve.CONSTANT;this.useCache=true;this.sample_rate_=o3d.Curve.kDefaultSampleRate;this.keys=[];this.sorted_=true;this.check_discontinuity_=false;this.discontinuous_=false;this.num_step_keys_=0;};o3d.inherit('Curve','Function');o3d.Curve.kMinimumSampleRate=1.0/240.0;o3d.Curve.kDefaultSampleRate=1.0/30.0;o3d.Curve.prototype.__defineGetter__("sampleRate",function(){return this.sample_rate_;});o3d.Curve.prototype.__defineSetter__("sampleRate",function(rate){if(rate<o3d.Curve.kMinimumSampleRate){rate=o3d.Curve.kMinimumSampleRate;this.gl.client.error_callback("attempt to set sample rate to "+rate+" which is lower than the minimum of "+o3d.Curve.kMinimumSampleRate);}else if(rate!=this.sample_rate_){this.sample_rate_=rate;this.invalidateCache_();}});o3d.Curve.Infinity=goog.typedef;o3d.Curve.CONSTANT=0;o3d.Curve.LINEAR=1;o3d.Curve.CYCLE=2;o3d.Curve.CYCLE_RELATIVE=3;o3d.Curve.OSCILLATE=4;o3d.Curve.prototype.set=function(rawData,opt_offset,opt_length){o3d.notImplemented();};o3d.Curve.prototype.createKey=function(keyType){var newKey=new(o3d[keyType])(this);this.keys.push(newKey);return newKey;};o3d.Curve.prototype.addLinearKeys=function(values){var kNumLinearKeyValues=2;if(values.length%kNumLinearKeyValues!=0){this.gl.client.error_callback("addLinearKeys: expected multiple of 2 values got "+values.size());return;}
for(var i=0;i<values.length;i+=kNumLinearKeyValues){var newKey=this.createKey("LinearCurveKey");newKey.input=values[i];newKey.output=values[i+1];}
this.sorted_=false;};o3d.Curve.prototype.addStepKeys=function(values){var kNumStepKeyValues=2;if(values.length%kNumStepKeyValues!=0){this.gl.client.error_callback("addStepKeys: expected multiple of 2 values got "+values.size());return;}
for(var i=0;i<values.length;i+=kNumStepKeyValues){var newKey=this.createKey("StepCurveKey");newKey.input=values[i];newKey.output=values[i+1];}
this.sorted_=false;};o3d.Curve.prototype.addBezierKeys=function(values){var kNumBezierKeyValues=6;if(values.length%kNumBezierKeyValues!=0){this.gl.client.error_callback("addBezierKeys: expected multiple of 6 values got "+values.size());return;}
for(var i=0;i<values.length;i+=kNumBezierKeyValues){var newKey=this.createKey("BezierCurveKey");newKey.input=values[i];newKey.output=values[i+1];newKey.inTangent[0]=values[i+2];newKey.inTangent[1]=values[i+3];newKey.outTangent[0]=values[i+4];newKey.outTangent[1]=values[i+5];}
this.sorted_=false;};o3d.Curve.prototype.invalidateCache_=function(){this.check_valid_=false;this.check_discontinuity_=true;};o3d.Curve.prototype.isDiscontinuous=function(){this.updateCurveInfo_();return this.discontinuous_;};o3d.Curve.compareInputs_=function(a,b){return a.input-b.input;};o3d.Curve.prototype.updateCurveInfo_=function(){if(!this.sorted_){this.keys.sort(o3d.Curve.compareInputs_);this.sorted_=true;this.invalidateCache_();}
if(this.check_discontinuity_){this.check_discontinuity_=false;var keys_size=this.keys.length;this.discontinuous_=(this.num_step_keys_>0&&this.num_step_keys_!=keys_size);if(!this.discontinuous_&&keys_size>1){for(var ii=0;ii<keys_size-1;++ii){if(this.keys[ii].input==this.keys[ii+1].input&&this.keys[ii].output!=this.keys[ii+1].output){this.discontinuous_=true;break;}}}}};o3d.Curve.prototype.getOutputInSpan_=function(input,context){var keys=this.keys;var keys_size=keys.length;if(input<keys[0].input){this.gl.client.error_callback("Curve.getOutputInSpan_: input is lower than any key");return 0;}
if(input>=keys[keys_size-1].input){return keys[keys_size-1].output;}
var start=0;var end=keys_size;var key_index;var found=false;var kKeysToSearch=3;if(context){key_index=context.curve_last_key_index_;if(key_index<end-1){if(keys[key_index].input<=input&&keys[key_index+1].input>input){found=true;}else{if(input>keys[key_index].input){var check_end=key_index+kKeysToSearch;if(check_end>end){check_end=end;}
for(++key_index;key_index<check_end;++key_index){if(keys[key_index].input<=input&&keys[key_index+1].input>input){found=true;break;}}}else if(key_index>0){var check_end=key_index-kKeysToSearch;if(check_end<0){check_end=0;}
for(--key_index;key_index>=check_end;--key_index){if(keys[key_index].input<=input&&keys[key_index+1].input>input){found=true;break;}}}}}}
if(!found){while(start<=end){var mid=Math.floor((start+end)/2);if(input>keys[mid].input){start=mid+1;}else{if(mid==0){break;}
end=mid-1;}}
end=keys_size;while(start<end){if(keys[start].input>input){break;}
++start;}
if(start<=0||start>=end){this.gl.client.error_callback("Curve.getOutputInSpan_: start is outside range.");}
key_index=start-1;}
var key=keys[key_index];if(context){context.curve_last_key_index_=key_index;}
if(key_index+1>=keys_size||!keys[key_index+1]){this.gl.client.error_callback("Curve.getOutputInSpan_: next key is null: index is "+key_index+"; size is "+keys_size);return key.output;}else{return key.getOutputAtOffset(input-key.input,keys[key_index+1]);}};o3d.Curve.prototype.evaluate=function(input,context){var keys=this.keys;var keys_size=keys.length;if(keys_size==0){return 0.0;}
if(keys_size==1){return keys[0].output;}
this.updateCurveInfo_();var start_input=keys[0].input;var end_input=keys[keys_size-1].input;var input_span=end_input-start_input;var start_output=keys[0].output;var end_output=keys[keys_size-1].output;var output_delta=end_output-start_output;var kEpsilon=0.00001;var output_offset=0.0;if(input<start_input){if(input_span<=0.0){return start_output;}
var pre_infinity_offset=start_input-input;switch(this.preInfinity){case o3d.Curve.CONSTANT:return start_output;case o3d.Curve.LINEAR:{var second_key=keys[1];var input_delta=second_key.input-start_input;if(input_delta>kEpsilon){return start_output-pre_infinity_offset*(second_key.output-start_output)/input_delta;}else{return start_output;}}
case o3d.Curve.CYCLE:{var cycle_count=Math.ceil(pre_infinity_offset/input_span);input+=cycle_count*input_span;input=start_input+(input-start_input)%input_span;break;}
case o3d.Curve.CYCLE_RELATIVE:{var cycle_count=Math.ceil(pre_infinity_offset/input_span);input+=cycle_count*input_span;input=start_input+(input-start_input)%input_span;output_offset-=cycle_count*output_delta;break;}
case o3d.Curve.OSCILLATE:{var cycle_count=Math.ceil(pre_infinity_offset/(2.0*input_span));input+=cycle_count*2.0*input_span;input=end_input-Math.abs(input-end_input);break;}
default:this.gl.client.error_callback("Curve: invalid value "+this.preInfinity+"for pre-infinity");return start_output;}}else if(input>=end_input){if(input_span<=0.0){return end_output;}
var post_infinity_offset=input-end_input;switch(this.postInfinity){case o3d.Curve.CONSTANT:return end_output;case o3d.Curve.LINEAR:{var next_to_last_key=keys[keys_size-2];var input_delta=end_input-next_to_last_key.input;if(input_delta>kEpsilon){return end_output+post_infinity_offset*(end_output-next_to_last_key.output)/input_delta;}else{return end_output;}}
case o3d.Curve.CYCLE:{var cycle_count=Math.ceil(post_infinity_offset/input_span);input-=cycle_count*input_span;input=start_input+(input-start_input)%input_span;break;}
case o3d.Curve.CYCLE_RELATIVE:{var cycle_count=Math.floor((input-start_input)/input_span);input-=cycle_count*input_span;input=start_input+(input-start_input)%input_span;output_offset+=cycle_count*output_delta;break;}
case o3d.Curve.OSCILLATE:{var cycle_count=Math.ceil(post_infinity_offset/(2.0*input_span));input-=cycle_count*2.0*input_span;input=start_input+Math.abs(input-start_input);break;}
default:this.gl.client.error_callback("Curve.invalid value "+this.postInfinity+"for post-infinity");return end_output;}}
if(input>=end_input){return end_output+output_offset;}
return this.getOutputInSpan_(input,context)+output_offset;};o3d.Skin=function(){o3d.NamedObject.call(this);this.influences=[];this.inverseBindPoseMatrices=[];this.info_valid_=false;this.highest_matrix_index_=0;this.highest_influences_=0;this.supports_vertex_shader_=false;this.buffers_valid_=false;this.vertex_buffer_=null;this.weights_field_=null;this.matrix_indices_field_=null;};o3d.inherit('Skin','NamedObject');o3d.Skin.prototype.updateVertexShader=function(){if(!this.buffers_valid_){var numcomp=4;var numvert=this.influences.length;if(!this.weights_field_&&!this.matrix_indices_field_){var vertex_buffer=new o3d.VertexBuffer;vertex_buffer.gl=this.gl;this.weights_field_=vertex_buffer.createField("FloatField",numcomp);this.matrix_indices_field_=vertex_buffer.createField("FloatField",numcomp);vertex_buffer.allocateElements(numvert);}
var ii,jj;var weights_field=this.weights_field_;var indices_field=this.matrix_indices_field_;var highest_influences=this.getHighestInfluences();this.buffers_valid_=true;weights_field.buffer.lock();indices_field.buffer.lock();var max_num_bones=o3d.SkinEval.getMaxNumBones(this);this.supports_vertex_shader_=(highest_influences<=numcomp)&&(this.inverseBindPoseMatrices.length<=max_num_bones);if(this.supports_vertex_shader_){var weights_arr=new Float32Array(numvert*numcomp);var indices_arr=new Float32Array(numvert*numcomp);for(ii=0;ii<numvert;++ii){var influence=this.influences[ii];for(jj=0;jj<influence.length&&jj<numcomp*2;jj+=2){indices_arr[ii*numcomp+jj/2]=influence[jj];weights_arr[ii*numcomp+jj/2]=influence[jj+1];}}
weights_field.setAt(0,weights_arr);indices_field.setAt(0,indices_arr);}
weights_field.buffer.unlock();indices_field.buffer.unlock();}
return this.supports_vertex_shader_;};o3d.Skin.prototype.setVertexInfluences=function(vertex_index,influences){if(influences.length%2!=0){this.gl.client.error_callback("odd number of values passed into"+"SetVertexInfluence. Even number required as they are pairs.");return;}
this.influences[vertex_index]=influences;this.info_valid_=false;this.buffers_valid_=false;};o3d.Skin.prototype.getVertexInfluences=function(vertex_index){return this.influences[vertex_index]||[];};o3d.Skin.prototype.updateInfo_=function(){if(!this.info_valid_){this.info_valid_=true;this.highest_matrix_index_=0;this.highest_influences_=0;for(var ii=0;ii<this.influences.length;++ii){var influences=this.influences[ii];var len=influences.length;if(len>this.highest_influences_){this.highest_influences_=len;}
for(var jj=0;jj<influences.length;jj+=2){if(influences[jj]>this.highest_matrix_index_){this.highest_matrix_index_=influences[jj];}}}
if(this.highest_influences_%2){this.gl.client.error_callback("Skin.updateInfo: Influences should not have odd length ");}
this.highest_influences_=Math.floor(this.highest_influences_/2);}};o3d.Skin.prototype.getHighestMatrixIndex=function(){this.updateInfo_();return this.highest_matrix_index_;};o3d.Skin.prototype.getHighestInfluences=function(){this.updateInfo_();return this.highest_influences_;};o3d.Skin.prototype.setInverseBindPoseMatrix=function(index,matrix){this.inverseBindPoseMatrices[index]=matrix;};o3d.Skin.prototype.set=function(rawData,opt_offset,opt_length){o3d.notImplemented();};o3d.SkinEval=function(){o3d.StreamBank.call(this);this.base=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];this.temp_matrix_=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];this.bones_=[];this.bone_array_=null;this.input_stream_infos_=[];this.output_stream_infos_=[];this.createParam("boneToWorld3x4","ParamParamArrayOutput");this.usingSkinShader=0.0;};o3d.inherit('SkinEval','StreamBank');o3d.ParamObject.setUpO3DParam_(o3d.SkinEval,"base","ParamMatrix4");o3d.ParamObject.setUpO3DParam_(o3d.SkinEval,"usingSkinShader","ParamFloat");o3d.ParamObject.setUpO3DParam_(o3d.SkinEval,"disableShader","ParamBoolean");o3d.ParamObject.setUpO3DParam_(o3d.SkinEval,"skin","ParamSkin");o3d.ParamObject.setUpO3DParam_(o3d.SkinEval,"matrices","ParamArray");o3d.SkinEval.getMaxNumBones=function(obj){var gl=obj.gl;var maxVertexUniformVectors=gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);return Math.floor((maxVertexUniformVectors-32)/3);};o3d.SkinEval.prototype.streamWasBound_=function(dest,semantic,semantic_index){this.skin.updateVertexShader();if(this.skin.weights_field_&&this.skin.matrix_indices_field_){var weights_stream=dest.getVertexStream(o3d.Stream.INFLUENCE_WEIGHTS,0);var indices_stream=dest.getVertexStream(o3d.Stream.INFLUENCE_INDICES,0);if(!weights_stream||!indices_stream||weights_stream.field!=this.skin.weights_field_||indices_stream.field!=this.skin.matrix_indices_field_){dest.setVertexStream(o3d.Stream.INFLUENCE_WEIGHTS,0,this.skin.weights_field_,0);dest.setVertexStream(o3d.Stream.INFLUENCE_INDICES,0,this.skin.matrix_indices_field_,0);}
var destParam=dest.getParam("boneToWorld3x4");if(!destParam){destParam=dest.createParam("boneToWorld3x4","ParamParamArray");}
destParam.bind(this.getParam("boneToWorld3x4"));destParam=dest.getParam("usingSkinShader");if(!destParam){destParam=dest.createParam("usingSkinShader","ParamFloat");}
destParam.bind(this.getParam("usingSkinShader"));}};o3d.SkinEval.prototype.multiplyAdd_=function(input,weight,output){var a0=input[0];var a1=input[1];var a2=input[2];var a3=input[3];var b0=output[0];var b1=output[1];var b2=output[2];var b3=output[3];b0[0]+=a0[0]*weight;b0[1]+=a0[1]*weight;b0[2]+=a0[2]*weight;b0[3]+=a0[3]*weight;b1[0]+=a1[0]*weight;b1[1]+=a1[1]*weight;b1[2]+=a1[2]*weight;b1[3]+=a1[3]*weight;b2[0]+=a2[0]*weight;b2[1]+=a2[1]*weight;b2[2]+=a2[2]*weight;b2[3]+=a2[3]*weight;b3[0]+=a3[0]*weight;b3[1]+=a3[1]*weight;b3[2]+=a3[2]*weight;b3[3]+=a3[3]*weight;};o3d.SkinEval.prototype.initStreams_=function(skin){var ii,jj,ll,num_streams;var num_vertices=this.skin.influences.length;for(ii=0,num_streams=0;ii<this.vertex_streams_.length;++ii){var array=this.vertex_streams_[ii];if(array){for(jj=0;jj<array.length;++jj,++num_streams){var source_param=array[jj];var input=source_param.inputConnection;if(input&&input.isAClassName("ParamVertexBufferStream")){input.owner_.updateStreams();}else{}
var source_stream=source_param.stream;if(source_stream.getMaxVertices_()!=num_vertices){this.gl.client.error_callback("SkinEval.doSkinning_: "
+"stream "+source_stream.semantic+" index "
+source_stream.semanticIndex+" in SkinEval '"+this.name
+" does not have the same number of vertices as Skin '"
+skin.name+"'");return;}
if(!this.input_stream_infos_[num_streams]){this.input_stream_infos_[num_streams]=new o3d.SkinEval.StreamInfo;}
if(!this.input_stream_infos_[num_streams].init(source_stream,false)){var buffer_name;if(source_stream.field.buffer){buffer_name=source_stream.field.buffer.name;}
this.gl.client.error_callback("SkinEval.doSkinning_: "
+"unable to lock buffer '"+buffer_name
+" used by stream "+source_stream.semantic+" index "
+source_stream.semanticIndex+" in SkinEval '"+this.name
+"'");return;}
var outputs=source_param.outputConnections;if(!this.output_stream_infos_[num_streams]){this.output_stream_infos_[num_streams]=[];}
var output_stream_info=this.output_stream_infos_[num_streams];output_stream_info.length=outputs.length;for(ll=0;ll<outputs.length;++ll){var destination_param=outputs[ll];if(destination_param.isAClassName('ParamVertexBufferStream')){}else{this.gl.client.error_callback("SkinEval.doSkinning: "
+destination_param.className+" not ParamVertexBufferStream");}
var destination_stream=destination_param.stream;if(destination_stream.getMaxVertices_()!=num_vertices){this.gl.client.error_callback("SkinEval.doSkinning_: "
+"stream "+destination_stream.semantic+" index "
+destination_stream.semanticIndex+" targeted by SkinEval '"
+this.name+" does not have the same number of vertices as "
+"Skin '"+skin.name+"'");return;}
if(!output_stream_info[ll]){output_stream_info[ll]=new o3d.SkinEval.StreamInfo;}
if(!output_stream_info[ll].init(destination_stream,true)){var buffer_name;if(destination_stream.field.buffer){buffer_name=destination_stream.field.buffer.name;}
this.gl.client.error_callback("SkinEval.doSkinning_: "
+"unable to lock buffer '"+buffer_name
+" used by stream "+destination_stream.semantic+" index "
+destination_stream.semanticIndex+" targeted by SkinEval '"
+this.name+"'");return;}}}}}
this.input_stream_infos_.length=num_streams;this.output_stream_infos_.length=num_streams;};o3d.SkinEval.prototype.uninitStreams_=function(){for(ii=0;ii<this.input_stream_infos_.length;++ii){this.input_stream_infos_[ii].uninit();}
for(ii=0;ii<this.output_stream_infos_.length;++ii){var output_streams=this.output_stream_infos_[ii];for(var jj=0;jj<output_streams.length;++jj){output_streams[jj].uninit();}}};o3d.SkinEval.prototype.doSkinning_=function(){this.initStreams_();var ii,jj,ll;var influences_array=this.skin.influences;var num_vertices=influences_array.length;for(ii=0;ii<num_vertices;++ii){var influences=influences_array[ii];if(influences.length){var this_matrix_index=influences[0];var this_weight=influences[1];var accumulated_matrix=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];this.multiplyAdd_(this.bones_[this_matrix_index],this_weight,accumulated_matrix);var num_influences=influences.length;for(jj=2;jj<num_influences;jj+=2){var influence_matrix_index=influences[jj];var influence_weight=influences[jj+1];this.multiplyAdd_(this.bones_[influence_matrix_index],influence_weight,accumulated_matrix);}
for(jj=0;jj<this.input_stream_infos_.length;++jj){var input_stream_info=this.input_stream_infos_[jj];input_stream_info.compute_function_(accumulated_matrix);var output_streams=this.output_stream_infos_[jj];var num_output_streams=output_streams.length;for(ll=0;ll<num_output_streams;++ll){output_streams[ll].copy_function_(input_stream_info);}}}}
this.uninitStreams_();};o3d.SkinEval.prototype.updateBones_=function(){var param_array=this.matrices;if(!param_array){this.gl.client.error_callback("SkinEval.updateBones_: "
+"no matrices for SkinEval '"+this.name+"'");return;}
var the_skin=this.skin;if(!the_skin){this.gl.client.error_callback("SkinEval.updateBones_: "
+"no skin specified in SkinEval '"+this.name+"'");return;}
if(the_skin.getHighestMatrixIndex()>=param_array.length){this.gl.client.error_callback("SkinEval.updateBones_: "
+"skin '"+the_skin.name+" specified in SkinEval '"
+this.name
+"' references matrices outside the valid range in ParamArray '"
+param_array.name+"'");return;}
var inverse_bind_pose_array=the_skin.inverseBindPoseMatrices;if(inverse_bind_pose_array.length!=param_array.length){this.gl.client.error_callback("SkinEval.updateBones_: "
+"skin '"+the_skin.name+" specified in SkinEval '"
+this.name+"' and the ParamArray '"
+param_array.name+"' do not have the same number of matrices.");return;}
var inverse_base=this.temp_matrix_;o3d.Transform.inverse(this.base,inverse_base);for(var ii=0;ii<param_array.length;++ii){var param=param_array.getParam(ii);if(!param){this.gl.client.error_callback("SkinEval.updateBones_: "
+"In SkinEval '"+this.name+"' param at index "+ii
+" in ParamArray '"+param_array.name
+" is not a ParamMatrix4");return;}
this.bones_[ii]=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];o3d.Transform.compose(param.value,inverse_bind_pose_array[ii],this.bones_[ii]);o3d.Transform.compose(inverse_base,this.bones_[ii],this.bones_[ii]);}};o3d.SkinEval.prototype.updateStreams=function(){if(this.disableShader||!this.usingSkinShader||!this.skin.updateVertexShader()){this.updateBones_();this.doSkinning_(this.skin);this.usingSkinShader=0.0;}};o3d.SkinEval.prototype.updateOutputs=function(param){this.updateBones_();if(!this.bone_array_){this.bone_array_=new o3d.ParamArray;this.bone_array_.gl=this.gl;var max_num_bones=o3d.SkinEval.getMaxNumBones(this);this.bone_array_.resize(max_num_bones*3,"ParamFloat4");param.value=this.bone_array_;}
var boneArray=this.bone_array_;var ii,jj;if(!this.disableShader&&this.skin.updateVertexShader()){if(!this.usingSkinShader){this.usingSkinShader=1.0;this.initStreams_();var num_vertices=this.skin.influences.length;for(ii=0;ii<this.input_stream_infos_.length;++ii){var input_stream_info=this.input_stream_infos_[ii];var output_streams=this.output_stream_infos_[ii];for(jj=0;jj<output_streams.length;++jj){var values=input_stream_info.field_.getAt(0,num_vertices);output_streams[jj].field_.setAt(0,values);}}
this.uninitStreams_();}
var row;for(ii=0;ii<this.bones_.length;++ii){var bone=this.bones_[ii];row=boneArray.getParam(ii*3);row.value[0]=bone[0][0];row.value[1]=bone[1][0];row.value[2]=bone[2][0];row.value[3]=bone[3][0];row=boneArray.getParam(ii*3+1);row.value[0]=bone[0][1];row.value[1]=bone[1][1];row.value[2]=bone[2][1];row.value[3]=bone[3][1];row=boneArray.getParam(ii*3+2);row.value[0]=bone[0][2];row.value[1]=bone[1][2];row.value[2]=bone[2][2];row.value[3]=bone[3][2];}}
return boneArray;};o3d.SkinEval.StreamInfo=function(){this.compute_function_=null;this.copy_function_=null;this.result_=null;this.field_=null;this.values_=null;this.buffer_=null;this.index_=0;this.writable_=false;};o3d.SkinEval.StreamInfo.prototype.init=function(stream,access_mode){if(this.values_||this.buffer_){return false;}
var field=stream.field;var buffer=field.buffer;if(!buffer){return false;}
switch(field.numComponents){case 3:this.copy_function_=this.copyFloat3;this.compute_function_=(stream.semantic==o3d.Stream.POSITION)?this.computeFloat3AsPoint3:this.computeFloat3AsVector3;break;case 4:this.compute_function_=this.computeFloat4AsVector4;this.copy_function_=this.copyFloat4;break;default:return false;}
buffer.lock();this.field_=field;this.buffer_=buffer;this.values_=buffer.array_;this.index_=this.field_.offset_;this.writable_=access_mode;this.stride_=buffer.totalComponents;return true;};o3d.SkinEval.StreamInfo.prototype.uninit=function(){if(this.buffer_){if(this.writable_){this.buffer_.unlock();}
this.buffer_=null;this.field_=null;this.values_=null;}};o3d.SkinEval.StreamInfo.prototype.computeFloat3AsVector3=function(matrix){var ii=this.index_;var vec=[this.values_[ii],this.values_[ii+1],this.values_[ii+2],0];this.result_=o3d.Transform.multiplyVector(matrix,vec);this.index_=ii+this.stride_;};o3d.SkinEval.StreamInfo.prototype.computeFloat3AsPoint3=function(matrix){var ii=this.index_;var point=[this.values_[ii],this.values_[ii+1],this.values_[ii+2],1];this.result_=o3d.Transform.multiplyVector(matrix,point);this.index_=ii+this.stride_;};o3d.SkinEval.StreamInfo.prototype.computeFloat4AsVector4=function(matrix){var ii=this.index_;var vec=[this.values_[ii],this.values_[ii+1],this.values_[ii+2],this.values_[ii+3]];this.result_=o3d.Transform.multiplyVector(matrix,vec);this.index_=ii+this.stride_;};o3d.SkinEval.StreamInfo.prototype.copyFloat3=function(source){var ii=this.index_;this.values_[ii]=source.result_[0];this.values_[ii+1]=source.result_[1];this.values_[ii+2]=source.result_[2];this.index_=ii+this.stride_;};o3d.SkinEval.StreamInfo.prototype.copyFloat4=function(source){var ii=this.index_;this.values_[ii]=source.result_[0];this.values_[ii+1]=source.result_[1];this.values_[ii+2]=source.result_[2];this.values_[ii+3]=source.result_[3];this.index_=ii+this.stride_;};

// o3djs
var o3djs=o3djs||{};var goog=goog||{};goog.typedef=true;o3djs.global=this;o3djs.BROWSER_ONLY=true;o3djs.provided_=[];o3djs.provide=function(name){if(o3djs.getObjectByName(name)&&!o3djs.implicitNamespaces_[name]){throw'Namespace "'+name+'" already declared.';}
var namespace=name;while((namespace=namespace.substring(0,namespace.lastIndexOf('.')))){o3djs.implicitNamespaces_[namespace]=true;}
o3djs.exportPath_(name);o3djs.provided_.push(name);};o3djs.implicitNamespaces_={};o3djs.exportPath_=function(name,opt_object,opt_objectToExportTo){var parts=name.split('.');var cur=opt_objectToExportTo||o3djs.global;var part;if(!(parts[0]in cur)&&cur.execScript){cur.execScript('var '+parts[0]);}
while(parts.length&&(part=parts.shift())){if(!parts.length&&o3djs.isDef(opt_object)){cur[part]=opt_object;}else if(cur[part]){cur=cur[part];}else{cur=cur[part]={};}}};o3djs.getObjectByName=function(name,opt_obj){var parts=name.split('.');var cur=opt_obj||o3djs.global;for(var pp=0;pp<parts.length;++pp){var part=parts[pp];if(cur[part]){cur=cur[part];}else{return null;}}
return cur;};o3djs.require=function(rule){var dummy=document.getElementsByTagName('script').length;if(o3djs.getObjectByName(rule)){return;}
var path=o3djs.getPathFromRule_(rule);if(path){o3djs.included_[path]=true;o3djs.writeScripts_();}else{throw new Error('o3djs.require could not find: '+rule);}};o3djs.basePath='';o3djs.included_={};o3djs.dependencies_={visited:{},written:{}};o3djs.findBasePath_=function(){var doc=o3djs.global.document;if(typeof doc=='undefined'){return;}
if(o3djs.global.BASE_PATH){o3djs.basePath=o3djs.global.BASE_PATH;return;}else{o3djs.global.BASE_PATH=null;}
var scripts=doc.getElementsByTagName('script');for(var script,i=0;script=scripts[i];i++){var src=script.src;var l=src.length;if(src.substr(l-13)=='o3djs/base.js'){o3djs.basePath=src.substr(0,l-13);return;}}};o3djs.writeScriptTag_=function(src){var doc=o3djs.global.document;if(typeof doc!='undefined'&&!o3djs.dependencies_.written[src]){o3djs.dependencies_.written[src]=true;doc.write('<script type="text/javascript" src="'+
src+'"></'+'script>');}};o3djs.writeScripts_=function(){var scripts=[];var seenScript={};var deps=o3djs.dependencies_;function visitNode(path){if(path in deps.written){return;}
if(path in deps.visited){if(!(path in seenScript)){seenScript[path]=true;scripts.push(path);}
return;}
deps.visited[path]=true;if(!(path in seenScript)){seenScript[path]=true;scripts.push(path);}}
for(var path in o3djs.included_){if(!deps.written[path]){visitNode(path);}}
for(var i=0;i<scripts.length;i++){if(scripts[i]){o3djs.writeScriptTag_(o3djs.basePath+scripts[i]);}else{throw Error('Undefined script input');}}};o3djs.getPathFromRule_=function(rule){var parts=rule.split('.');return parts.join('/')+'.js';};o3djs.findBasePath_();o3djs.isDef=function(val){return typeof val!='undefined';};o3djs.exportSymbol=function(publicPath,object,opt_objectToExportTo){o3djs.exportPath_(publicPath,object,opt_objectToExportTo);};o3djs.v8Initializer_='';o3djs.v8InitializerArgs_=[];o3djs.valueToString_=function(value){switch(typeof(value)){case'undefined':return'undefined';case'string':var escaped=escape(value);if(escaped===value){return'"'+value+'"';}else{return'unescape("'+escaped+'")';}
case'object':if(value===null){return'null';}else{if(value instanceof RegExp){var result='new RegExp('+o3djs.valueToString_(value.source)+', "';if(value.global){result+='g';}
if(value.ignoreCase){result+='i';}
if(value.multiline){result+='m';}
result+='")';return result;}else if(o3djs.base.isArray(value)){var valueAsArray=(value);var result='[';var separator='';for(var i=0;i<valueAsArray.length;++i){result+=separator+o3djs.valueToString_(valueAsArray[i]);separator=',';}
result+=']\n';return result;}else{var valueAsObject=(value);var result='{\n';var separator='';for(var propertyName in valueAsObject){result+=separator+'"'+propertyName+'": '+
o3djs.valueToString_(valueAsObject[propertyName]);separator=',';}
result+='}\n';return result;}}
default:return value.toString()}};o3djs.namespaceInitializer_=function(namespaceObject,namespaceName,opt_args){var result=namespaceName+' = {};\n';for(var propertyName in namespaceObject){var propertyNamespaceName=namespaceName+'.'+propertyName;var propertyValue=namespaceObject[propertyName];if(typeof(propertyValue)==='object'&&propertyValue!==null&&!o3djs.base.isArray(propertyValue)&&!(propertyValue instanceof RegExp)){result+=o3djs.namespaceInitializer_(propertyValue,propertyNamespaceName);}else{var valueAsString=o3djs.valueToString_(propertyValue);if(typeof(propertyValue)=='function'&&valueAsString.indexOf('o3djs.BROWSER_ONLY')!=-1){valueAsString='args_['+opt_args.length+']';opt_args.push(propertyValue);}
result+=propertyNamespaceName+' = '+valueAsString+';\n';if(typeof(propertyValue)==='function'&&propertyValue.prototype){result+=o3djs.namespaceInitializer_(propertyValue.prototype,propertyNamespaceName+'.prototype');}}}
return result;};o3djs.provide('o3djs.base');o3djs.base=o3djs.base||{};o3djs.base.o3d=o3d;o3djs.base.glsl=false;o3djs.base.snapshotProvidedNamespaces=function(){o3djs.v8Initializer_='function(args_) {\n';o3djs.v8InitializerArgs_=[];for(var i=0;i<o3djs.provided_.length;++i){var object=o3djs.getObjectByName(o3djs.provided_[i]);o3djs.v8Initializer_+=o3djs.namespaceInitializer_((object),o3djs.provided_[i],o3djs.v8InitializerArgs_);}
o3djs.v8Initializer_+='}\n';};o3djs.base.initV8=function(clientObject){var v8Init=function(initializer,args){var o3djsBrowser=o3djs;o3djs={};o3djs.browser=o3djsBrowser;o3djs.global=(function(){return this;})();o3djs.require=function(rule){}
o3djs.provide=function(rule){}
eval('('+initializer+')')(args);o3djs.base.o3d=plugin.o3d;o3djs.base.glsl=plugin.client.clientInfo.glsl;};clientObject.eval(v8Init.toString())(o3djs.v8Initializer_,o3djs.v8InitializerArgs_);};o3djs.base.init=function(clientObject){function recursivelyCopyProperties(object){var copy={};var hasProperties=false;for(var key in object){var property=object[key];if(typeof property=='object'||typeof property=='function'){property=recursivelyCopyProperties(property);}
if(typeof property!='undefined'){copy[key]=property;hasProperties=true;}}
return hasProperties?copy:undefined;}
try{o3djs.base.o3d=recursivelyCopyProperties(clientObject.o3d);}catch(e){o3djs.base.o3d=clientObject.o3d;}
o3djs.base.o3d=o3djs.base.o3d||clientObject.o3d;o3djs.base.glsl=clientObject.client.clientInfo.glsl;};o3djs.base.isArray=function(value){var valueAsObject=(value);return typeof(value)==='object'&&value!==null&&'length'in valueAsObject&&'splice'in valueAsObject;};o3djs.base.ready=function(){return o3djs.base.o3d!=null;};o3djs.base.maybeDeobfuscateFunctionName_=function(name){return name;};o3djs.base.inherit=function(subClass,superClass){var TmpClass=function(){};TmpClass.prototype=superClass.prototype;subClass.prototype=new TmpClass();};o3djs.base.parseErrorStack=function(excp){var stack=[];var name;var line;if(!excp||!excp.stack){return stack;}
var stacklist=excp.stack.split('\n');for(var i=0;i<stacklist.length-1;i++){var framedata=stacklist[i];name=framedata.match(/^([a-zA-Z0-9_$]*)/)[1];if(name){name=o3djs.base.maybeDeobfuscateFunctionName_(name);}else{name='anonymous';}
var result=framedata.match(/(.*:[0-9]+)$/);line=result&&result[1];if(!line){line='(unknown)';}
stack[stack.length]=name+' : '+line}
var omitRegexp=/^anonymous :/;while(stack.length&&omitRegexp.exec(stack[stack.length-1])){stack.length=stack.length-1;}
return stack;};o3djs.base.getFunctionName=function(aFunction){var regexpResult=aFunction.toString().match(/function(\s*)(\w*)/);if(regexpResult&&regexpResult.length>=2&&regexpResult[2]){return o3djs.base.maybeDeobfuscateFunctionName_(regexpResult[2]);}
return'anonymous';};o3djs.base.formatErrorStack=function(stack){var result='';for(var i=0;i<stack.length;i++){result+='> '+stack[i]+'\n';}
return result;};o3djs.base.getStackTrace=function(stripCount){var result='';if(typeof(arguments.caller)!='undefined'){for(var a=arguments.caller;a!=null;a=a.caller){result+='> '+o3djs.base.getFunctionName(a.callee)+'\n';if(a.caller==a){result+='*';break;}}}else{var testExcp;try{eval('var var;');}catch(testExcp){var stack=o3djs.base.parseErrorStack(testExcp);result+=o3djs.base.formatErrorStack(stack.slice(3+stripCount,stack.length));}}
return result;};o3djs.base.setErrorHandler=function(client){client.setErrorCallback(function(msg){client.clearErrorCallback();alert('ERROR: '+msg+'\n'+o3djs.base.getStackTrace(1));});};o3djs.base.IsMSIE=function(){var ua=navigator.userAgent.toLowerCase();var msie=/msie/.test(ua)&&!/opera/.test(ua);return msie;};o3djs.math=o3djs.math||{};o3djs.math.randomSeed_=0;o3djs.math.RANDOM_RANGE_=Math.pow(2,32);o3djs.math.matrix4=o3djs.math.matrix4||{};o3djs.math.rowMajor=o3djs.math.rowMajor||{};o3djs.math.columnMajor=o3djs.math.columnMajor||{};o3djs.math.errorCheck=o3djs.math.errorCheck||{};o3djs.math.errorCheckFree=o3djs.math.errorCheckFree||{};o3djs.math.Vector2=goog.typedef;o3djs.math.Vector3=goog.typedef;o3djs.math.Vector4=goog.typedef;o3djs.math.Vector=goog.typedef;o3djs.math.Matrix1=goog.typedef;o3djs.math.Matrix2=goog.typedef;o3djs.math.Matrix3=goog.typedef;o3djs.math.Matrix4=goog.typedef;o3djs.math.Matrix=goog.typedef;o3djs.math.pseudoRandom=function(){var math=o3djs.math;return(math.randomSeed_=(134775813*math.randomSeed_+1)%math.RANDOM_RANGE_)/math.RANDOM_RANGE_;};o3djs.math.resetPseudoRandom=function(){o3djs.math.randomSeed_=0;};o3djs.math.degToRad=function(degrees){return degrees*Math.PI/180;};o3djs.math.radToDeg=function(radians){return radians*180/Math.PI;};o3djs.math.lerpScalar=function(a,b,t){return(1-t)*a+t*b;};o3djs.math.addVector=function(a,b){var r=[];var aLength=a.length;for(var i=0;i<aLength;++i)
r[i]=a[i]+b[i];return r;};o3djs.math.subVector=function(a,b){var r=[];var aLength=a.length;for(var i=0;i<aLength;++i)
r[i]=a[i]-b[i];return r;};o3djs.math.lerpVector=function(a,b,t){var r=[];var aLength=a.length;for(var i=0;i<aLength;++i)
r[i]=(1-t)*a[i]+t*b[i];return r;};o3djs.math.modClamp=function(v,range,opt_rangeStart){var start=opt_rangeStart||0;if(range<0.00001){return start;}
v-=start;if(v<0){v-=Math.floor(v/range)*range;}else{v=v%range;}
return v+start;};o3djs.math.lerpCircular=function(a,b,t,range){a=o3djs.math.modClamp(a,range);b=o3djs.math.modClamp(b,range);var delta=b-a;if(Math.abs(delta)>range*0.5){if(delta>0){b-=range;}else{b+=range;}}
return o3djs.math.modClamp(o3djs.math.lerpScalar(a,b,t),range);};o3djs.math.lerpRadian=function(a,b,t){return o3djs.math.lerpCircular(a,b,t,Math.PI*2);};o3djs.math.divVectorScalar=function(v,k){var r=[];var vLength=v.length;for(var i=0;i<vLength;++i)
r[i]=v[i]/k;return r;};o3djs.math.dot=function(a,b){var r=0.0;var aLength=a.length;for(var i=0;i<aLength;++i)
r+=a[i]*b[i];return r;};o3djs.math.cross=function(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];};o3djs.math.length=function(a){var r=0.0;var aLength=a.length;for(var i=0;i<aLength;++i)
r+=a[i]*a[i];return Math.sqrt(r);};o3djs.math.lengthSquared=function(a){var r=0.0;var aLength=a.length;for(var i=0;i<aLength;++i)
r+=a[i]*a[i];return r;};o3djs.math.distance=function(a,b){var r=0.0;var aLength=a.length;for(var i=0;i<aLength;++i){var t=a[i]-b[i];r+=t*t;}
return Math.sqrt(r);};o3djs.math.distanceSquared=function(a,b){var r=0.0;var aLength=a.length;for(var i=0;i<aLength;++i){var t=a[i]-b[i];r+=t*t;}
return r;};o3djs.math.normalize=function(a){var r=[];var n=0.0;var aLength=a.length;for(var i=0;i<aLength;++i)
n+=a[i]*a[i];n=Math.sqrt(n);for(var i=0;i<aLength;++i)
r[i]=a[i]/n;return r;};o3djs.math.addMatrix=function(a,b){var r=[];var aLength=a.length;var a0Length=a[0].length;for(var i=0;i<aLength;++i){var row=[];var ai=a[i];var bi=b[i];for(var j=0;j<a0Length;++j)
row[j]=ai[j]+bi[j];r[i]=row;}
return r;};o3djs.math.subMatrix=function(a,b){var r=[];var aLength=a.length;var a0Length=a[0].length;for(var i=0;i<aLength;++i){var row=[];var ai=a[i];var bi=b[i];for(var j=0;j<a0Length;++j)
row[j]=ai[j]-bi[j];r[i]=row;}
return r;};o3djs.math.lerpMatrix=function(a,b,t){var r=[];var aLength=a.length;var a0Length=a[0].length;for(var i=0;i<aLength;++i){var row=[];var ai=a[i];var bi=b[i];for(var j=0;j<a0Length;++j)
row[j]=(1-t)*ai[j]+t*bi[j];r[i]=row;}
return r;};o3djs.math.divMatrixScalar=function(m,k){var r=[];var mLength=m.length;var m0Length=m[0].length;for(var i=0;i<mLength;++i){r[i]=[];for(var j=0;j<m0Length;++j)
r[i][j]=m[i][j]/k;}
return r;};o3djs.math.negativeScalar=function(a){return-a;};o3djs.math.negativeVector=function(v){var r=[];var vLength=v.length;for(var i=0;i<vLength;++i){r[i]=-v[i];}
return r;};o3djs.math.negativeMatrix=function(m){var r=[];var mLength=m.length;var m0Length=m[0].length;for(var i=0;i<mLength;++i){r[i]=[];for(var j=0;j<m0Length;++j)
r[i][j]=-m[i][j];}
return r;};o3djs.math.copyScalar=function(a){return a;};o3djs.math.copyVector=function(v){var r=[];for(var i=0;i<v.length;i++)
r[i]=v[i];return r;};o3djs.math.copyMatrix=function(m){var r=[];var mLength=m.length;for(var i=0;i<mLength;++i){r[i]=[];for(var j=0;j<m[i].length;j++){r[i][j]=m[i][j];}}
return r;};o3djs.math.getMatrixElements=function(m){var r=[];var mLength=m.length;var k=0;for(var i=0;i<mLength;i++){for(var j=0;j<m[i].length;j++){r[k++]=m[i][j];}}
return r;};o3djs.math.mulScalarScalar=function(a,b){return a*b;};o3djs.math.mulScalarVector=function(k,v){var r=[];var vLength=v.length;for(var i=0;i<vLength;++i){r[i]=k*v[i];}
return r;};o3djs.math.mulVectorScalar=function(v,k){return o3djs.math.mulScalarVector(k,v);};o3djs.math.mulScalarMatrix=function(k,m){var r=[];var mLength=m.length;var m0Length=m[0].length;for(var i=0;i<mLength;++i){r[i]=[];for(var j=0;j<m0Length;++j)
r[i][j]=k*m[i][j];}
return r;};o3djs.math.mulMatrixScalar=function(m,k){return o3djs.math.mulScalarMatrix(k,m);};o3djs.math.mulVectorVector=function(a,b){var r=[];var aLength=a.length;for(var i=0;i<aLength;++i)
r[i]=a[i]*b[i];return r;};o3djs.math.divVectorVector=function(a,b){var r=[];var aLength=a.length;for(var i=0;i<aLength;++i)
r[i]=a[i]/b[i];return r;};o3djs.math.rowMajor.mulVectorMatrix=function(v,m){var r=[];var m0Length=m[0].length;var vLength=v.length;for(var i=0;i<m0Length;++i){r[i]=0.0;for(var j=0;j<vLength;++j)
r[i]+=v[j]*m[j][i];}
return r;};o3djs.math.columnMajor.mulVectorMatrix=function(v,m){var r=[];var mLength=m.length;var vLength=v.length;for(var i=0;i<mLength;++i){r[i]=0.0;var column=m[i];for(var j=0;j<vLength;++j)
r[i]+=v[j]*column[j];}
return r;};o3djs.math.mulVectorMatrix=null;o3djs.math.rowMajor.mulMatrixVector=function(m,v){var r=[];var mLength=m.length;var m0Length=m[0].length;for(var i=0;i<mLength;++i){r[i]=0.0;var row=m[i];for(var j=0;j<m0Length;++j)
r[i]+=row[j]*v[j];}
return r;};o3djs.math.columnMajor.mulMatrixVector=function(m,v){var r=[];var m0Length=m[0].length;var vLength=v.length;for(var i=0;i<m0Length;++i){r[i]=0.0;for(var j=0;j<vLength;++j)
r[i]+=v[j]*m[j][i];}
return r;};o3djs.math.mulMatrixVector=null;o3djs.math.rowMajor.mulMatrixMatrix2=function(a,b){var a0=a[0];var a1=a[1];var b0=b[0];var b1=b[1];var a00=a0[0];var a01=a0[1];var a10=a1[0];var a11=a1[1];var b00=b0[0];var b01=b0[1];var b10=b1[0];var b11=b1[1];return[[a00*b00+a01*b10,a00*b01+a01*b11],[a10*b00+a11*b10,a10*b01+a11*b11]];};o3djs.math.columnMajor.mulMatrixMatrix2=function(a,b){var a0=a[0];var a1=a[1];var b0=b[0];var b1=b[1];var a00=a0[0];var a01=a0[1];var a10=a1[0];var a11=a1[1];var b00=b0[0];var b01=b0[1];var b10=b1[0];var b11=b1[1];return[[a00*b00+a10*b01,a01*b00+a11*b01],[a00*b10+a10*b11,a01*b10+a11*b11]];};o3djs.math.mulMatrixMatrix2=null;o3djs.math.rowMajor.mulMatrixMatrix3=function(a,b){var a0=a[0];var a1=a[1];var a2=a[2];var b0=b[0];var b1=b[1];var b2=b[2];var a00=a0[0];var a01=a0[1];var a02=a0[2];var a10=a1[0];var a11=a1[1];var a12=a1[2];var a20=a2[0];var a21=a2[1];var a22=a2[2];var b00=b0[0];var b01=b0[1];var b02=b0[2];var b10=b1[0];var b11=b1[1];var b12=b1[2];var b20=b2[0];var b21=b2[1];var b22=b2[2];return[[a00*b00+a01*b10+a02*b20,a00*b01+a01*b11+a02*b21,a00*b02+a01*b12+a02*b22],[a10*b00+a11*b10+a12*b20,a10*b01+a11*b11+a12*b21,a10*b02+a11*b12+a12*b22],[a20*b00+a21*b10+a22*b20,a20*b01+a21*b11+a22*b21,a20*b02+a21*b12+a22*b22]];};o3djs.math.columnMajor.mulMatrixMatrix3=function(a,b){var a0=a[0];var a1=a[1];var a2=a[2];var b0=b[0];var b1=b[1];var b2=b[2];var a00=a0[0];var a01=a0[1];var a02=a0[2];var a10=a1[0];var a11=a1[1];var a12=a1[2];var a20=a2[0];var a21=a2[1];var a22=a2[2];var b00=b0[0];var b01=b0[1];var b02=b0[2];var b10=b1[0];var b11=b1[1];var b12=b1[2];var b20=b2[0];var b21=b2[1];var b22=b2[2];return[[a00*b00+a10*b01+a20*b02,a01*b00+a11*b01+a21*b02,a02*b00+a12*b01+a22*b02],[a00*b10+a10*b11+a20*b12,a01*b10+a11*b11+a21*b12,a02*b10+a12*b11+a22*b12],[a00*b20+a10*b21+a20*b22,a01*b20+a11*b21+a21*b22,a02*b20+a12*b21+a22*b22]];};o3djs.math.mulMatrixMatrix3=null;o3djs.math.rowMajor.mulMatrixMatrix4=function(a,b){var a0=a[0];var a1=a[1];var a2=a[2];var a3=a[3];var b0=b[0];var b1=b[1];var b2=b[2];var b3=b[3];var a00=a0[0];var a01=a0[1];var a02=a0[2];var a03=a0[3];var a10=a1[0];var a11=a1[1];var a12=a1[2];var a13=a1[3];var a20=a2[0];var a21=a2[1];var a22=a2[2];var a23=a2[3];var a30=a3[0];var a31=a3[1];var a32=a3[2];var a33=a3[3];var b00=b0[0];var b01=b0[1];var b02=b0[2];var b03=b0[3];var b10=b1[0];var b11=b1[1];var b12=b1[2];var b13=b1[3];var b20=b2[0];var b21=b2[1];var b22=b2[2];var b23=b2[3];var b30=b3[0];var b31=b3[1];var b32=b3[2];var b33=b3[3];return[[a00*b00+a01*b10+a02*b20+a03*b30,a00*b01+a01*b11+a02*b21+a03*b31,a00*b02+a01*b12+a02*b22+a03*b32,a00*b03+a01*b13+a02*b23+a03*b33],[a10*b00+a11*b10+a12*b20+a13*b30,a10*b01+a11*b11+a12*b21+a13*b31,a10*b02+a11*b12+a12*b22+a13*b32,a10*b03+a11*b13+a12*b23+a13*b33],[a20*b00+a21*b10+a22*b20+a23*b30,a20*b01+a21*b11+a22*b21+a23*b31,a20*b02+a21*b12+a22*b22+a23*b32,a20*b03+a21*b13+a22*b23+a23*b33],[a30*b00+a31*b10+a32*b20+a33*b30,a30*b01+a31*b11+a32*b21+a33*b31,a30*b02+a31*b12+a32*b22+a33*b32,a30*b03+a31*b13+a32*b23+a33*b33]];};o3djs.math.columnMajor.mulMatrixMatrix4=function(a,b){var a0=a[0];var a1=a[1];var a2=a[2];var a3=a[3];var b0=b[0];var b1=b[1];var b2=b[2];var b3=b[3];var a00=a0[0];var a01=a0[1];var a02=a0[2];var a03=a0[3];var a10=a1[0];var a11=a1[1];var a12=a1[2];var a13=a1[3];var a20=a2[0];var a21=a2[1];var a22=a2[2];var a23=a2[3];var a30=a3[0];var a31=a3[1];var a32=a3[2];var a33=a3[3];var b00=b0[0];var b01=b0[1];var b02=b0[2];var b03=b0[3];var b10=b1[0];var b11=b1[1];var b12=b1[2];var b13=b1[3];var b20=b2[0];var b21=b2[1];var b22=b2[2];var b23=b2[3];var b30=b3[0];var b31=b3[1];var b32=b3[2];var b33=b3[3];return[[a00*b00+a10*b01+a20*b02+a30*b03,a01*b00+a11*b01+a21*b02+a31*b03,a02*b00+a12*b01+a22*b02+a32*b03,a03*b00+a13*b01+a23*b02+a33*b03],[a00*b10+a10*b11+a20*b12+a30*b13,a01*b10+a11*b11+a21*b12+a31*b13,a02*b10+a12*b11+a22*b12+a32*b13,a03*b10+a13*b11+a23*b12+a33*b13],[a00*b20+a10*b21+a20*b22+a30*b23,a01*b20+a11*b21+a21*b22+a31*b23,a02*b20+a12*b21+a22*b22+a32*b23,a03*b20+a13*b21+a23*b22+a33*b23],[a00*b30+a10*b31+a20*b32+a30*b33,a01*b30+a11*b31+a21*b32+a31*b33,a02*b30+a12*b31+a22*b32+a32*b33,a03*b30+a13*b31+a23*b32+a33*b33]];};o3djs.math.mulMatrixMatrix4=null;o3djs.math.rowMajor.mulMatrixMatrix=function(a,b){var r=[];var aRows=a.length;var bColumns=b[0].length;var bRows=b.length;for(var i=0;i<aRows;++i){var v=[];var ai=a[i];for(var j=0;j<bColumns;++j){v[j]=0.0;for(var k=0;k<bRows;++k)
v[j]+=ai[k]*b[k][j];}
r[i]=v;}
return r;};o3djs.math.columnMajor.mulMatrixMatrix=function(a,b){var r=[];var bColumns=b.length;var aRows=a[0].length;var aColumns=a.length;for(var i=0;i<bColumns;++i){var v=[];var bi=b[i];for(var j=0;j<aRows;++j){v[j]=0.0;for(var k=0;k<aColumns;++k)
v[j]+=bi[k]*a[k][j];}
r[i]=v;}
return r;};o3djs.math.mulMatrixMatrix=null;o3djs.math.rowMajor.column=function(m,j){var r=[];var mLength=m.length;for(var i=0;i<mLength;++i){r[i]=m[i][j];}
return r;};o3djs.math.columnMajor.column=function(m,j){return m[j].slice();};o3djs.math.column=null;o3djs.math.rowMajor.row=function(m,i){return m[i].slice();};o3djs.math.columnMajor.row=function(m,i){var r=[];var mLength=m.length;for(var j=0;j<mLength;++j){r[j]=m[j][i];}
return r;};o3djs.math.row=null;o3djs.math.identity=function(n){var r=[];for(var j=0;j<n;++j){r[j]=[];for(var i=0;i<n;++i)
r[j][i]=(i==j)?1:0;}
return r;};o3djs.math.transpose=function(m){var r=[];var m0Length=m[0].length;var mLength=m.length;for(var j=0;j<m0Length;++j){r[j]=[];for(var i=0;i<mLength;++i)
r[j][i]=m[i][j];}
return r;};o3djs.math.trace=function(m){var r=0.0;var mLength=m.length;for(var i=0;i<mLength;++i)
r+=m[i][i];return r;};o3djs.math.det1=function(m){return m[0][0];};o3djs.math.det2=function(m){return m[0][0]*m[1][1]-m[0][1]*m[1][0];};o3djs.math.det3=function(m){return m[2][2]*(m[0][0]*m[1][1]-m[0][1]*m[1][0])-
m[2][1]*(m[0][0]*m[1][2]-m[0][2]*m[1][0])+
m[2][0]*(m[0][1]*m[1][2]-m[0][2]*m[1][1]);};o3djs.math.det4=function(m){var t01=m[0][0]*m[1][1]-m[0][1]*m[1][0];var t02=m[0][0]*m[1][2]-m[0][2]*m[1][0];var t03=m[0][0]*m[1][3]-m[0][3]*m[1][0];var t12=m[0][1]*m[1][2]-m[0][2]*m[1][1];var t13=m[0][1]*m[1][3]-m[0][3]*m[1][1];var t23=m[0][2]*m[1][3]-m[0][3]*m[1][2];return m[3][3]*(m[2][2]*t01-m[2][1]*t02+m[2][0]*t12)-
m[3][2]*(m[2][3]*t01-m[2][1]*t03+m[2][0]*t13)+
m[3][1]*(m[2][3]*t02-m[2][2]*t03+m[2][0]*t23)-
m[3][0]*(m[2][3]*t12-m[2][2]*t13+m[2][1]*t23);};o3djs.math.inverse1=function(m){return[[1.0/m[0][0]]];};o3djs.math.inverse2=function(m){var d=1.0/(m[0][0]*m[1][1]-m[0][1]*m[1][0]);return[[d*m[1][1],-d*m[0][1]],[-d*m[1][0],d*m[0][0]]];};o3djs.math.inverse3=function(m){var t00=m[1][1]*m[2][2]-m[1][2]*m[2][1];var t10=m[0][1]*m[2][2]-m[0][2]*m[2][1];var t20=m[0][1]*m[1][2]-m[0][2]*m[1][1];var d=1.0/(m[0][0]*t00-m[1][0]*t10+m[2][0]*t20);return[[d*t00,-d*t10,d*t20],[-d*(m[1][0]*m[2][2]-m[1][2]*m[2][0]),d*(m[0][0]*m[2][2]-m[0][2]*m[2][0]),-d*(m[0][0]*m[1][2]-m[0][2]*m[1][0])],[d*(m[1][0]*m[2][1]-m[1][1]*m[2][0]),-d*(m[0][0]*m[2][1]-m[0][1]*m[2][0]),d*(m[0][0]*m[1][1]-m[0][1]*m[1][0])]];};o3djs.math.inverse4=function(m){var tmp_0=m[2][2]*m[3][3];var tmp_1=m[3][2]*m[2][3];var tmp_2=m[1][2]*m[3][3];var tmp_3=m[3][2]*m[1][3];var tmp_4=m[1][2]*m[2][3];var tmp_5=m[2][2]*m[1][3];var tmp_6=m[0][2]*m[3][3];var tmp_7=m[3][2]*m[0][3];var tmp_8=m[0][2]*m[2][3];var tmp_9=m[2][2]*m[0][3];var tmp_10=m[0][2]*m[1][3];var tmp_11=m[1][2]*m[0][3];var tmp_12=m[2][0]*m[3][1];var tmp_13=m[3][0]*m[2][1];var tmp_14=m[1][0]*m[3][1];var tmp_15=m[3][0]*m[1][1];var tmp_16=m[1][0]*m[2][1];var tmp_17=m[2][0]*m[1][1];var tmp_18=m[0][0]*m[3][1];var tmp_19=m[3][0]*m[0][1];var tmp_20=m[0][0]*m[2][1];var tmp_21=m[2][0]*m[0][1];var tmp_22=m[0][0]*m[1][1];var tmp_23=m[1][0]*m[0][1];var t0=(tmp_0*m[1][1]+tmp_3*m[2][1]+tmp_4*m[3][1])-
(tmp_1*m[1][1]+tmp_2*m[2][1]+tmp_5*m[3][1]);var t1=(tmp_1*m[0][1]+tmp_6*m[2][1]+tmp_9*m[3][1])-
(tmp_0*m[0][1]+tmp_7*m[2][1]+tmp_8*m[3][1]);var t2=(tmp_2*m[0][1]+tmp_7*m[1][1]+tmp_10*m[3][1])-
(tmp_3*m[0][1]+tmp_6*m[1][1]+tmp_11*m[3][1]);var t3=(tmp_5*m[0][1]+tmp_8*m[1][1]+tmp_11*m[2][1])-
(tmp_4*m[0][1]+tmp_9*m[1][1]+tmp_10*m[2][1]);var d=1.0/(m[0][0]*t0+m[1][0]*t1+m[2][0]*t2+m[3][0]*t3);var row0=[d*t0,d*t1,d*t2,d*t3];var row1=[d*((tmp_1*m[1][0]+tmp_2*m[2][0]+tmp_5*m[3][0])-
(tmp_0*m[1][0]+tmp_3*m[2][0]+tmp_4*m[3][0])),d*((tmp_0*m[0][0]+tmp_7*m[2][0]+tmp_8*m[3][0])-
(tmp_1*m[0][0]+tmp_6*m[2][0]+tmp_9*m[3][0])),d*((tmp_3*m[0][0]+tmp_6*m[1][0]+tmp_11*m[3][0])-
(tmp_2*m[0][0]+tmp_7*m[1][0]+tmp_10*m[3][0])),d*((tmp_4*m[0][0]+tmp_9*m[1][0]+tmp_10*m[2][0])-
(tmp_5*m[0][0]+tmp_8*m[1][0]+tmp_11*m[2][0]))];var row2=[d*((tmp_12*m[1][3]+tmp_15*m[2][3]+tmp_16*m[3][3])-
(tmp_13*m[1][3]+tmp_14*m[2][3]+tmp_17*m[3][3])),d*((tmp_13*m[0][3]+tmp_18*m[2][3]+tmp_21*m[3][3])-
(tmp_12*m[0][3]+tmp_19*m[2][3]+tmp_20*m[3][3])),d*((tmp_14*m[0][3]+tmp_19*m[1][3]+tmp_22*m[3][3])-
(tmp_15*m[0][3]+tmp_18*m[1][3]+tmp_23*m[3][3])),d*((tmp_17*m[0][3]+tmp_20*m[1][3]+tmp_23*m[2][3])-
(tmp_16*m[0][3]+tmp_21*m[1][3]+tmp_22*m[2][3]))];var row3=[d*((tmp_14*m[2][2]+tmp_17*m[3][2]+tmp_13*m[1][2])-
(tmp_16*m[3][2]+tmp_12*m[1][2]+tmp_15*m[2][2])),d*((tmp_20*m[3][2]+tmp_12*m[0][2]+tmp_19*m[2][2])-
(tmp_18*m[2][2]+tmp_21*m[3][2]+tmp_13*m[0][2])),d*((tmp_18*m[1][2]+tmp_23*m[3][2]+tmp_15*m[0][2])-
(tmp_22*m[3][2]+tmp_14*m[0][2]+tmp_19*m[1][2])),d*((tmp_22*m[2][2]+tmp_16*m[0][2]+tmp_21*m[1][2])-
(tmp_20*m[1][2]+tmp_23*m[2][2]+tmp_17*m[0][2]))];return[row0,row1,row2,row3];};o3djs.math.codet=function(a,x,y){var size=a.length;var b=[];var ai=0;for(var bi=0;bi<size-1;++bi){if(ai==x)
ai++;b[bi]=[];var aj=0;for(var bj=0;bj<size-1;++bj){if(aj==y)
aj++;b[bi][bj]=a[ai][aj];aj++;}
ai++;}
return o3djs.math.det(b);};o3djs.math.det=function(m){var d=m.length;if(d<=4){return o3djs.math['det'+d](m);}
var r=0.0;var sign=1;var row=m[0];var mLength=m.length;for(var y=0;y<mLength;y++){r+=sign*row[y]*o3djs.math.codet(m,0,y);sign*=-1;}
return r;};o3djs.math.inverse=function(m){var d=m.length;if(d<=4){return o3djs.math['inverse'+d](m);}
var r=[];var size=m.length;for(var j=0;j<size;++j){r[j]=[];for(var i=0;i<size;++i)
r[j][i]=((i+j)%2?-1:1)*o3djs.math.codet(m,i,j);}
return o3djs.math.divMatrixScalar(r,o3djs.math.det(m));};o3djs.math.orthonormalize=function(m){var r=[];var mLength=m.length;for(var i=0;i<mLength;++i){var v=m[i];for(var j=0;j<i;++j){v=o3djs.math.subVector(v,o3djs.math.mulScalarVector(o3djs.math.dot(r[j],m[i]),r[j]));}
r[i]=o3djs.math.normalize(v);}
return r;};o3djs.math.matrix4.inverse=function(m){return o3djs.math.inverse4(m);};o3djs.math.matrix4.mul=function(a,b){return o3djs.math.mulMatrixMatrix4(a,b);};o3djs.math.matrix4.det=function(m){return o3djs.math.det4(m);};o3djs.math.matrix4.copy=function(m){return o3djs.math.copyMatrix(m);};o3djs.math.matrix4.setUpper3x3=function(a,b){var b0=b[0];var b1=b[1];var b2=b[2];a[0].splice(0,3,b0[0],b0[1],b0[2]);a[1].splice(0,3,b1[0],b1[1],b1[2]);a[2].splice(0,3,b2[0],b2[1],b2[2]);return a;};o3djs.math.matrix4.getUpper3x3=function(m){return[m[0].slice(0,3),m[1].slice(0,3),m[2].slice(0,3)];};o3djs.math.matrix4.setTranslation=function(a,v){a[3].splice(0,4,v[0],v[1],v[2],1);return a;};o3djs.math.matrix4.getTranslation=function(m){return m[3].slice(0,3);};o3djs.math.matrix4.transformPoint=function(m,v){var v0=v[0];var v1=v[1];var v2=v[2];var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var d=v0*m0[3]+v1*m1[3]+v2*m2[3]+m3[3];return[(v0*m0[0]+v1*m1[0]+v2*m2[0]+m3[0])/d,(v0*m0[1]+v1*m1[1]+v2*m2[1]+m3[1])/d,(v0*m0[2]+v1*m1[2]+v2*m2[2]+m3[2])/d];};o3djs.math.matrix4.transformVector4=function(m,v){var v0=v[0];var v1=v[1];var v2=v[2];var v3=v[3];var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];return[v0*m0[0]+v1*m1[0]+v2*m2[0]+v3*m3[0],v0*m0[1]+v1*m1[1]+v2*m2[1]+v3*m3[1],v0*m0[2]+v1*m1[2]+v2*m2[2]+v3*m3[2],v0*m0[3]+v1*m1[3]+v2*m2[3]+v3*m3[3]];};o3djs.math.matrix4.transformDirection=function(m,v){var v0=v[0];var v1=v[1];var v2=v[2];var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];return[v0*m0[0]+v1*m1[0]+v2*m2[0],v0*m0[1]+v1*m1[1]+v2*m2[1],v0*m0[2]+v1*m1[2]+v2*m2[2]];};o3djs.math.matrix4.transformNormal=function(m,v){var mInverse=o3djs.math.inverse4(m);var v0=v[0];var v1=v[1];var v2=v[2];var mi0=mInverse[0];var mi1=mInverse[1];var mi2=mInverse[2];var mi3=mInverse[3];return[v0*mi0[0]+v1*mi0[1]+v2*mi0[2],v0*mi1[0]+v1*mi1[1]+v2*mi1[2],v0*mi2[0]+v1*mi2[1]+v2*mi2[2]];};o3djs.math.matrix4.identity=function(){return[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];};o3djs.math.matrix4.setIdentity=function(m){for(var i=0;i<4;i++){for(var j=0;j<4;j++){if(i==j){m[i][j]=1;}else{m[i][j]=0;}}}
return m;};o3djs.math.matrix4.perspective=function(angle,aspect,near,far){var f=Math.tan(0.5*(Math.PI-angle));var range=near-far;return[[f/aspect,0,0,0],[0,f,0,0],[0,0,far/range,-1],[0,0,near*far/range,0]];};o3djs.math.matrix4.orthographic=function(left,right,bottom,top,near,far){return[[2/(right-left),0,0,0],[0,2/(top-bottom),0,0],[0,0,1/(near-far),0],[(left+right)/(left-right),(bottom+top)/(bottom-top),near/(near-far),1]];};o3djs.math.matrix4.frustum=function(left,right,bottom,top,near,far){var dx=(right-left);var dy=(top-bottom);var dz=(near-far);return[[2*near/dx,0,0,0],[0,2*near/dy,0,0],[(left+right)/dx,(top+bottom)/dy,far/dz,-1],[0,0,near*far/dz,0]];};o3djs.math.matrix4.lookAt=function(eye,target,up){var vz=o3djs.math.normalize(o3djs.math.subVector(eye,target).slice(0,3)).concat(0);var vx=o3djs.math.normalize(o3djs.math.cross(up,vz)).concat(0);var vy=o3djs.math.cross(vz,vx).concat(0);return o3djs.math.inverse([vx,vy,vz,eye.concat(1)]);};o3djs.math.matrix4.composition=function(a,b){var a0=a[0];var a1=a[1];var a2=a[2];var a3=a[3];var b0=b[0];var b1=b[1];var b2=b[2];var b3=b[3];var a00=a0[0];var a01=a0[1];var a02=a0[2];var a03=a0[3];var a10=a1[0];var a11=a1[1];var a12=a1[2];var a13=a1[3];var a20=a2[0];var a21=a2[1];var a22=a2[2];var a23=a2[3];var a30=a3[0];var a31=a3[1];var a32=a3[2];var a33=a3[3];var b00=b0[0];var b01=b0[1];var b02=b0[2];var b03=b0[3];var b10=b1[0];var b11=b1[1];var b12=b1[2];var b13=b1[3];var b20=b2[0];var b21=b2[1];var b22=b2[2];var b23=b2[3];var b30=b3[0];var b31=b3[1];var b32=b3[2];var b33=b3[3];return[[a00*b00+a10*b01+a20*b02+a30*b03,a01*b00+a11*b01+a21*b02+a31*b03,a02*b00+a12*b01+a22*b02+a32*b03,a03*b00+a13*b01+a23*b02+a33*b03],[a00*b10+a10*b11+a20*b12+a30*b13,a01*b10+a11*b11+a21*b12+a31*b13,a02*b10+a12*b11+a22*b12+a32*b13,a03*b10+a13*b11+a23*b12+a33*b13],[a00*b20+a10*b21+a20*b22+a30*b23,a01*b20+a11*b21+a21*b22+a31*b23,a02*b20+a12*b21+a22*b22+a32*b23,a03*b20+a13*b21+a23*b22+a33*b23],[a00*b30+a10*b31+a20*b32+a30*b33,a01*b30+a11*b31+a21*b32+a31*b33,a02*b30+a12*b31+a22*b32+a32*b33,a03*b30+a13*b31+a23*b32+a33*b33]];};o3djs.math.matrix4.compose=function(a,b){var a0=a[0];var a1=a[1];var a2=a[2];var a3=a[3];var b0=b[0];var b1=b[1];var b2=b[2];var b3=b[3];var a00=a0[0];var a01=a0[1];var a02=a0[2];var a03=a0[3];var a10=a1[0];var a11=a1[1];var a12=a1[2];var a13=a1[3];var a20=a2[0];var a21=a2[1];var a22=a2[2];var a23=a2[3];var a30=a3[0];var a31=a3[1];var a32=a3[2];var a33=a3[3];var b00=b0[0];var b01=b0[1];var b02=b0[2];var b03=b0[3];var b10=b1[0];var b11=b1[1];var b12=b1[2];var b13=b1[3];var b20=b2[0];var b21=b2[1];var b22=b2[2];var b23=b2[3];var b30=b3[0];var b31=b3[1];var b32=b3[2];var b33=b3[3];a[0].splice(0,4,a00*b00+a10*b01+a20*b02+a30*b03,a01*b00+a11*b01+a21*b02+a31*b03,a02*b00+a12*b01+a22*b02+a32*b03,a03*b00+a13*b01+a23*b02+a33*b03);a[1].splice(0,4,a00*b10+a10*b11+a20*b12+a30*b13,a01*b10+a11*b11+a21*b12+a31*b13,a02*b10+a12*b11+a22*b12+a32*b13,a03*b10+a13*b11+a23*b12+a33*b13);a[2].splice(0,4,a00*b20+a10*b21+a20*b22+a30*b23,a01*b20+a11*b21+a21*b22+a31*b23,a02*b20+a12*b21+a22*b22+a32*b23,a03*b20+a13*b21+a23*b22+a33*b23),a[3].splice(0,4,a00*b30+a10*b31+a20*b32+a30*b33,a01*b30+a11*b31+a21*b32+a31*b33,a02*b30+a12*b31+a22*b32+a32*b33,a03*b30+a13*b31+a23*b32+a33*b33);return a;};o3djs.math.matrix4.translation=function(v){return[[1,0,0,0],[0,1,0,0],[0,0,1,0],[v[0],v[1],v[2],1]];};o3djs.math.matrix4.translate=function(m,v){var v0=v[0];var v1=v[1];var v2=v[2];var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m00=m0[0];var m01=m0[1];var m02=m0[2];var m03=m0[3];var m10=m1[0];var m11=m1[1];var m12=m1[2];var m13=m1[3];var m20=m2[0];var m21=m2[1];var m22=m2[2];var m23=m2[3];var m30=m3[0];var m31=m3[1];var m32=m3[2];var m33=m3[3];m3.splice(0,4,m00*v0+m10*v1+m20*v2+m30,m01*v0+m11*v1+m21*v2+m31,m02*v0+m12*v1+m22*v2+m32,m03*v0+m13*v1+m23*v2+m33);return m;};o3djs.math.matrix4.scaling=function(v){return[[v[0],0,0,0],[0,v[1],0,0],[0,0,v[2],0],[0,0,0,1]];};o3djs.math.matrix4.scale=function(m,v){var v0=v[0];var v1=v[1];var v2=v[2];var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];m0.splice(0,4,v0*m0[0],v0*m0[1],v0*m0[2],v0*m0[3]);m1.splice(0,4,v1*m1[0],v1*m1[1],v1*m1[2],v1*m1[3]);m2.splice(0,4,v2*m2[0],v2*m2[1],v2*m2[2],v2*m2[3]);return m;};o3djs.math.matrix4.rotationX=function(angle){var c=Math.cos(angle);var s=Math.sin(angle);return[[1,0,0,0],[0,c,s,0],[0,-s,c,0],[0,0,0,1]];};o3djs.math.matrix4.rotateX=function(m,angle){var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m10=m1[0];var m11=m1[1];var m12=m1[2];var m13=m1[3];var m20=m2[0];var m21=m2[1];var m22=m2[2];var m23=m2[3];var c=Math.cos(angle);var s=Math.sin(angle);m1.splice(0,4,c*m10+s*m20,c*m11+s*m21,c*m12+s*m22,c*m13+s*m23);m2.splice(0,4,c*m20-s*m10,c*m21-s*m11,c*m22-s*m12,c*m23-s*m13);return m;};o3djs.math.matrix4.rotationY=function(angle){var c=Math.cos(angle);var s=Math.sin(angle);return[[c,0,-s,0],[0,1,0,0],[s,0,c,0],[0,0,0,1]];};o3djs.math.matrix4.rotateY=function(m,angle){var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m00=m0[0];var m01=m0[1];var m02=m0[2];var m03=m0[3];var m20=m2[0];var m21=m2[1];var m22=m2[2];var m23=m2[3];var c=Math.cos(angle);var s=Math.sin(angle);m0.splice(0,4,c*m00-s*m20,c*m01-s*m21,c*m02-s*m22,c*m03-s*m23);m2.splice(0,4,c*m20+s*m00,c*m21+s*m01,c*m22+s*m02,c*m23+s*m03);return m;};o3djs.math.matrix4.rotationZ=function(angle){var c=Math.cos(angle);var s=Math.sin(angle);return[[c,s,0,0],[-s,c,0,0],[0,0,1,0],[0,0,0,1]];};o3djs.math.matrix4.rotateZ=function(m,angle){var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m00=m0[0];var m01=m0[1];var m02=m0[2];var m03=m0[3];var m10=m1[0];var m11=m1[1];var m12=m1[2];var m13=m1[3];var c=Math.cos(angle);var s=Math.sin(angle);m0.splice(0,4,c*m00+s*m10,c*m01+s*m11,c*m02+s*m12,c*m03+s*m13);m1.splice(0,4,c*m10-s*m00,c*m11-s*m01,c*m12-s*m02,c*m13-s*m03);return m;};o3djs.math.matrix4.rotationZYX=function(v){var sinx=Math.sin(v[0]);var cosx=Math.cos(v[0]);var siny=Math.sin(v[1]);var cosy=Math.cos(v[1]);var sinz=Math.sin(v[2]);var cosz=Math.cos(v[2]);var coszsiny=cosz*siny;var sinzsiny=sinz*siny;return[[cosz*cosy,sinz*cosy,-siny,0],[coszsiny*sinx-sinz*cosx,sinzsiny*sinx+cosz*cosx,cosy*sinx,0],[coszsiny*cosx+sinz*sinx,sinzsiny*cosx-cosz*sinx,cosy*cosx,0],[0,0,0,1]];};o3djs.math.matrix4.rotateZYX=function(m,v){var sinX=Math.sin(v[0]);var cosX=Math.cos(v[0]);var sinY=Math.sin(v[1]);var cosY=Math.cos(v[1]);var sinZ=Math.sin(v[2]);var cosZ=Math.cos(v[2]);var cosZSinY=cosZ*sinY;var sinZSinY=sinZ*sinY;var r00=cosZ*cosY;var r01=sinZ*cosY;var r02=-sinY;var r10=cosZSinY*sinX-sinZ*cosX;var r11=sinZSinY*sinX+cosZ*cosX;var r12=cosY*sinX;var r20=cosZSinY*cosX+sinZ*sinX;var r21=sinZSinY*cosX-cosZ*sinX;var r22=cosY*cosX;var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m00=m0[0];var m01=m0[1];var m02=m0[2];var m03=m0[3];var m10=m1[0];var m11=m1[1];var m12=m1[2];var m13=m1[3];var m20=m2[0];var m21=m2[1];var m22=m2[2];var m23=m2[3];var m30=m3[0];var m31=m3[1];var m32=m3[2];var m33=m3[3];m0.splice(0,4,r00*m00+r01*m10+r02*m20,r00*m01+r01*m11+r02*m21,r00*m02+r01*m12+r02*m22,r00*m03+r01*m13+r02*m23);m1.splice(0,4,r10*m00+r11*m10+r12*m20,r10*m01+r11*m11+r12*m21,r10*m02+r11*m12+r12*m22,r10*m03+r11*m13+r12*m23);m2.splice(0,4,r20*m00+r21*m10+r22*m20,r20*m01+r21*m11+r22*m21,r20*m02+r21*m12+r22*m22,r20*m03+r21*m13+r22*m23);return m;};o3djs.math.matrix4.axisRotation=function(axis,angle){var x=axis[0];var y=axis[1];var z=axis[2];var n=Math.sqrt(x*x+y*y+z*z);x/=n;y/=n;z/=n;var xx=x*x;var yy=y*y;var zz=z*z;var c=Math.cos(angle);var s=Math.sin(angle);var oneMinusCosine=1-c;return[[xx+(1-xx)*c,x*y*oneMinusCosine+z*s,x*z*oneMinusCosine-y*s,0],[x*y*oneMinusCosine-z*s,yy+(1-yy)*c,y*z*oneMinusCosine+x*s,0],[x*z*oneMinusCosine+y*s,y*z*oneMinusCosine-x*s,zz+(1-zz)*c,0],[0,0,0,1]];};o3djs.math.matrix4.axisRotate=function(m,axis,angle){var x=axis[0];var y=axis[1];var z=axis[2];var n=Math.sqrt(x*x+y*y+z*z);x/=n;y/=n;z/=n;var xx=x*x;var yy=y*y;var zz=z*z;var c=Math.cos(angle);var s=Math.sin(angle);var oneMinusCosine=1-c;var r00=xx+(1-xx)*c;var r01=x*y*oneMinusCosine+z*s;var r02=x*z*oneMinusCosine-y*s;var r10=x*y*oneMinusCosine-z*s;var r11=yy+(1-yy)*c;var r12=y*z*oneMinusCosine+x*s;var r20=x*z*oneMinusCosine+y*s;var r21=y*z*oneMinusCosine-x*s;var r22=zz+(1-zz)*c;var m0=m[0];var m1=m[1];var m2=m[2];var m3=m[3];var m00=m0[0];var m01=m0[1];var m02=m0[2];var m03=m0[3];var m10=m1[0];var m11=m1[1];var m12=m1[2];var m13=m1[3];var m20=m2[0];var m21=m2[1];var m22=m2[2];var m23=m2[3];var m30=m3[0];var m31=m3[1];var m32=m3[2];var m33=m3[3];m0.splice(0,4,r00*m00+r01*m10+r02*m20,r00*m01+r01*m11+r02*m21,r00*m02+r01*m12+r02*m22,r00*m03+r01*m13+r02*m23);m1.splice(0,4,r10*m00+r11*m10+r12*m20,r10*m01+r11*m11+r12*m21,r10*m02+r11*m12+r12*m22,r10*m03+r11*m13+r12*m23);m2.splice(0,4,r20*m00+r21*m10+r22*m20,r20*m01+r21*m11+r22*m21,r20*m02+r21*m12+r22*m22,r20*m03+r21*m13+r22*m23);return m;};o3djs.math.installRowMajorFunctions=function(){for(var f in o3djs.math.rowMajor){o3djs.math[f]=o3djs.math.rowMajor[f];}};o3djs.math.installColumnMajorFunctions=function(){for(var f in o3djs.math.columnMajor){o3djs.math[f]=o3djs.math.columnMajor[f];}};o3djs.math.installErrorCheckFunctions=function(){for(var f in o3djs.math.errorCheck){o3djs.math[f]=o3djs.math.errorCheck[f];}};o3djs.math.installErrorCheckFreeFunctions=function(){for(var f in o3djs.math.errorCheckFree){o3djs.math[f]=o3djs.math.errorCheckFree[f];}}
o3djs.math.installRowMajorFunctions();o3djs.math.installErrorCheckFunctions();o3djs.quaternions=o3djs.quaternions||{};o3djs.quaternions.Quaternion=goog.typedef;o3djs.quaternions.mathType=function(a){if(typeof(a)==='number')
return'Scalar';return'Quaternion';};o3djs.quaternions.copy=function(q){return q.slice();};o3djs.quaternions.negative=function(q){return[-q[0],-q[1],-q[2],-q[3]];};o3djs.quaternions.addQuaternionQuaternion=function(a,b){return[a[0]+b[0],a[1]+b[1],a[2]+b[2],a[3]+b[3]];};o3djs.quaternions.addQuaternionScalar=function(a,b){return a.slice(0,3).concat(a[3]+b);};o3djs.quaternions.addScalarQuaternion=function(a,b){return b.slice(0,3).concat(a+b[3]);};o3djs.quaternions.subQuaternionQuaternion=function(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2],a[3]-b[3]];};o3djs.quaternions.subQuaternionScalar=function(a,b){return a.slice(0,3).concat(a[3]-b);};o3djs.quaternions.subScalarQuaternion=function(a,b){return[-b[0],-b[1],-b[2],a-b[3]];};o3djs.quaternions.mulScalarQuaternion=function(k,q){return[k*q[0],k*q[1],k*q[2],k*q[3]];};o3djs.quaternions.mulQuaternionScalar=function(q,k){return[k*q[0],k*q[1],k*q[2],k*q[3]];};o3djs.quaternions.mulQuaternionQuaternion=function(a,b){var aX=a[0];var aY=a[1];var aZ=a[2];var aW=a[3];var bX=b[0];var bY=b[1];var bZ=b[2];var bW=b[3];return[aW*bX+aX*bW+aY*bZ-aZ*bY,aW*bY+aY*bW+aZ*bX-aX*bZ,aW*bZ+aZ*bW+aX*bY-aY*bX,aW*bW-aX*bX-aY*bY-aZ*bZ];};o3djs.quaternions.divQuaternionQuaternion=function(a,b){var aX=a[0];var aY=a[1];var aZ=a[2];var aW=a[3];var bX=b[0];var bY=b[1];var bZ=b[2];var bW=b[3];var d=1/(bW*bW+bX*bX+bY*bY+bZ*bZ);return[(aX*bW-aW*bX-aY*bZ+aZ*bY)*d,(aX*bZ-aW*bY+aY*bW-aZ*bX)*d,(aY*bX+aZ*bW-aW*bZ-aX*bY)*d,(aW*bW+aX*bX+aY*bY+aZ*bZ)*d];};o3djs.quaternions.divQuaternionScalar=function(q,k){return[q[0]/k,q[1]/k,q[2]/k,q[3]/k];};o3djs.quaternions.divScalarQuaternion=function(a,b){var b0=b[0];var b1=b[1];var b2=b[2];var b3=b[3];var d=1/(b0*b0+b1*b1+b2*b2+b3*b3);return[-a*b0*d,-a*b1*d,-a*b2*d,a*b3*d];};o3djs.quaternions.inverse=function(q){var q0=q[0];var q1=q[1];var q2=q[2];var q3=q[3];var d=1/(q0*q0+q1*q1+q2*q2+q3*q3);return[-q0*d,-q1*d,-q2*d,q3*d];};o3djs.quaternions.mul=function(a,b){return o3djs.quaternions['mul'+o3djs.quaternions.mathType(a)+
o3djs.quaternions.mathType(b)](a,b);};o3djs.quaternions.div=function(a,b){return o3djs.quaternions['div'+o3djs.quaternions.mathType(a)+
o3djs.quaternions.mathType(b)](a,b);};o3djs.quaternions.add=function(a,b){return o3djs.quaternions['add'+o3djs.quaternions.mathType(a)+
o3djs.quaternions.mathType(b)](a,b);};o3djs.quaternions.sub=function(a,b){return o3djs.quaternions['sub'+o3djs.quaternions.mathType(a)+
o3djs.quaternions.mathType(b)](a,b);};o3djs.quaternions.length=function(a){return Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]+a[3]*a[3]);};o3djs.quaternions.lengthSquared=function(a){return a[0]*a[0]+a[1]*a[1]+a[2]*a[2]+a[3]*a[3];};o3djs.quaternions.normalize=function(a){var d=1/Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]+a[3]*a[3]);return[a[0]*d,a[1]*d,a[2]*d,a[3]*d];};o3djs.quaternions.conjugate=function(q){return[-q[0],-q[1],-q[2],q[3]];};o3djs.quaternions.rotationX=function(angle){return[Math.sin(angle/2),0,0,Math.cos(angle/2)];};o3djs.quaternions.rotationY=function(angle){return[0,Math.sin(angle/2),0,Math.cos(angle/2)];};o3djs.quaternions.rotationZ=function(angle){return[0,0,Math.sin(angle/2),Math.cos(angle/2)];};o3djs.quaternions.axisRotation=function(axis,angle){var d=1/Math.sqrt(axis[0]*axis[0]+
axis[1]*axis[1]+
axis[2]*axis[2]);var sin=Math.sin(angle/2);var cos=Math.cos(angle/2);return[sin*axis[0]*d,sin*axis[1]*d,sin*axis[2]*d,cos];};o3djs.quaternions.quaternionToRotation=function(q){var qX=q[0];var qY=q[1];var qZ=q[2];var qW=q[3];var qWqW=qW*qW;var qWqX=qW*qX;var qWqY=qW*qY;var qWqZ=qW*qZ;var qXqW=qX*qW;var qXqX=qX*qX;var qXqY=qX*qY;var qXqZ=qX*qZ;var qYqW=qY*qW;var qYqX=qY*qX;var qYqY=qY*qY;var qYqZ=qY*qZ;var qZqW=qZ*qW;var qZqX=qZ*qX;var qZqY=qZ*qY;var qZqZ=qZ*qZ;var d=qWqW+qXqX+qYqY+qZqZ;return[[(qWqW+qXqX-qYqY-qZqZ)/d,2*(qWqZ+qXqY)/d,2*(qXqZ-qWqY)/d,0],[2*(qXqY-qWqZ)/d,(qWqW-qXqX+qYqY-qZqZ)/d,2*(qWqX+qYqZ)/d,0],[2*(qWqY+qXqZ)/d,2*(qYqZ-qWqX)/d,(qWqW-qXqX-qYqY+qZqZ)/d,0],[0,0,0,1]];};o3djs.quaternions.rotationToQuaternion=function(m){var u;var v;var w;var q=[];var m0=m[0];var m1=m[1];var m2=m[2];var m00=m0[0];var m11=m1[1];var m22=m2[2];var trace=m00+m11+m22;if(trace>0){var r=Math.sqrt(1+trace);var k=0.5/r;return[(m1[2]-m2[1])*k,(m2[0]-m0[2])*k,(m0[1]-m1[0])*k,0.5*r];}
var mu;var mv;var mw;if(m00>m11&&m00>m22){u=0;mu=m0;v=1;mv=m1;w=2;mw=m2;}else if(m11>m00&&m11>m22){u=1;mu=m1;v=2;mv=m2;w=0;mw=m0;}else{u=2;mu=m2;v=0;mv=m0;w=1;mw=m1;}
var r=Math.sqrt(1+mu[u]-mv[v]-mw[w]);var k=0.5/r;q[u]=0.5*r;q[v]=(mv[u]+mu[v])*k;q[w]=(mu[w]+mw[u])*k;q[3]=(mv[w]-mw[v])*k;return q;};o3djs.arcball=o3djs.arcball||{};o3djs.arcball.create=function(areaWidth,areaHeight){return new o3djs.arcball.ArcBall(areaWidth,areaHeight);};o3djs.arcball.ArcBall=function(areaWidth,areaHeight){this.startVector_=[0,0,0];this.endVector_=[0,0,0];this.areaWidth_=areaWidth;this.areaHeight_=areaHeight;};o3djs.arcball.ArcBall.prototype.setAreaSize=function(areaWidth,areaHeight){this.areaWidth_=areaWidth;this.areaHeight_=areaHeight;};o3djs.arcball.ArcBall.prototype.mapToSphere=function(newPoint){var tempPoint=o3djs.math.copyVector(newPoint);tempPoint[0]=tempPoint[0]/this.areaWidth_*2.0-1.0;tempPoint[1]=1.0-tempPoint[1]/this.areaHeight_*2.0;var lengthSquared=o3djs.math.lengthSquared(tempPoint);if(lengthSquared>1.0){return o3djs.math.normalize(tempPoint).concat(0);}else{return tempPoint.concat(Math.sqrt(1.0-lengthSquared));}};o3djs.arcball.ArcBall.prototype.click=function(newPoint){this.startVector_=this.mapToSphere(newPoint);};o3djs.arcball.ArcBall.prototype.drag=function(newPoint){this.endVector_=this.mapToSphere(newPoint);return o3djs.math.cross(this.startVector_,this.endVector_).concat(o3djs.math.dot(this.startVector_,this.endVector_));};o3djs.texture=o3djs.texture||{};o3djs.texture.MAX_TEXTURE_DIMENSION=2048;o3djs.texture.computeNumLevels=function(width,height){if(width==0||height==0){return 0;}
var max=Math.max(width,height);var levels=0;while(max>0){++levels;max=max>>1;}
return levels;};o3djs.texture.createTextureFromRawData=function(pack,rawData,opt_generateMips,opt_flip,opt_maxWidth,opt_maxHeight){var bitmaps=pack.createBitmapsFromRawData(rawData);if(opt_flip||typeof opt_flip==='undefined'){for(var ii=0;ii<bitmaps.length;++ii){var bitmap=bitmaps[ii];if(bitmap.semantic==o3djs.base.o3d.Bitmap.IMAGE){bitmaps[ii].flipVertically();}}}
var texture=o3djs.texture.createTextureFromBitmaps(pack,bitmaps,opt_generateMips);for(var ii=0;ii<bitmaps.length;++ii){pack.removeObject(bitmaps[ii]);}
return texture;};o3djs.texture.createTextureFromRawDataArray=function(pack,rawDataArray,opt_generateMips,opt_flip,opt_maxWidth,opt_maxHeight){var bitmaps=[];for(var ii=0;ii<rawDataArray.length;++ii){bitmaps=bitmaps.concat(pack.createBitmapsFromRawData(rawDataArray[ii]));}
if(opt_flip||typeof opt_flip==='undefined'){for(var ii=0;ii<bitmaps.length;++ii){var bitmap=bitmaps[ii];if(bitmap.semantic==o3djs.base.o3d.Bitmap.IMAGE){bitmaps[ii].flipVertically();}}}
var texture=o3djs.texture.createTextureFromBitmaps(pack,bitmaps,opt_generateMips);for(var ii=0;ii<bitmaps.length;++ii){pack.removeObject(bitmaps[ii]);}
return texture;};o3djs.texture.canMakeMipsAndScale=function(format){switch(format){case o3djs.base.o3d.Texture.XRGB8:case o3djs.base.o3d.Texture.ARGB8:case o3djs.base.o3d.Texture.ABGR16F:case o3djs.base.o3d.Texture.R32F:case o3djs.base.o3d.Texture.ABGR32F:return true;case o3djs.base.o3d.Texture.DXT1:case o3djs.base.o3d.Texture.DXT3:case o3djs.base.o3d.Texture.DXT5:return false;}
return false;};o3djs.texture.createTextureFromBitmaps=function(pack,bitmaps,opt_generateMips){if(bitmaps.length==0){throw'no bitmaps';}
var srcWidth=bitmaps[0].width;var srcHeight=bitmaps[0].height;var format=bitmaps[0].format;var mipMaps=bitmaps[0].numMipmaps;var maxMips=o3djs.texture.computeNumLevels(srcWidth,srcHeight);var targetMips=mipMaps;var dstWidth=srcWidth;var dstHeight=srcHeight;if((typeof opt_generateMips==='undefined'||opt_generateMips)&&o3djs.texture.canMakeMipsAndScale(format)&&mipMaps==1&&maxMips>1){targetMips=maxMips;}
for(var ii=0;ii<bitmaps.length;++ii){var bitmap=bitmaps[ii];if(bitmap.width!=srcWidth||bitmap.height!=srcHeight||bitmap.format!=format||bitmap.numMipmaps!=mipMaps){throw'bitmaps must all be the same width, height, mips and format';}
if(targetMips!=mipMaps){bitmap.generateMips(0,targetMips-1);}}
var levels=bitmap.numMipmaps>1?bitmap.numMipmaps:o3djs.texture.computeNumLevels(dstWidth,dstHeight);var texture;if(bitmaps.length==6&&bitmaps[0].semantic!=o3djs.base.o3d.Bitmap.SLICE){if(srcWidth!=srcHeight||srcWidth!=dstWidth||srcHeight!=dstHeight){throw'Cubemaps must be square';}
texture=pack.createTextureCUBE(dstWidth,format,targetMips,false);for(var ii=0;ii<6;++ii){texture.setFromBitmap((ii),bitmaps[ii]);}}else if(bitmaps.length==1){texture=pack.createTexture2D(dstWidth,dstHeight,format,targetMips,false);texture.setFromBitmap(bitmaps[0]);}
return(texture);};o3djs.texture.createCubeTextureFrom6Bitmaps=function(pack,edgeLength,bitmaps){var numMips=o3djs.texture.computeNumLevels(edgeLength,edgeLength);var texture=pack.createTextureCUBE(edgeLength,bitmaps[0].format,numMips,false);for(var ii=0;ii<6;++ii){var bitmap=bitmaps[ii];texture.setFromBitmap(ii,bitmap);}
texture.generateMips(0,numMips-1);return texture;};o3djs.io=o3djs.io||{};o3djs.io.createLoadInfo=function(opt_request,opt_hasStatus){return new o3djs.io.LoadInfo(opt_request,opt_hasStatus);};o3djs.io.LoadInfo=function(opt_request,opt_hasStatus){this.request_=opt_request;this.hasStatus_=opt_hasStatus;this.streamLength_=0;this.children_=[];};o3djs.io.LoadInfo.prototype.addChild=function(loadInfo){this.children_.push(loadInfo);};o3djs.io.LoadInfo.prototype.finish=function(){if(this.request_){if(this.hasStatus_){this.streamLength_=this.request_.streamLength;}
this.request_=null;}};o3djs.io.LoadInfo.prototype.getTotalKnownBytesToStreamSoFar=function(){if(!this.streamLength_&&this.request_&&this.hasStatus_){this.streamLength_=this.request_.streamLength;}
var total=this.streamLength_;for(var cc=0;cc<this.children_.length;++cc){total+=this.children_[cc].getTotalKnownBytesToStreamSoFar();}
return total;};o3djs.io.LoadInfo.prototype.getTotalBytesDownloaded=function(){var total=(this.request_&&this.hasStatus_)?this.request_.bytesReceived:this.streamLength_;for(var cc=0;cc<this.children_.length;++cc){total+=this.children_[cc].getTotalBytesDownloaded();}
return total;};o3djs.io.LoadInfo.prototype.getTotalKnownRequestsToStreamSoFar=function(){var total=1;for(var cc=0;cc<this.children_.length;++cc){total+=this.children_[cc].getTotalKnownRequestToStreamSoFar();}
return total;};o3djs.io.LoadInfo.prototype.getTotalRequestsDownloaded=function(){var total=this.request_?0:1;for(var cc=0;cc<this.children_.length;++cc){total+=this.children_[cc].getTotalRequestsDownloaded();}
return total;};o3djs.io.LoadInfo.prototype.getKnownProgressInfoSoFar=function(){var percent=0;var bytesToDownload=this.getTotalKnownBytesToStreamSoFar();var bytesDownloaded=this.getTotalBytesDownloaded();if(bytesToDownload>0){percent=Math.floor(bytesDownloaded/bytesToDownload*100);}
var base=(bytesToDownload<1024*1024)?1024:(1024*1024);return{percent:percent,downloaded:(bytesDownloaded/base).toFixed(2),totalBytes:(bytesToDownload/base).toFixed(2),base:base,suffix:(base==1024?'kb':'mb')}};o3djs.io.loadTextFileSynchronous=function(url){o3djs.BROWSER_ONLY=true;var error='loadTextFileSynchronous failed to load url "'+url+'"';var request;if(!o3djs.base.IsMSIE()&&window.XMLHttpRequest){request=new XMLHttpRequest();if(request.overrideMimeType){request.overrideMimeType('text/plain');}}else if(window.ActiveXObject){request=new ActiveXObject('MSXML2.XMLHTTP.3.0');}else{throw'XMLHttpRequest is disabled';}
request.open('GET',url,false);request.send(null);if(request.readyState!=4){throw error;}
return request.responseText;};o3djs.io.loadTextFile=function(url,callback){o3djs.BROWSER_ONLY=true;var error='loadTextFile failed to load url "'+url+'"';var request;if(!o3djs.base.IsMSIE()&&window.XMLHttpRequest){request=new XMLHttpRequest();if(request.overrideMimeType){request.overrideMimeType('text/plain');}}else if(window.ActiveXObject){request=new ActiveXObject('MSXML2.XMLHTTP.3.0');}else{throw'XMLHttpRequest is disabled';}
var loadInfo=o3djs.io.createLoadInfo(request,false);request.open('GET',url,true);var finish=function(){if(request.readyState==4){var text='';var success=request.status==200||request.status==0;if(success){text=request.responseText;}
loadInfo.finish();callback(text,success?null:'could not load: '+url);}};request.onreadystatechange=finish;request.send(null);return loadInfo;};o3djs.io.ArchiveInfo=function(pack,url,onFinished){var that=this;this.files={};this.pack=pack;this.destroyed=false;this.request_=null;function addFile(rawData){that.files[rawData.uri]=rawData;}
this.loadInfo=o3djs.io.loadArchiveAdvanced(pack,url,addFile,function(request,exception){that.request_=request;onFinished(that,exception);});};o3djs.io.ArchiveInfo.prototype.destroy=function(){if(!this.destroyed){this.pack.removeObject(this.request_);this.destroyed=true;this.files={};}};o3djs.io.ArchiveInfo.prototype.getFiles=function(uri,opt_caseInsensitive){if(!(uri instanceof RegExp)){uri=uri.replace(/(\W)/g,'\\$&');uri=uri.replace(/\\\*/g,'.*');uri=uri.replace(/\\\?/g,'.');uri=new RegExp(uri,opt_caseInsensitive?'i':'');}
var files=[];for(var key in this.files){if(uri.test(key)){files.push(this.files[key]);}}
return files;};o3djs.io.ArchiveInfo.prototype.getFileByURI=function(uri,opt_caseInsensitive){if(opt_caseInsensitive){uri=uri.toLowerCase();for(var key in this.files){if(key.toLowerCase()==uri){return this.files[key];}}
return undefined;}else{return this.files[uri];}};o3djs.io.loadArchive=function(pack,url,onFinished){var archiveInfo=new o3djs.io.ArchiveInfo(pack,url,onFinished);return archiveInfo.loadInfo;};o3djs.io.loadArchiveAdvanced=function(pack,url,onFileAvailable,onFinished){var error='loadArchive failed to load url "'+url+'"';var request=pack.createArchiveRequest();var loadInfo=o3djs.io.createLoadInfo(request,true);request.open('GET',url);request.onfileavailable=onFileAvailable;request.onreadystatechange=function(){if(request.done){loadInfo.finish();var success=request.success;var exception=null;if(!success){exception=request.error;if(!exception){exception='unknown error loading archive';}}
onFinished(request,exception);}};request.send();return loadInfo;};o3djs.io.loadRawData=function(pack,url,callback){var request=pack.createFileRequest('RAWDATA');var loadInfo=o3djs.io.createLoadInfo((request),false);request.open('GET',url,true);request.onreadystatechange=function(){if(request.done){var data=request.data;var success=request.success;var exception=request.error;loadInfo.finish();if(!success&&!exception){exception='unknown error loading RawData: '+url;}
callback(request,data,success?null:exception);}};request.send();return loadInfo;};o3djs.io.loadBitmaps=function(pack,url,callback,opt_generateMips){if(typeof opt_generateMips==='undefined'){opt_generateMips=true;}
return o3djs.io.loadRawData(pack,url,function(request,rawData,exception){var bitmaps=[];if(!exception){bitmaps=pack.createBitmapsFromRawData(rawData);pack.removeObject(request);}
callback(bitmaps,exception);});};o3djs.io.loadTexture=function(pack,url,callback,opt_generateMips,opt_flip){function onLoaded(request,rawData,exception){var texture=null;if(!exception){texture=o3djs.texture.createTextureFromRawData(pack,rawData,opt_generateMips,opt_flip);pack.removeObject(request);}
callback(texture,exception);};return o3djs.io.loadRawData(pack,url,onLoaded);};o3djs.effect=o3djs.effect||{};o3djs.effect.TWO_COLOR_CHECKER_EFFECT_NAME='o3djs.effect.twoColorCheckerEffect';o3djs.effect.o3d={LANGUAGE:'o3d',FLOAT2:'float2',FLOAT3:'float3',FLOAT4:'float4',MATRIX4:'float4x4',MATRIX3:'float3x3',MOD:'fmod',ATTRIBUTE:'  ',ATTRIBUTE_PREFIX:'input.',VARYING:'  ',VARYING_DECLARATION_PREFIX:'',VERTEX_VARYING_PREFIX:'output.',PIXEL_VARYING_PREFIX:'input.',TEXTURE:'tex',SAMPLER:'sampler',BEGIN_IN_STRUCT:'struct InVertex {\n',BEGIN_OUT_STRUCT:'struct OutVertex {\n',END_STRUCT:'};\n'};o3djs.effect.glsl={LANGUAGE:'glsl',FLOAT2:'vec2',FLOAT3:'vec3',FLOAT4:'vec4',MATRIX4:'mat4',MATRIX3:'mat3',MOD:'mod',ATTRIBUTE:'attribute ',ATTRIBUTE_PREFIX:'',VARYING:'varying ',VARYING_DECLARATION_PREFIX:'v_',VERTEX_VARYING_PREFIX:'v_',PIXEL_VARYING_PREFIX:'v_',TEXTURE:'texture',SAMPLER:'sampler2D',BEGIN_IN_STRUCT:'',BEGIN_OUT_STRUCT:'',END_STRUCT:'',semanticNameMap:{'POSITION':'position','NORMAL':'normal','TANGENT':'tangent','BINORMAL':'binormal','COLOR':'color','TEXCOORD0':'texCoord0','TEXCOORD1':'texCoord1','TEXCOORD2':'texCoord2','TEXCOORD3':'texCoord3','TEXCOORD4':'texCoord4','TEXCOORD5':'texCoord5','TEXCOORD6':'texCoord6','TEXCOORD7':'texCoord7'}};o3djs.effect.glsl.semanticSuffix=function(name){return'';};o3djs.effect.o3d.semanticSuffix=function(name){return' : '+name;};o3djs.effect.glsl.getAttributeName_=function(name,semantic){var p=o3djs.effect;return p.semanticNameMap[semantic];};o3djs.effect.o3d.getAttributeName_=function(name,semantic){return name;};o3djs.effect.glsl.mul=function(a,b){return'('+b+' * '+a+')';};o3djs.effect.o3d.mul=function(a,b){return'mul('+a+', '+b+')';};o3djs.effect.glsl.utilityFunctions=function(){return'vec4 lit(float l ,float h, float m) {\n'+'  return vec4(1.0,\n'+'              max(l, 0.0),\n'+'              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,\n'+'              1.0);\n'+'}\n';};o3djs.effect.o3d.utilityFunctions=function(){return'';}
o3djs.effect.glsl.beginVertexShaderMain=function(){return'void main() {\n';};o3djs.effect.o3d.beginVertexShaderMain=function(){return'OutVertex vertexShaderFunction(InVertex input) {\n'+'  OutVertex output;\n';};o3djs.effect.glsl.endVertexShaderMain=function(){return'  gl_Position = '+o3djs.effect.VERTEX_VARYING_PREFIX+'position;\n}\n';};o3djs.effect.o3d.endVertexShaderMain=function(){return'  return output;\n}\n';};o3djs.effect.glsl.pixelShaderHeader=function(material,diffuse,specular,bumpSampler){return'\n// #o3d SplitMarker\n';};o3djs.effect.o3d.pixelShaderHeader=function(material,diffuse,specular,bumpSampler){return'';};o3djs.effect.glsl.repeatVaryingDecls=function(opt_decls){return(opt_decls||o3djs.effect.varying_decls_||o3djs.buildVaryingDecls())+'\n';};o3djs.effect.o3d.repeatVaryingDecls=function(opt_decls){return'';};o3djs.effect.glsl.beginPixelShaderMain=function(){return'void main() {\n';};o3djs.effect.o3d.beginPixelShaderMain=function(){return'float4 pixelShaderFunction(OutVertex input) : COLOR {\n';};o3djs.effect.o3d.endPixelShaderMain=function(color){return'  return '+color+';\n}\n';};o3djs.effect.glsl.endPixelShaderMain=function(color){return'  gl_FragColor = '+color+';\n}\n';};o3djs.effect.o3d.entryPoints=function(){return'// #o3d VertexShaderEntryPoint vertexShaderFunction\n'+'// #o3d PixelShaderEntryPoint pixelShaderFunction\n';};o3djs.effect.glsl.entryPoints=function(){return'';};o3djs.effect.glsl.matrixLoadOrder=o3djs.effect.o3d.matrixLoadOrder=function(){return'// #o3d MatrixLoadOrder RowMajor\n';};o3djs.effect.setLanguage=function(language){var language_namespace=o3djs.effect.o3d;if(language=='glsl'){language_namespace=o3djs.effect.glsl;}
for(var f in o3djs.effect.glsl){o3djs.effect[f]=language_namespace[f];}
o3djs.effect.TWO_COLOR_CHECKER_FXSTRING=o3djs.effect.buildCheckerShaderString();};o3djs.effect.getLanguage=function(){if(language_namespace==o3djs.effect.glsl){return'glsl';}
return'o3d';};o3djs.effect.buildAttributeDecls=function(material,diffuse,specular,bumpSampler){var str=o3djs.effect.BEGIN_IN_STRUCT+
o3djs.effect.ATTRIBUTE+o3djs.effect.FLOAT4+' '+'position'+
o3djs.effect.semanticSuffix('POSITION')+';\n';if(diffuse||specular){str+=o3djs.effect.ATTRIBUTE+o3djs.effect.FLOAT3+' '+'normal'+
o3djs.effect.semanticSuffix('NORMAL')+';\n';}
str+=o3djs.effect.buildTexCoords(material,false)+
o3djs.effect.buildBumpInputCoords(bumpSampler)+
o3djs.effect.END_STRUCT;return str;};o3djs.effect.varying_decls_='';o3djs.effect.buildVaryingDecls=function(material,diffuse,specular,bumpSampler){var p=o3djs.effect;var str=p.BEGIN_OUT_STRUCT+
p.VARYING+p.FLOAT4+' '+
p.VARYING_DECLARATION_PREFIX+'position'+
p.semanticSuffix('POSITION')+';\n'+
p.buildTexCoords(material,true)+
p.buildBumpOutputCoords(bumpSampler);if(diffuse||specular){str+=p.VARYING+p.FLOAT3+' '+
p.VARYING_DECLARATION_PREFIX+'normal'+
p.semanticSuffix('TEXCOORD'+
p.interpolant_+++'')+';\n'+
p.VARYING+p.FLOAT3+' '+
p.VARYING_DECLARATION_PREFIX+'surfaceToLight'+
p.semanticSuffix('TEXCOORD'+p.interpolant_+++'')+';\n';}
if(specular){str+=p.VARYING+p.FLOAT3+' '+
p.VARYING_DECLARATION_PREFIX+'surfaceToView'+
p.semanticSuffix('TEXCOORD'+p.interpolant_+++'')+';\n';}
str+=p.END_STRUCT;p.varying_decls_=str;return str;};o3djs.effect.interpolant_=0;o3djs.effect.buildTexCoord=function(material,varying,name){var p=o3djs.effect;if(material.getParam(name+'Sampler')){if(varying){return'  '+p.VARYING+p.FLOAT2+' '+
p.VARYING_DECLARATION_PREFIX+name+'UV'+
p.semanticSuffix('TEXCOORD'+p.interpolant_+++'')+';\n';}else{var desiredName=name+'UV';var semantic='TEXCOORD'+p.interpolant_++;var outputName=p.getAttributeName_(desiredName,semantic);if(p.semanticNameMap){p.nameToSemanticMap_[desiredName]=semantic;}
return'  '+p.ATTRIBUTE+p.FLOAT2+' '+outputName+
p.semanticSuffix(semantic)+';\n';}}else{return'';}};o3djs.effect.buildTexCoords=function(material,varying){var p=o3djs.effect;p.interpolant_=0;if(!varying){p.nameToSemanticMap_={};}
return p.buildTexCoord(material,varying,'emissive')+
p.buildTexCoord(material,varying,'ambient')+
p.buildTexCoord(material,varying,'diffuse')+
p.buildTexCoord(material,varying,'specular');};o3djs.effect.buildUVPassthrough=function(material,name){var p=o3djs.effect;if(material.getParam(name+'Sampler')){var sourceName=name+'UV';var destName=sourceName;var semantic=p.nameToSemanticMap_[sourceName];if(semantic){sourceName=p.getAttributeName_(sourceName,semantic);}
return'  '+p.VERTEX_VARYING_PREFIX+destName+' = '+
p.ATTRIBUTE_PREFIX+sourceName+';\n';}else{return'';}};o3djs.effect.buildUVPassthroughs=function(material){var p=o3djs.effect;return p.buildUVPassthrough(material,'emissive')+
p.buildUVPassthrough(material,'ambient')+
p.buildUVPassthrough(material,'diffuse')+
p.buildUVPassthrough(material,'specular')+
p.buildUVPassthrough(material,'bump');};o3djs.effect.buildBumpInputCoords=function(bumpSampler){var p=o3djs.effect;return bumpSampler?('  '+p.FLOAT3+' tangent'+
p.semanticSuffix('TANGENT')+';\n'+'  '+p.FLOAT3+' binormal'+
p.semanticSuffix('BINORMAL')+';\n'+'  '+p.FLOAT2+' bumpUV'+
p.semanticSuffix('TEXCOORD'+p.interpolant_++)+';\n'):'';};o3djs.effect.buildBumpOutputCoords=function(bumpSampler){var p=o3djs.effect;return bumpSampler?('  '+p.FLOAT3+' tangent'+
p.semanticSuffix('TEXCOORD'+p.interpolant_++)+';\n'+'  '+p.FLOAT3+' binormal'+
p.semanticSuffix('TEXCOORD'+
p.interpolant_++)+';\n'+'  '+p.FLOAT2+' bumpUV'+
p.semanticSuffix('TEXCOORD'+p.interpolant_++)+';\n'):'';};o3djs.effect.buildCheckerShaderString=function(){var p=o3djs.effect;var varyingDecls=p.BEGIN_OUT_STRUCT+
p.VARYING+p.FLOAT4+' '+
p.VARYING_DECLARATION_PREFIX+'position'+
p.semanticSuffix('POSITION')+';\n'+
p.VARYING+p.FLOAT2+' '+
p.VARYING_DECLARATION_PREFIX+'texCoord'+
p.semanticSuffix('TEXCOORD0')+';\n'+
p.VARYING+p.FLOAT3+' '+
p.VARYING_DECLARATION_PREFIX+'normal'+
p.semanticSuffix('TEXCOORD1')+';\n'+
p.VARYING+p.FLOAT3+' '+
p.VARYING_DECLARATION_PREFIX+'worldPosition'+
p.semanticSuffix('TEXCOORD2')+';\n'+
p.END_STRUCT;return'uniform '+p.MATRIX4+' worldViewProjection'+
p.semanticSuffix('WORLDVIEWPROJECTION')+';\n'+'uniform '+p.MATRIX4+' worldInverseTranspose'+
p.semanticSuffix('WORLDINVERSETRANSPOSE')+';\n'+'uniform '+p.MATRIX4+' world'+
p.semanticSuffix('WORLD')+';\n'+'\n'+
p.BEGIN_IN_STRUCT+
p.ATTRIBUTE+p.FLOAT4+' position'+
p.semanticSuffix('POSITION')+';\n'+
p.ATTRIBUTE+p.FLOAT3+' normal'+
p.semanticSuffix('NORMAL')+';\n'+
p.ATTRIBUTE+p.FLOAT2+' texCoord0'+
p.semanticSuffix('TEXCOORD0')+';\n'+
p.END_STRUCT+'\n'+
varyingDecls+'\n'+
p.beginVertexShaderMain()+'  '+p.VERTEX_VARYING_PREFIX+'position = '+
p.mul(p.ATTRIBUTE_PREFIX+'position','worldViewProjection')+';\n'+'  '+p.VERTEX_VARYING_PREFIX+'normal = '+
p.mul(p.FLOAT4+'('+
p.ATTRIBUTE_PREFIX+'normal, 0.0)','worldInverseTranspose')+'.xyz;\n'+'  '+p.VERTEX_VARYING_PREFIX+'worldPosition = '+
p.mul(p.ATTRIBUTE_PREFIX+'position','world')+'.xyz;\n'+'  '+p.VERTEX_VARYING_PREFIX+'texCoord = '+
p.ATTRIBUTE_PREFIX+'texCoord0;\n'+
p.endVertexShaderMain()+'\n'+
p.pixelShaderHeader()+'uniform '+p.FLOAT4+' color1;\n'+'uniform '+p.FLOAT4+' color2;\n'+'uniform float checkSize;\n'+'uniform '+p.FLOAT3+' lightWorldPos;\n'+'uniform '+p.FLOAT3+' lightColor;\n'+'\n'+
p.repeatVaryingDecls(varyingDecls)+
p.FLOAT4+' checker('+p.FLOAT2+' uv) {\n'+'  float fmodResult = '+p.MOD+'('+'    floor(checkSize * uv.x) + \n'+'    floor(checkSize * uv.y), 2.0);\n'+'  return (fmodResult < 1.0) ? color1 : color2;\n'+'}\n\n'+
p.beginPixelShaderMain()+'  '+p.FLOAT3+' surfaceToLight = \n'+'      normalize(lightWorldPos - '+
p.PIXEL_VARYING_PREFIX+'worldPosition);\n'+'  '+p.FLOAT3+' worldNormal = normalize('+
p.PIXEL_VARYING_PREFIX+'normal);\n'+'  '+p.FLOAT4+' check = checker('+
p.PIXEL_VARYING_PREFIX+'texCoord);\n'+'  float directionalIntensity = \n'+'      clamp(dot(worldNormal, surfaceToLight), 0.0, 1.0);\n'+'  '+p.FLOAT4+' outColor = directionalIntensity * check;\n'+
p.endPixelShaderMain(p.FLOAT4+'(outColor.rgb, check.a)')+'\n'+
p.entryPoints()+
p.matrixLoadOrder();};o3djs.effect.COLLADA_LIGHTING_TYPE_PARAM_NAME='collada.lightingType';o3djs.effect.COLLADA_LIGHTING_TYPES={phong:1,lambert:1,blinn:1,constant:1};o3djs.effect.COLLADA_SAMPLER_PARAMETER_PREFIXES=['emissive','ambient','diffuse','specular','bump'];o3djs.effect.isColladaLightingType=function(lightingType){return o3djs.effect.COLLADA_LIGHTING_TYPES[lightingType.toLowerCase()]==1;};o3djs.effect.getColladaLightingType=function(material){var lightingTypeParam=material.getParam(o3djs.effect.COLLADA_LIGHTING_TYPE_PARAM_NAME);if(lightingTypeParam){var lightingType=lightingTypeParam.value.toLowerCase();if(o3djs.effect.isColladaLightingType(lightingType)){return lightingType;}}
return'';};o3djs.effect.getNumTexCoordStreamsNeeded=function(material){var p=o3djs.effect;var lightingType=p.getColladaLightingType(material);if(!p.isColladaLightingType(lightingType)){throw'not a collada standard material';}
var colladaSamplers=p.COLLADA_SAMPLER_PARAMETER_PREFIXES;var numTexCoordStreamsNeeded=0
for(var cc=0;cc<colladaSamplers.length;++cc){var samplerPrefix=colladaSamplers[cc];var samplerParam=material.getParam(samplerPrefix+'Sampler');if(samplerParam){++numTexCoordStreamsNeeded;}}
return numTexCoordStreamsNeeded;};o3djs.effect.loadEffect=function(effect,url){var fxString=o3djs.io.loadTextFileSynchronous(url);effect.loadFromFXString(fxString);};o3djs.effect.createEffectFromFile=function(pack,url){var p=o3djs.effect;var effect=pack.getObjects(url,'o3d.Effect')[0];if(!effect){effect=pack.createObject('Effect');p.loadEffect(effect,url);effect.name=url;}
return effect;};o3djs.effect.buildStandardShaderString=function(material,effectType){var p=o3djs.effect;var bumpSampler=material.getParam('bumpSampler');var bumpUVInterpolant;var getTextureType=function(textureParam){var texture=textureParam.value;if(!texture)return'2D';switch(texture.className){case'o3d.Texture1D':return'1D';case'o3d.Texture2D':return'2D';case'o3d.Texture3D':return'3D';case'o3d.TextureCUBE':return'CUBE';default:return'2D';}}
var getSamplerType=function(samplerParam){var sampler=samplerParam.value;if(!sampler)return'2D';var textureParam=sampler.getParam('Texture');if(textureParam)
return getTextureType(textureParam);else
return'2D';};var buildCommonVertexUniforms=function(){return'uniform '+p.MATRIX4+' worldViewProjection'+
p.semanticSuffix('WORLDVIEWPROJECTION')+';\n'+'uniform '+p.FLOAT3+' lightWorldPos;\n';};var buildCommonPixelUniforms=function(){return'uniform '+p.FLOAT4+' lightColor;\n';};var buildLightingUniforms=function(){return'uniform '+p.MATRIX4+' world'+
p.semanticSuffix('WORLD')+';\n'+'uniform '+p.MATRIX4+' viewInverse'+p.semanticSuffix('VIEWINVERSE')+';\n'+'uniform '+p.MATRIX4+' worldInverseTranspose'+
p.semanticSuffix('WORLDINVERSETRANSPOSE')+';\n';};var buildColorParam=function(material,descriptions,name,opt_addColorParam){if(opt_addColorParam===undefined){opt_addColorParam=true;}
var samplerParam=material.getParam(name+'Sampler');if(samplerParam){var type=getSamplerType(samplerParam);descriptions.push(name+type+'Texture');return'uniform sampler'+type+' '+name+'Sampler;\n'}else if(opt_addColorParam){descriptions.push(name+'Color');return'uniform '+p.FLOAT4+' '+name+';\n';}else{return'';}};var getColorParam=function(material,name){var samplerParam=material.getParam(name+'Sampler');if(samplerParam){var type=getSamplerType(samplerParam);return'  '+p.FLOAT4+' '+name+' = '+p.TEXTURE+type+'('+name+'Sampler, '+
p.PIXEL_VARYING_PREFIX+name+'UV);\n'}else{return'';}};var buildConstantShaderString=function(material,descriptions){descriptions.push('constant');return buildCommonVertexUniforms()+
buildVertexDecls(material,false,false)+
p.beginVertexShaderMain()+
positionVertexShaderCode()+
p.buildUVPassthroughs(material)+
p.endVertexShaderMain()+
p.pixelShaderHeader(material,false,false,bumpSampler)+
buildCommonPixelUniforms()+
p.repeatVaryingDecls()+
buildColorParam(material,descriptions,'emissive')+
p.beginPixelShaderMain()+
getColorParam(material,'emissive')+
p.endPixelShaderMain('emissive')+
p.entryPoints()+
p.matrixLoadOrder();};var buildLambertShaderString=function(material,descriptions){descriptions.push('lambert');return buildCommonVertexUniforms()+
buildLightingUniforms()+
buildVertexDecls(material,true,false)+
p.beginVertexShaderMain()+
p.buildUVPassthroughs(material)+
positionVertexShaderCode()+
normalVertexShaderCode()+
surfaceToLightVertexShaderCode()+
bumpVertexShaderCode()+
p.endVertexShaderMain()+
p.pixelShaderHeader(material,true,false)+
buildCommonPixelUniforms()+
p.repeatVaryingDecls()+
buildColorParam(material,descriptions,'emissive')+
buildColorParam(material,descriptions,'ambient')+
buildColorParam(material,descriptions,'diffuse')+
buildColorParam(material,descriptions,'bump',false)+
p.utilityFunctions()+
p.beginPixelShaderMain()+
getColorParam(material,'emissive')+
getColorParam(material,'ambient')+
getColorParam(material,'diffuse')+
getNormalShaderCode()+'  '+p.FLOAT3+' surfaceToLight = normalize('+
p.PIXEL_VARYING_PREFIX+'surfaceToLight);\n'+'  '+p.FLOAT4+' litR = lit(dot(normal, surfaceToLight), 0.0, 0.0);\n'+
p.endPixelShaderMain(p.FLOAT4+'((emissive +\n'+'      lightColor *'+' (ambient * diffuse + diffuse * litR.y)).rgb,\n'+'          diffuse.a)')+
p.entryPoints()+
p.matrixLoadOrder();};var buildBlinnShaderString=function(material,descriptions){descriptions.push('phong');return buildCommonVertexUniforms()+
buildLightingUniforms()+
buildVertexDecls(material,true,true)+
p.beginVertexShaderMain()+
p.buildUVPassthroughs(material)+
positionVertexShaderCode()+
normalVertexShaderCode()+
surfaceToLightVertexShaderCode()+
surfaceToViewVertexShaderCode()+
bumpVertexShaderCode()+
p.endVertexShaderMain()+
p.pixelShaderHeader(material,true,true)+
buildCommonPixelUniforms()+
p.repeatVaryingDecls()+
buildColorParam(material,descriptions,'emissive')+
buildColorParam(material,descriptions,'ambient')+
buildColorParam(material,descriptions,'diffuse')+
buildColorParam(material,descriptions,'specular')+
buildColorParam(material,descriptions,'bump',false)+'uniform float shininess;\n'+'uniform float specularFactor;\n'+
p.utilityFunctions()+
p.beginPixelShaderMain()+
getColorParam(material,'emissive')+
getColorParam(material,'ambient')+
getColorParam(material,'diffuse')+
getColorParam(material,'specular')+
getNormalShaderCode()+'  '+p.FLOAT3+' surfaceToLight = normalize('+
p.PIXEL_VARYING_PREFIX+'surfaceToLight);\n'+'  '+p.FLOAT3+' surfaceToView = normalize('+
p.PIXEL_VARYING_PREFIX+'surfaceToView);\n'+'  '+p.FLOAT3+' halfVector = normalize(surfaceToLight + '+
p.PIXEL_VARYING_PREFIX+'surfaceToView);\n'+'  '+p.FLOAT4+' litR = lit(dot(normal, surfaceToLight), \n'+'                    dot(normal, halfVector), shininess);\n'+
p.endPixelShaderMain(p.FLOAT4+'((emissive +\n'+'  lightColor *'+' (ambient * diffuse + diffuse * litR.y +\n'+'                        + specular * litR.z *'+' specularFactor)).rgb,\n'+'      diffuse.a)')+
p.entryPoints()+
p.matrixLoadOrder();};var buildPhongShaderString=function(material,descriptions){descriptions.push('phong');return buildCommonVertexUniforms()+
buildLightingUniforms()+
buildVertexDecls(material,true,true)+
p.beginVertexShaderMain()+
p.buildUVPassthroughs(material)+
positionVertexShaderCode()+
normalVertexShaderCode()+
surfaceToLightVertexShaderCode()+
surfaceToViewVertexShaderCode()+
bumpVertexShaderCode()+
p.endVertexShaderMain()+
p.pixelShaderHeader(material,true,true)+
buildCommonPixelUniforms()+
p.repeatVaryingDecls()+
buildColorParam(material,descriptions,'emissive')+
buildColorParam(material,descriptions,'ambient')+
buildColorParam(material,descriptions,'diffuse')+
buildColorParam(material,descriptions,'specular')+
buildColorParam(material,descriptions,'bump',false)+'uniform float shininess;\n'+'uniform float specularFactor;\n'+
p.utilityFunctions()+
p.beginPixelShaderMain()+
getColorParam(material,'emissive')+
getColorParam(material,'ambient')+
getColorParam(material,'diffuse')+
getColorParam(material,'specular')+
getNormalShaderCode()+'  '+p.FLOAT3+' surfaceToLight = normalize('+
p.PIXEL_VARYING_PREFIX+'surfaceToLight);\n'+'  '+p.FLOAT3+' surfaceToView = normalize('+
p.PIXEL_VARYING_PREFIX+'surfaceToView);\n'+'  '+p.FLOAT3+' halfVector = normalize(surfaceToLight + surfaceToView);\n'+'  '+p.FLOAT4+' litR = lit(dot(normal, surfaceToLight), \n'+'                    dot(normal, halfVector), shininess);\n'+
p.endPixelShaderMain(p.FLOAT4+'((emissive +\n'+'  lightColor * (ambient * diffuse + diffuse * litR.y +\n'+'                        + specular * litR.z *'+' specularFactor)).rgb,\n'+'      diffuse.a)')+
p.entryPoints()+
p.matrixLoadOrder();};var positionVertexShaderCode=function(){return'  '+p.VERTEX_VARYING_PREFIX+'position = '+
p.mul(p.ATTRIBUTE_PREFIX+'position','worldViewProjection')+';\n';};var normalVertexShaderCode=function(){return'  '+p.VERTEX_VARYING_PREFIX+'normal = '+
p.mul(p.FLOAT4+'('+
p.ATTRIBUTE_PREFIX+'normal, 0)','worldInverseTranspose')+'.xyz;\n';};var surfaceToLightVertexShaderCode=function(){return'  '+p.VERTEX_VARYING_PREFIX+'surfaceToLight = lightWorldPos - \n'+'                          '+
p.mul(p.ATTRIBUTE_PREFIX+'position','world')+'.xyz;\n';};var surfaceToViewVertexShaderCode=function(){return'  '+p.VERTEX_VARYING_PREFIX+'surfaceToView = (viewInverse[3] - '+
p.mul(p.ATTRIBUTE_PREFIX+'position','world')+').xyz;\n';};var bumpVertexShaderCode=function(opt_bumpSampler){return bumpSampler?('  '+p.VERTEX_VARYING_PREFIX+'binormal = '+
p.mul(p.FLOAT4+'('+
p.ATTRIBUTE_PREFIX+'binormal, 0)','worldInverseTranspose')+'.xyz;\n'+'  '+p.VERTEX_VARYING_PREFIX+'tangent = '+
p.mul(p.FLOAT4+'('+p.ATTRIBUTE_PREFIX+'tangent, 0)','worldInverseTranspose')+'.xyz;\n'):'';};var getNormalShaderCode=function(){return bumpSampler?(p.MATRIX3+' tangentToWorld = '+p.MATRIX3+'('+p.ATTRIBUTE_PREFIX+'tangent,\n'+'                                   '+
p.ATTRIBUTE_PREFIX+'binormal,\n'+'                                   '+
p.ATTRIBUTE_PREFIX+'normal);\n'+
p.FLOAT3+' tangentNormal = '+p.TEXTURE+'2D'+'(bumpSampler, '+
p.ATTRIBUTE_PREFIX+'bumpUV.xy).xyz -\n'+'                       '+p.FLOAT3+'(0.5, 0.5, 0.5);\n'+p.FLOAT3+' normal = '+
p.mul('tangentNormal','tangentToWorld')+';\n'+'normal = normalize('+p.PIXEL_VARYING_PREFIX+'normal);\n'):'  '+p.FLOAT3+' normal = normalize('+
p.PIXEL_VARYING_PREFIX+'normal);\n';};var buildVertexDecls=function(material,diffuse,specular){return p.buildAttributeDecls(material,diffuse,specular,bumpSampler)+
p.buildVaryingDecls(material,diffuse,specular,bumpSampler);};var str;var descriptions=[];if(effectType=='phong'){str=buildPhongShaderString(material,descriptions);}else if(effectType=='lambert'){str=buildLambertShaderString(material,descriptions);}else if(effectType=='blinn'){str=buildBlinnShaderString(material,descriptions);}else if(effectType=='constant'){str=buildConstantShaderString(material,descriptions);}else{throw('unknown effect type "'+effectType+'"');}
return{description:descriptions.join('_'),shader:str};};o3djs.effect.getStandardShader=function(pack,material,effectType){var record=o3djs.effect.buildStandardShaderString(material,effectType);var effects=pack.getObjectsByClassName('o3d.Effect');for(var ii=0;ii<effects.length;++ii){if(effects[ii].name==record.description&&effects[ii].source==record.shader){return effects[ii];}}
var effect=pack.createObject('Effect');if(effect){effect.name=record.description;if(effect.loadFromFXString(record.shader)){return effect;}
pack.removeObject(effect);}
return null;};o3djs.effect.attachStandardShader=function(pack,material,lightPos,effectType){var effect=o3djs.effect.getStandardShader(pack,material,effectType);if(effect){material.effect=effect;effect.createUniformParameters(material);var param=material.getParam('lightWorldPos');if(param&&!param.inputConnection){param.value=lightPos;}
var param=material.getParam('lightColor');if(param&&!param.inputConnection){param.value=[1,1,1,1];}
return true;}else{return false;}};o3djs.effect.createUniformParameters=function(pack,effect,paramObject){effect.createUniformParameters(paramObject);var infos=effect.getParameterInfo();for(var ii=0;ii<infos.length;++ii){var info=infos[ii];if(info.sasClassName.length==0){if(info.numElements>0){var paramArray=pack.createObject('ParamArray');var param=paramObject.getParam(info.name);param.value=paramArray;paramArray.resize(info.numElements,info.className);if(info.className=='o3d.ParamSampler'){for(var jj=0;jj<info.numElements;++jj){var sampler=pack.createObject('Sampler');paramArray.getParam(jj).value=sampler;}}}else if(info.className=='o3d.ParamSampler'){var sampler=pack.createObject('Sampler');var param=paramObject.getParam(info.name);param.value=sampler;}}}};o3djs.effect.createCheckerEffect=function(pack){var effects=pack.getObjects(o3djs.effect.TWO_COLOR_CHECKER_EFFECT_NAME,'o3d.Effect');if(effects.length>0){return effects[0];}
var effect=pack.createObject('Effect');effect.loadFromFXString(o3djs.effect.TWO_COLOR_CHECKER_FXSTRING);effect.name=o3djs.effect.TWO_COLOR_CHECKER_EFFECT_NAME;return effect;};o3djs.effect.setLanguage('o3d');o3djs.event=o3djs.event||{};o3djs.event.appendWithSpace=function(inStr,extraStr){return(inStr.length==0)?extraStr:inStr+' '+extraStr;};o3djs.event.appendWithSpaceIf=function(state,inStr,extraStr){return(state)?o3djs.event.appendWithSpace(inStr,extraStr):inStr;};o3djs.event.getModifierString=function(control,alt,shift,meta){var modStr=o3djs.event.appendWithSpaceIf(control,'','Control');modStr=o3djs.event.appendWithSpaceIf(alt,modStr,'Alt');modStr=o3djs.event.appendWithSpaceIf(shift,modStr,'Shift');return o3djs.event.appendWithSpaceIf(meta,modStr,'Meta');};o3djs.event.padWithLeadingZeroes=function(str,to_length){while(str.length<to_length)
str='0'+str;return str;};o3djs.event.getKeyIdentifier=function(charCode,keyCode){if(!charCode){charCode=keyCode;}
switch(charCode){case 3:case 13:return'Enter';case 37:return'Left';case 39:return'Right';case 38:return'Up';case 40:return'Down';}
charCode=(charCode>=97&&charCode<=122)?charCode-32:charCode;var keyStr=charCode.toString(16).toUpperCase();return'U+'+o3djs.event.padWithLeadingZeroes(keyStr,4);};o3djs.event.keyIdentifierToChar=function(keyIdent){if(keyIdent&&typeof(keyIdent)=='string'){switch(keyIdent){case'Enter':return 13;case'Left':return 37;case'Right':return 39;case'Up':return 38;case'Down':return 40;}
if(keyIdent.indexOf('U+')==0)
return parseInt(keyIdent.substr(2).toUpperCase(),16);}
return 0;};o3djs.event.getEventKeyChar=function(event){if(!event){event=window.event;}
var charCode=0;if(event.keyIdentifier)
charCode=o3djs.event.keyIdentifierToChar(event.keyIdentifier);if(!charCode)
charCode=(window.event)?window.event.keyCode:event.charCode;if(!charCode)
charCode=event.keyCode;return charCode;};o3djs.event.cancel=function(event){if(!event)
event=window.event;event.cancelBubble=true;if(event.stopPropagation)
event.stopPropagation();if(event.preventDefault)
event.preventDefault();};o3djs.event.startKeyboardEventSynthesis=function(pluginObject){var handler=function(event){o3djs.event.onKey(event,pluginObject);};o3djs.event.addEventListener(pluginObject,'keypress',handler);o3djs.event.addEventListener(pluginObject,'keydown',handler);o3djs.event.addEventListener(pluginObject,'keyup',handler);};o3djs.event.onKey=function(event,pluginObject){var k_evt=o3djs.event.createKeyEvent(event.type,event.charCode,event.keyCode,event.ctrlKey,event.altKey,event.shiftKey,event.metaKey);if(k_evt){if(pluginObject.parentNode.dispatchEvent){pluginObject.parentNode.dispatchEvent(k_evt);}else if(pluginObject.fireEvent){pluginObject.fireEvent('on'+event.type,k_evt);}}};o3djs.event.createKeyEvent=function(eventName,charCode,keyCode,control,alt,shift,meta){var k_evt;var keyIdentifier=o3djs.event.getKeyIdentifier(charCode,keyCode);if(document.createEvent){k_evt=document.createEvent('KeyboardEvent');if(k_evt.initKeyboardEvent){k_evt.initKeyboardEvent(eventName,true,true,window,keyIdentifier,0,control,alt,shift,meta);k_evt.charCode=charCode;if(eventName=='keypress')
k_evt.keyCode=charCode;else
k_evt.keyCode=keyCode;}else if(k_evt.initKeyEvent){k_evt.initKeyEvent(eventName,true,true,window,control,alt,shift,meta,keyCode,charCode);k_evt.keyIdentifier=keyIdentifier;}}else if(document.createEventObject){k_evt=document.createEventObject();k_evt.ctrlKey=control;k_evt.altKey=alt;k_evt.shiftKey=shift;k_evt.metaKey=meta;k_evt.keyCode=charCode;k_evt.keyIdentifier=keyIdentifier;}
k_evt.synthetic=true;return k_evt;};o3djs.event.createEventHandler=function(listenerSet){return function(event){var length=listenerSet.length;for(var index=0;index<length;++index){var handler=listenerSet[index];if(typeof(handler.handleEvent)=='function'){handler.handleEvent(event);}else{handler(event);}}}};o3djs.event.addEventListener=function(pluginObject,type,handler){if(!handler||typeof(type)!='string'||(typeof(handler)!='function'&&typeof(handler.handleEvent)!='function')){throw new Error('Invalid argument.');}
pluginObject.o3d_eventRegistry=pluginObject.o3d_eventRegistry||[];var registry=pluginObject.o3d_eventRegistry;var listenerSet=registry[type];if(!listenerSet||listenerSet.length==0){listenerSet=registry[type]=[];pluginObject.client.setEventCallback(type,o3djs.event.createEventHandler(listenerSet));}else{for(var index in listenerSet){if(listenerSet[index]==handler){return;}}}
listenerSet.push(handler);};o3djs.event.removeEventListener=function(pluginObject,type,handler){var registry=pluginObject.o3d_eventRegistry;if(!registry){return;}
var listenerSet=registry[type];if(!listenerSet){return;}
for(var index in listenerSet){if(listenerSet[index]==handler){if(listenerSet.length==1){pluginObject.client.clearEventCallback(type);}
listenerSet.splice(index,1);break;}}};o3djs.error=o3djs.error||{};o3djs.error.callbacks_=[];o3djs.error.setErrorHandler=function(client,callback){var clientId=client.clientId;var old_callback=o3djs.error.callbacks_[clientId];o3djs.error.callbacks_[clientId]=callback;if(callback){client.setErrorCallback(callback);}else{client.clearErrorCallback();}
return old_callback;};o3djs.error.setDefaultErrorHandler=function(client){o3djs.error.setErrorHandler(client,function(msg){o3djs.error.setErrorHandler(client,null);alert('ERROR: '+msg);});};o3djs.error.createErrorCollector=function(client){return new o3djs.error.ErrorCollector(client);};o3djs.error.ErrorCollector=function(client){var that=this;this.client_=client;this.errors=[];this.oldCallback_=o3djs.error.setErrorHandler(client,function(msg){that.errors.push(msg);});};o3djs.error.ErrorCollector.prototype.finish=function(){o3djs.error.setErrorHandler(this.client_,this.oldCallback_);};o3djs.util=o3djs.util||{};o3djs.util.PLUGIN_NAME='O3D Plugin';o3djs.util.REQUIRED_VERSION='0.1.42.4';o3djs.util.MINIMUM_WIDTH_FOR_MESSAGE=200;o3djs.util.MINIMUM_HEIGHT_FOR_MESSAGE=200;o3djs.util.PLUGIN_DOWNLOAD_URL='http://tools.google.com/dlpage/o3d';o3djs.util.rendererInitStatus={NO_PLUGIN:-1,UNINITIALIZED:0,SUCCESS:1,OUT_OF_RESOURCES:2,GPU_NOT_UP_TO_SPEC:3,INITIALIZATION_ERROR:4};o3djs.util.curry=function(func){var outerArgs=[];for(var i=1;i<arguments.length;++i){outerArgs.push(arguments[i]);}
return function(){var innerArgs=outerArgs.slice();for(var i=0;i<arguments.length;++i){innerArgs.push(arguments[i]);}
return func.apply(this,innerArgs);}}
o3djs.util.getCurrentURI=function(){var path=window.location.href;var index=path.lastIndexOf('/');return path.substring(0,index+1);};o3djs.util.getAbsoluteURI=function(uri){return o3djs.util.getCurrentURI()+uri;};o3djs.util.arrayContains=function(array,value){for(var i=0;i<array.length;i++){if(array[i]==value){return true;}}
return false;};o3djs.util.getTransformsInTreeByTags=function(treeRoot,searchTags){var splitTags=searchTags.split(',');var transforms=treeRoot.getTransformsInTree();var found=[];for(var n=0;n<transforms.length;n++){var tagParam=transforms[n].getParam('collada.tags');if(tagParam){var tags=tagParam.value.split(',');for(var t=0;t<tags.length;t++){if(o3djs.util.arrayContains(splitTags,tags[t])){found[found.length]=transforms[n];break;}}}}
return found;};o3djs.util.getTransformsInTreeByPrefix=function(treeRoot,prefix){var found=[];var transforms=treeRoot.getTransformsInTree();for(var ii=0;ii<transforms.length;ii++){var transform=transforms[ii];if(transform.name.indexOf(prefix)==0){found[found.length]=transform;}}
return found;};o3djs.util.getBoundingBoxOfTree=function(treeRoot){var box=treeRoot.boundingBox;if(box.valid){return box;}
var o3d=o3djs.base.o3d;var transforms=treeRoot.children;for(var i=0;i<transforms.length;++i){var transform=transforms[i];var childBox=o3djs.util.getBoundingBoxOfTree(transform);if(childBox.valid){childBox=childBox.mul(transform.localMatrix);if(box.valid){box=box.add(childBox);}else{box=childBox;}}}
var shapes=treeRoot.shapes;for(var i=0;i<shapes.length;++i){var elements=shapes[i].elements;for(var j=0;j<elements.length;++j){var elementBox=elements[j].boundingBox;if(!elementBox.valid){elementBox=elements[j].getBoundingBox(0);}
if(box.valid){box=box.add(elementBox);}else{box=elementBox;}}}
return box;};o3djs.util.getPowerOfTwoSize=function(size){var powerOfTwo=1;size=size-1;while(size){size=size>>1;powerOfTwo=powerOfTwo<<1;}
return powerOfTwo;};o3djs.util.getPluginVersion=function(){var version=null;var description=null;if(navigator.plugins!=null&&navigator.plugins.length>0){var plugin=navigator.plugins[o3djs.util.PLUGIN_NAME];if(plugin){description=plugin.description;}}else if(o3djs.base.IsMSIE()){try{var activeXObject=new ActiveXObject('o3d_host.O3DHostControl');description=activeXObject.description;}catch(e){}}
if(description){var re=/.*version:\s*(\d+)\.(\d+)\.(\d+)\.(\d+).*/;var parts=re.exec(description);if(parts&&parts.length==5){version=''+parseInt(parts[1],10)+'.'+
parseInt(parts[2],10)+'.'+
parseInt(parts[3],10)+'.'+
parseInt(parts[4],10);}}
return version;};o3djs.util.requiredVersionAvailable=function(requiredVersion){var version=o3djs.util.getPluginVersion();if(!version){return false;}
var haveParts=version.split('.');var requiredParts=requiredVersion.split('.');if(requiredParts.length>4){throw Error('requiredVersion has more than 4 parts!');}
for(var pp=0;pp<requiredParts.length;++pp){var have=parseInt(haveParts[pp],10);var required=parseInt(requiredParts[pp],10);if(have<required){return false;}
if(have>required){return true;}}
return true;};o3djs.util.getElementsByTagAndId=function(tag,id){var elements=[];var allElements=document.getElementsByTagName(tag);for(var ee=0;ee<allElements.length;++ee){var element=allElements[ee];if(element.id&&element.id.match(id)){elements.push(element);}}
return elements;};o3djs.util.getO3DContainerElements=function(opt_id,opt_tag){var tag=opt_tag||'div';var id=opt_id||'^o3d';return o3djs.util.getElementsByTagAndId(tag,id);}
o3djs.util.offerPlugin=function(opt_id,opt_tag){var havePlugin=o3djs.util.requiredVersionAvailable('');var elements=o3djs.util.getO3DContainerElements(opt_id,opt_tag);var addedMessage=false;var subMessage=(havePlugin?'This page requires a newer version of the O3D plugin.':'This page requires the O3D plugin to be installed.');var message='<div style="background: lightblue; width: 100%; height: 100%; '+'text-align:center;">'+'<br/><br/>'+subMessage+'<br/>'+'<a href="'+o3djs.util.PLUGIN_DOWNLOAD_URL+'">Click here to download.</a>'+'</div>'
for(var ee=0;ee<elements.length;++ee){var element=elements[ee];if(element.clientWidth>=o3djs.util.MINIMUM_WIDTH_FOR_MESSAGE&&element.clientHeight>=o3djs.util.MINIMUM_HEIGHT_FOR_MESSAGE&&element.style.display.toLowerCase()!='none'&&element.style.visibility.toLowerCase()!='hidden'){addedMessage=true;element.innerHTML=message;}}
if(!addedMessage){if(confirm(subMessage+'\n\nClick OK to download.')){window.location=o3djs.util.PLUGIN_DOWNLOAD_URL;}}};o3djs.util.informNoGraphics=function(initStatus,error,opt_id,opt_tag){var elements=o3djs.util.getO3DContainerElements(opt_id,opt_tag);var addedMessage=false;var subMessage;var message;var alertMessage='';var alertFunction=function(){};var moreInfo=function(error){var html='';if(error.length>0){html=''+'<br/><br/><div>More Info:<br/>'+error+'</div>';}
return html;};if(initStatus==o3djs.util.rendererInitStatus.GPU_NOT_UP_TO_SPEC){subMessage='We are terribly sorry but it appears your graphics card is not '+'able to run o3d. We are working on a solution.';message='<div style="background: lightgray; width: 100%; height: 100%; '+'text-align: center;">'+'<br/><br/>'+subMessage+'<br/><br/><a href="'+o3djs.util.PLUGIN_DOWNLOAD_URL+'">Click Here to go the O3D website</a>'+
moreInfo(error)+'</div>';alertMessage='\n\nClick OK to go to the o3d website.';alertFunction=function(){window.location=o3djs.util.PLUGIN_DOWNLOAD_URL;};}else if(initStatus==o3djs.util.rendererInitStatus.OUT_OF_RESOURCES){subMessage='Your graphics system appears to be out of resources. Try closing '+'some applications and then refreshing this page.';message='<div style="background: lightgray; width: 100%; height: 100%; '+'text-align: center;">'+'<br/><br/>'+subMessage+
moreInfo(error)+'</div>';}else{subMessage='A unknown error has prevented O3D from starting. Try downloading '+'new drivers or checking for OS updates.';message='<div style="background: lightgray; width: 100%; height: 100%; '+'text-align: center;">'+'<br/><br/>'+subMessage+
moreInfo(error)+'</div>';}
for(var ee=0;ee<elements.length;++ee){var element=elements[ee];if(element.clientWidth>=o3djs.util.MINIMUM_WIDTH_FOR_MESSAGE&&element.clientHeight>=o3djs.util.MINIMUM_HEIGHT_FOR_MESSAGE&&element.style.display.toLowerCase()!='none'&&element.style.visibility.toLowerCase()!='hidden'){addedMessage=true;element.innerHTML=message;}}
if(!addedMessage){if(confirm(subMessage+alertMessage)){alertFunction();}}};o3djs.util.informPluginFailure=function(initStatus,error,opt_id,opt_tag){if(initStatus==o3djs.util.rendererInitStatus.NO_PLUGIN){o3djs.util.offerPlugin(opt_id,opt_tag);}else{o3djs.util.informNoGraphics(initStatus,error,opt_id,opt_tag);}};o3djs.util.getElementContentById=function(id){o3djs.BROWSER_ONLY=true;var node=document.getElementById(id);if(!node){throw'getElementContentById could not find node with id '+id;}
switch(node.tagName){case'TEXTAREA':return node.value;case'SCRIPT':return node.text;default:throw'getElementContentById does not no how to get content from a '+
node.tagName+' element';}};o3djs.util.getElementById=function(id){o3djs.BROWSER_ONLY=true;return document.getElementById(id);};o3djs.util.Engine={BROWSER:0,V8:1};o3djs.util.mainEngine_=o3djs.util.Engine.BROWSER;function o3djs_navHas(s){return navigator.userAgent.indexOf(s)!=-1;}
function o3djs_isV8Supported(){if(o3djs_navHas('Chrome'))
return true;if(!o3djs_navHas('Safari'))
return true;return!o3djs_navHas('Intel Mac OS X 10_6');}
o3djs.util.setMainEngine=function(engine){if((engine==o3djs.util.Engine.V8)&&!o3djs_isV8Supported()){engine=o3djs.util.Engine.BROWSER;}
o3djs.util.mainEngine_=engine;};o3djs.util.fixFunctionString_=/^\s*function\s+[^\s]+\s*\(([^)]*)\)/
o3djs.util.callV8=function(clientElement,callback,thisArg,args){var functionString=callback.toString();functionString=functionString.replace(o3djs.util.fixFunctionString_,'function($1)');var v8Code='function(thisArg, args) {\n'+'  var localArgs = [];\n'+'  var numArgs = args.length;\n'+'  for (var i = 0; i < numArgs; ++i) {\n'+'    localArgs.push(args[i]);\n'+'  }\n'+'  var func = '+functionString+';\n'+'  return func.apply(thisArg, localArgs);\n'+'}\n';var v8Function=clientElement.eval(v8Code);return v8Function(thisArg,args);};o3djs.util.stripDotDot_=/\/[^\/]+\/\.\./;o3djs.util.toAbsoluteUri=function(uri){if(uri.indexOf('://')==-1){var baseUri=document.location.toString();var lastSlash=baseUri.lastIndexOf('/');if(lastSlash!=-1){baseUri=baseUri.substring(0,lastSlash);}
uri=baseUri+'/'+uri;}
do{var lastUri=uri;uri=uri.replace(o3djs.util.stripDotDot_,'');}while(lastUri!==uri);return uri;};o3djs.util.scriptUris_=[];o3djs.util.addScriptUri=function(uri){o3djs.util.scriptUris_.push(o3djs.util.toAbsoluteUri(uri));};o3djs.util.isScriptUri=function(uri){uri=o3djs.util.toAbsoluteUri(uri);for(var i=0;i<o3djs.util.scriptUris_.length;++i){var scriptUri=o3djs.util.scriptUris_[i];if(uri.substring(0,scriptUri.length)===scriptUri){return true;}}
return false;};o3djs.util.isWantedScriptTag_=function(scriptElement){return scriptElement.id&&scriptElement.id.match(/^o3dscript/);};o3djs.util.getScriptTagText_=function(){var scriptTagText='';var scriptElements=document.getElementsByTagName('script');for(var i=0;i<scriptElements.length;++i){var scriptElement=scriptElements[i];if(scriptElement.type===''||scriptElement.type==='text/javascript'){if('text'in scriptElement&&scriptElement.text&&o3djs.util.isWantedScriptTag_(scriptElement)){scriptTagText+=scriptElement.text;}
if('src'in scriptElement&&scriptElement.src&&o3djs.util.isScriptUri(scriptElement.src)){scriptTagText+=o3djs.io.loadTextFileSynchronous(scriptElement.src);}}}
return scriptTagText;};o3djs.util.createClient=function(element,opt_features,opt_requestVersion){opt_features=opt_features||'';opt_requestVersion=opt_requestVersion||o3djs.util.REQUIRED_VERSION;if(!o3djs.util.requiredVersionAvailable(opt_requestVersion)){return null;}
opt_features+=(opt_features?',':'')+'APIVersion='+
opt_requestVersion;var objElem;if(o3djs.base.IsMSIE()){element.innerHTML='<OBJECT '+'WIDTH="100%" HEIGHT="100%"'+'CLASSID="CLSID:9666A772-407E-4F90-BC37-982E8160EB2D">'+'<PARAM name="o3d_features" value="'+opt_features+'"/>'+'</OBJECT>';objElem=element.childNodes[0];}else{objElem=document.createElement('object');objElem.type='application/vnd.o3d.auto';objElem.style.width='100%';objElem.style.height='100%';objElem.setAttribute('o3d_features',opt_features);element.appendChild(objElem);}
if(objElem.client.clientInfo.glsl){o3djs.effect.setLanguage('glsl');}
return objElem;};o3djs.util.makeClients=function(callback,opt_features,opt_requiredVersion,opt_failureCallback,opt_id,opt_tag){opt_failureCallback=opt_failureCallback||o3djs.util.informPluginFailure;opt_requiredVersion=opt_requiredVersion||o3djs.util.REQUIRED_VERSION;if(!o3djs.util.requiredVersionAvailable(opt_requiredVersion)){opt_failureCallback(o3djs.util.rendererInitStatus.NO_PLUGIN,'',opt_id,opt_tag);}else{var clientElements=[];var elements=o3djs.util.getO3DContainerElements(opt_id,opt_tag);var mainClientElement=null;for(var ee=0;ee<elements.length;++ee){var element=elements[ee];var features=opt_features;if(!features){var o3d_features=element.getAttribute('o3d_features');if(o3d_features){features=o3d_features;}else{features='';}}
var objElem=o3djs.util.createClient(element,features);clientElements.push(objElem);if(element.id==='o3d'){mainClientElement=objElem;}}
var clearId=window.setInterval(function(){var initStatus=0;var error='';var o3d;for(var cc=0;cc<clientElements.length;++cc){var element=clientElements[cc];o3d=element.o3d;var ready=o3d&&element.client&&element.client.rendererInitStatus>o3djs.util.rendererInitStatus.UNINITIALIZED;if(!ready){return;}
var status=clientElements[cc].client.rendererInitStatus;if(status>initStatus){initStatus=status;error=clientElements[cc].client.lastError;}}
window.clearInterval(clearId);if(initStatus>0&&initStatus!=o3d.Renderer.SUCCESS){for(var cc=0;cc<clientElements.length;++cc){var clientElement=clientElements[cc];clientElement.parentNode.removeChild(clientElement);}
opt_failureCallback(initStatus,error,opt_id,opt_tag);}else{o3djs.base.snapshotProvidedNamespaces();for(var cc=0;cc<clientElements.length;++cc){if(o3djs_isV8Supported())
o3djs.base.initV8(clientElements[cc]);o3djs.event.startKeyboardEventSynthesis(clientElements[cc]);o3djs.error.setDefaultErrorHandler(clientElements[cc].client);}
o3djs.base.init(clientElements[0]);switch(o3djs.util.mainEngine_){case o3djs.util.Engine.BROWSER:callback(clientElements);break;case o3djs.util.Engine.V8:if(!mainClientElement){throw'V8 engine was requested but there is no element with'+' the id "o3d"';}
var scriptTagText=o3djs.util.getScriptTagText_();mainClientElement.eval(scriptTagText);o3djs.util.callV8(mainClientElement,callback,o3djs.global,[clientElements]);break;default:throw'Unknown engine '+o3djs.util.mainEngine_;}}},10);}};o3djs.camera=o3djs.camera||{};o3djs.camera.CameraInfo=function(view,zNear,zFar,opt_eye,opt_target,opt_up){this.view=view;this.projection=o3djs.math.matrix4.identity();this.orthographic=false;this.zNear=zNear;this.zFar=zFar;this.fieldOfViewRadians=o3djs.math.degToRad(30);this.eye=opt_eye;this.target=opt_target;this.up=opt_up;this.magX=undefined;this.magY=undefined;};o3djs.camera.CameraInfo.prototype.setAsOrthographic=function(magX,magY){this.orthographic=true
this.magX=magX;this.magY=magY;};o3djs.camera.CameraInfo.prototype.setAsPerspective=function(fieldOfView){this.orthographic=false;this.fieldOfViewRadians=fieldOfView;};o3djs.camera.CameraInfo.prototype.computeProjection=function(areaWidth,areaHeight){if(this.orthographic){var magX=(this.magX);var magY=(this.magY);this.projection=o3djs.math.matrix4.orthographic(-magX,magX,-magY,magY,this.zNear,this.zFar);}else{this.projection=o3djs.math.matrix4.perspective(this.fieldOfViewRadians,areaWidth/areaHeight,this.zNear,this.zFar);}
return this.projection;};o3djs.camera.findCameras=function(treeRoot){return o3djs.util.getTransformsInTreeByTags(treeRoot,'camera');};o3djs.camera.getViewAndProjectionFromCamera=function(camera,areaWidth,areaHeight){var fieldOfView=30;var zNear=1;var zFar=5000;var eye=undefined;var target=undefined;var up=undefined;var view;var math=o3djs.math;var cameraInfo;var eyeParam=camera.getParam('collada.eyePosition');var targetParam=camera.getParam('collada.targetPosition');var upParam=camera.getParam('collada.upVector');if(eyeParam!=null&&targetParam!=null&&upParam!=null){eye=eyeParam.value;target=targetParam.value;up=upParam.value;view=math.matrix4.lookAt(eye,target,up);}else{view=math.inverse(camera.getUpdatedWorldMatrix());}
var projectionType=camera.getParam('collada.projectionType');if(projectionType){zNear=camera.getParam('collada.projectionNearZ').value;zFar=camera.getParam('collada.projectionFarZ').value;if(projectionType.value=='orthographic'){var magX=camera.getParam('collada.projectionMagX').value;var magY=camera.getParam('collada.projectionMagY').value;cameraInfo=new o3djs.camera.CameraInfo(view,zNear,zFar);cameraInfo.setAsOrthographic(magX,magY);}else if(projectionType.value=='perspective'){fieldOfView=camera.getParam('collada.perspectiveFovY').value;}}
if(!cameraInfo){cameraInfo=new o3djs.camera.CameraInfo(view,zNear,zFar,eye,target,up);cameraInfo.setAsPerspective(math.degToRad(fieldOfView));}
cameraInfo.computeProjection(areaWidth,areaHeight);return cameraInfo;};o3djs.camera.getCameraFitToScene=function(treeRoot,clientWidth,clientHeight){var math=o3djs.math;var box=o3djs.util.getBoundingBoxOfTree(treeRoot);var target=math.lerpVector(box.minExtent,box.maxExtent,0.5);var boxDimensions=math.subVector(box.maxExtent,box.minExtent);var diag=o3djs.math.distance(box.minExtent,box.maxExtent);var eye=math.addVector(target,[boxDimensions[0]*0.3,boxDimensions[1]*0.7,diag*1.5]);var nearPlane=diag/1000;var farPlane=diag*10;var up=[0,1,0];var cameraInfo=new o3djs.camera.CameraInfo(math.matrix4.lookAt(eye,target,up),nearPlane,farPlane);cameraInfo.setAsPerspective(math.degToRad(45));cameraInfo.computeProjection(clientWidth,clientHeight);return cameraInfo;};o3djs.camera.getViewAndProjectionFromCameras=function(treeRoot,areaWidth,areaHeight){var cameras=o3djs.camera.findCameras(treeRoot);if(cameras.length>0){return o3djs.camera.getViewAndProjectionFromCamera(cameras[0],areaWidth,areaHeight);}else{return o3djs.camera.getCameraFitToScene(treeRoot,areaWidth,areaHeight);}};o3djs.camera.getCameraInfos=function(treeRoot,areaWidth,areaHeight){var cameras=o3djs.camera.findCameras(treeRoot);var cameraInfos=[];for(var cc=0;cc<cameras.length;++cc){cameraInfos.push(o3djs.camera.getViewAndProjectionFromCamera(cameras[cc],areaWidth,areaHeight));}
return cameraInfos;};o3djs.camera.fitContextToScene=function(treeRoot,clientWidth,clientHeight,drawContext){var cameraInfo=o3djs.camera.getCameraFitToScene(treeRoot,clientWidth,clientHeight);drawContext.view=cameraInfo.view;drawContext.projection=cameraInfo.projection;};o3djs.cameracontroller=o3djs.cameracontroller||{};o3djs.cameracontroller.DragMode={NONE:0,SPIN_ABOUT_CENTER:1,DOLLY_IN_OUT:2,ZOOM_IN_OUT:3,DOLLY_ZOOM:4,MOVE_CENTER_IN_VIEW_PLANE:5,};o3djs.cameracontroller.createCameraController=function(centerPos,backpedal,heightAngle,rotationAngle,fieldOfViewAngle,opt_onChange){return new o3djs.cameracontroller.CameraController(centerPos,backpedal,heightAngle,rotationAngle,fieldOfViewAngle,opt_onChange);};o3djs.cameracontroller.CameraController=function(centerPos,backpedal,heightAngle,rotationAngle,fieldOfViewAngle,opt_onChange){this.centerPos=centerPos;this.backpedal=backpedal;this.heightAngle=heightAngle;this.rotationAngle=rotationAngle;this.fieldOfViewAngle=fieldOfViewAngle;this.onChange=opt_onChange||null;this.dragMode_=o3djs.cameracontroller.DragMode.NONE;this.mouseX_=0;this.mouseY_=0;this.pixelsPerUnit=300.0;this.radiansPerUnit=1.0;this.distancePerUnit=10.0;this.zoomPerUnit=1.0;};o3djs.cameracontroller.CameraController.prototype.viewAll=function(boundingBox,aspectRatio){var minExtent=boundingBox.minExtent;var maxExtent=boundingBox.maxExtent;var centerPos=o3djs.math.divVectorScalar(o3djs.math.addVector(minExtent,maxExtent),2.0);var viewMatrix=this.calculateViewMatrix_(centerPos,0);var maxBackpedal=0;var vertFOV=this.fieldOfViewAngle;var tanVertFOV=Math.tan(vertFOV);var horizFOV=Math.atan(aspectRatio*tanVertFOV);var tanHorizFOV=Math.tan(horizFOV);var extents=[minExtent,maxExtent];for(var zi=0;zi<2;zi++){for(var yi=0;yi<2;yi++){for(var xi=0;xi<2;xi++){var vec=[extents[xi][0],extents[yi][1],extents[zi][2],1];vec=o3djs.math.mulVectorMatrix(vec,viewMatrix);if(vec[2]>=0.0){maxBackpedal=Math.max(maxBackpedal,vec[2]+vec[0]/tanHorizFOV);maxBackpedal=Math.max(maxBackpedal,vec[2]+vec[1]/tanVertFOV);}}}}
this.centerPos=centerPos;this.backpedal=maxBackpedal;this.distancePerUnit=maxBackpedal/5.0;};o3djs.cameracontroller.CameraController.prototype.calculateViewMatrix=function(){return this.calculateViewMatrix_(this.centerPos,this.backpedal);};o3djs.cameracontroller.CameraController.prototype.calculateViewMatrix_=function(centerPoint,backpedal){var matrix4=o3djs.math.matrix4;var view=matrix4.translation(o3djs.math.negativeVector(centerPoint));view=matrix4.mul(view,matrix4.rotationY(this.rotationAngle));view=matrix4.mul(view,matrix4.rotationX(this.heightAngle));view=matrix4.mul(view,matrix4.translation([0,0,-backpedal]));return view;};o3djs.cameracontroller.CameraController.prototype.setDragMode=function(dragMode,x,y){this.dragMode_=dragMode;this.mouseX_=x;this.mouseY_=y;};o3djs.cameracontroller.CameraController.prototype.mouseMoved=function(x,y){var deltaX=(x-this.mouseX_)/this.pixelsPerUnit;var deltaY=(y-this.mouseY_)/this.pixelsPerUnit;this.mouseX_=x;this.mouseY_=y;if(this.dragMode_==o3djs.cameracontroller.DragMode.SPIN_ABOUT_CENTER){this.rotationAngle+=deltaX*this.radiansPerUnit;this.heightAngle+=deltaY*this.radiansPerUnit;}
if(this.dragMode_==o3djs.cameracontroller.DragMode.DOLLY_IN_OUT){this.backpedal+=deltaY*this.distancePerUnit;}
if(this.dragMode_==o3djs.cameracontroller.DragMode.ZOOM_IN_OUT){var width=Math.tan(this.fieldOfViewAngle);width*=Math.pow(2,deltaY*this.zoomPerUnit);this.fieldOfViewAngle=Math.atan(width);}
if(this.dragMode_==o3djs.cameracontroller.DragMode.DOLLY_ZOOM){if(this.backpedal>0){var oldWidth=Math.tan(this.fieldOfViewAngle);this.fieldOfViewAngle+=deltaY*this.radiansPerUnit;this.fieldOfViewAngle=Math.min(this.fieldOfViewAngle,0.98*Math.PI/2);this.fieldOfViewAngle=Math.max(this.fieldOfViewAngle,0.02*Math.PI/2);var newWidth=Math.tan(this.fieldOfViewAngle);this.backpedal*=oldWidth/newWidth;}}
if(this.dragMode_==o3djs.cameracontroller.DragMode.MOVE_CENTER_IN_VIEW_PLANE){var matrix4=o3djs.math.matrix4;var translationVector=[-deltaX*this.distancePerUnit,deltaY*this.distancePerUnit,0];var inverseViewMatrix=matrix4.inverse(this.calculateViewMatrix());translationVector=matrix4.transformDirection(inverseViewMatrix,translationVector);this.centerPos=o3djs.math.addVector(this.centerPos,translationVector);}
if(this.onChange!=null&&this.dragMode_!=o3djs.cameracontroller.DragMode.NONE){this.onChange(this);}};o3djs.primitives=o3djs.primitives||{};o3djs.primitives.setCullingInfo=function(primitive){var box=primitive.getBoundingBox(0);primitive.boundingBox=box;var minExtent=box.minExtent;var maxExtent=box.maxExtent;primitive.zSortPoint=o3djs.math.divVectorScalar(o3djs.math.addVector(minExtent,maxExtent),2);};o3djs.primitives.VertexStreamInfo=function(numComponents,semantic,opt_semanticIndex){this.numComponents=numComponents;this.semantic=semantic;this.semanticIndex=opt_semanticIndex||0;this.elements=[];this.addElement=function(value1,opt_value2,opt_value3,opt_value4){};this.setElement=function(index,value1,opt_value2,opt_value3,opt_value4){};this.addElementVector=function(vector){};this.setElementVector=function(index,vector){};this.getElementVector=function(index){return[];};switch(numComponents){case 1:this.addElement=function(value){this.elements.push(value);}
this.getElement=function(index){return this.elements[index];}
this.setElement=function(index,value){this.elements[index]=value;}
break;case 2:this.addElement=function(value0,value1){this.elements.push(value0,value1);}
this.addElementVector=function(vector){this.elements.push(vector[0],vector[1]);}
this.getElementVector=function(index){return this.elements.slice(index*numComponents,(index+1)*numComponents);}
this.setElement=function(index,value0,value1){this.elements[index*numComponents+0]=value0;this.elements[index*numComponents+1]=value1;}
this.setElementVector=function(index,vector){this.elements[index*numComponents+0]=vector[0];this.elements[index*numComponents+1]=vector[1];}
break;case 3:this.addElement=function(value0,value1,value2){this.elements.push(value0,value1,value2);}
this.addElementVector=function(vector){this.elements.push(vector[0],vector[1],vector[2]);}
this.getElementVector=function(index){return this.elements.slice(index*numComponents,(index+1)*numComponents);}
this.setElement=function(index,value0,value1,value2){this.elements[index*numComponents+0]=value0;this.elements[index*numComponents+1]=value1;this.elements[index*numComponents+2]=value2;}
this.setElementVector=function(index,vector){this.elements[index*numComponents+0]=vector[0];this.elements[index*numComponents+1]=vector[1];this.elements[index*numComponents+2]=vector[2];}
break;case 4:this.addElement=function(value0,value1,value2,value3){this.elements.push(value0,value1,value2,value3);}
this.addElementVector=function(vector){this.elements.push(vector[0],vector[1],vector[2],vector[3]);}
this.getElementVector=function(index){return this.elements.slice(index*numComponents,(index+1)*numComponents);}
this.setElement=function(index,value0,value1,value2,value3){this.elements[index*numComponents+0]=value0;this.elements[index*numComponents+1]=value1;this.elements[index*numComponents+2]=value2;this.elements[index*numComponents+3]=value3;}
this.setElementVector=function(index,vector){this.elements[index*numComponents+0]=vector[0];this.elements[index*numComponents+1]=vector[1];this.elements[index*numComponents+2]=vector[2];this.elements[index*numComponents+3]=vector[3];}
break;default:throw'A stream must contain between 1 and 4 components';}};o3djs.primitives.VertexStreamInfo.prototype.numElements=function(){return this.elements.length/this.numComponents;};o3djs.primitives.createVertexStreamInfo=function(numComponents,semantic,opt_semanticIndex){return new o3djs.primitives.VertexStreamInfo(numComponents,semantic,opt_semanticIndex);};o3djs.primitives.VertexInfoBase=function(){this.streams=[];this.indices=[];};o3djs.primitives.VertexInfoBase.prototype.addStream=function(numComponents,semantic,opt_semanticIndex){this.removeStream(semantic,opt_semanticIndex);var stream=o3djs.primitives.createVertexStreamInfo(numComponents,semantic,opt_semanticIndex);this.streams.push(stream);return stream;};o3djs.primitives.VertexInfoBase.prototype.findStream=function(semantic,opt_semanticIndex){opt_semanticIndex=opt_semanticIndex||0;for(var i=0;i<this.streams.length;++i){if(this.streams[i].semantic===semantic&&this.streams[i].semanticIndex==opt_semanticIndex){return this.streams[i];}}
return null;};o3djs.primitives.VertexInfoBase.prototype.removeStream=function(semantic,opt_semanticIndex){opt_semanticIndex=opt_semanticIndex||0;for(var i=0;i<this.streams.length;++i){if(this.streams[i].semantic===semantic&&this.streams[i].semanticIndex==opt_semanticIndex){this.streams.splice(i,1);return;}}};o3djs.primitives.VertexInfoBase.prototype.append=function(info){if(this.streams.length==0&&info.streams.length!=0){for(var i=0;i<info.streams.length;i++){var srcStream=info.streams[i];var stream=this.addStream(srcStream.numComponents,srcStream.semantic,srcStream.semanticIndex);stream.elements=stream.elements.concat(srcStream.elements);}
this.indices=this.indices.concat(info.indices);return;}
if(this.streams.length!=info.streams.length){throw'Number of VertexInfoStreams did not match';}
for(var i=0;i<this.streams.length;i++){var found=false;var semantic=this.streams[i].semantic;var numComponents=this.streams[i].numComponents;var semanticIndex=this.streams[i].semanticIndex;for(var j=0;j<info.streams.length;j++){var otherStream=info.streams[j];if(otherStream.semantic===semantic&&otherStream.numComponents==numComponents&&otherStream.semanticIndex==semanticIndex){found=true;break;}}
if(!found){throw'Did not find stream with semantic='+semantic+', numComponents='+numComponents+', and semantic index='+semanticIndex+' in given VertexInfo';}}
var positionStream=this.findStream(o3djs.base.o3d.Stream.POSITION);if(!positionStream)
throw'POSITION stream is missing';var numVertices=positionStream.numElements();for(var i=0;i<this.streams.length;i++){var stream=this.streams[i];var srcStream=info.findStream(stream.semantic,stream.semanticIndex);stream.elements=stream.elements.concat(srcStream.elements);}
for(var i=0;i<info.indices.length;i++){this.indices.push(info.indices[i]+numVertices);}};o3djs.primitives.VertexInfoBase.prototype.validate=function(){var positionStream=this.findStream(o3djs.base.o3d.Stream.POSITION);if(!positionStream)
throw'POSITION stream is missing';var numElements=positionStream.numElements();for(var s=0;s<this.streams.length;++s){if(this.streams[s].numElements()!==numElements){throw'Stream '+s+' contains '+this.streams[s].numElements()+' elements whereas the POSITION stream contains '+numElements;}}
for(var i=0;i<this.indices.length;++i){if(this.indices[i]<0||this.indices[i]>=numElements){throw'The index '+this.indices[i]+' is out of range [0, '+
numElements+']';}}};o3djs.primitives.VertexInfoBase.prototype.reorient=function(matrix){var math=o3djs.math;var matrixInverse=math.inverse(math.matrix4.getUpper3x3(matrix));for(var s=0;s<this.streams.length;++s){var stream=this.streams[s];if(stream.numComponents==3){var numElements=stream.numElements();switch(stream.semantic){case o3djs.base.o3d.Stream.POSITION:for(var i=0;i<numElements;++i){stream.setElementVector(i,math.matrix4.transformPoint(matrix,stream.getElementVector(i)));}
break;case o3djs.base.o3d.Stream.NORMAL:for(var i=0;i<numElements;++i){stream.setElementVector(i,math.matrix4.transformNormal(matrix,stream.getElementVector(i)));}
break;case o3djs.base.o3d.Stream.TANGENT:case o3djs.base.o3d.Stream.BINORMAL:for(var i=0;i<numElements;++i){stream.setElementVector(i,math.matrix4.transformDirection(matrix,stream.getElementVector(i)));}
break;}}}};o3djs.primitives.VertexInfoBase.prototype.createShapeByType=function(pack,material,primitiveType){this.validate();var numIndices=this.indices.length;var numPrimitives;switch(primitiveType){case o3djs.base.o3d.Primitive.POINTLIST:numPrimitives=numIndices/1;break;case o3djs.base.o3d.Primitive.LINELIST:numPrimitives=numIndices/2;break;case o3djs.base.o3d.Primitive.LINESTRIP:numPrimitives=numIndices-1;break;case o3djs.base.o3d.Primitive.TRIANGLELIST:numPrimitives=numIndices/3;break;case o3djs.base.o3d.Primitive.TRIANGLESTRIP:case o3djs.base.o3d.Primitive.TRIANGLEFAN:numPrimitives=numIndices-2;break;default:throw'unknown primitive type';}
var positionStream=this.findStream(o3djs.base.o3d.Stream.POSITION);var numVertices=positionStream.numElements();var shape=pack.createObject('Shape');var primitive=pack.createObject('Primitive');var streamBank=pack.createObject('StreamBank');primitive.owner=shape;primitive.streamBank=streamBank;primitive.material=material;primitive.numberPrimitives=numPrimitives;primitive.primitiveType=primitiveType;primitive.numberVertices=numVertices;primitive.createDrawElement(pack,null);var streamInfos=material.effect.getStreamInfo();for(var s=0;s<streamInfos.length;++s){var semantic=streamInfos[s].semantic;var semanticIndex=streamInfos[s].semanticIndex;var requiredStream=this.findStream(semantic,semanticIndex);if(!requiredStream){switch(semantic){case o3djs.base.o3d.Stream.TANGENT:case o3djs.base.o3d.Stream.BINORMAL:if(primitiveType==o3djs.base.o3d.Primitive.TRIANGLELIST){this.addTangentStreams(semanticIndex);}else{throw'Can not create tangents and binormals for primitive type'+
primitiveType;}
break;case o3djs.base.o3d.Stream.COLOR:requiredStream=this.addStream(4,semantic,semanticIndex);for(var i=0;i<numVertices;++i){requiredStream.addElement(1,1,1,1);}
break;case o3djs.base.o3d.Stream.INFLUENCE_WEIGHTS:case o3djs.base.o3d.Stream.INFLUENCE_INDICES:break;default:throw'Missing stream for semantic '+semantic+' with semantic index '+semanticIndex;}}}
var vertexBuffer=pack.createObject('VertexBuffer');var fields=[];for(var s=0;s<this.streams.length;++s){var stream=this.streams[s];var fieldType=(stream.semantic==o3djs.base.o3d.Stream.COLOR&&stream.numComponents==4)?'UByteNField':'FloatField';fields[s]=vertexBuffer.createField(fieldType,stream.numComponents);streamBank.setVertexStream(stream.semantic,stream.semanticIndex,fields[s],0);}
vertexBuffer.allocateElements(numVertices);for(var s=0;s<this.streams.length;++s){fields[s].setAt(0,this.streams[s].elements);}
var indexBuffer=pack.createObject('IndexBuffer');indexBuffer.set(this.indices);primitive.indexBuffer=indexBuffer;o3djs.primitives.setCullingInfo(primitive);return shape;};o3djs.primitives.VertexInfo=function(){o3djs.primitives.VertexInfoBase.call(this);}
o3djs.base.inherit(o3djs.primitives.VertexInfo,o3djs.primitives.VertexInfoBase);o3djs.primitives.VertexInfo.prototype.numTriangles=function(){return this.indices.length/3;};o3djs.primitives.VertexInfo.prototype.addTriangle=function(index1,index2,index3){this.indices.push(index1,index2,index3);};o3djs.primitives.VertexInfo.prototype.getTriangle=function(triangleIndex){var indexIndex=triangleIndex*3;return[this.indices[indexIndex+0],this.indices[indexIndex+1],this.indices[indexIndex+2]];};o3djs.primitives.VertexInfo.prototype.setTriangle=function(triangleIndex,index1,index2,index3){var indexIndex=triangleIndex*3;this.indices[indexIndex+0]=index1;this.indices[indexIndex+1]=index2;this.indices[indexIndex+2]=index3;};o3djs.primitives.VertexInfo.prototype.createShape=function(pack,material){return this.createShapeByType(pack,material,o3djs.base.o3d.Primitive.TRIANGLELIST);};o3djs.primitives.VertexInfo.prototype.addTangentStreams=function(opt_semanticIndex){opt_semanticIndex=opt_semanticIndex||0;var math=o3djs.math;this.validate();var positionStream=this.findStream(o3djs.base.o3d.Stream.POSITION);if(!positionStream)
throw'Cannot calculate tangent frame because POSITION stream is missing';if(positionStream.numComponents!=3)
throw'Cannot calculate tangent frame because POSITION stream is not 3D';var normalStream=this.findStream(o3djs.base.o3d.Stream.NORMAL);if(!normalStream)
throw'Cannot calculate tangent frame because NORMAL stream is missing';if(normalStream.numComponents!=3)
throw'Cannot calculate tangent frame because NORMAL stream is not 3D';var texCoordStream=this.findStream(o3djs.base.o3d.Stream.TEXCOORD,opt_semanticIndex);if(!texCoordStream)
throw'Cannot calculate tangent frame because TEXCOORD stream '+
opt_semanticIndex+' is missing';var tangentFrames={};function roundVector(v){return[Math.round(v[0]),Math.round(v[1]),Math.round(v[2])];}
function tangentFrameKey(position,normal){return roundVector(math.mulVectorScalar(position,100))+','+
roundVector(math.mulVectorScalar(normal,100));}
function addTangentFrame(position,normal,tangent,binormal){var key=tangentFrameKey(position,normal);var frame=tangentFrames[key];if(!frame){frame=[[0,0,0],[0,0,0]];}
frame=math.addMatrix(frame,[tangent,binormal]);tangentFrames[key]=frame;}
function getTangentFrame(position,normal){var key=tangentFrameKey(position,normal);return tangentFrames[key];}
var numTriangles=this.numTriangles();for(var triangleIndex=0;triangleIndex<numTriangles;++triangleIndex){var vertexIndices=this.getTriangle(triangleIndex);var uvs=[];var positions=[];var normals=[];for(var i=0;i<3;++i){var vertexIndex=vertexIndices[i];uvs[i]=texCoordStream.getElementVector(vertexIndex);positions[i]=positionStream.getElementVector(vertexIndex);normals[i]=normalStream.getElementVector(vertexIndex);}
var tangent=[0,0,0];var binormal=[0,0,0];for(var axis=0;axis<3;++axis){var edge1=[positions[1][axis]-positions[0][axis],uvs[1][0]-uvs[0][0],uvs[1][1]-uvs[0][1]];var edge2=[positions[2][axis]-positions[0][axis],uvs[2][0]-uvs[0][0],uvs[2][1]-uvs[0][1]];var edgeCross=math.normalize(math.cross(edge1,edge2));if(edgeCross[0]==0){edgeCross[0]=1;}
tangent[axis]=-edgeCross[1]/edgeCross[0];binormal[axis]=-edgeCross[2]/edgeCross[0];}
var tangentLength=math.length(tangent);if(tangentLength>0.001){tangent=math.mulVectorScalar(tangent,1/tangentLength);}
var binormalLength=math.length(binormal);if(binormalLength>0.001){binormal=math.mulVectorScalar(binormal,1/binormalLength);}
for(var i=0;i<3;++i){addTangentFrame(positions[i],normals[i],tangent,binormal);}}
var tangentStream=this.addStream(3,o3djs.base.o3d.Stream.TANGENT,opt_semanticIndex);var binormalStream=this.addStream(3,o3djs.base.o3d.Stream.BINORMAL,opt_semanticIndex);var numVertices=positionStream.numElements();for(var vertexIndex=0;vertexIndex<numVertices;++vertexIndex){var position=positionStream.getElementVector(vertexIndex);var normal=normalStream.getElementVector(vertexIndex);var frame=getTangentFrame(position,normal);var tangent=frame[0];tangent=math.subVector(tangent,math.mulVectorScalar(normal,math.dot(normal,tangent)));var tangentLength=math.length(tangent);if(tangentLength>0.001){tangent=math.mulVectorScalar(tangent,1/tangentLength);}
var binormal=frame[1];binormal=math.subVector(binormal,math.mulVectorScalar(tangent,math.dot(tangent,binormal)));binormal=math.subVector(binormal,math.mulVectorScalar(normal,math.dot(normal,binormal)));var binormalLength=math.length(binormal);if(binormalLength>0.001){binormal=math.mulVectorScalar(binormal,1/binormalLength);}
tangentStream.setElementVector(vertexIndex,tangent);binormalStream.setElementVector(vertexIndex,binormal);}};o3djs.primitives.createVertexInfo=function(){return new o3djs.primitives.VertexInfo();};o3djs.primitives.createSphereVertices=function(radius,subdivisionsAxis,subdivisionsHeight,opt_matrix){if(subdivisionsAxis<=0||subdivisionsHeight<=0){throw Error('subdivisionAxis and subdivisionHeight must be > 0');}
var vertexInfo=o3djs.primitives.createVertexInfo();var positionStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.POSITION);var normalStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.NORMAL);var texCoordStream=vertexInfo.addStream(2,o3djs.base.o3d.Stream.TEXCOORD,0);for(var y=0;y<=subdivisionsHeight;y++){for(var x=0;x<=subdivisionsAxis;x++){var u=x/subdivisionsAxis;var v=y/subdivisionsHeight;var theta=2*Math.PI*u;var phi=Math.PI*v;var sinTheta=Math.sin(theta);var cosTheta=Math.cos(theta);var sinPhi=Math.sin(phi);var cosPhi=Math.cos(phi);var ux=cosTheta*sinPhi;var uy=cosPhi;var uz=sinTheta*sinPhi;positionStream.addElement(radius*ux,radius*uy,radius*uz);normalStream.addElement(ux,uy,uz);texCoordStream.addElement(1-u,1-v);}}
var numVertsAround=subdivisionsAxis+1;for(var x=0;x<subdivisionsAxis;x++){for(var y=0;y<subdivisionsHeight;y++){vertexInfo.addTriangle((y+0)*numVertsAround+x,(y+0)*numVertsAround+x+1,(y+1)*numVertsAround+x);vertexInfo.addTriangle((y+1)*numVertsAround+x,(y+0)*numVertsAround+x+1,(y+1)*numVertsAround+x+1);}}
if(opt_matrix){vertexInfo.reorient(opt_matrix);}
return vertexInfo;};o3djs.primitives.createSphere=function(pack,material,radius,subdivisionsAxis,subdivisionsHeight,opt_matrix){var vertexInfo=o3djs.primitives.createSphereVertices(radius,subdivisionsAxis,subdivisionsHeight,opt_matrix);return vertexInfo.createShape(pack,material);};o3djs.primitives.CUBE_FACE_INDICES_=[[3,7,5,1],[0,4,6,2],[6,7,3,2],[0,1,5,4],[5,7,6,4],[2,3,1,0]];o3djs.primitives.createCubeVertices=function(size,opt_matrix){var k=size/2;var cornerVertices=[[-k,-k,-k],[+k,-k,-k],[-k,+k,-k],[+k,+k,-k],[-k,-k,+k],[+k,-k,+k],[-k,+k,+k],[+k,+k,+k]];var faceNormals=[[+1,+0,+0],[-1,+0,+0],[+0,+1,+0],[+0,-1,+0],[+0,+0,+1],[+0,+0,-1]];var uvCoords=[[0,0],[1,0],[1,1],[0,1]];var vertexInfo=o3djs.primitives.createVertexInfo();var positionStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.POSITION);var normalStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.NORMAL);var texCoordStream=vertexInfo.addStream(2,o3djs.base.o3d.Stream.TEXCOORD,0);for(var f=0;f<6;++f){var faceIndices=o3djs.primitives.CUBE_FACE_INDICES_[f];for(var v=0;v<4;++v){var position=cornerVertices[faceIndices[v]];var normal=faceNormals[f];var uv=uvCoords[v];positionStream.addElementVector(position);normalStream.addElementVector(normal);texCoordStream.addElementVector(uv);var offset=4*f;vertexInfo.addTriangle(offset+0,offset+1,offset+2);vertexInfo.addTriangle(offset+0,offset+2,offset+3);}}
if(opt_matrix){vertexInfo.reorient(opt_matrix);}
return vertexInfo;};o3djs.primitives.createCube=function(pack,material,size,opt_matrix){var vertexInfo=o3djs.primitives.createCubeVertices(size,opt_matrix);return vertexInfo.createShape(pack,material);};o3djs.primitives.createBox=function(pack,material,width,height,depth,opt_matrix){var vertexInfo=o3djs.primitives.createCubeVertices(1);vertexInfo.reorient([[width,0,0,0],[0,height,0,0],[0,0,depth,0],[0,0,0,1]]);if(opt_matrix){vertexInfo.reorient(opt_matrix);}
return vertexInfo.createShape(pack,material);};o3djs.primitives.createRainbowCube=function(pack,material,size,opt_matrix){var vertexInfo=o3djs.primitives.createCubeVertices(size,opt_matrix);var colorStream=vertexInfo.addStream(4,o3djs.base.o3d.Stream.COLOR);var colors=[[1,0,0,1],[0,1,0,1],[0,0,1,1],[1,1,0,1],[0,1,1,1],[1,0,1,1],[0,.5,.3,1],[.3,0,.5,1]];var vertices=vertexInfo.vertices;for(var f=0;f<6;++f){var faceIndices=o3djs.primitives.CUBE_FACE_INDICES_[f];for(var v=0;v<4;++v){var color=colors[faceIndices[v]];colorStream.addElementVector(color);}}
return vertexInfo.createShape(pack,material);};o3djs.primitives.createDiscVertices=function(radius,divisions,opt_stacks,opt_startStack,opt_stackPower,opt_matrix){if(divisions<3){throw Error('divisions must be at least 3');}
var stacks=opt_stacks?opt_stacks:1;var startStack=opt_startStack?opt_startStack:0;var stackPower=opt_stackPower?opt_stackPower:1;var vertexInfo=o3djs.primitives.createVertexInfo();var positionStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.POSITION);var normalStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.NORMAL);var texCoordStream=vertexInfo.addStream(2,o3djs.base.o3d.Stream.TEXCOORD,0);var firstIndex=0;if(startStack==0){positionStream.addElement(0,0,0);normalStream.addElement(0,1,0);texCoordStream.addElement(0,0);firstIndex++;}
for(var currentStack=Math.max(startStack,1);currentStack<=stacks;++currentStack){var stackRadius=radius*Math.pow(currentStack/stacks,stackPower);for(var i=0;i<divisions;++i){var theta=2.0*Math.PI*i/divisions;var x=stackRadius*Math.cos(theta);var z=stackRadius*Math.sin(theta);positionStream.addElement(x,0,z);normalStream.addElement(0,1,0);texCoordStream.addElement(x,z);if(currentStack>startStack){var a=firstIndex+(i+1)%divisions;var b=firstIndex+i;if(currentStack>1){var c=firstIndex+i-divisions;var d=firstIndex+(i+1)%divisions-divisions;vertexInfo.addTriangle(a,b,c);vertexInfo.addTriangle(a,c,d);}else{vertexInfo.addTriangle(0,a,b);}}}
firstIndex+=divisions;}
if(opt_matrix){vertexInfo.reorient(opt_matrix);}
return vertexInfo;};o3djs.primitives.createDisc=function(pack,material,radius,divisions,stacks,startStack,stackPower,opt_matrix){var vertexInfo=o3djs.primitives.createDiscVertices(radius,divisions,stacks,startStack,stackPower,opt_matrix);return vertexInfo.createShape(pack,material);};o3djs.primitives.createCylinderVertices=function(radius,height,radialSubdivisions,verticalSubdivisions,opt_matrix){return o3djs.primitives.createTruncatedConeVertices(radius,radius,height,radialSubdivisions,verticalSubdivisions,opt_matrix);};o3djs.primitives.createCylinder=function(pack,material,radius,height,radialSubdivisions,verticalSubdivisions,opt_matrix){var vertexInfo=o3djs.primitives.createCylinderVertices(radius,height,radialSubdivisions,verticalSubdivisions,opt_matrix);return vertexInfo.createShape(pack,material);};o3djs.primitives.createTruncatedConeVertices=function(bottomRadius,topRadius,height,radialSubdivisions,verticalSubdivisions,opt_matrix){if(radialSubdivisions<3){throw Error('radialSubdivisions must be 3 or greater');}
if(verticalSubdivisions<1){throw Error('verticalSubdivisions must be 1 or greater');}
var vertexInfo=o3djs.primitives.createVertexInfo();var positionStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.POSITION);var normalStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.NORMAL);var texCoordStream=vertexInfo.addStream(2,o3djs.base.o3d.Stream.TEXCOORD,0);var vertsAroundEdge=radialSubdivisions+1;var slant=Math.atan2(bottomRadius-topRadius,height);var cosSlant=Math.cos(slant);var sinSlant=Math.sin(slant);for(var yy=-2;yy<=verticalSubdivisions+2;++yy){var v=yy/verticalSubdivisions
var y=height*v;var ringRadius;if(yy<0){y=0;v=1;ringRadius=bottomRadius;}else if(yy>verticalSubdivisions){y=height;v=1;ringRadius=topRadius;}else{ringRadius=bottomRadius+
(topRadius-bottomRadius)*(yy/verticalSubdivisions);}
if(yy==-2||yy==verticalSubdivisions+2){ringRadius=0;v=0;}
y-=height/2;for(var ii=0;ii<vertsAroundEdge;++ii){var sin=Math.sin(ii*Math.PI*2/radialSubdivisions);var cos=Math.cos(ii*Math.PI*2/radialSubdivisions);positionStream.addElement(sin*ringRadius,y,cos*ringRadius);normalStream.addElement((yy<0||yy>verticalSubdivisions)?0:(sin*cosSlant),(yy<0)?-1:(yy>verticalSubdivisions?1:sinSlant),(yy<0||yy>verticalSubdivisions)?0:(cos*cosSlant));texCoordStream.addElement(ii/radialSubdivisions,v);}}
for(var yy=0;yy<verticalSubdivisions+4;++yy){for(var ii=0;ii<radialSubdivisions;++ii){vertexInfo.addTriangle(vertsAroundEdge*(yy+0)+0+ii,vertsAroundEdge*(yy+0)+1+ii,vertsAroundEdge*(yy+1)+1+ii);vertexInfo.addTriangle(vertsAroundEdge*(yy+0)+0+ii,vertsAroundEdge*(yy+1)+1+ii,vertsAroundEdge*(yy+1)+0+ii);}}
if(opt_matrix){vertexInfo.reorient(opt_matrix);}
return vertexInfo;};o3djs.primitives.createTruncatedCone=function(pack,material,bottomRadius,topRadius,height,radialSubdivisions,verticalSubdivisions,opt_matrix){var vertexInfo=o3djs.primitives.createTruncatedConeVertices(bottomRadius,topRadius,height,radialSubdivisions,verticalSubdivisions,opt_matrix);return vertexInfo.createShape(pack,material);};o3djs.primitives.createTorusVertices=function(torusRadius,tubeRadius,tubeLengthSubdivisions,circleSubdivisions,opt_matrix){if(tubeLengthSubdivisions<3){throw Error('tubeLengthSubdivisions must be 3 or greater');}
if(circleSubdivisions<3){throw Error('circleSubdivisions must be 3 or greater');}
var vertexInfo=o3djs.primitives.createVertexInfo();var positionStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.POSITION);var normalStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.NORMAL);var texCoordStream=vertexInfo.addStream(2,o3djs.base.o3d.Stream.TEXCOORD,0);for(var uu=0;uu<tubeLengthSubdivisions;++uu){var u=(uu/tubeLengthSubdivisions)*2*Math.PI;for(var vv=0;vv<circleSubdivisions;++vv){var v=(vv/circleSubdivisions)*2*Math.PI;var sinu=Math.sin(u);var cosu=Math.cos(u);var sinv=Math.sin(v);var cosv=Math.cos(v);positionStream.addElement((torusRadius+tubeRadius*cosv)*cosu,tubeRadius*sinv,(torusRadius+tubeRadius*cosv)*sinu);normalStream.addElement(cosv*cosu,sinv,cosv*sinu);texCoordStream.addElement(uu/tubeLengthSubdivisions,vv/circleSubdivisions);}}
for(var uu=0;uu<tubeLengthSubdivisions;++uu){for(var vv=0;vv<circleSubdivisions;++vv){var uuPlusOne=(uu+1)%tubeLengthSubdivisions;var vvPlusOne=(vv+1)%circleSubdivisions;var a=circleSubdivisions*uu+vv;var b=circleSubdivisions*uuPlusOne+vv;var c=circleSubdivisions*uu+vvPlusOne;var d=circleSubdivisions*uuPlusOne+vvPlusOne;vertexInfo.addTriangle(a,d,b);vertexInfo.addTriangle(a,c,d);}}
if(opt_matrix){vertexInfo.reorient(opt_matrix);}
return vertexInfo;};o3djs.primitives.createTorus=function(pack,material,torusRadius,tubeRadius,tubeLengthSubdivisions,circleSubdivisions,opt_matrix){var vertexInfo=o3djs.primitives.createTorusVertices(torusRadius,tubeRadius,tubeLengthSubdivisions,circleSubdivisions,opt_matrix);return vertexInfo.createShape(pack,material);};o3djs.primitives.createWedgeVertices=function(inPoints,depth,opt_matrix){var math=o3djs.math;var vertexInfo=o3djs.primitives.createVertexInfo();var positionStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.POSITION);var normalStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.NORMAL);var texCoordStream=vertexInfo.addStream(2,o3djs.base.o3d.Stream.TEXCOORD,0);var z1=-depth*0.5;var z2=depth*0.5;var face=[];var points=[[inPoints[0][0],inPoints[0][1]],[inPoints[1][0],inPoints[1][1]],[inPoints[2][0],inPoints[2][1]]];face[0]=math.cross(math.normalize([points[1][0]-points[0][0],points[1][1]-points[0][1],z1-z1]),math.normalize([points[1][0]-points[1][0],points[1][1]-points[1][1],z2-z1]));face[1]=math.cross(math.normalize([points[2][0]-points[1][0],points[2][1]-points[1][1],z1-z1]),math.normalize([points[2][0]-points[2][0],points[2][1]-points[2][1],z2-z1]));face[2]=math.cross([points[0][0]-points[2][0],points[0][1]-points[2][1],z1-z1],[points[0][0]-points[0][0],points[0][1]-points[0][1],z2-z1]);positionStream.addElement(points[0][0],points[0][1],z1);normalStream.addElement(0,0,-1);texCoordStream.addElement(0,1);positionStream.addElement(points[1][0],points[1][1],z1);normalStream.addElement(0,0,-1);texCoordStream.addElement(1,0);positionStream.addElement(points[2][0],points[2][1],z1);normalStream.addElement(0,0,-1);texCoordStream.addElement(0,0);positionStream.addElement(points[0][0],points[0][1],z2);normalStream.addElement(0,0,1);texCoordStream.addElement(0,1);positionStream.addElement(points[1][0],points[1][1],z2);normalStream.addElement(0,0,1);texCoordStream.addElement(1,0);positionStream.addElement(points[2][0],points[2][1],z2);normalStream.addElement(0,0,1);texCoordStream.addElement(0,0);positionStream.addElement(points[0][0],points[0][1],z1);normalStream.addElement(face[0][0],face[0][1],face[0][2]);texCoordStream.addElement(0,1);positionStream.addElement(points[1][0],points[1][1],z1);normalStream.addElement(face[0][0],face[0][1],face[0][2]);texCoordStream.addElement(0,0);positionStream.addElement(points[1][0],points[1][1],z2);normalStream.addElement(face[0][0],face[0][1],face[0][2]);texCoordStream.addElement(1,0);positionStream.addElement(points[0][0],points[0][1],z2);normalStream.addElement(face[0][0],face[0][1],face[0][2]);texCoordStream.addElement(1,1);positionStream.addElement(points[1][0],points[1][1],z1);normalStream.addElement(face[1][0],face[1][1],face[1][2]);texCoordStream.addElement(0,1);positionStream.addElement(points[2][0],points[2][1],z1);normalStream.addElement(face[1][0],face[1][1],face[1][2]);texCoordStream.addElement(0,0);positionStream.addElement(points[2][0],points[2][1],z2);normalStream.addElement(face[1][0],face[1][1],face[1][2]);texCoordStream.addElement(1,0);positionStream.addElement(points[1][0],points[1][1],z2);normalStream.addElement(face[1][0],face[1][1],face[1][2]);texCoordStream.addElement(1,1);positionStream.addElement(points[2][0],points[2][1],z1);normalStream.addElement(face[2][0],face[2][1],face[2][2]);texCoordStream.addElement(0,1);positionStream.addElement(points[0][0],points[0][1],z1);normalStream.addElement(face[2][0],face[2][1],face[2][2]);texCoordStream.addElement(0,0);positionStream.addElement(points[0][0],points[0][1],z2);normalStream.addElement(face[2][0],face[2][1],face[2][2]);texCoordStream.addElement(1,0);positionStream.addElement(points[2][0],points[2][1],z2);normalStream.addElement(face[2][0],face[2][1],face[2][2]);texCoordStream.addElement(1,1);vertexInfo.addTriangle(0,2,1);vertexInfo.addTriangle(3,4,5);vertexInfo.addTriangle(6,7,8);vertexInfo.addTriangle(6,8,9);vertexInfo.addTriangle(10,11,12);vertexInfo.addTriangle(10,12,13);vertexInfo.addTriangle(14,15,16);vertexInfo.addTriangle(14,16,17);if(opt_matrix){vertexInfo.reorient(opt_matrix);}
return vertexInfo;};o3djs.primitives.createWedge=function(pack,material,points,depth,opt_matrix){var vertexInfo=o3djs.primitives.createWedgeVertices(points,depth,opt_matrix);return vertexInfo.createShape(pack,material);};o3djs.primitives.createPrismVertices=function(points,depth,opt_matrix){if(points.length<3){throw Error('there must be 3 or more points');}
var backZ=-0.5*depth;var frontZ=0.5*depth;var normals=[];var vertexInfo=o3djs.primitives.createVertexInfo();var positionStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.POSITION);var normalStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.NORMAL);var texCoordStream=vertexInfo.addStream(2,o3djs.base.o3d.Stream.TEXCOORD,0);var n=points.length;for(var i=0;i<n;++i){var j=(i+1)%n;var x=points[j][0]-points[i][0];var y=points[j][1]-points[i][1];var length=Math.sqrt(x*x+y*y);normals[i]=[y/length,-x/length,0];}
var minX=points[0][0];var minY=points[0][1];var maxX=points[0][0];var maxY=points[0][1];for(var i=1;i<n;++i){var x=points[i][0];var y=points[i][1];minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
var frontUV=[];var backUV=[];var rangeX=maxX-minX;var rangeY=maxY-minY;for(var i=0;i<n;++i){frontUV[i]=[(points[i][0]-minX)/rangeX,(points[i][1]-minY)/rangeY];backUV[i]=[(maxX-points[i][0])/rangeX,(points[i][1]-minY)/rangeY];}
for(var i=0;i<n;++i){var j=(i+1)%n;positionStream.addElement(points[i][0],points[i][1],backZ);normalStream.addElement(0,0,-1);texCoordStream.addElement(backUV[i][0],backUV[i][1]);positionStream.addElement(points[i][0],points[i][1],frontZ),normalStream.addElement(0,0,1);texCoordStream.addElement(frontUV[i][0],frontUV[i][1]);positionStream.addElement(points[i][0],points[i][1],backZ),normalStream.addElement(normals[i][0],normals[i][1],normals[i][2]);texCoordStream.addElement(0,1);positionStream.addElement(points[j][0],points[j][1],backZ),normalStream.addElement(normals[i][0],normals[i][1],normals[i][2]);texCoordStream.addElement(0,0);positionStream.addElement(points[j][0],points[j][1],frontZ),normalStream.addElement(normals[i][0],normals[i][1],normals[i][2]);texCoordStream.addElement(1,0);positionStream.addElement(points[i][0],points[i][1],frontZ),normalStream.addElement(normals[i][0],normals[i][1],normals[i][2]);texCoordStream.addElement(1,1);if(i>0&&i<n-1){vertexInfo.addTriangle(0,6*(i+1),6*i);vertexInfo.addTriangle(1,6*i+1,6*(i+1)+1);}
vertexInfo.addTriangle(6*i+2,6*i+3,6*i+4);vertexInfo.addTriangle(6*i+2,6*i+4,6*i+5);}
if(opt_matrix){vertexInfo.reorient(opt_matrix);}
return vertexInfo;};o3djs.primitives.createPrism=function(pack,material,points,depth,opt_matrix){var vertexInfo=o3djs.primitives.createPrismVertices(points,depth,opt_matrix);return vertexInfo.createShape(pack,material);};o3djs.primitives.createPlaneVertices=function(width,depth,subdivisionsWidth,subdivisionsDepth,opt_matrix){if(subdivisionsWidth<=0||subdivisionsDepth<=0){throw Error('subdivisionWidth and subdivisionDepth must be > 0');}
var vertexInfo=o3djs.primitives.createVertexInfo();var positionStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.POSITION);var normalStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.NORMAL);var texCoordStream=vertexInfo.addStream(2,o3djs.base.o3d.Stream.TEXCOORD,0);for(var z=0;z<=subdivisionsDepth;z++){for(var x=0;x<=subdivisionsWidth;x++){var u=x/subdivisionsWidth;var v=z/subdivisionsDepth;positionStream.addElement(width*u-width*0.5,0,depth*v-depth*0.5);normalStream.addElement(0,1,0);texCoordStream.addElement(u,1-v);}}
var numVertsAcross=subdivisionsWidth+1;for(var z=0;z<subdivisionsDepth;z++){for(var x=0;x<subdivisionsWidth;x++){vertexInfo.addTriangle((z+0)*numVertsAcross+x,(z+1)*numVertsAcross+x,(z+0)*numVertsAcross+x+1);vertexInfo.addTriangle((z+1)*numVertsAcross+x,(z+1)*numVertsAcross+x+1,(z+0)*numVertsAcross+x+1);}}
if(opt_matrix){vertexInfo.reorient(opt_matrix);}
return vertexInfo;};o3djs.primitives.createPlane=function(pack,material,width,depth,subdivisionsWidth,subdivisionsDepth,opt_matrix){var vertexInfo=o3djs.primitives.createPlaneVertices(width,depth,subdivisionsWidth,subdivisionsDepth,opt_matrix);return vertexInfo.createShape(pack,material);};o3djs.primitives.createFadePlane=function(pack,material,width,depth,subdivisionsWidth,subdivisionsDepth,opt_matrix){var vertexInfo=o3djs.primitives.createPlaneVertices(width,depth,subdivisionsWidth,subdivisionsDepth,opt_matrix);var colorStream=vertexInfo.addStream(4,o3djs.base.o3d.Stream.COLOR);for(var z=0;z<=subdivisionsDepth;z++){var alpha=z/subdivisionsDepth;for(var x=0;x<=subdivisionsWidth;x++){colorStream.addElement(1,1,1,alpha);}}
return vertexInfo.createShape(pack,material);};o3djs.canvas=o3djs.canvas||{};o3djs.canvas.create=function(pack,root,viewInfo){return new o3djs.canvas.CanvasInfo(pack,root,viewInfo);};o3djs.canvas.buildShaderString=function(){var p=o3djs.effect;var varyingDecls=p.BEGIN_OUT_STRUCT+
p.VARYING+p.FLOAT4+' '+
p.VARYING_DECLARATION_PREFIX+'position'+
p.semanticSuffix('POSITION')+';\n'+
p.VARYING+p.FLOAT2+' '+
p.VARYING_DECLARATION_PREFIX+'texCoord'+
p.semanticSuffix('TEXCOORD0')+';\n'+
p.END_STRUCT;return'uniform '+p.MATRIX4+' worldViewProjection'+
p.semanticSuffix('WORLDVIEWPROJECTION')+';\n\n'+
p.BEGIN_IN_STRUCT+
p.ATTRIBUTE+p.FLOAT4+' position'+
p.semanticSuffix('POSITION')+';\n'+
p.ATTRIBUTE+p.FLOAT2+' texCoord0'+
p.semanticSuffix('TEXCOORD0')+';\n'+
p.END_STRUCT+'\n'+
varyingDecls+'\n'+
p.beginVertexShaderMain()+'  '+p.VERTEX_VARYING_PREFIX+'position = '+
p.mul(p.ATTRIBUTE_PREFIX+'position','worldViewProjection')+';\n'+'  '+p.VERTEX_VARYING_PREFIX+'texCoord = '+
p.ATTRIBUTE_PREFIX+'texCoord0;\n'+
p.endVertexShaderMain()+'\n'+
p.pixelShaderHeader()+'uniform '+p.SAMPLER+' texSampler0;\n'+
p.repeatVaryingDecls(varyingDecls)+
p.beginPixelShaderMain()+
p.endPixelShaderMain(p.TEXTURE+'2D'+'(texSampler0, '+p.PIXEL_VARYING_PREFIX+'texCoord)')+
p.entryPoints()+
p.matrixLoadOrder();};o3djs.canvas.CanvasInfo=function(pack,root,viewInfo){this.pack=pack;this.viewInfo=viewInfo;this.root=root;this.effect_=this.pack.createObject('Effect');this.effect_.loadFromFXString(o3djs.canvas.buildShaderString());this.transparentMaterial_=this.pack.createObject('Material');this.opaqueMaterial_=this.pack.createObject('Material');this.transparentMaterial_.effect=this.effect_;this.opaqueMaterial_.effect=this.effect_;this.transparentMaterial_.drawList=viewInfo.zOrderedDrawList;this.opaqueMaterial_.drawList=viewInfo.performanceDrawList;this.transparentState_=this.pack.createObject('State');this.transparentState_.getStateParam('AlphaBlendEnable').value=true;this.transparentState_.getStateParam('SourceBlendFunction').value=o3djs.base.o3d.State.BLENDFUNC_ONE;this.transparentState_.getStateParam('DestinationBlendFunction').value=o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA;this.transparentMaterial_.state=this.transparentState_;this.transparentQuadShape=o3djs.primitives.createPlane(this.pack,this.transparentMaterial_,1,1,1,1,[[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0,0,0,1]]);this.opaqueQuadShape=o3djs.primitives.createPlane(this.pack,this.opaqueMaterial_,1,1,1,1,[[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0,0,0,1]]);};o3djs.canvas.CanvasQuad=function(canvasInfo,width,height,transparent,opt_parent){this.canvasInfo=canvasInfo;var parentTransform=opt_parent||canvasInfo.root;this.transform=canvasInfo.pack.createObject('Transform');this.transform.parent=parentTransform;this.scaleTransform=canvasInfo.pack.createObject('Transform');this.scaleTransform.parent=this.transform;this.texture=(canvasInfo.pack.createTexture2D(width,height,o3djs.base.o3d.Texture.ARGB8,1,false));this.canvas=canvasInfo.pack.createObject('Canvas');this.canvas.setSize(width,height);this.sampler=canvasInfo.pack.createObject('Sampler');this.sampler.addressModeU=o3djs.base.o3d.Sampler.CLAMP;this.sampler.addressModeV=o3djs.base.o3d.Sampler.CLAMP;this.paramSampler_=this.scaleTransform.createParam('texSampler0','ParamSampler');this.paramSampler_.value=this.sampler;this.sampler.texture=this.texture;if(transparent){this.scaleTransform.addShape(canvasInfo.transparentQuadShape);}else{this.scaleTransform.addShape(canvasInfo.opaqueQuadShape);}
this.scaleTransform.translate(width/2,height/2,0);this.scaleTransform.scale(width,-height,1);};o3djs.canvas.CanvasQuad.prototype.updateTexture=function(){var width=this.texture.width;var height=this.texture.height;this.texture.drawImage(this.canvas,0,height-1,width,-height,0,0,0,width,height);};o3djs.canvas.CanvasInfo.prototype.createXYQuad=function(topX,topY,z,width,height,transparent,opt_parent){var canvasQuad=new o3djs.canvas.CanvasQuad(this,width,height,transparent,opt_parent);canvasQuad.transform.translate(topX,topY,z);return canvasQuad;};o3djs.canvas.CanvasInfo.prototype.createQuad=function(width,height,transparent,opt_parent){return new o3djs.canvas.CanvasQuad(this,width,height,transparent,opt_parent);};o3djs.lineprimitives=o3djs.lineprimitives||{};o3djs.lineprimitives.LineVertexInfo=function(){o3djs.primitives.VertexInfoBase.call(this);}
o3djs.base.inherit(o3djs.lineprimitives.LineVertexInfo,o3djs.primitives.VertexInfoBase);o3djs.lineprimitives.LineVertexInfo.prototype.numLines=function(){return this.indices.length/2;};o3djs.lineprimitives.LineVertexInfo.prototype.addLine=function(index1,index2){this.indices.push(index1,index2);};o3djs.lineprimitives.LineVertexInfo.prototype.getLine=function(triangleIndex){var indexIndex=triangleIndex*3;return[this.indices[indexIndex+0],this.indices[indexIndex+1],this.indices[indexIndex+2]];};o3djs.lineprimitives.LineVertexInfo.prototype.setLine=function(lineIndex,index1,index2){var indexIndex=lineIndex*2;this.indices[indexIndex+0]=index1;this.indices[indexIndex+1]=index2;};o3djs.lineprimitives.LineVertexInfo.prototype.createShape=function(pack,material){return this.createShapeByType(pack,material,o3djs.base.o3d.Primitive.LINELIST);};o3djs.lineprimitives.createLineVertexInfo=function(){return new o3djs.lineprimitives.LineVertexInfo();};o3djs.lineprimitives.createLineCubeVertices=function(size,opt_matrix){var k=size/2;var vertices=[[-k,-k,-k],[+k,-k,-k],[-k,+k,-k],[+k,+k,-k],[-k,-k,+k],[+k,-k,+k],[-k,+k,+k],[+k,+k,+k]];var indices=[[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];var vertexInfo=o3djs.lineprimitives.createLineVertexInfo();var positionStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.POSITION);for(var v=0;v<vertices.length;++v){positionStream.addElementVector(vertices[v]);}
for(var i=0;i<indices.length;++i){vertexInfo.addLine(indices[i][0],indices[i][1]);}
if(opt_matrix){vertexInfo.reorient(opt_matrix);}
return vertexInfo;};o3djs.lineprimitives.createLineCube=function(pack,material,size,opt_matrix){var vertexInfo=o3djs.lineprimitives.createLineCubeVertices(size,opt_matrix);return vertexInfo.createShape(pack,material);};o3djs.lineprimitives.createLineSphereVertices=function(radius,subdivisionsAxis,subdivisionsHeight,opt_matrix){if(subdivisionsAxis<=0||subdivisionsHeight<=0){throw Error('subdivisionAxis and subdivisionHeight must be > 0');}
var vertexInfo=o3djs.lineprimitives.createLineVertexInfo();var positionStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.POSITION);for(var y=0;y<=subdivisionsHeight;y++){for(var x=0;x<=subdivisionsAxis;x++){var u=x/subdivisionsAxis
var v=y/subdivisionsHeight;var theta=2*Math.PI*u;var phi=Math.PI*v;var sinTheta=Math.sin(theta);var cosTheta=Math.cos(theta);var sinPhi=Math.sin(phi);var cosPhi=Math.cos(phi);var ux=cosTheta*sinPhi;var uy=cosPhi;var uz=sinTheta*sinPhi;positionStream.addElement(radius*ux,radius*uy,radius*uz);}}
var numVertsAround=subdivisionsAxis+1;for(var x=0;x<subdivisionsAxis;x++){for(var y=0;y<subdivisionsHeight;y++){vertexInfo.addLine((y+0)*numVertsAround+x,(y+0)*numVertsAround+x+1);vertexInfo.addLine((y+0)*numVertsAround+x,(y+1)*numVertsAround+x);}}
if(opt_matrix){vertexInfo.reorient(opt_matrix);}
return vertexInfo;};o3djs.lineprimitives.createLineSphere=function(pack,material,radius,subdivisionsAxis,subdivisionsHeight,opt_matrix){var vertexInfo=o3djs.lineprimitives.createLineSphereVertices(radius,subdivisionsAxis,subdivisionsHeight,opt_matrix);return vertexInfo.createShape(pack,material);};o3djs.lineprimitives.createLineRingVertices=function(radius,subdivisions,maxTexCoord,opt_matrix){if(subdivisions<3){throw Error('subdivisions must be >= 3');}
var vertexInfo=o3djs.lineprimitives.createLineVertexInfo();var positionStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.POSITION);var normalStream=vertexInfo.addStream(3,o3djs.base.o3d.Stream.NORMAL);var texCoordStream=vertexInfo.addStream(1,o3djs.base.o3d.Stream.TEXCOORD,0);for(var i=0;i<=subdivisions;i++){var theta=2*Math.PI*i/subdivisions;positionStream.addElement(radius*Math.cos(theta),0,radius*Math.sin(theta));normalStream.addElement(Math.cos(theta),0,Math.sin(theta));texCoordStream.addElement(maxTexCoord*i/subdivisions);}
for(var i=0;i<subdivisions;i++){vertexInfo.addLine(i,i+1);}
if(opt_matrix){vertexInfo.reorient(opt_matrix);}
return vertexInfo;};o3djs.lineprimitives.createLineRing=function(pack,material,radius,subdivisions,maxTexCoord,opt_matrix){var vertexInfo=o3djs.lineprimitives.createLineRingVertices(radius,subdivisions,maxTexCoord,opt_matrix);return vertexInfo.createShape(pack,material);};var O3D_DEBUG_PREFIX='o3dDebug_';var O3D_DEBUG_PREFIX_LENGTH=O3D_DEBUG_PREFIX.length;var O3D_DEBUG_COLOR_PARAM_NAME=O3D_DEBUG_PREFIX+'Color';var O3D_DEBUG_VECTOR_SCALE_PARAM_NAME=O3D_DEBUG_PREFIX+'VectorScale';var O3D_DEBUG_AXIS_SHAPE_NAME=O3D_DEBUG_PREFIX+'AxisShape';var O3D_DEBUG_LINE_SHAPE_NAME=O3D_DEBUG_PREFIX+'LineShape';var O3D_DEBUG_SPHERE_SHAPE_NAME=O3D_DEBUG_PREFIX+'SphereShape';var O3D_DEBUG_CUBE_SHAPE_NAME=O3D_DEBUG_PREFIX+'CubeShape';var O3D_DEBUG_AXIS_INFO_=[{offset:[1,0,0],color:[1,0,0,1]},{offset:[0,1,0],color:[0,1,0,1]},{offset:[0,0,1],color:[0,0,1,1]}];o3djs.debug=o3djs.debug||{};o3djs.debug.isDebugTransform=function(transform){var name=transform.name;var isDT=name.length>=O3D_DEBUG_PREFIX_LENGTH&&name.substr(0,O3D_DEBUG_PREFIX_LENGTH)==O3D_DEBUG_PREFIX;return isDT;};o3djs.debug.getDebugTransform_=function(transform,name){if(transform.name==name){return transform;}else{var children=transform.children;for(var cc=0;cc<children.length;++cc){if(children[cc].name==name){return children[cc];}}}
return null;};o3djs.debug.createColorShaders_=function(colorParamName){var p=o3djs.effect;var shaders='uniform '+p.MATRIX4+' worldViewProjection'+
p.semanticSuffix('WORLDVIEWPROJECTION')+';\n'+
p.BEGIN_IN_STRUCT+
p.ATTRIBUTE+p.FLOAT4+' position'+
p.semanticSuffix('POSITION')+';\n'+
p.END_STRUCT+
p.BEGIN_OUT_STRUCT+
p.VARYING+p.FLOAT4+' '+p.VARYING_DECLARATION_PREFIX+'position'+
p.semanticSuffix('POSITION')+';\n'+
p.END_STRUCT+
p.beginVertexShaderMain()+'  '+p.VERTEX_VARYING_PREFIX+'position = '+
p.mul(p.ATTRIBUTE_PREFIX+'position','worldViewProjection')
+';\n'+
p.endVertexShaderMain()+
p.pixelShaderHeader()+'uniform '+p.FLOAT4+' '+colorParamName+';\n'+
p.beginPixelShaderMain()+
p.endPixelShaderMain(colorParamName)+
p.entryPoints()+
p.matrixLoadOrder();return shaders;};o3djs.debug.createScaleShaders_=function(colorParamName,scaleParamName){var p=o3djs.effect;var shaders='uniform '+p.FLOAT3+' '+scaleParamName+';\n'+'uniform '+p.MATRIX4+' worldViewProjection'+
p.semanticSuffix('WORLDVIEWPROJECTION')+';\n'+
p.BEGIN_IN_STRUCT+
p.ATTRIBUTE+p.FLOAT4+' position'+p.semanticSuffix('POSITION')+';\n'+
p.END_STRUCT+
p.BEGIN_OUT_STRUCT+
p.VARYING+p.FLOAT4+' '+p.VARYING_DECLARATION_PREFIX+'position'+
p.semanticSuffix('POSITION')+';\n'+
p.END_STRUCT+
p.beginVertexShaderMain()+'  '+p.FLOAT4+' position = '+p.FLOAT4+'(\n'+'    '+p.ATTRIBUTE_PREFIX+'position.x * '+scaleParamName+'.x,\n'+'    '+p.ATTRIBUTE_PREFIX+'position.y * '+scaleParamName+'.y,\n'+'    '+p.ATTRIBUTE_PREFIX+'position.z * '+scaleParamName+'.z,\n'+'    1);\n'+'  '+p.VERTEX_VARYING_PREFIX+'position = '+
p.mul('position','worldViewProjection')+';\n'+
p.endVertexShaderMain()+
p.pixelShaderHeader()+'uniform '+p.FLOAT4+' '+colorParamName+';\n'+
p.beginPixelShaderMain()+
p.endPixelShaderMain(colorParamName)+
p.entryPoints()+
p.matrixLoadOrder();return shaders;};o3djs.debug.DebugLine=function(debugLineGroup){this.debugLineGroup_=debugLineGroup;var pack=debugLineGroup.getPack();this.transform_=pack.createObject('Transform');this.transform_.name=O3D_DEBUG_LINE_SHAPE_NAME;this.transform_.addShape(debugLineGroup.getLineShape());this.start_=[0,0,0];this.end_=[0,0,0];this.colorParam_=this.transform_.createParam(O3D_DEBUG_COLOR_PARAM_NAME,'ParamFloat4');this.colorParam_.value=debugLineGroup.getColor();};o3djs.debug.DebugLine.prototype.destroy=function(){this.transform_.parent=null;this.debugLineGroup_.getPack().removeObject(this.transform_);};o3djs.debug.DebugLine.prototype.getId=function(){return this.transform_.clientId;};o3djs.debug.DebugLine.prototype.update_=function(){var math=o3djs.math;var vector=math.subVector(this.end_,this.start_);var direction=math.normalize(vector);var dot=math.dot(direction,[0,1,0]);var perp1;var perp2;if(dot>0.99){perp2=math.cross([1,0,0],direction);perp1=math.cross(perp2,direction);}else{perp1=math.cross([0,1,0],direction);perp2=math.cross(perp1,direction);}
this.transform_.localMatrix=[perp2.concat(0),direction.concat(0),perp1.concat(0),this.start_.concat(1)];this.transform_.scale(1,math.length(vector),1);};o3djs.debug.DebugLine.prototype.setEndPoints=function(start,end){this.start_=start;this.end_=end;this.update_();};o3djs.debug.DebugLine.prototype.setStart=function(start){this.start_=start;this.update_();};o3djs.debug.DebugLine.prototype.setEnd=function(end){this.end_=end;this.update_();};o3djs.debug.DebugLine.prototype.setColor=function(color){this.colorParam_.value=color;};o3djs.debug.DebugLine.prototype.setVisible=function(visible){this.transform_.parent=visible?this.debugLineGroup_.getRoot():null;};o3djs.debug.DebugLine.prototype.remove=function(){this.transform_.parent=null;this.debugLineGroup_.remove(this);};o3djs.debug.DebugLineGroup=function(debugHelper,root){this.currentColor_=[1,1,1,1];this.lineTransforms_={};this.freeLineTransforms_={};this.debugHelper_=debugHelper;this.root_=root;};o3djs.debug.DebugLineGroup.prototype.getRoot=function(){return this.root_;};o3djs.debug.DebugLineGroup.prototype.getPack=function(){return this.debugHelper_.getPack();};o3djs.debug.DebugLineGroup.prototype.getLineShape=function(){return this.debugHelper_.getLineShape();};o3djs.debug.DebugLineGroup.prototype.getColor=function(){return this.currentColor_;};o3djs.debug.DebugLineGroup.prototype.setColor=function(color){this.currentColor_=color;};o3djs.debug.DebugLineGroup.prototype.getLine_=function(){for(var sid in this.freeLineTransforms_){var id=(sid);var line=this.freeLineTransforms_[id];delete this.freeLineTransforms_[id];return line;}
return new o3djs.debug.DebugLine(this);};o3djs.debug.DebugLineGroup.prototype.addLine=function(opt_start,opt_end,opt_color){var line=this.getLine_();line.setEndPoints(opt_start||[0,0,0],opt_end||[0,0,0]);line.setColor(opt_color||this.currentColor_);line.setVisible(true);this.lineTransforms_[line.getId()]=line;return line;};o3djs.debug.DebugLineGroup.prototype.clear=function(){for(var sid in this.lineTransforms_){var id=(sid);var line=this.lineTransforms_[id];line.setVisible(false);this.freeLineTransforms_[id]=line;}
this.lineTransforms_={};};o3djs.debug.DebugLineGroup.prototype.destroy=function(){this.clear();for(var sid in this.freeLineTransforms_){var id=(sid);this.freeLineTransforms_[id].destroy();}
this.freeLineTransforms_={};};o3djs.debug.DebugLineGroup.prototype.remove=function(line){var id=line.getId();delete this.lineTransforms_[id];this.freeLineTransforms_[id]=line;};o3djs.debug.DebugHelper=function(pack,viewInfo){this.pack_=pack;this.viewInfo_=viewInfo;this.axisPrimitives_=[];this.axisShape_=pack.createObject('Shape');this.axisShape_.name=O3D_DEBUG_AXIS_SHAPE_NAME;this.lineShape_=pack.createObject('Shape');this.lineShape_.name=O3D_DEBUG_LINE_SHAPE_NAME;{var effect=pack.createObject('Effect');var shaders=o3djs.debug.createScaleShaders_(O3D_DEBUG_COLOR_PARAM_NAME,O3D_DEBUG_VECTOR_SCALE_PARAM_NAME);effect.loadFromFXString(shaders);var material=pack.createObject('Material');material.effect=effect;material.drawList=viewInfo.performanceDrawList;effect.createUniformParameters(material);material.getParam(O3D_DEBUG_COLOR_PARAM_NAME).value=[1,1,1,1];material.getParam(O3D_DEBUG_VECTOR_SCALE_PARAM_NAME).value=[1,1,1];for(var ii=0;ii<O3D_DEBUG_AXIS_INFO_.length;++ii){var info=O3D_DEBUG_AXIS_INFO_[ii];var cubeShape=o3djs.primitives.createCube(pack,material,1,[[1,0,0,0],[0,1,0,0],[0,0,1,0],[info.offset[0]*0.5,info.offset[1]*0.5,info.offset[2]*0.5,1]]);var cube=cubeShape.elements[0];cube.owner=this.axisShape_;pack.removeObject(cubeShape);cube.createParam(O3D_DEBUG_COLOR_PARAM_NAME,'ParamFloat4').value=info.color;cube.createParam(O3D_DEBUG_VECTOR_SCALE_PARAM_NAME,'ParamFloat3');this.axisPrimitives_[ii]=cube;}
this.axisMaterial_=material;this.setAxisScale(10,1);}
{var effect=pack.createObject('Effect');var shaders=o3djs.debug.createColorShaders_(O3D_DEBUG_COLOR_PARAM_NAME);effect.loadFromFXString(shaders);var material=pack.createObject('Material');material.effect=effect;material.drawList=viewInfo.performanceDrawList;effect.createUniformParameters(material);material.getParam(O3D_DEBUG_COLOR_PARAM_NAME).value=[1,1,1,1];var vertices=[0,0,0,0,1,0];var streamBank=pack.createObject('StreamBank');var primitive=pack.createObject('Primitive');var shape=pack.createObject('Shape');var vertexBuffer=pack.createObject('VertexBuffer');var positionField=vertexBuffer.createField('FloatField',3);vertexBuffer.set(vertices);primitive.owner=shape;primitive.createDrawElement(pack,null);primitive.streamBank=streamBank;primitive.material=material;primitive.numberVertices=2;primitive.numberPrimitives=1;primitive.primitiveType=o3djs.base.o3d.Primitive.LINELIST;streamBank.setVertexStream(o3djs.base.o3d.Stream.POSITION,0,positionField,0);this.lineShape_=shape;this.lineShape_.name=O3D_DEBUG_LINE_SHAPE_NAME;this.lineMaterial_=material;}
{this.sphereShape_=o3djs.lineprimitives.createLineSphere(pack,this.axisMaterial_,0.5,8,8);this.sphereShape_.name=O3D_DEBUG_SPHERE_SHAPE_NAME;var primitive=this.sphereShape_.elements[0];this.sphereScaleParam_=primitive.createParam(O3D_DEBUG_VECTOR_SCALE_PARAM_NAME,'ParamFloat3').value=[1,1,1];}
{this.cubeShape_=o3djs.lineprimitives.createLineCube(pack,this.axisMaterial_,1);this.cubeShape_.name=O3D_DEBUG_CUBE_SHAPE_NAME;var primitive=this.cubeShape_.elements[0];this.cubeScaleParam_=primitive.createParam(O3D_DEBUG_VECTOR_SCALE_PARAM_NAME,'ParamFloat3').value=[1,1,1];}};o3djs.debug.DebugHelper.prototype.getPack=function(){return this.pack_;};o3djs.debug.DebugHelper.prototype.getLineShape=function(){return this.lineShape_;};o3djs.debug.DebugHelper.prototype.setAxisScale=function(length,width){for(var ii=0;ii<O3D_DEBUG_AXIS_INFO_.length;++ii){var info=O3D_DEBUG_AXIS_INFO_[ii];this.axisPrimitives_[ii].getParam(O3D_DEBUG_VECTOR_SCALE_PARAM_NAME).value=[info.offset[0]?length:width,info.offset[1]?length:width,info.offset[2]?length:width];}};o3djs.debug.DebugHelper.prototype.createShape_=function(position,shape){var debugTransform=this.getPack().createObject('Transform');debugTransform.name=shape.name;debugTransform.addShape(shape);debugTransform.parent=this.viewInfo_.treeRoot;debugTransform.translate(position);return debugTransform;};o3djs.debug.DebugHelper.prototype.addShape_=function(transform,shape){var debugTransform=o3djs.debug.getDebugTransform_(transform,shape.name);if(!debugTransform){var debugTransform=this.getPack().createObject('Transform');debugTransform.name=shape.name;debugTransform.addShape(shape);debugTransform.parent=transform;}};o3djs.debug.DebugHelper.prototype.removeShape_=function(transform,shape){var name=shape.name;var debugTransform=o3djs.debug.getDebugTransform_(transform,shape.name);if(debugTransform){debugTransform.parent=null;this.getPack().removeObject(debugTransform);}};o3djs.debug.DebugHelper.prototype.addShapes_=function(treeRoot,shape){this.addShape_(treeRoot,shape);var children=treeRoot.children;for(var cc=0;cc<children.length;++cc){var child=children[cc];if(!o3djs.debug.isDebugTransform(child)){this.addShapes_(child,shape);}}};o3djs.debug.DebugHelper.prototype.removeShapes_=function(treeRoot,shape){this.removeShape_(treeRoot,shape);var children=treeRoot.children;for(var cc=0;cc<children.length;++cc){var child=children[cc];if(!o3djs.debug.isDebugTransform(child)){this.removeShapes_(child,shape);}}};o3djs.debug.DebugHelper.prototype.addSetDebugTransformParam_=function(transform,name,paramName,paramType,paramValue){var debugTransform=o3djs.debug.getDebugTransform_(transform,name);if(debugTransform){var param=debugTransform.getParam(paramName);if(!param){param=debugTransform.createParam(paramName,paramType);}
param.value=paramValue;}};o3djs.debug.DebugHelper.prototype.addAxis=function(transform){this.addShape_(transform,this.axisShape_);};o3djs.debug.DebugHelper.prototype.removeAxis=function(transform){this.removeShape_(transform,this.axisShape_);};o3djs.debug.DebugHelper.prototype.addAxes=function(treeRoot){this.addShapes_(treeRoot,this.axisShape_);};o3djs.debug.DebugHelper.prototype.removeAxes=function(treeRoot){this.removeShapes_(treeRoot,this.axisShape_);};o3djs.debug.DebugHelper.prototype.setAxisColor=function(transform,color){this.addSetDebugTransformParam_(transform,O3D_DEBUG_AXIS_SHAPE_NAME,O3D_DEBUG_COLOR_PARAM_NAME,'ParamFloat4',color);};o3djs.debug.DebugHelper.prototype.clearAxisColor=function(transform){var debugTransform=o3djs.debug.getDebugTransform_(transform,O3D_DEBUG_AXIS_SHAPE_NAME);if(debugTransform){var colorParam=debugTransform.getParam(O3D_DEBUG_COLOR_PARAM_NAME);if(colorParam){debugTransform.removeParam(colorParam);}}};o3djs.debug.DebugHelper.prototype.createSphere=function(position,opt_color,opt_scale){var transform=this.createShape_(position,this.sphereShape_);if(opt_color){this.setSphereColor(transform,opt_color);}
if(opt_scale){this.setSphereScale(transform,opt_scale);}
return transform;};o3djs.debug.DebugHelper.prototype.addSphere=function(transform,opt_color,opt_scale){this.addShape_(transform,this.sphereShape_);if(opt_color){this.setSphereColor(transform,opt_color);}
if(opt_scale){this.setSphereScale(transform,opt_scale);}};o3djs.debug.DebugHelper.prototype.removeSphere=function(transform){this.removeShape_(transform,this.sphereShape_);};o3djs.debug.DebugHelper.prototype.addSpheres=function(treeRoot){this.addShapes_(treeRoot,this.sphereShape_);};o3djs.debug.DebugHelper.prototype.removeSpheres=function(treeRoot){this.removeShapes_(treeRoot,this.sphereShape_);};o3djs.debug.DebugHelper.prototype.setSphereColor=function(transform,color){this.addSetDebugTransformParam_(transform,O3D_DEBUG_SPHERE_SHAPE_NAME,O3D_DEBUG_COLOR_PARAM_NAME,'ParamFloat4',color);};o3djs.debug.DebugHelper.prototype.setSphereScale=function(transform,scale){this.addSetDebugTransformParam_(transform,O3D_DEBUG_SPHERE_SHAPE_NAME,O3D_DEBUG_VECTOR_SCALE_PARAM_NAME,'ParamFloat3',[scale,scale,scale]);};o3djs.debug.DebugHelper.prototype.createCube=function(position,opt_color,opt_scale){var transform=this.createShape_(position,this.cubeShape_);if(opt_color){this.setCubeColor(transform,opt_color);}
if(opt_scale){this.setCubeScale(transform,opt_scale);}
return transform;};o3djs.debug.DebugHelper.prototype.addCube=function(transform,opt_color,opt_scale){this.addShape_(transform,this.cubeShape_);if(opt_color){this.setCubeColor(transform,opt_color);}
if(opt_scale){this.setCubeScale(transform,opt_scale);}};o3djs.debug.DebugHelper.prototype.removeCube=function(transform){this.removeShape_(transform,this.cubeShape_);};o3djs.debug.DebugHelper.prototype.addCubes=function(treeRoot){this.addShapes_(treeRoot,this.cubeShape_);};o3djs.debug.DebugHelper.prototype.removeCubes=function(treeRoot){this.removeShapes_(treeRoot,this.cubeShape_);};o3djs.debug.DebugHelper.prototype.setCubeColor=function(transform,color){this.addSetDebugTransformParam_(transform,O3D_DEBUG_CUBE_SHAPE_NAME,O3D_DEBUG_COLOR_PARAM_NAME,'ParamFloat4',color);};o3djs.debug.DebugHelper.prototype.setCubeScale=function(transform,scale){this.addSetDebugTransformParam_(transform,O3D_DEBUG_CUBE_SHAPE_NAME,O3D_DEBUG_VECTOR_SCALE_PARAM_NAME,'ParamFloat3',[scale,scale,scale]);};o3djs.debug.DebugHelper.prototype.createDebugLineGroup=function(root){return new o3djs.debug.DebugLineGroup(this,root);};o3djs.debug.createDebugHelper=function(pack,viewInfo){return new o3djs.debug.DebugHelper(pack,viewInfo);};o3djs.dump=o3djs.dump||{};o3djs.dump.dumpXYZ_=function(label,object,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dump(opt_prefix+label+' : '+object[0]+', '+
object[1]+', '+object[2]+'\n');};o3djs.dump.dumpXYZW_=function(label,object,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dump(opt_prefix+label+' : '+
object[0]+', '+
object[1]+', '+
object[2]+', '+
object[3]+'\n');};o3djs.dump.getFunctionName_=function(theFunction){if(theFunction.name){return theFunction.name;}
var definition=theFunction.toString();var name=definition.substring(definition.indexOf('function')+8,definition.indexOf('('));if(name){return name;}
return'*anonymous*';};o3djs.dump.getSignature_=function(theFunction){var signature=o3djs.dump.getFunctionName_(theFunction);signature+='(';for(var x=0;x<theFunction.arguments.length;x++){var nextArgument=theFunction.arguments[x];if(nextArgument.length>30){nextArgument=nextArgument.substring(0,30)+'...';}
signature+="'"+nextArgument+"'";if(x<theFunction.arguments.length-1){signature+=', ';}}
signature+=')';return signature;};o3djs.dump.dump=function(string){o3djs.BROWSER_ONLY=true;if(window.dump){window.dump(string);}else if(window.console&&window.console.log){window.console.log(string);}};o3djs.dump.getMatrixAsString=function(matrix,opt_prefix){opt_prefix=opt_prefix||'';var result=opt_prefix+'[';for(var i=0;1;++i){var mi=matrix[i];result+='[';for(var j=0;1;++j){result+=mi[j];if(j<mi.length-1){result+=', ';}else{result+=']';break;}}
if(i<matrix.length-1){result+='\n';result+=opt_prefix;}else{break;}}
result+=']';return result;};o3djs.dump.dumpFloat3=function(label,float3,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dumpXYZ_(label,float3,opt_prefix);};o3djs.dump.dumpFloat4=function(label,float4,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dumpXYZW_(label,float4,opt_prefix);};o3djs.dump.dumpVector4=function(label,vector4,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dumpXYZW_(label,vector4,opt_prefix);};o3djs.dump.dumpMatrix=function(label,matrix,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dump(opt_prefix+label+' :\n'+
o3djs.dump.getMatrixAsString(matrix,opt_prefix+'    ')+'\n');};o3djs.dump.dumpBoundingBox=function(label,boundingBox,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dump(opt_prefix+label+' :\n');o3djs.dump.dumpFloat3('min : ',boundingBox.minExtent,opt_prefix+'    ');o3djs.dump.dumpFloat3('max : ',boundingBox.maxExtent,opt_prefix+'    ');};o3djs.dump.getParamValueAsString=function(param,opt_prefix){opt_prefix=opt_prefix||'';var value='*unknown*';if(param.isAClassName('o3d.ParamFloat')){value=param.value.toString();}else if(param.isAClassName('o3d.ParamFloat2')){value='['+param.value[0]+', '+
param.value[1]+']';}else if(param.isAClassName('o3d.ParamFloat3')){value='['+param.value[0]+', '+
param.value[1]+', '+
param.value[2]+']';}else if(param.isAClassName('o3d.ParamFloat4')){value='['+param.value[0]+', '+
param.value[1]+', '+
param.value[2]+', '+
param.value[3]+']';}else if(param.isAClassName('o3d.ParamInteger')){value=param.value.toString();}else if(param.isAClassName('o3d.ParamBoolean')){value=param.value.toString();}else if(param.isAClassName('o3d.ParamMatrix4')){value='\n'+o3djs.dump.getMatrixAsString(param.value,opt_prefix+'    ');}else if(param.isAClassName('o3d.ParamString')){value=param.value;}else if(param.isAClassName('o3d.ParamTexture')){value=param.value;value='texture : "'+(value?value.name:'NULL')+'"';}else if(param.isAClassName('o3d.ParamSampler')){value=param.value;value='sampler : "'+(value?value.name:'NULL')+'"';}else if(param.isAClassName('o3d.ParamMaterial')){value=param.value;value='material : "'+(value?value.name:'NULL')+'"';}else if(param.isAClassName('o3d.ParamEffect')){value=param.value;value='effect : "'+(value?value.name:'NULL')+'"';}else if(param.isAClassName('o3d.ParamState')){value=param.value;value='state : "'+(value?value.name:'NULL')+'"';}else if(param.isAClassName('o3d.ParamTransform')){value=param.value;value='transform : "'+(value?value.name:'NULL')+'"';}else if(param.isAClassName('o3d.ParamDrawList')){value=param.value;value='drawlist : "'+(value?value.name:'NULL')+'"';}else if(param.isAClassName('o3d.ParamRenderSurface')){value=param.value;value='renderSurface : "'+(value?value.name:'NULL')+'"';}else if(param.isAClassName('o3d.ParamRenderDepthStencilSurface')){value=param.value;value='renderDepthStencilSurface: "'+(value?value.name:'NULL')+'"';}else if(param.isAClassName('o3d.ParamDrawContext')){value=param.value;value='drawcontext : "'+(value?value.name:'NULL')+'"';}
return value;};o3djs.dump.dumpParam=function(param,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dump(opt_prefix+param.className+' : "'+param.name+'" : '+
o3djs.dump.getParamValueAsString(param,opt_prefix)+'\n');};o3djs.dump.dumpParams=function(param_object,opt_prefix){opt_prefix=opt_prefix||'';var params=param_object.params;for(var p=0;p<params.length;p++){o3djs.dump.dumpParam(params[p],opt_prefix);}};o3djs.dump.dumpParamObject=function(param_object,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dump(opt_prefix+param_object.className+' : "'+
param_object.name+'"\n');o3djs.dump.dumpParams(param_object,opt_prefix+'    ');};o3djs.dump.dumpStream=function(stream,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dump(opt_prefix+'semantic: '+stream.semantic+', index: '+stream.semanticIndex+', dataType: '+stream.dataType+', field: '+stream.field.name+'\n');};o3djs.dump.dumpElement=function(element,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dump(opt_prefix+'------------ Element --------------\n');o3djs.dump.dump(opt_prefix+'Element: "'+element.name+'"\n');o3djs.dump.dump(opt_prefix+'  --Params--\n');o3djs.dump.dumpParams(element,opt_prefix+'  ');o3djs.dump.dump(opt_prefix+'  --DrawElements--\n');var drawElements=element.drawElements;for(var g=0;g<drawElements.length;g++){var drawElement=drawElements[g]
o3djs.dump.dumpParamObject(drawElement,opt_prefix+'    ');}
if(element.isAClassName('o3d.Primitive')){o3djs.dump.dump(opt_prefix+'  primitive type: '+element.primitiveType+'\n');o3djs.dump.dump(opt_prefix+'  number vertices: '+element.numberVertices+'\n');o3djs.dump.dump(opt_prefix+'  number primitives: '+element.numberPrimitives+'\n');var streamBank=element.streamBank;if(streamBank){var streams=streamBank.vertexStreams;for(var ss=0;ss<streams.length;ss++){var stream=streams[ss];o3djs.dump.dump(opt_prefix+'  stream '+ss+': ');o3djs.dump.dumpStream(stream);}}}};o3djs.dump.dumpShape=function(shape,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dump(opt_prefix+'------------ Shape --------------\n');o3djs.dump.dump(opt_prefix+'Shape: "'+shape.name+'"\n');o3djs.dump.dump(opt_prefix+'  --Params--\n');o3djs.dump.dumpParams(shape,opt_prefix+'  ');o3djs.dump.dump(opt_prefix+'  --Elements--\n');var elements=shape.elements;for(var p=0;p<elements.length;p++){var element=elements[p];o3djs.dump.dumpElement(element,opt_prefix+'    ');}};o3djs.dump.dumpTexture=function(texture,opt_prefix){opt_prefix=opt_prefix||'';var uri='';var param=texture.getParam('uri');if(param){uri=param.value;}
o3djs.dump.dump(opt_prefix+texture.className+' : "'+texture.name+'" uri : "'+uri+'" width: '+texture.width+' height: '+texture.height+' alphaIsOne: '+texture.alphaIsOne+'\n');};o3djs.dump.dumpTransform=function(transform,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dump(opt_prefix+'----------- Transform -------------\n');o3djs.dump.dump(opt_prefix+'Transform: '+transform.name+'"\n');o3djs.dump.dump(opt_prefix+'  --Local Matrix--\n');o3djs.dump.dump(o3djs.dump.getMatrixAsString(transform.localMatrix,opt_prefix+'    ')+'\n');o3djs.dump.dump(opt_prefix+'  --Params--\n');o3djs.dump.dumpParams(transform,opt_prefix+'  ');o3djs.dump.dump(opt_prefix+'  --Shapes--\n');var shapes=transform.shapes;for(var s=0;s<shapes.length;s++){var shape=shapes[s];o3djs.dump.dumpNamedObjectName(shape,opt_prefix+'  ');}};o3djs.dump.dumpTransformTree=function(transform,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dumpTransform(transform,opt_prefix);var child_prefix=opt_prefix+'    ';var children=transform.children;for(var c=0;c<children.length;c++){o3djs.dump.dumpTransformTree(children[c],child_prefix);}};o3djs.dump.dumpTransformList=function(transform_list){o3djs.dump.dump(transform_list.length+' transforms in list!!!\n');for(var i=0;i<transform_list.length;i++){o3djs.dump.dumpTransform(transform_list[i]);}};o3djs.dump.dumpNamedObjectName=function(namedObject,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dump(opt_prefix+namedObject.className+' : "'+namedObject.name+'"\n');};o3djs.dump.dumpRenderNode=function(render_node,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dump(opt_prefix+'----------- Render Node -----------\n');o3djs.dump.dumpNamedObjectName(render_node,opt_prefix);o3djs.dump.dump(opt_prefix+'  --Params--\n');o3djs.dump.dumpParams(render_node,opt_prefix+'  ');};o3djs.dump.dumpRenderNodeTree=function(render_node,opt_prefix){opt_prefix=opt_prefix||'';o3djs.dump.dumpRenderNode(render_node,opt_prefix);var child_prefix=opt_prefix+'    ';var children=render_node.children.sort(function(a,b){return a.priority-b.priority;});for(var c=0;c<children.length;c++){o3djs.dump.dumpRenderNodeTree(children[c],child_prefix);}};o3djs.dump.dumpStackTrace=function(){o3djs.dump.dump('Stack trace:\n');var nextCaller=arguments.callee.caller;while(nextCaller){o3djs.dump.dump(o3djs.dump.getSignature_(nextCaller)+'\n');nextCaller=nextCaller.caller;}
o3djs.dump.dump('\n\n');};o3djs.element=o3djs.element||{};o3djs.element.setBoundingBoxAndZSortPoint=function(element){var boundingBox=element.getBoundingBox(0);var minExtent=boundingBox.minExtent;var maxExtent=boundingBox.maxExtent;element.boundingBox=boundingBox;element.cull=true;element.zSortPoint=o3djs.math.divVectorScalar(o3djs.math.addVector(minExtent,maxExtent),2);};o3djs.element.addMissingTexCoordStreams=function(element){if(element.isAClassName('o3d.Primitive')){var material=(element.material);var streamBank=element.streamBank;var lightingType=o3djs.effect.getColladaLightingType(material);if(lightingType){var numTexCoordStreamsNeeded=o3djs.effect.getNumTexCoordStreamsNeeded(material);var streams=streamBank.vertexStreams;var lastTexCoordStream=null;var numTexCoordStreams=0;for(var ii=0;ii<streams.length;++ii){var stream=streams[ii];if(stream.semantic==o3djs.base.o3d.Stream.TEXCOORD){lastTexCoordStream=stream;++numTexCoordStreams;}}
for(var ii=numTexCoordStreams;ii<numTexCoordStreamsNeeded;++ii){streamBank.setVertexStream(lastTexCoordStream.semantic,lastTexCoordStream.semanticIndex+ii-numTexCoordStreams+1,lastTexCoordStream.field,lastTexCoordStream.startIndex);}}}};o3djs.element.duplicateElement=function(pack,sourceElement){var newElement=pack.createObject(sourceElement.className);newElement.copyParams(sourceElement);if(sourceElement.isAClassName('o3d.Primitive')){newElement.indexBuffer=sourceElement.indexBuffer;newElement.startIndex=sourceElement.startIndex;newElement.primitiveType=sourceElement.primitiveType;newElement.numberVertices=sourceElement.numberVertices;newElement.numberPrimitives=sourceElement.numberPrimitives;}
return newElement;};o3djs.element.getNormalForTriangle=function(primitive,index,opt_winding){var primitiveType=primitive.primitiveType;if(primitiveType!=o3djs.base.o3d.Primitive.TRIANGLELIST&&primitiveType!=o3djs.base.o3d.Primitive.TRIANGLESTRIP){throw'primitive is not a TRIANGLELIST or TRIANGLESTRIP';}
var indexBuffer=primitive.indexBuffer;var vertexIndex=(primitiveType==o3djs.base.o3d.Primitive.TRIANGLELIST)?(index*3):(index+2);var vertexIndices;if(indexBuffer){var indexField=indexBuffer.fields[0];vertexIndices=indexField.getAt(vertexIndex,3);}else{vertexIndices=[vertexIndex,vertexIndex+1,vertexIndex+2]}
var normalStream=primitive.streamBank.getVertexStream(o3djs.base.o3d.Stream.NORMAL,0);if(normalStream){var normalField=normalStream.field;var summedNormal=[0,0,0];for(var ii=0;ii<3;++ii){var normal=normalField.getAt(vertexIndices[ii],1);summedNormal=o3djs.math.addVector(summedNormal,normal);}
return o3djs.math.normalize(summedNormal);}else{var positionStream=primitive.streamBank.getVertexStream(o3djs.base.o3d.Stream.POSITION,0);if(!positionStream){throw'no POSITION,0 stream in primitive';}
var positionField=positionStream.field;var positions=[];for(var ii=0;ii<3;++ii){positions[ii]=positionField.getAt(vertexIndices[ii],1);}
var v0=o3djs.math.normalize(o3djs.math.subVector(positions[1],positions[0]));var v1=o3djs.math.normalize(o3djs.math.subVector(positions[2],positions[1]));return opt_winding?o3djs.math.cross(v1,v0):o3djs.math.cross(v0,v1);}};o3djs.rendergraph=o3djs.rendergraph||{};o3djs.rendergraph.createView=function(pack,treeRoot,opt_parent,opt_clearColor,opt_priority,opt_viewport,opt_performanceDrawList,opt_zOrderedDrawList,opt_drawContext){return new o3djs.rendergraph.ViewInfo(pack,treeRoot,opt_parent,opt_clearColor,opt_priority,opt_viewport,opt_performanceDrawList,opt_zOrderedDrawList,opt_drawContext);};o3djs.rendergraph.createBasicView=function(pack,treeRoot,opt_parent,opt_clearColor,opt_priority,opt_viewport){return o3djs.rendergraph.createView(pack,treeRoot,opt_parent,opt_clearColor,opt_priority,opt_viewport);};o3djs.rendergraph.createExtraView=function(viewInfo,opt_viewport,opt_clearColor,opt_priority){return o3djs.rendergraph.createView(viewInfo.pack,viewInfo.treeRoot,viewInfo.renderGraphRoot,opt_clearColor,opt_priority,opt_viewport,viewInfo.performanceDrawList,viewInfo.zOrderedDrawList);};o3djs.rendergraph.ViewInfo=function(pack,treeRoot,opt_parent,opt_clearColor,opt_priority,opt_viewport,opt_performanceDrawList,opt_zOrderedDrawList,opt_drawContext){var that=this;var clearColor=opt_clearColor||[0.5,0.5,0.5,1.0];var viewPriority=opt_priority||0;var priority=0;var viewport=pack.createObject('Viewport');if(opt_viewport){viewport.viewport=opt_viewport;}
viewport.priority=viewPriority;var clearBuffer=pack.createObject('ClearBuffer');clearBuffer.clearColor=clearColor;clearBuffer.priority=priority++;clearBuffer.parent=viewport;var treeTraversal=pack.createObject('TreeTraversal');treeTraversal.priority=priority++;treeTraversal.parent=viewport;treeTraversal.transform=treeRoot;this.drawPassInfos_=[];this.pack=pack;this.renderGraphRoot=opt_parent;this.treeRoot=treeRoot;this.root=viewport;this.viewport=viewport;this.clearBuffer=clearBuffer;var drawContext=opt_drawContext||pack.createObject('DrawContext');this.drawContext=drawContext;this.treeTraversal=treeTraversal;this.priority=priority;function createDrawPass(sortMethod,opt_drawList){return that.createDrawPass(sortMethod,undefined,undefined,undefined,opt_drawList);}
var performanceDrawPassInfo=createDrawPass(o3djs.base.o3d.DrawList.BY_PERFORMANCE,opt_performanceDrawList);var performanceState=performanceDrawPassInfo.state;var zOrderedDrawPassInfo=createDrawPass(o3djs.base.o3d.DrawList.BY_Z_ORDER,opt_zOrderedDrawList);var zOrderedState=zOrderedDrawPassInfo.state;zOrderedState.getStateParam('AlphaBlendEnable').value=true;zOrderedState.getStateParam('SourceBlendFunction').value=o3djs.base.o3d.State.BLENDFUNC_SOURCE_ALPHA;zOrderedState.getStateParam('DestinationBlendFunction').value=o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA;zOrderedState.getStateParam('AlphaTestEnable').value=true;zOrderedState.getStateParam('AlphaComparisonFunction').value=o3djs.base.o3d.State.CMP_GREATER;if(opt_parent){this.root.parent=opt_parent;}
this.performanceDrawPassInfo=performanceDrawPassInfo;this.zOrderedDrawPassInfo=zOrderedDrawPassInfo;this.performanceStateSet=performanceDrawPassInfo.stateSet;this.performanceState=performanceState;this.performanceDrawList=performanceDrawPassInfo.drawList;this.zOrderedStateSet=zOrderedDrawPassInfo.stateSet;this.zOrderedState=zOrderedState;this.zOrderedDrawList=zOrderedDrawPassInfo.drawList;this.performanceDrawPass=performanceDrawPassInfo.drawPass;this.zOrderedDrawPass=zOrderedDrawPassInfo.drawPass;this.ownDrawContext_=opt_drawContext?false:true;};o3djs.rendergraph.ViewInfo.prototype.destroy=function(opt_destroyDrawContext,opt_destroyDrawList){if(opt_destroyDrawContext===undefined){opt_destroyDrawContext=true;}
for(var ii=0;ii<this.drawPassInfos_.length;++ii){this.drawPassInfos_[ii].destroy();}
this.pack.removeObject(this.viewport);this.pack.removeObject(this.clearBuffer);if(opt_destroyDrawContext&&this.ownDrawContext_){this.pack.removeObject(this.drawContext);}
this.pack.removeObject(this.treeTraversal);this.viewport.parent=null;};o3djs.rendergraph.ViewInfo.prototype.createDrawPass=function(sortMethod,opt_drawContext,opt_priority,opt_parent,opt_drawList){opt_drawContext=opt_drawContext||this.drawContext;opt_parent=opt_parent||this.viewport;opt_priority=(typeof opt_priority!=='undefined')?opt_priority:this.priority++;var drawPassInfo=o3djs.rendergraph.createDrawPassInfo(this.pack,opt_drawContext,sortMethod,opt_parent,opt_drawList);drawPassInfo.root.priority=opt_priority;this.treeTraversal.registerDrawList(drawPassInfo.drawList,opt_drawContext,true);this.drawPassInfos_.push(drawPassInfo);return drawPassInfo;};o3djs.rendergraph.createDrawPassInfo=function(pack,drawContext,sortMethod,opt_parent,opt_drawList){return new o3djs.rendergraph.DrawPassInfo(pack,drawContext,sortMethod,opt_parent,opt_drawList);};o3djs.rendergraph.DrawPassInfo=function(pack,drawContext,sortMethod,opt_parent,opt_drawList){var ownDrawList=opt_drawList?false:true;opt_parent=opt_parent||null;opt_drawList=opt_drawList||pack.createObject('DrawList');var stateSet=pack.createObject('StateSet');var state=pack.createObject('State');stateSet.state=state;stateSet.parent=opt_parent;var drawPass=pack.createObject('DrawPass');drawPass.drawList=opt_drawList;drawPass.sortMethod=sortMethod;drawPass.parent=stateSet;this.pack=pack;this.state=state;this.stateSet=stateSet;this.drawPass=drawPass;this.drawList=opt_drawList;this.root=stateSet;this.ownDrawList_=ownDrawList;};o3djs.rendergraph.DrawPassInfo.prototype.destroy=function(){if(this.ownDrawList_){this.drawPass.drawList=null;this.pack.removeObject(this.drawList);}
this.drawPass.parent=null;this.stateSet.parent=null;this.pack.removeObject(this.drawPass);this.pack.removeObject(this.stateSet);this.pack.removeObject(this.state);};o3djs.fps=o3djs.fps||{};o3djs.fps.NUM_FRAMES_TO_AVERAGE=16;o3djs.fps.PERF_BAR_COLORS=[[0,0,1,1],[0,1,0,1],[1,1,0,1],[1,0.5,0,1],[1,0,0,1]];o3djs.fps.buildShaderString=function(){var p=o3djs.effect;var varyingDecls=p.BEGIN_OUT_STRUCT+
p.VARYING+p.FLOAT4+' '+
p.VARYING_DECLARATION_PREFIX+'position'+
p.semanticSuffix('POSITION')+';\n'+
p.END_STRUCT;return''+'uniform '+p.MATRIX4+' worldViewProjection'+
p.semanticSuffix('WORLDVIEWPROJECTION')+';\n'+'\n'+
p.BEGIN_IN_STRUCT+
p.ATTRIBUTE+p.FLOAT4+' position'+
p.semanticSuffix('POSITION')+';\n'+
p.END_STRUCT+'\n'+
varyingDecls+'\n'+
p.beginVertexShaderMain()+'  '+p.VERTEX_VARYING_PREFIX+'position = '+
p.mul(p.ATTRIBUTE_PREFIX+'position','worldViewProjection')+';\n'+
p.endVertexShaderMain()+'\n'+
p.pixelShaderHeader()+'uniform '+p.FLOAT4+' color;\n'+
p.repeatVaryingDecls(varyingDecls)+
p.beginPixelShaderMain()+
p.endPixelShaderMain('color')+
p.entryPoints()+
p.matrixLoadOrder();};o3djs.fps.createFPSManager=function(pack,clientWidth,clientHeight,opt_parent){return new o3djs.fps.FPSManager(pack,clientWidth,clientHeight,opt_parent);};o3djs.fps.FPSManager=function(pack,clientWidth,clientHeight,opt_parent){this.totalTime_=0.0;this.totalActiveTime_=0.0;this.timeTable_=[];this.activeTimeTable_=[];this.timeTableCursor_=0;for(var tt=0;tt<o3djs.fps.NUM_FRAMES_TO_AVERAGE;++tt){this.timeTable_[tt]=0.0;this.activeTimeTable_[tt]=0.0;}
this.root_=pack.createObject('Transform');this.viewInfo=o3djs.rendergraph.createBasicView(pack,this.root_,opt_parent);this.viewInfo.root.priority=100000;this.viewInfo.clearBuffer.clearColorFlag=false;this.viewInfo.zOrderedState.getStateParam('CullMode').value=o3djs.base.o3d.State.CULL_NONE;this.viewInfo.drawContext.view=o3djs.math.matrix4.lookAt([0,0,1],[0,0,0],[0,1,0]);this.canvasLib_=o3djs.canvas.create(pack,this.root_,this.viewInfo);this.paint_=pack.createObject('CanvasPaint');this.fpsQuad=this.canvasLib_.createXYQuad(0,0,-1,64,32,true);this.colorEffect_=pack.createObject('Effect');this.colorEffect_.loadFromFXString(o3djs.fps.buildShaderString());this.colorMaterial_=pack.createObject('Material');this.colorMaterial_.effect=this.colorEffect_;this.colorMaterial_.drawList=this.viewInfo.zOrderedDrawList;this.colorEffect_.createUniformParameters(this.colorMaterial_);this.colorMaterial_.getParam('color').value=[1,1,1,1];this.colorQuadShape_=o3djs.primitives.createPlane(pack,this.colorMaterial_,1,1,1,1,[[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0.5,0.5,0,1]]);var barXOffset=10;var barYOffset=2;var barWidth=clientWidth-barXOffset*2;var barHeight=7;this.numPerfBars_=o3djs.fps.PERF_BAR_COLORS.length-1;this.perfBarRoot_=pack.createObject('Transform');this.perfBarRoot_.parent=this.root_;this.perfBarBack_=new o3djs.fps.ColorRect(pack,this.colorQuadShape_,this.perfBarRoot_,barXOffset,barYOffset,-3,barWidth,barHeight,[0,0,0,1]);this.perfMarker_=[];for(var ii=0;ii<this.numPerfBars_;++ii){this.perfMarker_[ii]=new o3djs.fps.ColorRect(pack,this.colorQuadShape_,this.perfBarRoot_,barXOffset+barWidth/(this.numPerfBars_+1)*(ii+1),barYOffset-1,-1,1,barHeight+2,[1,1,1,1]);}
this.perfBar_=new o3djs.fps.ColorRect(pack,this.colorQuadShape_,this.perfBarRoot_,barXOffset+1,barYOffset+1,-2,1,barHeight-2,[1,1,0,1]);this.perfBarWidth_=barWidth-2;this.perfBarHeight_=barHeight-2;this.perfBarXOffset_=barXOffset;this.perfBarYOffset_=barYOffset;this.resize(clientWidth,clientHeight);this.setPosition(10,10);};o3djs.fps.FPSManager.prototype.setPosition=function(x,y){this.fpsQuad.transform.identity();this.fpsQuad.transform.translate(x,y,-1);};o3djs.fps.FPSManager.prototype.setVisible=function(visible){this.viewInfo.root.active=visible;};o3djs.fps.FPSManager.prototype.setPerfVisible=function(visible){this.perfBarRoot_.visible=visible;};o3djs.fps.FPSManager.prototype.resize=function(clientWidth,clientHeight){this.viewInfo.drawContext.projection=o3djs.math.matrix4.orthographic(0+0.5,clientWidth+0.5,clientHeight+0.5,0+0.5,0.001,1000);var barWidth=clientWidth-this.perfBarXOffset_*2;this.perfBarBack_.setSize(barWidth,this.perfBarHeight_);for(var ii=0;ii<this.numPerfBars_;++ii){this.perfMarker_[ii].setPosition(this.perfBarXOffset_+barWidth/(this.numPerfBars_+1)*(ii+1),this.perfBarYOffset_-1);}
this.perfBarWidth_=barWidth-2;};o3djs.fps.FPSManager.prototype.update=function(renderEvent){var elapsedTime=renderEvent.elapsedTime;var activeTime=renderEvent.activeTime;this.totalTime_+=elapsedTime-this.timeTable_[this.timeTableCursor_];this.totalActiveTime_+=activeTime-this.activeTimeTable_[this.timeTableCursor_];this.timeTable_[this.timeTableCursor_]=elapsedTime;this.activeTimeTable_[this.timeTableCursor_]=activeTime;++this.timeTableCursor_;if(this.timeTableCursor_==o3djs.fps.NUM_FRAMES_TO_AVERAGE){this.timeTableCursor_=0;}
var fps=''+
Math.floor((1.0/(this.totalTime_/o3djs.fps.NUM_FRAMES_TO_AVERAGE))+0.5)+' : '+Math.floor(1.0/elapsedTime+0.5);var canvas=this.fpsQuad.canvas;canvas.clear([0,0,0,0]);var paint=this.paint_;canvas.saveMatrix();paint.setOutline(3,[0,0,0,1]);paint.textAlign=o3djs.base.o3d.CanvasPaint.LEFT;paint.textSize=12;paint.textTypeface='Arial';paint.color=[1,1,0,1];canvas.drawText(fps,2,16,paint);canvas.restoreMatrix();this.fpsQuad.updateTexture();var frames=this.totalActiveTime_/o3djs.fps.NUM_FRAMES_TO_AVERAGE/(1/60.0);var colorIndex=Math.min(frames,o3djs.fps.PERF_BAR_COLORS.length-1);colorIndex=Math.floor(Math.max(colorIndex,0));if(!isNaN(colorIndex)){this.perfBar_.setColor(o3djs.fps.PERF_BAR_COLORS[colorIndex]);this.perfBar_.setSize(frames*this.perfBarWidth_/this.numPerfBars_,this.perfBarHeight_);}};o3djs.fps.ColorRect=function(pack,shape,parent,x,y,z,width,height,color){this.transform_=pack.createObject('Transform');this.colorParam_=this.transform_.createParam('color','ParamFloat4');this.transform_.addShape(shape);this.transform_.parent=parent;this.width_=0;this.height_=0;this.x_=0;this.y_=0;this.z_=z;this.setPosition(x,y);this.setSize(width,height);this.setColor(color);};o3djs.fps.ColorRect.prototype.updateTransform_=function(){this.transform_.identity();this.transform_.translate(this.x_,this.y_,this.z_);this.transform_.scale(this.width_,this.height_,1);};o3djs.fps.ColorRect.prototype.setPosition=function(x,y){this.x_=x;this.y_=y;this.updateTransform_();};o3djs.fps.ColorRect.prototype.setSize=function(width,height){this.width_=width;this.height_=height;this.updateTransform_();};o3djs.fps.ColorRect.prototype.setColor=function(color){this.colorParam_.value=color;};
o3djs.gpu2d=o3djs.gpu2d||{};o3djs.gpu2d.createPath=function(pack,drawList){return new o3djs.gpu2d.Path(pack,drawList);};o3djs.gpu2d.Path=function(pack,drawList){this.pack_=pack;this.drawList_=drawList;this.path_=pack.createObject('ProcessedPath');var exteriorState=pack.createObject('State');exteriorState.getStateParam('o3d.AlphaBlendEnable').value=true;exteriorState.getStateParam('o3d.SourceBlendFunction').value=o3djs.base.o3d.State.BLENDFUNC_SOURCE_ALPHA;exteriorState.getStateParam('o3d.DestinationBlendFunction').value=o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA;exteriorState.getStateParam('o3d.CullMode').value=o3djs.base.o3d.State.CULL_NONE;var interiorState=pack.createObject('State');interiorState.getStateParam('o3d.CullMode').value=o3djs.base.o3d.State.CULL_NONE;this.exteriorMaterial_=pack.createObject('Material');this.exteriorMaterial_.name='ExteriorMaterial';this.exteriorMaterial_.state=exteriorState;this.exteriorMaterial_.drawList=drawList;this.interiorMaterial_=pack.createObject('Material');this.interiorMaterial_.name='InteriorMaterial';this.interiorMaterial_.state=interiorState;this.interiorMaterial_.drawList=drawList;this.shape=pack.createObject('Shape');var primitive=pack.createObject('Primitive');var streamBank=pack.createObject('StreamBank');var vertexBuffer=pack.createObject('VertexBuffer');var vertices=vertexBuffer.createField('FloatField',2);this.exteriorVertices_=vertices;var texcoords=vertexBuffer.createField('FloatField',3);this.exteriorTexCoords_=texcoords;streamBank.setVertexStream(o3djs.base.o3d.Stream.POSITION,0,vertices,0);streamBank.setVertexStream(o3djs.base.o3d.Stream.TEXCOORD,0,texcoords,0);primitive.streamBank=streamBank;primitive.primitiveType=o3djs.base.o3d.Primitive.TRIANGLELIST;primitive.material=this.exteriorMaterial_;primitive.owner=this.shape;this.exteriorTriangles_=primitive;primitive=pack.createObject('Primitive');streamBank=pack.createObject('StreamBank');vertexBuffer=pack.createObject('VertexBuffer');vertices=vertexBuffer.createField('FloatField',2);this.interiorVertices_=vertices;streamBank.setVertexStream(o3djs.base.o3d.Stream.POSITION,0,vertices,0);primitive.streamBank=streamBank;primitive.primitiveType=o3djs.base.o3d.Primitive.TRIANGLELIST;primitive.material=this.interiorMaterial_;primitive.owner=this.shape;this.interiorTriangles_=primitive;this.setFill(o3djs.gpu2d.createColor(pack,0.0,0.0,0.0,1.0));this.shape.createDrawElements(pack,null);};o3djs.gpu2d.Path.prototype.clear=function(){this.path_.clear();};o3djs.gpu2d.Path.prototype.moveTo=function(x,y){this.path_.moveTo(x,y);};o3djs.gpu2d.Path.prototype.lineTo=function(x,y){this.path_.lineTo(x,y);};o3djs.gpu2d.Path.prototype.quadraticTo=function(cx,cy,x,y){this.path_.quadraticTo(cx,cy,x,y);};o3djs.gpu2d.Path.prototype.cubicTo=function(c0x,c0y,c1x,c1y,x,y){this.path_.cubicTo(c0x,c0y,c1x,c1y,x,y);};o3djs.gpu2d.Path.prototype.close=function(){this.path_.close();};o3djs.gpu2d.Path.prototype.update=function(){this.path_.createMesh(this.exteriorVertices_,this.exteriorTexCoords_,this.interiorVertices_);var numVertices=this.exteriorVertices_.buffer.numElements;if(numVertices==1){this.exteriorTriangles_.numberVertices=0;this.exteriorTriangles_.numberPrimitives=0;}else{this.exteriorTriangles_.numberVertices=numVertices;this.exteriorTriangles_.numberPrimitives=numVertices/3;}
numVertices=this.interiorVertices_.buffer.numElements;if(numVertices==1){this.interiorTriangles_.numberVertices=0;this.interiorTriangles_.numberPrimitives=0;}else{this.interiorTriangles_.numberVertices=numVertices;this.interiorTriangles_.numberPrimitives=numVertices/3;}};o3djs.gpu2d.Path.prototype.setPolygonOffset=function(slopeFactor,depthBias){this.exteriorMaterial_.state.getStateParam('o3d.PolygonOffset1').value=slopeFactor;this.exteriorMaterial_.state.getStateParam('o3d.PolygonOffset2').value=depthBias;this.interiorMaterial_.state.getStateParam('o3d.PolygonOffset1').value=slopeFactor;this.interiorMaterial_.state.getStateParam('o3d.PolygonOffset2').value=depthBias;}
o3djs.gpu2d.Path.prototype.setFill=function(fill){if(this.fill_){this.fill_.detach_(this);}
this.interiorMaterial_.effect=fill.interiorEffect;this.exteriorMaterial_.effect=fill.exteriorEffect;this.fill_=fill;fill.attach_(this);};o3djs.gpu2d.Fill=function(pack){this.pack_=pack;this.attachedPaths_=[];};o3djs.gpu2d.Fill.prototype.attach_=function(path){if(this.attachedPaths_.indexOf(path)<0)
this.attachedPaths_.push(path);this.apply_(path);};o3djs.gpu2d.Fill.prototype.detach_=function(path){var idx=this.attachedPaths_.indexOf(path);if(idx>=0)
this.attachedPaths_.splice(idx,idx);};o3djs.gpu2d.Fill.prototype.applyToPaths_=function(){for(var i=0;i<this.attachedPaths_.length;i++){this.apply_(this.attachedPaths_[i]);}};o3djs.gpu2d.Fill.prototype.apply_=function(path){};o3djs.gpu2d.Color=function(pack){o3djs.gpu2d.Fill.call(this,pack);this.interiorEffect=o3djs.gpu2d.loadEffect_(pack,o3djs.gpu2d.FillTypes_.COLOR,true);this.exteriorEffect=o3djs.gpu2d.loadEffect_(pack,o3djs.gpu2d.FillTypes_.COLOR,false);this.r_=0.0;this.g_=0.0;this.b_=0.0;this.a_=1.0;};o3djs.base.inherit(o3djs.gpu2d.Color,o3djs.gpu2d.Fill);o3djs.gpu2d.Color.prototype.set=function(r,g,b,a){this.r_=r;this.g_=g;this.b_=b;this.a_=a;this.applyToPaths_();};o3djs.gpu2d.Color.prototype.get=function(){return[this.r_,this.g_,this.b_,this.a_];};o3djs.gpu2d.Color.prototype.apply_=function(path){this.applyToMaterial_(path.interiorMaterial_);this.applyToMaterial_(path.exteriorMaterial_);};o3djs.gpu2d.Color.prototype.applyToMaterial_=function(material){var paramName='color';var paramType='ParamFloat4';var param=material.getParam(paramName);if(!param){param=material.createParam(paramName,paramType);}
param.set(this.r_,this.g_,this.b_,this.a_);};o3djs.gpu2d.createColor=function(pack,red,green,blue,alpha){var result=new o3djs.gpu2d.Color(pack);result.set(red,green,blue,alpha);return result;};o3djs.gpu2d.generateLoopBlinnShaderSource_=function(antialias,fillUniforms,fillSource){if(o3djs.base.glsl){var result=''+'// Vertex shader\n'+'uniform mat4 worldViewProjection;\n'+'\n'+'attribute vec2 position;\n'+'attribute vec3 texCoord0;\n'+'\n'+'varying vec3 klm;\n'+'\n'+'void main() {\n'+'  // TODO(kbr): figure out why this multiplication needs to be\n'+'  // transposed compared to the Cg version.\n'+'  gl_Position = worldViewProjection * vec4(position, 0.0, 1.0);\n'+'  klm = texCoord0;\n'+'}\n'+'// #o3d SplitMarker\n'+'// Fragment shader\n'+'varying vec3 klm;\n'+
fillUniforms+'void main() {\n';var alphaComputation;if(antialias){alphaComputation=''+'  // Gradients\n'+'  vec3 px = dFdx(klm);\n'+'  vec3 py = dFdy(klm);\n'+'\n'+'  // Chain rule\n'+'  float k2 = klm.x * klm.x;\n'+'  float c = k2 * klm.x - klm.y * klm.z;\n'+'  float k23 = 3.0 * k2;\n'+'  float cx = k23 * px.x - klm.z * px.y - klm.y * px.z;\n'+'  float cy = k23 * py.x - klm.z * py.y - klm.y * py.z;\n'+'\n'+'  // Signed distance\n'+'  float sd = c / sqrt(cx * cx + cy * cy);\n'+'\n'+'  // Linear alpha\n'+'  // TODO(kbr): figure out why this needs to be\n'+'  // negated compared to Cg version, and also why\n'+'  // we need an adjustment by +1.0 for it to look good.\n'+'  // float alpha = clamp(0.5 - sd, 0.0, 1.0);\n'+'  float alpha = clamp(sd + 0.5, 0.0, 1.0);\n';}else{alphaComputation=''+'  float t = klm.x * klm.x * klm.x - klm.y * klm.z;\n'+'  float alpha = clamp(sign(t), 0.0, 1.0);\n';}
return result+alphaComputation+'\n'+
fillSource+'}\n'+'\n'+'// #o3d MatrixLoadOrder RowMajor\n';}else{antialias=false;var result=''+'uniform float4x4 worldViewProjection : WORLDVIEWPROJECTION;\n'+
fillUniforms+'\n'+'struct VertexShaderInput {\n'+'  float2 position : POSITION;\n'+'  float3 klm : TEXCOORD0;\n'+'};\n'+'\n'+'struct PixelShaderInput {\n'+'  float4 position : POSITION;\n'+'  float3 klm : TEXCOORD0;\n'+'};\n'+'\n'+'PixelShaderInput vertexShaderFunction(VertexShaderInput input) {\n'+'  PixelShaderInput output;\n'+'\n'+'  output.position = mul(float4(input.position, 0, 1),\n'+'                        worldViewProjection);\n'+'  output.klm = input.klm;\n'+'  return output;\n'+'}\n'+'\n'+'float4 pixelShaderFunction(PixelShaderInput input) : COLOR {\n'+'  float3 klm = input.klm;\n';var alphaComputation;if(antialias){alphaComputation=''+'  // Gradients\n'+'  float3 px = ddx(input.klm);\n'+'  float3 py = ddy(input.klm);\n'+'\n'+'  // Chain rule\n'+'  float k2 = klm.x * klm.x;\n'+'  float c = k2 * klm.x - klm.y * klm.z;\n'+'  float k23 = 3.0 * k2;\n'+'  float cx = k23 * px.x - klm.z * px.y - klm.y * px.z;\n'+'  float cy = k23 * py.x - klm.z * py.y - klm.y * py.z;\n'+'\n'+'  // Signed distance\n'+'  float sd = c / sqrt(cx * cx + cy * cy);\n'+'\n'+'  // Linear alpha\n'+'  float alpha = clamp(0.5 - sd, 0.0, 1.0);\n';}else{alphaComputation=''+'  float t = klm.x * klm.x * klm.x - klm.y * klm.z;\n'+'  float alpha = clamp(sign(t), 0.0, 1.0);\n';}
return result+alphaComputation+'\n'+
fillSource+'}\n'+'\n'+'// #o3d VertexShaderEntryPoint vertexShaderFunction\n'+'// #o3d PixelShaderEntryPoint pixelShaderFunction\n'+'// #o3d MatrixLoadOrder RowMajor\n';}};o3djs.gpu2d.generateSolidShaderSource_=function(fillUniforms,fillSource){if(o3djs.base.glsl){var result=''+'// Vertex shader\n'+'uniform mat4 worldViewProjection;\n'+'\n'+'attribute vec2 position;\n'+'\n'+'void main() {\n'+'  // TODO(kbr): figure out why this multiplication needs to be\n'+'  // transposed compared to the Cg version.\n'+'  gl_Position = worldViewProjection * vec4(position, 0.0, 1.0);\n'+'}\n'+'// #o3d SplitMarker\n'+'// Fragment shader\n'+
fillUniforms+'void main() {\n'+'  float alpha = 1.0;\n'+
fillSource+'}\n'+'\n'+'// #o3d MatrixLoadOrder RowMajor\n';return result;}else{var result=''+'uniform float4x4 worldViewProjection : WORLDVIEWPROJECTION;\n'+
fillUniforms+'\n'+'struct VertexShaderInput {\n'+'  float2 position : POSITION;\n'+'};\n'+'\n'+'struct PixelShaderInput {\n'+'  float4 position : POSITION;\n'+'};\n'+'\n'+'PixelShaderInput vertexShaderFunction(VertexShaderInput input) {\n'+'  PixelShaderInput output;\n'+'\n'+'  output.position = mul(float4(input.position, 0, 1),\n'+'                        worldViewProjection);\n'+'  return output;\n'+'}\n'+'\n'+'float4 pixelShaderFunction(PixelShaderInput input) : COLOR {\n'+'  float alpha = 1.0;\n'+
fillSource+'}\n'+'\n'+'// #o3d VertexShaderEntryPoint vertexShaderFunction\n'+'// #o3d PixelShaderEntryPoint pixelShaderFunction\n'+'// #o3d MatrixLoadOrder RowMajor\n';return result;}};o3djs.gpu2d.FillTypes_={COLOR:0};o3djs.gpu2d.FILL_CODE_CG_=[{uniforms:'uniform float4 color;\n',source:'return float4(color.r, color.g, color.b, color.a * alpha);\n'}];o3djs.gpu2d.FILL_CODE_GLSL_=[{uniforms:'uniform vec4 color;\n',source:'gl_FragColor = vec4(color.r, color.g, color.b, color.a * alpha);\n'}];o3djs.gpu2d.interiorEffectCache_=[];o3djs.gpu2d.exteriorEffectCache_=[];o3djs.gpu2d.loadEffect_=function(pack,fillType,interior){var effectCache;if(interior){effectCache=o3djs.gpu2d.interiorEffectCache_;}else{effectCache=o3djs.gpu2d.exteriorEffectCache_;}
var effectList=o3djs.gpu2d.getEffectList_(pack,effectCache);var effect=effectList[fillType];if(!effect){effect=pack.createObject('Effect');var result=false;var sourceSnippets;if(o3djs.base.glsl){sourceSnippets=o3djs.gpu2d.FILL_CODE_GLSL_[fillType];}else{sourceSnippets=o3djs.gpu2d.FILL_CODE_CG_[fillType];}
if(interior){result=effect.loadFromFXString(o3djs.gpu2d.generateSolidShaderSource_(sourceSnippets.uniforms,sourceSnippets.source));}else{result=effect.loadFromFXString(o3djs.gpu2d.generateLoopBlinnShaderSource_(true,sourceSnippets.uniforms,sourceSnippets.source));}
if(!result){alert('Error loading shader: interior = '+interior);}
effectList[fillType]=effect;}
return effect;};o3djs.gpu2d.getEffectList_=function(pack,effectCache){var list=effectCache[pack.clientId];if(!list){list=[];effectCache[pack.clientId]=list;}
return list;};o3djs.serialization=o3djs.serialization||{};o3djs.serialization.supportedVersion=5;o3djs.serialization.CURVE_KEY_TYPES={step:1,linear:2,bezier:3};o3djs.serialization.Options=goog.typedef;o3djs.serialization.Deserializer=function(pack,json){this.pack=pack;this.json=json;this.archiveInfo=null;function deserializeBuffer(deserializer,json,type,uri){var object=deserializer.pack.createObject(type);if('custom'in json){if('fieldData'in json.custom){var fieldDataArray=json.custom.fieldData;if(fieldDataArray.length>0){var fields=[];for(var ii=0;ii<fieldDataArray.length;++ii){var data=fieldDataArray[ii];var field=object.createField(data.type,data.numComponents);fields.push(field);deserializer.addObject(data.id,field);}
var firstData=fieldDataArray[0];var numElements=firstData.data.length/firstData.numComponents;object.allocateElements(numElements);for(var ii=0;ii<fieldDataArray.length;++ii){var data=fieldDataArray[ii];fields[ii].setAt(0,data.data);}}}else{var rawData=deserializer.archiveInfo.getFileByURI(uri);object.set(rawData,json.custom.binaryRange[0],json.custom.binaryRange[1]-json.custom.binaryRange[0]);for(var i=0;i<json.custom.fields.length;++i){deserializer.addObject(json.custom.fields[i],object.fields[i]);}}}
return object;}
this.createCallbacks={'o3djs.DestinationBuffer':function(deserializer,json){var object=deserializer.pack.createObject('o3d.VertexBuffer');if('custom'in json){for(var i=0;i<json.custom.fields.length;++i){var fieldInfo=json.custom.fields[i]
var field=object.createField(fieldInfo.type,fieldInfo.numComponents);deserializer.addObject(fieldInfo.id,field);}
object.allocateElements(json.custom.numElements);}
return object;},'o3d.VertexBuffer':function(deserializer,json){return deserializeBuffer(deserializer,json,'o3d.VertexBuffer','vertex-buffers.bin');},'o3d.SourceBuffer':function(deserializer,json){return deserializeBuffer(deserializer,json,'o3d.SourceBuffer','vertex-buffers.bin');},'o3d.IndexBuffer':function(deserializer,json){return deserializeBuffer(deserializer,json,'o3d.IndexBuffer','index-buffers.bin');},'o3d.Texture2D':function(deserializer,json){if('o3d.uri'in json.params){var uri=json.params['o3d.uri'].value;var rawData=deserializer.archiveInfo.getFileByURI(uri);if(!rawData){throw'Could not find texture '+uri+' in the archive';}
return o3djs.texture.createTextureFromRawData(pack,rawData,true);}else{return deserializer.pack.createTexture2D(json.custom.width,json.custom.height,json.custom.format,json.custom.levels,json.custom.renderSurfacesEnabled);}},'o3d.TextureCUBE':function(deserializer,json){if('o3d.negx_uri'in json.params){var param_names=['o3d.posx_uri','o3d.negx_uri','o3d.posy_uri','o3d.negy_uri','o3d.posz_uri','o3d.negz_uri'];var rawDataArray=[];for(var i=0;i<param_names.length;i++){var uri=json.params[param_names[i]].value;var rawData=deserializer.archiveInfo.getFileByURI(uri);if(!rawData){throw'Could not find texture '+uri+' in the archive';}
rawDataArray.push(rawData);}
return o3djs.texture.createTextureFromRawDataArray(pack,rawDataArray,true,false);}else if('o3d.uri'in json.params){var uri=json.params['o3d.uri'].value;var rawData=deserializer.archiveInfo.getFileByURI(uri);if(!rawData){throw'Could not find texture '+uri+' in the archive';}
return o3djs.texture.createTextureFromRawData(pack,rawData,true);}else{return deserializer.pack.createTextureCUBE(json.custom.edgeLength,json.custom.format,json.custom.levels,json.custom.renderSurfacesEnabled);}}};this.initCallbacks={'o3d.Curve':function(deserializer,object,json){if('custom'in json){if('keys'in json.custom){var keys=json.custom.keys;var stepType=o3djs.serialization.CURVE_KEY_TYPES.step;var linearType=o3djs.serialization.CURVE_KEY_TYPES.linear;var bezierType=o3djs.serialization.CURVE_KEY_TYPES.bezier;for(var ii=0;ii<keys.length;++ii){var key=keys[ii];switch(key[0]){case stepType:object.addStepKeys(key.slice(1));break;case linearType:object.addLinearKeys(key.slice(1));break;case bezierType:object.addBezierKeys(key.slice(1));break;}}}else{var rawData=deserializer.archiveInfo.getFileByURI('curve-keys.bin');object.set(rawData,json.custom.binaryRange[0],json.custom.binaryRange[1]-json.custom.binaryRange[0]);}}},'o3d.Effect':function(deserializer,object,json){var uriParam=object.getParam('o3d.uri');if(uriParam){var rawData=deserializer.archiveInfo.getFileByURI(uriParam.value);if(!rawData){throw'Cannot find shader '+uriParam.value+' in archive.';}
if(!object.loadFromFXString(rawData.stringValue)){throw'Cannot load shader '+uriParam.value+' in archive.';}}},'o3d.Skin':function(deserializer,object,json){if('custom'in json){if('binaryRange'in json.custom){var rawData=deserializer.archiveInfo.getFileByURI('skins.bin');object.set(rawData,json.custom.binaryRange[0],json.custom.binaryRange[1]-json.custom.binaryRange[0]);}}},'o3d.SkinEval':function(deserializer,object,json){if('custom'in json){for(var i=0;i<json.custom.vertexStreams.length;++i){var streamJson=json.custom.vertexStreams[i];var field=deserializer.getObjectById(streamJson.stream.field);object.setVertexStream(streamJson.stream.semantic,streamJson.stream.semanticIndex,field,streamJson.stream.startIndex);if('bind'in streamJson){var source=deserializer.getObjectById(streamJson.bind);object.bindStream(source,streamJson.stream.semantic,streamJson.stream.semanticIndex);}}}},'o3d.StreamBank':function(deserializer,object,json){if('custom'in json){for(var i=0;i<json.custom.vertexStreams.length;++i){var streamJson=json.custom.vertexStreams[i];var field=deserializer.getObjectById(streamJson.stream.field);object.setVertexStream(streamJson.stream.semantic,streamJson.stream.semanticIndex,field,streamJson.stream.startIndex);if('bind'in streamJson){var source=deserializer.getObjectById(streamJson.bind);object.bindStream(source,streamJson.stream.semantic,streamJson.stream.semanticIndex);}}}}};if(!('version'in json)){throw'Version in JSON file was missing.';}
if(json.version<o3djs.serialization.supportedVersion){throw'Version in JSON file was '+json.version+' but expected at least version '+
o3djs.serialization.supportedVersion+'.';}
if(!('objects'in json)){throw'Objects array in JSON file was missing.';}
this.objectsById_=[null];this.objectsByIndex_=[];this.classNames_=[];for(var className in json.objects){this.classNames_.push(className);}
this.phase_=0;this.nextClassIndex_=0;this.nextObjectIndex_=0;this.globalObjectIndex_=0;};o3djs.serialization.Deserializer.prototype.getObjectById=function(id){return this.objectsById_[id];};o3djs.serialization.Deserializer.prototype.addObject=function(id,object){this.objectsById_[id]=object;};o3djs.serialization.Deserializer.prototype.deserializeValue=function(valueJson){if(typeof(valueJson)==='object'){if(valueJson===null){return null;}
var valueAsObject=(valueJson);if('length'in valueAsObject){for(var i=0;i!=valueAsObject.length;++i){valueAsObject[i]=this.deserializeValue(valueAsObject[i]);}
return valueAsObject;}
var refId=valueAsObject['ref'];if(refId!==undefined){var referenced=this.objectsById_[refId];if(referenced===undefined){throw'Could not find object with id '+refId+'.';}
return referenced;}}
return valueJson;};o3djs.serialization.Deserializer.prototype.setParamValue_=function(object,paramName,propertyJson){var param=object.getParam(paramName);if(param===null)
return;var valueJson=propertyJson['value'];if(valueJson!==undefined){param.value=this.deserializeValue(valueJson);}
var bindId=propertyJson['bind'];if(bindId!==undefined){var referenced=this.objectsById_[bindId];if(referenced===undefined){throw'Could not find output param with id '+bindId+'.';}
param.bind(referenced);}};o3djs.serialization.Deserializer.prototype.createAndIdentifyParam_=function(object,paramName,propertyJson){var propertyClass=propertyJson['class'];var param;if(propertyClass!==undefined){param=object.createParam(paramName,propertyClass);}else{param=object.getParam(paramName);}
var paramId=propertyJson['id'];if(paramId!==undefined&&param!==null){this.objectsById_[paramId]=param;}};o3djs.serialization.Deserializer.prototype.createObjectsPhase_=function(amountOfWork){for(;this.nextClassIndex_<this.classNames_.length;++this.nextClassIndex_){var className=this.classNames_[this.nextClassIndex_];var classJson=this.json.objects[className];var numObjects=classJson.length;for(;this.nextObjectIndex_<numObjects;++this.nextObjectIndex_){if(amountOfWork--<=0)
return;var objectJson=classJson[this.nextObjectIndex_];var object=undefined;if('id'in objectJson){object=this.objectsById_[objectJson.id];}
if(object===undefined){if(className in this.createCallbacks){object=this.createCallbacks[className](this,objectJson);}else{object=this.pack.createObject(className);}}
this.objectsByIndex_[this.globalObjectIndex_++]=object;if('id'in objectJson){this.objectsById_[objectJson.id]=object;}
if('params'in objectJson){if('length'in objectJson.params){for(var paramIndex=0;paramIndex!=objectJson.params.length;++paramIndex){var paramJson=objectJson.params[paramIndex];this.createAndIdentifyParam_(object,paramIndex,paramJson);}}else{for(var paramName in objectJson.params){var paramJson=objectJson.params[paramName];this.createAndIdentifyParam_(object,paramName,paramJson);}}}}
this.nextObjectIndex_=0;}
if(this.nextClassIndex_===this.classNames_.length){this.nextClassIndex_=0;this.nextObjectIndex_=0;this.globalObjectIndex_=0;++this.phase_;}};o3djs.serialization.Deserializer.prototype.setPropertiesPhase_=function(amountOfWork){for(;this.nextClassIndex_<this.classNames_.length;++this.nextClassIndex_){var className=this.classNames_[this.nextClassIndex_];var classJson=this.json.objects[className];var numObjects=classJson.length;for(;this.nextObjectIndex_<numObjects;++this.nextObjectIndex_){if(amountOfWork--<=0)
return;var objectJson=classJson[this.nextObjectIndex_];var object=this.objectsByIndex_[this.globalObjectIndex_++];if('properties'in objectJson){for(var propertyName in objectJson.properties){if(propertyName in object){var propertyJson=objectJson.properties[propertyName];var propertyValue=this.deserializeValue(propertyJson);object[propertyName]=propertyValue;}};}
if('params'in objectJson){if('length'in objectJson.params){for(var paramIndex=0;paramIndex!=objectJson.params.length;++paramIndex){var paramJson=objectJson.params[paramIndex];this.setParamValue_((object),paramIndex,paramJson);}}else{for(var paramName in objectJson.params){var paramJson=objectJson.params[paramName];this.setParamValue_((object),paramName,paramJson);}}}
if(className in this.initCallbacks){this.initCallbacks[className](this,object,objectJson);}}
this.nextObjectIndex_=0;}
if(this.nextClassIndex_===this.classNames_.length){this.nextClassIndex_=0;this.nextObjectIndex_=0;this.globalObjectIndex_=0;++this.phase_;}};o3djs.serialization.Deserializer.prototype.run=function(opt_amountOfWork){if(!opt_amountOfWork){while(this.run(10000)){}
return false;}else{switch(this.phase_){case 0:this.createObjectsPhase_(opt_amountOfWork);break;case 1:this.setPropertiesPhase_(opt_amountOfWork);break;}
return this.phase_<2;}};o3djs.serialization.Deserializer.prototype.runBackground=function(client,pack,time,callback){var workToDo=this.json.objects.length*2;var timerCallbacks=time*60;var amountPerCallback=workToDo/timerCallbacks;var intervalId;var that=this;function deserializeMore(){var exception=null;var finished=false;var failed=false;var errorCollector=o3djs.error.createErrorCollector(client);try{finished=!that.run(amountPerCallback);}catch(e){failed=true;finished=true;exception=e;}
if(errorCollector.errors.length>0){finished=true;exception=errorCollector.errors.join('\n')+
(exception?('\n'+exception.toString()):'');}
errorCollector.finish();if(finished){window.clearInterval(intervalId);callback(pack,exception);}}
intervalId=window.setInterval(deserializeMore,1000/60);};o3djs.serialization.createDeserializer=function(pack,json){return new o3djs.serialization.Deserializer(pack,json);};o3djs.serialization.deserialize=function(pack,json){var deserializer=o3djs.serialization.createDeserializer(pack,json);deserializer.run();};o3djs.serialization.deserializeArchive=function(archiveInfo,sceneJsonUri,client,pack,parent,callback,opt_options){opt_options=opt_options||{};var jsonFile=archiveInfo.getFileByURI(sceneJsonUri);if(!jsonFile){throw'Could not find '+sceneJsonUri+' in archive';}
var parsed=eval('('+jsonFile.stringValue+')');var deserializer=o3djs.serialization.createDeserializer(pack,parsed);deserializer.addObject(parsed.o3d_rootObject_root,parent);deserializer.archiveInfo=archiveInfo;var finishCallback=function(pack,exception){if(!exception){var objects=pack.getObjects('o3d.animSourceOwner','o3d.ParamObject');if(objects.length>0){if(opt_options.opt_animSource){var animSource=objects[0].getParam('animSource');var outputConnections=animSource.outputConnections;for(var ii=0;ii<outputConnections.length;++ii){outputConnections[ii].bind(opt_options.opt_animSource);}}
for(var ii=0;ii<objects.length;++ii){pack.removeObject(objects[ii]);}}}
callback(pack,parent,exception);};if(opt_options.opt_async){deserializer.runBackground(client,pack,5,finishCallback);}else{var exception=null;var errorCollector=o3djs.error.createErrorCollector(client);try{deserializer.run();}catch(e){exception=e;}
if(errorCollector.errors.length>0){exception=errorCollector.errors.join('\n')+
(exception?('\n'+exception.toString()):'');}
errorCollector.finish();finishCallback(pack,exception);}};o3djs.scene=o3djs.scene||{};o3djs.scene.loadScene=function(client,pack,parent,url,callback,opt_options){function onFinished(archiveInfo,exception){if(!exception){var finishCallback=function(pack,parent,exception){archiveInfo.destroy();callback(pack,parent,exception);};o3djs.serialization.deserializeArchive(archiveInfo,'scene.json',client,pack,parent,finishCallback,opt_options);}else{archiveInfo.destroy();callback(pack,parent,exception);}}
return o3djs.io.loadArchive(pack,url,onFinished);};o3djs.loader=o3djs.loader||{};o3djs.loader.Loader=function(onFinished){this.count_=1;this.onFinished_=onFinished;this.loadInfo=o3djs.io.createLoadInfo();};o3djs.loader.createLoader=function(onFinished){return new o3djs.loader.Loader(onFinished);};o3djs.loader.Loader.prototype.loadTexture=function(pack,url,opt_onTextureLoaded){var that=this;++this.count_;var loadInfo=o3djs.io.loadTexture(pack,url,function(texture,exception){if(opt_onTextureLoaded){opt_onTextureLoaded(texture,exception);}
that.countDown_();});this.loadInfo.addChild(loadInfo);};o3djs.loader.Loader.prototype.loadRawData=function(pack,url,onLoaded){var that=this;++this.count_;var loadInfo=o3djs.io.loadRawData(pack,url,function(request,rawData,exception){onLoaded(request,rawData,exception);that.countDown_();});this.loadInfo.addChild(loadInfo);};o3djs.loader.Loader.prototype.loadBitmaps=function(pack,url,onBitmapsLoaded){var that=this;++this.count_;var loadInfo=o3djs.io.loadBitmaps(pack,url,function(bitmaps,exception){onBitmapsLoaded(bitmaps,exception);that.countDown_();});this.loadInfo.addChild(loadInfo);};o3djs.loader.Loader.prototype.loadScene=function(client,pack,parent,url,opt_onSceneLoaded,opt_options){var that=this;++this.count_;var loadInfo=o3djs.scene.loadScene(client,pack,parent,url,function(pack,parent,exception){if(opt_onSceneLoaded){opt_onSceneLoaded(pack,parent,exception);}
that.countDown_();},opt_options);this.loadInfo.addChild(loadInfo);};o3djs.loader.Loader.prototype.loadTextFile=function(url,onTextLoaded){var that=this;++this.count_;var loadInfo=o3djs.io.loadTextFile(url,function(string,exception){onTextLoaded(string,exception);that.countDown_();});this.loadInfo.addChild(loadInfo);};o3djs.loader.Loader.prototype.createLoader=function(onFinished){var that=this;++this.count_;var loader=o3djs.loader.createLoader(function(){onFinished();that.countDown_();});this.loadInfo.addChild(loader.loadInfo);return loader;};o3djs.loader.Loader.prototype.countDown_=function(){--this.count_;if(this.count_===0){this.onFinished_();}};o3djs.loader.Loader.prototype.finish=function(){this.countDown_();};o3djs.material=o3djs.material||{};o3djs.material.hasNonOneAlpha_=function(material,name){var found=false;var nonOneAlpha=false;var texture=null;var samplerParam=material.getParam(name+'Sampler');if(samplerParam&&samplerParam.isAClassName('o3d.ParamSampler')){found=true;var sampler=samplerParam.value;if(sampler){texture=sampler.texture;}}else{var textureParam=material.getParam(name+'Texture');if(textureParam&&textureParam.isAClassName('o3d.ParamTexture')){found=true;texture=textureParam.value;}}
if(texture&&!texture.alphaIsOne){nonOneAlpha=true;}
if(!found){var colorParam=material.getParam(name);if(colorParam&&colorParam.isAClassName('o3d.ParamFloat4')){found=true;}}
return{found:found,nonOneAlpha:nonOneAlpha};};o3djs.material.prepareMaterial=function(pack,viewInfo,material,opt_effectType){var drawList=viewInfo.performanceDrawList;if(!material.drawList){var param=material.getParam('collada.transparent');if(param&&param.className=='o3d.ParamBoolean'){material.drawList=param.value?viewInfo.zOrderedDrawList:viewInfo.performanceDrawList;}}
if(!material.effect){if(!opt_effectType){var lightingType=o3djs.effect.getColladaLightingType(material);if(lightingType){opt_effectType=lightingType;}}
if(opt_effectType){o3djs.material.attachStandardEffect(pack,material,viewInfo,opt_effectType);if(material.drawList==null){var result=o3djs.material.hasNonOneAlpha_(material,'diffuse');if(!result.found){result=o3djs.material.hasNonOneAlpha_(material,'emissive');}
if(result.nonOneAlpha){drawList=viewInfo.zOrderedDrawList;}}}}
if(!material.drawList){material.drawList=drawList;}};o3djs.material.prepareMaterials=function(pack,viewInfo,opt_effectPack){var materials=pack.getObjectsByClassName('o3d.Material');for(var mm=0;mm<materials.length;mm++){o3djs.material.prepareMaterial(opt_effectPack||pack,viewInfo,materials[mm]);}};o3djs.material.attachStandardEffectEx=function(pack,material,effectType){if(!material.effect){if(!o3djs.effect.attachStandardShader(pack,material,[0,0,0],effectType)){throw'Could not attach a standard effect';}}};o3djs.material.attachStandardEffect=function(pack,material,viewInfo,effectType){if(!material.effect){var lightPos=o3djs.math.matrix4.getTranslation(o3djs.math.inverse(viewInfo.drawContext.view));if(!o3djs.effect.attachStandardShader(pack,material,lightPos,effectType)){throw'Could not attach a standard effect';}}};o3djs.material.setDrawListOnMaterials=function(pack,drawList){var materials=pack.getObjectsByClassName('o3d.Material');for(var mm=0;mm<materials.length;mm++){var material=materials[mm];material.drawList=drawList;}};o3djs.material.createBasicMaterial=function(pack,viewInfo,colorOrTexture,opt_transparent){var material=pack.createObject('Material');material.drawList=opt_transparent?viewInfo.zOrderedDrawList:viewInfo.performanceDrawList;if(colorOrTexture.length){material.createParam('diffuse','ParamFloat4').value=colorOrTexture;}else{var paramSampler=material.createParam('diffuseSampler','ParamSampler');var sampler=pack.createObject('Sampler');paramSampler.value=sampler;sampler.texture=colorOrTexture;}
material.createParam('emissive','ParamFloat4').value=[0,0,0,1];material.createParam('ambient','ParamFloat4').value=[0,0,0,1];material.createParam('specular','ParamFloat4').value=[1,1,1,1];material.createParam('shininess','ParamFloat').value=50;material.createParam('specularFactor','ParamFloat').value=1;material.createParam('lightColor','ParamFloat4').value=[1,1,1,1];var lightPositionParam=material.createParam('lightWorldPos','ParamFloat3');o3djs.material.attachStandardEffect(pack,material,viewInfo,'phong');lightPositionParam.value=[1000,2000,3000];return material;};o3djs.material.createConstantMaterialEx=function(pack,drawList,colorOrTexture){var material=pack.createObject('Material');material.drawList=drawList;if(colorOrTexture.length){material.createParam('emissive','ParamFloat4').value=colorOrTexture;}else{var paramSampler=material.createParam('emissiveSampler','ParamSampler');var sampler=pack.createObject('Sampler');paramSampler.value=sampler;sampler.texture=colorOrTexture;}
o3djs.material.attachStandardEffectEx(pack,material,'constant');return material;};o3djs.material.createConstantMaterial=function(pack,viewInfo,colorOrTexture,opt_transparent){return o3djs.material.createConstantMaterialEx(pack,opt_transparent?viewInfo.zOrderedDrawList:viewInfo.performanceDrawList,colorOrTexture)};o3djs.material.createCheckerMaterial=function(pack,viewInfo,opt_color1,opt_color2,opt_transparent,opt_checkSize){opt_color1=opt_color1||[0.4,0.5,0.5,1];opt_color2=opt_color2||[0.6,0.8,0.8,1];opt_checkSize=opt_checkSize||10;var effect=o3djs.effect.createCheckerEffect(pack);var material=pack.createObject('Material');material.effect=effect;material.drawList=opt_transparent?viewInfo.zOrderedDrawList:viewInfo.performanceDrawList;o3djs.effect.createUniformParameters(pack,effect,material);material.getParam('color1').value=opt_color1;material.getParam('color2').value=opt_color2;material.getParam('checkSize').value=opt_checkSize;return material;};o3djs.material.createMaterialFromFile=function(pack,url,drawList){var effect=o3djs.effect.createEffectFromFile(pack,url);var material=pack.createObject('Material');material.effect=effect;material.drawList=drawList;o3djs.effect.createUniformParameters(pack,effect,material);return material;};o3djs.material.bindParamsOnMaterial=function(material,params){for(var paramName in params){var sourceParam=params[paramName];var param=material.getParam(paramName);if(param&&sourceParam.isAClassName(param.className)){param.bind(sourceParam);}}};o3djs.material.bindParams=function(pack,params){var materials=pack.getObjectsByClassName('o3d.Material');for(var mm=0;mm<materials.length;++mm){o3djs.material.bindParamsOnMaterial(materials[mm],params);}};o3djs.material.createParams=function(pack,paramSpec){var paramObject=pack.createObject('ParamObject');var params={};for(var paramName in paramSpec){params[paramName]=paramObject.createParam(paramName,paramSpec[paramName]);}
return params;};o3djs.material.createStandardParams=function(pack){var paramSpec={'lightColor':'ParamFloat4','lightWorldPos':'ParamFloat3'};return o3djs.material.createParams(pack,paramSpec);};o3djs.material.createAndBindStandardParams=function(pack){var params=o3djs.material.createStandardParams(pack);o3djs.material.bindParams(pack,params);return params;};o3djs.picking=o3djs.picking||{};o3djs.picking.Ray=goog.typedef;o3djs.picking.createPickInfo=function(element,shapeInfo,rayIntersectionInfo,worldIntersectionPosition){return new o3djs.picking.PickInfo(element,shapeInfo,rayIntersectionInfo,worldIntersectionPosition);};o3djs.picking.clientPositionToWorldRayEx=function(clientXPosition,clientYPosition,view,projection,clientWidth,clientHeight){var inverseViewProjectionMatrix=o3djs.math.inverse(o3djs.math.matrix4.composition(projection,view));var normScreenX=clientXPosition/(clientWidth*0.5)-1;var normScreenY=-(clientYPosition/(clientHeight*0.5)-1);return{near:o3djs.math.matrix4.transformPoint(inverseViewProjectionMatrix,[normScreenX,normScreenY,0]),far:o3djs.math.matrix4.transformPoint(inverseViewProjectionMatrix,[normScreenX,normScreenY,1])};};o3djs.picking.clientPositionToWorldRay=function(clientXPosition,clientYPosition,drawContext,clientWidth,clientHeight){return o3djs.picking.clientPositionToWorldRayEx(clientXPosition,clientYPosition,drawContext.view,drawContext.projection,clientWidth,clientHeight);};o3djs.picking.dprint=function(msg){};o3djs.picking.dprintPoint3=function(label,float3,prefix){};o3djs.picking.dprintBoundingBox=function(label,boundingBox,opt_prefix){};o3djs.picking.dumpRayIntersectionInfo=function(label,rayIntersectionInfo){o3djs.picking.dprint(label+' : valid = '+
rayIntersectionInfo.valid+' : intersected = '+
rayIntersectionInfo.intersected);if(rayIntersectionInfo.intersected){o3djs.picking.dprint(' : pos: '+
rayIntersectionInfo.position[0]+', '+
rayIntersectionInfo.position[1]+', '+
rayIntersectionInfo.position[2]+', ');}
o3djs.picking.dprint('\n');};o3djs.picking.PickInfo=function(element,shapeInfo,rayIntersectionInfo,worldIntersectionPosition){this.element=element;this.shapeInfo=shapeInfo;this.rayIntersectionInfo=rayIntersectionInfo;this.worldIntersectionPosition=worldIntersectionPosition};o3djs.picking.ShapeInfo=function(shape,parent,pickManager){this.shape=shape;this.parent=parent;this.boundingBox=null;this.pickManager=pickManager;this.update();};o3djs.picking.ShapeInfo.prototype.isPickable=function(){return true;}
o3djs.picking.ShapeInfo.prototype.getBoundingBox=function(){return this.boundingBox;};o3djs.picking.ShapeInfo.prototype.update=function(){var elements=this.shape.elements;if(elements.length>0){this.boundingBox=elements[0].getBoundingBox(0);for(var ee=1;ee<elements.length;ee++){this.boundingBox=this.boundingBox.add(elements[ee].getBoundingBox(0));}}};o3djs.picking.ShapeInfo.prototype.pick=function(worldRay){if(this.isPickable()){var worldMatrix=this.parent.transform.getUpdatedWorldMatrix()
var inverseWorldMatrix=o3djs.math.inverse(worldMatrix);var relativeNear=o3djs.math.matrix4.transformPoint(inverseWorldMatrix,worldRay.near);var relativeFar=o3djs.math.matrix4.transformPoint(inverseWorldMatrix,worldRay.far);var rayIntersectionInfo=this.boundingBox.intersectRay(relativeNear,relativeFar);o3djs.picking.dumpRayIntersectionInfo('SHAPE(box): '+this.shape.name,rayIntersectionInfo);if(rayIntersectionInfo.intersected){var elements=this.shape.elements;for(var e=0;e<elements.length;e++){var element=elements[e];rayIntersectionInfo=element.intersectRay(0,o3djs.base.o3d.State.CULL_CCW,relativeNear,relativeFar);o3djs.picking.dumpRayIntersectionInfo('SHAPE(tris): '+this.shape.name+' : element '+element.name,rayIntersectionInfo);if(rayIntersectionInfo.intersected){var worldIntersectionPosition=o3djs.math.matrix4.transformPoint(worldMatrix,rayIntersectionInfo.position);return o3djs.picking.createPickInfo(element,this,rayIntersectionInfo,worldIntersectionPosition);}}}}
return null;};o3djs.picking.ShapeInfo.prototype.dump=function(opt_prefix){var prefix=opt_prefix||'';o3djs.picking.dprint(prefix+'SHAPE: '+this.shape.name+'\n');o3djs.picking.dprintPoint3('bb min',this.boundingBox.minExtent,prefix+'    ');o3djs.picking.dprintPoint3('bb max',this.boundingBox.maxExtent,prefix+'    ');};o3djs.picking.TransformInfo=function(transform,parent,pickManager){this.childTransformInfos={};this.shapeInfos={};this.transform=transform;this.parent=parent;this.boundingBox=null;this.pickManager=pickManager;this.pickableEvenIfInvisible=false;};o3djs.picking.TransformInfo.prototype.getBoundingBox=function(){return this.boundingBox;};o3djs.picking.TransformInfo.prototype.isPickable=function(){return this.transform.visible||this.pickableEvenIfInvisible;};o3djs.picking.TransformInfo.prototype.update=function(){var newChildTransformInfos={};var newShapeInfos={};var children=this.transform.children;for(var c=0;c<children.length;c++){var child=children[c];var transformInfo=this.childTransformInfos[child.clientId];if(!transformInfo){transformInfo=this.pickManager.createTransformInfo(child,this);}else{transformInfo.boundingBox=null;}
transformInfo.update();newChildTransformInfos[child.clientId]=transformInfo;}
var shapes=this.transform.shapes;for(var s=0;s<shapes.length;s++){var shape=shapes[s];var shapeInfo=this.shapeInfos[shape.clientId];if(!shapeInfo){shapeInfo=this.pickManager.createShapeInfo(shape,this);}else{}
newShapeInfos[shape.clientId]=shapeInfo;}
for(var skey in this.childTransformInfos){var key=(skey);if(!newChildTransformInfos[key]){this.pickManager.removeTransformInfo(this.childTransformInfos[key]);}}
this.childTransformInfos=newChildTransformInfos;this.shapeInfos=newShapeInfos;var boundingBox=null;for(var key in newShapeInfos){var shapeInfo=newShapeInfos[key];if(shapeInfo.isPickable()){var box=shapeInfo.getBoundingBox().mul(this.transform.localMatrix);if(!boundingBox){boundingBox=box;}else if(box){boundingBox=boundingBox.add(box);}}}
for(var key in newChildTransformInfos){var transformInfo=newChildTransformInfos[key];if(transformInfo.isPickable()){var box=transformInfo.getBoundingBox();if(box){if(!boundingBox){boundingBox=box.mul(this.transform.localMatrix);}else{boundingBox=boundingBox.add(box.mul(this.transform.localMatrix));}}}}
this.boundingBox=boundingBox;};o3djs.picking.TransformInfo.prototype.pick=function(worldRay){if(this.isPickable()&&this.boundingBox){var inverseWorldMatrix=o3djs.math.matrix4.identity();if(this.parent){inverseWorldMatrix=o3djs.math.inverse(this.parent.transform.getUpdatedWorldMatrix());}
var relativeNear=o3djs.math.matrix4.transformPoint(inverseWorldMatrix,worldRay.near);var relativeFar=o3djs.math.matrix4.transformPoint(inverseWorldMatrix,worldRay.far);var rayIntersectionInfo=this.boundingBox.intersectRay(relativeNear,relativeFar);o3djs.picking.dumpRayIntersectionInfo('TRANSFORM(box): '+this.transform.name,rayIntersectionInfo);if(rayIntersectionInfo.intersected){var closestPickInfo=null;var minDistance=-1;for(var skey in this.childTransformInfos){var key=(skey);var transformInfo=this.childTransformInfos[key];var pickInfo=transformInfo.pick(worldRay);if(pickInfo){var distance=o3djs.math.lengthSquared(o3djs.math.subVector(worldRay.near,pickInfo.worldIntersectionPosition));if(!closestPickInfo||distance<minDistance){minDistance=distance;closestPickInfo=pickInfo;}}}
for(var skey in this.shapeInfos){var key=(skey);var shapeInfo=this.shapeInfos[key];var pickInfo=shapeInfo.pick(worldRay);if(pickInfo){var distance=o3djs.math.lengthSquared(o3djs.math.subVector(worldRay.near,pickInfo.worldIntersectionPosition));if(!closestPickInfo||distance<minDistance){minDistance=distance;closestPickInfo=pickInfo;}}}
return closestPickInfo;}}
return null;};o3djs.picking.TransformInfo.prototype.dump=function(opt_prefix){var prefix=opt_prefix||'';o3djs.picking.dprint(prefix+'TRANSFORM: '+this.transform.name+'\n');if(this.boundingBox){o3djs.picking.dprintPoint3('bb min',this.boundingBox.minExtent,prefix+'    ');o3djs.picking.dprintPoint3('bb max',this.boundingBox.maxExtent,prefix+'    ');}else{o3djs.picking.dprint(prefix+'    bb *NA*\n');}
o3djs.picking.dprint(prefix+'--Shapes--\n');for(var skey in this.shapeInfos){var key=(skey);var shapeInfo=this.shapeInfos[key];shapeInfo.dump(prefix+'    ');}
o3djs.picking.dprint(prefix+'--Children--\n');for(var skey in this.childTransformInfos){var key=(skey);var transformInfo=this.childTransformInfos[key];transformInfo.dump(prefix+'    ');}};o3djs.picking.PickManager=function(rootTransform){this.transformInfosByClientId={};this.rootTransformInfo=this.createTransformInfo(rootTransform,null);};o3djs.picking.PickManager.prototype.createShapeInfo=function(shape,parent){return new o3djs.picking.ShapeInfo(shape,parent,this);};o3djs.picking.PickManager.prototype.createTransformInfo=function(transform,parent){var info=new o3djs.picking.TransformInfo(transform,parent,this);this.addTransformInfo(info);return info;};o3djs.picking.PickManager.prototype.addTransformInfo=function(transformInfo){this.transformInfosByClientId[transformInfo.transform.clientId]=transformInfo;};o3djs.picking.PickManager.prototype.removeTransformInfo=function(transformInfo){delete this.transformInfosByClientId[transformInfo.transform.clientId];};o3djs.picking.PickManager.prototype.getTransformInfo=function(transform){return this.transformInfosByClientId[transform.clientId];};o3djs.picking.PickManager.prototype.update=function(){this.rootTransformInfo.update();};o3djs.picking.PickManager.prototype.dump=function(){this.rootTransformInfo.dump();};o3djs.picking.PickManager.prototype.pick=function(worldRay){return this.rootTransformInfo.pick(worldRay);};o3djs.picking.createPickManager=function(rootTransform){return new o3djs.picking.PickManager(rootTransform);};o3djs.manipulators=o3djs.manipulators||{};o3djs.manipulators.createManager=function(pack,parentTransform,parentRenderNode,renderNodePriority,drawContext){return new o3djs.manipulators.Manager(pack,parentTransform,parentRenderNode,renderNodePriority,drawContext);};o3djs.manipulators.Line_=function(opt_direction,opt_point){this.direction_=o3djs.math.copyVector(opt_direction||[1,0,0]);this.point_=o3djs.math.copyVector(opt_point||[0,0,0]);this.recalc_();};o3djs.manipulators.Line_.prototype.setDirection=function(direction){this.direction_=o3djs.math.copyVector(direction);this.recalc_();};o3djs.manipulators.Line_.prototype.getDirection=function(){return this.direction_;};o3djs.manipulators.Line_.prototype.setPoint=function(point){this.point_=o3djs.math.copyVector(point);this.recalc_();};o3djs.manipulators.Line_.prototype.getPoint=function(){return this.point_;};o3djs.manipulators.Line_.prototype.projectPoint=function(point){var dotp=o3djs.math.dot(this.direction_,point);return o3djs.math.addVector(this.alongVec_,o3djs.math.mulScalarVector(dotp,this.direction_));};o3djs.manipulators.EPSILON=0.00001;o3djs.manipulators.X_AXIS=[1,0,0];o3djs.manipulators.Z_AXIS=[0,0,1];o3djs.manipulators.Line_.prototype.closestPointToRay=function(startPoint,endPoint){var rayDirection=o3djs.math.subVector(endPoint,startPoint);var ddrd=o3djs.math.dot(this.direction_,rayDirection);var A=[[-o3djs.math.lengthSquared(this.direction_),ddrd],[ddrd,-o3djs.math.lengthSquared(rayDirection)]];var det=o3djs.math.det2(A);if(Math.abs(det)<o3djs.manipulators.EPSILON){return null;}
var Ainv=o3djs.math.inverse2(A);var b=[o3djs.math.dot(this.point_,this.direction_)-
o3djs.math.dot(startPoint,this.direction_),o3djs.math.dot(startPoint,rayDirection)-
o3djs.math.dot(this.point_,rayDirection)];var x=o3djs.math.mulMatrixVector(Ainv,b);if(x[1]<0){return startPoint;}else{return o3djs.math.addVector(this.point_,o3djs.math.mulScalarVector(x[0],this.direction_));}};o3djs.manipulators.Line_.prototype.recalc_=function(){var denom=o3djs.math.lengthSquared(this.direction_);if(denom==0.0){throw'Line_.recalc_: ERROR: direction was the zero vector (not allowed)';}
this.alongVec_=o3djs.math.subVector(this.point_,o3djs.math.mulScalarVector(o3djs.math.dot(this.point_,this.direction_),this.direction_));};o3djs.manipulators.DEFAULT_COLOR=[0.8,0.8,0.8,1.0];o3djs.manipulators.HIGHLIGHTED_COLOR=[0.9,0.9,0.0,1.0];o3djs.manipulators.Plane_=function(opt_normal,opt_point){this.point_=o3djs.math.copyVector(opt_point||[0,0,0]);this.setNormal(opt_normal||[0,1,0]);};o3djs.manipulators.Plane_.prototype.setNormal=function(normal){var denom=o3djs.math.lengthSquared(normal);if(denom==0.0){throw'Plane_.setNormal: ERROR: normal was the zero vector (not allowed)';}
this.normal_=o3djs.math.normalize(normal);this.recalc_();};o3djs.manipulators.Plane_.prototype.getNormal=function(){return this.normal_;};o3djs.manipulators.Plane_.prototype.setPoint=function(point){this.point_=o3djs.math.copyVector(point);this.recalc_();};o3djs.manipulators.Plane_.prototype.getPoint=function(){return this.point_;};o3djs.manipulators.Plane_.prototype.projectPoint=function(point){var distFromPlane=o3djs.math.dot(this.normal_,point)-this.normalDotPoint_;return o3djs.math.subVector(point,o3djs.math.mulScalarVector(distFromPlane,this.normal_));};o3djs.manipulators.Plane_.prototype.intersectRay=function(rayStart,rayDirection){var distFromPlane=this.normalDotPoint_-o3djs.math.dot(this.normal_,rayStart);var denom=o3djs.math.dot(this.normal_,rayDirection);if(denom==0){return null;}
var t=distFromPlane/denom;return o3djs.math.addVector(rayStart,o3djs.math.mulScalarVector(t,rayDirection));};o3djs.manipulators.Plane_.prototype.recalc_=function(){this.normalDotPoint_=o3djs.math.dot(this.normal_,this.point_);};o3djs.manipulators.Manager=function(pack,parentTransform,parentRenderNode,renderNodePriority,drawContext){this.pack=pack;this.viewInfo=o3djs.rendergraph.createView(pack,parentTransform,parentRenderNode,undefined,renderNodePriority,undefined,undefined,undefined,drawContext);this.viewInfo.clearBuffer.active=false;var state=this.viewInfo.zOrderedState;state.getStateParam('ZComparisonFunction').value=o3djs.base.o3d.State.CMP_GREATER;state.getStateParam('ZWriteEnable').value=false;var temp=this.viewInfo.performanceDrawPassInfo.root.priority;this.viewInfo.performanceDrawPassInfo.root.priority=this.viewInfo.zOrderedDrawPassInfo.root.priority
this.viewInfo.zOrderedDrawPassInfo.root.priority=temp;this.unobscuredDrawList_=this.viewInfo.performanceDrawList;this.obscuredDrawList_=this.viewInfo.zOrderedDrawList;this.parentTransform=parentTransform;this.manipsByClientId=[];this.pickManager=o3djs.picking.createPickManager(this.parentTransform);this.highlightedManip=null;this.draggedManip_=null;};o3djs.manipulators.Manager.prototype.getUnobscuredConstantMaterial=function(){if(!this.unobscuredConstantMaterial_){this.unobscuredConstantMaterial_=o3djs.manipulators.createConstantMaterial(this.pack,this.unobscuredDrawList_,[1,1,1,0.8]);}
return this.unobscuredConstantMaterial_;};o3djs.manipulators.Manager.prototype.getObscuredConstantMaterial=function(){if(!this.obscuredConstantMaterial_){this.obscuredConstantMaterial_=o3djs.manipulators.createConstantMaterial(this.pack,this.obscuredDrawList_,[1,1,1,0.3]);}
return this.obscuredConstantMaterial_;};o3djs.manipulators.Manager.prototype.getUnobscuredLineRingMaterial=function(){if(!this.unobscuredLineRingMaterial_){this.unobscuredLineRingMaterial_=o3djs.manipulators.createLineRingMaterial(this.pack,this.unobscuredDrawList_,[1,1,1,1],[1,1,1,0.6],false);}
return this.unobscuredLineRingMaterial_;};o3djs.manipulators.Manager.prototype.getObscuredLineRingMaterial=function(){if(!this.obscuredLineRingMaterial_){this.obscuredLineRingMaterial_=o3djs.manipulators.createLineRingMaterial(this.pack,this.obscuredDrawList_,[1,1,1,0.5],[1,1,1,0.3],true);}
return this.obscuredLineRingMaterial_;};o3djs.manipulators.Manager.prototype.createTranslate1=function(){var manip=new o3djs.manipulators.Translate1(this);this.add_(manip);return manip;};o3djs.manipulators.Manager.prototype.createTranslate2=function(){var manip=new o3djs.manipulators.Translate2(this);this.add_(manip);return manip;};o3djs.manipulators.Manager.prototype.createRotate1=function(){var manip=new o3djs.manipulators.Rotate1(this);this.add_(manip);return manip;};o3djs.manipulators.Manager.prototype.add_=function(manip){manip.getTransform().createDrawElements(this.pack,null);this.manipsByClientId[manip.getTransform().clientId]=manip;};o3djs.manipulators.Manager.prototype.handleMouse_=function(x,y,view,projection,width,height,func){this.pickManager.update();var worldRay=o3djs.picking.clientPositionToWorldRayEx(x,y,view,projection,width,height);var pickResult=this.pickManager.pick(worldRay);if(pickResult!=null){var manip=this.manipsByClientId[pickResult.shapeInfo.parent.transform.clientId]||this.manipsByClientId[pickResult.shapeInfo.parent.parent.transform.clientId];func(this,pickResult,manip);}else{func(this,null,null);}};o3djs.manipulators.mouseDownCallback_=function(manager,pickResult,manip){if(manip!=null){manager.draggedManip_=manip;manip.makeActive(pickResult);}};o3djs.manipulators.hoverCallback_=function(manager,pickResult,manip){if(manager.highlightedManip!=null&&manager.highlightedManip!=manip){manager.highlightedManip.clearHighlight();manager.highlightedManip=null;}
if(manip!=null){manip.highlight(pickResult);manager.highlightedManip=manip;}};o3djs.manipulators.Manager.prototype.mousedown=function(x,y,view,projection,width,height){this.handleMouse_(x,y,view,projection,width,height,o3djs.manipulators.mouseDownCallback_);};o3djs.manipulators.Manager.prototype.mousemove=function(x,y,view,projection,width,height){if(this.draggedManip_!=null){var worldRay=o3djs.picking.clientPositionToWorldRayEx(x,y,view,projection,width,height);this.draggedManip_.drag(worldRay.near,worldRay.far,x,y,view,projection,width,height);}else{this.handleMouse_(x,y,view,projection,width,height,o3djs.manipulators.hoverCallback_);}};o3djs.manipulators.Manager.prototype.mouseup=function(){if(this.draggedManip_!=null){this.draggedManip_.makeInactive();this.draggedManip_=null;}};o3djs.manipulators.Manager.prototype.updateInactiveManipulators=function(){for(var ii in this.manipsByClientId){var manip=this.manipsByClientId[ii];if(!manip.isActive()){manip.updateBaseTransformFromAttachedTransform_();}}};o3djs.manipulators.Manip=function(manager){this.manager_=manager;var pack=manager.pack;this.localTransform_=pack.createObject('Transform');this.offsetTransform_=pack.createObject('Transform');this.baseTransform_=pack.createObject('Transform');this.invisibleTransform_=pack.createObject('Transform');this.invisibleTransform_.visible=false;this.invisibleTransform_.parent=this.localTransform_;this.localTransform_.parent=this.offsetTransform_;this.offsetTransform_.parent=this.baseTransform_;this.baseTransform_.parent=manager.parentTransform;manager.pickManager.update();var invisibleTransformInfo=manager.pickManager.getTransformInfo(this.invisibleTransform_);invisibleTransformInfo.pickableEvenIfInvisible=true;this.attachedTransform_=null;this.active_=false;};o3djs.manipulators.Manip.prototype.addShapes_=function(shapes,opt_visible){if(opt_visible==undefined){opt_visible=true;}
for(var ii=0;ii<shapes.length;ii++){if(opt_visible){this.localTransform_.addShape(shapes[ii]);}else{this.invisibleTransform_.addShape(shapes[ii]);}}};o3djs.manipulators.Manip.prototype.getBaseTransform_=function(){return this.baseTransform_;};o3djs.manipulators.Manip.prototype.getOffsetTransform=function(){return this.offsetTransform_;};o3djs.manipulators.Manip.prototype.getTransform=function(){return this.localTransform_;};o3djs.manipulators.Manip.prototype.setOffsetTranslation=function(translation){this.getOffsetTransform().localMatrix=o3djs.math.matrix4.setTranslation(this.getOffsetTransform().localMatrix,translation);};o3djs.manipulators.Manip.prototype.setOffsetRotation=function(quaternion){var rot=o3djs.quaternions.quaternionToRotation(quaternion);this.getOffsetTransform().localMatrix=o3djs.math.matrix4.setUpper3x3(this.getOffsetTransform().localMatrix,rot);};o3djs.manipulators.Manip.prototype.setTranslation=function(translation){this.getTransform().localMatrix=o3djs.math.matrix4.setTranslation(this.getTransform().localMatrix,translation);};o3djs.manipulators.Manip.prototype.setRotation=function(quaternion){var rot=o3djs.quaternions.quaternionToRotation(quaternion);this.getTransform().localMatrix=o3djs.math.matrix4.setUpper3x3(this.getTransform().localMatrix,rot);};o3djs.manipulators.Manip.prototype.attachTo=function(transform){this.attachedTransform_=transform;this.updateBaseTransformFromAttachedTransform_();};o3djs.manipulators.Manip.prototype.highlight=function(pickResult){};o3djs.manipulators.Manip.prototype.clearHighlight=function(){};o3djs.manipulators.Manip.prototype.makeActive=function(pickResult){this.active_=true;};o3djs.manipulators.Manip.prototype.makeInactive=function(){this.active_=false;};o3djs.manipulators.Manip.prototype.drag=function(startPoint,endPoint,x,y,view,projection,width,height){};o3djs.manipulators.Manip.prototype.isActive=function(){return this.active_;};o3djs.manipulators.Manip.prototype.updateBaseTransformFromAttachedTransform_=function(){if(this.attachedTransform_!=null){var attWorld=this.attachedTransform_.worldMatrix;var parWorld=this.manager_.parentTransform.worldMatrix;var parWorldInv=o3djs.math.matrix4.inverse(parWorld);this.baseTransform_.localMatrix=o3djs.math.matrix4.mul(attWorld,parWorldInv);this.localTransform_.localMatrix=o3djs.math.matrix4.identity();}};o3djs.manipulators.Manip.prototype.updateAttachedTransformFromLocalTransform_=function(){if(this.attachedTransform_!=null){var base=this.baseTransform_.worldMatrix;var offset=this.offsetTransform_.localMatrix;var local=this.localTransform_.localMatrix;var offsetInv=o3djs.math.matrix4.inverse(offset);var totalMat=o3djs.math.matrix4.mul(offsetInv,local);totalMat=o3djs.math.matrix4.mul(totalMat,offset);totalMat=o3djs.math.matrix4.mul(totalMat,base);var attWorld=this.attachedTransform_.worldMatrix;var attLocal=this.attachedTransform_.localMatrix;var attParentMat=o3djs.math.matrix4.mul(o3djs.math.matrix4.inverse(attLocal),attWorld);var attParentMatInv=o3djs.math.matrix4.inverse(attParentMat);totalMat=o3djs.math.matrix4.mul(totalMat,attParentMatInv);this.attachedTransform_.localMatrix=totalMat;}};o3djs.manipulators.Manip.prototype.setMaterial_=function(shape,material){var elements=shape.elements;for(var ii=0;ii<elements.length;ii++){var drawElements=elements[ii].drawElements;for(var jj=0;jj<drawElements.length;jj++){drawElements[jj].material=material;}}};o3djs.manipulators.Manip.prototype.setMaterials_=function(shapes,material){for(var ii=0;ii<shapes.length;ii++){this.setMaterial_(shapes[ii],material);}};o3djs.manipulators.createArrowVertices_=function(matrix){var matrix4=o3djs.math.matrix4;var verts=o3djs.primitives.createTruncatedConeVertices(0.15,0.0,0.3,4,1,matrix4.mul(matrix4.translation([0,0.85,0]),matrix));verts.append(o3djs.primitives.createCylinderVertices(0.06,1.4,4,1,matrix));verts.append(o3djs.primitives.createTruncatedConeVertices(0.0,0.15,0.3,4,1,matrix4.mul(matrix4.translation([0,-0.85,0]),matrix)));return verts;};o3djs.manipulators.Translate1=function(manager){o3djs.manipulators.Manip.call(this,manager);var pack=manager.pack;var shape=manager.translate1Shape_;if(!shape){var verts=o3djs.manipulators.createArrowVertices_(o3djs.math.matrix4.rotationZ(Math.PI/2));shape=verts.createShape(pack,manager.getUnobscuredConstantMaterial());shape.createDrawElements(pack,manager.getObscuredConstantMaterial());manager.translate1Shape_=shape;}
this.addShapes_([shape]);this.colorParam_=this.getTransform().createParam('highlightColor','ParamFloat4');this.clearHighlight();this.dragLine_=new o3djs.manipulators.Line_();};o3djs.base.inherit(o3djs.manipulators.Translate1,o3djs.manipulators.Manip);o3djs.manipulators.Translate1.prototype.highlight=function(pickResult){this.colorParam_.value=o3djs.manipulators.HIGHLIGHTED_COLOR;};o3djs.manipulators.Translate1.prototype.clearHighlight=function(){this.colorParam_.value=o3djs.manipulators.DEFAULT_COLOR;};o3djs.manipulators.Translate1.prototype.makeActive=function(pickResult){o3djs.manipulators.Manip.prototype.makeActive.call(this,pickResult);this.highlight(pickResult);var localToWorld=this.getTransform().worldMatrix;this.dragLine_.setDirection(o3djs.math.matrix4.transformDirection(localToWorld,o3djs.manipulators.X_AXIS));this.dragLine_.setPoint(pickResult.worldIntersectionPosition);};o3djs.manipulators.Translate1.prototype.makeInactive=function(){o3djs.manipulators.Manip.prototype.makeInactive.call(this);this.clearHighlight();this.updateAttachedTransformFromLocalTransform_();this.updateBaseTransformFromAttachedTransform_();};o3djs.manipulators.Translate1.prototype.drag=function(startPoint,endPoint,x,y,view,projection,width,height){var closestPoint=this.dragLine_.closestPointToRay(startPoint,endPoint);if(closestPoint==null){return;}
var diffVector=o3djs.math.subVector(closestPoint,this.dragLine_.getPoint());var worldToLocal=o3djs.math.matrix4.inverse(this.getTransform().worldMatrix);this.getTransform().localMatrix=o3djs.math.matrix4.setTranslation(this.getTransform().localMatrix,o3djs.math.matrix4.transformDirection(worldToLocal,diffVector));this.updateAttachedTransformFromLocalTransform_();};o3djs.manipulators.Translate2=function(manager){o3djs.manipulators.Manip.call(this,manager);var pack=manager.pack;var shape=manager.Translate2Shape_;if(!shape){var verts=o3djs.manipulators.createArrowVertices_(o3djs.math.matrix4.rotationZ(Math.PI/2));verts.append(o3djs.manipulators.createArrowVertices_(o3djs.math.matrix4.rotationZ(0)));shape=verts.createShape(pack,manager.getUnobscuredConstantMaterial());shape.createDrawElements(pack,manager.getObscuredConstantMaterial());manager.Translate2Shape_=shape;}
this.addShapes_([shape]);this.colorParam_=this.getTransform().createParam('highlightColor','ParamFloat4');this.clearHighlight();this.dragPlane_=new o3djs.manipulators.Plane_();};o3djs.base.inherit(o3djs.manipulators.Translate2,o3djs.manipulators.Manip);o3djs.manipulators.Translate2.prototype.highlight=function(pickResult){this.colorParam_.value=o3djs.manipulators.HIGHLIGHTED_COLOR;};o3djs.manipulators.Translate2.prototype.clearHighlight=function(){this.colorParam_.value=o3djs.manipulators.DEFAULT_COLOR;};o3djs.manipulators.Translate2.prototype.makeActive=function(pickResult){o3djs.manipulators.Manip.prototype.makeActive.call(this,pickResult);this.highlight(pickResult);var localToWorld=this.getTransform().worldMatrix;this.dragPlane_.setNormal(o3djs.math.matrix4.transformDirection(localToWorld,o3djs.manipulators.Z_AXIS));this.dragPlane_.setPoint(pickResult.worldIntersectionPosition);};o3djs.manipulators.Translate2.prototype.makeInactive=function(){o3djs.manipulators.Manip.prototype.makeInactive.call(this);this.clearHighlight();this.updateAttachedTransformFromLocalTransform_();this.updateBaseTransformFromAttachedTransform_();};o3djs.manipulators.Translate2.prototype.drag=function(startPoint,endPoint,x,y,view,projection,width,height){var intersectPoint=this.dragPlane_.intersectRay(startPoint,o3djs.math.subVector(endPoint,startPoint));if(intersectPoint==null){return;}
var diffVector=o3djs.math.subVector(intersectPoint,this.dragPlane_.getPoint());var worldToLocal=o3djs.math.matrix4.inverse(this.getTransform().worldMatrix);this.getTransform().localMatrix=o3djs.math.matrix4.setTranslation(this.getTransform().localMatrix,o3djs.math.matrix4.transformDirection(worldToLocal,diffVector));this.updateAttachedTransformFromLocalTransform_();};o3djs.manipulators.Rotate1=function(manager){o3djs.manipulators.Manip.call(this,manager);var pack=manager.pack;var pickShape=manager.Rotate1PickShape_;if(!pickShape){var verts=o3djs.primitives.createTorusVertices(1.0,0.1,16,6,o3djs.math.matrix4.rotationZ(Math.PI/2));pickShape=verts.createShape(pack,manager.getUnobscuredConstantMaterial());manager.Rotate1PickShape_=pickShape;}
var visibleShape=manager.Rotate1VisibleShape_;if(!visibleShape){var verts=o3djs.lineprimitives.createLineRingVertices(1.0,32,120,o3djs.math.matrix4.rotationZ(Math.PI/2));visibleShape=verts.createShape(pack,manager.getUnobscuredLineRingMaterial());visibleShape.createDrawElements(pack,manager.getObscuredLineRingMaterial());manager.Rotate1VisibleShape_=visibleShape;}
this.addShapes_([pickShape],false);this.addShapes_([visibleShape]);this.colorParam_=this.getTransform().createParam('highlightColor','ParamFloat4');this.clearHighlight();this.dragLine_=new o3djs.manipulators.Line_();};o3djs.base.inherit(o3djs.manipulators.Rotate1,o3djs.manipulators.Manip);o3djs.manipulators.Rotate1.prototype.highlight=function(pickResult){this.colorParam_.value=o3djs.manipulators.HIGHLIGHTED_COLOR;};o3djs.manipulators.Rotate1.prototype.clearHighlight=function(){this.colorParam_.value=o3djs.manipulators.DEFAULT_COLOR;};o3djs.manipulators.Rotate1.prototype.makeActive=function(pickResult){o3djs.manipulators.Manip.prototype.makeActive.call(this,pickResult);this.highlight(pickResult);var localToWorld=this.getTransform().worldMatrix;var worldToLocal=o3djs.math.matrix4.inverse(localToWorld);var localIntersectionPosition=o3djs.math.matrix4.transformPoint(worldToLocal,pickResult.worldIntersectionPosition);var localLineDirection=o3djs.math.cross(localIntersectionPosition,o3djs.manipulators.X_AXIS);this.dragLine_.setDirection(o3djs.math.matrix4.transformDirection(localToWorld,localLineDirection));this.dragLine_.setPoint(pickResult.worldIntersectionPosition);};o3djs.manipulators.Rotate1.prototype.makeInactive=function(){o3djs.manipulators.Manip.prototype.makeInactive.call(this);this.clearHighlight();this.updateAttachedTransformFromLocalTransform_();this.updateBaseTransformFromAttachedTransform_();};o3djs.manipulators.frustumPositionToClientPosition_=function(frustumPoint,width,height){return[(frustumPoint[0]+1)*width/2,(-frustumPoint[1]+1)*height/2];};o3djs.manipulators.Rotate1.prototype.drag=function(startPoint,endPoint,x,y,view,projection,width,height){var viewProjectionMatrix=o3djs.math.matrix4.mul(view,projection);var linePoint1=o3djs.manipulators.frustumPositionToClientPosition_(o3djs.math.matrix4.transformPoint(viewProjectionMatrix,this.dragLine_.getPoint()),width,height);var linePoint2=o3djs.manipulators.frustumPositionToClientPosition_(o3djs.math.matrix4.transformPoint(viewProjectionMatrix,o3djs.math.addVector(this.dragLine_.getPoint(),this.dragLine_.getDirection())),width,height);var lineDirection=o3djs.math.normalize(o3djs.math.subVector(linePoint2,linePoint1));var mousePoint=[x,y];var dragDistance=o3djs.math.dot(lineDirection,mousePoint)-
o3djs.math.dot(lineDirection,linePoint1);var angle=(dragDistance/Math.max(width,height))*2*Math.PI;this.getTransform().localMatrix=o3djs.math.matrix4.rotationX(-angle);this.updateAttachedTransformFromLocalTransform_();};o3djs.manipulators.phongFXString_=''+'uniform float4x4 worldViewProjection : WORLDVIEWPROJECTION;\n'+'uniform float3 lightWorldPos;\n'+'uniform float4 lightColor;\n'+'uniform float4x4 world : WORLD;\n'+'uniform float4x4 viewInverse : VIEWINVERSE;\n'+'uniform float4x4 worldInverseTranspose : WORLDINVERSETRANSPOSE;\n'+'uniform float4 emissive;\n'+'uniform float4 ambient;\n'+'uniform float4 diffuse;\n'+'uniform float4 highlightColor;\n'+'uniform float4 specular;\n'+'uniform float shininess;\n'+'uniform float specularFactor;\n'+'struct InVertex {\n'+'  float4 position : POSITION;\n'+'  float3 normal : NORMAL;\n'+'};\n'+'struct OutVertex {\n'+'  float4 position : POSITION;\n'+'  float3 normal : TEXCOORD0;\n'+'  float3 surfaceToLight: TEXCOORD1;\n'+'  float3 surfaceToView : TEXCOORD2;\n'+'};\n'+'OutVertex vertexShaderFunction(InVertex input) {\n'+'  OutVertex output;\n'+'  output.position = mul(input.position, worldViewProjection);\n'+'  output.normal = mul(float4(input.normal, 0),\n'+'                      worldInverseTranspose).xyz;\n'+'  output.surfaceToLight = lightWorldPos - \n'+'      mul(input.position, world).xyz;\n'+'  output.surfaceToView = (viewInverse[3] - mul(input.position,\n'+'      world)).xyz;\n'+'  return output;\n'+'}\n'+'float4 pixelShaderFunction(OutVertex input) : COLOR {\n'+'  float4 newDiffuse = diffuse * highlightColor;\n'+'  float3 normal = normalize(input.normal);\n'+'  float3 surfaceToLight = normalize(input.surfaceToLight);\n'+'  float3 surfaceToView = normalize(input.surfaceToView);\n'+'  float3 halfVector = normalize(surfaceToLight + surfaceToView);\n'+'  float4 litR = lit(dot(normal, surfaceToLight), \n'+'                    dot(normal, halfVector), shininess);\n'+'  return float4((emissive +\n'+'      lightColor * (ambient * newDiffuse + newDiffuse * litR.y +\n'+'      + specular * litR.z * specularFactor)).rgb, newDiffuse.a);\n'+'}\n'+'\n'+'// #o3d VertexShaderEntryPoint vertexShaderFunction\n'+'// #o3d PixelShaderEntryPoint pixelShaderFunction\n'+'// #o3d MatrixLoadOrder RowMajor\n';o3djs.manipulators.constantFXString_=''+'uniform float4x4 worldViewProjection : WORLDVIEWPROJECTION;\n'+'uniform float4 color;\n'+'uniform float4 highlightColor;\n'+'\n'+'struct VertexShaderInput {\n'+'  float4 position : POSITION;\n'+'};\n'+'\n'+'struct PixelShaderInput {\n'+'  float4 position : POSITION;\n'+'};\n'+'\n'+'PixelShaderInput vertexShaderFunction(VertexShaderInput input) {\n'+'  PixelShaderInput output;\n'+'\n'+'  output.position = mul(input.position, worldViewProjection);\n'+'  return output;\n'+'}\n'+'\n'+'float4 pixelShaderFunction(PixelShaderInput input): COLOR {\n'+'  return color * highlightColor;\n'+'}\n'+'\n'+'// #o3d VertexShaderEntryPoint vertexShaderFunction\n'+'// #o3d PixelShaderEntryPoint pixelShaderFunction\n'+'// #o3d MatrixLoadOrder RowMajor\n';o3djs.manipulators.getLineRingFXString_=function(enableStipple){var stippleCode='';if(enableStipple){stippleCode=''+'  // Use the texCoord to do stippling.\n'+'  if (input.texCoord.x % 2 > 1) return float4(0, 0, 0, 0);\n';}
return''+'uniform float4x4 worldViewProjection : WORLDVIEWPROJECTION;\n'+'// NOTE: We transform the normals through the\n'+'// worldViewProjectionInverseTranspose instead of the\n'+'// worldViewInverseTranspose. The projection matrix warps the\n'+'// normals in strange ways. One result of this is that the "front\n'+'// face" color of the ring can extend around more than 50% of the\n'+'// ring. This may be good or bad. If we dont include the projection\n'+'// matrix, we always get a 50% split, but we do not account for\n'+'// perspective. An alternative would be to get a little more\n'+'// complicated, using the positions of the camera and the center\n'+'// of the ring.\n'+'uniform float4x4 worldViewProjectionInverseTranspose :\n'+'    WORLDVIEWPROJECTIONINVERSETRANSPOSE;\n'+'uniform float4 color1;\n'+'uniform float4 color2;\n'+'uniform float4 highlightColor;\n'+'\n'+'struct VertexShaderInput {\n'+'  float4 position : POSITION;\n'+'  float4 normal : NORMAL;\n'+'  float1 texCoord : TEXCOORD0;\n'+'};\n'+'\n'+'struct PixelShaderInput {\n'+'  float4 position : POSITION;\n'+'  float3 normal : TEXCOORD0;\n'+'  float1 texCoord : TEXCOORD1;\n'+'};\n'+'\n'+'PixelShaderInput vertexShaderFunction(VertexShaderInput input) {\n'+'  PixelShaderInput output;\n'+'\n'+'  output.position = mul(input.position, worldViewProjection);\n'+'  output.normal = mul(input.normal,\n'+'                      worldViewProjectionInverseTranspose).xyz;\n'+'  output.texCoord = input.texCoord;\n'+'  return output;\n'+'}\n'+'\n'+'float4 pixelShaderFunction(PixelShaderInput input): COLOR {\n'+
stippleCode+'  if (input.normal.z < 0) {\n'+'    return color1 * highlightColor; // Front face of the ring.\n'+'  } else {\n'+'    return color2 * highlightColor; // Back face of the ring.\n'+'  }\n'+'}\n'+'\n'+'// #o3d VertexShaderEntryPoint vertexShaderFunction\n'+'// #o3d PixelShaderEntryPoint pixelShaderFunction\n'+'// #o3d MatrixLoadOrder RowMajor\n';};o3djs.manipulators.enableAlphaBlendingOnMaterial=function(pack,material,discardZeroAlphaPixels){if(!material.state){material.state=pack.createObject('State');}
var state=material.state;state.getStateParam('AlphaBlendEnable').value=true;state.getStateParam('SourceBlendFunction').value=o3djs.base.o3d.State.BLENDFUNC_SOURCE_ALPHA;state.getStateParam('DestinationBlendFunction').value=o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA;state.getStateParam('AlphaTestEnable').value=discardZeroAlphaPixels;state.getStateParam('AlphaComparisonFunction').value=o3djs.base.o3d.State.CMP_GREATER;state.getStateParam('AlphaReference').value=0;};o3djs.manipulators.createLineRingMaterial=function(pack,drawList,color1,color2,enableStipple){var material=pack.createObject('Material');material.effect=pack.createObject('Effect');material.effect.loadFromFXString(o3djs.manipulators.getLineRingFXString_(enableStipple));material.drawList=drawList;material.createParam('color1','ParamFloat4').value=color1;material.createParam('color2','ParamFloat4').value=color2;o3djs.manipulators.enableAlphaBlendingOnMaterial(pack,material,true);return material;};o3djs.manipulators.createConstantMaterial=function(pack,drawList,color){var material=pack.createObject('Material');material.effect=pack.createObject('Effect');material.effect.loadFromFXString(o3djs.manipulators.constantFXString_);material.drawList=drawList;material.createParam('color','ParamFloat4').value=color;o3djs.manipulators.enableAlphaBlendingOnMaterial(pack,material,false);return material;};o3djs.manipulators.createPhongMaterial=function(pack,drawList,color){var material=pack.createObject('Material');material.effect=pack.createObject('Effect');material.effect.loadFromFXString(o3djs.manipulators.phongFXString_);material.drawList=drawList;material.createParam('diffuse','ParamFloat4').value=color;material.createParam('emissive','ParamFloat4').value=[0,0,0,1];material.createParam('ambient','ParamFloat4').value=[0.5,0.5,0.5,1];material.createParam('specular','ParamFloat4').value=[1,1,1,1];material.createParam('shininess','ParamFloat').value=50;material.createParam('specularFactor','ParamFloat').value=1;material.createParam('lightColor','ParamFloat4').value=[1,1,1,1];material.createParam('lightWorldPos','ParamFloat3').value=[1000,2000,3000];o3djs.manipulators.enableAlphaBlendingOnMaterial(pack,material,false);return material;};o3djs.shape=o3djs.shape||{};o3djs.shape.addMissingTexCoordStreams=function(shape){var elements=shape.elements;for(var ee=0;ee<elements.length;++ee){var element=elements[ee];o3djs.element.addMissingTexCoordStreams(element);}};o3djs.shape.setBoundingBoxesAndZSortPoints=function(shape){var elements=shape.elements;for(var ee=0;ee<elements.length;++ee){var element=elements[ee];o3djs.element.setBoundingBoxAndZSortPoint(element);}};o3djs.shape.prepareShape=function(pack,shape){shape.createDrawElements(pack,null);o3djs.shape.setBoundingBoxesAndZSortPoints(shape);o3djs.shape.addMissingTexCoordStreams(shape);};o3djs.shape.prepareShapes=function(pack){var shapes=pack.getObjectsByClassName('o3d.Shape');for(var ss=0;ss<shapes.length;++ss){o3djs.shape.prepareShape(pack,shapes[ss]);}};o3djs.shape.deleteDuplicateShape=function(shape,pack){var elements=shape.elements;for(var ee=0;ee<elements.length;ee++){var element=elements[ee];var drawElements=element.drawElements;for(var dd=0;dd<drawElements.length;dd++){var drawElement=drawElements[dd];pack.removeObject(drawElement);}
pack.removeObject(element);}
pack.removeObject(shape);};o3djs.shape.duplicateShape=function(pack,source){var newShape=pack.createObject('Shape');var elements=source.elements;for(var ee=0;ee<elements.length;ee++){var newElement=o3djs.element.duplicateElement(pack,elements[ee]);newElement.owner=newShape;}
newShape.createDrawElements(pack,null);return newShape;};o3djs.pack=o3djs.pack||{};o3djs.pack.preparePack=function(pack,viewInfo,opt_effectPack){o3djs.material.prepareMaterials(pack,viewInfo,opt_effectPack);o3djs.shape.prepareShapes(pack);};o3djs.particles=o3djs.particles||{};o3djs.particles.ParticleStateIds={BLEND:0,ADD:1,BLEND_PREMULTIPLY:2,BLEND_NO_ALPHA:3,SUBTRACT:4,INVERSE:5};o3djs.particles.FX_STRINGS_CG=[{name:'particle3d',fxString:''+'float4x4 worldViewProjection : WORLDVIEWPROJECTION;\n'+'float4x4 world : WORLD;\n'+'float3 worldVelocity;\n'+'float3 worldAcceleration;\n'+'float timeRange;\n'+'float time;\n'+'float timeOffset;\n'+'float frameDuration;\n'+'float numFrames;\n'+'\n'+'// We need to implement 1D!\n'+'sampler rampSampler;\n'+'sampler colorSampler;\n'+'\n'+'struct VertexShaderInput {\n'+'  float4 uvLifeTimeFrameStart : POSITION; // uv, lifeTime, frameStart\n'+'  float4 positionStartTime : TEXCOORD0;    // position.xyz, startTime\n'+'  float4 velocityStartSize : TEXCOORD1;   // velocity.xyz, startSize\n'+'  float4 accelerationEndSize : TEXCOORD2; // acceleration.xyz, endSize\n'+'  float4 spinStartSpinSpeed : TEXCOORD3;  // spinStart.x, spinSpeed.y\n'+'  float4 orientation : TEXCOORD4;  // orientation\n'+'  float4 colorMult : COLOR; //\n'+'};\n'+'\n'+'struct PixelShaderInput {\n'+'  float4 position : POSITION;\n'+'  float2 texcoord : TEXCOORD0;\n'+'  float1 percentLife : TEXCOORD1;\n'+'  float4 colorMult: TEXCOORD2;\n'+'};\n'+'\n'+'PixelShaderInput vertexShaderFunction(VertexShaderInput input) {\n'+'  PixelShaderInput output;\n'+'\n'+'  float2 uv = input.uvLifeTimeFrameStart.xy;\n'+'  float lifeTime = input.uvLifeTimeFrameStart.z;\n'+'  float frameStart = input.uvLifeTimeFrameStart.w;\n'+'  float3 position = input.positionStartTime.xyz;\n'+'  float startTime = input.positionStartTime.w;\n'+'  float3 velocity = mul(float4(input.velocityStartSize.xyz, 0),\n'+'                        world).xyz + worldVelocity;\n'+'  float startSize = input.velocityStartSize.w;\n'+'  float3 acceleration = mul(float4(input.accelerationEndSize.xyz, 0),\n'+'                            world).xyz + worldAcceleration;\n'+'  float endSize = input.accelerationEndSize.w;\n'+'  float spinStart = input.spinStartSpinSpeed.x;\n'+'  float spinSpeed = input.spinStartSpinSpeed.y;\n'+'\n'+'  float localTime = fmod((time - timeOffset - startTime), timeRange);\n'+'  float percentLife = localTime / lifeTime;\n'+'\n'+'  float frame = fmod(floor(localTime / frameDuration + frameStart),\n'+'                     numFrames);\n'+'  float uOffset = frame / numFrames;\n'+'  float u = uOffset + (uv.x + 0.5) * (1 / numFrames);\n'+'\n'+'  output.texcoord = float2(u, uv.y + 0.5);\n'+'  output.colorMult = input.colorMult;\n'+'\n'+'  float size = lerp(startSize, endSize, percentLife);\n'+'  size = (percentLife < 0 || percentLife > 1) ? 0 : size;\n'+'  float s = sin(spinStart + spinSpeed * localTime);\n'+'  float c = cos(spinStart + spinSpeed * localTime);\n'+'\n'+'  float4 rotatedPoint = float4((uv.x * c + uv.y * s) * size, 0,\n'+'                               (uv.x * s - uv.y * c) * size, 1);\n'+'  float3 center = velocity * localTime +\n'+'                  acceleration * localTime * localTime + \n'+'                  position;\n'+'  \n'+'      float4 q2 = input.orientation + input.orientation;\n'+'      float4 qx = input.orientation.xxxw * q2.xyzx;\n'+'      float4 qy = input.orientation.xyyw * q2.xyzy;\n'+'      float4 qz = input.orientation.xxzw * q2.xxzz;\n'+'  \n'+'      float4x4 localMatrix = float4x4(\n'+'        (1.0f - qy.y) - qz.z, \n'+'        qx.y + qz.w, \n'+'        qx.z - qy.w,\n'+'        0,\n'+'  \n'+'        qx.y - qz.w, \n'+'        (1.0f - qx.x) - qz.z, \n'+'        qy.z + qx.w,\n'+'        0,\n'+'  \n'+'        qx.z + qy.w, \n'+'        qy.z - qx.w, \n'+'        (1.0f - qx.x) - qy.y,\n'+'        0,\n'+'  \n'+'        center.x, center.y, center.z, 1);\n'+'  rotatedPoint = mul(rotatedPoint, localMatrix);\n'+'  output.position = mul(rotatedPoint, worldViewProjection);\n'+'  output.percentLife = percentLife;\n'+'  return output;\n'+'}\n'+'\n'+'float4 pixelShaderFunction(PixelShaderInput input): COLOR {\n'+'  float4 colorMult = tex2D(rampSampler, \n'+'                           float2(input.percentLife, 0.5)) *\n'+'                     input.colorMult;\n'+'  float4 color = tex2D(colorSampler, input.texcoord) * colorMult;\n'+'  return color;\n'+'}\n'+'\n'+'// #o3d VertexShaderEntryPoint vertexShaderFunction\n'+'// #o3d PixelShaderEntryPoint pixelShaderFunction\n'+'// #o3d MatrixLoadOrder RowMajor\n'},{name:'particle2d',fxString:''+'float4x4 viewProjection : VIEWPROJECTION;\n'+'float4x4 world : WORLD;\n'+'float4x4 viewInverse : VIEWINVERSE;\n'+'float3 worldVelocity;\n'+'float3 worldAcceleration;\n'+'float timeRange;\n'+'float time;\n'+'float timeOffset;\n'+'float frameDuration;\n'+'float numFrames;\n'+'\n'+'// We need to implement 1D!\n'+'sampler rampSampler;\n'+'sampler colorSampler;\n'+'\n'+'struct VertexShaderInput {\n'+'  float4 uvLifeTimeFrameStart : POSITION; // uv, lifeTime, frameStart\n'+'  float4 positionStartTime : TEXCOORD0;    // position.xyz, startTime\n'+'  float4 velocityStartSize : TEXCOORD1;   // velocity.xyz, startSize\n'+'  float4 accelerationEndSize : TEXCOORD2; // acceleration.xyz, endSize\n'+'  float4 spinStartSpinSpeed : TEXCOORD3;  // spinStart.x, spinSpeed.y\n'+'  float4 colorMult : COLOR; //\n'+'};\n'+'\n'+'struct PixelShaderInput {\n'+'  float4 position : POSITION;\n'+'  float2 texcoord : TEXCOORD0;\n'+'  float1 percentLife : TEXCOORD1;\n'+'  float4 colorMult: TEXCOORD2;\n'+'};\n'+'\n'+'PixelShaderInput vertexShaderFunction(VertexShaderInput input) {\n'+'  PixelShaderInput output;\n'+'\n'+'  float2 uv = input.uvLifeTimeFrameStart.xy;\n'+'  float lifeTime = input.uvLifeTimeFrameStart.z;\n'+'  float frameStart = input.uvLifeTimeFrameStart.w;\n'+'  float3 position = mul(float4(input.positionStartTime.xyz, 1),\n'+'                        world).xyz;\n'+'  float startTime = input.positionStartTime.w;\n'+'  float3 velocity = mul(float4(input.velocityStartSize.xyz, 0),\n'+'                        world).xyz + worldVelocity;\n'+'  float startSize = input.velocityStartSize.w;\n'+'  float3 acceleration = mul(float4(input.accelerationEndSize.xyz, 0),\n'+'                            world).xyz + worldAcceleration;\n'+'  float endSize = input.accelerationEndSize.w;\n'+'  float spinStart = input.spinStartSpinSpeed.x;\n'+'  float spinSpeed = input.spinStartSpinSpeed.y;\n'+'\n'+'  float localTime = fmod((time - timeOffset - startTime), timeRange);\n'+'  float percentLife = localTime / lifeTime;\n'+'\n'+'  float frame = fmod(floor(localTime / frameDuration + frameStart),\n'+'                     numFrames);\n'+'  float uOffset = frame / numFrames;\n'+'  float u = uOffset + (uv.x + 0.5) * (1 / numFrames);\n'+'\n'+'  output.texcoord = float2(u, uv.y + 0.5);\n'+'  output.colorMult = input.colorMult;\n'+'\n'+'  float3 basisX = viewInverse[0].xyz;\n'+'  float3 basisZ = viewInverse[1].xyz;\n'+'\n'+'  float size = lerp(startSize, endSize, percentLife);\n'+'  size = (percentLife < 0 || percentLife > 1) ? 0 : size;\n'+'  float s = sin(spinStart + spinSpeed * localTime);\n'+'  float c = cos(spinStart + spinSpeed * localTime);\n'+'\n'+'  float2 rotatedPoint = float2(uv.x * c + uv.y * s, \n'+'                               -uv.x * s + uv.y * c);\n'+'  float3 localPosition = float3(basisX * rotatedPoint.x +\n'+'                                basisZ * rotatedPoint.y) * size +\n'+'                         velocity * localTime +\n'+'                         acceleration * localTime * localTime + \n'+'                         position;\n'+'\n'+'  output.position = mul(float4(localPosition, 1), \n'+'                        viewProjection);\n'+'  output.percentLife = percentLife;\n'+'  return output;\n'+'}\n'+'\n'+'float4 pixelShaderFunction(PixelShaderInput input): COLOR {\n'+'  float4 colorMult = tex2D(rampSampler, \n'+'                           float2(input.percentLife, 0.5)) *\n'+'                     input.colorMult;\n'+'  float4 color = tex2D(colorSampler, input.texcoord) * colorMult;\n'+'  return color;\n'+'}\n'+'\n'+'// #o3d VertexShaderEntryPoint vertexShaderFunction\n'+'// #o3d PixelShaderEntryPoint pixelShaderFunction\n'+'// #o3d MatrixLoadOrder RowMajor\n'}];o3djs.particles.FX_STRINGS_GLSL=[{name:'particle3d',fxString:''+'uniform mat4 world;\n'+'uniform mat4 worldViewProjection;\n'+'uniform vec3 worldVelocity;\n'+'uniform vec3 worldAcceleration;\n'+'uniform float timeRange;\n'+'uniform float time;\n'+'uniform float timeOffset;\n'+'uniform float frameDuration;\n'+'uniform float numFrames;\n'+'\n'+'attribute vec4 position; // uv, lifeTime, frameStart\n'+'attribute vec4 texCoord0; // position.xyz, startTime\n'+'attribute vec4 texCoord1; // velocity.xyz, startSize\n'+'attribute vec4 texCoord2; // acceleration.xyz, endSize\n'+'attribute vec4 texCoord3; // spinStart.x, spinSpeed.y\n'+'attribute vec4 texCoord4; // orientation\n'+'attribute vec4 color; //\n'+'\n'+'varying vec4 v_position;\n'+'varying vec2 v_texcoord;\n'+'varying float v_percentLife;\n'+'varying vec4 v_colorMult;\n'+'\n'+'void main() {\n'+'  vec4 uvLifeTimeFrameStart = position;\n'+'  vec4 positionStartTime = texCoord0;\n'+'  vec4 velocityStartSize = texCoord1;\n'+'  vec4 accelerationEndSize = texCoord2;\n'+'  vec4 spinStartSpinSpeed = texCoord3;\n'+'  vec4 orientation = texCoord4;\n'+'  vec4 colorMult = color;\n'+'  vec2 uv = uvLifeTimeFrameStart.xy;\n'+'  float lifeTime = uvLifeTimeFrameStart.z;\n'+'  float frameStart = uvLifeTimeFrameStart.w;\n'+'  vec3 position = positionStartTime.xyz;\n'+'  float startTime = positionStartTime.w;\n'+'  vec3 velocity = (world * vec4(velocityStartSize.xyz, 0)).xyz\n'+'      + worldVelocity;\n'+'  float startSize = velocityStartSize.w;\n'+'  vec3 acceleration = (world *\n'+'      vec4(accelerationEndSize.xyz, 0)).xyz + worldAcceleration;\n'+'  float endSize = accelerationEndSize.w;\n'+'  float spinStart = spinStartSpinSpeed.x;\n'+'  float spinSpeed = spinStartSpinSpeed.y;\n'+'\n'+'  float localTime = mod((time - timeOffset - startTime),\n'+'      timeRange);\n'+'  float percentLife = localTime / lifeTime;\n'+'\n'+'  float frame = mod(floor(localTime / frameDuration + frameStart),\n'+'                     numFrames);\n'+'  float uOffset = frame / numFrames;\n'+'  float u = uOffset + (uv.x + 0.5) * (1.0 / numFrames);\n'+'\n'+'  v_texcoord = vec2(u, uv.y + 0.5);\n'+'  v_colorMult = colorMult;\n'+'\n'+'  float size = mix(startSize, endSize, percentLife);\n'+'  size = (percentLife < 0.0 || percentLife > 1.0) ? 0.0 : size;\n'+'  float s = sin(spinStart + spinSpeed * localTime);\n'+'  float c = cos(spinStart + spinSpeed * localTime);\n'+'\n'+'  vec4 rotatedPoint = vec4((uv.x * c + uv.y * s) * size, 0.0,\n'+'                               (uv.x * s - uv.y * c) * size, 1.0);\n'+'  vec3 center = velocity * localTime +\n'+'                  acceleration * localTime * localTime + \n'+'                  position;\n'+'  \n'+'      vec4 q2 = orientation + orientation;\n'+'      vec4 qx = orientation.xxxw * q2.xyzx;\n'+'      vec4 qy = orientation.xyyw * q2.xyzy;\n'+'      vec4 qz = orientation.xxzw * q2.xxzz;\n'+'  \n'+'      mat4 localMatrix = mat4(\n'+'        (1.0 - qy.y) - qz.z, \n'+'        qx.y + qz.w, \n'+'        qx.z - qy.w,\n'+'        0,\n'+'  \n'+'        qx.y - qz.w, \n'+'        (1.0 - qx.x) - qz.z, \n'+'        qy.z + qx.w,\n'+'        0,\n'+'  \n'+'        qx.z + qy.w, \n'+'        qy.z - qx.w, \n'+'        (1.0 - qx.x) - qy.y,\n'+'        0,\n'+'  \n'+'        center.x, center.y, center.z, 1.0);\n'+'  rotatedPoint = localMatrix * rotatedPoint;\n'+'  gl_Position = worldViewProjection * rotatedPoint;\n'+'  v_percentLife = percentLife;\n'+'}\n'+'\n'+'// #o3d SplitMarker\n'+'\n'+'varying vec4 v_position;\n'+'varying vec2 v_texcoord;\n'+'varying float v_percentLife;\n'+'varying vec4 v_colorMult;\n'+'\n'+'// We need to implement 1D!\n'+'uniform sampler2D rampSampler;\n'+'uniform sampler2D colorSampler;\n'+'\n'+'void main() {\n'+'  vec4 colorMult = texture2D(rampSampler, \n'+'      vec2(v_percentLife, 0.5)) * v_colorMult;\n'+'  vec4 color = texture2D(colorSampler, v_texcoord) * colorMult;\n'+'  gl_FragColor = color;\n'+'}\n'+'\n'+'// #o3d MatrixLoadOrder RowMajor\n'},{name:'particle2d',fxString:''+'uniform mat4 viewProjection;\n'+'uniform mat4 world;\n'+'uniform mat4 viewInverse;\n'+'uniform vec3 worldVelocity;\n'+'uniform vec3 worldAcceleration;\n'+'uniform float timeRange;\n'+'uniform float time;\n'+'uniform float timeOffset;\n'+'uniform float frameDuration;\n'+'uniform float numFrames;\n'+'\n'+'attribute vec4 position; // uv, lifeTime, frameStart\n'+'attribute vec4 texCoord0; // position.xyz, startTime\n'+'attribute vec4 texCoord1; // velocity.xyz, startSize\n'+'attribute vec4 texCoord2; // acceleration.xyz, endSize\n'+'attribute vec4 texCoord3; // spinStart.x, spinSpeed.y\n'+'attribute vec4 color; //\n'+'\n'+'varying vec4 v_position;\n'+'varying vec2 v_texcoord;\n'+'varying float v_percentLife;\n'+'varying vec4 v_colorMult;\n'+'\n'+'void main() {\n'+'  vec4 uvLifeTimeFrameStart = position;\n'+'  vec4 positionStartTime = texCoord0;\n'+'  vec4 velocityStartSize = texCoord1;\n'+'  vec4 accelerationEndSize = texCoord2;\n'+'  vec4 spinStartSpinSpeed = texCoord3;\n'+'  vec4 colorMult = color;\n'+'  vec2 uv = uvLifeTimeFrameStart.xy;\n'+'  float lifeTime = uvLifeTimeFrameStart.z;\n'+'  float frameStart = uvLifeTimeFrameStart.w;\n'+'  vec3 position = (world * vec4(positionStartTime.xyz, 1.0)).xyz;\n'+'  float startTime = positionStartTime.w;\n'+'  vec3 velocity = (world * vec4(velocityStartSize.xyz, 0)).xyz \n'+'      + worldVelocity;\n'+'  float startSize = velocityStartSize.w;\n'+'  vec3 acceleration = (world *\n'+'      vec4(accelerationEndSize.xyz, 0)).xyz + worldAcceleration;\n'+'  float endSize = accelerationEndSize.w;\n'+'  float spinStart = spinStartSpinSpeed.x;\n'+'  float spinSpeed = spinStartSpinSpeed.y;\n'+'\n'+'  float localTime = mod((time - timeOffset - startTime),\n'+'      timeRange);\n'+'  float percentLife = localTime / lifeTime;\n'+'\n'+'  float frame = mod(floor(localTime / frameDuration + frameStart),\n'+'                     numFrames);\n'+'  float uOffset = frame / numFrames;\n'+'  float u = uOffset + (uv.x + 0.5) * (1.0 / numFrames);\n'+'\n'+'  v_texcoord = vec2(u, uv.y + 0.5);\n'+'  v_colorMult = colorMult;\n'+'\n'+'  vec3 basisX = viewInverse[0].xyz;\n'+'  vec3 basisZ = viewInverse[1].xyz;\n'+'\n'+'  float size = mix(startSize, endSize, percentLife);\n'+'  size = (percentLife < 0.0 || percentLife > 1.0) ? 0.0 : size;\n'+'  float s = sin(spinStart + spinSpeed * localTime);\n'+'  float c = cos(spinStart + spinSpeed * localTime);\n'+'\n'+'  vec2 rotatedPoint = vec2(uv.x * c + uv.y * s, \n'+'                               -uv.x * s + uv.y * c);\n'+'  vec3 localPosition = vec3(basisX * rotatedPoint.x +\n'+'                                basisZ * rotatedPoint.y) * size +\n'+'                         velocity * localTime +\n'+'                         acceleration * localTime * localTime + \n'+'                         position;\n'+'\n'+'  gl_Position = (viewProjection * vec4(localPosition, 1.0));\n'+'  v_percentLife = percentLife;\n'+'}\n'+'\n'+'// #o3d SplitMarker\n'+'\n'+'varying vec4 v_position;\n'+'varying vec2 v_texcoord;\n'+'varying float v_percentLife;\n'+'varying vec4 v_colorMult;\n'+'\n'+'// We need to implement 1D!\n'+'uniform sampler2D rampSampler;\n'+'uniform sampler2D colorSampler;\n'+'\n'+'void main() {\n'+'  vec4 colorMult = texture2D(rampSampler, \n'+'      vec2(v_percentLife, 0.5)) * v_colorMult;\n'+'  vec4 color = texture2D(colorSampler, v_texcoord) * colorMult;\n'+'  gl_FragColor = color;\n'+'}\n'+'\n'+'// #o3d MatrixLoadOrder RowMajor\n'}];o3djs.particles.useCorrectShaders_=function(){o3djs.particles.FX_STRINGS=o3djs.particles.FX_STRINGS_CG;if(o3djs.effect.LANGUAGE=='glsl'){o3djs.particles.FX_STRINGS=o3djs.particles.FX_STRINGS_GLSL;}};o3djs.particles.CORNERS_=[[-0.5,-0.5],[+0.5,-0.5],[+0.5,+0.5],[-0.5,+0.5]];o3djs.particles.createParticleSystem=function(pack,viewInfo,opt_clockParam,opt_randomFunction){return new o3djs.particles.ParticleSystem(pack,viewInfo,opt_clockParam,opt_randomFunction);};o3djs.particles.ParticleSystem=function(pack,viewInfo,opt_clockParam,opt_randomFunction){var o3d=o3djs.base.o3d;var particleStates=[];var effects=[];o3djs.particles.useCorrectShaders_();for(var ee=0;ee<o3djs.particles.FX_STRINGS.length;++ee){var info=o3djs.particles.FX_STRINGS[ee];var effect=pack.createObject('Effect');effect.name=info.name;effect.loadFromFXString(info.fxString);effects.push(effect);}
var stateInfos={};stateInfos[o3djs.particles.ParticleStateIds.BLEND]={'SourceBlendFunction':o3djs.base.o3d.State.BLENDFUNC_SOURCE_ALPHA,'DestinationBlendFunction':o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA};stateInfos[o3djs.particles.ParticleStateIds.ADD]={'SourceBlendFunction':o3djs.base.o3d.State.BLENDFUNC_SOURCE_ALPHA,'DestinationBlendFunction':o3djs.base.o3d.State.BLENDFUNC_ONE};stateInfos[o3djs.particles.ParticleStateIds.BLEND_PREMULTIPLY]={'SourceBlendFunction':o3djs.base.o3d.State.BLENDFUNC_ONE,'DestinationBlendFunction':o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA};stateInfos[o3djs.particles.ParticleStateIds.BLEND_NO_ALPHA]={'SourceBlendFunction':o3djs.base.o3d.State.BLENDFUNC_SOURCE_COLOR,'DestinationBlendFunction':o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_COLOR};stateInfos[o3djs.particles.ParticleStateIds.SUBTRACT]={'SourceBlendFunction':o3djs.base.o3d.State.BLENDFUNC_SOURCE_ALPHA,'DestinationBlendFunction':o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_ALPHA,'BlendEquation':o3djs.base.o3d.State.BLEND_REVERSE_SUBTRACT};stateInfos[o3djs.particles.ParticleStateIds.INVERSE]={'SourceBlendFunction':o3djs.base.o3d.State.BLENDFUNC_INVERSE_DESTINATION_COLOR,'DestinationBlendFunction':o3djs.base.o3d.State.BLENDFUNC_INVERSE_SOURCE_COLOR};for(var key in o3djs.particles.ParticleStateIds){var state=pack.createObject('State');var id=o3djs.particles.ParticleStateIds[key];particleStates[id]=state;state.getStateParam('ZWriteEnable').value=false;state.getStateParam('CullMode').value=o3d.State.CULL_NONE;var info=stateInfos[id];for(var stateName in info){state.getStateParam(stateName).value=info[stateName];}}
var colorTexture=pack.createTexture2D(8,8,o3d.Texture.ARGB8,1,false);var pixelBase=[0,0.20,0.70,1,0.70,0.20,0,0];var pixels=[];for(var yy=0;yy<8;++yy){for(var xx=0;xx<8;++xx){var pixel=pixelBase[xx]*pixelBase[yy];pixels.push(pixel,pixel,pixel,pixel);}}
colorTexture.set(0,pixels);var rampTexture=pack.createTexture2D(3,1,o3d.Texture.ARGB8,1,false);rampTexture.set(0,[1,1,1,1,1,1,1,0.5,1,1,1,0]);if(!opt_clockParam){this.counter_=pack.createObject('SecondCounter');opt_clockParam=this.counter_.getParam('count');}
this.randomFunction_=opt_randomFunction||function(){return Math.random();};this.particleStates=particleStates;this.clockParam=opt_clockParam;this.pack=pack;this.viewInfo=viewInfo;this.effects=effects;this.defaultColorTexture=colorTexture;this.defaultRampTexture=rampTexture;};o3djs.particles.ParticleSpec=function(){this.numParticles=1;this.numFrames=1;this.frameDuration=1;this.frameStart=0;this.frameStartRange=0;this.timeRange=99999999;this.startTime=null;this.lifeTime=1;this.lifeTimeRange=0;this.startSize=1;this.startSizeRange=0;this.endSize=1;this.endSizeRange=0;this.position=[0,0,0];this.positionRange=[0,0,0];this.velocity=[0,0,0];this.velocityRange=[0,0,0];this.acceleration=[0,0,0];this.accelerationRange=[0,0,0];this.spinStart=0;this.spinStartRange=0;this.spinSpeed=0;this.spinSpeedRange=0;this.colorMult=[1,1,1,1];this.colorMultRange=[0,0,0,0];this.worldVelocity=[0,0,0];this.worldAcceleration=[0,0,0];this.billboard=true;this.orientation=[0,0,0,1];};o3djs.particles.ParticleSystem.prototype.createParticleEmitter=function(opt_texture,opt_clockParam){return new o3djs.particles.ParticleEmitter(this,opt_texture,opt_clockParam);};o3djs.particles.ParticleSystem.prototype.createTrail=function(parent,maxParticles,parameters,opt_texture,opt_perParticleParamSetter,opt_clockParam){return new o3djs.particles.Trail(this,parent,maxParticles,parameters,opt_texture,opt_perParticleParamSetter,opt_clockParam);};o3djs.particles.ParticleEmitter=function(particleSystem,opt_texture,opt_clockParam){opt_clockParam=opt_clockParam||particleSystem.clockParam;var o3d=o3djs.base.o3d;var pack=particleSystem.pack;var viewInfo=particleSystem.viewInfo;var material=pack.createObject('Material');material.name='particles';material.drawList=viewInfo.zOrderedDrawList;material.effect=particleSystem.effects[1];particleSystem.effects[1].createUniformParameters(material);material.getParam('time').bind(opt_clockParam);var rampSampler=pack.createObject('Sampler');rampSampler.texture=particleSystem.defaultRampTexture;rampSampler.addressModeU=o3d.Sampler.CLAMP;var colorSampler=pack.createObject('Sampler');colorSampler.texture=opt_texture||particleSystem.defaultColorTexture;colorSampler.addressModeU=o3d.Sampler.CLAMP;colorSampler.addressModeV=o3d.Sampler.CLAMP;material.getParam('rampSampler').value=rampSampler;material.getParam('colorSampler').value=colorSampler;var vertexBuffer=pack.createObject('VertexBuffer');var uvLifeTimeFrameStartField=vertexBuffer.createField('FloatField',4);var positionStartTimeField=vertexBuffer.createField('FloatField',4);var velocityStartSizeField=vertexBuffer.createField('FloatField',4);var accelerationEndSizeField=vertexBuffer.createField('FloatField',4);var spinStartSpinSpeedField=vertexBuffer.createField('FloatField',4);var orientationField=vertexBuffer.createField('FloatField',4);var colorMultField=vertexBuffer.createField('FloatField',4);var indexBuffer=pack.createObject('IndexBuffer');var streamBank=pack.createObject('StreamBank');streamBank.setVertexStream(o3d.Stream.POSITION,0,uvLifeTimeFrameStartField,0);streamBank.setVertexStream(o3d.Stream.TEXCOORD,0,positionStartTimeField,0);streamBank.setVertexStream(o3d.Stream.TEXCOORD,1,velocityStartSizeField,0);streamBank.setVertexStream(o3d.Stream.TEXCOORD,2,accelerationEndSizeField,0);streamBank.setVertexStream(o3d.Stream.TEXCOORD,3,spinStartSpinSpeedField,0);streamBank.setVertexStream(o3d.Stream.TEXCOORD,4,orientationField,0);streamBank.setVertexStream(o3d.Stream.COLOR,0,colorMultField,0);var shape=pack.createObject('Shape');var primitive=pack.createObject('Primitive');primitive.material=material;primitive.owner=shape;primitive.streamBank=streamBank;primitive.indexBuffer=indexBuffer;primitive.primitiveType=o3d.Primitive.TRIANGLELIST;primitive.createDrawElement(pack,null);this.vertexBuffer_=vertexBuffer;this.uvLifeTimeFrameStartField_=uvLifeTimeFrameStartField;this.positionStartTimeField_=positionStartTimeField;this.velocityStartSizeField_=velocityStartSizeField;this.accelerationEndSizeField_=accelerationEndSizeField;this.spinStartSpinSpeedField_=spinStartSpinSpeedField;this.orientationField_=orientationField;this.colorMultField_=colorMultField;this.indexBuffer_=indexBuffer;this.streamBank_=streamBank;this.primitive_=primitive;this.rampSampler_=rampSampler;this.rampTexture_=particleSystem.defaultRampTexture;this.colorSampler_=colorSampler;this.particleSystem=particleSystem;this.shape=shape;this.material=material;this.clockParam=opt_clockParam;};o3djs.particles.ParticleEmitter.prototype.setState=function(stateId){this.material.state=this.particleSystem.particleStates[stateId];};o3djs.particles.ParticleEmitter.prototype.setColorRamp=function(colorRamp){var width=colorRamp.length/4;if(width%1!=0){throw'colorRamp must have multiple of 4 entries';}
if(this.rampTexture_==this.particleSystem.defaultRampTexture){this.rampTexture_=null;}
if(this.rampTexture_&&this.rampTexture_.width!=width){this.particleSystem.pack.removeObject(this.rampTexture_);this.rampTexture_=null;}
if(!this.rampTexture_){this.rampTexture_=this.particleSystem.pack.createTexture2D(width,1,o3djs.base.o3d.Texture.ARGB8,1,false);}
this.rampTexture_.set(0,colorRamp);this.rampSampler_.texture=this.rampTexture_;};o3djs.particles.ParticleEmitter.prototype.validateParameters=function(parameters){var defaults=new o3djs.particles.ParticleSpec();for(var key in parameters){if(typeof defaults[key]==='undefined'){throw'unknown particle parameter "'+key+'"';}}
for(var key in defaults){if(typeof parameters[key]==='undefined'){parameters[key]=defaults[key];}}};o3djs.particles.ParticleEmitter.prototype.createParticles_=function(firstParticleIndex,numParticles,parameters,opt_perParticleParamSetter){var uvLifeTimeFrameStart=this.uvLifeTimeFrameStart_;var positionStartTime=this.positionStartTime_;var velocityStartSize=this.velocityStartSize_;var accelerationEndSize=this.accelerationEndSize_;var spinStartSpinSpeed=this.spinStartSpinSpeed_;var orientation=this.orientation_;var colorMults=this.colorMults_;this.material.effect=this.particleSystem.effects[parameters.billboard?1:0];this.material.getParam('timeRange').value=parameters.timeRange;this.material.getParam('numFrames').value=parameters.numFrames;this.material.getParam('frameDuration').value=parameters.frameDuration;this.material.getParam('worldVelocity').value=parameters.worldVelocity;this.material.getParam('worldAcceleration').value=parameters.worldAcceleration;var random=this.particleSystem.randomFunction_;var plusMinus=function(range){return(random()-0.5)*range*2;};var plusMinusVector=function(range){var v=[];for(var ii=0;ii<range.length;++ii){v.push(plusMinus(range[ii]));}
return v;};for(var ii=0;ii<numParticles;++ii){if(opt_perParticleParamSetter){opt_perParticleParamSetter(ii,parameters);}
var pLifeTime=parameters.lifeTime;var pStartTime=(parameters.startTime===null)?(ii*parameters.lifeTime/numParticles):parameters.startTime;var pFrameStart=parameters.frameStart+plusMinus(parameters.frameStartRange);var pPosition=o3djs.math.addVector(parameters.position,plusMinusVector(parameters.positionRange));var pVelocity=o3djs.math.addVector(parameters.velocity,plusMinusVector(parameters.velocityRange));var pAcceleration=o3djs.math.addVector(parameters.acceleration,plusMinusVector(parameters.accelerationRange));var pColorMult=o3djs.math.addVector(parameters.colorMult,plusMinusVector(parameters.colorMultRange));var pSpinStart=parameters.spinStart+plusMinus(parameters.spinStartRange);var pSpinSpeed=parameters.spinSpeed+plusMinus(parameters.spinSpeedRange);var pStartSize=parameters.startSize+plusMinus(parameters.startSizeRange);var pEndSize=parameters.endSize+plusMinus(parameters.endSizeRange);var pOrientation=parameters.orientation;for(var jj=0;jj<4;++jj){var offset0=(ii*4+jj)*4;var offset1=offset0+1;var offset2=offset0+2;var offset3=offset0+3;uvLifeTimeFrameStart[offset0]=o3djs.particles.CORNERS_[jj][0];uvLifeTimeFrameStart[offset1]=o3djs.particles.CORNERS_[jj][1];uvLifeTimeFrameStart[offset2]=pLifeTime;uvLifeTimeFrameStart[offset3]=pFrameStart;positionStartTime[offset0]=pPosition[0];positionStartTime[offset1]=pPosition[1];positionStartTime[offset2]=pPosition[2];positionStartTime[offset3]=pStartTime;velocityStartSize[offset0]=pVelocity[0];velocityStartSize[offset1]=pVelocity[1];velocityStartSize[offset2]=pVelocity[2];velocityStartSize[offset3]=pStartSize;accelerationEndSize[offset0]=pAcceleration[0];accelerationEndSize[offset1]=pAcceleration[1];accelerationEndSize[offset2]=pAcceleration[2];accelerationEndSize[offset3]=pEndSize;spinStartSpinSpeed[offset0]=pSpinStart;spinStartSpinSpeed[offset1]=pSpinSpeed;spinStartSpinSpeed[offset2]=0;spinStartSpinSpeed[offset3]=0;orientation[offset0]=pOrientation[0];orientation[offset1]=pOrientation[1];orientation[offset2]=pOrientation[2];orientation[offset3]=pOrientation[3];colorMults[offset0]=pColorMult[0];colorMults[offset1]=pColorMult[1];colorMults[offset2]=pColorMult[2];colorMults[offset3]=pColorMult[3];}}
firstParticleIndex*=4;this.uvLifeTimeFrameStartField_.setAt(firstParticleIndex,uvLifeTimeFrameStart);this.positionStartTimeField_.setAt(firstParticleIndex,positionStartTime);this.velocityStartSizeField_.setAt(firstParticleIndex,velocityStartSize);this.accelerationEndSizeField_.setAt(firstParticleIndex,accelerationEndSize);this.spinStartSpinSpeedField_.setAt(firstParticleIndex,spinStartSpinSpeed);this.orientationField_.setAt(firstParticleIndex,orientation);this.colorMultField_.setAt(firstParticleIndex,colorMults);};o3djs.particles.ParticleEmitter.prototype.allocateParticles_=function(numParticles){if(this.vertexBuffer_.numElements!=numParticles*4){this.vertexBuffer_.allocateElements(numParticles*4);var indices=[];for(var ii=0;ii<numParticles;++ii){var startIndex=ii*4
indices.push(startIndex+0,startIndex+1,startIndex+2);indices.push(startIndex+0,startIndex+2,startIndex+3);}
this.indexBuffer_.set(indices);this.uvLifeTimeFrameStart_=[];this.positionStartTime_=[];this.velocityStartSize_=[];this.accelerationEndSize_=[];this.spinStartSpinSpeed_=[];this.orientation_=[];this.colorMults_=[];}
this.primitive_.numberPrimitives=numParticles*2;this.primitive_.numberVertices=numParticles*4;};o3djs.particles.ParticleEmitter.prototype.setParameters=function(parameters,opt_perParticleParamSetter){this.validateParameters(parameters);var numParticles=parameters.numParticles;this.allocateParticles_(numParticles);this.createParticles_(0,numParticles,parameters,opt_perParticleParamSetter);};o3djs.particles.ParticleEmitter.prototype.createOneShot=function(opt_parent){return new o3djs.particles.OneShot(this,opt_parent);};o3djs.particles.OneShot=function(emitter,opt_parent){var pack=emitter.particleSystem.pack;this.emitter_=emitter;this.transform=pack.createObject('Transform');this.transform.visible=false;this.transform.addShape(emitter.shape);this.timeOffsetParam_=this.transform.createParam('timeOffset','ParamFloat');if(opt_parent){this.setParent(opt_parent);}};o3djs.particles.OneShot.prototype.setParent=function(parent){this.transform.parent=parent;};o3djs.particles.OneShot.prototype.trigger=function(opt_position,opt_parent){if(opt_parent){this.setParent(opt_parent);}
if(opt_position){this.transform.identity();this.transform.translate(opt_position);}
this.transform.visible=true;this.timeOffsetParam_.value=this.emitter_.clockParam.value;};o3djs.particles.Trail=function(particleSystem,parent,maxParticles,parameters,opt_texture,opt_perParticleParamSetter,opt_clockParam){o3djs.particles.ParticleEmitter.call(this,particleSystem,opt_texture,opt_clockParam);var pack=particleSystem.pack;this.allocateParticles_(maxParticles);this.validateParameters(parameters);this.parameters=parameters;this.perParticleParamSetter=opt_perParticleParamSetter;this.birthIndex_=0;this.maxParticles_=maxParticles;this.transform=pack.createObject('Transform');this.transform.addShape(this.shape);this.transform.parent=parent;};o3djs.base.inherit(o3djs.particles.Trail,o3djs.particles.ParticleEmitter);o3djs.particles.Trail.prototype.birthParticles=function(position){var numParticles=this.parameters.numParticles;this.parameters.startTime=this.clockParam.value;this.parameters.position=position;while(this.birthIndex_+numParticles>=this.maxParticles_){var numParticlesToEnd=this.maxParticles_-this.birthIndex_;this.createParticles_(this.birthIndex_,numParticlesToEnd,this.parameters,this.perParticleParamSetter);numParticles-=numParticlesToEnd;this.birthIndex_=0;}
this.createParticles_(this.birthIndex_,numParticles,this.parameters,this.perParticleParamSetter);this.birthIndex_+=numParticles;};o3djs.performance=o3djs.performance||{};o3djs.performance.createPerformanceMonitor=function(targetFPSMin,targetFPSMax,increaseQuality,decreaseQuality,opt_options){return new o3djs.performance.PerformanceMonitor(targetFPSMin,targetFPSMax,increaseQuality,decreaseQuality,opt_options);};o3djs.performance.PerformanceMonitor=function(targetFPSMin,targetFPSMax,increaseQuality,decreaseQuality,opt_options){opt_options=opt_options||{};this.increaseQuality=increaseQuality;this.decreaseQuality=decreaseQuality;this.meanFrameTime=0;this.sampleCount=0;this.minSamples=opt_options.opt_minSamples||60;this.damping=opt_options.opt_damping||120;this.delayCycles=opt_options.opt_delayCycles||2*this.minSamples;this.targetFrameTimeMax_=1/targetFPSMin;this.targetFrameTimeMin_=1/targetFPSMax;this.scaleInput_=1/this.minSamples;this.scaleMean_=1;this.delayCyclesLeft_=0;if(this.damping<this.minSamples){throw Error('Damping must be at least minSamples.');}};o3djs.performance.PerformanceMonitor.Options=goog.typedef;o3djs.performance.PerformanceMonitor.prototype.onRender=function(seconds){var test=true;if(this.sampleCount<this.damping){if(this.sampleCount>=this.minSamples){this.scaleInput_=1/(this.sampleCount+1);this.scaleMean_=this.sampleCount*this.scaleInput_;}else{test=false;}
this.sampleCount+=1;}
this.meanFrameTime=this.meanFrameTime*this.scaleMean_+
seconds*this.scaleInput_;if(this.delayCyclesLeft_>0){this.delayCyclesLeft_-=1;}else if(test){if(this.meanFrameTime<this.targetFrameTimeMin_){this.increaseQuality();this.delayCyclesLeft_=this.delayCycles;}else if(this.meanFrameTime>this.targetFrameTimeMax_){this.decreaseQuality();this.delayCyclesLeft_=this.delayCycles;}}};o3djs.simple=o3djs.simple||{};o3djs.simple.create=function(clientObject){return new o3djs.simple.SimpleInfo(clientObject);};o3djs.simple.SimpleInfo=function(clientObject){this.clientObject=clientObject;this.o3d=clientObject.o3d;this.client=clientObject.client;this.pack=this.client.createPack();this.root=this.pack.createObject('Transform');this.viewInfo=o3djs.rendergraph.createBasicView(this.pack,this.root,this.client.renderGraphRoot);this.updateObjects_={};this.nextId_=1;var material=this.pack.createObject('Material');o3djs.effect.attachStandardShader(this.pack,material,[0,0,0],'phong');this.nonTexturedEffect_=material.effect;this.pack.removeObject(material);var material=this.pack.createObject('Material');var samplerParam=material.createParam('diffuseSampler','ParamSampler');o3djs.effect.attachStandardShader(this.pack,material,[0,0,0],'phong');this.texturedEffect_=material.effect;this.pack.removeObject(material);this.globalParamObject=this.pack.createObject('ParamObject');this.lightWorldPosParam=this.globalParamObject.createParam('lightWorldPos','ParamFloat3');this.lightColorParam=this.globalParamObject.createParam('lightColor','ParamFloat4');this.setLightColor(1,1,1,1);this.setLightPosition(255,150,150);this.zNear=0.1;this.zFar=1000;this.fieldOfView=o3djs.math.degToRad(45);this.setPerspectiveMatrix_();this.cameraPosition=[250,150,150];this.cameraTarget=[0,0,0];this.cameraUp=[0,1,0];this.setViewMatrix_();var that=this;this.client.setRenderCallback(function(renderEvent){var elapsedTime=Math.min(renderEvent.elapsedTime,0.1);that.onRender_(elapsedTime);});};o3djs.simple.SimpleInfo.prototype.getNextId=function(){return this.nextId_++;};o3djs.simple.SimpleInfo.prototype.createSimpleShape=function(shape){shape.createDrawElements(this.pack,null);var transform=this.pack.createObject('Transform');transform.parent=this.root;transform.addShape(shape);return new o3djs.simple.SimpleShape(this,transform);};o3djs.simple.SimpleInfo.prototype.onRender_=function(elapsedTime){for(var sid in this.updateObjects_){var id=(sid);this.updateObjects_[id].onUpdate(elapsedTime);}};o3djs.simple.SimpleInfo.prototype.registerObjectForUpdate=function(simpleObject){this.updateObjects_[simpleObject.id]=simpleObject;};o3djs.simple.SimpleInfo.prototype.unregisterObjectForUpdate=function(simpleObject){delete this.updateObjects_[simpleObject.id];};o3djs.simple.SimpleInfo.prototype.setPerspectiveMatrix_=function(){this.viewInfo.drawContext.projection=o3djs.math.matrix4.perspective(this.fieldOfView,this.client.width/this.client.height,this.zNear,this.zFar);};o3djs.simple.SimpleInfo.prototype.setViewMatrix_=function(){this.viewInfo.drawContext.view=o3djs.math.matrix4.lookAt(this.cameraPosition,this.cameraTarget,this.cameraUp);};o3djs.simple.SimpleInfo.prototype.setFieldOfView=function(fieldOfView){this.fieldOfView=fieldOfView;this.setPerspectiveMatrix_();};o3djs.simple.SimpleInfo.prototype.setZClip=function(zNear,zFar){this.zNear=zNear;this.zFar=zFar;this.setPerspectiveMatrix_();};o3djs.simple.SimpleInfo.prototype.setLightPosition=function(x,y,z){this.lightWorldPosParam.set(x,y,z);};o3djs.simple.SimpleInfo.prototype.setLightColor=function(r,g,b,a){this.lightColorParam.set(r,g,b,a);};o3djs.simple.SimpleInfo.prototype.setCameraPosition=function(x,y,z){this.cameraPosition=[x,y,z];this.setViewMatrix_();};o3djs.simple.SimpleInfo.prototype.setCameraTarget=function(x,y,z){this.cameraTarget=[x,y,z];this.setViewMatrix_();};o3djs.simple.SimpleInfo.prototype.setCameraUp=function(x,y,z){this.cameraUp=[x,y,z];this.setViewMatrix_();};o3djs.simple.SimpleInfo.prototype.createMaterialFromEffect=function(effect){var material=this.pack.createObject('Material');material.drawList=this.viewInfo.performanceDrawList;material.effect=effect;effect.createUniformParameters(material);material.getParam('lightWorldPos').bind(this.lightWorldPosParam);material.getParam('lightColor').bind(this.lightColorParam);return material;};o3djs.simple.SimpleInfo.prototype.createNonTexturedMaterial=function(type){var material=this.createMaterialFromEffect(this.nonTexturedEffect_);material.getParam('diffuse').set(1,1,1,1);material.getParam('emissive').set(0,0,0,1);material.getParam('ambient').set(0,0,0,1);material.getParam('specular').set(1,1,1,1);material.getParam('shininess').value=20;return material;};o3djs.simple.SimpleInfo.prototype.createTexturedMaterial=function(type){var material=this.createMaterialFromEffect(this.texturedEffect_);var samplerParam=material.getParam('diffuseSampler');var sampler=this.pack.createObject('Sampler');samplerParam.value=sampler;return material;};o3djs.simple.SimpleInfo.prototype.createCube=function(size){var material=this.createNonTexturedMaterial('phong');var shape=o3djs.primitives.createCube(this.pack,material,size);return this.createSimpleShape(shape);};o3djs.simple.SimpleInfo.prototype.createBox=function(width,height,depth){var material=this.createNonTexturedMaterial('phong');var shape=o3djs.primitives.createBox(this.pack,material,width,height,depth);return this.createSimpleShape(shape);};o3djs.simple.SimpleInfo.prototype.createSphere=function(radius,smoothness){var material=this.createNonTexturedMaterial('phong');var shape=o3djs.primitives.createSphere(this.pack,material,radius,smoothness*2,smoothness);return this.createSimpleShape(shape);};o3djs.simple.SimpleInfo.prototype.loadScene=function(url,callback){var pack=this.client.createPack();var root=pack.createObject('Transform');var paramObject=pack.createObject('ParamObject');var animTimeParam=paramObject.createParam('animTime','ParamFloat');var that=this;var prepScene=function(pack,root,exception){var simpleScene=null;if(exception){pack.destroy();}else{simpleScene=new o3djs.simple.SimpleScene(that,url,pack,root,paramObject);}
callback(simpleScene,exception);};return o3djs.scene.loadScene(this.client,pack,root,url,prepScene,({opt_animSource:animTimeParam}));};o3djs.simple.SimpleInfo.prototype.viewAll=function(){var bbox=o3djs.util.getBoundingBoxOfTree(this.root);var target=o3djs.math.lerpVector(bbox.minExtent,bbox.maxExtent,0.5);this.setCameraTarget(target[0],target[1],target[2]);var diag=o3djs.math.distance(bbox.minExtent,bbox.maxExtent);var eye=o3djs.math.addVector(target,[bbox.maxExtent[0],bbox.minExtent[1]+0.5*diag,bbox.maxExtent[2]]);this.setCameraPosition(eye[0],eye[1],eye[2]);this.setZClip(diag/1000,diag*10);};o3djs.simple.SimpleObject=function(){};o3djs.simple.SimpleObject.prototype.init=function(simpleInfo,transform){this.simpleInfo=simpleInfo;this.id=simpleInfo.getNextId();this.transform=transform;this.updateCallback_=null;this.pickCallback_=null;};o3djs.simple.SimpleObject.prototype.onPicked=function(onPickedCallback){throw'not implemented';};o3djs.simple.SimpleObject.prototype.onUpdate=function(elapsedTime){if(this.updateCallback_){this.updateCallback_(elapsedTime);}};o3djs.simple.SimpleObject.prototype.setOnUpdate=function(onUpdateCallback){if(onUpdateCallback){this.simpleInfo.registerObjectForUpdate(this);}else{this.simpleInfo.unregisterObjectForUpdate(this);}
var oldCallback=this.updateCallback_;this.updateCallback_=onUpdateCallback;return oldCallback;};o3djs.simple.SimpleShape=function(simpleInfo,transform){this.init(simpleInfo,transform);};o3djs.simple.SimpleShape.prototype=new o3djs.simple.SimpleObject();o3djs.simple.SimpleShape.prototype.getMaterial=function(){return this.transform.shapes[0].elements[0].material;};o3djs.simple.SimpleShape.prototype.setMaterial=function(material){var old_material=this.getMaterial();if(old_material!=null){this.simpleInfo.pack.removeObject(old_material);}
this.transform.shapes[0].elements[0].material=material;};o3djs.simple.SimpleShape.prototype.setDiffuseColor=function(r,g,b,a){var material=this.getMaterial();material.getParam('diffuse').set(r,g,b,a);if(a<1){material.drawList=this.simpleInfo.viewInfo.zOrderedDrawList;}else{material.drawList=this.simpleInfo.viewInfo.performanceDrawList;}};o3djs.simple.SimpleShape.prototype.getTexture=function(){var material=this.getMaterial();var samplerParam=material.getParam('diffuseSampler');if(samplerParam.className=='o3d.ParamSampler'){return samplerParam.texture;}
return null;};o3djs.simple.SimpleShape.prototype.loadTexture=function(url){var that=this;o3djs.io.loadTexture(this.simpleInfo.pack,url,function(texture,exception){if(!exception){var material=that.getMaterial();if(material.effect!=that.simpleInfo.texturedEffect_){var new_material=that.simpleInfo.createTexturedMaterial('phong');new_material.copyParams(material);new_material.effect=that.simpleInfo.texturedEffect_;that.setMaterial(new_material);material=new_material;}
var samplerParam=material.getParam('diffuseSampler');samplerParam.value.texture=texture;}else{alert('Load texture file returned failure. \n'+exception);}});};o3djs.simple.SimpleScene=function(simpleInfo,url,pack,root,paramObject){this.init(simpleInfo,root);this.url=url;this.pack=pack;this.paramObject=paramObject;this.animTimeParam=paramObject.getParam('animTime');o3djs.pack.preparePack(pack,simpleInfo.viewInfo);this.cameraInfos_=o3djs.camera.getCameraInfos(root,simpleInfo.client.width,simpleInfo.client.height);var bindParam=function(paramObject,paramName,sourceParam){var param=paramObject.getParam(paramName);if(param){param.bind(sourceParam);}}
var materials=pack.getObjectsByClassName('o3d.Material');for(var m=0;m<materials.length;++m){var material=materials[m];bindParam(material,'lightWorldPos',simpleInfo.lightWorldPosParam);bindParam(material,'lightColor',simpleInfo.lightColorParam);}
this.transform.parent=this.simpleInfo.root;};o3djs.simple.SimpleScene.prototype=new o3djs.simple.SimpleObject();o3djs.simple.SimpleScene.prototype.setAnimTime=function(time){this.animTimeParam.value=time;};o3djs.test=o3djs.test||{};o3djs.test.AssertionError=function(message){this.message=message;this.toString=function(){return message;};};o3djs.test.runTests=function(suite,opt_reporter){try{opt_reporter=opt_reporter||o3djs.test.documentReporter;var passCount=0;var failCount=0;for(var propertyName in suite){if(propertyName.substring(0,4)!=='test')
continue;if(typeof(suite[propertyName])!=='function')
continue;try{suite[propertyName]();}catch(e){++failCount;opt_reporter.reportFail(propertyName,String(e));continue;}
++passCount;opt_reporter.reportPass(propertyName);}
opt_reporter.reportSummary(passCount,failCount);return failCount==0;}
catch(e){return false;}};o3djs.test.valueToString_=function(value,opt_depth){if(opt_depth===undefined){opt_depth=3;}
var string;if(typeof(value)==='object'){if(value!==null){if(opt_depth===0){string='?';}else{if(o3djs.base.isArray(value)){var valueAsArray=(value);string='[';var separator='';for(var i=0;i<valueAsArray.length;++i){string+=separator+
o3djs.test.valueToString_(valueAsArray[i],opt_depth-1);separator=', ';}
string+=']';}else{var valueAsObject=(value);string='{';var separator='';for(var propertyName in valueAsObject){if(typeof(valueAsObject[propertyName])!=='function'){string+=separator+propertyName+': '+
o3djs.test.valueToString_(valueAsObject[propertyName],opt_depth-1);separator=', ';}}
string+='}';}}}else{string="null";}}else if(typeof(value)==='string'){string='"'+value+'"';}else{string=String(value);}
return string;};o3djs.test.assertTrue=function(value){if(!value){throw new o3djs.test.AssertionError('assertTrue failed for '+
o3djs.test.valueToString_(value));}};o3djs.test.assertFalse=function(value){if(value){throw new o3djs.test.AssertionError('assertFalse failed for '+
o3djs.test.valueToString_(value));}};o3djs.test.assertNull=function(value){if(value!==null){throw new o3djs.test.AssertionError('assertNull failed for '+
o3djs.test.valueToString_(value));}};o3djs.test.assertEquals=function(expected,actual){if(expected!==actual){throw new o3djs.test.AssertionError('assertEquals failed: expected '+
o3djs.test.valueToString_(expected)+' but got '+
o3djs.test.valueToString_(actual));}};o3djs.test.assertClose=function(expected,actual){if(actual<expected-0.001||actual>expected+0.001){throw new o3djs.test.AssertionError('assertClose failed: expected '+
o3djs.test.valueToString_(expected)+' but got '+
o3djs.test.valueToString_(actual));}};o3djs.test.compareArrays_=function(expected,actual){if(expected.length!==actual.length){return false;}
for(var i=0;i!=expected.length;++i){if(o3djs.base.isArray(expected[i])&&o3djs.base.isArray(actual[i])){var expectedAsArray=(expected[i]);var actualAsArray=(actual[i]);if(!o3djs.test.compareArrays_(expectedAsArray,actualAsArray)){return false;}}else if(expected[i]!==actual[i]){return false;}}
return true;};o3djs.test.assertArrayEquals=function(expected,actual){if(!o3djs.base.isArray(expected)){throw new o3djs.test.AssertionError('assertArrayEquals failed: expected value '+
o3djs.test.valueToString_(expected)+' is not an array');}
if(!o3djs.base.isArray(actual)){throw new o3djs.test.AssertionError('assertArrayEquals failed: actual value '+
o3djs.test.valueToString_(actual)+' is not an array');}
if(!o3djs.test.compareArrays_(expected,actual)){throw new o3djs.test.AssertionError('assertArrayEquals failed: expected '+
o3djs.test.valueToString_(expected)+' but got '+
o3djs.test.valueToString_(actual));}};o3djs.test.createReportParagraph_=function(text,opt_color){var textNode=document.createTextNode(text);var paragraph=document.createElement('p');paragraph.appendChild(textNode);if(opt_color!==undefined){paragraph.style.color=opt_color;}
return paragraph;};o3djs.test.documentReporter={getReportDiv_:function(){if(!this.reportDiv_){this.reportDiv_=document.createElement('div');document.body.appendChild(this.reportDiv_);}
return this.reportDiv_;},reportPass:function(testName){var paragraph=o3djs.test.createReportParagraph_(testName+' : PASS','green');this.getReportDiv_().appendChild(paragraph);},reportFail:function(testName,message){var paragraph=o3djs.test.createReportParagraph_(testName+' : FAIL : '+message,'red');var reportDiv=this.getReportDiv_();reportDiv.insertBefore(paragraph,reportDiv.firstChild);},reportSummary:function(passCount,failCount){var paragraph=o3djs.test.createReportParagraph_(passCount+' passed, '+failCount+' failed','blue');var reportDiv=this.getReportDiv_();reportDiv.insertBefore(paragraph,reportDiv.firstChild);}};o3djs.webgl=o3djs.webgl||{};o3djs.webgl.makeClients=function(callback,opt_features,opt_requiredVersion,opt_failureCallback,opt_id,opt_tag,opt_debug){opt_failureCallback=opt_failureCallback||o3djs.webgl.informPluginFailure;var clientElements=[];var elements=o3djs.util.getO3DContainerElements(opt_id,opt_tag);for(var ee=0;ee<elements.length;++ee){var element=elements[ee];var features=opt_features;if(!features){var o3d_features=element.getAttribute('o3d_features');if(o3d_features){features=o3d_features;}else{features='';}}
var objElem=o3djs.webgl.createClient(element,features,opt_debug);if(!objElem){return;}
clientElements.push(objElem);}
var clearId=window.setInterval(function(){for(var cc=0;cc<clientElements.length;++cc){var element=clientElements[cc];if(!element.sizeInitialized_){return;}}
window.clearInterval(clearId);callback(clientElements);});};o3djs.webgl.createGLErrorWrapper=function(context,fname){return function(){var rv=context[fname].apply(context,arguments);var err=context.getError();if(err!=0){throw"GL error "+err+" in "+fname;}
return rv;};};o3djs.webgl.addDebuggingWrapper=function(context){var wrap={};for(var i in context){if(typeof context[i]=='function'){wrap[i]=o3djs.webgl.createGLErrorWrapper(context,i);}else{wrap[i]=context[i];}}
wrap.getError=function(){return context.getError();};return wrap;};o3djs.webgl.webGlCanvasError=function(parentNode,unavailableElement){var background=document.createElement('div');background.style.backgroundColor='#ccffff';background.style.textAlign='center';background.style.margin='10px';background.style.width='100%';background.style.height='100%';var messageHTML='<br/><br/><a href="http://get.webgl.org">'+'Your browser does not appear to support WebGL.<br/><br/>'+'Check that WebGL is enabled or click here to upgrade your browser:'+'</a><br/>';background.innerHTML=messageHTML;parentNode.appendChild(background);};o3djs.webgl.createClient=function(element,opt_features,opt_debug){opt_features=opt_features||'';opt_debug=opt_debug||false;o3djs.effect.setLanguage('glsl');var canvas;canvas=document.createElement('canvas');if(!canvas||!canvas.getContext){o3djs.webgl.webGlCanvasError(element,'HTMLCanvas');return null;}
canvas.style.width="100%";canvas.style.height="100%";var client=new o3d.Client;var resizeHandler=function(){var width=Math.max(1,canvas.clientWidth);var height=Math.max(1,canvas.clientHeight);canvas.width=width;canvas.height=height;canvas.sizeInitialized_=true;if(client.gl){client.gl.displayInfo={width:canvas.width,height:canvas.height};}};window.addEventListener('resize',resizeHandler,false);setTimeout(resizeHandler,0);if(!client.initWithCanvas(canvas)){o3djs.webgl.webGlCanvasError(element,'WebGL context');return null;}
function returnFalse(){return false;}
document.onselectstart=returnFalse;document.onmousedown=returnFalse;canvas.client=client;canvas.o3d=o3d;if(opt_debug){client.gl=o3djs.webgl.addDebuggingWrapper(client.gl);}
element.appendChild(canvas);return canvas;};;
(function()
{
 "use strict";
 var Global,PoolGame,Code,WebSharper,Operators,Html,Client,Operators$1,Obj,Pool,Pagelet,Tags,AttributeBuilder,Attr,JavaScript,Pervasives,EventTarget,Node,Unchecked,CameraInfo,Arrays,Physics,List,T,TagBuilder,SC$1,o3d,ObjectBase,NamedObjectBase,NamedObject,ParamObject,Texture,Param,WindowOrWorkerGlobalScope,CameraPosition,Object,Ball,Attribute,Implementation,JQueryHtmlProvider,DeprecatedTagBuilder,Wall,BallCollision,WallCollision,Element,RenderNode,SC$2,Element$1,Enumerator,T$1,Seq,IntelliFactory,Runtime,o3djs,webgl,rendergraph,State,math,matrix4,io,primitives,Math,event,texture,Stream,String,quaternions;
 Global=self;
 PoolGame=Global.PoolGame=Global.PoolGame||{};
 Code=PoolGame.Code=PoolGame.Code||{};
 WebSharper=Global.WebSharper=Global.WebSharper||{};
 Operators=WebSharper.Operators=WebSharper.Operators||{};
 Html=WebSharper.Html=WebSharper.Html||{};
 Client=Html.Client=Html.Client||{};
 Operators$1=Client.Operators=Client.Operators||{};
 Obj=WebSharper.Obj=WebSharper.Obj||{};
 Pool=Code.Pool=Code.Pool||{};
 Pagelet=Client.Pagelet=Client.Pagelet||{};
 Tags=Client.Tags=Client.Tags||{};
 AttributeBuilder=Client.AttributeBuilder=Client.AttributeBuilder||{};
 Attr=Client.Attr=Client.Attr||{};
 JavaScript=WebSharper.JavaScript=WebSharper.JavaScript||{};
 Pervasives=JavaScript.Pervasives=JavaScript.Pervasives||{};
 EventTarget=Global.EventTarget;
 Node=Global.Node;
 Unchecked=WebSharper.Unchecked=WebSharper.Unchecked||{};
 CameraInfo=Code.CameraInfo=Code.CameraInfo||{};
 Arrays=WebSharper.Arrays=WebSharper.Arrays||{};
 Physics=Code.Physics=Code.Physics||{};
 List=WebSharper.List=WebSharper.List||{};
 T=List.T=List.T||{};
 TagBuilder=Client.TagBuilder=Client.TagBuilder||{};
 SC$1=Global.StartupCode$WebSharper_Html_Client$Html=Global.StartupCode$WebSharper_Html_Client$Html||{};
 o3d=Global.o3d;
 ObjectBase=o3d&&o3d.ObjectBase;
 NamedObjectBase=o3d&&o3d.NamedObjectBase;
 NamedObject=o3d&&o3d.NamedObject;
 ParamObject=o3d&&o3d.ParamObject;
 Texture=o3d&&o3d.Texture;
 Param=o3d&&o3d.Param;
 WindowOrWorkerGlobalScope=Global.WindowOrWorkerGlobalScope;
 CameraPosition=Code.CameraPosition=Code.CameraPosition||{};
 Object=Global.Object;
 Ball=Code.Ball=Code.Ball||{};
 Attribute=Client.Attribute=Client.Attribute||{};
 Implementation=Client.Implementation=Client.Implementation||{};
 JQueryHtmlProvider=Implementation.JQueryHtmlProvider=Implementation.JQueryHtmlProvider||{};
 DeprecatedTagBuilder=Client.DeprecatedTagBuilder=Client.DeprecatedTagBuilder||{};
 Wall=Code.Wall=Code.Wall||{};
 BallCollision=Code.BallCollision=Code.BallCollision||{};
 WallCollision=Code.WallCollision=Code.WallCollision||{};
 Element=Global.Element;
 RenderNode=o3d&&o3d.RenderNode;
 SC$2=Global.StartupCode$O3D$Client=Global.StartupCode$O3D$Client||{};
 Element$1=Client.Element=Client.Element||{};
 Enumerator=WebSharper.Enumerator=WebSharper.Enumerator||{};
 T$1=Enumerator.T=Enumerator.T||{};
 Seq=WebSharper.Seq=WebSharper.Seq||{};
 IntelliFactory=Global.IntelliFactory;
 Runtime=IntelliFactory&&IntelliFactory.Runtime;
 o3djs=Global.o3djs;
 webgl=o3djs&&o3djs.webgl;
 rendergraph=o3djs&&o3djs.rendergraph;
 State=o3d&&o3d.State;
 math=o3djs&&o3djs.math;
 matrix4=math&&math.matrix4;
 io=o3djs&&o3djs.io;
 primitives=o3djs&&o3djs.primitives;
 Math=Global.Math;
 event=o3djs&&o3djs.event;
 texture=o3djs&&o3djs.texture;
 Stream=o3d&&o3d.Stream;
 String=Global.String;
 quaternions=o3djs&&o3djs.quaternions;
 Code.Main=function()
 {
  var div,a,pool;
  function f(a$1)
  {
   pool.InitClient();
  }
  div=(a=[Attr.Attr().NewAttr("style","width:100%; height: 100%;"),Attr.Attr().NewAttr("id","o3d")],Tags.Tags().NewTag("div",a));
  pool=new Pool.New();
  ((function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(div),div).AppendTo("main"));
 };
 Code.g_tableWidth=function()
 {
  SC$2.$cctor();
  return SC$2.g_tableWidth;
 };
 Code.g_pocketRadius=function()
 {
  SC$2.$cctor();
  return SC$2.g_pocketRadius;
 };
 Code.set_g_centers=function($1)
 {
  SC$2.$cctor();
  SC$2.g_centers=$1;
 };
 Code.set_g_shadowOnParams=function($1)
 {
  SC$2.$cctor();
  SC$2.g_shadowOnParams=$1;
 };
 Code.g_tableThickness=function()
 {
  SC$2.$cctor();
  return SC$2.g_tableThickness;
 };
 Code.g_woodBreadth=function()
 {
  SC$2.$cctor();
  return SC$2.g_woodBreadth;
 };
 Code.g_woodHeight=function()
 {
  SC$2.$cctor();
  return SC$2.g_woodHeight;
 };
 Code.g_ballTransforms=function()
 {
  SC$2.$cctor();
  return SC$2.g_ballTransforms;
 };
 Code.g_clock=function()
 {
  SC$2.$cctor();
  return SC$2.g_clock;
 };
 Code.g_shadowOnParams=function()
 {
  SC$2.$cctor();
  return SC$2.g_shadowOnParams;
 };
 Code.set_g_clock=function($1)
 {
  SC$2.$cctor();
  SC$2.g_clock=$1;
 };
 Code.g_centers=function()
 {
  SC$2.$cctor();
  return SC$2.g_centers;
 };
 Operators.FailWith=function(msg)
 {
  throw new Global.Error(msg);
 };
 Operators$1.OnAfterRender=function(f,w)
 {
  var r;
  r=w.Render;
  w.Render=function()
  {
   r.apply(w);
   f(w);
  };
 };
 Obj=WebSharper.Obj=Runtime.Class({
  Equals:function(obj)
  {
   return this===obj;
  }
 },null,Obj);
 Obj.New=Runtime.Ctor(function()
 {
 },Obj);
 Pool=Code.Pool=Runtime.Class({
  InitClient:function()
  {
   var $this;
   $this=this;
   webgl.makeClients(function(elts)
   {
    return $this.Main(elts);
   });
  },
  Main:function(clientElements)
  {
   this.InitPhysics();
   this.InitGlobals(clientElements);
   this.InitRenderGraph();
   this.UpdateContext();
   this.InitMaterials();
   this.InitShadowPlane();
   this.InitTable();
   this.InitHud();
   this.Rack(8);
   this.SetRenderCallback();
   this.RegisterEventCallbacks();
  },
  InitPhysics:function()
  {
   this.g_physics.InitWalls();
  },
  InitGlobals:function(clientElements)
  {
   this.g_o3dElement=Arrays.get(clientElements,0);
   this.g_client=Arrays.get(clientElements,0).client;
   this.g_pack=this.g_client.createPack();
  },
  InitRenderGraph:function()
  {
   var r,r$1,r$2,viewRoot,r$3,shadowPassRoot,r$4,renderSurface,depthSurface,renderSurfaceSet,r$5;
   this.g_tableRoot=(r=this.g_pack.createObject("o3d.Transform"),r.parent=this.g_client.root,r);
   this.g_shadowRoot=(r$1=this.g_pack.createObject("o3d.Transform"),r$1.parent=this.g_client.root,r$1);
   this.g_hudRoot=(r$2=this.g_pack.createObject("o3d.Transform"),r$2.parent=this.g_client.root,r$2);
   viewRoot=(r$3=this.g_pack.createObject("o3d.RenderNode"),r$3.priority=1,r$3);
   !this.SHADOWPOV?viewRoot.parent=this.g_client.renderGraphRoot:void 0;
   shadowPassRoot=(r$4=this.g_pack.createObject("o3d.RenderNode"),r$4.priority=0,r$4.parent=this.g_client.renderGraphRoot,r$4);
   this.g_viewInfo=rendergraph.createBasicView(this.g_pack,this.g_tableRoot,viewRoot,[0,0,0,1]);
   this.g_hudViewInfo=rendergraph.createBasicView(this.g_pack,this.g_hudRoot,this.SHADOWPOV?null:this.g_client.renderGraphRoot);
   this.g_hudViewInfo.root.priority=this.g_viewInfo.root.priority+1;
   this.g_hudViewInfo.clearBuffer.clearColorFlag=false;
   this.g_hudViewInfo.zOrderedState.getStateParam("CullMode").value=State.CULL_NONE;
   this.g_hudViewInfo.zOrderedState.getStateParam("ZWriteEnable").value=false;
   this.g_hudViewInfo.drawContext.projection=matrix4.orthographic(0,1,0,1,-10,10);
   this.g_hudViewInfo.drawContext.view=matrix4.lookAt([0,0,1],[0,0,0],[0,1,0]);
   this.g_shadowTexture=this.g_pack.createTexture2D(this.RENDER_TARGET_WIDTH,this.RENDER_TARGET_HEIGHT,Texture.XRGB8,1,true);
   renderSurface=this.g_shadowTexture.getRenderSurface(0);
   depthSurface=this.g_pack.createDepthStencilSurface(this.RENDER_TARGET_WIDTH,this.RENDER_TARGET_HEIGHT);
   renderSurfaceSet=(r$5=this.g_pack.createObject("o3d.RenderSurfaceSet"),r$5.renderSurface=renderSurface,r$5.renderDepthStencilSurface=depthSurface,r$5.parent=shadowPassRoot,r$5);
   this.g_shadowPassViewInfo=rendergraph.createBasicView(this.g_pack,this.g_shadowRoot,this.SHADOWPOV?this.g_client.renderGraphRoot:renderSurfaceSet,[0,0,0,1]);
   this.g_shadowPassViewInfo.zOrderedState.getStateParam("ZComparisonFunction").value=State.CMP_ALWAYS;
  },
  UpdateContext:function()
  {
   var perspective,p,view;
   perspective=matrix4.perspective(math.degToRad(30),this.g_client.width/this.g_client.height,1,5000);
   this.g_shadowPassViewInfo.drawContext.projection=perspective;
   this.g_viewInfo.drawContext.projection=perspective;
   p=this.g_cameraInfo.GetEyeAndTarget();
   view=matrix4.lookAt(p[0],p[1],[0,0,1]);
   this.g_shadowPassViewInfo.drawContext.view=view;
   this.g_viewInfo.drawContext.view=view;
   this.UpdateMaterials();
  },
  InitMaterials:function()
  {
   var $this,r;
   $this=this;
   this.g_materials={};
   Arrays.iter(function(name)
   {
    var effect,material,r$1,p;
    effect=$this.g_pack.createObject("o3d.Effect");
    effect.loadVertexShaderFromString($this.VertexShaderString);
    effect.loadPixelShaderFromString($this.PixelShaderString+("void main() { gl_FragColor = "+name+"PixelShader(); }"));
    material=(r$1=$this.g_pack.createObject("o3d.Material"),r$1.effect=effect,r$1.drawList=$this.g_viewInfo.performanceDrawList,r$1);
    $this.g_materials[name]=material;
    effect.createUniformParameters(material);
    p=$this.g_cameraInfo.GetEyeAndTarget();
    $this.SetOptionalParam(material,"factor",2/Code.g_tableWidth());
    $this.SetOptionalParam(material,"lightWorldPosition",$this.g_light);
    $this.SetOptionalParam(material,"eyeWorldPosition",p[0]);
   },["solid","felt","wood","cushion","billiard","ball","shadowPlane"]);
   this.g_solidMaterial=this.g_materials.solid;
   this.g_solidMaterial.drawList=this.g_hudViewInfo.zOrderedDrawList;
   this.g_materials.shadowPlane.drawList=this.g_shadowPassViewInfo.zOrderedDrawList;
   this.g_shadowSampler=(r=this.g_pack.createObject("o3d.Sampler"),r.texture=this.g_shadowTexture,r);
   this.g_materials.felt.getParam("textureSampler").value=this.g_shadowSampler;
   io.loadBitmaps(this.g_pack,"/poolballs.png",function($1,$2)
   {
    $this.FinishLoadingBitmaps($1,$2);
   });
  },
  InitShadowPlane:function()
  {
   var $this,root,r,plane,transforms;
   $this=this;
   root=(r=this.g_pack.createObject("o3d.Transform"),r.parent=this.g_shadowRoot,r);
   plane=primitives.createPlane(this.g_pack,this.g_materials.shadowPlane,Code.g_tableWidth(),Code.g_tableWidth()*2,1,1);
   root.translate([0,0,-1]);
   root.rotateX(3.14159265358979/2);
   transforms=Arrays.init(16,function()
   {
    var transform,r$1;
    transform=(r$1=$this.g_pack.createObject("o3d.Transform"),r$1.parent=root,r$1);
    transform.addShape(plane);
    return transform;
   });
   Code.set_g_centers(Arrays.map(function(transform)
   {
    return transform.createParam("ballCenter","o3d.ParamFloat2");
   },transforms));
   Code.set_g_shadowOnParams(Arrays.map(function(transform)
   {
    var r$1;
    r$1=transform.createParam("shadowOn","o3d.ParamFloat");
    r$1.value=1;
    return r$1;
   },transforms));
  },
  InitTable:function()
  {
   var shapes,r,r$1,r$2,r$3,r$4,$this,feltMaterial,woodMaterial,cushionMaterial,billiardMaterial,root,tableRoot,cushionRoot,ballRoot,root2,scaledPocketRadius,scaledWoodBreadth,hsrr2,felt_polygonA,felt_polygonB,felt_polygonC,wood_polygon,m,felt_polygon_A,felt_polygon_B,felt_polygon_C,wood_polygon$1,ij,felt_polygons,wood_polygons,felt_shapes,wood_shapes,t,cushionHeight,cushionUp,cushionProp,cushionDepth,cushionBreadth,cushionSwoop,angles,translations,shortenings,billiardBreadth,billiardDepth,billiardOut,billiardSpacing,billiards,i,$1,ball,i$1,$2,transform,r$5;
   $this=this;
   feltMaterial=this.g_materials.felt;
   woodMaterial=this.g_materials.wood;
   cushionMaterial=this.g_materials.cushion;
   billiardMaterial=this.g_materials.billiard;
   shapes=[];
   root=(r=this.g_pack.createObject("o3d.Transform"),r.parent=this.g_tableRoot,r);
   tableRoot=(r$1=this.g_pack.createObject("o3d.Transform"),r$1.parent=root,r$1);
   tableRoot.translate([0,0,-Code.g_tableThickness()/2-1]);
   cushionRoot=(r$2=this.g_pack.createObject("o3d.Transform"),r$2.parent=tableRoot,r$2);
   ballRoot=(r$3=this.g_pack.createObject("o3d.Transform"),r$3.parent=root,r$3);
   root2=Math.sqrt(2);
   scaledPocketRadius=2*Code.g_pocketRadius()/Code.g_tableWidth();
   scaledWoodBreadth=2*Code.g_woodBreadth()/Code.g_tableWidth();
   hsrr2=0.5*root2*scaledPocketRadius;
   felt_polygonA=[[0,-2],[0,(1+0.5*root2)*scaledPocketRadius-2]].concat(this.Arc([hsrr2-1,hsrr2-2],scaledPocketRadius,0.5*3.14159265358979,-0.25*3.14159265358979,15));
   felt_polygonB=[[-1,(1+0.5*root2)*scaledPocketRadius-2]].concat(this.Arc([hsrr2-1,hsrr2-2],scaledPocketRadius,0.75*3.14159265358979,0.5*3.14159265358979,15));
   felt_polygonC=Arrays.concat([[[0,(1+0.5*root2)*scaledPocketRadius-2],[0,0]],this.Arc([-1,0],scaledPocketRadius,0,-0.5*3.14159265358979,15),[[-1,(1+0.5*root2)*scaledPocketRadius-2]]]);
   wood_polygon=Arrays.concat([[[-scaledWoodBreadth-1,-scaledWoodBreadth-2],[0,-scaledWoodBreadth-2],[0,-2]],this.Arc([hsrr2-1,hsrr2-2],scaledPocketRadius,-0.25*3.14159265358979,-1.25*3.14159265358979,15),this.Arc([-1,0],scaledPocketRadius,1.5*3.14159265358979,3.14159265358979,15),[[-scaledWoodBreadth-1,0]]]);
   m=math.mulScalarMatrix(Code.g_tableWidth()/2,math.identity(2));
   felt_polygon_A=math.mulMatrixMatrix(felt_polygonA,m);
   felt_polygon_B=math.mulMatrixMatrix(felt_polygonB,m);
   felt_polygon_C=math.mulMatrixMatrix(felt_polygonC,m);
   wood_polygon$1=math.mulMatrixMatrix(wood_polygon,m);
   ij=[[-1,-1],[-1,1],[1,-1],[1,1]];
   felt_polygons=Arrays.concat(Arrays.map(function(ij$1)
   {
    return[$this.Flip(felt_polygon_A,ij$1),$this.Flip(felt_polygon_B,ij$1),$this.Flip(felt_polygon_C,ij$1)];
   },ij));
   wood_polygons=Arrays.map(function(ij$1)
   {
    return $this.Flip(wood_polygon$1,ij$1);
   },ij);
   felt_shapes=Arrays.map(function(poly)
   {
    return primitives.createPrism($this.g_pack,feltMaterial,poly,Code.g_tableThickness());
   },felt_polygons);
   shapes=shapes.concat(felt_shapes);
   wood_shapes=Arrays.map(function(poly)
   {
    return primitives.createPrism($this.g_pack,woodMaterial,poly,Code.g_tableThickness()+2*Code.g_woodHeight());
   },wood_polygons);
   shapes=shapes.concat(wood_shapes);
   t=(r$4=this.g_pack.createObject("o3d.Transform"),r$4.parent=tableRoot,r$4);
   Arrays.iter(function(a)
   {
    t.addShape(a);
   },shapes);
   cushionHeight=1.1*Code.g_woodHeight();
   cushionUp=Code.g_tableThickness()/2;
   cushionProp=0.9*Code.g_woodHeight();
   cushionDepth=Code.g_tableWidth();
   cushionBreadth=Code.g_pocketRadius();
   cushionSwoop=Code.g_pocketRadius();
   angles=[0,3.14159265358979/2,3.14159265358979,3.14159265358979,3*3.14159265358979/2,0];
   translations=math.mulMatrixMatrix([[-1,-1,0],[0,-2,0],[1,-1,0],[1,1,0],[0,2,0],[-1,1,0]],[[Code.g_tableWidth()/2,0,0],[0,Code.g_tableWidth()/2,0],[0,0,1]]);
   shortenings=math.mulScalarMatrix(Code.g_pocketRadius(),[[1,root2],[root2,root2],[root2,1]]);
   billiardBreadth=1;
   billiardDepth=0.309;
   billiardOut=-Code.g_woodBreadth()/2;
   billiardSpacing=Code.g_tableWidth()/4;
   billiards=Arrays.map(function(i$2)
   {
    return primitives.createPrism($this.g_pack,billiardMaterial,[[billiardOut+billiardBreadth/2,i$2*billiardSpacing],[billiardOut,billiardDepth+i$2*billiardSpacing],[billiardOut-billiardBreadth/2,i$2*billiardSpacing],[billiardOut,-billiardDepth+i$2*billiardSpacing]],Code.g_tableThickness()+2*Code.g_woodHeight()+0.1);
   },[-1,0,1]);
   for(i=0,$1=5;i<=$1;i++)(function()
   {
    var backShortening,frontShortening,cushion,localMatrix,t$1,r$6;
    backShortening=Arrays.get(Arrays.get(shortenings,i%3),1);
    frontShortening=Arrays.get(Arrays.get(shortenings,i%3),0);
    cushion=$this.FlatMesh(cushionMaterial,[[0,-cushionDepth/2+backShortening,cushionUp],[cushionBreadth,-cushionDepth/2+cushionSwoop+backShortening,cushionUp+cushionProp],[cushionBreadth,-cushionDepth/2+cushionSwoop+backShortening,cushionUp+cushionHeight],[0,-cushionDepth/2+backShortening,cushionUp+cushionHeight],[0,cushionDepth/2-frontShortening,cushionUp],[cushionBreadth,cushionDepth/2-cushionSwoop-frontShortening,cushionUp+cushionProp],[cushionBreadth,cushionDepth/2-cushionSwoop-frontShortening,cushionUp+cushionHeight],[0,cushionDepth/2-frontShortening,cushionUp+cushionHeight]],[[0,1,2,3],[7,6,5,4],[1,0,4,5],[2,1,5,6],[3,2,6,7],[0,3,7,4]]);
    shapes=shapes.concat([cushion]);
    localMatrix=math.mulMatrixMatrix4(matrix4.rotationZ(Arrays.get(angles,i)),matrix4.translation(Arrays.get(translations,i)));
    t$1=(r$6=$this.g_pack.createObject("o3d.Transform"),r$6.localMatrix=localMatrix,r$6.parent=cushionRoot,r$6);
    t$1.addShape(cushion);
    return Arrays.iter(function(a)
    {
     t$1.addShape(a);
    },billiards);
   }());
   shapes=shapes.concat(billiards);
   ball=primitives.createSphere(this.g_pack,this.g_materials.ball,1,50,70);
   shapes=shapes.concat([ball]);
   for(i$1=0,$2=15;i$1<=$2;i$1++){
    transform=(r$5=this.g_pack.createObject("o3d.Transform"),r$5.parent=ballRoot,r$5);
    Arrays.set(this.g_ballTextureSamplerParams,i$1,transform.createParam("textureSampler","o3d.ParamSampler"));
    Arrays.set(Code.g_ballTransforms(),i$1,transform);
    transform.addShape(ball);
   }
  },
  InitHud:function()
  {
   var barT1,r,r$1,barT2,r$2,backT2,r$3,plane;
   barT1=(r=this.g_pack.createObject("o3d.Transform"),r.parent=this.g_hudRoot,r);
   this.g_barScaling=(r$1=this.g_pack.createObject("o3d.Transform"),r$1.parent=barT1,r$1);
   barT2=(r$2=this.g_pack.createObject("o3d.Transform"),r$2.parent=this.g_barScaling,r$2);
   backT2=(r$3=this.g_pack.createObject("o3d.Transform"),r$3.parent=barT1,r$3);
   this.g_barRoot=barT1;
   plane=primitives.createPlane(this.g_pack,this.g_solidMaterial,1,1,1,1,[[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0,0,0,1]]);
   primitives.createPlane(this.g_pack,this.g_solidMaterial,1,1,1,1,[[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0,0,0,1]]);
   barT2.addShape(plane);
   barT1.translate([0.05,0.05,0]);
   barT1.scale([0.05,0.9,1]);
   this.g_barScaling.localMatrix=matrix4.scaling([1,0,1]);
   barT2.translate([0.5,0.5,0]);
   backT2.translate([0.5,0.5,0.1]);
  },
  Rack:function(game)
  {
   var root3,yOffset,cueYOffset,i,$1,i$1,$2,i$2,$3,i$3,$4;
   root3=Math.sqrt(3);
   yOffset=6*Code.g_tableWidth()/12;
   cueYOffset=-Code.g_tableWidth()/2;
   for(i=0,$1=15;i<=$1;i++)this.g_physics.BallOn(i);
   this.g_physics.StopAllBalls();
   if(game===0)
    {
     for(i$1=1,$2=15;i$1<=$2;i$1++){
      this.g_physics.PlaceBall(i$1,[0,0,-5]);
      this.g_physics.BallOff(i$1);
     }
     this.g_physics.PlaceBall(0,[0,0,cueYOffset]);
    }
   else
    if(game===1)
     {
      for(i$2=1,$3=15;i$2<=$3;i$2++){
       this.g_physics.PlaceBall(i$2,[0,0,-5]);
       this.g_physics.BallOff(i$2);
      }
      this.g_physics.PlaceBall(0,[0,cueYOffset,0]);
      this.g_physics.PlaceBall(1,[-Code.g_tableWidth()/4,cueYOffset/2,0]);
      this.g_physics.PlaceBall(2,[-3*Code.g_tableWidth()/8,cueYOffset/4,0]);
      this.g_physics.PlaceBall(3,[Code.g_tableWidth()/4,0,0]);
      this.g_physics.BallOn(0);
      this.g_physics.BallOn(1);
      this.g_physics.BallOn(2);
      this.g_physics.BallOn(3);
     }
    else
     if(game===8)
      {
       this.g_physics.PlaceBall(1,[0,0+yOffset,0]);
       this.g_physics.PlaceBall(9,[-1,root3+yOffset,0]);
       this.g_physics.PlaceBall(2,[1,root3+yOffset,0]);
       this.g_physics.PlaceBall(10,[2,2*root3+yOffset,0]);
       this.g_physics.PlaceBall(8,[0,2*root3+yOffset,0]);
       this.g_physics.PlaceBall(3,[-2,2*root3+yOffset,0]);
       this.g_physics.PlaceBall(11,[-3,3*root3+yOffset,0]);
       this.g_physics.PlaceBall(4,[-1,3*root3+yOffset,0]);
       this.g_physics.PlaceBall(12,[1,3*root3+yOffset,0]);
       this.g_physics.PlaceBall(5,[3,3*root3+yOffset,0]);
       this.g_physics.PlaceBall(13,[4,4*root3+yOffset,0]);
       this.g_physics.PlaceBall(6,[2,4*root3+yOffset,0]);
       this.g_physics.PlaceBall(14,[0,4*root3+yOffset,0]);
       this.g_physics.PlaceBall(15,[-2,4*root3+yOffset,0]);
       this.g_physics.PlaceBall(7,[-4,4*root3+yOffset,0]);
       this.g_physics.PlaceBall(0,[0,cueYOffset,0]);
      }
     else
      if(game===9)
       {
        this.g_physics.PlaceBall(1,[0,0+yOffset,0]);
        this.g_physics.PlaceBall(2,[1,root3+yOffset,0]);
        this.g_physics.PlaceBall(3,[-1,root3+yOffset,0]);
        this.g_physics.PlaceBall(9,[0,2*root3+yOffset,0]);
        this.g_physics.PlaceBall(4,[2,2*root3+yOffset,0]);
        this.g_physics.PlaceBall(5,[-2,2*root3+yOffset,0]);
        this.g_physics.PlaceBall(6,[1,3*root3+yOffset,0]);
        this.g_physics.PlaceBall(7,[-1,3*root3+yOffset,0]);
        this.g_physics.PlaceBall(8,[0,4*root3+yOffset,0]);
        for(i$3=10,$4=15;i$3<=$4;i$3++){
         this.g_physics.PlaceBall(i$3,[0,0,-5]);
         this.g_physics.BallOff(i$3);
        }
        this.g_physics.PlaceBall(0,[0,cueYOffset,0]);
       }
      else
       throw new Global.Error("invalid code");
   this.g_physics.RandomOrientations();
   this.g_physics.PlaceBalls();
   this.g_cameraInfo.GoTo({
    $:1,
    $0:[0,0,0]
   },{
    $:1,
    $0:-3.14159265358979/2
   },{
    $:1,
    $0:3.14159265358979/6
   },{
    $:1,
    $0:140
   });
  },
  SetRenderCallback:function()
  {
   var $this;
   $this=this;
   this.g_client.setRenderCallback(function(r)
   {
    return $this.Onrender(r);
   });
  },
  RegisterEventCallbacks:function()
  {
   var $this;
   $this=this;
   event.addEventListener(this.g_o3dElement,"mousedown",function(d)
   {
    return $this.StartDragging(d);
   });
   event.addEventListener(this.g_o3dElement,"mousemove",function(d)
   {
    return $this.Drag(d);
   });
   event.addEventListener(this.g_o3dElement,"mouseup",function(d)
   {
    return $this.StopDragging(d);
   });
   event.addEventListener(this.g_o3dElement,"keypress",function(d)
   {
    return $this.KeyPressed(d);
   });
   event.addEventListener(this.g_o3dElement,"keyup",function(d)
   {
    return $this.KeyUp(d);
   });
   event.addEventListener(this.g_o3dElement,"keydown",function(d)
   {
    return $this.KeyDown(d);
   });
   event.addEventListener(this.g_o3dElement,"wheel",function(d)
   {
    return $this.ScrollWheel(d);
   });
  },
  UpdateMaterials:function()
  {
   var $this,a,k;
   $this=this;
   a=this.g_materials;
   for(var k$1 in a)if(function(name)
   {
    var eye;
    eye=($this.g_cameraInfo.GetEyeAndTarget())[0];
    $this.SetOptionalParam($this.g_materials[name],"eyeWorldPosition",eye);
    return false;
   }(k$1))
    break;
  },
  SetOptionalParam:function(material,name,value)
  {
   var param;
   param=material.getParam(name);
   param?param.value=value:void 0;
  },
  FinishLoadingBitmaps:function(bitmaps,exn)
  {
   var bitmap,width,height,levels,i,$1,r,i$1,$2,i$2,$3;
   bitmap=Arrays.get(bitmaps,0);
   bitmap.flipVertically();
   width=bitmap.width/4>>0;
   height=bitmap.height/4>>0;
   levels=texture.computeNumLevels(width,height);
   for(i=0,$1=15;i<=$1;i++){
    Arrays.set(this.g_ballTextures,i,this.g_pack.createTexture2D(width,height,Texture.XRGB8,0,false));
    Arrays.set(this.g_ballTextureSamplers,i,(r=this.g_pack.createObject("o3d.Sampler"),r.texture=Arrays.get(this.g_ballTextures,i),r));
   }
   for(i$1=0,$2=15;i$1<=$2;i$1++){
    Arrays.get(this.g_ballTextures,i$1).drawImage(bitmap,0,i$1%4*width,(i$1/4>>0)*height,width,height,0,0,0,width,height);
    Arrays.get(this.g_ballTextures,i$1).generateMips(0,levels-1);
   }
   for(i$2=0,$3=15;i$2<=$3;i$2++)Arrays.get(this.g_ballTextureSamplerParams,i$2).value=Arrays.get(this.g_ballTextureSamplers,i$2);
  },
  FlatMesh:function(material,vertexPositions,faceIndices)
  {
   var vertexInfo,positionStream,normalStream;
   vertexInfo=primitives.createVertexInfo();
   positionStream=vertexInfo.addStream(3,Stream.POSITION);
   normalStream=vertexInfo.addStream(3,Stream.NORMAL);
   Arrays.fold(function(vertexCount,t)
   {
    var faceX,faceY,faceZ,n;
    faceX=t[0];
    faceY=t[1];
    faceZ=t[2];
    n=math.normalize(math.cross(math.subVector(Arrays.get(vertexPositions,faceY),Arrays.get(vertexPositions,faceX)),math.subVector(Arrays.get(vertexPositions,faceZ),Arrays.get(vertexPositions,faceX))));
    Arrays.iter(function(face_j)
    {
     positionStream.addElementVector(Arrays.get(vertexPositions,face_j));
     normalStream.addElementVector(n);
    },[faceX,faceY,faceZ,t[3]]);
    vertexInfo.addTriangle(vertexCount,vertexCount+1,vertexCount+2);
    vertexInfo.addTriangle(vertexCount,vertexCount+2,vertexCount+3);
    return vertexCount+4;
   },0,faceIndices);
   return vertexInfo.createShape(this.g_pack,material);
  },
  Flip:function(a,b)
  {
   var r,n;
   r=Arrays.init(Arrays.length(a),function(i)
   {
    return[Arrays.get(b,0)*Arrays.get(Arrays.get(a,i),0),Arrays.get(b,1)*Arrays.get(Arrays.get(a,i),1)];
   });
   return Arrays.get(b,0)*Arrays.get(b,1)<0?(n=Arrays.length(r),Arrays.init(n,function(i)
   {
    return i===0?Arrays.get(r,0):Arrays.get(r,n-i);
   })):r;
  },
  Arc:function(a,radius,start,_end,steps)
  {
   var centerY,centerX;
   centerY=a[1];
   centerX=a[0];
   return Arrays.init(steps+1,function(i)
   {
    var theta;
    theta=start+i*(_end-start)/steps;
    return[centerX+radius*Math.cos(theta),centerY+radius*Math.sin(theta)];
   });
  },
  Onrender:function(event$1)
  {
   var cueBall;
   Code.set_g_clock(Code.g_clock()+event$1.elapsedTime);
   this.g_cameraInfo.UpdateClock();
   this.g_physics.SomeBallsMoving()?(this.g_physics.Step(),this.g_physics.StopSlowBalls()):this.g_rolling?(this.g_rolling=false,cueBall=Arrays.get(this.g_physics.get_Balls(),0),this.g_cameraInfo.LookingAt(cueBall.Center)?this.g_barRoot.visible=true:void 0,!cueBall.Active?(this.g_physics.BallOn(0),cueBall.Center=[0,0,0],this.g_physics.BoundCueBall()):void 0):void 0;
   this.UpdateContext();
  },
  StartDragging:function(e)
  {
   this.g_cameraInfo.Begin(e.x,e.y);
   this.g_dragging=true;
  },
  Drag:function(e)
  {
   if(this.g_dragging)
    {
     this.g_cameraInfo.Update(e.x,e.y);
     this.UpdateContext();
    }
  },
  StopDragging:function(e)
  {
   this.g_dragging?(this.g_cameraInfo.Update(e.x,e.y),this.UpdateContext()):void 0;
   this.g_dragging=false;
  },
  KeyPressed:function(event$1)
  {
   var $1,keyChar,spotDelta,cueBall,p,y,x;
   keyChar=String.fromCharCode(event.getEventKeyChar(event$1)).toLowerCase();
   spotDelta=1;
   cueBall=Arrays.get(this.g_physics.get_Balls(),0);
   p=cueBall.Center;
   y=p[1];
   x=p[0];
   switch(keyChar)
   {
    case"*":
     this.Rack(8);
     break;
    case"(":
     this.Rack(9);
     break;
    case")":
     this.Rack(0);
     break;
    case"d":
     this.g_physics.BallOn(0);
     this.g_physics.PlaceBall(0,[x+spotDelta,y,0]);
     this.g_physics.BoundCueBall();
     break;
    case"a":
     this.g_physics.BallOn(0);
     this.g_physics.PlaceBall(0,[x-spotDelta,y,0]);
     this.g_physics.BoundCueBall();
     break;
    case"s":
     this.g_physics.BallOn(0);
     this.g_physics.PlaceBall(0,[x,y-spotDelta,0]);
     this.g_physics.BoundCueBall();
     break;
    case"w":
     this.g_physics.BallOn(0);
     this.g_physics.PlaceBall(0,[x,y+spotDelta,0]);
     this.g_physics.BoundCueBall();
     break;
    case"c":
     this.g_cameraInfo.ZoomToPoint(Arrays.get(this.g_physics.get_Balls(),0).Center);
     !this.g_rolling?void(this.g_barRoot.visible=true):null;
     break;
    case"t":
     this.g_cameraInfo.GoTo({
      $:1,
      $0:[0,0,0]
     },null,null,{
      $:1,
      $0:100
     });
     break;
    case"+":
    case"=":
     this.ZoomIn();
     break;
    case"_":
    case"-":
     this.ZoomOut();
     break;
    case" ":
     !this.g_cameraInfo.LookingAt(Arrays.get(this.g_physics.get_Balls(),0).Center)?(this.g_cameraInfo.ZoomToPoint(Arrays.get(this.g_physics.get_Balls(),0).Center),!this.g_rolling?void(this.g_barRoot.visible=true):null):(this.g_seriousness>1?!(this.g_rolling||this.g_shooting)?this.StartShooting():void 0:void 0,this.g_seriousness=this.g_seriousness+1);
     break;
    default:
     throw new Global.Error("invalid code");
   }
   this.UpdateContext();
  },
  KeyUp:function(event$1)
  {
   if(event$1.keyCode===32)
    this.FinishShooting();
  },
  KeyDown:Global.ignore,
  ScrollWheel:function(event$1)
  {
   if(event$1.deltaY>0)
    this.ZoomIn();
   else
    this.ZoomOut();
  },
  ZoomIn:function()
  {
   this.g_cameraInfo.targetPosition.Radius=this.g_cameraInfo.targetPosition.Radius*0.9;
  },
  ZoomOut:function()
  {
   this.g_cameraInfo.targetPosition.Radius=this.g_cameraInfo.targetPosition.Radius/0.9;
  },
  StartShooting:function()
  {
   var $this;
   $this=this;
   this.g_shooting=true;
   this.g_shooting_timers=new T({
    $:1,
    $0:Global.setInterval(function()
    {
     $this.IncreaseFactor();
    },1000/60>>0),
    $1:this.g_shooting_timers
   });
  },
  FinishShooting:function()
  {
   var p;
   List.iter(function(a)
   {
    Global.clearTimeout(a);
   },this.g_shooting_timers);
   this.g_shooting_timers=T.Empty;
   this.g_physics.get_SpeedFactor()>0?(p=this.g_cameraInfo.GetEyeAndTarget(),this.g_physics.ImpartSpeed(0,math.normalize(math.subVector([p[1][0],p[1][1]],[p[0][0],p[0][1]]))),this.g_cameraInfo.BackUp(),this.g_rolling=true,this.g_barRoot.visible=false):void 0;
   this.g_physics.set_SpeedFactor(0);
   this.g_seriousness=0;
   this.SetBarScale(this.g_physics.get_SpeedFactor());
   this.g_shooting=false;
  },
  IncreaseFactor:function()
  {
   this.g_physics.set_SpeedFactor(Math.min(this.g_physics.get_SpeedFactor()+0.01,1));
   this.SetBarScale(this.g_physics.get_SpeedFactor());
  },
  SetBarScale:function(t)
  {
   this.g_barScaling.localMatrix=matrix4.scaling([1,t,1]);
  }
 },Obj,Pool);
 Pool.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
  this.SHADOWPOV=false;
  this.RENDER_TARGET_WIDTH=512;
  this.RENDER_TARGET_HEIGHT=512;
  this.g_light=[0,0,50];
  this.g_o3dElement=null;
  this.g_cameraInfo=CameraInfo.Create();
  this.g_dragging=false;
  this.g_client=null;
  this.g_pack=null;
  this.g_tableRoot=null;
  this.g_shadowRoot=null;
  this.g_hudRoot=null;
  this.g_viewInfo=null;
  this.g_hudViewInfo=null;
  this.g_shadowTexture=null;
  this.g_shadowPassViewInfo=null;
  this.g_materials=null;
  this.g_solidMaterial=null;
  this.g_shadowSampler=null;
  this.g_ballTextures=Arrays.init(16,function()
  {
   return null;
  });
  this.g_ballTextureSamplers=Arrays.init(16,function()
  {
   return null;
  });
  this.g_ballTextureSamplerParams=Arrays.init(16,function()
  {
   return null;
  });
  this.g_barScaling=null;
  this.g_barRoot=null;
  this.g_shooting=false;
  this.g_rolling=false;
  this.g_physics=new Physics.New();
  this.g_phi=0;
  this.VertexShaderString="\n            uniform mat4 worldViewProjection;\n            uniform mat4 worldInverseTranspose;\n            uniform mat4 world;\n\n            attribute vec4 position;\n            attribute vec3 normal;\n\n            varying vec4 vposition;\n            varying vec4 vobjectPosition;\n            varying vec3 vworldPosition;\n            varying vec4 vscreenPosition;\n            varying vec3 vnormal;\n\n            void main() {\n            vposition = worldViewProjection * position;\n            vec4 temp = vposition;\n            temp += temp.w * vec4(1.0, 1.0, 0.0, 0.0);\n            temp.xyz /= 2.0;\n            vscreenPosition = temp;\n            vnormal = (worldInverseTranspose * vec4(normal, 0.0)).xyz;\n            vworldPosition = (world * vec4(position.xyz, 1.0)).xyz;\n            vobjectPosition = position;\n            gl_Position = vposition;\n            }";
  this.PixelShaderString="\n            uniform vec3 lightWorldPosition;\n            uniform vec3 eyeWorldPosition;\n            uniform float factor;\n            uniform float shadowOn;\n\n            uniform sampler2D textureSampler;\n\n            uniform vec2 ballCenter;\n\n            varying vec4 vposition;\n            varying vec4 vobjectPosition;\n            varying vec3 vworldPosition;\n            varying vec4 vscreenPosition;\n            varying vec3 vnormal;\n\n            vec4 roomColor(vec3 p, vec3 r) {\n            vec2 c = vec2(1.0 / 15.0, 1.0 / 30.0) *\n                (p.xy + r.xy * (lightWorldPosition.z - p.z) / r.z);\n\n            float temp = (abs(c.x + c.y) + abs(c.y - c.x));\n            float t = min(0.15 * max(7.0 - temp, 0.0) +\n                        ((temp < 5.0) ? 1.0 : 0.0), 1.0);\n            return vec4(t, t, t, 1.0);\n            }\n\n            vec4 lighting(vec4 pigment, float shininess) {\n            vec3 p = vworldPosition;\n            vec3 l = normalize(lightWorldPosition - p);  // Toward light.\n            vec3 n = normalize(vnormal);                 // Normal.\n            vec3 v = normalize(eyeWorldPosition - p);    // Toward eye.\n            vec3 r = normalize(-reflect(v, n));          // Reflection of v across n.\n\n            return vec4(max(dot(l, n), 0.0) * pigment.xyz +\n                0.2 * pow(max(dot(l, r), 0.0), shininess) * vec3(1, 1, 1), 1.0);\n            }\n\n            vec4 woodPigment(vec3 p) {\n            vec3 core = normalize(\n                (abs(p.y) > abs(p.x) + 1.0) ?\n                    vec3(1.0, 0.2, 0.3) : vec3(0.2, 1.0, 0.3));\n            float grainThickness = 0.02;\n            float t =\n                mod(length(p - dot(p,core)*core), grainThickness) / grainThickness;\n\n            return mix(vec4(0.15, 0.05, 0.0, 0.1), vec4(0.1, 0.0, 0.0, 0.1), t);\n            }\n\n            vec4 feltPigment(vec3 p) {\n            return vec4(0.1, 0.45, 0.15, 1.0);\n            }\n\n            vec4 environmentColor(vec3 p, vec3 r) {\n            vec4 upColor = 0.1 * roomColor(p, r);\n            vec4 downColor = -r.z * 0.3 * feltPigment(p);\n            float t = smoothstep(0.0, 0.05, r.z);\n            return mix(downColor, upColor, t);\n            }\n\n            vec4 solidPixelShader() {\n            return vec4(1.0, 1.0, 1.0, 0.2);\n            }\n\n            vec4 feltPixelShader() {\n            vec2 tex = vscreenPosition.xy / vscreenPosition.w;\n\n            vec3 p = factor * vworldPosition;\n            vec3 c = factor * eyeWorldPosition.xyz;\n            float width = 0.3;\n            float height = 0.3;\n            float d =\n                1.0 * (smoothstep(1.0 - width, 1.0 + width, abs(p.x)) +\n                        smoothstep(2.0 - height, 2.0 + height, abs(p.y)));\n            p = vworldPosition;\n\n            return (1.0 - texture2D(textureSampler, tex).x - d) *\n                lighting(feltPigment(p), 4.0);\n            }\n\n            vec4 woodPixelShader() {\n            vec3 p = factor * vworldPosition;\n            return lighting(woodPigment(p), 50.0);\n            }\n\n            vec4 cushionPixelShader() {\n            vec3 p = factor * vworldPosition;\n            return lighting(feltPigment(p), 4.0);\n            }\n \n            vec4 billiardPixelShader() {\n            vec3 p = factor * vworldPosition;\n            return lighting(vec4(0.5, 0.5, 0.2, 1), 30.0);\n            }\n\n            vec4 ballPixelShader() {\n            vec3 p = normalize(vobjectPosition.xyz);\n            vec4 u = 0.5 * vec4(p.x, p.y, p.x, -p.y);\n            u = clamp(u, -0.45, 0.45);\n            u += vec4(0.5, 0.5, 0.5, 0.5);\n\n            float t = clamp(5.0 * p.z, 0.0, 1.0);\n\n            p = vworldPosition;\n            vec3 l = normalize(lightWorldPosition - p); // Toward light.\n            vec3 n = normalize(vnormal);                // Normal.\n            vec3 v = normalize(eyeWorldPosition - p);   // Toward eye.\n            vec3 r = normalize(-reflect(v, n));         // Reflection of v across n.\n\n            vec4 pigment =\n                mix(texture2D(textureSampler, u.zw),\n                    texture2D(textureSampler, u.xy), t);\n\n            return 0.4 * environmentColor(p, r) +\n                pigment * (0.3 * smoothstep(0.0, 1.1, dot(n, l)) +\n                            0.3 * (p.z + 1.0));\n            }\n\n            vec4 shadowPlanePixelShader() {\n            vec2 p = vworldPosition.xy - ballCenter;\n            vec2 q = (vworldPosition.xy / lightWorldPosition.z);\n\n            vec2 offset = (1.0 - 1.0 / (vec2(1.0, 1.0) + abs(q))) * sign(q);\n            float t = mix(smoothstep(0.9, 0.0, length(p - length(p) * offset) / 2.0),\n                            smoothstep(1.0, 0.0, length(p) / 10.0), 0.15);\n            return shadowOn * vec4(t, t, t, t);\n            }";
  this.g_seriousness=0;
  this.g_shooting_timers=T.Empty;
 },Pool);
 Pagelet=Client.Pagelet=Runtime.Class({
  AppendTo:function(targetId)
  {
   self.document.getElementById(targetId).appendChild(this.get_Body());
   this.Render();
  },
  Render:Global.ignore
 },Obj,Pagelet);
 Pagelet.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },Pagelet);
 Tags.Tags=function()
 {
  SC$1.$cctor();
  return SC$1.Tags$1;
 };
 AttributeBuilder=Client.AttributeBuilder=Runtime.Class({
  NewAttr:function(name,value)
  {
   return Attribute.New(this.HtmlProvider,name,value);
  }
 },Obj,AttributeBuilder);
 AttributeBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },AttributeBuilder);
 Attr.Attr=function()
 {
  SC$1.$cctor();
  return SC$1.Attr$1;
 };
 Pervasives.NewFromSeq=function(fields)
 {
  var r,e,f;
  r={};
  e=Enumerator.Get(fields);
  try
  {
   while(e.MoveNext())
    {
     f=e.Current();
     r[f[0]]=f[1];
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return r;
 };
 Unchecked.Equals=function(a,b)
 {
  var m,eqR,k,k$1;
  if(a===b)
   return true;
  else
   {
    m=typeof a;
    if(m=="object")
    {
     if(a===null||a===void 0||b===null||b===void 0)
      return false;
     else
      if("Equals"in a)
       return a.Equals(b);
      else
       if(a instanceof Global.Array&&b instanceof Global.Array)
        return Unchecked.arrayEquals(a,b);
       else
        if(a instanceof Global.Date&&b instanceof Global.Date)
         return Unchecked.dateEquals(a,b);
        else
         {
          eqR=[true];
          for(var k$2 in a)if(function(k$3)
          {
           eqR[0]=!a.hasOwnProperty(k$3)||b.hasOwnProperty(k$3)&&Unchecked.Equals(a[k$3],b[k$3]);
           return!eqR[0];
          }(k$2))
           break;
          if(eqR[0])
           {
            for(var k$3 in b)if(function(k$4)
            {
             eqR[0]=!b.hasOwnProperty(k$4)||a.hasOwnProperty(k$4);
             return!eqR[0];
            }(k$3))
             break;
           }
          return eqR[0];
         }
    }
    else
     return m=="function"&&("$Func"in a?a.$Func===b.$Func&&a.$Target===b.$Target:"$Invokes"in a&&"$Invokes"in b&&Unchecked.arrayEquals(a.$Invokes,b.$Invokes));
   }
 };
 Unchecked.Compare=function(a,b)
 {
  var $1,m,$2,cmp,k,k$1;
  if(a===b)
   return 0;
  else
   {
    m=typeof a;
    switch(m=="function"?1:m=="boolean"?2:m=="number"?2:m=="string"?2:m=="object"?3:0)
    {
     case 0:
      return typeof b=="undefined"?0:-1;
     case 1:
      return Operators.FailWith("Cannot compare function values.");
     case 2:
      return a<b?-1:1;
     case 3:
      if(a===null)
       $2=-1;
      else
       if(b===null)
        $2=1;
       else
        if("CompareTo"in a)
         $2=a.CompareTo(b);
        else
         if("CompareTo0"in a)
          $2=a.CompareTo0(b);
         else
          if(a instanceof Global.Array&&b instanceof Global.Array)
           $2=Unchecked.compareArrays(a,b);
          else
           if(a instanceof Global.Date&&b instanceof Global.Date)
            $2=Unchecked.compareDates(a,b);
           else
            {
             cmp=[0];
             for(var k$2 in a)if(function(k$3)
             {
              return!a.hasOwnProperty(k$3)?false:!b.hasOwnProperty(k$3)?(cmp[0]=1,true):(cmp[0]=Unchecked.Compare(a[k$3],b[k$3]),cmp[0]!==0);
             }(k$2))
              break;
             if(cmp[0]===0)
              {
               for(var k$3 in b)if(function(k$4)
               {
                return!b.hasOwnProperty(k$4)?false:!a.hasOwnProperty(k$4)&&(cmp[0]=-1,true);
               }(k$3))
                break;
              }
             $2=cmp[0];
            }
      return $2;
    }
   }
 };
 Unchecked.arrayEquals=function(a,b)
 {
  var eq,i;
  if(Arrays.length(a)===Arrays.length(b))
   {
    eq=true;
    i=0;
    while(eq&&i<Arrays.length(a))
     {
      !Unchecked.Equals(Arrays.get(a,i),Arrays.get(b,i))?eq=false:void 0;
      i=i+1;
     }
    return eq;
   }
  else
   return false;
 };
 Unchecked.dateEquals=function(a,b)
 {
  return a.getTime()===b.getTime();
 };
 Unchecked.compareArrays=function(a,b)
 {
  var cmp,i;
  if(Arrays.length(a)<Arrays.length(b))
   return -1;
  else
   if(Arrays.length(a)>Arrays.length(b))
    return 1;
   else
    {
     cmp=0;
     i=0;
     while(cmp===0&&i<Arrays.length(a))
      {
       cmp=Unchecked.Compare(Arrays.get(a,i),Arrays.get(b,i));
       i=i+1;
      }
     return cmp;
    }
 };
 Unchecked.compareDates=function(a,b)
 {
  return Unchecked.Compare(a.getTime(),b.getTime());
 };
 CameraInfo=Code.CameraInfo=Runtime.Class({
  GoTo:function(center,theta,phi,radius)
  {
   var center$1,d,theta$1,d$1,phi$1,d$2,radius$1,d$3,k;
   function myMod(n,m)
   {
    return(n%m+m)%m;
   }
   center$1=(d=this.targetPosition.Center,center==null?d:center.$0);
   theta$1=(d$1=this.targetPosition.Theta,theta==null?d$1:theta.$0);
   phi$1=(d$2=this.targetPosition.Phi,phi==null?d$2:phi.$0);
   radius$1=(d$3=this.targetPosition.Radius,radius==null?d$3:radius.$0);
   this.position=this.GetCurrentPosition();
   this.targetPosition.Center=center$1;
   this.targetPosition.Theta=theta$1;
   this.targetPosition.Phi=phi$1;
   this.targetPosition.Radius=radius$1;
   this.lerpCoefficient=0;
   this.startingTime=Code.g_clock();
   k=3*3.14159265358979/2;
   this.position.Theta=myMod(this.position.Theta+k,2*3.14159265358979)-k;
   this.targetPosition.Theta=myMod(this.targetPosition.Theta+k,2*3.14159265358979)-k;
  },
  GetEyeAndTarget:function()
  {
   var p,cosPhi,target;
   p=this.GetCurrentPosition();
   cosPhi=Math.cos(p.Phi);
   target=p.Center;
   return[math.addVector(target,math.mulScalarVector(p.Radius,[cosPhi*Math.cos(p.Theta),cosPhi*Math.sin(p.Theta),Math.sin(p.Phi)])),target];
  },
  GetCurrentPosition:function()
  {
   var t,t$1,a,b;
   t=this.lerpCoefficient;
   t$1=3*t*t-2*t*t*t;
   a=this.position;
   b=this.targetPosition;
   return CameraPosition.New(math.addVector(math.mulScalarVector(1-t$1,a.Center),math.mulScalarVector(t$1,b.Center)),(1-t$1)*a.Theta+t$1*b.Theta,(1-t$1)*a.Phi+t$1*b.Phi,(1-t$1)*a.Radius+t$1*b.Radius);
  },
  UpdateClock:function()
  {
   var a,b;
   this.lerpCoefficient=(a=1,(b=Code.g_clock()-this.startingTime,Unchecked.Compare(a,b)===-1?a:b));
   this.lerpCoefficient===1?(this.position.Center=this.targetPosition.Center,this.position.Theta=this.targetPosition.Theta,this.position.Phi=this.targetPosition.Phi,this.position.Radius=this.targetPosition.Radius):void 0;
  },
  LookingAt:function(center)
  {
   return Unchecked.Equals(this.targetPosition.Center,center);
  },
  Begin:function(x,y)
  {
   this.lastX=x;
   this.lastY=y;
  },
  Update:function(x,y)
  {
   this.targetPosition.Theta=this.targetPosition.Theta-(x-this.lastX)/200;
   this.targetPosition.Phi=this.targetPosition.Phi+(y-this.lastY)/200;
   this.Bound();
   this.lastX=x;
   this.lastY=y;
  },
  ZoomToPoint:function(center)
  {
   this.GoTo({
    $:1,
    $0:center
   },{
    $:1,
    $0:this.targetPosition.Theta
   },{
    $:1,
    $0:3.14159265358979/20
   },{
    $:1,
    $0:20
   });
  },
  Bound:function()
  {
   this.position.Phi<0.01?this.position.Phi=0.01:void 0;
   this.position.Phi>3.14159265358979/2-0.01?this.position.Phi=3.14159265358979/2-0.01:void 0;
  },
  BackUp:function()
  {
   this.GoTo({
    $:1,
    $0:this.targetPosition.Center
   },null,{
    $:1,
    $0:3.14159265358979/6
   },{
    $:1,
    $0:100
   });
  }
 },null,CameraInfo);
 CameraInfo.Create=function()
 {
  var c;
  c=CameraInfo.New(0,0,CameraPosition.Create(),CameraPosition.Create(),[0,0,0],1,0);
  c.GoTo({
   $:1,
   $0:[0,0,0]
  },{
   $:1,
   $0:-3.14159265358979/2
  },{
   $:1,
   $0:3.14159265358979/6
  },{
   $:1,
   $0:140
  });
  return c;
 };
 CameraInfo.New=function(lastX,lastY,position,targetPosition,vector_,lerpCoefficient,startingTime)
 {
  return new CameraInfo({
   lastX:lastX,
   lastY:lastY,
   position:position,
   targetPosition:targetPosition,
   vector_:vector_,
   lerpCoefficient:lerpCoefficient,
   startingTime:startingTime
  });
 };
 Arrays.init=function(size,f)
 {
  var r,i,$1;
  size<0?Operators.FailWith("Negative size given."):null;
  r=new Global.Array(size);
  for(i=0,$1=size-1;i<=$1;i++)r[i]=f(i);
  return r;
 };
 Arrays.iter=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)f(arr[i]);
 };
 Arrays.map=function(f,arr)
 {
  var r,i,$1;
  r=new Global.Array(arr.length);
  for(i=0,$1=arr.length-1;i<=$1;i++)r[i]=f(arr[i]);
  return r;
 };
 Arrays.concat=function(xs)
 {
  return Global.Array.prototype.concat.apply([],Arrays.ofSeq(xs));
 };
 Arrays.mapi=function(f,arr)
 {
  var y,i,$1;
  y=new Global.Array(arr.length);
  for(i=0,$1=arr.length-1;i<=$1;i++)y[i]=f(i,arr[i]);
  return y;
 };
 Arrays.fold=function(f,zero,arr)
 {
  var acc,i,$1;
  acc=zero;
  for(i=0,$1=arr.length-1;i<=$1;i++)acc=f(acc,arr[i]);
  return acc;
 };
 Arrays.ofSeq=function(xs)
 {
  var q,o;
  if(xs instanceof Global.Array)
   return xs.slice();
  else
   if(xs instanceof T)
    return Arrays.ofList(xs);
   else
    {
     q=[];
     o=Enumerator.Get(xs);
     try
     {
      while(o.MoveNext())
       q.push(o.Current());
      return q;
     }
     finally
     {
      if(typeof o=="object"&&"Dispose"in o)
       o.Dispose();
     }
    }
 };
 Arrays.iteri=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)f(i,arr[i]);
 };
 Arrays.ofList=function(xs)
 {
  var l,q;
  q=[];
  l=xs;
  while(!(l.$==0))
   {
    q.push(List.head(l));
    l=List.tail(l);
   }
  return q;
 };
 Arrays.exists=function(f,x)
 {
  var e,i,$1,l;
  e=false;
  i=0;
  l=Arrays.length(x);
  while(!e&&i<l)
   if(f(x[i]))
    e=true;
   else
    i=i+1;
  return e;
 };
 Physics=Code.Physics=Runtime.Class({
  InitWalls:function()
  {
   var r,w,path,pi,angles,translations;
   r=Code.g_pocketRadius();
   w=Code.g_tableWidth();
   path=[[0,-w/2+r,0],[r,-w/2+2*r,0],[r,w/2-2*r,0],[0,w/2-r,0]];
   pi=3.14159265358979;
   angles=[0,pi/2,pi,pi,3*pi/2,0];
   translations=math.mulMatrixMatrix([[-1,-1,0],[0,-2,0],[1,-1,0],[1,1,0],[0,2,0],[-1,1,0]],[[w/2,0,0],[0,w/2,0],[0,0,1]]);
   this.walls=Wall.ComputeNormals(Arrays.concat(Arrays.init(6,function(i)
   {
    var newPath;
    newPath=Arrays.mapi(function(j,p)
    {
     return matrix4.transformPoint(matrix4.composition(matrix4.translation(Arrays.get(translations,i)),matrix4.rotationZ(Arrays.get(angles,i))),p);
    },path);
    return Arrays.init(Arrays.length(newPath)-1,function(j)
    {
     var p,p$1;
     p=Arrays.get(newPath,j);
     p$1=Arrays.get(newPath,j+1);
     return[[p[0],p[1]],[p$1[0],p$1[1]]];
    });
   })));
  },
  BallOn:function(i)
  {
   Arrays.get(this.get_Balls(),i).Active=true;
   Arrays.get(this.get_Balls(),i).SunkInPocket=-1;
   Arrays.get(Code.g_ballTransforms(),i).visible=true;
   Arrays.get(Code.g_shadowOnParams(),i).value=1;
  },
  StopAllBalls:function()
  {
   Arrays.iter(function(ball)
   {
    ball.Velocity=[0,0,0];
    ball.AngularVelocity=[0,0,0];
   },this.balls);
  },
  PlaceBall:function(i,p)
  {
   this.PlaceBall$1(i,p,[0,0,0,1]);
  },
  BallOff:function(i)
  {
   Arrays.get(this.get_Balls(),i).Active=false;
   Arrays.get(Code.g_ballTransforms(),i).visible=false;
   Arrays.get(Code.g_shadowOnParams(),i).value=0;
  },
  RandomOrientations:function()
  {
   Arrays.iter(function(ball)
   {
    ball.Orientation=math.normalize([Math.random()-0.5,Math.random()-0.5,Math.random()-0.5,Math.random()-0.5]);
   },this.balls);
  },
  PlaceBalls:function()
  {
   var $this;
   $this=this;
   Arrays.iteri(function(i,ball)
   {
    return ball.Active?$this.PlaceBall$1(i,ball.Center,ball.Orientation):void(Arrays.get(Code.g_shadowOnParams(),i).value=0);
   },this.balls);
  },
  get_Balls:function()
  {
   return this.balls;
  },
  PlaceBall$1:function(i,a,q)
  {
   Arrays.get(this.balls,i).Center=a;
   Arrays.get(Code.g_ballTransforms(),i).localMatrix=matrix4.translation(a);
   Arrays.get(Code.g_ballTransforms(),i).quaternionRotate(q);
   Arrays.get(Code.g_centers(),i).value=[a[0],a[1]];
  },
  SomeBallsMoving:function()
  {
   return Arrays.exists(function(ball)
   {
    var p,p$1;
    return ball.Active&&(p=ball.Velocity,(p$1=ball.AngularVelocity,p[0]!==0||p[1]!==0||p[2]!==0||p$1[0]!==0||p$1[1]!==0||p$1[2]!==0));
   },this.balls);
  },
  Step:function()
  {
   var i,$1;
   for(i=0,$1=4;i<=$1;i++){
    this.BallsLoseEnergy();
    this.BallsImpactFloor();
    this.Move(1);
    while(this.Collide())
     {
      this.Move(-1);
      this.HandleCollisions();
      this.Move(1);
     }
    this.Sink();
    this.HandleFalling();
    this.PlaceBalls();
   }
  },
  StopSlowBalls:function()
  {
   var epsilon;
   epsilon=0.0001;
   Arrays.iter(function(ball)
   {
    if(ball.Active)
     {
      math.length(ball.Velocity)<epsilon?ball.Velocity=[0,0,0]:void 0;
      math.length(ball.AngularVelocity)<epsilon?ball.AngularVelocity=[0,0,0]:void 0;
     }
   },this.balls);
  },
  BoundCueBall:function()
  {
   var p,cy,cx;
   p=Arrays.get(this.balls,0).Center;
   cy=p[1];
   cx=p[0];
   cx<this.left?cx=this.left:void 0;
   cx>this.right?cx=this.right:void 0;
   cy<this.bottom?cy=this.bottom:void 0;
   cy>this.top?cy=this.top:void 0;
   this.PushOut();
   this.PlaceBalls();
  },
  BallsLoseEnergy:function()
  {
   var $this;
   $this=this;
   Arrays.iter(function(ball)
   {
    if(ball.Active)
     {
      ball.Velocity=$this.LoseEnergy(ball.Velocity,4E-05);
      ball.AngularVelocity=$this.LoseEnergy(ball.AngularVelocity,6E-05);
     }
   },this.balls);
  },
  BallsImpactFloor:function()
  {
   var $this;
   $this=this;
   Arrays.iteri(function(i,ball)
   {
    var p;
    return ball.Active?(p=ball.Velocity,$this.ApplyImpulse(i,$this.Impulse([p[0],p[1],-0.1],ball.AngularVelocity,ball.Mass,ball.AngularInertia,[0,0,-1],[0,0,0],[0,0,0],1E+100,1E+100,[0,0,1],[0,0,-1],0.1,0.1,0.02),[0,0,-1])):null;
   },this.balls);
  },
  Move:function(timeStep)
  {
   var $this;
   $this=this;
   Arrays.iter(function(ball)
   {
    var p,p$1;
    if(ball.Active)
     {
      p=math.addVector(ball.Center,math.mulScalarVector(timeStep,ball.Velocity));
      ball.Orientation=quaternions.normalize(quaternions.mulQuaternionQuaternion($this.vectorToQuaternion(math.mulScalarVector(timeStep,ball.AngularVelocity),null),ball.Orientation));
      ball.Center=[p[0],p[1],p[2]];
      p$1=ball.Velocity;
      ball.Velocity=[p$1[0],p$1[1],p$1[2]+ball.VerticalAcceleration];
     }
   },this.balls);
  },
  Collide:function()
  {
   this.CollideBalls();
   this.CollideWithWalls();
   return!(this.collisions.$==0)||!(this.wallCollisions.$==0);
  },
  HandleCollisions:function()
  {
   var $this;
   $this=this;
   List.iter(function(c)
   {
    var ball,v,w,r1;
    ball=Arrays.get($this.balls,c.i);
    v=ball.Velocity;
    w=ball.AngularVelocity;
    r1=[-c.x,-c.y,0];
    $this.ApplyImpulse(c.i,$this.Impulse(v,w,ball.Mass,ball.AngularInertia,r1,[0,0,0],[0,0,0],1E+100,1E+100,[c.x,c.y,0],r1,0.99,1,1),r1);
   },this.wallCollisions);
   List.iter(function(c)
   {
    var bi,bj,vi,wi,vj,wj,ri,rj,impulse;
    bi=Arrays.get($this.balls,c.i);
    bj=Arrays.get($this.balls,c.j);
    vi=bi.Velocity;
    wi=bi.AngularVelocity;
    vj=bj.Velocity;
    wj=bj.AngularVelocity;
    ri=math.normalize(math.subVector(bj.Center,bi.Center));
    rj=math.negativeVector(ri);
    impulse=$this.Impulse(vi,wi,bi.Mass,bi.AngularInertia,ri,vj,wj,bj.Mass,bj.AngularInertia,rj,ri,0.99,0.2,0.1);
    $this.ApplyImpulse(c.i,impulse,ri);
    $this.ApplyImpulse(c.j,math.negativeVector(impulse),rj);
   },this.collisions);
  },
  Sink:function()
  {
   var $this;
   $this=this;
   Arrays.iter(function(ball)
   {
    var p,py,px;
    if(ball.Active)
     {
      p=ball.Center;
      py=p[1];
      px=p[0];
      Arrays.iteri(function(j,pocketCenter)
      {
       return math.distanceSquared([px,py],pocketCenter)<Code.g_pocketRadius()*Code.g_pocketRadius()?(ball.VerticalAcceleration=-0.005,ball.SunkInPocket=j):null;
      },$this.pocketCenters);
     }
   },this.balls);
  },
  HandleFalling:function()
  {
   var $this;
   $this=this;
   Arrays.iteri(function(i,ball)
   {
    var p,pz,pocketCenter,d,norm,maxNorm,a,b,ratio;
    return ball.Active?(p=ball.Center,(pz=p[2],(ball.SunkInPocket>=0?(pocketCenter=Arrays.get($this.pocketCenters,ball.SunkInPocket),d=math.subVector([p[0],p[1]],pocketCenter),norm=math.length(d),maxNorm=Code.g_pocketRadius()-Math.sqrt((a=0,(b=1-(pz+1)*(pz+1),Unchecked.Compare(a,b)===1?a:b))),norm>maxNorm?(ratio=maxNorm/norm,ball.Center=[pocketCenter[0]+d[0]*ratio,pocketCenter[1]+d[1]*ratio,pz]):void 0):void 0,pz<-3?(ball.Velocity=[0,0,0],ball.AngularVelocity=[0,0,0],ball.VerticalAcceleration=0,ball.Active=false,$this.BallOff(i)):null))):null;
   },this.balls);
  },
  PushOut:function()
  {
   while(this.Collide())
    this.PushCollisions();
  },
  get_SpeedFactor:function()
  {
   return this.speedFactor;
  },
  ImpartSpeed:function(i,a)
  {
   var ball,factor,p;
   ball=Arrays.get(this.balls,i);
   factor=this.maxSpeed*this.speedFactor;
   p=ball.Velocity;
   ball.Velocity=[p[0]+a[0]*factor,p[1]+a[1]*factor,p[2]];
  },
  set_SpeedFactor:function(value)
  {
   this.speedFactor=value;
  },
  LoseEnergy:function(v,epsilon)
  {
   var vLength;
   vLength=math.length(v);
   return vLength<epsilon?[0,0,0]:math.mulVectorScalar(v,1-epsilon/vLength);
  },
  ApplyImpulse:function(i,a,r)
  {
   var ball;
   ball=Arrays.get(this.balls,i);
   ball.Velocity=math.addVector(ball.Velocity,math.divVectorScalar(a,ball.Mass));
   ball.AngularVelocity=math.addVector(ball.AngularVelocity,math.divVectorScalar(math.cross(r,a),ball.AngularInertia));
  },
  Impulse:function(v1,w1,m1,I1,r1,v2,w2,m2,I2,r2,N,e,u_s,u_d)
  {
   var p;
   p=this["Impulse'"](v1,w1,m1,I1,r1,v2,w2,m2,I2,r2,N,e,u_s,u_d);
   return[p[0],p[1],0];
  },
  vectorToQuaternion:function(a,a$1)
  {
   var theta,stot;
   theta=math.length(a);
   stot=theta<1E-06?1:Math.sin(theta/2)/theta;
   return[stot*a[0],stot*a[1],stot*a[2],Math.cos(theta)];
  },
  CollideBalls:function()
  {
   var $this;
   $this=this;
   this.collisions=T.Empty;
   Arrays.iteri(function(i,balli)
   {
    var p,j,$1,ballj,p$1,d2;
    if(balli.Active)
     {
      p=balli.Center;
      for(j=0,$1=i-1;j<=$1;j++){
       ballj=Arrays.get($this.balls,j);
       ballj.Active?(p$1=ballj.Center,d2=math.distanceSquared([p[0],p[1]],[p$1[0],p$1[1]]),d2<3.99?$this.collisions=new T({
        $:1,
        $0:BallCollision.New(i,j,2-Math.sqrt(d2)),
        $1:$this.collisions
       }):void 0):void 0;
      }
      return;
     }
    else
     return null;
   },this.balls);
  },
  CollideWithWalls:function()
  {
   this.wallCollisions=this.CollideWithWalls$1(this.walls,1);
  },
  PushCollisions:function()
  {
   var $this;
   $this=this;
   List.iter(function(c)
   {
    var p;
    p=Arrays.get($this.balls,c.i).Center;
    Arrays.get($this.balls,c.i).Center=[p[0]+c.ammt*c.x,p[1]+c.ammt*c.y,p[2]];
   },this.wallCollisions);
   List.iter(function(c)
   {
    var pi,pj,p,dy,dx,norm,r;
    pi=Arrays.get($this.balls,c.i).Center;
    pj=Arrays.get($this.balls,c.j).Center;
    p=math.subVector(pj,pi);
    dy=p[1];
    dx=p[0];
    norm=math.length([dx,dy]);
    r=[c.ammt*dx/norm/2,c.ammt*dy/norm/2,0];
    Arrays.get($this.balls,c.i).Center=math.subVector(pi,r);
    Arrays.get($this.balls,c.j).Center=math.addVector(pj,r);
   },this.collisions);
  },
  "Impulse'":function(v1,w1,m1,I1,r1,v2,w2,m2,I2,r2,N,e,u_s,u_d)
  {
   var N$1,Vr,Vrn,Vrt,Kinverse,j0,j0n,T$2,jn;
   N$1=math.normalize(N);
   Vr=math.subVector(math.addVector(math.cross(w2,r2),v2),math.addVector(math.cross(w1,r1),v1));
   Vrn=math.mulScalarVector(math.dot(Vr,N$1),N$1);
   Vrt=math.subVector(Vr,Vrn);
   Kinverse=math.inverse3(math.addMatrix(this.InertialTensor(m1,I1,r1),this.InertialTensor(m2,I2,r2)));
   j0=math.mulMatrixVector(Kinverse,math.subVector(Vr,math.mulScalarVector(-e,Vrn)));
   j0n=math.mulScalarVector(math.dot(j0,N$1),N$1);
   return math.lengthSquared(math.subVector(j0,j0n))<=u_s*u_s*math.lengthSquared(j0n)||math.lengthSquared(Vrt)===0?j0:(T$2=math.normalize(Vrt),(jn=math.dot(math.mulMatrixVector(Kinverse,Vr),N$1),math.addVector(math.mulMatrixVector(Kinverse,math.mulScalarVector(1+e,Vrn)),math.mulScalarVector(-u_d*jn,T$2))));
  },
  CollideWithWalls$1:function(wallList,radius)
  {
   var $this;
   $this=this;
   return List.choose(Global.id,List.init(16,function(i)
   {
    var ball,p,y,x;
    ball=Arrays.get($this.balls,i);
    p=ball.Center;
    y=p[1];
    x=p[0];
    return ball.Active&&!(x>$this.left&&x<$this.right&&y>$this.bottom&&y<$this.top)?Seq.tryPick(function(wall)
    {
     var norm,t,d,normSquared,norm$1,d$1,normSquared$1,norm$2;
     norm=Math.abs(x*wall.nx+y*wall.ny-wall.k);
     return norm<radius?(t=y*wall.nx-x*wall.ny,t>wall.a&&t<wall.b?{
      $:1,
      $0:WallCollision.New(i,wall.nx,wall.ny,1-norm)
     }:(d=math.subVector([x,y],wall.p),(normSquared=math.lengthSquared(d),normSquared<radius*radius?(norm$1=Math.sqrt(normSquared),{
      $:1,
      $0:WallCollision.New(i,d[0]/norm$1,d[1]/norm$1,1-norm$1)
     }):(d$1=math.subVector([x,y],wall.q),(normSquared$1=math.lengthSquared(d$1),normSquared$1<radius*radius?(norm$2=Math.sqrt(normSquared$1),{
      $:1,
      $0:WallCollision.New(i,d$1[0]/norm$2,d$1[1]/norm$2,1-norm$2)
     }):null))))):null;
    },$this.walls):null;
   }));
  },
  InertialTensor:function(m,I,r)
  {
   var c,b,a;
   c=r[2];
   b=r[1];
   a=r[0];
   return[[1/m+(b*b+c*c)/I,-a*b/I,-a*c/I],[-a*b/I,1/m+(a*a+c*c)/I,-b*c/I],[-a*c/I,-b*c/I,1/m+(a*a+b*b)/I]];
  }
 },Obj,Physics);
 Physics.New=Runtime.Ctor(function()
 {
  var w,r,root2,x,y,cueWeightRatio;
  Obj.New.call(this);
  this.speedFactor=0;
  this.maxSpeed=1;
  this.pocketCenters=(w=Code.g_tableWidth()/2,(r=Code.g_pocketRadius(),(root2=Math.sqrt(2),(x=0.5*root2*r-w,(y=0.5*root2*r-2*w,[[w,0],[-w,0],[x,y],[-x,y],[x,-y],[-x,-y]])))));
  this.left=-Code.g_tableWidth()/2+Code.g_pocketRadius()+1;
  this.right=Code.g_tableWidth()/2-Code.g_pocketRadius()-1;
  this.top=Code.g_tableWidth()-Code.g_pocketRadius()-1;
  this.bottom=-Code.g_tableWidth()+Code.g_pocketRadius()+1;
  cueWeightRatio=6/5.5;
  this.balls=Arrays.init(16,function(i)
  {
   var ball;
   ball=Ball.Create();
   i===0?(ball.Mass=ball.Mass*cueWeightRatio,ball.AngularInertia=ball.AngularInertia*cueWeightRatio):void 0;
   return ball;
  });
  this.walls=[];
  this.collisions=T.Empty;
  this.wallCollisions=T.Empty;
 },Physics);
 T=List.T=Runtime.Class({
  GetEnumerator:function()
  {
   return new T$1.New(this,null,function(e)
   {
    var m;
    m=e.s;
    return m.$==0?false:(e.c=m.$0,e.s=m.$1,true);
   },void 0);
  }
 },null,T);
 T.Empty=new T({
  $:0
 });
 TagBuilder=Client.TagBuilder=Runtime.Class({
  NewTag:function(name,children)
  {
   var el,e;
   el=Element$1.New(this.HtmlProvider,name);
   e=Enumerator.Get(children);
   try
   {
    while(e.MoveNext())
     el.AppendI(e.Current());
   }
   finally
   {
    if(typeof e=="object"&&"Dispose"in e)
     e.Dispose();
   }
   return el;
  }
 },Obj,TagBuilder);
 TagBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },TagBuilder);
 SC$1.$cctor=function()
 {
  SC$1.$cctor=Global.ignore;
  SC$1.HtmlProvider=new JQueryHtmlProvider.New();
  SC$1.Attr=new AttributeBuilder.New(Implementation.HtmlProvider());
  SC$1.Tags=new TagBuilder.New(Implementation.HtmlProvider());
  SC$1.DeprecatedHtml=new DeprecatedTagBuilder.New(Implementation.HtmlProvider());
  SC$1.Tags$1=Implementation.Tags();
  SC$1.Deprecated=Implementation.DeprecatedHtml();
  SC$1.Attr$1=Implementation.Attr();
 };
 CameraPosition.Create=function()
 {
  return CameraPosition.New([0,0,0],0,0,1);
 };
 CameraPosition.New=function(Center,Theta,Phi,Radius)
 {
  return{
   Center:Center,
   Theta:Theta,
   Phi:Phi,
   Radius:Radius
  };
 };
 Ball.Create=function()
 {
  return Ball.New(1,0.4,[0,0,0],[0,0,0],0,[0,0,0,1],[0,0,0],true,-1);
 };
 Ball.New=function(Mass,AngularInertia,Center,Velocity,VerticalAcceleration,Orientation,AngularVelocity,Active,SunkInPocket)
 {
  return{
   Mass:Mass,
   AngularInertia:AngularInertia,
   Center:Center,
   Velocity:Velocity,
   VerticalAcceleration:VerticalAcceleration,
   Orientation:Orientation,
   AngularVelocity:AngularVelocity,
   Active:Active,
   SunkInPocket:SunkInPocket
  };
 };
 Attribute=Client.Attribute=Runtime.Class({
  get_Body:function()
  {
   var attr;
   attr=this.HtmlProvider.CreateAttribute(this.Name);
   attr.value=this.Value;
   return attr;
  }
 },Pagelet,Attribute);
 Attribute.New=function(htmlProvider,name,value)
 {
  var a;
  a=new Attribute.New$1(htmlProvider);
  a.Name=name;
  a.Value=value;
  return a;
 };
 Attribute.New$1=Runtime.Ctor(function(HtmlProvider)
 {
  Pagelet.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },Attribute);
 JQueryHtmlProvider=Implementation.JQueryHtmlProvider=Runtime.Class({
  AppendAttribute:function(node,attr)
  {
   this.SetAttribute(node,attr.nodeName,attr.value);
  },
  AppendNode:function(node,el)
  {
   var _this,a;
   _this=Global.jQuery(node);
   a=Global.jQuery(el);
   _this.append.apply(_this,[a]);
  },
  CreateAttribute:function(str)
  {
   return self.document.createAttribute(str);
  },
  SetAttribute:function(node,name,value)
  {
   Global.jQuery(node).attr(name,value);
  }
 },Obj,JQueryHtmlProvider);
 JQueryHtmlProvider.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },JQueryHtmlProvider);
 Implementation.HtmlProvider=function()
 {
  SC$1.$cctor();
  return SC$1.HtmlProvider;
 };
 Implementation.Tags=function()
 {
  SC$1.$cctor();
  return SC$1.Tags;
 };
 Implementation.DeprecatedHtml=function()
 {
  SC$1.$cctor();
  return SC$1.DeprecatedHtml;
 };
 Implementation.Attr=function()
 {
  SC$1.$cctor();
  return SC$1.Attr;
 };
 DeprecatedTagBuilder=Client.DeprecatedTagBuilder=Runtime.Class({},Obj,DeprecatedTagBuilder);
 DeprecatedTagBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },DeprecatedTagBuilder);
 Wall.ComputeNormals=function(arr)
 {
  function m(a,a$1)
  {
   var py,px,p,nx,ny;
   py=a[1];
   px=a[0];
   p=math.normalize(math.subVector(a$1,a));
   nx=p[1];
   ny=-p[0];
   return Wall.New(a,a$1,nx,ny,nx*px+ny*py,py*nx-px*ny,a$1[1]*nx-a$1[0]*ny);
  }
  return Arrays.map(function($1)
  {
   return m($1[0],$1[1]);
  },arr);
 };
 Wall.New=function(p,q,nx,ny,k,a,b)
 {
  return{
   p:p,
   q:q,
   nx:nx,
   ny:ny,
   k:k,
   a:a,
   b:b
  };
 };
 BallCollision.New=function(i,j,ammt)
 {
  return{
   i:i,
   j:j,
   ammt:ammt
  };
 };
 WallCollision.New=function(i,x,y,ammt)
 {
  return{
   i:i,
   x:x,
   y:y,
   ammt:ammt
  };
 };
 Arrays.get=function(arr,n)
 {
  Arrays.checkBounds(arr,n);
  return arr[n];
 };
 Arrays.set=function(arr,n,x)
 {
  Arrays.checkBounds(arr,n);
  arr[n]=x;
 };
 Arrays.checkBounds=function(arr,n)
 {
  if(n<0||n>=arr.length)
   Operators.FailWith("Index was outside the bounds of the array.");
 };
 Arrays.length=function(arr)
 {
  return arr.dims===2?arr.length*arr.length:arr.length;
 };
 SC$2.$cctor=function()
 {
  SC$2.$cctor=Global.ignore;
  SC$2.g_tableWidth=45;
  SC$2.g_pocketRadius=2.3;
  SC$2.g_woodBreadth=3.2;
  SC$2.g_tableThickness=5;
  SC$2.g_woodHeight=1.1;
  SC$2.g_clock=0;
  SC$2.g_shadowOnParams=[];
  SC$2.g_ballTransforms=Arrays.init(16,function()
  {
   return null;
  });
  SC$2.g_centers=[];
 };
 Element$1=Client.Element=Runtime.Class({
  AppendI:function(pl)
  {
   var body,r;
   body=pl.get_Body();
   body.nodeType===2?this.HtmlProvider.AppendAttribute(this.get_Body(),body):this.HtmlProvider.AppendNode(this.get_Body(),pl.get_Body());
   this.IsRendered?pl.Render():(r=this.RenderInternal,this.RenderInternal=function()
   {
    r();
    pl.Render();
   });
  },
  get_Body:function()
  {
   return this.Dom;
  },
  Render:function()
  {
   if(!this.IsRendered)
    {
     this.RenderInternal();
     this.IsRendered=true;
    }
  }
 },Pagelet,Element$1);
 Element$1.New=function(html,name)
 {
  var el,dom;
  el=new Element$1.New$1(html);
  dom=self.document.createElement(name);
  el.RenderInternal=Global.ignore;
  el.Dom=dom;
  el.IsRendered=false;
  return el;
 };
 Element$1.New$1=Runtime.Ctor(function(HtmlProvider)
 {
  Pagelet.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },Element$1);
 Enumerator.Get=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):x.GetEnumerator();
 };
 Enumerator.ArrayEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<Arrays.length(s)&&(e.c=Arrays.get(s,i),e.s=i+1,true);
  },void 0);
 };
 Enumerator.StringEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<s.length&&(e.c=s[i],e.s=i+1,true);
  },void 0);
 };
 T$1=Enumerator.T=Runtime.Class({
  MoveNext:function()
  {
   return this.n(this);
  },
  Current:function()
  {
   return this.c;
  },
  Dispose:function()
  {
   if(this.d)
    this.d(this);
  }
 },Obj,T$1);
 T$1.New=Runtime.Ctor(function(s,c,n,d)
 {
  Obj.New.call(this);
  this.s=s;
  this.c=c;
  this.n=n;
  this.d=d;
 },T$1);
 List.iter=function(f,l)
 {
  var r;
  r=l;
  while(r.$==1)
   {
    f(List.head(r));
    r=List.tail(r);
   }
 };
 List.head=function(l)
 {
  return l.$==1?l.$0:List.listEmpty();
 };
 List.tail=function(l)
 {
  return l.$==1?l.$1:List.listEmpty();
 };
 List.listEmpty=function()
 {
  return Operators.FailWith("The input list was empty.");
 };
 List.init=function(s,f)
 {
  return List.ofArray(Arrays.init(s,f));
 };
 List.choose=function(f,l)
 {
  return List.ofSeq(Seq.choose(f,l));
 };
 List.ofArray=function(arr)
 {
  var r,i,$1;
  r=T.Empty;
  for(i=Arrays.length(arr)-1,$1=0;i>=$1;i--)r=new T({
   $:1,
   $0:Arrays.get(arr,i),
   $1:r
  });
  return r;
 };
 List.ofSeq=function(s)
 {
  var e,$1,go,r,res,t;
  if(s instanceof T)
   return s;
  else
   if(s instanceof Global.Array)
    return List.ofArray(s);
   else
    {
     e=Enumerator.Get(s);
     try
     {
      go=e.MoveNext();
      if(!go)
       $1=T.Empty;
      else
       {
        res=new T({
         $:1
        });
        r=res;
        while(go)
         {
          r.$0=e.Current();
          e.MoveNext()?r=(t=new T({
           $:1
          }),r.$1=t,t):go=false;
         }
        r.$1=T.Empty;
        $1=res;
       }
      return $1;
     }
     finally
     {
      if(typeof e=="object"&&"Dispose"in e)
       e.Dispose();
     }
    }
 };
 Seq.tryPick=function(f,s)
 {
  var e,r;
  e=Enumerator.Get(s);
  try
  {
   r=null;
   while(Unchecked.Equals(r,null)&&e.MoveNext())
    r=f(e.Current());
   return r;
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.choose=function(f,s)
 {
  return Seq.collect(function(x)
  {
   var m;
   m=f(x);
   return m==null?T.Empty:List.ofArray([m.$0]);
  },s);
 };
 Seq.collect=function(f,s)
 {
  return Seq.concat(Seq.map(f,s));
 };
 Seq.concat=function(ss)
 {
  return{
   GetEnumerator:function()
   {
    var outerE;
    outerE=Enumerator.Get(ss);
    return new T$1.New(null,null,function(st)
    {
     var m;
     while(true)
      {
       m=st.s;
       if(Unchecked.Equals(m,null))
       {
        if(outerE.MoveNext())
         {
          st.s=Enumerator.Get(outerE.Current());
          st=st;
         }
        else
         {
          outerE.Dispose();
          return false;
         }
       }
       else
        if(m.MoveNext())
         {
          st.c=m.Current();
          return true;
         }
        else
         {
          st.Dispose();
          st.s=null;
          st=st;
         }
      }
    },function(st)
    {
     var x;
     x=st.s;
     !Unchecked.Equals(x,null)?x.Dispose():void 0;
     !Unchecked.Equals(outerE,null)?outerE.Dispose():void 0;
    });
   }
  };
 };
 Seq.map=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    var en;
    en=Enumerator.Get(s);
    return new T$1.New(null,null,function(e)
    {
     return en.MoveNext()&&(e.c=f(en.Current()),true);
    },function()
    {
     en.Dispose();
    });
   }
  };
 };
 Runtime.OnLoad(function()
 {
  Code.Main();
 });
}());


if (typeof IntelliFactory !=='undefined') {
  IntelliFactory.Runtime.ScriptBasePath = '/Content/';
  IntelliFactory.Runtime.Start();
}
