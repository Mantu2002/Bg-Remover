import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  Download,
  Scissors,
  X,
  Loader2,
  ImageOff,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const API_KEY_DEFAULT = "w4uTxDKTwRuRjm5xxK3YeK3R";

export default function BackgroundRemover() {
  const [apiKey, setApiKey] = useState(API_KEY_DEFAULT);
  const [showKey, setShowKey] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | processing | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const reset = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setStatus("idle");
    setErrorMsg("");
  }, []);

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith("image/")) {
      setErrorMsg("That's not an image file. Try a JPG, PNG, or WEBP.");
      setStatus("error");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setStatus("idle");
    setErrorMsg("");
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      handleFile(f);
    },
    [handleFile],
  );

  const removeBackground = useCallback(async () => {
    if (!file) return;
    if (!apiKey.trim()) {
      setErrorMsg("Add your remove.bg API key first.");
      setStatus("error");
      return;
    }
    setStatus("processing");
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("image_file", file);
      formData.append("size", "auto");

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": apiKey.trim() },
        body: formData,
      });

      if (!response.ok) {
        let detail = `Request failed (${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson?.errors?.[0]?.title) detail = errJson.errors[0].title;
        } catch (_) {}
        throw new Error(detail);
      }

      const blob = await response.blob();
      setResultUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch (err) {
      setErrorMsg(
        err.message === "Failed to fetch"
          ? "Couldn't reach remove.bg. Check your connection, or this browser/environment may be blocking the request."
          : err.message,
      );
      setStatus("error");
    }
  }, [file, apiKey]);

  const download = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${(file?.name || "image").replace(/\.[^/.]+$/, "")}-cutout.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [resultUrl, file]);

  const checker = {
    backgroundImage:
      "linear-gradient(45deg, #232323 25%, transparent 25%), linear-gradient(-45deg, #232323 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #232323 75%), linear-gradient(-45deg, transparent 75%, #232323 75%)",
    backgroundSize: "20px 20px",
    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
    backgroundColor: "#161616",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#121212",
        color: "#F0EDE6",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "48px 20px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes march { to { stroke-dashoffset: -32; } }
        .cut-border {
          stroke-dasharray: 10 8;
          animation: march 1.1s linear infinite;
        }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .display { font-family: 'Space Grotesk', sans-serif; }
        input[type="text"]::selection { background: #5EEAD4; color: #121212; }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <Scissors size={20} color="#5EEAD4" strokeWidth={2.25} />
          <span
            className="mono"
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              color: "#5EEAD4",
              textTransform: "uppercase",
            }}
          >
            Cutout Studio
          </span>
        </div>
        <h1
          className="display"
          style={{
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 700,
            margin: "0 0 8px",
            lineHeight: 1.1,
          }}
        >
          Drop a photo. Lift the subject out.
        </h1>
        <p
          style={{
            color: "#9A968C",
            fontSize: 15,
            margin: "0 0 32px",
            maxWidth: 480,
          }}
        >
          Runs on the remove.bg API — full resolution when your plan allows it,
          transparent PNG, ready to download.
        </p>

        {/* API key row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 28,
            padding: "10px 12px",
            background: "#1A1A1A",
            border: "1px solid #2A2A2A",
            borderRadius: 8,
          }}
        >
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: "#6B675F",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            API key
          </span>
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mono"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#F0EDE6",
              fontSize: 13,
            }}
            placeholder="Your remove.bg API key"
          />
          <button
            onClick={() => setShowKey((s) => !s)}
            className="mono"
            style={{
              background: "none",
              border: "none",
              color: "#6B675F",
              fontSize: 11,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {showKey ? "Hide" : "Show"}
          </button>
        </div>

        {/* Dropzone / preview */}
        {!previewUrl ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              position: "relative",
              cursor: "pointer",
              borderRadius: 14,
              padding: "64px 24px",
              textAlign: "center",
              background: isDragging ? "#1D2320" : "#171717",
              transition: "background 0.15s ease",
            }}
          >
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            >
              <rect
                x="1"
                y="1"
                width="calc(100% - 2px)"
                height="calc(100% - 2px)"
                rx="14"
                fill="none"
                stroke={isDragging ? "#5EEAD4" : "#3A3A3A"}
                strokeWidth="2"
                className="cut-border"
              />
            </svg>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Upload size={30} color="#5EEAD4" style={{ marginBottom: 14 }} />
            <div
              className="display"
              style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}
            >
              Drag an image here
            </div>
            <div style={{ color: "#6B675F", fontSize: 13 }}>
              or click to browse — JPG, PNG, WEBP
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                ...checker,
                borderRadius: 14,
                overflow: "hidden",
                position: "relative",
                minHeight: 320,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={resultUrl || previewUrl}
                alt="preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: 460,
                  display: "block",
                  objectFit: "contain",
                }}
              />
              {status === "processing" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(18,18,18,0.72)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <Loader2
                    size={26}
                    color="#5EEAD4"
                    className="mono"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <span
                    className="mono"
                    style={{
                      fontSize: 12,
                      color: "#5EEAD4",
                      letterSpacing: "0.06em",
                    }}
                  >
                    CUTTING...
                  </span>
                </div>
              )}
              <button
                onClick={reset}
                title="Start over"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(18,18,18,0.7)",
                  border: "1px solid #333",
                  color: "#F0EDE6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 16,
                flexWrap: "wrap",
              }}
            >
              {status !== "done" && (
                <button
                  onClick={removeBackground}
                  disabled={status === "processing"}
                  className="display"
                  style={{
                    flex: "1 1 auto",
                    padding: "13px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: status === "processing" ? "#2A3E39" : "#5EEAD4",
                    color: status === "processing" ? "#7FA79C" : "#0B1512",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: status === "processing" ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {status === "processing" ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: "spin 1s linear infinite" }}
                      />{" "}
                      Removing background
                    </>
                  ) : (
                    <>
                      <Scissors size={16} /> Remove background
                    </>
                  )}
                </button>
              )}

              {status === "done" && (
                <>
                  <button
                    onClick={download}
                    className="display"
                    style={{
                      flex: "1 1 auto",
                      padding: "13px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: "#5EEAD4",
                      color: "#0B1512",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Download size={16} /> Download PNG
                  </button>
                  <button
                    onClick={reset}
                    className="display"
                    style={{
                      padding: "13px 18px",
                      borderRadius: 8,
                      border: "1px solid #333",
                      background: "transparent",
                      color: "#F0EDE6",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <RefreshCw size={15} /> New image
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && errorMsg && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: 8,
              background: "#231616",
              border: "1px solid #3A2323",
              color: "#F1A6A6",
              fontSize: 13,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {!previewUrl && (
          <div
            style={{
              marginTop: 24,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#5A564D",
              fontSize: 12,
            }}
          >
            <ImageOff size={14} />
            <span>
              Nothing uploaded yet — the checkerboard means transparent, not
              empty.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
