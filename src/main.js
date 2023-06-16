const { Telegraf, Scenes, session, Markup } = require('telegraf');
// const config = require('config');
require('dotenv').config();

// const process = require('nodemon');

// const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));
const bot = new Telegraf(process.env.BOT_TOKEN);

const mainScene = require('./scenes/mainScene');
const logScene = require('./scenes/logScene');
const userService = require('./services/UserService');

const stage = new Scenes.Stage([mainScene, logScene]);
bot.use(session());
bot.use(stage.middleware());




bot.telegram.setMyCommands([
	{ command: 'start', description: 'Начать работу' },
	// { command: 'restore', description: 'Восстановить работу' },
]);

bot.use(async (ctx, next) => {
	// if (ctx.updateType === 'message' && ctx.update.message.text === '/start') {
	// При старте бота перезагружаемся на сцену "userScene"
	// }
	try {
		const { id, first_name, last_name, username } = ctx.chat;
		const user = {
			id,
			firstName: first_name || 'Незнакомец',
			lastName: last_name || 'Не указан',
			username: `@${username}` || 'Неизвестный',
			// logs: [],
			status: 0,
			// finishLogs: [],
		};
		await userService.createUser(id, user);
		// console.log(await userService.getUser(user.id))
		// console.log(user)
		if (ctx.updateType === 'message' || ctx.update.message.text === '/start') {


			await ctx.scene.enter('MAIN_SCENE');
		}


		// next();
		// if (ctx.update.message.text === '/start') {
		// }
	} catch (error) {
		console.log('Error bot.use', error.message)
	}
	// next();
	// console.log(1123)
});

// bot.command('start', async (ctx) => {
// 	try {
// 		await ctx.scene.enter('MAIN_SCENE');
// 	} catch (e) {
// 		console.log('Error command start', e.message);
// 	}
// });

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));