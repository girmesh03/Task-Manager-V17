// backend/utils/materialTransform.js

/**
 * Transform material data from frontend format to backend format
 * Frontend sends: { materialId, quantity }
 * Backend stores: { material, quantity, unitPrice, totalCost }
 */

import { Material } from "../models/index.js";

/**
 * Transform materials array for storage
 * @param {Array} materials - Array of { materialId, quantity }
 * @param {String} organizationId - Organization ID for validation
 * @param {String} departmentId - Department ID for validation
 * @param {Object} session - Mongoose session for transaction
 * @returns {Array} Transformed materials with unitPrice and totalCost
 */
export const transformMaterialsForStorage = async (
  materials,
  organizationId,
  departmentId,
  session
) => {
  if (!materials || !Array.isArray(materials) || materials.length === 0) {
    return [];
  }

  const materialIds = materials.map((m) => m.materialId || m.material);

  // Fetch all materials in one query
  const materialDocs = await Material.find({
    _id: { $in: materialIds },
    organization: organizationId,
    department: departmentId,
    isDeleted: false,
  }).session(session);

  // Create a map for quick lookup
  const materialMap = new Map(
    materialDocs.map((doc) => [doc._id.toString(), doc])
  );

  // Transform each material entry
  return materials.map((item) => {
    const materialId = (item.materialId || item.material).toString();
    const materialDoc = materialMap.get(materialId);

    if (!materialDoc) {
      throw new Error(
        `Material ${materialId} not found in organization and department`
      );
    }

    const quantity = Number(item.quantity);
    const unitPrice = materialDoc.price;
    const totalCost = quantity * unitPrice;

    return {
      material: materialDoc._id,
      quantity,
      unitPrice,
      totalCost,
    };
  });
};

/**
 * Validate materials exist and belong to organization and department
 * @param {Array} materialIds - Array of material IDs
 * @param {String} organizationId - Organization ID
 * @param {String} departmentId - Department ID
 * @param {Object} session - Mongoose session
 * @returns {Boolean} True if all valid
 */
export const validateMaterials = async (
  materialIds,
  organizationId,
  departmentId,
  session
) => {
  if (!materialIds || materialIds.length === 0) return true;

  const materials = await Material.find({
    _id: { $in: materialIds },
    organization: organizationId,
    department: departmentId,
    isDeleted: false,
  }).session(session);

  return materials.length === materialIds.length;
};
