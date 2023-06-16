const { Scenes } = require('telegraf');
// const config = require('config');
require('dotenv').config();
const logService = require('../services/LogService');
const userService = require('../services/UserService');

const mainScene = new Scenes.BaseScene('MAIN_SCENE');

const accessCodeMiddleware = async (ctx, next) => {
	// const accessCode = config.get('ACCESS_CODE'); // Здесь указывается ваш код доступа
	const accessCode = process.env.ACCESS_CODE; // Здесь указывается ваш код доступа
	// Проверяем, совпадает ли введенный код с кодом доступа
	if (ctx.message.text === accessCode) {
		// Если код доступа совпадает, вызываем следующий обработчик
		await next();
	} else if (ctx.message.text !== '/start') {
		// Если код доступа не совпадает, отправляем сообщение об ошибке
		await ctx.reply('Неверный код доступа.');
	}
};


mainScene.enter(async (ctx) => {
	try {
		clearTimeout(ctx.session?.timeoutId);
		await ctx.reply('Введите код доступа:');
	} catch (error) {
		console.log('Error enter mainScene', error.message)
	}
});

mainScene.hears(/.*/, accessCodeMiddleware, async (ctx) => {
	try {
		await ctx.reply('Доступ разрешен!');
		await logService.getLogs(ctx);
		await userService.getUsers(ctx);
		ctx.session.timeoutId = setTimeout(() => {
			ctx.scene.enter('MAIN_SCENE');
		}, 600000);
		await ctx.scene.enter('LOG_SCENE');

	} catch (error) {
		console.log('Error hears mainScene', error.message)
	}

});

// mainScene.leave(ctx => ctx.reply('Пока'))
// mainScene.leave(async (ctx) => {
// 	try {
// 		await ctx.reply('Доступ разрешен!');
// 		await ctx.scene.enter('LOG_SCENE');
// 	} catch (error) {
// 		console.log('Error hears mainScene', error.message)
// 	}
// })
//========================================================================================================================================================

// mainScene.action('USER', (ctx) => {
// 	ctx.reply('You choose theater');
// 	ctx.session.myData.preferenceType = 'Theater';
// 	return ctx.scene.enter('USER'); // switch to some other scene
// });

// mainScene.action('MOVIE_ACTION', (ctx) => {
// 	ctx.reply('You choose movie, your loss');
// 	ctx.session.myData.preferenceType = 'Movie';
// 	return ctx.scene.leave(); // exit global namespace
// });

// mainScene.leave((ctx) => {
// 	ctx.reply('Thank you for your time!');
// });

// // What to do if user entered a raw message or picked some other option?
// mainScene.use((ctx) => ctx.reply('Please choose either Movie or Theater'));

module.exports = mainScene;