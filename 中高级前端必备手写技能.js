/*
一、实现一个new操作符
*/
function New(Constructor,...args){
	//1:创建一个对象，即new出来的对象
	const result = {};
	if(Constructor.prototype != null){
		//实例的原型和构造函数的prototype属性指向的是同一个地址，如果是null
		result.__proto__ = Constructor.prototype;
		//也可以使用ES6的setPrototypeOf方法
		//Object.setPrototypeOf(result,Constructor.prototype);
	}
	//2.用创建的对象执行构造函数，绑定this
	const back = Constructor.apply(result,args);
	//3.如果构造函数有手写返回值，且返回值是个对象（null除外）或者方法，则返回这个手写值
	if(back && (typeof back === 'object' || typeof back === 'function')) return back;
	//否则返回this对象
	return result;
}
/*
二、实现JSON.stringify
	1.如果属性的值是undefined,symbol和function的话，直接忽略该属性；如果这些值出现在数组中，则转为null
	2.如果出现循环引用，应该会报错，导致得不到结果，这里处理为null
	3.如果值是对象，数组或者日期，且有toJSON方法，则返回toJson()方法相应的返回值，如果没有返回值，则忽略
	4.只会处理对象自身的可枚举属性，所以用Object.entries最合适
		for...in：自身和原型中的可枚举属性，不包括Symbol
		Object.keys：自身可枚举属性，不包括Symbol
		Object.getOwnPropertyNames：自身可枚举和不可枚举属性，不包括Symbol
		Object.getOwnPropertySymbols：自身Symbol属性
		Reflect.ownKeys：自身的所有属性（可枚举，不可枚举，Symbol）
*/
function JSONStringify(obj){
	function _innerHandle(obj,parent = null){
        let type = typeof obj, _parent = parent;
        //如果是null，则返回null
        if(obj === null) return null;
        //如果是值类型，直接返回字符串形式
        if(type !== 'object' && type !== 'function') return (type === 'string')?`"${obj}"`:`${obj}`;
        //判断是有否循环引用
        while(_parent){
            //如果发现有循环引用
            if(_parent.originParent === obj) return null;
            //如果没有循环引用，继续向上查找，直到没有父级为止
            _parent = _parent.parent;
        }
        //定义结果对象;是否是数组类型
        let res = [], isArray = Object.prototype.toString.call(obj).slice(8,-1) === 'Array';
        //循环自身可枚举键值对
        Object.entries(obj).forEach(([key,value]) => {
            type = typeof value;
            //数组类型的每一项是不显示key的
            let keystyle = isArray?'':'"'+key+'":';
            switch(type){
                //值是undefined,symbol和function在数组里处理为null，其它情况忽略
                case 'undefined':
                case 'symbol':
                case 'function':
                    if(isArray) res.push('null');
                    break;
                //值是object，则进行递归处理
                case 'object':
                	//如果对象有toJSON方法，处理的就是toJSON方法返回的值
                    let child = (value && typeof value.toJSON === 'function')?value.toJSON():value;
                    res.push(keystyle + _innerHandle(child, {
                        originParent: obj,
                        parent: parent
                    }));
                    break;
                //值是剩下的类型
                default:
                    res.push(keystyle + ((type === 'string')?'"'+value+'"':value));
                    break;
            }
        });
        return isArray?'['+String(res)+']':'{'+String(res)+'}';
    }
	return _innerHandle(obj);
}
/*
三、实现call、apply和bind
	call和apply都是第一个参数当作执行上下文，后面的参数当作调用的参数，唯一的区别在于call是枚举参数，apply是一个数组类的参数
	返回值是执行方法后的返回值
	bind和call相似，不同的是返回值是一个函数，而不是函数的返回值
	tips：函数是可以执行new操作的，bind函数返回的函数如果执行new操作，生成实例的构造函数是调用bind的函数
*/
Function.prototype.Call = function(content = window, ...args){
    //bind方法不是构造函数
    if(typeof this !== 'function') throw new Error('Function.Call is not a constructor!');
	//1.把当前执行方法绑定到当前上下文，使方法执行时this是content参数
	content.fn = this;
	//2.执行该方法，并获得返回值
	let res = content.fn(...args);
	//3.删除方法的绑定
	delete content.fn;
	//4.返回返回值
	return res;
}
Function.prototype.Apply = function(content = window, arg){
    if(typeof this !== 'function') throw new Error('Function.Apply is not a constructor!');
	content.fn = this;
	let res = content.fn(arg);
	delete content.fn;
	return res;
}
Function.prototype.Bind = function(content = window, ...outArgs){
    //bind方法不是构造函数
    if(typeof this !== 'function') throw new Error('Function.bind is not a constructor!');
    //保存调用的函数
    const Origin = this;
    //返回值，可能还有参数传入
    function Result(...innerArgs){
        /*
        绑定this，并把之前保存的参数合并传入执行
        如果这个函数被new了，this就不是bind传入的content参数了
        */
        return Origin.apply(this instanceof Result? this: content,outArgs.concat(innerArgs));
    }
    //返回值的prototype应该和this保持一致，以保证this对象的各种操作
    Result.prototype = Origin.prototype;
    return Result;
}
/*
四、继承
*/
/*
1原型链继承
存在问题：1、所有子类共享一个types属性，2、子类的构造函数是父类，而不是子类
*/
function Shape(){this.types = ['circle','rect','triangle']}
function Circle(){}
//子类的prototype指向父类的实例
Circle.prototype = new Shape();
/*
var c = new Circle();子类的实例
var s = new Shape();父类的实例
c.__proto__ === Circle.prototype;子类的原型
s.__proto__ === Shape.prototype;父类的原型
推导出
c.__proto__.__proto__ === Shape.prototype;
所以子类的实例的含有父类的属性和方法
*/

/*
2借用构造函数
存在问题：1、所有要继承的属性和方法只能在父类构造函数中定义，导致函数无法复用，2、父类原型中的属性和方法，子类不可见
*/
function Shape(){this.types = ['circle','rect','triangle']}
function Circle(){
	//用子类的实例执行父类构造函数方法，子类的实例就拥有了父类构造函数中定义的属性和方法，但是没有涉及到原型
	Shape.call(this);
}

/*
3、组合继承，又叫伪经典继承，是将原型链和借用构造函数融合的继承，js中最常用的继承模式
缺点：无论什么情况下都会调用两次父类的构造函数
*/
function Parent(){}
function Child(){
	//构造函数借用，又调用了一次父类构造函数
	Parent.call(this);
}
//原型链的变更，调用了一次父类构造函数
Child.prototype = new Parent();
//子类实例的构造函数应该是子类，而不是父类
Child.prototype.constructor = Child;

/*
4、原型式继承，参数必须是一个对象
ES5后被规范化方法Object.create()代替，和原型链继承很像，区别是更加小巧，父类的构造函数不是必要的
*/
function object(o){
	//临时构造函数
	function F(){}
	//传入的对象作为该构造函数的原型
	F.prototype = o;
	//返回该构造函数的实例
	return new F();
}

/*
5、寄生式继承，基于原型式继承
由于扩展的方法(本例中的obj.custom)不能复用，所以效率会降低
*/
function createObject(o){
	//使用原型式继承
	var obj = object(o);
	//对继承来的对象进行扩展增强
	obj.custom = function(){
		/* do something */
	}
	//返回这个对象
	return obj;
}

/*
6、寄生组合式继承，结合组合继承和寄生继承的优点，被认为是最有效的继承方式
*/
function inherit(Child,Parent){
	//创建一个以父类原型为为原型的对象
	//由4得出：prototype.__proto__指向Parent.prototype
	var prototype = object(Parent.prototype);
	//该对象的构造函数指向子类
	prototype.constructor = Child;
	//子类的原型对象指向了该对象
	Child.prototype = prototype;
}

function Parent(){}
function Child(){}
inherit(Child,Parent);
var child = new Child();
child.__proto__ === Child.prototype
child.__proto__.__proto__ === Parent.prototype

/*
五、实现函数柯里化
*/
function Currying(fn,args){
	//获取函数的参数个数，柯里化结束条件
	var length = fn.length;
	//看看有没有传入的参数，如果有和之后传入的参数一起
	var args = args || [];
	return function(){
		//逐步添加参数
		var newArgs = args.concat(Array.prototype.slice.call(arguments));
		//如果参数满了，则执行函数
		if(newArgs.length >= length){
			return fn.apply(this,newArgs);
		}
		//参数数量还没有满，可以继续添加
		else{
			return Currying(fn,newArgs);
		}
	}
}
//当然，如果用ES6的话，可以这样(枚举参数)：
const Currying = (fn,...args) => (...arr) => [...args,...arr].length === fn.length? fn(...[...args,...arr]): Currying(fn,...[...args,...arr]);
//或者这样(数组参数)：
const Currying = (fn, arr = []) => (...args) => (arg => arg.length === fn.length? fn(...arg): Currying(fn, arg))([...arr, ...args])

/*
六、实现Promise
*/


/*
七、实现防抖和节流，主要处理高频触发事件，高频触发事件里应尽量减少复杂操作
*/
//防抖(Debouncing)，例如连续点击提交按钮导致表单post了多次
function debounce(fn, wait, immediate){
	//倒计时
	var timeout;
	return function(){
		//保存当前调用对象和事件对象等参数
		var context = this;
		var args = arguments;
		//清理倒计时任务
		timeout && clearTimeout(timeout);
		//如果是立即执行
		if(immediate){
			//没有倒计时地址的时候才执行，如果有则说明事件还不到
			!timeout && fn.apply(context, args);
			timeout = setTimeout(function(){
				//清空倒计时地址
				timeout = null;
			},wait);
		}
		//如果是最后执行
		else{
			timeout = setTimeout(function(){
				fn.apply(context, args);
			},wait);
		}
	}
}
//节流(Throttling)，例如resize事件中计算元素的样式以适应屏幕
function throttle(fn, wait){
	//前一次执行的时刻
	var prevtime;
	return function(){
		//如果第一次执行
		!prevtime && (prevtime = new Date());
		//如果经过的时间超过了阈值，立即执行函数，并把当前时刻作为下一轮的开始时刻
		if((new Date) - prevtime >= wait){
			fn.call(this, arguments);
			prevtime = new Date();
		}
	}
}