// Free retro game sound effects (Pixabay / Mixkit)
const SFX_URLS = {
  questComplete: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Coin gain
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',     // Fanfare/Success
  buttonClick: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Click
};

export const playSound = (type: keyof typeof SFX_URLS) => {
  const audio = new Audio(SFX_URLS[type]);
  audio.volume = 0.4;
  audio.play().catch(() => {}); // Autoplay protection bypass
};