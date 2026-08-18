"use client";

import {
  ArrowUpRight,
  BadgeDollarSign,
  HeartPulse,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { QUESTION_GROUPS, type QuestionGroup } from "@/lib/metricmind/questions";

interface QuestionLaunchpadProps {
  disabled?: boolean;
  onSelect: (question: string) => void;
}

const GROUP_STYLES: Record<
  QuestionGroup["id"],
  {
    icon: typeof TrendingUp;
    iconClass: string;
    iconWrapClass: string;
    hoverClass: string;
  }
> = {
  growth: {
    icon: TrendingUp,
    iconClass: "text-orange-600",
    iconWrapClass: "bg-orange-100",
    hoverClass: "hover:border-orange-200 hover:bg-orange-50/50",
  },
  customers: {
    icon: HeartPulse,
    iconClass: "text-sky-600",
    iconWrapClass: "bg-sky-100",
    hoverClass: "hover:border-sky-200 hover:bg-sky-50/50",
  },
  profitability: {
    icon: BadgeDollarSign,
    iconClass: "text-emerald-600",
    iconWrapClass: "bg-emerald-100",
    hoverClass: "hover:border-emerald-200 hover:bg-emerald-50/50",
  },
  efficiency: {
    icon: Target,
    iconClass: "text-violet-600",
    iconWrapClass: "bg-violet-100",
    hoverClass: "hover:border-violet-200 hover:bg-violet-50/50",
  },
};

export default function QuestionLaunchpad({
  disabled = false,
  onSelect,
}: QuestionLaunchpadProps) {
  return (
    <section aria-labelledby="question-launchpad-title" className="px-4 pb-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            <h2
              id="question-launchpad-title"
              className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-700"
            >
              Explore insights
            </h2>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Pick a ready-made business question
          </p>
        </div>
        <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-500">
          {QUESTION_GROUPS.length * 3} starters
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {QUESTION_GROUPS.map((group) => {
          const style = GROUP_STYLES[group.id];
          const Icon = style.icon;

          return (
            <article
              key={group.id}
              className={`group rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.hoverClass}`}
            >
              <div className="mb-2.5 flex items-start gap-2.5">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${style.iconWrapClass}`}
                >
                  <Icon className={`h-4 w-4 ${style.iconClass}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-zinc-800">{group.label}</h3>
                  <p className="mt-0.5 truncate text-[10px] text-zinc-400">
                    {group.description}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                {group.questions.slice(0, 3).map((question) => (
                  <button
                    type="button"
                    key={question}
                    disabled={disabled}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-zinc-600 transition-colors hover:bg-white hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onSelect(question)}
                  >
                    <span className="line-clamp-1">{question}</span>
                    <ArrowUpRight className="h-3 w-3 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
