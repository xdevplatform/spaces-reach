while (1) {
  const toxicityScore = Math.random();
  const tweet = {
    user: {
      screen_name: ['happycamper', 'furiouscamper', 'DanieleUser', 'i_am_daniele', 'rocodromo', 'happycamper', 'furiouscamper', 'DanieleUser', 'i_am_daniele', 'rocodromo', 'rocodromo']
    }
  }

  const index = Math.round(toxicityScore * 10);
  const icons = ['😇', '😇', '😇', '😇', '😱', '😤', '😡', '🤬', '🤬', '🤬', '🤬'];
  const icon = icons[index];

  const username = tweet.user.screen_name[Math.round(toxicityScore * 10)];

  if (toxicityScore >= 0.5) {
    console.log(`${icon} Hiding a tweet from @${username} because its content is not healthy (score: ${toxicityScore}).`)
  } else {
    console.log(`${icon} @${username} (score: ${toxicityScore})`);
  }  
}
