export type PromptTimingVariant = "early" | "standard" | "late"
export type PromptCopyVariant = "save_progress" | "unlock_dna"

export type ConversionExperimentAssignment = {
  timingVariant: PromptTimingVariant
  copyVariant: PromptCopyVariant
  votePromptThreshold: number
  key: string
}

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

function pickTimingVariant(hash: number): PromptTimingVariant {
  const bucket = hash % 3
  if (bucket === 0) {
    return "early"
  }

  if (bucket === 1) {
    return "standard"
  }

  return "late"
}

function toThreshold(timingVariant: PromptTimingVariant): number {
  if (timingVariant === "early") {
    return 1
  }

  if (timingVariant === "late") {
    return 5
  }

  return 3
}

function pickCopyVariant(hash: number): PromptCopyVariant {
  return hash % 2 === 0 ? "save_progress" : "unlock_dna"
}

export function resolveConversionExperiment(identitySeed: string): ConversionExperimentAssignment {
  const normalizedSeed = identitySeed.trim() || "guest"
  const hash = hashString(normalizedSeed)
  const timingVariant = pickTimingVariant(hash)
  const copyVariant = pickCopyVariant(hash >> 1)

  return {
    timingVariant,
    copyVariant,
    votePromptThreshold: toThreshold(timingVariant),
    key: `${timingVariant}:${copyVariant}`,
  }
}
