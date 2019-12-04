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
        temp = cube.get_states()
        if temp:
            # 将结果转换为神经网络的输入格式
            FEToState = [6, 3, 0, 7, 4, 1, 8, 5, 2, 15, 12, 9, 16, 13, 10, 17, 14, 11, 24, 21, 18, 25, 22, 19, 26, 23,
                         20, 33, 30, 27, 34, 31, 28, 35, 32, 29, 38, 41, 44, 37, 40, 43, 36, 39, 42, 51, 48, 45, 52, 49,
                         46, 53, 50, 47]
            ret = [temp[idx] for idx in FEToState]
    return ret


def convert_states_to_str(states):
    """
    给定DeepCubeA表示状态的输入，以web的表示形式（ULFRBD）输出

    :param states: 长度为54的列表，神经网络的输入
    :return: 用 ULFRBD 等字符表示魔方各面状态的字符串
    """
    # 将神经网络的输入进行转换
    StateToFE = [2, 5, 8, 1, 4, 7, 0, 3, 6, 11, 14, 17, 10, 13, 16, 9, 12, 15, 20, 23, 26, 19, 22, 25, 18, 21, 24,
                 29, 32, 35, 28, 31, 34, 27, 30, 33, 42, 39, 36, 43, 40, 37, 44, 41, 38, 47, 50, 53, 46, 49, 52,
                 45, 48, 51]
    state = [states[idx] for idx in StateToFE]

    # 将数字转换为对应的面
    temp = []
    for s in state:
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
