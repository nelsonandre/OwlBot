module.exports = function(controller) {
  
  controller.hears(['bicas'], 'direct_message', function(bot, message) {

        // load user from storage...
        controller.storage.users.get(message.user, function(err, user) {

            // user object can contain arbitary keys. we will store tasks in .tasks
            if (!user || !user.tasks || user.tasks.length == 0) {
                bot.reply(message, 'Não há bicas pendentes. Escreve `bica _pedido` para adicionar um pedido.');
            } else {

                var text = 'Estes são os pedidos pendentes: \n' +
                    generateTaskList(user) +
                    'Responde com `levar _numero_` para levar a bica.';

                bot.reply(message, text);

            }

        });

    });
  
  
    controller.hears(['bica (.*)'],'direct_message,direct_mention,mention', function(bot, message) {

        var newtask = message.match[1];
        controller.storage.users.get(message.user, function(err, user) {

            if (!user) {
                user = {};
                user.id = message.user;
                user.tasks = [];
            }

            user.tasks.push(newtask);

            controller.storage.users.save(user, function(err,saved) {

                if (err) {
                    bot.reply(message, 'I experienced an error adding your task: ' + err);
                } else {
                    bot.api.reactions.add({
                        name: 'thumbsup',
                        channel: message.channel,
                        timestamp: message.ts
                    });
                }

            });
        });

    });
  
  controller.hears(['levar (.*)'],'direct_message', function(bot, message) {

        var number = message.match[1];

        if (isNaN(number)) {
            bot.reply(message, 'Por favor indica o número de um pedido.');
        } else {

            // adjust for 0-based array index
            number = parseInt(number) - 1;

            controller.storage.users.get(message.user, function(err, user) {

                if (!user) {
                    user = {};
                    user.id = message.user;
                    user.tasks = [];
                }

                if (number < 0 || number >= user.tasks.length) {
                    bot.reply(message, 'Não existe esse pedido. Tenho ' + user.tasks.length + ' pedidos na lista.');
                } else {

                    var item = user.tasks.splice(number,1);

                    // reply with a strikethrough message...
                    bot.reply(message, '~' + item + '~');

                    if (user.tasks.length > 0) {
                        bot.reply(message, 'Pedidos pendentes:\n' + generateTaskList(user));
                    } else {
                        bot.reply(message, 'Não há pedidos pendentes!');
                    }
                }
            });
        }

    });

  
  // simple function to generate the text of the task list so that
    // it can be used in various places
    function generateTaskList(user) {

        var text = '';

        for (var t = 0; t < user.tasks.length; t++) {
            text = text + '> `' +  (t + 1) + '`) ' +  user.tasks[t] + '\n';
        }

        return text;

    }
  
}