# -*- coding: utf-8 -*-
import kociemba

from RubikCubeWebApp.calculate_states.cube_string import CubeString


class KociembaSolver:
    """Herbert Kociemba's two-phase 算法求解三阶魔方"""

    # 表示魔方的目标状态的字符串
    SOLVED_STATE = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB'

    def __init__(self, string):
        """
        构造函数，将传入的字符串转换表示顺序

        :param string: 传入前端表示当前魔方状态的字符串，顺序为 ULFRBD
        """
        self.string = CubeString(string, ordering='ULFRBD').reorder(ordering='URFDLB')

    def solve(self):
        """
        kociemba算法解魔方

        :return: 返回步骤字符串
        """
        return kociemba.solve(self.string)

    def get_moves_to_random_state(self):
        """
        获得从魔方的初始状态到任意状态的解法步骤

        :return: 返回步骤字符串
        """
        return kociemba.solve(self.SOLVED_STATE, self.string)
