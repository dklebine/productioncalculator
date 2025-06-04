import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const calculatePrice = mutation({
  args: {
    includesPhotography: v.boolean(),
    includesVideography: v.boolean(),
    serviceTier: v.string(),
    photoRateType: v.string(),
    photoDuration: v.number(),
    photoDays: v.number(),
    videoRateType: v.string(),
    videoDuration: v.number(),
    videoDays: v.number(),
    numReels: v.number(),
    reelDuration: v.number(),
    numRecaps: v.number(),
    recapDuration: v.number(),
    travelDistance: v.number(),
    clientCoversTravel: v.boolean(),
    deliverySpeed: v.string(),
    photoEdits: v.number(),
  },
  handler: async (ctx, args) => {
    const breakdown = [];
    let total = 0;

    // Universal tier system
    const serviceTiers = {
      platinum: {
        photography: { hourly: 150, halfDay: 650, fullDay: 1099 },
        videography: { hourly: 200, halfDay: 850, fullDay: 1400 }
      },
      gold: {
        photography: { hourly: 100, halfDay: 550, fullDay: 950 },
        videography: { hourly: 150, halfDay: 650, fullDay: 1100 }
      },
      bronze: {
        photography: { hourly: 50, halfDay: 450, fullDay: 850 },
        videography: { hourly: 100, halfDay: 450, fullDay: 800 }
      }
    };

    const tierRates = serviceTiers[args.serviceTier as keyof typeof serviceTiers];

    // Photo costs
    if (args.includesPhotography) {
      const photoRates = tierRates.photography;
      let photoAmount = 0;

      if (args.photoRateType === "hourly") {
        photoAmount = photoRates.hourly * args.photoDuration;
        breakdown.push({
          description: `${args.serviceTier} Photo (${args.photoDuration} hours)`,
          amount: photoAmount
        });
      } else if (args.photoRateType === "halfDay") {
        photoAmount = photoRates.halfDay * args.photoDays;
        breakdown.push({
          description: `${args.serviceTier} Photo (${args.photoDays} half days)`,
          amount: photoAmount
        });
      } else {
        photoAmount = photoRates.fullDay * args.photoDays;
        breakdown.push({
          description: `${args.serviceTier} Photo (${args.photoDays} full days)`,
          amount: photoAmount
        });
      }

      total += photoAmount;

      if (args.photoEdits > 0) {
        const editAmount = args.photoEdits * 5;
        total += editAmount;
        breakdown.push({
          description: `Advanced Photo Edits (${args.photoEdits} photos)`,
          amount: editAmount
        });
      }
    }

    // Video costs
    if (args.includesVideography) {
      const videoRates = tierRates.videography;
      let videoAmount = 0;

      if (args.videoRateType === "hourly") {
        videoAmount = videoRates.hourly * args.videoDuration;
        breakdown.push({
          description: `${args.serviceTier} Video Coverage (${args.videoDuration} hours)`,
          amount: videoAmount
        });
      } else if (args.videoRateType === "halfDay") {
        videoAmount = videoRates.halfDay * args.videoDays;
        breakdown.push({
          description: `${args.serviceTier} Video Coverage (${args.videoDays} half days)`,
          amount: videoAmount
        });
      } else {
        videoAmount = videoRates.fullDay * args.videoDays;
        breakdown.push({
          description: `${args.serviceTier} Video Coverage (${args.videoDays} full days)`,
          amount: videoAmount
        });
      }

      total += videoAmount;

      if (args.numReels > 0) {
        const reelAmount = args.numReels * (args.reelDuration <= 30 ? 100 : 150);
        total += reelAmount;
        breakdown.push({
          description: `Social Media Reels (${args.numReels} x ${args.reelDuration}s)`,
          amount: reelAmount
        });
      }

      if (args.numRecaps > 0) {
        const recapAmount = args.numRecaps * (args.recapDuration <= 60 ? 200 : 300);
        total += recapAmount;
        breakdown.push({
          description: `Recap Videos (${args.numRecaps} x ${args.recapDuration}s)`,
          amount: recapAmount
        });
      }
    }

    // Travel costs (only if client isn't covering them)
    if (!args.clientCoversTravel && args.travelDistance > 0) {
      const travelAmount = args.travelDistance * 2;
      total += travelAmount;
      breakdown.push({
        description: `Travel (${args.travelDistance === 3000 ? "3000+" : args.travelDistance} miles)`,
        amount: travelAmount
      });
    }

    // Delivery speed costs
    if (args.deliverySpeed === "expedited") {
      total += 100;
      breakdown.push({
        description: "Expedited Delivery (3-5 days)",
        amount: 100
      });
    } else if (args.deliverySpeed === "superExpedited") {
      total += 200;
      breakdown.push({
        description: "Super Expedited Delivery (1-2 days)",
        amount: 200
      });
    }

    return {
      total,
      breakdown
    };
  }
});
