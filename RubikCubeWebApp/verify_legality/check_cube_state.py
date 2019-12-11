# -*- coding: utf-8 -*-
import sys

sys.path.append('../')
from RubikCubeWebApp.calculate_states.model.cube import Cube
from RubikCubeWebApp.calculate_states.cube_string import CubeString
from RubikCubeWebApp.calculate_states.enums import Colors, Moves


def simple_check_input(s):
    """
    初步简单检查输入是否合法，首先判断输入长度是否为9x6=54，
    然后通过统计U,L,F,R,B,D六个字母出现次数是否都为9

    :param s: 表示三阶魔方六个面状态的字符串
    :return: True表示输入基本合法，False表示不合法
    """
    ret = True
    if len(s) != 54:
        ret = False
    else:
        lst = [9, 9, 9, 9, 9, 9]
        for i in s:
            lst[Moves[i].value] -= 1
        if sum(lst) != 0:
            ret = False
    return ret


def check(s):
    simple_check_result = simple_check_input(s)
    if simple_check_result is True:
        state = []
        # 将web所给的 ULFRBD 顺序转换为 UDLRBF 顺序
        string = CubeString(s, ordering='ULFRBD').reorder(ordering='UDLRBF')
        for ch in string:
            state.append(Colors(Moves[ch].value))
        cube = Cube(state)
        model_check_result = cube.get_states()

        if model_check_result is not None:
            return True

    return False
