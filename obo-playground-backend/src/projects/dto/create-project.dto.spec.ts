import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProjectDto } from './create-project.dto';

describe('CreateProjectDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      project_name: 'Test Project',
      environment_id: 1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate DTO with optional assignment_id', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      project_name: 'Test Project',
      environment_id: 1,
      assignment_id: 'assignment-001',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when user_id is not a UUID', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      user_id: 'not-a-uuid',
      project_name: 'Test Project',
      environment_id: 1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('user_id');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation when user_id is missing', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      project_name: 'Test Project',
      environment_id: 1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const userIdError = errors.find(e => e.property === 'user_id');
    expect(userIdError).toBeDefined();
  });

  it('should fail validation when project_name is missing', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      environment_id: 1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find(e => e.property === 'project_name');
    expect(nameError).toBeDefined();
  });

  it('should fail validation when project_name is not a string', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      project_name: 123,
      environment_id: 1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find(e => e.property === 'project_name');
    expect(nameError?.constraints).toHaveProperty('isString');
  });

  it('should fail validation when project_name exceeds max length', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      project_name: 'a'.repeat(256), // 256 characters
      environment_id: 1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find(e => e.property === 'project_name');
    expect(nameError?.constraints).toHaveProperty('maxLength');
  });

  it('should fail validation when environment_id is missing', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      project_name: 'Test Project',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const envError = errors.find(e => e.property === 'environment_id');
    expect(envError).toBeDefined();
  });

  it('should allow assignment_id to be optional', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      project_name: 'Test Project',
      environment_id: 1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate assignment_id when provided', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      project_name: 'Test Project',
      environment_id: 1,
      assignment_id: 'assignment-001',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when assignment_id exceeds max length', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      project_name: 'Test Project',
      environment_id: 1,
      assignment_id: 'a'.repeat(256), // 256 characters
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const assignmentError = errors.find(e => e.property === 'assignment_id');
    expect(assignmentError?.constraints).toHaveProperty('maxLength');
  });
});
