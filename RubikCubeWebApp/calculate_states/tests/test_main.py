# -*- coding: utf-8 -*-
import unittest

from RubikCubeWebApp.calculate_states.tests.test_cases import STATES, STRS
from RubikCubeWebApp.calculate_states.main import *


class TestMain(unittest.TestCase):
    """测试 main.py 中的三个函数"""

    def test_simple_check_input(self):
        for i in range(len(STRS)):
            self.assertEqual(simple_check_input(STRS[i]), True)

    def test_calculate_states(self):
        for i in range(len(STATES)):
            self.assertEqual(str(calculate_states(STRS[i])), str(STATES[i]))

    def test_convert_states_to_str(self):
        for i in range(len(STATES)):
            self.assertEqual(convert_states_to_str(STATES[i]), STRS[i])
