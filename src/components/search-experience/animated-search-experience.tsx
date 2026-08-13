"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle } from "@phosphor-icons/react";
import {
  SEARCH_SCENARIOS,
  SearchMode,
  SearchScenario,
} from "./search-demo-data";
import { SearchModes } from "./search-modes";
import { SearchInput } from "./search-input";
import { QueryIntent } from "./query-intent";
import { SearchStatus } from "./search-status";
import { SearchResultCard } from "./search-result-card";
import { AIAnswerPreview } from "./ai-answer-preview";
import { ComparisonView } from "./comparison-view";
import { DebuggingView } from "./debugging-view";
import { DeepResearchView } from "./deep-research-view";

export function AnimatedSearchExperience() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [typedQuery, setTypedQuery] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "typing" | "understanding" | "searching" | "synthesizing" | "complete"
  >("idle");
  const [understandingStepIndex, setUnderstandingStepIndex] = useState(0);
  const [visibleResultCount, setVisibleResultCount] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [highlightedResultId, setHighlightedResultId] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scenario = SEARCH_SCENARIOS[scenarioIndex];

  // IntersectionObserver: Only animate when section is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Main Animation State Machine Loop
  useEffect(() => {
    if (!isInView || isPaused) return;

    let isCancelled = false;
    let timeoutId: NodeJS.Timeout;

    // Reset state for new query
    setTypedQuery("");
    setIsTyping(true);
    setIsSearching(false);
    setSearchStatus("typing");
    setUnderstandingStepIndex(0);
    setVisibleResultCount(0);
    setActiveCardIndex(0);
    setShowAnswer(false);
    setHighlightedResultId(null);

    const fullQuery = scenario.query;
    let charIndex = 0;

    // 1. Natural Typing phase
    const typeChar = () => {
      if (isCancelled || isPaused) return;

      if (charIndex <= fullQuery.length) {
        setTypedQuery(fullQuery.slice(0, charIndex));
        charIndex++;
        const jitter = Math.random() * 22;
        timeoutId = setTimeout(typeChar, 36 + jitter);
      } else {
        // Typing finished
        setIsTyping(false);
        setSearchStatus("understanding");

        // 2. Understanding & Intent detection steps
        timeoutId = setTimeout(() => {
          if (isCancelled || isPaused) return;
          setUnderstandingStepIndex(1);

          timeoutId = setTimeout(() => {
            if (isCancelled || isPaused) return;
            setUnderstandingStepIndex(2);
            setIsSearching(true);
            setSearchStatus("searching");

            timeoutId = setTimeout(() => {
              if (isCancelled || isPaused) return;
              setUnderstandingStepIndex(3);

              // 3. Stagger Result Cards
              setIsSearching(false);
              setVisibleResultCount(1);

              timeoutId = setTimeout(() => {
                if (isCancelled || isPaused) return;
                setVisibleResultCount(2);

                timeoutId = setTimeout(() => {
                  if (isCancelled || isPaused) return;
                  setVisibleResultCount(3);

                  timeoutId = setTimeout(() => {
                    if (isCancelled || isPaused) return;
                    setVisibleResultCount(4);
                    setSearchStatus("synthesizing");

                    // 4. Show AI Answer Preview
                    timeoutId = setTimeout(() => {
                      if (isCancelled || isPaused) return;
                      setShowAnswer(true);
                      setSearchStatus("complete");

                      // 5. Active Focus Traversal
                      timeoutId = setTimeout(() => {
                        if (isCancelled || isPaused) return;
                        setActiveCardIndex(1);

                        timeoutId = setTimeout(() => {
                          if (isCancelled || isPaused) return;
                          setActiveCardIndex(2);

                          timeoutId = setTimeout(() => {
                            if (isCancelled || isPaused) return;
                            setActiveCardIndex(3);

                            // 6. Hold Completed State
                            timeoutId = setTimeout(() => {
                              if (isCancelled || isPaused) return;
                              // Fade out results and advance scenario
                              setVisibleResultCount(0);
                              setShowAnswer(false);

                              timeoutId = setTimeout(() => {
                                if (isCancelled || isPaused) return;
                                setScenarioIndex(
                                  (prev) => (prev + 1) % SEARCH_SCENARIOS.length
                                );
                              }, 400);
                            }, 3600);
                          }, 1200);
                        }, 1200);
                      }, 1200);
                    }, 600);
                  }, 140);
                }, 140);
              }, 140);
            }, 500);
          }, 400);
        }, 350);
      }
    };

    timeoutId = setTimeout(typeChar, 400);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [scenarioIndex, isInView, isPaused, scenario]);

  // Mode manual selection
  const handleSelectMode = (mode: SearchMode) => {
    const matchingScenarioIndex = SEARCH_SCENARIOS.findIndex(
      (s) => s.mode === mode
    );
    if (matchingScenarioIndex !== -1) {
      setScenarioIndex(matchingScenarioIndex);
    }
  };

  const handleSelectCustomQuery = (query: string) => {
    const found = SEARCH_SCENARIOS.findIndex((s) => s.query === query);
    if (found !== -1) {
      setScenarioIndex(found);
    } else {
      setTypedQuery(query);
    }
  };

  return (
    <section
      ref={containerRef}
      className="py-24 px-6 bg-white relative overflow-hidden"
      id="search-engine"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 border border-[#EBEBEB] bg-[#FAFAFA] rounded-full px-3.5 py-1 text-xs text-neutral-600 font-mono shadow-2xs">
            <Sparkle weight="bold" className="h-3.5 w-3.5 text-black" />
            <span>Community-Ranked Neural Results</span>
          </div>

          <h2
            className="font-medium tracking-tight text-black font-sans leading-[1.05]"
            style={{ fontSize: "clamp(34px, 5.5vw, 62px)" }}
          >
            The search engine <br className="hidden sm:inline" />
            <span className="italic font-serif text-neutral-400 font-normal">
              that works for you.
            </span>
          </h2>

          <p className="text-[15px] sm:text-[16px] text-neutral-500 font-sans max-w-xl mx-auto leading-relaxed">
            Developer-verified solutions, real-time code synthesis, and deterministic neural search — without the noise.
          </p>
        </div>

        {/* Large Rounded Search Demo Container */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="max-w-4xl mx-auto rounded-[32px] border border-[#EBEBEB] bg-[#F7F7F7] p-6 sm:p-10 relative overflow-hidden shadow-xs space-y-6"
          style={{
            backgroundImage:
              "radial-gradient(circle, #D8D8D8 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        >
          {/* Top Search Modes Tabs */}
          <SearchModes
            activeMode={scenario.mode}
            onSelectMode={handleSelectMode}
          />

          {/* Search Input Bar */}
          <SearchInput
            typedQuery={typedQuery}
            isTyping={isTyping}
            isSearching={isSearching}
            onSelectQuery={handleSelectCustomQuery}
            onClear={() => setTypedQuery("")}
          />

          {/* Query Intent & Understanding Steps */}
          <QueryIntent
            intent={scenario.intent}
            category={scenario.intentCategory}
            steps={scenario.understandingSteps}
            stepIndex={understandingStepIndex}
            isUnderstanding={searchStatus !== "idle" && searchStatus !== "typing"}
          />

          {/* Live Status & Source Counter */}
          <SearchStatus
            status={searchStatus}
            sourcesSearched={scenario.sourcesSearched}
            resultsCount={scenario.resultsCount}
          />

          {/* Main Results Stack & Specialized Views */}
          <div className="max-w-[620px] mx-auto space-y-3 min-h-[320px]">
            {/* Standard or Local Cards */}
            {(scenario.layoutType === "standard" || scenario.layoutType === "local") && (
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {visibleResultCount > 0 &&
                    scenario.results
                      .slice(0, visibleResultCount)
                      .map((result, idx) => (
                        <SearchResultCard
                          key={`${scenario.id}-${result.id}`}
                          result={result}
                          isActive={activeCardIndex === idx}
                          isHighlighted={highlightedResultId === result.id}
                          index={idx}
                          onHover={() => setActiveCardIndex(idx)}
                        />
                      ))}
                </AnimatePresence>

                {/* AI Answer Preview */}
                <AnimatePresence>
                  {showAnswer && scenario.aiAnswer && (
                    <AIAnswerPreview
                      summary={scenario.aiAnswer.summary}
                      sourcesCount={scenario.aiAnswer.sourcesCount}
                      citations={scenario.aiAnswer.citations}
                      onHoverCitation={setHighlightedResultId}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Comparison Scenario */}
            {scenario.layoutType === "comparison" && scenario.comparisonData && (
              <div className="space-y-3">
                <ComparisonView
                  optionA={scenario.comparisonData.optionA}
                  optionB={scenario.comparisonData.optionB}
                  metrics={scenario.comparisonData.metrics}
                />
                <AnimatePresence mode="popLayout">
                  {visibleResultCount > 0 &&
                    scenario.results
                      .slice(0, visibleResultCount)
                      .map((result, idx) => (
                        <SearchResultCard
                          key={`${scenario.id}-${result.id}`}
                          result={result}
                          isActive={activeCardIndex === idx}
                          index={idx}
                        />
                      ))}
                </AnimatePresence>
              </div>
            )}

            {/* Debugging Diagnostic Scenario */}
            {scenario.layoutType === "debugging" && scenario.debugData && (
              <div className="space-y-3">
                <DebuggingView debugData={scenario.debugData} />
                <AnimatePresence mode="popLayout">
                  {visibleResultCount > 0 &&
                    scenario.results
                      .slice(0, visibleResultCount)
                      .map((result, idx) => (
                        <SearchResultCard
                          key={`${scenario.id}-${result.id}`}
                          result={result}
                          isActive={activeCardIndex === idx}
                          index={idx}
                        />
                      ))}
                </AnimatePresence>
              </div>
            )}

            {/* Deep Research Scenario */}
            {scenario.layoutType === "deep_research" && scenario.deepResearchData && (
              <div className="space-y-3">
                <DeepResearchView researchData={scenario.deepResearchData} />
                {showAnswer && scenario.aiAnswer && (
                  <AIAnswerPreview
                    summary={scenario.aiAnswer.summary}
                    sourcesCount={scenario.aiAnswer.sourcesCount}
                    citations={scenario.aiAnswer.citations}
                    onHoverCitation={setHighlightedResultId}
                  />
                )}
                <AnimatePresence mode="popLayout">
                  {visibleResultCount > 0 &&
                    scenario.results
                      .slice(0, visibleResultCount)
                      .map((result, idx) => (
                        <SearchResultCard
                          key={`${scenario.id}-${result.id}`}
                          result={result}
                          isActive={activeCardIndex === idx}
                          index={idx}
                        />
                      ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
