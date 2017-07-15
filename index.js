var Twit = require('twit')
var MarkovChain = require('markovchain')
var chokidar = require('chokidar');
var fs = require('fs');
var jsdiff = require('diff');
var filename = '/home/simplex/python/deals_seeker/log.dat' ;

var used_urls = []
function set_old_urls(){
    fs.readFile(filename, 'utf8', function(err, contents) {
        used_urls = contents.toString().split("\n");
        console.log('go')
})};

var T = new Twit({
    consumer_key: 'FSvDijqqUDjgZn6d4zKhXuOws',
    consumer_secret: 'XiGsRIbCeaqXmGMH8cbUHWxjggiFWL2PPwuTeDtoPxOEVJq66a',
    access_token: '855864432756502530-qm7ZK91mY6YNqLkDacBx6xy4gLYqKnE',
    access_token_secret: 'UEnHnd9woCNMkPseP9cPpXUgq9x6FBbxH0AbNvN2qoAtX',
    timeout_ms: 60 *1000, // optional HTTP request timeout to apply to all requests.
})
set_old_urls()
var stream = T.stream('user', { stringify_friend_ids: true })
stream.on('tweet', tweetEvent);

// One-liner for current directory, ignores .dotfiles
chokidar.watch(filename, {ignored: /(^|[\/\\])\../}).on('change', (stats, path) => {
    fs.readFile(filename, 'utf8', function(err, contents) {
        updated_urls = contents.toString().split("\n");;
        results = jsdiff.diffArrays(updated_urls, used_urls);
        console.log(results.length);
        console.log(results[1].value || []);
        // console.log(results[0]);
        set_old_urls()
    })
});

function tweetEvent(tweet) {
    var reply_to = tweet.in_reply_to_screen_name;
    var text       = tweet.text;
    var from       = tweet.user.screen_name;
    var scr_name   = tweet.user.name;
    var nameID     = tweet.id_str;
    // params just to see what is going on with the tweets
    var params     = {reply_to, text, from, nameID};
    console.log(params);

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

            function tweeted(err, data, response) {
                if (err) {
                    console.log(err)
                    console.log("Something went wrong!");
                } else {
                    console.log("It worked!");
                }
            }
        })

    }
}

