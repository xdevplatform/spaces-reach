const moderate = require('./moderate-graphql');

const tweet = {id_str: '1194923328290590720'};

(async () => {
  try {
    const res = await moderate(tweet);
    console.log(res);
  } catch (e) {
    console.error(e);
  }
  
})();