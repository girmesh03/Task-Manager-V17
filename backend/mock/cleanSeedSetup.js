// backend/mock/cleanSeedSetup.js
import mongoose from "mongoose";
import { mockData } from "./data.js";

/* ------------------------------------------------------------------ */
/* 1.  TOTAL WIPE – collection-by-collection + indexes               */
/* ------------------------------------------------------------------ */
async function wipeEverything() {
  const { connection } = mongoose;
  if (connection.readyState !== 1) throw new Error("Mongo not connected");

  const collections = [
    "assignedtasks",
    "attachments",
    "basetasks",
    "departments",
    "materials",
    "notifications",
    "organizations",
    "projecttasks",
    "routinetasks",
    "taskactivities",
    "taskcomments",
    "users",
    "vendors",
  ];

  for (const name of collections) {
    const coll = connection.db.collection(name);
    if (coll) {
      await coll.deleteMany({}); // removes every doc (soft or not)
      await coll.dropIndexes(); // removes all indexes except _id
    }
  }
  console.log("🧹 All documents & indexes wiped");
}

/* ------------------------------------------------------------------ */
/* 2.  SEED – platform org / dept / admin                            */
/* ------------------------------------------------------------------ */
async function seedPlatform(session) {
  const { Organization, Department, User } = await import("../models/index.js");

  const platOrg = new Organization({
    name: process.env.PLATFORM_ORGANIZATION_NAME,
    description: process.env.PLATFORM_ORGANIZATION_DESCRIPTION,
    email: process.env.PLATFORM_ORGANIZATION_EMAIL,
    phone: process.env.PLATFORM_ORGANIZATION_PHONE,
    address: process.env.PLATFORM_ORGANIZATION_ADDRESS,
    industry: process.env.PLATFORM_ORGANIZATION_INDUSTRY,
    size: process.env.PLATFORM_ORGANIZATION_SIZE,
  });
  await platOrg.save({ session });

  const platDept = new Department({
    name: process.env.PLATFORM_DEPARTMENT_NAME,
    description: process.env.PLATFORM_DEPARTMENT_DESCRIPTION,
    organization: platOrg._id,
  });
  await platDept.save({ session });

  const platAdmin = new User({
    firstName: process.env.PLATFORM_ADMIN_FIRST_NAME,
    lastName: process.env.PLATFORM_ADMIN_LAST_NAME,
    position: process.env.PLATFORM_ADMIN_POSITION,
    role: process.env.PLATFORM_ADMIN_ROLE,
    email: process.env.PLATFORM_ADMIN_EMAIL,
    password: process.env.PLATFORM_ADMIN_PASSWORD,
    organization: platOrg._id,
    department: platDept._id,
    joinedAt: new Date(),
  });
  await platAdmin.save({ session });

  platOrg.createdBy = platAdmin._id;
  await platOrg.save({ session });
  platDept.createdBy = platAdmin._id;
  await platDept.save({ session });
}

/* ------------------------------------------------------------------ */
/* 3.  SEED – mock organisations from data.js                         */
/* ------------------------------------------------------------------ */
async function seedMockOrgs(session) {
  const { Organization, Department, User } = await import("../models/index.js");

  for (const item of mockData) {
    const { data: orgData, departments } = item.organization;
    const org = new Organization(orgData);
    await org.save({ session });

    const deptIds = [];
    for (const deptMeta of departments) {
      const dept = new Department({
        ...deptMeta.data,
        organization: org._id,
      });
      await dept.save({ session });
      deptIds.push(dept._id);

      for (const u of deptMeta.users) {
        const user = new User({
          ...u,
          organization: org._id,
          department: dept._id,
          joinedAt: new Date(),
        });
        await user.save({ session });
      }
    }

    const superAdmin = await User.findOne({
      organization: org._id,
      role: "SuperAdmin",
    }).session(session);
    if (!superAdmin) throw new Error(`No SuperAdmin in ${org.name}`);

    org.createdBy = superAdmin._id;
    await org.save({ session });

    await Department.updateMany(
      { _id: { $in: deptIds } },
      { createdBy: superAdmin._id },
      { session }
    );
  }
}

/* ------------------------------------------------------------------ */
/* 4.  ORCHESTRATOR                                                   */
/* ------------------------------------------------------------------ */
export default async function cleanSeedSetup() {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      console.log("🧹 Wiping everything …");
      await wipeEverything();

      console.log("🌱 Seeding platform …");
      await seedPlatform(session);

      console.log("🌱 Seeding mock organizations …");
      await seedMockOrgs(session);
    });
    console.log("✅ Database is pristine & seeded");
  } catch (err) {
    console.error("❌ cleanSeedSetup failed:", err);
    throw err;
  } finally {
    session.endSession();
  }
}
