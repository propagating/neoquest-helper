// ==UserScript==
// @name        Neoquest Helper
// @description Autofights and/or moves back and forth
// @include	http://www.neopets.com/games/neoquest/*
// @include	http://www.neopets.com/quickref.phtml*
// @require	http://code.jquery.com/jquery-latest.min.js
// ==/UserScript==

var neoquest = document.body.innerHTML.split('NeoQuest is brought to you by')[1];

// if a game is in progress, run the script
if(neoquest.search('to start a new game in') == -1){ 

	// set values
	var petName = "NAMEHERE"; // set pet name for button placement
	var debug = false;
	if(typeof GM_getValue("battle") === 'undefined'){
		GM_setValue("battle",0);
	}

	// find and record stats
	var levelSplit = neoquest.split('Level: <b>')[1]; // = everything after string
	var level = levelSplit.split('</b>',1)[0]; // = everything before string
	var healthSplit = neoquest.split('Health: <b>')[1];
	var health = healthSplit.split('</b>',1)[0];
	var maxHealth = healthSplit.split('/')[2].replace(' <img src="http:','');
	GM_setValue("level",Number(level));
	GM_setValue("health",health);
	GM_setValue("maxHealth",maxHealth);
	if(debug){GM_log("LEVEL: " + level);}
	if(debug){GM_log("HEALTH: " + GM_getValue("health") + "/" + GM_getValue("maxHealth"));}
	
	// write needed xp to page
	printXP();
	
	// check if features are running and add appropriate links
	switches("fighter","Autobattle"); // the fighter will battle automatically when on
	switches("trainer","Trainer");    // the trainer will alternate going left and right on hunting mode when on
    
    	// check if in or out of battle
	updateBattle();
	
	// run autobattle!
	if(GM_getValue("fighterRunning")){ 
		if(debug){GM_log("RUNNING FIGHTER");}
		runFighter(neoquest); 
	}

	// actions for keybinding "l"
	if(GM_getValue("battle") == 0){
		if (neoquest.search('Go!') != -1) {
			var go = $(".phpGamesNonPortalView a:contains('Go!')").attr("href");
			if(debug){GM_log("GO: " + go);}
		}
		if(neoquest.search('to confirm this choice') != -1){
			var skillConfirm = $(".phpGamesNonPortalView a:contains('Click here')").attr("href");
			if(debug){GM_log("SKILL: " + skillConfirm);}
		}
		if (neoquest.search('Talk') != -1) {
			var talk = $(".phpGamesNonPortalView a:contains('Talk')").attr("href");
			if(debug){GM_log("TALK: " + talk);}
		}
	}
    
	// enables arrow keys... pretty useless, really, since there's no diagonals, but you have the option
	$(document).keydown(function(e) {
		switch(e.which){	
			// left arrow, west
			case 37:	moveDirection(4);
			break;		
			
			// up arrow, north 
			case 38:	moveDirection(2);
			break;

			// right arrow, east
			case 39:	moveDirection(5);
			break;

			// down arrow, south
			case 40:	moveDirection(7);		
			break;
		}
	});	
	
	// keybindings
	$(document).keypress(function(e){
		switch(e.which){	
			// "q", north west
			case 113:	moveDirection(1);
			break;

			// "w", north
			case 119:	moveDirection(2);
			break;		
			
			// "e", north east
			case 101:	moveDirection(3);
			break;

			// "a", west
			case 97:	moveDirection(4);		
			break;

			// "d", east
			case 100:	moveDirection(5);
			break;

			// "z", south west
			case 122:	moveDirection(6);
			break;	

			// "s", south
			case 115:	moveDirection(7);
			break;		

			// "c", south east
			case 99:	moveDirection(8);
			break;

			// "n", do nothing / normal
			case 110:	if(GM_getValue("battle") == 1){location.href = "javascript:setdata('noop', 0);";}else{walkingMode(1);}
			break;

			// "h", heal / hunting
			case 104:	if(GM_getValue("battle") == 1){pickPotion();}else{walkingMode(2);}
			break;

			// "j", sneaking
			case 106:	walkingMode(3);
			break;

			// "l", action
			case 108: if(GM_getValue("battle") == 1){location.href = "javascript:setdata('attack', 0);";}
					else if(go){location.href = go;}
					else if(skillConfirm){location.href = skillConfirm;}
					else if(talk){location.href = talk;}
			break;

			// ";", absorb
			case 59:	if(neoquest.search('Cast') != -1){location.href = "javascript:setdata('special', 4003);";}
			break;
			
			// "k" spirit of growth
			case 107:	if(neoquest.search('Spirit') != -1){
						location.href = "javascript:setdata('special', 200019);";
						if(debug){GM_log("Spirit of Growth");}
					}
			break;

			// "i", items
			case 105: location.href = "http://www.neopets.com/games/neoquest/neoquest.phtml?action=items";
			break;

			// "p", spend skill points
			case 112: location.href = "http://www.neopets.com/games/neoquest/neoquest.phtml?action=skill";
			break;

			// "f", flee
			case 102: location.href = "javascript:setdata('flee',0);";
			break;

			// "m", start fight / end fight / return to map (use in items, skills)
			case 109: if (finishFight()){ location.href = "http://www.neopets.com/games/neoquest/neoquest.phtml"; }  
		}
	});
}

function switches(name, lable){
	var run = name+"Running";
	var id1 = name+"False";
	var id2 = name+"True";
	if(GM_getValue(run)){ // GM functions are used to persist simple values accross page loads
		$(".content b:contains('" + petName + "'):first").after(" | "+lable+": <a href='#' id='"+id1+"'><b>On</b></a>"); // write button to page
		$("#"+id1).click(
			function(){
				GM_setValue("trainerRunning",false); // if fighter is turned off, we want trainer off too
				if(debug){GM_log(name+" turned off");}
				if(name == "fighter"){ 
		                    GM_setValue(run,false); 
		                    location.href = "http://www.neopets.com/games/neoquest/neoquest.phtml"; // refresh the page to move on
		                }
		                else{ walkingMode(3); }
			}
		);
	}
	else{
		$(".content b:contains('" + petName + "'):first").after(" | "+lable+": <a href='#' id='"+id2+"'><b>Off</b></a>"); 
		$("#"+id2).click(
			function(){
				if(debug){GM_log(run+": " + GM_getValue(run));}
                GM_setValue("fighterRunning",true);
				if(debug){GM_log(run+": " + GM_getValue(run));}
				if(name == "fighter"){
					location.href = "http://www.neopets.com/games/neoquest/neoquest.phtml"; // refresh the page to move on
				}
                else{ 
                    GM_setValue(run,true);
                    var runUntil = prompt("Run until what level?",Number(level) + 1); 
					GM_setValue("runUntil",Number(runUntil));
					GM_log("fighterEnds: " + GM_getValue("runUntil"));
                    walkingMode(2); 
                }
			}
		);
	}
    if(GM_getValue("trainerRunning") && (GM_getValue("level") >= GM_getValue("runUntil"))){ 
        GM_log("leveled up. trainer killed!");
        GM_setValue("trainerRunning",false);
        alert("level reached");
    }
}



function updateBattle(){  // seperate for keybinding reasons
	// set battle to 1 when fight begins or when in a fight
	if(neoquest.search('Do nothing') != -1 || neoquest.search('to begin the fight') != -1){
		if(debug){GM_log("IN BATTLE");}
		if(debug){GM_log("BATTLE WAS: " + GM_getValue("battle"));}
		GM_setValue("battle",1);
		if(debug){GM_log("BATTLE IS NOW: " + GM_getValue("battle"));}
	}
    //set battle to 0 when fight is over 
	else if(neoquest.search('for defeating this creature!') != -1 || neoquest.search('You escaped from') != -1){ 
		GM_log("Battle over!");
		if(debug){GM_log("BATTLE WAS: " + GM_getValue("battle"));}
		GM_setValue("battle",0);
		if(debug){GM_log("BATTLE IS NOW: " + GM_getValue("battle"));}
	}		    
}

function finishFight(){  // seperate for keybinding reasons
    if( (neoquest.search('for defeating this creature!') != -1 && neoquest.search('You gain a') == -1) || neoquest.search('You escaped from') != -1){ // skip end of battle page if NOT new level
        GM_log("Exit fight");
        var finishFight = $("input[value='Click here to return to the map']").parent();
        finishFight.submit(); 
        return false;
    }   
    return true;
}

function runFighter(neoquest){
	if(GM_getValue("battle") == 0){     // not in a battle
        if(finishFight()){ GM_log("autoexit battle"); }
		if(GM_getValue("trainerRunning")){   
			if(GM_getValue("goLeft")){ // go left
				GM_setValue("goLeft", false);
				if(debug){GM_log("TRAINER LEFT");}
				setTimeout(function(){location.href = "http://www.neopets.com/games/neoquest/neoquest.phtml?action=move&movedir=4";},Math.floor(Math.random()*1000+1000)); // makes it look less fake?
			}
			else{ // go right
				GM_setValue("goLeft", true);
				if(debug){GM_log("TRAINER RIGHT");}
				setTimeout(function(){location.href = "http://www.neopets.com/games/neoquest/neoquest.phtml?action=move&movedir=5";},Math.floor(Math.random()*1000+1000));
			}
			if(debug){
				GM_log("TRAINER: " + GM_getValue("fighterRunning"));
				GM_log("BATTLE: " + GM_getValue("battle"));
			}
		} // if not in a battle, but trainer is not on, do nothing
	}
	else{ // in a battle
		if(debug){GM_log("BATTLE DECISION TREE");}
        if (neoquest.search('to begin the fight') != -1){
            location.href = "http://www.neopets.com/games/neoquest/neoquest.phtml";
        }
		if ( (neoquest.search('stuns you for') != -1 || neoquest.search('You are stunned') != -1) && neoquest.search('Attack') == -1){
			location.href = "javascript:setdata('noop', 0);";
			if(debug){GM_log("STUNNED: doing nothing");}
		}
		else if(neoquest.search('Absorption') != -1){
			location.href = "javascript:setdata('special', 4003);";
			if(debug){GM_log("CASTING ABSORPTION");}
		}
		else if(Number(GM_getValue("health")) < Number(GM_getValue("maxHealth")-60)){ // 'Spirit of Growth' heals 100, so make it 60 to be safe
			if(neoquest.search('Spirit') != -1){ 
				setTimeout(function(){location.href = "javascript:setdata('special', 200019);";},Math.floor(Math.random()*1000+1000));
				if(debug){GM_log("CASTING Spirit of Growth");}
			}  
			else if(Number(GM_getValue("health")) < Number(GM_getValue("maxHealth")/2)){ // if there's no SoG, wait till half life to use a potion
				pickPotion(); 
				if(debug){GM_log("USING POTION");}
			} 
		}
		GM_log("AUTOTRAINER: ATTACK");
		setTimeout(function(){location.href = "javascript:setdata('attack', 0);";},Math.floor(Math.random()*1000+1000)); 
	}		
}

function moveDirection(dir){
	if(debug){
		var directions = new Array();
		directions[1] = "North West"; 
		directions[2] = "North";
		directions[3] = "North East";
		directions[4] = "West";
		directions[5] = "East";
		directions[6] = "South West";
		directions[7] = "South";
		directions[8] = "South East";
	
		var directionMoved = directions[dir];
		GM_log("MOVED: " + directionMoved);
	}
	location.href = "http://www.neopets.com/games/neoquest/neoquest.phtml?action=move&movedir=" + dir;
}

function walkingMode(mode){
	if(debug){
		var walking = new Array();
		walking[1] = "Normal";
		walking[2] = "Hunting";
		walking[3] = "Sneaking";
		var walkingMode = walking[mode];
		GM_log("MODE: " + walkingMode);
	}
	location.href = "http://www.neopets.com/games/neoquest/neoquest.phtml?movetype=" + mode;
}

function printXP() {
	var xpTable = ['0', '600', '1,400', '2,400', '3,400', '4,500', '5,600','6,800', '8,000', '9,300', '10,600', '12,000', '13,400', '14,900','16,400', '18,000', '19,600', '21,300', '23,100', '25,000', '27,000','29,000', '31,000', '33,000', '35,000', '37,000', '39,000', '41,000','43,000', '45,000', '48,000', '51,000', '54,000', '57,000', '60,000','63,000', '66,000', '69,000', '72,000', '75,000', '79,000','83,000', '87,000', '91,000', '95,000', '99,000', '103,000','107,000', '112,000', '117,000','MAX'];
	var levelSplit = neoquest.split('Level: <b>')[1];
	var level = levelSplit.split('</b>',1)[0];
	var currentXP = $(".phpGamesNonPortalView b:eq(5)").text();
	if(debug){GM_log("EXP: " + currentXP + "/" + xpTable[level]);}
	if(level != 50){
		$(".phpGamesNonPortalView b:eq(4)").append("/" + xpTable[level]);
	}
	
};
function pickPotion(){
	// 0   220000 is Weak Healing Potion
	// 1   220001 is Standard Healing Potion
	// 2   220002 is Strong Healing Potion
	// 3   220003 is Greater Healing Potion
	// 4   220004 is Superior Healing Potion
	// 5   220005 is Spirit Healing Potion    
	var nameList = ['Wea','Sta', 'Str', 'Gre', 'Sup', 'Spi'];
	var name;
    var ind;
    var quantity;
	var largestQ = 0;
    var use;
    debugger;
    $("a[onclick*='item']").each(function(k,v) {
		name = v.innerHTML.match(/Use a (...)/)[1]; // finds the first three characters after "Use a "
        index = nameList.indexOf(name);
        quantity = v.innerHTML.match(/([0-9,\,]+) left/)[1]; // finds the number before " left"
		if(quantity > largestQ){ 
            largestQ = quantity; 
            use = index;
        }
	});    
	location.href = "javascript:setdata('item', 22000"+use+");";   
}
