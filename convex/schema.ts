import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  quotes: defineTable({
    breakdown: v.array(v.object({
      amount: v.number(),
      description: v.string()
    })),
    deliverySpeed: v.string(),
    includesPhotography: v.boolean(),
    includesVideography: v.boolean(),
    numRecaps: v.optional(v.number()),
    numReels: v.optional(v.number()),
    photoDuration: v.optional(v.number()),
    photoDays: v.optional(v.number()),
    photoRateType: v.optional(v.string()),
    photoTier: v.optional(v.string()),
    totalCost: v.number(),
    travelDistance: v.number(),
    videoDuration: v.optional(v.number())
  })
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
