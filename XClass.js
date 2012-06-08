(function (global) {

    var objectEach = function (obj, fn ) {
        for (var x in obj)
            if (obj.hasOwnProperty(x))
                fn.call( global, x, obj[x] );
    };

    var arrayEach = Array.prototype.forEach ? function (obj, func) {
        Array.prototype.forEach.call(obj || [], func);
    } : function (obj, func) {
        for (var i = 0 , len = obj && obj.length || 0; i < len; i++)
            func.call( global , obj[i], i);
    };

    var extend = function (params, notOverridden) {
        var me = this;
        objectEach(params, function (name, value) {
            var prev = me[ name ];
            if (prev && notOverridden === true)
                return;
            me[ name ] = value;
            if (typeof value === 'function') {
                value.$name = name;
                value.$owner = this;
                if (prev)
                    value.$prev = prev;
            }
        });
    };

    var ns = function ( name , root ) {
        var part = root || global,
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
     * @name XNative
     * @classdesc Base Class , All classes created by XClass inherit from XNative
     * @param {Object} params The constructor parameters.
     */

    var XNative = function (params) {

    };

    /**
     * @name XNative.mixin
     * @function
     * @desc mixin
     * @param {XNative} mixinClass
     * @returns self
     */
    XNative.mixin = function ( mixinClass ) {
        var name = '' , prototype = this.prototype;

        if( typeof mixinClass === 'object' ){
            name = mixinClass.name;
            mixinClass = mixinClass.mixin;
        }

        this.mixins.push( { name : name , mixin : mixinClass } );

        if( !name )
            extend.call( prototype , mixinClass.prototype , true );

        return this;
    };

    /**
     * @name XNative.implement
     * @function
     * @desc implement functions to class
     * @param {Object} params
     * @returns self
     */
    XNative.implement = function (params) {
        extend.call(this.prototype, params);
        return this;
    };


    /**
     * @name XNative#implement
     * @function
     * @desc implement functions to instance
     * @param {Object} params
     * @returns self
     */

    XNative.prototype.implement = function (params) {
        extend.call(this, params);
        return this;
    };


    /**
     * @name XNative#parent
     * @function
     * @desc call super class's function having the same function name
     * @returns {Object}
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


            //process statics
            objectEach(superClass, function (k, v) {
                newClass[ k ] = v;
            })

            //process prototype
            objectEach(superPrototype, function (k, v) {
                prototype[ k ] = v;
            });

            //process mixins
            var mixins = newClass.mixins = [];

            if (superClass.mixins)
                mixins.push.apply( mixins , superClass.mixins );


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
     * @classdesc Class Factory
     * @param  {Object} params
     * @returns {XNative} The new Class
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


    function XClass( params ){

        var params = params || {};

        var XNative = function(){
            return _.call( this , XNative , params , arguments );
        };

        var methods = {};

        arrayEach(PROCESSOR_KEYS, function (key) {
            PROCESSOR[ key ](XNative, params[ key ], key);
        });

        objectEach(params, function (k, v) {
            if (!PROCESSOR[ k ])
                methods[ k ] = v;
        });

        extend.call(XNative.prototype, methods);

        return XNative;
    }

    function _( XNative , params , args ){

        var me = this;

        if ( params.singleton )
            if (XNative.singleton)
                return XNative.singleton;
            else
                XNative.singleton = me;

        var mixins = XNative.mixins;

        arrayEach( mixins , function (mixin) {

            var name = mixin.name , mixinClass = mixin.mixin;

            if( name ){
                var mixins = ns( 'mixins' , me ) , fn = function(){
                    return mixinClass.apply( this , args )
                };
                fn.prototype = mixinClass.prototype;
                mixins[ name ] = new fn();
            }else{
                mixinClass.prototype.initialize && mixinClass.prototype.initialize.apply( me , args);
            }
        });

        return me.initialize && me.initialize.apply(me, arguments) || me;
    }


    /**
     * @namespace XClass.utils
     * */
    XClass.utils = {
        /**
         * @name XClass.utils.objectEach
         * @function
         * @desc Iterates through an object and invokes the given callback function for each iteration
         * @param {Object} object  The object ot iterate
         * @param {Function} fn  The callback function
         * @param {Object} scope  The scope for the callback function (point to this)
         */
        objectEach:objectEach,
        /**
         * @name XClass.utils.arrayEach
         * @function
         * @desc Iterates an array and invokes the given callback function for each iteration , It will call Array.prototype.forEach if supported
         * @param {Array} object  The array ot iterate
         * @param {Function} fn  The callback function
         */
        arrayEach:arrayEach,
        /**
         * @name XClass.utils.ns
         * @function
         * @desc Creates namespaces to be used for scoping variables
         * @param {String} name  dot-namespaced format namespaces, for example: 'Myapp.package'
         * @returns {Object} object The namespace object, if name is null , it returns the global
         */
        ns:ns
    };

    /**
     * @name XClass.define
     * @desc define a class
     * @param {String} className The class name to create in string dot-namespaced format, for example: 'Myapp.MyClass'
     * @param {Object} params The parameters for the new Class
     * @returns {XNative} The XNative Class
     */

    XClass.define = function (className, params) {
        if (className) {
            var lastIndex = className.lastIndexOf('.') , newClass;
            return ns(lastIndex === -1 ? null : className.substr(0, lastIndex))[ className.substr(lastIndex + 1) ] = new XClass(params);
        } else
            throw new Error('empty class name!');
    };

    global.XClass = XClass;

    // amd support
    if (typeof define === 'function' && define.amd)
        define('xclass', [], function () {
            return XClass;
        });

})(window);