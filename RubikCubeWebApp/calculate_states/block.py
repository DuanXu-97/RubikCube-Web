# 色块类，三阶魔方每个面有9个色块
class Block:
    def __init__(self, color):
        # 编号
        self.index = -1
        # 颜色
        self.color = color
        # 不同面相邻块列表
        self.neighbors = []

    # 将当前块设置为中心块
    def set_center_block(self):
        if self.color:
            self.index = self.color.value * 9 + 4
