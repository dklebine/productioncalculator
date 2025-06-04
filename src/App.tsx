import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { FormEvent, useEffect, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, InfoCircledIcon } from "@radix-ui/react-icons";

interface FormData {
  includesPhotography: boolean;
  includesVideography: boolean;
  serviceTier: string;
  photoRateType: string;
  photoDuration: number;
  photoDays: number;
  videoRateType: string;
  videoDuration: number;
  videoDays: number;
  numReels: number;
  reelDuration: number;
  numRecaps: number;
  recapDuration: number;
  travelDistance: number;
  clientCoversTravel: boolean;
  deliverySpeed: string;
  photoEdits: number;
}

interface ExpandedSections {
  service: boolean;
  photography: boolean;
  videography: boolean;
  additional: boolean;
  breakdown: boolean;
}

const SERVICE_TIERS = {
  platinum: {
    name: "Platinum",
    description: "Premium quality with maximum attention to detail",
    photography: {
      hourly: 150,
      halfDay: 650,
      fullDay: 1099,
      photosPerHour: 50,
      features: ["Professional retouching", "Same-day preview gallery", "Premium editing style", "Rush delivery available"]
    },
    videography: {
      hourly: 200,
      halfDay: 850,
      fullDay: 1400,
      features: ["4K recording", "Professional color grading", "Multi-camera setup", "Same-day highlights"]
    },
    universal: {
      deliveryTime: "3-7 days",
      deliveryDescription: "Fastest turnaround time with luxury standards",
      revisions: "5+",
      supportLevel: "Priority support"
    }
  },
  gold: {
    name: "Gold",
    description: "High quality with professional standards",
    photography: {
      hourly: 100,
      halfDay: 550,
      fullDay: 950,
      photosPerHour: 35,
      features: ["Professional editing", "24-hour preview gallery", "Standard editing style", "Standard delivery"]
    },
    videography: {
      hourly: 150,
      halfDay: 650,
      fullDay: 1100,
      features: ["1080p recording", "Standard color grading", "Single-camera setup", "Next-day highlights"]
    },
    universal: {
      deliveryTime: "7-10 days",
      deliveryDescription: "Standard turnaround time with professional standards",
      revisions: 3,
      supportLevel: "Standard support"
    }
  },
  bronze: {
    name: "Bronze",
    description: "Quality service with essential features",
    photography: {
      hourly: 50,
      halfDay: 450,
      fullDay: 850,
      photosPerHour: 15,
      features: ["Basic editing", "48-hour preview gallery", "Essential editing style", "Standard delivery"]
    },
    videography: {
      hourly: 100,
      halfDay: 450,
      fullDay: 800,
      features: ["1080p recording", "Basic color correction", "Single-camera setup", "3-day highlights"]
    },
    universal: {
      deliveryTime: "10-14 days",
      deliveryDescription: "Budget package with no expedited turnaround",
      revisions: 1,
      supportLevel: "Email support"
    }
  }
};

export default function App() {
  const [formData, setFormData] = useState<FormData>({
    includesPhotography: false,
    includesVideography: false,
    serviceTier: "platinum",
    photoRateType: "hourly",
    photoDuration: 1,
    photoDays: 1,
    videoRateType: "hourly",
    videoDuration: 1,
    videoDays: 1,
    numReels: 0,
    reelDuration: 30,
    numRecaps: 0,
    recapDuration: 60,
    travelDistance: 0,
    clientCoversTravel: false,
    deliverySpeed: "standard",
    photoEdits: 0
  });

  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    service: true,
    photography: false,
    videography: false,
    additional: false,
    breakdown: true
  });

  const [quote, setQuote] = useState<any>(null);
  const [liveQuote, setLiveQuote] = useState<number | null>(null);

  const calculatePrice = useMutation(api.pricing.calculatePrice);

  const toggleSection = (section: keyof ExpandedSections) => {
    setExpandedSections(prev => {
      const newState = { ...prev };
      
      // If opening a section, close all others except breakdown
      if (!prev[section]) {
        Object.keys(newState).forEach(key => {
          if (key !== section && key !== 'breakdown') {
            newState[key as keyof ExpandedSections] = false;
          }
        });
        newState[section] = true;
      } else {
        // If closing, just close this section
        newState[section] = false;
      }
      
      return newState;
    });
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // If video duration changes, adjust numReels if it exceeds the new max
      if (field === 'videoDuration') {
        const maxReels = getMaxReels(value);
        if (newData.numReels > maxReels) {
          newData.numReels = maxReels;
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await calculatePrice(formData);
    setQuote(result);
  };

  const getMaxReels = (videoDuration: number) => {
    // 1 hour = 3 reels, each additional hour adds 2 reels, max 20
    const maxReels = Math.min(3 + (videoDuration - 1) * 2, 20);
    return maxReels;
  };

  useEffect(() => {
    const calculateLiveQuote = async () => {
      try {
        const result = await calculatePrice(formData);
        setLiveQuote(result.total);
      } catch (error) {
        console.error("Error calculating live quote:", error);
      }
    };
    calculateLiveQuote();
  }, [formData, calculatePrice]);

  const selectedTier = SERVICE_TIERS[formData.serviceTier as keyof typeof SERVICE_TIERS];

  // Summary generators
  const getServiceSummary = () => {
    const services = [];
    if (formData.includesPhotography) services.push("Photo");
    if (formData.includesVideography) services.push("Video");
    if (services.length === 0) return "No services selected";
    return `${services.join(" + ")} • ${selectedTier.name} tier`;
  };

  const getPhotoSummary = () => {
    if (!formData.includesPhotography) return "";
    const duration = formData.photoRateType === "hourly" 
      ? `${formData.photoDuration}h` 
      : `${formData.photoDays} ${formData.photoRateType === "halfDay" ? "half" : "full"} day${formData.photoDays > 1 ? "s" : ""}`;
    const edits = formData.photoEdits > 0 ? ` • ${formData.photoEdits} edits` : "";
    return `${duration}${edits}`;
  };

  const getVideoSummary = () => {
    if (!formData.includesVideography) return "";
    const duration = formData.videoRateType === "hourly" 
      ? `${formData.videoDuration}h` 
      : `${formData.videoDays} ${formData.videoRateType === "halfDay" ? "half" : "full"} day${formData.videoDays > 1 ? "s" : ""}`;
    const extras = [];
    if (formData.numReels > 0) extras.push(`${formData.numReels} reels`);
    if (formData.numRecaps > 0) extras.push(`${formData.numRecaps} recaps`);
    const extrasText = extras.length > 0 ? ` • ${extras.join(", ")}` : "";
    return `${duration}${extrasText}`;
  };

  const getAdditionalSummary = () => {
    const items = [];
    if (!formData.clientCoversTravel && formData.travelDistance > 0) {
      items.push(`${formData.travelDistance === 3000 ? "3000+" : formData.travelDistance}mi travel`);
    }
    if (formData.deliverySpeed !== "standard") {
      items.push(formData.deliverySpeed === "expedited" ? "Expedited delivery" : "Super expedited delivery");
    }
    return items.length > 0 ? items.join(" • ") : "Standard options";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0B0B] text-[#E0E0E0]">
      <main className="flex-1 p-3 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
            <div className="dark-card p-4 sm:p-6">
              {liveQuote !== null && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-[#1A1A1A] rounded-xl text-center animate-fadeIn border border-[#1E90FF]/20">
                  <p className="text-xs sm:text-sm text-[#7E8C99] mb-1">Estimated Total</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">${liveQuote}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Service Selection */}
                <div className="space-y-3 sm:space-y-4">
                  <div 
                    className="dropdown-header flex justify-between items-center cursor-pointer border border-transparent" 
                    onClick={() => toggleSection("service")}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-[#E0E0E0]">Service Selection</h3>
                      {!expandedSections.service && (
                        <span className="text-xs sm:text-sm text-[#7E8C99] bg-[#1A1A1A] px-2 py-1 rounded-lg border border-[#7E8C99]/20 transition-all duration-300 group-hover:border-[#1E90FF]/50">
                          {getServiceSummary()}
                        </span>
                      )}
                    </div>
                    {expandedSections.service ? 
                      <ChevronUpIcon className="dropdown-icon" /> : 
                      <ChevronDownIcon className="dropdown-icon" />
                    }
                  </div>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.service ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <label className="flex items-center gap-2 p-3 rounded-xl border border-[#7E8C99]/20 hover:border-[#1E90FF] transition-colors cursor-pointer bg-[#1A1A1A] flex-1">
                          <input
                            type="checkbox"
                            checked={formData.includesPhotography}
                            onChange={e => handleInputChange("includesPhotography", e.target.checked)}
                            className="flex-shrink-0"
                          />
                          <span className="font-medium text-sm sm:text-base">Photo</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 rounded-xl border border-[#7E8C99]/20 hover:border-[#1E90FF] transition-colors cursor-pointer bg-[#1A1A1A] flex-1">
                          <input
                            type="checkbox"
                            checked={formData.includesVideography}
                            onChange={e => handleInputChange("includesVideography", e.target.checked)}
                            className="flex-shrink-0"
                          />
                          <span className="font-medium text-sm sm:text-base">Video</span>
                        </label>
                      </div>

                      {(formData.includesPhotography || formData.includesVideography) && (
                        <div className="animate-fadeIn space-y-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium mb-3 text-[#7E8C99]">Service Tier</label>
                            <select
                              value={formData.serviceTier}
                              onChange={e => handleInputChange("serviceTier", e.target.value)}
                              className="w-full rounded-xl p-3 bg-[#1A1A1A] border border-[#7E8C99]/20 text-sm sm:text-base hover:border-[#1E90FF] transition-colors focus:border-[#1E90FF] focus:outline-none"
                              aria-label="Select service tier"
                            >
                              {Object.entries(SERVICE_TIERS).map(([tier, config]) => (
                                <option key={tier} value={tier}>
                                  {config.name} - {config.description}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Service Tier Details */}
                          <div className="p-4 rounded-xl border border-[#1E90FF]/20 bg-[#1E90FF]/5 animate-fadeIn">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-[#E0E0E0] text-base mb-2">{selectedTier.name} Tier</h4>
                                <p className="text-sm text-[#7E8C99] mb-3">{selectedTier.description}</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <span className="text-[#7E8C99]">Delivery:</span>
                                    <span className="ml-1 text-[#E0E0E0]">{selectedTier.universal.deliveryTime}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#7E8C99]">Revisions:</span>
                                    <span className="ml-1 text-[#E0E0E0]">{selectedTier.universal.revisions}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#7E8C99]">Support:</span>
                                    <span className="ml-1 text-[#E0E0E0]">{selectedTier.universal.supportLevel}</span>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-[#7E8C99] mt-2 italic">
                                  {selectedTier.universal.deliveryDescription}
                                </p>
                              </div>
                              
                              <div className="flex flex-row sm:flex-col gap-4 sm:gap-2 text-right flex-shrink-0">
                                {formData.includesPhotography && (
                                  <div className="flex-1 sm:flex-none">
                                    <div className="text-xs text-[#7E8C99]">Photo</div>
                                    <div className="font-semibold text-white text-sm sm:text-base">${selectedTier.photography.hourly}/hr</div>
                                    <div className="text-xs text-[#7E8C99]">{selectedTier.photography.photosPerHour}+ photos/hr</div>
                                  </div>
                                )}
                                {formData.includesVideography && (
                                  <div className="flex-1 sm:flex-none">
                                    <div className="text-xs text-[#7E8C99]">Video</div>
                                    <div className="font-semibold text-white text-sm sm:text-base">${selectedTier.videography.hourly}/hr</div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Features */}
                            {(formData.includesPhotography || formData.includesVideography) && (
                              <div className="mt-4 pt-3 border-t border-[#7E8C99]/20">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {formData.includesPhotography && (
                                    <div>
                                      <h5 className="text-xs font-medium text-[#1E90FF] mb-2">Photo Features</h5>
                                      <ul className="space-y-1">
                                        {selectedTier.photography.features.map((feature, index) => (
                                          <li key={index} className="text-xs text-[#7E8C99]">• {feature}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {formData.includesVideography && (
                                    <div>
                                      <h5 className="text-xs font-medium text-[#1E90FF] mb-2">Video Features</h5>
                                      <ul className="space-y-1">
                                        {selectedTier.videography.features.map((feature, index) => (
                                          <li key={index} className="text-xs text-[#7E8C99]">• {feature}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photo Options */}
                {formData.includesPhotography && (
                  <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                    <div 
                      className="dropdown-header flex justify-between items-center cursor-pointer border border-transparent" 
                      onClick={() => toggleSection("photography")}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-[#E0E0E0]">Photo Options</h3>
                        {!expandedSections.photography && (
                          <span className="text-xs sm:text-sm text-[#7E8C99] bg-[#1A1A1A] px-2 py-1 rounded-lg border border-[#7E8C99]/20 transition-all duration-300 group-hover:border-[#1E90FF]/50">
                            {getPhotoSummary()}
                          </span>
                        )}
                      </div>
                      {expandedSections.photography ? 
                        <ChevronUpIcon className="dropdown-icon" /> : 
                        <ChevronDownIcon className="dropdown-icon" />
                      }
                    </div>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.photography ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99]">Rate Type</label>
                            <select
                              value={formData.photoRateType}
                              onChange={e => handleInputChange("photoRateType", e.target.value)}
                              className="w-full rounded-xl p-2 bg-[#1A1A1A] border border-[#7E8C99]/20 text-sm sm:text-base"
                            >
                              <option value="hourly">Hourly</option>
                              <option value="halfDay">Half Day (6 hours)</option>
                              <option value="fullDay">Full Day (8+ hours)</option>
                            </select>
                          </div>
                          {formData.photoRateType === "hourly" ? (
                            <div>
                              <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99]">Shoot Duration (hours)</label>
                              <input
                                type="range"
                                min="1"
                                max="8"
                                value={formData.photoDuration}
                                onChange={e => handleInputChange("photoDuration", parseInt(e.target.value))}
                                className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="text-right mt-1 text-xs sm:text-sm">{formData.photoDuration} hours</div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99]">Number of Days</label>
                              <input
                                type="range"
                                min="1"
                                max="7"
                                value={formData.photoDays}
                                onChange={e => handleInputChange("photoDays", parseInt(e.target.value))}
                                className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="text-right mt-1 text-xs sm:text-sm">{formData.photoDays} days</div>
                            </div>
                          )}
                          <div className="lg:col-span-2">
                            <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99]">
                              Advanced Photo Edits
                              <span className="ml-1 inline-flex text-[#1E90FF]" title="$5 per photo, includes advanced retouching beyond basic color correction">
                                <InfoCircledIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              </span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={formData.photoEdits}
                              onChange={e => handleInputChange("photoEdits", parseInt(e.target.value))}
                              className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-right mt-1 text-xs sm:text-sm">{formData.photoEdits} photos</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Options */}
                {formData.includesVideography && (
                  <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                    <div 
                      className="dropdown-header flex justify-between items-center cursor-pointer border border-transparent" 
                      onClick={() => toggleSection("videography")}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-[#E0E0E0]">Video Options</h3>
                        {!expandedSections.videography && (
                          <span className="text-xs sm:text-sm text-[#7E8C99] bg-[#1A1A1A] px-2 py-1 rounded-lg border border-[#7E8C99]/20 transition-all duration-300 group-hover:border-[#1E90FF]/50">
                            {getVideoSummary()}
                          </span>
                        )}
                      </div>
                      {expandedSections.videography ? 
                        <ChevronUpIcon className="dropdown-icon" /> : 
                        <ChevronDownIcon className="dropdown-icon" />
                      }
                    </div>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.videography ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99]">Rate Type</label>
                            <select
                              value={formData.videoRateType}
                              onChange={e => handleInputChange("videoRateType", e.target.value)}
                              className="w-full rounded-xl p-2 bg-[#1A1A1A] border border-[#7E8C99]/20 text-sm sm:text-base"
                            >
                              <option value="hourly">Hourly</option>
                              <option value="halfDay">Half Day (6 hours)</option>
                              <option value="fullDay">Full Day (8+ hours)</option>
                            </select>
                          </div>
                          {formData.videoRateType === "hourly" ? (
                            <div>
                              <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99]">Shoot Duration (hours)</label>
                              <input
                                type="range"
                                min="1"
                                max="8"
                                value={formData.videoDuration}
                                onChange={e => handleInputChange("videoDuration", parseInt(e.target.value))}
                                className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="text-right mt-1 text-xs sm:text-sm">{formData.videoDuration} hours</div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99]">Number of Days</label>
                              <input
                                type="range"
                                min="1"
                                max="7"
                                value={formData.videoDays}
                                onChange={e => handleInputChange("videoDays", parseInt(e.target.value))}
                                className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="text-right mt-1 text-xs sm:text-sm">{formData.videoDays} days</div>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99] break-words">
                              Number of Reels (max {getMaxReels(formData.videoRateType === "hourly" ? formData.videoDuration : (formData.videoRateType === "halfDay" ? 6 : 8) * formData.videoDays)})
                            </label>
                            <input
                              type="range"
                              min="0"
                              max={getMaxReels(formData.videoRateType === "hourly" ? formData.videoDuration : (formData.videoRateType === "halfDay" ? 6 : 8) * formData.videoDays)}
                              value={formData.numReels}
                              onChange={e => handleInputChange("numReels", parseInt(e.target.value))}
                              className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-right mt-1 text-xs sm:text-sm">{formData.numReels} reels</div>
                          </div>
                          {formData.numReels > 0 && (
                            <div>
                              <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99]">Reel Duration (seconds)</label>
                              <input
                                type="range"
                                min="15"
                                max="60"
                                step="15"
                                value={formData.reelDuration}
                                onChange={e => handleInputChange("reelDuration", parseInt(e.target.value))}
                                className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="text-right mt-1 text-xs sm:text-sm">{formData.reelDuration} seconds</div>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99]">Number of Recaps</label>
                            <input
                              type="range"
                              min="0"
                              max="5"
                              value={formData.numRecaps}
                              onChange={e => handleInputChange("numRecaps", parseInt(e.target.value))}
                              className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-right mt-1 text-xs sm:text-sm">{formData.numRecaps} recaps</div>
                          </div>
                          {formData.numRecaps > 0 && (
                            <div>
                              <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99]">Recap Duration (seconds)</label>
                              <input
                                type="range"
                                min="30"
                                max="120"
                                step="30"
                                value={formData.recapDuration}
                                onChange={e => handleInputChange("recapDuration", parseInt(e.target.value))}
                                className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="text-right mt-1 text-xs sm:text-sm">{formData.recapDuration} seconds</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Options */}
                <div className="space-y-3 sm:space-y-4">
                  <div 
                    className="dropdown-header flex justify-between items-center cursor-pointer border border-transparent" 
                    onClick={() => toggleSection("additional")}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-[#E0E0E0]">Additional Options</h3>
                      {!expandedSections.additional && (
                        <span className="text-xs sm:text-sm text-[#7E8C99] bg-[#1A1A1A] px-2 py-1 rounded-lg border border-[#7E8C99]/20 transition-all duration-300 group-hover:border-[#1E90FF]/50">
                          {getAdditionalSummary()}
                        </span>
                      )}
                    </div>
                    {expandedSections.additional ? 
                      <ChevronUpIcon className="dropdown-icon" /> : 
                      <ChevronDownIcon className="dropdown-icon" />
                    }
                  </div>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.additional ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-4 sm:space-y-6">
                      <div className="mb-3 sm:mb-4">
                        <label className="flex items-start gap-2 p-3 rounded-xl border border-[#7E8C99]/20 hover:border-[#1E90FF] transition-colors cursor-pointer bg-[#1A1A1A]">
                          <input
                            type="checkbox"
                            checked={formData.clientCoversTravel}
                            onChange={e => handleInputChange("clientCoversTravel", e.target.checked)}
                            className="mt-1 flex-shrink-0"
                          />
                          <span className="font-medium text-sm sm:text-base">
                            Client provides travel accommodations
                            <span className="block sm:inline sm:ml-2 text-xs sm:text-sm text-[#7E8C99] mt-1 sm:mt-0">
                              (lodging, transportation & per diem covered by client)
                            </span>
                          </span>
                        </label>
                      </div>
                      {!formData.clientCoversTravel && (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99]">Travel Distance (miles from LA)</label>
                          <input
                            type="range"
                            min="0"
                            max="3000"
                            step="50"
                            value={formData.travelDistance}
                            onChange={e => handleInputChange("travelDistance", parseInt(e.target.value))}
                            className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="text-right mt-1 text-xs sm:text-sm">
                            {formData.travelDistance === 3000 ? "3000+ miles" : `${formData.travelDistance} miles`}
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1 text-[#7E8C99]">Delivery Speed</label>
                        <select
                          value={formData.deliverySpeed}
                          onChange={e => handleInputChange("deliverySpeed", e.target.value)}
                          className="w-full rounded-xl p-2 bg-[#1A1A1A] border border-[#7E8C99]/20 text-sm sm:text-base"
                        >
                          <option value="standard">Standard (Use tier delivery time)</option>
                          <option value="expedited">Expedited (3-5 days, +$100)</option>
                          <option value="superExpedited">Super Expedited (1-2 days, +$200)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="primary-button w-full text-sm sm:text-base py-3">
                  Calculate Price
                </button>
              </form>

              {quote && (
                <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
                  <div className="p-4 sm:p-6 bg-[#1A1A1A] rounded-xl border border-[#1E90FF]/20 animate-fadeIn">
                    <div className="mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-white">Total Cost: ${quote.total}</h2>
                    </div>
                    
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <div className="dropdown-header flex justify-between items-center cursor-pointer mb-2 border border-transparent" onClick={() => toggleSection("breakdown")}>
                          <h3 className="font-semibold text-[#E0E0E0] text-sm sm:text-base">Cost Breakdown</h3>
                          {expandedSections.breakdown ? 
                            <ChevronUpIcon className="dropdown-icon" /> : 
                            <ChevronDownIcon className="dropdown-icon" />
                          }
                        </div>
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.breakdown ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="space-y-2 sm:space-y-3">
                            {quote.breakdown.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between items-start p-2 rounded-xl hover:bg-[#0B0B0B]/50 transition-colors gap-2">
                                <span className="text-[#7E8C99] text-xs sm:text-sm break-words flex-1">{item.description}</span>
                                <span className="font-semibold text-[#E0E0E0] text-xs sm:text-sm flex-shrink-0">${item.amount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Toaster theme="dark" />
    </div>
  );
}
