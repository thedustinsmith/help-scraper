// var scraper = require('website-scraper');

// scraper.scrape({
// 	urls: ['http://help.foliotek.com/presentation'],
// 	directory: './saved/'
// }, function (err, result) {
// 	console.log(result);
// });

var Crawler 		= require('crawler'),
	url 			= require('url'),
	fs				= require('fs'),
	path 			= require('path'),
	mkdirp  		= require('mkdirp'),
	beautify_html 	= require('js-beautify').html,
	saved			= [];


function savePage (title, $, filePath) {

/* Content Fixes */
	$("#crumbs").remove();
	$("#contentHeader").remove();
	var content = ($("#content").html() || "");
	content = content.replace(/"\/media/g, "\"//help.foliotek.com/media");
/* End Content Fixes */

/* Title Fixes */
	title = title.replace("Foliotek Presentation Help", "")
				 .replace('Foliotek Presentation -  ', 'Foliotek Presentation')
				 .replace(/\r?\n|\r/g, "")
				 .replace(/\s+/g, " ")
		 		 .replace(/\t/g, "")
		 		 .trim()
		 		 .replace(/-$/, "");

/* End Title Fixes */
	var prefix = "---\n"+
				 "title: " + title + "\n" +
				 "lunr: true\n" + 
				 "---\n" +
				 "{% extends 'site.swig' %}\n" + 
				 "{% block contents %}\n",
		suffix = "\n{% endblock contents %}"

	content = beautify_html(content);
	content = prefix + content + suffix;
	var html = new Buffer(content);
	mkdirp(path.dirname(filePath), function (errMkdirp) {
		if(errMkdirp) throw errMkdirp;
		fs.writeFile(filePath, html, function (errFS, written) {
			if (errFS) throw errFS;
		});
	})
}

var c = new Crawler({
	maxConnections: 10,
	callback: function (err, result, $) {
		if (err) throw err;
		if (result.uri.indexOf('help.foliotek.com') <= -1) {
			return;
		}

		$('a').each(function(ix, a) {
			var href = $(a).attr('href');
			if (!href || href.indexOf('/media') === 0) {
				return;
			}
			if (href.indexOf('/') === 0) {
				href = 'http://help.foliotek.com' + href;
			}
			c.queue(href);
		});
		var parsed = url.parse(result.uri);
		var savePath = path.join(__dirname, '/saved/', parsed.path + '.html');
		if (!parsed.path) {
			return;
		}
		if (saved.indexOf(savePath) === -1) {
			saved.push(savePath);
			savePage($("title").html(), $, savePath);
		}

	},
	onDrain: function(){
		process.exit();
	}
});

c.queue('http://help.foliotek.com/presentation');
