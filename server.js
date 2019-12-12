const PORT = process.env.PORT || 3000;
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
let usersCount = 0;

http.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Hello world");
});

// Отключаем вывод полного лога - пригодится в production'е
io.set('log level', 1);

//срабатывает при подключении каждого клиента
io.on('connection', (socket) => {
  // Посылаем клиенту сообщение о том, что он успешно подключился и его имя
  socket.json.send({'event': 'connected', data: {'usersCount': ++usersCount}});
  socket.broadcast.json.send({
    'event': 'userJoined', data: {
      usersCount,
      userId: socket.id,
    }
  });

  // Навешиваем обработчик на входящее сообщение
  socket.on('message', (message) => {
    const date = Date.now();

    // Уведомляем клиента, что его сообщение успешно дошло до сервера
    socket.json.send({
      'event': 'sent',
      'data': {...message, date},
    });

    // Отсылаем сообщение остальным участникам чата
    socket.broadcast.json.send({
      'event': 'received',
      'data': {...message, date},
    })
  });

  socket.on('disconnect', () => {
    socket.broadcast.json.send({
      'event': 'userLeft',
      'data': {
        usersCount: --usersCount,
      },
    });
  });
});

