var port = 5000;
var host = 'freechess.org';
var net  = require('net');
var sys  = require('sys');
var fs   = require('fs');
var credentials_file = 'credentials.json';
var logfile = 'log';
var EOL = '\r\n';


// Pretty State Machine
var PrettyStateMachine = function(state) {
    this.CURRENT = state || 0;
    this.STATES = {
        DISCONNECTED : 0,
        CONNECTED    : 1,
        NEEDS_PWD    : 2,
        LOGGED_IN    : 3
    };
    this.nStates = 4;

    this.next = function() {
        this.CURRENT = (this.CURRENT + 1) % this.nStates;
    };
    this.disconnect = function() {
       this.CURRENT = this.DISCONNECTED; 
    };
    this.is = function(state) {
        return (this.CURRENT === this.STATES[state]);
    };
};
var PSM = new PrettyStateMachine();

var GameState = function () { 
    this.board = [];
    this.boardData = [];
    this.parseFromStyle12 = function(str) {
        str = str.substr(str.indexOf('<12>'));
        var style12  = str.split(' ').slice(1);
        var board = style12.slice(0,8);
        // board = [ 
        //    'PKR-----',
        //    'pppppppp',
        //    ... etc
        // ]
        this.board = board.map(function(row) { return row.split(''); });
        // board = [ [P,K,R,-,...etc],[...etc]]
        this.data = style12.slice(8);
    };
    var getBoardHTML = function(board) {
        var replace_map = {
            '-':emptyPiece // empty
            'r':whiteRook,
            'n':whiteNight,
            'b':whiteBishop,
            'q':whiteQueen,
            'k':whiteKing,
            'p':whitePawn, // white
            'R':blackRook,
            'N':blackNight,
            'B':blackBishop,
            'Q':blackQueen,
            'K':blackKing,
            'P':blackPawn, // white
            'R':'♜','N':'♞','B':'♝','Q':'♛','K':'♚','P':'♟'  // black 
        };
        
    }
    var getBoardUnicode = function(board) {
        var replace_map = {
            '-':'＿', // empty
            'r':'♖','n':'♘','b':'♗','q':'♕','k':'♔','p':'♙', // white
            'R':'♜','N':'♞','B':'♝','Q':'♛','K':'♚','P':'♟'  // black 
        };
        var blacksquare = '▩';				
        var temp = board;
        for(var r=0; r<board.length; r++) {
            for(var c=0; c<8; c++) {
                temp[r][c] = replace_map[board[r][c]]+'\t';
            }
        }
        var display = '+\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t+';
        for(var r = board.length-1; r >= 0; r--) {
            display += '\n|';
            for(var c = 0; c < 8; c++) {
                if(i%2==0) {
                    if(c%2==0) {
                        board[r][c] = board[r][c].replace('＿',blacksquare);
                    }
                } else {
                    if(c%2==1) {
                        board[r][c] = board[r][c].replace('＿',blacksquare);
                    }
                }
                display += row[c];
            }
            display += '|';
        }
        display += '+\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t-\t+';
        return display;
    }
};
var GS = new GameState();

// Read configuration file.
fs.readFile(__dirname+'/'+credentials_file, 'utf8', function (err, data) {
    if (err) {
        console.log('Error: ' + err);
        return;
    }
     
    var credentials = JSON.parse(data);
    var fics = net.createConnection(port,host);
    var input = process.openStdin();
//  var output = process.stdout; // not currently used.
    var io = require('socket.io').listen(80);
    io.sockets.on('connection', function (cSocket) {
        cSocket.emit('', { hello: 'world' });
        cSocket.on('move', function (data) {
            console.log(data);
        });

            fics.addListener('connect', function() {
                PSM.next();
                sys.puts('Connected to FICS');
                input.addListener('data', function(data) {
                    if(!PSM.is('DISCONNECTED')) {
                        fics.write(data + EOL);
                    }
                });
                fics.addListener('data', function(chunk) {
                    var str = chunk.toString('utf8', 0, chunk.length);

                    if(PSM.is('LOGGED_IN')) { // Skip main welcome message.

        //<!----- MAIN PROCESSING OF FICS INPUT HERE ---->
                        //fs.appendFile(logfile, str, function(err) {console.log(err);});
                    
                        // Parse all input.
                        sys.puts(str);
                        if(str.indexOf('<12>') !== -1)  {
                            GS.parseFromStyle12(str);
                            var board = GS.getBoardUnicode();
                            sys.puts(board);
                            cSocket.emit('board', board);
                        }// else if() {}  ... 
                        else {
                            //sys.puts(str);
                        }
                    }
                    if(PSM.is('NEEDS_PWD')) {
                        fics.write(credentials.pwd+EOL);
                        PSM.next();
                    } else if(!PSM.is('LOGGED_IN')) {
                        fics.write(credentials.uname+EOL);
                        PSM.next();
                    }
                })
            });
        });
});
