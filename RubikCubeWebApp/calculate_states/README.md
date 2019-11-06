# 原理

魔方各色块对应的编号如下图所示：
![](https://image-bed-1253366698.cos.ap-guangzhou.myqcloud.com/cube.png)

通过观察可以发现以下规律：

+ 中心块id可直接通过颜色确定
+ 角块id可通过其相邻的两个不同面色块颜色和自身颜色确定
+ 边块id可通过其相邻的一个不同面色块颜色和自身颜色确定

所以只要将这些规则表示出来，对魔方进行建模，逐一匹配，就能够推断出各色块的编号。

# 测试方法

1. 打开 [deepcube](http://deepcube.igb.uci.edu/)，点击scramble按钮随机打乱魔方，打开浏览器控制台，输入state，得到打乱后表示当前状态的state数组，作为测试用例中的预期输出。
2. 将上一步中打乱后的魔方输入到 [项目网站](http://159.226.5.97:9006/)，在窗口右侧`Modify State`一栏中复制表示当前状态的字符串（形如`UUUUUUUUULLLLLLLLLFFFFFFFFFRRRRRRRRRBBBBBBBBBDDDDDDDDD`），作为测试用例的输入。
3. 在`cube_test.py`中模仿已有的测试方法再新增一个测试方法。

# TODO

-[x] 检验输入的字符串表示的魔方是否合法

