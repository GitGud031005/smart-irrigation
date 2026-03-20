// General utility functions (date formatting, data smoothing/median filters for NFR1)

export function toJsonSafe<T>(obj: T): unknown {
	return JSON.parse(JSON.stringify(obj, (_k, v) => {
		if (typeof v === 'bigint') return v.toString();
		if (v instanceof Date) return v.toISOString();
		return v;
	}));
}
