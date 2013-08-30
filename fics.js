var port = 5000;
var host = 'freechess.org';
var net  = require('net');
var sys  = require('sys');
var fs   = require('fs');
var credentials_file = 'credentials.json';
var logfile = 'log';
var EOL = '\r\n';

// Pretty State Machine
var PSM = {
	'isLoggedIn' : false,
	'isInputtingPassword' : false,
	'isConnected' : false
};

fs.readFile(__dirname+'/'+credentials_file, 'utf8', function (err, data) {
    if (err) {
        console.log('Error: ' + err);
        return;
    }
     
    var credentials = JSON.parse(data);
     
    console.log(data);
    var fics = net.createConnection(port,host);

    fics.addListener('connect', function() {
    	var input = process.openStdin(), 
    		output = process.stdout;
    
    	input.addListener('data', function(data) {
    		if(PSM.isLoggedIn) {
    			fics.write(data + EOL);
    		}
    	});
    	PSM.isConnected = true;
    	sys.puts('Connected to FICS');
    	fics.addListener('data',function(chunk) {
    		var str = chunk.toString('utf8',0,chunk.length);
    		if(PSM.isLoggedIn) {
    			//fs.appendFile(logfile, str, function(err) {console.log(err);});
        	//<!----- MAIN PROCESSING OF INPUT HERE ---->
    		
            if(str.indexOf('<12>') !== -1)  {
    	    str = str.substr(str.indexOf('<12>'));
    	sys.puts(str);
                var style12  = str.split(' ').slice(1);
                var board = style12.slice(0,8);
                var data = style12.slice(8);
            
                var displayBoard = function(board) {
                    var replace_map = {
                        '-':'＿', // empty
                        'r':'♖','n':'♘','b':'♗','q':'♕','k':'♔','p':'♙', // white
                        'R':'♜','N':'♞','B':'♝','Q':'♛','K':'♚','P':'♟'  // black 
                    };
		    var blacksquare = '▩';				
    		var temp = board.join(' ');
                    board = temp.replace(/[^ ]/g, function(match) {
                        return replace_map[match];
                    });
    		
                    var temp = board.split(' ');
    		board = temp;
		var display = '+--------------+';
                    for(var i = board.length-1; i >= 0; i--) {
		    	var row = board[i].split('');
			display += '\n|';
			for(var c=0; c<board[i].length; c++) {
				if(i%2==0) {
					if(c%2==0) {
					   row[c] = row[c].replace('＿',blacksquare);
					}
				} else {
					if(c%2==1) {
					   row[c] = row[c].replace('＿',blacksquare);
					}
				}
				display += row[c];
			}
			display += '|';
                    }
                    display += '\n+--------------+';
		    sys.puts(display);
                };
                displayBoard(board);
            } else {
                sys.puts(str);
            }
    
    		}
    		if(PSM.isInputtingPassword) {
    			fics.write(credentials.pwd+EOL);
    			PSM.isLoggedIn = true;
    			PSM.isInputtingPassword = false;
    		} else if(!PSM.isLoggedIn) {
    			fics.write(credentials.uname+EOL);
    			PSM.isInputtingPassword = true;
    		}
    	})
    });
});
