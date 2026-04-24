"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import TextType from "@/components/TextType";
import ElectricBorder from "@/components/ElectricBorder";
import ResourceFinder from "@/components/ResourceFinder";

type LivestockResult = {
  status: string;
  predicted_class: string;
  odia_name: string;
  confidence: number;
  severity: "low" | "moderate" | "high" | string;
  advice_odia: string;
  home_remedy: string;
  see_vet_urgently: boolean;
  low_confidence: boolean;
};

const SEVERITY_COLOR: Record<string, string> = {
  low: "#2d6a4f",
  moderate: "#d97706",
  high: "#dc2626",
};
const SEVERITY_BG: Record<string, string> = {
  low: "#ecfdf5",
  moderate: "#fffbeb",
  high: "#fef2f2",
};
const SEVERITY_BORDER: Record<string, string> = {
  low: "#6ee7b7",
  moderate: "#fcd34d",
  high: "#fca5a5",
};

export default function LivestockPage() {
  const [result, setResult] = useState<LivestockResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showResourceFinder, setShowResourceFinder] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/livestock", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server error ${res.status}: ${txt}`);
      }

      const data: LivestockResult = await res.json();

      if (data.status !== "success") {
        throw new Error("Diagnosis failed. Please try a clearer image.");
      }

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function requestLocation() {
    setLocationError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setShowResourceFinder(true);
        },
        (err) => {
          setLocationError(
            "Unable to get your location. Please enable location services and try again.",
          );
          console.error(err);
        },
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  }

  const sev = result?.severity ?? "low";
  const sevColor = SEVERITY_COLOR[sev] ?? "#2d6a4f";
  const sevBg = SEVERITY_BG[sev] ?? "#ecfdf5";
  const sevBorder = SEVERITY_BORDER[sev] ?? "#6ee7b7";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .bg-scene {
          min-height: 100vh;
          position: relative;
          font-family: 'DM Sans', sans-serif;
          background-image: url('/livestock-bg.jpg');
          background-size: cover;
          background-position: center 40%;
          background-attachment: fixed;
        }
        .bg-scene::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(160deg,rgba(10,40,20,0.52) 0%,rgba(30,80,40,0.38) 40%,rgba(180,110,20,0.28) 80%,rgba(10,40,20,0.55) 100%);
          pointer-events: none;
          z-index: 0;
        }
        .bg-scene::after {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── PAGE: wider to fit two columns ── */
        .page {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 3rem 1.5rem 4rem;
        }

        /* ── HERO ── */
        .hero { margin-bottom: 2rem; }
        .hero__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #a7f3c8;
          text-shadow: 0 1px 6px rgba(0,0,0,0.5);
          margin-bottom: 0.75rem;
        }
        .hero__eyebrow-dot {
          width: 6px; height: 6px;
          background: #a7f3c8;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px #a7f3c8;
        }
        .hero__title-wrap {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.6rem, 5.2vw, 3.5rem);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          white-space: nowrap;
          color: #0a0a0a;
          text-shadow:
            0 0 40px rgba(255,255,255,0.55),
            0 2px 0 rgba(255,255,255,0.9),
            2px 0 0 rgba(255,255,255,0.7),
            -2px 0 0 rgba(255,255,255,0.7),
            0 -2px 0 rgba(255,255,255,0.7),
            0 4px 24px rgba(0,0,0,0.18);
          min-height: 1.2em;
        }
        .hero__title-wrap .hero-cursor {
          color: #16a34a;
          font-weight: 300;
          -webkit-text-stroke: 0;
          text-shadow: 0 0 12px rgba(22,163,74,0.7);
        }
        .hero__rule {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .hero__rule-line {
          flex: 1;
          height: 1.5px;
          background: linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0.05));
          max-width: 200px;
        }
        .hero__rule-leaf { font-size: 1rem; filter: drop-shadow(0 1px 4px rgba(0,0,0,0.4)); }
        .hero__desc {
          color: rgba(255,255,255,0.88);
          font-size: 1rem;
          line-height: 1.65;
          max-width: 560px;
          text-shadow: 0 1px 6px rgba(0,0,0,0.45);
        }

        /* ── TWO-COLUMN LAYOUT ── */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        /* stack vertically on narrow screens */
        @media (max-width: 700px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── CARD (shared glass style) ── */
        .card {
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(18px) saturate(1.6);
          -webkit-backdrop-filter: blur(18px) saturate(1.6);
          border: 1px solid rgba(255,255,255,0.65);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow:
            0 8px 32px rgba(0,0,0,0.22),
            0 1px 2px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.9);
        }

        /* ── LEFT PANEL: upload + preview + loader ── */
        .upload-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* ── DROPZONE ── */
        .dropzone {
          border-radius: 14px;
          padding: 2rem 1rem;
          text-align: center;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          background: rgba(220,252,231,0.45);
          width: 100%;
        }
        .dropzone:hover {
          background: rgba(187,247,208,0.65);
          transform: translateY(-1px);
        }
        .dropzone__icon { font-size: 2.8rem; margin-bottom: 0.5rem; }
        .dropzone__label { font-size: 0.95rem; color: #1b4332; font-weight: 700; margin-bottom: 0.25rem; }
        .dropzone__sub { font-size: 0.8rem; color: #6b7c6b; }

        .preview-wrap {
          border-radius: 12px;
          overflow: hidden;
          max-height: 200px;
          display: flex;
          justify-content: center;
          background: #f0f0f0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.12);
        }
        .preview-wrap img { max-height: 200px; object-fit: contain; width: 100%; }

        .loader {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #1b4332;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .spinner {
          width: 22px; height: 22px;
          border: 3px solid #d8e8d0;
          border-top-color: #2d6a4f;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-box {
          background: #fff5f5;
          border: 1px solid #fca5a5;
          border-radius: 10px;
          padding: 1rem 1.25rem;
          color: #b91c1c;
          font-size: 0.9rem;
        }

        /* ── RIGHT PANEL: result card ── */
        .result-panel {
          /* slide-in animation when result appears */
          animation: slideIn 0.35s ease both;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* Empty state placeholder on the right */
        .result-placeholder {
          border: 2px dashed rgba(45,106,79,0.25);
          border-radius: 20px;
          padding: 3rem 1.5rem;
          text-align: center;
          color: rgba(255,255,255,0.35);
          font-size: 0.9rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          min-height: 220px;
          justify-content: center;
        }
        .result-placeholder__icon { font-size: 2.4rem; opacity: 0.4; }

        /* ── RESULT CONTENT ── */
        .result {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #b7dfc6;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .result__header {
          background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .result__name {
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
          text-transform: capitalize;
          font-family: 'Playfair Display', serif;
        }
        .result__odia { font-size: 0.9rem; color: #a7f3c8; font-weight: 500; margin-top: 0.1rem; }
        .result__conf {
          font-size: 0.78rem;
          background: rgba(255,255,255,0.18);
          color: #fff;
          border-radius: 20px;
          padding: 0.2rem 0.65rem;
          font-weight: 700;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.25);
        }
        .result__body {
          background: rgba(247,252,249,0.97);
          padding: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .badge-row { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.78rem;
          font-weight: 700;
          border-radius: 20px;
          padding: 0.22rem 0.65rem;
          border: 1px solid;
        }

        .section-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #1b4332;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 0.3rem;
        }
        .info-box {
          background: #fff;
          border: 1px solid #d8e8d0;
          border-radius: 10px;
          padding: 0.75rem 0.9rem;
          font-size: 0.95rem;
          color: #1a2e1a;
          line-height: 1.6;
        }

        .vet-warning {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          font-size: 0.85rem;
          color: #b91c1c;
          font-weight: 600;
        }
        .low-conf-note {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          font-size: 0.85rem;
          color: #78350f;
        }
      `}</style>

      <div className="bg-scene">
        <div className="page">
          {/* ── HERO ── */}
          <div className="hero">
            <div className="hero__eyebrow">
              <span className="hero__eyebrow-dot" />
              AI-Powered Diagnosis · Odia Language
            </div>
            <div className="hero__title-wrap">
              <TextType
                as="h1"
                text={[
                  "Livestock Health Monitor",
                  "Early Disease Detection",
                  "ପଶୁ ସ୍ୱାସ୍ଥ୍ୟ ନିରୀକ୍ଷଣ",
                ]}
                typingSpeed={55}
                deletingSpeed={35}
                pauseDuration={2800}
                initialDelay={400}
                loop={true}
                showCursor={true}
                cursorCharacter="_"
                cursorClassName="hero-cursor"
                cursorBlinkDuration={0.45}
                variableSpeed={{ min: 38, max: 82 }}
                className="!whitespace-nowrap"
              />
            </div>
            <div className="hero__rule">
              <div className="hero__rule-line" />
              <span className="hero__rule-leaf">🌿</span>
            </div>
            <p className="hero__desc">
              Upload a clear photo of your animal. We'll detect early signs of
              illness and suggest treatment in Odia.
            </p>
          </div>

          {/* ── TWO-COLUMN GRID ── */}
          <div className="main-grid">
            {/* ── LEFT: upload panel ── */}
            <div className="card upload-panel">
              <ElectricBorder
                color="#16a34a"
                speed={0.8}
                chaos={0.1}
                borderRadius={14}
                style={{ display: "block", width: "100%" }}
              >
                <div
                  className="dropzone"
                  onClick={() => fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="dropzone__icon">📷</div>
                  <div className="dropzone__label">
                    Click or drag &amp; drop an animal photo
                  </div>
                  <div className="dropzone__sub">
                    JPG, PNG, WEBP — max 10 MB
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </div>
              </ElectricBorder>

              {preview && (
                <div className="preview-wrap">
                  <img src={preview} alt="Uploaded animal" />
                </div>
              )}

              {loading && (
                <div className="loader">
                  <div className="spinner" />
                  Analysing your animal photo…
                </div>
              )}

              {error && <div className="error-box">⚠️ {error}</div>}
            </div>

            {/* ── RIGHT: result panel ── */}
            {result && !loading ? (
              <div className="result-panel">
                <div className="result">
                  <div className="result__header">
                    <div>
                      <div className="result__name">
                        {result.predicted_class.replace(/_/g, " ")}
                      </div>
                      <div className="result__odia">{result.odia_name}</div>
                    </div>
                    <div className="result__conf">
                      {result.confidence.toFixed(1)}% confident
                    </div>
                  </div>

                  <div className="result__body">
                    <div className="badge-row">
                      <span
                        className="badge"
                        style={{
                          color: sevColor,
                          background: sevBg,
                          borderColor: sevBorder,
                        }}
                      >
                        🌡 Severity:{" "}
                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
                      </span>
                      {result.see_vet_urgently && (
                        <span
                          className="badge"
                          style={{
                            color: "#b91c1c",
                            background: "#fef2f2",
                            borderColor: "#fca5a5",
                          }}
                        >
                          🚨 Urgent Vet Visit
                        </span>
                      )}
                    </div>

                    {result.see_vet_urgently && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.75rem",
                        }}
                      >
                        <div className="vet-warning">
                          🚨{" "}
                          <span>
                            This animal needs urgent veterinary attention.
                            Contact a vet immediately.
                          </span>
                        </div>
                        <button
                          onClick={requestLocation}
                          style={{
                            background:
                              "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "0.75rem 1.2rem",
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            cursor: "pointer",
                            transition: "all 0.3s",
                            width: "100%",
                            boxShadow: "0 4px 12px rgba(220,38,38,0.3)",
                          }}
                          onMouseOver={(e) => {
                            (e.target as HTMLButtonElement).style.transform =
                              "translateY(-2px)";
                            (e.target as HTMLButtonElement).style.boxShadow =
                              "0 6px 16px rgba(220,38,38,0.4)";
                          }}
                          onMouseOut={(e) => {
                            (e.target as HTMLButtonElement).style.transform =
                              "translateY(0)";
                            (e.target as HTMLButtonElement).style.boxShadow =
                              "0 4px 12px rgba(220,38,38,0.3)";
                          }}
                        >
                          🗺️ Find Nearest Veterinarian
                        </button>
                        {locationError && (
                          <div
                            style={{
                              background: "#fef2f2",
                              border: "1px solid #fca5a5",
                              borderRadius: "10px",
                              padding: "0.75rem",
                              fontSize: "0.85rem",
                              color: "#b91c1c",
                            }}
                          >
                            {locationError}
                          </div>
                        )}
                      </div>
                    )}

                    {result.low_confidence && (
                      <div className="low-conf-note">
                        ⚠️{" "}
                        <span>
                          Low confidence — try a clearer, better-lit photo for
                          more accurate results.
                        </span>
                      </div>
                    )}

                    <div>
                      <div className="section-label">
                        Treatment Advice (ଓଡ଼ିଆ)
                      </div>
                      <div className="info-box">{result.advice_odia}</div>
                    </div>

                    {result.home_remedy && (
                      <div>
                        <div className="section-label">
                          Home Remedy (ଘରୋଇ ଉପଚାର)
                        </div>
                        <div className="info-box">{result.home_remedy}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* placeholder when no result yet */
              !loading && (
                <div className="result-placeholder">
                  <span className="result-placeholder__icon">🔬</span>
                  <span>Diagnosis results will appear here</span>
                </div>
              )
            )}
          </div>
          {/* end main-grid */}

          {/* Resource Finder Modal */}
          {showResourceFinder && userLocation && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "1rem",
                animation: "fadeIn 0.2s ease-out",
              }}
              onClick={() => setShowResourceFinder(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <ResourceFinder
                  latitude={userLocation.latitude}
                  longitude={userLocation.longitude}
                  resourceType="vet"
                  onClose={() => setShowResourceFinder(false)}
                  farmName="Your Farm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
