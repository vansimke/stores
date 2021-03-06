import createInMemoryStorage from '../../../src/storage/createInMemoryStorage';
import Promise from 'dojo-shim/Promise';
import WeakMap from 'dojo-shim/WeakMap';

// TODO remove the following code and any dependencies in the tests, when https://github.com/dojo/core/pull/216 is landed
export function delay<T>(milliseconds: number): Identity<T> {
	return function (value: T): Promise<T> {
		return new Promise(function (resolve) {
			setTimeout(function () {
				resolve(typeof value === 'function' ? value() : value);
			}, milliseconds);
		});
	};
}

export interface Identity<T> {
	(value: T): Promise<T>;
}

const instanceStateMap = new WeakMap<{}, any>();

function getRandomInt(max = 100) {
	return Math.floor(Math.random() * max);
}

function delayOperation(operation: Function, operationName: string) {
	return function(this: any, ...args: any[]) {
		const state = instanceStateMap.get(this);
		const milliseconds = state[operationName] || getRandomInt();
		return delay(milliseconds)(operation.bind(this, ...args));
	};
}

const createAsyncStorage = createInMemoryStorage.mixin({
	initialize(instance, asyncOptions = {}) {
		instanceStateMap.set(instance, asyncOptions);
	},
	aspectAdvice: {
		around: {
			createId(createId: Function) {
				return delayOperation(createId, 'createId');
			},
			fetch(fetch: Function) {
				return delayOperation(fetch, 'fetch');
			},
			get(get: Function) {
				return delayOperation(get, 'get');
			},
			// no add since add delegates to put
			put(put: Function) {
				return delayOperation(put, 'put');
			},
			delete(_delete: Function) {
				return delayOperation(_delete, 'delete');
			},
			patch(patch: Function) {
				return delayOperation(patch, 'patch');
			}
		}

	}
});
export default createAsyncStorage;
