# -*- coding: utf-8 -*-
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


def calculate_states(s):
    """
    给定三阶魔方各面的颜色情况，计算出各色块的编号，并返回

    :param s: 从前端获得的表示各面颜色的字符串
    :return: 长度为54的列表，作为神经网络的输入；若输入有误则返回None
    """
    ret = None
    if simple_check_input(s):
        state = []
        # 将web所给的 ULFRBD 顺序转换为 UDLRBF 顺序
        string = CubeString(s, ordering='ULFRBD').reorder(ordering='UDLRBF')
        for ch in string:
            state.append(Colors(Moves[ch].value))
        cube = Cube(state)
        ret = cube.get_states()
    return ret


def convert_states_to_str(states):
    """
    给定三阶魔方的状态数组，以web的表示形式输出

    :param states: 长度为54的列表
    :return: 用 ULFRBD 等字符表示魔方各面状态的字符串
    """
    temp = []
    for s in states:
        temp.append(Moves(s // 9).name)
    s = ''.join(temp)
    up = s[0:9]
    down = s[9:18]
    left = s[18:27]
    right = s[27:36]
    # 反转表示背面的字符串
    back = s[36:45][::-1]
    front = s[45:54]
    return up + left + front + right + back + down
