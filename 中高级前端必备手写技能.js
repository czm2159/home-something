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
	2.如果出现循环引用，应该会报错，导致得不到结果，这里不做处理
	3.如果值是对象，数组或者日期，且有toJSON方法，则返回toJson()方法相应的返回值，如果没有返回值，则忽略
	3.只会处理对象自身的可枚举属性，所以用Object.entries最合适
		for...in：自身和原型中的可枚举属性，不包括Symbol
		Object.keys：自身可枚举属性，不包括Symbol
		Object.getOwnPropertyNames：自身可枚举和不可枚举属性，不包括Symbol
		Object.getOwnPropertySymbols：自身Symbol属性
		Reflect.ownKeys：自身的所有属性（可枚举，不可枚举，Symbol）
*/
function JSONStringify(obj){
    let type = typeof obj;
    //如果是值类型，直接返回字符串形式
    if(type !== 'object' && type !== 'function') return (type === 'string')?`"${obj}"`:`${obj}`;
    //定义结果对象
    let res = [], _origin = obj;
    //是否是数组类型
    let isArray = Object.prototype.toString.call(obj).slice(8,-1) === 'Array';
    //循环自身可枚举键值对
    Object.entries(obj).forEach(([key,value]) => {
        type = typeof value;
        //只有不是循环引用才进行处理
        if(value!==obj){
            let keystyle = isArray?'':'"'+key+'":';
            switch(type){
                //值是undefined,symbol和function，不处理
                case 'undefined':
                case 'symbol':
                case 'function':
                    break;
                //值是object，则进行递归处理
                case 'object':
                    res.push(keystyle + JSONStringify((value && typeof value.toJSON === 'function')?value.toJSON():value));
                    break;
                //值是剩下的类型，返回对应的字符串
                default:
                    res.push(keystyle + value);
                    break;
            }
        }
    });
    return isArray?'['+String(res)+']':'{'+String(res)+'}';
}