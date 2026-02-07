import { motion } from "motion/react";

interface ChapterNavigationProps {
  activeChapter: string;
  onChapterClick: (chapter: string) => void;
}

const chapters = [
  { id: "identity", label: "IDENTITY" },
  { id: "comparison", label: "COMPARISON" },
  { id: "access", label: "ACCESS" },
  { id: "compliance", label: "COMPLIANCE" },
];

export function ChapterNavigation({
  activeChapter,
  onChapterClick,
}: ChapterNavigationProps) {
  return (
    <div className="sticky top-0 z-50 flex justify-center py-6">
      <motion.div
        className="inline-flex gap-1 rounded-full p-2"
        style={{
          background: "rgba(255, 255, 255, 0.65)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {chapters.map((chapter) => {
          const isActive = activeChapter === chapter.id;

          return (
            <button
              key={chapter.id}
              onClick={() => onChapterClick(chapter.id)}
              className="relative px-6 py-3 text-sm font-bold tracking-wider transition-all"
              style={{
                color: isActive
                  ? "#007AFF"
                  : "rgba(0, 0, 0, 0.5)",
                fontFamily:
                  "Source Sans Pro, -apple-system, system-ui, sans-serif",
              }}
            >
              {/* Active Background Glow */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(0, 122, 255, 0.15) 0%, rgba(0, 122, 255, 0.08) 100%)",
                    boxShadow:
                      "0 0 20px rgba(0, 122, 255, 0.3)",
                  }}
                  layoutId="activeChapter"
                  transition={{
                    type: "spring",
                    bounce: 0.2,
                    duration: 0.6,
                  }}
                />
              )}

              {/* Label */}
              <span className="relative z-10">
                {chapter.label}
              </span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}