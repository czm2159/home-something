/*
1.实现一个new操作符
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