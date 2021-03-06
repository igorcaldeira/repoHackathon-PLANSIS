var express = require('express');
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
var router = express.Router();

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var fs = require('fs');
var readline = require('readline');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

var clientSecret = "5BvoG0w7fYCmcVYRkyzR53tR";
var clientId = "507417627023-92sbtokreo4aio877lg03bmo8lvuhc09.apps.googleusercontent.com";
var redirectUrl = "http://localhost:3000/";
var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

var number = 0;

// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
  'https://www.googleapis.com/auth/gmail.readonly'
];

var url = oauth2Client.generateAuthUrl({
  access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
  scope: scopes // If you only need one scope you can pass it as string
});

router.get('/', function(req, res, next) {
    res.sendfile('./views/principal.html');
});

router.get('/listarLabels', function(req, res, next) {

	number = req.query.n;

	callback = listLabels;

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  var gmail = google.gmail('v1');
  gmail.users.labels.list({
    auth: auth,
    userId: 'me',
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var labels = response.labels;
    if (labels.length == 0) {
      console.log('No labels found.');
    } else {
      console.log('Labels:');
      for (var i = 0; i < labels.length; i++) {
        var label = labels[i];
        console.log('- %s', label.name);
      }
    }

	listMessages(auth);

  });
}

/**
 * Retrieve Messages in user's mailbox matching query.
 *
 * @param  {String} userId User's email address. The special value 'me'
 * can be used to indicate the authenticated user.
 * @param  {String} query String used to filter the Messages listed.
 * @param  {Function} callback Function to call when the request is complete.
 */
function listMessages(auth) {
  var gmail = google.gmail('v1');
  gmail.users.messages.list({
    auth: auth,
    userId: 'me',
    q: ''
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    //console.log(response);

			  gmail.users.messages.get({
    			 auth: auth,
			    'userId': 'me',
			    'id': response.messages[number].id
			  }, function(err, mail) {
			    if (err) {
			      console.log('The API returned an error: ' + err);
			      return;
			    }

			    var bufff = "";

			    try{
			    	bufff = new Buffer(mail.payload.body.data,'base64');
			    }
			    catch(err)
			    {
			    	if(mail.payload.body.data != undefined && mail.payload.body.data != "")
			    		bufff = mail.payload.body;
			    	else
			    		bufff = "Email inválido";
			    }

    			tone(bufff.toString());

			  });
  });
}


function tone(value)
{
	 var tone_analyzer = new ToneAnalyzerV3({
	  username: '68663eee-d49b-4b31-b8df-aecffc84dfc8',
	  password: 'PgYQ4fle84kO',
	  version_date: '2016-05-19'
	});

	tone_analyzer.tone({ text: value},
	  function(err, tone) {
	    if (err)
	      res.send(err);
	    else
	    {
	      res.send([value,tone]);
	    }
	});
}
});

module.exports = router;
