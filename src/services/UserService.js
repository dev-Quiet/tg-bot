const { getDatabase, ref, set, onValue, remove, update, push, get } = require('firebase/database');
const { initializeApp } = require('firebase/app');
const firebaseConfig = require('../config/firebase');


class UserService {
	constructor() {

		initializeApp(firebaseConfig);
		this._db = getDatabase();

	}
	// nextPage = async (id, currentPage) => {
	// 	try {
	// 		await update(ref(this._db, `users/${id}`), { ...currentPage });
	// 	} catch (error) {
	// 		console.log("Error userService.nextPage()", error.message)
	// 	}
	// }
	// prevPage = async (id, currentPage) => {
	// 	try {
	// 		await update(ref(this._db, `users/${id}`), { ...currentPage });
	// 	} catch (error) {
	// 		console.log("Error userService.prevPage()", error.message)
	// 	}
	// }
	getUsers = async (ctx) => {
		try {
			const userRef = ref(this._db, 'users/');
			onValue(userRef, (snapshot) => {
				const data = snapshot.val();
				if (!data) {
					return;
					// setMessageLoad(<h1>'Нет записей'</h1>);
				}
				ctx.session.users = Object.values(data).map((user) => user);

			});
		} catch (error) {
			console.log("Error userService.getUsers()", error.message)
		}
	};

	getUser = async (id) => {
		try {
			const userRef = ref(this._db, `users/${id}`);

			return (await get(userRef)).val();
		} catch (error) {
			console.log("Error userService.getUser()", error.message)
		}
	}

	updateLogUser = async (id, log) => {
		try {
			const userRef = ref(this._db, `users/${id}/logs`);

			return (await set(userRef, log));
		} catch (error) {
			console.log("Error userService.getUser()", error.message)
		}
	}

	createUser = async (id, user) => {
		try {
			const userRef = ref(this._db, `users/${id}`);
			if (!await this.getUser(user.id)) {
				await set(userRef, { ...user })
			}
			// return (await get(userRef)).val();
		} catch (error) {
			console.log("Error userService.createUser()", error.message)
		}
	}

	checkUser = async (id) => {
		try {
			const userRef = ref(this._db, `users/${id}`);
			return (await get(userRef)).val();
		} catch (error) {
			console.log("Error userService.checkUser()", error.message)
		}
	}

	updateUser = async (id, newData) => {
		try {
			const userRef = ref(this._db, `users/${id}`);
			await update(userRef, newData);
		} catch (error) {
			console.log("Error userService.updateUser()", error.message)
		}
	}

	// createUser = async (id, newData) => {
	// 	try {
	// 		const userRef = ref(this._db, `users`);
	// 		await set((userRef, newData));
	// 	} catch (error) {
	// 		console.log("Error userService.createUser()", error.message)
	// 	}
	// }

	removeUser = async (id) => {
		try {
			const userRef = ref(this._db, `users/${id}`);
			await remove(userRef)
		} catch (error) {
			console.log("Error userService.removeUser()", error.message)
		}
	}

	// activeToggleLog = async (id, check) => {
	// 	try {
	// 		const userRef = ref(this._db, `users/${id}`);
	// 		await update(userRef, { active: check });
	// 	} catch (error) {
	// 		console.log("Error userService.activeToggleLog()", error.message)
	// 	}
	// }
}

const userService = new UserService();

module.exports = userService;
