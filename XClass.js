(function (global) {

    var objectEach = function (obj, func, scope) {
        for (var x in obj)
            if (obj.hasOwnProperty(x))
                func.call(scope || global, x, obj[x]);
    };

    var arrayEach = Array.prototype.forEach ? function (obj, func) {
        Array.prototype.forEach.call(obj || [], func);
    } : function (obj, func) {
        for (var i = 0 , len = obj && obj.length || 0; i < len; i++)
            func.call(window, obj[i], i);
    };

    var extend = function (params , notOverridden ) {
        objectEach(params, function (name, value) {
            var prev = this[ name ];
            if( prev && notOverridden === true )
                return;
            this[ name ] = value;
            if( typeof value === 'function' ){
                value.$name = name;
                value.$owner = this;
                if ( prev )
                    value.$prev = prev;
            }
        }, this);
    };

    var ns = function (name) {
        var part = global,
            parts = name && name.split('.') || [];

        arrayEach(parts, function (partName) {
            if (partName) {
                part = part[ partName ] || ( part[ partName ] = {});
            }
        });

        return part;
    };


    /**
     * @class XNative
     * @description Base Class , All classes in XClass inherit from XNative
     */

    var XNative = function (params) {

    };

    /**
     * @description mixin
     * @static
     * @param XNative
     * @return self
     */
    XNative.mixin = function (object) {
        this.mixins.push(object);
        extend.call(this.prototype, object.prototype , true );


        return this;
    };

    /**
     * @description implement functions to class
     * @static
     * @param object
     * @return self
     */
    XNative.implement = function (params) {
        extend.call(this.prototype, params);
        return this;
    };


    /**
     * @description implement functions to instance
     * @static
     * @param object
     * @return self
     */

    XNative.prototype.implement = function (params) {
        extend.call(this, params);
        return this;
    };


    /**
     * @description call super class's function
     * @return {Object}
     */
    XNative.prototype.parent = function () {
        var caller = this.parent.caller ,
            func = caller.$prev;
        if (!func)
            throw new Error('can not call parent');
        else {
            return func.apply(this, arguments);
        }
    };

    var PROCESSOR = {
        'statics':function (newClass, methods) {
            objectEach(methods, function (k, v) {
                newClass[ k ] = v;
            });
        },
        'extend':function (newClass, superClass) {
            var superClass = superClass || XNative , prototype = newClass.prototype , superPrototype = superClass.prototype;

            //process mixins
            var mixins = newClass.mixins = [];

            if (superClass.mixins)
                newClass.mixins.push.apply(newClass.mixins, superClass.mixins);

            //process statics
            objectEach(superClass, function (k, v) {
                newClass[ k ] = v;
            })

            //process prototype
            objectEach(superPrototype, function (k, v) {
                prototype[ k ] = v;
            });

            newClass.superclass = prototype.superclass = superClass;
        },
        'mixins':function (newClass, value) {

            arrayEach(value, function (v) {
                newClass.mixin(v);
            });
        }
    };

    var PROCESSOR_KEYS = ['statics', 'extend', 'mixins'];

    /**
     * @class XClass
     * @description Class Factory
     * @param  {Object} params
     * @return {Object} object ：New Class
     * @example new XClass({
     *     statics : {
     *         static_method : function(){}
     *     },
     *     method1 : function(){},
     *     method2 : function(){},
     *     extend : ExtendedClass,
     *     mixins : [ MixedClass1 , MixedClass2 ],
     *     singleton : false
     * });
     */
    function XClass(params) {

        var singleton = params.singleton;

        var XClass = function () {
            var me = this , args = arguments;

            if (singleton)
                if (XClass.singleton)
                    return XClass.singleton;
                else
                    XClass.singleton = me;

            me.mixins = {};

            arrayEach(XClass.mixins, function (mixin) {
                mixin.prototype.initialize && mixin.prototype.initialize.apply(me, args);

                if( mixin.prototype.name )
                    me.mixins[ mixin.prototype.name ] = mixin.prototype;

            });
            return me.initialize && me.initialize.apply(me, arguments) || me;
        };


        var methods = {};

        arrayEach(PROCESSOR_KEYS, function (key) {
            PROCESSOR[ key ](XClass, params[ key ], key);
        });

        objectEach(params, function (k, v) {
            if (!PROCESSOR[ k ])
                methods[ k ] = v;
        });

        extend.call(XClass.prototype, methods);

        return XClass;
    }

    XClass.utils = {
        object:{
            each:objectEach
        },
        array:{
            forEach:arrayEach
        },
        ns:ns
    };

    XClass.define = function (className, params) {
        if( className ){
            var lastIndex = className.lastIndexOf('.') , newClass;
            return ns(lastIndex === -1 ? null : className.substr(0, lastIndex))[ className.substr(lastIndex + 1) ] = new XClass(params);
        }else
            throw new Error('empty class name!');
    };

    global.XClass = XClass;

    // amd support
    if (typeof define === 'function' && define.amd)
        define('xclass', [], function () {
            return XClass;
        });

})(window);