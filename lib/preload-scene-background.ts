import ReactDOM from "react-dom"

export function preloadSceneBackground(avifPath: string): void {
  ReactDOM.preload(avifPath, {
    as: "image",
    type: "image/avif",
    fetchPriority: "high",
  })
}
