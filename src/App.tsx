import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  CheckCircle2,
  Circle,
  Star,
  ChevronDown,
  Copy,
  Check,
  Share2,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import {
  reviewsData,
  availableBatches,
  getReviewByProfileAndBatch,
} from "./data/reviews";

interface GMBProfile {
  id: string;
  name: string;
  url: string;
  completed: boolean;
  reviewCount: number;
  display: boolean;
}

const initialProfiles: Omit<GMBProfile, "completed">[] = [
  {
    id: "uptown-1",
    name: "Uptown Property",
    url: "https://g.page/r/CRECGeTiIymFEAI/review",
    reviewCount: 6,
    display: true,
  },
  {
    id: "godrej-1",
    name: "Godrej Panipat",
    url: "https://g.page/r/CXYCI7j6cYwpEAI/review",
    reviewCount: 2,
    display: true,
  },
  {
    id: "godrej-2",
    name: "Godrej Panipat Properties",
    url: "https://g.page/r/CVm9g551jQzuEAI/review",
    reviewCount: 11,
    display: false,
  },
  {
    id: "godrej-3",
    name: "Godrej Panipat Township",
    url: "https://g.page/r/CW111m7bvFnuEAI/review",
    reviewCount: 2,
    display: true,
  },
  {
    id: "trident-1",
    name: "Trident Reality Panipat",
    url: "https://g.page/r/CcXSIZR8m3RnEAI/review",
    reviewCount: 5,
    display: true,
  },
  {
    id: "trident-2",
    name: "Trident Panipat Plots & Floors",
    url: "https://g.page/r/CWDgaB-FtCXzEAE/review",
    reviewCount: 0,
    display: true,
  },
  {
    id: "trident-3",
    name: "Trident Realty",
    url: "https://g.page/r/CeFLeN0XECz1EAI/review",
    reviewCount: 8,
    display: true,
  },
  {
    id: "trident-4",
    name: "Trident Realty Projects",
    url: "https://g.page/r/CZGQosAojAcFEAI/review",
    reviewCount: 1,
    display: true,
  },
  {
    id: "m3m-1",
    name: "M3M Panipat",
    url: "https://g.page/r/CUsRdoKTzFExEAI/review",
    reviewCount: 3,
    display: true,
  },
  {
    id: "sigma-1",
    name: "Sigma Panipat",
    url: "https://g.page/r/CROfJmP-35jWEAE/review",
    reviewCount: 1,
    display: true,
  },
  {
    id: "sigma-2",
    name: "Sigma Industrial Park",
    url: "https://g.page/r/CbSVz2L273iGEAI/review",
    reviewCount: 2,
    display: true,
  },
  {
    id: "nysa-1",
    name: "Nysa Residential Plots",
    url: "https://g.page/r/CZZyOz9d_mctEAI/review",
    reviewCount: 12,
    display: false,
  },
];

function App() {
  const [profiles, setProfiles] = useState<GMBProfile[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("batch-0");
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [copiedProfileId, setCopiedProfileId] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showIndividualShare, setShowIndividualShare] = useState<string | null>(
    null
  );
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [qrCache, setQrCache] = useState<Record<string, string>>({});
  const [mainQRCode, setMainQRCode] = useState<string | null>(null);

  // Load completion status from localStorage on component mount
  useEffect(() => {
    const savedCompletions = localStorage.getItem("gmb-completions");
    let completions: Record<string, boolean> = {};

    if (savedCompletions) {
      try {
        completions = JSON.parse(savedCompletions);
      } catch (error) {
        console.error("Error parsing saved completions:", error);
      }
    }

    const profilesWithCompletion = initialProfiles.map((profile) => ({
      ...profile,
      completed: completions[profile.id] || false,
    }));

    setProfiles(profilesWithCompletion);
  }, []);

  // Save completion status to localStorage whenever profiles change
  useEffect(() => {
    if (profiles.length > 0) {
      const completions = profiles.reduce((acc, profile) => {
        acc[profile.id] = profile.completed;
        return acc;
      }, {} as Record<string, boolean>);

      localStorage.setItem("gmb-completions", JSON.stringify(completions));
    }
  }, [profiles]);

  const toggleCompletion = (id: string) => {
    setProfiles((prev) =>
      prev.map((profile) =>
        profile.id === id
          ? { ...profile, completed: !profile.completed }
          : profile
      )
    );
  };

  const resetAll = () => {
    setProfiles((prev) =>
      prev.map((profile) => ({ ...profile, completed: false }))
    );
    localStorage.removeItem("gmb-completions");
  };

  const copyReviewToClipboard = async (profileId: string) => {
    // Don't copy for batch-0 (links only)
    if (selectedBatch === "batch-0") return;

    const reviewText = getReviewByProfileAndBatch(profileId, selectedBatch);

    try {
      await navigator.clipboard.writeText(reviewText);
      setCopiedProfileId(profileId);

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedProfileId(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy review to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = reviewText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopiedProfileId(profileId);
      setTimeout(() => {
        setCopiedProfileId(null);
      }, 2000);
    }
  };

  const generateMainQRCode = async () => {
    // If already generated, just show it
    if (mainQRCode) {
      setShowQRCode(true);
      return;
    }

    try {
      // Generate QR code for the current page URL
      const currentUrl = window.location.href;
      const qrDataUrl = await QRCode.toDataURL(currentUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setMainQRCode(qrDataUrl);
      setShowQRCode(true);
    } catch (error) {
      console.error("Error generating main QR code:", error);
    }
  };
  const handleProfileClick = (profile: GMBProfile) => {
    // Copy review to clipboard first (only if not batch-0)
    if (selectedBatch !== "batch-0") {
      copyReviewToClipboard(profile.id);
    }

    // Then open the review link
    window.open(profile.url, "_blank", "noopener,noreferrer");
  };

  const openProfileLink = (url: string) => {
    // Remove '/review' from the end if it exists to get the profile link
    const profileUrl = url.replace(/\/review$/, "");
    window.open(profileUrl, "_blank", "noopener,noreferrer");
  };

  const generateShareOptions = async (url: string, profileId: string) => {
    // Check if QR code is already cached
    if (qrCache[profileId]) {
      setShowIndividualShare(profileId);
      return;
    }

    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Cache the generated QR code
      setQrCache((prev) => ({
        ...prev,
        [profileId]: qrDataUrl,
      }));

      setShowIndividualShare(profileId);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };
  const copyLinkToClipboard = async (url: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(id || "main");

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedLink(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopiedLink(id || "main");
      setTimeout(() => {
        setCopiedLink(null);
      }, 2000);
    }
  };

  const shareOnWhatsApp = (url: string, name: string) => {
    const message = `Please leave a review for ${name}: ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const shareMainPageOnWhatsApp = () => {
    const currentUrl = window.location.href;
    const message = `Check out this GMB Profile Review page: ${currentUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };
  const completedCount = profiles.filter((profile) => profile.completed).length;
  const progressPercentage =
    profiles.length > 0 ? (completedCount / profiles.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-3 py-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <Star className="w-6 h-6 text-yellow-500 mr-2" />
          <h1 className="text-xl font-bold text-gray-800">
            GMB Profile Review
          </h1>
        </div>

        {/* Batch Selector */}
        <div className="flex items-center justify-center space-x-3">
          <div className="relative inline-block">
            <button
              onClick={() => setShowBatchDropdown(!showBatchDropdown)}
              className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>
                {availableBatches.find((b) => b.id === selectedBatch)?.name}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showBatchDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showBatchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                {availableBatches.map((batch) => (
                  <button
                    key={batch.id}
                    onClick={() => {
                      setSelectedBatch(batch.id);
                      setShowBatchDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      selectedBatch === batch.id
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {batch.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* QR Code Button */}
          <button
            onClick={generateMainQRCode}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* GMB Profiles Section */}
      <div className="space-y-3">
        {profiles
          .filter((profile) => profile.display) // ✅ only profiles with display:true
          .map((profile, index) => (
            <div
              key={profile.id}
              className={`group rounded-xl p-4 transition-all duration-200 border-2 bg-white shadow-sm ${
                profile.completed
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleCompletion(profile.id)}
                    className="flex-shrink-0 transition-colors duration-200"
                  >
                    {profile.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
                    )}
                  </button>

                  {/* Profile Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3
                        className={`font-semibold transition-colors ${
                          profile.completed
                            ? "text-green-800"
                            : "text-gray-800 group-hover:text-blue-600"
                        }`}
                      >
                        #{index + 1} - {profile.name}
                      </h3>
                    </div>
                    <div className="mt-1">
                      <button
                        onClick={() => openProfileLink(profile.url)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 cursor-pointer ${
                          profile.reviewCount === 0
                            ? "bg-red-100 text-red-700"
                            : profile.reviewCount <= 2
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                        title="Click to view profile"
                      >
                        {profile.reviewCount}{" "}
                        {profile.reviewCount === 1 ? "review" : "reviews"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Review Button */}
                <div className="flex items-center space-x-2">
                  {/* Individual Share Button */}
                  <button
                    onClick={() =>
                      generateShareOptions(profile.url, profile.id)
                    }
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-600 transition-all duration-200"
                    title="Share this profile"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>

                  {/* Copy Review Button - Only show for non-batch-0 */}
                  {selectedBatch !== "batch-0" && (
                    <button
                      onClick={() => copyReviewToClipboard(profile.id)}
                      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                        copiedProfileId === profile.id
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                      }`}
                      title="Copy review to clipboard"
                    >
                      {copiedProfileId === profile.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  )}

                  {/* External Link Button */}
                  <button
                    onClick={() => handleProfileClick(profile)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                      profile.completed
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                    title="Copy review and open profile"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Review Preview - Only show for non-batch-0 */}
              {selectedBatch !== "batch-0" && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">
                    Review for{" "}
                    {availableBatches.find((b) => b.id === selectedBatch)?.name}
                    :
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {getReviewByProfileAndBatch(profile.id, selectedBatch)}
                  </p>
                </div>
              )}
            </div>
          ))}

        {/* Completion Message */}
        {completedCount === profiles.length && profiles.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-lg">All Profiles Reviewed!</span>
            </div>
            <p className="text-green-700 mt-2 text-sm">
              Excellent work! You've successfully reviewed all {profiles.length}{" "}
              GMB profiles for{" "}
              {availableBatches.find((b) => b.id === selectedBatch)?.name}. Your
              progress has been saved automatically.
            </p>
          </div>
        )}
      </div>

      {/* Individual Share Modal */}
      {showIndividualShare && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowIndividualShare(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowIndividualShare(null)}
              className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Modal Content */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">
                Share Profile
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                {profiles.find((p) => p.id === showIndividualShare)?.name}
              </p>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                {qrCache[showIndividualShare] && (
                  <img
                    src={qrCache[showIndividualShare]}
                    alt="QR Code for profile"
                    className="w-48 h-48 rounded-lg shadow-md"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const profile = profiles.find(
                      (p) => p.id === showIndividualShare
                    );
                    if (profile) {
                      copyLinkToClipboard(profile.url, profile.id);
                    }
                  }}
                  className={`w-full flex items-center justify-center space-x-2 rounded-lg px-4 py-3 font-medium transition-colors ${
                    copiedLink === showIndividualShare
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {copiedLink === showIndividualShare ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    const profile = profiles.find(
                      (p) => p.id === showIndividualShare
                    );
                    if (profile) {
                      shareOnWhatsApp(profile.url, profile.name);
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 font-medium transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Send on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Share Modal */}
      {showQRCode && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRCode(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowQRCode(false)}
              className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Modal Content */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">
                Share Review Page
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Share this review page with others
              </p>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                {mainQRCode && (
                  <img
                    src={mainQRCode}
                    alt="QR Code for this page"
                    className="w-48 h-48 rounded-lg shadow-md"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() =>
                    copyLinkToClipboard(window.location.href, "main")
                  }
                  className={`w-full flex items-center justify-center space-x-2 rounded-lg px-4 py-3 font-medium transition-colors ${
                    copiedLink === "main"
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {copiedLink === "main" ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={shareMainPageOnWhatsApp}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 font-medium transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Send on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center">
        {selectedBatch !== "batch-0" && (
          <p className="text-gray-500 text-sm">
            Reviews are automatically copied to clipboard when you click the
            copy button or profile link.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
