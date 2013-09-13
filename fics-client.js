<script>
var socket = io.connect('http://localhost');
  socket.on('board', function (data) {
  var board = document.getElementById('theboard');
  if(board) {
      board.value = data;
  }
});
</script>
