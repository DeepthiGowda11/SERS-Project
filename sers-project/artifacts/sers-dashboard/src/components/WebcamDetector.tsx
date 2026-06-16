import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";
import { useCreateEmotionRecord } from "@workspace/api-client-react";
import { alertDot, emotionLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

type DetectedFace = {
  box: { x: number; y: number; width: number; height: number };
  emotion: string;
  alertLevel: string;
  confidence: number;
};

type Student = { id: number; name: string };

function emotionToAlertLevel(emotion: string): string {
  if (["happy", "neutral", "surprised"].includes(emotion)) return "green";
  if (["anxious", "sad", "fearful"].includes(emotion)) return "yellow";
  if (["angry", "disgusted"].includes(emotion)) return "red";
  // face-api uses: neutral, happy, sad, angry, fearful, disgusted, surprised
  if (emotion === "sad" || emotion === "fearful") return "yellow";
  if (emotion === "angry" || emotion === "disgusted") return "red";
  return "green";
}

// Map face-api expression keys to our labels
function mapExpression(expressions: Record<string, number>): { emotion: string; confidence: number } {
  const entries = Object.entries(expressions) as [string, number][];
  const best = entries.reduce((a, b) => (b[1] > a[1] ? b : a), entries[0]);
  return { emotion: best[0], confidence: best[1] };
}

const MODEL_PATH = import.meta.env.BASE_URL + "models";

interface WebcamDetectorProps {
  sessionId: number;
  students: Student[];
  onEmotionLogged?: () => void;
}

export default function WebcamDetector({ sessionId, students, onEmotionLogged }: WebcamDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [logInterval, setLogInterval] = useState(10); // seconds between auto-logging
  const [lastLogged, setLastLogged] = useState<Date | null>(null);
  const [totalLogged, setTotalLogged] = useState(0);

  const createEmotionRecord = useCreateEmotionRecord();

  // Load models once on mount
  useEffect(() => {
    async function loadModels() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_PATH);
        setModelsLoaded(true);
      } catch (err) {
        setCameraError("Failed to load emotion detection models.");
      }
    }
    loadModels();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCameraActive(false);
    setIsDetecting(false);
    setDetectedFaces([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Run detection loop
  const runDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < 2) return;

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
      .withFaceExpressions();

    const resized = faceapi.resizeResults(detections, displaySize);

    // Draw on canvas overlay
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of resized) {
        const { x, y, width, height } = d.detection.box;
        const { emotion, confidence } = mapExpression(d.expressions as unknown as Record<string, number>);
        const level = emotionToAlertLevel(emotion);
        const color = level === "green" ? "#10b981" : level === "yellow" ? "#f59e0b" : "#ef4444";

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Label background
        ctx.fillStyle = color;
        const label = `${emotionLabel(emotion)} ${(confidence * 100).toFixed(0)}%`;
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(x, y - 22, textWidth + 12, 22);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.fillText(label, x + 6, y - 6);
      }
    }

    const faces: DetectedFace[] = resized.map((d) => {
      const { emotion, confidence } = mapExpression(d.expressions as unknown as Record<string, number>);
      return {
        box: d.detection.box,
        emotion,
        alertLevel: emotionToAlertLevel(emotion),
        confidence,
      };
    });

    setDetectedFaces(faces);
    return faces;
  }, [modelsLoaded]);

  // Log emotions to API
  const logEmotions = useCallback(
    async (faces: DetectedFace[]) => {
      if (!faces.length || !students.length) return;
      let logged = 0;
      for (let i = 0; i < Math.min(faces.length, students.length); i++) {
        const face = faces[i];
        const student = students[i];
        try {
          await createEmotionRecord.mutateAsync({
            data: {
              studentId: student.id,
              sessionId,
              emotion: face.emotion,
              alertLevel: face.alertLevel,
              confidence: face.confidence,
            },
          });
          logged++;
        } catch {
          // continue
        }
      }
      if (logged > 0) {
        setLastLogged(new Date());
        setTotalLogged((n) => n + logged);
        onEmotionLogged?.();
      }
    },
    [createEmotionRecord, sessionId, students, onEmotionLogged]
  );

  // Start/stop detection loop
  const startDetection = useCallback(() => {
    setIsDetecting(true);
    intervalRef.current = setInterval(async () => {
      const faces = await runDetection();
      if (faces && faces.length > 0) {
        logEmotions(faces);
      }
    }, logInterval * 1000);
    // Run immediately once
    runDetection();
  }, [runDetection, logEmotions, logInterval]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isDetecting ? "bg-emerald-500 animate-pulse" : "bg-gray-300")} />
          <span className="font-semibold text-sm">Live Emotion Detection</span>
          {!modelsLoaded && (
            <span className="text-xs text-muted-foreground">(loading models...)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {cameraActive && !isDetecting && (
            <button
              onClick={startDetection}
              disabled={!modelsLoaded}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Start Detection
            </button>
          )}
          {isDetecting && (
            <button
              onClick={stopDetection}
              className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Pause
            </button>
          )}
          {!cameraActive ? (
            <button
              onClick={startCamera}
              disabled={!modelsLoaded}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {modelsLoaded ? "Enable Camera" : "Loading..."}
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Stop Camera
            </button>
          )}
        </div>
      </div>

      {/* Camera view */}
      <div className="relative bg-gray-900" style={{ aspectRatio: "4/3", maxHeight: 380 }}>
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <p className="text-sm font-medium">
              {cameraError ?? (modelsLoaded ? "Camera is off" : "Loading emotion models...")}
            </p>
            {cameraError && (
              <p className="text-xs text-red-400 max-w-xs text-center">{cameraError}</p>
            )}
          </div>
        )}
        <video
          ref={videoRef}
          className={cn("w-full h-full object-cover", !cameraActive && "hidden")}
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: cameraActive ? "block" : "none" }}
        />
      </div>

      {/* Status bar */}
      <div className="px-5 py-3 border-t border-card-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            Faces detected: <strong className="text-foreground">{detectedFaces.length}</strong>
          </span>
          <span>
            Students tracked: <strong className="text-foreground">{students.length}</strong>
          </span>
          {isDetecting && (
            <span>
              Logging every <strong className="text-foreground">{logInterval}s</strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {lastLogged && (
            <span>Last logged: {lastLogged.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          )}
          {totalLogged > 0 && <span>Total records: {totalLogged}</span>}
        </div>
      </div>

      {/* Detected face breakdown */}
      {detectedFaces.length > 0 && (
        <div className="px-5 py-3 border-t border-card-border">
          <div className="text-xs font-medium text-muted-foreground mb-2">Detected emotions</div>
          <div className="flex flex-wrap gap-2">
            {detectedFaces.map((face, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-lg">
                <span className={cn("w-2 h-2 rounded-full", alertDot(face.alertLevel))} />
                <span className="text-xs font-medium">{students[i]?.name ?? `Face ${i + 1}`}</span>
                <span className="text-xs text-muted-foreground">
                  {emotionLabel(face.emotion)} {(face.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log interval control */}
      {cameraActive && (
        <div className="px-5 py-3 border-t border-card-border flex items-center gap-3 text-xs text-muted-foreground">
          <span>Log interval:</span>
          {[5, 10, 30, 60].map((s) => (
            <button
              key={s}
              onClick={() => {
                setLogInterval(s);
                if (isDetecting) {
                  stopDetection();
                  setTimeout(startDetection, 100);
                }
              }}
              className={cn(
                "px-2.5 py-1 rounded border text-xs transition-all",
                logInterval === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/40"
              )}
            >
              {s}s
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
