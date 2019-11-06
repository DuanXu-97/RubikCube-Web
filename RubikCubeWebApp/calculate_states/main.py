from RubikCubeWebApp.calculate_states.cube import Cube
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


def calculate_states(s):
    """
    给定三阶魔方各面的颜色情况，计算出各色块的编号

    :param s: 从 http://159.226.5.97:9006/ 获得的表示各面颜色字符串
    :return: 长度为54的列表，作为神经网络的输入
    """
    state = []
    for ch in reorder(s):
        state.append(Colors(Moves[ch].value))
    cube = Cube(state)
    return cube.get_states()


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
