import { Test, TestingModule } from '@nestjs/testing';
import { ApiV1Controller } from './api-v1.controller';

describe('ApiV1Controller', () => {
  let controller: ApiV1Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiV1Controller],
    }).compile();

    controller = module.get<ApiV1Controller>(ApiV1Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
