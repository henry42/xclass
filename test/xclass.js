//if nodejs
if( typeof require !== 'undefined' ){
    XClass = require('../XClass.js');
    expect = require('expect.js');
}
//end - if nodejs



describe('XClass', function(){

    var Mixable = new XClass({
        initialize : function(){
            this.mType = 'default';
        },
        setMType : function( mType ){
            this.mType = mType;
        },
        getMType : function(){
            return this.mType;
        }
    });

    var SingletonClass = new XClass({
        singleton : true
    });

    var root = {};

    XClass.define('A',{
        mixins : [ Mixable , { name : 'm' , mixin : Mixable }],
        print : function( w ){
            return w;
        },
        statics : {
            isA : function(){
                return true;
            },
            print : function(){
                return "A's static method";
            }
        }
    },root);

    var A = root.A;


    var AA = new XClass({
        extend : A,
        print : function( w ){
            return "'" + this.parent(w) + "'";
        },
        statics : {
            print : function(){
                return "AA's static method";
            }
        }
    });


    describe('static method', function(){

        it('static method should be called', function(){
            expect(A.isA()).to.be.ok();
        });

        it('static method extended should be called', function(){
            expect(AA.isA()).to.be.ok();
        });

        it("child's static method should be called", function(){
            expect(A.print()).to.be.equal("A's static method");
        });

        it("static method can be overridden", function(){
            expect(AA.print()).to.be.equal("AA's static method");
        });

    });


    describe('method', function(){

        var w = 'Hello World';

        it('method should be called', function(){
            expect(new A().print(w)).to.equal(w);
        });

        it('method on extended class should be called', function(){
            expect(new AA().print(w)).to.equal("'" + w  + "'");
        });

    });


    describe('implement method', function(){

        var AA2 = new XClass({ extend : A }),
            w = 'Hello World',
            a = new AA2();

        AA2.implement({
            print : function( w ){
                return '"' + this.parent(w) + '"';
            }
        });

        a.implement({
            print : function( w ){
                return "'" + this.parent( w ) + "'";
            }
        });

        it('method on implement class should be called', function(){
            expect(new AA2().print(w)).to.equal( '"' + w + '"' );
        });

        it('method on implemented instance should be called', function(){
            expect(a.print( w )).to.equal("'\"" + w + "\"'");
        });

    });


    describe('mixin', function(){

        var a = new A(),
            aa = new AA();

        a.mixins.m.setMType("a's type");
        aa.mixins.m.setMType("aa's type");

        it('mixin method should be called', function(){
            expect(a.getMType()).to.equal('default');
        });

        it('mixin method on extend class should be called', function(){
            expect(aa.getMType()).to.equal('default');
        });

        it('mixin method having name should be called', function(){
            expect(a.mixins.m.getMType()).to.equal("a's type");
        });

        it('mixin method having name on extend class should be called', function(){
            expect(aa.mixins.m.getMType()).to.equal("aa's type");
        });


    });


    describe('instanceOf', function(){

        var a = new A(),
            aa = new AA();
        it("instance is 'instanceOf' class",function(){
            expect(XClass.instanceOf(a,A)).to.equal(true);
        });

        it("class is not 'instanceOf' instance",function(){
            expect(XClass.instanceOf(AA,a)).to.equal(false);
        });

        it("extend class's instance is 'instanceOf' parent",function(){
            expect(XClass.instanceOf(aa,A)).to.equal(true);
        });

        it("extend class is not 'instanceOf' parent",function(){
            expect(XClass.instanceOf(AA,A)).to.equal(false);
        });


    });


    describe('singleton', function(){

        it('singleton should be equal',function(){
            expect(new SingletonClass()).to.equal(new SingletonClass());
        });

        it('common instance should be equal',function(){
            expect(new A()).to.not.equal(new A());
        });

    });
});
