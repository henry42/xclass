(function( w ){

	var OBJECT_EACH = function( obj , func , scope ){
		for( var x in obj )
			if( obj.hasOwnProperty(x) )
				func.call( scope || w , x , obj[x] );
	};

	var ARRAY_EACH = function( obj , func , scope ){
		for( var i = 0 , len = obj.length ; i < len ; i++ )
			func.call( scope || w , i , obj[i] );
	};

	var EXTEND_CALLER = function( params ){
		OBJECT_EACH( params , function( name , value  ){
			var prev = this.fn[ name ];
			this.fn[ name ] = value;
			value.$name = name;
			value.$owner = this;
			if( prev )
				value.$prev = prev;
		} , this );
	};

	var OVERRIDE_CALLER = function( params ){
		EXTEND_CALLER.call( this , params  );
	};

	var MIXIN_CALLER = function( obj ){
		this.mixins.push( obj );
		EXTEND_CALLER.call( this , obj.fn  );
	};

	var OVERRIDDEN_CALLER = function(){
		var caller = OVERRIDDEN_CALLER.caller;
		if( !caller.$prev )
			throw('no overridden method');
		else
			return caller.$prev.apply( this , arguments );
	};

	var PARENT_CALLER = function(){
		var caller = PARENT_CALLER.caller , superClass = caller.$owner && caller.$owner.superclass , name = caller.$name;
		if( !superClass )
			throw('no super class');
		else{
			if( !name )
				throw('unknown method name');
			else if( !superClass.fn[ name ] )
				throw('super class has no ' + name + ' method');
			else
				return superClass.fn[ name ].apply( this , arguments );
		}
	};
	
	var PROCESSOR = {
		'statics' : function( newClass , value  ){
			OBJECT_EACH( value , function( k , v ){
				newClass[ k ] = v;
			});
		},
		'extend' : function( newClass , value ){
			var superClass = value , fn = newClass.fn , superFn = superClass.fn;
			newClass.superclass = fn.superclass = value;
			newClass.mixins.push.apply( newClass.mixins , superClass.mixins );
			OBJECT_EACH( superFn , function( k ,v ){
				fn[ k ] = v;
			});
		},
		'mixins' : function( newClass , value ){
			ARRAY_EACH( value , function( k , v ){
				newClass.mixin( v );
			});
		}
	};

	var PROCESSOR_KEYS = ['statics','mixins','extend'];

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

			ARRAY_EACH( NewClass.mixins , function( index , mixin ){
				mixin.prototype.initialize && mixin.prototype.initialize.apply( me , args );
			});
			return me.initialize && me.initialize.apply( me , arguments ) || me;
		};

		var fn = NewClass.fn = NewClass.prototype;

		fn.parent = PARENT_CALLER;
		fn.overridden = OVERRIDDEN_CALLER;

		NewClass.override = OVERRIDE_CALLER;
		NewClass.mixin = MIXIN_CALLER;
		NewClass.mixins = [];
		var methods = {};

		ARRAY_EACH( PROCESSOR_KEYS , function( index, key ){
			if( params[ key ] )
				PROCESSOR[ key ]( NewClass  , params[ key ] , key );
		});

		OBJECT_EACH( params , function( k , v ){
			if( !PROCESSOR[ k ] )
				methods[ k ] = v;
		});
		
		NewClass.override( methods );

		return NewClass;
	}

	

	w.XClass = XClass;

    // amd support
    if( typeof define === 'function' && define.amd )
        define('xclass',[],function(){ return XClass; } );

})(window);