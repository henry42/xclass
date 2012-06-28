(function( w , d ){
    if( d.addEventListener )
        d.addEventListener('keydown',onKeyDown , false);
    else if(d.attachEvent )
        d.attachEvent('onkeydown' , onKeyDown);

    var _div , _bgDiv , _logs = [] , isOpened = false , times = {};
    var _console = {
        CLIENT_TIME : new Date().getTime(),
        time : function( label ){
            times[ label ] = new Date().getTime();
            return this;
        },
        timeEnd : function( label ){
            return this.log( label , ':' , new Date().getTime() - times[label] || 0 , 'ms');
        },
        _logs : _logs
    };


    for(var _t = ['info','error','debug','log','warn'] , i = 0 , _type ; _type = _t[i] ; i++ ){
        (function( _type ){
            _console[ _type ] = function(){
                _logs.push('<b>[' + _type.toUpperCase() + ']</b>&nbsp;'  + Array.prototype.slice.call(arguments).join(' ').replace(/&/g,'&amp;').replace(/</g,'&lt;') );
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
        isOpened = !isOpened;
        if( isOpened )
            showDiv();
        else
            hideDiv();
        if( isOpened )
            refreshDiv();
    }

    function refreshDiv(){
        getDiv().innerHTML = _logs.join('<br>');
    }

    var isIE6 = !window.XMLHttpRequest, _style = _console.style = {
        display : 'none',
        position : !isIE6 ? 'fixed' : 'absolute',
        top : '0px',
        right : '0px',
        height : isIE6 ? '250px' : '50%',
        width : '50%',
        padding: '5px',
        color :'#fff',
        margin : '5px',
        fontWeight : 500,
        zIndex : 100000,
        overflow:'auto'
    };


    var _bgStyle = {
        backgroundColor : '#000',
        border:'1px solid #000',
        opacity : 0.7,
        filter : 'alpha(opacity=70)',
        boxShadow: '0 0 5px 2px #000'
    };

    function getDiv(){
        if( _div )
            return _div;
        _div = document.createElement('div');
        _div.className = 'x-class-logger';

        _bgDiv = document.createElement('div');
        _bgDiv.className = 'x-class-logger-bg';

        for( var _x in _style ){
            _div.style[ _x ] = _style[_x];
            _bgDiv.style[ _x ] = _style[_x];
        }

        for( var _x in _bgStyle ){
            _bgDiv.style[ _x ] = _bgStyle[_x];
        }

        document.body.appendChild( _bgDiv );
        document.body.appendChild( _div );

        return _div;
    }

    function showDiv(){
        getDiv().style.display = _bgDiv.style.display = 'block';
    }

    function hideDiv(){
        getDiv().style.display = _bgDiv.style.display = 'none';
    }


    w.Logger = _console;

    _console.info('[UA]' , navigator.userAgent );

})( window , document );