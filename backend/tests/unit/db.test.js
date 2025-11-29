// backend/tests/unit/db.test.js
// Unit tests for MongoDB connection configuration (backend/config/db.js)
// Requirements: 22, 63, 67, 178, 183-190, 418, 423

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import mongoose from "mongoose";

const originalEnv = process.env;

describe("MongoDB Connection Configuration", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("should use production-ready connection options", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/test-db";

    const connectSpy = jest
      .spyOn(mongoose, "connect")
      .mockResolvedValue(mongoose);

    const { default: connectDB } = await import("../../config/db.js");

    await expect(connectDB()).resolves.toBe(mongoose.connection);

    expect(connectSpy).toHaveBeenCalledTimes(1);

    const [uri, options] = connectSpy.mock.calls[0];

    expect(uri).toBe(process.env.MONGODB_URI);
    expect(options).toMatchObject({
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 5,
      retryWrites: true,
      w: "majority",
    });
  });

  it("should retry when the initial connection attempt fails", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/test-db";

    const connectSpy = jest
      .spyOn(mongoose, "connect")
      .mockRejectedValueOnce(new Error("Temporary connection error"))
      .mockResolvedValueOnce(mongoose);

    const { default: connectDB } = await import("../../config/db.js");

    await expect(connectDB()).resolves.toBe(mongoose.connection);

    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it("should throw when MONGODB_URI is not defined", async () => {
    delete process.env.MONGODB_URI;

    const { default: connectDB } = await import("../../config/db.js");

    await expect(connectDB()).rejects.toThrow(
      "MONGODB_URI environment variable not defined"
    );
  });
});
