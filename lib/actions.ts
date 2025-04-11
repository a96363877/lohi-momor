"use client"

/**
 * Plays a notification sound
 * Uses a singleton pattern to prevent multiple sounds playing simultaneously
 * and handles browser autoplay restrictions gracefully
 */
let audioInstance: HTMLAudioElement | null = null

export const playNotificationSound = () => {
  try {
    // If we already have an audio instance, stop and reset it
    if (audioInstance) {
      audioInstance.pause()
      audioInstance.currentTime = 0
    } else {
      // Create a new audio instance if one doesn't exist
      audioInstance = new Audio("/npt.mp3")

      // Set volume to a reasonable level
      audioInstance.volume = 0.5

      // Handle cleanup when the sound finishes playing
      audioInstance.onended = () => {
        // Don't set to null to reuse the instance
        if (audioInstance) {
          audioInstance.currentTime = 0
        }
      }
    }

    // Play the sound with error handling for autoplay restrictions
    const playPromise = audioInstance.play()

    // Modern browsers return a promise from play()
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Audio playback prevented by browser:", error)
        // User hasn't interacted with the document yet
        // We'll just silently fail in this case
      })
    }
  } catch (error) {
    console.error("Error playing notification sound:", error)
    // Fail silently - sound is not critical functionality
  }
}

/**
 * Preloads the notification sound for faster playback
 * Call this function on initial page load or user interaction
 */
export const preloadNotificationSound = () => {
  try {
    if (!audioInstance) {
      audioInstance = new Audio("/npt.mp3")
      audioInstance.preload = "auto"
      audioInstance.load()
    }
  } catch (error) {
    console.error("Error preloading notification sound:", error)
  }
}


