// backend/tests/unit/db.test.js
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../config/db.js';

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  connection: {
    readyState: 0,
    on: jest.fn(),
  },
}));

// Mock process.exit
let mockExit;

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    process.env.MONGODB_URI = 'mongodb://test-uri';
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  describe('connectDB', () => {
    it('should call mongoose.connect with the correct URI and options', async () => {
      mongoose.connection.readyState = 0;
      await connectDB();
      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://test-uri', {
        minPoolSize: 5,
        maxPoolSize: 50,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        writeConcern: { w: 'majority' },
        retryWrites: true,
      });
    });

    it('should not call mongoose.connect if already connected', async () => {
      mongoose.connection.readyState = 1;
      await connectDB();
      expect(mongoose.connect).not.toHaveBeenCalled();
    });

    it('should exit the process on initial connection failure', async () => {
      mongoose.connection.readyState = 0;
      const connectionError = new Error('Connection failed');
      mongoose.connect.mockRejectedValue(connectionError);
      await connectDB();
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should exit the process if MONGODB_URI is not defined', async () => {
      mongoose.connection.readyState = 0;
      delete process.env.MONGODB_URI;

      await connectDB();

      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('disconnectDB', () => {
    it('should call mongoose.disconnect', async () => {
      await disconnectDB();
      expect(mongoose.disconnect).toHaveBeenCalled();
    });

    it('should exit the process on disconnection failure', async () => {
      const disconnectionError = new Error('Disconnection failed');
      mongoose.disconnect.mockRejectedValue(disconnectionError);
      await disconnectDB();
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});