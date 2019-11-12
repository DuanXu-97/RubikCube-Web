# -*- coding: utf-8 -*-
from .block import Block
from .enums import Faces, Colors
from .rules import RULES


class Cube:
    """魔方类"""

    def __init__(self, state):
        self.faces = []
        for i in range(6):
            # 输入魔方的初始状态
            self.faces.append(CubeFace(state[i * 9:(i + 1) * 9]))

        self.__set_corner_neighbors()
        self.__set_edge_neighbors()
        self.states = self.__solve_indices()

    def __set_corner_neighbors(self):
        """设置上下两个面，每个面各角块的邻块，每个角块各两个邻块"""
        # 设置上面、白色面四个角块的邻块
        self.faces[0].blocks[0].neighbors.append(self.faces[Faces.Left.value].blocks[0])
        self.faces[0].blocks[0].neighbors.append(self.faces[Faces.Back.value].blocks[2])

        self.faces[0].blocks[2].neighbors.append(self.faces[Faces.Back.value].blocks[0])
        self.faces[0].blocks[2].neighbors.append(self.faces[Faces.Right.value].blocks[2])

        self.faces[0].blocks[6].neighbors.append(self.faces[Faces.Left.value].blocks[2])
        self.faces[0].blocks[6].neighbors.append(self.faces[Faces.Front.value].blocks[0])

        self.faces[0].blocks[8].neighbors.append(self.faces[Faces.Front.value].blocks[2])
        self.faces[0].blocks[8].neighbors.append(self.faces[Faces.Right.value].blocks[0])

        # 设置下面、黄色面四个角块的邻块
        self.faces[1].blocks[0].neighbors.append(self.faces[Faces.Left.value].blocks[8])
        self.faces[1].blocks[0].neighbors.append(self.faces[Faces.Front.value].blocks[6])

        self.faces[1].blocks[2].neighbors.append(self.faces[Faces.Front.value].blocks[8])
        self.faces[1].blocks[2].neighbors.append(self.faces[Faces.Right.value].blocks[6])

        self.faces[1].blocks[6].neighbors.append(self.faces[Faces.Left.value].blocks[6])
        self.faces[1].blocks[6].neighbors.append(self.faces[Faces.Back.value].blocks[8])

        self.faces[1].blocks[8].neighbors.append(self.faces[Faces.Back.value].blocks[6])
        self.faces[1].blocks[8].neighbors.append(self.faces[Faces.Right.value].blocks[8])

    def __set_edge_neighbors(self):
        """设置前后左右四个面，每个面各边块的邻块，每个边块一个邻块"""
        # 设置左面、橙色面四个边块的邻块
        self.faces[2].blocks[1].neighbors.append(self.faces[Faces.Up.value].blocks[3])
        self.faces[2].blocks[3].neighbors.append(self.faces[Faces.Back.value].blocks[5])
        self.faces[2].blocks[5].neighbors.append(self.faces[Faces.Front.value].blocks[3])
        self.faces[2].blocks[7].neighbors.append(self.faces[Faces.Down.value].blocks[3])

        # 设置右面、红色面四个边块的邻块
        self.faces[3].blocks[1].neighbors.append(self.faces[Faces.Up.value].blocks[5])
        self.faces[3].blocks[3].neighbors.append(self.faces[Faces.Front.value].blocks[5])
        self.faces[3].blocks[5].neighbors.append(self.faces[Faces.Back.value].blocks[3])
        self.faces[3].blocks[7].neighbors.append(self.faces[Faces.Down.value].blocks[5])

        # 设置背面、蓝色面四个边块的邻块
        self.faces[4].blocks[1].neighbors.append(self.faces[Faces.Up.value].blocks[1])
        self.faces[4].blocks[3].neighbors.append(self.faces[Faces.Right.value].blocks[5])
        self.faces[4].blocks[5].neighbors.append(self.faces[Faces.Left.value].blocks[3])
        self.faces[4].blocks[7].neighbors.append(self.faces[Faces.Down.value].blocks[7])

        # 设置前面、绿色面四个边块的邻块
        self.faces[5].blocks[1].neighbors.append(self.faces[Faces.Up.value].blocks[7])
        self.faces[5].blocks[3].neighbors.append(self.faces[Faces.Left.value].blocks[5])
        self.faces[5].blocks[5].neighbors.append(self.faces[Faces.Right.value].blocks[3])
        self.faces[5].blocks[7].neighbors.append(self.faces[Faces.Down.value].blocks[1])

    def __solve_indices(self):
        """
        根据规则推断每个色块的编码，并得到状态数组

        :return: 返回一个长度为54的列表，表示各面色块情况
        """
        ret = []

        for i in range(6):
            for j in range(9):
                b = self.faces[i].blocks[j]
                if b.index == -1 and len(b.neighbors) > 0:
                    lst = [b.color.name]
                    for x in b.neighbors:
                        lst.append(x.color.name)
                    for rule in RULES:
                        if set(lst) == set(rule.keys()):
                            b.index = rule.get(b.color.name)
                            for x in b.neighbors:
                                x.index = rule.get(x.color.name)
                            break

        for i in range(6):
            ret.extend(self.faces[i].get_states())
        return ret

    def __check_states_are_valid(self):
        """
        检查计算得到的状态数组是否合法

        :return: 若合法返回True，不合法返回False
        """
        ret = True
        lst = [1 for i in range(54)]
        for i in self.states:
            if 0 <= i < 54:
                lst[i] -= 1
            else:
                ret = False
                break
        if sum(lst) != 0:
            ret = False
        return ret

    def get_states(self):
        if self.__check_states_are_valid():
            return self.states
        else:
            return None

    def display(self):
        """打印魔方各面的颜色，用于调试"""
        for i in range(6):
            # print(Colors(i).name, end=': ')
            self.faces[i].display()


class CubeFace:
    """
    魔方的一个面
    """

    def __init__(self, state):
        self.blocks = []
        for c in state:
            self.blocks.append(Block(c))
        # 设置当前面的中心块
        self.blocks[4].set_center_block()

    # def display(self):
    #     """打印当前面所有色块的颜色"""
    #     for b in self.blocks:
    #         print(b.color, end='\t')
    #     print()

    def get_states(self):
        """返回长度为9的列表，包含当前面各色块的编号"""
        ret = []
        for i in self.blocks:
            ret.append(i.index)
        # 若中心块颜色为蓝色,将列表逆序
        if self.blocks[4].color == Colors.Blue:
            ret.reverse()
        return ret
