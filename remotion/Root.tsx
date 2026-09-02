import { Composition } from "remotion"
import { PulsoLaunchDemo } from "./PulsoLaunchDemo"

const FPS = 30
const DURATION_IN_FRAMES = FPS * 24

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="PulsoLaunchHorizontal"
        component={PulsoLaunchDemo}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ format: "horizontal" as const }}
      />
      <Composition
        id="PulsoLaunchVertical"
        component={PulsoLaunchDemo}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ format: "vertical" as const }}
      />
    </>
  )
}
