"use client";

import { useState, useEffect } from "react";

type ResourceType = "vet" | "agri_input" | "crop_storage";

interface Resource {
  name: string;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
  isOpen?: boolean;
  phone?: string;
  website?: string;
  rating?: number;
  userRatings?: number;
  businessStatus?: string;
}

interface ResourceFinderProps {
  latitude: number;
  longitude: number;
  resourceType: ResourceType;
  onClose?: () => void;
  farmName?: string;
}

const RESOURCE_LABELS: Record<
  ResourceType,
  { title: string; icon: string; emoji: string }
> = {
  vet: {
    title: "Nearest Veterinarian",
    icon: "🐄",
    emoji: "🩺",
  },
  agri_input: {
    title: "Nearest Agricultural Input Shop",
    icon: "🌾",
    emoji: "🛒",
  },
  crop_storage: {
    title: "Nearest Crop Storage Facility",
    icon: "🏭",
    emoji: "📦",
  },
};

export default function ResourceFinder({
  latitude,
  longitude,
  resourceType,
  onClose,
  farmName = "My Farm",
}: ResourceFinderProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetchNearestResources();
  }, [latitude, longitude, resourceType]);

  async function fetchNearestResources() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/nearestresources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude,
          longitude,
          resourceType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch resources: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === "success" && data.results.length > 0) {
        setResources(data.results);
        setSelectedIndex(0);
      } else {
        setError("No nearby resources found. Try expanding your search area.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  function generateWhatsAppMessage(resource: Resource): string {
    const label = RESOURCE_LABELS[resourceType];
    const mapsLink = `https://maps.google.com/?q=${resource.latitude},${resource.longitude}`;

    return (
      `📍 *${label.title}* for ${farmName}\n\n` +
      `🏪 *${resource.name}*\n` +
      `📍 ${resource.address}\n` +
      `📏 Distance: ${resource.distance} km\n` +
      `${resource.phone ? `📞 Phone: ${resource.phone}\n` : ""}` +
      `${resource.rating ? `⭐ Rating: ${resource.rating}/5 (${resource.userRatings} reviews)\n` : ""}` +
      `🗺️ Maps: ${mapsLink}\n\n` +
      `Sent from KrishiMitr - Your Agricultural Assistant`
    );
  }

  function shareOnWhatsApp(resource: Resource) {
    const message = generateWhatsAppMessage(resource);
    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encoded}`;
    window.open(whatsappUrl, "_blank");
  }

  function openInMaps(resource: Resource) {
    const mapsUrl = `https://maps.google.com/?q=${resource.latitude},${resource.longitude}`;
    window.open(mapsUrl, "_blank");
  }

  const label = RESOURCE_LABELS[resourceType];
  const selected = resources[selectedIndex];

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        padding: "1.5rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        border: "1px solid rgba(45,106,79,0.2)",
        maxWidth: "600px",
        margin: "0 auto",
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          paddingBottom: "1rem",
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.8rem" }}>{label.emoji}</span>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#1b4332",
              }}
            >
              {label.title}
            </h3>
            <p
              style={{
                margin: "0.25rem 0 0 0",
                fontSize: "0.8rem",
                color: "#6b7c6b",
              }}
            >
              {resources.length} location{resources.length !== 1 ? "s" : ""}{" "}
              found
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "0.25rem",
            }}
          >
            ✕
          </button>
        )}
      </div>

      {loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            padding: "2rem",
            color: "#6b7c6b",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "3px solid #d8e8d0",
              borderTopColor: "#2d6a4f",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span>Finding nearest resources...</span>
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "10px",
            padding: "1rem",
            color: "#b91c1c",
            fontSize: "0.9rem",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {!loading && resources.length > 0 && selected && (
        <>
          {/* Selected Resource Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #ecfdf5 0%, #f0faf4 100%)",
              border: "2px solid #6ee7b7",
              borderRadius: "12px",
              padding: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "0.75rem",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#1b4332",
                  maxWidth: "70%",
                }}
              >
                {selected.name}
              </h4>
              {selected.rating && (
                <div
                  style={{
                    background: "#fff",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#f59e0b",
                  }}
                >
                  ⭐ {selected.rating.toFixed(1)}
                </div>
              )}
            </div>

            <p
              style={{
                margin: "0.5rem 0",
                fontSize: "0.9rem",
                color: "#1a2e1a",
                lineHeight: "1.5",
              }}
            >
              {selected.address}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
                marginTop: "0.75rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid #d8e8d0",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7c6b",
                    fontWeight: 600,
                  }}
                >
                  DISTANCE
                </span>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: "#2d6a4f",
                  }}
                >
                  {selected.distance} km
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7c6b",
                    fontWeight: 600,
                  }}
                >
                  STATUS
                </span>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color:
                      selected.isOpen === true
                        ? "#16a34a"
                        : selected.isOpen === false
                          ? "#dc2626"
                          : "#9ca3af",
                  }}
                >
                  {selected.isOpen === true
                    ? "✅ Open Now"
                    : selected.isOpen === false
                      ? "❌ Closed"
                      : "❓ Unknown"}
                </p>
              </div>
            </div>

            {selected.phone && (
              <div
                style={{
                  marginTop: "0.75rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid #d8e8d0",
                }}
              >
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>
                  <strong>📞 Contact:</strong>{" "}
                  <a
                    href={`tel:${selected.phone}`}
                    style={{
                      color: "#2d6a4f",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    {selected.phone}
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <button
              onClick={() => openInMaps(selected)}
              style={{
                background: "#2d6a4f",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.9rem",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.background = "#1b4332";
                (e.target as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.background = "#2d6a4f";
                (e.target as HTMLButtonElement).style.transform =
                  "translateY(0)";
              }}
            >
              🗺️ Open in Maps
            </button>
            <button
              onClick={() => shareOnWhatsApp(selected)}
              style={{
                background: "#25d366",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.9rem",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.background = "#1fa857";
                (e.target as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.background = "#25d366";
                (e.target as HTMLButtonElement).style.transform =
                  "translateY(0)";
              }}
            >
              💬 Share on WhatsApp
            </button>
          </div>

          {/* Other Locations */}
          {resources.length > 1 && (
            <div>
              <h5
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#1b4332",
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Other Nearby Locations
              </h5>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {resources.map((resource, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    style={{
                      background: idx === selectedIndex ? "#e8f5e9" : "#f9fafb",
                      border: `2px solid ${idx === selectedIndex ? "#6ee7b7" : "#e5e7eb"}`,
                      borderRadius: "10px",
                      padding: "0.75rem",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            color: "#1b4332",
                          }}
                        >
                          {resource.name}
                        </p>
                        <p
                          style={{
                            margin: "0.25rem 0 0 0",
                            fontSize: "0.8rem",
                            color: "#6b7c6b",
                          }}
                        >
                          {resource.distance} km away
                        </p>
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "#2d6a4f",
                        }}
                      >
                        →
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
