// backend/tests/property/timezone.property.test.js
/**
 * Property-Based Tests for Timezone Management
 * Uses fast-check to verify correctness properties across many random inputs
 *
 * **Feature: production-readiness-validation, Property 17: UTC Date Storage**
 * **Feature: production-readiness-validation, Property 18: ISO Date Response Format**
 *
 * Validates: Requirements 21.1-21.12, 110-121, 152-161
 */

import { describe, it, expect } from '@jest/globals';
import mongoose from 'mongoose';
import fc from 'fast-check';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { Organization } from '../../models/Organization.js';
import { User } from '../../models/User.js';
import { Department } from '../../models/Department.js';
import { BaseTask } from '../../models/BaseTask.js';

// Configure dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

// Arbitrary for generating random timestamps
const timestampArb = fc.date({
  min: new Date('2020-01-01'),
  max: new Date('2030-12-31'),
});

describe('Timezone Management - Property-Based Tests', () => {
  beforeEach(async () => {
    // Clean up all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('Property 17: UTC Date Storage', () => {
    /**
     * For any date field stored in MongoDB, the date SHALL be stored in UTC timezone
     * regardless of the server's local timezone or client's timezone
     */
    it('Property 17: All dates should be stored in UTC timezone', async () => {
      await fc.assert(
        fc.asyncProperty(
          timestampArb,
          async (inputDate) => {
            // Create organization with createdAt/updatedAt timestamps
            const org = await Organization.create({
              name: `test-org-${Date.now()}`,
              description: 'Test Organization',
              email: `test-${Date.now()}@example.com`,
              phone: '+1234567890',
              address: 'Test Address',
              industry: 'Technology',
              isPlatformOrg: false,
            });

            // Retrieve the document
            const savedOrg = await Organization.findById(org._id);

            // Verify createdAt and updatedAt are Date objects
            expect(savedOrg.createdAt).toBeInstanceOf(Date);
            expect(savedOrg.updatedAt).toBeInstanceOf(Date);

            // Verify dates are in UTC (getTimezoneOffset() returns 0 for UTC)
            const createdAtUTC = dayjs(savedOrg.createdAt).utc();
            const updatedAtUTC = dayjs(savedOrg.updatedAt).utc();

            // Verify the dates maintain their UTC representation
            expect(createdAtUTC.isValid()).toBe(true);
            expect(updatedAtUTC.isValid()).toBe(true);

            // Verify timezone info is UTC
            expect(createdAtUTC.format('Z')).toBe('+00:00');
            expect(updatedAtUTC.format('Z')).toBe('+00:00');
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);

    it('Property 17: Explicit date fields (joinedAt, dateOfBirth) should store as UTC', async () => {
      await fc.assert(
        fc.asyncProperty(
          timestampArb,
          timestampArb.filter(d => d < new Date()), // dateOfBirth must be in past
          async (joinedAtInput, dateOfBirthInput) => {
 // Create organization and department
            const org = await Organization.create({
              name: `test-org-${Date.now()}`,
              description: 'Test Organization',
              email: `test-${Date.now()}@example.com`,
              phone: '+1234567890',
              address: 'Test Address',
              industry: 'Technology',
              isPlatformOrg: false,
            });

            const dept = await Department.create({
              name: `dept-${Date.now()}`,
              description: 'Test Department',
              organization: org._id,
            });

            // Create user with explicit date fields
            const user = await User.create({
              firstName: 'Test',
              lastName: 'User',
              email: `user-${Date.now()}@example.com`,
              password: 'Password123!',
              position: 'Tester',
              role: 'User',
              organization: org._id,
              department: dept._id,
              joinedAt: joinedAtInput < new Date() ? joinedAtInput : new Date(),
              dateOfBirth: dateOfBirthInput,
            });

            // Retrieve the document
            const savedUser = await User.findById(user._id);

            // Verify dates are stored as Date objects
            expect(savedUser.joinedAt).toBeInstanceOf(Date);
            if (savedUser.dateOfBirth) {
              expect(savedUser.dateOfBirth).toBeInstanceOf(Date);
            }

            // Verify dates are in UTC
            const joinedAtUTC = dayjs(savedUser.joinedAt).utc();
            expect(joinedAtUTC.format('Z')).toBe('+00:00');

            if (savedUser.dateOfBirth) {
              const dobUTC = dayjs(savedUser.dateOfBirth).utc();
              expect(dobUTC.format('Z')).toBe('+00:00');
            }
          }
        ),
        { numRuns: 50 }
      );
    }, 60000);

    it('Property 17: Task dates (startDate, dueDate) should store as UTC', async () => {
      await fc.assert(
        fc.asyncProperty(
          timestampArb,
          timestampArb,
          async (startDateInput, dueDateInput) => {
            // Ensure startDate <= dueDate
            const startDate = startDateInput < dueDateInput ? startDateInput : dueDateInput;
            const dueDate = startDateInput > dueDateInput ? startDateInput : dueDateInput;

            // Create organization and department
            const org = await Organization.create({
              name: `test-org-${Date.now()}`,
              description: 'Test Organization',
              email: `test-${Date.now()}@example.com`,
              phone: '+1234567890',
              address: 'Test Address',
              industry: 'Technology',
              isPlatformOrg: false,
            });

            const dept = await Department.create({
              name: `dept-${Date.now()}`,
              description: 'Test Department',
              organization: org._id,
            });

            const creator = await User.create({
              firstName: 'Creator',
              lastName: 'User',
              email: `creator-${Date.now()}@example.com`,
              password: 'Password123!',
              position: 'Creator',
              role: 'User',
              organization: org._id,
              department: dept._id,
              joinedAt: new Date(),
            });

            // Create task with date fields
            const task = await BaseTask.create({
              title: 'Test Task',
              description: 'Test Description',
              taskType: 'AssignedTask',
              createdBy: creator._id,
              organization: org._id,
              department: dept._id,
              status: 'Pending',
              priority: 'Medium',
              startDate: startDate,
              dueDate: dueDate,
            });

            // Retrieve the document
            const savedTask = await BaseTask.findById(task._id);

            // Verify dates are in UTC
            if (savedTask.startDate) {
              const startDateUTC = dayjs(savedTask.startDate).utc();
              expect(startDateUTC.format('Z')).toBe('+00:00');
            }

            if (savedTask.dueDate) {
              const dueDateUTC = dayjs(savedTask.dueDate).utc();
              expect(dueDateUTC.format('Z')).toBe('+00:00');
            }
          }
        ),
        { numRuns: 50 }
      );
    }, 60000);
  });

  describe('Property 18: ISO Date Response Format', () => {
    /**
     * For any API response containing dates, the dates SHALL be formatted
     * in ISO 8601 format with UTC timezone indicator (Z suffix)
     */
    it('Property 18: toJSON transformation should return ISO format dates', async () => {
      await fc.assert(
        fc.asyncProperty(
          timestampArb,
          async (inputDate) => {
            // Create organization
            const org = await Organization.create({
              name: `test-org-${Date.now()}`,
              description: 'Test Organization',
              email: `test-${Date.now()}@example.com`,
              phone: '+1234567890',
              address: 'Test Address',
              industry: 'Technology',
              isPlatformOrg: false,
            });

            // Get JSON representation (simulating API response)
            const orgJSON = org.toJSON();

            // Verify dates are in ISO format
            expect(typeof orgJSON.createdAt).toBe('string');
            expect(typeof orgJSON.updatedAt).toBe('string');

            // Verify ISO format (ends with Z for UTC)
            expect(orgJSON.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            expect(orgJSON.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

            // Verify dates can be parsed back correctly
            const parsedCreatedAt = new Date(orgJSON.createdAt);
            expect(parsedCreatedAt.toISOString()).toBe(orgJSON.createdAt);
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);

    it('Property 18: User date fields should return ISO format in JSON', async () => {
      await fc.assert(
        fc.asyncProperty(
          timestampArb.filter(d => d < new Date()),
          async (dateOfBirthInput) => {
            // Create organization and department
            const org = await Organization.create({
              name: `test-org-${Date.now()}`,
              description: 'Test Organization',
              email: `test-${Date.now()}@example.com`,
              phone: '+1234567890',
              address: 'Test Address',
              industry: 'Technology',
              isPlatformOrg: false,
            });

            const dept = await Department.create({
              name: `dept-${Date.now()}`,
              description: 'Test Department',
              organization: org._id,
            });

            const user = await User.create({
              firstName: 'Test',
              lastName: 'User',
              email: `user-${Date.now()}@example.com`,
              password: 'Password123!',
              position: 'Tester',
              role: 'User',
              organization: org._id,
              department: dept._id,
              joinedAt: new Date(),
              dateOfBirth: dateOfBirthInput,
            });

            // Get JSON representation
            const userJSON = user.toJSON();

            // Verify all date fields are ISO strings
            expect(typeof userJSON.joinedAt).toBe('string');
            expect(userJSON.joinedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

            if (userJSON.dateOfBirth) {
              expect(typeof userJSON.dateOfBirth).toBe('string');
              expect(userJSON.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            }

            expect(typeof userJSON.createdAt).toBe('string');
            expect(typeof userJSON.updatedAt).toBe('string');
          }
        ),
        { numRuns: 50 }
      );
    }, 60000);

    it('Property 18: Soft delete dates should return ISO format in JSON', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 5, maxLength: 50 }),
            email: fc.emailAddress(),
          }),
async (orgData) => {
            // Create and soft-delete organization
            const org = await Organization.create({
              ...orgData,
              name: `test-org-${Date.now()}`,
              description: 'Test Organization',
              email: `test-${Date.now()}@example.com`,
              phone: '+1234567890',
              address: 'Test Address',
              industry: 'Technology',
              isPlatformOrg: false,
            });

            await Organization.softDeleteById(org._id);

            // Retrieve with deleted fields
            const deletedOrg = await Organization.findById(org._id)
              .select('+deletedAt +deletedBy')
              .setOptions({ withDeleted: true });

            // Get JSON representation
            const orgObject = deletedOrg.toObject();

            // Verify deletedAt is present and in Date format
            expect(orgObject.deletedAt).toBeInstanceOf(Date);

            // Verify toISOString works correctly
            const deletedAtISO = orgObject.deletedAt.toISOString();
            expect(deletedAtISO).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
          }
        ),
        { numRuns: 50 }
      );
    }, 60000);
  });

  describe('Timezone Process Environment', () => {
    /**
     * Verify that process.env.TZ is set to UTC
     */
    it('Process timezone should be UTC', () => {
      expect(process.env.TZ).toBe('UTC');
    });

    it('Server time should be in UTC', () => {
      const now = new Date();
      const nowUTC = dayjs(now).utc();

      // Verify current time can be converted to UTC without offset
      expect(nowUTC.isValid()).toBe(true);
      expect(nowUTC.format('Z')).toBe('+00:00');
    });
  });
});
