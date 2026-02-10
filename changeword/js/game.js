////////////////////////////////////////////////////////////
// GAME v1.1
////////////////////////////////////////////////////////////

/*!
 * 
 * GAME SETTING CUSTOMIZATION START
 * 
 */

//words array
var words_arr = [
	{
		file:'3letters.json',
		name:'3 LETTERS',
		letters:3,
		score:100,
		timer:30000,
		hint:5,
		hintfull:5,
		reset:5,
		stage:{
			next:8,
			timer:3000
		}
	},
	{
		file:'4letters.json',
		name:'4 LETTERS',
		letters:4,
		score:200,
		timer:40000,
		hint:5,
		hintfull:5,
		reset:5,
		stage:{
			next:4,
			timer:2000
		}
	},
	{
		file:'5letters.json',
		name:'5 LETTERS',
		letters:5,
		score:300,
		timer:50000,
		hint:8,
		hintfull:5,
		reset:5,
		stage:{
			next:3,
			timer:1000
		}
	},
	{
		file:'6letters.json',
		name:'6 LETTERS',
		letters:6,
		score:400,
		timer:60000,
		hint:8,
		hintfull:5,
		reset:5,
		stage:{
			next:3,
			timer:1000
		}
	},
];

//game settings
var gameSettings = {
	title:{
		name:["CHANGE","WORD"],
		size:100,
		radius:10,
		shadowY:10,
		color:"#24BE24",
		hintColor:"#E67E22",
		fontSize:60,
		textColor:"#fff",
		fontY:20,
		space:20,
	},
	word:{
		size:80,
		radius:10,
		shadowY:10,
		color:"#24BE24",
		hintColor:"#E67E22",
		stroke:8,
		strokeColor:"#fff",
		textColor:"#fff",
		fontSize:50,
		fontY:20,
		space:20,
		bounceSpeed:.3
	},
	letters:{
		size:60,
		radius:10,
		shadowY:10,
		color:"#E67E22",
		hintColor:"#24BE24",
		disabledColor:"#666666",
		textColor:"#fff",
		fontSize:40,
		fontY:14,
		space:15,
		notificationSize:15,
		notificationFontSize:18,
		notificationFontY:6,
		notificationColor:"#E67E22",
		revertSpeed:.3,
		landscape:[
			["a","b","c","d","e","f","g","h","i"],
			["j","k","l","m","n","o","p","q","r"],
			["s","t","u","v","w","x","y","z"]
		],
		portrait:[
			["a","b","c","d","e","f"],
			["g","h","i","j","k"],
			["l","m","n","o","p","q"],
			["r","s","t","u","v"],
			["w","x","y","z"]
		]
	},
	timer:{
		color:"#fff",
		width:400,
		height:5,
		radius:3
	},
	score:{
		speed:1
	}
}

//game text display
var textDisplay = {
					loading:'LOADING WORDS...',
					instruction:"DRAG LETTER IN TO CHANGE WORD",
					pointDisplay:'SCORE : [NUMBER]PTS',
					wordDisplay:'WORDS : [NUMBER]',
					noWord:'NO WORD IN DICTIONARY.',
					noPossibleWord:'NO MORE POSSIBLE WORD.',
					noPlayWord:'NO MORE WORD TO PLAY.',
					wordExist:'YOU HAVE SOLVE THIS WORD.',
					completeWord:["GOOD JOB!","EXCELLENT!","WELL DONE!"],
					pointplus:'+[NUMBER]PTS',
					timesup:"TIME\'S UP!",
					nextstage:"NEXT STAGE!",
					exitTitle:'EXIT GAME',
					exitMessage:'ARE YOU SURE\nYOU WANT TO\nQUIT THE GAME?',
					share:'SHARE YOUR SCORE',
					resultTitle:'GAME OVER',
					resultTimer:'TIME : [NUMBER]',
					resultWord:'WORD : [NUMBER]',
					resultDesc:'SCORE : [NUMBER]PTS'
				}

//Social share, [SCORE] will replace with game score
var shareEnable = true; //toggle share
var shareTitle = 'Highscore on Change Word is [SCORE]PTS';//social share score title
var shareMessage = '[SCORE]PTS is mine new highscore on Change Word Game game! Try it now!'; //social share score message

/*!
 *
 * GAME SETTING CUSTOMIZATION END
 *
 */
$.editor = {enable:false};
var playerData = {score:0};
var gameData = {paused:true, tutorial:1, mode:"quick", wordNum:0, wordIndex:0, words:[], word:'', wordArr:[], solve:[], stage:{timer:0, count:0}, drag:false, shake:false, hintArr:[], nextStage:false, complete:false};
var tweenData = {score:0, tweenScore:0};
var timeData = {enable:false, startDate:null, sessionDate:null, nowDate:null, sessionTimer:0, timer:0, oldTimer:0, accumulate:0};

/*!
 * 
 * GAME BUTTONS - This is the function that runs to setup button event
 * 
 */
function buildGameButton(){
	buttonStart.cursor = "pointer";
	buttonStart.addEventListener("click", function(evt) {
		playSound('soundButton');
		gameData.mode = "quick";
		goPage('tutorial');
	});

	buttonCategory.cursor = "pointer";
	buttonCategory.addEventListener("click", function(evt) {
		playSound('soundButton');
		gameData.mode = "category";
		buttonStart.visible = false;
		buttonCategory.visible = false;
		selectContainer.visible = true;
	});

	buttonLetter.cursor = "pointer";
	buttonLetter.addEventListener("click", function(evt) {
		playSound('soundButton');
		goPage('tutorial');
	});

	buttonArrowL.cursor = "pointer";
	buttonArrowL.addEventListener("click", function(evt) {
		playSound('soundButton');
		toggleLetters(false);
	});

	buttonArrowR.cursor = "pointer";
	buttonArrowR.addEventListener("click", function(evt) {
		playSound('soundButton');
		toggleLetters(true);
	});

	buttonTutorialL.cursor = "pointer";
	buttonTutorialL.addEventListener("click", function(evt) {
		playSound('soundButton');
		toggleTutorial(false);
	});

	buttonTutorialR.cursor = "pointer";
	buttonTutorialR.addEventListener("click", function(evt) {
		playSound('soundButton');
		toggleTutorial(true);
	});

	buttonOk.cursor = "pointer";
	buttonOk.addEventListener("click", function(evt) {
		playSound('soundButton');
		goPage("game");
	});

	$.letter["hint"].cursor = "pointer";
	$.letter["hint"].addEventListener("click", function(evt) {
		if(evt.currentTarget.active && !gameData.complete){
			playSound('soundButton2');
			showHint();
		}
	});

	$.letter["hintfull"].cursor = "pointer";
	$.letter["hintfull"].addEventListener("click", function(evt) {
		if(evt.currentTarget.active && !gameData.complete){
			playSound('soundButton2');
			showHintFull();
		}
	});

	$.letter["reset"].cursor = "pointer";
	$.letter["reset"].addEventListener("click", function(evt) {
		if(evt.currentTarget.active && !gameData.complete){
			playSound('soundButton2');
			resetWord();
		}
	});
	
	itemExit.addEventListener("click", function(evt) {
	});
	
	buttonContinue.cursor = "pointer";
	buttonContinue.addEventListener("click", function(evt) {
		playSound('soundButton');
		goPage('main');
	});
	
	buttonFacebook.cursor = "pointer";
	buttonFacebook.addEventListener("click", function(evt) {
		share('facebook');
	});
	
	buttonTwitter.cursor = "pointer";
	buttonTwitter.addEventListener("click", function(evt) {
		share('twitter');
	});
	buttonWhatsapp.cursor = "pointer";
	buttonWhatsapp.addEventListener("click", function(evt) {
		share('whatsapp');
	});
	
	buttonSoundOff.cursor = "pointer";
	buttonSoundOff.addEventListener("click", function(evt) {
		toggleGameMute(true);
	});
	
	buttonSoundOn.cursor = "pointer";
	buttonSoundOn.addEventListener("click", function(evt) {
		toggleGameMute(false);
	});
	
	buttonFullscreen.cursor = "pointer";
	buttonFullscreen.addEventListener("click", function(evt) {
		toggleFullScreen();
	});
	
	buttonExit.cursor = "pointer";
	buttonExit.addEventListener("click", function(evt) {
		togglePop(true);
		toggleOption();
	});
	
	buttonSettings.cursor = "pointer";
	buttonSettings.addEventListener("click", function(evt) {
		toggleOption();
	});
	
	buttonConfirm.cursor = "pointer";
	buttonConfirm.addEventListener("click", function(evt) {
		playSound('soundButton');
		togglePop(false);
		
		stopAudio();
		stopGame();
		goPage('main');
	});
	
	buttonCancel.cursor = "pointer";
	buttonCancel.addEventListener("click", function(evt) {
		playSound('soundButton');
		togglePop(false);
	});

	displayWordName();
	buildLetters();
	toggleTutorial(true);
	toggleTutorial(false);
}

function toggleTutorial(con){
	if(con){
		gameData.tutorial++;
		gameData.tutorial = gameData.tutorial > 3 ? 1 : gameData.tutorial;
	}else{
		gameData.tutorial--;
		gameData.tutorial = gameData.tutorial < 1 ? 3 : gameData.tutorial;
	}

	itemTutorial1.visible = false;
	itemTutorial2.visible = false;
	itemTutorial3.visible = false;

	if(gameData.tutorial == 1){
		itemTutorial1.visible = true;
	}else if(gameData.tutorial == 2){
		itemTutorial2.visible = true;
	}else if(gameData.tutorial == 3){
		itemTutorial3.visible = true;
	}
}


/*!
 * 
 * GAME TITLE - This is the function that runs to build game title
 * 
 */
function buildGameTitle(){
	titleContainer.removeAllChildren();

	var totalW = 0;
	var totalH = 0;
	var startX = 0;
	var startY = 0;
	var pos = {x:0, y:0};
	if(gameSettings.title.name.length > 1){
		totalH = (gameSettings.title.size) * (gameSettings.title.name.length-1);
		totalH += gameSettings.title.space * (gameSettings.title.name.length-1);
		pos.y = startY - (totalH/2);
	}

	for(var n=0; n<gameSettings.title.name.length; n++){
		var curWord = gameSettings.title.name[n];

		totalW = 0;
		startX = 0;
		if(gameSettings.title.name[n].length > 1){
			totalW = (gameSettings.title.size) * (gameSettings.title.name[n].length-1);
			totalW += gameSettings.title.space * (gameSettings.title.name[n].length-1);
			pos.x = startX - (totalW/2);
		}
		
		var randomChangeColor = Math.floor(Math.random()*curWord.length);
		for(var w=0; w<curWord.length; w++){
			buildSquareShape("title"+n+"_"+w, curWord.substring(w,w+1), "title");
			
			if(w == randomChangeColor){
				$.letter["title"+n+"_"+w].shape.fillCommand.style = gameSettings.title.hintColor;
				$.letter["title"+n+"_"+w].shapeShadow.fillCommand.style = gameSettings.title.hintColor;
			}
			$.letter["title"+n+"_"+w].x = $.letter["title"+n+"_"+w].oriX = pos.x;
			$.letter["title"+n+"_"+w].y = $.letter["title"+n+"_"+w].oriY = pos.y;
			pos.x += (gameSettings.title.space) + (gameSettings.title.size);
		}		
		pos.y += (gameSettings.title.space*1.5) + (gameSettings.title.size);
	}
}

function toggleAnimateTitle(con){
	var count = 0;
	for(var n=0; n<gameSettings.title.name.length; n++){
		var curWord = gameSettings.title.name[n];
		for(var w=0; w<curWord.length; w++){
			var thisLetter = $.letter["title"+n+"_"+w];
			if(con){
				animateTitleBounce(thisLetter, count*.2);
			}else{
				TweenMax.killTweensOf(thisLetter);
			}
			count++;
		}
	}
}

function animateTitleBounce(obj, delay){
	TweenMax.to(obj, .2, {delay:delay, y:obj.oriY-20, overwrite:true, onComplete:function(){
		TweenMax.to(obj, 1, {y:obj.oriY, overwrite:true, ease: Elastic. easeOut.config(1, 0.3), onComplete:function(){
			animateTitleBounceComplete();
		}});
	}});
}

function animateTitleBounceComplete(){
	TweenMax.to(gameData, 3, {overwrite:true, ease:Linear.easeNone, onComplete:toggleAnimateTitle, onCompleteParams:[true]});
}

/*!
 * 
 * TOGGLE LETTERS - This is the function that runs to toggle letters
 * 
 */
function toggleLetters(con){
	if(con){
		gameData.wordNum++;
		gameData.wordNum = gameData.wordNum >= words_arr.length ? words_arr.length-1 : gameData.wordNum;
	}else{
		gameData.wordNum--;
		gameData.wordNum = gameData.wordNum < 0 ? 0 : gameData.wordNum++;
	}

	displayWordName();
}

function displayWordName(){
	letterTxt.text = words_arr[gameData.wordNum].name;
}

/*!
 * 
 * TOGGLE POP - This is the function that runs to toggle popup overlay
 * 
 */
function togglePop(con){
	confirmContainer.visible = con;
}


/*!
 * 
 * DISPLAY PAGES - This is the function that runs to display pages
 * 
 */
var curPage=''
function goPage(page){
	curPage=page;
	
	mainContainer.visible = false;
	tutorialContainer.visible = false;
	gameContainer.visible = false;
	resultContainer.visible = false;
	toggleAnimateTitle(false);

	var targetContainer = null;
	switch(page){
		case 'main':
			targetContainer = mainContainer;

			buttonStart.visible = true;
			buttonCategory.visible = true;
			selectContainer.visible = false;

			gameData.wordNum = 0;
			displayWordName();
			
			buildGameTitle();
			toggleAnimateTitle(true);
		break;

		case 'tutorial':
			targetContainer = tutorialContainer;
		break;
		
		case 'game':
			targetContainer = gameContainer;
			startGame();
		break;
		
		case 'result':
			targetContainer = resultContainer;
			stopGame();
			togglePop(false);
			playSound('soundResult');

			var totalWord = gameData.solve.length-1;
			totalWord = totalWord < 0 ? 0 : totalWord;
			resultWordTxt.text = textDisplay.resultWord.replace("[NUMBER]", totalWord);
			resultTimerTxt.text = textDisplay.resultTimer.replace("[NUMBER]", millisecondsToTimeGame(timeData.timer));
			tweenData.tweenScore = 0;
			TweenMax.to(tweenData, .5, {tweenScore:playerData.score, overwrite:true, onUpdate:function(){
				resultDescTxt.text = textDisplay.resultDesc.replace('[NUMBER]', addCommas(Math.floor(tweenData.tweenScore)));
			}});
			saveGame(playerData.score);
		break;
	}
	
	if(targetContainer != null){
		targetContainer.visible = true;
		targetContainer.alpha = 0;
		TweenMax.to(targetContainer, .5, {alpha:1, overwrite:true});
	}
	
	resizeCanvas();
}

/*!
 * 
 * START GAME - This is the function that runs to start game
 * 
 */
function startGame(){
	gameData.paused = false;
	gameData.nextStage = false;
	gameData.solve = [];
	gameStatusTxt.alpha = 0;

	playerData.score = 0;
	playerData.word = 0;
	tweenData.tweenScore = 0;

	updateGameWord();
	updateGameScore();
	setupGameStage();

	showGameStatus("instruction");
	toggleGameTimer(true);
	buildWord();
	playSound('soundStart');
}

 /*!
 * 
 * STOP GAME - This is the function that runs to stop play game
 * 
 */
function stopGame(){
	gameData.paused = true;
	TweenMax.killAll(false, true, false);
}

function saveGame(score){
	if ( typeof toggleScoreboardSave == 'function' ) { 
		$.scoreData.score = score;
		if(typeof type != 'undefined'){
			$.scoreData.type = type;	
		}
		toggleScoreboardSave(true);
	}

	/*$.ajax({
      type: "POST",
      url: 'saveResults.php',
      data: {score:score},
      success: function (result) {
          console.log(result);
      }
    });*/
}

function resizeGameUI(){
	scoreTxt.textAlign = "left";
	scoreTxt.x = offset.x + 50;
	scoreTxt.y = offset.y + 50;

	wordTxt.textAlign = "center";
	wordTxt.x = canvasW/2;
	wordTxt.y = offset.y + 50;

	lettersLandscapeContainer.visible = true;
	lettersPortraitContainer.visible = false;

	wordContainer.x = canvasW/2;
	wordContainer.y = canvasH/100 * 30;
	wordContainer.scaleX = wordContainer.scaleY = 1;

	gameStatusTxt.x = canvasW/2;
	gameStatusTxt.y = canvasH/100 * 40;

	lettersLandscapeContainer.x = canvasW/2;
	lettersLandscapeContainer.y = canvasH/100 * 60;

	scoreCalculateTxt.x = canvasW/2;
	scoreCalculateTxt.y = canvasH/100 * 82;

	timerShape.x = timerShapeBg.x = (canvasW/2) - (gameSettings.timer.width/2);
	timerShape.y = timerShapeBg.y = canvasH/100 * 85;

	if(!viewport.isLandscape){
		scoreTxt.textAlign = "left";
		scoreTxt.x = offset.x + 50;
		scoreTxt.y = offset.y + 50;

		wordTxt.textAlign = "left";
		wordTxt.x = offset.x + 50;
		wordTxt.y = offset.y + 90;
		
		lettersLandscapeContainer.visible = false;
		lettersPortraitContainer.visible = true;

		wordContainer.x = canvasW/2;
		wordContainer.y = canvasH/100 * 23;
		var scaleNum = gameData.wordWidth > 450 ? (450/gameData.wordWidth) : 1;
		wordContainer.scaleX = wordContainer.scaleY = scaleNum;

		gameStatusTxt.x = canvasW/2;
		gameStatusTxt.y = canvasH/100 * 31;

		lettersPortraitContainer.x = canvasW/2;
		lettersPortraitContainer.y = canvasH/100 * 53;

		scoreCalculateTxt.x = canvasW/2;
		scoreCalculateTxt.y = canvasH/100 * 88;

		timerShape.x = timerShapeBg.x = (canvasW/2) - (gameSettings.timer.width/2);
		timerShape.y = timerShapeBg.y = canvasH/100 * 90;
	}

	resizeHintButton();
}

function resizeHintButton(){
	if(viewport.isLandscape){
		var totalW = 0;
		var startPos = canvasH/100 * 55;
		var pos = {x:(canvasW/2) + 400, y:0};

		totalW = (gameSettings.letters.size) * (gameData.hintArr.length-1);
		totalW += gameSettings.letters.space * (gameData.hintArr.length-1);
		pos.y = startPos - (totalW/2);

		for(var n=0; n<gameData.hintArr.length; n++){
			$.letter[gameData.hintArr[n]].x = pos.x;
			$.letter[gameData.hintArr[n]].y = pos.y;
			
			pos.y += (gameSettings.letters.space * 1.5) + (gameSettings.letters.size);
		}
	}else{
		var totalW = 0;
		var startPos = (canvasW/2);
		var pos = {x:0, y:canvasH/100 * 80};

		totalW = (gameSettings.letters.size) * (gameData.hintArr.length-1);
		totalW += gameSettings.letters.space * (gameData.hintArr.length-1);
		pos.x = startPos - (totalW/2);

		for(var n=0; n<gameData.hintArr.length; n++){
			$.letter[gameData.hintArr[n]].x = pos.x;
			$.letter[gameData.hintArr[n]].y = pos.y;
			
			pos.x += (gameSettings.letters.space) + (gameSettings.letters.size);
		}
	}
}

/*!
 * 
 * GAME STAGE - This is the function that runs to setup and increase game stage
 * 
 */

function setupGameStage(){
	gameData.stage.timer = words_arr[gameData.wordNum].timer;
	gameData.stage.count = 0;

	gameData.hintArr = [];
	$.letter["reset"].visible = false;
	$.letter["hint"].visible = false;
	$.letter["hintfull"].visible = false;
	$.letter["reset"].noti.text = words_arr[gameData.wordNum].reset;
	$.letter["hint"].noti.text = words_arr[gameData.wordNum].hint;
	$.letter["hintfull"].noti.text = words_arr[gameData.wordNum].hint;

	if(words_arr[gameData.wordNum].hint > 0){
		$.letter["hint"].visible = true;
		gameData.hintArr.push("hint");
		toggleHintButton("hint", true);
	}

	if(words_arr[gameData.wordNum].hintfull > 0){
		$.letter["hintfull"].visible = true;
		gameData.hintArr.push("hintfull");
		toggleHintButton("hintfull", true);
	}

	if(words_arr[gameData.wordNum].reset > 0){
		$.letter["reset"].visible = true;
		gameData.hintArr.push("reset");
		toggleHintButton("reset", true);
	}

	resizeHintButton();
}

function increaseStage(){
	gameData.stage.timer -= words_arr[gameData.wordNum].stage.timer;
	
	if(gameData.mode == "quick"){
		gameData.stage.count++;
		if(gameData.stage.count >= words_arr[gameData.wordNum].stage.next){
			var newWordNum = gameData.wordNum;
			newWordNum++;
			newWordNum = newWordNum > words_arr.length-1 ? words_arr.length-1 : newWordNum;
			if(newWordNum != gameData.wordNum){
				gameData.wordNum = newWordNum;
				gameData.nextStage = true;
				setupGameStage();
			}
		}
	}
}

/*!
 * 
 * BUILD LETTERS - This is the function that runs to build letters
 * 
 */
function buildLetters(){
	lettersLandscapeContainer.removeAllChildren();
	lettersPortraitContainer.removeAllChildren();

	//landscape
	var totalW = 0;
	var totalH = 0;
	var startX = 0;
	var startY = 0;
	var pos = {x:0, y:0};

	if(gameSettings.letters.landscape.length > 1){
		totalH = (gameSettings.letters.size) * (gameSettings.letters.landscape.length-1);
		totalH += gameSettings.letters.space * (gameSettings.letters.landscape.length-1);
		pos.y = startY - (totalH/2);
	}

	for(var n=0; n<gameSettings.letters.landscape.length; n++){
		totalW = 0;
		startX = 0;
		if(gameSettings.letters.landscape[n].length > 1){
			totalW = (gameSettings.letters.size) * (gameSettings.letters.landscape[n].length-1);
			totalW += gameSettings.letters.space * (gameSettings.letters.landscape[n].length-1);
			pos.x = startX - (totalW/2);
		}
		
		for(var w=0; w<gameSettings.letters.landscape[n].length; w++){
			var curLetter = gameSettings.letters.landscape[n][w].toUpperCase();
			buildSquareShape("landscape"+n+"_"+w, curLetter, "letters");
			
			$.letter["landscape"+n+"_"+w].mode = "landscape";
			$.letter["landscape"+n+"_"+w].x = $.letter["landscape"+n+"_"+w].oriX = pos.x;
			$.letter["landscape"+n+"_"+w].y = $.letter["landscape"+n+"_"+w].oriY = pos.y;

			$.letter["landscape"+n+"_"+w].cursor = "pointer";
			$.letter["landscape"+n+"_"+w].addEventListener("mousedown", function(evt) {
				toggleDragEvent(evt, 'drag')
			});
			$.letter["landscape"+n+"_"+w].addEventListener("pressmove", function(evt) {
				toggleDragEvent(evt, 'move')
			});
			$.letter["landscape"+n+"_"+w].addEventListener("pressup", function(evt) {
				toggleDragEvent(evt, 'drop')
			});
			
			pos.x += (gameSettings.letters.space) + (gameSettings.letters.size);
		}

		pos.y += (gameSettings.letters.space*1.5) + (gameSettings.letters.size);
	}

	//portrait
	var totalW = 0;
	var totalH = 0;
	var startX = 0;
	var startY = 0;
	var pos = {x:0, y:0};

	if(gameSettings.letters.portrait.length > 1){
		totalH = (gameSettings.letters.size) * (gameSettings.letters.portrait.length-1);
		totalH += gameSettings.letters.space * (gameSettings.letters.portrait.length-1);
		pos.y = startY - (totalH/2);
	}

	for(var n=0; n<gameSettings.letters.portrait.length; n++){
		totalW = 0;
		startX = 0;
		if(gameSettings.letters.portrait[n].length > 1){
			totalW = (gameSettings.letters.size) * (gameSettings.letters.portrait[n].length-1);
			totalW += gameSettings.letters.space * (gameSettings.letters.portrait[n].length-1);
			pos.x = startX - (totalW/2);
		}
		
		for(var w=0; w<gameSettings.letters.portrait[n].length; w++){
			var curLetter = gameSettings.letters.portrait[n][w].toUpperCase();
			buildSquareShape("portrait"+n+"_"+w, curLetter, "letters");
			
			$.letter["portrait"+n+"_"+w].mode = "portrait";
			$.letter["portrait"+n+"_"+w].x = $.letter["portrait"+n+"_"+w].oriX = pos.x;
			$.letter["portrait"+n+"_"+w].y = $.letter["portrait"+n+"_"+w].oriY = pos.y;

			$.letter["portrait"+n+"_"+w].cursor = "pointer";
			$.letter["portrait"+n+"_"+w].addEventListener("mousedown", function(evt) {
				toggleDragEvent(evt, 'drag')
			});
			$.letter["portrait"+n+"_"+w].addEventListener("pressmove", function(evt) {
				toggleDragEvent(evt, 'move')
			});
			$.letter["portrait"+n+"_"+w].addEventListener("pressup", function(evt) {
				toggleDragEvent(evt, 'drop')
			});

			pos.x += (gameSettings.letters.space) + (gameSettings.letters.size);
		}

		pos.y += (gameSettings.letters.space*1.5) + (gameSettings.letters.size);
	}
}

function resetLetter(){
	var hintCount = Number($.letter["hint"].noti.text);
	if(hintCount > 0){
		toggleHintButton("hint", true);
	}

	var hintFullCount = Number($.letter["hintfull"].noti.text);
	if(hintFullCount > 0){
		toggleHintButton("hintfull", true);
	}

	for(var n=0; n<gameData.word.length; n++){
		$.letter[n].shape.fillCommand.style = gameSettings.word.color;
		$.letter[n].shapeShadow.fillCommand.style = gameSettings.word.color;
	}

	for(var n=0; n<gameSettings.letters.landscape.length; n++){		
		for(var w=0; w<gameSettings.letters.landscape[n].length; w++){
			$.letter["landscape"+n+"_"+w].x = $.letter["landscape"+n+"_"+w].oriX;
			$.letter["landscape"+n+"_"+w].y = $.letter["landscape"+n+"_"+w].oriY;
			$.letter["landscape"+n+"_"+w].shape.fillCommand.style = gameSettings.letters.color;
			$.letter["landscape"+n+"_"+w].shapeShadow.fillCommand.style = gameSettings.letters.color;
		}
	}

	for(var n=0; n<gameSettings.letters.portrait.length; n++){
		for(var w=0; w<gameSettings.letters.portrait[n].length; w++){
			$.letter["portrait"+n+"_"+w].x = $.letter["portrait"+n+"_"+w].oriX;
			$.letter["portrait"+n+"_"+w].y = $.letter["portrait"+n+"_"+w].oriY;
			$.letter["portrait"+n+"_"+w].shape.fillCommand.style = gameSettings.letters.color;
			$.letter["portrait"+n+"_"+w].shapeShadow.fillCommand.style = gameSettings.letters.color;
		}
	}
}

function toggleDragEvent(obj, con){
	if(gameData.paused || gameData.complete){
		return;
	}
	
	var targetContainer = lettersLandscapeContainer;
	if(obj.currentTarget.mode == "portrait"){
		targetContainer = lettersPortraitContainer;
	}

	switch(con){
		case 'drag':
			toggleAnimateDrop(true);
			var global = targetContainer.localToGlobal(obj.currentTarget.x, obj.currentTarget.y);
			obj.currentTarget.offset = {x:global.x-(obj.stageX), y:global.y-(obj.stageY)};
			targetContainer.setChildIndex(obj.currentTarget, targetContainer.numChildren-1);
			gameData.drag = true;
			playSound('soundSelect');
		break;
		
		case 'move':
			if(gameData.drag){
				var local = targetContainer.globalToLocal(obj.stageX, obj.stageY);
				var moveX = ((local.x) + obj.currentTarget.offset.x);
				var moveY = ((local.y) + obj.currentTarget.offset.y);
				obj.currentTarget.x = moveX;
				obj.currentTarget.y = moveY;
			}
		break;
		
		case 'drop':
			gameData.drag = false;
			playSound('soundRelease');
			toggleAnimateDrop(false);

			var dropInPlace = false;
			var global = targetContainer.localToGlobal(obj.currentTarget.x, obj.currentTarget.y);
			for(var n=0; n<gameData.word.length; n++){
				var globalW = wordContainer.localToGlobal($.letter[n].x, $.letter[n].y);
				var checkDistance = getDistance(global.x, global.y, globalW.x, globalW.y);
				if(checkDistance <= (gameSettings.word.size/1.5) * wordContainer.scaleX){
					checkChangeWord(n, obj.currentTarget.letter.text);
					dropInPlace = true;
				}
			}

			if(dropInPlace){
				obj.currentTarget.x = obj.currentTarget.oriX;
				obj.currentTarget.y = obj.currentTarget.oriY;
			}else{
				TweenMax.to(obj.currentTarget, gameSettings.letters.revertSpeed, {x:obj.currentTarget.oriX, y:obj.currentTarget.oriY, overwrite:true});
			}

			gameData.drag.status = false;
		break;
	}
}

/*!
 * 
 * BUILD WORD - This is the function that runs to build word
 * 
 */
function buildWord(){
	//console.log("build", gameData.wordIndex);
	wordContainer.removeAllChildren();

	if(gameData.wordIndex > gameData.words[gameData.wordNum].length){
		gameData.wordIndex = 0;
		shuffle(gameData.words[gameData.wordNum]);
	}

	gameData.word = gameData.words[gameData.wordNum][gameData.wordIndex].toUpperCase();
	gameData.solve.push(gameData.word);
	gameData.wordIndex++;

	var totalW = 0;
	var startX = 0;
	var pos = {x:0, y:0};

	totalW = (gameSettings.word.size) * (gameData.word.length-1);
	totalW += gameSettings.word.space * (gameData.word.length-1);
	gameData.wordWidth = totalW;
	pos.x = startX - (totalW/2);
	
	for(var n=0; n<gameData.word.length; n++){
		buildSquareShape(n, gameData.word[n].toUpperCase(), "word");
		$.letter[n].index = n;
		$.letter[n].x = $.letter[n].oriX = pos.x;
		$.letter[n].y = $.letter[n].oriY = pos.y;
		pos.x += (gameSettings.word.space) + (gameSettings.word.size);

		$.letter[n].scaleX = $.letter[n].scaleY = 0;
		TweenMax.to($.letter[n], .5, {scaleX:1, scaleY:1, overwrite:true});
	}
	
	$.letter["reset"].shape.fillCommand.style = gameSettings.word.color;
	$.letter["reset"].shapeShadow.fillCommand.style = gameSettings.word.color;
	$.letter["hint"].shape.fillCommand.style = gameSettings.word.color;
	$.letter["hint"].shapeShadow.fillCommand.style = gameSettings.word.color;
	$.letter["hintfull"].shape.fillCommand.style = gameSettings.word.color;
	$.letter["hintfull"].shapeShadow.fillCommand.style = gameSettings.word.color;
	toggleAnimateDrop(false);
	
	scoreCalculateTxt.alpha = 0;
	gameData.drag = false;
	gameData.shake = false;
	gameData.complete = false;
	timeData.countdown = gameData.stage.timer;
	resizeGameUI();
	resetLetter();
	toggleGameSessionTimer(true);
	checkPossibleWord();
	tryNewWord();
}

/*!
 * 
 * HINT BUTTON - This is the function that runs to show hint
 * 
 */
function showHint(){
	animateHintBounce($.letter["hint"]);
	var hintCount = Number($.letter["hint"].noti.text);

	if(hintCount > 0){
		if(gameData.possibleWord.length > 0){
			var lettersHint = [];
			for(var n=0; n<gameData.possibleWord.length; n++){
				var currentWord = gameData.possibleWord[n];
				for(var w=0; w<currentWord.length; w++){
					if(gameData.word.substring(w,w+1) != currentWord.substring(w,w+1)){
						lettersHint.push(currentWord.substring(w,w+1));
					}
				}
			}

			for(var n=0; n<gameSettings.letters.landscape.length; n++){		
				for(var w=0; w<gameSettings.letters.landscape[n].length; w++){
					if(lettersHint.indexOf($.letter["landscape"+n+"_"+w].letter.text) != -1){
						$.letter["landscape"+n+"_"+w].shape.fillCommand.style = gameSettings.letters.hintColor;
						$.letter["landscape"+n+"_"+w].shapeShadow.fillCommand.style = gameSettings.letters.hintColor;
					}
				}
			}
		
			for(var n=0; n<gameSettings.letters.portrait.length; n++){
				for(var w=0; w<gameSettings.letters.portrait[n].length; w++){
					if(lettersHint.indexOf($.letter["portrait"+n+"_"+w].letter.text) != -1){
						$.letter["portrait"+n+"_"+w].shape.fillCommand.style = gameSettings.letters.hintColor;
						$.letter["portrait"+n+"_"+w].shapeShadow.fillCommand.style = gameSettings.letters.hintColor;
					}
				}
			}
		}else{
			buildWord();
		}
	}

	hintCount--;
	hintCount = hintCount < 0 ? 0 : hintCount;
	$.letter["hint"].noti.text = hintCount;
	
	if(hintCount <= 0){
		toggleHintButton("hint", false);
	}
}

function showHintFull(){
	animateHintBounce($.letter["hintfull"]);
	var hintCount = Number($.letter["hintfull"].noti.text);

	if(hintCount > 0){
		if(gameData.possibleWord.length > 0){
			var lettersHint = [];
			for(var n=0; n<gameData.possibleWord.length; n++){
				var currentWord = gameData.possibleWord[n];
				for(var w=0; w<currentWord.length; w++){
					if(gameData.word.substring(w,w+1) != currentWord.substring(w,w+1)){
						$.letter[w].shape.fillCommand.style = gameSettings.word.hintColor;
						$.letter[w].shapeShadow.fillCommand.style = gameSettings.word.hintColor;
						lettersHint.push(currentWord.substring(w,w+1));
					}
				}
				n = gameData.possibleWord.length;
			}

			for(var n=0; n<gameSettings.letters.landscape.length; n++){		
				for(var w=0; w<gameSettings.letters.landscape[n].length; w++){
					if(lettersHint.indexOf($.letter["landscape"+n+"_"+w].letter.text) != -1){
						$.letter["landscape"+n+"_"+w].shape.fillCommand.style = gameSettings.letters.hintColor;
						$.letter["landscape"+n+"_"+w].shapeShadow.fillCommand.style = gameSettings.letters.hintColor;
					}
				}
			}
		
			for(var n=0; n<gameSettings.letters.portrait.length; n++){
				for(var w=0; w<gameSettings.letters.portrait[n].length; w++){
					if(lettersHint.indexOf($.letter["portrait"+n+"_"+w].letter.text) != -1){
						$.letter["portrait"+n+"_"+w].shape.fillCommand.style = gameSettings.letters.hintColor;
						$.letter["portrait"+n+"_"+w].shapeShadow.fillCommand.style = gameSettings.letters.hintColor;
					}
				}
			}
		}else{
			buildWord();
		}
	}

	hintCount--;
	hintCount = hintCount < 0 ? 0 : hintCount;
	$.letter["hintfull"].noti.text = hintCount;
	
	if(hintCount <= 0){
		toggleHintButton("hintfull", false);
	}
}

function resetWord(){
	animateHintBounce($.letter["reset"]);

	var resetCount = Number($.letter["reset"].noti.text);
	resetCount--;
	resetCount = resetCount < 0 ? 0 : resetCount;
	$.letter["reset"].noti.text = resetCount;

	if(resetCount <= 0){
		toggleHintButton("reset", false);
	}

	if(resetCount > 0){
		buildWord();
	}
}

function toggleHintButton(type, con){
	if(con){
		$.letter[type].active = true;
		$.letter[type].shape.fillCommand.style = gameSettings.letters.hintColor;
		$.letter[type].shapeShadow.fillCommand.style = gameSettings.letters.hintColor;
	}else{
		$.letter[type].active = false;
		$.letter[type].shape.fillCommand.style = gameSettings.letters.disabledColor;
		$.letter[type].shapeShadow.fillCommand.style = gameSettings.letters.disabledColor;
	}
}

/*!
 * 
 * BUILD SQUARE - This is the function that runs to build square shape
 * 
 */
function buildSquareShape(n, text, type){
	$.letter[n] = new createjs.Container();

	var size = gameSettings.letters.size;
	var radius = gameSettings.letters.radius;
	var color = gameSettings.letters.color;
	var fontSize = gameSettings.letters.fontSize;
	var textColor = gameSettings.letters.textColor;
	var fontY = gameSettings.letters.fontY;
	var shadowY = gameSettings.letters.shadowY;
	var stroke = 0;

	if(type == "title"){
		size = gameSettings.title.size;
		radius = gameSettings.title.radius;
		color = gameSettings.title.color;
		fontSize = gameSettings.title.fontSize;
		textColor = gameSettings.title.textColor;
		fontY = gameSettings.title.fontY;
		shadowY = gameSettings.title.shadowY;
	}else if(type == "word"){
		size = gameSettings.word.size;
		radius = gameSettings.word.radius;
		color = gameSettings.word.color;
		fontSize = gameSettings.word.fontSize;
		textColor = gameSettings.word.textColor;
		fontY = gameSettings.word.fontY;
		shadowY = gameSettings.word.shadowY;
		stroke = gameSettings.word.stroke;
	}
		
	var letterTxt = new createjs.Text();
	letterTxt.font = fontSize + "px comfortaabold";
	letterTxt.color = textColor;
	letterTxt.textAlign = "center";
	letterTxt.textBaseline='alphabetic';
	letterTxt.text = text;
	letterTxt.y = fontY;

	var newShape = new createjs.Shape();
	newShape.fillCommand = newShape.graphics.beginFill(color).command;
	newShape.graphics.drawRoundRectComplex(-(size/2), -(size/2), size, size, radius, radius, radius, radius);

	var newShapeShadow = new createjs.Shape();	
	newShapeShadow.fillCommand = newShapeShadow.graphics.beginFill(color).command;
	newShapeShadow.graphics.drawRoundRectComplex(-(size/2), -(size/2), size, size, radius, radius, radius, radius);
	newShapeShadow.y = shadowY;

	var newShapeShadowDim = new createjs.Shape();	
	newShapeShadowDim.graphics.beginFill('#000').drawRoundRectComplex(-(size/2), -(size/2), size, size, radius, radius, radius, radius);
	newShapeShadowDim.alpha = .5;
	newShapeShadowDim.y = shadowY;

	var newStroke = new createjs.Shape();
	if(type == "word"){
		newStroke.fillCommand = newStroke.graphics.beginStroke(gameSettings.word.strokeColor).command;
		newStroke.graphics.setStrokeStyle(stroke).drawRoundRectComplex(-(size/2), -(size/2), size, size + shadowY, radius, radius, radius, radius);
	}

	$.letter[n].stroke = newStroke;
	$.letter[n].shape = newShape;
	$.letter[n].shapeShadow = newShapeShadow;
	$.letter[n].letter = letterTxt;
	$.letter[n].addChild(newStroke, newShapeShadow, newShapeShadowDim, newShape, letterTxt);

	if(type == "word"){
		wordContainer.addChild($.letter[n]);
	}else if(type == "title"){
		titleContainer.addChild($.letter[n]);
	}else if(type == "letters"){
		if(n.substring(0,9) == "landscape"){
			lettersLandscapeContainer.addChild($.letter[n]);
		}else{
			lettersPortraitContainer.addChild($.letter[n]);
		}
	}else{
		var buttonIcon = new createjs.Bitmap(loader.getResult('buttonHintFull'));
		if(type == "reset"){
			buttonIcon = new createjs.Bitmap(loader.getResult('buttonReset'));
		}else if(type == "hint"){
			buttonIcon = new createjs.Bitmap(loader.getResult('buttonHint'));
		}

		centerReg(buttonIcon);
		
		var newNotiShape = new createjs.Shape();
		newNotiShape.fillCommand = newNotiShape.graphics.beginFill(gameSettings.letters.notificationColor).command;
		newNotiShape.graphics.drawCircle(0,0,gameSettings.letters.notificationSize);
		newNotiShape.x = size/ 2.5;
		newNotiShape.y = -(size/ 2.5);

		var notiTxt = new createjs.Text();
		notiTxt.font = gameSettings.letters.notificationFontSize + "px comfortaabold";
		notiTxt.color = textColor;
		notiTxt.textAlign = "center";
		notiTxt.textBaseline='alphabetic';
		notiTxt.text = "0";
		notiTxt.x = size/ 2.5;
		notiTxt.y = -((size/ 2.5));
		notiTxt.y += gameSettings.letters.notificationFontY;

		$.letter[n].noti = notiTxt;
		
		$.letter[n].addChild(buttonIcon, newNotiShape, notiTxt);
		gameContainer.addChild($.letter[n]);
	}
}

/*!
 * 
 * CHECK CHANGE WORD - This is the function that runs to check change word
 * 
 */
function checkChangeWord(index, letter){
	var newWord = "";
	for(var n=0; n<gameData.word.length; n++){
		if(n == index){
			newWord += letter;
		}else{
			newWord += $.letter[n].letter.text;
		}
	}

	if(gameData.solve.indexOf(newWord) == -1){
		var foundWord = false;
		for(var n=0; n<gameData.possibleWord.length; n++){
			if(newWord == gameData.possibleWord[n].toUpperCase()){
				n = gameData.possibleWord.length;
				$.letter[index].letter.text = letter;

				gameData.solve.push(newWord.toUpperCase());
				gameData.word = newWord.toUpperCase();
				
				foundWord = true;
				gameData.complete = true;
				showGameStatus("complete");
				toggleGameSessionTimer(false);
				playSound('soundComplete');

				scoreCalculateTxt.text = textDisplay.pointplus.replace("[NUMBER]", 0);
				scoreCalculateTxt.alpha = 0;
				TweenMax.to(scoreCalculateTxt, 1, {alpha:1, overwrite:true});
				checkPossibleWord();
				calculateScore();
				resetLetter();

				for(var w=0; w<gameData.word.length; w++){
					animateBounce($.letter[w]);
				}
			}
		}

		if(!foundWord){
			showGameStatus("error");
			playSound('soundError');
			gameData.shake = true;
			TweenMax.to(wordContainer, .5, {overwrite:true, onComplete:function(){
				gameData.shake = false;
			}});
		}
	}else{
		playSound('soundError2');
		showGameStatus("exist");
	}
}

/*!
 * 
 * ANIMATION WORD - This is the function that runs to animate word
 * 
 */
function animateBounce(obj){
	TweenMax.to(obj, gameSettings.word.bounceSpeed, {scaleX:1.2, scaleY:1.2, overwrite:true, onComplete:function(){
		TweenMax.to(obj, gameSettings.word.bounceSpeed, {scaleX:1, scaleY:1, overwrite:true, onComplete:function(){
			
		}});
	}});
}

function animateHintBounce(obj){
	obj.scaleX = obj.scaleY = .5;
	TweenMax.to(obj, .2, {scaleX:1, scaleY:1, overwrite:true, onComplete:function(){
			
	}});
}

function toggleAnimateDrop(con){
	for(var n=0; n<gameData.word.length; n++){
		if(con){
			animateBlink($.letter[n].stroke);
		}else{
			TweenMax.killTweensOf($.letter[n].stroke);
			$.letter[n].stroke.alpha = 0;
		}
	}
}

function animateBlink(obj){
	var tweenSpeed = .5;
	obj.alpha = 0;
	TweenMax.to(obj, tweenSpeed, {alpha:1, overwrite:true, onComplete:function(){
		TweenMax.to(obj, tweenSpeed, {alpha:0, overwrite:true, onComplete:animateBlink, onCompleteParams:[obj]});
	}});
}

/*!
 * 
 * POSSIBLE WORD - This is the function that runs to check possible word
 * 
 */
function checkPossibleWord(){
	gameData.possibleWord = [];
	for(var n=0; n<gameData.words[gameData.wordNum].length; n++){
		var currentWord = gameData.words[gameData.wordNum][n].toUpperCase();

		var countWord = 0;
		for(var w=0; w<currentWord.length; w++){
			if($.letter[w].letter.text == currentWord.substring(w,w+1)){
				countWord++;
			}
		}

		if(countWord == currentWord.length-1){
			if(gameData.solve.indexOf(currentWord) == -1){
				gameData.possibleWord.push(currentWord);
			}
		}
	}
}

function tryNewWord(){
	if(gameData.possibleWord.length == 0){
		if(gameData.wordIndex > gameData.words[gameData.wordNum].length){
			showGameStatus("noplayword");
			endGame();
		}else{
			gameData.solve.splice(-1);
			buildWord();
		}
	}
}

/*!
 * 
 * NEXT WORD - This is the function that runs to proceed next word
 * 
 */
function proceedNext(){
	increaseStage();

	var tween = 1;
	var nextStageCon = "word";
	if(gameData.nextStage){
		nextStageCon = "stage";
		tween = 3;
		gameData.nextStage = false;
		showGameStatus("stage");
		playSound('soundClear');
	}else{
		gameData.complete = false;
		if(gameData.possibleWord.length == 0){
			gameData.complete = true;
		}
	}

	TweenMax.to(gameContainer, tween, {overwrite:true, onComplete:function(){
		scoreCalculateTxt.text = "";
		if(nextStageCon == "word"){
			if(gameData.possibleWord.length == 0){
				showGameStatus("nomoreword");
				TweenMax.to(wordContainer, 2, {overwrite:true, onComplete:function(){
					tryNewWord();
				}});
			}else{
				gameData.drag = false;
				timeData.countdown = gameData.stage.timer;
				toggleGameSessionTimer(true);
			}
		}else{
			buildWord();
		}
	}});
}

/*!
 * 
 * GAME TIMER - This is the function that runs for game timer
 * 
 */
function toggleGameTimer(con){	
	if(con){
		timeData.startDate = new Date();
	}else{
		
	}
	timeData.enable = con;
}

function toggleGameSessionTimer(con){	
	if(con){
		timerShape.alpha = 1;
		timeData.oldTimer = -1;
		timeData.accumulate = 0;
		timeData.sessionDate = new Date();
	}else{
		timeData.accumulate = timeData.countdown - timeData.sessionTimer;
	}
	timeData.enable = con;
}


/*!
 * 
 * UPDATE GAME - This is the function that runs to loop game update
 * 
 */
function updateGame(){
	if(!gameData.paused){
		if(timeData.enable){
			timeData.nowDate = new Date();
			timeData.elapsedTime = Math.floor((timeData.nowDate.getTime() - timeData.startDate.getTime()));
			timeData.timer = (timeData.elapsedTime);

			timeData.elapsedTime = Math.floor((timeData.nowDate.getTime() - timeData.sessionDate.getTime()));
			timeData.sessionTimer = Math.floor((timeData.countdown) - (timeData.elapsedTime));

			if(timeData.oldTimer == -1){
				timeData.oldTimer = timeData.sessionTimer;
			}
			
			if(timeData.sessionTimer <= 0){
				//stop
				timeData.sessionTimer = 0;
				playSound('soundTimerEnd');
				showGameStatus("timesup");
				endGame();
			}else{
				if((timeData.oldTimer - timeData.sessionTimer) > 1000){
					if(timeData.sessionTimer < 5000){
						timerShape.alpha = .5;
						TweenMax.to(timerShape, .3, {alpha:1});
						timerShapeBg.alpha = 0;
						TweenMax.to(timerShapeBg, .3, {alpha:.3});
						playSound('soundTimer');
					}
					timeData.oldTimer = timeData.sessionTimer;
				}
			}
			updateTimerBar();
		}

		for(var n=0; n<gameData.word.length; n++){
			var thisLetter = $.letter[n];
			if(gameData.shake){
				var rangeX = randomIntFromInterval(-5,5);
				var rangeY = randomIntFromInterval(-5,5);
				thisLetter.x = thisLetter.oriX + rangeX;
				thisLetter.y = thisLetter.oriY + rangeY;
			}else{
				thisLetter.x = thisLetter.oriX;
				thisLetter.y = thisLetter.oriY;
			}
		}
	}
}

function updateTimerBar(){
	timerShape.graphics.clear();
	timerShape.graphics.beginFill(gameSettings.timer.color);
	
	timerShapeBg.graphics.clear();
	timerShapeBg.graphics.beginFill(gameSettings.timer.color);
	timerShapeBg.alpha = .3;
	
	var totalW = timeData.sessionTimer/timeData.countdown * gameSettings.timer.width;
	totalW = totalW < 5 ? 5 : totalW;
	var radius = gameSettings.timer.radius;
	timerShape.graphics.drawRoundRectComplex(0, 0, totalW, gameSettings.timer.height, radius, radius, radius, radius);
	timerShapeBg.graphics.drawRoundRectComplex(0, 0, gameSettings.timer.width, gameSettings.timer.height, radius, radius, radius, radius);
}

/*!
 * 
 * GAME SCORE - This is the function that runs to show game score
 * 
 */
function calculateScore(){
	playSound('soundScore');
	var scorePercentage = words_arr[gameData.wordNum].score/gameData.stage.timer;
	TweenMax.to(timeData, gameSettings.score.speed, {sessionTimer:0, overwrite:true, onUpdate:function(){
		var calTimer = timeData.countdown - timeData.sessionTimer;
		var totalScore = Math.floor((calTimer - timeData.accumulate) * scorePercentage);
		scoreCalculateTxt.text = textDisplay.pointplus.replace("[NUMBER]", addCommas(totalScore));
		updateTimerBar();
	}, onComplete:function(){
		var calTimer = timeData.countdown - timeData.sessionTimer;
		var totalScore = Math.floor((calTimer - timeData.accumulate) * scorePercentage);
		playerData.score += totalScore;

		updateGameWord();
		updateGameScore();
		proceedNext();
	}});
}

function updateGameScore(){
	TweenMax.to(tweenData, .5, {tweenScore:playerData.score, overwrite:true, onUpdate:function(){
		scoreTxt.text = textDisplay.pointDisplay.replace("[NUMBER]", addCommas(Math.floor(tweenData.tweenScore)));
	}});
}

function updateGameWord(){
	var totalWord = gameData.solve.length-1;
	totalWord = totalWord < 0 ? 0 : totalWord;
	wordTxt.text = textDisplay.wordDisplay.replace("[NUMBER]", totalWord);
}

/*!
 * 
 * GAME STATUS - This is the function that runs to show game status
 * 
 */
function showGameStatus(con){
	var delay = 2;
	if(con == 'instruction'){
		gameStatusTxt.text = textDisplay.instruction;
	}else if(con == 'timesup'){
		gameStatusTxt.text = textDisplay.timesup;
	}else if(con == 'stage'){
		gameStatusTxt.text = textDisplay.nextstage;
	}else if(con == 'error'){
		gameStatusTxt.text = textDisplay.noWord;
	}else if(con == 'exist'){
		gameStatusTxt.text = textDisplay.wordExist;
	}else if(con == 'complete'){
		var randomComplete = Math.floor(Math.random() * textDisplay.completeWord.length)
		gameStatusTxt.text = textDisplay.completeWord[randomComplete];
	}else if(con == 'nomoreword'){
		delay = 1;
		gameStatusTxt.text = textDisplay.noPossibleWord;
	}else if(con == 'noplayword'){
		gameStatusTxt.text = textDisplay.noPlayWord;
	}

	gameStatusTxt.alpha = 0;
	TweenMax.to(gameStatusTxt, .5, {alpha:1, overwrite:true, onComplete:function(){
		TweenMax.to(gameStatusTxt, .5, {delay:delay, alpha:0, overwrite:true});
	}});
}

/*!
 * 
 * END GAME - This is the function that runs for game end
 * 
 */
function endGame(){
	gameData.paused = true;
	toggleGameSessionTimer(false);
	toggleGameTimer(false);
	toggleAnimateDrop(false);
	
	$.letter["reset"].visible = false;
	$.letter["hint"].visible = false;

	TweenMax.to(gameContainer, 3, {overwrite:true, onComplete:function(){
		goPage('result');
	}});
}

/*!
 * 
 * MILLISECONDS CONVERT - This is the function that runs to convert milliseconds to time
 * 
 */
function millisecondsToTimeGame(milli) {
	var milliseconds = milli % 1000;
	var seconds = Math.floor((milli / 1000) % 60);
	var minutes = Math.floor((milli / (60 * 1000)) % 60);
	
	if(seconds<10){
		seconds = '0'+seconds;  
	}
	
	if(minutes<10){
		minutes = '0'+minutes;  
	}
	
	return minutes+':'+seconds;
}

/*!
 * 
 * OPTIONS - This is the function that runs to toggle options
 * 
 */

function toggleOption(){
	if(optionsContainer.visible){
		optionsContainer.visible = false;
	}else{
		optionsContainer.visible = true;
	}
}

function loadJSON(){
	buttonStart.visible = false;
	buttonCategory.visible = false;
	loadingTxt.visible = true;

	loopJSONFile();
}

function loopJSONFile(){
	$.getJSON(words_arr[gameData.wordNum].file, function(data){
		gameData.words.push([]);
		gameData.words[gameData.wordNum] = data;

		gameData.wordNum++;
		if(gameData.wordNum < words_arr.length){
			loopJSONFile();
		}else{
			for(var n=0; n<words_arr.length; n++){
				shuffle(gameData.words[n]);
			}
			gameData.wordNum = 0;
			buttonStart.visible = true;
			buttonCategory.visible = true;
			loadingTxt.visible = false;
			goPage("main");
		}
	}).fail(function(){
		//console.log("An error has occurred.");
	});
}


/*!
 * 
 * OPTIONS - This is the function that runs to mute and fullscreen
 * 
 */
function toggleGameMute(con){
	buttonSoundOff.visible = false;
	buttonSoundOn.visible = false;
	toggleMute(con);
	if(con){
		buttonSoundOn.visible = true;
	}else{
		buttonSoundOff.visible = true;	
	}
}

function toggleFullScreen() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

/*!
 * 
 * SHARE - This is the function that runs to open share url
 * 
 */
function share(action){
	gtag('event','click',{'event_category':'share','event_label':action});
	
	var loc = location.href
	loc = loc.substring(0, loc.lastIndexOf("/") + 1);
	
	var title = '';
	var text = '';
	
	title = shareTitle.replace("[SCORE]", addCommas(playerData.score));
	text = shareMessage.replace("[SCORE]", addCommas(playerData.score));
	
	var shareurl = '';
	
	if( action == 'twitter' ) {
		shareurl = 'https://twitter.com/intent/tweet?url='+loc+'&text='+text;
	}else if( action == 'facebook' ){
		shareurl = 'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(loc+'share.php?desc='+text+'&title='+title+'&url='+loc+'&thumb='+loc+'share.jpg&width=590&height=300');
	}else if( action == 'google' ){
		shareurl = 'https://plus.google.com/share?url='+loc;
	}else if( action == 'whatsapp' ){
		shareurl = "whatsapp://send?text=" + encodeURIComponent(text) + " - " + encodeURIComponent(loc);
	}
	
	window.open(shareurl);
}