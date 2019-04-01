/*
一、实现一个new操作符
*/
function New(Constructor,...args){
	//1:创建一个对象，
	const result = {};
	if(Constructor.prototype != null){
		//实例的原型和构造函数的prototype属性指向的是同一个地址
		result.__proto__ = Constructor.prototype;
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
	3.只会处理对象自身的可枚举属性，所以用Object.entries最合适
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
三、实现call或者apply
*/
Function.prototype.Call = function(content = window, ...args){
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
	content.fn = this;
	let res = content.fn(arg);
	delete content.fn;
	return res;
}