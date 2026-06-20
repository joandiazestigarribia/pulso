"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { EloFeedback } from "@/components/landings/elo-feedback"
import { BattleAuthPrompt } from "@/components/landings/battle/battle-auth-prompt"
import { BattleSide } from "@/components/landings/battle/battle-side"
import {
  BattleNowPlayingFooter,
  BattleProfileUnlockModal,
  BattleProgressBanner,
  BattleResetConfirmModal,
  BattleSkipLimitModal,
  BattleTopNotices,
} from "@/components/landings/battle/battle-ui-blocks"
import { PROFILE_UI_GOAL_VOTES, useBattleFlow } from "@/components/landings/battle/use-battle-flow"

const battleBackgroundStyle = {
  backgroundImage: "url('/images/battle/neon_campfire_background.png')",
  backgroundPosition: "center",
  backgroundSize: "contain",
} as const

export default function BattlePage() {
  const {
    battle,
    battleError,
    isVoting,
    voteResult,
    battleKey,
    voteFeedback,
    voteError,
    resetError,
    isResetting,
    isSkipping,
    consecutiveSkips,
    maxConsecutiveSkips,
    isSkipLimitModalOpen,
    activePreviewTrackId,
    refreshingPreviewTrackId,
    authConfirmation,
    profileUnlockNotice,
    shouldShowAuthPrompt,
    hasReachedUnlockThreshold,
    completedBattles,
    experimentCopyVariant,
    activePreviewTrackName,
    setAuthConfirmation,
    dismissProfileUnlockNotice,
    handleTogglePreview,
    handlePreviewEnded,
    handlePreviewError,
    handleVote,
    handleResetProgress,
    handleSkipStage,
    closeSkipLimitModal,
  } = useBattleFlow()
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  useEffect(() => {
    if (!isResetting) {
      return
    }

    setIsResetConfirmOpen(false)
  }, [isResetting])

  if (battleError) {
    return (
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center overflow-hidden px-4 pb-8 pt-24">
        <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={battleBackgroundStyle} />
        <div className="relative z-10 rounded-2xl border-2 border-[#ff4ef5]/45 bg-[#2a0e19]/80 px-5 py-3 text-sm font-bold text-[#ffd6dd]">
          {battleError instanceof Error
            ? battleError.message
            : "Battle service unavailable. Configure server database (`DATABASE_URL`) and retry."}
        </div>
      </main>
    )
  }

  if (!battle) {
    return (
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center overflow-hidden px-4 pb-8 pt-24">
        <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={battleBackgroundStyle} />
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.74),rgba(8,11,26,0.92))]" />
        <motion.div className="relative z-10 flex flex-col items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className="h-10 w-10 rounded-full border-2 border-[#00f0ff]/40 border-t-[#00f0ff]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/80">Loading Battle...</span>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-7xl overflow-hidden px-4 pb-8 pt-24 text-[#eaf7ff] selection:bg-[#ff4ef5] selection:text-black">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={battleBackgroundStyle} />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.74),rgba(8,11,26,0.92))]" />

      <AnimatePresence>
        {voteFeedback && <EloFeedback winner={voteFeedback.winner} loser={voteFeedback.loser} />}
      </AnimatePresence>

      <section className="relative z-10 mx-auto w-full max-w-300 overflow-hidden rounded-[28px]">
        <BattleTopNotices
          voteError={voteError}
          resetError={resetError}
          authConfirmation={authConfirmation}
          onDismissAuthConfirmation={() => setAuthConfirmation(null)}
        />

        {shouldShowAuthPrompt ? (
          <BattleAuthPrompt
            hasReachedUnlockThreshold={hasReachedUnlockThreshold}
            copyVariant={experimentCopyVariant}
          />
        ) : null}

        <section className="relative z-10 mx-auto flex w-[min(96%,1120px)] flex-1 flex-col gap-4 overflow-hidden p-4 md:p-5 lg:gap-4">
          <BattleProgressBanner completedBattles={completedBattles} goalVotes={PROFILE_UI_GOAL_VOTES} />

          <AnimatePresence mode="wait">
            <motion.div
              key={battleKey}
              className="m-auto flex w-full max-w-200 flex-col items-center gap-4 lg:flex-row lg:justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <BattleSide
                label="Canción A"
                color="#7be3ff"
                track={battle.trackA}
                voteLabel="Votar Izquierda"
                keyLabel="A"
                isVoting={isVoting}
                result={voteResult ? (voteResult.winner === battle.trackA.id ? "winner" : "loser") : null}
                activePreviewTrackId={activePreviewTrackId}
                refreshingPreviewTrackId={refreshingPreviewTrackId}
                onPreviewEnded={handlePreviewEnded}
                onPreviewError={handlePreviewError}
                onTogglePreview={handleTogglePreview}
                onVote={() => handleVote(battle.trackA.id)}
                side="left"
              />

              <div className="flex w-full flex-row items-center justify-center gap-3 lg:w-28 lg:flex-col lg:gap-4">
                <div className="flex h-20 w-20 rotate-6 animate-[floating_3s_ease-in-out_infinite] items-center justify-center rounded-[28px] border border-[#ffe600]/70 bg-black/60 shadow-[0_0_26px_rgba(255,230,0,0.35)] md:h-24 md:w-24 md:rounded-[32px]">
                  <span className="text-3xl font-black uppercase text-[#ffe600] md:text-4xl">VS</span>
                </div>
              </div>

              <BattleSide
                label="Canción B"
                color="#ffb5fb"
                track={battle.trackB}
                voteLabel="Votar Derecha"
                keyLabel="B"
                isVoting={isVoting}
                result={voteResult ? (voteResult.winner === battle.trackB.id ? "winner" : "loser") : null}
                activePreviewTrackId={activePreviewTrackId}
                refreshingPreviewTrackId={refreshingPreviewTrackId}
                onPreviewEnded={handlePreviewEnded}
                onPreviewError={handlePreviewError}
                onTogglePreview={handleTogglePreview}
                onVote={() => handleVote(battle.trackB.id)}
                side="right"
              />
            </motion.div>
          </AnimatePresence>
        </section>

        <BattleNowPlayingFooter
          activePreviewTrackName={activePreviewTrackName}
          isResetting={isResetting}
          isSkipping={isSkipping}
          skipsRemaining={Math.max(0, maxConsecutiveSkips - consecutiveSkips)}
          onRequestReset={() => setIsResetConfirmOpen(true)}
          onSkipStage={handleSkipStage}
        />
      </section>

      <BattleSkipLimitModal isOpen={isSkipLimitModalOpen} onClose={closeSkipLimitModal} />
      <BattleProfileUnlockModal
        isOpen={profileUnlockNotice !== null}
        completedBattlesCount={profileUnlockNotice?.completedBattlesCount ?? 0}
        threshold={profileUnlockNotice?.threshold ?? PROFILE_UI_GOAL_VOTES}
        onClose={dismissProfileUnlockNotice}
      />
      <BattleResetConfirmModal
        isOpen={isResetConfirmOpen}
        isResetting={isResetting}
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetProgress}
      />
    </main>
  )
}
