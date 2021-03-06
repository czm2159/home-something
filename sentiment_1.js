今天面试了一家公司，笔试题中有一道题：用递归的形式输出一个金字塔串，例如123454321，234565432。
我的第一印象是没有规定输入，如果是一个无序的字符串或数组，里面可能包含数字和字母，这个就太复杂了，应该不是这样，再仔细看看输出，嗯，我想应该是有两个参数，一个是起始数字（s），一个是结束数字（e），（参数类型检测本文不进行讨论，不然没有重点了）再来确定下结束条件，如果s == e，返回's'或者'e'，于是，我就草率的写了如下的方法：
function recursion(s,e){
	if(s == e) return ''+s;
	return recursion(s,e-1) + e + recursion(s,e-1).split('').reverse().join('');
}
直接提交，然后人事聊天，走人，回家路上回想了一下，感觉糟糕，真是太大意了，到家赶紧打开电脑，思考正确的答案，先列举出几个例子找规律：
fn(1,4) = 1234321;
fn(1,3) =  12321;
fn(2,5) = 2345432;
fn(2,4) =  23432;
fn(2,3) =   232;
由此可见：fn(n) = fn(n-1)*10 + X，新问题又来了，这个X是什么？这个X应该是s(1+)s的形式，即开头和结尾是起始字符s，中间全部是1的一个串，生成方法可以想到：
function n1(n,s){
	return +Array(n).fill(1).join('').replace(/^.(1+).$/,s+'$1'+s);
}
因为arguments.callee方法不建议使用，所以匿名递归就不要用了，也可以把这个生成X的方法挂到方法上：recursion.n1 = n1;
所以本题的解应该是：
function recursion(s,e){
	if(s == e) return s;
	return recursion(s,e-1)*10 + recursion.n1((e-s)*2+1,s);
}
