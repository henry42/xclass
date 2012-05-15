(function( w , d ){
	if( d.addEventListener )
		d.addEventListener('keydown',onKeyDown , false);
	else if(d.attachEvent )
		d.attachEvent('keydown' , onKeyDown);
	
	var _div , _logs = [] , isOpened = false , times = {};
	var _console = {
        CLIENT_TIME : new Date().getTime(),
        time : function( label ){
            times[ label ] = new Date().getTime();
            return this;
        },
        timeEnd : function( label ){
            return this.log( label , ':' , new Date().getTime() - times[label] || 0 , 'ms');
        }
    };
	
	
	for(var _t = ['info','error','debug','log','warn'] , i = 0 , _type ; _type = _t[i] ; i++ ){
		(function( _type ){
			_console[ _type ] = function(){
				_logs.push('<b>[' + _type.toUpperCase() + ']</b>'  + Array.prototype.slice.call(arguments).join(' ').replace(/&/g,'&amp;').replace(/</g,'&lt;') );
                if( isOpened )
                    refreshDiv();
                return this;
			}
		})( _type );
	}
	
	function onKeyDown( evt ){
		evt = evt || event;
		if( evt && evt.keyCode === 121 && evt.altKey && evt.ctrlKey ){
            toggleDiv();
		}
	}

    function toggleDiv(){
        var _div = getDiv();
        isOpened = !isOpened;
        _div.style.display = isOpened ? 'block' : 'none';
        if( isOpened )
            refreshDiv();
    }

    function refreshDiv(){
        getDiv().innerHTML = _logs.join('<br>');
    }

	var _style = _console.style = {
		backgroundColor : '#000',
		display : 'none',
		position : window.XMLHttpRequest ? 'fixed' : 'absolute',
		top : '0px',
		right : '0px',
		height : '50%',
		width : '50%',
        padding: '5px',
        border:'1px solid #eee',
		color :'#fff',
		opacity : 0.7,
		filter : 'alpha(opacity=70)',
		margin : '5px',
		border : '1px solid #000',
		fontWeight : 500,
		zIndex : 100000,
        overflow:'auto',
        boxShadow: '0 0 5px 2px #000'
	};
	
	function getDiv(){
		if( _div )
			return _div;
		_div = document.createElement('div');
		
		for( var _x in _style ){
			_div.style[ _x ] = _style[_x];
		}
		
		document.body.appendChild( _div );
		return _div;
	}
	
	w.Logger = _console;

    _console.info('[UA]' , navigator.userAgent );

    // amd support
    if( typeof define === 'function' && define.amd )
        define('logger',[],function(){ return Logger; } );

})( window , document );