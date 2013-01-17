(function (global) {

    var objectEach = function (obj, fn , scope  ) {
        for (var x in obj)
            fn.call( scope, x, obj[x] );
    };

    var arrayEach = Array.prototype.forEach ? function (array, fn ,scope) {
        return array.forEach( fn ,scope )
    } : function (obj, fn , scope) {
        for (var i = 0 , len = obj && obj.length || 0; i < len; i++)
            fn.call( scope , obj[i], i);
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

    var XNative = function ( params ) {

    };

    /**
     * @name XNative.mixin
     * @function
     * @desc mixin
     * @param {XNative|Object} mixinClass
     * When mixin class is XNative , the mixin scope will be 'this' ( the mixed-in-instance )
     * or mixin class is object like { name : 'MixinClass' , mixin : MixinClass } , the mixin scope will be this.mixins.MixinClass
     *
     * @returns self
     */

    XNative.mixin = function ( mixinClass , name  ) {
        this.mixins.push( { name : name , mixin : mixinClass } );
        return this;
    };

    /**
     * @name XNative.implement
     * @function
     * @desc implement functions to class
     * @param {Object} params
     * @returns self
     */
    XNative.implement = function ( params , safe ) {
        extend.call(this.prototype, params , safe );
        return this;
    };

    /**
     * @name XNative#initialize
     * @function
     * @desc constructor function
     */
    XNative.prototype.initialize = function () {};

    /**
     * @name XNative#implement
     * @function
     * @desc implement functions to instance
     * @param {Object} params
     * @returns self
     */

    XNative.prototype.implement = function ( params , safe ) {
        extend.call(this, params , safe );
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
            superClass = superClass || XNative;
            var prototype = newClass.prototype , superPrototype = superClass.prototype;


            //process statics
            objectEach(superClass, function (k, v) {
                if( !( k in newClass ) )
                    newClass[ k ] = v;
            });

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
            if( value )
                arrayEach(value, function (v) {
                    if( typeof v === 'function')
                        newClass.mixin( v );
                    else if( v.mixin )
                        newClass.mixin( v.mixin , v.name )
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

        params = params || {};

        var XNative = function(){
            return reset( this , XNative , params , arguments );
        };

        var methods = { $constructor : XNative };

        arrayEach(PROCESSOR_KEYS, function (key) {
            PROCESSOR[ key ](XNative, params[ key ], key);
        });

        objectEach(params, function (k, v) {
            if ( !PROCESSOR.hasOwnProperty( k ) )
                methods[ k ] = v;
        });

        extend.call(XNative.prototype, methods);

        return XNative;
    }

    function reset( instance , XNative , params , args ){

        var me = instance;

        if ( params.singleton )
            if (XNative.singleton)
                return XNative.singleton;
            else
                XNative.singleton = me;

        var mixins = XNative.mixins;

        arrayEach( mixins , function (mixin) {

            var name = mixin.name ,
                mixinClass = mixin.mixin ,
                fn = function(){ return mixinClass.apply( this , args );},
                obj;

            fn.prototype = mixinClass.prototype;

            obj = new fn();

            if( name )
                ns( 'mixins' , me )[ name ] = obj;
            else
                me.implement( obj , true );

        });

        return me.initialize && me.initialize.apply(me, args ) || me;
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
         * @param {Function} The callback function
         */
        objectEach:objectEach,
        /**
         * @name XClass.utils.arrayEach
         * @function
         * @desc Iterates an array and invokes the given callback function for each iteration , It will call Array.prototype.forEach if supported
         * @param {Array} object  The array ot iterate
         * @param {Function} The callback function
         */
        arrayEach:arrayEach,
        /**
         * @name XClass.utils.ns
         * @function
         * @desc Creates namespaces to be used for scoping variables
         * @param {String} name  dot-namespaced format namespaces, for example: 'Myapp.package'
         * @param {Object} root  the root object, global if null
         * @returns {Object} The namespace object, if name is null , it returns the root
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
            var lastIndex = className.lastIndexOf('.');
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