var Twit = require('twit')
var MarkovChain = require('markovchain')
var chokidar = require('chokidar');
var fs = require('fs');
var jsdiff = require('diff');
var config = require('./config')

var T = new Twit({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token: config.access_token,
    access_token_secret: config.access_token_secret,
    timeout_ms: 60 *1000, // optional HTTP request timeout to apply to all requests.
})
var stream = T.stream('user', { stringify_friend_ids: true })
stream.on('tweet', tweetEvent);

chokidar.watch(config.filename, {ignored: /(^|[\/\\])\../}).on('change', (stats, path) => {
    fs.readFile(config.filename, 'utf8', function(err, contents) {
        updated_urls = contents.toString().split("\n");
        updated_urls.forEach(function(element) {
            var tweet = {
                status: '#freebies #freebies_daily ' + element,
            }
            if(!empty(element)){
                T.post('statuses/update', tweet, tweeted);
            }
        }, this);
    })
});
function tweeted(err, data, response) {
    if (err) {
        console.log(err)
        console.log("Something went wrong!");
    } else {
        console.log("It worked!");
    }
}

function empty(data)
{
  if(typeof(data) == 'number' || typeof(data) == 'boolean')
  { 
    return false; 
  }
  if(typeof(data) == 'undefined' || data === null)
  {
    return true; 
  }
  if(typeof(data.length) != 'undefined')
  {
    return data.length == 0;
  }
  var count = 0;
  for(var i in data)
  {
    if(data.hasOwnProperty(i))
    {
      count ++;
    }
  }
  return count == 0;
}
function tweetEvent(tweet) {
    var reply_to = tweet.in_reply_to_screen_name;
    var text       = tweet.text;
    var from       = tweet.user.screen_name;
    var scr_name   = tweet.user.name;
    var nameID     = tweet.id_str;
    // params just to see what is going on with the tweets
    var params     = {reply_to, text, from, nameID};
    // console.log(params);

    if (reply_to === 'SenileParrot') {
        var text = []
        var options = {
            screen_name: from,
            count: 200
        };
        T.get('statuses/user_timeline', options, function(err, data) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].text.substring(0, 2) !== 'RT') {
                    text += '. ' + data[i].text
                }
            }
        })
        .then(function (){
            clean_text = text
            .replace(/(#\S+)/gi, '')
            .replace(/(@\S+)/gi, '')
            .replace(/(http\S+)/gi, '')
            .replace(/\s\s+/g, ' ');
            quotes = new MarkovChain(clean_text)
		var useUpperCase = function(wordList) {
			  var tmpList = Object.keys(wordList).filter(function(word) {
				      return word[0] >= 'A' && word[0] <= 'Z'
				    })
			    return tmpList[~~(Math.random()*tmpList.length)]
		}
            quote = quotes.start(useUpperCase).end(10).process()
            console.log(quote)
            var new_tweet = '@' + from + ' ' + scr_name + ": " + quote + '.';

            var tweet = {
                status: new_tweet,
                in_reply_to_status_id: nameID
            }

            T.post('statuses/update', tweet, tweeted);
        })

    }
}

