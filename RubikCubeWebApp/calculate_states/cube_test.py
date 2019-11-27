# -*- coding: utf-8 -*-
import unittest

from RubikCubeWebApp.calculate_states.test_cases import STATES, STRS
from .main import *


class TestCube(unittest.TestCase):
    def test_simple_check_input(self):
        input_str = 'LLLLLFFFFFFFFFRRRRRRRRRBB'
        expect = False
        self.assertEqual(simple_check_input(input_str), expect)

    def test_calculate_states(self):
        for i in range(len(STATES)):
            self.assertEqual(str(calculate_states(STRS[i])), str(STATES[i]))

    def test_convert_states_to_str(self):
        for i in range(len(STATES)):
            self.assertEqual(convert_states_to_str(STATES[i]), STRS[i])


if __name__ == '__main__':
    unittest.main()
