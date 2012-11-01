
function chatController() {	
//Controller for chat markdowns
	var that = this;


	this.checkMarkdown = function(message,callback)  {
		/*m = message;
		var repeat = new Array();
		toogle = false;
		for (i=1; i<message.split('/url').length; i++){
			//if (message.split('/url')[i].split(':')[0] == "url") {
				//toreplace = message.split('/url:')[i+1].split(' ')[0];
				//toreplace = message.split('url:')[i].split(' ')[0];
				console.log(message.split('/url')[i].split(':')[1].split(' ')[0]);
				url=message.split('/url')[i].split(':')[1].split(' ')[0];
				//index = message.indexOf('/url:');
				if (message.match(new RegExp(url, 'g')).length == 1) {
					m = m.replace(url, '<a href="http://'+url+'" target="_blank">'+url+'</a>');
				} else { 
					for (count = 0;count<=repeat.length;count++) {
						if (repeat[count]==url) {
							toogle = true;
						} 
						count ++;
					}
					if (toogle==false) {
						repeat[count]=url;
						m = m.replace(new RegExp(url, 'g'), '<a href="http://'+url+'" target="_blank">'+url+'</a>');
					}			
				}
			//}
		}
		m = m.replace(new RegExp('/url:', 'g'), '');*/

		//tokenize by spaces
		var m="";
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
			} else if (word.match('www.')) {
				mod = '<a href="http://www.'+word.split('www.')[1]+'" target="_blank">www.'+word.split('www.')[1]+'</a>';
				m = m.concat(mod+' ');
			} else {
				m = m.concat(word+' ');
			}
		}
		emotify(m,function(m){
			callback(m);
		});
	}

	emotify = function(m,callback) {
		m = m.replace(/\:\)/g,'<img src="/img/smile.png" alt="Smiley face">');
		m = m.replace(/\:\-\)/g,'<img src="/img/smile.png" alt="Smiley face">');
		m = m.replace(/\:\(/g,'<img src="/img/frown.png" alt="Smiley face">');
		m = m.replace(/\:\-\(/g,'<img src="/img/frown.png" alt="Smiley face">');
		m = m.replace(/\:\'\(/g,'<img src="/img/cry.png" alt="Smiley face">');
		m = m.replace(/\:\'\-\(/g,'<img src="/img/cry.png" alt="Smiley face">');
		m = m.replace(/\O\.\o/g,'<img src="/img/confused.png" alt="Smiley face">');
		m = m.replace(/\o\.\O/g,'<img src="/img/confused.png" alt="Smiley face">');
		m = m.replace(/\:\o/g,'<img src="/img/gasp.png" alt="Smiley face">');
		m = m.replace(/\:\-\o/g,'<img src="/img/gasp.png" alt="Smiley face">');
		m = m.replace(/\:\O/g,'<img src="/img/gasp.png" alt="Smiley face">');
		m = m.replace(/\:\-\O/g,'<img src="/img/gasp.png" alt="Smiley face">');
		//m = m.replace(/\:\D/g,'<img src="/img/grin.png" alt="Smiley face">');
		m = m.replace(/\:\-\D/g,'<img src="/img/grin.png" alt="Smiley face">');
		//m = m.replace(/\=\D/g,'<img src="/img/grin.png" alt="Smiley face">');
		m = m.replace(/\:\-\p/g,'<img src="/img/tongue.png" alt="Smiley face">');
		m = m.replace(/\:\p/g,'<img src="/img/tongue.png" alt="Smiley face">');
		m = m.replace(/\:\-\P/g,'<img src="/img/tongue.png" alt="Smiley face">');
		m = m.replace(/\:\P/g,'<img src="/img/tongue.png" alt="Smiley face">');
		m = m.replace(/\;\-\)/g,'<img src="/img/wink.png" alt="Smiley face">');
		m = m.replace(/\;\)/g,'<img src="/img/wink.png" alt="Smiley face">');
		m = m.replace(/\:\-\//g,'<img src="/img/unsure.png" alt="Smiley face">');
		m = m.replace(/\:\//g,'<img src="/img/unsure.png" alt="Smiley face">');
		m = m.replace(/\:\-\\/g,'<img src="/img/unsure.png" alt="Smiley face">');
		m = m.replace(/\:\\/g,'<img src="/img/unsure.png" alt="Smiley face">');
		callback(m);
	}

};