// backend/tests/unit/models/User.test.js
/**
 * Unit Tests for User Model
 * Tests validation, hooks, methods, indexes, and business logic
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { User } from '../../../models/User.js';
import { Organization } from '../../../models/Organization.js';
import { Department } from '../../../models/Department.js';

describe('User Model - Unit Tests', () => {
  let testOrg, testDept;

  beforeEach(async () => {
    // Clean up collections
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Department.deleteMany({});

    // Create test organization and department
    testOrg = await Organization.create({
      name: `test-org-${Date.now()}`,
      description: 'Test Organization',
      email: `test-${Date.now()}@example.com`,
      phone: '+1234567890',
      address: 'Test Address',
      industry: 'Technology',
      isPlatformOrg: false,
    });

    testDept = await Department.create({
      name: `test-dept-${Date.now()}`,
      description: 'Test Department',
      organization: testOrg._id,
    });
  });

  describe('Schema Validation', () => {
    it('should create user with valid data', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      };

      const user = await User.create(userData);

      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('john.doe@example.com');
      expect(user.position).toBe('Developer');
      expect(user.role).toBe('User');
      expect(user.password).not.toBe('Password123!'); // Should be hashed
    });

    it('should require firstName', async () => {
      const userData = {
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      };

      await expect(User.create(userData)).rejects.toThrow(/firstName.*required/i);
    });

    it('should require lastName', async () => {
      const userData = {
        firstName: 'John',
        email: 'test@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      };

      await expect(User.create(userData)).rejects.toThrow(/lastName.*required/i);
    });

    it('should require valid email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      };

      await expect(User.create(userData)).rejects.toThrow(/email/i);
    });

    it('should require password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      };

      await expect(User.create(userData)).rejects.toThrow(/password.*required/i);
    });

    it('should enforce minimum password length', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'short',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      };

      await expect(User.create(userData)).rejects.toThrow(/password.*characters/i);
    });

    it('should require organization', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        department: testDept._id,
        joinedAt: new Date(),
      };

      await expect(User.create(userData)).rejects.toThrow(/organization.*required/i);
    });

    it('should require department', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        joinedAt: new Date(),
      };

      await expect(User.create(userData)).rejects.toThrow(/department.*required/i);
    });

    it('should validate role enum', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'InvalidRole',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      };

      await expect(User.create(userData)).rejects.toThrow(/role/i);
    });

    it('should reject future joinedAt date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: futureDate,
      };

      await expect(User.create(userData)).rejects.toThrow(/future/i);
    });

    it('should reject future dateOfBirth', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
        dateOfBirth: futureDate,
      };

      await expect(User.create(userData)).rejects.toThrow(/future/i);
    });
  });

  describe('Password Hashing', () => {
    it('should hash password on create', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      };

      const user = await User.create(userData);
      const savedUser = await User.findById(user._id).select('+password');

      expect(savedUser.password).not.toBe('Password123!');
      expect(savedUser.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it('should hash password on update', async () => {
      const user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'OldPassword123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      user.password = 'NewPassword123!';
      await user.save();

      const updatedUser = await User.findById(user._id).select('+password');
      expect(updatedUser.password).not.toBe('NewPassword123!');
      expect(updatedUser.password).toMatch(/^\$2[aby]\$/);
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      const originalHash = (await User.findById(user._id).select('+password')).password;

      user.firstName = 'Jane';
      await user.save();

      const updatedUser = await User.findById(user._id).select('+password');
      expect(updatedUser.password).toBe(originalHash);
    });
  });

  describe('comparePassword Method', () => {
    it('should return true for correct password', async () => {
      const user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.comparePassword('Password123!');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.comparePassword('WrongPassword123!');
      expect(isMatch).toBe(false);
    });

    it('should throw error if password not selected', async () => {
      const user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      const userWithoutPassword = await User.findById(user._id);
      await expect(userWithoutPassword.comparePassword('Password123!')).rejects.toThrow(/password.*not selected/i);
    });
  });

  describe('isPlatformUser Field', () => {
    it('should set isPlatformUser to true for platform org users', async () => {
      const platformOrg = await Organization.create({
        name: `platform-org-${Date.now()}`,
        description: 'Platform Organization',
        email: `platform-${Date.now()}@example.com`,
        phone: '+9876543210',
        address: 'Platform Address',
        industry: 'Technology',
        isPlatformOrg: true,
      });

      const platformDept = await Department.create({
        name: `platform-dept-${Date.now()}`,
        description: 'Platform Department',
        organization: platformOrg._id,
      });

      const user = await User.create({
        firstName: 'Platform',
        lastName: 'User',
        email: 'platform@example.com',
        password: 'Password123!',
        position: 'Admin',
        role: 'SuperAdmin',
        organization: platformOrg._id,
        department: platformDept._id,
        joinedAt: new Date(),
      });

      expect(user.isPlatformUser).toBe(true);
    });

    it('should set isPlatformUser to false for customer org users', async () => {
      const user = await User.create({
        firstName: 'Customer',
        lastName: 'User',
        email: 'customer@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      expect(user.isPlatformUser).toBe(false);
    });

    it('should make isPlatformUser immutable', async () => {
      const user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      expect(user.isPlatformUser).toBe(false);

      // Try to change it (should be ignored due to immutable)
      user.isPlatformUser = true;
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isPlatformUser).toBe(false); // Should remain false
    });
  });

  describe('isHod Field', () => {
    it('should set isHod to true for SuperAdmin role', async () => {
      const user = await User.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@example.com',
        password: 'Password123!',
        position: 'SuperAdmin',
        role: 'SuperAdmin',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      expect(user.isHod).toBe(true);
    });

    it('should set isHod to true for Admin role', async () => {
      const user = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'Password123!',
        position: 'Admin',
        role: 'Admin',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      expect(user.isHod).toBe(true);
    });

    it('should set isHod to false for Manager role', async () => {
      const user = await User.create({
        firstName: 'Manager',
        lastName: 'User',
        email: 'manager@example.com',
        password: 'Password123!',
        position: 'Manager',
        role: 'Manager',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      expect(user.isHod).toBe(false);
    });

    it('should set isHod to false for User role', async () => {
      const user = await User.create({
        firstName: 'Regular',
        lastName: 'User',
        email: 'user@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      expect(user.isHod).toBe(false);
    });

    it('should update isHod when role changes', async () => {
      const user = await User.create({
        firstName: 'User',
        lastName: 'ToAdmin',
        email: 'usertoadmin@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      expect(user.isHod).toBe(false);

      user.role = 'SuperAdmin';
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isHod).toBe(true);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique email per organization', async () => {
      await User.create({
        firstName: 'First',
        lastName: 'User',
        email: 'same@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      await expect(User.create({
        firstName: 'Second',
        lastName: 'User',
        email: 'same@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      })).rejects.toThrow(/duplicate/i);
    });

    it('should allow same email in different organizations', async () => {
      const org2 = await Organization.create({
        name: `test-org-2-${Date.now()}`,
        description: 'Second Test Organization',
        email: `test2-${Date.now()}@example.com`,
        phone: '+9876543210',
        address: 'Test Address 2',
        industry: 'Healthcare',
        isPlatformOrg: false,
      });

      const dept2 = await Department.create({
        name: `test-dept-2-${Date.now()}`,
        description: 'Second Test Department',
        organization: org2._id,
      });

      await User.create({
        firstName: 'First',
        lastName: 'User',
        email: 'same@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      const user2 = await User.create({
        firstName: 'Second',
        lastName: 'User',
        email: 'same@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: org2._id,
        department: dept2._id,
        joinedAt: new Date(),
      });

      expect(user2).toBeDefined();
      expect(user2.email).toBe('same@example.com');
    });
  });

  describe('Virtual Fields', () => {
    it('should generate fullName virtual', async () => {
      const user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      expect(user.fullName).toBe('John Doe');
    });
  });

  describe('toJSON Transformation', () => {
    it('should exclude sensitive fields from JSON', async () => {
      const user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      const json = user.toJSON();

      expect(json.password).toBeUndefined();
      expect(json.isDeleted).toBeUndefined();
      expect(json.deletedAt).toBeUndefined();
      expect(json.deletedBy).toBeUndefined();
      expect(json.passwordResetToken).toBeUndefined();
      expect(json.passwordResetExpires).toBeUndefined();
    });
  });

  describe('Soft Delete Support', () => {
    it('should have soft delete methods', () => {
      expect(typeof User.softDeleteById).toBe('function');
      expect(typeof User.softDeleteMany).toBe('function');
      expect(typeof User.restoreById).toBe('function');
      expect(typeof User.restoreMany).toBe('function');
    });

    it('should soft delete user', async () => {
      const user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        position: 'Developer',
        role: 'User',
        organization: testOrg._id,
        department: testDept._id,
        joinedAt: new Date(),
      });

      await User.softDeleteById(user._id);

      const regularFind = await User.findById(user._id);
      expect(regularFind).toBeNull();

      const withDeleted = await User.findById(user._id).setOptions({ withDeleted: true });
      expect(withDeleted).not.toBeNull();
      expect(withDeleted.isDeleted).toBe(true);
    });
  });
});
