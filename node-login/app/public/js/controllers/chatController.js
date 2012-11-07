
function chatController() {	
//Controller for chat markdowns
	var that = this;


	this.checkMarkdown = function(message,callback)  {
		//tokenize by spaces
		web=false;
		var m="";
		if (message.split(' ').length == 1) {
			message = ' '+message;
		}
		//_DoItalicsAndBold(message);
		for (i=0; i<message.split(' ').length; i++){
			word = message.split(' ')[i];		
			if (word.match('/url:')) {
				mod = '<a href="http://'+word.split('/url:')[1]+'" target="_blank">'+word.split('/url:')[1]+'</a>';
				m = m.concat(mod+' ');
			} else if (word.match('@')) {
				if (word.split('@')[0] == null || word.split('@')[0] == '') {
					mod = '<strong>'+word+'</strong>';
					m = m.concat(mod+' ');
				} else {
					mod = '<a href="mailto:'+word+'">'+word+'</a>'
					m = m.concat(mod+' ');
				}
			} else if (word.match('www.') && web == false) {
				mod = '<a href="http://www.'+word.split('www.')[1]+'" target="_blank">www.'+word.split('www.')[1]+'</a>';
				m = m.concat(mod+' ');
				web == true;
			} else if (word.match('http:') && web == false) {
				mod = '<a href="http:'+word.split('http:')[1]+'" target="_blank">'+word.split('http://')[1]+'</a>';
				m = m.concat(mod+' ');
				web == true;
			} else {
				m = m.concat(word+' ');
			}
		}
		emotify(m,function(m){
			callback(m);
		});
	}

	var _DoItalicsAndBold = function(text) {
		console.log("italics");
		// <strong> must go first:
		text = text.replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g,
			"<strong>$2</strong>");

		text = text.replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g,
			"<em>$2</em>");

		return text;
	}


	emotify = function(m,callback) {
		m = m.replace(/\ \:\)/g,' <img src="/img/smile.png" alt="Smiley face">');
		m = m.replace(/\ \:\-\)/g,' <img src="/img/smile.png" alt="Smiley face">');
		m = m.replace(/\ \:\(/g,' <img src="/img/frown.png" alt="Smiley face">');
		m = m.replace(/\ \:\-\(/g,' <img src="/img/frown.png" alt="Smiley face">');
		m = m.replace(/\ \:\'\(/g,' <img src="/img/cry.png" alt="Smiley face">');
		m = m.replace(/\ \:\'\-\(/g,' <img src="/img/cry.png" alt="Smiley face">');
		m = m.replace(/\ \O\.\o/g,' <img src="/img/confused.png" alt="Smiley face">');
		m = m.replace(/\ \o\.\O/g,' <img src="/img/confused.png" alt="Smiley face">');
		m = m.replace(/\ \:\o/g,' <img src="/img/gasp.png" alt="Smiley face">');
		m = m.replace(/\ \:\-\o/g,' <img src="/img/gasp.png" alt="Smiley face">');
		m = m.replace(/\ \:\O/g,' <img src="/img/gasp.png" alt="Smiley face">');
		m = m.replace(/\ \:\-\O/g,' <img src="/img/gasp.png" alt="Smiley face">');
		//m = m.replace(/\ \:\D/g,' <img src="/img/grin.png" alt="Smiley face">');
		m = m.replace(/\ \:\-\D/g,' <img src="/img/grin.png" alt="Smiley face">');
		//m = m.replace(/\ \=\D/g,' <img src="/img/grin.png" alt="Smiley face">');
		m = m.replace(/\ \:\-\p/g,' <img src="/img/tongue.png" alt="Smiley face">');
		m = m.replace(/\ \:\p/g,' <img src="/img/tongue.png" alt="Smiley face">');
		m = m.replace(/\ \:\-\P/g,' <img src="/img/tongue.png" alt="Smiley face">');
		m = m.replace(/\ \:\P/g,' <img src="/img/tongue.png" alt="Smiley face">');
		m = m.replace(/\ \;\-\)/g,' <img src="/img/wink.png" alt="Smiley face">');
		m = m.replace(/\ \;\)/g,' <img src="/img/wink.png" alt="Smiley face">');
		m = m.replace(/\ \:\-\//g,' <img src="/img/unsure.png" alt="Smiley face">');
		m = m.replace(/\ \:\//g,' <img src="/img/unsure.png" alt="Smiley face">');
		m = m.replace(/\ \:\-\\/g,' <img src="/img/unsure.png" alt="Smiley face">');
		m = m.replace(/\ \:\\/g,' <img src="/img/unsure.png" alt="Smiley face">');
		callback(m);
	}
};