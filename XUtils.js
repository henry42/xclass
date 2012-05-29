(function( w ){

    var XUtils = new XClass({
        singleton : true,
        statics : {
            typeOf : function( object ){
                return Object.prototype.toString.call( object).slice( 8 , -1 ).toLowerCase();
            },
            clone : function( object ){
                if( object == null )
                    return object;

                var type = XUtils.typeOf( object );

                if( object.nodeType && object.cloneNode )
                    return object.cloneNode( true );

                switch( type ){
                    case 'date':
                        return new Date( object.getTime() );
                    case 'array':
                        var c = [];
                        XUtils.array.forEach( object , function( o , i ){
                            c[ i ] = XUtils.clone( o );
                        });
                        return c;
                    case 'object':
                        var c = {};
                        XUtils.object.each( object , function( k , v ){
                            c[ k ] = XUtils.clone( v );
                        } );
                        return c;
                    default :
                        return object;
                }
            },
            object : {
                each : XClass.utils.object.each
            },
            array : {
                forEach : XClass.utils.array.forEach
            }
        }
    });

    w.XUtils = XUtils;

})(window);