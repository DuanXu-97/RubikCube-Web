# -*- coding: utf-8 -*-
from RubikCubeWebApp.calculate_states.cube import Cube
from RubikCubeWebApp.calculate_states.cube_string import CubeString
from RubikCubeWebApp.calculate_states.enums import Colors, Moves


def reorder(s):
    """
    将当前web所给的 ULFRBD 顺序转换为 UDLRBF 顺序
    """
    up = s[0:9]
    left = s[9:18]
    front = s[18:27]
    right = s[27:36]
    back = s[36:45]
    down = s[45:54]
    return up + down + left + right + back + front


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
        for ch in reorder(s):
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

if __name__ == '__main__':
    # s = convert_states_to_str(
    #     [29, 41, 36, 39, 4, 10, 27, 50, 45, 0, 52, 8, 1, 13, 14, 9, 46, 44, 53, 12, 51, 30, 22, 34, 18, 23, 47, 11, 21,
    #      33, 43, 31, 32, 35, 48, 2, 42, 25, 20, 16, 40, 7, 6, 5, 15, 17, 3, 24, 37, 49, 19, 26, 28, 38])
    # print(s)
    s = 'UUUUUUUUULLLLLLLLLFFFFFFFFFRRRRRRRRRBBBBBBBBBDDDDDDDDD'
    print(s)
    cs = CubeString(s, ordering='ULFRBD').reorder(ordering='URFDLB')
    print(cs)
    # print(cs.reorder(ordering='UDLRBF'))
    # print(cs.reorder(ordering='URFDLB'))
