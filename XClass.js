(function( w ){

	var OBJECT_EACH = function( obj , func , scope ){
		for( var x in obj  )
			if( obj.hasOwnProperty(x) )
				func.call( scope || w , x , obj[x] );
	};

	var ARRAY_EACH = function( obj , func , scope ){
		for( var i = 0 , len = obj && obj.length || 0 ; i < len ; i++ )
			func.call( scope || w , obj[i] , i );
	};

	var EXTEND = function( params , canOverride , keepHandler ){
		OBJECT_EACH( params , function( name , value  ){
			var prev = this.prototype[ name ];
            if( prev && !canOverride )
                return;
			this.prototype[ name ] = value;
			value.$name = name;
			value.$owner = this;
			if( prev && keepHandler )
				value.$prev = prev;
		} , this );
	};



   var XNative = function( params ){

   };

    XNative.mixin = function( object ){
        this.mixins.push( object );
        this.implement( object.prototype );
    };

    XNative.implement = function( params ){
        EXTEND.call( this , params , true , true );
    };

    XNative.prototype = {
        overridden : function(){
            var caller = this.overridden.caller;
            if( !caller.$prev )
                throw('no overridden method');
            else
                return caller.$prev.apply( this , arguments );
        },
        parent : function(){
            var caller = this.parent.caller , superClass = caller.$owner && caller.$owner.superclass , name = caller.$name;
            if( !superClass )
                throw('no super class');
            else{
                if( !name )
                    throw('unknown method name');
                else if( !superClass.prototype[ name ] )
                    throw('super class has no ' + name + ' method');
                else
                    return superClass.prototype[ name ].apply( this , arguments );
            }
        }
    };


	
	var PROCESSOR = {
		'statics' : function( newClass , methods  ){
			OBJECT_EACH( methods , function( k , v ){
				newClass[ k ] = v;
			});
		},
		'extend' : function( newClass , superClass ){
			var superClass = superClass || XNative , prototype = newClass.prototype , superPrototype = superClass.prototype;

            //process mixins
            newClass.mixins = [];
            if( superClass.mixins )
			    newClass.mixins.push.apply( newClass.mixins , superClass.mixins );

            //process statics
            OBJECT_EACH( superClass , function( k ,v ){
                newClass[ k ] = v;
            })

            //process prototype
			OBJECT_EACH( superPrototype , function( k ,v ){
                prototype[ k ] = v;
			});

            newClass.superclass = prototype.superclass = superClass;
		},
		'mixins' : function( newClass , value ){

			ARRAY_EACH( value , function( v ){
				newClass.mixin( v );
			});
		}
	};

	var PROCESSOR_KEYS = ['statics','extend','mixins'];

    /**
     * @class XClass
     * @description Base Class
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
	function XClass( params ){

        var singleton = params.singleton;

		var NewClass = function(){
			var me = this , args = arguments;

            if( singleton )
                if( NewClass.singleton )
                    return NewClass.singleton;
                else
                    NewClass.singleton = me;

			ARRAY_EACH( NewClass.mixins , function(  mixin ){
				mixin.prototype.initialize && mixin.prototype.initialize.apply( me , args );
			});
			return me.initialize && me.initialize.apply( me , arguments ) || me;
		};


		var methods = {};

		ARRAY_EACH( PROCESSOR_KEYS , function( key ){
			PROCESSOR[ key ]( NewClass  , params[ key ] , key );
		});

		OBJECT_EACH( params , function( k , v ){
			if( !PROCESSOR[ k ] )
				methods[ k ] = v;
		});

        EXTEND.call( NewClass , methods  , true , false );

		return NewClass;
	}

	

	w.XClass = XClass;

    // amd support
    if( typeof define === 'function' && define.amd )
        define('xclass',[],function(){ return XClass; } );

})(window);