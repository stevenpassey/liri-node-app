require('dotenv').config()
var keys = require("./keys.js");
var Spotify = require('node-spotify-api');
var Twitter = require('twitter');
try
{
	var spotify = new Spotify(keys.spotify);
}
catch(err)
{
	console.log("Could not read env file. You must provide a .env file with spotify and twitter keys.\nRefer to keys.js for names of keys");
	process.exit();
}
var client = new Twitter(keys.twitter);
try
{
	const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
}
catch(err)
{
	console.log(err.message + " Try running: 'npm install'");
	process.exit();
}
var fs = require("fs");

var message;
var current_prompt = "mode_select";
var last_time_stamp = 0;

process.argv[2] = process.argv[2] ? process.argv[2].toLowerCase() : "none";

function readArgs()
{
	switch (process.argv[2])
	{
		case "1":
		case "my-tweets":
		case "twitter":
			console.log(`Welcome to LIRI! (Author: Steven Passey)
Switching to mode 1 (Aliases: "my-tweets", "twitter")`);
			pull_tweets();
		break;
	
		case "2":
		case "spotify-this-song":
		case "spotify":
			console.log(`Welcome to LIRI! (Author: Steven Passey)
Switching to mode 2 (Aliases: "spotify-this-song", "spotify")`);
			process.argv[3] = !process.argv[3] ? process.argv[3] : process.argv[3].replace(/\s/g, "+");
			song_search(process.argv[3]);
	
		break;

		case "3":
		case "movie-this":
		case "omdb":
			console.log(`Welcome to LIRI! (Author: Steven Passey)
Switching to mode 3 (Aliases: "movie-this", "omdb")`);
			process.argv[3] = !process.argv[3] ? process.argv[3] : process.argv[3].replace(/\s/g, "+");
			movie_search(process.argv[3]);
		break;

		case "4":
		case "do-what-it-says":
			readArgsFromFile()
		break;

		default:
			showPrompt("mode_select");
		break;
	}
}

readArgs();

function showPrompt(prompt)
{
	current_prompt = prompt;

	switch(prompt)
	{
		case "mode_select":
			process.stdout.write(`Welcome to LIRI! (Author: Steven Passey)
Main Menu:
1. my-tweets (Alias: twitter) 
2. spotify-this-song (Alias: spotify)
3. movie-this (Alias: omdb)
4. do-what-it-says\n
Press Ctrl+C to quit the application\n
Select Mode (1-4): `);
		break;

		case "another_movie?":
			process.stdout.write("\nWould you like to search for another movie? (y/n): ");
		break;

		case "another_song?":
			process.stdout.write("\nWould you like to search for another song? (y/n): ");
		break;

		case "get_movie":
			process.stdout.write("Enter a movie title: ");
		break;

		case "get_song":
			process.stdout.write("Enter a song title: ");
		break;
	}
}

function getTimeStamp()
{
	const now = new Date();
	let hours = now.getHours();
	if (hours > 12) 
	{
		hours -= 12;
		var ampm = "PM";
	} 
	else if (hours === 0) 
	{
		hours = 12;
		var ampm = "AM";
	}
	else
	{
		var ampm = "AM";
	}
	    
	let minutes = now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes();
	let seconds = now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds();
	let miliseconds = now.getMilliseconds();
	miliseconds = miliseconds.toString().length === 1 ? "00" + miliseconds : miliseconds;
	miliseconds = miliseconds.toString().length === 2 ? "0" + miliseconds : miliseconds;
	
	last_time_stamp = parseFloat(`${seconds}.${miliseconds}`);

	return `${hours}:${minutes}:${seconds} ${ampm}`;
}

function get(url)
{
	return new Promise(function(res, rej) {
		let xhttp = new XMLHttpRequest();
		xhttp.open("GET", url, true);

		xhttp.onload = function() {
			if(xhttp.status == 200)
			{
				res(xhttp.responseText);
			}
			else
			{
				rej(Error(xhttp.statusText));
			}
		};

		xhttp.onerror = function () {
			rej(Error("Could not create XMLHttpRequest()"));
		};
		
		xhttp.send();
	});
}

function pull_tweets()
{
	console.log(`[${getTimeStamp()}] Performing call to the Twitter database.`);
	console.log(`[${getTimeStamp()}] Request Started. Waiting for response... `);

	client.get('statuses/user_timeline', { screen_name: 'steven_passey', count: 20 }, function(error, tweets, response) {

		if(error)
		{
			console.log("[WARN] " + error[0]['message'] + " Check .env file for correct twitter keys");
			console.log("Restarting Application\n");
			showPrompt("mode_select");
			return;
		}

		var tweet_array = tweets.reverse();
		var tweet_string = "";
		tweet_array.forEach(function (obj) { tweet_string += obj.text + "\n(" + obj.created_at + ")\n"; });

		let dashes = "";
		for(let dash = 1; dash < process.stdout.columns; dash++)
		{
			dashes += "─";
		}

		let ts_delta = last_time_stamp;

		message = `[${getTimeStamp()}] Response Received. (Total time: ${(last_time_stamp - ts_delta).toFixed(3) < 0 ? (last_time_stamp - ts_delta).toFixed(3) + 60 : (last_time_stamp - ts_delta).toFixed(3)}s)\n
The result below is from my recently created Twitter. (https://twitter.com/steven_passey)\n
${dashes}
${tweet_string}
${dashes}`;

		console.log(message);
		showPrompt("mode_select");

	});
}

function song_search(title_search)
{
	if(!title_search)
	{
		title_search = "The+Sign";
		console.log(`[WARN] No song title was provided. The required default song title provided will be used.`);
		console.log(`[${getTimeStamp()}] Performing call to the Spotify database. Title Search Term: ${title_search}`);
		console.log(`[${getTimeStamp()}] Request Started. Waiting for response... `);
		
		spotify.request('https://api.spotify.com/v1/tracks/3DYVWvPh3kGwPasp7yjahc').then(function(data) { var myWrappedObject = {}; var tracks = {}; var items = []; items.push(data); tracks.items = items; myWrappedObject.tracks = tracks; showSongWithPrompt(null, myWrappedObject) })
  		.catch(function(err) {
    			console.error('Error occurred: ' + err);
  		});
		return;
	}
	console.log(`[${getTimeStamp()}] Performing call to the Spotify database. Title Search Term: ${title_search}`);
	console.log(`[${getTimeStamp()}] Request Started. Waiting for response... `);
	spotify.search({ type: 'track', query: title_search, limit: 1}, function (err, data) { showSongWithPrompt(err, data) } );
}

function showSongWithPrompt(err, data)
{
		if(err) 
		{
    			console.log('Error occurred: ' + err);
			showPrompt("another_song?");
			return;
  		}

		let ts_delta = last_time_stamp;

		const song = data;

		if(!song.tracks.items[0])
		{
			let dashes = "";
			for(let dash = 1; dash < process.stdout.columns; dash++)
			{
				dashes += "─";
			}

			message = `[${getTimeStamp()}] Response Received. (Total time: ${(last_time_stamp - ts_delta).toFixed(3) < 0 ? (last_time_stamp - ts_delta).toFixed(3) + 60 : (last_time_stamp - ts_delta).toFixed(3)}s)\n
The result below is from the Spotify api. (https://api.spotify.com/)\n
${dashes}
No Tracks Found.
${dashes}`;

			console.log(message);
			showPrompt("another_song?");
			return;
		}

		let artist = [];
		song.tracks.items[0].artists.forEach(function (obj) { artist.push(obj.name); });
		artist = JSON.stringify(artist).replace("[", "").replace(/\"/g, "").replace("]", "").replace(/,/g, ", ");
		
		const title = song.tracks.items[0].name;
		let preview  = song.tracks.items[0].preview_url ? song.tracks.items[0].preview_url : "No link found.";

		const album    = song.tracks.items[0].album.name;
 		
		let dashes = "";
		for(let dash = 1; dash < process.stdout.columns; dash++)
		{
			dashes += "─";
		}

		message = `[${getTimeStamp()}] Response Received. (Total time: ${(last_time_stamp - ts_delta).toFixed(3) < 0 ? (last_time_stamp - ts_delta).toFixed(3) + 60 : (last_time_stamp - ts_delta).toFixed(3)}s)\n
The result below is from the Spotify api. (https://api.spotify.com/)\n
${dashes}
                    Artist │ ${artist}
                     Title │ ${title}
                     Album │ ${album}
               Preview URL │ ${preview}
${dashes}`;

		console.log(message);
		showPrompt("another_song?");
}

function movie_search(title_search)
{
	if(!title_search)
	{
		title_search = "Mr.+Nobody";
		console.log(`[WARN] No movie title was provided. The required default movie title provided will be used.`);
	}
	console.log(`[${getTimeStamp()}] Performing AJAX call to movie database. Title Search Term: ${title_search}`);
	console.log(`[${getTimeStamp()}] AJAX Started. Waiting for response... `);
	get(`https://www.omdbapi.com/?t=${title_search}&apikey=trilogy`).then(showMovieWithPrompt, errorWithPrompt);
}

function showMovieWithPrompt(res)
{	
	//Timestamp delta = Time it took to receive AJAX response
	let ts_delta = last_time_stamp;

	const movie = JSON.parse(res);
	if(movie.Response === "False")
	{
		let dashes = "";
		for(let dash = 1; dash < process.stdout.columns; dash++)
		{
			dashes += "─";
		}

		message = `[${getTimeStamp()}] Response Received. (Total time: ${(last_time_stamp - ts_delta).toFixed(3) < 0 ? (last_time_stamp - ts_delta).toFixed(3) + 60 : (last_time_stamp - ts_delta).toFixed(3)}s)\n
The result below is from the OMDB api. (http://www.omdbapi.com/)\n
${dashes}
${movie.Error}
${dashes}`;

		console.log(message);
		showPrompt("another_movie?");
		return;
	}

	const title   = movie.Title;
	const year    = movie.Year;
	const rating  = movie.imdbRating;
	const country = movie.Country;
	const actors  = movie.Actors;

	let rt_rating = "N/A";

	const rating_array = movie.Ratings; //Ratings Array
	
	rating_array.forEach(function(source_obj) {
  		if(source_obj.Source === "Rotten Tomatoes")
		{
			rt_rating = source_obj.Value;
		}
	});
	
	let plot = movie.Plot;
	let plotTextExtendedArray = [];
	const plotTextBoundary = process.stdout.columns - 30;	

	if(plot.length > plotTextBoundary)
	{
		let text_wrap_complete = false;
		let text_wrap_lines = 0;
		let split_point = plot.slice(plotTextBoundary);
		plot = plot.slice(0, plotTextBoundary);
		
		while(!text_wrap_complete)
		{
			plotTextExtendedArray.push("\n                           │ " + split_point);
			if(plotTextExtendedArray[text_wrap_lines].length < plotTextBoundary)
			{
				text_wrap_complete = true;
			}
			else
			{
				split_point = plotTextExtendedArray[text_wrap_lines].slice(plotTextBoundary + 30);
				plotTextExtendedArray[text_wrap_lines] = plotTextExtendedArray[text_wrap_lines].slice(0, plotTextBoundary + 30);
				text_wrap_lines++;
			}
		}
	}

	plotTextExtendedArray.forEach(function (line) {
		if(line.charAt(30) == " ")
		{
			line = line.slice(0, 29) + line.slice(30, line.length);
		}
		plot += line;
	});

	let dashes = "";
	for(let dash = 1; dash < process.stdout.columns; dash++)
	{
		dashes += "─";
	}

	message = `[${getTimeStamp()}] Response Received. (Total time: ${(last_time_stamp - ts_delta).toFixed(3) < 0 ? (last_time_stamp - ts_delta).toFixed(3) + 60 : (last_time_stamp - ts_delta).toFixed(3)}s)\n
The result below is from the OMDB api. (http://www.omdbapi.com/)\n
${dashes}
                     Title │ ${title}
                      Year │ ${year}
            Rating on IMDB │ ${rating}
 Rating on Rotten Tomatoes │ ${rt_rating}
                   Country │ ${country}
                Actor List │ ${actors}
                      Plot │ ${plot}
${dashes}`;

	console.log(message);
	showPrompt("another_movie?");
}

function errorWithPrompt(err)
{
	console.log(err);
	showPrompt("another_movie?");
	return;
}

function readArgsFromFile()
{
	console.log(`[${getTimeStamp()}] Opening file stream.`);
	console.log(`[${getTimeStamp()}] Read Started. Waiting for data... `);
	fs.readFile('./random.txt', "utf-8", function read(err, data) {
						    if (err) 
						    {
							console.log("[" + err.message.replace(":","]") + "\n[WARN] Could not read file. To retry file read, choose option 4.");
							showPrompt("mode_select");
							return;
						    }
							let ts_delta = last_time_stamp;

							message = `[${getTimeStamp()}] Read Completed. (Total time: ${(last_time_stamp - ts_delta).toFixed(3) < 0 ? (last_time_stamp - ts_delta).toFixed(3) + 60 : (last_time_stamp - ts_delta).toFixed(3)}s)
Restarting with arguments from random.txt\n`;
						    console.log(message);
						    process.argv[2] = data.split(",")[0];
						    process.argv[3] = data.split(",")[1];
						    readArgs();
						});
}

var stdin = process.openStdin();

stdin.addListener("data", function(letter) {
	
	user_input = letter.toString().trim();

	switch (current_prompt)
	{
		case "mode_select":
			switch(user_input)
			{
				case "1":
				case "my-tweets":
				case "twitter":
					pull_tweets()
				break;
	
				case "2":
				case "spotify-this-song":
				case "spotify":
					console.log(`Switching to mode 2 (Aliases: "spotify-this-song", "spotify")`);
					showPrompt("get_song");
				break;

				case "3":
				case "movie-this":
				case "omdb":
					console.log(`Switching to mode 3 (Aliases: "movie-this", "omdb")`);
					showPrompt("get_movie");
				break;

				case "4":
				case "do-what-it-says":
					readArgsFromFile();
				break;

				default:
					process.stdout.write(letter.toString().trim() + " is not a valid option");
					process.stdout.write("\nSelect Mode (1-4): ");
				break;
			}
					
		break;

		case "another_movie?":
    			if(user_input.toLowerCase().slice(0, 1) === "y")
			{
				showPrompt("get_movie");
			}
			else if (user_input.toLowerCase().slice(0, 1) === "n")
			{
				showPrompt("mode_select");
			}
			else
			{
				process.stdout.write(letter.toString().trim() + " is not a valid option");
				process.stdout.write("\nWould you like to search for another movie? (y/n): ");
			}
		break;

		case "another_song?":
    			if(user_input.toLowerCase().slice(0, 1) === "y")
			{
				showPrompt("get_song");
			}
			else if (user_input.toLowerCase().slice(0, 1) === "n")
			{
				showPrompt("mode_select");
			}
			else
			{
				process.stdout.write(letter.toString().trim() + " is not a valid option");
				process.stdout.write("\nWould you like to search for another song? (y/n): ");
			}
		break;

		case "get_movie":
			movie_search(user_input.replace(/\s/g, "+"));
		break;

		case "get_song":
			song_search(user_input.replace(/\s/g, "+"));
		break;
	}
  });	
