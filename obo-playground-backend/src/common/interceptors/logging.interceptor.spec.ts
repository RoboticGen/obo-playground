import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Request, Response } from 'express';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();

    mockRequest = {
      method: 'GET',
      url: '/test-url',
      body: {},
      query: {},
      params: {},
      get: jest.fn().mockReturnValue('test-user-agent'),
      ip: '127.0.0.1',
    };

    mockResponse = {
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };

    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log incoming request', (done) => {
    mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      complete: () => {
        expect(mockRequest.get).toHaveBeenCalledWith('user-agent');
        done();
      },
    });
  });

  it('should log request with body when present', (done) => {
    mockRequest.body = { name: 'Test Project', userId: '123' };
    mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      complete: () => {
        expect(mockRequest.body).toEqual({ name: 'Test Project', userId: '123' });
        done();
      },
    });
  });

  it('should log request with query params when present', (done) => {
    mockRequest.query = { userId: '123', page: '1' };
    mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      complete: () => {
        expect(mockRequest.query).toEqual({ userId: '123', page: '1' });
        done();
      },
    });
  });

  it('should log request with route params when present', (done) => {
    mockRequest.params = { id: '123' };
    mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      complete: () => {
        expect(mockRequest.params).toEqual({ id: '123' });
        done();
      },
    });
  });

  it('should log successful response with status code', (done) => {
    mockResponse.statusCode = 201;
    mockCallHandler.handle = jest.fn().mockReturnValue(of({ id: '123' }));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (data) => {
        expect(data).toEqual({ id: '123' });
      },
      complete: () => {
        expect(mockResponse.statusCode).toBe(201);
        done();
      },
    });
  });

  it('should measure response time', (done) => {
    const startTime = Date.now();
    mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      complete: () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        expect(responseTime).toBeGreaterThanOrEqual(0);
        done();
      },
    });
  });

  it('should log errors with response time', (done) => {
    const error = new Error('Test error');
    mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });

  it('should pass through response data unchanged', (done) => {
    const responseData = { id: '123', name: 'Test', items: [1, 2, 3] };
    mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (data) => {
        expect(data).toEqual(responseData);
        done();
      },
    });
  });

  it('should handle different HTTP methods', (done) => {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    let completed = 0;

    methods.forEach((method) => {
      mockRequest.method = method;
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockRequest.method).toBe(method);
          completed++;
          if (completed === methods.length) {
            done();
          }
        },
      });
    });
  });

  it('should handle requests without user-agent header', (done) => {
    mockRequest.get = jest.fn().mockReturnValue('');
    mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      complete: () => {
        expect(mockRequest.get).toHaveBeenCalledWith('user-agent');
        done();
      },
    });
  });

  it('should log IP address', (done) => {
    const requestWithIp = { ...mockRequest, ip: '192.168.1.100' };
    mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: () => requestWithIp,
      getResponse: () => mockResponse,
    });
    mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      complete: () => {
        expect(requestWithIp.ip).toBe('192.168.1.100');
        done();
      },
    });
  });
});
