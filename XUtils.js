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

                var type = this.typeOf( object );

                if( object.nodeType && object.cloneNode )
                    return object.cloneNode( true );

                switch( type ){
                    case 'date':
                        return new Date( object.getTime() );
                    case 'array':
                        var c = [];
                        this.forEach( object , function( o , i ){
                            c[ i ] = this.clone( o );
                        });
                        return c;
                    case 'object':
                        var c = {};
                        this.object.each( object , function( k , v ){
                            c[ k ] = this.clone( v );
                        } );
                        return c;
                    default :
                        return object;
                }
            },
            object : {
                each : XClass.object.each
            },
            array : {
                forEach : XClass.array.forEach
            }
        }
    });

    w.XUtils = XUtils;

})(window);