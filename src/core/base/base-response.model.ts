import { IPaginatedResult } from './paginated-result.model';
import { HttpStatus, Type, applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';

export interface IBaseResponse<T> {
  data?: T;
  message?: string;
  statusCode: number;
}

export class BaseResponse<T> implements IBaseResponse<T> {
  data?: T;
  message?: string;
  statusCode: number;

  constructor(data?: T, message?: string, statusCode = HttpStatus.OK) {
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
  }

  toJson(): IBaseResponse<T> {
    return {
      data: this.data,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

export class BaseResponseDto<T> implements IBaseResponse<T> {
  @ApiPropertyOptional({
    type: String,
    description: 'Optional, may not always be present',
  })
  message?: string;

  @ApiPropertyOptional({
    enum: HttpStatus,
    default: HttpStatus.OK,
    description:
      'The returned HTTP status code. Any of the listed codes could be returned. If code is different than 200, the "message" property might also be valorized',
  })
  statusCode: number;

  data?: T;
}

export class PaginatedBaseResponseDto<T>
  implements IBaseResponse<IPaginatedResult<T>>
{
  @ApiPropertyOptional({
    type: String,
    description: 'Optional, may not always be present',
  })
  message?: string;

  @ApiPropertyOptional({
    enum: HttpStatus,
    default: HttpStatus.OK,
    description:
      'The returned HTTP status code. Any of the listed codes could be returned. If code is different than 200, the "message" property might also be valorized',
  })
  statusCode: number;

  data?: {
    count: number;
    items: T[];
  };
}

export const ApiBaseResponseDto = <T extends Type<any>>(model: T) => {
  return applyDecorators(
    ApiExtraModels(BaseResponseDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseDto) },
          {
            properties: {
              data: {
                type: 'object',
                $ref: getSchemaPath(model),
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiOneOfBaseResponseDto = <T extends Type<any>>(models: T[]) => {
  return applyDecorators(
    ApiExtraModels(BaseResponseDto, ...models),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseDto) },
          {
            properties: {
              data: {
                type: 'object',
                oneOf: models.map((m) => ({ $ref: getSchemaPath(m) })),
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiListBaseResponseDto = <T extends Type<any>>(model: T) => {
  return applyDecorators(
    ApiExtraModels(BaseResponseDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiPaginatedListBaseResponseDto = <T extends Type<any>>(
  model: T,
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedBaseResponseDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedBaseResponseDto) },
          {
            properties: {
              data: {
                properties: {
                  count: {
                    type: 'number',
                  },
                  items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiPrimitiveListBaseResponseDto = (
  type: 'string' | 'number' | 'boolean',
) => {
  return applyDecorators(
    ApiExtraModels(BaseResponseDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { type },
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiBooleanBaseResponseDto = () => {
  return applyDecorators(
    ApiExtraModels(BaseResponseDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseDto) },
          {
            properties: {
              data: {
                type: 'boolean',
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiStringBaseResponseDto = () => {
  return applyDecorators(
    ApiExtraModels(BaseResponseDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResponseDto) },
          {
            properties: {
              data: {
                type: 'string',
              },
            },
          },
        ],
      },
    }),
  );
};
