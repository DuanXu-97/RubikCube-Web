class Config:
    def __init__(self):
        self.env = 'cube3'
        self.use_gpu = False
        self.model_loc = '../savedModels/cube3/1/'
        self.model_name = 'model.meta'
        self.bfs = 0
        self.nnet_parallel = 500
        self.depth_penalty = 0.2
        self.verbose = 'store_true'
