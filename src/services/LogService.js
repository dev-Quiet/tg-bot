const { getDatabase, ref, set, onValue, remove, update, get, push } = require('firebase/database');
const { initializeApp } = require('firebase/app');
const firebaseConfig = require('../config/firebase');


class LogService {
	constructor() {

		initializeApp(firebaseConfig);
		this._db = getDatabase();

	}
	nextPage = async (id, currentPage) => {
		try {
			await update(ref(this._db, `logs/${id}`), { ...currentPage });
		} catch (error) {
			console.log("Error logService.nextPage()", error.message)
		}
	}
	prevPage = async (id, currentPage) => {
		try {
			await update(ref(this._db, `logs/${id}`), { ...currentPage });
		} catch (error) {
			console.log("Error logService.prevPage()", error.message)
		}
	}
	getLogs = async (ctx) => {
		// try {
		// 	const usersRef = ref(this._db, 'users/');
		// 	onValue(usersRef, (snapshot) => {
		// 		const data = snapshot.val();
		// 		if (!data) {
		// 			// setMessageLoad(<h1>'Нет записей'</h1>);
		// 		}
		// 		bot.context.users = Object.values(data).map((user) => user);

		// 	});
		// } catch (error) {
		// 	console.log("Error logService.getUsers()", error.message)
		// }
		try {
			const logRef = ref(this._db, 'logs/');
			onValue(logRef, (snapshot) => {
				const data = snapshot.val();
				if (!data) {
					return;
					// setMessageLoad(<h1>'Нет записей'</h1>);
				}
				ctx.session.logs = Object.values(data).map((log) => log);

			});
		} catch (error) {
			console.log("Error logService.getLogs()", error.message)
		}
	};
	getLog = async (id) => {
		try {
			const logRef = ref(this._db, `logs/${id}`);
			return await get(logRef, id).val();
		} catch (error) {
			console.log("Error logService.updateLog()", error.message)
		}
	}

	updateLog = async (id, newData) => {
		try {
			const logRef = ref(this._db, `logs/${id}`);
			await update(logRef, newData);
		} catch (error) {
			console.log("Error logService.updateLog()", error.message)
		}
	}

	removeLog = async (id) => {
		try {
			const logRef = ref(this._db, `logs/${id}`);
			await remove(logRef)
		} catch (error) {
			console.log("Error logService.removeLog()", error.message)
		}
	}

	statusToggle = async (id, check) => {
		try {
			const logRef = ref(this._db, `logs/${id}`);
			await update(logRef, { active: check });
		} catch (error) {
			console.log("Error logService.activeToggleLog()", error.message)
		}
	}
}

const logService = new LogService();

module.exports = logService;
