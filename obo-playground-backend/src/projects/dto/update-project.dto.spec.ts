import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateProjectDto } from './update-project.dto';

describe('UpdateProjectDto', () => {
  it('should validate an empty DTO (all fields optional)', async () => {
    const dto = plainToInstance(UpdateProjectDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate DTO with only project_name', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      project_name: 'Updated Project Name',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate DTO with only environment_id', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      environment_id: 2,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate DTO with only assignment_id', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      assignment_id: 'new-assignment',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate DTO with multiple fields', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      project_name: 'Updated Project',
      environment_id: 3,
      assignment_id: 'assignment-002',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when project_name exceeds max length', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      project_name: 'a'.repeat(256), // 256 characters
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find(e => e.property === 'project_name');
    expect(nameError?.constraints).toHaveProperty('maxLength');
  });

  it('should fail validation when assignment_id exceeds max length', async () => {
    const dto = plainToInstance(UpdateProjectDto, {
      assignment_id: 'a'.repeat(256), // 256 characters
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const assignmentError = errors.find(e => e.property === 'assignment_id');
    expect(assignmentError?.constraints).toHaveProperty('maxLength');
  });

  it('should pass validation even with extra fields', async () => {
    // UpdateProjectDto extends PartialType, so extra fields are allowed but won't be validated
    const dto = plainToInstance(UpdateProjectDto, {
      project_name: 'Test',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
