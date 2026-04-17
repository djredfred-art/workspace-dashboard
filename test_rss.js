const https = require('https');

https.get('https://news.google.com/rss/search?q=schools+technology+AI+Google&hl=en-US&gl=US&ceid=US:en', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(data.substring(0, 500));
  });
});
