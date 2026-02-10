////////////////////////////////////////////////////////////
// CANVAS
////////////////////////////////////////////////////////////
var stage
var canvasW=0;
var canvasH=0;

/*!
 * 
 * START GAME CANVAS - This is the function that runs to setup game canvas
 * 
 */
function initGameCanvas(w,h){
	var gameCanvas = document.getElementById("gameCanvas");
	gameCanvas.width = w;
	gameCanvas.height = h;
	
	canvasW=w;
	canvasH=h;
	stage = new createjs.Stage("gameCanvas");
	
	createjs.Touch.enable(stage);
	stage.enableMouseOver(20);
	stage.mouseMoveOutside = true;
	
	createjs.Ticker.framerate = 60;
	createjs.Ticker.addEventListener("tick", tick);
}

var guide = false;
var canvasContainer, mainContainer, gameContainer, resultContainer, confirmContainer;
var guideline, bg, logo, buttonOk, result, shadowResult, buttonReplay, buttonFacebook, buttonTwitter, buttonWhatsapp, buttonFullscreen, buttonSoundOn, buttonSoundOff;

$.letter = {};

/*!
 * 
 * BUILD GAME CANVAS ASSERTS - This is the function that runs to build game canvas asserts
 * 
 */
function buildGameCanvas(){
	canvasContainer = new createjs.Container();
	titleContainer = new createjs.Container();
	mainContainer = new createjs.Container();
	selectContainer = new createjs.Container();
	tutorialContainer = new createjs.Container();
	gameContainer = new createjs.Container();
	wordContainer = new createjs.Container();
	timerContainer = new createjs.Container();
	lettersLandscapeContainer = new createjs.Container();
	lettersPortraitContainer = new createjs.Container();
	resultContainer = new createjs.Container();
	confirmContainer = new createjs.Container();
	
	
	bg = new createjs.Bitmap(loader.getResult('background'));
	bgP = new createjs.Bitmap(loader.getResult('backgroundP'));
	
	buttonStart = new createjs.Bitmap(loader.getResult('buttonStart'));
	centerReg(buttonStart);

	buttonCategory = new createjs.Bitmap(loader.getResult('buttonCategory'));
	centerReg(buttonCategory);

	loadingTxt = new createjs.Text();
	loadingTxt.font = "20px comfortaabold";
	loadingTxt.color = '#fff';
	loadingTxt.textAlign = "center";
	loadingTxt.textBaseline='alphabetic';
	loadingTxt.text = textDisplay.loading;

	buttonLetter = new createjs.Bitmap(loader.getResult('buttonLetter'));
	centerReg(buttonLetter);

	letterTxt = new createjs.Text();
	letterTxt.font = "20px comfortaabold";
	letterTxt.color = '#fff';
	letterTxt.textAlign = "center";
	letterTxt.textBaseline='alphabetic';
	letterTxt.y += 5;

	buttonArrowL = new createjs.Bitmap(loader.getResult('buttonArrow'));
	centerReg(buttonArrowL);

	buttonArrowR = new createjs.Bitmap(loader.getResult('buttonArrow'));
	centerReg(buttonArrowR);

	buttonArrowL.scaleX = -1;
	buttonArrowL.x = -120;
	buttonArrowR.x = 120;

	selectContainer.addChild(buttonLetter, letterTxt, buttonArrowL, buttonArrowR);

	//tutorial
	itemTutorial = new createjs.Bitmap(loader.getResult('itemTutorial'));
	centerReg(itemTutorial);
	itemTutorial1 = new createjs.Bitmap(loader.getResult('itemTutorial1'));
	centerReg(itemTutorial1);
	itemTutorial2 = new createjs.Bitmap(loader.getResult('itemTutorial2'));
	centerReg(itemTutorial2);
	itemTutorial3 = new createjs.Bitmap(loader.getResult('itemTutorial3'));
	centerReg(itemTutorial3);

	buttonTutorialL = new createjs.Bitmap(loader.getResult('buttonArrow'));
	centerReg(buttonTutorialL);

	buttonTutorialR = new createjs.Bitmap(loader.getResult('buttonArrow'));
	centerReg(buttonTutorialR);

	buttonOk = new createjs.Bitmap(loader.getResult('buttonOk'));
	centerReg(buttonOk);

	buttonTutorialL.x = -120
	buttonTutorialR.x = 120
	buttonTutorialL.scaleX = -1;
	buttonOk.y = buttonTutorialL.y = buttonTutorialR.y = 160;

	tutorialContainer.addChild(itemTutorial, itemTutorial1, itemTutorial2, itemTutorial3, buttonTutorialL, buttonTutorialR, buttonOk);
	
	//game
	timerShapeBg = new createjs.Shape();
	timerShape = new createjs.Shape();
	timerContainer.addChild(timerShapeBg, timerShape);

	gameStatusTxt = new createjs.Text();
	gameStatusTxt.font = "25px comfortaabold";
	gameStatusTxt.lineHeight = 35;
	gameStatusTxt.color = "#fff";
	gameStatusTxt.textAlign = "center";
	gameStatusTxt.textBaseline='middle';
	gameStatusTxt.text = "";

	scoreCalculateTxt = new createjs.Text();
	scoreCalculateTxt.font = "25px comfortaabold";
	scoreCalculateTxt.lineHeight = 35;
	scoreCalculateTxt.color = "#fff";
	scoreCalculateTxt.textAlign = "center";
	scoreCalculateTxt.textBaseline='middle';
	scoreCalculateTxt.text = "";

	scoreTxt = new createjs.Text();
	scoreTxt.font = "30px comfortaabold";
	scoreTxt.lineHeight = 35;
	scoreTxt.color = "#fff";
	scoreTxt.textAlign = "left";
	scoreTxt.textBaseline='alphabetic';
	scoreTxt.text = "";

	wordTxt = new createjs.Text();
	wordTxt.font = "30px comfortaabold";
	wordTxt.lineHeight = 35;
	wordTxt.color = "#fff";
	wordTxt.textAlign = "left";
	wordTxt.textBaseline='alphabetic';
	wordTxt.text = "";

	buildSquareShape("hint", "", "hint");
	buildSquareShape("hintfull", "", "hintfull");
	buildSquareShape("reset", "", "reset");

	//result
	itemResult = new createjs.Bitmap(loader.getResult('itemPop'));
	itemResultP = new createjs.Bitmap(loader.getResult('itemPopP'));
	
	buttonContinue = new createjs.Bitmap(loader.getResult('buttonContinue'));
	centerReg(buttonContinue);
	
	resultShareTxt = new createjs.Text();
	resultShareTxt.font = "20px comfortaabold";
	resultShareTxt.color = '#000';
	resultShareTxt.textAlign = "center";
	resultShareTxt.textBaseline='alphabetic';
	resultShareTxt.text = textDisplay.share;
	
	resultTitleTxt = new createjs.Text();
	resultTitleTxt.font = "45px comfortaabold";
	resultTitleTxt.color = '#000';
	resultTitleTxt.textAlign = "center";
	resultTitleTxt.textBaseline='alphabetic';
	resultTitleTxt.text = textDisplay.resultTitle;
	
	resultTimerTxt = new createjs.Text();
	resultTimerTxt.font = "30px comfortaabold";
	resultTimerTxt.color = '#000';
	resultTimerTxt.textAlign = "center";
	resultTimerTxt.textBaseline='alphabetic';
	resultTimerTxt.text = '';

	resultWordTxt = new createjs.Text();
	resultWordTxt.font = "30px comfortaabold";
	resultWordTxt.color = '#000';
	resultWordTxt.textAlign = "center";
	resultWordTxt.textBaseline='alphabetic';
	resultWordTxt.text = '';
	
	resultDescTxt = new createjs.Text();
	resultDescTxt.font = "35px comfortaabold";
	resultDescTxt.color = '#24BE24';
	resultDescTxt.textAlign = "center";
	resultDescTxt.textBaseline='alphabetic';
	resultDescTxt.text = '';
	
	
	buttonFacebook = new createjs.Bitmap(loader.getResult('buttonFacebook'));
	buttonTwitter = new createjs.Bitmap(loader.getResult('buttonTwitter'));
	buttonWhatsapp = new createjs.Bitmap(loader.getResult('buttonWhatsapp'));
	centerReg(buttonFacebook);
	createHitarea(buttonFacebook);
	centerReg(buttonTwitter);
	createHitarea(buttonTwitter);
	centerReg(buttonWhatsapp);
	createHitarea(buttonWhatsapp);
	
	buttonFullscreen = new createjs.Bitmap(loader.getResult('buttonFullscreen'));
	centerReg(buttonFullscreen);
	buttonSoundOn = new createjs.Bitmap(loader.getResult('buttonSoundOn'));
	centerReg(buttonSoundOn);
	buttonSoundOff = new createjs.Bitmap(loader.getResult('buttonSoundOff'));
	centerReg(buttonSoundOff);
	buttonSoundOn.visible = false;
	
	buttonExit = new createjs.Bitmap(loader.getResult('buttonExit'));
	centerReg(buttonExit);
	buttonSettings = new createjs.Bitmap(loader.getResult('buttonSettings'));
	centerReg(buttonSettings);
	
	createHitarea(buttonFullscreen);
	createHitarea(buttonSoundOn);
	createHitarea(buttonSoundOff);
	createHitarea(buttonExit);
	createHitarea(buttonSettings);
	optionsContainer = new createjs.Container();
	optionsContainer.addChild(buttonFullscreen, buttonSoundOn, buttonSoundOff, buttonExit);
	optionsContainer.visible = false;
	
	//exit
	itemExit = new createjs.Bitmap(loader.getResult('itemPop'));
	itemExitP = new createjs.Bitmap(loader.getResult('itemPopP'));
	
	buttonConfirm = new createjs.Bitmap(loader.getResult('buttonConfirm'));
	centerReg(buttonConfirm);
	
	buttonCancel = new createjs.Bitmap(loader.getResult('buttonCancel'));
	centerReg(buttonCancel);
	
	popTitleTxt = new createjs.Text();
	popTitleTxt.font = "45px comfortaabold";
	popTitleTxt.color = "#000";
	popTitleTxt.textAlign = "center";
	popTitleTxt.textBaseline='alphabetic';
	popTitleTxt.text = textDisplay.exitTitle;
	
	popDescTxt = new createjs.Text();
	popDescTxt.font = "30px comfortaabold";
	popDescTxt.lineHeight = 35;
	popDescTxt.color = "#000";
	popDescTxt.textAlign = "center";
	popDescTxt.textBaseline='alphabetic';
	popDescTxt.text = textDisplay.exitMessage;
	
	confirmContainer.addChild(itemExit, itemExitP, popTitleTxt, popDescTxt, buttonConfirm, buttonCancel);
	confirmContainer.visible = false;
	
	if(guide){
		guideline = new createjs.Shape();	
		guideline.graphics.setStrokeStyle(2).beginStroke('red').drawRect((stageW-contentW)/2, (stageH-contentH)/2, contentW, contentH);
	}
	
	mainContainer.addChild(titleContainer, buttonStart, buttonCategory, loadingTxt, selectContainer);
	gameContainer.addChild(wordContainer, gameStatusTxt, scoreCalculateTxt, lettersLandscapeContainer, lettersPortraitContainer, timerContainer, scoreTxt, wordTxt);
	resultContainer.addChild(itemResult, itemResultP, buttonContinue, resultTitleTxt, resultDescTxt, resultTimerTxt, resultWordTxt);
	
	if(shareEnable){
		resultContainer.addChild(resultShareTxt, buttonFacebook, buttonTwitter, buttonWhatsapp);
	}
	
	canvasContainer.addChild(bg, bgP, mainContainer, tutorialContainer, gameContainer, resultContainer, confirmContainer, optionsContainer, buttonSettings, guideline);
	stage.addChild(canvasContainer);
	
	changeViewport(viewport.isLandscape);
	resizeGameFunc();
}

function changeViewport(isLandscape){
	if(isLandscape){
		//landscape
		stageW=landscapeSize.w;
		stageH=landscapeSize.h;
		contentW = landscapeSize.cW;
		contentH = landscapeSize.cH;
	}else{
		//portrait
		stageW=portraitSize.w;
		stageH=portraitSize.h;
		contentW = portraitSize.cW;
		contentH = portraitSize.cH;
	}
	
	gameCanvas.width = stageW;
	gameCanvas.height = stageH;
	
	canvasW=stageW;
	canvasH=stageH;
	
	changeCanvasViewport();
}

function changeCanvasViewport(){
	if(canvasContainer!=undefined){
		if(viewport.isLandscape){
			bg.visible = true;
			bgP.visible = false;

			titleContainer.x = canvasW/2;
			titleContainer.y = canvasH/100 * 45;
			titleContainer.scaleX = titleContainer.scaleY = 1;
			
			loadingTxt.x = selectContainer.x = canvasW/2;
			loadingTxt.y = selectContainer.y = canvasH/100 * 73;

			buttonStart.x = canvasW/2 - 100;
			buttonStart.y = canvasH/100 * 73;

			buttonCategory.x = canvasW/2 + 100;
			buttonCategory.y = canvasH/100 * 73;

			//tutorial
			tutorialContainer.x = canvasW/2;
			tutorialContainer.y = canvasH/2;

			//game
			
			//result
			itemResult.visible = true;
			itemResultP.visible = false;
			
			buttonFacebook.x = canvasW/100*45;
			buttonFacebook.y = canvasH/100*62;
			buttonTwitter.x = canvasW/2;
			buttonTwitter.y = canvasH/100*62;
			buttonWhatsapp.x = canvasW/100*55;
			buttonWhatsapp.y = canvasH/100*62;

			buttonContinue.x = canvasW/2;
			buttonContinue.y = canvasH/100 * 72;
	
			resultShareTxt.x = canvasW/2;
			resultShareTxt.y = canvasH/100 * 57;
	
			resultTitleTxt.x = canvasW/2;
			resultTitleTxt.y = canvasH/100 * 37;
	
			resultDescTxt.x = canvasW/2;
			resultDescTxt.y = canvasH/100 * 52;

			resultWordTxt.x = canvasW/2;
			resultWordTxt.y = canvasH/100 * 43;
			
			resultTimerTxt.x = canvasW/2;
			resultTimerTxt.y = canvasH/100 * 47;

			//exit
			itemExit.visible = true;
			itemExitP.visible = false;

			buttonConfirm.x = (canvasW/2) - 83;
			buttonConfirm.y = (canvasH/100 * 70);
			
			buttonCancel.x = (canvasW/2) + 83;
			buttonCancel.y = (canvasH/100 * 70);

			popTitleTxt.x = canvasW/2;
			popTitleTxt.y = canvasH/100 * 37;
			
			popDescTxt.x = canvasW/2;
			popDescTxt.y = canvasH/100 * 45;

		}else{
			bg.visible = false;
			bgP.visible = true;

			titleContainer.x = canvasW/2;
			titleContainer.y = canvasH/100 * 40;
			titleContainer.scaleX = titleContainer.scaleY = .7;
			
			loadingTxt.x = selectContainer.x = canvasW/2;
			loadingTxt.y = selectContainer.y = canvasH/100 * 73;

			buttonStart.x = canvasW/2;
			buttonStart.y = canvasH/100 * 73;

			buttonCategory.x = canvasW/2;
			buttonCategory.y = canvasH/100 * 81;

			//tutorial
			tutorialContainer.x = canvasW/2;
			tutorialContainer.y = canvasH/2;

			//game
			
			//result
			itemResult.visible = false;
			itemResultP.visible = true;
			
			buttonFacebook.x = canvasW/100*40;
			buttonFacebook.y = canvasH/100*60;
			buttonTwitter.x = canvasW/2;
			buttonTwitter.y = canvasH/100*60;
			buttonWhatsapp.x = canvasW/100*60;
			buttonWhatsapp.y = canvasH/100*60;

			buttonContinue.x = canvasW/2;
			buttonContinue.y = canvasH/100 * 67;
	
			resultShareTxt.x = canvasW/2;
			resultShareTxt.y = canvasH/100 * 56;
	
			resultTitleTxt.x = canvasW/2;
			resultTitleTxt.y = canvasH/100 * 40;
	
			resultDescTxt.x = canvasW/2;
			resultDescTxt.y = canvasH/100 * 52;

			resultWordTxt.x = canvasW/2;
			resultWordTxt.y = canvasH/100 * 45;
			
			resultTimerTxt.x = canvasW/2;
			resultTimerTxt.y = canvasH/100 * 48;
			
			//exit
			itemExit.visible = false;
			itemExitP.visible = true;

			buttonConfirm.x = (canvasW/2) - 83;
			buttonConfirm.y = (canvasH/100 * 67);
			
			buttonCancel.x = (canvasW/2) + 83;
			buttonCancel.y = (canvasH/100 * 67);

			popTitleTxt.x = canvasW/2;
			popTitleTxt.y = canvasH/100 * 40;
			
			popDescTxt.x = canvasW/2;
			popDescTxt.y = canvasH/100 * 49;
		}
	}
}



/*!
 * 
 * RESIZE GAME CANVAS - This is the function that runs to resize game canvas
 * 
 */
function resizeCanvas(){
 	if(canvasContainer!=undefined){
		
		buttonSettings.x = (canvasW - offset.x) - 50;
		buttonSettings.y = offset.y + 45;
		
		var distanceNum = 65;
		if(curPage != 'game'){
			buttonExit.visible = false;
			buttonSoundOn.x = buttonSoundOff.x = buttonSettings.x;
			buttonSoundOn.y = buttonSoundOff.y = buttonSettings.y+distanceNum;
			buttonSoundOn.x = buttonSoundOff.x;
			buttonSoundOn.y = buttonSoundOff.y = buttonSettings.y+(distanceNum);
			
			buttonFullscreen.x = buttonSettings.x;
			buttonFullscreen.y = buttonSettings.y+(distanceNum*2);
		}else{
			buttonExit.visible = true;
			buttonSoundOn.x = buttonSoundOff.x = buttonSettings.x;
			buttonSoundOn.y = buttonSoundOff.y = buttonSettings.y+distanceNum;
			buttonSoundOn.x = buttonSoundOff.x;
			buttonSoundOn.y = buttonSoundOff.y = buttonSettings.y+(distanceNum);
			
			buttonFullscreen.x = buttonSettings.x;
			buttonFullscreen.y = buttonSettings.y+(distanceNum*2);
			
			buttonExit.x = buttonSettings.x;
			buttonExit.y = buttonSettings.y+(distanceNum*3);
		}

		resizeGameUI();
	}
}

/*!
 * 
 * REMOVE GAME CANVAS - This is the function that runs to remove game canvas
 * 
 */
 function removeGameCanvas(){
	 stage.autoClear = true;
	 stage.removeAllChildren();
	 stage.update();
	 createjs.Ticker.removeEventListener("tick", tick);
	 createjs.Ticker.removeEventListener("tick", stage);
 }

/*!
 * 
 * CANVAS LOOP - This is the function that runs for canvas loop
 * 
 */ 
function tick(event) {
	updateGame();
	stage.update(event);
}

/*!
 * 
 * CANVAS MISC FUNCTIONS
 * 
 */
function centerReg(obj){
	obj.regX=obj.image.naturalWidth/2;
	obj.regY=obj.image.naturalHeight/2;
}

function createHitarea(obj){
	obj.hitArea = new createjs.Shape(new createjs.Graphics().beginFill("#000").drawRect(0, 0, obj.image.naturalWidth, obj.image.naturalHeight));	
}