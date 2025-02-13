

export const playNotificationSound = () => {
    const audio=new Audio('/audio/notif.wav')
    if (audio) {
      audio!.play().catch((error) => {
        console.error('Failed to play sound:', error);
      });
    }
  };