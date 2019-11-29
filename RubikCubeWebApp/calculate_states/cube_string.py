# -*- coding: utf-8 -*-
from RubikCubeWebApp.calculate_states.enums import Moves


class CubeString:
    """表示魔方各面状态的字符串"""

    def __init__(self, s, ordering='ULFRBD'):
        """
        传入字符串以及顺序

        :param s:
        :param ordering:
        """
        self.cube_string = s
        self.sub = [[], [], [], [], [], []]
        i = 0
        if isinstance(ordering, str):
            for o in ordering:
                self.sub[Moves[o].value].append(s[i:i + 9])
                i = i + 9

    def reorder(self, ordering):
        """
        将字符串转化为任意顺序表示

        :param ordering:
        :return:
        """
        ret = []
        if isinstance(ordering, str):
            for o in ordering:
                ret += self.sub[Moves[o].value]
        return ''.join(ret)

    def __str__(self):
        return self.cube_string
