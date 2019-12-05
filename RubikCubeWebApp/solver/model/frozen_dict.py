# -*- coding: utf-8 -*-
"""
Utilities
"""


class FrozenDict(dict):
    __doc__ = dict.__doc__

    def _delattr(func):
        def EmptyAttribute(self, *args, **kwargs):
            raise AttributeError(
                "'FrozenDict' object has no attribute '{0}'".format(func.__name__)
            )
        return EmptyAttribute

    del _delattr
