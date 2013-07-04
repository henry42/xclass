/**
@module xclass
**/
(function (global) {
    'use strict'

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

    var wrapFunction = function( func ){
        var wrapper = function(){
            var lastCaller = this.$caller , rtn;
            this.$caller = wrapper;
            rtn = func.apply( this , arguments );
            this.$caller = lastCaller;
            return rtn;
        };
        wrapper.prototype = func.prototype;
        return wrapper;
    };

    var extend = function (params, notOverridden) {
        var me = this;
        objectEach(params, function (name, value) {
            var prev = me[ name ];
            if (prev && notOverridden === true)
                return;
            if (typeof value === 'function' && name !== 'parent' && !notOverridden ) {
                var m = me[ name ] = wrapFunction( value );
                m.$name = name;
                m.$owner = this;
                m.$orgin = value;
                if (prev)
                    m.$prev = prev;
            }else{
                me[ name ] = value;
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
	Base Class , All classes created by XClass inherit from XNative
	
	@class XNative
	@param {Object} params The constructor parameters.
     */

    var XNative = function ( params ) {

    };

    /**
 	When mixin class is XNative , the mixin scope will be 'this' ( the mixed-in-instance )
 	or mixin class is object like { name : 'MixinClass' , mixin : MixinClass } , the mixin scope will be this.mixins.mixinClass
 	
 	@method mixin
	@static
	@param {XNative|Object} mixinClass
	@return {XNative} itself
     */

    XNative.mixin = function ( mixinClass , name  ) {
        this.mixins.push( { name : name , mixin : mixinClass } );
        return this;
    };

    /**
	Implement functions to class

	@method implement
	@static
	@param {Object} params
	@param {Boolean} safe

	@return {XNative} itself
     */
    XNative.implement = function ( params , safe ) {
        extend.call(this.prototype, params , safe );
        return this;
    };

    /**
	constructor function
	@method initialize
     */
    XNative.prototype.initialize = function () {};

    /**
	Implement functions to instance

	@method implement
	@param {Object} params
	@param {Boolean} safe

	@return {XNative} itself
     */

    XNative.prototype.implement = function ( params , safe ) {
        extend.call(this, params , safe );
        return this;
    };


    /**
    	Call super class's function having the same function name

    	@method parent
     */
    XNative.prototype.parent = function () {
        var caller = this.$caller ,
            func = caller && caller.$prev;
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
            newClass.implement( superPrototype );

            //process mixins
            var mixins = newClass.mixins = [];

            if (superClass.mixins)
                mixins.push.apply( mixins , superClass.mixins );


            newClass.superclass = prototype.superclass = superPrototype;
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
	Example:

    	new XClass({
    		statics : {
    			static_method : function(){}
    		},
    		method1 : function(){},
    		method2 : function(){},
    		extend : ExtendedClass,
    		mixins : [ MixedClass1 , MixedClass2 ],
    		singleton : false
     	});
	@class XClass
	@main
	@constructor
	@param  {Object} params
	@return {XNative} The new class
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
    @class utils
    @namespace XClass
    @static
    */

    XClass.utils = {
        /**
		Iterates through an object and invokes the given callback function for each iteration
		
		@method objectEach
		@static
		@param {Object} object  The object ot iterate
		@param {Function} The callback function
         */
        objectEach:objectEach,
        /**
		Iterates an array and invokes the given callback function for each iteration , It will call Array.prototype.forEach if supported

		@method arrayEach
		@static
		@param {Array} object  The array ot iterate
		@param {Function} The callback function
         */
        arrayEach:arrayEach,
        /**
		
		Creates namespaces to be used for scoping variables
		
		@method ns
		@static
		@param {String} name  dot-namespaced format namespaces, for example: 'Myapp.package'
		@param {Object} root  the root object, global if null
		@return {Object} The namespace object, if name is null , it returns the root
         */
        ns:ns
    };

    /**
    	Define a class

    	@static
    	@for XClass
    	@method define
    	@param {String} className The class name to create in string dot-namespaced format, for example: 'Myapp.MyClass'
    	@param {Object} params The parameters for the new Class
    	@return {XNative} The XNative Class
     */

    XClass.define = function (className, params) {
        if (className) {
            var lastIndex = className.lastIndexOf('.');
            return ns(lastIndex === -1 ? null : className.substr(0, lastIndex))[ className.substr(lastIndex + 1) ] = new XClass(params);
        } else
            throw new Error('empty class name!');
    };

    /**
        @property version
        @type {String}
     */
    XClass.version = "2.0.1";

    global.XClass = XClass;

    // amd support
    if (typeof define === 'function' && define.amd)
        define('xclass', [], function () {
            return XClass;
        });

})(window);