// backend/tests/unit/models/Organization.test.js
/**
 * Unit Tests for Organization Model
 * Tests validation, hooks, cascade delete, platform org protection, and indexes
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { Organization } from '../../../models/Organization.js';
import { Department } from '../../../models/Department.js';
import { User } from '../../../models/User.js';

describe('Organization Model - Unit Tests', () => {
  beforeEach(async () => {
    // Clean up collections
    await Organization.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create organization with valid data', async () => {
      const orgData = {
        name: 'Test Corporation',
        description: 'A test organization for unit testing purposes',
        email: 'testcorp@example.com',
        phone: '+1234567890',
        address: '123 Test Street, Test City',
        industry: 'Technology',
      };

      const org = await Organization.create(orgData);

      expect(org.name).toBe('test corporation'); // Should be lowercase
      expect(org.description).toBe(orgData.description);
      expect(org.email).toBe('testcorp@example.com');
      expect(org.phone).toBe('+1234567890');
      expect(org.address).toBe(orgData.address);
      expect(org.industry).toBe('Technology');
      expect(org.isPlatformOrg).toBe(false); // Default
    });

    it('should require name', async () => {
      const orgData = {
        description: 'Test Description',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
      };

      await expect(Organization.create(orgData)).rejects.toThrow(/name.*required/i);
    });

    it('should require description', async () => {
      const orgData = {
        name: 'Test Org',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
      };

      await expect(Organization.create(orgData)).rejects.toThrow(/description.*required/i);
    });

    it('should require email', async () => {
      const orgData = {
        name: 'Test Org',
        description: 'Test Description',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
      };

      await expect(Organization.create(orgData)).rejects.toThrow(/email.*required/i);
    });

    it('should validate email format', async () => {
      const orgData = {
        name: 'Test Org',
        description: 'Test Description',
        email: 'invalid-email',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
      };

      await expect(Organization.create(orgData)).rejects.toThrow(/email/i);
    });

    it('should require phone', async () => {
      const orgData = {
        name: 'Test Org',
        description: 'Test Description',
        email: 'test@example.com',
        address: 'Test Address',
        industry: 'Technology',
      };

      await expect(Organization.create(orgData)).rejects.toThrow(/phone.*required/i);
    });

    it('should validate phone format', async () => {
      const orgData = {
        name: 'Test Org',
        description: 'Test Description',
        email: 'test@example.com',
        phone: 'invalid-phone',
        address: 'Test Address',
        industry: 'Technology',
      };

      await expect(Organization.create(orgData)).rejects.toThrow(/phone/i);
    });

    it('should require address', async () => {
      const orgData = {
        name: 'Test Org',
        description: 'Test Description',
        email: 'test@example.com',
        phone: '+1234567890',
        industry: 'Technology',
      };

      await expect(Organization.create(orgData)).rejects.toThrow(/address.*required/i);
    });

    it('should require industry', async () => {
      const orgData = {
        name: 'Test Org',
        description: 'Test Description',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
      };

      await expect(Organization.create(orgData)).rejects.toThrow(/industry.*required/i);
    });

    it('should validate industry from predefined list', async () => {
      const orgData = {
        name: 'Test Org',
        description: 'Test Description',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'InvalidIndustry',
      };

      await expect(Organization.create(orgData)).rejects.toThrow(/industry/i);
    });

    it('should accept valid industries', async () => {
      const validIndustries = ['Technology', 'Healthcare', 'Hospitality', 'Education'];

      for (const industry of validIndustries) {
        const org = await Organization.create({
          name: `test-org-${industry.toLowerCase()}-${Date.now()}`,
          description: 'Test Description',
          email: `test-${industry.toLowerCase()}-${Date.now()}@example.com`,
          phone: '+1234567890',
          address: 'Test Address',
          industry: industry,
        });

        expect(org.industry).toBe(industry);
      }
    });

    it('should enforce max length on name', async () => {
      const longName = 'a'.repeat(101); // Assuming MAX_ORG_NAME_LENGTH is 100

      const orgData = {
        name: longName,
        description: 'Test Description',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
      };

      await expect(Organization.create(orgData)).rejects.toThrow(/name.*exceed/i);
    });

    it('should convert name to lowercase', async () => {
      const org = await Organization.create({
        name: 'TEST ORGANIZATION',
        description: 'Test Description',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
      });

      expect(org.name).toBe('test organization');
    });

    it('should convert email to lowercase', async () => {
      const org = await Organization.create({
        name: 'Test Org',
        description: 'Test Description',
        email: 'TEST@EXAMPLE.COM',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
      });

      expect(org.email).toBe('test@example.com');
    });
  });

  describe('isPlatformOrg Field', () => {
    it('should default isPlatformOrg to false', async () => {
      const org = await Organization.create({
        name: 'Customer Org',
        description: 'Customer Organization',
        email: 'customer@example.com',
        phone: '+1234567890',
        address: 'Customer Address',
        industry: 'Technology',
      });

      expect(org.isPlatformOrg).toBe(false);
    });

    it('should allow setting isPlatformOrg to true', async () => {
      const org = await Organization.create({
        name: 'Platform Org',
        description: 'Platform Organization',
        email: 'platform@example.com',
        phone: '+1234567890',
        address: 'Platform Address',
        industry: 'Technology',
        isPlatformOrg: true,
      });

      expect(org.isPlatformOrg).toBe(true);
    });

    it('should make isPlatformOrg immutable', async () => {
      const org = await Organization.create({
        name: 'Test Org',
        description: 'Test Organization',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
        isPlatformOrg: false,
      });

      // Try to change it
      org.isPlatformOrg = true;
      await org.save();

      const updatedOrg = await Organization.findById(org._id);
      expect(updatedOrg.isPlatformOrg).toBe(false); // Should remain false
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique name', async () => {
      await Organization.create({
        name: 'Unique Org',
        description: 'First Organization',
        email: 'first@example.com',
        phone: '+1234567890',
        address: 'First Address',
        industry: 'Technology',
      });

      await expect(Organization.create({
        name: 'Unique Org',
        description: 'Second Organization',
        email: 'second@example.com',
        phone: '+9876543210',
        address: 'Second Address',
        industry: 'Healthcare',
      })).rejects.toThrow(/duplicate/i);
    });

    it('should enforce unique email', async () => {
      await Organization.create({
        name: 'First Org',
        description: 'First Organization',
        email: 'same@example.com',
        phone: '+1234567890',
        address: 'First Address',
        industry: 'Technology',
      });

      await expect(Organization.create({
        name: 'Second Org',
        description: 'Second Organization',
        email: 'same@example.com',
        phone: '+9876543210',
        address: 'Second Address',
        industry: 'Healthcare',
      })).rejects.toThrow(/duplicate/i);
    });

    it('should enforce unique phone', async () => {
      await Organization.create({
        name: 'First Org',
        description: 'First Organization',
        email: 'first@example.com',
        phone: '+1234567890',
        address: 'First Address',
        industry: 'Technology',
      });

      await expect(Organization.create({
        name: 'Second Org',
        description: 'Second Organization',
        email: 'second@example.com',
        phone: '+1234567890',
        address: 'Second Address',
        industry: 'Healthcare',
      })).rejects.toThrow(/duplicate/i);
    });
  });

  describe('Cascade Delete', () => {
    it('should have softDeleteByIdWithCascade method', () => {
      expect(typeof Organization.softDeleteByIdWithCascade).toBe('function');
    });

    it('should prevent deletion of platform organization', async () => {
      const platformOrg = await Organization.create({
        name: 'Platform Organization',
        description: 'Main Platform',
        email: 'platform@example.com',
        phone: '+1234567890',
        address: 'Platform Address',
        industry: 'Technology',
        isPlatformOrg: true,
      });

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          await expect(
            Organization.softDeleteByIdWithCascade(platformOrg._id, { session })
          ).rejects.toThrow(/platform.*cannot be deleted/i);
        });
      } finally {
        await session.endSession();
      }

      // Verify org was NOT deleted
      const orgAfter = await Organization.findById(platformOrg._id);
      expect(orgAfter).not.toBeNull();
      expect(orgAfter.isDeleted).toBe(false);
    });

    it('should require session for cascade delete', async () => {
      const org = await Organization.create({
        name: 'Test Org',
        description: 'Test Organization',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
      });

      await expect(
        Organization.softDeleteByIdWithCascade(org._id)
      ).rejects.toThrow(/transaction/i);
    });

    it('should cascade delete to departments', async () => {
      const org = await Organization.create({
        name: 'Test Org',
        description: 'Test Organization',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
      });

      const dept = await Department.create({
        name: 'Test Department',
        description: 'Test Department',
        organization: org._id,
      });

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          await Organization.softDeleteByIdWithCascade(org._id, { session });
        });
      } finally {
        await session.endSession();
      }

      // Verify org is deleted
      const deletedOrg = await Organization.findById(org._id)
        .setOptions({ withDeleted: true });
      expect(deletedOrg.isDeleted).toBe(true);

      // Verify department is deleted
      const deletedDept = await Department.findById(dept._id)
        .setOptions({ withDeleted: true });
      expect(deletedDept.isDeleted).toBe(true);
    });
  });

  describe('Soft Delete Support', () => {
    it('should have soft delete methods', () => {
      expect(typeof Organization.softDeleteById).toBe('function');
      expect(typeof Organization.softDeleteMany).toBe('function');
      expect(typeof Organization.restoreById).toBe('function');
      expect(typeof Organization.restoreMany).toBe('function');
    });

    it('should soft delete organization', async () => {
      const org = await Organization.create({
        name: 'Test Org',
        description: 'Test Organization',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
      });

      await Organization.softDeleteById(org._id);

      const regularFind = await Organization.findById(org._id);
      expect(regularFind).toBeNull();

      const withDeleted = await Organization.findById(org._id)
        .setOptions({ withDeleted: true });
      expect(withDeleted).not.toBeNull();
      expect(withDeleted.isDeleted).toBe(true);
    });

    it('should restore organization', async () => {
      const org = await Organization.create({
        name: 'Test Org',
        description: 'Test Organization',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
      });

      await Organization.softDeleteById(org._id);
      await Organization.restoreById(org._id);

      const restoredOrg = await Organization.findById(org._id);
      expect(restoredOrg).not.toBeNull();
      expect(restoredOrg.isDeleted).toBe(false);
    });
  });

  describe('toJSON Transformation', () => {
    it('should exclude soft delete fields from JSON', async () => {
      const org = await Organization.create({
        name: 'Test Org',
        description: 'Test Organization',
        email: 'test@example.com',
        phone: '+1234567890',
        address: 'Test Address',
        industry: 'Technology',
      });

      const json = org.toJSON();

      expect(json.isDeleted).toBeUndefined();
      expect(json.deletedAt).toBeUndefined();
      expect(json.deletedBy).toBeUndefined();
    });
  });

  describe('TTL Configuration', () => {
    it('should have initializeTTL method', () => {
      expect(typeof Organization.initializeTTL).toBe('function');
    });

    it('should not set TTL for organizations (TTL = 0)', async () => {
      // Organizations should never be auto-deleted
      // TTL should be 0 or null for organizations
      const ttlResult = await Organization.initializeTTL();

      // Should not throw and should handle TTL = 0 gracefully
      expect(ttlResult).toBeUndefined(); // ensureTTLIndex returns undefined for TTL = 0
    });
  });
});
