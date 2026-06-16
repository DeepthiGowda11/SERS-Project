import { useState } from "react";
import { useListCoachingSuggestions, getListCoachingSuggestionsQueryKey } from "@workspace/api-client-react";
import { emotionLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

const EMOTIONS = ["all", "happy", "sad", "anxious", "angry", "fearful", "disgusted", "surprised", "neutral"];

const STRATEGY_COLORS: Record<string, string> = {
  "Emotional Validation": "bg-violet-100 text-violet-800",
  "Peer Support": "bg-blue-100 text-blue-800",
  "Individual Check-in": "bg-cyan-100 text-cyan-800",
  "Mindfulness Technique": "bg-teal-100 text-teal-800",
  "Task Decomposition": "bg-green-100 text-green-800",
  "Growth Mindset Framing": "bg-emerald-100 text-emerald-800",
  "Emotional Reset": "bg-yellow-100 text-yellow-800",
  "Co-regulation": "bg-orange-100 text-orange-800",
  "Private Redirection": "bg-rose-100 text-rose-800",
  "Capitalise on Engagement": "bg-lime-100 text-lime-800",
  "Optimal Learning Window": "bg-amber-100 text-amber-800",
  "Curiosity-Driven Learning": "bg-sky-100 text-sky-800",
  "Direct Address": "bg-red-100 text-red-800",
  "Psychological Safety": "bg-indigo-100 text-indigo-800",
  "Reduced Exposure": "bg-pink-100 text-pink-800",
  "Curiosity Hook": "bg-purple-100 text-purple-800",
  "Difficulty Calibration": "bg-slate-100 text-slate-800",
};

export default function Coaching() {
  const [selectedEmotion, setSelectedEmotion] = useState("all");
  const queryEmotion = selectedEmotion === "all" ? undefined : selectedEmotion;

  const { data: suggestions, isLoading } = useListCoachingSuggestions(
    { emotion: queryEmotion },
    { query: { queryKey: getListCoachingSuggestionsQueryKey({ emotion: queryEmotion }) } }
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Coaching Suggestions</h1>
        <p className="text-muted-foreground text-sm mt-1">Evidence-based teacher intervention strategies</p>
      </div>

      {/* Emotion filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {EMOTIONS.map((e) => (
          <button
            key={e}
            onClick={() => setSelectedEmotion(e)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              selectedEmotion === e
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-card-border hover:border-primary/40"
            )}
          >
            {e === "all" ? "All Emotions" : emotionLabel(e)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && suggestions?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          <p className="font-medium">No suggestions for this emotion</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(Array.isArray(suggestions) ? suggestions : suggestions?.suggestions || []).map((s) => (
          <div key={s.id} className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {emotionLabel(s.emotion)}
              </span>
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", STRATEGY_COLORS[s.strategy] ?? "bg-gray-100 text-gray-800")}>
                {s.strategy}
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{s.suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
