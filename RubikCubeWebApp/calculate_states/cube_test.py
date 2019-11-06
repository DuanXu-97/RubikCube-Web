import unittest
from .main import calculate_states, simple_check_input

class CubeTestCase(unittest.TestCase):
    def test_simple_check_input(self):
        input_str = 'LLLLLFFFFFFFFFRRRRRRRRRBB'
        expect = False
        self.assertEqual(simple_check_input(input_str), expect)

    """
    测试方法：
    在 http://deepcube.igb.uci.edu/ 中打乱一个魔方，
    在浏览器控制台输入state获得当前魔方的状态数组，作为expect预期输出。

    在 http://159.226.5.97:9006/ 中将打乱后的魔方输入，得到一个表示当前状态的字符串作为输入
    """
    def test_init(self):
        input_state = 'UUUUUUUUULLLLLLLLLFFFFFFFFFRRRRRRRRRBBBBBBBBBDDDDDDDDD'
        expect = '[2, 5, 8, 1, 4, 7, 0, 3, 6, 11, 14, 17, 10, 13, 16, 9, 12, 15, 20, 23, 26, 19, 22, 25, 18, 21, 24, ' \
                 '29, 32, 35, 28, 31, 34, 27, 30, 33, 42, 39, 36, 43, 40, 37, 44, 41, 38, 47, 50, 53, 46, 49, 52, 45, ' \
                 '48, 51]'
        self.assertEqual(str(calculate_states(input_state)), expect)

    def test_case_1(self):
        input_state = 'DBLRUFUBRBDLBLBRDDFLFRFURUUDLUFRLRDDBDLUBULRBBRFFDLUFF'
        expect = '[9, 39, 20, 30, 4, 46, 0, 43, 27, 36, 32, 53, 48, 13, 21, 8, 52, 45, 42, 16, 26, 41, 22, 37, 35, ' \
                 '14, 15, 17, 25, 2, 50, 31, 23, 29, 10, 11, 38, 28, 24, 5, 40, 1, 18, 12, 44, 47, 19, 51, 34, 49, 3, ' \
                 '33, 7, 6]'
        self.assertEqual(str(calculate_states(input_state)), expect)

    def test_case_2(self):
        input_state = 'BURBUFUDBLLLULURLFFRRBFBDDFDLBDRRURUULDFBFLRFLFRDDUDBB'
        expect = '[42, 1, 35, 43, 4, 46, 0, 16, 36, 24, 48, 29, 10, 13, 7, 17, 37, 44, 18, 19, 26, 3, 22, 5, 27, 21, ' \
                 '45, 15, 25, 38, 12, 31, 28, 6, 32, 2, 51, 34, 20, 50, 40, 52, 9, 23, 8, 47, 30, 33, 41, 49, 39, 11, ' \
                 '14, 53]'
        self.assertEqual(str(calculate_states(input_state)), expect)

    def test_case_3(self):
        input_state = 'ULRRUDBBFBDRFLBFFLDUUDFRBDBLFFBRULRFDBRLBUDURULDLDFURL'
        expect = '[8, 19, 27, 30, 4, 14, 36, 41, 47, 2, 21, 9, 25, 13, 52, 6, 32, 24, 38, 16, 33, 50, 22, 39, 53, 46, ' \
                 '20, 26, 48, 51, 37, 31, 1, 18, 28, 45, 29, 7, 11, 3, 40, 23, 35, 43, 17, 15, 5, 0, 12, 49, 34, 44, ' \
                 '10, 42]'
        self.assertEqual(str(calculate_states(input_state)), expect)


if __name__ == '__main__':
    unittest.main()
