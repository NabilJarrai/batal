"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { CategoryProgressChart } from "@/components/player/CategoryProgressChart";
import { SkillProgressChart } from "@/components/player/SkillProgressChart";
import { parentAPI } from "@/lib/api";
import {
  getScoreBarColor,
  getScoreLabel,
  scoreToPercent,
  type Assessment,
  type SkillScore,
} from "@/types/assessments";
import { SkillCategory, getCategoryInfo } from "@/types/skills";
import {
  UserCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

interface ChildProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  groupName?: string;
  joiningDate: string;
}

/** How many skills to call out as strengths, and as things to work on. */
const HIGHLIGHT_COUNT = 3;

export default function ParentDashboard() {
  const selectedChildId = useAppSelector((state) => state.auth.selectedChildId);

  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; category: string } | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "skills">("overview");

  const fetchChildData = useCallback(async () => {
    if (!selectedChildId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("jwt_token");

      const profileResponse = await fetch(
        `${API_BASE_URL}/parents/me/children/${selectedChildId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (profileResponse.ok) {
        setChildProfile(await profileResponse.json());
      }

      const assessmentData = await parentAPI.getChildAssessments(selectedChildId);
      setAssessments(assessmentData as Assessment[]);
    } catch (error) {
      console.error("Error fetching child data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    fetchChildData();
  }, [fetchChildData]);

  const latest: Assessment | null = assessments.length > 0 ? assessments[0] : null;
  const previous: Assessment | null = assessments.length > 1 ? assessments[1] : null;

  const averageOf = (assessment: Assessment | null): number | null => {
    if (!assessment) return null;
    if (typeof assessment.overallAverage === "number") return assessment.overallAverage;
    const scores = assessment.skillScores ?? [];
    if (scores.length === 0) return null;
    return scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  };

  const currentAverage = averageOf(latest);
  const previousAverage = averageOf(previous);
  const change =
    currentAverage != null && previousAverage != null ? currentAverage - previousAverage : null;

  const latestScores: SkillScore[] = latest?.skillScores ?? [];

  // Sorted once, read from both ends: the top few are what to celebrate, the
  // bottom few are what to practise. Ties broken by name so the order is stable
  // between renders rather than shuffling on every fetch.
  const ranked = [...latestScores].sort(
    (a, b) => b.score - a.score || a.skillName.localeCompare(b.skillName)
  );
  const strengths = ranked.slice(0, HIGHLIGHT_COUNT);
  const focusAreas = ranked.slice(-HIGHLIGHT_COUNT).reverse();

  const categoryAverages = Object.values(SkillCategory)
    .map((category) => {
      const inCategory = latestScores.filter((s) => s.skillCategory === category);
      if (inCategory.length === 0) return null;
      return {
        category,
        average: inCategory.reduce((sum, s) => sum + s.score, 0) / inCategory.length,
        count: inCategory.length,
      };
    })
    .filter((c): c is { category: SkillCategory; average: number; count: number } => c !== null);

  /**
   * Every skill this child has ever been scored on, with its latest score and
   * how much it moved since the assessment before.
   *
   * Grouped by category so the picker can use optgroups, which is what lets a
   * single compact control stand in for what used to be a list of one tall
   * card per skill.
   */
  const skillOptions = (() => {
    const byKey = new Map<
      string,
      { name: string; category: string; latest: number | null; change: number | null }
    >();

    // assessments is newest first, so the first score seen for a skill is its
    // current one and the second is what to compare against.
    assessments.forEach((assessment) => {
      (assessment.skillScores || []).forEach((s) => {
        const key = `${s.skillCategory}|${s.skillName}`;
        const existing = byKey.get(key);
        if (!existing) {
          byKey.set(key, {
            name: s.skillName,
            category: s.skillCategory,
            latest: s.score,
            change: null,
          });
        } else if (existing.change === null && existing.latest !== null) {
          existing.change = existing.latest - s.score;
        }
      });
    });

    return Array.from(byKey.values()).sort(
      (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
    );
  })();

  const skillCategoriesPresent = Array.from(new Set(skillOptions.map((s) => s.category)));

  // Open on whatever moved most: with nothing selected the chart area was dead
  // space, and the biggest mover is the thing a parent would look up first.
  const defaultSkill =
    skillOptions.length === 0
      ? null
      : [...skillOptions].sort(
          (a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0) || a.name.localeCompare(b.name)
        )[0];

  const activeSkill = selectedSkill ?? defaultSkill;

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (!selectedChildId) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-lg text-center">
        <UserCircleIcon className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2">No child selected</h3>
        <p className="text-text-secondary text-sm sm:text-base">
          Choose a child from the menu to see how they are getting on.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const childName = childProfile?.firstName ?? "Your child";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/*
        The headline: how is my child doing right now. Everything else on this
        page is a supporting detail, and is sized accordingly.
      */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-accent-teal/5 rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
              {childName}&apos;s progress
            </h1>
            {latest ? (
              <p className="text-sm text-text-secondary mt-1">
                Last assessed {formatDate(latest.assessmentDate)}
                {latest.assessorName ? ` by ${latest.assessorName}` : ""}
              </p>
            ) : (
              <p className="text-sm text-text-secondary mt-1">No assessments yet</p>
            )}
          </div>

          {currentAverage != null && (
            <div className="bg-white rounded-xl px-5 py-4 shadow-md border border-gray-200 flex-shrink-0 w-full sm:w-auto text-center">
              <div className="text-4xl sm:text-5xl font-bold text-text-primary tabular-nums leading-none">
                {currentAverage.toFixed(1)}
                <span className="text-xl sm:text-2xl text-text-secondary font-semibold">/10</span>
              </div>
              <div className="text-sm font-semibold text-text-primary mt-2">
                {getScoreLabel(currentAverage)}
              </div>
              {change != null && (
                <div
                  className={`text-xs font-medium mt-1 ${
                    change >= 0 ? "text-accent-teal" : "text-accent-red"
                  }`}
                >
                  {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)} since last time
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {!latest ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-lg text-center">
          <ChartBarIcon className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2">
            No assessment yet
          </h3>
          <p className="text-text-secondary text-sm sm:text-base">
            {childName} hasn&apos;t had their first assessment. Once a coach completes one, their
            scores and progress will appear here.
          </p>
        </div>
      ) : (
        <>
          {/*
            The most actionable thing a parent can take away: what is going
            well, and what to practise before the next assessment.
          */}
          {latestScores.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HighlightCard
                title="Doing well"
                tone="positive"
                skills={strengths}
                emptyLabel="No scores recorded"
              />
              <HighlightCard
                title="Worth practising"
                tone="attention"
                skills={focusAreas}
                emptyLabel="No scores recorded"
              />
            </div>
          )}

          {/* Four numbers a parent can hold in their head. */}
          {categoryAverages.length > 0 && (
            <section className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-lg">
              <h2 className="text-base sm:text-lg font-bold text-text-primary mb-4">
                How {childName} scored in each area
              </h2>
              <div className="space-y-4">
                {categoryAverages.map(({ category, average, count }) => {
                  const info = getCategoryInfo(category);
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-sm font-medium text-text-primary min-w-0 truncate">
                          <span aria-hidden="true">{info?.icon} </span>
                          {info?.label ?? category}
                          <span className="text-text-secondary font-normal">
                            {" "}
                            ({count} skill{count === 1 ? "" : "s"})
                          </span>
                        </span>
                        <span className="text-sm font-bold text-text-primary flex-shrink-0 tabular-nums">
                          {average.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`${getScoreBarColor(average)} h-2.5 rounded-full transition-all duration-300`}
                          style={{ width: `${scoreToPercent(average)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* What the coach actually said, rather than only numbers. */}
          {(latest.comments || latest.coachNotes) && (
            <section className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-text-primary">
                  From the coach
                </h2>
              </div>
              {latest.comments && (
                <p className="text-sm sm:text-base text-text-primary whitespace-pre-line">
                  {latest.comments}
                </p>
              )}
              {latest.coachNotes && (
                <p className="text-sm sm:text-base text-text-primary whitespace-pre-line mt-3">
                  {latest.coachNotes}
                </p>
              )}
            </section>
          )}

          <div className="flex">
            <Link
              href={`/parent/assessments/${latest.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors font-semibold"
            >
              See the full assessment
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Trends need at least two assessments to mean anything. */}
          {assessments.length >= 2 ? (
            <section className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-text-primary">
                    Progress over time
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary">
                    Across {assessments.length} assessments
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setViewMode("overview")}
                    className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm rounded-lg transition-all font-medium ${
                      viewMode === "overview"
                        ? "bg-primary text-white shadow"
                        : "bg-secondary-100 text-text-primary hover:bg-secondary-50"
                    }`}
                  >
                    By area
                  </button>
                  <button
                    onClick={() => setViewMode("skills")}
                    className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm rounded-lg transition-all font-medium ${
                      viewMode === "skills"
                        ? "bg-primary text-white shadow"
                        : "bg-secondary-100 text-text-primary hover:bg-secondary-50"
                    }`}
                  >
                    By skill
                  </button>
                </div>
              </div>

              {viewMode === "overview" && <CategoryProgressChart assessments={assessments} />}

              {viewMode === "skills" && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="skill-picker"
                      className="block text-sm font-semibold text-text-primary mb-2"
                    >
                      Pick a skill to see how it has changed
                    </label>
                    {/*
                      One compact control rather than a card per skill. With 27
                      skills the old list was 27 full-width rows to scroll past
                      before the chart came into view on a phone, and it repeated
                      the category on every single row.
                    */}
                    <select
                      id="skill-picker"
                      className="select-base w-full"
                      value={activeSkill ? `${activeSkill.category}|${activeSkill.name}` : ""}
                      onChange={(e) => {
                        const [category, name] = e.target.value.split("|");
                        setSelectedSkill({ name, category });
                      }}
                    >
                      {skillCategoriesPresent.map((category) => (
                        <optgroup
                          key={category}
                          label={
                            getCategoryInfo(category as SkillCategory)?.label ?? category
                          }
                        >
                          {skillOptions
                            .filter((s) => s.category === category)
                            .map((s) => (
                              <option key={`${s.category}|${s.name}`} value={`${s.category}|${s.name}`}>
                                {s.name}
                                {s.latest != null ? ` — ${s.latest}/10` : ""}
                                {s.change ? ` (${s.change > 0 ? "+" : ""}${s.change})` : ""}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {activeSkill && (
                    <SkillProgressChart
                      assessments={assessments}
                      skillName={activeSkill.name}
                      category={activeSkill.category}
                    />
                  )}
                </div>
              )}
            </section>
          ) : (
            <section className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-lg">
              <div className="flex items-start gap-3">
                <ArrowTrendingUpIcon className="h-5 w-5 text-accent-yellow flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-text-primary">Progress over time</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    After a second assessment you&apos;ll be able to see how {childName} is
                    improving over time.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* History, most recent first. */}
          <section className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-lg">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-base sm:text-lg font-bold text-text-primary">
                Past assessments
              </h2>
              {assessments.length > 5 && (
                <Link
                  href="/parent/assessments"
                  className="text-sm text-primary hover:text-primary-hover font-medium flex-shrink-0"
                >
                  View all
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {assessments.slice(0, 5).map((assessment) => {
                const average = averageOf(assessment);
                return (
                  <Link
                    key={assessment.id}
                    href={`/parent/assessments/${assessment.id}`}
                    className="flex items-center justify-between gap-3 p-3 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CalendarIcon className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-text-primary truncate">
                          {assessment.period}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {formatDate(assessment.assessmentDate)}
                        </div>
                      </div>
                    </div>
                    <div className="text-base font-bold text-text-primary flex-shrink-0 tabular-nums">
                      {average != null ? `${average.toFixed(1)}/10` : "—"}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/*
        Administrative detail. Real, but not what a parent opens this page for,
        so it sits at the bottom in one quiet row instead of four large tiles.
      */}
      <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <MetaItem label="Level" value={childProfile?.level ?? "—"} />
          <MetaItem label="Group" value={childProfile?.groupName ?? "Unassigned"} />
          <MetaItem
            label="Member since"
            value={
              childProfile?.joiningDate
                ? new Date(childProfile.joiningDate).toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  })
                : "—"
            }
          />
          <MetaItem label="Assessments" value={String(assessments.length)} />
        </dl>
      </section>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="text-sm font-semibold text-text-primary truncate">{value}</dd>
    </div>
  );
}

function HighlightCard({
  title,
  tone,
  skills,
  emptyLabel,
}: {
  title: string;
  tone: "positive" | "attention";
  skills: SkillScore[];
  emptyLabel: string;
}) {
  return (
    <section className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-lg">
      <h2 className="text-base font-bold text-text-primary mb-3">
        <span
          className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${
            tone === "positive" ? "bg-accent-teal" : "bg-orange-500"
          }`}
          aria-hidden="true"
        />
        {title}
      </h2>
      {skills.length === 0 ? (
        <p className="text-sm text-text-secondary">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2.5">
          {skills.map((skill) => (
            <li key={skill.skillId}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-sm text-text-primary min-w-0 truncate">
                  {skill.skillName}
                </span>
                <span className="flex items-center gap-2 flex-shrink-0">
                  {skill.improvement != null && skill.improvement !== 0 && (
                    <span
                      className={`text-xs font-semibold ${
                        skill.improvement > 0 ? "text-accent-teal" : "text-accent-red"
                      }`}
                    >
                      {skill.improvement > 0 ? "↑" : "↓"} {Math.abs(skill.improvement)}
                    </span>
                  )}
                  <span className="text-sm font-bold text-text-primary tabular-nums">
                    {skill.score}/10
                  </span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`${getScoreBarColor(skill.score)} h-1.5 rounded-full`}
                  style={{ width: `${scoreToPercent(skill.score)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
